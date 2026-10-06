<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Delivery extends Model
{
    use HasFactory;

    const STATUS_PENDING    = 'pending';
    const STATUS_DISPATCHED = 'dispatched';
    const STATUS_IN_TRANSIT = 'in_transit';
    const STATUS_DELIVERED  = 'delivered';
    const STATUS_FAILED     = 'failed';
    const STATUS_RETURNED   = 'returned';

    protected $fillable = [
        'order_id',
        'consignment_id',
        'carrier',
        'status',
        'tracking_url',
        'api_response',
        'failed_reason',
        'attempt_count',
        'dispatched_at',
    ];

    protected $casts = [
        'api_response'  => 'array',
        'dispatched_at' => 'datetime',
        'attempt_count' => 'integer',
    ];

    // ─── Relationships ───────────────────────────────────────────────────────────

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────────

    public function isDispatched(): bool
    {
        return $this->status === self::STATUS_DISPATCHED;
    }

    public function hasFailed(): bool
    {
        return $this->status === self::STATUS_FAILED;
    }
}
