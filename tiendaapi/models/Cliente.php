<?php
declare(strict_types=1);

require_once __DIR__ . '/BaseModel.php';
require_once __DIR__ . '/../core/Auth.php';

if (!class_exists('Cliente')) {
    class Cliente extends BaseModel
    {
        protected string $table = 'clientes';
        protected string $primaryKey = 'id';
        protected array $fillable = [
            'negocio_id', 'nombre', 'documento', 'telefono', 'email', 'direccion',
            'cupo_credito', 'saldo_deuda', 'notas', 'activo',
        ];

        private function nid(): ?int
        {
            return class_exists('Auth') ? Auth::negocioId() : null;
        }

        public function documentoExists(string $documento, ?int $excludeId = null): bool
        {
            $nid = $this->nid();

            $sql = "SELECT COUNT(*) FROM {$this->table} WHERE documento = :doc";
            $params = ['doc' => $documento];

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

        public function incrementDeuda(int $id, float $monto): float
        {
            $nid = $this->nid();

            return $this->transaction(function (PDO $pdo) use ($id, $monto, $nid) {
                $sql = "SELECT saldo_deuda FROM clientes WHERE id = :id";
                $params = ['id' => $id];
                if ($nid !== null) {
                    $sql .= " AND negocio_id = :nid";
                    $params['nid'] = $nid;
                }
                $sql .= " FOR UPDATE";

                $stmt = $pdo->prepare($sql);
                $stmt->execute($params);
                $row = $stmt->fetch();
                if ($row === false) {
                    throw new RuntimeException("Cliente #{$id} no encontrado.");
                }

                $nuevo = round((float) $row['saldo_deuda'] + $monto, 2);

                $updSql = "UPDATE clientes SET saldo_deuda = :saldo WHERE id = :id";
                $updParams = ['saldo' => number_format($nuevo, 2, '.', ''), 'id' => $id];
                if ($nid !== null) {
                    $updSql .= " AND negocio_id = :nid";
                    $updParams['nid'] = $nid;
                }

                $upd = $pdo->prepare($updSql);
                $upd->execute($updParams);

                return $nuevo;
            });
        }

        public function decrementDeuda(int $id, float $monto): float
        {
            $nid = $this->nid();

            return $this->transaction(function (PDO $pdo) use ($id, $monto, $nid) {
                $sql = "SELECT saldo_deuda FROM clientes WHERE id = :id";
                $params = ['id' => $id];
                if ($nid !== null) {
                    $sql .= " AND negocio_id = :nid";
                    $params['nid'] = $nid;
                }
                $sql .= " FOR UPDATE";

                $stmt = $pdo->prepare($sql);
                $stmt->execute($params);
                $row = $stmt->fetch();
                if ($row === false) {
                    throw new RuntimeException("Cliente #{$id} no encontrado.");
                }

                $nuevo = round((float) $row['saldo_deuda'] - $monto, 2);
                if ($nuevo < 0) $nuevo = 0.0;

                $updSql = "UPDATE clientes SET saldo_deuda = :saldo WHERE id = :id";
                $updParams = ['saldo' => number_format($nuevo, 2, '.', ''), 'id' => $id];
                if ($nid !== null) {
                    $updSql .= " AND negocio_id = :nid";
                    $updParams['nid'] = $nid;
                }

                $upd = $pdo->prepare($updSql);
                $upd->execute($updParams);

                return $nuevo;
            });
        }

        public function estadoCuenta(int $id): array
        {
            $nid = $this->nid();

            $cliente = $this->find($id);
            if ($cliente === null) return [];

            $sqlVentas = "SELECT v.id, v.numero, v.total, v.tipo_pago, v.estado, v.created_at
                          FROM ventas v
                          WHERE v.cliente_id = :id AND v.tipo_pago = 'credito'";
            $paramsVentas = ['id' => $id];
            if ($nid !== null) {
                $sqlVentas .= " AND v.negocio_id = :nid";
                $paramsVentas['nid'] = $nid;
            }
            $sqlVentas .= " ORDER BY v.id DESC LIMIT 50";

            $ventas = $this->raw($sqlVentas, $paramsVentas);

            $sqlPagos = "SELECT p.id, p.monto, p.metodo_pago, p.notas, p.created_at,
                                u.nombre AS usuario_nombre
                         FROM pagos_credito p
                         INNER JOIN usuarios u ON u.id = p.usuario_id
                         WHERE p.cliente_id = :id AND p.anulado = 0";
            $paramsPagos = ['id' => $id];
            if ($nid !== null) {
                $sqlPagos .= " AND p.negocio_id = :nid";
                $paramsPagos['nid'] = $nid;
            }
            $sqlPagos .= " ORDER BY p.id DESC LIMIT 50";

            $pagos = $this->raw($sqlPagos, $paramsPagos);

            return [
                'cliente' => $cliente,
                'ventas'  => $ventas,
                'pagos'   => $pagos,
            ];
        }

        public function registrarPago(
            int $clienteId,
            int $usuarioId,
            float $monto,
            string $metodoPago,
            ?int $ventaId = null,
            ?string $notas = null
        ): int {
            $nid = $this->nid();
            if ($nid === null) {
                throw new RuntimeException('No se pudo determinar el negocio.');
            }

            return $this->transaction(function (PDO $pdo) use (
                $clienteId,
                $usuarioId,
                $monto,
                $metodoPago,
                $ventaId,
                $notas,
                $nid
            ) {
                // 1. Insertar el pago CON negocio_id
                $sql = "INSERT INTO pagos_credito
                        (negocio_id, cliente_id, venta_id, usuario_id, monto, metodo_pago, notas)
                        VALUES (:nid, :cliente_id, :venta_id, :usuario_id, :monto, :metodo_pago, :notas)";
                $stmt = $pdo->prepare($sql);
                $stmt->execute([
                    'nid'         => $nid,
                    'cliente_id'  => $clienteId,
                    'venta_id'    => $ventaId,
                    'usuario_id'  => $usuarioId,
                    'monto'       => number_format($monto, 2, '.', ''),
                    'metodo_pago' => $metodoPago,
                    'notas'       => $notas,
                ]);

                $pagoId = (int) $pdo->lastInsertId();

                // 2. Decrementar deuda del cliente
                $sel = $pdo->prepare(
                    "SELECT saldo_deuda FROM clientes
                     WHERE id = :id AND negocio_id = :nid FOR UPDATE"
                );
                $sel->execute(['id' => $clienteId, 'nid' => $nid]);
                $row = $sel->fetch();
                if ($row === false) {
                    throw new RuntimeException("Cliente #{$clienteId} no encontrado.");
                }

                $nuevo = round((float) $row['saldo_deuda'] - $monto, 2);
                if ($nuevo < 0) $nuevo = 0.0;

                $upd = $pdo->prepare(
                    "UPDATE clientes SET saldo_deuda = :saldo
                     WHERE id = :id AND negocio_id = :nid"
                );
                $upd->execute([
                    'saldo' => number_format($nuevo, 2, '.', ''),
                    'id'    => $clienteId,
                    'nid'   => $nid,
                ]);

                return $pagoId;
            });
        }
    }
}