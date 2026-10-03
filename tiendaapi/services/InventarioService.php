<?php
declare(strict_types=1);

require_once __DIR__ . '/../models/Producto.php';
require_once __DIR__ . '/../models/MovimientoInventario.php';
require_once __DIR__ . '/../core/Logger.php';
require_once __DIR__ . '/../core/Exceptions/BusinessException.php';
require_once __DIR__ . '/../core/Exceptions/NotFoundException.php';

if (!class_exists('InventarioService')) {
    class InventarioService
    {
        private Producto $productos;
        private MovimientoInventario $movimientos;

        public function __construct()
        {
            $this->productos   = new Producto();
            $this->movimientos = new MovimientoInventario();
        }

        public function registrarMovimiento(array $data, int $usuarioId): array
        {
            $productoId = (int) $data['producto_id'];
            $tipo       = $data['tipo'];
            $cantidad   = (int) $data['cantidad'];
            $motivo     = $data['motivo'] ?? null;

            $producto = $this->productos->find($productoId);
            if ($producto === null) {
                throw new NotFoundException('Producto no encontrado.');
            }

            $stockAnterior = (int) $producto['stock'];
            $stockNuevo    = $stockAnterior;

            if ($tipo === 'entrada') {
                $stockNuevo = $this->productos->adjustStock($productoId, $cantidad);
            } elseif ($tipo === 'salida') {
                if ($cantidad > $stockAnterior) {
                    throw new BusinessException('Stock insuficiente para la salida.');
                }
                $stockNuevo = $this->productos->adjustStock($productoId, -$cantidad);
            } elseif ($tipo === 'ajuste') {
                $stockNuevo = $this->productos->setStock($productoId, $cantidad);
            } else {
                throw new BusinessException('Tipo de movimiento inválido.');
            }

            $movId = $this->movimientos->create([
                'producto_id'    => $productoId,
                'usuario_id'     => $usuarioId,
                'tipo'           => $tipo,
                'cantidad'       => $cantidad,
                'stock_anterior' => $stockAnterior,
                'stock_nuevo'    => $stockNuevo,
                'motivo'         => $motivo,
            ]);

            return [
                'movimiento'     => $this->movimientos->find($movId),
                'stock_anterior' => $stockAnterior,
                'stock_nuevo'    => $stockNuevo,
            ];
        }

        public function listarMovimientos(array $filtros = [], int $limit = 100, int $offset = 0): array
        {
            return $this->movimientos->allWithRelations($filtros, 'm.id DESC', $limit, $offset);
        }
    }
}