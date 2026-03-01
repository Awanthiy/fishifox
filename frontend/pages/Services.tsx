import React, { useEffect, useState } from 'react';
import { Plus, DollarSign, Clock, MoreVertical } from 'lucide-react';

type Service = {
  id: string;
  name: string;
  price: number;
  cost: number;
  currency: string; // LKR | USD
  time: string | null; // SLA text
  icon: string | null; // emoji
};

const API_BASE = 'http://127.0.0.1:8000/api';

// ✅ SLA dropdown options
const SLA_OPTIONS = [
  '1 Week',
  '2 Weeks',
  '4 Weeks',
  '8 Weeks',
  '12 Weeks',
  '16 Weeks',
  'Monthly',
  '3 Months',
  '6 Months',
  'Yearly',
];

type FullForm = {
  name: string;
  price: string;
  cost: string;
  currency: string;
  time: string; // dropdown value
  icon: string;
};

type ParamsForm = {
  price: string;
  cost: string;
  currency: string;
  time: string; // dropdown value
};

const emptyFullForm: FullForm = {
  name: '',
  price: '0',
  cost: '0',
  currency: 'LKR',
  time: '',
  icon: '🧩',
};

const emptyParamsForm: ParamsForm = {
  price: '0',
  cost: '0',
  currency: 'LKR',
  time: '',
};

