<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'          => $this->id,
            'name'        => $this->name,
            'sku'         => $this->sku,
            'description' => $this->description,
            'price'       => (float) $this->price,
            'stock'       => $this->stock,
            'status'      => $this->status,
            'image_url'   => $this->image_url,
            'in_stock'    => $this->stock > 0,
            'created_at'  => $this->created_at?->toISOString(),
            'updated_at'  => $this->updated_at?->toISOString(),
        ];
    }
}
