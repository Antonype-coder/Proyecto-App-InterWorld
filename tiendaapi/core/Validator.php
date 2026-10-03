<?php
declare(strict_types=1);

if (!class_exists('Validator')) {
    class Validator
    {
        private array $data;
        private array $errors = [];

        public function __construct(array $data)
        {
            $this->data = $data;
        }

        public function data(): array { return $this->data; }
        public function errors(): array { return $this->errors; }
        public function fails(): bool { return !empty($this->errors); }
        public function passes(): bool { return empty($this->errors); }

        public function required(string $field, string $message = ''): self
        {
            $value = $this->data[$field] ?? null;
            $isEmpty = $value === null
                || (is_string($value) && trim($value) === '')
                || (is_array($value) && count($value) === 0);

            if ($isEmpty) {
                $this->addError($field, $message ?: "El campo '{$field}' es obligatorio.");
            }
            return $this;
        }

        public function email(string $field, string $message = ''): self
        {
            $v = $this->data[$field] ?? null;
            if ($v === null || $v === '') return $this;
            if (!filter_var($v, FILTER_VALIDATE_EMAIL)) {
                $this->addError($field, $message ?: "El campo '{$field}' no es un correo válido.");
            }
            return $this;
        }

        public function minLength(string $field, int $min, string $message = ''): self
        {
            $v = $this->data[$field] ?? null;
            if ($v === null) return $this;
            if (mb_strlen((string) $v) < $min) {
                $this->addError($field, $message ?: "El campo '{$field}' debe tener al menos {$min} caracteres.");
            }
            return $this;
        }

        public function maxLength(string $field, int $max, string $message = ''): self
        {
            $v = $this->data[$field] ?? null;
            if ($v === null) return $this;
            if (mb_strlen((string) $v) > $max) {
                $this->addError($field, $message ?: "El campo '{$field}' no debe superar {$max} caracteres.");
            }
            return $this;
        }

        public function numeric(string $field, string $message = ''): self
        {
            $v = $this->data[$field] ?? null;
            if ($v === null || $v === '') return $this;
            if (!is_numeric($v)) {
                $this->addError($field, $message ?: "El campo '{$field}' debe ser numérico.");
            }
            return $this;
        }

        public function integer(string $field, string $message = ''): self
        {
            $v = $this->data[$field] ?? null;
            if ($v === null || $v === '') return $this;
            if (filter_var($v, FILTER_VALIDATE_INT) === false) {
                $this->addError($field, $message ?: "El campo '{$field}' debe ser un entero.");
            }
            return $this;
        }

        public function min(string $field, float $min, string $message = ''): self
        {
            $v = $this->data[$field] ?? null;
            if ($v === null || $v === '') return $this;
            if (!is_numeric($v) || (float) $v < $min) {
                $this->addError($field, $message ?: "El campo '{$field}' debe ser mayor o igual a {$min}.");
            }
            return $this;
        }

        public function max(string $field, float $max, string $message = ''): self
        {
            $v = $this->data[$field] ?? null;
            if ($v === null || $v === '') return $this;
            if (!is_numeric($v) || (float) $v > $max) {
                $this->addError($field, $message ?: "El campo '{$field}' debe ser menor o igual a {$max}.");
            }
            return $this;
        }

        public function in(string $field, array $allowed, string $message = ''): self
        {
            $v = $this->data[$field] ?? null;
            if ($v === null || $v === '') return $this;
            if (!in_array($v, $allowed, true)) {
                $lista = implode(', ', $allowed);
                $this->addError($field, $message ?: "El campo '{$field}' debe ser uno de: {$lista}.");
            }
            return $this;
        }

        public function arrayField(string $field, string $message = ''): self
        {
            $v = $this->data[$field] ?? null;
            if ($v === null) return $this;
            if (!is_array($v)) {
                $this->addError($field, $message ?: "El campo '{$field}' debe ser un arreglo.");
            }
            return $this;
        }

        public function date(string $field, string $format = 'Y-m-d', string $message = ''): self
        {
            $v = $this->data[$field] ?? null;
            if ($v === null || $v === '') return $this;
            $d = DateTime::createFromFormat($format, (string) $v);
            if (!$d || $d->format($format) !== (string) $v) {
                $this->addError($field, $message ?: "El campo '{$field}' no es una fecha válida ({$format}).");
            }
            return $this;
        }

        public function regex(string $field, string $pattern, string $message = ''): self
        {
            $v = $this->data[$field] ?? null;
            if ($v === null || $v === '') return $this;
            if (!preg_match($pattern, (string) $v)) {
                $this->addError($field, $message ?: "El campo '{$field}' tiene un formato inválido.");
            }
            return $this;
        }

        private function addError(string $field, string $message): void
        {
            if (!isset($this->errors[$field])) {
                $this->errors[$field] = [];
            }
            $this->errors[$field][] = $message;
        }
    }
}