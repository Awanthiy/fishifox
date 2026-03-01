import React, { useEffect, useState } from 'react';
import { FileText, Edit3, Trash2, Download, Plus } from 'lucide-react';

const API_BASE = 'http://127.0.0.1:8000/api';

const InvoiceStatus = {
  PAID: 'PAID',
  PENDING: 'PENDING',
  OVERDUE: 'OVERDUE',
};

const emptyForm = {
  // invoice_number optional in CREATE (backend will auto-generate)
  invoice_number: '',
  customer_name: '',
  amount: '0',
  currency: 'LKR',
  billing_date: '',
  status: InvoiceStatus.PENDING,
};

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);

  // modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mode, setMode] = useState('create'); // 'create' | 'edit'
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);

  async function fetchInvoices(signal) {
    const res = await fetch(`${API_BASE}/invoices`, { signal });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    const json = await res.json();
    setInvoices(Array.isArray(json) ? json : (json?.data ?? []));
  }

  async function refresh() {
    setLoading(true);
    try {
      await fetchInvoices();
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        setLoading(true);
        await fetchInvoices(controller.signal);
      } catch (e) {
        if (e?.name !== 'AbortError') console.error(e);
      } finally {
        setLoading(false);
      }
    })();
    return () => controller.abort();
  }, []);

  // ---------- Modal helpers ----------
  function openCreate() {
    setMode('create');
    setEditingId(null);
    setForm({ ...emptyForm });
    setIsModalOpen(true);
  }

  function openEdit(inv) {
    setMode('edit');
    setEditingId(inv.id);
    setForm({
      invoice_number: inv.invoice_number || '',
      customer_name: inv.customer_name || '',
      amount: String(inv.amount ?? 0),
      currency: inv.currency || 'LKR',
      billing_date: inv.date || '', // backend sends "date"
      status: inv.status || InvoiceStatus.PENDING,
    });
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setSaving(false);
  }

  // ---------- API Actions ----------
  async function handleSave() {
    // validate
    const payload = {
      invoice_number: form.invoice_number.trim() || null, // allow null for create -> auto generate
      customer_name: form.customer_name.trim(),
      amount: Number(form.amount || 0),
      currency: form.currency.trim() || 'LKR',
      billing_date: form.billing_date.trim() || null,
      status: form.status,
    };

    if (!payload.customer_name) {
      alert('Customer name is required');
      return;
    }
    if (Number.isNaN(payload.amount) || payload.amount < 0) {
      alert('Amount must be 0 or more');
      return;
    }

    try {
      setSaving(true);

      if (mode === 'create') {
        const res = await fetch(`${API_BASE}/invoices`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const txt = await res.text();
          throw new Error(txt || `Create failed: ${res.status}`);
        }
      } else {
        const res = await fetch(`${API_BASE}/invoices/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            // update requires invoice_number
            invoice_number: form.invoice_number.trim(),
            customer_name: payload.customer_name,
            amount: payload.amount,
            currency: payload.currency,
            billing_date: payload.billing_date,
            status: payload.status,
          }),
        });

        if (!res.ok) {
          const txt = await res.text();
          throw new Error(txt || `Update failed: ${res.status}`);
        }
      }

      closeModal();
      await refresh();
    } catch (e) {
      console.error(e);
      alert('Save failed. Check backend logs / network tab.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    const ok = confirm('Delete this invoice?');
    if (!ok) return;

    try {
      const res = await fetch(`${API_BASE}/invoices/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `Delete failed: ${res.status}`);
      }
      await refresh();
    } catch (e) {
      console.error(e);
      alert('Delete failed. Check backend logs / network tab.');
    }
  }

  async function handleDownload(id, invoiceNumber) {
    try {
      const res = await fetch(`${API_BASE}/invoices/${id}/download`);
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `Download failed: ${res.status}`);
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = (invoiceNumber || 'invoice') + '.txt'; // backend returns txt placeholder for now
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert('Download failed. Check backend / network tab.');
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* ✅ Add Invoice Button */}
      <div className="flex justify-end">
        <button
          onClick={openCreate}
          className="flex items-center gap-3 bg-[#4B49AC] text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-[#4B49AC]/20 hover:-translate-y-0.5 transition-all"
        >
          <Plus size={18} />
          Add Invoice
        </button>
      </div>

      <div className="bg-white rounded-[2rem] border border-[#F1F3FF] overflow-hidden mindskills-shadow">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#7978E9] text-white">
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] first:rounded-tl-2xl">
                Invoice Number
              </th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em]">Customer Entity</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em]">Value</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em]">Billing Date</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em]">Status</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-right last:rounded-tr-2xl">
                Management
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#F1F3FF]">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-8 py-10 text-sm font-black text-slate-400">
                  Loading invoices...
                </td>
              </tr>
            ) : invoices.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-20 text-center text-slate-400 text-sm font-bold uppercase tracking-widest">
                  No invoices found in database.
                </td>
              </tr>
            ) : (
              invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-[#F5F7FF] transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#F1F3FF] text-[#4B49AC] rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <FileText size={18} />
                      </div>
                      <span className="text-xs font-black text-slate-800 tracking-tight">
                        {inv.invoice_number}
                      </span>
                    </div>
                  </td>

                  <td className="px-8 py-5">
                    <p className="text-xs font-bold text-slate-700">{inv.customer_name}</p>
                  </td>

                  <td className="px-8 py-5">
                    <p className="text-xs font-black text-[#4B49AC]">
                      {inv.currency} {Number(inv.amount ?? 0).toLocaleString()}
                    </p>
                  </td>

                  <td className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">
                    {inv.date || '—'}
                  </td>

                  <td className="px-8 py-5">
                    <span
                      className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                        inv.status === InvoiceStatus.PAID
                          ? 'bg-[#4BDBE2] text-white'
                          : inv.status === InvoiceStatus.PENDING
                          ? 'bg-[#FFB64D] text-white'
                          : 'bg-[#4B49AC] text-white'
                      }`}
                    >
                      {inv.status}
                    </span>
                  </td>

                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleDownload(inv.id, inv.invoice_number)}
                        className="p-2 bg-emerald-500 text-white rounded-lg shadow-sm"
                      >
                        <Download size={14} />
                      </button>

                      <button
                        onClick={() => openEdit(inv)}
                        className="p-2 bg-[#7978E9] text-white rounded-lg shadow-sm"
                      >
                        <Edit3 size={14} />
                      </button>

                      <button
                        onClick={() => handleDelete(inv.id)}
                        className="p-2 bg-rose-500 text-white rounded-lg shadow-sm"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="p-6 bg-[#F5F7FF]/50 border-t border-[#F1F3FF] flex items-center justify-center gap-2">
          <button className="w-8 h-8 rounded-lg border border-[#CBD5E1] text-[#4B49AC] font-black text-xs flex items-center justify-center hover:bg-white transition-colors">
            1
          </button>
          <button className="w-8 h-8 rounded-lg border border-[#CBD5E1] text-slate-400 font-black text-xs flex items-center justify-center hover:bg-white transition-colors">
            2
          </button>
        </div>
      </div>

      {/* ---------------- MODAL (CREATE/EDIT) ---------------- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-[999]" onClick={closeModal}>
          <div
            className="w-full max-w-xl bg-white rounded-[2rem] border border-[#F1F3FF] shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-8 border-b border-[#F1F3FF]">
              <h3 className="text-lg font-black text-slate-800">
                {mode === 'create' ? 'Add Invoice' : 'Edit Invoice'}
              </h3>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-1">
                {mode === 'create' ? 'Create a new invoice record' : 'Update invoice details'}
              </p>
            </div>

            <div className="p-8 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Invoice Number
                  </label>
                  <input
                    value={form.invoice_number}
                    onChange={(e) => setForm((f) => ({ ...f, invoice_number: e.target.value }))}
                    disabled={mode === 'edit'}
                    className={`mt-2 w-full bg-[#F5F7FF] border border-[#F1F3FF] rounded-2xl px-4 py-3 text-sm font-bold outline-none ${
                      mode === 'edit' ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                    placeholder="Leave empty to auto-generate"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Customer Name
                  </label>
                  <input
                    value={form.customer_name}
                    onChange={(e) => setForm((f) => ({ ...f, customer_name: e.target.value }))}
                    className="mt-2 w-full bg-[#F5F7FF] border border-[#F1F3FF] rounded-2xl px-4 py-3 text-sm font-bold outline-none"
                    placeholder="Customer"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Currency
                  </label>
                  <select
                    value={form.currency}
                    onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
                    className="mt-2 w-full bg-[#F5F7FF] border border-[#F1F3FF] rounded-2xl px-4 py-3 text-sm font-bold outline-none"
                  >
                    <option value="LKR">LKR</option>
                    <option value="USD">USD</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Amount
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.amount}
                    onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                    className="mt-2 w-full bg-[#F5F7FF] border border-[#F1F3FF] rounded-2xl px-4 py-3 text-sm font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Billing Date
                  </label>
                  <input
                    type="date"
                    value={form.billing_date}
                    onChange={(e) => setForm((f) => ({ ...f, billing_date: e.target.value }))}
                    className="mt-2 w-full bg-[#F5F7FF] border border-[#F1F3FF] rounded-2xl px-4 py-3 text-sm font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Status
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                    className="mt-2 w-full bg-[#F5F7FF] border border-[#F1F3FF] rounded-2xl px-4 py-3 text-sm font-bold outline-none"
                  >
                    <option value={InvoiceStatus.PAID}>PAID</option>
                    <option value={InvoiceStatus.PENDING}>PENDING</option>
                    <option value={InvoiceStatus.OVERDUE}>OVERDUE</option>
                  </select>
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

export default Invoices;
