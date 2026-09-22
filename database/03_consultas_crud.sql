-- =====================================================================
-- Moka Tcg (proyecto Poke-Platform TCG) — 13 Consultas CRUD requeridas
-- 2 ALTER, 3 SELECT (2 con JOIN), 2 UPDATE, 3 INSERT, 2 DELETE, 1 DROP
-- Estas mismas consultas son las que invoca el backend (ver /backend).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) ALTER — agrega columna de descuento por coleccionista a PRODUCTO
-- ---------------------------------------------------------------------
ALTER TABLE PRODUCTO ADD COLUMN descuento_coleccionista DECIMAL(5,2) NOT NULL DEFAULT 0;

-- ---------------------------------------------------------------------
-- 2) ALTER — agrega columna de método de envío elegido a ORDEN_COMPRA
-- ---------------------------------------------------------------------
ALTER TABLE ORDEN_COMPRA ADD COLUMN metodo_envio VARCHAR(20) NOT NULL DEFAULT 'estandar';


-- ---------------------------------------------------------------------
-- 3) SELECT — Consulta de catálogo de singles con filtros obligatorios
--    (tipo_producto) + opcionales (id_expansion, rareza, idioma,
--    condicion, acabado, rango de precio). Usada en GET /api/productos.
--
--    Álgebra relacional:
--    π nombre, precio_actual, cantidad_disponible, condicion, rareza,
--      acabado, idioma, nombre_set (
--        σ tipo_producto='single' ∧ id_expansion=:exp ∧ rareza=:rareza (
--          PRODUCTO ⋈(id_producto) CARTA_SINGLE ⋈(id_expansion) EXPANSION
--        )
--      )
--    Nota: id_expansion es opcional en la app (filtro no obligatorio);
--    condicion admite además el valor 'DMG' (Damaged).
-- ---------------------------------------------------------------------
SELECT
    p.id_producto,
    p.nombre,
    p.precio_actual,
    p.cantidad_disponible,
    cs.condicion,
    cs.rareza,
    cs.acabado,
    cs.idioma,
    e.nombre_set
FROM PRODUCTO p
JOIN CARTA_SINGLE cs ON cs.id_producto = p.id_producto
JOIN EXPANSION e     ON e.id_expansion = cs.id_expansion
WHERE p.tipo_producto = 'single'
  AND e.id_expansion   = COALESCE(:id_expansion, e.id_expansion)
  AND cs.rareza        = COALESCE(:rareza, cs.rareza)
  AND cs.idioma        = COALESCE(:idioma, cs.idioma)
  AND cs.condicion     = COALESCE(:condicion, cs.condicion)
  AND cs.acabado       = COALESCE(:acabado, cs.acabado)
  AND p.precio_actual  BETWEEN COALESCE(:precio_min, 0) AND COALESCE(:precio_max, 999999999)
ORDER BY p.precio_actual ASC;

-- ---------------------------------------------------------------------
-- 4) SELECT — Historial de compras de un usuario (JOIN triple:
--    USUARIO - ORDEN_COMPRA - DETALLE_ORDEN - PRODUCTO)
--
--    Álgebra relacional:
--    π nombre, fecha, estado, nombre_producto, cantidad, precio_historico (
--      σ id_usuario=:id (
--        USUARIO ⋈ ORDEN_COMPRA ⋈ DETALLE_ORDEN ⋈ PRODUCTO
--      )
--    )
-- ---------------------------------------------------------------------
SELECT
    u.nombre        AS cliente,
    oc.id_orden,
    oc.fecha,
    oc.estado,
    pr.nombre       AS producto,
    d.cantidad,
    d.precio_historico
FROM USUARIO u
JOIN ORDEN_COMPRA oc  ON oc.id_usuario = u.id_usuario
JOIN DETALLE_ORDEN d  ON d.id_orden    = oc.id_orden
JOIN PRODUCTO pr      ON pr.id_producto = d.id_producto
WHERE u.id_usuario = :id_usuario
ORDER BY oc.fecha DESC;

-- ---------------------------------------------------------------------
-- 5) SELECT — Stock crítico por tipo de producto (sin JOIN)
--
--    Álgebra relacional:
--    π nombre, tipo_producto, cantidad_disponible (
--        σ cantidad_disponible <= 3 (PRODUCTO)
--    )
-- ---------------------------------------------------------------------
SELECT nombre, tipo_producto, cantidad_disponible
FROM PRODUCTO
WHERE cantidad_disponible <= 3
ORDER BY cantidad_disponible ASC;


-- ---------------------------------------------------------------------
-- 6) UPDATE — descuenta stock definitivo tras confirmar el pago
--    (paso "DescontarStock()" del diagrama de secuencia de checkout)
-- ---------------------------------------------------------------------
UPDATE PRODUCTO
SET cantidad_disponible = cantidad_disponible - :cantidad
WHERE id_producto = :id_producto
  AND cantidad_disponible >= :cantidad;

-- ---------------------------------------------------------------------
-- 7) UPDATE — actualiza el estado de un pedido (mantenedor Administrador)
-- ---------------------------------------------------------------------
UPDATE ORDEN_COMPRA
SET estado = :nuevo_estado
WHERE id_orden = :id_orden;


-- ---------------------------------------------------------------------
-- 8) INSERT — crea la orden de compra (cabecera del checkout)
-- ---------------------------------------------------------------------
INSERT INTO ORDEN_COMPRA (id_usuario, total, estado, metodo_envio)
VALUES (:id_usuario, :total, 'pendiente', :metodo_envio);

-- ---------------------------------------------------------------------
-- 9) INSERT — agrega una línea de detalle a una orden (congela el precio)
-- ---------------------------------------------------------------------
INSERT INTO DETALLE_ORDEN (id_orden, id_producto, cantidad, precio_historico)
VALUES (:id_orden, :id_producto, :cantidad, :precio_historico);

-- ---------------------------------------------------------------------
-- 10) INSERT — alta de un nuevo producto (mantenedor Productos)
-- ---------------------------------------------------------------------
INSERT INTO PRODUCTO (nombre, precio_actual, cantidad_disponible, tipo_producto, imagen_url, descripcion, precio_sugerido)
VALUES (:nombre, :precio_actual, :cantidad_disponible, :tipo_producto, :imagen_url, :descripcion, :precio_sugerido);


-- ---------------------------------------------------------------------
-- 11) DELETE — elimina un usuario que no tiene órdenes asociadas
--     (mantenedor Usuarios; RESTRICT impide borrarlo si ya compró)
-- ---------------------------------------------------------------------
DELETE FROM USUARIO
WHERE id_usuario = :id_usuario;

-- ---------------------------------------------------------------------
-- 12) DELETE — elimina una orden de compra errónea
--     (CASCADE elimina automáticamente sus DETALLE_ORDEN)
-- ---------------------------------------------------------------------
DELETE FROM ORDEN_COMPRA
WHERE id_orden = :id_orden;


-- ---------------------------------------------------------------------
-- 13) DROP — elimina una tabla de staging usada solo para la carga
--     inicial de precios de mercado (no forma parte del modelo final)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS STAGING_PRECIOS_MERCADO;
