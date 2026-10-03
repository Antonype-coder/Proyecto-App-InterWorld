<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/env.php';
require_once __DIR__ . '/../core/Logger.php';
require_once __DIR__ . '/../core/Response.php';
require_once __DIR__ . '/../core/Request.php';
require_once __DIR__ . '/../core/Auth.php';
require_once __DIR__ . '/../utils/Jwt.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../models/BaseModel.php';
require_once __DIR__ . '/../models/Usuario.php';

if (php_sapi_name() !== 'cli') {
    die("Este script solo puede ejecutarse desde la terminal.\n");
}

echo "\n========================================\n";
echo "  Diagnóstico de Auth + AuthMiddleware\n";
echo "========================================\n\n";

// 1) Ver qué archivo se está cargando
$rc = new ReflectionClass('Auth');
$rcM = new ReflectionClass('AuthMiddleware');
echo "Auth.php cargado desde:\n   " . $rc->getFileName() . "\n\n";
echo "AuthMiddleware.php cargado desde:\n   " . $rcM->getFileName() . "\n\n";

// 2) Ver los métodos de Auth
echo "Métodos de Auth:\n";
foreach ($rc->getMethods(ReflectionMethod::IS_PUBLIC | ReflectionMethod::IS_STATIC) as $m) {
    echo "   - " . $m->getName() . "\n";
}
echo "\n";

// 3) Verificar que Auth tiene la propiedad estática $user
if (!$rc->hasProperty('user')) {
    echo "❌ Auth NO TIENE la propiedad estática 'user'\n";
    echo "   Tu Auth.php es una versión vieja. Reemplázalo por la del Bloque 1.\n";
    exit(1);
}

$prop = $rc->getProperty('user');
echo "Propiedad 'user' existe:\n";
echo "   - Static: " . ($prop->isStatic() ? 'SÍ' : 'NO') . "\n";
echo "   - Tipo: " . ($prop->hasType() ? (string) $prop->getType() : 'sin tipo') . "\n\n";

// 4) Generar token de prueba
$usuarios = new Usuario();
$u = $usuarios->findByEmail('admin@tienda.com');
if ($u === null) {
    echo "❌ No existe admin@tienda.com\n";
    exit(1);
}

$token = Jwt::encode([
    'sub'    => (int) $u['id'],
    'email'  => $u['email'],
    'nombre' => $u['nombre'],
    'rol'    => $u['rol'],
]);

echo "Token generado (" . strlen($token) . " chars)\n\n";

// 5) Setear un header Authorization artificial y crear un Request
$_SERVER['REQUEST_METHOD'] = 'GET';
$_SERVER['REQUEST_URI'] = '/api/test';
$_SERVER['HTTP_AUTHORIZATION'] = 'Bearer ' . $token;

$request = new Request();

echo "Request creado. bearerToken():\n";
$bt = $request->bearerToken();
echo "   " . ($bt ? substr($bt, 0, 40) . '...' : 'NULL') . "\n\n";

// 6) Ejecutar el middleware
echo "Ejecutando AuthMiddleware::handle...\n";
try {
    AuthMiddleware::handle($request);
    echo "   ✅ Middleware ejecutó sin excepciones\n\n";
} catch (Throwable $e) {
    echo "   ❌ Middleware lanzó: " . $e->getMessage() . "\n";
    exit(1);
}

// 7) Verificar que Auth::$user está seteado
$userAfter = Auth::user();
echo "Auth::user() después del middleware:\n";
echo "   " . ($userAfter === null ? '❌ NULL' : '✅ ' . json_encode($userAfter)) . "\n\n";

echo "Auth::id() después del middleware:\n";
$idAfter = Auth::id();
echo "   " . ($idAfter === null ? '❌ NULL' : '✅ ' . $idAfter) . "\n\n";

// 8) Verificar la propiedad estática directamente
$reflection = new ReflectionClass('Auth');
$propRef = $reflection->getProperty('user');
$propRef->setAccessible(true);
$staticValue = $propRef->getValue();
echo "Valor de la propiedad estática Auth::\$user:\n";
echo "   " . ($staticValue === null ? '❌ NULL' : '✅ ' . json_encode($staticValue)) . "\n\n";

echo "========================================\n";
if ($userAfter !== null && $idAfter !== null) {
    echo "  ✅ TODO OK — el AuthMiddleware funciona correctamente\n";
} else {
    echo "  ❌ FALLO — Auth::setUser() no está persistiendo el estado\n";
    echo "  Reemplaza core/Auth.php y middleware/AuthMiddleware.php con las versiones del Bloque 1.\n";
}
echo "========================================\n\n";