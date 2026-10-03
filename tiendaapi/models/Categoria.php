<?php
declare(strict_types=1);

require_once __DIR__ . '/BaseModel.php';

if (!class_exists('Categoria')) {
    class Categoria extends BaseModel
    {
        protected string $table = 'categorias';
        protected string $primaryKey = 'id';
        protected array $fillable = ['nombre', 'descripcion', 'activo'];
    }
}