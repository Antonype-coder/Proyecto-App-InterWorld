<?php
declare(strict_types=1);

require_once __DIR__ . '/HttpException.php';

if (!class_exists('BusinessException')) {
    class BusinessException extends HttpException
    {
        public function __construct(string $message = 'Regla de negocio violada')
        {
            parent::__construct($message, 400);
        }
    }
}