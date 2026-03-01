<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Quotation extends Model
{
    use HasFactory;

    protected $fillable = [
        'quote_number',
        'customer',
        'amount',
        'currency',
        'quote_date',
        'status',
        'converted',
        'converted_at',
    ];

    protected $casts = [
        'quote_date' => 'date',
        'converted' => 'boolean',
        'converted_at' => 'datetime',
    ];
}
