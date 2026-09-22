INSERT INTO USUARIO (nombre, email, direccion_envio, rol) VALUES
 ('Valentina Rojas Muñoz', 'valentina.rojas@mail.com', 'Av. Providencia 1650, depto. 402, Providencia', 'cliente'),
 ('Etienne Araya', 'etienne.admin@mokatcg.cl', 'Bodega Central, Viña del Mar', 'administrador');

INSERT INTO EXPANSION (nombre_set, fecha_lanzamiento) VALUES
 ('Obsidiana Llameante', '2023-08-11'),
 ('Fuerzas Paradójicas', '2024-03-22'),
 ('Evoluciones Prismáticas', '2025-01-17'),
 ('Escarlata y Púrpura Base', '2023-03-31');

-- --- SINGLES (tipo_producto = 'single') -------------------------------
INSERT INTO PRODUCTO (id_producto, nombre, precio_actual, cantidad_disponible, tipo_producto, imagen_url, descripcion, precio_sugerido) VALUES
 (1, 'Charizard ex #199/165', 78500, 6, 'single', 'https://tcgplayer-cdn.tcgplayer.com/product/91144_in_1000x1000.jpg', 'Carta especial de la expansión Obsidiana Llameante. Ilustración a página completa, muy buscada por coleccionistas.', 81200),
 (2, 'Gardevoir ex #86', 46900, 11, 'single', 'https://tcgplayer-cdn.tcgplayer.com/product/534175_in_1000x1000.jpg', 'Pieza clave para mazos de sicoataque en formato estándar.', 45600),
 (3, 'Umbreon VMAX (Alt Art) #095', 312000, 2, 'single', 'https://tcgplayer-cdn.tcgplayer.com/product/246723_in_1000x1000.jpg', 'Alternate art de altísima demanda, tirada limitada en Evoluciones Prismáticas.', 328500),
 (4, 'Pikachu VMAX #044', 29400, 15, 'single', 'https://tcgplayer-cdn.tcgplayer.com/product/478424_in_1000x1000.jpg', 'Ideal para empezar una colección de la mascota de la franquicia.', 27900),
 (5, 'Lugia VSTAR (Alt Art) #188', 187300, 3, 'single', 'https://tcgplayer-cdn.tcgplayer.com/product/451995_in_1000x1000.jpg', 'Carta insignia de Escarlata y Púrpura Base, altísima demanda competitiva.', 195000),
 (6, 'Mew ex (Gold) #232', 142000, 4, 'single', 'https://tcgplayer-cdn.tcgplayer.com/product/517051_in_1000x1000.jpg', 'Versión dorada especial, número secreto de colección.', 149900),
 (7, 'Rayquaza VMAX (Alt Art) #111', 264800, 1, 'single', 'https://tcgplayer-cdn.tcgplayer.com/product/452034_in_1000x1000.jpg', 'Una de las alternate art más cotizadas de Fuerzas Paradójicas.', 271000),
 (8, 'Giratina VSTAR (Alt Art) #131', 298500, 0, 'single', 'https://tcgplayer-cdn.tcgplayer.com/product/478100_in_1000x1000.jpg', 'Pieza de vitrina, tirada muy limitada.', 305500),
 (9, 'Pidgey #016/091', 490, 40, 'single', 'https://tcgplayer-cdn.tcgplayer.com/product/502565_in_1000x1000.jpg', 'Carta común de relleno, ideal para completar la colección base.', 450),
 (10, 'Pikachu Promo (Liga de Entrenadores)', 12900, 7, 'single', 'https://tcgplayer-cdn.tcgplayer.com/product/528365_in_1000x1000.jpg', 'Carta promocional de torneo, no se vende en sobres — solo se entrega en eventos oficiales.', 13500);

INSERT INTO CARTA_SINGLE (id_producto, condicion, rareza, acabado, idioma, id_expansion) VALUES
 (1, 'NM', 'EX', 'Foil', 'EN', 1),
 (2, 'NM', 'EX', 'Foil', 'EN', 2),
 (3, 'MP', 'Alt Art', 'Reverse', 'JP', 3),
 (4, 'NM', 'Full Art', 'Non-Foil', 'EN', 1),
 (5, 'DMG', 'Alt Art', 'Foil', 'JP', 4),
 (6, 'NM', 'Hyper Rare', 'Foil', 'EN', 1),
 (7, 'NM', 'Alt Art', 'Foil', 'EN', 2),
 (8, 'NM', 'Alt Art', 'Foil', 'ES', 3),
 (9, 'NM', 'Comunes', 'Non-Foil', 'EN', 2),
 (10, 'NM', 'Promo Card', 'Foil', 'EN', 3);

