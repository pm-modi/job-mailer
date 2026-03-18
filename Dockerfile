FROM php:8.2-apache
RUN a2enmod rewrite
RUN apt-get update && apt-get install -y libzip-dev zip unzip curl \
    && docker-php-ext-install zip && rm -rf /var/lib/apt/lists/*
RUN curl -sS https://getcomposer.org/installer | php -- \
    --install-dir=/usr/local/bin --filename=composer
COPY . /var/www/html/
RUN cd /var/www/html && composer install --no-dev 2>/dev/null || true
RUN echo '<Directory /var/www/html>\nAllowOverride All\nRequire all granted\n</Directory>' \
    >> /etc/apache2/apache2.conf
RUN chown -R www-data:www-data /var/www/html
EXPOSE 80
CMD ["apache2-foreground"]