<?php
declare(strict_types=1);

if (!class_exists('HttpException')) {
    class HttpException extends RuntimeException
    {
        protected int $statusCode;
        protected mixed $data;

        public function __construct(string $message = '', int $statusCode = 400, mixed $data = null)
        {
            parent::__construct($message, $statusCode);
            $this->statusCode = $statusCode;
            $this->data       = $data;
        }

        public function getStatusCode(): int { return $this->statusCode; }
        public function getData(): mixed { return $this->data; }
    }
}