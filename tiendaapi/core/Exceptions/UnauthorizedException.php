<?php
declare(strict_types=1);

require_once __DIR__ . '/HttpException.php';

if (!class_exists('UnauthorizedException')) {
    class UnauthorizedException extends HttpException
    {
        public function __construct(string $message = 'No autorizado')
        {
            parent::__construct($message, 401);
        }
    }
}