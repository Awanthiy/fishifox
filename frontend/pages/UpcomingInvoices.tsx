import React, { useEffect, useState } from 'react';
import { CalendarClock, CheckCircle2, MoreVertical, Plus } from 'lucide-react';

type RecurrencePeriod = 'WEEKLY' | 'MONTHLY' | 'YEARLY';
type InvoiceStatus = 'PAID' | 'PENDING' | 'OVERDUE';

type RecurringTemplate = {
  id: string;
  invoice_number: string; // template number e.g. TPL-2026-001
  customer_name: string;
  amount: number;
  currency: string;
  status: InvoiceStatus;
  is_recurring: boolean;
  recurrence_period: RecurrencePeriod;
  next_run_date: string | null; // YYYY-MM-DD
};

const API_BASE = 'http://127.0.0.1:8000/api';
const EXECUTED_KEY = 'ff_executed_automations';

type AutomationForm = {
  customer_name: string;
  amount: string;
  currency: string;
  recurrence_period: RecurrencePeriod;
  next_run_date: string;
  status: InvoiceStatus; // only used in edit
};

type InvoiceForm = {
  customer_name: string;
  amount: string;
  currency: string;
  billing_date: string;
  status: InvoiceStatus;
};

const emptyAutomationForm: AutomationForm = {
  customer_name: '',
  amount: '0',
  currency: 'LKR',
  recurrence_period: 'MONTHLY',
  next_run_date: '',
  status: 'PENDING',
};

const emptyInvoiceForm: InvoiceForm = {
  customer_name: '',
  amount: '0',
  currency: 'LKR',
  billing_date: new Date().toISOString().slice(0, 10),
  status: 'PENDING',
};

