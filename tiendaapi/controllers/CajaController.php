<?php
declare(strict_types=1);

require_once __DIR__ . '/../core/Request.php';
require_once __DIR__ . '/../core/Response.php';
require_once __DIR__ . '/../core/Validator.php';
require_once __DIR__ . '/../core/Auth.php';
require_once __DIR__ . '/../services/CajaService.php';

if (!class_exists('CajaController')) {
    class CajaController
    {
        private CajaService $service;

        public function __construct()
        {
            $this->service = new CajaService();
        }

        public function estado(Request $request): void
        {
            $usuarioId = Auth::id();
            if ($usuarioId === null) Response::unauthorized('No autenticado.');

            $sesion = $this->service->sesionAbierta($usuarioId);
            Response::success($sesion, 'Estado de caja.');
        }

        public function abrir(Request $request): void
        {
            $data = $request->all();
            $v = new Validator($data);
            $v->required('monto_apertura')->numeric('monto_apertura')->min('monto_apertura', 0);
            if ($v->fails()) Response::validationError($v->errors());

            $usuarioId = Auth::id();
            if ($usuarioId === null) Response::unauthorized('No autenticado.');

            $sesion = $this->service->abrir(
                $usuarioId,
                (float) $data['monto_apertura'],
                $data['notas_apertura'] ?? null
            );

            Response::created($sesion, 'Caja abierta correctamente.');
        }

        public function cerrar(Request $request): void
        {
            $id = (int) $request->param('id');
            $data = $request->all();

            $v = new Validator($data);
            $v->required('monto_cierre_declarado')->numeric('monto_cierre_declarado')->min('monto_cierre_declarado', 0);
            if ($v->fails()) Response::validationError($v->errors());

            $usuarioId = Auth::id();
            if ($usuarioId === null) Response::unauthorized('No autenticado.');

            $sesion = $this->service->cerrar(
                $id,
                $usuarioId,
                (float) $data['monto_cierre_declarado'],
                $data['notas_cierre'] ?? null
            );

            Response::success($sesion, 'Caja cerrada correctamente.');
        }

        public function movimiento(Request $request): void
        {
            $id = (int) $request->param('id');
            $data = $request->all();

            $v = new Validator($data);
            $v->required('tipo')->in('tipo', ['ingreso', 'egreso'])
              ->required('monto')->numeric('monto')->min('monto', 0.01);
            if ($v->fails()) Response::validationError($v->errors());

            $usuarioId = Auth::id();
            if ($usuarioId === null) Response::unauthorized('No autenticado.');

            $mov = $this->service->registrarMovimiento($id, $usuarioId, $data);
            Response::created($mov, 'Movimiento registrado.');
        }

        public function movimientos(Request $request): void
        {
            $id = (int) $request->param('id');
            $movs = $this->service->movimientos($id);
            Response::success($movs, 'Movimientos obtenidos.');
        }

        public function historial(Request $request): void
        {
            $usuarioId = Auth::id();
            if ($usuarioId === null) Response::unauthorized('No autenticado.');

            $historial = $this->service->historial($usuarioId);
            Response::success($historial, 'Historial de caja.');
        }
    }
}