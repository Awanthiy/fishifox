<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('expirations', function (Blueprint $table) {
            $table->id();
            $table->string('asset_name');                 // fishifox.com
            $table->enum('category', ['DOMAIN', 'SSL', 'HOSTING', 'OTHER'])->default('OTHER');
            $table->date('expiry_date');                  // 2024-03-25
            $table->string('project_mapping')->nullable(); // "Internal Ops"
            $table->string('asset_url')->nullable();      // optional: https://fishifox.com
            $table->boolean('reminder_sent')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('expirations');
    }
};
