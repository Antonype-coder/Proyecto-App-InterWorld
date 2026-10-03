<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/env.php';
require_once __DIR__ . '/../config/database.php';

if (php_sapi_name() !== 'cli') {
    die("Este script solo puede ejecutarse desde la terminal.\n");
}

echo "\n========================================\n";
echo "  TiendaAdmin — RESET de base de datos\n";
echo "========================================\n\n";

echo "⚠️  Este script eliminará TODAS las tablas y datos.\n";
echo "   Presiona Ctrl+C en los próximos 3 segundos para cancelar...\n\n";
sleep(3);

$pdo = Database::getConnection();

// Deshabilitar FKs temporalmente
$pdo->exec("SET FOREIGN_KEY_CHECKS = 0");

// Obtener todas las tablas
$tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);

if (empty($tables)) {
    echo "No hay tablas que eliminar.\n\n";
} else {
    echo "Eliminando " . count($tables) . " tablas:\n";
    foreach ($tables as $table) {
        echo "  → {$table}\n";
        $pdo->exec("DROP TABLE IF EXISTS `{$table}`");
    }
}

// Rehabilitar FKs
$pdo->exec("SET FOREIGN_KEY_CHECKS = 1");

echo "\n✓ Base de datos limpia.\n";
echo "  Ahora ejecuta:\n";
echo "    php scripts/migrate.php\n";
echo "    php scripts/seed.php\n";
echo "    php scripts/hash-passwords.php\n\n";