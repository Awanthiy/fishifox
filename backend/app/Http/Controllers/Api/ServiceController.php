<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Service;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ServiceController extends Controller
{
    // GET /api/services?search=
    public function index(Request $request)
    {
        $search = trim((string) $request->query('search', ''));

        $q = Service::query()->orderByDesc('id');

        if ($search !== '') {
            $q->where('name', 'like', "%{$search}%");
        }

        return response()->json(
            $q->get()->map(fn (Service $s) => [
                'id' => (string) $s->id,
                'name' => $s->name,
                'price' => (float) $s->price,
                'cost' => (float) $s->cost,
                'currency' => $s->currency,
                'time' => $s->time,
                'icon' => $s->icon,
            ])
        );
    }

    // POST /api/services
    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'price' => ['required', 'numeric', 'min:0'],
            'cost' => ['required', 'numeric', 'min:0'],
            'currency' => ['required', 'string', 'max:10'],
            'time' => ['nullable', 'string', 'max:50'],
            'icon' => ['nullable', 'string', 'max:20'],
        ]);

        $s = Service::create($data);

        return response()->json([
            'id' => (string) $s->id,
            'name' => $s->name,
            'price' => (float) $s->price,
            'cost' => (float) $s->cost,
            'currency' => $s->currency,
            'time' => $s->time,
            'icon' => $s->icon,
        ], 201);
    }

    // PUT /api/services/{service}
    public function update(Request $request, Service $service)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'price' => ['required', 'numeric', 'min:0'],
            'cost' => ['required', 'numeric', 'min:0'],
            'currency' => ['required', 'string', 'max:10'],
            'time' => ['nullable', 'string', 'max:50'],
            'icon' => ['nullable', 'string', 'max:20'],
        ]);

        $service->update($data);

        return response()->json([
            'id' => (string) $service->id,
            'name' => $service->name,
            'price' => (float) $service->price,
            'cost' => (float) $service->cost,
            'currency' => $service->currency,
            'time' => $service->time,
            'icon' => $service->icon,
        ]);
    }

    // DELETE /api/services/{service}
    public function destroy(Service $service)
    {
        $service->delete();
        return response()->json(['message' => 'Deleted']);
    }
}
