<?php
declare(strict_types=1);

require_once __DIR__ . '/../core/Request.php';
require_once __DIR__ . '/../core/Response.php';
require_once __DIR__ . '/../services/NotificacionService.php';
require_once __DIR__ . '/../core/Auth.php';

if (!class_exists('NotificacionController')) {
    class NotificacionController
    {
        private NotificacionService $service;

        public function __construct()
        {
            $this->service = new NotificacionService();
        }

        public function index(Request $request): void
        {
            $usuarioId = Auth::id();
            if ($usuarioId === null) Response::unauthorized('No autenticado.');

            $items = $this->service->listar($usuarioId);
            $noLeidas = $this->service->noLeidas($usuarioId);

            Response::success([
                'items'    => $items,
                'no_leidas' => $noLeidas,
            ], 'Notificaciones obtenidas.');
        }

        public function marcarLeida(Request $request): void
        {
            $id = (int) $request->param('id');
            $this->service->marcarLeida($id);
            Response::success(null, 'Notificación marcada como leída.');
        }

        public function marcarTodas(Request $request): void
        {
            $usuarioId = Auth::id();
            if ($usuarioId === null) Response::unauthorized('No autenticado.');

            $this->service->marcarTodas($usuarioId);
            Response::success(null, 'Todas las notificaciones marcadas como leídas.');
        }
    }
}