<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/env.php';
require_once __DIR__ . '/../config/database.php';

if (php_sapi_name() !== 'cli') {
    die("Este script solo puede ejecutarse desde la terminal.\n");
}

echo "\n========================================\n";
echo "  Regenerando hashes BCRYPT\n";
echo "========================================\n\n";

$pdo = Database::getConnection();

$users = [
    'admin@tienda.com'    => 'admin123',
    'vendedor@tienda.com' => 'vendedor123',
];

foreach ($users as $email => $plain) {
    $hash = password_hash($plain, PASSWORD_BCRYPT);

    $stmt = $pdo->prepare("UPDATE usuarios SET password_hash = :h WHERE email = :e");
    $stmt->execute(['h' => $hash, 'e' => $email]);

    if ($stmt->rowCount() === 0) {
        echo "⚠️  Usuario '{$email}' no existe. Creando...\n";
        $ins = $pdo->prepare(
            "INSERT INTO usuarios (nombre, email, password_hash, rol, activo) 
             VALUES (:n, :e, :h, :r, 1)"
        );
        $ins->execute([
            'n' => $email === 'admin@tienda.com' ? 'Administrador' : 'Vendedor Demo',
            'e' => $email,
            'h' => $hash,
            'r' => $email === 'admin@tienda.com' ? 'admin' : 'vendedor',
        ]);
        echo "   ✅ Creado\n\n";
    } else {
        echo "→ {$email}\n";
        echo "   Password: {$plain}\n";
        echo "   Hash:     " . substr($hash, 0, 40) . "...\n";
        echo "   ✅ Actualizado\n\n";
    }
}

// Verificación inmediata
echo "========================================\n";
echo "  Verificación\n";
echo "========================================\n\n";

foreach ($users as $email => $plain) {
    $stmt = $pdo->prepare("SELECT password_hash FROM usuarios WHERE email = :e");
    $stmt->execute(['e' => $email]);
    $row = $stmt->fetch();

    if ($row === false) {
        echo "❌ {$email}: no encontrado\n";
        continue;
    }

    $ok = password_verify($plain, $row['password_hash']);
    echo ($ok ? "✅" : "❌") . " {$email} → password_verify('{$plain}') = " . ($ok ? 'OK' : 'FALLA') . "\n";
}

echo "\n✅ Listo. Prueba el login ahora.\n\n";