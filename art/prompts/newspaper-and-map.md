# Газета й план міста — промпти

Поки цих зображень немає, гра обходиться без них:
- **Замальовка в газеті** вирізається з ранкового виду міста.
- **План міста** намальований кодом.

Нижче промпти, щоб замінити їх на справжні гравюри.

## 1. Замальовки до першої шпальти (епоха I)

**Формат:** 4:3, 1600×1200.

**Куди класти:** `public/art/news/e1-<тема>.jpg`.

**Стиль** (додавайте до кожного промпту):

```
Black-and-white newspaper wood engraving, 1870s Eastern European city paper, fine cross-hatching, halftone screen, off-white newsprint, slight ink bleed. No text, no letters, no flags, no coats of arms.
```

| Тема (файл) | Що зображено |
|---|---|
| `strike` | Port dockers on strike blocking a quay, police with batons arriving, sailing ships behind. |
| `ball` | Charity ball in an opera foyer, ladies in crinolines, an empty chair with a name card. |
| `fire` | Night fire in a row of wooden sheds, a horse-drawn fire pump, onlookers. |
| `market` | A crowded market square with grain sacks, carts and a town-hall clock tower. |
| `inspection` | A tax inspector with a ledger in a small shop, the frightened owner behind the counter. |
| `scandal` | Gossiping crowd reading a pasted newspaper sheet on a wall, a portly official hurrying past. |
| `promotion` | A ceremony in a gilded hall, an official receiving a chain of office from the governor. |
| `search` | Police searching an office at night, drawers pulled out, papers flying, a lantern. |

## 2. План Порт-Аурума (одне зображення на всі епохи I–II)

**Формат:** 10:7, 2000×1400.

**Куди класти:** `public/art/map/port-aurum-plan.jpg`.

Розташування районів повинно збігатися з кодом:
- Замковий пагорб — угорі ліворуч;
- Старе місто — у центрі вгорі;
- Ринок — у центрі внизу;
- Поділ — унизу ліворуч;
- Порт і пірси — праворуч, далі море.

```
Antique engraved city plan of a fictional 1870s Eastern European harbour city, top-down cartographic view on aged paper. Layout: top-left a castle hill with contour lines and a monastery; top-centre the old town with dense blocks and a town-hall square; bottom-centre a market square; bottom-left the craftsmen quarter (Podil) by a river; right side a harbour with three stone piers, warehouses and the open sea with hatched water lines; a compass rose top-right. Fine copperplate line work, sepia ink, light watercolour wash on blocks (ochre, brick red, sea blue), folded-paper creases, coffee stains, worn edges. No text, no labels, no letters, no numbers.
```

Підписи районів і позначки закладів гра накладає зверху сама.
