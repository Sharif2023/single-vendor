$html = Invoke-WebRequest -Uri "https://single-vendor-bd.vercel.app" -UseBasicParsing
$scripts = [regex]::Matches($html.Content, 'src="([^"]+\.js[^"]*)"') | ForEach-Object { $_.Groups[1].Value }

$found = $false
foreach ($script in $scripts) {
    if (!$script.StartsWith("http")) {
        if ($script.StartsWith("/")) {
            $scriptUrl = "https://single-vendor-bd.vercel.app$script"
        } else {
            $scriptUrl = "https://single-vendor-bd.vercel.app/$script"
        }
    } else {
        $scriptUrl = $script
    }

    try {
        $js = Invoke-WebRequest -Uri $scriptUrl -UseBasicParsing
        if ($js.Content -match 'https://([a-zA-Z0-9.-]*onrender\.com)') {
            $apiUrl = $matches[0]
            Write-Host "Found API URL: $apiUrl"
            
            # Now let's test it!
            $cartUrl = "$apiUrl/api/cart/items"
            Write-Host "Testing Cart API: $cartUrl"
            $body = '{"product_id":5,"quantity":1}'
            
            try {
                $response = Invoke-WebRequest -Uri $cartUrl -Method Post -Body $body -ContentType "application/json" -Headers @{"Accept"="application/json"}
                Write-Host "Success! Status: $($response.StatusCode)"
                Write-Host $response.Content
            } catch {
                Write-Host "Failed! Status: $($_.Exception.Response.StatusCode.value__)"
                $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
                Write-Host $reader.ReadToEnd()
            }
            $found = $true
            break
        }
    } catch {}
}

if (!$found) {
    Write-Host "Could not find Render API URL."
}
