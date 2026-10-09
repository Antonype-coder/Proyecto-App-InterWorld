<?php
declare(strict_types=1);

require_once __DIR__ . '/BaseModel.php';

if (!class_exists('Configuracion')) {
    class Configuracion extends BaseModel
    {
        protected string $table = 'configuracion';
        protected string $primaryKey = 'id';
        protected array $fillable = ['negocio_id', 'clave', 'valor', 'tipo', 'grupo', 'descripcion'];
        protected bool $tenantScoped = true;

        /** Devuelve todas las claves agrupadas por grupo. */
        public function allByGroup(): array
        {
            $nid = $this->negocioId();
            if ($nid === null) return [];

            $rows = $this->raw(
                "SELECT clave, valor, tipo, grupo FROM {$this->table}
                 WHERE negocio_id = :nid",
                ['nid' => $nid]
            );

            $out = [];
            foreach ($rows as $r) {
                $grupo = $r['grupo'] ?: 'general';
                $out[$grupo] = $out[$grupo] ?? [];
                $out[$grupo][$r['clave']] = $this->cast($r['valor'], $r['tipo']);
            }
            return $out;
        }

        /** Alias de allByGroup(). */
        public function todas(): array
        {
            return $this->allByGroup();
        }

        /** Obtiene un valor puntual. */
        public function obtener(string $clave, mixed $default = null): mixed
        {
            $nid = $this->negocioId();
            if ($nid === null) return $default;

            $row = $this->rawFirst(
                "SELECT valor, tipo FROM {$this->table}
                 WHERE negocio_id = :nid AND clave = :c LIMIT 1",
                ['nid' => $nid, 'c' => $clave]
            );
            if ($row === null) return $default;

            return $this->cast($row['valor'], $row['tipo']);
        }

        /** Alias de obtener() para compatibilidad. */
        public function get(string $clave, mixed $default = null): mixed
        {
            return $this->obtener($clave, $default);
        }

        /** Guarda o actualiza una clave. */
        public function set(
            string $clave,
            mixed $valor,
            string $tipo = 'string',
            string $grupo = 'general'
        ): bool {
            $nid = $this->negocioId();
            if ($nid === null) return false;

            $stmt = $this->db->prepare(
                "INSERT INTO {$this->table} (negocio_id, clave, valor, tipo, grupo)
                 VALUES (:nid, :c, :v, :t, :g)
                 ON DUPLICATE KEY UPDATE
                    valor = VALUES(valor),
                    tipo  = VALUES(tipo),
                    grupo = VALUES(grupo)"
            );

            return $stmt->execute([
                'nid' => $nid,
                'c'   => $clave,
                'v'   => is_array($valor) ? json_encode($valor) : (string) $valor,
                't'   => $tipo,
                'g'   => $grupo,
            ]);
        }

        /** Guarda varios valores a la vez. */
        public function setMultiple(array $valores, string $grupo = 'general'): void
        {
            foreach ($valores as $clave => $valor) {
                $tipo = is_bool($valor) ? 'boolean'
                      : (is_int($valor) ? 'integer'
                      : (is_float($valor) ? 'decimal'
                      : (is_array($valor) ? 'json' : 'string')));
                $this->set($clave, $valor, $tipo, $grupo);
            }
        }

        private function cast(mixed $valor, string $tipo): mixed
        {
            return match ($tipo) {
                'integer' => (int) $valor,
                'decimal' => (float) $valor,
                'boolean' => in_array((string) $valor, ['1', 'true', 'yes'], true),
                'json'    => json_decode((string) $valor, true),
                default   => $valor,
            };
        }
    }
}