<?php
declare(strict_types=1);

require_once __DIR__ . '/HttpException.php';

if (!class_exists('ForbiddenException')) {
    class ForbiddenException extends HttpException
    {
        public function __construct(string $message = 'Acceso denegado')
        {
            parent::__construct($message, 403);
        }
    }
}