<?php
declare(strict_types=1);

require_once __DIR__ . '/HttpException.php';

if (!class_exists('NotFoundException')) {
    class NotFoundException extends HttpException
    {
        public function __construct(string $message = 'Recurso no encontrado')
        {
            parent::__construct($message, 404);
        }
    }
}