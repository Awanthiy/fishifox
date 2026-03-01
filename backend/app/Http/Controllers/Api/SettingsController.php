<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Profile;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class SettingsController extends Controller
{
    private string $appearanceKey = 'appearance';

    private function defaultAppearance(): array
    {
        return [
            'theme' => 'system',        // system|light|dark
            'accent' => 'purple',       // purple|teal|slate
            'reduced_motion' => false,  // boolean
        ];
    }

    private function defaultProfile(): array
    {
        return [
            'name' => 'Felix Tondura',
            'email' => 'felix@fishifox.com',
            'role' => 'Administrator',
            'avatar_seed' => 'Felix',
            'avatar_url' => null,
        ];
    }

    public function index()
    {
        $profile = Profile::query()->first();
        if (!$profile) {
            $profile = Profile::create($this->defaultProfile());
        }

        $appearanceRow = Setting::query()->where('key', $this->appearanceKey)->first();
        $appearance = $appearanceRow?->value ?? $this->defaultAppearance();

        return response()->json([
            'profile' => [
                'name' => $profile->name,
                'email' => $profile->email,
                'role' => $profile->role,
                'avatar_seed' => $profile->avatar_seed ?? $profile->name,
                'avatar_url' => $profile->avatar_url,
            ],
            'appearance' => [
                'theme' => $appearance['theme'] ?? 'system',
                'accent' => $appearance['accent'] ?? 'purple',
                'reduced_motion' => (bool)($appearance['reduced_motion'] ?? false),
            ],
        ]);
    }

    public function updateProfile(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'avatar_seed' => ['nullable', 'string', 'max:255'],
        ]);

        $profile = Profile::query()->first();
        if (!$profile) {
            $profile = Profile::create(array_merge($this->defaultProfile(), $data));
        } else {
            $profile->update($data);
        }

        return response()->json([
            'name' => $profile->name,
            'email' => $profile->email,
            'role' => $profile->role,
            'avatar_seed' => $profile->avatar_seed ?? $profile->name,
            'avatar_url' => $profile->avatar_url,
        ]);
    }

    public function updateAppearance(Request $request)
    {
        $data = $request->validate([
            'theme' => ['required', 'in:system,light,dark'],
            'accent' => ['required', 'in:purple,teal,slate'],
            'reduced_motion' => ['required', 'boolean'],
        ]);

        $row = Setting::query()->updateOrCreate(
            ['key' => $this->appearanceKey],
            ['value' => $data]
        );

        return response()->json($row->value);
    }

    // ✅ Upload avatar (Windows/XAMPP safe)
    public function uploadAvatar(Request $request)
    {
        $request->validate([
            'avatar' => ['required', 'file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
        ]);

        $profile = Profile::query()->first();
        if (!$profile) {
            $profile = Profile::create($this->defaultProfile());
        }

        $dir = public_path('uploads/avatars');
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        // delete old avatar if stored here
        if ($profile->avatar_url && str_contains($profile->avatar_url, '/uploads/avatars/')) {
            $oldName = basename($profile->avatar_url);
            $oldPath = public_path('uploads/avatars/' . $oldName);
            if (file_exists($oldPath)) @unlink($oldPath);
        }

        $file = $request->file('avatar');
        $filename = Str::uuid()->toString() . '.' . $file->getClientOriginalExtension();
        $file->move($dir, $filename);

        $profile->avatar_url = url('/uploads/avatars/' . $filename);
        $profile->save();

        return response()->json([
            'avatar_url' => $profile->avatar_url,
        ]);
    }
}
