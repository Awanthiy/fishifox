<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use Illuminate\Http\Request;

class RecurringInvoiceController extends Controller
{
    // GET /api/recurring-invoices
    public function index(Request $request)
    {
        $rows = Invoice::query()
            ->where('is_recurring', true)
            ->where('status', '!=', 'PAID')
            ->orderByRaw('next_run_date IS NULL, next_run_date ASC')
            ->orderByDesc('id')
            ->get();

        return response()->json($rows->map(fn (Invoice $inv) => $this->shape($inv)));
    }

    // POST /api/recurring-invoices  (Create automation / template)
    public function store(Request $request)
    {
        $data = $request->validate([
            'customer_name' => ['required', 'string', 'max:255'],
            'amount' => ['required', 'numeric', 'min:0'],
            'currency' => ['required', 'string', 'max:10'],
            'recurrence_period' => ['required', 'in:WEEKLY,MONTHLY,YEARLY'],
            'next_run_date' => ['nullable', 'date'],
        ]);

        // Create a "template" invoice row
        $inv = Invoice::create([
            'invoice_number' => $this->generateTemplateNumber(),
            'customer_name' => $data['customer_name'],
            'amount' => $data['amount'],
            'currency' => $data['currency'],
            'billing_date' => null,
            'status' => 'PENDING',
            'is_recurring' => true,
            'recurrence_period' => $data['recurrence_period'],
            'next_run_date' => $data['next_run_date'] ?? now()->toDateString(),
        ]);

        return response()->json($this->shape($inv), 201);
    }

    // PUT /api/recurring-invoices/{invoice}
    public function update(Request $request, Invoice $invoice)
    {
        if (!$invoice->is_recurring) {
            return response()->json(['message' => 'Not a recurring template'], 400);
        }

        $data = $request->validate([
            'customer_name' => ['required', 'string', 'max:255'],
            'amount' => ['required', 'numeric', 'min:0'],
            'currency' => ['required', 'string', 'max:10'],
            'recurrence_period' => ['required', 'in:WEEKLY,MONTHLY,YEARLY'],
            'next_run_date' => ['nullable', 'date'],
            'status' => ['required', 'in:PAID,PENDING,OVERDUE'],
        ]);

        $invoice->update($data);

        return response()->json($this->shape($invoice));
    }

    // DELETE /api/recurring-invoices/{invoice}
    public function destroy(Invoice $invoice)
    {
        if (!$invoice->is_recurring) {
            return response()->json(['message' => 'Not a recurring template'], 400);
        }

        $invoice->delete();
        return response()->json(['message' => 'Deleted']);
    }

    // POST /api/recurring-invoices/{invoice}/execute
    // Generate an invoice instance from template
    public function execute(Invoice $invoice)
    {
        if (!$invoice->is_recurring) {
            return response()->json(['message' => 'Not a recurring template'], 400);
        }

        if ($invoice->status === 'PAID') {
            return response()->json(['message' => 'Template is paid/closed'], 400);
        }

        $new = Invoice::create([
            'invoice_number' => $this->generateInvoiceNumber(),
            'customer_name' => $invoice->customer_name,
            'amount' => $invoice->amount,
            'currency' => $invoice->currency,
            'billing_date' => now()->toDateString(),
            'status' => 'PENDING',
            'is_recurring' => false,
            'recurrence_period' => null,
            'next_run_date' => null,
        ]);

        // Update template next run date (optional but recommended)
        $invoice->next_run_date = $this->calcNextRun($invoice->recurrence_period, $invoice->next_run_date);
        $invoice->save();

        return response()->json([
            'message' => 'Executed',
            'generated_invoice' => $this->shape($new),
            'template' => $this->shape($invoice),
        ]);
    }

    private function calcNextRun(?string $period, ?string $current): string
    {
        $base = $current ? now()->parse($current) : now();

        return match ($period) {
            'WEEKLY' => $base->addWeek()->toDateString(),
            'MONTHLY' => $base->addMonth()->toDateString(),
            'YEARLY' => $base->addYear()->toDateString(),
            default => now()->addMonth()->toDateString(),
        };
    }

    private function generateInvoiceNumber(): string
    {
        $year = now()->format('Y');
        $countThisYear = Invoice::where('invoice_number', 'like', "INV-{$year}-%")->count() + 1;
        $seq = str_pad((string) $countThisYear, 3, '0', STR_PAD_LEFT);
        return "INV-{$year}-{$seq}";
    }

    private function generateTemplateNumber(): string
    {
        $year = now()->format('Y');
        $countThisYear = Invoice::where('invoice_number', 'like', "TPL-{$year}-%")->count() + 1;
        $seq = str_pad((string) $countThisYear, 3, '0', STR_PAD_LEFT);
        return "TPL-{$year}-{$seq}";
    }

    private function shape(Invoice $inv): array
    {
        return [
            'id' => (string) $inv->id,
            'invoice_number' => $inv->invoice_number,
            'customer_name' => $inv->customer_name,
            'amount' => (float) $inv->amount,
            'currency' => $inv->currency,
            'date' => optional($inv->billing_date)->format('Y-m-d'),
            'status' => $inv->status,
            'is_recurring' => (bool) $inv->is_recurring,
            'recurrence_period' => $inv->recurrence_period,
            'next_run_date' => optional($inv->next_run_date)->format('Y-m-d'),
        ];
    }
}
