<?php
declare(strict_types=1);

if (!class_exists('Auth')) {
    class Auth
    {
        private const GLOBAL_KEY = '__TIENDA_AUTH_USER__';

        public static function setUser(array $payload): void
        {
            $GLOBALS[self::GLOBAL_KEY] = $payload;
        }

        public static function user(): ?array
        {
            $u = $GLOBALS[self::GLOBAL_KEY] ?? null;
            return is_array($u) ? $u : null;
        }

        public static function id(): ?int
        {
            $u = self::user();
            return ($u !== null && isset($u['sub'])) ? (int) $u['sub'] : null;
        }

        public static function negocioId(): ?int
        {
            $u = self::user();
            return ($u !== null && isset($u['negocio_id'])) ? (int) $u['negocio_id'] : null;
        }

        public static function email(): ?string
        {
            return self::user()['email'] ?? null;
        }

        public static function nombre(): ?string
        {
            return self::user()['nombre'] ?? null;
        }

        public static function role(): ?string
        {
            return self::user()['rol'] ?? null;
        }

        public static function isAdmin(): bool
        {
            return self::role() === 'admin';
        }

        public static function isVendedor(): bool
        {
            return self::role() === 'vendedor';
        }

        public static function check(): bool
        {
            return self::user() !== null;
        }

        public static function requireRole(array $roles): void
        {
            $role = self::role();
            if ($role === null || !in_array($role, $roles, true)) {
                if (class_exists('Response')) {
                    Response::forbidden('No tienes permisos para esta acción.');
                }
                http_response_code(403);
                exit;
            }
        }

        public static function clear(): void
        {
            unset($GLOBALS[self::GLOBAL_KEY]);
        }
    }
}