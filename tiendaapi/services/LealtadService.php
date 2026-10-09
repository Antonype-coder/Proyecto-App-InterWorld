<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../core/Auth.php';
require_once __DIR__ . '/../core/Exceptions/BusinessException.php';
require_once __DIR__ . '/../core/Exceptions/NotFoundException.php';

if (!class_exists('LealtadService')) {
    class LealtadService
    {
        private PDO $db;

        private const PUNTOS_POR_PESO = 1;
        private const PESO_POR_PUNTO = 1000;
        private const PUNTOS_BRONZE = 0;
        private const PUNTOS_SILVER = 500;
        private const PUNTOS_GOLD = 2000;
        private const VALOR_PUNTO_EN_CANJE = 100;

        public function __construct()
        {
            $this->db = Database::getConnection();
        }

        private function nid(): ?int
        {
            return class_exists('Auth') ? Auth::negocioId() : null;
        }

        public function otorgarPorVenta(int $clienteId, float $montoTotal, int $ventaId, int $usuarioId): int
        {
            if ($clienteId <= 0 || $montoTotal <= 0) return 0;

            $puntos = (int)floor($montoTotal / self::PESO_POR_PUNTO) * self::PUNTOS_POR_PESO;
            if ($puntos <= 0) return 0;

            return $this->registrar($clienteId, $puntos, 'ganado', $ventaId, $usuarioId, "Compra #{$ventaId}");
        }

        public function canjear(int $clienteId, int $puntos, int $usuarioId): array
        {
            if ($puntos <= 0) throw new BusinessException('Cantidad de puntos inválida.');

            $nid = $this->nid();

            return $this->transaction(function () use ($clienteId, $puntos, $usuarioId, $nid) {
                $sql = "SELECT puntos_actuales FROM clientes WHERE id = :id";
                $params = ['id' => $clienteId];
                if ($nid !== null) {
                    $sql .= " AND negocio_id = :nid";
                    $params['nid'] = $nid;
                }
                $sql .= " FOR UPDATE";

                $stmt = $this->db->prepare($sql);
                $stmt->execute($params);
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

        public function ajustar(int $clienteId, int $puntos, string $motivo, int $usuarioId): int
        {
            if ($puntos === 0) throw new BusinessException('Los puntos no pueden ser cero.');
            return $this->registrar($clienteId, $puntos, 'ajuste', null, $usuarioId, $motivo);
        }

        public function historial(int $clienteId, int $limit = 50): array
        {
            $nid = $this->nid();

            $sql = "SELECT ph.*, u.nombre AS usuario_nombre
                    FROM puntos_historial ph
                    LEFT JOIN usuarios u ON u.id = ph.usuario_id
                    INNER JOIN clientes c ON c.id = ph.cliente_id
                    WHERE ph.cliente_id = :id";
            $params = ['id' => $clienteId];

            if ($nid !== null) {
                $sql .= " AND c.negocio_id = :nid";
                $params['nid'] = $nid;
            }
            $sql .= " ORDER BY ph.id DESC LIMIT " . (int)$limit;

            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);
            return $stmt->fetchAll() ?: [];
        }

        public function infoCliente(int $clienteId): array
        {
            $nid = $this->nid();

            $sql = "SELECT id, nombre, puntos_actuales, nivel_lealtad, total_compras
                    FROM clientes WHERE id = :id";
            $params = ['id' => $clienteId];

            if ($nid !== null) {
                $sql .= " AND negocio_id = :nid";
                $params['nid'] = $nid;
            }
            $sql .= " LIMIT 1";

            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);
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

        public function ranking(int $limit = 50): array
        {
            $nid = $this->nid();

            $sql = "SELECT id, nombre, documento, puntos_actuales, nivel_lealtad, total_compras
                    FROM clientes
                    WHERE activo = 1 AND puntos_actuales > 0";
            $params = [];

            if ($nid !== null) {
                $sql .= " AND negocio_id = :nid";
                $params['nid'] = $nid;
            }
            $sql .= " ORDER BY puntos_actuales DESC LIMIT " . (int)$limit;

            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);
            return $stmt->fetchAll() ?: [];
        }

        private function registrar(
            int $clienteId,
            int $puntos,
            string $tipo,
            ?int $ventaId,
            ?int $usuarioId,
            ?string $motivo
        ): int {
            $nid = $this->nid();

            return $this->transaction(function () use ($clienteId, $puntos, $tipo, $ventaId, $usuarioId, $motivo, $nid) {
                $sql = "SELECT puntos_actuales FROM clientes WHERE id = :id";
                $params = ['id' => $clienteId];
                if ($nid !== null) {
                    $sql .= " AND negocio_id = :nid";
                    $params['nid'] = $nid;
                }
                $sql .= " FOR UPDATE";

                $stmt = $this->db->prepare($sql);
                $stmt->execute($params);
                $row = $stmt->fetch();
                if ($row === false) throw new NotFoundException('Cliente no encontrado.');

                $antes = (int)$row['puntos_actuales'];
                $despues = max(0, $antes + $puntos);

                $nivel = $this->calcularNivel($despues);

                $updSql = "UPDATE clientes SET puntos_actuales = :p, nivel_lealtad = :n WHERE id = :id";
                $updParams = ['p' => $despues, 'n' => $nivel, 'id' => $clienteId];
                if ($nid !== null) {
                    $updSql .= " AND negocio_id = :nid";
                    $updParams['nid'] = $nid;
                }
                $upd = $this->db->prepare($updSql);
                $upd->execute($updParams);

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