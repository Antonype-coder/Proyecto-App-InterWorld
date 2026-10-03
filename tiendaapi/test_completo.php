<?php
declare(strict_types=1);

/**
 * TEST COMPLETO — TiendaAdmin v2.0
 * Ejecuta: php test_completo.php
 * O abre: http://localhost/tiendaapi/test_completo.php
 */

header('Content-Type: application/json; charset=utf-8');
set_time_limit(180);

$base = 'http://localhost/tiendaapi/api';
$resultados = [];
$token = null;
$ventaIdCreada = null;
$clienteIdCreado = null;
$productoIdCreado = null;
$categoriaIdCreada = null;
$devolucionIdCreada = null;
$promocionIdCreada = null;
$ordenCompraIdCreada = null;
$negocioTestEmail = null;

// =============================================================
// HELPERS
// =============================================================

function pedir(string $metodo, string $url, ?array $body = null, ?string $token = null): array
{
    $ch = curl_init($url);
    $headers = ['Content-Type: application/json'];
    if ($token !== null) $headers[] = 'Authorization: Bearer ' . $token;

    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CUSTOMREQUEST  => $metodo,
        CURLOPT_HTTPHEADER     => $headers,
        CURLOPT_TIMEOUT        => 15,
    ]);
    if ($body !== null) curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));

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

function test(string $nombre, callable $fn): void
{
    global $resultados;
    try {
        $ok = $fn();
        $resultados[] = ['test' => $nombre, 'ok' => (bool) $ok, 'error' => null];
    } catch (Throwable $e) {
        $resultados[] = ['test' => $nombre, 'ok' => false, 'error' => $e->getMessage()];
    }
}

function expectHttp(array $res, int $expected, string $label = ''): void
{
    if ($res['http'] !== $expected) {
        $msg = "Esperaba HTTP {$expected}, recibió {$res['http']}";
        if (!empty($res['body']['message'])) $msg .= ": {$res['body']['message']}";
        throw new RuntimeException($label . $msg);
    }
}

function expectSuccess(array $res): void
{
    if (!isset($res['body']['success']) || $res['body']['success'] !== true) {
        $msg = $res['body']['message'] ?? 'unknown';
        throw new RuntimeException("Respuesta sin success=true: {$msg}");
    }
}

// =============================================================
// INICIO
// =============================================================

$esCli = php_sapi_name() === 'cli';
if (!$esCli) {
    echo "<pre style='font-family: monospace; padding: 20px; background: #111; color: #eee;'>";
}

echo "\n╔═══════════════════════════════════════════════════╗\n";
echo "║      TEST COMPLETO — TiendaAdmin v2.0             ║\n";
echo "╚═══════════════════════════════════════════════════╝\n\n";

// =============================================================
// 1. HEALTH CHECK
// =============================================================

test('1.1 Health check', function () use ($base) {
    $r = pedir('GET', "$base/health");
    expectHttp($r, 200);
    return $r['body']['data']['status'] === 'ok';
});

// =============================================================
// 2. AUTENTICACIÓN
// =============================================================

test('2.1 Login admin', function () use ($base, &$token) {
    $r = pedir('POST', "$base/auth/login", [
        'email' => 'admin@tienda.com',
        'password' => 'admin123',
    ]);
    expectHttp($r, 200);
    expectSuccess($r);
    if (!isset($r['body']['data']['token'])) throw new RuntimeException('Sin token');
    $token = $r['body']['data']['token'];
    return true;
});

test('2.2 Auth/me', function () use ($base, &$token) {
    $r = pedir('GET', "$base/auth/me", null, $token);
    expectHttp($r, 200);
    return $r['body']['data']['email'] === 'admin@tienda.com';
});

test('2.3 Login con credenciales inválidas', function () use ($base) {
    $r = pedir('POST', "$base/auth/login", [
        'email' => 'no@existe.com',
        'password' => 'wrong',
    ]);
    return $r['http'] === 401;
});

