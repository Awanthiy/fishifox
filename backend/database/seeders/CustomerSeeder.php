<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CustomerSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('customers')->insert([
            [
                'name' => 'SoftVibe Solutions',
                'email' => 'billing@softvibe.com',
                'phone' => '+94 77 123 4567',
                'active_projects' => 3,
                'total_billed' => 'LKR 850k',
                'status' => 'Enterprise',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Global Logistics',
                'email' => 'finance@globallog.com',
                'phone' => '+94 11 999 8888',
                'active_projects' => 1,
                'total_billed' => 'LKR 1.2M',
                'status' => 'Premium',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Duro Tires Ltd',
                'email' => 'contact@durotires.lk',
                'phone' => '+94 71 444 5555',
                'active_projects' => 2,
                'total_billed' => 'LKR 45k',
                'status' => 'Regular',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Green Gardens',
                'email' => 'hello@greengardens.com',
                'phone' => '+94 70 222 1111',
                'active_projects' => 0,
                'total_billed' => 'LKR 0',
                'status' => 'New',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
