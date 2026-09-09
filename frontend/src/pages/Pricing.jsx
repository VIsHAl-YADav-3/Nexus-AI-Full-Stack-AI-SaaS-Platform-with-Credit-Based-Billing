import { useState } from 'react';
import { Check, Zap, Loader2, AlertCircle } from 'lucide-react';
import AppShell from '../components/AppShell';
import { useAuth } from '../context/AuthContext';
import { useRazorpay } from '../hooks/useRazorpay';

// `id` here matches the backend's plan identifiers in backend/config/plans.js
// exactly — the frontend only ever sends this id, never a price.
const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: '₹0',
    period: 'forever',
    credits: '50 credits / month',
    features: ['Access to all personas', 'Standard response speed', 'Community support', '1 concurrent chat'],
    cta: 'Current Plan',
  },
  {
    id: 'basic',
    name: 'Basic',
    price: '₹199',
    period: 'one-time top-up',
    credits: '100 credits',
    features: ['Everything in Free', 'Faster response speed', 'Full template library'],
    cta: 'Get Basic',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '₹999',
    period: 'one-time top-up',
    credits: '1,000 credits',
    features: [
      'Everything in Basic',
      'Priority response speed',
      'Advanced analytics dashboard',
      'Priority email support',
    ],
    cta: 'Upgrade to Pro',
    highlighted: true,
  },
];

const STATUS_LABEL = {
  creating_order: 'Creating order…',
  awaiting_payment: 'Waiting for payment…',
  verifying: 'Verifying payment…',
};

const Pricing = () => {
  const { user, updateCredits, updateUser } = useAuth();
  const [confirmation, setConfirmation] = useState(null);
  const [activePlanId, setActivePlanId] = useState(null);
  const [error, setError] = useState(null);

  const { startCheckout, isProcessing, status } = useRazorpay({
    user,
    onSuccess: (data) => {
      updateCredits(data.credits);
      updateUser({ plan: data.plan });
      setConfirmation({ credits: data.credits, plan: data.plan });
      setError(null);
      setActivePlanId(null);
    },
  });

  const handleSelectPlan = async (planId) => {
    setError(null);
    setActivePlanId(planId);
    try {
      await startCheckout({ plan: planId });
    } catch {
      setError('Something went wrong starting checkout. Please try again.');
    }
  };

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
            Simple, transparent pricing
          </h1>
          <p className="text-zinc-500 mt-2">Top up credits whenever you need more AI power.</p>
        </div>

        {confirmation && (
          <div className="glass-card p-4 mb-8 border-accent-emerald/30 bg-accent-emerald/5 flex items-center gap-3 animate-fadeUp">
            <div className="w-9 h-9 rounded-lg bg-accent-emerald/15 flex items-center justify-center flex-shrink-0">
              <Check className="w-4 h-4 text-accent-emerald" />
            </div>
            <p className="text-sm text-zinc-200">
              Payment successful — you now have <strong>{confirmation.credits} credits</strong> on the{' '}
              <strong>{confirmation.plan}</strong> plan.
            </p>
          </div>
        )}

        {error && (
          <div className="glass-card p-4 mb-8 border-red-500/30 bg-red-500/5 flex items-center gap-3 animate-fadeUp">
            <div className="w-9 h-9 rounded-lg bg-red-500/15 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-4 h-4 text-red-400" />
            </div>
            <p className="text-sm text-zinc-200">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {PLANS.map((plan) => {
            const isCurrent = user?.plan?.toLowerCase() === plan.id;
            const isFree = plan.id === 'free';
            const isThisPlanProcessing = isProcessing && activePlanId === plan.id;

            return (
              <div
                key={plan.id}
                className={`glass-card p-6 sm:p-8 relative ${
                  plan.highlighted ? 'border-accent-violet/40 shadow-glow' : ''
                }`}
              >
                {plan.highlighted && (
                  <span className="absolute -top-3 left-6 text-[11px] font-medium bg-glow-gradient text-white rounded-full px-3 py-1">
                    Most Popular
                  </span>
                )}
                <h3 className="text-lg font-medium text-white">{plan.name}</h3>
                <div className="flex items-baseline gap-1.5 mt-3">
                  <span className="text-3xl font-semibold text-white">{plan.price}</span>
                  <span className="text-sm text-zinc-500">/ {plan.period}</span>
                </div>
                <div className="flex items-center gap-1.5 mt-2 text-sm text-accent-emerald">
                  <Zap className="w-3.5 h-3.5" /> {plan.credits}
                </div>

                <ul className="mt-6 space-y-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-zinc-400">
                      <Check className="w-4 h-4 text-accent-violet flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  disabled={isCurrent || isFree || isProcessing}
                  onClick={() => handleSelectPlan(plan.id)}
                  className={`w-full mt-7 flex items-center justify-center gap-2 ${
                    plan.highlighted ? 'glow-btn' : 'ghost-btn'
                  }`}
                >
                  {isThisPlanProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isCurrent
                    ? 'Current Plan'
                    : isThisPlanProcessing
                    ? STATUS_LABEL[status] || 'Processing…'
                    : plan.cta}
                </button>
              </div>
            );
          })}
        </div>

        <p className="text-center text-xs text-zinc-600 mt-8">
          Payments are securely processed by Razorpay. Credits are added to your account instantly after verification.
        </p>
      </div>
    </AppShell>
  );
};

export default Pricing;
