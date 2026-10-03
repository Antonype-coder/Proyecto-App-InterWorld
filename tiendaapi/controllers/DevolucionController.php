<?php
declare(strict_types=1);

require_once __DIR__ . '/../core/Request.php';
require_once __DIR__ . '/../core/Response.php';
require_once __DIR__ . '/../core/Validator.php';
require_once __DIR__ . '/../core/Auth.php';
require_once __DIR__ . '/../services/DevolucionService.php';

if (!class_exists('DevolucionController')) {
    class DevolucionController
    {
        private DevolucionService $service;

        public function __construct()
        {
            $this->service = new DevolucionService();
        }

        public function index(Request $request): void
        {
            $filtros = [
                'estado' => $request->getQuery('estado'),
                'desde' => $request->getQuery('desde'),
                'hasta' => $request->getQuery('hasta'),
            ];
            $limit = (int)$request->getQuery('limit', 50);
            $offset = (int)$request->getQuery('offset', 0);
            if ($limit <= 0 || $limit > 200) $limit = 50;
            if ($offset < 0) $offset = 0;

            $items = $this->service->listar($filtros, $limit, $offset);
            Response::success($items, 'Devoluciones obtenidas.');
        }

        public function show(Request $request): void
        {
            $id = (int)$request->param('id');
            Response::success($this->service->obtener($id), 'Devolución obtenida.');
        }

        public function store(Request $request): void
        {
            $data = $request->all();
            $v = new Validator($data);
            $v->required('venta_id')->integer('venta_id')
              ->required('motivo')->minLength('motivo', 3)->maxLength('motivo', 255)
              ->required('items')->arrayField('items');

            if ($v->fails()) Response::validationError($v->errors());

            $usuarioId = Auth::id();
            if ($usuarioId === null) Response::unauthorized('No autenticado.');

            $dev = $this->service->crear($data, $usuarioId);
            Response::created($dev, 'Devolución registrada correctamente.');
        }
    }
}