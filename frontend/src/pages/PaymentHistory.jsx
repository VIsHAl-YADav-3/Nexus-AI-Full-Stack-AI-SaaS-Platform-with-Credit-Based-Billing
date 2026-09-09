import { useEffect, useState } from 'react';
import { CreditCard, CheckCircle2, XCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import AppShell from '../components/AppShell';
import SkeletonLoader from '../components/SkeletonLoader';
import { getPaymentHistoryRequest } from '../services/api';
import { formatDate, formatCurrency, statusColor } from '../utils/formatters';

const STATUS_ICON = {
  captured: CheckCircle2,
  failed: XCircle,
  created: Clock,
};

const STATUS_LABEL = {
  captured: 'Success',
  failed: 'Failed',
  created: 'Pending',
};

const PaymentHistory = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data } = await getPaymentHistoryRequest();
        setPayments(data.payments);
      } catch {
        toast.error('Could not load payment history');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">Payment History</h1>
          <p className="text-zinc-500 mt-1">A record of every transaction on your account.</p>
        </div>

        {loading ? (
          <SkeletonLoader variant="row" count={4} />
        ) : payments.length === 0 ? (
          <div className="glass-card py-20 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-xl bg-white/[0.05] flex items-center justify-center mb-4">
              <CreditCard className="w-6 h-6 text-zinc-500" />
            </div>
            <h3 className="text-zinc-200 font-medium mb-1">No transactions yet</h3>
            <p className="text-sm text-zinc-500">Your payment history will appear here once you upgrade.</p>
          </div>
        ) : (
          <div className="glass-card divide-y divide-white/[0.05]">
            {payments.map((payment) => {
              const StatusIcon = STATUS_ICON[payment.status] || Clock;
              return (
                <div key={payment._id} className="flex items-center gap-4 p-4 sm:p-5">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center flex-shrink-0">
                    <CreditCard className="w-4.5 h-4.5 text-zinc-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-zinc-100">
                      {payment.planPurchased} Plan — {payment.creditsPurchased} credits
                    </p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {formatDate(payment.createdAt)} · {payment.razorpayOrderId}
                    </p>
                  </div>
                  <p className="text-sm font-medium text-zinc-200 flex-shrink-0">
                    {formatCurrency(payment.amount, payment.currency)}
                  </p>
                  <span
                    className={`flex items-center gap-1.5 text-xs font-medium rounded-full px-2.5 py-1 border flex-shrink-0 ${statusColor(
                      payment.status
                    )}`}
                  >
                    <StatusIcon className="w-3 h-3" />
                    {STATUS_LABEL[payment.status] || payment.status}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
};

export default PaymentHistory;
