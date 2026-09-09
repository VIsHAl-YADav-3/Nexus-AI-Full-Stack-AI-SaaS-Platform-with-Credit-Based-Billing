import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowRight, LayoutTemplate } from 'lucide-react';
import toast from 'react-hot-toast';
import AppShell from '../components/AppShell';
import SkeletonLoader from '../components/SkeletonLoader';
import { useChatContext } from '../context/ChatContext';
import { getTemplatesRequest } from '../services/api';

const Templates = () => {
  const navigate = useNavigate();
  const { queuePrompt } = useChatContext();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const { data } = await getTemplatesRequest();
        setTemplates(data.templates);
      } catch {
        toast.error('Could not load templates');
      } finally {
        setLoading(false);
      }
    };
    fetchTemplates();
  }, []);

  const categories = useMemo(() => {
    const unique = new Set(templates.map((t) => t.category));
    return ['All', ...Array.from(unique)];
  }, [templates]);

  const filtered = useMemo(() => {
    return templates.filter((t) => {
      const matchesCategory = activeCategory === 'All' || t.category === activeCategory;
      const matchesSearch =
        !search ||
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.description.toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [templates, activeCategory, search]);

  const handleUseTemplate = (template) => {
    queuePrompt(template.promptText);
    navigate('/chat');
  };

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">Templates</h1>
          <p className="text-zinc-500 mt-1">Ready-made prompts to jumpstart your next AI chat.</p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search templates…"
              className="input-field pl-10"
            />
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex-shrink-0 text-xs font-medium rounded-full px-3.5 py-2 transition-colors duration-150 ${
                  activeCategory === cat
                    ? 'bg-glow-gradient text-white'
                    : 'bg-white/[0.04] text-zinc-400 hover:bg-white/[0.08] hover:text-zinc-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <SkeletonLoader variant="card" count={6} />
        ) : filtered.length === 0 ? (
          <div className="glass-card py-20 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-xl bg-white/[0.05] flex items-center justify-center mb-4">
              <LayoutTemplate className="w-6 h-6 text-zinc-500" />
            </div>
            <h3 className="text-zinc-200 font-medium mb-1">No templates found</h3>
            <p className="text-sm text-zinc-500">Try a different search term or category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((template) => (
              <div
                key={template._id}
                className="glass-card p-5 flex flex-col hover:border-white/[0.14] transition-all duration-200 hover:-translate-y-0.5"
              >
                <span className="inline-block w-fit text-[11px] font-medium text-accent-violet bg-accent-violet/10 rounded-full px-2.5 py-1 mb-3">
                  {template.category}
                </span>
                <h3 className="font-medium text-white mb-1.5">{template.title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed mb-5 flex-1">{template.description}</p>
                <button
                  onClick={() => handleUseTemplate(template)}
                  className="ghost-btn flex items-center justify-center gap-1.5 text-sm w-full group"
                >
                  Use Template
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform duration-150" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
};

export default Templates;
