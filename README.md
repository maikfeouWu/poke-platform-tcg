# Moka Tcg (proyecto Poke-Platform TCG)

*"Poke-Platform TCG — Documento de Diseño de Software"*
(Etienne Araya Cisternas): un e-commerce especializado en Pokémon TCG (cartas
sueltas, sellados y accesorios), con marca comercial **Moka Tcg**

## Qué cumple esta entrega (Etapa 1)

- [x] **Estructura de carpetas** (`backend/`, `frontend/`, `database/`).
- [x] **Conexión a BD creada y funcional**: SQLite embebida, se crea sola al
      primer arranque desde `database/01_schema.sql` + `02_seed.sql`.
- [x] **Invocación y ejecución de consultas a través de la app**: cada
      endpoint de `backend/routes/*.js` ejecuta las consultas reales sobre la
      base de datos (no hay datos hardcodeados en el frontend).
- [x] **Modelo relacional + diccionario de datos**: `database/01_schema.sql`
      y sección "Diccionario de datos" más abajo.
- [x] **13 consultas CRUD (2 ALTER, 3 SELECT con 2 JOIN, 2 UPDATE, 3 INSERT,
      2 DELETE, 1 DROP)**, con álgebra relacional para los SELECT:
      `database/03_consultas_crud.sql`.
- [x] **Caso de Uso "Consulta"**: catálogo de singles con filtro obligatorio
      de categoría y filtros opcionales de expansión, rareza, idioma,
      condición (incluye **Damaged/DMG**), acabado y rango de precio —
      `GET /api/productos`.
- [x] **Caso de Uso transaccional (3 entidades)**: checkout relaciona
      `USUARIO` – `PRODUCTO` – `ORDEN_COMPRA/DETALLE_ORDEN` en una única
      transacción SQL (`POST /api/ordenes`), siguiendo el diagrama de
      secuencia del informe (ValidarStock → AutorizarPago → DescontarStock →
      OrdenConfirmada).
- [x] **2 Mantenedores** (consultar/crear/modificar/eliminar): Productos
      (`/api/productos`, con campos propios por categoría, stock, precio
      sugerido y descripción editables) y Usuarios (`/api/usuarios`),
      disponibles en el panel `admin.html`.
- [x] **Cuenta de usuario**: alta y "inicio de sesión" simple por email en
      `cuenta.html` (sin contraseña — ver nota de alcance más abajo).
- [x] **Ficha de producto**: al hacer clic en cualquier carta se abre un
      modal con todas sus especificaciones y su descripción.

## Estructura del repositorio

```
poke-platform-tcg/
├── database/
│   ├── 01_schema.sql          # Modelo relacional (DDL)
│   ├── 02_seed.sql            # Datos de ejemplo
│   └── 03_consultas_crud.sql  # Las 13 consultas requeridas + álgebra relacional
├── backend/
│   ├── server.js              # Servidor Express (API + sirve el frontend)
│   ├── db.js                  # Inicializa la base SQLite desde /database
│   ├── routes/
│   │   ├── productos.js       # Catálogo + Mantenedor Productos
│   │   ├── usuarios.js        # Mantenedor Usuarios + login simple por email
│   │   └── ordenes.js         # Checkout transaccional + gestión de pedidos
│   └── package.json
└── frontend/
    ├── index.html              # Caso de Uso 1: Catálogo y Singles (+ ficha de producto)
    ├── checkout.html           # Caso de Uso 2: Carrito y Checkout (con miniaturas)
    ├── cuenta.html              # Crear cuenta / iniciar sesión
    ├── admin.html               # Mantenedores + gestión de pedidos
    ├── css/style.css            # Paleta Dark Mode violeta
    └── js/{api,catalogo,checkout,admin,cuenta}.js
```
## Cuenta de usuario (alcance de este proyecto)

`cuenta.html` permite **crear una cuenta** (nombre, email, dirección) y
**"iniciar sesión"** buscando esa cuenta por email — la sesión se guarda en
el navegador (`localStorage`) y el checkout la usa automáticamente para
pre-seleccionar al cliente. **No hay contraseña ni cifrado**: es
intencionalmente simple porque el foco de la Etapa 1 es el modelo de datos
y las transacciones SQL, no un sistema de autenticación. Si más adelante
necesitas login real, lo natural es agregar una columna `password_hash` a
`USUARIO` y usar una librería como `bcrypt` + tokens de sesión (JWT) — el
informe original ya contempla JWT para la Etapa 3.


## Diccionario de datos (extracto — DETALLE_ORDEN)

| Campo | Tipo | Nulo | Restricción/Clave | Descripción |
|---|---|---|---|---|
| id_detalle | INT | NO | PK | Identificador único de la línea de compra |
| id_orden | INT | NO | FK → orden_compra | Orden a la que pertenece |
| id_producto | INT | NO | FK → producto | Producto comprado |
| cantidad | INT | NO | CHECK(cantidad > 0) | Unidades compradas |
| precio_historico | DECIMAL | NO | CHECK(precio > 0) | Precio congelado al momento del checkout |

El resto de las tablas (`USUARIO`, `EXPANSION`, `PRODUCTO`, `CARTA_SINGLE`,
`PRODUCTO_SELLADO`, `ACCESORIO`, `ORDEN_COMPRA`) siguen la misma convención;
ver comentarios en `database/01_schema.sql`.

## Supuestos y decisiones de diseño

1. **Herencia PRODUCTO → {CARTA_SINGLE, PRODUCTO_SELLADO, ACCESORIO}**: se
   mantiene en 3FN tal como en el informe original, evitando columnas vacías
   (un accesorio no tiene rareza, una carta no tiene marca).
2. **Columna `idioma` en `CARTA_SINGLE`**: se agrega respecto del MER
   original del informe, porque el RF1 exige poder filtrar singles por
   idioma (EN/ES/JP) y esa columna no estaba modelada.
3. **`precio_historico` en `DETALLE_ORDEN`**: se conserva separado de
   `precio_actual` en `PRODUCTO` porque el mercado TCG es volátil — el
   precio de venta queda "congelado" al momento del checkout.
4. **Integridad referencial**: `PRODUCTO → DETALLE_ORDEN` usa
   `ON DELETE RESTRICT` (no se puede borrar un producto con ventas), y
   `ORDEN_COMPRA → DETALLE_ORDEN` usa `ON DELETE CASCADE` (al purgar una
   orden errónea se eliminan sus detalles).
5. **Pasarela de pago**: el checkout simula la aprobación de pago (siempre
   aprobado) para poder demostrar la transacción de BD completa sin
   depender de credenciales reales de Webpay/MercadoPago; el punto de
   integración queda marcado en `backend/routes/ordenes.js`.
