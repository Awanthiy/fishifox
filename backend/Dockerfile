FROM php:8.2-apache

# System deps + PHP extensions
RUN apt-get update && apt-get install -y \
    git unzip libpq-dev libzip-dev \
  && docker-php-ext-install pdo pdo_pgsql zip

# Apache rewrite (Laravel routes)
RUN a2enmod rewrite

WORKDIR /var/www/html
COPY . .

# Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
RUN composer install --no-dev --optimize-autoloader

# Permissions
RUN chown -R www-data:www-data storage bootstrap/cache

# Point Apache to /public
RUN sed -i 's!/var/www/html!/var/www/html/public!g' /etc/apache2/sites-available/000-default.conf

EXPOSE 80