const Services: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);

  // 3-dot menu
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Create modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<FullForm>(emptyFullForm);

  // Full edit modal
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<FullForm>(emptyFullForm);

  // Parameters edit modal
  const [isParamsOpen, setIsParamsOpen] = useState(false);
  const [paramsId, setParamsId] = useState<string | null>(null);
  const [paramsForm, setParamsForm] = useState<ParamsForm>(emptyParamsForm);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // ✅ Close menu on outside click
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (target.closest('[data-menu-root="true"]')) return;
      setOpenMenuId(null);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  async function loadServices(signal?: AbortSignal) {
    const res = await fetch(`${API_BASE}/services`, { signal });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    const json = await res.json();
    setServices(Array.isArray(json) ? (json as Service[]) : (json?.data ?? []));
  }

  async function refresh() {
    setLoading(true);
    try {
      await loadServices();
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        setLoading(true);
        await loadServices(controller.signal);
      } catch (e) {
        if ((e as any)?.name !== 'AbortError') console.error(e);
      } finally {
        setLoading(false);
      }
    })();
    return () => controller.abort();
  }, []);

  // ----------------- Open Modals -----------------
  function openCreate() {
    setErrors({});
    setCreateForm({ ...emptyFullForm }); // reset perfectly
    setIsCreateOpen(true);
    setOpenMenuId(null);
  }

  function openEditFull(service: Service) {
    setErrors({});
    setEditId(service.id);
    setEditForm({
      name: service.name ?? '',
      price: String(service.price ?? 0),
      cost: String(service.cost ?? 0),
      currency: service.currency ?? 'LKR',
      time: service.time ?? '',
      icon: service.icon ?? '🧩',
    });
    setIsEditOpen(true);
    setOpenMenuId(null);
  }

  function openEditParams(service: Service) {
    setErrors({});
    setParamsId(service.id);
    setParamsForm({
      price: String(service.price ?? 0),
      cost: String(service.cost ?? 0),
      currency: service.currency ?? 'LKR',
      time: service.time ?? '',
    });
    setIsParamsOpen(true);
    setOpenMenuId(null);
  }

  function closeAllModals() {
    setIsCreateOpen(false);
    setIsEditOpen(false);
    setIsParamsOpen(false);
    setSaving(false);
    setErrors({});
  }

  // ----------------- Validation -----------------
  function validateFull(form: FullForm) {
    const nextErrors: Record<string, string> = {};

    if (!form.name.trim()) nextErrors.name = 'Service name is required';

    const price = Number(form.price);
    const cost = Number(form.cost);

    if (Number.isNaN(price) || price < 0) nextErrors.price = 'Price must be 0 or more';
    if (Number.isNaN(cost) || cost < 0) nextErrors.cost = 'Cost must be 0 or more';

    if (!form.currency.trim()) nextErrors.currency = 'Currency is required';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function validateParams(form: ParamsForm) {
    const nextErrors: Record<string, string> = {};

    const price = Number(form.price);
    const cost = Number(form.cost);

    if (Number.isNaN(price) || price < 0) nextErrors.price = 'Price must be 0 or more';
    if (Number.isNaN(cost) || cost < 0) nextErrors.cost = 'Cost must be 0 or more';

    if (!form.currency.trim()) nextErrors.currency = 'Currency is required';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  // ----------------- API -----------------
  async function apiCreate(payload: any) {
    const res = await fetch(`${API_BASE}/services`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Create failed (${res.status}): ${txt}`);
    }
  }

  async function apiUpdate(id: string, payload: any) {
    const res = await fetch(`${API_BASE}/services/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Update failed (${res.status}): ${txt}`);
    }
  }

  async function apiDelete(id: string) {
    const res = await fetch(`${API_BASE}/services/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Delete failed (${res.status}): ${txt}`);
    }
  }

  // ----------------- Save Handlers -----------------
  async function handleCreateSave() {
    if (!validateFull(createForm)) return;

    try {
      setSaving(true);

      const payload = {
        name: createForm.name.trim(),
        price: Number(createForm.price || 0),
        cost: Number(createForm.cost || 0),
        currency: createForm.currency.trim() || 'LKR',
        time: createForm.time.trim() || null,
        icon: createForm.icon.trim() || '🧩',
      };

      await apiCreate(payload);
      closeAllModals();
      await refresh();
    } catch (e) {
      console.error(e);
      alert('Create failed. Check Network tab / backend logs.');
    } finally {
      setSaving(false);
    }
  }

  async function handleEditFullSave() {
    if (!editId) return;
    if (!validateFull(editForm)) return;

    try {
      setSaving(true);

      const payload = {
        name: editForm.name.trim(),
        price: Number(editForm.price || 0),
        cost: Number(editForm.cost || 0),
        currency: editForm.currency.trim() || 'LKR',
        time: editForm.time.trim() || null,
        icon: editForm.icon.trim() || '🧩',
      };

      await apiUpdate(editId, payload);
      closeAllModals();
      await refresh();
    } catch (e) {
      console.error(e);
      alert('Edit failed. Check Network tab / backend logs.');
    } finally {
      setSaving(false);
    }
  }

  async function handleParamsSave() {
    if (!paramsId) return;
    if (!validateParams(paramsForm)) return;

    try {
      setSaving(true);

      const current = services.find((s) => s.id === paramsId);
      if (!current) {
        alert('Service not found');
        return;
      }

      const payload = {
        name: current.name, // keep unchanged
        icon: current.icon,
        price: Number(paramsForm.price || 0),
        cost: Number(paramsForm.cost || 0),
        currency: paramsForm.currency.trim() || current.currency || 'LKR',
        time: paramsForm.time.trim() || null,
      };

      await apiUpdate(paramsId, payload);
      closeAllModals();
      await refresh();
    } catch (e) {
      console.error(e);
      alert('Update parameters failed. Check Network tab / backend logs.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    const ok = confirm('Delete this service?');
    if (!ok) return;

    try {
      setOpenMenuId(null);
      await apiDelete(id);
      await refresh();
    } catch (e) {
      console.error(e);
      alert('Delete failed. Check Network tab / backend logs.');
    }
  }

  // ----------------- UI -----------------
  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-[#2F2F2F] tracking-tight">Service Catalog</h1>
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-1">
            Management of standardized product units
          </p>
        </div>

        <button
          onClick={openCreate}
          className="flex items-center gap-3 bg-[#4B49AC] text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-[#4B49AC]/20 hover:-translate-y-0.5 transition-all"
        >
          <Plus size={18} />
          Define New Service
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
        {loading ? (
          <div className="text-slate-400 font-black">Loading services...</div>
        ) : services.length === 0 ? (
          <div className="text-slate-400 font-black">No services found.</div>
        ) : (
          services.map((service) => (
            <div
              key={service.id}
              className="bg-white p-8 rounded-[3rem] border border-[#F1F3FF] mindskills-shadow group hover:border-[#4B49AC]/20 transition-all relative"
            >
              <div className="flex items-center justify-between mb-8" data-menu-root="true">
                <div className="w-16 h-16 bg-[#F5F7FF] rounded-[2rem] flex items-center justify-center text-3xl group-hover:scale-110 transition-transform shadow-inner border border-[#F1F3FF]">
                  {service.icon || '🧩'}
                </div>

                <button
                  onClick={() => setOpenMenuId((prev) => (prev === service.id ? null : service.id))}
                  className="p-2 text-slate-300 hover:text-[#4B49AC] transition-colors"
                >
                  <MoreVertical size={20} />
                </button>

                {openMenuId === service.id && (
                  <div className="absolute right-8 top-20 w-44 bg-white border border-[#F1F3FF] rounded-2xl shadow-xl overflow-hidden z-50">
                    <button
                      onClick={() => openEditFull(service)}
                      className="w-full text-left px-5 py-3 text-xs font-black text-slate-700 hover:bg-[#F5F7FF]"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(service.id)}
                      className="w-full text-left px-5 py-3 text-xs font-black text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>

              <div className="mb-8">
                <h3 className="text-lg font-black text-[#2F2F2F] tracking-tight leading-tight min-h-[50px]">
                  {service.name}
                </h3>
                <div className="flex items-center gap-2 mt-3">
                  <span className="w-2 h-2 rounded-full bg-[#4BDBE2]"></span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Profit Optimized
                  </span>
                </div>
              </div>

              <div className="space-y-5 pt-8 border-t border-[#F1F3FF]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-400">
                    <DollarSign size={14} className="text-[#4B49AC]" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Rate</span>
                  </div>
                  <span className="text-sm font-black text-[#4B49AC]">
                    {service.currency} {Number(service.price ?? 0).toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Clock size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">SLA</span>
                  </div>
                  <span className="text-[11px] font-bold text-slate-600">{service.time ?? '—'}</span>
                </div>
              </div>

              <button
                onClick={() => openEditParams(service)}
                className="mt-8 w-full py-3.5 bg-[#F5F7FF] text-[#4B49AC] rounded-2xl text-[10px] font-black uppercase tracking-widest border border-transparent hover:border-[#4B49AC]/20 hover:bg-white transition-all"
              >
                Edit Parameters
              </button>
            </div>
          ))
        )}
      </div>

      {/* ---------------- CREATE MODAL ---------------- */}
      {isCreateOpen && (
        <ModalShell title="Define New Service" subtitle="Create a new standardized unit" onClose={closeAllModals}>
          <FullServiceForm form={createForm} setForm={setCreateForm} errors={errors} />
          <ModalActions saving={saving} onCancel={closeAllModals} onSave={handleCreateSave} saveText="Create" />
        </ModalShell>
      )}

      {/* ---------------- FULL EDIT MODAL ---------------- */}
      {isEditOpen && (
        <ModalShell title="Edit Service" subtitle="Update full service details" onClose={closeAllModals}>
          <FullServiceForm form={editForm} setForm={setEditForm} errors={errors} />
          <ModalActions saving={saving} onCancel={closeAllModals} onSave={handleEditFullSave} saveText="Update" />
        </ModalShell>
      )}

      {/* ---------------- PARAMETERS MODAL ---------------- */}
      {isParamsOpen && (
        <ModalShell title="Edit Parameters" subtitle="Update rate, cost, currency & SLA" onClose={closeAllModals}>
          <ParamsOnlyForm form={paramsForm} setForm={setParamsForm} errors={errors} />
          <ModalActions saving={saving} onCancel={closeAllModals} onSave={handleParamsSave} saveText="Update" />
        </ModalShell>
      )}
    </div>
  );
};

export default Services;

/* ----------------------- Reusable UI ----------------------- */

function ModalShell({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-[999]" onClick={onClose}>
      <div
        className="w-full max-w-xl bg-white rounded-[2rem] border border-[#F1F3FF] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8 border-b border-[#F1F3FF]">
          <h3 className="text-lg font-black text-slate-800">{title}</h3>
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-1">{subtitle}</p>
        </div>
        {children}
      </div>
    </div>
  );
}

function ModalActions({
  saving,
  onCancel,
  onSave,
  saveText,
}: {
  saving: boolean;
  onCancel: () => void;
  onSave: () => void;
  saveText: string;
}) {
  return (
    <div className="p-8 border-t border-[#F1F3FF] flex items-center justify-end gap-3">
      <button
        onClick={onCancel}
        className="px-6 py-3 rounded-2xl bg-white border border-[#CBD5E1] text-[11px] font-black text-slate-500 hover:shadow-md transition-all"
      >
        Cancel
      </button>

      <button
        disabled={saving}
        onClick={onSave}
        className="px-8 py-3 rounded-2xl bg-[#4B49AC] text-white text-[11px] font-black uppercase tracking-widest shadow-xl shadow-[#4B49AC]/20 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {saving ? 'Saving...' : saveText}
      </button>
    </div>
  );
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-1 text-[11px] font-black text-red-500">{msg}</p>;
}

function FullServiceForm({
  form,
  setForm,
  errors,
}: {
  form: {
    name: string;
    price: string;
    cost: string;
    currency: string;
    time: string;
    icon: string;
  };
  setForm: React.Dispatch<React.SetStateAction<any>>;
  errors: Record<string, string>;
}) {
  return (
    <div className="p-8 space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Service Name *</label>
          <input
            value={form.name}
            onChange={(e) => setForm((f: any) => ({ ...f, name: e.target.value }))}
            className="mt-2 w-full bg-[#F5F7FF] border border-[#F1F3FF] rounded-2xl px-4 py-3 text-sm font-bold outline-none"
            placeholder="e.g. Custom Web Development"
          />
          <FieldError msg={errors.name} />
        </div>

        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Currency *</label>
          <select
            value={form.currency}
            onChange={(e) => setForm((f: any) => ({ ...f, currency: e.target.value }))}
            className="mt-2 w-full bg-[#F5F7FF] border border-[#F1F3FF] rounded-2xl px-4 py-3 text-sm font-bold outline-none"
          >
            <option value="LKR">LKR</option>
            <option value="USD">USD</option>
          </select>
          <FieldError msg={errors.currency} />
        </div>

        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Icon (Emoji)</label>
          <input
            value={form.icon}
            onChange={(e) => setForm((f: any) => ({ ...f, icon: e.target.value }))}
            className="mt-2 w-full bg-[#F5F7FF] border border-[#F1F3FF] rounded-2xl px-4 py-3 text-sm font-bold outline-none"
            placeholder="💻 📱 ☁️ 🛠️"
          />
        </div>

        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Price *</label>
          <input
            type="number"
            min={0}
            value={form.price}
            onChange={(e) => setForm((f: any) => ({ ...f, price: e.target.value }))}
            className="mt-2 w-full bg-[#F5F7FF] border border-[#F1F3FF] rounded-2xl px-4 py-3 text-sm font-bold outline-none"
          />
          <FieldError msg={errors.price} />
        </div>

        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cost *</label>
          <input
            type="number"
            min={0}
            value={form.cost}
            onChange={(e) => setForm((f: any) => ({ ...f, cost: e.target.value }))}
            className="mt-2 w-full bg-[#F5F7FF] border border-[#F1F3FF] rounded-2xl px-4 py-3 text-sm font-bold outline-none"
          />
          <FieldError msg={errors.cost} />
        </div>

        {/* ✅ SLA DROPDOWN */}
        <div className="md:col-span-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SLA (Time)</label>
          <select
            value={form.time}
            onChange={(e) => setForm((f: any) => ({ ...f, time: e.target.value }))}
            className="mt-2 w-full bg-[#F5F7FF] border border-[#F1F3FF] rounded-2xl px-4 py-3 text-sm font-bold outline-none"
          >
            <option value="">Select SLA...</option>
            {SLA_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

function ParamsOnlyForm({
  form,
  setForm,
  errors,
}: {
  form: { price: string; cost: string; currency: string; time: string };
  setForm: React.Dispatch<React.SetStateAction<any>>;
  errors: Record<string, string>;
}) {
  return (
    <div className="p-8 space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Currency *</label>
          <select
            value={form.currency}
            onChange={(e) => setForm((f: any) => ({ ...f, currency: e.target.value }))}
            className="mt-2 w-full bg-[#F5F7FF] border border-[#F1F3FF] rounded-2xl px-4 py-3 text-sm font-bold outline-none"
          >
            <option value="LKR">LKR</option>
            <option value="USD">USD</option>
          </select>
          <FieldError msg={errors.currency} />
        </div>

        {/* ✅ SLA DROPDOWN */}
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SLA (Time)</label>
          <select
            value={form.time}
            onChange={(e) => setForm((f: any) => ({ ...f, time: e.target.value }))}
            className="mt-2 w-full bg-[#F5F7FF] border border-[#F1F3FF] rounded-2xl px-4 py-3 text-sm font-bold outline-none"
          >
            <option value="">Select SLA...</option>
            {SLA_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Price *</label>
          <input
            type="number"
            min={0}
            value={form.price}
            onChange={(e) => setForm((f: any) => ({ ...f, price: e.target.value }))}
            className="mt-2 w-full bg-[#F5F7FF] border border-[#F1F3FF] rounded-2xl px-4 py-3 text-sm font-bold outline-none"
          />
          <FieldError msg={errors.price} />
        </div>

        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cost *</label>
          <input
            type="number"
            min={0}
            value={form.cost}
            onChange={(e) => setForm((f: any) => ({ ...f, cost: e.target.value }))}
            className="mt-2 w-full bg-[#F5F7FF] border border-[#F1F3FF] rounded-2xl px-4 py-3 text-sm font-bold outline-none"
          />
          <FieldError msg={errors.cost} />
        </div>
      </div>
    </div>
  );
}
