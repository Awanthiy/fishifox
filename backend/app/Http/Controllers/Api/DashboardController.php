<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $customers = DB::table('customers')->count();

        $projects = DB::table('projects')
            ->where('status', '!=', 'Completed')
            ->count();

        $totalBilledNumber = (float) DB::table('invoices')->sum('amount');

        // rating: until you create feedback module
        $rating = 4.8;

        /**
         * MONTHLY CHART
         * FIX: your table doesn't have `date`.
         * Use `created_at` which exists if your invoices table has timestamps.
         */
        $monthly = DB::table('invoices')
            ->selectRaw('DATE_FORMAT(created_at, "%b") as name, SUM(amount) as value')
            ->whereNotNull('created_at')
            ->groupByRaw('YEAR(created_at), MONTH(created_at), DATE_FORMAT(created_at, "%b")')
            ->orderByRaw('MIN(created_at) DESC')
            ->limit(6)
            ->get()
            ->reverse()
            ->values();

        if ($monthly->count() === 0) {
            $monthly = collect([
                ['name' => 'Jan', 'value' => 120],
                ['name' => 'Feb', 'value' => 180],
                ['name' => 'Mar', 'value' => 150],
                ['name' => 'Apr', 'value' => 210],
                ['name' => 'May', 'value' => 240],
                ['name' => 'Jun', 'value' => 260],
            ]);
        }

        return response()->json([
            'totalBilled' => 'LKR ' . number_format($totalBilledNumber, 0),
            'customers' => $customers,
            'projects' => $projects,
            'rating' => $rating,
            'growth' => $monthly,
        ]);
    }
}