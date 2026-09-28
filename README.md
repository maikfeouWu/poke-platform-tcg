# Moka Tcg (proyecto Poke-Platform TCG)

*"Poke-Platform TCG — Documento de Diseño de Software"*
(Etienne Araya Cisternas): un e-commerce especializado en Pokémon TCG (cartas
sueltas, sellados y accesorios), con marca comercial **Moka Tcg**


## Cómo correrlo localmente

Requiere Node.js 22.23.2
#Teniendo la versión correcta de node.js, instalamos las dependencias
y luego nos permitiría ver la pagina.
cd poke-platform-tcg/backend
npm install
npm start

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
