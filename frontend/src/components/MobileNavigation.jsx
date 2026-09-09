import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Menu, X, Sparkles } from 'lucide-react';
import { NAV_ITEMS } from '../utils/navItems';

/**
 * Mobile-only hamburger menu. Renders a trigger button plus a slide-over
 * panel with the same links as the desktop Sidebar (see utils/navItems.js),
 * so navigation never disappears on small screens. Hidden at the `lg`
 * breakpoint and above, where the persistent Sidebar takes over.
 */
const MobileNavigation = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  // Close the menu automatically whenever the route changes (e.g. after
  // tapping a link), so it never lingers open after navigating.
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  // Prevent background scroll while the panel is open.
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Open navigation menu"
        className="lg:hidden inline-flex items-center justify-center w-9 h-9 rounded-lg bg-white/[0.03] border border-white/[0.08] text-zinc-300 hover:bg-white/[0.08] hover:text-white transition-colors duration-150"
      >
        <Menu className="w-4 h-4" />
      </button>

      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative w-72 max-w-[80vw] h-full bg-base-900 border-r border-white/[0.08] flex flex-col animate-fadeUp">
            <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-glow-gradient flex items-center justify-center shadow-glow">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="font-semibold text-white text-sm">Nexus AI</span>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close navigation menu"
                className="text-zinc-500 hover:text-zinc-200 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors duration-150 relative ${
                      isActive
                        ? 'text-white bg-white/[0.08]'
                        : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.04]'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-glow-gradient" />
                      )}
                      <Icon className="w-4 h-4" />
                      {label}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      )}
    </>
  );
};

export default MobileNavigation;
