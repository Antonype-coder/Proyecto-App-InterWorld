<?php
declare(strict_types=1);

/**
 * DashboardService — agregaciones analíticas para el dashboard.
 * Todas las consultas asumen tablas existentes (ventas, venta_detalle,
 * productos, clientes, caja_sesiones). Usa rangos inclusivos de fechas.
 */
class DashboardService
{
    private PDO $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    /** Payload completo del dashboard en una sola llamada. */
    public function resumenCompleto(string $desde, string $hasta, bool $comparar = true): array
    {
        $actual = $this->calcularMetricas($desde, $hasta);

        $data = [
            'rango'          => ['desde' => $desde, 'hasta' => $hasta],
            'kpis'           => $actual,
            'ventasPorDia'   => $this->ventasPorDia($desde, $hasta),
            'ventasPorHora'  => $this->ventasPorHora($desde, $hasta),
            'metodosPago'    => $this->metodosPago($desde, $hasta),
            'topProductos'   => $this->topProductos($desde, $hasta, 10),
            'topClientes'    => $this->topClientes($desde, $hasta, 5),
            'resumenCaja'    => $this->resumenCaja(),
        ];

        if ($comparar) {
            [$pDesde, $pHasta] = $this->rangoAnterior($desde, $hasta);
            $anterior = $this->calcularMetricas($pDesde, $pHasta);
            $data['comparacion']   = $this->comparar($actual, $anterior);
            $data['rangoAnterior'] = ['desde' => $pDesde, 'hasta' => $pHasta];
        }

        return $data;
    }

    /** KPIs principales del rango. */
    public function calcularMetricas(string $desde, string $hasta): array
    {
        $sql = "SELECT
                    COALESCE(SUM(total), 0)              AS totalVentas,
                    COUNT(*)                             AS numVentas,
                    COALESCE(AVG(total), 0)              AS ticketPromedio,
                    COALESCE(SUM(descuento_total), 0)    AS descuentos,
                    COALESCE(SUM(CASE WHEN tipo_pago = 'credito' THEN total ELSE 0 END), 0) AS totalCredito,
                    COALESCE(SUM(CASE WHEN tipo_pago = 'contado' THEN total ELSE 0 END), 0) AS totalContado
                FROM ventas
                WHERE estado = 'completada'
                  AND DATE(created_at) BETWEEN :desde AND :hasta";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':desde' => $desde, ':hasta' => $hasta]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC) ?: [];

        $costo = $this->costoMercanciaVendida($desde, $hasta);

        $ventas   = (float)($row['totalVentas'] ?? 0);
        $utilidad = $ventas - $costo;

        return [
            'totalVentas'     => round($ventas, 2),
            'numVentas'       => (int)($row['numVentas'] ?? 0),
            'ticketPromedio'  => round((float)($row['ticketPromedio'] ?? 0), 2),
            'descuentos'      => round((float)($row['descuentos'] ?? 0), 2),
            'totalCredito'    => round((float)($row['totalCredito'] ?? 0), 2),
            'totalContado'    => round((float)($row['totalContado'] ?? 0), 2),
            'costo'           => round($costo, 2),
            'utilidad'        => round($utilidad, 2),
            'margen'          => $ventas > 0 ? round(($utilidad / $ventas) * 100, 2) : 0.0,
        ];
    }

    private function costoMercanciaVendida(string $desde, string $hasta): float
    {
        $sql = "SELECT COALESCE(SUM(vd.cantidad * p.precio_compra), 0)
                FROM venta_detalle vd
                INNER JOIN ventas v   ON v.id = vd.venta_id
                INNER JOIN productos p ON p.id = vd.producto_id
                WHERE v.estado = 'completada'
                  AND DATE(v.created_at) BETWEEN :desde AND :hasta";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':desde' => $desde, ':hasta' => $hasta]);
        return (float)($stmt->fetchColumn() ?: 0);
    }

    private function rangoAnterior(string $desde, string $hasta): array
    {
        $d1   = new DateTime($desde);
        $d2   = new DateTime($hasta);
        $dias = (int)$d1->diff($d2)->days + 1;
        $fin  = (clone $d1)->modify('-1 day');
        $ini  = (clone $fin)->modify('-' . ($dias - 1) . ' days');
        return [$ini->format('Y-m-d'), $fin->format('Y-m-d')];
    }

    private function comparar(array $actual, array $anterior): array
    {
        $out = [];
        foreach ($actual as $clave => $valor) {
            if (!is_numeric($valor)) continue;
            $prev = (float)($anterior[$clave] ?? 0);
            $curr = (float)$valor;
            $cambio = $prev == 0.0
                ? ($curr > 0 ? 100.0 : 0.0)
                : (($curr - $prev) / $prev) * 100;
            $out[$clave] = [
                'actual'   => round($curr, 2),
                'anterior' => round($prev, 2),
                'cambio'   => round($cambio, 2),
            ];
        }
        return $out;
    }

