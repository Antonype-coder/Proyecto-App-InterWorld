<?php
declare(strict_types=1);

require_once __DIR__ . '/Request.php';
require_once __DIR__ . '/Response.php';
require_once __DIR__ . '/Exceptions/HttpException.php';

if (!class_exists('Router')) {
    class Router
    {
        private array $routes = [
            'GET'     => [],
            'POST'    => [],
            'PUT'     => [],
            'PATCH'   => [],
            'DELETE'  => [],
            'OPTIONS' => [],
        ];

        public function get(string $path, mixed $handler, array $middleware = []): void
        {
            $this->add('GET', $path, $handler, $middleware);
        }

        public function post(string $path, mixed $handler, array $middleware = []): void
        {
            $this->add('POST', $path, $handler, $middleware);
        }

        public function put(string $path, mixed $handler, array $middleware = []): void
        {
            $this->add('PUT', $path, $handler, $middleware);
        }

        public function patch(string $path, mixed $handler, array $middleware = []): void
        {
            $this->add('PATCH', $path, $handler, $middleware);
        }

        public function delete(string $path, mixed $handler, array $middleware = []): void
        {
            $this->add('DELETE', $path, $handler, $middleware);
        }

        public function add(string $method, string $path, mixed $handler, array $middleware = []): void
        {
            $method = strtoupper($method);
            if (!isset($this->routes[$method])) return;

            $path = $this->normalizePath($path);

            // Si nos pasan un único middleware [Class, 'method'], lo envolvemos en un array
            if ($this->isSingleMiddleware($middleware)) {
                $middleware = [$middleware];
            }

            $this->routes[$method][] = [
                'path'       => $path,
                'regex'      => $this->buildRegex($path),
                'handler'    => $handler,
                'middleware' => $middleware,
            ];
        }

        /**
         * Detecta si $mw es un único middleware con forma [ClassName, 'methodName'].
         */
        private function isSingleMiddleware(array $mw): bool
        {
            if (count($mw) !== 2) {
                return false;
            }

            if (!isset($mw[0], $mw[1])) {
                return false;
            }

            return is_string($mw[0])
                && is_string($mw[1])
                && (class_exists($mw[0]) || is_callable($mw));
        }

        private function normalizePath(string $path): string
        {
            $path = '/' . trim($path, '/');
            return $path === '/' ? '/' : rtrim($path, '/');
        }

        private function buildRegex(string $path): string
        {
            $pattern = preg_replace_callback('#\{([a-zA-Z_][a-zA-Z0-9_]*)\}#', function ($m) {
                return '(?P<' . $m[1] . '>[^/]+)';
            }, $path);

            return '#^' . $pattern . '$#';
        }

        public function dispatch(Request $request): void
        {
            $method = $request->getMethod();
            $path   = $this->normalizePath($request->getPath());

            if ($method === 'OPTIONS') {
                http_response_code(204);
                exit;
            }

            $routes = $this->routes[$method] ?? [];

            foreach ($routes as $route) {
                if (preg_match($route['regex'], $path, $matches) === 1) {
                    $params = [];
                    foreach ($matches as $key => $value) {
                        if (is_string($key)) {
                            $params[$key] = $value;
                        }
                    }
                    $request->setParams($params);

                    foreach ($route['middleware'] as $mw) {
                        $this->runMiddleware($mw, $request);
                    }

                    $this->runHandler($route['handler'], $request);
                    return;
                }
            }

            Response::notFound('Endpoint no encontrado: ' . $path);
        }

        private function runMiddleware(mixed $mw, Request $request): void
        {
            // Caso: [ClassName, 'method'] con clase estática
            if (is_array($mw) && count($mw) === 2 && is_string($mw[0]) && is_string($mw[1])) {
                $class  = $mw[0];
                $method = $mw[1];

                if (class_exists($class)) {
                    if (!method_exists($class, $method)) {
                        throw new RuntimeException("Middleware método no existe: {$class}::{$method}");
                    }
                    $class::$method($request);
                    return;
                }

                if (is_callable([$class, $method])) {
                    call_user_func([$class, $method], $request);
                    return;
                }

                throw new RuntimeException("Middleware clase no existe: {$class}");
            }

            // Caso: closure / callable
            if (is_callable($mw)) {
                $mw($request);
                return;
            }

            throw new RuntimeException('Middleware no válido: ' . print_r($mw, true));
        }

        public function runHandler(mixed $handler, Request $request): void
        {
            if (is_string($handler) && str_contains($handler, '@')) {
                [$class, $method] = explode('@', $handler, 2);

                if (!class_exists($class)) {
                    Response::serverError("Controlador no encontrado: {$class}");
                }

                $instance = new $class();
                if (!method_exists($instance, $method)) {
                    Response::serverError("Método no encontrado: {$class}@{$method}");
                }

                $instance->{$method}($request);
                return;
            }

            if (is_array($handler) && count($handler) === 2) {
                call_user_func($handler, $request);
                return;
            }

            if (is_callable($handler)) {
                call_user_func($handler, $request);
                return;
            }

            Response::serverError('Handler no válido.');
        }
    }
}