test('2.4 Login sin token devuelve 401', function () use ($base) {
    $r = pedir('GET', "$base/auth/me");
    return $r['http'] === 401;
});

// =============================================================
// 3. REGISTRO DE NEGOCIO (multi-tenant)
// =============================================================

test('3.1 Registro de nuevo negocio', function () use ($base, &$negocioTestEmail) {
    $negocioTestEmail = 'test_negocio_' . time() . '@test.com';
    $r = pedir('POST', "$base/auth/registrar-negocio", [
        'negocio_nombre' => 'Negocio Test ' . time(),
        'nit' => 'TEST-' . time(),
        'telefono' => '3000000000',
        'nombre' => 'Admin Test',
        'email' => $negocioTestEmail,
        'password' => 'test123456',
    ]);
    expectHttp($r, 201);
    expectSuccess($r);
    if (!isset($r['body']['data']['token'])) throw new RuntimeException('Sin token');
    if (!isset($r['body']['data']['user']['negocio_id'])) throw new RuntimeException('Sin negocio_id');
    return true;
});

test('3.2 Login con el negocio nuevo', function () use ($base, &$negocioTestEmail) {
    $r = pedir('POST', "$base/auth/login", [
        'email' => $negocioTestEmail,
        'password' => 'test123456',
    ]);
    expectHttp($r, 200);
    return isset($r['body']['data']['user']['negocio_id']);
});

// =============================================================
// 4. CATEGORÍAS
// =============================================================

test('4.1 Listar categorías', function () use ($base, &$token) {
    $r = pedir('GET', "$base/categorias", null, $token);
    expectHttp($r, 200);
    return is_array($r['body']['data']);
});

test('4.2 Crear categoría', function () use ($base, &$token, &$categoriaIdCreada) {
    $r = pedir('POST', "$base/categorias", [
        'nombre' => 'Test Cat ' . time(),
        'descripcion' => 'Categoría de prueba',
    ], $token);
    expectHttp($r, 201);
    expectSuccess($r);
    $categoriaIdCreada = $r['body']['data']['id'] ?? null;
    return $categoriaIdCreada !== null;
});

test('4.3 Actualizar categoría', function () use ($base, &$token, &$categoriaIdCreada) {
    if (!$categoriaIdCreada) throw new RuntimeException('Sin ID de categoría');
    $r = pedir('PUT', "$base/categorias/$categoriaIdCreada", [
        'descripcion' => 'Actualizada',
    ], $token);
    expectHttp($r, 200);
    return true;
});

// =============================================================
// 5. PROVEEDORES
// =============================================================

test('5.1 Crear proveedor', function () use ($base, &$token) {
    $r = pedir('POST', "$base/proveedores", [
        'nombre' => 'Proveedor Test ' . time(),
        'contacto' => 'Juan Test',
        'telefono' => '3001234567',
        'email' => 'prov_' . time() . '@test.com',
    ], $token);
    expectHttp($r, 201);
    return $r['body']['data']['id'] ?? false;
});

test('5.2 Listar proveedores', function () use ($base, &$token) {
    $r = pedir('GET', "$base/proveedores", null, $token);
    expectHttp($r, 200);
    return is_array($r['body']['data']);
});

// =============================================================
// 6. PRODUCTOS
// =============================================================

test('6.1 Listar productos', function () use ($base, &$token) {
    $r = pedir('GET', "$base/productos", null, $token);
    expectHttp($r, 200);
    return isset($r['body']['data']['items']);
});

test('6.2 Crear producto', function () use ($base, &$token, &$productoIdCreado) {
    $codigo = 'TEST' . time();
    $r = pedir('POST', "$base/productos", [
        'codigo_barras' => $codigo,
        'nombre' => 'Producto Test ' . time(),
        'precio_compra' => 1000,
        'precio_venta' => 2000,
        'stock' => 50,
        'stock_minimo' => 5,
    ], $token);
    expectHttp($r, 201);
    expectSuccess($r);
    $productoIdCreado = $r['body']['data']['id'] ?? null;
    return $productoIdCreado !== null;
});

