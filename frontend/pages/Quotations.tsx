import React, { useEffect, useState } from 'react';
import { FileBadge, CheckCircle, Clock, XCircle, MoreVertical, FileText, Send } from 'lucide-react';

type QuoteStatus = 'Pending' | 'Approved' | 'Rejected';

type Quote = {
  id: string;
  number: string;
  customer: string;
  amount: number;
  currency: string;
  status: QuoteStatus;
  date: string | null; // YYYY-MM-DD
  converted?: boolean;
};

const API_BASE = 'http://127.0.0.1:8000/api';

type FormState = {
  quote_number: string; // optional for create (auto-generate)
  customer: string;
  currency: string;
  amount: string;
  quote_date: string; // YYYY-MM-DD
  status: QuoteStatus;
};

const emptyForm: FormState = {
  quote_number: '',
  customer: '',
  currency: 'LKR',
  amount: '0',
  quote_date: '',
  status: 'Pending',
};

function formatPrettyDate(iso: string | null) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-').map((x) => Number(x));
  if (!y || !m || !d) return iso;
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString(undefined, { month: 'short', day: '2-digit', year: 'numeric' });
}

const Quotations: React.FC = () => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(false);

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  // Close 3-dot menu on outside click
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

  async function loadQuotes(signal?: AbortSignal) {
    const res = await fetch(`${API_BASE}/quotations`, { signal });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    const json = await res.json();
    setQuotes(Array.isArray(json) ? (json as Quote[]) : (json?.data ?? []));
  }

  async function refresh() {
    setLoading(true);
    try {
      await loadQuotes();
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        setLoading(true);
        await loadQuotes(controller.signal);
      } catch (e) {
        if ((e as any)?.name !== 'AbortError') console.error(e);
      } finally {
        setLoading(false);
      }
    })();
    return () => controller.abort();
  }, []);

  function openCreate() {
    setMode('create');
    setEditingId(null);
    setForm({ ...emptyForm });
    setIsModalOpen(true);
    setOpenMenuId(null);
  }

  function openEdit(q: Quote) {
    setMode('edit');
    setEditingId(q.id);
    setForm({
      quote_number: q.number,
      customer: q.customer,
      currency: q.currency || 'LKR',
      amount: String(q.amount ?? 0),
      quote_date: q.date ?? '',
      status: q.status,
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

      const payloadCreate = {
        quote_number: form.quote_number.trim() || null, // backend generates if null
        customer: form.customer.trim(),
        currency: form.currency.trim() || 'LKR',
        amount: Number(form.amount || 0),
        quote_date: form.quote_date.trim() || null,
        status: form.status,
      };

      if (!payloadCreate.customer) {
        alert('Customer name is required');
        return;
      }

      if (Number.isNaN(payloadCreate.amount) || payloadCreate.amount < 0) {
        alert('Amount must be 0 or more');
        return;
      }

      if (mode === 'create') {
        const res = await fetch(`${API_BASE}/quotations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payloadCreate),
        });
        if (!res.ok) throw new Error(`Create failed: ${res.status}`);
      } else {
        // update requires quote_number
        const res = await fetch(`${API_BASE}/quotations/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            quote_number: form.quote_number.trim(),
            customer: payloadCreate.customer,
            currency: payloadCreate.currency,
            amount: payloadCreate.amount,
            quote_date: payloadCreate.quote_date,
            status: payloadCreate.status,
          }),
        });
        if (!res.ok) throw new Error(`Update failed: ${res.status}`);
      }

      closeModal();
      await refresh();
    } catch (e) {
      console.error(e);
      alert('Save failed. Check backend / network tab.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    const ok = confirm('Delete this estimate?');
    if (!ok) return;

    try {
      setOpenMenuId(null);
      const res = await fetch(`${API_BASE}/quotations/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
      await refresh();
    } catch (e) {
      console.error(e);
      alert('Delete failed. Check backend / network tab.');
    }
  }

  // ✅ Convert: mark quotation as converted (only if Approved)
  async function handleConvert(id: string) {
    try {
      const res = await fetch(`${API_BASE}/quotations/${id}/convert`, { method: 'POST' });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || `Convert failed: ${res.status}`);
      }
      await refresh();
    } catch (e) {
      console.error(e);
      alert('Convert failed. Only Approved quotations can be converted.');
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="bg-white rounded-[2.5rem] border border-[#F1F3FF] overflow-hidden mindskills-shadow">
        <div className="p-8 border-b border-[#F1F3FF] flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-black text-[#2F2F2F] tracking-tight">Estimates Vault</h2>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-1">
              Proposal history and conversion tracking
            </p>
          </div>

          <button
            onClick={openCreate}
            className="flex items-center gap-3 bg-[#4B49AC] text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-[#4B49AC]/20 hover:-translate-y-0.5 transition-all shrink-0"
          >
            <Send size={18} />
            New Estimate
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#7978E9] text-white">
                <th className="px-10 py-6 text-[11px] font-black uppercase tracking-[0.2em]">Quote Reference</th>
                <th className="px-10 py-6 text-[11px] font-black uppercase tracking-[0.2em]">Customer Entity</th>
                <th className="px-10 py-6 text-[11px] font-black uppercase tracking-[0.2em]">Projected Value</th>
                <th className="px-10 py-6 text-[11px] font-black uppercase tracking-[0.2em]">Date</th>
                <th className="px-10 py-6 text-[11px] font-black uppercase tracking-[0.2em]">State</th>
                <th className="px-10 py-6 text-right text-[11px] font-black uppercase tracking-[0.2em]">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#F1F3FF]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-10 py-10 text-sm font-black text-slate-400">
                    Loading estimates...
                  </td>
                </tr>
              ) : quotes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-10 py-10 text-sm font-black text-slate-400">
                    No estimates found.
                  </td>
                </tr>
              ) : (
                quotes.map((quote) => (
                  <tr key={quote.id} className="hover:bg-[#F5F7FF] transition-colors group">
                    <td className="px-10 py-7">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-[#F1F3FF] text-[#4B49AC] rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                          <FileBadge size={18} />
                        </div>
                        <span className="text-xs font-black text-slate-800 tracking-tight">{quote.number}</span>
                      </div>
                    </td>

                    <td className="px-10 py-7">
                      <span className="text-xs font-bold text-slate-600">{quote.customer}</span>
                    </td>

                    <td className="px-10 py-7">
                      <span className="text-sm font-black text-[#4B49AC]">
                        {quote.currency} {Number(quote.amount ?? 0).toLocaleString()}
                      </span>
                    </td>

                    <td className="px-10 py-7 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                      {formatPrettyDate(quote.date)}
                    </td>

                    <td className="px-10 py-7">
                      {quote.status === 'Approved' ? (
                        <span className="px-4 py-1.5 bg-[#E0F9FA] text-[#4BDBE2] text-[9px] font-black uppercase tracking-widest rounded-xl border border-[#4BDBE2]/10 flex items-center gap-1.5 w-fit">
                          <CheckCircle size={12} /> Approved
                        </span>
                      ) : quote.status === 'Rejected' ? (
                        <span className="px-4 py-1.5 bg-[#FFF1F2] text-[#E11D48] text-[9px] font-black uppercase tracking-widest rounded-xl border border-[#E11D48]/10 flex items-center gap-1.5 w-fit">
                          <XCircle size={12} /> Rejected
                        </span>
                      ) : (
                        <span className="px-4 py-1.5 bg-[#F5F7FF] text-[#4B49AC] text-[9px] font-black uppercase tracking-widest rounded-xl border border-[#4B49AC]/10 flex items-center gap-1.5 w-fit">
                          <Clock size={12} /> Pending
                        </span>
                      )}
                    </td>

                    <td className="px-10 py-7 text-right">
                      <div className="flex items-center justify-end gap-3 relative" data-menu-root="true">
                        {/* ✅ Convert logic */}
                        {quote.status === 'Approved' && !quote.converted ? (
                          <button
                            onClick={() => handleConvert(quote.id)}
                            className="bg-[#4BDBE2] text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 shadow-lg shadow-[#4BDBE2]/20 transition-all flex items-center gap-2"
                          >
                            <FileText size={12} /> Convert
                          </button>
                        ) : quote.converted ? (
                          <span className="px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-[#F5F7FF] text-[#4B49AC] border border-[#4B49AC]/10">
                            Converted
                          </span>
                        ) : null}

                        <button
                          onClick={() => setOpenMenuId((prev) => (prev === quote.id ? null : quote.id))}
                          className="p-3 bg-white border border-[#F1F3FF] text-slate-300 hover:text-slate-600 rounded-xl"
                        >
                          <MoreVertical size={16} />
                        </button>

                        {openMenuId === quote.id && (
                          <div className="absolute right-0 top-14 w-44 bg-white border border-[#F1F3FF] rounded-2xl shadow-xl overflow-hidden z-50">
                            <button
                              onClick={() => openEdit(quote)}
                              className="w-full text-left px-5 py-3 text-xs font-black text-slate-700 hover:bg-[#F5F7FF]"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(quote.id)}
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
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-[999]" onClick={closeModal}>
          <div
            className="w-full max-w-xl bg-white rounded-[2rem] border border-[#F1F3FF] shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-8 border-b border-[#F1F3FF]">
              <h3 className="text-lg font-black text-slate-800">{mode === 'create' ? 'New Estimate' : 'Edit Estimate'}</h3>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-1">
                {mode === 'create' ? 'Create a new quotation' : 'Update quotation details'}
              </p>
            </div>

            <div className="p-8 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Quote Number</label>
                  <input
                    value={form.quote_number}
                    onChange={(e) => setForm((f) => ({ ...f, quote_number: e.target.value }))}
                    className="mt-2 w-full bg-[#F5F7FF] border border-[#F1F3FF] rounded-2xl px-4 py-3 text-sm font-bold outline-none"
                    placeholder="Leave empty to auto-generate"
                    disabled={mode === 'edit'}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as QuoteStatus }))}
                    className="mt-2 w-full bg-[#F5F7FF] border border-[#F1F3FF] rounded-2xl px-4 py-3 text-sm font-bold outline-none"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer</label>
                  <input
                    value={form.customer}
                    onChange={(e) => setForm((f) => ({ ...f, customer: e.target.value }))}
                    className="mt-2 w-full bg-[#F5F7FF] border border-[#F1F3FF] rounded-2xl px-4 py-3 text-sm font-bold outline-none"
                    placeholder="Customer name"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Currency</label>
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
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</label>
                  <input
                    type="number"
                    min={0}
                    value={form.amount}
                    onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                    className="mt-2 w-full bg-[#F5F7FF] border border-[#F1F3FF] rounded-2xl px-4 py-3 text-sm font-bold outline-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Quote Date</label>
                  <input
                    type="date"
                    value={form.quote_date}
                    onChange={(e) => setForm((f) => ({ ...f, quote_date: e.target.value }))}
                    className="mt-2 w-full bg-[#F5F7FF] border border-[#F1F3FF] rounded-2xl px-4 py-3 text-sm font-bold outline-none"
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

export default Quotations;
