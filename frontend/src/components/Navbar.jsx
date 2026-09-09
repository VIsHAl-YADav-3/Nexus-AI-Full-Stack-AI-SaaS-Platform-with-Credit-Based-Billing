import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Zap, ChevronDown, LogOut, User, CreditCard, Sparkles } from 'lucide-react';
import BackButton from './BackButton';
import MobileNavigation from './MobileNavigation';
import { useAuth } from '../context/AuthContext';

const ROUTE_TITLES = {
  '/dashboard': 'Dashboard',
  '/chat': 'AI Chat',
  '/templates': 'Templates',
  '/profile': 'Usage & Analytics',
  '/pricing': 'Pricing',
  '/payments/history': 'Payment History',
};

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const isSubPage = location.pathname !== '/dashboard';
  const title = ROUTE_TITLES[location.pathname] || '';

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'NX';

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-base-950/80 border-b border-white/[0.06]">
      <div className="px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <MobileNavigation />
          {isSubPage && <BackButton />}
          <Link
            to="/dashboard"
            className="flex items-center gap-2 flex-shrink-0"
            aria-label="Nexus AI home"
          >
            <div className="w-8 h-8 rounded-lg bg-glow-gradient flex items-center justify-center shadow-glow">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="hidden sm:inline font-semibold tracking-tight text-white">
              Nexus AI
            </span>
          </Link>
          {title && (
            <>
              <span className="hidden md:inline text-zinc-600">/</span>
              <span className="hidden md:inline text-sm text-zinc-400 truncate">{title}</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            aria-label="Home"
            className="hidden sm:inline-flex items-center justify-center w-9 h-9 rounded-lg bg-white/[0.03] border border-white/[0.08] text-zinc-300 hover:bg-white/[0.08] hover:text-white transition-colors duration-150"
          >
            <Home className="w-4 h-4" />
          </button>

          <button
            onClick={() => navigate('/pricing')}
            className="flex items-center gap-1.5 bg-white/[0.04] border border-white/[0.08] rounded-full pl-3 pr-1.5 py-1.5 hover:bg-white/[0.08] transition-colors duration-150"
          >
            <Zap className="w-3.5 h-3.5 text-accent-emerald" />
            <span className="text-sm font-medium text-zinc-100">{user?.credits ?? 0}</span>
            <span className="hidden sm:inline text-xs bg-accent-emerald/15 text-accent-emerald rounded-full px-2 py-0.5 ml-1">
              + Add
            </span>
          </button>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-full hover:bg-white/[0.06] transition-colors duration-150"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-indigo to-accent-violet flex items-center justify-center text-xs font-semibold text-white">
                {initials}
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-150 ${
                  menuOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-56 glass-card p-1.5 animate-fadeUp">
                <div className="px-3 py-2 border-b border-white/[0.06] mb-1">
                  <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                  <p className="text-xs text-zinc-500 truncate">{user?.email}</p>
                </div>
                <Link
                  to="/profile"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-zinc-300 hover:bg-white/[0.06] hover:text-white transition-colors duration-150"
                >
                  <User className="w-4 h-4" /> Profile & Analytics
                </Link>
                <Link
                  to="/payments/history"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-zinc-300 hover:bg-white/[0.06] hover:text-white transition-colors duration-150"
                >
                  <CreditCard className="w-4 h-4" /> Payment History
                </Link>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    logout();
                    navigate('/login');
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors duration-150"
                >
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
