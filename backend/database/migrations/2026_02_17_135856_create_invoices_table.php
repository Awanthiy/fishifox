<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();

            $table->string('invoice_number')->unique(); // INV-2026-001
            $table->string('customer_name');

            $table->decimal('amount', 12, 2)->default(0);
            $table->string('currency', 10)->default('LKR');

            $table->date('billing_date')->nullable();

            $table->enum('status', ['PAID', 'PENDING', 'OVERDUE'])->default('PENDING');

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoices');
    }
};
