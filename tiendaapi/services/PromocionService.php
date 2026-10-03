<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../core/Exceptions/BusinessException.php';
require_once __DIR__ . '/../core/Exceptions/NotFoundException.php';

if (!class_exists('PromocionService')) {
    class PromocionService
    {
        private PDO $db;

        public function __construct()
        {
            $this->db = Database::getConnection();
        }

        public function listar(array $filtros = []): array
        {
            $sql = "SELECT p.*, prod.nombre AS producto_nombre, cat.nombre AS categoria_nombre
                    FROM promociones p
                    LEFT JOIN productos prod ON prod.id = p.producto_id
                    LEFT JOIN categorias cat ON cat.id = p.categoria_id
                    WHERE 1=1";
            $params = [];

            if (isset($filtros['activo'])) {
                $sql .= " AND p.activo = :activo";
                $params['activo'] = (int)$filtros['activo'];
            }
            if (!empty($filtros['vigentes'])) {
                $sql .= " AND p.activo = 1 AND NOW() BETWEEN p.fecha_inicio AND p.fecha_fin";
            }

            $sql .= " ORDER BY p.id DESC";
            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);
            return $stmt->fetchAll() ?: [];
        }

        public function obtener(int $id): array
        {
            $stmt = $this->db->prepare(
                "SELECT p.*, prod.nombre AS producto_nombre, cat.nombre AS categoria_nombre
                 FROM promociones p
                 LEFT JOIN productos prod ON prod.id = p.producto_id
                 LEFT JOIN categorias cat ON cat.id = p.categoria_id
                 WHERE p.id = :id LIMIT 1"
            );
            $stmt->execute(['id' => $id]);
            $row = $stmt->fetch();
            if ($row === false) throw new NotFoundException('Promoción no encontrada.');
            return $row;
        }

        public function crear(array $data): array
        {
            $this->validar($data);

            $stmt = $this->db->prepare(
                "INSERT INTO promociones
                 (nombre, descripcion, tipo, valor, aplica_a, producto_id, categoria_id,
                  cantidad_minima, fecha_inicio, fecha_fin, activo)
                 VALUES (:nombre, :descripcion, :tipo, :valor, :aplica_a, :producto_id, :categoria_id,
                         :cantidad_minima, :fecha_inicio, :fecha_fin, :activo)"
            );
            $stmt->execute([
                'nombre' => trim((string)$data['nombre']),
                'descripcion' => $data['descripcion'] ?? null,
                'tipo' => (string)$data['tipo'],
                'valor' => number_format((float)($data['valor'] ?? 0), 2, '.', ''),
                'aplica_a' => (string)($data['aplica_a'] ?? 'producto'),
                'producto_id' => !empty($data['producto_id']) ? (int)$data['producto_id'] : null,
                'categoria_id' => !empty($data['categoria_id']) ? (int)$data['categoria_id'] : null,
                'cantidad_minima' => (int)($data['cantidad_minima'] ?? 1),
                'fecha_inicio' => $this->normalizarFecha((string)$data['fecha_inicio'], false),
                'fecha_fin' => $this->normalizarFecha((string)$data['fecha_fin'], true),
                'activo' => isset($data['activo']) ? (int)(bool)$data['activo'] : 1,
            ]);

            $id = (int)$this->db->lastInsertId();
            return $this->obtener($id);
        }

        public function actualizar(int $id, array $data): array
        {
            $this->obtener($id);

            $campos = [];
            $params = ['id' => $id];

            foreach (['nombre','descripcion','tipo','aplica_a','fecha_inicio','fecha_fin'] as $c) {
                if (array_key_exists($c, $data)) {
                    $campos[] = "{$c} = :{$c}";
                    $params[$c] = in_array($c, ['fecha_inicio', 'fecha_fin'], true)
                        ? $this->normalizarFecha((string)$data[$c], $c === 'fecha_fin')
                        : $data[$c];
                }
            }
            if (array_key_exists('valor', $data)) {
                $campos[] = "valor = :valor";
                $params['valor'] = number_format((float)$data['valor'], 2, '.', '');
            }
            if (array_key_exists('producto_id', $data)) {
                $campos[] = "producto_id = :producto_id";
                $params['producto_id'] = !empty($data['producto_id']) ? (int)$data['producto_id'] : null;
            }
            if (array_key_exists('categoria_id', $data)) {
                $campos[] = "categoria_id = :categoria_id";
                $params['categoria_id'] = !empty($data['categoria_id']) ? (int)$data['categoria_id'] : null;
            }
            if (array_key_exists('cantidad_minima', $data)) {
                $campos[] = "cantidad_minima = :cantidad_minima";
                $params['cantidad_minima'] = (int)$data['cantidad_minima'];
            }
            if (array_key_exists('activo', $data)) {
                $campos[] = "activo = :activo";
                $params['activo'] = (int)(bool)$data['activo'];
            }

            if ($campos === []) throw new BusinessException('No hay campos para actualizar.');

            $sql = "UPDATE promociones SET " . implode(', ', $campos) . " WHERE id = :id";
            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);

            return $this->obtener($id);
        }

        public function eliminar(int $id): void
        {
            $this->obtener($id);
            $stmt = $this->db->prepare("UPDATE promociones SET activo = 0 WHERE id = :id");
            $stmt->execute(['id' => $id]);
        }

        /**
         * Obtiene las promociones vigentes que aplican a un producto específico.
         * Útil para el POS.
         */
        public function vigentesParaProducto(int $productoId, int $categoriaId = 0): array
        {
            $stmt = $this->db->prepare(
                "SELECT * FROM promociones
                 WHERE activo = 1
                   AND NOW() BETWEEN fecha_inicio AND fecha_fin
                   AND (
                     (aplica_a = 'global')
                     OR (aplica_a = 'producto' AND producto_id = :pid)
                     OR (aplica_a = 'categoria' AND categoria_id = :cid)
                   )
                 ORDER BY id ASC"
            );
            $stmt->execute(['pid' => $productoId, 'cid' => $categoriaId]);
            return $stmt->fetchAll() ?: [];
        }

        private function validar(array $data): void
        {
            if (empty($data['nombre'])) throw new BusinessException('El nombre es obligatorio.');
            if (empty($data['tipo'])) throw new BusinessException('El tipo es obligatorio.');
            if (!in_array($data['tipo'], ['porcentaje','monto_fijo','precio_especial','2x1','3x2'], true)) {
                throw new BusinessException('Tipo de promoción inválido.');
            }
            if (empty($data['fecha_inicio']) || empty($data['fecha_fin'])) {
                throw new BusinessException('Las fechas son obligatorias.');
            }
            if (strtotime((string)$data['fecha_fin']) <= strtotime((string)$data['fecha_inicio'])) {
                throw new BusinessException('La fecha fin debe ser posterior a la fecha inicio.');
            }
            if (($data['tipo'] === 'porcentaje') && ((float)$data['valor'] <= 0 || (float)$data['valor'] > 100)) {
                throw new BusinessException('El porcentaje debe estar entre 1 y 100.');
            }
        }

        private function normalizarFecha(string $fecha, bool $finDelDia): string
        {
            $date = DateTimeImmutable::createFromFormat('!Y-m-d', $fecha);
            if ($date !== false && $date->format('Y-m-d') === $fecha) {
                return $fecha . ($finDelDia ? ' 23:59:59' : ' 00:00:00');
            }

            $dateTime = DateTimeImmutable::createFromFormat('!Y-m-d H:i:s', $fecha);
            if ($dateTime !== false && $dateTime->format('Y-m-d H:i:s') === $fecha) {
                return $fecha;
            }

            throw new BusinessException('La fecha de la promoción no es válida.');
        }
    }
}