<?php
declare(strict_types=1);

require_once __DIR__ . '/AuthMiddleware.php';
require_once __DIR__ . '/../core/Auth.php';

if (!class_exists('RoleMiddleware')) {
    class RoleMiddleware
    {
        public static function requireRole(array $roles): callable
        {
            return function (Request $request) use ($roles): void {
                AuthMiddleware::handle($request);
                Auth::requireRole($roles);
            };
        }
    }
}