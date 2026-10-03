<?php
declare(strict_types=1);

if (!function_exists('tienda_sanitize_string')) {
    function tienda_sanitize_string(?string $value): string
    {
        if ($value === null) return '';
        $value = trim($value);
        $value = strip_tags($value);
        $value = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $value) ?? '';
        return $value;
    }
}

if (!function_exists('tienda_to_decimal')) {
    function tienda_to_decimal(mixed $value): string
    {
        if (!is_numeric($value)) return '0.00';
        return number_format((float) $value, 2, '.', '');
    }
}

if (!function_exists('tienda_to_int')) {
    function tienda_to_int(mixed $value): int
    {
        if (!is_numeric($value)) return 0;
        return (int) $value;
    }
}

if (!function_exists('tienda_json_input')) {
    function tienda_json_input(): array
    {
        $raw = file_get_contents('php://input');
        if ($raw === false || $raw === '') return [];
        $decoded = json_decode($raw, true);
        return is_array($decoded) ? $decoded : [];
    }
}

if (!function_exists('tienda_generate_folio')) {
    function tienda_generate_folio(PDO $pdo, string $prefijo = 'V'): string
    {
        $hoy = date('Ymd');
        $stmt = $pdo->prepare(
            "SELECT COUNT(*) AS total FROM ventas WHERE DATE(created_at) = CURDATE()"
        );
        $stmt->execute();
        $row = $stmt->fetch();
        $secuencia = ((int) ($row['total'] ?? 0)) + 1;
        return sprintf('%s-%s-%04d', $prefijo, $hoy, $secuencia);
    }
}

if (!function_exists('tienda_now')) {
    function tienda_now(): string
    {
        return date('Y-m-d H:i:s');
    }
}

if (!function_exists('tienda_log')) {
    function tienda_log(string $mensaje): void
    {
        if (class_exists('Logger')) {
            Logger::info($mensaje);
        }
    }
}

if (!function_exists('tienda_env')) {
    function tienda_env(string $key, mixed $default = null): mixed
    {
        $value = getenv($key);
        if ($value === false || $value === '') {
            $value = $_ENV[$key] ?? $_SERVER[$key] ?? null;
        }
        return $value === null || $value === '' ? $default : $value;
    }
}

if (!function_exists('tienda_uuid')) {
    function tienda_uuid(): string
    {
        if (class_exists('Ramsey\\Uuid\\Uuid')) {
            return Ramsey\Uuid\Uuid::uuid4()->toString();
        }
        return sprintf(
            '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            mt_rand(0, 0xffff), mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0x0fff) | 0x4000,
            mt_rand(0, 0x3fff) | 0x8000,
            mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
        );
    }
}