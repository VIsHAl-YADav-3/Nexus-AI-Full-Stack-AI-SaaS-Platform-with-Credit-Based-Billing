import {
  LayoutDashboard,
  MessageSquare,
  LayoutTemplate,
  BarChart3,
  CreditCard,
  Zap,
} from 'lucide-react';

// Single source of truth for primary navigation links, shared by the
// desktop Sidebar and the mobile hamburger menu so they never drift apart.
// (Profile lives at the same route as Analytics in this app, so it's a
// single combined entry rather than two separate links.)
export const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/chat', label: 'AI Chat', icon: MessageSquare },
  { to: '/templates', label: 'Templates', icon: LayoutTemplate },
  { to: '/profile', label: 'Profile & Analytics', icon: BarChart3 },
  { to: '/pricing', label: 'Pricing', icon: Zap },
  { to: '/payments/history', label: 'Payments', icon: CreditCard },
];
