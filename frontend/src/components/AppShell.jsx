import Navbar from './Navbar';
import Sidebar from './Sidebar';

const AppShell = ({ children }) => {
  return (
    <div className="min-h-screen bg-base-950">
      <div className="pointer-events-none fixed inset-0 bg-glow-radial" />
      <Navbar />
      <div className="flex relative">
        <Sidebar />
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
};

export default AppShell;
