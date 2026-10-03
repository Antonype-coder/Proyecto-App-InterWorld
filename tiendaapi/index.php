<?php
declare(strict_types=1);

// =====================================================================================
// Punto de entrada único del API TiendaAdmin
// =====================================================================================

// 1) Autoload de Composer (opcional, no obligatorio)
$composerAutoload = __DIR__ . '/vendor/autoload.php';
if (is_file($composerAutoload)) {
    require_once $composerAutoload;
}

// 2) Entorno
require_once __DIR__ . '/config/env.php';
require_once __DIR__ . '/config/app.php';

$appDebug = (bool) (getenv('APP_DEBUG') === 'true' || getenv('APP_DEBUG') === '1');

if ($appDebug) {
    error_reporting(E_ALL);
    ini_set('display_errors', '1');
} else {
    error_reporting(E_ALL & ~E_DEPRECATED & ~E_NOTICE);
    ini_set('display_errors', '0');
}

// 3) Core
require_once __DIR__ . '/core/Logger.php';
require_once __DIR__ . '/core/Response.php';
require_once __DIR__ . '/core/Request.php';
require_once __DIR__ . '/core/Router.php';
require_once __DIR__ . '/core/Auth.php';
require_once __DIR__ . '/core/Validator.php';

// 4) CORS + Preflight
require_once __DIR__ . '/middleware/CorsMiddleware.php';
CorsMiddleware::handle();

// 5) Excepciones tipadas
require_once __DIR__ . '/core/Exceptions/HttpException.php';
require_once __DIR__ . '/core/Exceptions/ValidationException.php';
require_once __DIR__ . '/core/Exceptions/NotFoundException.php';
require_once __DIR__ . '/core/Exceptions/UnauthorizedException.php';
require_once __DIR__ . '/core/Exceptions/ForbiddenException.php';
require_once __DIR__ . '/core/Exceptions/ConflictException.php';
require_once __DIR__ . '/core/Exceptions/BusinessException.php';

// 6) Configuración base
require_once __DIR__ . '/config/database.php';

// 7) Utilidades
require_once __DIR__ . '/utils/Helpers.php';
require_once __DIR__ . '/utils/Jwt.php';
require_once __DIR__ . '/utils/Money.php';
require_once __DIR__ . '/utils/FolioGenerator.php';
require_once __DIR__ . '/utils/Upload.php';

// 8) Middleware
require_once __DIR__ . '/middleware/AuthMiddleware.php';
require_once __DIR__ . '/middleware/RoleMiddleware.php';
require_once __DIR__ . '/middleware/RateLimitMiddleware.php';
require_once __DIR__ . '/middleware/AuditMiddleware.php';

// 9) Modelos
require_once __DIR__ . '/models/BaseModel.php';
require_once __DIR__ . '/models/Usuario.php';
require_once __DIR__ . '/models/Categoria.php';
require_once __DIR__ . '/models/Proveedor.php';
require_once __DIR__ . '/models/Producto.php';
require_once __DIR__ . '/models/Cliente.php';
require_once __DIR__ . '/models/Venta.php';
require_once __DIR__ . '/models/MovimientoInventario.php';
require_once __DIR__ . '/models/Notificacion.php';
require_once __DIR__ . '/models/AuditoriaLog.php';
require_once __DIR__ . '/models/Configuracion.php';

// 10) Servicios
require_once __DIR__ . '/services/AuthService.php';
require_once __DIR__ . '/services/VentaService.php';
require_once __DIR__ . '/services/InventarioService.php';
require_once __DIR__ . '/services/CreditoService.php';
require_once __DIR__ . '/services/CajaService.php';
require_once __DIR__ . '/services/ReporteService.php';
require_once __DIR__ . '/services/NotificacionService.php';
require_once __DIR__ . '/services/AuditoriaService.php';

// 11) Controladores
require_once __DIR__ . '/controllers/AuthController.php';
require_once __DIR__ . '/controllers/UsuarioController.php';
require_once __DIR__ . '/controllers/CategoriaController.php';
require_once __DIR__ . '/controllers/ProveedorController.php';
require_once __DIR__ . '/controllers/ProductoController.php';
require_once __DIR__ . '/controllers/ClienteController.php';
require_once __DIR__ . '/controllers/InventarioController.php';
require_once __DIR__ . '/controllers/VentaController.php';
require_once __DIR__ . '/controllers/CajaController.php';
require_once __DIR__ . '/controllers/ReporteController.php';
require_once __DIR__ . '/controllers/DashboardController.php';
require_once __DIR__ . '/controllers/NotificacionController.php';
require_once __DIR__ . '/controllers/AuditoriaController.php';
require_once __DIR__ . '/controllers/ConfiguracionController.php';
require_once __DIR__ . '/controllers/UploadController.php';

// 12) Manejo global de excepciones
set_exception_handler(function (Throwable $e) use ($appDebug): void {
    $status = 500;
    $data   = null;

    if ($e instanceof HttpException) {
        $status = $e->getStatusCode();
        $data   = $e->getData();
    } elseif ($e instanceof InvalidArgumentException) {
        $status = 400;
    } elseif ($e instanceof RuntimeException) {
        $status = 400;
    }

    Logger::error($e->getMessage(), [
        'file' => $e->getFile(),
        'line' => $e->getLine(),
        'type' => get_class($e),
    ]);

    $payload = [
        'success' => false,
        'data'    => $appDebug
            ? ($data ?? [
                'file'  => $e->getFile(),
                'line'  => $e->getLine(),
                'trace' => explode("\n", $e->getTraceAsString()),
            ])
            : $data,
        'message' => $appDebug ? $e->getMessage() : ($status >= 500 ? 'Error interno del servidor' : $e->getMessage()),
    ];

    Response::json($payload, $status);
});

set_error_handler(function (int $severity, string $message, string $file, int $line): bool {
    if (!(error_reporting() & $severity)) {
        return false;
    }
    throw new ErrorException($message, 0, $severity, $file, $line);
});

// 13) Router y rutas
$router = new Router();
require_once __DIR__ . '/routes/api.php';

// 14) Despacho
$request = new Request();
$router->dispatch($request);