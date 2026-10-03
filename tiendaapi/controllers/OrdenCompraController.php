<?php
declare(strict_types=1);

require_once __DIR__ . '/../core/Request.php';
require_once __DIR__ . '/../core/Response.php';
require_once __DIR__ . '/../core/Validator.php';
require_once __DIR__ . '/../core/Auth.php';
require_once __DIR__ . '/../services/OrdenCompraService.php';

if (!class_exists('OrdenCompraController')) {
    class OrdenCompraController
    {
        private OrdenCompraService $service;

        public function __construct()
        {
            $this->service = new OrdenCompraService();
        }

        public function index(Request $request): void
        {
            $filtros = [
                'estado' => $request->getQuery('estado'),
                'proveedor_id' => $request->getQuery('proveedor_id'),
            ];
            $limit = (int)$request->getQuery('limit', 50);
            $offset = (int)$request->getQuery('offset', 0);
            Response::success($this->service->listar($filtros, $limit, $offset), 'Órdenes obtenidas.');
        }

        public function show(Request $request): void
        {
            $id = (int)$request->param('id');
            Response::success($this->service->obtener($id), 'Orden obtenida.');
        }

        public function store(Request $request): void
        {
            $data = $request->all();
            $v = new Validator($data);
            $v->required('proveedor_id')->integer('proveedor_id')
              ->required('items')->arrayField('items');
            if ($v->fails()) Response::validationError($v->errors());

            $usuarioId = Auth::id();
            if ($usuarioId === null) Response::unauthorized('No autenticado.');

            Response::created($this->service->crear($data, $usuarioId), 'Orden creada.');
        }

        public function cambiarEstado(Request $request): void
        {
            $id = (int)$request->param('id');
            $data = $request->all();
            $v = new Validator($data);
            $v->required('estado')->in('estado', ['borrador', 'enviada', 'recibida_parcial', 'recibida', 'cancelada']);
            if ($v->fails()) Response::validationError($v->errors());

            Response::success($this->service->cambiarEstado($id, (string)$data['estado']), 'Estado actualizado.');
        }

        public function recibir(Request $request): void
        {
            $id = (int)$request->param('id');
            $data = $request->all();
            $usuarioId = Auth::id();
            if ($usuarioId === null) Response::unauthorized('No autenticado.');

            $recepciones = $data['recepciones'] ?? [];
            if (!is_array($recepciones)) $recepciones = [];

            Response::success($this->service->recibir($id, $recepciones, $usuarioId), 'Recepción registrada.');
        }
    }
}