test('6.3 Buscar producto por barcode', function () use ($base, &$token, &$productoIdCreado) {
    if (!$productoIdCreado) throw new RuntimeException('Sin producto');
    $prod = pedir('GET', "$base/productos/$productoIdCreado", null, $token);
    $codigo = $prod['body']['data']['codigo_barras'];
    $r = pedir('GET', "$base/productos/barcode/$codigo", null, $token);
    expectHttp($r, 200);
    return $r['body']['data']['id'] == $productoIdCreado;
});

test('6.4 Actualizar producto', function () use ($base, &$token, &$productoIdCreado) {
    if (!$productoIdCreado) throw new RuntimeException('Sin producto');
    $r = pedir('PUT', "$base/productos/$productoIdCreado", [
        'nombre' => 'Producto Actualizado ' . time(),
    ], $token);
    expectHttp($r, 200);
    return true;
});

test('6.5 Productos con stock bajo', function () use ($base, &$token) {
    $r = pedir('GET', "$base/productos/stock-bajo", null, $token);
    expectHttp($r, 200);
    return is_array($r['body']['data']);
});

test('6.6 Buscar productos por nombre', function () use ($base, &$token) {
    $r = pedir('GET', "$base/productos?busqueda=coca", null, $token);
    expectHttp($r, 200);
    return isset($r['body']['data']['items']);
});

// =============================================================
// 7. CLIENTES
// =============================================================

test('7.1 Crear cliente', function () use ($base, &$token, &$clienteIdCreado) {
    $r = pedir('POST', "$base/clientes", [
        'nombre' => 'Cliente Test ' . time(),
        'documento' => 'TEST' . time(),
        'telefono' => '3000000000',
        'cupo_credito' => 500000,
    ], $token);
    expectHttp($r, 201);
    expectSuccess($r);
    $clienteIdCreado = $r['body']['data']['id'] ?? null;
    return $clienteIdCreado !== null;
});

test('7.2 Listar clientes', function () use ($base, &$token) {
    $r = pedir('GET', "$base/clientes", null, $token);
    expectHttp($r, 200);
    return is_array($r['body']['data']);
});

test('7.3 Estado de cuenta', function () use ($base, &$token, &$clienteIdCreado) {
    if (!$clienteIdCreado) throw new RuntimeException('Sin cliente');
    $r = pedir('GET', "$base/clientes/$clienteIdCreado/estado-cuenta", null, $token);
    expectHttp($r, 200);
    return isset($r['body']['data']['cliente']);
});

// =============================================================
// 8. INVENTARIO
// =============================================================

test('8.1 Registrar entrada', function () use ($base, &$token, &$productoIdCreado) {
    if (!$productoIdCreado) throw new RuntimeException('Sin producto');
    $r = pedir('POST', "$base/inventario/movimientos", [
        'producto_id' => $productoIdCreado,
        'tipo' => 'entrada',
        'cantidad' => 10,
        'motivo' => 'Test entrada',
    ], $token);
    expectHttp($r, 201);
    return true;
});

test('8.2 Registrar salida', function () use ($base, &$token, &$productoIdCreado) {
    if (!$productoIdCreado) throw new RuntimeException('Sin producto');
    $r = pedir('POST', "$base/inventario/movimientos", [
        'producto_id' => $productoIdCreado,
        'tipo' => 'salida',
        'cantidad' => 2,
        'motivo' => 'Test salida',
    ], $token);
    expectHttp($r, 201);
    return true;
});

test('8.3 Registrar ajuste', function () use ($base, &$token, &$productoIdCreado) {
    if (!$productoIdCreado) throw new RuntimeException('Sin producto');
    $r = pedir('POST', "$base/inventario/movimientos", [
        'producto_id' => $productoIdCreado,
        'tipo' => 'ajuste',
        'cantidad' => 60,
        'motivo' => 'Test ajuste',
    ], $token);
    expectHttp($r, 201);
    return true;
});

