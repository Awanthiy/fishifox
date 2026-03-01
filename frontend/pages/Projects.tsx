import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Plus, Search, MoreHorizontal, User, Folder, ArrowUpRight } from 'lucide-react';

type ProjectStatus = 'In Progress' | 'Completed';

type Project = {
  id: string;
  name: string;
  customer_name: string;
  status: ProjectStatus;
  progress: number; // 0-100
};

type PaginatedResponse<T> = {
  data: T[];
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
};

const API_BASE = 'http://127.0.0.1:8000/api';

type FormState = {
  name: string;
  customer_name: string;
  status: ProjectStatus;
  progress: string; // keep string for input
};

const emptyForm: FormState = {
  name: '',
  customer_name: '',
  status: 'In Progress',
  progress: '65',
};

const Projects: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState('');
  const debouncedSearch = useMemo(() => search.trim(), [search]);

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [editing, setEditing] = useState<Project | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  async function loadProjects(signal?: AbortSignal) {
    const params = new URLSearchParams();
    params.set('per_page', '50');
    if (debouncedSearch) params.set('search', debouncedSearch);

    const res = await fetch(`${API_BASE}/projects?${params.toString()}`, { signal });
    if (!res.ok) throw new Error(`API error: ${res.status}`);

    const json = await res.json();

    // supports both paginated or array
    if (Array.isArray(json)) {
      setProjects(json as Project[]);
    } else {
      const paged = json as PaginatedResponse<Project>;
      setProjects(paged.data ?? []);
    }
  }

  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      try {
        setLoading(true);
        await loadProjects(controller.signal);
      } catch (e) {
        if ((e as any)?.name !== 'AbortError') console.error(e);
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [debouncedSearch]);

  // close menu on outside click
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      if (!t) return;
      if (t.closest('[data-menu-root="true"]')) return;
      setOpenMenuId(null);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  function openCreate() {
    setMode('create');
    setEditing(null);
    setForm(emptyForm);
    setIsModalOpen(true);
    setOpenMenuId(null);
  }

  function openEdit(p: Project) {
    setMode('edit');
    setEditing(p);
    setForm({
      name: p.name ?? '',
      customer_name: p.customer_name ?? '',
      status: p.status ?? 'In Progress',
      progress: String(p.progress ?? 65),
    });
    setIsModalOpen(true);
    setOpenMenuId(null);
  }

  function closeModal() {
    setIsModalOpen(false);
    setSaving(false);
  }

  async function handleSave() {
    try {
      setSaving(true);

      const payload = {
        name: form.name.trim(),
        customer_name: form.customer_name.trim(),
        status: form.status,
        progress: Number(form.progress || 0),
      };

      if (!payload.name) return alert('Project name is required');
      if (!payload.customer_name) return alert('Customer name is required');
      if (Number.isNaN(payload.progress) || payload.progress < 0 || payload.progress > 100) {
        return alert('Progress must be between 0 and 100');
      }

      if (mode === 'create') {
        const res = await fetch(`${API_BASE}/projects`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(`Create failed: ${res.status}`);
      } else {
        const res = await fetch(`${API_BASE}/projects/${editing?.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(`Update failed: ${res.status}`);
      }

      closeModal();
      setLoading(true);
      await loadProjects();
    } catch (e) {
      console.error(e);
      alert('Save failed. Check backend / network tab.');
    } finally {
      setSaving(false);
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    const ok = confirm('Delete this project?');
    if (!ok) return;

    try {
      setOpenMenuId(null);
      const res = await fetch(`${API_BASE}/projects/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`Delete failed: ${res.status}`);

      setLoading(true);
      await loadProjects();
    } catch (e) {
      console.error(e);
      alert('Delete failed. Check backend / network tab.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Active Ventures</h1>
          <p className="text-slate-500 mt-2 font-medium italic">Transforming requirements into functional excellence.</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center bg-white px-5 py-3 rounded-[1.5rem] border border-slate-200 shadow-sm focus-within:ring-2 focus-within:ring-primary/10 transition-all">
            <Search size={18} className="text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter projects..."
              className="bg-transparent border-none outline-none text-sm px-3 w-48"
            />
          </div>

          <button
            onClick={openCreate}
            className="flex items-center gap-3 bg-primary hover:bg-primary/90 text-white px-8 py-4 rounded-[1.5rem] font-bold text-sm shadow-xl shadow-primary/20 transition-all hover:-translate-y-1"
          >
            <Plus size={20} />
            New Venture
          </button>
        </div>
      </div>

      {loading && (
        <div className="text-sm font-black text-slate-400 px-2">Loading projects...</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {projects.map((project) => {
          const pct = Math.max(0, Math.min(100, Number(project.progress ?? 65)));
          const initials =
            (project.customer_name || '')
              .split(' ')
              .filter(Boolean)
              .map((n) => n[0])
              .join('')
              .slice(0, 2) || '??';

          return (
            <div
              key={project.id}
              className="bg-white rounded-[2.5rem] border border-slate-200/60 shadow-[0_10px_40px_rgba(0,0,0,0.02)] p-8 bento-card relative overflow-hidden group"
            >
              <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>

              <div className="flex justify-between items-start mb-8">
                <div className="p-4 bg-primary/5 text-primary rounded-2xl group-hover:scale-110 transition-transform duration-500 shadow-sm">
                  <Folder size={26} />
                </div>

                <div className="flex items-center gap-2 relative" data-menu-root="true">
                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      project.status === 'Completed'
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-slate-50 text-slate-500'
                    }`}
                  >
                    {project.status}
                  </span>

                  <button
                    onClick={() => setOpenMenuId((prev) => (prev === project.id ? null : project.id))}
                    className="p-2 text-slate-300 hover:text-slate-600 transition-colors"
                  >
                    <MoreHorizontal size={20} />
                  </button>

                  {openMenuId === project.id && (
                    <div className="absolute right-0 top-10 w-44 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden z-50">
                      <button
                        onClick={() => openEdit(project)}
                        className="w-full text-left px-5 py-3 text-xs font-black text-slate-700 hover:bg-slate-50"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(project.id)}
                        className="w-full text-left px-5 py-3 text-xs font-black text-rose-600 hover:bg-rose-50"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <Link
                to={`/projects/${project.id}`}
                className="block mb-2 group-hover:translate-x-1 transition-transform inline-flex items-center gap-2"
              >
                <h3 className="text-2xl font-black text-slate-900 hover:text-primary transition-colors tracking-tight">
                  {project.name}
                </h3>
                <ArrowUpRight
                  size={20}
                  className="text-slate-300 group-hover:text-primary transition-all opacity-0 group-hover:opacity-100"
                />
              </Link>

              <div className="flex items-center gap-2 text-slate-400 text-sm font-semibold mb-8">
                <User size={16} />
                <span>{project.customer_name}</span>
              </div>

              <div className="space-y-3 mb-8">
                <div className="flex justify-between text-[11px] font-black text-slate-500 uppercase tracking-widest">
                  <span>Phase Progress</span>
                  <span className="text-primary">{pct}%</span>
                </div>

                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000 bg-primary shadow-[0_0_10px] shadow-primary/40"
                    style={{ width: `${pct}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-slate-100/60">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-900 rounded-2xl flex items-center justify-center text-xs font-black text-white shadow-lg shadow-slate-200">
                    {initials}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Lead Entity</p>
                    <p className="text-xs font-black text-slate-800">{project.customer_name}</p>
                  </div>
                </div>

                <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 flex items-center gap-2">
                  <Briefcase size={14} className="text-slate-400" />
                  <span className="text-xs font-black text-slate-600">Active</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-[999]" onClick={closeModal}>
          <div
            className="w-full max-w-xl bg-white rounded-[2rem] border border-slate-200 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-8 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-800">{mode === 'create' ? 'New Venture' : 'Edit Venture'}</h3>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-1">
                {mode === 'create' ? 'Create a new project' : 'Update project details'}
              </p>
            </div>

            <div className="p-8 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Project Name</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="mt-2 w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none"
                    placeholder="SoftVibe Site Redesign"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer Name</label>
                  <input
                    value={form.customer_name}
                    onChange={(e) => setForm((f) => ({ ...f, customer_name: e.target.value }))}
                    className="mt-2 w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none"
                    placeholder="SoftVibe Solutions"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as ProjectStatus }))}
                    className="mt-2 w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none"
                  >
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Progress (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={form.progress}
                    onChange={(e) => setForm((f) => ({ ...f, progress: e.target.value }))}
                    className="mt-2 w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="p-8 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                onClick={closeModal}
                className="px-6 py-3 rounded-2xl bg-white border border-slate-200 text-[11px] font-black text-slate-500 hover:shadow-md transition-all"
              >
                Cancel
              </button>

              <button
                disabled={saving}
                onClick={handleSave}
                className="px-8 py-3 rounded-2xl bg-primary text-white text-[11px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : mode === 'create' ? 'Create' : 'Update'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;
