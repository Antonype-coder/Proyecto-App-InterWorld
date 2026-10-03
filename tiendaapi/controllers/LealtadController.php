<?php
declare(strict_types=1);

require_once __DIR__ . '/../core/Request.php';
require_once __DIR__ . '/../core/Response.php';
require_once __DIR__ . '/../core/Validator.php';
require_once __DIR__ . '/../core/Auth.php';
require_once __DIR__ . '/../services/LealtadService.php';

if (!class_exists('LealtadController')) {
    class LealtadController
    {
        private LealtadService $service;

        public function __construct()
        {
            $this->service = new LealtadService();
        }

        public function infoCliente(Request $request): void
        {
            $id = (int)$request->param('id');
            Response::success($this->service->infoCliente($id), 'Info de lealtad.');
        }

        public function historial(Request $request): void
        {
            $id = (int)$request->param('id');
            Response::success($this->service->historial($id), 'Historial de puntos.');
        }

        public function ranking(Request $request): void
        {
            $limit = (int)$request->getQuery('limit', 50);
            if ($limit <= 0 || $limit > 200) $limit = 50;
            Response::success($this->service->ranking($limit), 'Ranking de clientes.');
        }

        public function canjear(Request $request): void
        {
            $id = (int)$request->param('id');
            $data = $request->all();
            $v = new Validator($data);
            $v->required('puntos')->integer('puntos')->min('puntos', 1);
            if ($v->fails()) Response::validationError($v->errors());

            $usuarioId = Auth::id();
            if ($usuarioId === null) Response::unauthorized('No autenticado.');

            $result = $this->service->canjear($id, (int)$data['puntos'], $usuarioId);
            Response::success($result, 'Puntos canjeados.');
        }

        public function ajustar(Request $request): void
        {
            $id = (int)$request->param('id');
            $data = $request->all();
            $v = new Validator($data);
            $v->required('puntos')->integer('puntos')
              ->required('motivo')->minLength('motivo', 3)->maxLength('motivo', 255);
            if ($v->fails()) Response::validationError($v->errors());

            $usuarioId = Auth::id();
            if ($usuarioId === null) Response::unauthorized('No autenticado.');

            $nuevo = $this->service->ajustar($id, (int)$data['puntos'], (string)$data['motivo'], $usuarioId);
            Response::success(['puntos_actuales' => $nuevo], 'Puntos ajustados.');
        }
    }
}