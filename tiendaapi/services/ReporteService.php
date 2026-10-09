<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/env.php';
require_once __DIR__ . '/../core/Auth.php';

if (!class_exists('ReporteService')) {
    class ReporteService
    {
        private PDO $db;

        public function __construct()
        {
            $this->db = Database::getConnection();
        }

        private function nid(): ?int
        {
            return class_exists('Auth') ? Auth::negocioId() : null;
        }

        public function resumen(): array
        {
            $nid = $this->nid();

            $sqlHoy = "SELECT COUNT(*) AS cantidad,
                              COALESCE(SUM(CASE WHEN estado = 'completada' THEN total ELSE 0 END), 0) AS monto
                       FROM ventas WHERE DATE(created_at) = CURDATE()";
            $paramsHoy = [];
            if ($nid !== null) {
                $sqlHoy .= " AND negocio_id = :nid";
                $paramsHoy['nid'] = $nid;
            }
            $stmt = $this->db->prepare($sqlHoy);
            $stmt->execute($paramsHoy);
            $ventasHoy = $stmt->fetch() ?: ['cantidad' => 0, 'monto' => 0];

            $sqlProd = "SELECT COUNT(*) AS total FROM productos WHERE activo = 1";
            $paramsProd = [];
            if ($nid !== null) {
                $sqlProd .= " AND negocio_id = :nid";
                $paramsProd['nid'] = $nid;
            }
            $stmt = $this->db->prepare($sqlProd);
            $stmt->execute($paramsProd);
            $productos = $stmt->fetch() ?: ['total' => 0];

            $sqlAlertas = "SELECT COUNT(*) AS total FROM productos WHERE activo = 1 AND stock <= stock_minimo";
            $paramsAlertas = [];
            if ($nid !== null) {
                $sqlAlertas .= " AND negocio_id = :nid";
                $paramsAlertas['nid'] = $nid;
            }
            $stmt = $this->db->prepare($sqlAlertas);
            $stmt->execute($paramsAlertas);
            $alertas = $stmt->fetch() ?: ['total' => 0];

            $sqlCartera = "SELECT COALESCE(SUM(saldo_deuda), 0) AS total FROM clientes WHERE activo = 1";
            $paramsCartera = [];
            if ($nid !== null) {
                $sqlCartera .= " AND negocio_id = :nid";
                $paramsCartera['nid'] = $nid;
            }
            $stmt = $this->db->prepare($sqlCartera);
            $stmt->execute($paramsCartera);
            $cartera = $stmt->fetch() ?: ['total' => 0];

            $sqlUltimas = "SELECT v.id, v.numero, v.total, v.tipo_pago, v.estado, v.created_at,
                                  u.nombre AS usuario_nombre,
                                  c.nombre AS cliente_nombre
                           FROM ventas v
                           INNER JOIN usuarios u ON u.id = v.usuario_id
                           LEFT JOIN clientes c ON c.id = v.cliente_id
                           WHERE 1=1";
            $paramsUltimas = [];
            if ($nid !== null) {
                $sqlUltimas .= " AND v.negocio_id = :nid";
                $paramsUltimas['nid'] = $nid;
            }
            $sqlUltimas .= " ORDER BY v.id DESC LIMIT 5";

            $stmt = $this->db->prepare($sqlUltimas);
            $stmt->execute($paramsUltimas);
            $ultimas = $stmt->fetchAll() ?: [];

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
            $nid = $this->nid();

            $sql = "SELECT DATE(created_at) AS dia,
                           COUNT(*) AS total_ventas,
                           SUM(CASE WHEN estado = 'completada' THEN total ELSE 0 END) AS monto_total
                    FROM ventas
                    WHERE created_at >= :desde AND created_at <= :hasta";
            $params = [
                'desde' => $desde . ' 00:00:00',
                'hasta' => $hasta . ' 23:59:59',
            ];

            if ($nid !== null) {
                $sql .= " AND negocio_id = :nid";
                $params['nid'] = $nid;
            }

            $sql .= " GROUP BY DATE(created_at) ORDER BY dia ASC";

            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);
            return $stmt->fetchAll() ?: [];
        }

        public function productosMasVendidos(int $limit = 10, ?string $desde = null, ?string $hasta = null): array
        {
            $nid = $this->nid();

            $sql = "SELECT p.id, p.nombre, p.codigo_barras,
                           SUM(d.cantidad) AS unidades_vendidas,
                           SUM(d.subtotal - d.descuento) AS monto_total
                    FROM venta_detalle d
                    INNER JOIN ventas v ON v.id = d.venta_id
                    INNER JOIN productos p ON p.id = d.producto_id
                    WHERE v.estado = 'completada'";
            $params = [];

            if ($nid !== null) {
                $sql .= " AND v.negocio_id = :nid";
                $params['nid'] = $nid;
            }
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
            $nid = $this->nid();

            $sql = "SELECT p.id, p.codigo_barras, p.nombre, p.stock, p.stock_minimo,
                           c.nombre AS categoria_nombre
                    FROM productos p
                    LEFT JOIN categorias c ON c.id = p.categoria_id
                    WHERE p.activo = 1 AND p.stock <= p.stock_minimo";
            $params = [];

            if ($nid !== null) {
                $sql .= " AND p.negocio_id = :nid";
                $params['nid'] = $nid;
            }

            $sql .= " ORDER BY (p.stock - p.stock_minimo) ASC, p.nombre ASC";

            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);
            return $stmt->fetchAll() ?: [];
        }

        public function cartera(): array
        {
            $nid = $this->nid();

            $sqlTotal = "SELECT COALESCE(SUM(saldo_deuda), 0) AS total FROM clientes WHERE activo = 1";
            $paramsTotal = [];
            if ($nid !== null) {
                $sqlTotal .= " AND negocio_id = :nid";
                $paramsTotal['nid'] = $nid;
            }
            $stmt = $this->db->prepare($sqlTotal);
            $stmt->execute($paramsTotal);
            $total = $stmt->fetch() ?: ['total' => 0];

            $sqlClientes = "SELECT id, nombre, documento, telefono, cupo_credito, saldo_deuda,
                                   (cupo_credito - saldo_deuda) AS cupo_disponible
                            FROM clientes
                            WHERE activo = 1 AND saldo_deuda > 0";
            $paramsClientes = [];
            if ($nid !== null) {
                $sqlClientes .= " AND negocio_id = :nid";
                $paramsClientes['nid'] = $nid;
            }
            $sqlClientes .= " ORDER BY saldo_deuda DESC";

            $stmt = $this->db->prepare($sqlClientes);
            $stmt->execute($paramsClientes);
            $clientes = $stmt->fetchAll() ?: [];

            return [
                'total_cartera' => number_format((float) $total['total'], 2, '.', ''),
                'clientes'      => $clientes,
            ];
        }

        public function dashboardAvanzado(string $periodo = 'mes'): array
        {
            [$desde, $hasta] = $this->rangoPorPeriodo($periodo);
            [$desdeAnt, $hastaAnt] = $this->rangoAnterior($periodo);

            $ventasHoy = $this->ventasResumen(date('Y-m-d'), date('Y-m-d'));
            $ventasActual = $this->ventasResumen($desde, $hasta);
            $ventasAnterior = $this->ventasResumen($desdeAnt, $hastaAnt);
            $gananciasPeriodo = $this->gananciasPeriodo($desde, $hasta);

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
                    'ganancias_periodo' => $gananciasPeriodo,
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

        private function gananciasPeriodo(string $desde, string $hasta): array
        {
            $nid = $this->nid();

            $sqlVentas = "SELECT COALESCE(SUM(v.total), 0)
                          FROM ventas v
                          WHERE v.estado = 'completada'
                            AND DATE(v.created_at) BETWEEN :desde AND :hasta";
            $paramsVentas = ['desde' => $desde, 'hasta' => $hasta];
            if ($nid !== null) {
                $sqlVentas .= " AND v.negocio_id = :nid";
                $paramsVentas['nid'] = $nid;
            }
            $stmt = $this->db->prepare($sqlVentas);
            $stmt->execute($paramsVentas);
            $ventas = (float) $stmt->fetchColumn();

            $sqlCosto = "SELECT COALESCE(SUM(vd.cantidad * p.precio_compra), 0)
                         FROM venta_detalle vd
                         INNER JOIN ventas v ON v.id = vd.venta_id
                         INNER JOIN productos p ON p.id = vd.producto_id
                         WHERE v.estado = 'completada'
                           AND DATE(v.created_at) BETWEEN :desde AND :hasta";
            $paramsCosto = ['desde' => $desde, 'hasta' => $hasta];
            if ($nid !== null) {
                $sqlCosto .= " AND v.negocio_id = :nid";
                $paramsCosto['nid'] = $nid;
            }
            $stmt = $this->db->prepare($sqlCosto);
            $stmt->execute($paramsCosto);
            $costo = (float) $stmt->fetchColumn();

            $ganancia = $ventas - $costo;

            return [
                'monto' => number_format($ganancia, 2, '.', ''),
                'margen_porcentaje' => $ventas > 0
                    ? round(($ganancia / $ventas) * 100, 2)
                    : 0,
            ];
        }

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
            $nid = $this->nid();

            $sql = "SELECT COUNT(*) AS cantidad,
                           COALESCE(SUM(CASE WHEN estado = 'completada' THEN total ELSE 0 END), 0) AS monto
                    FROM ventas
                    WHERE DATE(created_at) BETWEEN :desde AND :hasta";
            $params = ['desde' => $desde, 'hasta' => $hasta];

            if ($nid !== null) {
                $sql .= " AND negocio_id = :nid";
                $params['nid'] = $nid;
            }

            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);
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
            $nid = $this->nid();

            $sql = "SELECT COALESCE(AVG(total), 0) AS promedio
                    FROM ventas
                    WHERE estado = 'completada'
                      AND DATE(created_at) BETWEEN :desde AND :hasta";
            $params = ['desde' => $desde, 'hasta' => $hasta];

            if ($nid !== null) {
                $sql .= " AND negocio_id = :nid";
                $params['nid'] = $nid;
            }

            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);
            $row = $stmt->fetch() ?: ['promedio' => 0];

            return [
                'valor' => number_format((float) $row['promedio'], 2, '.', ''),
            ];
        }

        private function contarProductosActivos(): int
        {
            $nid = $this->nid();

            $sql = "SELECT COUNT(*) FROM productos WHERE activo = 1";
            $params = [];
            if ($nid !== null) {
                $sql .= " AND negocio_id = :nid";
                $params['nid'] = $nid;
            }
            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);
            return (int) $stmt->fetchColumn();
        }

        private function contarAlertasStock(): int
        {
            $nid = $this->nid();

            $sql = "SELECT COUNT(*) FROM productos
                    WHERE activo = 1 AND stock <= stock_minimo";
            $params = [];
            if ($nid !== null) {
                $sql .= " AND negocio_id = :nid";
                $params['nid'] = $nid;
            }
            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);
            return (int) $stmt->fetchColumn();
        }

        private function calcularCartera(): array
        {
            $nid = $this->nid();

            $sqlTotal = "SELECT COALESCE(SUM(saldo_deuda), 0) FROM clientes WHERE activo = 1";
            $paramsTotal = [];
            if ($nid !== null) {
                $sqlTotal .= " AND negocio_id = :nid";
                $paramsTotal['nid'] = $nid;
            }
            $stmt = $this->db->prepare($sqlTotal);
            $stmt->execute($paramsTotal);
            $total = (float) $stmt->fetchColumn();

            $sqlCount = "SELECT COUNT(*) FROM clientes WHERE activo = 1 AND saldo_deuda > 0";
            $paramsCount = [];
            if ($nid !== null) {
                $sqlCount .= " AND negocio_id = :nid";
                $paramsCount['nid'] = $nid;
            }
            $stmt = $this->db->prepare($sqlCount);
            $stmt->execute($paramsCount);
            $count = (int) $stmt->fetchColumn();

            return [
                'total' => number_format($total, 2, '.', ''),
                'clientes' => $count,
            ];
        }

        private function contarClientesNuevos(string $desde, string $hasta): int
        {
            $nid = $this->nid();

            $sql = "SELECT COUNT(*) FROM clientes
                    WHERE DATE(created_at) BETWEEN :desde AND :hasta";
            $params = ['desde' => $desde, 'hasta' => $hasta];

            if ($nid !== null) {
                $sql .= " AND negocio_id = :nid";
                $params['nid'] = $nid;
            }

            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);
            return (int) $stmt->fetchColumn();
        }

        private function ventasPorDiaDetallado(string $desde, string $hasta): array
        {
            $nid = $this->nid();

            $sql = "SELECT DATE(created_at) AS dia,
                           COUNT(*) AS total_ventas,
                           COALESCE(SUM(CASE WHEN estado = 'completada' THEN total ELSE 0 END), 0) AS monto_total
                    FROM ventas
                    WHERE DATE(created_at) BETWEEN :desde AND :hasta";
            $params = ['desde' => $desde, 'hasta' => $hasta];

            if ($nid !== null) {
                $sql .= " AND negocio_id = :nid";
                $params['nid'] = $nid;
            }

            $sql .= " GROUP BY DATE(created_at) ORDER BY dia ASC";

            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);
            $rows = $stmt->fetchAll() ?: [];

            return array_map(fn($r) => [
                'dia' => $r['dia'],
                'total_ventas' => (int) $r['total_ventas'],
                'monto_total' => number_format((float) $r['monto_total'], 2, '.', ''),
            ], $rows);
        }

        private function ventasPorHora(string $desde, string $hasta): array
        {
            $nid = $this->nid();

            $sql = "SELECT HOUR(created_at) AS hora,
                           COUNT(*) AS total_ventas,
                           COALESCE(SUM(total), 0) AS monto
                    FROM ventas
                    WHERE estado = 'completada'
                      AND DATE(created_at) BETWEEN :desde AND :hasta";
            $params = ['desde' => $desde, 'hasta' => $hasta];

            if ($nid !== null) {
                $sql .= " AND negocio_id = :nid";
                $params['nid'] = $nid;
            }

            $sql .= " GROUP BY HOUR(created_at) ORDER BY hora ASC";

            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);
            $rows = $stmt->fetchAll() ?: [];

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
            $nid = $this->nid();

            $sql = "SELECT tipo_pago,
                           COUNT(*) AS cantidad,
                           COALESCE(SUM(total), 0) AS monto
                    FROM ventas
                    WHERE estado = 'completada'
                      AND DATE(created_at) BETWEEN :desde AND :hasta";
            $params = ['desde' => $desde, 'hasta' => $hasta];

            if ($nid !== null) {
                $sql .= " AND negocio_id = :nid";
                $params['nid'] = $nid;
            }

            $sql .= " GROUP BY tipo_pago";

            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);
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
            $nid = $this->nid();

            $sql = "SELECT id, usuario_id, monto_apertura, abierta_at,
                           total_ventas_efectivo, total_ventas_tarjeta,
                           total_ventas_transferencia
                    FROM caja_sesiones
                    WHERE estado = 'abierta'";
            $params = [];

            if ($nid !== null) {
                $sql .= " AND negocio_id = :nid";
                $params['nid'] = $nid;
            }

            $sql .= " ORDER BY id DESC LIMIT 1";

            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);
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
            $nid = $this->nid();

            $sql = "SELECT v.id, v.numero, v.total, v.tipo_pago, v.estado, v.created_at,
                           u.nombre AS usuario_nombre,
                           c.nombre AS cliente_nombre
                    FROM ventas v
                    INNER JOIN usuarios u ON u.id = v.usuario_id
                    LEFT JOIN clientes c ON c.id = v.cliente_id
                    WHERE 1=1";
            $params = [];

            if ($nid !== null) {
                $sql .= " AND v.negocio_id = :nid";
                $params['nid'] = $nid;
            }

            $sql .= " ORDER BY v.id DESC LIMIT :limit";

            $stmt = $this->db->prepare($sql);
            foreach ($params as $k => $v) {
                $stmt->bindValue(':' . $k, $v);
            }
            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmt->execute();
            return $stmt->fetchAll() ?: [];
        }
    }
}