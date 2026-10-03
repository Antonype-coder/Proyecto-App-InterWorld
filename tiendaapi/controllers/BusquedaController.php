<?php
declare(strict_types=1);

require_once __DIR__ . '/../core/Request.php';
require_once __DIR__ . '/../core/Response.php';
require_once __DIR__ . '/../config/database.php';

if (!class_exists('BusquedaController')) {
    class BusquedaController
    {
        private PDO $db;

        public function __construct()
        {
            $this->db = Database::getConnection();
        }

        public function buscar(Request $request): void
        {
            $q = trim((string)$request->getQuery('q', ''));

            if (mb_strlen($q) < 2) {
                Response::success([
                    'productos' => [],
                    'clientes' => [],
                    'ventas' => [],
                    'proveedores' => [],
                ], 'Búsqueda vacía.');
            }

            $termino = '%' . $q . '%';

            // PRODUCTOS
            $productos = $this->db->prepare(
                "SELECT id, codigo_barras, nombre, precio_venta, stock, imagen
                 FROM productos
                 WHERE activo = 1 AND (nombre LIKE :q1 OR codigo_barras LIKE :q2)
                 ORDER BY nombre ASC LIMIT 8"
            );
            $productos->execute(['q1' => $termino, 'q2' => $termino]);

            // CLIENTES
            $clientes = $this->db->prepare(
                "SELECT id, nombre, documento, telefono, saldo_deuda, cupo_credito
                 FROM clientes
                 WHERE activo = 1 AND (nombre LIKE :q1 OR documento LIKE :q2 OR telefono LIKE :q3)
                 ORDER BY nombre ASC LIMIT 8"
            );
            $clientes->execute(['q1' => $termino, 'q2' => $termino, 'q3' => $termino]);

            // VENTAS
            $ventas = $this->db->prepare(
                "SELECT v.id, v.numero, v.total, v.estado, v.tipo_pago, v.created_at,
                        c.nombre AS cliente_nombre
                 FROM ventas v
                 LEFT JOIN clientes c ON c.id = v.cliente_id
                 WHERE v.numero LIKE :q1 OR c.nombre LIKE :q2
                 ORDER BY v.id DESC LIMIT 8"
            );
            $ventas->execute(['q1' => $termino, 'q2' => $termino]);

            // PROVEEDORES
            $proveedores = $this->db->prepare(
                "SELECT id, nombre, contacto, telefono
                 FROM proveedores
                 WHERE activo = 1 AND (nombre LIKE :q1 OR contacto LIKE :q2 OR telefono LIKE :q3)
                 ORDER BY nombre ASC LIMIT 8"
            );
            $proveedores->execute(['q1' => $termino, 'q2' => $termino, 'q3' => $termino]);

            Response::success([
                'productos' => $productos->fetchAll() ?: [],
                'clientes' => $clientes->fetchAll() ?: [],
                'ventas' => $ventas->fetchAll() ?: [],
                'proveedores' => $proveedores->fetchAll() ?: [],
            ], 'Resultados de búsqueda.');
        }
    }
}