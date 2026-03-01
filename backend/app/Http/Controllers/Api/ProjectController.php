<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ProjectController extends Controller
{
    public function index(Request $request)
    {
        $search = trim((string) $request->query('search', ''));
        $perPage = (int) $request->query('per_page', 12);
        $perPage = $perPage > 0 ? min($perPage, 50) : 12;

        $q = Project::query()->latest();

        if ($search !== '') {
            $q->where(function ($qq) use ($search) {
                $qq->where('name', 'like', "%{$search}%")
                   ->orWhere('customer_name', 'like', "%{$search}%")
                   ->orWhere('status', 'like', "%{$search}%");
            });
        }

        return response()->json($q->paginate($perPage));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'customer_name' => ['required', 'string', 'max:255'],
            'status' => ['required', Rule::in(['In Progress', 'Completed'])],
            'progress' => ['nullable', 'integer', 'min:0', 'max:100'],
        ]);

        $data['progress'] = $data['progress'] ?? 65;

        $project = Project::create($data);

        return response()->json($project, 201);
    }

    public function update(Request $request, Project $project)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'customer_name' => ['required', 'string', 'max:255'],
            'status' => ['required', Rule::in(['In Progress', 'Completed'])],
            'progress' => ['nullable', 'integer', 'min:0', 'max:100'],
        ]);

        $project->update($data);

        return response()->json($project);
    }

    public function destroy(Project $project)
    {
        $project->delete();
        return response()->json(['message' => 'Deleted']);
    }
}
