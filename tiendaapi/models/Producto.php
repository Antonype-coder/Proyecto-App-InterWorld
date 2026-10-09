<?php
declare(strict_types=1);

require_once __DIR__ . '/BaseModel.php';
require_once __DIR__ . '/../core/Auth.php';

if (!class_exists('Producto')) {
    class Producto extends BaseModel
    {
        protected string $table = 'productos';
        protected string $primaryKey = 'id';
        protected array $fillable = [
            'negocio_id', 'codigo_barras', 'nombre', 'descripcion', 'categoria_id', 'proveedor_id',
            'precio_compra', 'precio_venta', 'stock', 'stock_minimo', 'imagen', 'activo',
        ];

        private function nid(): ?int
        {
            return class_exists('Auth') ? Auth::negocioId() : null;
        }

        public function find(int $id): ?array
        {
            $producto = parent::find($id);
            return $producto === null ? null : $this->incluirImagenes([$producto])[0];
        }

        public function allWithRelations(array $filtros = [], string $orderBy = 'p.nombre ASC', int $limit = 100, int $offset = 0): array
        {
            $nid = $this->nid();

            $sql = "SELECT p.*, c.nombre AS categoria_nombre, pr.nombre AS proveedor_nombre
                    FROM productos p
                    LEFT JOIN categorias c ON c.id = p.categoria_id
                    LEFT JOIN proveedores pr ON pr.id = p.proveedor_id
                    WHERE 1=1";
            $params = [];

            if ($nid !== null) {
                $sql .= " AND p.negocio_id = :nid";
                $params['nid'] = $nid;
            }
            if (isset($filtros['busqueda']) && $filtros['busqueda'] !== '') {
                $sql .= " AND (p.nombre LIKE :b1 OR p.codigo_barras LIKE :b2)";
                $params['b1'] = '%' . $filtros['busqueda'] . '%';
                $params['b2'] = '%' . $filtros['busqueda'] . '%';
            }
            if (isset($filtros['categoria_id']) && $filtros['categoria_id']) {
                $sql .= " AND p.categoria_id = :categoria_id";
                $params['categoria_id'] = (int) $filtros['categoria_id'];
            }
            if (array_key_exists('activo', $filtros)) {
                $sql .= " AND p.activo = :activo";
                $params['activo'] = (int) $filtros['activo'];
            }
            if (!empty($filtros['stock_bajo'])) {
                $sql .= " AND p.stock <= p.stock_minimo";
            }

            $sql .= " ORDER BY {$orderBy} LIMIT " . (int) $limit . " OFFSET " . (int) $offset;

            return $this->incluirImagenes($this->raw($sql, $params));
        }

        public function countWithFilters(array $filtros = []): int
        {
            $nid = $this->nid();

            $sql = "SELECT COUNT(*) FROM productos p WHERE 1=1";
            $params = [];

            if ($nid !== null) {
                $sql .= " AND p.negocio_id = :nid";
                $params['nid'] = $nid;
            }
            if (isset($filtros['busqueda']) && $filtros['busqueda'] !== '') {
                $sql .= " AND (p.nombre LIKE :b1 OR p.codigo_barras LIKE :b2)";
                $params['b1'] = '%' . $filtros['busqueda'] . '%';
                $params['b2'] = '%' . $filtros['busqueda'] . '%';
            }
            if (isset($filtros['categoria_id']) && $filtros['categoria_id']) {
                $sql .= " AND p.categoria_id = :categoria_id";
                $params['categoria_id'] = (int) $filtros['categoria_id'];
            }
            if (array_key_exists('activo', $filtros)) {
                $sql .= " AND p.activo = :activo";
                $params['activo'] = (int) $filtros['activo'];
            }

            return (int) $this->rawScalar($sql, $params);
        }

        public function findByBarcode(string $codigo): ?array
        {
            $nid = $this->nid();

            $sql = "SELECT p.*, c.nombre AS categoria_nombre, pr.nombre AS proveedor_nombre
                    FROM productos p
                    LEFT JOIN categorias c ON c.id = p.categoria_id
                    LEFT JOIN proveedores pr ON pr.id = p.proveedor_id
                    WHERE p.codigo_barras = :codigo";
            $params = ['codigo' => $codigo];

            if ($nid !== null) {
                $sql .= " AND p.negocio_id = :nid";
                $params['nid'] = $nid;
            }
            $sql .= " LIMIT 1";

            $producto = $this->rawFirst($sql, $params);
            return $producto === null ? null : $this->incluirImagenes([$producto])[0];
        }

               public function barcodeExists(string $codigo, ?int $excludeId = null): bool
        {
            $nid = $this->nid();

            // Solo verificar productos ACTIVOS.
            // Si un producto está desactivado, se permite reutilizar su código.
            $sql = "SELECT COUNT(*) FROM {$this->table}
                    WHERE codigo_barras = :codigo AND activo = 1";
            $params = ['codigo' => $codigo];

            if ($nid !== null) {
                $sql .= " AND negocio_id = :nid";
                $params['nid'] = $nid;
            }
            if ($excludeId !== null) {
                $sql .= " AND id <> :id";
                $params['id'] = $excludeId;
            }

            return (int) $this->rawScalar($sql, $params) > 0;
        }

                public function findInactivoByBarcode(string $codigo): ?array
        {
            $nid = $this->nid();

            $sql = "SELECT * FROM {$this->table}
                    WHERE codigo_barras = :codigo AND activo = 0";
            $params = ['codigo' => $codigo];

            if ($nid !== null) {
                $sql .= " AND negocio_id = :nid";
                $params['nid'] = $nid;
            }
            $sql .= " LIMIT 1";

            $row = $this->rawFirst($sql, $params);
            return $row ?: null;
        }

        public function stockBajo(): array
        {
            $nid = $this->nid();

            $sql = "SELECT p.*, c.nombre AS categoria_nombre
                    FROM productos p
                    LEFT JOIN categorias c ON c.id = p.categoria_id
                    WHERE p.activo = 1 AND p.stock <= p.stock_minimo";
            $params = [];

            if ($nid !== null) {
                $sql .= " AND p.negocio_id = :nid";
                $params['nid'] = $nid;
            }
            $sql .= " ORDER BY (p.stock - p.stock_minimo) ASC, p.nombre ASC";

            return $this->incluirImagenes($this->raw($sql, $params));
        }

        public function createWithImages(array $data, array $images): int
        {
            return $this->transaction(function (PDO $pdo) use ($data, $images): int {
                $data['imagen'] = $images[0] ?? null;
                $id = parent::create($data);
                $this->guardarImagenes($pdo, $id, $images);
                return $id;
            });
        }

        public function updateWithImages(int $id, array $data, array $images): bool
        {
            return $this->transaction(function (PDO $pdo) use ($id, $data, $images): bool {
                $data['imagen'] = $images[0] ?? null;
                $updated = parent::update($id, $data);
                $this->guardarImagenes($pdo, $id, $images);
                return $updated;
            });
        }

        private function guardarImagenes(PDO $pdo, int $productoId, array $images): void
        {
            $delete = $pdo->prepare('DELETE FROM producto_imagenes WHERE producto_id = :id');
            $delete->execute(['id' => $productoId]);

            $insert = $pdo->prepare(
                'INSERT INTO producto_imagenes (producto_id, ruta, orden) VALUES (:producto_id, :ruta, :orden)'
            );
            foreach (array_values($images) as $orden => $ruta) {
                $insert->execute([
                    'producto_id' => $productoId,
                    'ruta' => $ruta,
                    'orden' => $orden,
                ]);
            }
        }

        private function incluirImagenes(array $productos): array
        {
            if ($productos === []) return [];

            $ids = array_values(array_unique(array_map(
                static fn(array $producto): int => (int) $producto['id'],
                $productos
            )));
            $placeholders = implode(',', array_fill(0, count($ids), '?'));
            $stmt = $this->db->prepare(
                "SELECT producto_id, ruta FROM producto_imagenes
                 WHERE producto_id IN ({$placeholders}) ORDER BY orden ASC, id ASC"
            );
            $stmt->execute($ids);

            $imagenesPorProducto = [];
            foreach ($stmt->fetchAll() as $imagen) {
                $imagenesPorProducto[(int) $imagen['producto_id']][] = $imagen['ruta'];
            }

            foreach ($productos as &$producto) {
                $id = (int) $producto['id'];
                $imagenes = $imagenesPorProducto[$id] ?? [];
                $principal = $producto['imagen'] ?? null;
                if (is_string($principal) && $principal !== '' && !in_array($principal, $imagenes, true)) {
                    array_unshift($imagenes, $principal);
                }
                $producto['imagenes'] = array_values(array_unique($imagenes));
            }
            unset($producto);

            return $productos;
        }

        public function adjustStock(int $id, int $delta): int
        {
            $nid = $this->nid();

            return $this->transaction(function (PDO $pdo) use ($id, $delta, $nid) {
                $sql = "SELECT stock FROM productos WHERE id = :id";
                $params = ['id' => $id];
                if ($nid !== null) { $sql .= " AND negocio_id = :nid"; $params['nid'] = $nid; }
                $sql .= " FOR UPDATE";

                $stmt = $pdo->prepare($sql);
                $stmt->execute($params);
                $row = $stmt->fetch();
                if ($row === false) {
                    throw new RuntimeException("Producto #{$id} no encontrado.");
                }

                $nuevo = (int) $row['stock'] + $delta;
                if ($nuevo < 0) {
                    throw new RuntimeException('Stock insuficiente.');
                }

                $updSql = "UPDATE productos SET stock = :stock WHERE id = :id";
                $updParams = ['stock' => $nuevo, 'id' => $id];
                if ($nid !== null) { $updSql .= " AND negocio_id = :nid"; $updParams['nid'] = $nid; }

                $upd = $pdo->prepare($updSql);
                $upd->execute($updParams);

                return $nuevo;
            });
        }

        public function setStock(int $id, int $nuevoStock): int
        {
            $nid = $this->nid();

            return $this->transaction(function (PDO $pdo) use ($id, $nuevoStock, $nid) {
                $sql = "SELECT stock FROM productos WHERE id = :id";
                $params = ['id' => $id];
                if ($nid !== null) { $sql .= " AND negocio_id = :nid"; $params['nid'] = $nid; }
                $sql .= " FOR UPDATE";

                $stmt = $pdo->prepare($sql);
                $stmt->execute($params);
                $row = $stmt->fetch();
                if ($row === false) {
                    throw new RuntimeException("Producto #{$id} no encontrado.");
                }

                $anterior = (int) $row['stock'];

                $updSql = "UPDATE productos SET stock = :stock WHERE id = :id";
                $updParams = ['stock' => $nuevoStock, 'id' => $id];
                if ($nid !== null) { $updSql .= " AND negocio_id = :nid"; $updParams['nid'] = $nid; }

                $upd = $pdo->prepare($updSql);
                $upd->execute($updParams);

                return $anterior;
            });
        }

        public function estadisticas(int $id): array
        {
            $nid = $this->nid();

            $sql = "SELECT
                        COALESCE(SUM(vd.cantidad), 0)                       AS unidades,
                        COUNT(DISTINCT v.id)                                AS transacciones,
                        COALESCE(SUM(vd.cantidad * vd.precio_unitario), 0)  AS bruto,
                        COALESCE(SUM(vd.descuento), 0)                      AS descuento,
                        COALESCE(SUM(vd.subtotal - vd.descuento), 0)        AS neto,
                        MIN(v.created_at)                                   AS primera,
                        MAX(v.created_at)                                   AS ultima
                    FROM venta_detalle vd
                    INNER JOIN ventas v ON v.id = vd.venta_id
                    WHERE vd.producto_id = :pid
                      AND v.estado = 'completada'";
            $params = ['pid' => $id];

            if ($nid !== null) {
                $sql .= " AND v.negocio_id = :nid";
                $params['nid'] = $nid;
            }

            $row = $this->rawFirst($sql, $params) ?? [];

            return [
                'unidades_vendidas' => (int) ($row['unidades'] ?? 0),
                'transacciones'     => (int) ($row['transacciones'] ?? 0),
                'bruto'             => round((float) ($row['bruto'] ?? 0), 2),
                'descuento'         => round((float) ($row['descuento'] ?? 0), 2),
                'neto'              => round((float) ($row['neto'] ?? 0), 2),
                'primera_venta'     => $row['primera'] ?? null,
                'ultima_venta'      => $row['ultima'] ?? null,
            ];
        }

        public function deletePermanente(int $id): array
        {
            $nid = $this->nid();

            return $this->transaction(function (PDO $pdo) use ($id, $nid) {
                $sql = "SELECT id FROM productos WHERE id = :id";
                $params = ['id' => $id];
                if ($nid !== null) {
                    $sql .= " AND negocio_id = :nid";
                    $params['nid'] = $nid;
                }
                $stmt = $pdo->prepare($sql);
                $stmt->execute($params);
                if ($stmt->fetch() === false) {
                    throw new RuntimeException('Producto no encontrado.');
                }

                $chk = $pdo->prepare(
                    "SELECT COUNT(*) FROM venta_detalle WHERE producto_id = :id"
                );
                $chk->execute(['id' => $id]);
                $ventas = (int) $chk->fetchColumn();

                if ($ventas > 0) {
                    $upd = $pdo->prepare(
                        "UPDATE productos SET activo = 0 WHERE id = :id"
                    );
                    $upd->execute(['id' => $id]);
                    return ['accion' => 'desactivado'];
                }

                $pdo->prepare("DELETE FROM producto_imagenes WHERE producto_id = :id")
                    ->execute(['id' => $id]);

                $pdo->prepare("DELETE FROM movimientos_inventario WHERE producto_id = :id")
                    ->execute(['id' => $id]);

                $pdo->prepare("DELETE FROM productos WHERE id = :id")
                    ->execute(['id' => $id]);

                return ['accion' => 'eliminado'];
            });
        }
    }
}