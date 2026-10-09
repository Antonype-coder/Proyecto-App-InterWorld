<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/FolioGenerator.php';
require_once __DIR__ . '/../core/Auth.php';
require_once __DIR__ . '/../core/Logger.php';
require_once __DIR__ . '/../core/Exceptions/BusinessException.php';
require_once __DIR__ . '/../core/Exceptions/NotFoundException.php';

if (!class_exists('OrdenCompraService')) {
    class OrdenCompraService
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

        public function listar(array $filtros = [], int $limit = 50, int $offset = 0): array
        {
            $nid = $this->nid();

            $sql = "SELECT oc.*, p.nombre AS proveedor_nombre, u.nombre AS usuario_nombre
                    FROM ordenes_compra oc
                    INNER JOIN proveedores p ON p.id = oc.proveedor_id
                    INNER JOIN usuarios u ON u.id = oc.usuario_id
                    WHERE 1=1";
            $params = [];

            if ($nid !== null) {
                $sql .= " AND oc.negocio_id = :nid";
                $params['nid'] = $nid;
            }
            if (!empty($filtros['estado'])) {
                $sql .= " AND oc.estado = :estado";
                $params['estado'] = $filtros['estado'];
            }
            if (!empty($filtros['proveedor_id'])) {
                $sql .= " AND oc.proveedor_id = :pid";
                $params['pid'] = (int)$filtros['proveedor_id'];
            }

            $sql .= " ORDER BY oc.id DESC LIMIT " . (int)$limit . " OFFSET " . (int)$offset;
            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);
            return $stmt->fetchAll() ?: [];
        }

        public function obtener(int $id): array
        {
            $nid = $this->nid();

            $sql = "SELECT oc.*, p.nombre AS proveedor_nombre, p.email AS proveedor_email,
                           p.contacto AS proveedor_contacto, u.nombre AS usuario_nombre
                    FROM ordenes_compra oc
                    INNER JOIN proveedores p ON p.id = oc.proveedor_id
                    INNER JOIN usuarios u ON u.id = oc.usuario_id
                    WHERE oc.id = :id";
            $params = ['id' => $id];

            if ($nid !== null) {
                $sql .= " AND oc.negocio_id = :nid";
                $params['nid'] = $nid;
            }
            $sql .= " LIMIT 1";

            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);
            $oc = $stmt->fetch();
            if ($oc === false) throw new NotFoundException('Orden no encontrada.');

            $stmt = $this->db->prepare(
                "SELECT d.*, p.nombre AS producto_nombre, p.codigo_barras, p.stock AS stock_actual
                 FROM orden_compra_detalle d
                 INNER JOIN productos p ON p.id = d.producto_id
                 WHERE d.orden_compra_id = :id ORDER BY d.id ASC"
            );
            $stmt->execute(['id' => $id]);
            $oc['detalle'] = $stmt->fetchAll() ?: [];

            return $oc;
        }

        public function crear(array $data, int $usuarioId): array
        {
            $nid = $this->nid();
            if ($nid === null) {
                throw new BusinessException('No se pudo determinar el negocio.');
            }

            return $this->transaction(function () use ($data, $usuarioId, $nid) {
                $proveedorId = (int)($data['proveedor_id'] ?? 0);
                $items = $data['items'] ?? [];

                if ($proveedorId <= 0) throw new BusinessException('Proveedor requerido.');
                if (!is_array($items) || $items === []) throw new BusinessException('Debes agregar al menos un producto.');

                $subtotal = 0.0;
                $detalles = [];
                foreach ($items as $it) {
                    $pid = (int)($it['producto_id'] ?? 0);
                    $cant = (int)($it['cantidad'] ?? 0);
                    $precio = (float)($it['precio_unitario'] ?? 0);
                    if ($pid <= 0 || $cant <= 0) throw new BusinessException('Item inválido.');
                    if ($precio < 0) $precio = 0;

                    $sub = round($precio * $cant, 2);
                    $subtotal += $sub;
                    $detalles[] = ['producto_id' => $pid, 'cantidad' => $cant, 'precio_unitario' => $precio, 'subtotal' => $sub];
                }

                $numero = FolioGenerator::ordenCompra($this->db, $nid);
                $estado = (string)($data['estado'] ?? 'borrador');

                $ins = $this->db->prepare(
                    "INSERT INTO ordenes_compra
                     (negocio_id, numero, proveedor_id, usuario_id, subtotal, impuesto, total, estado, fecha_esperada, notas)
                     VALUES (:nid, :numero, :prov, :uid, :sub, 0, :total, :estado, :fecha, :notas)"
                );
                $ins->execute([
                    'nid'    => $nid,
                    'numero' => $numero,
                    'prov'   => $proveedorId,
                    'uid'    => $usuarioId,
                    'sub'    => number_format($subtotal, 2, '.', ''),
                    'total'  => number_format($subtotal, 2, '.', ''),
                    'estado' => $estado,
                    'fecha'  => $data['fecha_esperada'] ?? null,
                    'notas'  => $data['notas'] ?? null,
                ]);
                $ocId = (int)$this->db->lastInsertId();

                $insDet = $this->db->prepare(
                    "INSERT INTO orden_compra_detalle
                     (orden_compra_id, producto_id, cantidad, precio_unitario, subtotal)
                     VALUES (:oc, :pid, :cant, :precio, :sub)"
                );
                foreach ($detalles as $d) {
                    $insDet->execute([
                        'oc' => $ocId,
                        'pid' => $d['producto_id'],
                        'cant' => $d['cantidad'],
                        'precio' => number_format($d['precio_unitario'], 2, '.', ''),
                        'sub' => number_format($d['subtotal'], 2, '.', ''),
                    ]);
                }

                Logger::info('Orden de compra creada', ['oc_id' => $ocId, 'total' => $subtotal]);
                return $this->obtener($ocId);
            });
        }

        public function cambiarEstado(int $id, string $estado): array
        {
            $validos = ['borrador', 'enviada', 'recibida_parcial', 'recibida', 'cancelada'];
            if (!in_array($estado, $validos, true)) throw new BusinessException('Estado inválido.');

            $oc = $this->obtener($id);
            if ($oc['estado'] === 'recibida') throw new BusinessException('La orden ya fue recibida completamente.');
            if ($oc['estado'] === 'cancelada') throw new BusinessException('La orden está cancelada.');

            $nid = $this->nid();

            $sql = "UPDATE ordenes_compra SET estado = :e WHERE id = :id";
            $params = ['e' => $estado, 'id' => $id];

            if ($nid !== null) {
                $sql .= " AND negocio_id = :nid";
                $params['nid'] = $nid;
            }

            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);

            return $this->obtener($id);
        }

        public function recibir(int $id, array $recepciones, int $usuarioId): array
        {
            $nid = $this->nid();
            if ($nid === null) {
                throw new BusinessException('No se pudo determinar el negocio.');
            }

            return $this->transaction(function () use ($id, $recepciones, $usuarioId, $nid) {
                $oc = $this->obtener($id);
                if ($oc['estado'] === 'cancelada') throw new BusinessException('La orden está cancelada.');
                if ($oc['estado'] === 'recibida') throw new BusinessException('La orden ya fue recibida.');

                $insMov = $this->db->prepare(
                    "INSERT INTO movimientos_inventario
                     (negocio_id, producto_id, usuario_id, tipo, cantidad, stock_anterior, stock_nuevo, referencia_tipo, referencia_id, motivo)
                     VALUES (:nid, :pid, :uid, 'entrada', :cant, :ant, :nuevo, 'orden_compra', :ref, :motivo)"
                );
                $updStock = $this->db->prepare("UPDATE productos SET stock = stock + :c WHERE id = :id AND negocio_id = :nid");
                $getStock = $this->db->prepare("SELECT stock FROM productos WHERE id = :id AND negocio_id = :nid FOR UPDATE");
                $updDet = $this->db->prepare(
                    "UPDATE orden_compra_detalle SET cantidad_recibida = cantidad_recibida + :c WHERE id = :id"
                );

                $algoRecibido = false;
                foreach ($recepciones as $r) {
                    $detId = (int)($r['detalle_id'] ?? 0);
                    $cant = (int)($r['cantidad'] ?? 0);
                    if ($detId <= 0 || $cant <= 0) continue;

                    $stmt = $this->db->prepare(
                        "SELECT * FROM orden_compra_detalle WHERE id = :id AND orden_compra_id = :oc"
                    );
                    $stmt->execute(['id' => $detId, 'oc' => $id]);
                    $det = $stmt->fetch();
                    if ($det === false) continue;

                    $pendiente = (int)$det['cantidad'] - (int)$det['cantidad_recibida'];
                    if ($cant > $pendiente) $cant = $pendiente;
                    if ($cant <= 0) continue;

                    $getStock->execute(['id' => $det['producto_id'], 'nid' => $nid]);
                    $ant = (int)$getStock->fetchColumn();
                    $nuevo = $ant + $cant;

                    $updStock->execute(['c' => $cant, 'id' => $det['producto_id'], 'nid' => $nid]);
                    $updDet->execute(['c' => $cant, 'id' => $detId]);
                    $insMov->execute([
                        'nid'    => $nid,
                        'pid'    => $det['producto_id'],
                        'uid'    => $usuarioId,
                        'cant'   => $cant,
                        'ant'    => $ant,
                        'nuevo'  => $nuevo,
                        'ref'    => $id,
                        'motivo' => "Recepción OC {$oc['numero']}",
                    ]);

                    $algoRecibido = true;
                }

                if (!$algoRecibido) throw new BusinessException('No se recibió ningún producto.');

                $stmt = $this->db->prepare(
                    "SELECT SUM(cantidad) AS total, SUM(cantidad_recibida) AS recibido
                     FROM orden_compra_detalle WHERE orden_compra_id = :id"
                );
                $stmt->execute(['id' => $id]);
                $tot = $stmt->fetch();
                $estadoFinal = ((int)$tot['total'] === (int)$tot['recibido']) ? 'recibida' : 'recibida_parcial';

                $upd = $this->db->prepare(
                    "UPDATE ordenes_compra SET estado = :e, fecha_recepcion = NOW() WHERE id = :id AND negocio_id = :nid"
                );
                $upd->execute(['e' => $estadoFinal, 'id' => $id, 'nid' => $nid]);

                return $this->obtener($id);
            });
        }

        private function transaction(callable $cb): mixed
        {
            $this->db->beginTransaction();
            try {
                $r = $cb();
                $this->db->commit();
                return $r;
            } catch (Throwable $e) {
                if ($this->db->inTransaction()) $this->db->rollBack();
                throw $e;
            }
        }
    }
}