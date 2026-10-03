<?php
declare(strict_types=1);

if (!class_exists('FolioGenerator')) {
    class FolioGenerator
    {
        public static function venta(PDO $pdo): string
        {
            return self::generate($pdo, 'ventas', 'V');
        }

        public static function devolucion(PDO $pdo): string
        {
            return self::generate($pdo, 'devoluciones', 'D');
        }

        public static function ordenCompra(PDO $pdo): string
        {
            return self::generate($pdo, 'ordenes_compra', 'OC');
        }

        private static function generate(PDO $pdo, string $table, string $prefix): string
        {
            $today = date('Ymd');
            $stmt = $pdo->prepare(
                "SELECT COUNT(*) AS total FROM {$table} WHERE DATE(created_at) = CURDATE()"
            );
            $stmt->execute();
            $row = $stmt->fetch();
            $seq = ((int) ($row['total'] ?? 0)) + 1;

            $folio = sprintf('%s-%s-%04d', $prefix, $today, $seq);

            // Verificar unicidad
            $check = $pdo->prepare("SELECT COUNT(*) FROM {$table} WHERE numero = :n");
            $check->execute(['n' => $folio]);
            if ((int) $check->fetchColumn() > 0) {
                return sprintf('%s-%s-%04d-%s', $prefix, $today, $seq, substr(uniqid(), -3));
            }

            return $folio;
        }
    }
}