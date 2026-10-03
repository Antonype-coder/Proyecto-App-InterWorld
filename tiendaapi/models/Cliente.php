<?php
declare(strict_types=1);

require_once __DIR__ . '/BaseModel.php';

if (!class_exists('Cliente')) {
    class Cliente extends BaseModel
    {
        protected string $table = 'clientes';
        protected string $primaryKey = 'id';
        protected array $fillable = [
            'nombre', 'documento', 'telefono', 'email', 'direccion',
            'cupo_credito', 'saldo_deuda', 'notas', 'activo',
        ];

                public function documentoExists(string $documento, ?int $excludeId = null): bool
        {
            $sql = "SELECT COUNT(*) FROM {$this->table} WHERE documento = :doc";
            $params = ['doc' => $documento];

            if ($excludeId !== null) {
                $sql .= " AND id <> :id";
                $params['id'] = $excludeId;
            }

            return (int) $this->rawScalar($sql, $params) > 0;
        }

        public function incrementDeuda(int $id, float $monto): float
        {
            return $this->transaction(function (PDO $pdo) use ($id, $monto) {
                $stmt = $pdo->prepare("SELECT saldo_deuda FROM clientes WHERE id = :id FOR UPDATE");
                $stmt->execute(['id' => $id]);
                $row = $stmt->fetch();
                if ($row === false) {
                    throw new RuntimeException("Cliente #{$id} no encontrado.");
                }

                $nuevo = round((float) $row['saldo_deuda'] + $monto, 2);

                $upd = $pdo->prepare("UPDATE clientes SET saldo_deuda = :saldo WHERE id = :id");
                $upd->execute(['saldo' => number_format($nuevo, 2, '.', ''), 'id' => $id]);

                return $nuevo;
            });
        }

        public function decrementDeuda(int $id, float $monto): float
        {
            return $this->transaction(function (PDO $pdo) use ($id, $monto) {
                $stmt = $pdo->prepare("SELECT saldo_deuda FROM clientes WHERE id = :id FOR UPDATE");
                $stmt->execute(['id' => $id]);
                $row = $stmt->fetch();
                if ($row === false) {
                    throw new RuntimeException("Cliente #{$id} no encontrado.");
                }

                $nuevo = round((float) $row['saldo_deuda'] - $monto, 2);
                if ($nuevo < 0) $nuevo = 0.0;

                $upd = $pdo->prepare("UPDATE clientes SET saldo_deuda = :saldo WHERE id = :id");
                $upd->execute(['saldo' => number_format($nuevo, 2, '.', ''), 'id' => $id]);

                return $nuevo;
            });
        }

        public function estadoCuenta(int $id): array
        {
            $cliente = $this->find($id);
            if ($cliente === null) return [];

            $ventas = $this->raw(
                "SELECT v.id, v.numero, v.total, v.tipo_pago, v.estado, v.created_at
                 FROM ventas v
                 WHERE v.cliente_id = :id AND v.tipo_pago = 'credito'
                 ORDER BY v.id DESC LIMIT 50",
                ['id' => $id]
            );

            $pagos = $this->raw(
                "SELECT p.id, p.monto, p.metodo_pago, p.notas, p.created_at,
                        u.nombre AS usuario_nombre
                 FROM pagos_credito p
                 INNER JOIN usuarios u ON u.id = p.usuario_id
                 WHERE p.cliente_id = :id AND p.anulado = 0
                 ORDER BY p.id DESC LIMIT 50",
                ['id' => $id]
            );

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
            return $this->transaction(function (PDO $pdo) use ($clienteId, $usuarioId, $monto, $metodoPago, $ventaId, $notas) {
                $sql = "INSERT INTO pagos_credito
                        (cliente_id, venta_id, usuario_id, monto, metodo_pago, notas)
                        VALUES (:cliente_id, :venta_id, :usuario_id, :monto, :metodo_pago, :notas)";
                $stmt = $pdo->prepare($sql);
                $stmt->execute([
                    'cliente_id'  => $clienteId,
                    'venta_id'    => $ventaId,
                    'usuario_id'  => $usuarioId,
                    'monto'       => number_format($monto, 2, '.', ''),
                    'metodo_pago' => $metodoPago,
                    'notas'       => $notas,
                ]);

                // Decrementar deuda dentro de la misma transacción
                $sel = $pdo->prepare("SELECT saldo_deuda FROM clientes WHERE id = :id FOR UPDATE");
                $sel->execute(['id' => $clienteId]);
                $row = $sel->fetch();
                if ($row === false) {
                    throw new RuntimeException("Cliente #{$clienteId} no encontrado.");
                }

                $nuevo = round((float) $row['saldo_deuda'] - $monto, 2);
                if ($nuevo < 0) $nuevo = 0.0;

                $upd = $pdo->prepare("UPDATE clientes SET saldo_deuda = :saldo WHERE id = :id");
                $upd->execute(['saldo' => number_format($nuevo, 2, '.', ''), 'id' => $clienteId]);

                return (int) $pdo->lastInsertId();
            });
        }
    }
}