test('8.4 Listar movimientos', function () use ($base, &$token) {
    $r = pedir('GET', "$base/inventario/movimientos?limit=10", null, $token);
    expectHttp($r, 200);
    return is_array($r['body']['data']);
});

// =============================================================
// 9. VENTAS
// =============================================================

test('9.1 Venta de contado', function () use ($base, &$token, &$productoIdCreado, &$ventaIdCreada) {
    if (!$productoIdCreado) throw new RuntimeException('Sin producto');
    $r = pedir('POST', "$base/ventas", [
        'tipo_pago' => 'contado',
        'items' => [['producto_id' => $productoIdCreado, 'cantidad' => 2]],
    ], $token);
    expectHttp($r, 201);
    expectSuccess($r);
    $ventaIdCreada = $r['body']['data']['id'] ?? null;
    return $ventaIdCreada !== null;
});

test('9.2 Venta a crédito', function () use ($base, &$token, &$productoIdCreado, &$clienteIdCreado) {
    if (!$productoIdCreado || !$clienteIdCreado) throw new RuntimeException('Faltan datos');
    $r = pedir('POST', "$base/ventas", [
        'tipo_pago' => 'credito',
        'cliente_id' => $clienteIdCreado,
        'items' => [['producto_id' => $productoIdCreado, 'cantidad' => 1]],
    ], $token);
    expectHttp($r, 201);
    return true;
});

test('9.3 Listar ventas', function () use ($base, &$token) {
    $r = pedir('GET', "$base/ventas?limit=10", null, $token);
    expectHttp($r, 200);
    return isset($r['body']['data']['items']);
});

test('9.4 Detalle de venta', function () use ($base, &$token, &$ventaIdCreada) {
    if (!$ventaIdCreada) throw new RuntimeException('Sin venta');
    $r = pedir('GET', "$base/ventas/$ventaIdCreada", null, $token);
    expectHttp($r, 200);
    return isset($r['body']['data']['detalle']);
});

// =============================================================
// 10. DEVOLUCIONES
// =============================================================

test('10.1 Crear devolución parcial', function () use ($base, &$token, &$ventaIdCreada, &$devolucionIdCreada) {
    if (!$ventaIdCreada) throw new RuntimeException('Sin venta');
    $venta = pedir('GET', "$base/ventas/$ventaIdCreada", null, $token);
    $det = $venta['body']['data']['detalle'][0];
    $r = pedir('POST', "$base/devoluciones", [
        'venta_id' => $ventaIdCreada,
        'motivo' => 'Devolución de prueba',
        'metodo_devolucion' => 'efectivo',
        'items' => [['producto_id' => $det['producto_id'], 'cantidad' => 1]],
    ], $token);
    expectHttp($r, 201);
    expectSuccess($r);
    $devolucionIdCreada = $r['body']['data']['id'] ?? null;
    return $devolucionIdCreada !== null;
});

test('10.2 Listar devoluciones', function () use ($base, &$token) {
    $r = pedir('GET', "$base/devoluciones?limit=10", null, $token);
    expectHttp($r, 200);
    return is_array($r['body']['data']);
});

test('10.3 Detalle de devolución', function () use ($base, &$token, &$devolucionIdCreada) {
    if (!$devolucionIdCreada) throw new RuntimeException('Sin devolución');
    $r = pedir('GET', "$base/devoluciones/$devolucionIdCreada", null, $token);
    expectHttp($r, 200);
    return isset($r['body']['data']['detalle']);
});

// =============================================================
// 11. PAGOS DE CRÉDITO
// =============================================================

test('11.1 Registrar pago de crédito', function () use ($base, &$token, &$clienteIdCreado) {
    if (!$clienteIdCreado) throw new RuntimeException('Sin cliente');
    $r = pedir('POST', "$base/clientes/$clienteIdCreado/pagos", [
        'monto' => 100,
        'metodo_pago' => 'efectivo',
        'notas' => 'Pago de prueba',
    ], $token);
    expectHttp($r, 201);
    return true;
});

// =============================================================
// 12. PROMOCIONES
// =============================================================

