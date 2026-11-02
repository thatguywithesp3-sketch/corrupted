# Порт-Аурум у вікні кабінету — промпти

Вигляд міста з вікна кабінету героя. Для кожної епохи потрібні **3 стани: ніч, ранок, вечір**. Разом 21 зображення.

**Куди класти:** `public/art/city/eN-night.jpg`, `eN-morning.jpg`, `eN-evening.jpg`, де N — номер епохи від 1 до 7. Наприклад, `e1-night.jpg`.

Гра підхоплює файли сама. Якщо файлу немає, у вікні показується намальоване кодом місто.

**Формат:** горизонтальний 16:9, не менше 1536×864. Вікно обрізає краї, тому найважливіше має бути в центрі. Орієнтовно: горизонт на рівні 55–60% висоти, головні силуети в середній третині.

## Як збирати промпт

Промпт складається з трьох блоків: **МІСТО + ЕПОХА + ЧАС ДОБИ**.

- **Місто** однакове для всіх 21 зображень. Тому Порт-Аурум у кожній епосі впізнаваний: той самий пагорб із банями ліворуч, та сама ратушна вежа, та сама гавань праворуч. Змінюється лише те, що місто набудувало або зруйнувало за епоху.
- **Епоха** задає, що в місті з'явилося, і техніку друку.
- **Час доби** задає небо, світло й вогні.

Наприкінці кожного промпту додавайте блок **ЗАБОРОНИ**.

### МІСТО (завжди)

```
Wide panoramic view of the fictional EASTERN EUROPEAN harbour city "Port-Aurum", seen from an upper-floor office window, an imagined blend of Lviv, Kyiv, Odesa, Kraków, Prague and Riga.
Fixed layout: on the LEFT a green hill with a baroque monastery and a cluster of golden onion domes and pear-shaped baroque cupolas; next to it a tall Renaissance town-hall clock tower with a spire.
In the CENTRE a grand opera house and a columned bank facing a cobbled market square.
In the FOREGROUND dense rows of narrow colourful tenement houses with steep red tile and tin roofs, attic dormers, wrought-iron balconies, crooked chimneys.
On the RIGHT a wide river-mouth harbour with a long stone embankment, grain warehouses, cranes, ships, and a lighthouse on a far spit.
Rich texture everywhere: plaster, tiles, timber, stone, cobbles. Horizon at about 55–60% of the height, key silhouettes in the middle third.
```

### ЗАБОРОНИ (завжди)

```
No people in focus, no readable text, no letters, no numbers, no flags, no coats of arms, no stars, no sickle and hammer, no real brand logos, no national symbols.
```

### ЧАС ДОБИ

| Стан | Блок |
|---|---|
| **Ніч** (`night`) | `NIGHT: moon behind thin clouds, deep blue sky, warm lit windows scattered across the city, street lights reflected on wet cobbles and in the harbour water.` |
| **Ранок** (`morning`) | `EARLY MORNING DAWN: low pale sun rising over the sea on the right, rose and pale gold light, morning mist over the water, long soft shadows, street lights just going out, the city waking up.` |
| **Вечір** (`evening`) | `EVENING SUNSET: sun setting over the sea on the right, dramatic orange and crimson sky with long clouds, long shadows, first windows and street lights lit warmly.` |

## Епохи

Що місто додає в кожній епосі і як надруковано зображення. Техніка така сама, як у портретів цієї епохи (див. `art/STYLE.md`).

### I · 1870-ті

**Місто:**
```
1870s: horse cabs, gas lamps, tall sailing ships and a paddle steamer in the harbour, scaffolding on a new bank building.
```
**Техніка:**
```
19th-century political caricature engraving like Thomas Nast and Puck magazine: fine cross-hatching, wood-engraving line work, printed on off-white newsprint, limited palette of black ink, muted ochre gold for domes and lamps, a touch of vermilion, visible halftone dots, slight print misregistration. Satirical, monumental.
```

### II · 1918

**Місто:**
```
1918, revolution and civil war: barricades of carts and barrels in the square, a burned-out warehouse still smoking, an armoured train on the embankment, searchlights sweeping the sky, tram wires, blank torn posters on the walls, a gunboat in the harbour, one of the golden domes damaged.
```
**Техніка:**
```
Revolutionary agitprop linocut print: bold carved black shapes, flat red and black, rough paper texture, uneven ink.
```

