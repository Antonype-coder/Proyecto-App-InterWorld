<?php
declare(strict_types=1);

require_once __DIR__ . '/HttpException.php';

if (!class_exists('ConflictException')) {
    class ConflictException extends HttpException
    {
        public function __construct(string $message = 'Conflicto')
        {
            parent::__construct($message, 409);
        }
    }
}