-- --- SELLADOS (tipo_producto = 'sellado') ------------------------------
INSERT INTO PRODUCTO (id_producto, nombre, precio_actual, cantidad_disponible, tipo_producto, imagen_url, descripcion, precio_sugerido) VALUES
 (11, 'Booster Box · Evoluciones Prismáticas', 189900, 8, 'sellado', 'https://encrypted-tbn3.gstatic.com/shopping?q=tbn:ANd9GcR4NIepQ3jInZTWNtiCPJ9h7x3IFwFprFck98uuBoKXOzbEMneIitGpGSUAR8o-NrPVSnVe2eWTmYZ566nMvGvi0ZptXUN78Q', '36 sobres sellados de fábrica, edición en inglés.', 199900),
 (12, 'Elite Trainer Box · Fuerzas Paradójicas', 54900, 12, 'sellado', 'https://encrypted-tbn3.gstatic.com/shopping?q=tbn:ANd9GcTzx6lXiufekBp-M1ww59D7GCNF_qVgQ5l2bwz9X9WkorE9_E12Os3hYkJvCJkZXhkMKVsvyIWg9wIrG1agOirqh9tzaW11sr-GBOsslrXWtHFRTFouTzoP-w', 'Incluye 9 sobres, dados, fichas y una carta promo exclusiva.', 56900),
 (13, 'Bundle · Obsidiana Llameante (6 sobres)', 39900, 20, 'sellado', 'https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcT6MdXacpvuwWAC9FJDaE8fdQNTXUtmhawthk8ydz6BtroUSFMLiM1HjjwnrbR8boayM4VFjrGSiHDKBK9FuH2Xx8aWtcgQKy6v4jzH6utcQpmpzqrt38XHQuQ', 'Bundle de iniciación con 6 sobres y accesorios básicos.', 41500);

INSERT INTO PRODUCTO_SELLADO (id_producto, tipo_caja, idioma) VALUES
 (11, 'Booster Box', 'EN'),
 (12, 'Elite Trainer Box', 'ES'),
 (13, 'Bundle', 'JP');

-- --- ACCESORIOS (tipo_producto = 'accesorio') --------------------------
INSERT INTO PRODUCTO (id_producto, nombre, precio_actual, cantidad_disponible, tipo_producto, imagen_url, descripcion, precio_sugerido) VALUES
 (14, 'Deck Box Ultra Pro', 8900, 35, 'accesorio', 'https://encrypted-tbn1.gstatic.com/shopping?q=tbn:ANd9GcQZL1swV-CUPOgTkpV3KPdyU3qTGPAnqwSalxwlurkk9E9Le7_3wJ5Yy4ff-16O7sY7wlS_j6i601YO55N78vPAJUvwGWkeOP39X5ubioLmbi4RZq7DpJU__A', 'Caja rígida para 100 cartas en fundas, cierre magnético.', NULL),
 (15, 'Micas Toploader (x25)', 11400, 40, 'accesorio', 'https://elreinodelosduelos.cl/wp-content/uploads/2025/05/toploader-topdeck.jpg', 'Pack de 25 micas rígidas 3x4", protección premium.', NULL),
 (16, 'Carpeta Archivadora 9-Pocket', 15900, 18, 'accesorio', 'https://i5.walmartimages.com/seo/Ultra-Pro-9-Pocket-Pok-mon-Full-View-Pro-Binder-Poke-Ball_d7def256-b6f9-4a67-aa22-84e6c3798e5c_1.b4fe81847306f7108f8e37a6c72e027d.jpeg', 'Álbum de 360 cartas, bolsillos de carga lateral.', NULL),
 (17, 'Dados Competitivos (set x6)', 5900, 50, 'accesorio', 'https://encrypted-tbn2.gstatic.com/shopping?q=tbn:ANd9GcRrdiA1tkKUlU353k4WAQENiMosIbktabXwyPyYJe6S7ySaxQbseDbbpdg25wsEWMIM37HXFPT4nqlrGsLkVu9fbZq97rRMOrsTHohLBLER', 'Set de 6 dados acrílicos para contar daño y efectos.', NULL);

INSERT INTO ACCESORIO (id_producto, tipo, marca) VALUES
 (14, 'Deck Box', 'Ultra Pro'),
 (15, 'Toploader', 'Ultra Pro'),
 (16, 'Carpeta', 'Vault X'),
 (17, 'Dados', 'Moka Tcg');

-- --- Órdenes de ejemplo -------------------------------------------------
INSERT INTO ORDEN_COMPRA (id_orden, id_usuario, total, estado, metodo_envio) VALUES
 (1, 1, 468990, 'pendiente', 'estandar');

INSERT INTO DETALLE_ORDEN (id_orden, id_producto, cantidad, precio_historico) VALUES
 (1, 1, 1, 78500),
 (1, 5, 1, 187300),
 (1, 11, 1, 189900),
 (1, 14, 1, 8900),
 (1, 15, 1, 11400);
