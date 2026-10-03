-- ============================================================
-- TiendaAdmin v2.0 — Base de datos completa
-- Ejecutar en phpMyAdmin (pestaña SQL) sin seleccionar DB
-- ============================================================

DROP DATABASE IF EXISTS tienda_db;
CREATE DATABASE tienda_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;
USE tienda_db;

SET FOREIGN_KEY_CHECKS = 0;
SET NAMES utf8mb4;

-- ============================================================
-- 1. NEGOCIOS (multi-tenant raíz)
-- ============================================================
CREATE TABLE negocios (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    nombre VARCHAR(150) NOT NULL,
    nit VARCHAR(30) NULL,
    telefono VARCHAR(30) NULL,
    email VARCHAR(150) NULL,
    direccion VARCHAR(255) NULL,
    plan ENUM('free','pro','enterprise') NOT NULL DEFAULT 'free',
    activo TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_negocios_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 2. USUARIOS
-- ============================================================
CREATE TABLE usuarios (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    negocio_id INT UNSIGNED NOT NULL DEFAULT 1,
    nombre VARCHAR(120) NOT NULL,
    email VARCHAR(150) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol ENUM('admin','vendedor') NOT NULL DEFAULT 'vendedor',
    activo TINYINT(1) NOT NULL DEFAULT 1,
    ultimo_login DATETIME NULL,
    intentos_fallidos INT UNSIGNED NOT NULL DEFAULT 0,
    bloqueado_hasta DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_usuarios_email (email),
    KEY idx_usuarios_negocio (negocio_id),
    KEY idx_usuarios_activo (activo),
    CONSTRAINT fk_usuarios_negocio FOREIGN KEY (negocio_id)
        REFERENCES negocios(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 3. CATEGORIAS
-- ============================================================
CREATE TABLE categorias (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    negocio_id INT UNSIGNED NOT NULL DEFAULT 1,
    nombre VARCHAR(100) NOT NULL,
    descripcion VARCHAR(255) NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_categorias_nombre_negocio (negocio_id, nombre),
    KEY idx_categorias_negocio (negocio_id),
    CONSTRAINT fk_categorias_negocio FOREIGN KEY (negocio_id)
        REFERENCES negocios(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 4. PROVEEDORES
-- ============================================================
CREATE TABLE proveedores (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    negocio_id INT UNSIGNED NOT NULL DEFAULT 1,
    nombre VARCHAR(150) NOT NULL,
    contacto VARCHAR(120) NULL,
    telefono VARCHAR(30) NULL,
    email VARCHAR(150) NULL,
    direccion VARCHAR(255) NULL,
    notas TEXT NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_proveedores_negocio (negocio_id),
    KEY idx_proveedores_nombre (nombre),
    CONSTRAINT fk_proveedores_negocio FOREIGN KEY (negocio_id)
        REFERENCES negocios(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 5. PRODUCTOS
-- ============================================================
CREATE TABLE productos (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    negocio_id INT UNSIGNED NOT NULL DEFAULT 1,
    codigo_barras VARCHAR(64) NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT NULL,
    categoria_id INT UNSIGNED NULL,
    proveedor_id INT UNSIGNED NULL,
    precio_compra DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    precio_venta DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    stock INT NOT NULL DEFAULT 0,
    stock_minimo INT NOT NULL DEFAULT 5,
    imagen VARCHAR(255) NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_productos_codigo_negocio (negocio_id, codigo_barras),
    KEY idx_productos_negocio (negocio_id),
    KEY idx_productos_nombre (nombre),
    KEY idx_productos_stock (stock),
    KEY idx_productos_categoria (categoria_id),
    KEY idx_productos_proveedor (proveedor_id),
    KEY idx_productos_activo (activo),
    CONSTRAINT fk_productos_negocio FOREIGN KEY (negocio_id)
        REFERENCES negocios(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_productos_categoria FOREIGN KEY (categoria_id)
        REFERENCES categorias(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_productos_proveedor FOREIGN KEY (proveedor_id)
        REFERENCES proveedores(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE producto_imagenes (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 6. CLIENTES
-- ============================================================
CREATE TABLE clientes (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    negocio_id INT UNSIGNED NOT NULL DEFAULT 1,
    nombre VARCHAR(150) NOT NULL,
    documento VARCHAR(30) NULL,
    telefono VARCHAR(30) NULL,
    email VARCHAR(150) NULL,
    direccion VARCHAR(255) NULL,
    cupo_credito DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    saldo_deuda DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    puntos_actuales INT NOT NULL DEFAULT 0,
    nivel_lealtad ENUM('bronze','silver','gold') NOT NULL DEFAULT 'bronze',
    total_compras DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    notas TEXT NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_clientes_doc_negocio (negocio_id, documento),
    KEY idx_clientes_negocio (negocio_id),
    KEY idx_clientes_nombre (nombre),
    KEY idx_clientes_activo (activo),
    CONSTRAINT fk_clientes_negocio FOREIGN KEY (negocio_id)
        REFERENCES negocios(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 7. CAJA_SESIONES
-- ============================================================
CREATE TABLE caja_sesiones (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    negocio_id INT UNSIGNED NOT NULL DEFAULT 1,
    usuario_id INT UNSIGNED NOT NULL,
    monto_apertura DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    monto_cierre_declarado DECIMAL(12,2) NULL,
    monto_cierre_sistema DECIMAL(12,2) NULL,
    diferencia DECIMAL(12,2) NULL,
    total_ventas_efectivo DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    total_ventas_tarjeta DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    total_ventas_transferencia DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    total_ingresos DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    total_egresos DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    estado ENUM('abierta','cerrada') NOT NULL DEFAULT 'abierta',
    notas_apertura VARCHAR(255) NULL,
    notas_cierre VARCHAR(255) NULL,
    abierta_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    cerrada_at DATETIME NULL,
    PRIMARY KEY (id),
    KEY idx_caja_negocio (negocio_id),
    KEY idx_caja_usuario (usuario_id),
    KEY idx_caja_estado (estado),
    KEY idx_caja_fecha (abierta_at),
    CONSTRAINT fk_caja_negocio FOREIGN KEY (negocio_id)
        REFERENCES negocios(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_caja_usuario FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 8. VENTAS
-- ============================================================
CREATE TABLE ventas (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    negocio_id INT UNSIGNED NOT NULL DEFAULT 1,
    numero VARCHAR(30) NOT NULL,
    idempotency_key VARCHAR(64) NULL,
    usuario_id INT UNSIGNED NOT NULL,
    cliente_id INT UNSIGNED NULL,
    caja_sesion_id INT UNSIGNED NULL,
    tipo_pago ENUM('contado','credito') NOT NULL DEFAULT 'contado',
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    descuento DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    impuesto DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    estado ENUM('completada','anulada') NOT NULL DEFAULT 'completada',
    anulada_at DATETIME NULL,
    anulada_por INT UNSIGNED NULL,
    motivo_anulacion VARCHAR(255) NULL,
    notas VARCHAR(255) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_ventas_numero (numero),
    UNIQUE KEY uq_ventas_idempotency_key (idempotency_key),
    KEY idx_ventas_negocio (negocio_id),
    KEY idx_ventas_fecha (created_at),
    KEY idx_ventas_estado (estado),
    KEY idx_ventas_cliente (cliente_id),
    KEY idx_ventas_usuario (usuario_id),
    CONSTRAINT fk_ventas_negocio FOREIGN KEY (negocio_id)
        REFERENCES negocios(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_ventas_usuario FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_ventas_cliente FOREIGN KEY (cliente_id)
        REFERENCES clientes(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_ventas_anulada_por FOREIGN KEY (anulada_por)
        REFERENCES usuarios(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_ventas_caja_sesion FOREIGN KEY (caja_sesion_id)
        REFERENCES caja_sesiones(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 9. VENTA_DETALLE
-- ============================================================
CREATE TABLE venta_detalle (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    venta_id INT UNSIGNED NOT NULL,
    producto_id INT UNSIGNED NOT NULL,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(12,2) NOT NULL,
    descuento DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    subtotal DECIMAL(12,2) NOT NULL,
    PRIMARY KEY (id),
    KEY idx_detalle_venta (venta_id),
    KEY idx_detalle_producto (producto_id),
    CONSTRAINT fk_detalle_venta FOREIGN KEY (venta_id)
        REFERENCES ventas(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_detalle_producto FOREIGN KEY (producto_id)
        REFERENCES productos(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 10. MOVIMIENTOS_INVENTARIO
-- ============================================================
CREATE TABLE movimientos_inventario (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    negocio_id INT UNSIGNED NOT NULL DEFAULT 1,
    producto_id INT UNSIGNED NOT NULL,
    usuario_id INT UNSIGNED NOT NULL,
    tipo ENUM('entrada','salida','ajuste') NOT NULL,
    cantidad INT NOT NULL,
    stock_anterior INT NOT NULL,
    stock_nuevo INT NOT NULL,
    referencia_tipo VARCHAR(30) NULL,
    referencia_id INT UNSIGNED NULL,
    motivo VARCHAR(255) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_mov_negocio (negocio_id),
    KEY idx_mov_fecha (created_at),
    KEY idx_mov_producto (producto_id),
    KEY idx_mov_usuario (usuario_id),
    KEY idx_mov_tipo (tipo),
    CONSTRAINT fk_mov_negocio FOREIGN KEY (negocio_id)
        REFERENCES negocios(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_mov_producto FOREIGN KEY (producto_id)
        REFERENCES productos(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_mov_usuario FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 11. PAGOS_CREDITO
-- ============================================================
CREATE TABLE pagos_credito (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    negocio_id INT UNSIGNED NOT NULL DEFAULT 1,
    cliente_id INT UNSIGNED NOT NULL,
    venta_id INT UNSIGNED NULL,
    usuario_id INT UNSIGNED NOT NULL,
    monto DECIMAL(12,2) NOT NULL,
    metodo_pago ENUM('efectivo','transferencia','tarjeta') NOT NULL DEFAULT 'efectivo',
    notas VARCHAR(255) NULL,
    anulado TINYINT(1) NOT NULL DEFAULT 0,
    anulado_at DATETIME NULL,
    anulado_por INT UNSIGNED NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_pago_negocio (negocio_id),
    KEY idx_pago_cliente (cliente_id),
    KEY idx_pago_venta (venta_id),
    KEY idx_pago_fecha (created_at),
    CONSTRAINT fk_pago_negocio FOREIGN KEY (negocio_id)
        REFERENCES negocios(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_pago_cliente FOREIGN KEY (cliente_id)
        REFERENCES clientes(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_pago_venta FOREIGN KEY (venta_id)
        REFERENCES ventas(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_pago_usuario FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 12. CAJA_MOVIMIENTOS
-- ============================================================
CREATE TABLE caja_movimientos (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    caja_sesion_id INT UNSIGNED NOT NULL,
    usuario_id INT UNSIGNED NOT NULL,
    tipo ENUM('ingreso','egreso','venta','devolucion','ajuste') NOT NULL,
    monto DECIMAL(12,2) NOT NULL,
    metodo_pago ENUM('efectivo','transferencia','tarjeta','otro') NOT NULL DEFAULT 'efectivo',
    referencia_tipo VARCHAR(30) NULL,
    referencia_id INT UNSIGNED NULL,
    descripcion VARCHAR(255) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_cajamov_sesion (caja_sesion_id),
    KEY idx_cajamov_tipo (tipo),
    KEY idx_cajamov_fecha (created_at),
    CONSTRAINT fk_cajamov_sesion FOREIGN KEY (caja_sesion_id)
        REFERENCES caja_sesiones(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_cajamov_usuario FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 13. NOTIFICACIONES
-- ============================================================
CREATE TABLE notificaciones (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    negocio_id INT UNSIGNED NOT NULL DEFAULT 1,
    usuario_id INT UNSIGNED NULL,
    tipo VARCHAR(50) NOT NULL,
    titulo VARCHAR(150) NOT NULL,
    mensaje TEXT NOT NULL,
    nivel ENUM('info','success','warning','danger') NOT NULL DEFAULT 'info',
    leida TINYINT(1) NOT NULL DEFAULT 0,
    leida_at DATETIME NULL,
    referencia_tipo VARCHAR(30) NULL,
    referencia_id INT UNSIGNED NULL,
    expira_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_notif_negocio (negocio_id),
    KEY idx_notif_usuario (usuario_id),
    KEY idx_notif_leida (leida),
    KEY idx_notif_fecha (created_at),
    CONSTRAINT fk_notif_negocio FOREIGN KEY (negocio_id)
        REFERENCES negocios(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_notif_usuario FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 14. AUDITORIA_LOGS
-- ============================================================
CREATE TABLE auditoria_logs (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    negocio_id INT UNSIGNED NOT NULL DEFAULT 1,
    usuario_id INT UNSIGNED NULL,
    accion VARCHAR(100) NOT NULL,
    entidad VARCHAR(50) NOT NULL,
    entidad_id INT UNSIGNED NULL,
    descripcion VARCHAR(500) NULL,
    datos_anteriores JSON NULL,
    datos_nuevos JSON NULL,
    ip VARCHAR(45) NULL,
    user_agent VARCHAR(255) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_audit_negocio (negocio_id),
    KEY idx_audit_usuario (usuario_id),
    KEY idx_audit_entidad (entidad, entidad_id),
    KEY idx_audit_fecha (created_at),
    KEY idx_audit_accion (accion),
    CONSTRAINT fk_audit_negocio FOREIGN KEY (negocio_id)
        REFERENCES negocios(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_audit_usuario FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 15. CONFIGURACION
-- ============================================================
CREATE TABLE configuracion (
    clave VARCHAR(80) NOT NULL,
    valor TEXT NULL,
    tipo ENUM('string','integer','decimal','boolean','json') NOT NULL DEFAULT 'string',
    grupo VARCHAR(50) NOT NULL DEFAULT 'general',
    descripcion VARCHAR(255) NULL,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (clave),
    KEY idx_config_grupo (grupo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 16. DEVOLUCIONES
-- ============================================================
CREATE TABLE devoluciones (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    negocio_id INT UNSIGNED NOT NULL DEFAULT 1,
    numero VARCHAR(30) NOT NULL,
    venta_id INT UNSIGNED NOT NULL,
    usuario_id INT UNSIGNED NOT NULL,
    cliente_id INT UNSIGNED NULL,
    tipo ENUM('total','parcial') NOT NULL DEFAULT 'parcial',
    motivo VARCHAR(255) NOT NULL,
    monto_devuelto DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    metodo_devolucion ENUM('efectivo','transferencia','nota_credito','reposicion') NOT NULL DEFAULT 'efectivo',
    estado ENUM('completada','anulada') NOT NULL DEFAULT 'completada',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_devoluciones_numero (numero),
    KEY idx_dev_negocio (negocio_id),
    KEY idx_dev_venta (venta_id),
    KEY idx_dev_cliente (cliente_id),
    KEY idx_dev_fecha (created_at),
    CONSTRAINT fk_dev_negocio FOREIGN KEY (negocio_id)
        REFERENCES negocios(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_dev_venta FOREIGN KEY (venta_id)
        REFERENCES ventas(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_dev_cliente FOREIGN KEY (cliente_id)
        REFERENCES clientes(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_dev_usuario FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 17. DEVOLUCION_DETALLE
-- ============================================================
CREATE TABLE devolucion_detalle (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    devolucion_id INT UNSIGNED NOT NULL,
    producto_id INT UNSIGNED NOT NULL,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(12,2) NOT NULL,
    subtotal DECIMAL(12,2) NOT NULL,
    PRIMARY KEY (id),
    KEY idx_devdet_dev (devolucion_id),
    KEY idx_devdet_prod (producto_id),
    CONSTRAINT fk_devdet_dev FOREIGN KEY (devolucion_id)
        REFERENCES devoluciones(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_devdet_prod FOREIGN KEY (producto_id)
        REFERENCES productos(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 18. PROMOCIONES
-- ============================================================
CREATE TABLE promociones (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    negocio_id INT UNSIGNED NOT NULL DEFAULT 1,
    nombre VARCHAR(150) NOT NULL,
    descripcion VARCHAR(255) NULL,
    tipo ENUM('porcentaje','monto_fijo','precio_especial','2x1','3x2') NOT NULL,
    valor DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    aplica_a ENUM('producto','categoria','global') NOT NULL DEFAULT 'producto',
    producto_id INT UNSIGNED NULL,
    categoria_id INT UNSIGNED NULL,
    cantidad_minima INT UNSIGNED NOT NULL DEFAULT 1,
    fecha_inicio DATETIME NOT NULL,
    fecha_fin DATETIME NOT NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_promo_negocio (negocio_id),
    KEY idx_promo_fechas (fecha_inicio, fecha_fin),
    KEY idx_promo_activo (activo),
    KEY idx_promo_producto (producto_id),
    KEY idx_promo_categoria (categoria_id),
    CONSTRAINT fk_promo_negocio FOREIGN KEY (negocio_id)
        REFERENCES negocios(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_promo_producto FOREIGN KEY (producto_id)
        REFERENCES productos(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_promo_categoria FOREIGN KEY (categoria_id)
        REFERENCES categorias(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 19. ORDENES_COMPRA
-- ============================================================
CREATE TABLE ordenes_compra (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    negocio_id INT UNSIGNED NOT NULL DEFAULT 1,
    numero VARCHAR(30) NOT NULL,
    proveedor_id INT UNSIGNED NOT NULL,
    usuario_id INT UNSIGNED NOT NULL,
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    impuesto DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    estado ENUM('borrador','enviada','recibida_parcial','recibida','cancelada') NOT NULL DEFAULT 'borrador',
    fecha_esperada DATE NULL,
    fecha_recepcion DATETIME NULL,
    notas TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_oc_numero (numero),
    KEY idx_oc_negocio (negocio_id),
    KEY idx_oc_proveedor (proveedor_id),
    KEY idx_oc_estado (estado),
    KEY idx_oc_fecha (created_at),
    CONSTRAINT fk_oc_negocio FOREIGN KEY (negocio_id)
        REFERENCES negocios(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_oc_proveedor FOREIGN KEY (proveedor_id)
        REFERENCES proveedores(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_oc_usuario FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 20. ORDEN_COMPRA_DETALLE
-- ============================================================
CREATE TABLE orden_compra_detalle (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    orden_compra_id INT UNSIGNED NOT NULL,
    producto_id INT UNSIGNED NOT NULL,
    cantidad INT NOT NULL,
    cantidad_recibida INT NOT NULL DEFAULT 0,
    precio_unitario DECIMAL(12,2) NOT NULL,
    subtotal DECIMAL(12,2) NOT NULL,
    PRIMARY KEY (id),
    KEY idx_ocdet_orden (orden_compra_id),
    KEY idx_ocdet_producto (producto_id),
    CONSTRAINT fk_ocdet_orden FOREIGN KEY (orden_compra_id)
        REFERENCES ordenes_compra(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_ocdet_producto FOREIGN KEY (producto_id)
        REFERENCES productos(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 21. PUNTOS_HISTORIAL (lealtad)
-- ============================================================
CREATE TABLE puntos_historial (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    cliente_id INT UNSIGNED NOT NULL,
    usuario_id INT UNSIGNED NULL,
    venta_id INT UNSIGNED NULL,
    tipo ENUM('ganado','canjeado','ajuste','expirado') NOT NULL,
    puntos INT NOT NULL,
    saldo_anterior INT NOT NULL DEFAULT 0,
    saldo_nuevo INT NOT NULL DEFAULT 0,
    motivo VARCHAR(255) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_ph_cliente (cliente_id),
    KEY idx_ph_fecha (created_at),
    CONSTRAINT fk_ph_cliente FOREIGN KEY (cliente_id)
        REFERENCES clientes(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_ph_usuario FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_ph_venta FOREIGN KEY (venta_id)
        REFERENCES ventas(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- DATOS SEMILLA
-- ============================================================

-- Negocio demo
INSERT INTO negocios (id, nombre, nit, telefono, email, direccion, plan, activo)
VALUES (1, 'Tienda Demo', 'DEMO-001', '3001234567', 'demo@tienda.com', 'Calle Demo #123', 'pro', 1);

-- Usuarios demo (hashes temporales, se regeneran con hash-passwords.php)
INSERT INTO usuarios (negocio_id, nombre, email, password_hash, rol, activo) VALUES
(1, 'Administrador', 'admin@tienda.com', '$2y$10$placeholder', 'admin', 1),
(1, 'Vendedor Demo', 'vendedor@tienda.com', '$2y$10$placeholder', 'vendedor', 1);

-- Categorías
INSERT INTO categorias (negocio_id, nombre, descripcion) VALUES
(1, 'Bebidas', 'Refrescos, jugos y aguas'),
(1, 'Abarrotes', 'Productos de despensa'),
(1, 'Limpieza', 'Productos de aseo y limpieza'),
(1, 'Snacks', 'Papas, galletas y dulces'),
(1, 'Lácteos', 'Leche, quesos y yogures');

-- Proveedores
INSERT INTO proveedores (negocio_id, nombre, contacto, telefono, email, direccion) VALUES
(1, 'Distribuidora El Sol', 'Carlos Pérez', '3001234567', 'contacto@elsol.com', 'Calle 10 #5-30'),
(1, 'Comercial Andina', 'María Gómez', '3109876543', 'ventas@andina.com', 'Carrera 7 #45-12'),
(1, 'Alimentos del Valle', 'Juan Rodríguez', '3205551234', 'info@delvalle.com', 'Av. Principal #100-20');

-- Productos
INSERT INTO productos (negocio_id, codigo_barras, nombre, descripcion, categoria_id, proveedor_id, precio_compra, precio_venta, stock, stock_minimo, activo) VALUES
(1, '7501234567890', 'Coca-Cola 400ml', 'Gaseosa personal', 1, 1, 1800.00, 3000.00, 50, 10, 1),
(1, '7509876543210', 'Agua Cristal 600ml', 'Agua embotellada', 1, 1, 800.00, 1500.00, 80, 15, 1),
(1, '7701234567890', 'Arroz Diana 500g', 'Arroz blanco', 2, 2, 1500.00, 2500.00, 40, 8, 1),
(1, '7702345678901', 'Aceite Girasol 1L', 'Aceite vegetal', 2, 2, 5000.00, 7500.00, 25, 5, 1),
(1, '7801234567890', 'Jabón Rey x3', 'Jabón en barra', 3, 1, 2000.00, 3500.00, 60, 10, 1),
(1, '7809876543210', 'Detergente Fab 1kg', 'Detergente en polvo', 3, 3, 6000.00, 9000.00, 30, 6, 1),
(1, '7901234567890', 'Papas Margarita', 'Snack de papa', 4, 3, 1200.00, 2000.00, 70, 15, 1),
(1, '7909876543210', 'Leche Alqueria 1L', 'Leche entera', 5, 1, 2800.00, 4200.00, 45, 10, 1);

-- Configuración
INSERT INTO configuracion (clave, valor, tipo, grupo, descripcion) VALUES
('negocio_nombre', 'Mi Tienda', 'string', 'negocio', 'Nombre del negocio'),
('negocio_nit', '', 'string', 'negocio', 'NIT o identificación fiscal'),
('negocio_direccion', '', 'string', 'negocio', 'Dirección del negocio'),
('negocio_telefono', '', 'string', 'negocio', 'Teléfono del negocio'),
('negocio_email', '', 'string', 'negocio', 'Correo del negocio'),
('moneda_simbolo', '$', 'string', 'moneda', 'Símbolo de la moneda'),
('moneda_codigo', 'COP', 'string', 'moneda', 'Código ISO de la moneda'),
('impuesto_porcentaje', '0', 'decimal', 'impuestos', 'Porcentaje de impuesto general'),
('impuesto_incluido', '1', 'boolean', 'impuestos', 'El precio ya incluye impuesto'),
('folio_prefijo_venta', 'V', 'string', 'folios', 'Prefijo del folio de ventas'),
('folio_prefijo_devolucion', 'D', 'string', 'folios', 'Prefijo del folio de devoluciones'),
('folio_prefijo_orden_compra', 'OC', 'string', 'folios', 'Prefijo de órdenes de compra'),
('stock_alerta_habilitada', '1', 'boolean', 'notificaciones', 'Enviar alertas de stock bajo'),
('notif_stock_bajo', '1', 'boolean', 'notificaciones', 'Alertas de stock bajo'),
('notif_ventas_dia', '1', 'boolean', 'notificaciones', 'Resumen de ventas del día'),
('notif_deudas_vencidas', '1', 'boolean', 'notificaciones', 'Alertas de deudas vencidas'),
('tema_modo', 'light', 'string', 'apariencia', 'Modo de tema'),
('tema_color_primario', '#111827', 'string', 'apariencia', 'Color primario'),
('caja_monto_apertura_defecto', '0', 'decimal', 'caja', 'Monto de apertura por defecto');