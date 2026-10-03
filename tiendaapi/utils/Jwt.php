<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/env.php';

if (!class_exists('Jwt')) {
    class Jwt
    {
        /**
         * Codifica un payload como JWT firmado con HS256.
         */
        public static function encode(array $payload, ?int $expMinutes = null): string
        {
            $secret     = self::getSecret();
            $expMinutes = $expMinutes ?? (int) tienda_env('JWT_EXP_MINUTES', 480);
            $now        = time();

            $payload = array_merge([
                'iat' => $now,
                'nbf' => $now,
                'exp' => $now + ($expMinutes * 60),
                'iss' => tienda_env('APP_URL', 'tiendaadmin'),
            ], $payload);

            $header = ['alg' => 'HS256', 'typ' => 'JWT'];

            $segments = [
                self::base64UrlEncode(json_encode($header, JSON_UNESCAPED_UNICODE)),
                self::base64UrlEncode(json_encode($payload, JSON_UNESCAPED_UNICODE)),
            ];

            $signingInput = implode('.', $segments);
            $signature    = hash_hmac('sha256', $signingInput, $secret, true);
            $segments[]   = self::base64UrlEncode($signature);

            return implode('.', $segments);
        }

        /**
         * Decodifica y valida un JWT. Devuelve null si es inválido o está expirado.
         */
        public static function decode(string $token): ?array
        {
            $parts = explode('.', $token);
            if (count($parts) !== 3) {
                self::logFail('Formato JWT inválido (segmentos != 3).');
                return null;
            }

            [$headerB64, $payloadB64, $signatureB64] = $parts;

            $headerJson  = self::base64UrlDecode($headerB64);
            $payloadJson = self::base64UrlDecode($payloadB64);
            $signature   = self::base64UrlDecode($signatureB64, false);

            if ($headerJson === null || $payloadJson === null || $signature === null) {
                self::logFail('JWT contiene base64 inválido.');
                return null;
            }

            $header  = json_decode($headerJson, true);
            $payload = json_decode($payloadJson, true);

            if (!is_array($header) || !is_array($payload)) {
                self::logFail('JWT con JSON inválido.');
                return null;
            }

            if (($header['alg'] ?? '') !== 'HS256') {
                self::logFail('Algoritmo JWT no soportado: ' . ($header['alg'] ?? 'desconocido'));
                return null;
            }

            $secret       = self::getSecret();
            $signingInput = $headerB64 . '.' . $payloadB64;
            $expected     = hash_hmac('sha256', $signingInput, $secret, true);

            if (!hash_equals($expected, $signature)) {
                self::logFail('Firma JWT no coincide.');
                return null;
            }

            $now = time();

            if (isset($payload['nbf']) && $now < (int) $payload['nbf']) {
                self::logFail('JWT aún no válido (nbf).');
                return null;
            }

            if (isset($payload['exp']) && $now >= (int) $payload['exp']) {
                self::logFail('JWT expirado.');
                return null;
            }

            return $payload;
        }

        public static function fromBearerHeader(?string $authorization): ?array
        {
            if ($authorization === null || $authorization === '') return null;
            if (preg_match('/^Bearer\s+(.+)$/i', trim($authorization), $m) !== 1) return null;
            return self::decode(trim($m[1]));
        }

        public static function base64UrlEncode(string $data): string
        {
            return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
        }

        public static function base64UrlDecode(string $data, bool $asString = true): string|false|null
        {
            $remainder = strlen($data) % 4;
            if ($remainder) {
                $data .= str_repeat('=', 4 - $remainder);
            }

            $decoded = base64_decode(strtr($data, '-_', '+/'), true);
            if ($decoded === false) {
                return null;
            }

            return $asString ? $decoded : $decoded;
        }

        private static function getSecret(): string
        {
            $secret = tienda_env('JWT_SECRET');
            if (!$secret || strlen($secret) < 32) {
                throw new RuntimeException(
                    'JWT_SECRET no configurado o demasiado corto (mínimo 32 caracteres). ' .
                    'Genera uno con: openssl rand -base64 64'
                );
            }
            return $secret;
        }

        private static function logFail(string $reason): void
        {
            if (class_exists('Logger')) {
                Logger::warning('JWT rechazado: ' . $reason);
            }
        }
    }
}