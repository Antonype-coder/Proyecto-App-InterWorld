<?php
// Diagnóstico temporal del .env
header('Content-Type: text/plain; charset=utf-8');

$path = __DIR__ . '/.env';

echo "=== VERIFICACIÓN DE ARCHIVO ===\n";
echo "Path:     $path\n";
echo "Existe:   " . (file_exists($path) ? 'SÍ' : 'NO') . "\n";
echo "Legible:  " . (is_readable($path) ? 'SÍ' : 'NO') . "\n";
echo "Tamaño:   " . (file_exists($path) ? filesize($path) : 0) . " bytes\n\n";

echo "=== PRIMEROS BYTES (hex) ===\n";
$fh = fopen($path, 'r');
for ($i = 0; $i < 3; $i++) {
    $line = fgets($fh);
    if ($line === false) break;
    echo bin2hex(substr($line, 0, 50)) . "  <- linea $i\n";
}
fclose($fh);

echo "\n=== CARGANDO env.php ===\n";
require_once __DIR__ . '/config/env.php';
echo "env.php cargado OK\n\n";

echo "=== VARIABLES LEÍDAS ===\n";
echo "getenv(JWT_SECRET):   ";
var_dump(getenv('JWT_SECRET'));

echo "\n\$_ENV[JWT_SECRET]:     ";
var_dump($_ENV['JWT_SECRET'] ?? 'NO EXISTE');

echo "\n\$_SERVER[JWT_SECRET]:  ";
var_dump($_SERVER['JWT_SECRET'] ?? 'NO EXISTE');

echo "\ngetenv(DB_NAME):      ";
var_dump(getenv('DB_NAME'));

echo "\ngetenv(APP_ENV):      ";
var_dump(getenv('APP_ENV'));