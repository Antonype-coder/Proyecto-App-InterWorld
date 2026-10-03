<?php
declare(strict_types=1);

require_once __DIR__ . '/../core/Request.php';
require_once __DIR__ . '/../core/Response.php';
require_once __DIR__ . '/../core/Validator.php';
require_once __DIR__ . '/../core/Auth.php';
require_once __DIR__ . '/../services/InventarioService.php';

if (!class_exists('InventarioController')) {
    class InventarioController
    {
        private InventarioService $service;

        public function __construct()
        {
            $this->service = new InventarioService();
        }

        public function registrarMovimiento(Request $request): void
        {
            $data = $request->all();

            $v = new Validator($data);
            $v->required('producto_id')->integer('producto_id')->min('producto_id', 1)
              ->required('tipo')->in('tipo', ['entrada', 'salida', 'ajuste'])
              ->required('cantidad')->integer('cantidad')->min('cantidad', 0);

            if ($v->fails()) {
                Response::validationError($v->errors());
            }

            $usuarioId = Auth::id();
            if ($usuarioId === null) {
                Response::unauthorized('No autenticado.');
            }

            $result = $this->service->registrarMovimiento($data, $usuarioId);

            Response::created($result, 'Movimiento de inventario registrado correctamente.');
        }

        public function listarMovimientos(Request $request): void
        {
            $filtros = [
                'producto_id' => $request->getQuery('producto_id'),
                'tipo'        => $request->getQuery('tipo'),
                'desde'       => $request->getQuery('desde'),
                'hasta'       => $request->getQuery('hasta'),
            ];

            $limit  = (int) $request->getQuery('limit', 100);
            $offset = (int) $request->getQuery('offset', 0);
            if ($limit <= 0 || $limit > 500) $limit = 100;
            if ($offset < 0) $offset = 0;

            $movs = $this->service->listarMovimientos($filtros, $limit, $offset);
            Response::success($movs, 'Movimientos obtenidos correctamente.');
        }
    }
}