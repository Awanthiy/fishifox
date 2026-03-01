<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Invoice extends Model
{
    use HasFactory;

    protected $fillable = [
        'invoice_number',
        'customer_name',
        'amount',
        'currency',
        'billing_date',
        'status',
        'is_recurring',
        'recurrence_period',
        'next_run_date',
    ];

    protected $casts = [
        'billing_date' => 'date',
        'next_run_date' => 'date',
        'is_recurring' => 'boolean',
    ];
}
