<?php
declare(strict_types=1);

require_once __DIR__ . '/BaseModel.php';
require_once __DIR__ . '/../utils/FolioGenerator.php';

if (!class_exists('Venta')) {
    class Venta extends BaseModel
    {
        protected string $table = 'ventas';
        protected string $primaryKey = 'id';
        protected array $fillable = [
            'numero', 'usuario_id', 'cliente_id', 'caja_sesion_id', 'tipo_pago',
            'subtotal', 'descuento', 'impuesto', 'total', 'estado',
            'anulada_at', 'anulada_por', 'motivo_anulacion', 'notas',
        ];

        public function crearVentaCompleta(
            array $datosVenta,
            array $items,
            ?string $idempotencyKey = null
        ): array
        {
            if ($items === []) {
                throw new InvalidArgumentException('La venta debe tener al menos un producto.');
            }

            try {
                return $this->transaction(function (PDO $pdo) use ($datosVenta, $items, $idempotencyKey) {
                if ($idempotencyKey !== null) {
                    $existing = $pdo->prepare(
                        'SELECT id FROM ventas WHERE idempotency_key = :key LIMIT 1'
                    );
                    $existing->execute(['key' => $idempotencyKey]);
                    $existingId = $existing->fetchColumn();
                    if ($existingId !== false) {
                        return ['id' => (int) $existingId, 'created' => false];
                    }
                }

                $tipoPago = $datosVenta['tipo_pago'] ?? 'contado';
                if (!in_array($tipoPago, ['contado', 'credito'], true)) {
                    throw new InvalidArgumentException('Tipo de pago inválido.');
                }

                $clienteId = null;
                if ($tipoPago === 'credito') {
                    $clienteId = isset($datosVenta['cliente_id']) ? (int) $datosVenta['cliente_id'] : 0;
                    if ($clienteId <= 0) {
                        throw new InvalidArgumentException('Venta a crédito requiere un cliente.');
                    }
                }

                // Procesar items
                $subtotal = 0.0;
                $detalles = [];
                $productos = [];

                foreach ($items as $it) {
                    $productoId = (int) ($it['producto_id'] ?? 0);
                    $cantidad   = (int) ($it['cantidad'] ?? 0);

                    if ($productoId <= 0 || $cantidad <= 0) {
                        throw new InvalidArgumentException('Item inválido.');
                    }

                    $stmt = $pdo->prepare(
                        "SELECT id, nombre, precio_venta, stock, activo
                         FROM productos WHERE id = :id FOR UPDATE"
                    );
                    $stmt->execute(['id' => $productoId]);
                    $prod = $stmt->fetch();

                    if ($prod === false) {
                        throw new RuntimeException("Producto #{$productoId} no encontrado.");
                    }
                    if ((int) $prod['activo'] !== 1) {
                        throw new RuntimeException("Producto '{$prod['nombre']}' está inactivo.");
                    }
                    if ((int) $prod['stock'] < $cantidad) {
                        throw new RuntimeException(
                            "Stock insuficiente para '{$prod['nombre']}'. Disponible: {$prod['stock']}."
                        );
                    }

                    $precio = (float) $prod['precio_venta'];
                    $linea  = round($precio * $cantidad, 2);

                    $subtotal += $linea;

                    $detalles[] = [
                        'producto_id'      => $productoId,
                        'cantidad'         => $cantidad,
                        'precio_unitario'  => $precio,
                        'subtotal'         => $linea,
                    ];
                    $productos[$productoId] = $prod;
                }

                $descuento = isset($datosVenta['descuento']) ? (float) $datosVenta['descuento'] : 0.0;
                if ($descuento < 0) $descuento = 0.0;
                if ($descuento > $subtotal) $descuento = $subtotal;

                $total = round($subtotal - $descuento, 2);

                // Cupo de crédito
                if ($tipoPago === 'credito') {
                    $stmt = $pdo->prepare(
                        "SELECT cupo_credito, saldo_deuda FROM clientes WHERE id = :id FOR UPDATE"
                    );
                    $stmt->execute(['id' => $clienteId]);
                    $cli = $stmt->fetch();
                    if ($cli === false) {
                        throw new RuntimeException('Cliente no encontrado.');
                    }

                    $cupo       = (float) $cli['cupo_credito'];
                    $saldo      = (float) $cli['saldo_deuda'];
                    $disponible = $cupo - $saldo;

                    if ($total > $disponible + 0.001) {
                        throw new RuntimeException(
                            sprintf('Cupo de crédito insuficiente. Disponible: %.2f.', $disponible)
                        );
                    }
                }

                // Generar folio
                $numero = FolioGenerator::venta($pdo);

                // Insertar venta
                $insVenta = $pdo->prepare(
                    "INSERT INTO ventas
                     (numero, idempotency_key, usuario_id, cliente_id, caja_sesion_id, tipo_pago,
                      subtotal, descuento, impuesto, total, estado, notas)
                     VALUES
                     (:numero, :idempotency_key, :usuario_id, :cliente_id, :caja_sesion_id, :tipo_pago,
                      :subtotal, :descuento, :impuesto, :total, 'completada', :notas)"
                );
                $insVenta->execute([
                    'numero'         => $numero,
                    'idempotency_key'=> $idempotencyKey,
                    'usuario_id'     => (int) $datosVenta['usuario_id'],
                    'cliente_id'     => $clienteId,
                    'caja_sesion_id' => $datosVenta['caja_sesion_id'] ?? null,
                    'tipo_pago'      => $tipoPago,
                    'subtotal'       => number_format($subtotal, 2, '.', ''),
                    'descuento'      => number_format($descuento, 2, '.', ''),
                    'impuesto'       => '0.00',
                    'total'          => number_format($total, 2, '.', ''),
                    'notas'          => $datosVenta['notas'] ?? null,
                ]);

                $ventaId = (int) $pdo->lastInsertId();

                // Insertar detalles + movimientos inventario
                $insDet = $pdo->prepare(
                    "INSERT INTO venta_detalle
                     (venta_id, producto_id, cantidad, precio_unitario, subtotal)
                     VALUES (:venta_id, :producto_id, :cantidad, :precio_unitario, :subtotal)"
                );
                $updStock = $pdo->prepare("UPDATE productos SET stock = :nuevo WHERE id = :id");
                $insMov   = $pdo->prepare(
                    "INSERT INTO movimientos_inventario
                     (producto_id, usuario_id, tipo, cantidad, stock_anterior, stock_nuevo, referencia_tipo, referencia_id, motivo)
                     VALUES (:producto_id, :usuario_id, 'salida', :cantidad, :anterior, :nuevo, 'venta', :referencia_id, :motivo)"
                );

                foreach ($detalles as $d) {
                    $insDet->execute([
                        'venta_id'        => $ventaId,
                        'producto_id'     => $d['producto_id'],
                        'cantidad'        => $d['cantidad'],
                        'precio_unitario' => number_format($d['precio_unitario'], 2, '.', ''),
                        'subtotal'        => number_format($d['subtotal'], 2, '.', ''),
                    ]);

                    $prod     = $productos[$d['producto_id']];
                    $anterior = (int) $prod['stock'];
                    $nuevo    = $anterior - $d['cantidad'];

                    $updStock->execute(['nuevo' => $nuevo, 'id' => $d['producto_id']]);
                    $insMov->execute([
                        'producto_id'   => $d['producto_id'],
                        'usuario_id'    => (int) $datosVenta['usuario_id'],
                        'cantidad'      => $d['cantidad'],
                        'anterior'      => $anterior,
                        'nuevo'         => $nuevo,
                        'referencia_id' => $ventaId,
                        'motivo'        => "Venta {$numero}",
                    ]);
                }

                // Si es crédito, incrementar deuda
                if ($tipoPago === 'credito') {
                    $sel = $pdo->prepare("SELECT saldo_deuda FROM clientes WHERE id = :id FOR UPDATE");
                    $sel->execute(['id' => $clienteId]);
                    $row = $sel->fetch();
                    $nuevaDeuda = round((float) $row['saldo_deuda'] + $total, 2);

                    $upd = $pdo->prepare("UPDATE clientes SET saldo_deuda = :saldo WHERE id = :id");
                    $upd->execute([
                        'saldo' => number_format($nuevaDeuda, 2, '.', ''),
                        'id'    => $clienteId,
                    ]);
                }

                return ['id' => $ventaId, 'created' => true];
                });
            } catch (PDOException $e) {
                $isDuplicate = $e->getCode() === '23000'
                    && (int) ($e->errorInfo[1] ?? 0) === 1062;
                if ($idempotencyKey !== null && $isDuplicate) {
                    $existing = $this->rawFirst(
                        'SELECT id FROM ventas WHERE idempotency_key = :key LIMIT 1',
                        ['key' => $idempotencyKey]
                    );
                    if ($existing !== null) {
                        return ['id' => (int) $existing['id'], 'created' => false];
                    }
                }
                throw $e;
            }
        }

        public function anularVenta(int $ventaId, int $usuarioId, string $motivo): bool
        {
            return $this->transaction(function (PDO $pdo) use ($ventaId, $usuarioId, $motivo) {
                $stmt = $pdo->prepare("SELECT * FROM ventas WHERE id = :id FOR UPDATE");
                $stmt->execute(['id' => $ventaId]);
                $venta = $stmt->fetch();

                if ($venta === false) {
                    throw new RuntimeException('Venta no encontrada.');
                }
                if ($venta['estado'] === 'anulada') {
                    throw new RuntimeException('La venta ya está anulada.');
                }

                // Detalles
                $det = $pdo->prepare("SELECT producto_id, cantidad FROM venta_detalle WHERE venta_id = :id");
                $det->execute(['id' => $ventaId]);
                $detalles = $det->fetchAll() ?: [];

                $updStock = $pdo->prepare("UPDATE productos SET stock = stock + :cantidad WHERE id = :id");
                $getStock = $pdo->prepare("SELECT stock FROM productos WHERE id = :id");
                $insMov   = $pdo->prepare(
                    "INSERT INTO movimientos_inventario
                     (producto_id, usuario_id, tipo, cantidad, stock_anterior, stock_nuevo, referencia_tipo, referencia_id, motivo)
                     VALUES (:producto_id, :usuario_id, 'entrada', :cantidad, :anterior, :nuevo, 'anulacion', :referencia_id, :motivo)"
                );

                foreach ($detalles as $d) {
                    $getStock->execute(['id' => $d['producto_id']]);
                    $anterior = (int) $getStock->fetchColumn();
                    $nuevo    = $anterior + (int) $d['cantidad'];

                    $updStock->execute(['cantidad' => $d['cantidad'], 'id' => $d['producto_id']]);
                    $insMov->execute([
                        'producto_id'   => $d['producto_id'],
                        'usuario_id'    => $usuarioId,
                        'cantidad'      => $d['cantidad'],
                        'anterior'      => $anterior,
                        'nuevo'         => $nuevo,
                        'referencia_id' => $ventaId,
                        'motivo'        => "Anulación venta {$venta['numero']}: {$motivo}",
                    ]);
                }

                // Revertir deuda si fue a crédito
                if ($venta['tipo_pago'] === 'credito' && $venta['cliente_id']) {
                    $sel = $pdo->prepare("SELECT saldo_deuda FROM clientes WHERE id = :id FOR UPDATE");
                    $sel->execute(['id' => $venta['cliente_id']]);
                    $row = $sel->fetch();
                    if ($row !== false) {
                        $nueva = round((float) $row['saldo_deuda'] - (float) $venta['total'], 2);
                        if ($nueva < 0) $nueva = 0.0;

                        $upd = $pdo->prepare("UPDATE clientes SET saldo_deuda = :saldo WHERE id = :id");
                        $upd->execute([
                            'saldo' => number_format($nueva, 2, '.', ''),
                            'id'    => $venta['cliente_id'],
                        ]);
                    }
                }

                // Marcar como anulada
                $upd = $pdo->prepare(
                    "UPDATE ventas
                     SET estado = 'anulada', anulada_at = NOW(), anulada_por = :uid, motivo_anulacion = :motivo
                     WHERE id = :id"
                );
                $upd->execute(['uid' => $usuarioId, 'motivo' => $motivo, 'id' => $ventaId]);

                return true;
            });
        }

        public function findWithDetail(int $ventaId): ?array
        {
            $venta = $this->rawFirst(
                "SELECT v.*,
                        u.nombre AS usuario_nombre,
                        c.nombre AS cliente_nombre,
                        a.nombre AS anulada_por_nombre
                 FROM ventas v
                 INNER JOIN usuarios u ON u.id = v.usuario_id
                 LEFT JOIN clientes c ON c.id = v.cliente_id
                 LEFT JOIN usuarios a ON a.id = v.anulada_por
                 WHERE v.id = :id LIMIT 1",
                ['id' => $ventaId]
            );

            if ($venta === null) return null;

            unset($venta['idempotency_key']);

            $detalle = $this->raw(
                "SELECT d.*, p.nombre AS producto_nombre, p.codigo_barras
                 FROM venta_detalle d
                 INNER JOIN productos p ON p.id = d.producto_id
                 WHERE d.venta_id = :id
                 ORDER BY d.id ASC",
                ['id' => $ventaId]
            );

            $venta['detalle'] = $detalle;
            return $venta;
        }

                public function listar(array $filtros = [], string $orderBy = 'v.id DESC', int $limit = 50, int $offset = 0): array
        {
            $sql = "SELECT v.id, v.numero, v.tipo_pago, v.total, v.estado, v.created_at,
                           u.nombre AS usuario_nombre,
                           c.nombre AS cliente_nombre
                    FROM ventas v
                    INNER JOIN usuarios u ON u.id = v.usuario_id
                    LEFT JOIN clientes c ON c.id = v.cliente_id
                    WHERE 1=1";
            $params = [];

            if (!empty($filtros['estado'])) {
                $sql .= " AND v.estado = :estado";
                $params['estado'] = $filtros['estado'];
            }
            if (!empty($filtros['tipo_pago'])) {
                $sql .= " AND v.tipo_pago = :tipo_pago";
                $params['tipo_pago'] = $filtros['tipo_pago'];
            }
            if (!empty($filtros['cliente_id'])) {
                $sql .= " AND v.cliente_id = :cliente_id";
                $params['cliente_id'] = (int) $filtros['cliente_id'];
            }
            if (!empty($filtros['desde'])) {
                $sql .= " AND v.created_at >= :desde";
                $params['desde'] = $filtros['desde'] . ' 00:00:00';
            }
            if (!empty($filtros['hasta'])) {
                $sql .= " AND v.created_at <= :hasta";
                $params['hasta'] = $filtros['hasta'] . ' 23:59:59';
            }
            if (!empty($filtros['busqueda'])) {
                $sql .= " AND (v.numero LIKE :b1 OR c.nombre LIKE :b2)";
                $params['b1'] = '%' . $filtros['busqueda'] . '%';
                $params['b2'] = '%' . $filtros['busqueda'] . '%';
            }

            $sql .= " ORDER BY {$orderBy} LIMIT " . (int) $limit . " OFFSET " . (int) $offset;

            return $this->raw($sql, $params);
        }

                public function contarConFiltros(array $filtros = []): int
        {
            $sql = "SELECT COUNT(*) FROM ventas v
                    INNER JOIN usuarios u ON u.id = v.usuario_id
                    LEFT JOIN clientes c ON c.id = v.cliente_id
                    WHERE 1=1";
            $params = [];

            if (!empty($filtros['estado'])) {
                $sql .= " AND v.estado = :estado";
                $params['estado'] = $filtros['estado'];
            }
            if (!empty($filtros['tipo_pago'])) {
                $sql .= " AND v.tipo_pago = :tipo_pago";
                $params['tipo_pago'] = $filtros['tipo_pago'];
            }
            if (!empty($filtros['cliente_id'])) {
                $sql .= " AND v.cliente_id = :cliente_id";
                $params['cliente_id'] = (int) $filtros['cliente_id'];
            }
            if (!empty($filtros['desde'])) {
                $sql .= " AND v.created_at >= :desde";
                $params['desde'] = $filtros['desde'] . ' 00:00:00';
            }
            if (!empty($filtros['hasta'])) {
                $sql .= " AND v.created_at <= :hasta";
                $params['hasta'] = $filtros['hasta'] . ' 23:59:59';
            }

            return (int) $this->rawScalar($sql, $params);
        }
    }
}