test('12.1 Crear promoción', function () use ($base, &$token, &$productoIdCreado, &$promocionIdCreada) {
    if (!$productoIdCreado) throw new RuntimeException('Sin producto');
    $hoy = date('Y-m-d');
    $fin = date('Y-m-d', strtotime('+30 days'));
    $r = pedir('POST', "$base/promociones", [
        'nombre' => 'Promo Test ' . time(),
        'tipo' => 'porcentaje',
        'valor' => 20,
        'aplica_a' => 'producto',
        'producto_id' => $productoIdCreado,
        'fecha_inicio' => $hoy,
        'fecha_fin' => $fin,
        'activo' => 1,
    ], $token);
    expectHttp($r, 201);
    $promocionIdCreada = $r['body']['data']['id'] ?? null;
    return $promocionIdCreada !== null;
});

test('12.2 Listar promociones', function () use ($base, &$token) {
    $r = pedir('GET', "$base/promociones", null, $token);
    expectHttp($r, 200);
    return is_array($r['body']['data']);
});

test('12.3 Actualizar promoción', function () use ($base, &$token, &$promocionIdCreada) {
    if (!$promocionIdCreada) throw new RuntimeException('Sin promo');
    $r = pedir('PUT', "$base/promociones/$promocionIdCreada", [
        'nombre' => 'Promo Actualizada',
    ], $token);
    expectHttp($r, 200);
    return true;
});

test('12.4 Desactivar promoción', function () use ($base, &$token, &$promocionIdCreada) {
    if (!$promocionIdCreada) throw new RuntimeException('Sin promo');
    $r = pedir('DELETE', "$base/promociones/$promocionIdCreada", null, $token);
    expectHttp($r, 200);
    return true;
});

// =============================================================
// 13. ÓRDENES DE COMPRA
// =============================================================

test('13.1 Crear orden de compra', function () use ($base, &$token, &$productoIdCreado, &$ordenCompraIdCreada) {
    if (!$productoIdCreado) throw new RuntimeException('Sin producto');
    $provs = pedir('GET', "$base/proveedores", null, $token);
    if (empty($provs['body']['data'])) throw new RuntimeException('Sin proveedores');
    $provId = $provs['body']['data'][0]['id'];
    $r = pedir('POST', "$base/ordenes-compra", [
        'proveedor_id' => $provId,
        'estado' => 'borrador',
        'items' => [
            ['producto_id' => $productoIdCreado, 'cantidad' => 10, 'precio_unitario' => 800],
        ],
    ], $token);
    expectHttp($r, 201);
    $ordenCompraIdCreada = $r['body']['data']['id'] ?? null;
    return $ordenCompraIdCreada !== null;
});

test('13.2 Detalle de orden de compra', function () use ($base, &$token, &$ordenCompraIdCreada) {
    if (!$ordenCompraIdCreada) throw new RuntimeException('Sin OC');
    $r = pedir('GET', "$base/ordenes-compra/$ordenCompraIdCreada", null, $token);
    expectHttp($r, 200);
    return isset($r['body']['data']['detalle']);
});

test('13.3 Marcar orden como enviada', function () use ($base, &$token, &$ordenCompraIdCreada) {
    if (!$ordenCompraIdCreada) throw new RuntimeException('Sin OC');
    $r = pedir('POST', "$base/ordenes-compra/$ordenCompraIdCreada/estado", [
        'estado' => 'enviada',
    ], $token);
    expectHttp($r, 200);
    return true;
});

test('13.4 Recibir mercancía', function () use ($base, &$token, &$ordenCompraIdCreada) {
    if (!$ordenCompraIdCreada) throw new RuntimeException('Sin OC');
    $detalle = pedir('GET', "$base/ordenes-compra/$ordenCompraIdCreada", null, $token);
    $det = $detalle['body']['data']['detalle'][0];
    $r = pedir('POST', "$base/ordenes-compra/$ordenCompraIdCreada/recibir", [
        'recepciones' => [['detalle_id' => $det['id'], 'cantidad' => 10]],
    ], $token);
    expectHttp($r, 200);
    return true;
});

