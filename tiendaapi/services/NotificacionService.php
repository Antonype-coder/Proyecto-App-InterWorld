<?php
declare(strict_types=1);

require_once __DIR__ . '/../models/Notificacion.php';

if (!class_exists('NotificacionService')) {
    class NotificacionService
    {
        private Notificacion $notificaciones;

        public function __construct()
        {
            $this->notificaciones = new Notificacion();
        }

        public function crear(array $data): int
        {
            return $this->notificaciones->create($data);
        }

        public function listar(int $usuarioId, int $limit = 50): array
        {
            return $this->notificaciones->listar($usuarioId, $limit);
        }

        public function noLeidas(int $usuarioId): int
        {
            return $this->notificaciones->noLeidas($usuarioId);
        }

        public function marcarLeida(int $id): bool
        {
            return $this->notificaciones->update($id, [
                'leida'    => 1,
                'leida_at' => date('Y-m-d H:i:s'),
            ]);
        }

        public function marcarTodas(int $usuarioId): void
        {
            $this->notificaciones->db()->prepare(
                "UPDATE notificaciones
                 SET leida = 1, leida_at = NOW()
                 WHERE (usuario_id = :uid OR usuario_id IS NULL) AND leida = 0"
            )->execute(['uid' => $usuarioId]);
        }
    }
}