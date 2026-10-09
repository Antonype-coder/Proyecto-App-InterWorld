<?php
declare(strict_types=1);

/**
 * Registro de rutas del API TiendaAdmin.
 *
 * @var Router $router
 */

require_once __DIR__ . '/../middleware/AuthMiddleware.php';
require_once __DIR__ . '/../middleware/RateLimitMiddleware.php';
require_once __DIR__ . '/../controllers/AuthController.php';
require_once __DIR__ . '/../controllers/UsuarioController.php';
require_once __DIR__ . '/../controllers/CategoriaController.php';
require_once __DIR__ . '/../controllers/ProveedorController.php';
require_once __DIR__ . '/../controllers/ProductoController.php';
require_once __DIR__ . '/../controllers/ClienteController.php';
require_once __DIR__ . '/../controllers/InventarioController.php';
require_once __DIR__ . '/../controllers/VentaController.php';
require_once __DIR__ . '/../controllers/CajaController.php';
require_once __DIR__ . '/../controllers/ReporteController.php';
require_once __DIR__ . '/../controllers/DashboardController.php';
require_once __DIR__ . '/../controllers/NotificacionController.php';
require_once __DIR__ . '/../controllers/AuditoriaController.php';
require_once __DIR__ . '/../controllers/ConfiguracionController.php';
require_once __DIR__ . '/../controllers/UploadController.php';
require_once __DIR__ . '/../controllers/DevolucionController.php';
require_once __DIR__ . '/../controllers/PromocionController.php';
require_once __DIR__ . '/../controllers/OrdenCompraController.php';
require_once __DIR__ . '/../controllers/LealtadController.php';
require_once __DIR__ . '/../controllers/BusquedaController.php';

$auth      = [AuthMiddleware::class, 'handle'];
$adminOnly = [AuthMiddleware::class, 'adminOnly'];
$anyRole   = [AuthMiddleware::class, 'anyRole'];
$rateLimit = [RateLimitMiddleware::class, 'login'];

// ==================================================================
// HEALTH CHECK
// ==================================================================
$router->get('/api/health', function (Request $req): void {
    Response::success([
        'status'    => 'ok',
        'timestamp' => tienda_now(),
        'version'   => '2.0.0',
    ], 'API TiendaAdmin operativa');
});

// ==================================================================
// AUTH
// ==================================================================
$router->post('/api/auth/login',              'AuthController@login',             $rateLimit);
$router->post('/api/auth/registrar-negocio',  'AuthController@registrarNegocio');
$router->post('/api/auth/register',           'AuthController@register',          $adminOnly);
$router->get ('/api/auth/me',                 'AuthController@me',                $auth);
$router->post('/api/auth/logout',             'AuthController@logout',            $auth);
$router->post('/api/auth/change-password',    'AuthController@changePassword',    $auth);

// ==================================================================
// USUARIOS (solo admin)
// ==================================================================
$router->get   ('/api/usuarios',      'UsuarioController@index',   $adminOnly);
$router->get   ('/api/usuarios/{id}', 'UsuarioController@show',    $adminOnly);
$router->post  ('/api/usuarios',      'UsuarioController@store',   $adminOnly);
$router->put   ('/api/usuarios/{id}', 'UsuarioController@update',  $adminOnly);
$router->delete('/api/usuarios/{id}', 'UsuarioController@destroy', $adminOnly);

// ==================================================================
// CATEGORÍAS
// ==================================================================
$router->get   ('/api/categorias',      'CategoriaController@index',   $auth);
$router->get   ('/api/categorias/{id}', 'CategoriaController@show',    $auth);
$router->post  ('/api/categorias',      'CategoriaController@store',   $adminOnly);
$router->put   ('/api/categorias/{id}', 'CategoriaController@update',  $adminOnly);
$router->delete('/api/categorias/{id}', 'CategoriaController@destroy', $adminOnly);

