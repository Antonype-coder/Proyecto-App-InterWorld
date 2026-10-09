<?php
declare(strict_types=1);

require_once __DIR__ . '/BaseModel.php';
require_once __DIR__ . '/../core/Auth.php';

if (!class_exists('MovimientoInventario')) {
    class MovimientoInventario extends BaseModel
    {
        protected string $table = 'movimientos_inventario';
        protected string $primaryKey = 'id';
        protected array $fillable = [
            'negocio_id', 'producto_id', 'usuario_id', 'tipo', 'cantidad',
            'stock_anterior', 'stock_nuevo', 'referencia_tipo', 'referencia_id', 'motivo',
        ];
        protected bool $tenantScoped = true;

        private function nid(): ?int
        {
            return class_exists('Auth') ? Auth::negocioId() : null;
        }

        public function allWithRelations(array $filtros = [], string $orderBy = 'm.id DESC', int $limit = 100, int $offset = 0): array
        {
            $nid = $this->nid();

            $sql = "SELECT m.*, p.nombre AS producto_nombre, p.codigo_barras AS producto_codigo,
                           u.nombre AS usuario_nombre
                    FROM movimientos_inventario m
                    INNER JOIN productos p ON p.id = m.producto_id
                    INNER JOIN usuarios u ON u.id = m.usuario_id
                    WHERE 1=1";
            $params = [];

            if ($nid !== null) {
                $sql .= " AND m.negocio_id = :nid";
                $params['nid'] = $nid;
            }

            if (!empty($filtros['producto_id'])) {
                $sql .= " AND m.producto_id = :producto_id";
                $params['producto_id'] = (int) $filtros['producto_id'];
            }
            if (!empty($filtros['tipo'])) {
                $sql .= " AND m.tipo = :tipo";
                $params['tipo'] = $filtros['tipo'];
            }
            if (!empty($filtros['desde'])) {
                $sql .= " AND m.created_at >= :desde";
                $params['desde'] = $filtros['desde'] . ' 00:00:00';
            }
            if (!empty($filtros['hasta'])) {
                $sql .= " AND m.created_at <= :hasta";
                $params['hasta'] = $filtros['hasta'] . ' 23:59:59';
            }

            $sql .= " ORDER BY {$orderBy} LIMIT " . (int) $limit . " OFFSET " . (int) $offset;

            return $this->raw($sql, $params);
        }
    }
}