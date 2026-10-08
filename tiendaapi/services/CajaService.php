<?php
declare(strict_types=1);

require_once __DIR__ . '/../core/Exceptions/BusinessException.php';
require_once __DIR__ . '/../core/Exceptions/NotFoundException.php';
require_once __DIR__ . '/../core/Logger.php';
require_once __DIR__ . '/../config/database.php';

if (!class_exists('CajaService')) {
    class CajaService
    {
        private PDO $db;

        public function __construct()
        {
            $this->db = Database::getConnection();
        }

        public function sesionAbierta(int $usuarioId): ?array
        {
            $stmt = $this->db->prepare(
                "SELECT * FROM caja_sesiones WHERE usuario_id = :uid AND estado = 'abierta' ORDER BY id DESC LIMIT 1"
            );
            $stmt->execute(['uid' => $usuarioId]);
            $row = $stmt->fetch();
            return $row === false ? null : $row;
        }

        public function abrir(int $usuarioId, float $montoApertura, ?string $notas): array
        {
            if ($this->sesionAbierta($usuarioId) !== null) {
                throw new BusinessException('Ya tienes una caja abierta. Ciérrala antes de abrir otra.');
            }

            $stmt = $this->db->prepare(
                "INSERT INTO caja_sesiones (usuario_id, monto_apertura, notas_apertura, estado)
                 VALUES (:uid, :monto, :notas, 'abierta')"
            );
            $stmt->execute([
                'uid'   => $usuarioId,
                'monto' => number_format($montoApertura, 2, '.', ''),
                'notas' => $notas,
            ]);

            $id = (int) $this->db->lastInsertId();
            Logger::info('Caja abierta', ['sesion_id' => $id, 'user_id' => $usuarioId]);

            return $this->obtenerSesion($id);
        }

        public function obtenerSesion(int $id): array
        {
            $stmt = $this->db->prepare("SELECT * FROM caja_sesiones WHERE id = :id LIMIT 1");
            $stmt->execute(['id' => $id]);
            $row = $stmt->fetch();
            if ($row === false) {
                throw new NotFoundException('Sesión de caja no encontrada.');
            }
            return $row;
        }

        public function registrarMovimiento(int $sesionId, int $usuarioId, array $data): array
        {
            $sesion = $this->obtenerSesion($sesionId);
            if ($sesion['estado'] !== 'abierta') {
                throw new BusinessException('La caja no está abierta.');
            }

            $stmt = $this->db->prepare(
                "INSERT INTO caja_movimientos
                 (caja_sesion_id, usuario_id, tipo, monto, metodo_pago, referencia_tipo, referencia_id, descripcion)
                 VALUES (:sid, :uid, :tipo, :monto, :metodo, :ref_tipo, :ref_id, :desc)"
            );
            $stmt->execute([
                'sid'       => $sesionId,
                'uid'       => $usuarioId,
                'tipo'      => $data['tipo'],
                'monto'     => number_format((float) $data['monto'], 2, '.', ''),
                'metodo'    => $data['metodo_pago'] ?? 'efectivo',
                'ref_tipo'  => $data['referencia_tipo'] ?? null,
                'ref_id'    => $data['referencia_id'] ?? null,
                'desc'      => $data['descripcion'] ?? null,
            ]);

            $id = (int) $this->db->lastInsertId();
            return $this->obtenerMovimiento($id);
        }

        public function obtenerMovimiento(int $id): array
        {
            $stmt = $this->db->prepare("SELECT * FROM caja_movimientos WHERE id = :id LIMIT 1");
            $stmt->execute(['id' => $id]);
            $row = $stmt->fetch();
            if ($row === false) {
                throw new NotFoundException('Movimiento no encontrado.');
            }
            return $row;
        }

        public function movimientos(int $sesionId): array
        {
            $stmt = $this->db->prepare(
                "SELECT * FROM caja_movimientos WHERE caja_sesion_id = :sid ORDER BY id ASC"
            );
            $stmt->execute(['sid' => $sesionId]);
            return $stmt->fetchAll() ?: [];
        }

        /**
         * Calcula los totales de la sesión. Los métodos de pago NO efectivo
         * (tarjeta, transferencia) NO entran al efectivo físico esperado.
         *
         * Efectivo esperado = apertura + ventas_efectivo + ingresos_manuales - egresos
         */
        private function calcularTotales(int $sesionId): array
        {
            $stmt = $this->db->prepare(
                "SELECT
                    COALESCE(SUM(CASE WHEN tipo = 'venta' AND metodo_pago = 'efectivo' THEN monto ELSE 0 END), 0) AS ventas_efectivo,
                    COALESCE(SUM(CASE WHEN tipo = 'venta' AND metodo_pago = 'tarjeta' THEN monto ELSE 0 END), 0) AS ventas_tarjeta,
                    COALESCE(SUM(CASE WHEN tipo = 'venta' AND metodo_pago = 'transferencia' THEN monto ELSE 0 END), 0) AS ventas_transferencia,
                    COALESCE(SUM(CASE WHEN tipo = 'ingreso' THEN monto ELSE 0 END), 0) AS ingresos_manuales,
                    COALESCE(SUM(CASE WHEN tipo IN ('egreso','devolucion') THEN monto ELSE 0 END), 0) AS egresos
                 FROM caja_movimientos
                 WHERE caja_sesion_id = :sid"
            );
            $stmt->execute(['sid' => $sesionId]);
            $row = $stmt->fetch() ?: [];

            return [
                'ventas_efectivo'       => (float) ($row['ventas_efectivo'] ?? 0),
                'ventas_tarjeta'        => (float) ($row['ventas_tarjeta'] ?? 0),
                'ventas_transferencia'  => (float) ($row['ventas_transferencia'] ?? 0),
                'ingresos_manuales'     => (float) ($row['ingresos_manuales'] ?? 0),
                'egresos'               => (float) ($row['egresos'] ?? 0),
            ];
        }

        public function cerrar(int $sesionId, int $usuarioId, float $montoDeclarado, ?string $notas): array
        {
            return $this->transaction(function () use ($sesionId, $montoDeclarado, $notas) {
                $sesion = $this->obtenerSesion($sesionId);
                if ($sesion['estado'] !== 'abierta') {
                    throw new BusinessException('La caja ya está cerrada.');
                }

                $totales = $this->calcularTotales($sesionId);
                $apertura = (float) $sesion['monto_apertura'];

                // Efectivo físico que debería haber en caja.
                $efectivoEsperado = round(
                    $apertura
                    + $totales['ventas_efectivo']
                    + $totales['ingresos_manuales']
                    - $totales['egresos'],
                    2
                );

                $diferencia = round($montoDeclarado - $efectivoEsperado, 2);

                $upd = $this->db->prepare(
                    "UPDATE caja_sesiones SET
                        estado = 'cerrada',
                        monto_cierre_declarado      = :declarado,
                        monto_cierre_sistema        = :sistema,
                        diferencia                  = :diff,
                        total_ventas_efectivo       = :v_efectivo,
                        total_ventas_tarjeta        = :v_tarjeta,
                        total_ventas_transferencia  = :v_transf,
                        total_ingresos              = :ingresos,
                        total_egresos               = :egresos,
                        notas_cierre = :notas,
                        cerrada_at   = NOW()
                     WHERE id = :id"
                );
                $upd->execute([
                    'declarado'   => number_format($montoDeclarado, 2, '.', ''),
                    'sistema'     => number_format($efectivoEsperado, 2, '.', ''),
                    'diff'        => number_format($diferencia, 2, '.', ''),
                    'v_efectivo'  => number_format($totales['ventas_efectivo'], 2, '.', ''),
                    'v_tarjeta'   => number_format($totales['ventas_tarjeta'], 2, '.', ''),
                    'v_transf'    => number_format($totales['ventas_transferencia'], 2, '.', ''),
                    'ingresos'    => number_format($totales['ingresos_manuales'], 2, '.', ''),
                    'egresos'     => number_format($totales['egresos'], 2, '.', ''),
                    'notas'       => $notas,
                    'id'          => $sesionId,
                ]);

                Logger::info('Caja cerrada', [
                    'sesion_id'  => $sesionId,
                    'declarado'  => $montoDeclarado,
                    'esperado'   => $efectivoEsperado,
                    'diferencia' => $diferencia,
                ]);

                return $this->obtenerSesion($sesionId);
            });
        }

        public function historial(int $usuarioId, int $limit = 50): array
        {
            $stmt = $this->db->prepare(
                "SELECT * FROM caja_sesiones WHERE usuario_id = :uid ORDER BY id DESC LIMIT " . (int) $limit
            );
            $stmt->execute(['uid' => $usuarioId]);
            return $stmt->fetchAll() ?: [];
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