import React, { useEffect, useMemo, useState } from 'react';
import { BellRing, Globe, MoreVertical, Plus, Search } from 'lucide-react';

type Category = 'DOMAIN' | 'SSL' | 'HOSTING' | 'OTHER';

type Expiration = {
  id: string;
  asset_name: string;
  category: Category;
  expiry_date: string;     // YYYY-MM-DD
  expiry_label?: string;   // optional from backend
  project_mapping: string | null;
  asset_url: string | null;
  reminder_sent: boolean;
  days_left?: number;
  urgent?: boolean;
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
  asset_name: string;
  category: Category;
  expiry_date: string; // YYYY-MM-DD
  project_mapping: string;
  asset_url: string;
};

const emptyForm: FormState = {
  asset_name: '',
  category: 'OTHER',
  expiry_date: new Date().toISOString().slice(0, 10),
  project_mapping: '',
  asset_url: '',
};

function formatLabelFallback(iso: string) {
  // very safe local fallback (YYYY-MM-DD -> DD Mon YYYY)
  const d = new Date(iso + 'T00:00:00');
  const parts = d.toDateString().split(' '); // e.g. "Mon Mar 25 2024"
  if (parts.length >= 4) return `${parts[2]} ${parts[1]} ${parts[3]}`;
  return iso;
}

