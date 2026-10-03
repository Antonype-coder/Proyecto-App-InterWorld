<?php
declare(strict_types=1);

require_once __DIR__ . '/../core/Request.php';
require_once __DIR__ . '/../core/Response.php';
require_once __DIR__ . '/../services/AuditoriaService.php';

if (!class_exists('AuditoriaController')) {
    class AuditoriaController
    {
        private AuditoriaService $service;

        public function __construct()
        {
            $this->service = new AuditoriaService();
        }

        public function index(Request $request): void
        {
            $filtros = [
                'usuario_id' => $request->getQuery('usuario_id'),
                'entidad'    => $request->getQuery('entidad'),
                'accion'     => $request->getQuery('accion'),
                'desde'      => $request->getQuery('desde'),
                'hasta'      => $request->getQuery('hasta'),
            ];

            $limit  = (int) $request->getQuery('limit', 100);
            $offset = (int) $request->getQuery('offset', 0);
            if ($limit <= 0 || $limit > 500) $limit = 100;
            if ($offset < 0) $offset = 0;

            $items = $this->service->listar($filtros, $limit, $offset);
            Response::success($items, 'Logs de auditoría obtenidos.');
        }
    }
}