// =============================================================
// 14. LEALTAD
// =============================================================

test('14.1 Info de lealtad de cliente', function () use ($base, &$token, &$clienteIdCreado) {
    if (!$clienteIdCreado) throw new RuntimeException('Sin cliente');
    $r = pedir('GET', "$base/lealtad/cliente/$clienteIdCreado", null, $token);
    expectHttp($r, 200);
    return isset($r['body']['data']['puntos_actuales']);
});

test('14.2 Historial de puntos', function () use ($base, &$token, &$clienteIdCreado) {
    if (!$clienteIdCreado) throw new RuntimeException('Sin cliente');
    $r = pedir('GET', "$base/lealtad/cliente/$clienteIdCreado/historial", null, $token);
    expectHttp($r, 200);
    return is_array($r['body']['data']);
});

test('14.3 Ranking de lealtad', function () use ($base, &$token) {
    $r = pedir('GET', "$base/lealtad/ranking", null, $token);
    expectHttp($r, 200);
    return is_array($r['body']['data']);
});

test('14.4 Ajustar puntos manualmente', function () use ($base, &$token, &$clienteIdCreado) {
    if (!$clienteIdCreado) throw new RuntimeException('Sin cliente');
    $r = pedir('POST', "$base/lealtad/cliente/$clienteIdCreado/ajustar", [
        'puntos' => 100,
        'motivo' => 'Ajuste de prueba',
    ], $token);
    expectHttp($r, 200);
    return true;
});

// =============================================================
// 15. CAJA
// =============================================================

test('15.1 Estado de caja (puede ser null)', function () use ($base, &$token) {
    $r = pedir('GET', "$base/caja/estado", null, $token);
    expectHttp($r, 200);
    return true;
});

test('15.2 Abrir caja', function () use ($base, &$token) {
    $estado = pedir('GET', "$base/caja/estado", null, $token);
    if (!empty($estado['body']['data']['id'])) {
        pedir('POST', "$base/caja/{$estado['body']['data']['id']}/cerrar", [
            'monto_cierre_declarado' => 0,
        ], $token);
    }
    $r = pedir('POST', "$base/caja/abrir", [
        'monto_apertura' => 100000,
        'notas_apertura' => 'Test apertura',
    ], $token);
    expectHttp($r, 201);
    return true;
});

test('15.3 Registrar movimiento de caja', function () use ($base, &$token) {
    $estado = pedir('GET', "$base/caja/estado", null, $token);
    if (empty($estado['body']['data']['id'])) throw new RuntimeException('Sin caja abierta');
    $r = pedir('POST', "$base/caja/{$estado['body']['data']['id']}/movimientos", [
        'tipo' => 'egreso',
        'monto' => 5000,
        'descripcion' => 'Test egreso',
    ], $token);
    expectHttp($r, 201);
    return true;
});

test('15.4 Cerrar caja', function () use ($base, &$token) {
    $estado = pedir('GET', "$base/caja/estado", null, $token);
    if (empty($estado['body']['data']['id'])) throw new RuntimeException('Sin caja');
    $r = pedir('POST', "$base/caja/{$estado['body']['data']['id']}/cerrar", [
        'monto_cierre_declarado' => 95000,
        'notas_cierre' => 'Test cierre',
    ], $token);
    expectHttp($r, 200);
    return true;
});

test('15.5 Historial de caja', function () use ($base, &$token) {
    $r = pedir('GET', "$base/caja/historial", null, $token);
    expectHttp($r, 200);
    return is_array($r['body']['data']);
});

// =============================================================
// 16. REPORTES
// =============================================================

test('16.1 Reporte resumen', function () use ($base, &$token) {
    $r = pedir('GET', "$base/reportes/resumen", null, $token);
    expectHttp($r, 200);
    return isset($r['body']['data']['ventas_hoy']);
});

test('16.2 Ventas por día', function () use ($base, &$token) {
    $r = pedir('GET', "$base/reportes/ventas-por-dia", null, $token);
    expectHttp($r, 200);
    return is_array($r['body']['data']);
});

