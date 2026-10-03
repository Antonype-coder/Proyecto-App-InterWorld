<?php
declare(strict_types=1);

require_once __DIR__ . '/BaseModel.php';

if (!class_exists('Proveedor')) {
    class Proveedor extends BaseModel
    {
        protected string $table = 'proveedores';
        protected string $primaryKey = 'id';
        protected array $fillable = ['nombre', 'contacto', 'telefono', 'email', 'direccion', 'notas', 'activo'];
    }
}