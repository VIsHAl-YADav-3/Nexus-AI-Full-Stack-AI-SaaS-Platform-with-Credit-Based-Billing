import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  LayoutTemplate,
  Zap,
  ArrowUpRight,
  Flame,
  BarChart3,
  Sparkles,
} from 'lucide-react';
import AppShell from '../components/AppShell';
import SkeletonLoader from '../components/SkeletonLoader';
import { useAuth } from '../context/AuthContext';
import { getAnalyticsRequest } from '../services/api';
import { formatNumber } from '../utils/formatters';

const StatCard = ({ icon: Icon, label, value, accent }) => (
  <div className="glass-card p-5 relative overflow-hidden group">
    <div
      className={`absolute -top-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-30 ${accent}`}
    />
    <div className="flex items-center justify-between mb-3">
      <div className="w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center">
        <Icon className="w-5 h-5 text-zinc-300" />
      </div>
    </div>
    <p className="text-2xl font-semibold text-white tracking-tight">{value}</p>
    <p className="text-sm text-zinc-500 mt-0.5">{label}</p>
  </div>
);

const ActionCard = ({ icon: Icon, title, description, cta, onClick, gradient }) => (
  <button
    onClick={onClick}
    className="glass-card p-6 text-left group hover:border-white/[0.14] transition-all duration-200 hover:-translate-y-0.5"
  >
    <div
      className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${gradient} shadow-glow`}
    >
      <Icon className="w-5 h-5 text-white" />
    </div>
    <h3 className="font-medium text-white mb-1">{title}</h3>
    <p className="text-sm text-zinc-500 mb-4 leading-relaxed">{description}</p>
    <span className="inline-flex items-center gap-1 text-sm text-accent-violet group-hover:gap-2 transition-all duration-200">
      {cta} <ArrowUpRight className="w-3.5 h-3.5" />
    </span>
  </button>
);

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await getAnalyticsRequest();
        setStats(data);
      } catch {
        // Non-fatal: dashboard still renders without analytics.
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight flex items-center gap-2">
            Welcome back, {firstName} <Sparkles className="w-6 h-6 text-accent-violet" />
          </h1>
          <p className="text-zinc-500 mt-1">Here&apos;s what&apos;s happening in your workspace.</p>
        </div>

        {loading ? (
          <SkeletonLoader variant="card" count={3} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <StatCard
              icon={Zap}
              label="Remaining Credits"
              value={formatNumber(user?.credits)}
              accent="bg-accent-emerald"
            />
            <StatCard
              icon={MessageSquare}
              label="AI Chats Created"
              value={formatNumber(stats?.totalChats)}
              accent="bg-accent-indigo"
            />
            <StatCard
              icon={Flame}
              label="Active Plan"
              value={user?.plan || 'Free'}
              accent="bg-accent-violet"
            />
          </div>
        )}

        <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wide mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <ActionCard
            icon={MessageSquare}
            title="Start New Chat"
            description="Jump into a conversation with any AI persona tailored to your task."
            cta="Open chat"
            gradient="bg-glow-gradient"
            onClick={() => navigate('/chat')}
          />
          <ActionCard
            icon={LayoutTemplate}
            title="Explore Templates"
            description="Browse ready-made prompts for writing, code, marketing, and more."
            cta="Browse templates"
            gradient="bg-gradient-to-br from-accent-emerald to-emerald-700"
            onClick={() => navigate('/templates')}
          />
          <ActionCard
            icon={BarChart3}
            title="Upgrade Plan"
            description="Get more credits and unlock the Pro plan for heavier usage."
            cta="View pricing"
            gradient="bg-gradient-to-br from-amber-500 to-orange-600"
            onClick={() => navigate('/pricing')}
          />
        </div>
      </div>
    </AppShell>
  );
};

export default Dashboard;
