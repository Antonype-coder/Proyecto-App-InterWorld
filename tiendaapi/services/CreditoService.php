<?php
declare(strict_types=1);

require_once __DIR__ . '/../models/Cliente.php';
require_once __DIR__ . '/../core/Logger.php';
require_once __DIR__ . '/../core/Exceptions/BusinessException.php';
require_once __DIR__ . '/../core/Exceptions/NotFoundException.php';

if (!class_exists('CreditoService')) {
    class CreditoService
    {
        private Cliente $clientes;

        public function __construct()
        {
            $this->clientes = new Cliente();
        }

        public function registrarPago(int $clienteId, int $usuarioId, array $data): array
        {
            $cliente = $this->clientes->find($clienteId);
            if ($cliente === null) {
                throw new NotFoundException('Cliente no encontrado.');
            }

            $monto      = (float) $data['monto'];
            $saldoActual = (float) $cliente['saldo_deuda'];

            if ($monto <= 0) {
                throw new BusinessException('El monto debe ser mayor a cero.');
            }
            if ($monto > $saldoActual + 0.001) {
                throw new BusinessException(sprintf(
                    'El monto excede el saldo de deuda (%.2f).',
                    $saldoActual
                ));
            }

            $pagoId = $this->clientes->registrarPago(
                $clienteId,
                $usuarioId,
                $monto,
                (string) $data['metodo_pago'],
                isset($data['venta_id']) ? (int) $data['venta_id'] : null,
                isset($data['notas']) ? trim((string) $data['notas']) : null
            );

            Logger::info('Pago de crédito registrado', [
                'pago_id'   => $pagoId,
                'cliente'   => $clienteId,
                'monto'     => $monto,
            ]);

            return [
                'pago_id' => $pagoId,
                'cliente' => $this->clientes->find($clienteId),
            ];
        }

        public function estadoCuenta(int $clienteId): array
        {
            $estado = $this->clientes->estadoCuenta($clienteId);
            if ($estado === []) {
                throw new NotFoundException('Cliente no encontrado.');
            }
            return $estado;
        }
    }
}