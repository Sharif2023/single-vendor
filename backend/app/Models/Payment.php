<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    use HasFactory;

    const STATUS_PENDING   = 'pending';
    const STATUS_PAID      = 'paid';
    const STATUS_FAILED    = 'failed';
    const STATUS_CANCELLED = 'cancelled';
    const STATUS_REFUNDED  = 'refunded';

    protected $fillable = [
        'order_id',
        'provider',
        'transaction_id',
        'session_key',
        'amount',
        'status',
        'raw_response',
        'paid_at',
    ];

    protected $casts = [
        'amount'       => 'decimal:2',
        'raw_response' => 'array',
        'paid_at'      => 'datetime',
    ];

    // ─── Relationships ───────────────────────────────────────────────────────────

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────────

    public function isPaid(): bool
    {
        return $this->status === self::STATUS_PAID;
    }
}
