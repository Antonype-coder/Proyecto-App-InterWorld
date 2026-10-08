<?php
declare(strict_types=1);

require_once __DIR__ . '/../models/Venta.php';
require_once __DIR__ . '/../core/Logger.php';
require_once __DIR__ . '/../core/Exceptions/BusinessException.php';
require_once __DIR__ . '/../core/Exceptions/NotFoundException.php';
require_once __DIR__ . '/../config/database.php';

if (!class_exists('VentaService')) {
    class VentaService
    {
        private Venta $ventas;
        private PDO $db;

        public function __construct()
        {
            $this->ventas = new Venta();
            $this->db = Database::getConnection();
        }

        public function crear(array $data, int $usuarioId): array
        {
            if (empty($data['items']) || !is_array($data['items'])) {
                throw new BusinessException('La venta debe tener al menos un producto.');
            }

            $datosVenta = [
                'usuario_id'     => $usuarioId,
                'cliente_id'     => $data['cliente_id'] ?? null,
                'caja_sesion_id' => $data['caja_sesion_id'] ?? null,
                'tipo_pago'      => $data['tipo_pago'] ?? 'contado',
                'descuento'      => $data['descuento'] ?? 0.0,
                'notas'          => $data['notas'] ?? null,
            ];

            $resultadoCreacion = $this->ventas->crearVentaCompleta(
                $datosVenta,
                $data['items'],
                isset($data['idempotency_key']) ? (string) $data['idempotency_key'] : null
            );
            $ventaId = $resultadoCreacion['id'];

            if (!$resultadoCreacion['created']) {
                $existente = $this->ventas->findWithDetail($ventaId);
                if ($existente === null) {
                    throw new NotFoundException('Venta no encontrada tras reintentar.');
                }
                return $existente;
            }

            Logger::info('Venta creada', ['venta_id' => $ventaId, 'user_id' => $usuarioId]);

            // ================================================================
            // NUEVO: registrar la venta en caja_movimientos
            // para que aparezca en el turno y en el cierre de caja.
            // ================================================================
            try {
                $this->registrarMovimientoCaja(
                    $ventaId,
                    $usuarioId,
                    $datosVenta['caja_sesion_id'],
                    (string) ($data['metodo_pago'] ?? 'efectivo')
                );
            } catch (Throwable $e) {
                // No rompemos la venta si falla el registro en caja.
                Logger::warning('No se pudo registrar venta en caja_movimientos: ' . $e->getMessage(), [
                    'venta_id' => $ventaId,
                ]);
            }

            // Otorgar puntos de lealtad si hay cliente.
            if (!empty($datosVenta['cliente_id'])) {
                try {
                    require_once __DIR__ . '/LealtadService.php';
                    $lealtad = new LealtadService();
                    $ventaTemp = $this->ventas->find($ventaId);
                    if ($ventaTemp) {
                        $lealtad->otorgarPorVenta(
                            (int) $datosVenta['cliente_id'],
                            (float) $ventaTemp['total'],
                            $ventaId,
                            $usuarioId
                        );
                    }
                } catch (Throwable $e) {
                    Logger::warning('Error otorgando puntos: ' . $e->getMessage());
                }
            }

            $venta = $this->ventas->findWithDetail($ventaId);
            if ($venta === null) {
                throw new NotFoundException('Venta no encontrada tras crear.');
            }

            return $venta;
        }

        /**
         * Inserta la venta en caja_movimientos asociada a la sesión de caja abierta.
         * Si no hay caja abierta, no inserta nada (la venta sigue siendo válida).
         */
        private function registrarMovimientoCaja(
            int $ventaId,
            int $usuarioId,
            ?int $sesionIdPropuesta,
            string $metodoPago
        ): void {
            // Validar método de pago. Si viene algo raro, forzamos 'efectivo'.
            $metodosValidos = ['efectivo', 'tarjeta', 'transferencia', 'otro'];
            if (!in_array($metodoPago, $metodosValidos, true)) {
                $metodoPago = 'efectivo';
            }

            // Buscar la sesión de caja: la propuesta, o la abierta del usuario.
            $sesionId = $sesionIdPropuesta;
            if ($sesionId === null) {
                $stmt = $this->db->prepare(
                    "SELECT id FROM caja_sesiones
                     WHERE usuario_id = :uid AND estado = 'abierta'
                     ORDER BY id DESC LIMIT 1"
                );
                $stmt->execute(['uid' => $usuarioId]);
                $row = $stmt->fetch();
                $sesionId = $row !== false ? (int) $row['id'] : null;
            }

            if ($sesionId === null) {
                // No hay caja abierta: no registramos en caja.
                return;
            }

            // Obtener el total y número de la venta para el movimiento.
            $stmtVenta = $this->db->prepare(
                "SELECT numero, total FROM ventas WHERE id = :id LIMIT 1"
            );
            $stmtVenta->execute(['id' => $ventaId]);
            $ventaRow = $stmtVenta->fetch();
            if ($ventaRow === false) {
                return;
            }

            $stmt = $this->db->prepare(
                "INSERT INTO caja_movimientos
                    (caja_sesion_id, usuario_id, tipo, monto, metodo_pago,
                     referencia_tipo, referencia_id, descripcion)
                 VALUES
                    (:sid, :uid, 'venta', :monto, :metodo,
                     'venta', :ref_id, :desc)"
            );
            $stmt->execute([
                'sid'    => $sesionId,
                'uid'    => $usuarioId,
                'monto'  => number_format((float) $ventaRow['total'], 2, '.', ''),
                'metodo' => $metodoPago,
                'ref_id' => $ventaId,
                'desc'   => 'Venta ' . $ventaRow['numero'],
            ]);
        }

        public function listar(array $filtros = [], int $limit = 50, int $offset = 0): array
        {
            $items = $this->ventas->listar($filtros, 'v.id DESC', $limit, $offset);
            $total = $this->ventas->contarConFiltros($filtros);

            return [
                'items'  => $items,
                'total'  => $total,
                'limit'  => $limit,
                'offset' => $offset,
            ];
        }

        public function obtener(int $id): array
        {
            $venta = $this->ventas->findWithDetail($id);
            if ($venta === null) {
                throw new NotFoundException('Venta no encontrada.');
            }
            return $venta;
        }

        public function anular(int $id, int $usuarioId, string $motivo): array
        {
            $this->ventas->anularVenta($id, $usuarioId, $motivo);

            Logger::warning('Venta anulada', [
                'venta_id' => $id,
                'user_id'  => $usuarioId,
                'motivo'   => $motivo,
            ]);

            return $this->obtener($id);
        }
    }
}