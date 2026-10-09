<?php
declare(strict_types=1);

if (!class_exists('FolioGenerator')) {
    class FolioGenerator
    {
        public static function venta(PDO $pdo, int $negocioId): string
        {
            return self::siguiente($pdo, $negocioId, 'V', 'ventas');
        }

        public static function devolucion(PDO $pdo, int $negocioId): string
        {
            return self::siguiente($pdo, $negocioId, 'D', 'devoluciones');
        }

        public static function ordenCompra(PDO $pdo, int $negocioId): string
        {
            return self::siguiente($pdo, $negocioId, 'OC', 'ordenes_compra');
        }

        private static function siguiente(PDO $pdo, int $negocioId, string $prefijo, string $tabla): string
        {
            $anio = date('Y');

            // Buscar el número más alto del año para este negocio
            $stmt = $pdo->prepare(
                "SELECT numero FROM {$tabla}
                 WHERE negocio_id = :nid AND numero LIKE :patron
                 ORDER BY id DESC LIMIT 1"
            );
            $stmt->execute(['nid' => $negocioId, 'patron' => $prefijo . '-' . $anio . '-%']);
            $ultimo = $stmt->fetchColumn();

            $siguiente = 1;
            if ($ultimo !== false && $ultimo !== null) {
                $partes = explode('-', (string) $ultimo);
                $siguiente = ((int) end($partes)) + 1;
            }

            return sprintf('%s-%s-%05d', $prefijo, $anio, $siguiente);
        }
    }
}