const Expirations: React.FC = () => {
  const [rows, setRows] = useState<Expiration[]>([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState('');
  const debouncedSearch = useMemo(() => search.trim(), [search]);

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  async function loadExpirations(signal?: AbortSignal) {
    const params = new URLSearchParams();
    params.set('per_page', '50');
    if (debouncedSearch) params.set('search', debouncedSearch);

    const res = await fetch(`${API_BASE}/expirations?${params.toString()}`, { signal });
    if (!res.ok) throw new Error(`API error: ${res.status}`);

    const json = await res.json();

    if (Array.isArray(json)) {
      setRows(json as Expiration[]);
    } else {
      const paged = json as PaginatedResponse<Expiration>;
      setRows(paged.data ?? []);
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        setLoading(true);
        await loadExpirations(controller.signal);
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
    setEditingId(null);
    setForm({
      ...emptyForm,
      expiry_date: new Date().toISOString().slice(0, 10),
    });
    setIsModalOpen(true);
    setOpenMenuId(null);
  }

  function openEdit(r: Expiration) {
    setMode('edit');
    setEditingId(r.id);
    setForm({
      asset_name: r.asset_name ?? '',
      category: (r.category ?? 'OTHER') as Category,
      expiry_date: r.expiry_date ?? new Date().toISOString().slice(0, 10),
      project_mapping: r.project_mapping ?? '',
      asset_url: r.asset_url ?? '',
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
        asset_name: form.asset_name.trim(),
        category: form.category,
        expiry_date: form.expiry_date,
        project_mapping: form.project_mapping.trim() || null,
        asset_url: form.asset_url.trim() || null,
      };

      if (!payload.asset_name) return alert('Service Asset is required');
      if (!payload.expiry_date) return alert('Expiry date is required');

      if (mode === 'create') {
        const res = await fetch(`${API_BASE}/expirations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(`Create failed: ${res.status}`);
      } else {
        const res = await fetch(`${API_BASE}/expirations/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(`Update failed: ${res.status}`);
      }

      closeModal();
      setLoading(true);
      await loadExpirations();
    } catch (e) {
      console.error(e);
      alert('Save failed. Check backend / network tab.');
    } finally {
      setSaving(false);
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    const ok = confirm('Delete this expiration record?');
    if (!ok) return;

    try {
      setOpenMenuId(null);
      const res = await fetch(`${API_BASE}/expirations/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`Delete failed: ${res.status}`);

      setLoading(true);
      await loadExpirations();
    } catch (e) {
      console.error(e);
      alert('Delete failed. Check backend / network tab.');
    } finally {
      setLoading(false);
    }
  }

  async function handleRemind(id: string) {
    try {
      const res = await fetch(`${API_BASE}/expirations/${id}/remind`, { method: 'POST' });
      if (!res.ok) throw new Error(`Remind failed: ${res.status}`);
      await loadExpirations();
      alert('Reminder marked as sent ✅');
    } catch (e) {
      console.error(e);
      alert('Remind failed.');
    }
  }

  function openUrl(url: string | null) {
    if (!url) return alert('No URL saved for this asset.');
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="bg-white rounded-[2rem] border border-[#F1F3FF] overflow-hidden mindskills-shadow">
        {/* TOP BAR (added) */}
        <div className="p-8 border-b border-[#F1F3FF] flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-black text-[#2F2F2F] tracking-tight">Expirations</h2>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-1">
              Track renewals and critical assets
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex items-center bg-[#F5F7FF] border border-[#F1F3FF] rounded-2xl px-5 py-3 w-80 shadow-inner group focus-within:bg-white transition-all">
              <Search size={16} className="text-slate-400 mr-3" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter assets..."
                className="bg-transparent border-none outline-none text-xs w-full font-bold"
              />
            </div>

            <button
              onClick={openCreate}
              className="flex items-center gap-3 bg-[#4B49AC] text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-[#4B49AC]/20 hover:-translate-y-0.5 transition-all shrink-0"
            >
              <Plus size={18} />
              New Expiration
            </button>
          </div>
        </div>

        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#7978E9] text-white">
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] first:rounded-tl-2xl">
                Service Asset
              </th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em]">Category</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em]">Expiry Date</th>
              <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em]">Project Mapping</th>
              <th className="px-8 py-6 text-right text-[10px] font-black uppercase tracking-[0.2em] last:rounded-tr-2xl">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#F1F3FF]">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-8 py-10 text-sm font-black text-slate-400">
                  Loading expirations...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-8 py-10 text-sm font-black text-slate-400">
                  No records found.
                </td>
              </tr>
            ) : (
              rows.map((item) => (
                <tr key={item.id} className="hover:bg-[#F5F7FF] transition-colors group">
                  <td className="px-8 py-6">
                    <div>
                      <p className="text-xs font-black text-slate-800">{item.asset_name}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                        ID: {item.id}00X
                      </p>
                    </div>
                  </td>

                  <td className="px-8 py-6">
                    <div className="flex gap-1 flex-wrap">
                      <span className="px-3 py-1 bg-[#4BDBE2] text-white text-[9px] font-black uppercase rounded-lg shadow-sm">
                        {item.category}
                      </span>
                      {(item.urgent ?? ((item.days_left ?? 999) <= 7)) && (
                        <span className="px-3 py-1 bg-[#FFB64D] text-white text-[9px] font-black uppercase rounded-lg shadow-sm">
                          Urgent
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="px-8 py-6 text-xs font-black text-[#4B49AC]">
                    {item.expiry_label ?? formatLabelFallback(item.expiry_date)}
                  </td>

                  <td className="px-8 py-6">
                    <span className="text-xs font-bold text-slate-500 hover:text-[#4B49AC] cursor-pointer transition-colors">
                      {item.project_mapping ?? '—'}
                    </span>
                  </td>

                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2 relative" data-menu-root="true">
                      <button
                        onClick={() => openUrl(item.asset_url)}
                        className="p-2 bg-[#4BDBE2] text-white rounded-lg"
                        title="Open asset"
                      >
                        <Globe size={14} />
                      </button>

                      <button
                        onClick={() => handleRemind(item.id)}
                        className="p-2 bg-[#7978E9] text-white rounded-lg"
                        title="Send reminder"
                      >
                        <BellRing size={14} />
                      </button>

                      <button
                        onClick={() => setOpenMenuId((p) => (p === item.id ? null : item.id))}
                        className="p-2 bg-white border border-[#F1F3FF] text-slate-300 hover:text-slate-600 rounded-lg"
                        title="More"
                      >
                        <MoreVertical size={14} />
                      </button>

                      {openMenuId === item.id && (
                        <div className="absolute right-0 top-12 w-44 bg-white border border-[#F1F3FF] rounded-2xl shadow-xl overflow-hidden z-50">
                          <button
                            onClick={() => openEdit(item)}
                            className="w-full text-left px-5 py-3 text-xs font-black text-slate-700 hover:bg-[#F5F7FF]"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="w-full text-left px-5 py-3 text-xs font-black text-red-600 hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="p-8 bg-[#F5F7FF]/50 border-t border-[#F1F3FF] flex items-center justify-center">
          <div className="inline-flex gap-2">
            <button className="px-4 py-2 border border-[#CBD5E1] rounded-lg text-xs font-bold text-[#4B49AC] hover:bg-white transition-all shadow-sm">
              First
            </button>
            <button className="px-4 py-2 bg-[#4B49AC] rounded-lg text-xs font-bold text-white shadow-lg shadow-[#4B49AC]/20">
              1
            </button>
            <button className="px-4 py-2 border border-[#CBD5E1] rounded-lg text-xs font-bold text-slate-400 hover:bg-white transition-all">
              Last
            </button>
          </div>
        </div>
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-[999]" onClick={closeModal}>
          <div
            className="w-full max-w-xl bg-white rounded-[2rem] border border-[#F1F3FF] shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-8 border-b border-[#F1F3FF]">
              <h3 className="text-lg font-black text-slate-800">{mode === 'create' ? 'New Expiration' : 'Edit Expiration'}</h3>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-1">
                {mode === 'create' ? 'Add a new asset to track expiry' : 'Update asset expiry details'}
              </p>
            </div>

            <div className="p-8 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Service Asset</label>
                  <input
                    value={form.asset_name}
                    onChange={(e) => setForm((f) => ({ ...f, asset_name: e.target.value }))}
                    className="mt-2 w-full bg-[#F5F7FF] border border-[#F1F3FF] rounded-2xl px-4 py-3 text-sm font-bold outline-none"
                    placeholder="fishifox.com"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as Category }))}
                    className="mt-2 w-full bg-[#F5F7FF] border border-[#F1F3FF] rounded-2xl px-4 py-3 text-sm font-bold outline-none"
                  >
                    <option value="DOMAIN">DOMAIN</option>
                    <option value="SSL">SSL</option>
                    <option value="HOSTING">HOSTING</option>
                    <option value="OTHER">OTHER</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Expiry Date</label>
                  <input
                    type="date"
                    value={form.expiry_date}
                    onChange={(e) => setForm((f) => ({ ...f, expiry_date: e.target.value }))}
                    className="mt-2 w-full bg-[#F5F7FF] border border-[#F1F3FF] rounded-2xl px-4 py-3 text-sm font-bold outline-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Project Mapping</label>
                  <input
                    value={form.project_mapping}
                    onChange={(e) => setForm((f) => ({ ...f, project_mapping: e.target.value }))}
                    className="mt-2 w-full bg-[#F5F7FF] border border-[#F1F3FF] rounded-2xl px-4 py-3 text-sm font-bold outline-none"
                    placeholder="Internal Ops"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Asset URL (optional)</label>
                  <input
                    value={form.asset_url}
                    onChange={(e) => setForm((f) => ({ ...f, asset_url: e.target.value }))}
                    className="mt-2 w-full bg-[#F5F7FF] border border-[#F1F3FF] rounded-2xl px-4 py-3 text-sm font-bold outline-none"
                    placeholder="https://fishifox.com"
                  />
                </div>
              </div>
            </div>

            <div className="p-8 border-t border-[#F1F3FF] flex items-center justify-end gap-3">
              <button
                onClick={closeModal}
                className="px-6 py-3 rounded-2xl bg-white border border-[#CBD5E1] text-[11px] font-black text-slate-500 hover:shadow-md transition-all"
              >
                Cancel
              </button>

              <button
                disabled={saving}
                onClick={handleSave}
                className="px-8 py-3 rounded-2xl bg-[#4B49AC] text-white text-[11px] font-black uppercase tracking-widest shadow-xl shadow-[#4B49AC]/20 disabled:opacity-50 disabled:cursor-not-allowed"
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

export default Expirations;
