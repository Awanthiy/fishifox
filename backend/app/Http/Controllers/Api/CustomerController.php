<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CustomerController extends Controller
{
    // GET /api/customers?search=
    public function index(Request $request)
    {
        $search = trim((string) $request->query('search', ''));

        $q = Customer::query()->orderByDesc('id');

        if ($search !== '') {
            $q->where(function ($sub) use ($search) {
                $sub->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        // return ARRAY (frontend will handle)
        return response()->json(
            $q->get()->map(function (Customer $c) {
                return [
                    'id' => (string) $c->id,
                    'name' => $c->name,
                    'email' => $c->email,
                    'phone' => $c->phone,
                    'activeProjects' => (int) $c->active_projects,
                    'status' => $c->status,
                ];
            })
        );
    }

    // POST /api/customers
    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'activeProjects' => ['nullable', 'integer', 'min:0'],
            'status' => ['required', Rule::in(['Enterprise', 'Premium', 'Regular', 'New'])],
        ]);

        $c = Customer::create([
            'name' => $data['name'],
            'email' => $data['email'] ?? null,
            'phone' => $data['phone'] ?? null,
            'active_projects' => $data['activeProjects'] ?? 0,
            'status' => $data['status'],
        ]);

        return response()->json([
            'id' => (string) $c->id,
            'name' => $c->name,
            'email' => $c->email,
            'phone' => $c->phone,
            'activeProjects' => (int) $c->active_projects,
            'status' => $c->status,
        ], 201);
    }

    // PUT /api/customers/{customer}
    public function update(Request $request, Customer $customer)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'activeProjects' => ['nullable', 'integer', 'min:0'],
            'status' => ['required', Rule::in(['Enterprise', 'Premium', 'Regular', 'New'])],
        ]);

        $customer->update([
            'name' => $data['name'],
            'email' => $data['email'] ?? null,
            'phone' => $data['phone'] ?? null,
            'active_projects' => $data['activeProjects'] ?? 0,
            'status' => $data['status'],
        ]);

        return response()->json([
            'id' => (string) $customer->id,
            'name' => $customer->name,
            'email' => $customer->email,
            'phone' => $customer->phone,
            'activeProjects' => (int) $customer->active_projects,
            'status' => $customer->status,
        ]);
    }

    // DELETE /api/customers/{customer}
    public function destroy(Customer $customer)
    {
        $customer->delete();
        return response()->json(['message' => 'Deleted']);
    }
}
