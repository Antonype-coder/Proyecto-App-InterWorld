<?php
declare(strict_types=1);

if (!class_exists('Upload')) {
    class Upload
    {
        private const ALLOWED = ['jpg', 'jpeg', 'png', 'webp'];

        public static function image(array $file, string $folder, int $maxSize = 5242880): string
        {
            if (!isset($file['tmp_name']) || !is_uploaded_file($file['tmp_name'])) {
                throw new InvalidArgumentException('Archivo inválido.');
            }

            if ($file['size'] > $maxSize) {
                throw new InvalidArgumentException('El archivo excede el tamaño máximo permitido.');
            }

            $mime = mime_content_type($file['tmp_name']);
            $allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
            if (!in_array($mime, $allowedMimes, true)) {
                throw new InvalidArgumentException('Formato no permitido. Usa JPG, PNG o WEBP.');
            }

            $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
            if (!in_array($ext, self::ALLOWED, true)) {
                throw new InvalidArgumentException('Extensión no permitida.');
            }

            $baseDir = dirname(__DIR__) . '/storage/uploads/' . trim($folder, '/');
            if (!is_dir($baseDir)) {
                @mkdir($baseDir, 0775, true);
            }

            $filename = date('YmdHis') . '_' . bin2hex(random_bytes(6)) . '.' . $ext;
            $dest     = $baseDir . '/' . $filename;

            if (!move_uploaded_file($file['tmp_name'], $dest)) {
                throw new RuntimeException('No se pudo guardar el archivo.');
            }

            return 'storage/uploads/' . trim($folder, '/') . '/' . $filename;
        }

        public static function delete(string $relativePath): bool
        {
            $full = dirname(__DIR__) . '/' . ltrim($relativePath, '/');
            if (is_file($full)) {
                return unlink($full);
            }
            return false;
        }
    }
}