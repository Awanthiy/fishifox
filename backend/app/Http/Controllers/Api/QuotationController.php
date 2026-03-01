<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Quotation;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class QuotationController extends Controller
{
    // GET /api/quotations?search=
    public function index(Request $request)
    {
        $search = trim((string) $request->query('search', ''));

        $q = Quotation::query()->orderByDesc('id');

        if ($search !== '') {
            $q->where(function ($qq) use ($search) {
                $qq->where('quote_number', 'like', "%{$search}%")
                   ->orWhere('customer', 'like', "%{$search}%");
            });
        }

        return response()->json(
            $q->get()->map(fn (Quotation $x) => [
                'id' => (string) $x->id,
                'number' => $x->quote_number,
                'customer' => $x->customer,
                'amount' => (float) $x->amount,
                'currency' => $x->currency,
                'status' => $x->status,
                'date' => optional($x->quote_date)->format('Y-m-d'), // frontend formats
                'converted' => (bool) $x->converted,
            ])
        );
    }

    // POST /api/quotations
    public function store(Request $request)
    {
        $data = $request->validate([
            'quote_number' => ['nullable', 'string', 'max:50'],
            'customer' => ['required', 'string', 'max:255'],
            'amount' => ['required', 'numeric', 'min:0'],
            'currency' => ['required', 'string', 'max:10'],
            'quote_date' => ['nullable', 'date'],
            'status' => ['required', 'in:Pending,Approved,Rejected'],
        ]);

        // auto-generate number if not provided
        if (empty($data['quote_number'])) {
            $data['quote_number'] = $this->generateQuoteNumber();
        }

        $q = Quotation::create($data);

        return response()->json([
            'id' => (string) $q->id,
            'number' => $q->quote_number,
            'customer' => $q->customer,
            'amount' => (float) $q->amount,
            'currency' => $q->currency,
            'status' => $q->status,
            'date' => optional($q->quote_date)->format('Y-m-d'),
            'converted' => (bool) $q->converted,
        ], 201);
    }

    // PUT /api/quotations/{quotation}
    public function update(Request $request, Quotation $quotation)
    {
        $data = $request->validate([
            'quote_number' => ['required', 'string', 'max:50', 'unique:quotations,quote_number,' . $quotation->id],
            'customer' => ['required', 'string', 'max:255'],
            'amount' => ['required', 'numeric', 'min:0'],
            'currency' => ['required', 'string', 'max:10'],
            'quote_date' => ['nullable', 'date'],
            'status' => ['required', 'in:Pending,Approved,Rejected'],
        ]);

        $quotation->update($data);

        return response()->json([
            'id' => (string) $quotation->id,
            'number' => $quotation->quote_number,
            'customer' => $quotation->customer,
            'amount' => (float) $quotation->amount,
            'currency' => $quotation->currency,
            'status' => $quotation->status,
            'date' => optional($quotation->quote_date)->format('Y-m-d'),
            'converted' => (bool) $quotation->converted,
        ]);
    }

    // DELETE /api/quotations/{quotation}
    public function destroy(Quotation $quotation)
    {
        $quotation->delete();
        return response()->json(['message' => 'Deleted']);
    }

    // POST /api/quotations/{quotation}/convert
    public function convert(Quotation $quotation)
    {
        // only approved can convert
        if ($quotation->status !== 'Approved') {
            return response()->json(['message' => 'Only Approved quotations can be converted'], 422);
        }

        $quotation->update([
            'converted' => true,
            'converted_at' => now(),
        ]);

        return response()->json(['message' => 'Converted']);
    }

    private function generateQuoteNumber(): string
    {
        // Create QT-XXXX using max id + base (safe enough for small apps)
        $next = (int) (Quotation::max('id') ?? 0) + 8801;
        return 'QT-' . $next;
    }
}
