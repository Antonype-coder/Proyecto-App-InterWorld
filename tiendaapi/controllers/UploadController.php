<?php
declare(strict_types=1);

require_once __DIR__ . '/../core/Request.php';
require_once __DIR__ . '/../core/Response.php';
require_once __DIR__ . '/../utils/Upload.php';
require_once __DIR__ . '/../utils/Helpers.php';

if (!class_exists('UploadController')) {
    class UploadController
    {
        public function imagenProducto(Request $request): void
        {
            if (!isset($_FILES['imagen'])) {
                Response::badRequest('No se recibió ningún archivo.');
            }

            $path = Upload::image($_FILES['imagen'], 'productos');
            Response::created(['path' => $path], 'Imagen subida.');
        }

        public function imagenLogo(Request $request): void
        {
            if (!isset($_FILES['imagen'])) {
                Response::badRequest('No se recibió ningún archivo.');
            }

            $path = Upload::image($_FILES['imagen'], 'logo');
            Response::created(['path' => $path], 'Logo subido.');
        }
    }
}