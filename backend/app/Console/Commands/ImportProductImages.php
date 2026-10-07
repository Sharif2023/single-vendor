<?php

namespace App\Console\Commands;

use App\Models\Product;
use App\Models\ProductImage;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

class ImportProductImages extends Command
{
    protected $signature = 'app:import-product-images';
    protected $description = 'Import product main images and sub-images from upload_db folder';

    public function handle(): int
    {
        $uploadDbPath = base_path('../upload_db');
        if (! File::exists($uploadDbPath)) {
            $this->error("upload_db folder not found at: {$uploadDbPath}");
            return Command::FAILURE;
        }

        $destDir = storage_path('app/public/products');
        if (! File::exists($destDir)) {
            File::makeDirectory($destDir, 0755, true);
        }

        $mappings = [
            'Anker_PowerCore' => [
                'main'    => 'Anker_PowerCore.jpg',
                'folder'  => 'Anker_PowerCore',
                'pattern' => 'Anker PowerCore%',
            ],
            'Apple_Watch_Series' => [
                'main'    => 'Apple_Watch_Series.jpg',
                'folder'  => 'Apple_Watch_Series',
                'pattern' => 'Apple Watch Series%',
            ],
            'Carhartt_Trade_Canvas_Backpack' => [
                'main'    => 'Carhartt_Trade_Canvas_Backpack.jpg',
                'folder'  => 'Carhartt_Trade_Canvas_Backpack',
                'pattern' => 'Carhartt Trade Canvas Backpack%',
            ],
            'Kindle_Paperwhite' => [
                'main'    => 'Kindle_Paperwhite.jpg',
                'folder'  => 'Kindle_Paperwhite',
                'pattern' => 'Kindle Paperwhite%',
            ],
            'KitchenAid_Artisan_Stand_Mixer' => [
                'main'    => 'KitchenAid_Artisan_Stand_Mixer.jpg',
                'folder'  => 'KitchenAid_Artisan_Stand_Mixer',
                'pattern' => 'KitchenAid Artisan Stand Mixer%',
            ],
            'LG_27_4K_UHD_Monitor' => [
                'main'    => 'LG_27_4K_UHD_Monitor.jpg',
                'folder'  => 'LG_27_4K_UHD_Monitor',
                'pattern' => 'LG 27%Monitor%',
            ],
            'Learn_C' => [
                'main'    => 'Learn_C.jpg',
                'folder'  => 'Learn_C',
                'pattern' => 'Learn C%',
            ],
            'Levi_Original_Trucker_Jacket' => [
                'main'    => 'Levi_Original_Trucker_Jacket.jpg',
                'folder'  => 'Levi_Original_Trucker_Jacket',
                'pattern' => 'Levi%Trucker Jacket%',
            ],
            'Nespresso_Vertuo_Plus' => [
                'main'    => 'Nespresso_Vertuo_Plus.jpg',
                'folder'  => 'Nespresso_Vertuo_Plus',
                'pattern' => 'Nespresso Vertuo Plus%',
            ],
            'Philips_Hue_Smart_Bulb' => [
                'main'    => 'Philips_Hue_Smart_Bulb.jpg',
                'folder'  => 'Philips_Hue_Smart_Bulb',
                'pattern' => 'Philips Hue Smart Bulb%',
            ],
        ];

        $subUploadPath = $uploadDbPath . DIRECTORY_SEPARATOR . 'sub_upload';

        foreach ($mappings as $key => $info) {
            $mainSrc = $uploadDbPath . DIRECTORY_SEPARATOR . $info['main'];
            $folderSrc = $subUploadPath . DIRECTORY_SEPARATOR . $info['folder'];

            $products = Product::where('name', 'like', $info['pattern'])->get();

            if ($products->isEmpty()) {
                $this->warn("No products matched pattern '{$info['pattern']}'");
                continue;
            }

            $mainUrl = null;
            if (File::exists($mainSrc)) {
                $ext = pathinfo($mainSrc, PATHINFO_EXTENSION);
                $mainDestFilename = "{$key}_main.{$ext}";
                File::copy($mainSrc, $destDir . DIRECTORY_SEPARATOR . $mainDestFilename);
                $mainUrl = url("storage/products/{$mainDestFilename}");
            } else {
                $this->warn("Main file {$mainSrc} not found!");
            }

            // Find sub-images
            $subImageUrls = [];
            if (File::exists($folderSrc) && File::isDirectory($folderSrc)) {
                $files = File::files($folderSrc);
                // Sort by name so image.jpg, image_1.jpg, image_2.jpg are in order
                usort($files, fn ($a, $b) => strcmp($a->getFilename(), $b->getFilename()));

                $subIndex = 1;
                foreach ($files as $file) {
                    if ($subIndex > 5) break; // max 5 sub-images
                    $ext = $file->getExtension();
                    $subDestFilename = "{$key}_sub_{$subIndex}.{$ext}";
                    File::copy($file->getPathname(), $destDir . DIRECTORY_SEPARATOR . $subDestFilename);
                    $subImageUrls[] = url("storage/products/{$subDestFilename}");
                    $subIndex++;
                }
            }

            foreach ($products as $prod) {
                if ($mainUrl) {
                    $prod->image_url = $mainUrl;
                    $prod->save();
                }

                // Remove existing sub-images and recreate
                $prod->images()->delete();

                foreach ($subImageUrls as $idx => $sUrl) {
                    $prod->images()->create([
                        'image_url'  => $sUrl,
                        'order'      => $idx + 1,
                        'is_primary' => false,
                    ]);
                }

                $this->info("Updated Product #{$prod->id} ({$prod->name}): Main image + " . count($subImageUrls) . " sub-images.");
            }
        }

        Cache::flush();
        $this->info("All product caches flushed. Import completed successfully!");
        return Command::SUCCESS;
    }
}
