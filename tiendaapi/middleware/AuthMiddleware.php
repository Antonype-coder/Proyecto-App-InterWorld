<?php
declare(strict_types=1);

require_once __DIR__ . '/../core/Response.php';
require_once __DIR__ . '/../core/Auth.php';
require_once __DIR__ . '/../utils/Jwt.php';

if (!class_exists('AuthMiddleware')) {
    class AuthMiddleware
    {
        public static function handle(Request $request): void
        {
            $token = $request->bearerToken();
            if ($token === null) {
                Response::unauthorized('Token de autenticación ausente.');
            }

            $payload = Jwt::decode($token);
            if ($payload === null) {
                Response::unauthorized('Token inválido o expirado.');
            }

            if (!isset($payload['sub'], $payload['rol'])) {
                Response::unauthorized('Token con contenido inválido.');
            }

            Auth::setUser($payload);
        }

        public static function adminOnly(Request $request): void
        {
            self::handle($request);
            Auth::requireRole(['admin']);
        }

        public static function anyRole(Request $request): void
        {
            self::handle($request);
        }

        public static function optional(Request $request): void
        {
            $token = $request->bearerToken();
            if ($token === null) return;

            $payload = Jwt::decode($token);
            if ($payload !== null && isset($payload['sub'])) {
                Auth::setUser($payload);
            }
        }
    }
}