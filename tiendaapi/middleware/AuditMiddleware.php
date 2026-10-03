<?php
declare(strict_types=1);

require_once __DIR__ . '/../core/Auth.php';
require_once __DIR__ . '/../core/Logger.php';

if (!class_exists('AuditMiddleware')) {
    class AuditMiddleware
    {
        public static function handle(string $action, string $entity): callable
        {
            return function (Request $request) use ($action, $entity): void {
                $userId = Auth::id();

                Logger::info('Auditoría', [
                    'action'   => $action,
                    'entity'   => $entity,
                    'user_id'  => $userId,
                    'ip'       => $request->ip(),
                    'user_agent' => $request->userAgent(),
                    'method'   => $request->getMethod(),
                    'path'     => $request->getPath(),
                ]);
            };
        }
    }
}