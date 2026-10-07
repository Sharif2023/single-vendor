<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);

$request = Illuminate\Http\Request::create('/api/cart/items', 'POST', ['product_id' => 5, 'quantity' => 1]);
$request->headers->set('Accept', 'application/json');

$response = $kernel->handle($request);
echo "POST Status: " . $response->getStatusCode() . "\n";
echo $response->getContent() . "\n";
