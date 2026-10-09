::: {align="center"}
# InterWorld

**Gestión comercial, punto de venta e inventario en una sola
plataforma.**

Aplicación móvil multiplataforma con API REST y arquitectura
multi-tenant para pequeños y medianos comercios.

[![React
Native](https://img.shields.io/badge/React_Native-0.86-61DAFB?style=flat-square&logo=react&logoColor=white)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-57-000020?style=flat-square&logo=expo&logoColor=white)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PHP](https://img.shields.io/badge/PHP-8.1%2B-777BB4?style=flat-square&logo=php&logoColor=white)](https://www.php.net/)
[![MySQL](https://img.shields.io/badge/MySQL-8-4479A1?style=flat-square&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![License:
MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)
:::

------------------------------------------------------------------------

## Contenido

-   [Descripción](#descripción)
-   [Funcionalidades](#funcionalidades)
-   [Tecnologías](#tecnologías)
-   [Arquitectura](#arquitectura)
-   [Estructura del proyecto](#estructura-del-proyecto)
-   [Requisitos](#requisitos)
-   [Instalación](#instalación)
-   [Configuración](#configuración)
-   [Ejecución](#ejecución)
-   [Pruebas](#pruebas)
-   [API](#api)
-   [Roles y permisos](#roles-y-permisos)
-   [Solución de problemas](#solución-de-problemas)
-   [Despliegue](#despliegue)
-   [Convenciones de desarrollo](#convenciones-de-desarrollo)
-   [Licencia](#licencia)
-   [Autor y soporte](#autor-y-soporte)

------------------------------------------------------------------------

## Descripción

**InterWorld** es una plataforma de gestión comercial que combina una
aplicación móvil multiplataforma con un backend API REST. Permite
administrar ventas, productos, inventario, clientes, promociones, caja y
reportes desde una solución centralizada.

Su arquitectura **multi-tenant** separa los datos de cada negocio para
que la información comercial de una organización no sea accesible desde
otra. La aplicación también contempla el registro de ventas sin conexión
y su sincronización posterior.

## Funcionalidades

### Punto de venta

-   Carrito de compra con control de inventario.
-   Búsqueda por nombre y código de barras.
-   Escaneo mediante la cámara del dispositivo.
-   Descuentos manuales y promociones automáticas.
-   Pagos en efectivo, tarjeta y transferencia.
-   Ventas a crédito con validación de cupo.
-   Registro offline con sincronización diferida.

### Productos e inventario

-   Gestión de productos y múltiples imágenes.
-   Rotación de imágenes antes de guardar.
-   Categorías y proveedores.
-   Movimientos de inventario: entradas, salidas y ajustes.
-   Alertas de stock bajo.
-   Historial de rendimiento por producto.

### Promociones

-   Descuentos por porcentaje o monto fijo.
-   Precio especial, 2x1 y 3x2.
-   Aplicación por producto, categoría o de forma global.
-   Fechas de vigencia y cantidades mínimas configurables.
-   Análisis de rentabilidad por promoción.

### Clientes y crédito

-   Información de contacto y ficha del cliente.
-   Cupo de crédito y saldo pendiente.
-   Estado de cuenta y pagos parciales.
-   Programa de fidelización con puntos y niveles.

### Caja

-   Apertura con monto inicial.
-   Registro de ingresos y egresos.
-   Registro automático de ventas.
-   Cierre con arqueo y cálculo de diferencias.
-   Historial de turnos.

### Reportes

-   Indicadores clave de desempeño (KPI).
-   Gráficos de ventas por día y hora.
-   Ranking de productos y clientes.
-   Distribución de ventas por método de pago.
-   Exportación a PDF y Excel.

### Seguridad

-   Autenticación mediante JWT (HS256).
-   Contraseñas protegidas con bcrypt.
-   Roles de administrador y vendedor.
-   Separación de datos por negocio.
-   Auditoría de acciones críticas.
-   Limitación de solicitudes en endpoints sensibles.

## Tecnologías

  -----------------------------------------------------------------------
  Área                    Tecnología              Propósito
  ----------------------- ----------------------- -----------------------
  Aplicación móvil        React Native 0.86       Interfaz
                                                  multiplataforma

  Runtime y herramientas  Expo 57                 Desarrollo y ejecución
                                                  móvil

  Lenguaje frontend       TypeScript 5.3          Tipado estático

  Estado global           Zustand                 Gestión del estado

  Formularios             React Hook Form + Zod   Formularios y
                                                  validación

  Navegación              React Navigation 7      Navegación entre
                                                  pantallas

  Cliente HTTP            Axios                   Comunicación con la API

  Imágenes                Expo Image Picker /     Selección y
                          Image Manipulator       procesamiento

  Gráficos                React Native Gifted     Visualización de datos
                          Charts                  

  Backend                 PHP 8.1+                API y lógica de negocio

  Base de datos           MySQL 8                 Persistencia relacional

  Acceso a datos          PDO                     Consultas a base de
                                                  datos

  Autenticación           JWT (HS256)             Autenticación sin
                                                  estado

  Logs                    Monolog                 Registro de eventos

  Correo                  PHPMailer               Envío de correos

  Dependencias PHP        Composer                Gestión de paquetes
  -----------------------------------------------------------------------

## Arquitectura

``` text
┌──────────────────────────────────────┐
│       Aplicación móvil               │
│  React Native · Expo · TypeScript    │
└──────────────────┬───────────────────┘
                   │ HTTPS / JSON
                   │ Authorization: Bearer JWT
┌──────────────────▼───────────────────┐
│              API REST                │
│       PHP · Router · Middleware      │
│       Controllers · Services          │
└──────────────────┬───────────────────┘
                   │ PDO
┌──────────────────▼───────────────────┐
│           MySQL 8                     │
│       Datos aislados por negocio      │
└──────────────────────────────────────┘
```

### Flujo de una petición

1.  La aplicación envía una petición HTTP con el token JWT en
    `Authorization`.
2.  El middleware de autenticación valida el token y obtiene el
    identificador del negocio.
3.  El controlador procesa la petición.
4.  La capa de servicios ejecuta la lógica de negocio.
5.  Los modelos aplican el filtro correspondiente por `negocio_id`.
6.  La API devuelve una respuesta JSON estandarizada.

## Estructura del proyecto

``` text
Proyecto-App-InterWorld/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── core/
│   │   ├── Exceptions/
│   │   ├── Auth.php
│   │   ├── Logger.php
│   │   ├── Request.php
│   │   ├── Response.php
│   │   ├── Router.php
│   │   └── Validator.php
│   ├── database/
│   │   ├── migrations/
│   │   ├── seeds/
│   │   └── tienda_db.sql
│   ├── docs/
│   │   └── API.md
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── storage/
│   │   ├── logs/
│   │   ├── cache/
│   │   └── uploads/
│   ├── utils/
│   ├── .env.example
│   ├── composer.json
│   ├── index.php
│   └── test_e2e.php
└── frontend/
    ├── assets/
    ├── src/
    │   ├── api/
    │   ├── components/
    │   ├── data/
    │   ├── hooks/
    │   ├── i18n/
    │   ├── navigation/
    │   ├── screens/
    │   ├── services/
    │   ├── store/
    │   ├── theme/
    │   ├── types/
    │   └── utils/
    ├── __tests__/
    ├── .env.example
    ├── App.tsx
    ├── app.json
    ├── babel.config.js
    ├── index.ts
    ├── jest.config.js
    ├── package.json
    └── tsconfig.json
```

> La estructura anterior resume los directorios y archivos principales
> del proyecto.

## Requisitos

Antes de instalar, asegúrate de contar con:

  Herramienta   Versión
  ------------- -------------------------------------------
  Node.js       18.x o superior
  npm           9.x o superior
  Git           2.x o superior
  PHP           8.1 o superior
  MySQL         8
  Composer      2.x
  XAMPP         Con Apache, PHP y MySQL
  Expo Go       Versión reciente, en el dispositivo móvil

Verifica las instalaciones:

``` bash
node --version
npm --version
git --version
php --version
composer --version
```

## Instalación

### 1. Clonar el repositorio

``` bash
git clone https://github.com/tu-usuario/interworld.git
cd interworld
```

Reemplaza `tu-usuario` por el usuario u organización real de GitHub.

### 2. Preparar el backend

Si utilizas XAMPP en Windows, copia el backend al directorio de Apache:

``` powershell
Copy-Item -Recurse -Path ".\backend" -Destination "C:\xampp\htdocs\tiendaapi"
```

Instala las dependencias:

``` bash
cd C:/xampp/htdocs/tiendaapi
composer install
```

Crea el archivo de entorno a partir de la plantilla:

``` bash
cp .env.example .env
```

En Windows, también puedes copiar `.env.example` manualmente y nombrar
la copia `.env`.

### 3. Crear e importar la base de datos

1.  Abre el panel de XAMPP.
2.  Inicia Apache y MySQL.
3.  Entra en [phpMyAdmin](http://localhost/phpmyadmin).
4.  Crea una base de datos llamada `tienda_db` con cotejamiento
    `utf8mb4_unicode_ci`.
5.  Selecciona la base de datos e importa
    `backend/database/tienda_db.sql`.

Si el proyecto dispone de un script de migraciones configurado, puedes
usar el procedimiento definido por ese script. Verifica que la ruta
exista antes de ejecutarlo.

### 4. Comprobar el backend

Con Apache y MySQL activos, abre:

``` text
http://localhost/tiendaapi/api/auth/me
```

Sin un token de autenticación, se espera una respuesta similar a:

``` json
{
  "success": false,
  "data": null,
  "message": "Token de autenticación ausente."
}
```

### 5. Instalar el frontend

Desde la raíz del repositorio:

``` bash
cd frontend
npm install
```

Si npm informa de conflictos de dependencias, prueba esta alternativa
solo si es necesario:

``` bash
npm install --legacy-peer-deps
```

### 6. Configurar la conexión del frontend

Copia la plantilla:

``` bash
cp .env.example .env
```

En Windows, consulta la dirección IPv4 local:

``` powershell
ipconfig
```

Edita `frontend/.env` y reemplaza la IP de ejemplo por la dirección de
tu equipo.

### 7. Configurar el firewall de Windows, si hace falta

En PowerShell ejecutado como administrador:

``` powershell
New-NetFirewallRule `
  -DisplayName "XAMPP HTTP" `
  -Direction Inbound `
  -Protocol TCP `
  -LocalPort 80 `
  -Action Allow
```

Abre únicamente los puertos necesarios para tu entorno y red.

## Configuración

### Backend: `backend/.env`

Configura las variables de entorno según tu instalación:

``` env
APP_URL=http://localhost/tiendaapi
APP_ENV=development
APP_DEBUG=true

DB_HOST=localhost
DB_PORT=3306
DB_NAME=tienda_db
DB_USER=root
DB_PASS=
DB_CHARSET=utf8mb4

JWT_SECRET=REEMPLAZAR_POR_UN_SECRETO_ALEATORIO
JWT_EXP_MINUTES=43200

UPLOAD_MAX_SIZE=5242880
UPLOAD_ALLOWED=image/jpeg,image/png,image/webp

CORS_ALLOWED_ORIGINS=*
```

Genera un secreto aleatorio para JWT:

``` bash
openssl rand -base64 64
```

Copia el resultado en `JWT_SECRET`. No compartas este valor ni lo subas
al repositorio.

**Antes de producción:** desactiva el modo debug, configura credenciales
seguras y limita CORS a los orígenes autorizados. No uses
`CORS_ALLOWED_ORIGINS=*` como configuración de producción.

### Frontend: `frontend/.env`

``` env
EXPO_PUBLIC_API_URL=http://192.168.1.45/tiendaapi/api
EXPO_PUBLIC_APP_NAME=InterWorld
EXPO_PUBLIC_APP_VERSION=2.0.0
EXPO_PUBLIC_MONEDA_DEFAULT=COP
EXPO_PUBLIC_SIMBOLO_MONEDA_DEFAULT=$
```

Cambia `192.168.1.45` por la IP local de tu equipo. La URL debe ser
accesible desde el dispositivo que ejecuta Expo Go.

Después de modificar variables de entorno, reinicia Expo limpiando la
caché:

``` bash
npx expo start -c
```

> Las variables `EXPO_PUBLIC_*` quedan accesibles desde la aplicación
> cliente. No guardes contraseñas, claves privadas ni secretos del
> servidor en ellas.

## Ejecución

### Aplicación móvil

1.  Inicia Apache y MySQL desde XAMPP.
2.  En una terminal, ejecuta:

``` bash
cd frontend
npx expo start -c
```

3.  Abre Expo Go en el teléfono.
4.  Escanea el código QR que aparece en la terminal.

El teléfono y el ordenador deben estar conectados a la misma red Wi-Fi,
y el backend debe ser accesible desde el teléfono.

### Ejecutar en navegador

``` bash
cd frontend
npx expo start --web
```

Algunas funciones nativas, como el acceso a la cámara, pueden no estar
disponibles en el navegador.

### Emulador Android

``` bash
npx expo start --android
```

### Simulador iOS

Disponible en macOS con el entorno de desarrollo de iOS configurado:

``` bash
npx expo start --ios
```

### Atajos de Metro

  Tecla        Acción
  ------------ -----------------------------
  `r`          Recargar la aplicación
  `m`          Abrir el menú de desarrollo
  `j`          Abrir el depurador
  `Ctrl + C`   Detener el servidor

## Pruebas

### Backend: pruebas end-to-end

Con Apache y MySQL activos, ejecuta desde el directorio real del
backend:

``` bash
php test_e2e.php
```

La documentación original registra una ejecución de referencia con 38
pruebas aprobadas y 0 fallidas. El resultado actual debe confirmarse
ejecutando el comando en tu entorno.

Las pruebas cubren, entre otras áreas:

-   Registro de negocio y autenticación.
-   Validación de JWT.
-   CRUD de categorías, productos, clientes y proveedores.
-   Estadísticas de productos y promociones.
-   Apertura, movimientos y cierre de caja.
-   Ventas de contado y a crédito.
-   Distribución de descuentos por línea.
-   Dashboard y aislamiento multi-tenant.

### Frontend: Jest

``` bash
cd frontend
npm test
```

Modo observación:

``` bash
npm run test:watch
```

Cobertura:

``` bash
npm test -- --coverage
```

### Verificación de TypeScript

``` bash
npx tsc --noEmit
```

Ejecuta el comando desde `frontend/`. La documentación original menciona
más de 190 pruebas distribuidas en 13 suites; comprueba el estado actual
mediante Jest.

## API

URL base local:

``` text
http://localhost/tiendaapi/api
```

Las respuestas siguen una estructura JSON común:

``` json
{
  "success": true,
  "data": {},
  "message": "Operación exitosa"
}
```

### Autenticación

  ---------------------------------------------------------------------------------
  Método            Endpoint                    Descripción       Autenticación
  ----------------- --------------------------- ----------------- -----------------
  `POST`            `/auth/registrar-negocio`   Registrar negocio No
                                                y administrador   

  `POST`            `/auth/login`               Iniciar sesión    No

  `POST`            `/auth/logout`              Cerrar sesión     Sí

  `GET`             `/auth/me`                  Consultar usuario Sí
                                                actual            

  `POST`            `/auth/register`            Crear usuario     Admin
  ---------------------------------------------------------------------------------

### Productos

  Método     Endpoint                         Descripción
  ---------- -------------------------------- ------------------------------------
  `GET`      `/productos`                     Listar productos y aplicar filtros
  `POST`     `/productos`                     Crear producto
  `GET`      `/productos/{id}`                Consultar producto
  `PUT`      `/productos/{id}`                Actualizar producto
  `DELETE`   `/productos/{id}`                Desactivar producto
  `GET`      `/productos/buscar?codigo=X`     Buscar por código de barras
  `GET`      `/productos/stock-bajo`          Consultar stock bajo
  `GET`      `/productos/{id}/estadisticas`   Consultar rendimiento

### Ventas

  Método   Endpoint                Descripción
  -------- ----------------------- ---------------------------
  `GET`    `/ventas`               Listar ventas con filtros
  `POST`   `/ventas`               Registrar venta
  `GET`    `/ventas/{id}`          Consultar detalle
  `POST`   `/ventas/{id}/anular`   Anular venta

### Caja

  Método   Endpoint                   Descripción
  -------- -------------------------- --------------------------
  `GET`    `/caja/estado`             Consultar estado de caja
  `POST`   `/caja/abrir`              Abrir caja
  `POST`   `/caja/{id}/cerrar`        Cerrar caja
  `POST`   `/caja/{id}/movimientos`   Registrar movimiento
  `GET`    `/caja/{id}/movimientos`   Listar movimientos
  `GET`    `/caja/historial`          Consultar historial

### Otros módulos

  Método     Endpoint                 Descripción
  ---------- ------------------------ ---------------------------
  `GET`      `/dashboard/avanzado`    Consultar dashboard
  `GET`      `/promociones`           Listar promociones
  `POST`     `/promociones`           Crear promoción
  `DELETE`   `/promociones/{id}`      Eliminar promoción
  `GET`      `/clientes`              Listar clientes
  `POST`     `/clientes`              Crear cliente
  `POST`     `/clientes/{id}/pagos`   Registrar pago de cliente

La referencia anterior es un resumen de los endpoints documentados.
Consulta `backend/docs/API.md` para conocer parámetros, validaciones y
respuestas completas.

Las rutas protegidas requieren el encabezado:

``` http
Authorization: Bearer <token>
```

## Roles y permisos

  Acción                      Administrador   Vendedor
  -------------------------- --------------- ----------
  Ver dashboard                    Sí            Sí
  Vender en el POS                 Sí            Sí
  Consultar productos              Sí            Sí
  Crear y editar productos         Sí            No
  Desactivar productos             Sí            No
  Abrir y cerrar caja              Sí            No
  Gestionar clientes               Sí            Sí
  Ver reportes                     Sí            No
  Gestionar usuarios               Sí            No
  Gestionar proveedores            Sí            No
  Configurar el negocio            Sí            No
  Consultar auditoría              Sí            No

Según la documentación del proyecto, los usuarios vendedores se crean
desde **Más → Usuarios → Nuevo**.

## Solución de problemas

### La aplicación muestra `Network error`

1.  Comprueba que Apache y MySQL estén activos.

2.  Verifica el backend en el ordenador:

    ``` text
    http://localhost/tiendaapi/api/auth/me
    ```

3.  Abre desde el teléfono la misma ruta usando la IP local del
    ordenador.

4.  Confirma que ambos dispositivos estén en la misma red Wi-Fi.

5.  Revisa `EXPO_PUBLIC_API_URL` en `frontend/.env`.

6.  Comprueba las reglas del firewall.

7.  Reinicia Expo:

    ``` bash
    npx expo start -c
    ```

### Token inválido o expirado

-   Cierra la sesión e inicia sesión de nuevo.
-   Si el problema persiste, limpia los datos de almacenamiento de la
    aplicación desde las herramientas de desarrollo disponibles.

### Pantalla en blanco

-   Abre el menú de desarrollo de Expo Go.
-   Limpia la caché o los datos locales de la aplicación si corresponde.
-   Cierra y vuelve a abrir la aplicación.
-   Revisa los errores de Metro y de la consola.

### Apache no inicia

Puede existir un conflicto con el puerto 80.

1.  Identifica qué proceso utiliza el puerto.
2.  Si procede, cambia la configuración de Apache, por ejemplo a `8080`.
3.  Reinicia Apache.
4.  Actualiza `EXPO_PUBLIC_API_URL` con el puerto configurado.

### MySQL no inicia

Revisa los registros de MySQL y comprueba si existe otro proceso usando
el puerto o si hay errores en los archivos de datos. Antes de modificar
o reemplazar el directorio de datos, realiza una copia de seguridad y
sigue un procedimiento de recuperación adecuado.

### Error 500 en el backend

Consulta los logs del backend. En PowerShell, desde la carpeta del
backend:

``` powershell
Get-ChildItem storage\logs\ |
  Sort-Object LastWriteTime -Descending |
  Select-Object -First 1 |
  Get-Content -Tail 30
```

No compartas públicamente registros que contengan tokens, credenciales u
otros datos sensibles.

### `npm install` falla con `ERESOLVE`

Prueba, si es necesario:

``` bash
npm install --legacy-peer-deps
```

Si el error continúa, revisa las versiones de Node.js y las dependencias
declaradas en `package.json`.

### Verificación del aislamiento multi-tenant

Comprueba que la autenticación identifique el negocio actual y que las
consultas de los modelos apliquen el filtro por `negocio_id`. Ejecuta
las pruebas end-to-end para verificar el aislamiento entre negocios.

## Despliegue

### Backend en hosting compartido

1.  Sube el backend al servidor.

2.  Crea la base de datos y configura sus credenciales.

3.  Define las variables de entorno de producción.

4.  Instala dependencias sin paquetes de desarrollo:

    ``` bash
    composer install --no-dev --optimize-autoloader
    ```

5.  Habilita HTTPS.

6.  Restringe CORS a los dominios autorizados.

7.  Verifica permisos de archivos y directorios, especialmente los de
    almacenamiento.

### Backend en VPS

1.  Prepara el servidor web, PHP-FPM y MySQL.
2.  Configura Nginx o el servidor elegido para publicar la API.
3.  Instala un certificado TLS, por ejemplo con Certbot.
4.  Configura las variables de entorno y permisos.
5.  Restringe CORS y revisa logs, copias de seguridad y acceso a la base
    de datos.

### Aplicación móvil con EAS

``` bash
cd frontend
npm install -g eas-cli
eas login
eas build:configure
eas build --platform android
eas build --platform ios
```

La compilación para iOS requiere la configuración y las credenciales
correspondientes de Apple.

Para publicar, sigue los procesos de cada tienda. La documentación
original contempla Google Play mediante el archivo `.aab` y App Store
mediante EAS Submit.

## Convenciones de desarrollo

### Commits

Usa mensajes breves y descriptivos siguiendo una convención consistente:

  Prefijo       Uso
  ------------- ---------------------------------
  `feat:`       Nueva funcionalidad
  `fix:`        Corrección de errores
  `docs:`       Documentación
  `style:`      Formato sin cambios funcionales
  `refactor:`   Reorganización interna
  `test:`       Pruebas
  `chore:`      Mantenimiento

Ejemplo:

``` bash
git commit -m "feat: agrega gestión de promociones"
```

### Ramas

``` text
main
develop
feature/nombre-funcionalidad
fix/nombre-correccion
```

### Flujo de trabajo sugerido

``` bash
git checkout develop
git pull origin develop
git checkout -b feature/nueva-funcionalidad

# Realizar los cambios
git add .
git commit -m "feat: agrega nueva funcionalidad"
git push origin feature/nueva-funcionalidad

# Después, abrir un Pull Request hacia develop
```

### Estilo de código

-   TypeScript con modo estricto.
-   ESLint y Prettier, según la configuración del proyecto.
-   Componentes en `PascalCase`.
-   Funciones y variables en `camelCase`.
-   Constantes en `UPPER_SNAKE_CASE`.
-   Componentes React Native en archivos `.tsx`.

## Licencia

Este proyecto se distribuye bajo la licencia **MIT**. Consulta el
archivo [`LICENSE`](LICENSE) para ver los términos completos.

## Autor y soporte

**Antony Peña**

-   GitHub: [@tu-usuario](https://github.com/tu-usuario)
-   Correo: `tu@correo.com`

> Actualiza el usuario de GitHub y el correo antes de publicar el
> repositorio.

Para reportar un error o proponer una mejora:

1.  Comprueba si ya existe un issue relacionado.
2.  Crea un issue con una descripción clara.
3.  Incluye los pasos para reproducir el problema.
4.  Adjunta capturas y logs relevantes, eliminando previamente cualquier
    dato sensible.

------------------------------------------------------------------------

::: {align="center"}
**InterWorld**

*Tecnología para una gestión comercial más simple.*
:::
