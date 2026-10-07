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
            'images'      => ($this->images ?? collect())->map(fn ($img) => [
                'id'         => $img->id,
                'product_id' => $img->product_id,
                'image_url'  => $img->image_url,
                'order'      => $img->order,
                'is_primary' => (bool) $img->is_primary,
            ]),
            'in_stock'    => $this->stock > 0,
            'created_at'  => $this->created_at?->toISOString(),
            'updated_at'  => $this->updated_at?->toISOString(),
        ];
    }
}
