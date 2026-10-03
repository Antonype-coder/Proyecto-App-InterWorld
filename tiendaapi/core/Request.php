<?php
declare(strict_types=1);

if (!class_exists('Request')) {
    class Request
    {
        private string $method;
        private string $path;
        private array $query;
        private array $body = [];
        private array $headers = [];
        private array $params = [];
        private string $rawBody = '';

        public function __construct()
        {
            $this->method  = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
            $this->path    = $this->detectPath();
            $this->query   = $_GET;
            $this->headers = $this->detectHeaders();
            $this->body    = $this->detectBody();
        }

        private function detectPath(): string
        {
            $uri = $_SERVER['REQUEST_URI'] ?? '/';
            $pos = strpos($uri, '?');
            if ($pos !== false) {
                $uri = substr($uri, 0, $pos);
            }

            $scriptName = $_SERVER['SCRIPT_NAME'] ?? '';
            $basePath   = rtrim(dirname($scriptName), '/\\');
            if ($basePath !== '' && str_starts_with($uri, $basePath)) {
                $uri = substr($uri, strlen($basePath));
            }

            return '/' . trim($uri, '/');
        }

        private function detectHeaders(): array
        {
            $headers = [];

            // 1) Headers desde $_SERVER (HTTP_*)
            foreach ($_SERVER as $key => $value) {
                if (str_starts_with($key, 'HTTP_')) {
                    $name = strtolower(str_replace('_', '-', substr($key, 5)));
                    $headers[$name] = $value;
                }
            }

            // 2) Content-Type y Content-Length
            if (isset($_SERVER['CONTENT_TYPE'])) {
                $headers['content-type'] = $_SERVER['CONTENT_TYPE'];
            }
            if (isset($_SERVER['CONTENT_LENGTH'])) {
                $headers['content-length'] = $_SERVER['CONTENT_LENGTH'];
            }

            // 3) Fix Apache/XAMPP: header Authorization reescrito por .htaccess
            if (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
                $headers['authorization'] = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
            }
            if (!isset($headers['authorization']) && isset($_SERVER['HTTP_AUTHORIZATION'])) {
                $headers['authorization'] = $_SERVER['HTTP_AUTHORIZATION'];
            }

            // 4) Fix Apache bajo CGI/FastCGI: usar getallheaders() si existe
            if (!isset($headers['authorization']) && function_exists('getallheaders')) {
                $all = getallheaders();
                if (is_array($all)) {
                    foreach ($all as $name => $value) {
                        $headers[strtolower(str_replace('_', '-', $name))] = $value;
                    }
                }
            }

            return $headers;
        }

        private function detectBody(): array
        {
            $ct = strtolower((string) ($this->headers['content-type'] ?? ''));

            if (str_contains($ct, 'application/json')) {
                $raw = file_get_contents('php://input');
                $this->rawBody = $raw === false ? '' : $raw;
                if ($this->rawBody === '') return [];
                $decoded = json_decode($this->rawBody, true);
                return (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) ? $decoded : [];
            }

            if (!empty($_POST)) {
                return $_POST;
            }

            $raw = file_get_contents('php://input');
            $this->rawBody = $raw === false ? '' : $raw;
            if ($this->rawBody !== '') {
                $decoded = json_decode($this->rawBody, true);
                if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                    return $decoded;
                }
            }

            return [];
        }

        public function getMethod(): string { return $this->method; }
        public function getPath(): string { return $this->path; }
        public function getRawBody(): string { return $this->rawBody; }

        public function getQuery(?string $key = null, mixed $default = null): mixed
        {
            if ($key === null) return $this->query;
            return $this->query[$key] ?? $default;
        }

        public function input(string $key, mixed $default = null): mixed
        {
            return $this->body[$key] ?? $default;
        }

        public function all(): array { return $this->body; }

        public function only(array $keys): array
        {
            $out = [];
            foreach ($keys as $k) {
                if (array_key_exists($k, $this->body)) {
                    $out[$k] = $this->body[$k];
                }
            }
            return $out;
        }

        public function has(string $key): bool
        {
            return array_key_exists($key, $this->body);
        }

        public function getHeader(string $name): ?string
        {
            $normalized = strtolower(str_replace('_', '-', $name));
            return $this->headers[$normalized] ?? null;
        }

        public function allHeaders(): array { return $this->headers; }

        public function bearerToken(): ?string
        {
            $auth = $this->getHeader('authorization');
            if ($auth === null || $auth === '') return null;
            if (preg_match('/^Bearer\s+(.+)$/i', trim($auth), $m) === 1) {
                return trim($m[1]);
            }
            return null;
        }

        public function setParams(array $params): void { $this->params = $params; }
        public function param(string $key, mixed $default = null): mixed
        {
            return $this->params[$key] ?? $default;
        }
        public function params(): array { return $this->params; }

        public function ip(): string
        {
            $f = $this->getHeader('x-forwarded-for');
            if ($f !== null && $f !== '') {
                $parts = explode(',', $f);
                return trim($parts[0]);
            }
            return (string) ($_SERVER['REMOTE_ADDR'] ?? '0.0.0.0');
        }

        public function userAgent(): string
        {
            return (string) ($_SERVER['HTTP_USER_AGENT'] ?? '');
        }

        public function isJson(): bool
        {
            $ct = strtolower((string) ($this->headers['content-type'] ?? ''));
            return str_contains($ct, 'application/json');
        }
    }
}