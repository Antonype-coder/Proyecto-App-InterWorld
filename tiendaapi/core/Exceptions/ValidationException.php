<?php
declare(strict_types=1);

require_once __DIR__ . '/HttpException.php';

if (!class_exists('ValidationException')) {
    class ValidationException extends HttpException
    {
        public function __construct(array $errors, string $message = 'Datos inválidos')
        {
            parent::__construct($message, 422, ['errors' => $errors]);
        }

        public function getErrors(): array
        {
            return $this->data['errors'] ?? [];
        }
    }
}