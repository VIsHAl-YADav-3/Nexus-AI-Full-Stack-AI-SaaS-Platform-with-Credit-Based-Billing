import { Link } from 'react-router-dom';
import { Home, Sparkles } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-base-950 flex items-center justify-center px-4 relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-glow-radial" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-accent-violet/10 rounded-full blur-[140px]" />

      <div className="relative text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-glow-gradient shadow-glow mb-6">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-7xl sm:text-8xl font-semibold tracking-tight bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent">
          404
        </h1>
        <p className="text-lg text-zinc-300 mt-3">This page drifted out of context</p>
        <p className="text-sm text-zinc-500 mt-1 max-w-sm mx-auto">
          The page you&apos;re looking for doesn&apos;t exist or may have been moved.
        </p>
        <Link to="/dashboard" className="glow-btn inline-flex items-center gap-2 mt-8">
          <Home className="w-4 h-4" /> Return Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