test('16.3 Productos más vendidos', function () use ($base, &$token) {
    $r = pedir('GET', "$base/reportes/productos-mas-vendidos?limit=5", null, $token);
    expectHttp($r, 200);
    return is_array($r['body']['data']);
});

test('16.4 Cartera', function () use ($base, &$token) {
    $r = pedir('GET', "$base/reportes/cartera", null, $token);
    expectHttp($r, 200);
    return isset($r['body']['data']['total_cartera']);
});

// =============================================================
// 17. DASHBOARD AVANZADO
// =============================================================

test('17.1 Dashboard avanzado (mes)', function () use ($base, &$token) {
    $r = pedir('GET', "$base/dashboard/avanzado?periodo=mes", null, $token);
    expectHttp($r, 200);
    return isset($r['body']['data']['kpis']['ventas_periodo']);
});

test('17.2 Dashboard con todos los períodos', function () use ($base, &$token) {
    foreach (['hoy', 'ayer', 'semana', 'mes', 'anio'] as $p) {
        $r = pedir('GET', "$base/dashboard/avanzado?periodo=$p", null, $token);
        expectHttp($r, 200, "Período $p: ");
    }
    return true;
});

// =============================================================
// 18. BÚSQUEDA GLOBAL
// =============================================================

test('18.1 Búsqueda global', function () use ($base, &$token) {
    $r = pedir('GET', "$base/buscar?q=coca", null, $token);
    expectHttp($r, 200);
    expectSuccess($r);
    return isset($r['body']['data']['productos']);
});

test('18.2 Búsqueda con término corto', function () use ($base, &$token) {
    $r = pedir('GET', "$base/buscar?q=a", null, $token);
    expectHttp($r, 200);
    return true;
});

// =============================================================
// 19. NOTIFICACIONES
// =============================================================

test('19.1 Listar notificaciones', function () use ($base, &$token) {
    $r = pedir('GET', "$base/notificaciones", null, $token);
    expectHttp($r, 200);
    return isset($r['body']['data']['items']);
});

// =============================================================
// 20. ANULAR VENTA (destructivo, va al final)
// =============================================================

test('20.1 Anular venta', function () use ($base, &$token, &$ventaIdCreada) {
    if (!$ventaIdCreada) throw new RuntimeException('Sin venta');
    $r = pedir('POST', "$base/ventas/$ventaIdCreada/anular", [
        'motivo' => 'Anulación de prueba',
    ], $token);
    expectHttp($r, 200);
    return true;
});

// =============================================================
// RESULTADOS
// =============================================================

$total = count($resultados);
$pass = 0;
$fail = 0;
$fallos = [];

foreach ($resultados as $r) {
    if ($r['ok']) {
        $pass++;
        echo "✅ {$r['test']}\n";
    } else {
        $fail++;
        $fallos[] = $r;
        echo "❌ {$r['test']}";
        if ($r['error']) echo " — {$r['error']}";
        echo "\n";
    }
}

echo "\n";
echo "╔═══════════════════════════════════════════════════╗\n";
echo "║                    RESULTADO                       ║\n";
echo "╚═══════════════════════════════════════════════════╝\n";
echo "Total:    {$total}\n";
echo "Pasaron: {$pass} ✅\n";
echo "Fallaron: {$fail} ❌\n\n";

if ($fail > 0) {
    echo "DETALLES DE FALLOS:\n";
    foreach ($fallos as $f) {
        echo "  • {$f['test']}\n";
        if ($f['error']) echo "    → {$f['error']}\n";
    }
}

$jsonFile = __DIR__ . '/test_resultados.json';
file_put_contents($jsonFile, json_encode([
    'total' => $total,
    'pass' => $pass,
    'fail' => $fail,
    'resultados' => $resultados,
], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

echo "\nResultados guardados en: {$jsonFile}\n";

if (!$esCli) {
    echo "</pre>";
}

exit($fail > 0 ? 1 : 0);