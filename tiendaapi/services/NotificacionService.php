<?php
declare(strict_types=1);

require_once __DIR__ . '/../models/Notificacion.php';
require_once __DIR__ . '/../core/Auth.php';

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
            $nid = class_exists('Auth') ? Auth::negocioId() : null;

            $sql = "UPDATE notificaciones
                    SET leida = 1, leida_at = NOW()
                    WHERE (usuario_id = :uid OR usuario_id IS NULL) AND leida = 0";
            $params = ['uid' => $usuarioId];

            if ($nid !== null) {
                $sql .= " AND negocio_id = :nid";
                $params['nid'] = $nid;
            }

            $this->notificaciones->db()->prepare($sql)->execute($params);
        }
    }
}