### III · 1949

**Місто:**
```
1949, post-war reconstruction: a monumental wedding-cake high-rise with a spire beside the old town hall, a wide new granite avenue, factory smokestacks, giant harbour cranes, a cargo ship, scaffolding and banners without text, the domes now dull and unrestored.
```
**Техніка:**
```
Socialist-realist poster gouache: heroic perspective, clean poster contours, idealised sun rays, khaki and ochre with red accents.
```

### IV · 1990-ті

**Місто:**
```
1990s: grey prefab panel apartment blocks on the hill behind the old town, street kiosks, satellite dishes on every balcony, a garish casino neon sign shape without text, rusty idle cranes, a half-built church with fresh gold domes, an old Mercedes and a black jeep in the square, laundry on balconies.
```
**Техніка:**
```
Photocopied newspaper photo collage: xerox grain, harsh contrast, torn paper edges, raspberry-magenta accent tint.
```

### V · 2000-ні

**Місто:**
```
2000s: a glass business centre tower next to the opera, huge blank billboards, freshly regilded domes shining, luxury yachts in the harbour, traffic jams of glossy cars on the embankment, a new shopping mall with a glass dome.
```
**Техніка:**
```
Glossy tabloid magazine illustration: saturated garish colours, airbrush gloss, lens flares, slightly vulgar shine.
```

### VI · 2010-ті

**Місто:**
```
2010s: a cluster of glass residential towers behind the old town, many construction cranes, an LED-lit cable-stayed bridge over the river mouth, a coworking loft in an old warehouse, electric scooters on the square, a cruise ship in the harbour.
```
**Техніка:**
```
Smartphone photo with a warm social-media filter: slight vignette, soft HDR, flat design accents, slightly over-saturated sky.
```

### VII · 2020-ті

**Місто:**
```
2020s: surveillance drones hovering over the square, CCTV cameras on every pole, holographic advertising shapes without text, a sleek new government tower of black glass, container terminal with automated cranes, the golden domes lit by cold LED floodlights.
```
**Техніка:**
```
Security-camera and deepfake aesthetic: cold cyan and black, scan lines, slight RGB glitch split, digital noise, wide-angle CCTV distortion.
```

## Приклад повного промпту (епоха I, ніч)

```
Wide panoramic view of the fictional EASTERN EUROPEAN harbour city "Port-Aurum", seen from an upper-floor office window, an imagined blend of Lviv, Kyiv, Odesa, Kraków, Prague and Riga. Fixed layout: on the LEFT a green hill with a baroque monastery and a cluster of golden onion domes and pear-shaped baroque cupolas; next to it a tall Renaissance town-hall clock tower with a spire. In the CENTRE a grand opera house and a columned bank facing a cobbled market square. In the FOREGROUND dense rows of narrow colourful tenement houses with steep red tile and tin roofs, attic dormers, wrought-iron balconies, crooked chimneys. On the RIGHT a wide river-mouth harbour with a long stone embankment, grain warehouses, cranes, ships, and a lighthouse on a far spit. Rich texture everywhere: plaster, tiles, timber, stone, cobbles. Horizon at about 55–60% of the height, key silhouettes in the middle third.
1870s: horse cabs, gas lamps, tall sailing ships and a paddle steamer in the harbour, scaffolding on a new bank building.
NIGHT: moon behind thin clouds, deep blue sky, warm lit windows scattered across the city, street lights reflected on wet cobbles and in the harbour water.
19th-century political caricature engraving like Thomas Nast and Puck magazine: fine cross-hatching, wood-engraving line work, printed on off-white newsprint, limited palette of black ink, muted ochre gold for domes and lamps, a touch of vermilion, visible halftone dots, slight print misregistration. Satirical, monumental.
No people in focus, no readable text, no letters, no numbers, no flags, no coats of arms, no stars, no sickle and hammer, no real brand logos, no national symbols.
```

**Порада:** згенеруйте спершу нічну версію епохи. Ранкову й вечірню потім робіть із нічної як із референсу (image-to-image), змінюючи лише блок часу доби. Так місто в трьох станах збігатиметься до будинку.
