<?php

namespace App\Console\Commands;

use App\Models\Product;
use App\Models\ProductImage;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class DownloadMissingProductImages extends Command
{
    protected $signature = 'app:download-missing-images';
    protected $description = 'Download and attach missing product images and sub-images';

    public function handle(): int
    {
        $destDir = storage_path('app/public/products');
        if (! File::exists($destDir)) {
            File::makeDirectory($destDir, 0755, true);
        }

        $imageCatalog = [
            'Nike Air Force 1' => [
                'main' => 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=1000&auto=format&fit=crop&q=80',
                'subs' => [
                    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1000&auto=format&fit=crop&q=80',
                    'https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=1000&auto=format&fit=crop&q=80',
                    'https://images.unsplash.com/photo-1552346154-21d32810aba3?w=1000&auto=format&fit=crop&q=80',
                ],
            ],
            'Clean Code' => [
                'main' => 'https://images.unsplash.com/photo-1532012164546-f432f2e3edd4?w=1000&auto=format&fit=crop&q=80',
                'subs' => [
                    'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=1000&auto=format&fit=crop&q=80',
                    'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=1000&auto=format&fit=crop&q=80',
                ],
            ],
            'Adidas Ultraboost' => [
                'main' => 'https://images.unsplash.com/photo-1587563871167-1ee9c731aefb?w=1000&auto=format&fit=crop&q=80',
                'subs' => [
                    'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=1000&auto=format&fit=crop&q=80',
                    'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=1000&auto=format&fit=crop&q=80',
                ],
            ],
            'Ninja Professional Blender' => [
                'main' => 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=1000&auto=format&fit=crop&q=80',
                'subs' => [
                    'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=1000&auto=format&fit=crop&q=80',
                    'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=1000&auto=format&fit=crop&q=80',
                ],
            ],
            'Bose SoundLink Flex' => [
                'main' => 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=1000&auto=format&fit=crop&q=80',
                'subs' => [
                    'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=1000&auto=format&fit=crop&q=80',
                    'https://images.unsplash.com/photo-1589003077984-894e133dabab?w=1000&auto=format&fit=crop&q=80',
                ],
            ],
            'Herman Miller Aeron Chair' => [
                'main' => 'https://images.unsplash.com/photo-1580481077195-c3a821a58875?w=1000&auto=format&fit=crop&q=80',
                'subs' => [
                    'https://images.unsplash.com/photo-1505797149-43b0069ec26b?w=1000&auto=format&fit=crop&q=80',
                    'https://images.unsplash.com/photo-1616464916356-3a777b2b60b1?w=1000&auto=format&fit=crop&q=80',
                ],
            ],
            'Samsung Galaxy S24' => [
                'main' => 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=1000&auto=format&fit=crop&q=80',
                'subs' => [
                    'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=1000&auto=format&fit=crop&q=80',
                    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1000&auto=format&fit=crop&q=80',
                ],
            ],
            'iPhone 15 Pro' => [
                'main' => 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=1000&auto=format&fit=crop&q=80',
                'subs' => [
                    'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=1000&auto=format&fit=crop&q=80',
                    'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=1000&auto=format&fit=crop&q=80',
                ],
            ],
            'Vitamix 5200' => [
                'main' => 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=1000&auto=format&fit=crop&q=80',
                'subs' => [
                    'https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=1000&auto=format&fit=crop&q=80',
                    'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=1000&auto=format&fit=crop&q=80',
                ],
            ],
            'Keychron Q1 Pro' => [
                'main' => 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=1000&auto=format&fit=crop&q=80',
                'subs' => [
                    'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=1000&auto=format&fit=crop&q=80',
                    'https://images.unsplash.com/photo-1595225476474-87563907a212?w=1000&auto=format&fit=crop&q=80',
                ],
            ],
            'Patagonia Better Sweater' => [
                'main' => 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=1000&auto=format&fit=crop&q=80',
                'subs' => [
                    'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=1000&auto=format&fit=crop&q=80',
                    'https://images.unsplash.com/photo-1544441893-675973e31985?w=1000&auto=format&fit=crop&q=80',
                ],
            ],
            'MacBook Pro 16' => [
                'main' => 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1000&auto=format&fit=crop&q=80',
                'subs' => [
                    'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=1000&auto=format&fit=crop&q=80',
                    'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=1000&auto=format&fit=crop&q=80',
                ],
            ],
            'Designing Data-Intensive' => [
                'main' => 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=1000&auto=format&fit=crop&q=80',
                'subs' => [
                    'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=1000&auto=format&fit=crop&q=80',
                    'https://images.unsplash.com/photo-1532012164546-f432f2e3edd4?w=1000&auto=format&fit=crop&q=80',
                ],
            ],
        ];

        $products = Product::whereNull('image_url')->get();
        $this->info("Found {$products->count()} products without images.");

        foreach ($products as $product) {
            $matchedConfig = null;
            foreach ($imageCatalog as $pattern => $config) {
                if (stripos($product->name, $pattern) !== false) {
                    $matchedConfig = $config;
                    break;
                }
            }

            if (! $matchedConfig) {
                $matchedConfig = [
                    'main' => 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1000&auto=format&fit=crop&q=80',
                    'subs' => [
                        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1000&auto=format&fit=crop&q=80',
                    ],
                ];
            }

            $cleanName = Str::slug($product->name);
            $mainFilename = "prod_{$product->id}_{$cleanName}_main.jpg";
            $mainFilePath = $destDir . DIRECTORY_SEPARATOR . $mainFilename;

            // Download main image if not exists
            if (! File::exists($mainFilePath)) {
                try {
                    $resp = Http::timeout(15)->get($matchedConfig['main']);
                    if ($resp->successful()) {
                        File::put($mainFilePath, $resp->body());
                    }
                } catch (\Exception $e) {
                    $this->warn("Failed downloading main for #{$product->id}: " . $e->getMessage());
                }
            }

            if (File::exists($mainFilePath)) {
                $product->image_url = url("storage/products/{$mainFilename}");
                $product->status = 'active';
                $product->save();
            }

            // Sub-images
            $product->images()->delete();
            $order = 1;
            foreach ($matchedConfig['subs'] as $subIdx => $subUrl) {
                $subFilename = "prod_{$product->id}_{$cleanName}_sub_{$order}.jpg";
                $subFilePath = $destDir . DIRECTORY_SEPARATOR . $subFilename;

                if (! File::exists($subFilePath)) {
                    try {
                        $resp = Http::timeout(15)->get($subUrl);
                        if ($resp->successful()) {
                            File::put($subFilePath, $resp->body());
                        }
                    } catch (\Exception $e) {
                        $this->warn("Failed downloading sub-image: " . $e->getMessage());
                    }
                }

                if (File::exists($subFilePath)) {
                    $product->images()->create([
                        'image_url'  => url("storage/products/{$subFilename}"),
                        'order'      => $order++,
                        'is_primary' => false,
                    ]);
                }
            }

            $this->info("Product #{$product->id} ({$product->name}) updated with main + " . ($order - 1) . " sub-images.");
        }

        Cache::flush();
        $this->info("Completed! All products now have images.");
        return Command::SUCCESS;
    }
}