// ==================================================================
// PROVEEDORES
// ==================================================================
$router->get   ('/api/proveedores',      'ProveedorController@index',   $auth);
$router->get   ('/api/proveedores/{id}', 'ProveedorController@show',    $auth);
$router->post  ('/api/proveedores',      'ProveedorController@store',   $adminOnly);
$router->put   ('/api/proveedores/{id}', 'ProveedorController@update',  $adminOnly);
$router->delete('/api/proveedores/{id}', 'ProveedorController@destroy', $adminOnly);

// ==================================================================
// PRODUCTOS (rutas específicas ANTES de {id})
// ==================================================================
$router->get ('/api/productos/barcode/{codigo}',   'ProductoController@findByBarcode', $auth);
$router->get ('/api/productos/stock-bajo',         'ProductoController@stockBajo',     $auth);
$router->get ('/api/productos/{id}/estadisticas',  'ProductoController@estadisticas',  $auth);
$router->get ('/api/productos',                    'ProductoController@index',         $auth);
$router->get ('/api/productos/{id}',               'ProductoController@show',          $auth);
$router->post('/api/productos',                    'ProductoController@store',         $adminOnly);
$router->put ('/api/productos/{id}',               'ProductoController@update',        $adminOnly);
$router->delete('/api/productos/{id}/permanente',  'ProductoController@destroyPermanente', $adminOnly);
$router->delete('/api/productos/{id}',             'ProductoController@destroy',       $adminOnly);

// ==================================================================
// CLIENTES
// ==================================================================
$router->get ('/api/clientes/{id}/estado-cuenta', 'ClienteController@estadoCuenta',  $auth);
$router->post('/api/clientes/{id}/pagos',         'ClienteController@registrarPago', $auth);
$router->get ('/api/clientes',                    'ClienteController@index',         $auth);
$router->get ('/api/clientes/{id}',               'ClienteController@show',          $auth);
$router->post('/api/clientes',                    'ClienteController@store',         $auth);
$router->put ('/api/clientes/{id}',               'ClienteController@update',        $auth);
$router->delete('/api/clientes/{id}',             'ClienteController@destroy',       $adminOnly);

// ==================================================================
// INVENTARIO
// ==================================================================
$router->post('/api/inventario/movimientos', 'InventarioController@registrarMovimiento', $auth);
$router->get ('/api/inventario/movimientos', 'InventarioController@listarMovimientos',   $auth);

// ==================================================================
// VENTAS
// ==================================================================
$router->post('/api/ventas/{id}/anular', 'VentaController@anular', $adminOnly);
$router->post('/api/ventas',             'VentaController@store',  $auth);
$router->get ('/api/ventas',             'VentaController@index',  $auth);
$router->get ('/api/ventas/{id}',        'VentaController@show',   $auth);

// ==================================================================
// CAJA
// ==================================================================
$router->get ('/api/caja/estado',           'CajaController@estado',      $auth);
$router->post('/api/caja/abrir',            'CajaController@abrir',       $auth);
$router->post('/api/caja/{id}/cerrar',      'CajaController@cerrar',      $auth);
$router->post('/api/caja/{id}/movimientos', 'CajaController@movimiento',  $auth);
$router->get ('/api/caja/{id}/movimientos', 'CajaController@movimientos', $auth);
$router->get ('/api/caja/historial',        'CajaController@historial',   $auth);

// ==================================================================
// DEVOLUCIONES
// ==================================================================
$router->get ('/api/devoluciones',      'DevolucionController@index', $auth);
$router->get ('/api/devoluciones/{id}', 'DevolucionController@show',  $auth);
$router->post('/api/devoluciones',      'DevolucionController@store', $auth);

