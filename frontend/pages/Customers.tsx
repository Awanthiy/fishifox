import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Search, Mail, Phone, MoreVertical } from 'lucide-react';

type CustomerStatus = 'Enterprise' | 'Premium' | 'Regular' | 'New';

type Customer = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  activeProjects: number;
  totalBilled: string;
  status: CustomerStatus;
};

type PaginatedResponse<T> = {
  data: T[];
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  next_page_url: string | null;
  prev_page_url: string | null;
};

const API_BASE = 'http://127.0.0.1:8000/api';

type FormState = {
  name: string;
  email: string;
  phone: string;
  activeProjects: string; // keep as string for input
  totalBilled: string;
  status: CustomerStatus;
};

const emptyForm: FormState = {
  name: '',
  email: '',
  phone: '',
  activeProjects: '0',
  totalBilled: 'LKR 0',
  status: 'New',
};

const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [perPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [lastPage, setLastPage] = useState(1);

  const debouncedSearch = useMemo(() => search.trim(), [search]);

  // 3-dots menu state
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  function openCreate() {
    setMode('create');
    setEditingId(null);
    setForm(emptyForm);
    setIsModalOpen(true);
    setOpenMenuId(null);
  }

  function openEdit(c: Customer) {
    setMode('edit');
    setEditingId(c.id);
    setForm({
      name: c.name ?? '',
      email: c.email ?? '',
      phone: c.phone ?? '',
      activeProjects: String(c.activeProjects ?? 0),
      totalBilled: c.totalBilled ?? 'LKR 0',
      status: c.status ?? 'New',
    });
    setIsModalOpen(true);
    setOpenMenuId(null);
  }

  function closeModal() {
    setIsModalOpen(false);
    setSaving(false);
  }

  async function loadCustomers(signal?: AbortSignal) {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('per_page', String(perPage));
    if (debouncedSearch) params.set('search', debouncedSearch);

    const res = await fetch(`${API_BASE}/customers?${params.toString()}`, { signal });
    if (!res.ok) throw new Error(`API error: ${res.status}`);

    const json = await res.json();

    // supports both array OR paginated
    if (Array.isArray(json)) {
      setCustomers(json as Customer[]);
      setTotal((json as Customer[]).length);
      setLastPage(1);
    } else {
      const paged = json as Partial<PaginatedResponse<Customer>>;
      setCustomers(paged.data ?? []);
      setTotal(paged.total ?? 0);
      setLastPage(paged.last_page ?? 1);
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        setLoading(true);
        await loadCustomers(controller.signal);
      } catch (e) {
        if ((e as any)?.name !== 'AbortError') console.error(e);
      } finally {
        setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [page, perPage, debouncedSearch]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const showingFrom = total === 0 ? 0 : (page - 1) * perPage + 1;
  const showingTo = Math.min(page * perPage, total);

  async function handleSave() {
    try {
      setSaving(true);

      const payload = {
        name: form.name.trim(),
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        activeProjects: Number(form.activeProjects || 0),
        totalBilled: form.totalBilled.trim() || 'LKR 0',
        status: form.status,
      };

      if (!payload.name) {
        alert('Name is required');
        return;
      }

      if (mode === 'create') {
        const res = await fetch(`${API_BASE}/customers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(`Create failed: ${res.status}`);
      } else {
        const res = await fetch(`${API_BASE}/customers/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(`Update failed: ${res.status}`);
      }

      closeModal();
      // reload list from backend so UI is always correct
      setLoading(true);
      await loadCustomers();
    } catch (e) {
      console.error(e);
      alert('Save failed. Check backend console / network tab.');
    } finally {
      setSaving(false);
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      setOpenMenuId(null);
      const ok = confirm('Delete this customer?');
      if (!ok) return;

      const res = await fetch(`${API_BASE}/customers/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`Delete failed: ${res.status}`);

      // reload list
      setLoading(true);
      await loadCustomers();
    } catch (e) {
      console.error(e);
      alert('Delete failed. Check backend console / network tab.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="bg-white rounded-[2.5rem] border border-[#F1F3FF] overflow-hidden mindskills-shadow">
        <div className="p-8 border-b border-[#F1F3FF] flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-black text-[#2F2F2F] tracking-tight">Customer Directory</h2>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-1">
              Manage client lifecycle and accounts
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex items-center bg-[#F5F7FF] border border-[#F1F3FF] rounded-2xl px-5 py-3 w-80 shadow-inner group focus-within:bg-white transition-all">
              <Search size={16} className="text-slate-400 mr-3" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter customers..."
                className="bg-transparent border-none outline-none text-xs w-full font-bold"
              />
            </div>

            <button
              onClick={openCreate}
              className="flex items-center gap-3 bg-[#4B49AC] text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-[#4B49AC]/20 hover:-translate-y-0.5 transition-all shrink-0"
            >
              <Plus size={18} />
              Add Client
            </button>
          </div>
        </div>

        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#7978E9] text-white">
              <th className="px-10 py-6 text-[11px] font-black uppercase tracking-[0.2em]">Customer Entity</th>
              <th className="px-10 py-6 text-[11px] font-black uppercase tracking-[0.2em]">Communication</th>
              <th className="px-10 py-6 text-[11px] font-black uppercase tracking-[0.2em]">Project Load</th>
              <th className="px-10 py-6 text-[11px] font-black uppercase tracking-[0.2em]">Tier</th>
              <th className="px-10 py-6 text-right text-[11px] font-black uppercase tracking-[0.2em]">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#F1F3FF]">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-10 py-10 text-sm font-black text-slate-400">
                  Loading customers...
                </td>
              </tr>
            ) : customers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-10 py-10 text-sm font-black text-slate-400">
                  No customers found.
                </td>
              </tr>
            ) : (
              customers.map((customer) => (
                <tr key={customer.id} className="hover:bg-[#F5F7FF] transition-colors group">
                  <td className="px-10 py-7">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 bg-[#F1F3FF] text-[#4B49AC] rounded-2xl flex items-center justify-center font-black text-sm group-hover:scale-110 transition-transform shadow-inner">
                        {(customer.name || '').substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-800 tracking-tight">{customer.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                          ID: #{customer.id}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-10 py-7">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-slate-600 text-[11px] font-bold">
                        <Mail size={12} className="text-[#4B49AC]" />
                        {customer.email ?? '—'}
                      </div>
                      <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold">
                        <Phone size={12} />
                        {customer.phone ?? '—'}
                      </div>
                    </div>
                  </td>

                  <td className="px-10 py-7">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-slate-800">{customer.activeProjects ?? 0}</span>
                      <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Active</span>
                    </div>
                  </td>

                  <td className="px-10 py-7">
                    <span
                      className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${
                        customer.status === 'Enterprise'
                          ? 'bg-[#4BDBE2] text-white'
                          : customer.status === 'Premium'
                          ? 'bg-[#7978E9] text-white'
                          : 'bg-[#F1F3FF] text-[#4B49AC]'
                      }`}
                    >
                      {customer.status}
                    </span>
                  </td>

                  <td className="px-10 py-7 text-right">
                    <div className="flex items-center justify-end gap-3 relative">
                      <button
                        onClick={() => setOpenMenuId((prev) => (prev === customer.id ? null : customer.id))}
                        className="p-3 bg-white border border-[#F1F3FF] text-slate-400 rounded-xl hover:text-slate-600"
                      >
                        <MoreVertical size={16} />
                      </button>

                      {openMenuId === customer.id && (
                        <div className="absolute right-0 top-14 w-44 bg-white border border-[#F1F3FF] rounded-2xl shadow-xl overflow-hidden z-50">
                          <button
                            onClick={() => openEdit(customer)}
                            className="w-full text-left px-5 py-3 text-xs font-black text-slate-700 hover:bg-[#F5F7FF]"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(customer.id)}
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

        <div className="p-10 bg-[#F5F7FF]/50 border-t border-[#F1F3FF] flex items-center justify-between">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Showing {showingFrom}-{showingTo} of {total} Clients
          </p>

          <div className="inline-flex gap-3">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-5 py-2.5 bg-white border border-[#CBD5E1] rounded-xl text-[11px] font-black text-[#4B49AC] hover:shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            <button className="w-10 h-10 bg-[#4B49AC] rounded-xl text-[11px] font-black text-white shadow-lg shadow-[#4B49AC]/20">
              {page}
            </button>

            <button
              disabled={page >= lastPage}
              onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
              className="px-5 py-2.5 bg-white border border-[#CBD5E1] rounded-xl text-[11px] font-black text-slate-400 hover:shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-[999]"
          onClick={closeModal}
        >
          <div
            className="w-full max-w-xl bg-white rounded-[2rem] border border-[#F1F3FF] shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-8 border-b border-[#F1F3FF]">
              <h3 className="text-lg font-black text-slate-800">
                {mode === 'create' ? 'Add Client' : 'Edit Client'}
              </h3>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-1">
                {mode === 'create' ? 'Create a new customer record' : 'Update customer details'}
              </p>
            </div>

            <div className="p-8 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Name</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="mt-2 w-full bg-[#F5F7FF] border border-[#F1F3FF] rounded-2xl px-4 py-3 text-sm font-bold outline-none"
                    placeholder="Customer name"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as CustomerStatus }))}
                    className="mt-2 w-full bg-[#F5F7FF] border border-[#F1F3FF] rounded-2xl px-4 py-3 text-sm font-bold outline-none"
                  >
                    <option>Enterprise</option>
                    <option>Premium</option>
                    <option>Regular</option>
                    <option>New</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email</label>
                  <input
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    className="mt-2 w-full bg-[#F5F7FF] border border-[#F1F3FF] rounded-2xl px-4 py-3 text-sm font-bold outline-none"
                    placeholder="billing@company.com"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone</label>
                  <input
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    className="mt-2 w-full bg-[#F5F7FF] border border-[#F1F3FF] rounded-2xl px-4 py-3 text-sm font-bold outline-none"
                    placeholder="+94 ..."
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Projects</label>
                  <input
                    type="number"
                    min={0}
                    value={form.activeProjects}
                    onChange={(e) => setForm((f) => ({ ...f, activeProjects: e.target.value }))}
                    className="mt-2 w-full bg-[#F5F7FF] border border-[#F1F3FF] rounded-2xl px-4 py-3 text-sm font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Billed</label>
                  <input
                    value={form.totalBilled}
                    onChange={(e) => setForm((f) => ({ ...f, totalBilled: e.target.value }))}
                    className="mt-2 w-full bg-[#F5F7FF] border border-[#F1F3FF] rounded-2xl px-4 py-3 text-sm font-bold outline-none"
                    placeholder="LKR 0"
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

export default Customers;
