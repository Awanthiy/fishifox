<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Expiration;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Carbon\Carbon;

class ExpirationController extends Controller
{
    public function index(Request $request)
    {
        $search = trim((string) $request->query('search', ''));
        $perPage = (int) $request->query('per_page', 20);
        $perPage = $perPage > 0 ? min($perPage, 50) : 20;

        $q = Expiration::query()->orderBy('expiry_date', 'asc');

        if ($search !== '') {
            $q->where(function ($qq) use ($search) {
                $qq->where('asset_name', 'like', "%{$search}%")
                   ->orWhere('project_mapping', 'like', "%{$search}%")
                   ->orWhere('category', 'like', "%{$search}%");
            });
        }

        // return extra computed fields (days_left + formatted_date)
        $paginated = $q->paginate($perPage);
        $paginated->getCollection()->transform(function ($row) {
            $daysLeft = Carbon::today()->diffInDays($row->expiry_date, false);
            return [
                'id' => (string) $row->id,
                'asset_name' => $row->asset_name,
                'category' => $row->category,
                'expiry_date' => $row->expiry_date->format('Y-m-d'),
                'expiry_label' => $row->expiry_date->format('d M Y'),
                'project_mapping' => $row->project_mapping,
                'asset_url' => $row->asset_url,
                'reminder_sent' => (bool) $row->reminder_sent,
                'days_left' => $daysLeft,
                'urgent' => $daysLeft <= 7,
            ];
        });

        return response()->json($paginated);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'asset_name' => ['required', 'string', 'max:255'],
            'category' => ['required', Rule::in(['DOMAIN', 'SSL', 'HOSTING', 'OTHER'])],
            'expiry_date' => ['required', 'date'],
            'project_mapping' => ['nullable', 'string', 'max:255'],
            'asset_url' => ['nullable', 'string', 'max:255'],
        ]);

        $row = Expiration::create([
            'asset_name' => $data['asset_name'],
            'category' => $data['category'],
            'expiry_date' => $data['expiry_date'],
            'project_mapping' => $data['project_mapping'] ?? null,
            'asset_url' => $data['asset_url'] ?? null,
            'reminder_sent' => false,
        ]);

        return response()->json($row, 201);
    }

    public function update(Request $request, Expiration $expiration)
    {
        $data = $request->validate([
            'asset_name' => ['required', 'string', 'max:255'],
            'category' => ['required', Rule::in(['DOMAIN', 'SSL', 'HOSTING', 'OTHER'])],
            'expiry_date' => ['required', 'date'],
            'project_mapping' => ['nullable', 'string', 'max:255'],
            'asset_url' => ['nullable', 'string', 'max:255'],
            'reminder_sent' => ['nullable', 'boolean'],
        ]);

        $expiration->update($data);

        return response()->json($expiration);
    }

    public function destroy(Expiration $expiration)
    {
        $expiration->delete();
        return response()->json(['message' => 'Deleted']);
    }

    // optional: mark reminder sent
    public function remind(Expiration $expiration)
    {
        $expiration->update(['reminder_sent' => true]);
        return response()->json(['message' => 'Reminder marked as sent']);
    }
}
