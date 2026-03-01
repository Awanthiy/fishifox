<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Expiration extends Model
{
    protected $fillable = [
        'asset_name',
        'category',
        'expiry_date',
        'project_mapping',
        'asset_url',
        'reminder_sent',
    ];

    protected $casts = [
        'expiry_date' => 'date',
        'reminder_sent' => 'boolean',
    ];
}
