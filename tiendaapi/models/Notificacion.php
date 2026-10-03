<?php
declare(strict_types=1);

require_once __DIR__ . '/BaseModel.php';

if (!class_exists('Notificacion')) {
    class Notificacion extends BaseModel
    {
        protected string $table = 'notificaciones';
        protected string $primaryKey = 'id';
        protected array $fillable = [
            'usuario_id', 'tipo', 'titulo', 'mensaje', 'nivel',
            'leida', 'leida_at', 'referencia_tipo', 'referencia_id', 'expira_at',
        ];

        public function noLeidas(int $usuarioId): int
        {
            return (int) $this->rawScalar(
                "SELECT COUNT(*) FROM {$this->table}
                 WHERE (usuario_id = :uid OR usuario_id IS NULL)
                   AND leida = 0
                   AND (expira_at IS NULL OR expira_at > NOW())",
                ['uid' => $usuarioId]
            );
        }

        public function listar(int $usuarioId, int $limit = 50): array
        {
            return $this->raw(
                "SELECT * FROM {$this->table}
                 WHERE (usuario_id = :uid OR usuario_id IS NULL)
                   AND (expira_at IS NULL OR expira_at > NOW())
                 ORDER BY leida ASC, created_at DESC
                 LIMIT " . (int) $limit,
                ['uid' => $usuarioId]
            );
        }
    }
}