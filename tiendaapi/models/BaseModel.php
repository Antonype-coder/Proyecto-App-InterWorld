<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';

if (!class_exists('BaseModel')) {
    abstract class BaseModel
    {
        protected string $table = '';
        protected string $primaryKey = 'id';
        protected array $fillable = [];
        protected array $hidden = [];
        protected bool $timestamps = true;
        protected PDO $db;

        public function __construct()
        {
            $this->db = Database::getConnection();
        }

        public function db(): PDO
        {
            return $this->db;
        }

        public function table(): string
        {
            return $this->table;
        }

        public function all(array $conditions = [], string $orderBy = '', int $limit = 0, int $offset = 0): array
        {
            $sql    = "SELECT * FROM {$this->table}";
            $where  = [];
            $params = [];

            foreach ($conditions as $col => $val) {
                if (!preg_match('/^[a-zA-Z_][a-zA-Z0-9_]*$/', $col)) continue;
                if ($val === null) {
                    $where[] = "{$col} IS NULL";
                } else {
                    $where[] = "{$col} = :{$col}";
                    $params[$col] = $val;
                }
            }

            if (!empty($where)) {
                $sql .= ' WHERE ' . implode(' AND ', $where);
            }

            if ($orderBy !== '' && preg_match('/^[a-zA-Z_][a-zA-Z0-9_]*(\s+(ASC|DESC))?(,\s*[a-zA-Z_][a-zA-Z0-9_]*(\s+(ASC|DESC))?)*$/i', $orderBy)) {
                $sql .= " ORDER BY {$orderBy}";
            }

            if ($limit > 0) {
                $sql .= ' LIMIT ' . (int) $limit;
                if ($offset > 0) {
                    $sql .= ' OFFSET ' . (int) $offset;
                }
            }

            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);
            $rows = $stmt->fetchAll();

            return array_map(fn($r) => $this->hideFields($r), $rows);
        }

        public function find(int $id): ?array
        {
            $stmt = $this->db->prepare(
                "SELECT * FROM {$this->table} WHERE {$this->primaryKey} = :id LIMIT 1"
            );
            $stmt->execute(['id' => $id]);
            $row = $stmt->fetch();

            return $row === false ? null : $this->hideFields($row);
        }

        public function findBy(array $conditions): ?array
        {
            $rows = $this->all($conditions, '', 1);
            return $rows[0] ?? null;
        }

        public function count(array $conditions = []): int
        {
            $sql    = "SELECT COUNT(*) AS total FROM {$this->table}";
            $where  = [];
            $params = [];

            foreach ($conditions as $col => $val) {
                if (!preg_match('/^[a-zA-Z_][a-zA-Z0-9_]*$/', $col)) continue;
                if ($val === null) {
                    $where[] = "{$col} IS NULL";
                } else {
                    $where[] = "{$col} = :{$col}";
                    $params[$col] = $val;
                }
            }

            if (!empty($where)) {
                $sql .= ' WHERE ' . implode(' AND ', $where);
            }

            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);
            $row = $stmt->fetch();

            return (int) ($row['total'] ?? 0);
        }

        public function exists(array $conditions): bool
        {
            return $this->findBy($conditions) !== null;
        }

        public function create(array $data): int
        {
            $data = $this->filterFillable($data);
            if ($data === []) {
                throw new InvalidArgumentException('No hay campos válidos para insertar.');
            }

            $cols         = array_keys($data);
            $placeholders = array_map(fn($c) => ':' . $c, $cols);

            $sql = sprintf(
                'INSERT INTO %s (%s) VALUES (%s)',
                $this->table,
                implode(', ', $cols),
                implode(', ', $placeholders)
            );

            $stmt = $this->db->prepare($sql);
            $stmt->execute($data);

            return (int) $this->db->lastInsertId();
        }

        public function update(int $id, array $data): bool
        {
            $data = $this->filterFillable($data);
            if ($data === []) {
                throw new InvalidArgumentException('No hay campos válidos para actualizar.');
            }

            $sets = [];
            foreach (array_keys($data) as $col) {
                $sets[] = "{$col} = :{$col}";
            }

            $sql = sprintf(
                'UPDATE %s SET %s WHERE %s = :__id',
                $this->table,
                implode(', ', $sets),
                $this->primaryKey
            );

            $data['__id'] = $id;
            $stmt = $this->db->prepare($sql);

            return $stmt->execute($data);
        }

        public function delete(int $id): bool
        {
            $stmt = $this->db->prepare(
                "DELETE FROM {$this->table} WHERE {$this->primaryKey} = :id"
            );
            return $stmt->execute(['id' => $id]);
        }

        protected function filterFillable(array $data): array
        {
            $out = [];
            foreach ($this->fillable as $field) {
                if (array_key_exists($field, $data)) {
                    $out[$field] = $data[$field];
                }
            }
            return $out;
        }

        protected function hideFields(array $row): array
        {
            foreach ($this->hidden as $field) {
                unset($row[$field]);
            }
            return $row;
        }

        protected function raw(string $sql, array $params = []): array
        {
            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);
            return $stmt->fetchAll() ?: [];
        }

        protected function rawFirst(string $sql, array $params = []): ?array
        {
            $rows = $this->raw($sql, $params);
            return $rows[0] ?? null;
        }

        protected function rawScalar(string $sql, array $params = []): mixed
        {
            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);
            return $stmt->fetchColumn();
        }

        protected function transaction(callable $callback): mixed
        {
            $this->db->beginTransaction();
            try {
                $result = $callback($this->db);
                $this->db->commit();
                return $result;
            } catch (Throwable $e) {
                if ($this->db->inTransaction()) {
                    $this->db->rollBack();
                }
                throw $e;
            }
        }
    }
}