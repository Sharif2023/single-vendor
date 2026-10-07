FROM php:8.4-cli-alpine

# Install system dependencies & PostgreSQL driver libraries
RUN apk add --no-cache \
    curl \
    git \
    libpq-dev \
    libzip-dev \
    zip \
    unzip \
    && docker-php-ext-install pdo pdo_pgsql bcmath pcntl

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /app

# Copy application files
COPY . .

# Install PHP dependencies
RUN composer install --no-dev --optimize-autoloader --no-interaction

# Set permissions for storage & cache
RUN chmod -R 777 storage bootstrap/cache

# Render automatically binds to the PORT environment variable (default 10000)
EXPOSE 10000

# Start script: link storage, start queue worker in background, and start server
CMD php artisan storage:link --quiet && php artisan queue:work --tries=3 & php artisan serve --host=0.0.0.0 --port=${PORT:-10000}
