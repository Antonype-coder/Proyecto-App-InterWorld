<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/env.php';

if (!class_exists('ReporteService')) {
    class ReporteService
    {
        private PDO $db;

        public function __construct()
        {
            $this->db = Database::getConnection();
        }

        public function resumen(): array
        {
            $ventasHoy = $this->db->query(
                "SELECT COUNT(*) AS cantidad,
                        COALESCE(SUM(CASE WHEN estado = 'completada' THEN total ELSE 0 END), 0) AS monto
                 FROM ventas WHERE DATE(created_at) = CURDATE()"
            )->fetch() ?: ['cantidad' => 0, 'monto' => 0];

            $productos = $this->db->query(
                "SELECT COUNT(*) AS total FROM productos WHERE activo = 1"
            )->fetch() ?: ['total' => 0];

            $alertas = $this->db->query(
                "SELECT COUNT(*) AS total FROM productos WHERE activo = 1 AND stock <= stock_minimo"
            )->fetch() ?: ['total' => 0];

            $cartera = $this->db->query(
                "SELECT COALESCE(SUM(saldo_deuda), 0) AS total FROM clientes WHERE activo = 1"
            )->fetch() ?: ['total' => 0];

            $ultimas = $this->db->query(
                "SELECT v.id, v.numero, v.total, v.tipo_pago, v.estado, v.created_at,
                        u.nombre AS usuario_nombre,
                        c.nombre AS cliente_nombre
                 FROM ventas v
                 INNER JOIN usuarios u ON u.id = v.usuario_id
                 LEFT JOIN clientes c ON c.id = v.cliente_id
                 ORDER BY v.id DESC LIMIT 5"
            )->fetchAll() ?: [];

            return [
                'ventas_hoy' => [
                    'cantidad' => (int) $ventasHoy['cantidad'],
                    'monto'    => number_format((float) $ventasHoy['monto'], 2, '.', ''),
                ],
                'productos_activos' => (int) $productos['total'],
                'alertas_stock'     => (int) $alertas['total'],
                'cartera_total'     => number_format((float) $cartera['total'], 2, '.', ''),
                'ultimas_ventas'    => $ultimas,
            ];
        }

        public function ventasPorDia(?string $desde, ?string $hasta): array
        {
            $desde = $desde ?: date('Y-m-d', strtotime('-30 days'));
            $hasta = $hasta ?: date('Y-m-d');

            $stmt = $this->db->prepare(
                "SELECT DATE(created_at) AS dia,
                        COUNT(*) AS total_ventas,
                        SUM(CASE WHEN estado = 'completada' THEN total ELSE 0 END) AS monto_total
                 FROM ventas
                 WHERE created_at >= :desde AND created_at <= :hasta
                 GROUP BY DATE(created_at)
                 ORDER BY dia ASC"
            );
            $stmt->execute([
                'desde' => $desde . ' 00:00:00',
                'hasta' => $hasta . ' 23:59:59',
            ]);
            return $stmt->fetchAll() ?: [];
        }

        public function productosMasVendidos(int $limit = 10, ?string $desde = null, ?string $hasta = null): array
        {
            $sql = "SELECT p.id, p.nombre, p.codigo_barras,
                           SUM(d.cantidad) AS unidades_vendidas,
                           SUM(d.subtotal) AS monto_total
                    FROM venta_detalle d
                    INNER JOIN ventas v ON v.id = d.venta_id
                    INNER JOIN productos p ON p.id = d.producto_id
                    WHERE v.estado = 'completada'";
            $params = [];

            if ($desde) {
                $sql .= " AND v.created_at >= :desde";
                $params['desde'] = $desde . ' 00:00:00';
            }
            if ($hasta) {
                $sql .= " AND v.created_at <= :hasta";
                $params['hasta'] = $hasta . ' 23:59:59';
            }

            $sql .= " GROUP BY p.id, p.nombre, p.codigo_barras
                      ORDER BY unidades_vendidas DESC
                      LIMIT " . (int) $limit;

            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);
            return $stmt->fetchAll() ?: [];
        }

        public function stockBajo(): array
        {
            return $this->db->query(
                "SELECT p.id, p.codigo_barras, p.nombre, p.stock, p.stock_minimo,
                        c.nombre AS categoria_nombre
                 FROM productos p
                 LEFT JOIN categorias c ON c.id = p.categoria_id
                 WHERE p.activo = 1 AND p.stock <= p.stock_minimo
                 ORDER BY (p.stock - p.stock_minimo) ASC, p.nombre ASC"
            )->fetchAll() ?: [];
        }

        public function cartera(): array
        {
            $total = $this->db->query(
                "SELECT COALESCE(SUM(saldo_deuda), 0) AS total FROM clientes WHERE activo = 1"
            )->fetch() ?: ['total' => 0];

            $clientes = $this->db->query(
                "SELECT id, nombre, documento, telefono, cupo_credito, saldo_deuda,
                        (cupo_credito - saldo_deuda) AS cupo_disponible
                 FROM clientes
                 WHERE activo = 1 AND saldo_deuda > 0
                 ORDER BY saldo_deuda DESC"
            )->fetchAll() ?: [];

            return [
                'total_cartera' => number_format((float) $total['total'], 2, '.', ''),
                'clientes'      => $clientes,
            ];
        }
            /**
     * Dashboard avanzado con KPIs comparados, ventas por hora,
     * métodos de pago y top productos con tendencia.
     */
    public function dashboardAvanzado(string $periodo = 'mes'): array
    {
        [$desde, $hasta] = $this->rangoPorPeriodo($periodo);
        [$desdeAnt, $hastaAnt] = $this->rangoAnterior($periodo);

        $ventasHoy = $this->ventasResumen(
            date('Y-m-d'),
            date('Y-m-d')
        );
        $ventasActual = $this->ventasResumen($desde, $hasta);
        $ventasAnterior = $this->ventasResumen($desdeAnt, $hastaAnt);

        return [
            'periodo' => [
                'nombre' => $periodo,
                'desde' => $desde,
                'hasta' => $hasta,
            ],
            'kpis' => [
                'ventas_hoy' => $ventasHoy,
                'ventas_periodo' => [
                    'actual' => $ventasActual,
                    'anterior' => $ventasAnterior,
                    'cambio' => $this->calcularCambio(
                        (float) $ventasActual['monto'],
                        (float) $ventasAnterior['monto']
                    ),
                ],
                'ticket_promedio' => $this->ticketPromedio($desde, $hasta),
                'productos_activos' => $this->contarProductosActivos(),
                'alertas_stock' => $this->contarAlertasStock(),
                'cartera_total' => $this->calcularCartera(),
                'clientes_nuevos' => $this->contarClientesNuevos($desde, $hasta),
            ],
            'ventas_por_dia' => $this->ventasPorDiaDetallado($desde, $hasta),
            'ventas_por_hora' => $this->ventasPorHora($desde, $hasta),
            'metodos_pago' => $this->metodosPagoDistribucion($desde, $hasta),
            'top_productos' => $this->productosMasVendidos(5, $desde, $hasta),
            'caja_abierta' => $this->cajaAbiertaActual(),
            'ultimas_ventas' => $this->ultimasVentas(5),
        ];
    }

    /**
     * Compara dos períodos arbitrarios.
     */
    public function comparacionPeriodos(string $desde1, string $hasta1, string $desde2, string $hasta2): array
    {
        $p1 = $this->ventasResumen($desde1, $hasta1);
        $p2 = $this->ventasResumen($desde2, $hasta2);

        return [
            'periodo_1' => ['desde' => $desde1, 'hasta' => $hasta1, 'data' => $p1],
            'periodo_2' => ['desde' => $desde2, 'hasta' => $hasta2, 'data' => $p2],
            'cambio' => $this->calcularCambio(
                (float) $p1['monto'],
                (float) $p2['monto']
            ),
        ];
    }

    // ================================================================
    // MÉTODOS PRIVADOS DE APOYO
    // ================================================================

    private function rangoPorPeriodo(string $periodo): array
    {
        $hoy = new DateTime();

        switch ($periodo) {
            case 'hoy':
                return [$hoy->format('Y-m-d'), $hoy->format('Y-m-d')];
            case 'ayer':
                $ayer = (clone $hoy)->modify('-1 day');
                return [$ayer->format('Y-m-d'), $ayer->format('Y-m-d')];
            case 'semana':
                $inicio = (clone $hoy)->modify('monday this week');
                return [$inicio->format('Y-m-d'), $hoy->format('Y-m-d')];
            case 'anio':
                $inicio = new DateTime($hoy->format('Y') . '-01-01');
                return [$inicio->format('Y-m-d'), $hoy->format('Y-m-d')];
            case 'mes':
            default:
                $inicio = new DateTime($hoy->format('Y-m-01'));
                return [$inicio->format('Y-m-d'), $hoy->format('Y-m-d')];
        }
    }

    private function rangoAnterior(string $periodo): array
    {
        $hoy = new DateTime();

        switch ($periodo) {
            case 'hoy':
                $ayer = (clone $hoy)->modify('-1 day');
                return [$ayer->format('Y-m-d'), $ayer->format('Y-m-d')];
            case 'ayer':
                $ant = (clone $hoy)->modify('-2 days');
                return [$ant->format('Y-m-d'), $ant->format('Y-m-d')];
            case 'semana':
                $inicio = (clone $hoy)->modify('monday last week');
                $fin = (clone $inicio)->modify('+6 days');
                return [$inicio->format('Y-m-d'), $fin->format('Y-m-d')];
            case 'anio':
                $anio = (int) $hoy->format('Y') - 1;
                return ["{$anio}-01-01", "{$anio}-12-31"];
            case 'mes':
            default:
                $inicio = (clone $hoy)->modify('first day of last month');
                $fin = (clone $hoy)->modify('last day of last month');
                return [$inicio->format('Y-m-d'), $fin->format('Y-m-d')];
        }
    }

    private function ventasResumen(string $desde, string $hasta): array
    {
        $stmt = $this->db->prepare(
            "SELECT COUNT(*) AS cantidad,
                    COALESCE(SUM(CASE WHEN estado = 'completada' THEN total ELSE 0 END), 0) AS monto
             FROM ventas
             WHERE DATE(created_at) BETWEEN :desde AND :hasta"
        );
        $stmt->execute(['desde' => $desde, 'hasta' => $hasta]);
        $row = $stmt->fetch() ?: ['cantidad' => 0, 'monto' => 0];

        return [
            'cantidad' => (int) $row['cantidad'],
            'monto' => number_format((float) $row['monto'], 2, '.', ''),
        ];
    }

    private function calcularCambio(float $actual, float $anterior): array
    {
        if ($anterior == 0.0) {
            return [
                'porcentaje' => $actual > 0 ? 100.0 : 0.0,
                'direccion' => $actual > 0 ? 'up' : 'flat',
                'absoluto' => number_format($actual, 2, '.', ''),
            ];
        }

        $cambio = (($actual - $anterior) / $anterior) * 100;

        return [
            'porcentaje' => round($cambio, 1),
            'direccion' => $cambio > 0 ? 'up' : ($cambio < 0 ? 'down' : 'flat'),
            'absoluto' => number_format($actual - $anterior, 2, '.', ''),
        ];
    }

    private function ticketPromedio(string $desde, string $hasta): array
    {
        $stmt = $this->db->prepare(
            "SELECT COALESCE(AVG(total), 0) AS promedio
             FROM ventas
             WHERE estado = 'completada'
               AND DATE(created_at) BETWEEN :desde AND :hasta"
        );
        $stmt->execute(['desde' => $desde, 'hasta' => $hasta]);
        $row = $stmt->fetch() ?: ['promedio' => 0];

        return [
            'valor' => number_format((float) $row['promedio'], 2, '.', ''),
        ];
    }

    private function contarProductosActivos(): int
    {
        return (int) $this->db
            ->query("SELECT COUNT(*) FROM productos WHERE activo = 1")
            ->fetchColumn();
    }

    private function contarAlertasStock(): int
    {
        return (int) $this->db
            ->query(
                "SELECT COUNT(*) FROM productos
                 WHERE activo = 1 AND stock <= stock_minimo"
            )
            ->fetchColumn();
    }

    private function calcularCartera(): array
    {
        $total = (float) $this->db
            ->query("SELECT COALESCE(SUM(saldo_deuda), 0) FROM clientes WHERE activo = 1")
            ->fetchColumn();

        $count = (int) $this->db
            ->query("SELECT COUNT(*) FROM clientes WHERE activo = 1 AND saldo_deuda > 0")
            ->fetchColumn();

        return [
            'total' => number_format($total, 2, '.', ''),
            'clientes' => $count,
        ];
    }

    private function contarClientesNuevos(string $desde, string $hasta): int
    {
        $stmt = $this->db->prepare(
            "SELECT COUNT(*) FROM clientes
             WHERE DATE(created_at) BETWEEN :desde AND :hasta"
        );
        $stmt->execute(['desde' => $desde, 'hasta' => $hasta]);
        return (int) $stmt->fetchColumn();
    }

    private function ventasPorDiaDetallado(string $desde, string $hasta): array
    {
        $stmt = $this->db->prepare(
            "SELECT DATE(created_at) AS dia,
                    COUNT(*) AS total_ventas,
                    COALESCE(SUM(CASE WHEN estado = 'completada' THEN total ELSE 0 END), 0) AS monto_total
             FROM ventas
             WHERE DATE(created_at) BETWEEN :desde AND :hasta
             GROUP BY DATE(created_at)
             ORDER BY dia ASC"
        );
        $stmt->execute(['desde' => $desde, 'hasta' => $hasta]);
        $rows = $stmt->fetchAll() ?: [];

        return array_map(fn($r) => [
            'dia' => $r['dia'],
            'total_ventas' => (int) $r['total_ventas'],
            'monto_total' => number_format((float) $r['monto_total'], 2, '.', ''),
        ], $rows);
    }

    private function ventasPorHora(string $desde, string $hasta): array
    {
        $stmt = $this->db->prepare(
            "SELECT HOUR(created_at) AS hora,
                    COUNT(*) AS total_ventas,
                    COALESCE(SUM(total), 0) AS monto
             FROM ventas
             WHERE estado = 'completada'
               AND DATE(created_at) BETWEEN :desde AND :hasta
             GROUP BY HOUR(created_at)
             ORDER BY hora ASC"
        );
        $stmt->execute(['desde' => $desde, 'hasta' => $hasta]);
        $rows = $stmt->fetchAll() ?: [];

        // Rellenar las 24 horas, incluso las que no tuvieron ventas
        $porHora = [];
        foreach ($rows as $r) {
            $porHora[(int) $r['hora']] = [
                'total_ventas' => (int) $r['total_ventas'],
                'monto' => number_format((float) $r['monto'], 2, '.', ''),
            ];
        }

        $resultado = [];
        for ($h = 0; $h < 24; $h++) {
            $resultado[] = [
                'hora' => $h,
                'label' => str_pad((string) $h, 2, '0', STR_PAD_LEFT) . ':00',
                'total_ventas' => $porHora[$h]['total_ventas'] ?? 0,
                'monto' => $porHora[$h]['monto'] ?? '0.00',
            ];
        }
        return $resultado;
    }

    private function metodosPagoDistribucion(string $desde, string $hasta): array
    {
        $stmt = $this->db->prepare(
            "SELECT tipo_pago,
                    COUNT(*) AS cantidad,
                    COALESCE(SUM(total), 0) AS monto
             FROM ventas
             WHERE estado = 'completada'
               AND DATE(created_at) BETWEEN :desde AND :hasta
             GROUP BY tipo_pago"
        );
        $stmt->execute(['desde' => $desde, 'hasta' => $hasta]);
        $rows = $stmt->fetchAll() ?: [];

        return array_map(fn($r) => [
            'tipo' => $r['tipo_pago'],
            'label' => $r['tipo_pago'] === 'credito' ? 'Crédito' : 'Contado',
            'cantidad' => (int) $r['cantidad'],
            'monto' => number_format((float) $r['monto'], 2, '.', ''),
        ], $rows);
    }

    private function cajaAbiertaActual(): ?array
    {
        $stmt = $this->db->query(
            "SELECT id, usuario_id, monto_apertura, abierta_at,
                    total_ventas_efectivo, total_ventas_tarjeta,
                    total_ventas_transferencia
             FROM caja_sesiones
             WHERE estado = 'abierta'
             ORDER BY id DESC
             LIMIT 1"
        );
        $row = $stmt->fetch();

        if ($row === false) {
            return null;
        }

        $totalTurno = (float) $row['total_ventas_efectivo']
                    + (float) $row['total_ventas_tarjeta']
                    + (float) $row['total_ventas_transferencia'];

        return [
            'id' => (int) $row['id'],
            'usuario_id' => (int) $row['usuario_id'],
            'monto_apertura' => number_format((float) $row['monto_apertura'], 2, '.', ''),
            'abierta_at' => $row['abierta_at'],
            'total_turno' => number_format($totalTurno, 2, '.', ''),
            'efectivo' => number_format((float) $row['total_ventas_efectivo'], 2, '.', ''),
            'tarjeta' => number_format((float) $row['total_ventas_tarjeta'], 2, '.', ''),
            'transferencia' => number_format((float) $row['total_ventas_transferencia'], 2, '.', ''),
        ];
    }

    private function ultimasVentas(int $limit): array
    {
        $stmt = $this->db->prepare(
            "SELECT v.id, v.numero, v.total, v.tipo_pago, v.estado, v.created_at,
                    u.nombre AS usuario_nombre,
                    c.nombre AS cliente_nombre
             FROM ventas v
             INNER JOIN usuarios u ON u.id = v.usuario_id
             LEFT JOIN clientes c ON c.id = v.cliente_id
             ORDER BY v.id DESC
             LIMIT :limit"
        );
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll() ?: [];
    }
    }
}