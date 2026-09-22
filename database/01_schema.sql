-- =====================================================================
-- Moka Tcg (proyecto Poke-Platform TCG) — Esquema Relacional (Etapa 1)
-- Basado en el Modelo Entidad-Relación y Modelo Relacional del informe
-- "Poke-Platform TCG - Documento de Diseño de Software"
-- =====================================================================
-- Notas de diseño (ver README, sección "Supuestos y decisiones de diseño"):
-- - Se agrega `idioma` a CARTA_SINGLE (RF1: filtrar singles por idioma).
-- - Se agrega `idioma` a PRODUCTO_SELLADO (los sellados también se venden
--   en distintas versiones de idioma).
-- - `condicion` admite el valor DMG (Damaged) además de NM/LP/MP.
-- - Se agregan `descripcion` y `precio_sugerido` a PRODUCTO (ficha de
--   especificaciones y referencia de precio de mercado / Collectr).
-- =====================================================================

PRAGMA foreign_keys = ON;

DROP TABLE IF EXISTS DETALLE_ORDEN;
DROP TABLE IF EXISTS ORDEN_COMPRA;
DROP TABLE IF EXISTS CARTA_SINGLE;
DROP TABLE IF EXISTS PRODUCTO_SELLADO;
DROP TABLE IF EXISTS ACCESORIO;
DROP TABLE IF EXISTS PRODUCTO;
DROP TABLE IF EXISTS EXPANSION;
DROP TABLE IF EXISTS USUARIO;

-- ---------------------------------------------------------------------
-- USUARIO
-- ---------------------------------------------------------------------
CREATE TABLE USUARIO (
    id_usuario      INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre          VARCHAR(120)    NOT NULL,
    email           VARCHAR(160)    NOT NULL UNIQUE,
    direccion_envio VARCHAR(220),
    rol             VARCHAR(20)     NOT NULL DEFAULT 'cliente'
                        CHECK (rol IN ('cliente', 'administrador')),
    creado_en       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------
-- EXPANSION (set / colección)
-- ---------------------------------------------------------------------
CREATE TABLE EXPANSION (
    id_expansion    INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre_set      VARCHAR(120)    NOT NULL UNIQUE,
    fecha_lanzamiento DATE
);

-- ---------------------------------------------------------------------
-- PRODUCTO (tabla central — herencia PRODUCTO -> {CARTA_SINGLE,
-- PRODUCTO_SELLADO, ACCESORIO}, modelada en 3FN)
-- ---------------------------------------------------------------------
CREATE TABLE PRODUCTO (
    id_producto         INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre              VARCHAR(160)    NOT NULL,
    precio_actual       DECIMAL(10,2)   NOT NULL CHECK (precio_actual > 0),
    cantidad_disponible INTEGER         NOT NULL DEFAULT 0 CHECK (cantidad_disponible >= 0),
    tipo_producto       VARCHAR(20)     NOT NULL
                            CHECK (tipo_producto IN ('single', 'sellado', 'accesorio')),
    imagen_url          VARCHAR(255),
    descripcion         TEXT,
    precio_sugerido     DECIMAL(10,2)  -- referencia manual de mercado (ver integración Collectr en README)
);

-- ---------------------------------------------------------------------
-- CARTA_SINGLE (hereda de PRODUCTO)
-- ---------------------------------------------------------------------
CREATE TABLE CARTA_SINGLE (
    id_producto     INTEGER PRIMARY KEY,
    condicion       VARCHAR(20)     NOT NULL
                        CHECK (condicion IN ('NM', 'LP', 'MP', 'DMG')),
    rareza          VARCHAR(30)     NOT NULL,
    acabado         VARCHAR(20)     NOT NULL
                        CHECK (acabado IN ('Foil', 'Non-Foil', 'Reverse')),
    idioma          VARCHAR(5)      NOT NULL DEFAULT 'EN'
                        CHECK (idioma IN ('EN', 'ES', 'JP')),
    id_expansion    INTEGER         NOT NULL,
    FOREIGN KEY (id_producto) REFERENCES PRODUCTO(id_producto) ON DELETE CASCADE,
    FOREIGN KEY (id_expansion) REFERENCES EXPANSION(id_expansion) ON DELETE RESTRICT
);

-- ---------------------------------------------------------------------
-- PRODUCTO_SELLADO (hereda de PRODUCTO)
-- ---------------------------------------------------------------------
CREATE TABLE PRODUCTO_SELLADO (
    id_producto     INTEGER PRIMARY KEY,
    tipo_caja       VARCHAR(40)     NOT NULL, -- Booster Box, ETB, Bundle...
    idioma          VARCHAR(5)      NOT NULL DEFAULT 'EN'
                        CHECK (idioma IN ('EN', 'ES', 'JP')),
    FOREIGN KEY (id_producto) REFERENCES PRODUCTO(id_producto) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- ACCESORIO (hereda de PRODUCTO)
-- ---------------------------------------------------------------------
CREATE TABLE ACCESORIO (
    id_producto     INTEGER PRIMARY KEY,
    tipo            VARCHAR(40)     NOT NULL, -- sleeve, toploader, carpeta, dados
    marca           VARCHAR(60),
    FOREIGN KEY (id_producto) REFERENCES PRODUCTO(id_producto) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- ORDEN_COMPRA
-- ---------------------------------------------------------------------
CREATE TABLE ORDEN_COMPRA (
    id_orden        INTEGER PRIMARY KEY AUTOINCREMENT,
    id_usuario      INTEGER         NOT NULL,
    fecha           DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    total           DECIMAL(10,2)   NOT NULL CHECK (total >= 0),
    estado          VARCHAR(20)     NOT NULL DEFAULT 'pendiente'
                        CHECK (estado IN ('pendiente', 'pagado', 'enviado', 'cancelado')),
    metodo_envio    VARCHAR(20)     NOT NULL DEFAULT 'estandar',
    FOREIGN KEY (id_usuario) REFERENCES USUARIO(id_usuario) ON DELETE RESTRICT
);

-- ---------------------------------------------------------------------
-- DETALLE_ORDEN (entidad transaccional: relaciona USUARIO - PRODUCTO -
-- ORDEN_COMPRA, ver Caso de Uso 2 "Procesar Compra y Checkout")
-- ---------------------------------------------------------------------
CREATE TABLE DETALLE_ORDEN (
    id_detalle      INTEGER PRIMARY KEY AUTOINCREMENT,
    id_orden        INTEGER         NOT NULL,
    id_producto     INTEGER         NOT NULL,
    cantidad        INTEGER         NOT NULL CHECK (cantidad > 0),
    precio_historico DECIMAL(10,2)  NOT NULL CHECK (precio_historico > 0),
    FOREIGN KEY (id_orden) REFERENCES ORDEN_COMPRA(id_orden) ON DELETE CASCADE,
    FOREIGN KEY (id_producto) REFERENCES PRODUCTO(id_producto) ON DELETE RESTRICT
);

CREATE INDEX idx_carta_expansion ON CARTA_SINGLE(id_expansion);
CREATE INDEX idx_producto_tipo ON PRODUCTO(tipo_producto);
CREATE INDEX idx_detalle_orden ON DETALLE_ORDEN(id_orden);
