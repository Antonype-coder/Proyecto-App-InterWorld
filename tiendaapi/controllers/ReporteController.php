<?php
declare(strict_types=1);

require_once __DIR__ . '/../core/Request.php';
require_once __DIR__ . '/../core/Response.php';
require_once __DIR__ . '/../services/ReporteService.php';

if (!class_exists('ReporteController')) {
    class ReporteController
    {
        private ReporteService $service;

        public function __construct()
        {
            $this->service = new ReporteService();
        }

        public function ventasPorDia(Request $request): void
        {
            $desde = $request->getQuery('desde');
            $hasta = $request->getQuery('hasta');

            $result = $this->service->ventasPorDia($desde, $hasta);
            Response::success($result, 'Reporte de ventas por día.');
        }

        public function productosMasVendidos(Request $request): void
        {
            $limit = (int) $request->getQuery('limit', 10);
            if ($limit <= 0 || $limit > 100) $limit = 10;

            $result = $this->service->productosMasVendidos(
                $limit,
                $request->getQuery('desde'),
                $request->getQuery('hasta')
            );
            Response::success($result, 'Productos más vendidos.');
        }

        public function stockBajo(Request $request): void
        {
            Response::success($this->service->stockBajo(), 'Productos con stock bajo.');
        }

        public function cartera(Request $request): void
        {
            Response::success($this->service->cartera(), 'Cartera total.');
        }

        public function resumen(Request $request): void
        {
            Response::success($this->service->resumen(), 'Resumen del dashboard.');
        }
    }
}