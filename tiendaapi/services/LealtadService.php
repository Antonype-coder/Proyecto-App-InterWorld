<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../core/Exceptions/BusinessException.php';
require_once __DIR__ . '/../core/Exceptions/NotFoundException.php';

if (!class_exists('LealtadService')) {
    class LealtadService
    {
        private PDO $db;

        // Reglas del programa (configurables)
        private const PUNTOS_POR_PESO = 1;       // 1 punto por cada $1.000
        private const PESO_POR_PUNTO = 1000;
        private const PUNTOS_BRONZE = 0;         // >= 0 puntos
        private const PUNTOS_SILVER = 500;       // >= 500 puntos
        private const PUNTOS_GOLD = 2000;        // >= 2000 puntos
        private const VALOR_PUNTO_EN_CANJE = 100; // 1 punto = $100 al canjear

        public function __construct()
        {
            $this->db = Database::getConnection();
        }

        /**
         * Otorga puntos por una compra.
         */
        public function otorgarPorVenta(int $clienteId, float $montoTotal, int $ventaId, int $usuarioId): int
        {
            if ($clienteId <= 0 || $montoTotal <= 0) return 0;

            $puntos = (int)floor($montoTotal / self::PESO_POR_PUNTO) * self::PUNTOS_POR_PESO;
            if ($puntos <= 0) return 0;

            return $this->registrar($clienteId, $puntos, 'ganado', $ventaId, $usuarioId, "Compra #{$ventaId}");
        }

        /**
         * Canjea puntos del cliente (los descuenta y devuelve el valor en pesos).
         */
        public function canjear(int $clienteId, int $puntos, int $usuarioId): array
        {
            if ($puntos <= 0) throw new BusinessException('Cantidad de puntos inválida.');

            return $this->transaction(function () use ($clienteId, $puntos, $usuarioId) {
                $stmt = $this->db->prepare("SELECT puntos_actuales FROM clientes WHERE id = :id FOR UPDATE");
                $stmt->execute(['id' => $clienteId]);
                $cliente = $stmt->fetch();
                if ($cliente === false) throw new NotFoundException('Cliente no encontrado.');

                $actuales = (int)$cliente['puntos_actuales'];
                if ($puntos > $actuales) throw new BusinessException("Solo tienes {$actuales} puntos disponibles.");

                $valorDescuento = $puntos * self::VALOR_PUNTO_EN_CANJE;

                $this->registrar($clienteId, -$puntos, 'canjeado', null, $usuarioId, 'Canje de puntos');

                return [
                    'puntos_canjeados' => $puntos,
                    'valor_descuento' => $valorDescuento,
                    'puntos_restantes' => $actuales - $puntos,
                ];
            });
        }

        /**
         * Ajuste manual (admin).
         */
        public function ajustar(int $clienteId, int $puntos, string $motivo, int $usuarioId): int
        {
            if ($puntos === 0) throw new BusinessException('Los puntos no pueden ser cero.');
            return $this->registrar($clienteId, $puntos, 'ajuste', null, $usuarioId, $motivo);
        }

        /**
         * Historial de puntos de un cliente.
         */
        public function historial(int $clienteId, int $limit = 50): array
        {
            $stmt = $this->db->prepare(
                "SELECT ph.*, u.nombre AS usuario_nombre
                 FROM puntos_historial ph
                 LEFT JOIN usuarios u ON u.id = ph.usuario_id
                 WHERE ph.cliente_id = :id
                 ORDER BY ph.id DESC LIMIT :limit"
            );
            $stmt->bindValue(':id', $clienteId, PDO::PARAM_INT);
            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmt->execute();
            return $stmt->fetchAll() ?: [];
        }

        /**
         * Info completa del programa para un cliente.
         */
        public function infoCliente(int $clienteId): array
        {
            $stmt = $this->db->prepare(
                "SELECT id, nombre, puntos_actuales, nivel_lealtad, total_compras
                 FROM clientes WHERE id = :id LIMIT 1"
            );
            $stmt->execute(['id' => $clienteId]);
            $cliente = $stmt->fetch();
            if ($cliente === false) throw new NotFoundException('Cliente no encontrado.');

            $puntos = (int)$cliente['puntos_actuales'];

            return [
                'cliente' => $cliente,
                'puntos_actuales' => $puntos,
                'nivel' => $cliente['nivel_lealtad'],
                'valor_disponible' => $puntos * self::VALOR_PUNTO_EN_CANJE,
                'proximo_nivel' => $this->proximoNivel($puntos),
                'reglas' => [
                    'puntos_por_peso' => self::PUNTOS_POR_PESO,
                    'peso_por_punto' => self::PESO_POR_PUNTO,
                    'valor_punto' => self::VALOR_PUNTO_EN_CANJE,
                    'niveles' => [
                        'bronze' => self::PUNTOS_BRONZE,
                        'silver' => self::PUNTOS_SILVER,
                        'gold' => self::PUNTOS_GOLD,
                    ],
                ],
            ];
        }

        /**
         * Lista todos los clientes ordenados por puntos.
         */
        public function ranking(int $limit = 50): array
        {
            $stmt = $this->db->prepare(
                "SELECT id, nombre, documento, puntos_actuales, nivel_lealtad, total_compras
                 FROM clientes
                 WHERE activo = 1 AND puntos_actuales > 0
                 ORDER BY puntos_actuales DESC LIMIT :limit"
            );
            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmt->execute();
            return $stmt->fetchAll() ?: [];
        }

        // ================================================================
        // PRIVADOS
        // ================================================================

        private function registrar(
            int $clienteId,
            int $puntos,
            string $tipo,
            ?int $ventaId,
            ?int $usuarioId,
            ?string $motivo
        ): int {
            return $this->transaction(function () use ($clienteId, $puntos, $tipo, $ventaId, $usuarioId, $motivo) {
                $stmt = $this->db->prepare(
                    "SELECT puntos_actuales FROM clientes WHERE id = :id FOR UPDATE"
                );
                $stmt->execute(['id' => $clienteId]);
                $row = $stmt->fetch();
                if ($row === false) throw new NotFoundException('Cliente no encontrado.');

                $antes = (int)$row['puntos_actuales'];
                $despues = max(0, $antes + $puntos);

                // Actualizar cliente
                $nivel = $this->calcularNivel($despues);
                $upd = $this->db->prepare(
                    "UPDATE clientes SET puntos_actuales = :p, nivel_lealtad = :n WHERE id = :id"
                );
                $upd->execute(['p' => $despues, 'n' => $nivel, 'id' => $clienteId]);

                // Registrar historial
                $ins = $this->db->prepare(
                    "INSERT INTO puntos_historial
                     (cliente_id, usuario_id, venta_id, tipo, puntos, saldo_anterior, saldo_nuevo, motivo)
                     VALUES (:cid, :uid, :vid, :tipo, :pts, :ant, :nuevo, :motivo)"
                );
                $ins->execute([
                    'cid' => $clienteId,
                    'uid' => $usuarioId,
                    'vid' => $ventaId,
                    'tipo' => $tipo,
                    'pts' => $puntos,
                    'ant' => $antes,
                    'nuevo' => $despues,
                    'motivo' => $motivo,
                ]);

                return $despues;
            });
        }

        private function calcularNivel(int $puntos): string
        {
            if ($puntos >= self::PUNTOS_GOLD) return 'gold';
            if ($puntos >= self::PUNTOS_SILVER) return 'silver';
            return 'bronze';
        }

        private function proximoNivel(int $puntos): ?array
        {
            if ($puntos >= self::PUNTOS_GOLD) return null;
            if ($puntos >= self::PUNTOS_SILVER) {
                return ['nombre' => 'gold', 'puntos_faltantes' => self::PUNTOS_GOLD - $puntos];
            }
            return ['nombre' => 'silver', 'puntos_faltantes' => self::PUNTOS_SILVER - $puntos];
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