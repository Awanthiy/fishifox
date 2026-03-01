<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\ServiceController;
use App\Http\Controllers\Api\QuotationController;
use App\Http\Controllers\Api\InvoiceController;
use App\Http\Controllers\Api\ProjectController;
use App\Http\Controllers\Api\ExpirationController;
use App\Http\Controllers\Api\SettingsController;
use App\Http\Controllers\Api\RecurringInvoiceController;

 
use App\Http\Controllers\Api\DashboardController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
| All routes here automatically get /api prefix
| Example: GET /api/customers
*/


Route::get('/dashboard', [DashboardController::class, 'index']);

// Customers
Route::get('/customers', [CustomerController::class, 'index']);
Route::post('/customers', [CustomerController::class, 'store']);
Route::put('/customers/{id}', [CustomerController::class, 'update']);
Route::delete('/customers/{id}', [CustomerController::class, 'destroy']);

// Services
Route::get('/services', [ServiceController::class, 'index']);
Route::post('/services', [ServiceController::class, 'store']);
Route::put('/services/{id}', [ServiceController::class, 'update']);
Route::delete('/services/{id}', [ServiceController::class, 'destroy']);

// Quotations
Route::get('/quotations', [QuotationController::class, 'index']);
Route::post('/quotations', [QuotationController::class, 'store']);
Route::put('/quotations/{id}', [QuotationController::class, 'update']);
Route::delete('/quotations/{id}', [QuotationController::class, 'destroy']);
Route::post('/quotations/{id}/convert', [QuotationController::class, 'convert']); // convert → invoice

// Invoices
Route::get('/invoices', [InvoiceController::class, 'index']);
Route::post('/invoices', [InvoiceController::class, 'store']);
Route::put('/invoices/{id}', [InvoiceController::class, 'update']);
Route::delete('/invoices/{id}', [InvoiceController::class, 'destroy']);

// Projects
Route::get('/projects', [ProjectController::class, 'index']);
Route::post('/projects', [ProjectController::class, 'store']);
Route::put('/projects/{id}', [ProjectController::class, 'update']);
Route::delete('/projects/{id}', [ProjectController::class, 'destroy']);

// Expirations
Route::get('/expirations', [ExpirationController::class, 'index']);
Route::post('/expirations', [ExpirationController::class, 'store']);
Route::put('/expirations/{id}', [ExpirationController::class, 'update']);
Route::delete('/expirations/{id}', [ExpirationController::class, 'destroy']);

// Recurring Invoices (Automations)
Route::get('/recurring-invoices', [RecurringInvoiceController::class, 'index']);
Route::post('/recurring-invoices', [RecurringInvoiceController::class, 'store']);
Route::put('/recurring-invoices/{id}', [RecurringInvoiceController::class, 'update']);
Route::delete('/recurring-invoices/{id}', [RecurringInvoiceController::class, 'destroy']);

// Settings
Route::get('/settings', [SettingsController::class, 'index']);
Route::put('/settings/profile', [SettingsController::class, 'updateProfile']);
Route::post('/settings/profile/avatar', [SettingsController::class, 'uploadAvatar']);
Route::put('/settings/appearance', [SettingsController::class, 'updateAppearance']);