function readExecutedSet(): Set<string> {
  try {
    const raw = localStorage.getItem(EXECUTED_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return new Set();
    return new Set(arr.map(String));
  } catch {
    return new Set();
  }
}

function writeExecutedSet(s: Set<string>) {
  try {
    localStorage.setItem(EXECUTED_KEY, JSON.stringify(Array.from(s)));
  } catch {
    // ignore
  }
}

const UpcomingInvoices: React.FC = () => {
  const [upcoming, setUpcoming] = useState<RecurringTemplate[]>([]);
  const [loading, setLoading] = useState(false);

  // 3-dots menu
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'automation' | 'invoice'>('automation');
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<string | null>(null);

  const [automationForm, setAutomationForm] = useState<AutomationForm>(emptyAutomationForm);
  const [invoiceForm, setInvoiceForm] = useState<InvoiceForm>(emptyInvoiceForm);

  const [saving, setSaving] = useState(false);

  // executed state
  const [executedIds, setExecutedIds] = useState<Set<string>>(new Set());

  // init executed from localStorage
  useEffect(() => {
    setExecutedIds(readExecutedSet());
  }, []);

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

  async function loadTemplates(signal?: AbortSignal) {
    const res = await fetch(`${API_BASE}/recurring-invoices`, { signal });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    const json = await res.json();
    setUpcoming(Array.isArray(json) ? (json as RecurringTemplate[]) : (json?.data ?? []));
  }

  async function refresh() {
    setLoading(true);
    try {
      await loadTemplates();
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        setLoading(true);
        await loadTemplates(controller.signal);
      } catch (e) {
        if ((e as any)?.name !== 'AbortError') console.error(e);
      } finally {
        setLoading(false);
      }
    })();
    return () => controller.abort();
  }, []);

  function closeModal() {
    setIsModalOpen(false);
    setSaving(false);
  }

  // ---------- OPEN MODALS ----------
  function openNewAutomation() {
    setModalType('automation');
    setMode('create');
    setEditingId(null);
    setAutomationForm(emptyAutomationForm);
    setIsModalOpen(true);
    setOpenMenuId(null);
  }

  function openEditAutomation(t: RecurringTemplate) {
    setModalType('automation');
    setMode('edit');
    setEditingId(t.id);
    setAutomationForm({
      customer_name: t.customer_name ?? '',
      amount: String(t.amount ?? 0),
      currency: t.currency ?? 'LKR',
      recurrence_period: (t.recurrence_period ?? 'MONTHLY') as RecurrencePeriod,
      next_run_date: t.next_run_date ?? '',
      status: (t.status ?? 'PENDING') as InvoiceStatus,
    });
    setIsModalOpen(true);
    setOpenMenuId(null);
  }

  function openNewInvoice() {
    setModalType('invoice');
    setMode('create');
    setEditingId(null);
    setInvoiceForm({
      ...emptyInvoiceForm,
      billing_date: new Date().toISOString().slice(0, 10),
    });
    setIsModalOpen(true);
    setOpenMenuId(null);
  }

  // ---------- API ACTIONS ----------
  async function saveAutomation() {
    const payload = {
      customer_name: automationForm.customer_name.trim(),
      amount: Number(automationForm.amount || 0),
      currency: automationForm.currency,
      recurrence_period: automationForm.recurrence_period,
      next_run_date: automationForm.next_run_date.trim() || null,
      status: automationForm.status,
    };

    if (!payload.customer_name) {
      alert('Customer name is required');
      return;
    }
    if (Number.isNaN(payload.amount) || payload.amount < 0) {
      alert('Amount must be 0 or more');
      return;
    }

    setSaving(true);
    try {
      if (mode === 'create') {
        const res = await fetch(`${API_BASE}/recurring-invoices`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customer_name: payload.customer_name,
            amount: payload.amount,
            currency: payload.currency,
            recurrence_period: payload.recurrence_period,
            next_run_date: payload.next_run_date,
          }),
        });

        if (!res.ok) {
          const t = await res.text();
          throw new Error(t || `Create failed: ${res.status}`);
        }
      } else {
        const res = await fetch(`${API_BASE}/recurring-invoices/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customer_name: payload.customer_name,
            amount: payload.amount,
            currency: payload.currency,
            recurrence_period: payload.recurrence_period,
            next_run_date: payload.next_run_date,
            status: payload.status,
          }),
        });

        if (!res.ok) {
          const t = await res.text();
          throw new Error(t || `Update failed: ${res.status}`);
        }
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

  async function saveInvoice() {
    const payload = {
      customer_name: invoiceForm.customer_name.trim(),
      amount: Number(invoiceForm.amount || 0),
      currency: invoiceForm.currency,
      billing_date: invoiceForm.billing_date.trim() || null,
      status: invoiceForm.status,
      invoice_number: null, // backend auto generates
    };

    if (!payload.customer_name) {
      alert('Customer name is required');
      return;
    }
    if (Number.isNaN(payload.amount) || payload.amount < 0) {
      alert('Amount must be 0 or more');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/invoices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `Create invoice failed: ${res.status}`);
      }

      closeModal();
      alert('Invoice created successfully.');
    } catch (e) {
      console.error(e);
      alert('Create invoice failed. Check backend / network tab.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteAutomation(id: string) {
    const ok = confirm('Delete this automation/template?');
    if (!ok) return;

    try {
      setOpenMenuId(null);
      const res = await fetch(`${API_BASE}/recurring-invoices/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `Delete failed: ${res.status}`);
      }

      // also remove executed flag for this id
      setExecutedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        writeExecutedSet(next);
        return next;
      });

      await refresh();
    } catch (e) {
      console.error(e);
      alert('Delete failed. Check backend / network tab.');
    }
  }

  async function handleExecute(templateId: string) {
    // already executed => no-op
    if (executedIds.has(templateId)) return;

    try {
      const res = await fetch(`${API_BASE}/recurring-invoices/${templateId}/execute`, { method: 'POST' });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `Execute failed: ${res.status}`);
      }

      // mark as executed (orange state)
      setExecutedIds((prev) => {
        const next = new Set(prev);
        next.add(templateId);
        writeExecutedSet(next);
        return next;
      });

      // keep row visible, just refresh next_run_date from backend
      await refresh();

      alert('Executed ✅ A new invoice was created. Check the Invoices page.');
    } catch (e) {
      console.error(e);
      alert('Execute failed. Check backend / network tab.');
    }
  }

  function onSave() {
    if (modalType === 'automation') return saveAutomation();
    return saveInvoice();
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="bg-white rounded-[2.5rem] border border-[#F1F3FF] overflow-hidden mindskills-shadow">
        <div className="p-8 border-b border-[#F1F3FF] flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-logo font-black text-[#2F2F2F] tracking-tight">Recurring Ledger</h2>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-1">
              Pending automation tasks for the next 30 days
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={openNewInvoice}
              className="flex items-center gap-3 bg-[#4B49AC] text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-[#4B49AC]/20 hover:-translate-y-0.5 transition-all shrink-0"
            >
              <Plus size={18} />
              New Invoice
            </button>

            <button
              onClick={openNewAutomation}
              className="flex items-center gap-3 bg-primary text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:opacity-90 transition-all shrink-0"
            >
              <Plus size={18} />
              New Automation
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#7978E9] text-white">
                <th className="px-10 py-6 text-[11px] font-black uppercase tracking-[0.2em]">Customer Entity</th>
                <th className="px-10 py-6 text-[11px] font-black uppercase tracking-[0.2em]">Cadence</th>
                <th className="px-10 py-6 text-[11px] font-black uppercase tracking-[0.2em]">Unit Value</th>
                <th className="px-10 py-6 text-[11px] font-black uppercase tracking-[0.2em]">Next Run</th>
                <th className="px-10 py-6 text-right text-[11px] font-black uppercase tracking-[0.2em]">Management</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#F1F3FF]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-10 py-10 text-sm font-black text-slate-400">
                    Loading automations...
                  </td>
                </tr>
              ) : (
                upcoming.map((inv) => {
                  const isExecuted = executedIds.has(inv.id);

                  return (
                    <tr key={inv.id} className="hover:bg-[#F5F7FF] transition-colors group">
                      <td className="px-10 py-7">
                        <div>
                          <p className="text-sm font-black text-slate-800 tracking-tight">{inv.customer_name}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                            Template ID: {inv.invoice_number}
                          </p>
                        </div>
                      </td>

                      <td className="px-10 py-7">
                        <span className="px-4 py-1.5 bg-[#E0F9FA] text-[#4BDBE2] rounded-xl text-[10px] font-black uppercase tracking-widest border border-[#4BDBE2]/10">
                          {inv.recurrence_period}
                        </span>
                      </td>

                      <td className="px-10 py-7">
                        <p className="text-sm font-black text-primary">
                          {inv.currency} {Number(inv.amount ?? 0).toLocaleString()}
                        </p>
                      </td>

                      <td className="px-10 py-7">
                        <div className="flex items-center gap-2">
                          <CalendarClock size={14} className="text-primary" />
                          <span className="text-[11px] text-slate-700 font-black">{inv.next_run_date || '—'}</span>
                        </div>
                      </td>

                      <td className="px-10 py-7 text-right">
                        <div className="flex items-center justify-end gap-3 relative" data-menu-root="true">
                          {/* Execute / Executed */}
                          {isExecuted ? (
                            <button
                              disabled
                              className="flex items-center gap-2 bg-[#FFB64D] text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-[#FFB64D]/20 opacity-90 cursor-not-allowed"
                              title="Already executed"
                            >
                              <CheckCircle2 size={14} />
                              Executed
                            </button>
                          ) : (
                            <button
                              onClick={() => handleExecute(inv.id)}
                              className="flex items-center gap-2 bg-[#4BDBE2] text-white hover:opacity-90 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-[#4BDBE2]/20"
                            >
                              <CheckCircle2 size={14} />
                              Execute
                            </button>
                          )}

                          <button
                            onClick={() => setOpenMenuId((p) => (p === inv.id ? null : inv.id))}
                            className="p-3 text-slate-300 hover:text-slate-600 bg-white border border-[#F1F3FF] rounded-xl"
                          >
                            <MoreVertical size={16} />
                          </button>

                          {openMenuId === inv.id && (
                            <div className="absolute right-0 top-14 w-44 bg-white border border-[#F1F3FF] rounded-2xl shadow-xl overflow-hidden z-50">
                              <button
                                onClick={() => openEditAutomation(inv)}
                                className="w-full text-left px-5 py-3 text-xs font-black text-slate-700 hover:bg-[#F5F7FF]"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteAutomation(inv.id)}
                                className="w-full text-left px-5 py-3 text-xs font-black text-red-600 hover:bg-red-50"
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {!loading && upcoming.length === 0 && (
            <div className="p-24 text-center">
              <div className="bg-[#F5F7FF] w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner">
                <CalendarClock size={40} className="text-slate-300" />
              </div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight">Queue Depleted</h3>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2">
                All scheduled tasks have been processed for the current cycle.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ---------------- MODAL ---------------- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-[999]" onClick={() => closeModal()}>
          <div
            className="w-full max-w-xl bg-white rounded-[2rem] border border-[#F1F3FF] shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-8 border-b border-[#F1F3FF]">
              <h3 className="text-lg font-black text-slate-800">
                {modalType === 'invoice' ? 'New Invoice' : mode === 'create' ? 'New Automation' : 'Edit Automation'}
              </h3>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-1">
                {modalType === 'invoice'
                  ? 'Create a new invoice record'
                  : mode === 'create'
                  ? 'Create a recurring invoice template'
                  : 'Update automation details'}
              </p>
            </div>

            <div className="p-8 space-y-5">
              {modalType === 'invoice' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer Name</label>
                    <input
                      value={invoiceForm.customer_name}
                      onChange={(e) => setInvoiceForm((f) => ({ ...f, customer_name: e.target.value }))}
                      className="mt-2 w-full bg-[#F5F7FF] border border-[#F1F3FF] rounded-2xl px-4 py-3 text-sm font-bold outline-none"
                      placeholder="Customer"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Currency</label>
                    <select
                      value={invoiceForm.currency}
                      onChange={(e) => setInvoiceForm((f) => ({ ...f, currency: e.target.value }))}
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
                      value={invoiceForm.amount}
                      onChange={(e) => setInvoiceForm((f) => ({ ...f, amount: e.target.value }))}
                      className="mt-2 w-full bg-[#F5F7FF] border border-[#F1F3FF] rounded-2xl px-4 py-3 text-sm font-bold outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Billing Date</label>
                    <input
                      type="date"
                      value={invoiceForm.billing_date}
                      onChange={(e) => setInvoiceForm((f) => ({ ...f, billing_date: e.target.value }))}
                      className="mt-2 w-full bg-[#F5F7FF] border border-[#F1F3FF] rounded-2xl px-4 py-3 text-sm font-bold outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</label>
                    <select
                      value={invoiceForm.status}
                      onChange={(e) => setInvoiceForm((f) => ({ ...f, status: e.target.value as InvoiceStatus }))}
                      className="mt-2 w-full bg-[#F5F7FF] border border-[#F1F3FF] rounded-2xl px-4 py-3 text-sm font-bold outline-none"
                    >
                      <option value="PENDING">PENDING</option>
                      <option value="OVERDUE">OVERDUE</option>
                      <option value="PAID">PAID</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer Name</label>
                    <input
                      value={automationForm.customer_name}
                      onChange={(e) => setAutomationForm((f) => ({ ...f, customer_name: e.target.value }))}
                      className="mt-2 w-full bg-[#F5F7FF] border border-[#F1F3FF] rounded-2xl px-4 py-3 text-sm font-bold outline-none"
                      placeholder="Customer"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Currency</label>
                    <select
                      value={automationForm.currency}
                      onChange={(e) => setAutomationForm((f) => ({ ...f, currency: e.target.value }))}
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
                      value={automationForm.amount}
                      onChange={(e) => setAutomationForm((f) => ({ ...f, amount: e.target.value }))}
                      className="mt-2 w-full bg-[#F5F7FF] border border-[#F1F3FF] rounded-2xl px-4 py-3 text-sm font-bold outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cadence</label>
                    <select
                      value={automationForm.recurrence_period}
                      onChange={(e) =>
                        setAutomationForm((f) => ({ ...f, recurrence_period: e.target.value as RecurrencePeriod }))
                      }
                      className="mt-2 w-full bg-[#F5F7FF] border border-[#F1F3FF] rounded-2xl px-4 py-3 text-sm font-bold outline-none"
                    >
                      <option value="WEEKLY">WEEKLY</option>
                      <option value="MONTHLY">MONTHLY</option>
                      <option value="YEARLY">YEARLY</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Next Run Date</label>
                    <input
                      type="date"
                      value={automationForm.next_run_date}
                      onChange={(e) => setAutomationForm((f) => ({ ...f, next_run_date: e.target.value }))}
                      className="mt-2 w-full bg-[#F5F7FF] border border-[#F1F3FF] rounded-2xl px-4 py-3 text-sm font-bold outline-none"
                    />
                  </div>

                  {mode === 'edit' && (
                    <div className="md:col-span-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</label>
                      <select
                        value={automationForm.status}
                        onChange={(e) => setAutomationForm((f) => ({ ...f, status: e.target.value as InvoiceStatus }))}
                        className="mt-2 w-full bg-[#F5F7FF] border border-[#F1F3FF] rounded-2xl px-4 py-3 text-sm font-bold outline-none"
                      >
                        <option value="PENDING">PENDING</option>
                        <option value="OVERDUE">OVERDUE</option>
                        <option value="PAID">PAID</option>
                      </select>
                    </div>
                  )}
                </div>
              )}
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
                onClick={() => onSave()}
                className="px-8 py-3 rounded-2xl bg-[#4B49AC] text-white text-[11px] font-black uppercase tracking-widest shadow-xl shadow-[#4B49AC]/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : mode === 'edit' ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UpcomingInvoices;
