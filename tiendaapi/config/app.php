<?php
declare(strict_types=1);

return [
    'name'     => getenv('APP_NAME') ?: 'TiendaAdmin',
    'env'      => getenv('APP_ENV') ?: 'production',
    'debug'    => filter_var(getenv('APP_DEBUG') ?: 'false', FILTER_VALIDATE_BOOL),
    'url'      => getenv('APP_URL') ?: 'http://localhost/tiendaapi',
    'timezone' => getenv('APP_TIMEZONE') ?: 'America/Bogota',
    'locale'   => getenv('APP_LOCALE') ?: 'es',
    'version'  => '2.0.0',
];