const SkeletonLoader = ({ variant = 'card', count = 1 }) => {
  const items = Array.from({ length: count });

  if (variant === 'card') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((_, i) => (
          <div key={i} className="glass-card p-5 space-y-3">
            <div className="skeleton w-10 h-10 rounded-xl" />
            <div className="skeleton h-4 w-3/4" />
            <div className="skeleton h-3 w-full" />
            <div className="skeleton h-3 w-5/6" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'row') {
    return (
      <div className="space-y-3">
        {items.map((_, i) => (
          <div key={i} className="glass-card p-4 flex items-center gap-4">
            <div className="skeleton w-9 h-9 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-3 w-1/3" />
              <div className="skeleton h-3 w-1/2" />
            </div>
            <div className="skeleton h-6 w-16 rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'chat') {
    return (
      <div className="space-y-4">
        <div className="skeleton h-16 w-2/3 rounded-2xl ml-auto" />
        <div className="skeleton h-24 w-3/4 rounded-2xl" />
      </div>
    );
  }

  if (variant === 'chart') {
    return <div className="skeleton h-64 w-full rounded-2xl" />;
  }

  return <div className="skeleton h-4 w-full" />;
};

export default SkeletonLoader;
