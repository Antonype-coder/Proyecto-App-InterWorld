<?php
declare(strict_types=1);

require_once __DIR__ . '/../core/Request.php';
require_once __DIR__ . '/../core/Response.php';
require_once __DIR__ . '/../services/ReporteService.php';
require_once __DIR__ . '/../services/NotificacionService.php';
require_once __DIR__ . '/../core/Auth.php';

if (!class_exists('DashboardController')) {
    class DashboardController
    {
        private ReporteService $reportes;
        private NotificacionService $notificaciones;

        public function __construct()
        {
            $this->reportes = new ReporteService();
            $this->notificaciones = new NotificacionService();
        }

        /**
         * Resumen básico (compatibilidad con código previo).
         */
        public function resumen(Request $request): void
        {
            $usuarioId = Auth::id();
            $data = $this->reportes->resumen();

            if ($usuarioId !== null) {
                $data['notificaciones_no_leidas'] = $this->notificaciones->noLeidas($usuarioId);
            }

            Response::success($data, 'Resumen del dashboard.');
        }

        /**
         * Dashboard avanzado con múltiples gráficos y comparaciones.
         */
        public function avanzado(Request $request): void
        {
            $periodo = (string) $request->getQuery('periodo', 'mes');
            $periodosValidos = ['hoy', 'ayer', 'semana', 'mes', 'anio'];
            if (!in_array($periodo, $periodosValidos, true)) {
                $periodo = 'mes';
            }

            $usuarioId = Auth::id();
            $data = $this->reportes->dashboardAvanzado($periodo);

            if ($usuarioId !== null) {
                $data['notificaciones_no_leidas'] = $this->notificaciones->noLeidas($usuarioId);
            }

            Response::success($data, 'Dashboard avanzado obtenido.');
        }

        /**
         * Comparación de dos períodos arbitrarios.
         */
        public function comparacion(Request $request): void
        {
            $desde1 = (string) $request->getQuery('desde1', date('Y-m-01'));
            $hasta1 = (string) $request->getQuery('hasta1', date('Y-m-d'));
            $desde2 = (string) $request->getQuery('desde2', date('Y-m-01', strtotime('-1 month')));
            $hasta2 = (string) $request->getQuery('hasta2', date('Y-m-t', strtotime('-1 month')));

            $data = $this->reportes->comparacionPeriodos($desde1, $hasta1, $desde2, $hasta2);
            Response::success($data, 'Comparación obtenida.');
        }
    }
}