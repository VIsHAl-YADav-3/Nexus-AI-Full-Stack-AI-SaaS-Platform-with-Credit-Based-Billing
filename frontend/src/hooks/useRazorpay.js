import { useCallback, useState } from 'react';
import toast from 'react-hot-toast';
import { createOrderRequest, verifyPaymentRequest } from '../services/api';

const RAZORPAY_SCRIPT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (document.querySelector(`script[src="${RAZORPAY_SCRIPT_SRC}"]`)) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = RAZORPAY_SCRIPT_SRC;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

/**
 * Handles the full Razorpay checkout lifecycle: create order -> open popup ->
 * verify signature -> update local credit/plan state via the provided callback.
 *
 * SECURITY: the client only ever sends a `plan` identifier — never an amount
 * or credit count. The backend resolves the real price from its own plan
 * config (backend/config/plans.js), so a tampered request can't change what
 * the user is charged or credited.
 */
export const useRazorpay = ({ user, onSuccess }) => {
  // Granular status for UI feedback, per the loading/error state requirements:
  // 'idle' | 'creating_order' | 'awaiting_payment' | 'verifying' | 'success' | 'failed'
  const [status, setStatus] = useState('idle');
  const isProcessing = status === 'creating_order' || status === 'awaiting_payment' || status === 'verifying';

  const startCheckout = useCallback(
    async ({ plan }) => {
      if (!plan) {
        toast.error('Please select a plan');
        return;
      }

      setStatus('creating_order');
      try {
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
          toast.error('Unable to load payment gateway. Check your connection.');
          setStatus('failed');
          return;
        }

        // Only the plan ID is sent — amount/credits are resolved server-side.
        const { data: orderData } = await createOrderRequest({ plan });

        setStatus('awaiting_payment');

        const options = {
          key: orderData.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID,
          amount: orderData.order.amount,
          currency: orderData.order.currency,
          name: 'Nexus AI',
          description: `${plan} Plan Purchase`,
          order_id: orderData.order.id,
          prefill: {
            name: user?.name,
            email: user?.email,
          },
          theme: { color: '#7c3aed' },
          handler: async (response) => {
            setStatus('verifying');
            try {
              const { data: verifyData } = await verifyPaymentRequest(response);
              setStatus('success');
              toast.success(
                verifyData.alreadyProcessed
                  ? 'Payment already verified — credits are up to date.'
                  : 'Payment successful — credits added!'
              );
              onSuccess?.(verifyData);
            } catch (err) {
              setStatus('failed');
              toast.error(err.response?.data?.message || 'Payment verification failed');
            }
          },
          modal: {
            ondismiss: () => {
              setStatus('idle');
              toast('Checkout closed', { icon: '👋' });
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', () => {
          setStatus('failed');
          toast.error('Payment failed. Please try again.');
        });
        rzp.open();
      } catch (error) {
        setStatus('failed');
        toast.error(error.response?.data?.message || 'Could not start checkout');
      }
    },
    [user, onSuccess]
  );

  return { startCheckout, isProcessing, status };
};
