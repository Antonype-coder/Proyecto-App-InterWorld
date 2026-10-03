<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/env.php';
require_once __DIR__ . '/../config/database.php';

if (php_sapi_name() !== 'cli') {
    die("Este script solo puede ejecutarse desde la terminal.\n");
}

echo "\n========================================\n";
echo "  Diagnóstico de usuarios\n";
echo "========================================\n\n";

$pdo = Database::getConnection();

$stmt = $pdo->query("SELECT id, nombre, email, password_hash, rol, activo FROM usuarios");
$usuarios = $stmt->fetchAll();

if (empty($usuarios)) {
    echo "❌ No hay usuarios en la tabla.\n";
    exit(1);
}

echo "Usuarios encontrados: " . count($usuarios) . "\n\n";

foreach ($usuarios as $u) {
    echo "→ ID: {$u['id']}\n";
    echo "   Nombre: {$u['nombre']}\n";
    echo "   Email:  {$u['email']}\n";
    echo "   Rol:    {$u['rol']}\n";
    echo "   Activo: {$u['activo']}\n";
    echo "   Hash:   " . substr((string) $u['password_hash'], 0, 50) . "...\n";

    // Verificar si el hash es válido
    $esBcrypt = preg_match('/^\$2[ay]\$\d{2}\$[\.\/A-Za-z0-9]{53}$/', (string) $u['password_hash']) === 1;
    echo "   Hash válido (formato BCRYPT): " . ($esBcrypt ? "✅ SÍ" : "❌ NO") . "\n";

    // Probar password_verify con "admin123" o "vendedor123"
    $probable = str_contains($u['email'], 'admin') ? 'admin123' : 'vendedor123';
    $verifica = password_verify($probable, (string) $u['password_hash']);
    echo "   password_verify('{$probable}'): " . ($verifica ? "✅ OK" : "❌ FALLA") . "\n";
    echo "\n";
}

echo "========================================\n";