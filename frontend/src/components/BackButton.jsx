import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

const BackButton = ({ fallback = '/dashboard' }) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate(fallback);
    }
  };

  return (
    <button
      onClick={handleBack}
      aria-label="Go back"
      className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-white/[0.03] border border-white/[0.08] text-zinc-300 hover:bg-white/[0.08] hover:text-white transition-colors duration-150"
    >
      <ChevronLeft className="w-4 h-4" />
    </button>
  );
};

export default BackButton;
