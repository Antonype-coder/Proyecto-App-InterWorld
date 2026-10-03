<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/env.php';
require_once __DIR__ . '/../core/Response.php';

if (!class_exists('CorsMiddleware')) {
    class CorsMiddleware
    {
        public static function handle(): void
        {
            $allowed = tienda_env('CORS_ALLOWED_ORIGINS', '*');
            $origin  = $_SERVER['HTTP_ORIGIN'] ?? '';

            if ($allowed === '*') {
                header('Access-Control-Allow-Origin: *');
            } elseif ($origin !== '') {
                $list = array_map('trim', explode(',', $allowed));
                if (in_array($origin, $list, true)) {
                    header('Access-Control-Allow-Origin: ' . $origin);
                    header('Vary: Origin');
                }
            }

            header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
            header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
            header('Access-Control-Max-Age: 86400');
            header('Access-Control-Allow-Credentials: true');

            if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
                http_response_code(204);
                exit;
            }
        }
    }
}