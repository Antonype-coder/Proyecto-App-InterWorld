<?php
declare(strict_types=1);

require_once __DIR__ . '/../models/AuditoriaLog.php';
require_once __DIR__ . '/../core/Auth.php';

if (!class_exists('AuditoriaService')) {
    class AuditoriaService
    {
        private AuditoriaLog $logs;

        public function __construct()
        {
            $this->logs = new AuditoriaLog();
        }

        public function registrar(
            string $accion,
            string $entidad,
            ?int $entidadId = null,
            ?string $descripcion = null,
            ?array $antes = null,
            ?array $despues = null
        ): void {
            $userId = Auth::id();
            $request = new Request();

            $this->logs->create([
                'usuario_id'       => $userId,
                'accion'           => $accion,
                'entidad'          => $entidad,
                'entidad_id'       => $entidadId,
                'descripcion'      => $descripcion,
                'datos_anteriores' => $antes ? json_encode($antes, JSON_UNESCAPED_UNICODE) : null,
                'datos_nuevos'     => $despues ? json_encode($despues, JSON_UNESCAPED_UNICODE) : null,
                'ip'               => $request->ip(),
                'user_agent'       => $request->userAgent(),
            ]);
        }

        public function listar(array $filtros = [], int $limit = 100, int $offset = 0): array
        {
            return $this->logs->listar($filtros, $limit, $offset);
        }
    }
}