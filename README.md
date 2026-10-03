# TiendaAdmin

Sistema de punto de venta, inventario y administración para tiendas pequeñas y medianas. Aplicación móvil con backend REST y arquitectura multi-negocio.

---

## Tabla de contenidos

1. [Descripción general](#1-descripción-general)
2. [Tecnologías](#2-tecnologías)
3. [Estructura del repositorio](#3-estructura-del-repositorio)
4. [Requisitos previos](#4-requisitos-previos)
5. [Instalación del backend](#5-instalación-del-backend)
6. [Instalación del frontend](#6-instalación-del-frontend)
7. [Credenciales de prueba](#7-credenciales-de-prueba)
8. [Uso de la aplicación](#8-uso-de-la-aplicación)
9. [Cómo probar la aplicación](#9-cómo-probar-la-aplicación)
10. [Endpoints del API](#10-endpoints-del-api)
11. [Base de datos](#11-base-de-datos)
12. [Scripts disponibles](#12-scripts-disponibles)
13. [Solución de problemas](#13-solución-de-problemas)
14. [Notas importantes de instalación](#14-notas-importantes-de-instalación)
15. [Roadmap](#15-roadmap)
16. [Licencia](#16-licencia)

---

## 1. Descripción general

TiendaAdmin es una aplicación empresarial que permite:

* Registrar ventas con escáner de códigos de barras.
* Controlar inventario con trazabilidad completa.
* Administrar clientes con crédito y programa de lealtad.
* Manejar caja diaria con arqueo automático.
* Generar reportes exportables a PDF y Excel.
* Gestionar múltiples negocios con datos aislados (multi-tenant).
* Funcionar con roles diferenciados (admin / vendedor).

---

## 2. Tecnologías

### Frontend

* React Native 0.76 + Expo SDK 52.
* TypeScript en modo estricto.
* React Navigation 7 (stacks y tabs anidados).
* Zustand para estado global.
* Axios con interceptores JWT.
* React Hook Form + Zod para formularios.
* React Native Paper para componentes base.
* React Native Gifted Charts para gráficos.
* Expo Camera, Image Picker, Print, Sharing y File System.

### Backend

* PHP 8.1+ sin framework (arquitectura MVC propia).
* MySQL 8 / MariaDB 10.4+ (InnoDB, utf8mb4).
* Apache 2.4+ (XAMPP).
* Composer para gestión de dependencias.
* JWT propio (HMAC-SHA256).
* Monolog para logging.
* PHPMailer para emails.
* Ramsey UUID para identificadores únicos.
* Dotenv para variables de entorno.

---

## 3. Estructura del repositorio

```text
TiendaAdmin/
├── frontend/
│   ├── App.tsx
│   ├── app.json
│   ├── babel.config.js
│   ├── tsconfig.json
│   ├── package.json
│   ├── .env
│   ├── TESTING.md
│   └── src/
│       ├── api/                  # 15 archivos de clientes HTTP
│       ├── components/
│       │   ├── ui/               # 22 componentes base
│       │   ├── layout/           # 4 layouts
│       │   ├── feedback/         # 3 componentes
│       │   ├── forms/            # 5 formularios
│       │   ├── domain/            # 7 componentes de negocio
│       │   └── charts/            # 3 gráficos
│       ├── data/                  # FAQs y datos estáticos
│       ├── hooks/                 # 6 hooks personalizados
│       ├── navigation/            # 15 archivos de navegación
│       ├── screens/               # 45+ pantallas
│       ├── services/              # PDF, Excel, imágenes
│       ├── store/                 # 8 stores Zustand
│       ├── theme/                 # Sistema de diseño
│       ├── types/                 # 20 archivos de tipos
│       └── utils/                 # Utilidades
│
└── backend/
    ├── index.php
    ├── .htaccess
    ├── composer.json
    ├── .env
    ├── config/
    ├── core/
    │   └── Exceptions/             # 7 excepciones tipadas
    ├── middleware/                 # 5 middlewares
    ├── controllers/                # 21 controladores
    ├── services/                   # 10 servicios de negocio
    ├── models/                     # 12 modelos
    ├── utils/                      # JWT, Money, Folio, Upload, Helpers
    ├── routes/                     # api.php con ~70 endpoints
    ├── database/                   # Migraciones y seeds
    ├── sql/                        # tienda_db.sql
    ├── storage/                    # Logs, cache, uploads, exports
    ├── scripts/                    # Scripts CLI
    └── test_completo.php           # Test de 60 endpoints
```

---

## 4. Requisitos previos

### Software necesario

* XAMPP con PHP 8.1+ y MySQL.
* Composer.
* Node.js 18 o superior.
* Git (opcional).
* Expo Go en el celular (Android o iOS).

### Extensiones PHP requeridas

Editar:

```text
C:\xampp\php\php.ini
```

Las siguientes extensiones deben estar habilitadas, es decir, sin `;` al inicio:

```ini
extension=pdo_mysql
extension=mbstring
extension=json
extension=openssl
extension=fileinfo
extension=gd
extension=curl
extension=zip
```

Reiniciar Apache después de cualquier cambio en este archivo.

---

## 5. Instalación del backend

### Paso 1: Copiar el proyecto

Copiar la carpeta `backend/` dentro de:

```text
C:\xampp\htdocs\
```

Renombrarla a:

```text
interworld
```

La ruta final debe ser:

```text
C:\xampp\htdocs\interworld\
```

### Paso 2: Instalar dependencias

Abrir PowerShell:

```powershell
cd C:\xampp\htdocs\interworld
composer install
```

Esto instala:

* vlucas/phpdotenv
* monolog/monolog
* ramsey/uuid
* phpmailer/phpmailer

### Paso 3: Configurar variables de entorno

Copiar `.env.example` como `.env`:

```powershell
cp .env.example .env
```

Editar el archivo `.env`:

```env
APP_NAME=TiendaAdmin
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost/interworld
APP_TIMEZONE=America/Bogota

DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=tienda_db
DB_USER=root
DB_PASS=

JWT_SECRET=GENERAR_UNO_ALEATORIO
JWT_EXP_MINUTES=480

CORS_ALLOWED_ORIGINS=*
RATE_LIMIT_LOGIN_MAX=10
RATE_LIMIT_LOGIN_WINDOW=300
```

### Generar `JWT_SECRET`

No utilizar literalmente:

```env
JWT_SECRET=GENERAR_UNO_ALEATORIO
```

Generar un secreto aleatorio con PHP:

```powershell
php -r "echo base64_encode(random_bytes(48));"
```

Copiar el resultado y colocarlo en:

```env
JWT_SECRET=PEGA_AQUI_EL_VALOR_GENERADO
```

Por ejemplo:

```env
JWT_SECRET=7fK2mQ9xV4nR8pL1zT6wY3cA0sD5hG8jN2bM7vX4qP9rC6tU1eW5kZ8fH3
```

> **Importante:** nunca publiques el `JWT_SECRET` real en GitHub ni lo compartas públicamente.

Cada instalación debe utilizar un `JWT_SECRET` diferente.

### Paso 4: Crear la base de datos

Abrir:

```text
http://localhost/phpmyadmin
```

Ir a la pestaña **SQL**, sin seleccionar una base de datos, pegar el contenido de:

```text
sql/tienda_db.sql
```

y ejecutar.

Esto crea:

* Base de datos `tienda_db`.
* 21 tablas.
* Negocio demo.
* 2 usuarios semilla.
* Datos de ejemplo.

### Paso 5: Generar hashes reales de contraseñas

Ejecutar:

```powershell
php scripts/hash-passwords.php
```

Verificar que los dos usuarios muestren `OK`.

Si falla, ejecutar:

```powershell
php scripts/fix-passwords.php
```

### Paso 6: Verificar el backend

Abrir:

```text
http://localhost/interworld/api/health
```

Debe devolver:

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "version": "2.0.0"
  }
}
```

### Paso 7: Ejecutar el test completo

```powershell
php test_completo.php
```

El resultado esperado es:

```text
Total:    60
Pasaron:  60
Fallaron: 0
```

---

## 6. Instalación del frontend

### Paso 1: Instalar dependencias

```powershell
cd ruta\al\frontend
npm install
```

### Paso 2: Obtener la IP local

```powershell
ipconfig | Select-String "IPv4"
```

Anotar la dirección IPv4, por ejemplo:

```text
192.168.1.100
```

### Paso 3: Configurar el archivo `.env`

Copiar `.env.example` a `.env`:

```powershell
cp .env.example .env
```

Editar:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.100/interworld/api
EXPO_PUBLIC_APP_NAME=TiendaAdmin
EXPO_PUBLIC_APP_VERSION=2.0.0
```

> **Importante:** utilizar la IP local de la PC y no `localhost`. El celular necesita acceder al backend a través de la red.

### Paso 4: Arrancar Expo

```powershell
npx expo start --clear
```

### Paso 5: Abrir en el celular

1. Abrir Expo Go.
2. Escanear el código QR mostrado en la terminal.
3. Esperar a que compile.

El celular y la PC deben estar conectados a la misma red WiFi.

---

## 7. Credenciales de prueba

| Rol           | Correo                | Contraseña    | Permisos           |
| ------------- | --------------------- | ------------- | ------------------ |
| Administrador | `admin@tienda.com`    | `admin123`    | Acceso total       |
| Vendedor      | `vendedor@tienda.com` | `vendedor123` | Ventas y consultas |

> Estas credenciales son únicamente para el entorno de prueba.

---

## 8. Uso de la aplicación

### Inicio de sesión

Abrir la aplicación e ingresar las credenciales.

También existe una opción para registrar un nuevo negocio, creando una cuenta aislada con sus propios datos.

### Dashboard

La pantalla principal incluye:

* Selector de período: Hoy, Ayer, Semana, Mes y Año.
* KPIs con comparación contra el período anterior.
* Gráfico de línea con ventas por día.
* Gráfico de barras con ventas por hora.
* Gráfico circular con métodos de pago.
* Top 5 de productos con barras de progreso.
* Alertas de stock bajo.
* Tarjeta de caja abierta.
* Últimas ventas.

### Punto de venta

1. Abrir la pestaña **Vender**.
2. Buscar un producto por nombre o código.
3. Utilizar la cámara para escanear códigos de barras.
4. Ajustar cantidades en el carrito.
5. Aplicar un descuento si es necesario.
6. Elegir el tipo de pago: contado o crédito.
7. Si es crédito, seleccionar el cliente.
8. Tocar **Cobrar**.

### Productos

* Lista con búsqueda y filtro por categoría.
* Crear productos con fotografía desde cámara o galería.
* Escanear códigos de barras.
* Editar y desactivar productos (solo administrador).

### Clientes

* Lista con búsqueda.
* Filtro para clientes con deuda.
* Estado de cuenta con historial de ventas y pagos.
* Registro de pagos.
* Programa de lealtad.

### Ventas

* Lista con filtros por estado y tipo de pago.
* Detalle de cada venta.
* Anulación de ventas por administradores.
* Reversión de stock y deuda al anular.
* Devoluciones parciales o totales.

### Devoluciones

1. Abrir la venta original.
2. Tocar **Devolver productos**.
3. Seleccionar las cantidades.
4. Escribir el motivo.
5. Elegir el método:

   * Efectivo.
   * Transferencia.
   * Nota de crédito.
   * Reposición.
6. Confirmar.

### Promociones

Cinco tipos disponibles:

* Porcentaje de descuento.
* Monto fijo.
* Precio especial.
* 2x1.
* 3x2.

Las promociones pueden aplicarse a:

* Productos.
* Categorías.
* Globalmente.

También pueden configurarse con fecha de inicio y fecha de finalización.

### Órdenes de compra

1. Crear una orden seleccionando un proveedor.
2. Agregar productos con cantidad y precio.
3. Definir la fecha esperada.
4. Guardar como borrador.
5. Marcar como enviada.
6. Recibir la mercancía parcial o totalmente.

### Caja

1. Abrir caja con un monto inicial.
2. Registrar ingresos o egresos manuales.
3. Consultar los totales del turno en tiempo real.
4. Cerrar caja con arqueo automático.
5. Consultar la diferencia entre el valor declarado y el registrado por el sistema.

### Reportes

La aplicación dispone de tres reportes exportables:

* Ventas.
* Inventario valorizado.
* Cartera de clientes.

Cada reporte puede generarse en PDF y Excel e incluye el logo y los datos del negocio.

### Búsqueda global

Permite buscar simultáneamente en:

* Productos.
* Clientes.
* Ventas.
* Proveedores.

Guarda el historial de las últimas 10 búsquedas.

### Programa de lealtad

* 1 punto por cada $1.000 en compras.
* 1 punto equivale a $100 de descuento.
* Niveles: Bronze, Silver y Gold.
* Canje de puntos desde el estado de cuenta del cliente.
* Ranking de clientes por puntos.

### Centro de ayuda

Incluye:

* 23 preguntas frecuentes organizadas por categoría.
* Búsqueda de preguntas.
* Tooltips contextuales en pantallas clave.

---

## 9. Cómo probar la aplicación

### Prueba básica — 5 minutos

1. Iniciar sesión con `admin@tienda.com` / `admin123`.
2. Verificar el Dashboard y sus gráficos.
3. Ir a **Vender**.
4. Buscar `"coca"`.
5. Agregar un producto al carrito.
6. Realizar una venta.
7. Ir a **Productos**.
8. Abrir un producto y verificar su fotografía.
9. Cerrar sesión.

### Prueba completa — 30 minutos

Seguir el archivo:

```text
frontend/TESTING.md
```

Este archivo contiene el checklist de las 45+ pantallas.

### Prueba del backend — 5 minutos

```powershell
cd C:\xampp\htdocs\interworld
php test_completo.php
```

Resultado esperado:

```text
Total:    60
Pasaron:  60
Fallaron: 0
```

### Prueba del registro de negocio

1. En Login, tocar **Crear cuenta de negocio**.
2. Ingresar los datos del negocio.
3. Ingresar nombre, email y contraseña.
4. Confirmar.
5. Ingresar al dashboard vacío.
6. Crear productos y clientes.
7. Verificar que solo aparezcan en esta cuenta.
8. Cerrar sesión.
9. Ingresar con `admin@tienda.com`.
10. Verificar que los datos sean diferentes.

### Prueba del escáner

1. Ir a **Vender**.
2. Tocar el botón de cámara.
3. Apuntar al código de barras de un producto existente.
4. Verificar que el producto se agregue automáticamente al carrito.

Códigos de ejemplo:

* `7501234567890` — Coca-Cola.
* `7509876543210` — Agua Cristal.
* `7701234567890` — Arroz Diana.

### Prueba de exportación

1. Ir a **Más → Reportes**.
2. Tocar **PDF** en el reporte de ventas.
3. Verificar que aparezca el menú para compartir.
4. Guardar el archivo o compartirlo.

### Prueba del modo offline

El modo offline todavía no está implementado. Está previsto para la Fase 2.

---

## 10. Endpoints del API

Base URL:

```text
http://localhost/interworld/api
```

Todos los endpoints requieren:

```http
Authorization: Bearer <token>
```

excepto los endpoints de login, registro de negocio y health check.

### Autenticación

```http
POST   /auth/login
POST   /auth/registrar-negocio
POST   /auth/register
GET    /auth/me
POST   /auth/logout
```

### Usuarios — solo administrador

```http
GET    /usuarios
GET    /usuarios/{id}
POST   /usuarios
PUT    /usuarios/{id}
DELETE /usuarios/{id}
```

### Categorías

```http
GET    /categorias
GET    /categorias/{id}
POST   /categorias
PUT    /categorias/{id}
DELETE /categorias/{id}
```

### Proveedores

```http
GET    /proveedores
GET    /proveedores/{id}
POST   /proveedores
PUT    /proveedores/{id}
DELETE /proveedores/{id}
```

### Productos

```http
GET    /productos
GET    /productos/{id}
GET    /productos/barcode/{codigo}
GET    /productos/stock-bajo
POST   /productos
PUT    /productos/{id}
DELETE /productos/{id}
```

### Clientes

```http
GET    /clientes
GET    /clientes/{id}
GET    /clientes/{id}/estado-cuenta
POST   /clientes
PUT    /clientes/{id}
DELETE /clientes/{id}
POST   /clientes/{id}/pagos
```

### Inventario

```http
POST   /inventario/movimientos
GET    /inventario/movimientos
```

### Ventas

```http
POST   /ventas
GET    /ventas
GET    /ventas/{id}
POST   /ventas/{id}/anular
```

### Devoluciones

```http
GET    /devoluciones
GET    /devoluciones/{id}
POST   /devoluciones
```

### Promociones

```http
GET    /promociones
GET    /promociones/vigentes
GET    /promociones/{id}
POST   /promociones
PUT    /promociones/{id}
DELETE /promociones/{id}
```

### Órdenes de compra

```http
GET    /ordenes-compra
GET    /ordenes-compra/{id}
POST   /ordenes-compra
POST   /ordenes-compra/{id}/estado
POST   /ordenes-compra/{id}/recibir
```

### Lealtad

```http
GET    /lealtad/ranking
GET    /lealtad/cliente/{id}
GET    /lealtad/cliente/{id}/historial
POST   /lealtad/cliente/{id}/canjear
POST   /lealtad/cliente/{id}/ajustar
```

### Caja

```http
GET    /caja/estado
POST   /caja/abrir
POST   /caja/{id}/cerrar
POST   /caja/{id}/movimientos
GET    /caja/{id}/movimientos
GET    /caja/historial
```

### Reportes

```http
GET    /reportes/resumen
GET    /reportes/ventas-por-dia
GET    /reportes/productos-mas-vendidos
GET    /reportes/stock-bajo
GET    /reportes/cartera
```

### Dashboard

```http
GET    /dashboard/resumen
GET    /dashboard/avanzado
GET    /dashboard/comparacion
```

### Búsqueda global

```http
GET    /buscar?q=termino
```

### Notificaciones

```http
GET    /notificaciones
PATCH  /notificaciones/{id}/leida
POST   /notificaciones/marcar-todas
```

### Auditoría

```http
GET    /auditoria
```

### Configuración

```http
GET    /configuracion
PUT    /configuracion
```

### Uploads

```http
POST   /uploads/productos
POST   /uploads/logo
```

---

## 11. Base de datos

TiendaAdmin utiliza MySQL con InnoDB y `utf8mb4`.

Actualmente contiene 21 tablas:

1. `negocios`
2. `usuarios`
3. `categorias`
4. `proveedores`
5. `productos`
6. `clientes`
7. `caja_sesiones`
8. `caja_movimientos`
9. `ventas`
10. `venta_detalle`
11. `movimientos_inventario`
12. `pagos_credito`
13. `devoluciones`
14. `devolucion_detalle`
15. `promociones`
16. `ordenes_compra`
17. `orden_compra_detalle`
18. `puntos_historial`
19. `notificaciones`
20. `auditoria_logs`
21. `configuracion`

Las tablas incluyen `created_at` y `updated_at` donde corresponde, además de índices en columnas de búsqueda y claves foráneas con las reglas `ON DELETE` y `ON UPDATE` correspondientes.

---

## 12. Scripts disponibles

Los scripts se encuentran en:

```text
backend/scripts/
```

| Script               | Función                                    |
| -------------------- | ------------------------------------------ |
| `migrate.php`        | Ejecuta migraciones en orden               |
| `seed.php`           | Carga datos semilla                        |
| `hash-passwords.php` | Genera hashes BCRYPT reales                |
| `reset.php`          | Borra todas las tablas                     |
| `diagnostico.php`    | Verifica la integridad de la base de datos |
| `debug-login.php`    | Debug del flujo de login                   |
| `debug-auth.php`     | Debug de autenticación y JWT               |
| `fix-passwords.php`  | Fuerza la regeneración de hashes           |

Ejecutar un script:

```powershell
cd C:\xampp\htdocs\interworld
php scripts/nombre-script.php
```

---

## 13. Solución de problemas

### Error `Network Error` en la aplicación

* Verificar que la IP del `.env` coincida con la IP local de la PC.
* Reiniciar Expo con:

```powershell
npx expo start -c
```

* Verificar que Apache esté activo en XAMPP.
* Permitir Apache en el Firewall de Windows.
* Confirmar que el celular y la PC estén en la misma red WiFi.

### Apache no arranca

Otro programa puede estar utilizando el puerto 80.

Cambiar el puerto en:

```text
xampp/apache/conf/httpd.conf
```

### MySQL no arranca

El puerto `3306` puede estar ocupado.

Cambiar el puerto en:

```text
xampp/mysql/bin/my.ini
```

### `JWT_SECRET` no configurado

* Verificar que exista `.env` en:

```text
C:\xampp\htdocs\interworld\
```

* Verificar que `JWT_SECRET` tenga al menos 32 caracteres.
* Generar un secreto nuevo si es necesario.
* Reiniciar Apache.

### Credenciales inválidas

* Verificar que la base de datos tenga los dos usuarios.
* Ejecutar:

```powershell
php scripts/hash-passwords.php
```

* Si continúa el problema, ejecutar:

```powershell
php scripts/fix-passwords.php
```

* Como último recurso, reimportar `tienda_db.sql`.

### `SQLSTATE HY093 Invalid parameter number`

Puede deberse a placeholders duplicados en una consulta.

Utilizar, por ejemplo:

```text
:q1
:q2
```

en lugar de repetir:

```text
:q
```

### `Table doesn't exist`

Falta ejecutar una migración o importar correctamente la base de datos.

Volver a ejecutar el SQL correspondiente desde phpMyAdmin.

### La cámara no funciona

* La cámara funciona en un celular físico.
* Verificar los permisos de cámara de Expo Go.
* Revisar que `app.json` tenga configurado el plugin de `expo-camera`.

### El escáner no detecta códigos

* Utilizar buena iluminación.
* Mantener el celular aproximadamente a 10–15 cm del código.
* Verificar que el código exista en la base de datos.
* Formatos soportados:

  * EAN-13
  * EAN-8
  * UPC-A
  * UPC-E
  * Code-128
  * Code-39
  * QR

### Reportes PDF o Excel no se generan

Verificar que estén instalados:

* `expo-print`
* `expo-sharing`
* `expo-file-system/legacy`
* `xlsx`

También revisar los permisos del sistema.

### Errores de TypeScript

Ejecutar:

```powershell
cd frontend
npx tsc --noEmit
```

Errores comunes:

* Imports duplicados.
* Módulos faltantes.
* `useNavigation` tipado incorrectamente.

---

## 14. Notas importantes de instalación

### Hashes de contraseñas placeholder

El archivo `sql/tienda_db.sql` incluye dos usuarios semilla con las contraseñas:

```text
admin123
vendedor123
```

Los hashes almacenados inicialmente son placeholders y no son hashes BCRYPT reales.

Por esta razón, el login de las cuentas demo puede fallar hasta regenerar los hashes.

Ejecutar:

```powershell
cd C:\xampp\htdocs\interworld
php scripts/fix-passwords.php
```

Debe mostrar:

```text
admin@tienda.com  → password_verify('admin123') = OK
vendedor@tienda.com → password_verify('vendedor123') = OK
```

### Verificación manual de los hashes

```powershell
mysql -u root tienda_db -e "SELECT id, email, LEFT(password_hash, 10) FROM usuarios;"
```

Los hashes deben comenzar con:

```text
$2y$10$
```

### Nombre de la carpeta del backend

Por defecto, el proyecto utiliza:

```text
C:\xampp\htdocs\interworld\
```

Si se cambia el nombre de la carpeta, actualizar:

1. `.htaccess`.
2. `.env`.
3. `test_completo.php`.

#### `.htaccess`

```apache
RewriteBase /NOMBRE_DE_TU_CARPETA/
```

#### `.env`

```env
APP_URL=http://localhost/NOMBRE_DE_TU_CARPETA
```

#### `test_completo.php`

```php
$base = 'http://localhost/NOMBRE_DE_TU_CARPETA/api';
```

Después de cambiar el nombre, reiniciar Apache.

### Orden correcto de instalación

Seguir este orden:

1. Copiar la carpeta a `htdocs` y renombrarla.
2. Ejecutar `composer install`.
3. Configurar `.env`.
4. Importar `sql/tienda_db.sql` en phpMyAdmin.
5. Ejecutar `php scripts/hash-passwords.php` o `php scripts/fix-passwords.php`.
6. Verificar:

```text
http://localhost/interworld/api/health
```

7. Ejecutar:

```powershell
php test_completo.php
```

Si múltiples endpoints muestran errores de autenticación, verificar primero que el login funcione correctamente.

### Verificación rápida de la instalación

Ejecutar:

```powershell
cd C:\xampp\htdocs\interworld

# 1. Verificar PHP y extensiones
php -m | findstr /C:"pdo_mysql" /C:"mbstring" /C:"openssl" /C:"curl" /C:"zip" /C:"gd"

# 2. Verificar sintaxis de los archivos principales
php -l index.php
php -l routes\api.php

# 3. Verificar conexión a la base de datos
php scripts\diagnostico.php

# 4. Verificar el health check
curl http://localhost/interworld/api/health

# 5. Ejecutar el test completo
php test_completo.php
```

Cada paso debe completarse sin errores antes de continuar.

### Tablas que deben existir

Después de importar `sql/tienda_db.sql`:

```powershell
mysql -u root tienda_db -e "SHOW TABLES;"
```

Deben existir estas 21 tablas:

```text
auditoria_logs
caja_movimientos
caja_sesiones
categorias
clientes
configuracion
devolucion_detalle
devoluciones
movimientos_inventario
negocios
notificaciones
orden_compra_detalle
ordenes_compra
pagos_credito
productos
promociones
proveedores
puntos_historial
usuarios
venta_detalle
ventas
```

### Resultado esperado del test completo

Cuando el backend está correctamente instalado:

```text
Total:    60
Pasaron:  60
Fallaron: 0
```

Si pasan menos de 60, revisar los errores agrupados por causa.

| Síntoma                                         | Causa                       | Solución                          |
| ----------------------------------------------- | --------------------------- | --------------------------------- |
| 55+ fallos con `Token de autenticación ausente` | Login inicial falló         | Ejecutar `fix-passwords.php`      |
| Fallos con `Table doesn't exist`                | Falta una tabla o migración | Importar `tienda_db.sql` completo |
| Registro de negocio falla por tabla `negocios`  | Falta la tabla `negocios`   | Reimportar `tienda_db.sql`        |
| Error de conexión                               | MySQL no está corriendo     | Arrancar MySQL en XAMPP           |
| Endpoint no encontrado                          | Problema con `RewriteBase`  | Revisar `.htaccess`               |

### Ver los logs del backend

Los errores se almacenan en:

```text
storage/logs/
```

Por ejemplo:

```powershell
cd C:\xampp\htdocs\interworld
Get-Content storage\logs\app-YYYY-MM-DD.log -Tail 40
```

Reemplazar `YYYY-MM-DD` por la fecha correspondiente.

Cada línea contiene información como:

* Timestamp.
* Nivel.
* Mensaje.
* Archivo.
* Línea.
* Contexto adicional.

### Modo debug

Para desarrollo:

```env
APP_DEBUG=true
```

Los errores muestran detalles adicionales.

Para producción:

```env
APP_DEBUG=false
```

Los usuarios reciben mensajes genéricos y los detalles permanecen en los logs.

Reiniciar Apache después de modificar este valor.

### Estado de `vendor/`

La carpeta `vendor/` contiene las dependencias instaladas por Composer.

No debe subirse a GitHub.

Al clonar el proyecto en otro equipo:

```powershell
composer install
```

### Estado de `.env`

El archivo `.env` contiene credenciales y secretos.

No debe subirse a GitHub.

Al clonar el proyecto:

1. Copiar `.env.example` a `.env`.
2. Configurar los valores específicos del entorno.
3. Generar un nuevo `JWT_SECRET`:

```powershell
php -r "echo base64_encode(random_bytes(48));"
```

Cada instalación debe tener su propio `JWT_SECRET`.

---

## 15. Roadmap

### Fase 1 — Completada

* Dashboard avanzado con gráficos.
* Reportes exportables a PDF y Excel.
* Búsqueda global.
* Devoluciones completas.
* Promociones.
* Órdenes de compra.
* Programa de lealtad.
* Onboarding y centro de ayuda.
* Multi-tenant con registro de negocios.

### Fase 2 — Próximamente

* Modo offline-first.
* Multi-sucursal.
* Impresión térmica ESC/POS Bluetooth.
* Notificaciones push reales.
* Backup y restore automático.
* Recuperación de contraseña por email.

### Fase 3 — Profesionalización

* Tests automatizados con PHPUnit y Jest.
* CI/CD con GitHub Actions.
* Sentry para manejo de errores.
* Analytics con Firebase.
* Logging avanzado con correlación de requests.

### Fase 4 — Nivel comercial

* Facturación electrónica DIAN.
* Integración con pasarelas de pago.
* Dashboard web.
* Aplicación para clientes.
* E-commerce integrado.
* API pública con OpenAPI.
* White label.

