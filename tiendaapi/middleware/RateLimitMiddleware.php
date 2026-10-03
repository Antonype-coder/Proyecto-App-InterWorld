<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/env.php';
require_once __DIR__ . '/../core/Response.php';

if (!class_exists('RateLimitMiddleware')) {
    class RateLimitMiddleware
    {
        public static function login(Request $request): void
        {
            $max    = (int) tienda_env('RATE_LIMIT_LOGIN_MAX', 10);
            $window = (int) tienda_env('RATE_LIMIT_LOGIN_WINDOW', 300);

            $key = self::key('login', $request->ip());
            $data = self::get($key);

            if ($data['count'] >= $max && (time() - $data['start']) < $window) {
                $retry = $window - (time() - $data['start']);
                header('Retry-After: ' . max(1, $retry));
                Response::tooManyRequests(
                    'Demasiados intentos. Intenta de nuevo en ' . ceil($retry / 60) . ' minutos.'
                );
            }

            if ((time() - $data['start']) >= $window) {
                $data = ['count' => 0, 'start' => time()];
            }

            $data['count']++;
            self::set($key, $data);
        }

        private static function key(string $prefix, string $ip): string
        {
            return $prefix . ':' . md5($ip);
        }

        private static function get(string $key): array
        {
            $dir = dirname(__DIR__) . '/storage/cache';
            if (!is_dir($dir)) @mkdir($dir, 0775, true);
            $file = $dir . '/' . $key . '.json';

            if (!is_file($file)) {
                return ['count' => 0, 'start' => time()];
            }

            $content = file_get_contents($file);
            $data = json_decode($content, true);
            return is_array($data) ? $data : ['count' => 0, 'start' => time()];
        }

        private static function set(string $key, array $data): void
        {
            $dir = dirname(__DIR__) . '/storage/cache';
            if (!is_dir($dir)) @mkdir($dir, 0775, true);
            file_put_contents($dir . '/' . $key . '.json', json_encode($data));
        }
    }
}