    /** Serie diaria con días vacíos rellenados (para gráfico de línea). */
    public function ventasPorDia(string $desde, string $hasta): array
    {
        $sql = "SELECT DATE(created_at) AS fecha,
                       COUNT(*)         AS numVentas,
                       COALESCE(SUM(total), 0) AS total
                FROM ventas
                WHERE estado = 'completada'
                  AND DATE(created_at) BETWEEN :desde AND :hasta
                GROUP BY DATE(created_at)";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':desde' => $desde, ':hasta' => $hasta]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];

        $map = [];
        foreach ($rows as $r) {
            $map[(string)$r['fecha']] = [
                'total'     => (float)$r['total'],
                'numVentas' => (int)$r['numVentas'],
            ];
        }

        $out    = [];
        $cursor = new DateTime($desde);
        $fin    = new DateTime($hasta);
        while ($cursor <= $fin) {
            $key   = $cursor->format('Y-m-d');
            $out[] = [
                'fecha'     => $key,
                'total'     => $map[$key]['total'] ?? 0.0,
                'numVentas' => $map[$key]['numVentas'] ?? 0,
            ];
            $cursor->modify('+1 day');
        }
        return $out;
    }

    /** Matriz 7x24 para heatmap. Día 1=Dom (MySQL DAYOFWEEK). */
    public function ventasPorHora(string $desde, string $hasta): array
    {
        $sql = "SELECT DAYOFWEEK(created_at) AS dia,
                       HOUR(created_at)       AS hora,
                       COUNT(*)               AS numVentas,
                       COALESCE(SUM(total), 0) AS total
                FROM ventas
                WHERE estado = 'completada'
                  AND DATE(created_at) BETWEEN :desde AND :hasta
                GROUP BY dia, hora";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':desde' => $desde, ':hasta' => $hasta]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];

        $matrix = [];
        for ($d = 1; $d <= 7; $d++) {
            for ($h = 0; $h < 24; $h++) {
                $matrix[] = ['dia' => $d, 'hora' => $h, 'total' => 0.0, 'numVentas' => 0];
            }
        }
        foreach ($rows as $r) {
            $idx = ((int)$r['dia'] - 1) * 24 + (int)$r['hora'];
            if (isset($matrix[$idx])) {
                $matrix[$idx]['total']     = (float)$r['total'];
                $matrix[$idx]['numVentas'] = (int)$r['numVentas'];
            }
        }
        return $matrix;
    }

    public function metodosPago(string $desde, string $hasta): array
    {
        $sql = "SELECT COALESCE(metodo_pago, 'efectivo') AS metodo,
                       COUNT(*)                        AS numVentas,
                       COALESCE(SUM(total), 0)         AS total
                FROM ventas
                WHERE estado = 'completada'
                  AND DATE(created_at) BETWEEN :desde AND :hasta
                GROUP BY metodo
                ORDER BY total DESC";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':desde' => $desde, ':hasta' => $hasta]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
    }

    public function topProductos(string $desde, string $hasta, int $limit = 10): array
    {
        $limit = max(1, min(50, $limit));
        $sql = "SELECT p.id, p.nombre, p.imagen,
                       SUM(vd.cantidad)  AS cantidad,
                       SUM(vd.subtotal)  AS total
                FROM venta_detalle vd
                INNER JOIN ventas v    ON v.id = vd.venta_id
                INNER JOIN productos p ON p.id = vd.producto_id
                WHERE v.estado = 'completada'
                  AND DATE(v.created_at) BETWEEN :desde AND :hasta
                GROUP BY p.id, p.nombre, p.imagen
                ORDER BY cantidad DESC
                LIMIT {$limit}";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':desde' => $desde, ':hasta' => $hasta]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
    }

    public function topClientes(string $desde, string $hasta, int $limit = 5): array
    {
        $limit = max(1, min(20, $limit));
        $sql = "SELECT c.id, c.nombre,
                       COUNT(*)                 AS numVentas,
                       COALESCE(SUM(v.total),0) AS total
                FROM ventas v
                INNER JOIN clientes c ON c.id = v.cliente_id
                WHERE v.estado = 'completada'
                  AND v.cliente_id IS NOT NULL
                  AND DATE(v.created_at) BETWEEN :desde AND :hasta
                GROUP BY c.id, c.nombre
                ORDER BY total DESC
                LIMIT {$limit}";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':desde' => $desde, ':hasta' => $hasta]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
    }

    public function resumenCaja(): array
    {
        $sql = "SELECT id, usuario_id, monto_apertura, total_ventas,
                       total_ingresos, total_egresos, efectivo_esperado,
                       estado, abierta_at
                FROM caja_sesiones
                WHERE estado = 'abierta'
                ORDER BY id DESC
                LIMIT 1";
        $row = $this->db->query($sql)->fetch(PDO::FETCH_ASSOC);
        if (!$row) {
            return ['abierta' => false];
        }
        return ['abierta' => true, 'sesion' => $row];
    }
}