<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/FolioGenerator.php';
require_once __DIR__ . '/../core/Auth.php';
require_once __DIR__ . '/../core/Logger.php';
require_once __DIR__ . '/../core/Exceptions/BusinessException.php';
require_once __DIR__ . '/../core/Exceptions/NotFoundException.php';

if (!class_exists('DevolucionService')) {
    class DevolucionService
    {
        private PDO $db;

        public function __construct()
        {
            $this->db = Database::getConnection();
        }

        private function nid(): ?int
        {
            return class_exists('Auth') ? Auth::negocioId() : null;
        }

        public function crear(array $data, int $usuarioId): array
        {
            $nid = $this->nid();
            if ($nid === null) {
                throw new BusinessException('No se pudo determinar el negocio.');
            }

            return $this->transaction(function () use ($data, $usuarioId, $nid) {
                $ventaId = (int) ($data['venta_id'] ?? 0);
                $motivo = trim((string) ($data['motivo'] ?? ''));
                $metodo = (string) ($data['metodo_devolucion'] ?? 'efectivo');
                $items = $data['items'] ?? [];

                if ($ventaId <= 0) throw new BusinessException('Venta inválida.');
                if (mb_strlen($motivo) < 3) throw new BusinessException('Motivo requerido (mínimo 3 caracteres).');
                if (!is_array($items) || $items === []) throw new BusinessException('Debes indicar al menos un producto.');

                // Cargar venta
                $stmt = $this->db->prepare("SELECT * FROM ventas WHERE id = :id AND negocio_id = :nid FOR UPDATE");
                $stmt->execute(['id' => $ventaId, 'nid' => $nid]);
                $venta = $stmt->fetch();
                if ($venta === false) throw new NotFoundException('Venta no encontrada.');
                if ($venta['estado'] === 'anulada') throw new BusinessException('No puedes devolver productos de una venta anulada.');

                // Detalles originales
                $stmt = $this->db->prepare("SELECT * FROM venta_detalle WHERE venta_id = :id");
                $stmt->execute(['id' => $ventaId]);
                $detallesOriginales = $stmt->fetchAll() ?: [];
                if ($detallesOriginales === []) throw new BusinessException('La venta no tiene productos.');

                // Devoluciones previas de esta venta
                $stmt = $this->db->prepare(
                    "SELECT dd.producto_id, SUM(dd.cantidad) AS devuelto
                     FROM devolucion_detalle dd
                     INNER JOIN devoluciones d ON d.id = dd.devolucion_id
                     WHERE d.venta_id = :id AND d.estado = 'completada' AND d.negocio_id = :nid
                     GROUP BY dd.producto_id"
                );
                $stmt->execute(['id' => $ventaId, 'nid' => $nid]);
                $yaDevueltos = [];
                foreach ($stmt->fetchAll() ?: [] as $r) {
                    $yaDevueltos[(int)$r['producto_id']] = (int)$r['devuelto'];
                }

                $mapaOriginales = [];
                foreach ($detallesOriginales as $d) {
                    $mapaOriginales[(int)$d['producto_id']] = $d;
                }

                // Validar items
                $detallesNuevos = [];
                $montoTotal = 0.0;

                foreach ($items as $it) {
                    $pid = (int)($it['producto_id'] ?? 0);
                    $cant = (int)($it['cantidad'] ?? 0);

                    if (!isset($mapaOriginales[$pid])) {
                        throw new BusinessException("Producto #{$pid} no está en la venta.");
                    }

                    $orig = $mapaOriginales[$pid];
                    $maxDev = (int)$orig['cantidad'] - ($yaDevueltos[$pid] ?? 0);

                    if ($cant <= 0) throw new BusinessException('Cantidad inválida.');
                    if ($cant > $maxDev) throw new BusinessException("Cantidad máxima devolvible para este producto: {$maxDev}.");

                    // 🔥 Precio NETO real = (subtotal - descuento) / cantidad original
                    // Refleja lo que REALMENTE se cobró con promos aplicadas.
                    $cantOriginal  = (int)$orig['cantidad'];
                    $subtotalOrig  = (float)$orig['subtotal'];
                    $descuentoOrig = (float)($orig['descuento'] ?? 0);

                    $precioNeto = $cantOriginal > 0
                        ? ($subtotalOrig - $descuentoOrig) / $cantOriginal
                        : (float)$orig['precio_unitario'];

                    $precioNeto = round($precioNeto, 2);

                    $subtotal = round($precioNeto * $cant, 2);
                    $montoTotal += $subtotal;

                    $detallesNuevos[] = [
                        'producto_id'     => $pid,
                        'cantidad'        => $cant,
                        'precio_unitario' => $precioNeto,
                        'subtotal'        => $subtotal,
                    ];
                }

                // Folio
                $numero = FolioGenerator::devolucion($this->db, $nid);

                // Insertar devolución
                $ins = $this->db->prepare(
                    "INSERT INTO devoluciones
                     (negocio_id, numero, venta_id, usuario_id, cliente_id, tipo, motivo, monto_devuelto, metodo_devolucion, estado)
                     VALUES (:nid, :numero, :venta_id, :usuario_id, :cliente_id, :tipo, :motivo, :monto, :metodo, 'completada')"
                );
                $ins->execute([
                    'nid'        => $nid,
                    'numero'     => $numero,
                    'venta_id'   => $ventaId,
                    'usuario_id' => $usuarioId,
                    'cliente_id' => $venta['cliente_id'],
                    'tipo'       => count($detallesNuevos) === count($detallesOriginales) ? 'total' : 'parcial',
                    'motivo'     => $motivo,
                    'monto'      => number_format($montoTotal, 2, '.', ''),
                    'metodo'     => $metodo,
                ]);
                $devolucionId = (int)$this->db->lastInsertId();

                // Insertar detalles + reponer stock + movimiento inventario
                $insDet = $this->db->prepare(
                    "INSERT INTO devolucion_detalle
                     (devolucion_id, producto_id, cantidad, precio_unitario, subtotal)
                     VALUES (:dev, :prod, :cant, :precio, :sub)"
                );
                $updStock = $this->db->prepare("UPDATE productos SET stock = stock + :cant WHERE id = :id AND negocio_id = :nid");
                $getStock = $this->db->prepare("SELECT stock FROM productos WHERE id = :id AND negocio_id = :nid");
                $insMov = $this->db->prepare(
                    "INSERT INTO movimientos_inventario
                     (negocio_id, producto_id, usuario_id, tipo, cantidad, stock_anterior, stock_nuevo, referencia_tipo, referencia_id, motivo)
                     VALUES (:nid, :prod, :uid, 'entrada', :cant, :ant, :nuevo, 'devolucion', :ref, :motivo)"
                );

                foreach ($detallesNuevos as $d) {
                    $insDet->execute([
                        'dev'    => $devolucionId,
                        'prod'   => $d['producto_id'],
                        'cant'   => $d['cantidad'],
                        'precio' => number_format($d['precio_unitario'], 2, '.', ''),
                        'sub'    => number_format($d['subtotal'], 2, '.', ''),
                    ]);

                    $getStock->execute(['id' => $d['producto_id'], 'nid' => $nid]);
                    $ant = (int)$getStock->fetchColumn();
                    $nuevo = $ant + $d['cantidad'];

                    $updStock->execute(['cant' => $d['cantidad'], 'id' => $d['producto_id'], 'nid' => $nid]);
                    $insMov->execute([
                        'nid'    => $nid,
                        'prod'   => $d['producto_id'],
                        'uid'    => $usuarioId,
                        'cant'   => $d['cantidad'],
                        'ant'    => $ant,
                        'nuevo'  => $nuevo,
                        'ref'    => $devolucionId,
                        'motivo' => "Devolución {$numero}: {$motivo}",
                    ]);
                }

                // Si la venta fue a crédito, reducir la deuda del cliente
                if ($venta['tipo_pago'] === 'credito' && $venta['cliente_id']) {
                    $sel = $this->db->prepare("SELECT saldo_deuda FROM clientes WHERE id = :id AND negocio_id = :nid FOR UPDATE");
                    $sel->execute(['id' => $venta['cliente_id'], 'nid' => $nid]);
                    $row = $sel->fetch();
                    if ($row !== false) {
                        $nueva = max(0, round((float)$row['saldo_deuda'] - $montoTotal, 2));
                        $upd = $this->db->prepare("UPDATE clientes SET saldo_deuda = :s WHERE id = :id AND negocio_id = :nid");
                        $upd->execute([
                            's'   => number_format($nueva, 2, '.', ''),
                            'id'  => $venta['cliente_id'],
                            'nid' => $nid,
                        ]);
                    }
                }

                Logger::info('Devolución registrada', [
                    'devolucion_id' => $devolucionId,
                    'monto'         => $montoTotal,
                ]);

                return $this->obtener($devolucionId);
            });
        }

        public function listar(array $filtros = [], int $limit = 50, int $offset = 0): array
        {
            $nid = $this->nid();

            $sql = "SELECT d.*, v.numero AS venta_numero, u.nombre AS usuario_nombre,
                           c.nombre AS cliente_nombre
                    FROM devoluciones d
                    INNER JOIN ventas v ON v.id = d.venta_id
                    INNER JOIN usuarios u ON u.id = d.usuario_id
                    LEFT JOIN clientes c ON c.id = d.cliente_id
                    WHERE 1=1";
            $params = [];

            if ($nid !== null) {
                $sql .= " AND d.negocio_id = :nid";
                $params['nid'] = $nid;
            }
            if (!empty($filtros['estado'])) {
                $sql .= " AND d.estado = :estado";
                $params['estado'] = $filtros['estado'];
            }
            if (!empty($filtros['desde'])) {
                $sql .= " AND d.created_at >= :desde";
                $params['desde'] = $filtros['desde'] . ' 00:00:00';
            }
            if (!empty($filtros['hasta'])) {
                $sql .= " AND d.created_at <= :hasta";
                $params['hasta'] = $filtros['hasta'] . ' 23:59:59';
            }

            $sql .= " ORDER BY d.id DESC LIMIT " . (int)$limit . " OFFSET " . (int)$offset;

            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);
            return $stmt->fetchAll() ?: [];
        }

        public function obtener(int $id): array
        {
            $nid = $this->nid();

            $sql = "SELECT d.*, v.numero AS venta_numero, v.tipo_pago,
                           u.nombre AS usuario_nombre, c.nombre AS cliente_nombre
                    FROM devoluciones d
                    INNER JOIN ventas v ON v.id = d.venta_id
                    INNER JOIN usuarios u ON u.id = d.usuario_id
                    LEFT JOIN clientes c ON c.id = d.cliente_id
                    WHERE d.id = :id";
            $params = ['id' => $id];

            if ($nid !== null) {
                $sql .= " AND d.negocio_id = :nid";
                $params['nid'] = $nid;
            }
            $sql .= " LIMIT 1";

            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);
            $dev = $stmt->fetch();
            if ($dev === false) throw new NotFoundException('Devolución no encontrada.');

            $stmt = $this->db->prepare(
                "SELECT dd.*, p.nombre AS producto_nombre, p.codigo_barras
                 FROM devolucion_detalle dd
                 INNER JOIN productos p ON p.id = dd.producto_id
                 WHERE dd.devolucion_id = :id
                 ORDER BY dd.id ASC"
            );
            $stmt->execute(['id' => $id]);
            $dev['detalle'] = $stmt->fetchAll() ?: [];

            return $dev;
        }

        private function transaction(callable $cb): mixed
        {
            $this->db->beginTransaction();
            try {
                $result = $cb();
                $this->db->commit();
                return $result;
            } catch (Throwable $e) {
                if ($this->db->inTransaction()) $this->db->rollBack();
                throw $e;
            }
        }
    }
}