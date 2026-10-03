<?php
declare(strict_types=1);

if (!class_exists('Response')) {
    class Response
    {
        public static function json(array $payload, int $status = 200): void
        {
            if (!headers_sent()) {
                http_response_code($status);
                header('Content-Type: application/json; charset=utf-8');
            }

            $json = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

            if ($json === false) {
                $json = '{"success":false,"data":null,"message":"Error al codificar la respuesta"}';
            }

            echo $json;
            exit;
        }

        public static function success(mixed $data = null, string $message = 'OK', int $status = 200): void
        {
            self::json([
                'success' => true,
                'data'    => $data,
                'message' => $message,
            ], $status);
        }

        public static function error(string $message, int $status = 400, mixed $data = null): void
        {
            self::json([
                'success' => false,
                'data'    => $data,
                'message' => $message,
            ], $status);
        }

        public static function created(mixed $data = null, string $message = 'Recurso creado correctamente'): void
        {
            self::success($data, $message, 201);
        }

        public static function noContent(string $message = 'Operación exitosa'): void
        {
            self::success(null, $message, 200);
        }

        public static function badRequest(string $message = 'Solicitud inválida'): void
        {
            self::error($message, 400);
        }

        public static function unauthorized(string $message = 'No autorizado'): void
        {
            self::error($message, 401);
        }

        public static function forbidden(string $message = 'Acceso denegado'): void
        {
            self::error($message, 403);
        }

        public static function notFound(string $message = 'Recurso no encontrado'): void
        {
            self::error($message, 404);
        }

        public static function methodNotAllowed(string $message = 'Método no permitido'): void
        {
            self::error($message, 405);
        }

        public static function conflict(string $message = 'Conflicto'): void
        {
            self::error($message, 409);
        }

        public static function tooManyRequests(string $message = 'Demasiadas solicitudes'): void
        {
            self::error($message, 429);
        }

        public static function serverError(string $message = 'Error interno del servidor'): void
        {
            self::error($message, 500);
        }

        public static function validationError(array $errors, string $message = 'Datos inválidos'): void
        {
            self::json([
                'success' => false,
                'data'    => ['errors' => $errors],
                'message' => $message,
            ], 422);
        }

        public static function paginated(array $items, int $total, int $limit, int $offset, string $message = 'OK'): void
        {
            self::success([
                'items'  => $items,
                'total'  => $total,
                'limit'  => $limit,
                'offset' => $offset,
                'page'   => $limit > 0 ? (int) floor($offset / $limit) + 1 : 1,
                'pages'  => $limit > 0 ? (int) ceil($total / $limit) : 1,
            ], $message);
        }
    }
}