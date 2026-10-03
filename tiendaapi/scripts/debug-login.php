<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/env.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../core/Logger.php';
require_once __DIR__ . '/../core/Auth.php';
require_once __DIR__ . '/../utils/Jwt.php';
require_once __DIR__ . '/../utils/Helpers.php';
require_once __DIR__ . '/../models/BaseModel.php';
require_once __DIR__ . '/../models/Usuario.php';
require_once __DIR__ . '/../services/AuthService.php';

if (php_sapi_name() !== 'cli') {
    die("Este script solo puede ejecutarse desde la terminal.\n");
}

echo "\n========================================\n";
echo "  Debug del flujo de login\n";
echo "========================================\n\n";

// 1) Verificar JWT_SECRET
echo "1) JWT_SECRET:\n";
$secret = tienda_env('JWT_SECRET');
if (!$secret) {
    echo "   ❌ NO configurado en .env\n\n";
} else {
    echo "   Longitud: " . strlen($secret) . " caracteres\n";
    echo "   Primeros 10: " . substr($secret, 0, 10) . "...\n";
    if (strlen($secret) < 32) {
        echo "   ⚠️  MUY CORTO (necesita mínimo 32 caracteres)\n";
    } else {
        echo "   ✅ OK\n";
    }
}
echo "\n";

// 2) Probar el Logger
echo "2) Logger (escribir en storage/logs):\n";
try {
    Logger::info('Test de logging desde debug-login.php');
    echo "   ✅ Logger OK\n";

    $logDir = __DIR__ . '/../storage/logs';
    $files = glob($logDir . '/*.log');
    if ($files) {
        echo "   Log actual: " . basename(end($files)) . "\n";
    }
} catch (Throwable $e) {
    echo "   ❌ ERROR: " . $e->getMessage() . "\n";
    echo "   En: " . $e->getFile() . ":" . $e->getLine() . "\n";
}
echo "\n";

// 3) Buscar usuario
echo "3) Buscar usuario admin@tienda.com:\n";
try {
    $usuarios = new Usuario();
    $u = $usuarios->findByEmail('admin@tienda.com');
    if ($u === null) {
        echo "   ❌ No encontrado\n";
        exit(1);
    }
    echo "   ✅ Encontrado (id={$u['id']}, rol={$u['rol']}, activo={$u['activo']})\n";
} catch (Throwable $e) {
    echo "   ❌ ERROR: " . $e->getMessage() . "\n";
    exit(1);
}
echo "\n";

// 4) Verificar contraseña
echo "4) Verificar contraseña:\n";
$ok = password_verify('admin123', (string) $u['password_hash']);
echo ($ok ? "   ✅ OK" : "   ❌ FALLA") . "\n\n";

// 5) Registro de login (UPDATE)
echo "5) Update ultimo_login:\n";
try {
    $usuarios->registroLogin((int) $u['id']);
    echo "   ✅ OK\n";
} catch (Throwable $e) {
    echo "   ❌ ERROR: " . $e->getMessage() . "\n";
    echo "   En: " . $e->getFile() . ":" . $e->getLine() . "\n";
    exit(1);
}
echo "\n";

// 6) Generar JWT
echo "6) Generar JWT:\n";
try {
    $token = Jwt::encode([
        'sub'    => (int) $u['id'],
        'email'  => $u['email'],
        'nombre' => $u['nombre'],
        'rol'    => $u['rol'],
    ]);
    echo "   ✅ Token generado (" . strlen($token) . " caracteres)\n";
    echo "   Primeros 50: " . substr($token, 0, 50) . "...\n";
} catch (Throwable $e) {
    echo "   ❌ ERROR: " . $e->getMessage() . "\n";
    echo "   En: " . $e->getFile() . ":" . $e->getLine() . "\n";
    exit(1);
}
echo "\n";

// 7) Llamar al AuthService completo
echo "7) AuthService::login completo:\n";
try {
    $service = new AuthService();
    $result = $service->login('admin@tienda.com', 'admin123');
    echo "   ✅ Login completo OK\n";
    echo "   Token: " . substr($result['token'], 0, 50) . "...\n";
    echo "   User: " . json_encode($result['user']) . "\n";
} catch (Throwable $e) {
    echo "   ❌ ERROR: " . $e->getMessage() . "\n";
    echo "   Tipo: " . get_class($e) . "\n";
    echo "   En: " . $e->getFile() . ":" . $e->getLine() . "\n";
    echo "   Trace:\n";
    foreach (explode("\n", $e->getTraceAsString()) as $line) {
        echo "     " . $line . "\n";
    }
}
echo "\n";

echo "========================================\n";