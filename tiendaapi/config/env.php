<?php
declare(strict_types=1);

/**
 * Carga .env usando vlucas/phpdotenv si está disponible.
 * Fallback: parser propio si composer aún no está instalado.
 */

if (!function_exists('tienda_load_env')) {
    function tienda_load_env(string $path): void
    {
        if (!is_file($path) || !is_readable($path)) {
            return;
        }

        $autoload = dirname(__DIR__) . '/vendor/autoload.php';
        if (is_file($autoload)) {
            require_once $autoload;
            $dotenv = Dotenv\Dotenv::createImmutable(dirname($path), basename($path));
            $dotenv->safeLoad();
            return;
        }

        // Fallback: parser propio
        $content = file_get_contents($path);
        if ($content === false) return;

        if (str_starts_with($content, "\xEF\xBB\xBF")) {
            $content = substr($content, 3);
        }

        $content = str_replace(["\r\n", "\r"], "\n", $content);
        $lines = explode("\n", $content);

        foreach ($lines as $rawLine) {
            $line = trim($rawLine);

            if ($line === '' || str_starts_with($line, '#')) continue;
            if (!str_contains($line, '=')) continue;

            [$key, $value] = explode('=', $line, 2);
            $key   = trim($key);
            $value = trim($value);

            $len = strlen($value);
            if ($len >= 2) {
                $first = $value[0];
                $last  = $value[$len - 1];
                if (($first === '"' && $last === '"') || ($first === "'" && $last === "'")) {
                    $value = substr($value, 1, -1);
                }
            }

            putenv("{$key}={$value}");
            $_ENV[$key]    = $value;
            $_SERVER[$key] = $value;
        }
    }
}

tienda_load_env(dirname(__DIR__) . '/.env');

// Configuración regional
date_default_timezone_set(getenv('APP_TIMEZONE') ?: 'America/Bogota');
setlocale(LC_ALL, 'es_CO.UTF-8', 'es_CO', 'esp');
mb_internal_encoding('UTF-8');