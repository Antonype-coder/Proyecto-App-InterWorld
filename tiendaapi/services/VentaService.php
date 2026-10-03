<?php
declare(strict_types=1);

require_once __DIR__ . '/../models/Venta.php';
require_once __DIR__ . '/../core/Logger.php';
require_once __DIR__ . '/../core/Exceptions/BusinessException.php';
require_once __DIR__ . '/../core/Exceptions/NotFoundException.php';

if (!class_exists('VentaService')) {
    class VentaService
    {
        private Venta $ventas;

        public function __construct()
        {
            $this->ventas = new Venta();
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