// ==================================================================
// PROMOCIONES
// ==================================================================
$router->get ('/api/promociones/vigentes', 'PromocionController@paraProducto', $auth);
$router->get ('/api/promociones',          'PromocionController@index',        $auth);
$router->get ('/api/promociones/{id}',     'PromocionController@show',         $auth);
$router->post('/api/promociones',          'PromocionController@store',        $adminOnly);
$router->put ('/api/promociones/{id}',     'PromocionController@update',       $adminOnly);
$router->delete('/api/promociones/{id}',   'PromocionController@destroy',      $adminOnly);

// ==================================================================
// ÓRDENES DE COMPRA
// ==================================================================
$router->get ('/api/ordenes-compra',              'OrdenCompraController@index',         $auth);
$router->get ('/api/ordenes-compra/{id}',         'OrdenCompraController@show',          $auth);
$router->post('/api/ordenes-compra',              'OrdenCompraController@store',         $adminOnly);
$router->post('/api/ordenes-compra/{id}/estado',  'OrdenCompraController@cambiarEstado', $adminOnly);
$router->post('/api/ordenes-compra/{id}/recibir', 'OrdenCompraController@recibir',       $adminOnly);

// ==================================================================
// LEALTAD
// ==================================================================
$router->get ('/api/lealtad/ranking',                'LealtadController@ranking',     $auth);
$router->get ('/api/lealtad/cliente/{id}',           'LealtadController@infoCliente', $auth);
$router->get ('/api/lealtad/cliente/{id}/historial', 'LealtadController@historial',   $auth);
$router->post('/api/lealtad/cliente/{id}/canjear',   'LealtadController@canjear',     $auth);
$router->post('/api/lealtad/cliente/{id}/ajustar',   'LealtadController@ajustar',     $adminOnly);

// ==================================================================
// BÚSQUEDA GLOBAL
// ==================================================================
$router->get('/api/buscar', 'BusquedaController@buscar', $auth);

// ==================================================================
// REPORTES
// ==================================================================
$router->get('/api/reportes/resumen',                'ReporteController@resumen',              $adminOnly);
$router->get('/api/reportes/ventas-por-dia',         'ReporteController@ventasPorDia',         $adminOnly);
$router->get('/api/reportes/productos-mas-vendidos', 'ReporteController@productosMasVendidos', $adminOnly);
$router->get('/api/reportes/stock-bajo',             'ReporteController@stockBajo',            $adminOnly);
$router->get('/api/reportes/cartera',                'ReporteController@cartera',              $adminOnly);

// ==================================================================
// DASHBOARD
// ==================================================================
$router->get('/api/dashboard/resumen',     'DashboardController@resumen',     $auth);
$router->get('/api/dashboard/avanzado',    'DashboardController@avanzado',    $auth);
$router->get('/api/dashboard/comparacion', 'DashboardController@comparacion', $auth);

// ==================================================================
// NOTIFICACIONES
// ==================================================================
$router->get  ('/api/notificaciones',              'NotificacionController@index',       $auth);
$router->patch('/api/notificaciones/{id}/leida',   'NotificacionController@marcarLeida', $auth);
$router->post ('/api/notificaciones/marcar-todas', 'NotificacionController@marcarTodas', $auth);

// ==================================================================
// AUDITORÍA (solo admin)
// ==================================================================
$router->get('/api/auditoria', 'AuditoriaController@index', $adminOnly);

// ==================================================================
// CONFIGURACIÓN
// ==================================================================
$router->get   ('/api/configuracion',      'ConfiguracionController@index',      $auth);
$router->put   ('/api/configuracion',      'ConfiguracionController@update',     $adminOnly);
$router->put   ('/api/configuracion/logo', 'ConfiguracionController@updateLogo', $auth);
$router->delete('/api/configuracion/logo', 'ConfiguracionController@deleteLogo', $auth);

// ==================================================================
// UPLOADS
// ==================================================================
$router->post('/api/uploads/productos', 'UploadController@imagenProducto', $auth);
$router->post('/api/uploads/logo',      'UploadController@imagenLogo',     $auth);