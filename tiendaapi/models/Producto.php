<?php
declare(strict_types=1);

require_once __DIR__ . '/BaseModel.php';

if (!class_exists('Producto')) {
    class Producto extends BaseModel
    {
        protected string $table = 'productos';
        protected string $primaryKey = 'id';
        protected array $fillable = [
            'codigo_barras', 'nombre', 'descripcion', 'categoria_id', 'proveedor_id',
            'precio_compra', 'precio_venta', 'stock', 'stock_minimo', 'imagen', 'activo',
        ];

        public function find(int $id): ?array
        {
            $producto = parent::find($id);
            return $producto === null ? null : $this->incluirImagenes([$producto])[0];
        }

        public function allWithRelations(array $filtros = [], string $orderBy = 'p.nombre ASC', int $limit = 100, int $offset = 0): array
        {
            $sql = "SELECT p.*, c.nombre AS categoria_nombre, pr.nombre AS proveedor_nombre
                    FROM productos p
                    LEFT JOIN categorias c ON c.id = p.categoria_id
                    LEFT JOIN proveedores pr ON pr.id = p.proveedor_id
                    WHERE 1=1";
            $params = [];

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
            $sql = "SELECT COUNT(*) FROM productos p WHERE 1=1";
            $params = [];

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
            $producto = $this->rawFirst(
                "SELECT p.*, c.nombre AS categoria_nombre, pr.nombre AS proveedor_nombre
                 FROM productos p
                 LEFT JOIN categorias c ON c.id = p.categoria_id
                 LEFT JOIN proveedores pr ON pr.id = p.proveedor_id
                 WHERE p.codigo_barras = :codigo LIMIT 1",
                ['codigo' => $codigo]
            );
            return $producto === null ? null : $this->incluirImagenes([$producto])[0];
        }

        public function barcodeExists(string $codigo, ?int $excludeId = null): bool
        {
            $sql = "SELECT COUNT(*) FROM {$this->table} WHERE codigo_barras = :codigo";
            $params = ['codigo' => $codigo];

            if ($excludeId !== null) {
                $sql .= " AND id <> :id";
                $params['id'] = $excludeId;
            }

            return (int) $this->rawScalar($sql, $params) > 0;
        }

        public function stockBajo(): array
        {
            return $this->incluirImagenes($this->raw(
                "SELECT p.*, c.nombre AS categoria_nombre
                 FROM productos p
                 LEFT JOIN categorias c ON c.id = p.categoria_id
                 WHERE p.activo = 1 AND p.stock <= p.stock_minimo
                 ORDER BY (p.stock - p.stock_minimo) ASC, p.nombre ASC"
            ));
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
            return $this->transaction(function (PDO $pdo) use ($id, $delta) {
                $stmt = $pdo->prepare("SELECT stock FROM productos WHERE id = :id FOR UPDATE");
                $stmt->execute(['id' => $id]);
                $row = $stmt->fetch();
                if ($row === false) {
                    throw new RuntimeException("Producto #{$id} no encontrado.");
                }

                $nuevo = (int) $row['stock'] + $delta;
                if ($nuevo < 0) {
                    throw new RuntimeException('Stock insuficiente.');
                }

                $upd = $pdo->prepare("UPDATE productos SET stock = :stock WHERE id = :id");
                $upd->execute(['stock' => $nuevo, 'id' => $id]);

                return $nuevo;
            });
        }

        public function setStock(int $id, int $nuevoStock): int
        {
            return $this->transaction(function (PDO $pdo) use ($id, $nuevoStock) {
                $stmt = $pdo->prepare("SELECT stock FROM productos WHERE id = :id FOR UPDATE");
                $stmt->execute(['id' => $id]);
                $row = $stmt->fetch();
                if ($row === false) {
                    throw new RuntimeException("Producto #{$id} no encontrado.");
                }

                $anterior = (int) $row['stock'];

                $upd = $pdo->prepare("UPDATE productos SET stock = :stock WHERE id = :id");
                $upd->execute(['stock' => $nuevoStock, 'id' => $id]);

                return $anterior;
            });
        }
    }
}