<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../core/Auth.php';

if (!class_exists('BaseModel')) {
    class BaseModel
    {
        protected string $table = '';
        protected string $primaryKey = 'id';
        protected array $fillable = [];
        protected array $hidden = [];
        protected bool $tenantScoped = true;

        protected PDO $db;

        public function __construct()
        {
            $this->db = Database::getConnection();
        }

        protected function negocioId(): ?int
        {
            if (!$this->tenantScoped) return null;
            if (!class_exists('Auth')) return null;
            return Auth::negocioId();
        }

        protected function applyTenant(string &$sql, array &$params, string $alias = ''): void
        {
            $nid = $this->negocioId();
            if ($nid === null) return;

            $prefix = $alias !== '' ? $alias . '.' : '';
            $sql .= " AND {$prefix}negocio_id = :__nid";
            $params['__nid'] = $nid;
        }

        // ====================================================================
        // CRUD básico
        // ====================================================================

        public function find(int $id): ?array
        {
            $sql    = "SELECT * FROM {$this->table} WHERE {$this->primaryKey} = :id";
            $params = ['id' => $id];

            $this->applyTenant($sql, $params);
            $sql .= ' LIMIT 1';

            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);
            $row = $stmt->fetch(PDO::FETCH_ASSOC) ?: null;

            return $row ? $this->hideFields($row) : null;
        }

        public function findBy(array $conditions, string $orderBy = 'id ASC'): ?array
        {
            $sql    = "SELECT * FROM {$this->table} WHERE 1=1";
            $params = [];

            foreach ($conditions as $col => $val) {
                $sql .= " AND {$col} = :{$col}";
                $params[$col] = $val;
            }

            $this->applyTenant($sql, $params);
            $sql .= " ORDER BY {$orderBy} LIMIT 1";

            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);
            $row = $stmt->fetch(PDO::FETCH_ASSOC) ?: null;

            return $row ? $this->hideFields($row) : null;
        }

        public function all(array $conditions = [], string $orderBy = 'id ASC'): array
        {
            $sql    = "SELECT * FROM {$this->table} WHERE 1=1";
            $params = [];

            foreach ($conditions as $col => $val) {
                $sql .= " AND {$col} = :{$col}";
                $params[$col] = $val;
            }

            $this->applyTenant($sql, $params);

            if ($orderBy !== '') {
                $sql .= " ORDER BY {$orderBy}";
            }

            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);

            return array_map(
                fn($r) => $this->hideFields($r),
                $stmt->fetchAll(PDO::FETCH_ASSOC) ?: []
            );
        }

        public function create(array $data): int
        {
            $nid = $this->negocioId();
            if ($nid !== null && !isset($data['negocio_id'])) {
                $data['negocio_id'] = $nid;
            }

            $cols   = [];
            $phs    = [];
            $params = [];

            foreach ($data as $col => $val) {
                if (!in_array($col, $this->fillable, true) && $col !== 'negocio_id') {
                    continue;
                }
                $cols[] = $col;
                $phs[]  = ':' . $col;
                $params[$col] = $val;
            }

            if (empty($cols)) {
                throw new InvalidArgumentException('No hay columnas válidas para insertar.');
            }

            $sql = sprintf(
                'INSERT INTO %s (%s) VALUES (%s)',
                $this->table,
                implode(', ', $cols),
                implode(', ', $phs)
            );

            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);

            return (int) $this->db->lastInsertId();
        }

        public function update(int $id, array $data): bool
        {
            $sets   = [];
            $params = ['__id' => $id];

            foreach ($data as $col => $val) {
                if (!in_array($col, $this->fillable, true)) {
                    continue;
                }
                $sets[] = "{$col} = :{$col}";
                $params[$col] = $val;
            }

            if (empty($sets)) return false;

            $sql = "UPDATE {$this->table} SET " . implode(', ', $sets)
                 . " WHERE {$this->primaryKey} = :__id";

            $this->applyTenant($sql, $params);

            $stmt = $this->db->prepare($sql);
            return $stmt->execute($params);
        }

        public function delete(int $id): bool
        {
            $sql    = "DELETE FROM {$this->table} WHERE {$this->primaryKey} = :__id";
            $params = ['__id' => $id];

            $this->applyTenant($sql, $params);

            $stmt = $this->db->prepare($sql);
            return $stmt->execute($params);
        }

        public function count(array $conditions = []): int
        {
            $sql    = "SELECT COUNT(*) FROM {$this->table} WHERE 1=1";
            $params = [];

            foreach ($conditions as $col => $val) {
                $sql .= " AND {$col} = :{$col}";
                $params[$col] = $val;
            }

            $this->applyTenant($sql, $params);

            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);

            return (int) $stmt->fetchColumn();
        }

        // ====================================================================
        // Métodos raw (NO filtran ni ocultan automáticamente)
        // ====================================================================

        public function raw(string $sql, array $params = []): array
        {
            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);
            return $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
        }

        public function rawScalar(string $sql, array $params = []): mixed
        {
            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);
            return $stmt->fetchColumn();
        }

        public function rawFirst(string $sql, array $params = []): ?array
        {
            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);
            $row = $stmt->fetch(PDO::FETCH_ASSOC) ?: null;

            return $row ?: null;
        }

        // ====================================================================
        // Utilidades
        // ====================================================================

        public function transaction(callable $callback): mixed
        {
            $inTransaction = $this->db->inTransaction();

            if (!$inTransaction) {
                $this->db->beginTransaction();
            }

            try {
                $result = $callback($this->db);
                if (!$inTransaction && $this->db->inTransaction()) {
                    $this->db->commit();
                }
                return $result;
            } catch (Throwable $e) {
                if (!$inTransaction && $this->db->inTransaction()) {
                    $this->db->rollBack();
                }
                throw $e;
            }
        }

        protected function hideFields(array $row): array
        {
            foreach ($this->hidden as $field) {
                unset($row[$field]);
            }
            return $row;
        }
    }
}