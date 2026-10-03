<?php
declare(strict_types=1);

require_once __DIR__ . '/BaseModel.php';

if (!class_exists('AuditoriaLog')) {
    class AuditoriaLog extends BaseModel
    {
        protected string $table = 'auditoria_logs';
        protected string $primaryKey = 'id';
        protected array $fillable = [
            'usuario_id', 'accion', 'entidad', 'entidad_id', 'descripcion',
            'datos_anteriores', 'datos_nuevos', 'ip', 'user_agent',
        ];

        public function listar(array $filtros = [], int $limit = 100, int $offset = 0): array
        {
            $sql = "SELECT a.*, u.nombre AS usuario_nombre
                    FROM auditoria_logs a
                    LEFT JOIN usuarios u ON u.id = a.usuario_id
                    WHERE 1=1";
            $params = [];

            if (!empty($filtros['usuario_id'])) {
                $sql .= " AND a.usuario_id = :usuario_id";
                $params['usuario_id'] = (int) $filtros['usuario_id'];
            }
            if (!empty($filtros['entidad'])) {
                $sql .= " AND a.entidad = :entidad";
                $params['entidad'] = $filtros['entidad'];
            }
            if (!empty($filtros['accion'])) {
                $sql .= " AND a.accion = :accion";
                $params['accion'] = $filtros['accion'];
            }
            if (!empty($filtros['desde'])) {
                $sql .= " AND a.created_at >= :desde";
                $params['desde'] = $filtros['desde'] . ' 00:00:00';
            }
            if (!empty($filtros['hasta'])) {
                $sql .= " AND a.created_at <= :hasta";
                $params['hasta'] = $filtros['hasta'] . ' 23:59:59';
            }

            $sql .= " ORDER BY a.id DESC LIMIT " . (int) $limit . " OFFSET " . (int) $offset;

            return $this->raw($sql, $params);
        }
    }
}