-- =====================================================================
-- Moka Tcg (proyecto Poke-Platform TCG) — Datos de ejemplo (Etapa 1)
-- =====================================================================

INSERT INTO USUARIO (nombre, email, direccion_envio, rol) VALUES
 ('Valentina Rojas Muñoz', 'valentina.rojas@mail.com', 'Av. Providencia 1650, depto. 402, Providencia', 'cliente'),
 ('Etienne Araya',         'etienne.admin@mokatcg.cl', 'Bodega Central, Viña del Mar', 'administrador');

INSERT INTO EXPANSION (nombre_set, fecha_lanzamiento) VALUES
 ('Obsidiana Llameante',        '2023-08-11'),
 ('Fuerzas Paradójicas',        '2024-03-22'),
 ('Evoluciones Prismáticas',    '2025-01-17'),
 ('Escarlata y Púrpura Base',   '2023-03-31');

-- --- SINGLES (tipo_producto = 'single') -------------------------------
-- Nota: imagen_url apunta a un servicio de imágenes de prueba
-- (placehold.co) solo para que el catálogo se vea funcionando de
-- inmediato. Reemplaza cada URL por la foto real que quieras usar
-- (ver instrucciones en el README, sección "Cambiar las imágenes").
INSERT INTO PRODUCTO (nombre, precio_actual, cantidad_disponible, tipo_producto, imagen_url, descripcion, precio_sugerido) VALUES
 ('Charizard ex #199/165',        78500,  6, 'single', 'https://placehold.co/400x560/c1443b/f1ead9?text=Charizard+ex', 'Carta especial de la expansión Obsidiana Llameante. Ilustración a página completa, muy buscada por coleccionistas.', 81200),
 ('Gardevoir ex #86',              46900, 11, 'single', 'https://placehold.co/400x560/4fb8ac/14141a?text=Gardevoir+ex', 'Pieza clave para mazos de sicoataque en formato estándar.', 45600),
 ('Umbreon VMAX (Alt Art) #095',  312000,  2, 'single', 'https://placehold.co/400x560/23232e/cf9d40?text=Umbreon+VMAX', 'Alternate art de altísima demanda, tirada limitada en Evoluciones Prismáticas.', 328500),
 ('Pikachu VMAX #044',             29400, 15, 'single', 'https://placehold.co/400x560/cf9d40/14141a?text=Pikachu+VMAX', 'Ideal para empezar una colección de la mascota de la franquicia.', 27900),
 ('Lugia VSTAR (Alt Art) #188',   187300,  3, 'single', 'https://placehold.co/400x560/1b1b23/e9e4d6?text=Lugia+VSTAR', 'Carta insignia de Escarlata y Púrpura Base, altísima demanda competitiva.', 195000),
 ('Mew ex (Gold) #232',           142000,  4, 'single', 'https://placehold.co/400x560/cf9d40/1b1b23?text=Mew+ex', 'Versión dorada especial, número secreto de colección.', 149900),
 ('Rayquaza VMAX (Alt Art) #111', 264800,  1, 'single', 'https://placehold.co/400x560/4fb8ac/1b1b23?text=Rayquaza+VMAX', 'Una de las alternate art más cotizadas de Fuerzas Paradójicas.', 271000),
 ('Giratina VSTAR (Alt Art) #131',298500,  0, 'single', 'https://placehold.co/400x560/23232e/c1443b?text=Giratina+VSTAR', 'Pieza de vitrina, tirada muy limitada.', 305500);

INSERT INTO CARTA_SINGLE (id_producto, condicion, rareza, acabado, idioma, id_expansion) VALUES
 (1, 'NM', 'Ultra Rare',  'Foil',     'EN', 1),
 (2, 'NM', 'Ultra Rare',  'Foil',     'EN', 2),
 (3, 'MP', 'Hyper Rare',  'Reverse',  'JP', 3),
 (4, 'NM', 'Ultra Rare',  'Non-Foil', 'EN', 1),
 (5, 'DMG', 'Hyper Rare', 'Foil',     'JP', 4),
 (6, 'NM', 'Hyper Rare',  'Foil',     'EN', 1),
 (7, 'NM', 'Hyper Rare',  'Foil',     'EN', 2),
 (8, 'NM', 'Hyper Rare',  'Foil',     'ES', 3);

-- --- SELLADOS (tipo_producto = 'sellado') ------------------------------
INSERT INTO PRODUCTO (nombre, precio_actual, cantidad_disponible, tipo_producto, imagen_url, descripcion, precio_sugerido) VALUES
 ('Booster Box · Evoluciones Prismáticas', 189900, 8, 'sellado', 'https://placehold.co/400x560/cf9d40/14141a?text=Booster+Box', '36 sobres sellados de fábrica, edición en inglés.', 199900),
 ('Elite Trainer Box · Fuerzas Paradójicas', 54900, 12, 'sellado', 'https://placehold.co/400x560/4fb8ac/14141a?text=ETB', 'Incluye 9 sobres, dados, fichas y una carta promo exclusiva.', 56900),
 ('Bundle · Obsidiana Llameante (6 sobres)', 39900, 20, 'sellado', 'https://placehold.co/400x560/23232e/e9e4d6?text=Bundle', 'Bundle de iniciación con 6 sobres y accesorios básicos.', 41500);

INSERT INTO PRODUCTO_SELLADO (id_producto, tipo_caja, idioma) VALUES
 (9,  'Booster Box',        'EN'),
 (10, 'Elite Trainer Box',  'ES'),
 (11, 'Bundle',             'JP');

-- --- ACCESORIOS (tipo_producto = 'accesorio') --------------------------
INSERT INTO PRODUCTO (nombre, precio_actual, cantidad_disponible, tipo_producto, imagen_url, descripcion) VALUES
 ('Deck Box Ultra Pro',       8900, 35, 'accesorio', 'https://placehold.co/400x560/1b1b23/cf9d40?text=Deck+Box', 'Caja rígida para 100 cartas en fundas, cierre magnético.'),
 ('Micas Toploader (x25)',   11400, 40, 'accesorio', 'https://placehold.co/400x560/1b1b23/4fb8ac?text=Toploaders', 'Pack de 25 micas rígidas 3x4", protección premium.'),
 ('Carpeta Archivadora 9-Pocket', 15900, 18, 'accesorio', 'https://placehold.co/400x560/23232e/e9e4d6?text=Carpeta', 'Álbum de 360 cartas, bolsillos de carga lateral.'),
 ('Dados Competitivos (set x6)', 5900, 50, 'accesorio', 'https://placehold.co/400x560/23232e/cf9d40?text=Dados', 'Set de 6 dados acrílicos para contar daño y efectos.');

INSERT INTO ACCESORIO (id_producto, tipo, marca) VALUES
 (12, 'Deck Box',   'Ultra Pro'),
 (13, 'Toploader',  'Ultra Pro'),
 (14, 'Carpeta',    'Vault X'),
 (15, 'Dados',      'Moka Tcg');

-- --- Orden de ejemplo (transacción USUARIO - PRODUCTO - ORDEN_COMPRA) --
INSERT INTO ORDEN_COMPRA (id_usuario, total, estado, metodo_envio) VALUES
 (1, 468990, 'pagado', 'estandar');

INSERT INTO DETALLE_ORDEN (id_orden, id_producto, cantidad, precio_historico) VALUES
 (1, 1, 1, 78500),
 (1, 5, 1, 187300),
 (1, 9, 1, 189900),
 (1, 12, 1, 8900),
 (1, 13, 1, 11400);
