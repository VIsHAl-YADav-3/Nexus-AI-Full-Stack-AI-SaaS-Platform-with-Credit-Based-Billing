import { NavLink } from 'react-router-dom';
import { NAV_ITEMS } from '../utils/navItems';

const Sidebar = () => {
  return (
    <aside className="hidden lg:flex flex-col w-60 flex-shrink-0 border-r border-white/[0.06] p-4 gap-1 sticky top-16 h-[calc(100vh-64px)]">
      {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150 relative ${
              isActive
                ? 'text-white bg-white/[0.06]'
                : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.03]'
            }`
          }
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-glow-gradient" />
              )}
              <Icon className="w-4 h-4" />
              {label}
            </>
          )}
        </NavLink>
      ))}
    </aside>
  );
};

export default Sidebar;
