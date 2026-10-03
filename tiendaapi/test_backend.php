<?php
header('Content-Type: application/json; charset=utf-8');

$base = 'http://localhost/tiendaapi/api';
$resultados = [];

function pedir(string $metodo, string $url, ?array $body = null, ?string $token = null): array
{
    $ch = curl_init($url);
    $headers = ['Content-Type: application/json'];
    if ($token !== null) $headers[] = 'Authorization: Bearer ' . $token;

    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CUSTOMREQUEST  => $metodo,
        CURLOPT_HTTPHEADER     => $headers,
        CURLOPT_TIMEOUT        => 10,
    ]);
    if ($body !== null) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
    }

    $raw  = curl_exec($ch);
    $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err  = curl_error($ch);
    curl_close($ch);

    return [
        'http'  => $code,
        'body'  => $raw === false ? null : json_decode($raw, true),
        'error' => $err !== '' ? $err : null,
    ];
}

function paso(string $nombre, array $res): void
{
    global $resultados;
    $ok = $res['http'] >= 200 && $res['http'] < 300;
    $resultados[$nombre] = [
        'ok'   => $ok,
        'http' => $res['http'],
        'body' => $res['body'],
        'error' => $res['error'],
    ];
}

// 1) Health
paso('health', pedir('GET', "$base/health"));

// 2) Login admin
$login = pedir('POST', "$base/auth/login", [
    'email'    => 'admin@tienda.com',
    'password' => 'admin123',
]);
paso('login_admin', $login);

$token = $login['body']['data']['token'] ?? null;

if ($token === null) {
    echo json_encode([
        'success' => false,
        'message' => 'No se obtuvo token. Revisa credenciales y base de datos.',
        'detalle' => $resultados,
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
}

// 3) Me
paso('auth_me', pedir('GET', "$base/auth/me", null, $token));

// 4) Categorías
paso('categorias', pedir('GET', "$base/categorias", null, $token));

// 5) Proveedores
paso('proveedores', pedir('GET', "$base/proveedores", null, $token));

// 6) Productos
paso('productos', pedir('GET', "$base/productos", null, $token));

// 7) Clientes
paso('clientes', pedir('GET', "$base/clientes", null, $token));

// 8) Dashboard resumen
paso('dashboard_resumen', pedir('GET', "$base/dashboard/resumen", null, $token));

// 9) Ventas
paso('ventas', pedir('GET', "$base/ventas", null, $token));

// 10) Caja estado
paso('caja_estado', pedir('GET', "$base/caja/estado", null, $token));

// 11) Reportes (solo admin)
paso('reporte_resumen', pedir('GET', "$base/reportes/resumen", null, $token));

// 12) Notificaciones
paso('notificaciones', pedir('GET', "$base/notificaciones", null, $token));

// Resumen
$total = count($resultados);
$ok    = array_sum(array_column($resultados, 'ok'));

echo json_encode([
    'success' => $ok === $total,
    'resumen' => "Pasaron $ok de $total pruebas",
    'detalle' => $resultados,
], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);