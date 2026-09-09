import { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Zap, MessageSquare, Activity, History, AlertCircle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import AppShell from '../components/AppShell';
import SkeletonLoader from '../components/SkeletonLoader';
import { useAuth } from '../context/AuthContext';
import { getAnalyticsRequest } from '../services/api';
import { formatDateTime, formatNumber } from '../utils/formatters';

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card px-3 py-2 text-xs">
      <p className="text-zinc-400 mb-1">{label}</p>
      <p className="text-zinc-100 font-medium">{payload[0].value} tokens</p>
    </div>
  );
};

const ProfileAnalytics = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await getAnalyticsRequest();
      setAnalytics(data);
    } catch (err) {
      const message = err.response?.data?.message || 'Could not load analytics';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
            Profile & Usage Analytics
          </h1>
          <p className="text-zinc-500 mt-1">Track your token usage and recent activity.</p>
        </div>

        {/* Profile summary */}
        <div className="glass-card p-6 mb-6 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-accent-indigo to-accent-violet flex items-center justify-center text-lg font-semibold text-white flex-shrink-0">
            {user?.name
              ?.split(' ')
              .map((n) => n[0])
              .slice(0, 2)
              .join('')
              .toUpperCase()}
          </div>
          <div className="min-w-0">
            <h2 className="text-white font-medium truncate">{user?.name}</h2>
            <p className="text-sm text-zinc-500 truncate">{user?.email}</p>
          </div>
          <span className="ml-auto text-xs font-medium bg-accent-violet/10 text-accent-violet rounded-full px-3 py-1.5 flex-shrink-0">
            {user?.plan} Plan
          </span>
        </div>

        {loading ? (
          <>
            <SkeletonLoader variant="card" count={3} />
            <div className="h-4" />
            <SkeletonLoader variant="chart" />
          </>
        ) : error ? (
          <div className="glass-card py-16 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6 text-red-400" />
            </div>
            <h3 className="text-zinc-200 font-medium mb-1">Couldn&apos;t load analytics</h3>
            <p className="text-sm text-zinc-500 mb-4">{error}</p>
            <button onClick={fetchAnalytics} className="ghost-btn flex items-center gap-2 text-sm">
              <RefreshCw className="w-3.5 h-3.5" /> Try again
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="glass-card p-5">
                <div className="w-10 h-10 rounded-xl bg-accent-emerald/10 flex items-center justify-center mb-3">
                  <Zap className="w-5 h-5 text-accent-emerald" />
                </div>
                <p className="text-2xl font-semibold text-white">{formatNumber(analytics?.remainingCredits)}</p>
                <p className="text-sm text-zinc-500 mt-0.5">Remaining Credits</p>
              </div>
              <div className="glass-card p-5">
                <div className="w-10 h-10 rounded-xl bg-accent-indigo/10 flex items-center justify-center mb-3">
                  <MessageSquare className="w-5 h-5 text-accent-indigo" />
                </div>
                <p className="text-2xl font-semibold text-white">{formatNumber(analytics?.totalChats)}</p>
                <p className="text-sm text-zinc-500 mt-0.5">Total Chats</p>
              </div>
              <div className="glass-card p-5">
                <div className="w-10 h-10 rounded-xl bg-accent-violet/10 flex items-center justify-center mb-3">
                  <Activity className="w-5 h-5 text-accent-violet" />
                </div>
                <p className="text-2xl font-semibold text-white">
                  {formatNumber(
                    analytics?.dailyUsage?.reduce((sum, d) => sum + d.tokensUsed, 0)
                  )}
                </p>
                <p className="text-sm text-zinc-500 mt-0.5">Tokens (14 days)</p>
              </div>
            </div>

            <div className="glass-card p-5 mb-6">
              <h3 className="text-sm font-medium text-zinc-300 mb-4">Token usage — last 14 days</h3>
              {analytics?.dailyUsage?.length ? (
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={analytics.dailyUsage}>
                    <defs>
                      <linearGradient id="usageGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#7c3aed" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                    <XAxis dataKey="date" stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="tokensUsed"
                      stroke="#7c3aed"
                      strokeWidth={2}
                      fill="url(#usageGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-60 flex flex-col items-center justify-center text-center">
                  <Activity className="w-8 h-8 text-zinc-600 mb-2" />
                  <p className="text-sm text-zinc-500">No usage yet — start a chat to see your activity here.</p>
                </div>
              )}
            </div>

            <div className="glass-card p-5">
              <h3 className="text-sm font-medium text-zinc-300 mb-4 flex items-center gap-2">
                <History className="w-4 h-4" /> Recent Activity
              </h3>
              {analytics?.recentLogs?.length ? (
                <div className="space-y-1">
                  {analytics.recentLogs.map((log) => (
                    <div
                      key={log._id}
                      className="flex items-center justify-between py-2.5 border-b border-white/[0.04] last:border-0"
                    >
                      <div>
                        <p className="text-sm text-zinc-200">{log.toolUsed}</p>
                        <p className="text-xs text-zinc-500">{formatDateTime(log.date)}</p>
                      </div>
                      <span className="text-xs text-zinc-400 bg-white/[0.04] rounded-full px-2.5 py-1">
                        {log.tokensUsed} tokens
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-zinc-500 text-center py-8">No activity logged yet.</p>
              )}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
};

export default ProfileAnalytics;
