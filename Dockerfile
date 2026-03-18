FROM php:8.2-cli

RUN apt-get update && apt-get install -y libzip-dev zip unzip curl \
    && docker-php-ext-install zip \
    && rm -rf /var/lib/apt/lists/*

RUN curl -sS https://getcomposer.org/installer | php -- \
    --install-dir=/usr/local/bin --filename=composer

WORKDIR /var/www/html

COPY . /var/www/html/

RUN composer install --no-dev 2>/dev/null || true
RUN mkdir -p /var/www/html/data/runtime
RUN chown -R www-data:www-data /var/www/html

EXPOSE 8080

CMD sh -c "php -S 0.0.0.0:${PORT:-8080} -t /var/www/html"
