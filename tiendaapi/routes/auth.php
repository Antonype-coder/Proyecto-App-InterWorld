<?php
declare(strict_types=1);

/** @var Router $router */

require_once __DIR__ . '/../controllers/AuthController.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';

// Público
$router->post('/auth/login', 'AuthController@login');
$router->post('/auth/registrar-negocio', 'AuthController@registrarNegocio');

// Solo admin
$router->post('/auth/register', 'AuthController@register', [['AuthMiddleware', 'adminOnly']]);

// Autenticado
$router->get('/auth/me', 'AuthController@me', [['AuthMiddleware', 'anyRole']]);
$router->post('/auth/logout', 'AuthController@logout', [['AuthMiddleware', 'anyRole']]);