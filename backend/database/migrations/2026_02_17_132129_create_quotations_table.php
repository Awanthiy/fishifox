<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('quotations', function (Blueprint $table) {
            $table->id();

            $table->string('quote_number')->unique();  // QT-8801
            $table->string('customer');               // "SoftVibe Solutions"

            $table->decimal('amount', 12, 2)->default(0);
            $table->string('currency', 10)->default('LKR'); // LKR / USD

            $table->date('quote_date')->nullable();

            $table->enum('status', ['Pending', 'Approved', 'Rejected'])->default('Pending');

            // optional tracking
            $table->boolean('converted')->default(false);
            $table->timestamp('converted_at')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quotations');
    }
};
