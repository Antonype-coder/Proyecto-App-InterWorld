<?php
declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

require_once __DIR__ . '/../config/database.php';

$db = Database::getConnection();

$column = $db->query("SHOW COLUMNS FROM ventas LIKE 'idempotency_key'")->fetch();
if ($column === false) {
    $db->exec('ALTER TABLE ventas ADD COLUMN idempotency_key VARCHAR(64) NULL');
}

$index = $db->query("SHOW INDEX FROM ventas WHERE Key_name = 'uq_ventas_idempotency_key'")->fetch();
if ($index === false) {
    $db->exec('CREATE UNIQUE INDEX uq_ventas_idempotency_key ON ventas (idempotency_key)');
}

$db->exec(
    "CREATE TABLE IF NOT EXISTS producto_imagenes (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        producto_id INT UNSIGNED NOT NULL,
        ruta VARCHAR(255) NOT NULL,
        orden INT UNSIGNED NOT NULL DEFAULT 0,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_producto_imagen_ruta (producto_id, ruta),
        KEY idx_producto_imagenes_orden (producto_id, orden, id),
        CONSTRAINT fk_producto_imagenes_producto FOREIGN KEY (producto_id)
            REFERENCES productos(id) ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
);

fwrite(STDOUT, "Migración aplicada; no se modificaron ni eliminaron ventas o productos existentes.\n");