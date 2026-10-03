<?php
declare(strict_types=1);

require_once __DIR__ . '/BaseModel.php';

if (!class_exists('Configuracion')) {
    class Configuracion extends BaseModel
    {
        protected string $table = 'configuracion';
        protected string $primaryKey = 'clave';
        protected array $fillable = ['clave', 'valor', 'tipo', 'grupo', 'descripcion'];

        public function get(string $clave, mixed $default = null): mixed
        {
            $row = $this->rawFirst("SELECT valor, tipo FROM {$this->table} WHERE clave = :c", ['c' => $clave]);
            if ($row === null) return $default;

            return $this->cast($row['valor'], $row['tipo']);
        }

        public function set(string $clave, mixed $valor, string $grupo = 'general'): bool
        {
            $stmt = $this->db->prepare(
                "INSERT INTO {$this->table} (clave, valor, grupo) VALUES (:c, :v_insert, :grupo)
                 ON DUPLICATE KEY UPDATE valor = :v_update"
            );
            $stringValue = (string) $valor;
            return $stmt->execute([
                'c' => $clave,
                'v_insert' => $stringValue,
                'grupo' => $grupo,
                'v_update' => $stringValue,
            ]);
        }

        public function allByGroup(): array
        {
            $rows = $this->raw("SELECT * FROM {$this->table} ORDER BY grupo ASC, clave ASC");
            $out = [];
            foreach ($rows as $r) {
                $out[$r['grupo']][$r['clave']] = $this->cast($r['valor'], $r['tipo']);
            }
            return $out;
        }

        private function cast(mixed $valor, string $tipo): mixed
        {
            return match ($tipo) {
                'integer' => (int) $valor,
                'decimal' => (float) $valor,
                'boolean' => in_array(strtolower((string) $valor), ['1', 'true', 'yes', 'on'], true),
                'json'    => json_decode((string) $valor, true),
                default   => $valor,
            };
        }
    }
}