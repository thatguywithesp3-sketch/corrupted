# Замальовки для газети (Епоха I)

«Замальовка нашого художника» на першій шпальті «Вісника Порт-Аурума». Кожна картка колоди документів і кожна велика подія називає сцену (`art` у `era1.json` → `deck`, `GameState.art` у ядрі). Підпис під малюнком — `src/ui/scenes.ts`.

| Що | Значення |
|---|---|
| Файл для гри | `public/art/news/<сцена>.jpg`, 800×600 (4:3), JPG 82% |
| Оригінал | `art/news/<сцена>-src.jpg` (1280×960, JPG 90%; генерації у Figma-файлі «Corrupted! — замальовки газети») |
| Поки малюнка немає | газета показує вирізку з ранкової панорами міста (як раніше) |
| Готово | усі 40 сцен (15.11; `customs` перегенеровано з імперськими прапорами, `flags` замінено на `hideout`) |

## Правила саме для замальовок

1. **Героя не видно в обличчя.** У кожного гравця свій портрет і стать, тому урядовець на сценах стоїть спиною, у тіні, в натовпі або його немає зовсім. Сцена показує місто й подію, а не героя.
2. **Упізнавані персонажі збігаються з портретами** (`public/art/people`, `public/art/rivals`):
   - Пайк — кремезний підрядник, котелок, великі вуса, закатані рукави, жилет, червоні щоки;
   - Доббс — худий писар, круглі окуляри, перо за вухом, нарукавники, гросбух;
   - Отто — пухкий веселун, кучері, червоний картатий костюм, метелик у горошок, гвоздика;
   - Квілл — молодий репортер, кашкет, блокнот і олівець, жилет, червона краватка;
   - ротмістр — жандармський офіцер, блакитний мундир, кашкет, навощені вуса;
   - губернатор — літній генерал, сиві бакенбарди, зелений мундир, золоті еполети, червона стрічка;
   - Солонар, Берг, граф — як у `art/STYLE.md` → «Суперники».
3. **Без тексту й без символів реальних держав** (загальні правила `STYLE.md`). Прапори: імперський — горизонтальні смуги червона, біла, жовта (на суднах без герба; над Ратушею й губернаторським палацом — з чорним коронованим кречетом у білій смузі, кречет тримає ключ і якір); монети — з тим самим кречетом; без двоголових орлів; вальдорський — блакитна, чорна, жовта, і до Епохи IV (1990) він заборонений: ніколи не висить відкрито, лише в криївці, у жандармів у руках або фарбою на стіні.
4. **Тон** — газетна хроніка без моралі: сатира в деталі (конверт, зайва опора, позолота, що облізла), а не в плакаті.

## Шаблон промпту

```
Hand-tinted 19th-century newspaper engraving, bold pen-and-ink with sharp cross-hatching in the manner
of Puck magazine and Thomas Nast, on cream newsprint; soft watercolor tints, muted palette of black ink,
deep vermilion red and dull ochre gold, faint halftone texture. Grotesque, sculpted character faces with
normal body proportions: every face is a pronounced caricature carved in hard planes like a bust — heavy
brow ridges, deep-set suspicious eyes, large hooked or bulbous noses, big ears, jutting or receding chins,
crooked teeth, deep wrinkles, asymmetry — the exaggeration lives in the faces and hands, not in the body
size; anatomy tells class and character: the wealthy are fleshy and puffy with heavy jowls, double chins
and small greedy eyes, the poor are bony and gaunt with sunken cheeks, broken noses and big gnarled hands.
Unsettling but still believable, like real people of a hard port city, not a cartoon.
Scene in Port-Aurum, a merchant port city of the 1870s (Venice-like canals and bridges mixed with Lviv,
Odesa, Kraków and Prague: tiled roofs, onion-domed monastery on a hill, town-hall tower, opera, harbour
with lighthouse): <СЦЕНА>. Wide 4:3 composition, readable at small size, one clear focal point.
No text, no letters, no numbers, no signage, no captions, no coats of arms or symbols of real states.
```

Напрям облич (від 15.11, рішення Макса): гротеск в обличчях і руках, але нормальні пропорції тіла (без «великих голів на малих тілах»), з принципом
«анатомія розповідає про клас» (орієнтир — дизайн персонажів студії Arkane, без копіювання їхніх
персонажів). Усі 40 сцен згенеровано в цьому напрямі (15.11); зразок — `roads`.

## Сцени

| Сцена | Де трапляється | Що на малюнку (вставити в `<СЦЕНА>`) |
|---|---|---|
| `council` | перший день у раді; програні вибори | a crowded council chamber with carved benches and a gallery of gawking citizens; an official seen from behind takes a seat while councillors whisper behind their hands and a lady on the gallery fans herself |
| `roads` | ремонт доріг | workers relaying cobblestones on the main street before an official visit; a burly contractor in a bowler hat counts banknotes behind a cart of suspiciously few stones; carriages wait |
| `orphanage` | вугілля для сиротинцю; ігуменя | orphans in a snowy monastery courtyard by a half-empty coal cart; a stern abbess holds a ledger; a delivery man unloads small damp sacks |
| `harbour` | поглиблення порту | a steam dredger in the harbour scooping mud, an imperial ironclad waiting offshore, clerks with ledgers on the pier and a lighthouse in the background |
| `tram` | конка | a horse-drawn tram on new rails climbing to the upper town, ladies in bustles waving; a few rails lie hidden under tarpaulin in a side yard |
| `lamplighter` | газові ліхтарі | a lamplighter with a long pole lighting new gas lamps on a poor riverside quarter at dusk; every other lamp post stands dark |
| `fire` | пожежна команда; погорільці | firemen with a hand pump and horses at a burned row of sheds; homeless families with bundles stand in the smoke; the pump leaks water from patched hoses |
| `quarantine` | карантин, холера | a quarantine post at the railway station and the harbour: a doctor in an apron, sacks of chlorinated lime, nurses, passengers lined up, sailors behind a rope |
| `fair` | ярмарок | a lively fair on the market square: horses, cloth, honey barrels, a fountain; peasants squeezed into a muddy corner while middlemen hold the best stalls |
| `bridge` | міст через гирло | stone piers of an unfinished bridge across the river mouth, scaffolding, engineers arguing over plans, a rowing boat ferrying people underneath |
| `gymnasium` | гімназія | a new gymnasium building with schoolchildren in uniforms going in; buckets catch drips under the fresh roof; a proud teacher at the door |
| `opera` | опера | an opera house interior before a premiere: gilded boxes, a huge chandelier, ladies with lorgnettes; a workman on a ladder touches up flaking gold leaf |
| `customs` | портові мита | a customs house on the quay, barrels of rum and bales of cloth, a captain winking at a clerk who writes in a ledger; merchant ships fly plain horizontal red-white-yellow tricolour flags without emblems |
| `garrison` | постачання гарнізону | an imperial garrison courtyard in winter, thin soldiers in threadbare summer greatcoats lining up for bales of cheap cloth from a cheerful plump merchant in a red checked suit |
| `governor_party` | подарунок губернаторші | fireworks over the governor's palace and an orchestra on the terrace; the governor's wife in a grand gown receives gifts, a city treasury chest stands open nearby |
| `revisor` | ревізор зі столиці | an inspector from the imperial capital arriving at the station with trunks and a stern assistant, a thin clerk with round spectacles bowing deeply and holding a ledger |
| `press` | Квілл, газета | a cramped newspaper office with a hand press, a young reporter in a flat cap scribbling in a notebook, stacks of papers, an editor eating a fine dinner by the window |
| `docks` | страйк докерів | striking dock workers sitting on crates in front of idle ships, a ship owner in a top hat shouting, policemen gathering at the end of the pier |
| `ball` | благодійний бал | a charity ball in a ballroom with a portrait of an aging emperor without insignia, ladies of the committee writing down donors' names, a donation box |
| `inspector` | Отто-інспектор; вдова | a plump cheerful inspector in a red checked suit inspecting a small shop on a poor street while the widow owner and her son stand at the door with witnesses |
| `portrait` | парадний портрет | a painter's studio, a grand gilded portrait of an anonymous official in heroic pose on the easel, the painter mixing gold paint, an envelope sticking out of the portrait's pocket |
| `poetry` | вечір поезії | students reading poetry from handwritten sheets in a candle-lit hall full of young people, a policeman listening at the window |
| `berg` | Пані Берг | a gossip newspaper printing shop: a thin widow with a sharp nose, feather in her hair bun, mourning silk and a long cigarette holder, inspecting fresh caricature sheets coming off the press |
| `dinner` | Солонар | a private dining room of the Grand restaurant: a stout bald merchant with a sea-captain beard, pince-nez and a cigar paying the bill with a gold coin, waiters bowing, a city map on the table split in two |
| `count` | граф | a crumbling castle on the hill, a withered old count with a walrus moustache, monocle and patched faded uniform sealing a letter with red wax; a bank clerk waits with an auction notice |
| `gendarmes` | список «неблагонадійних» | gendarmes in blue uniforms searching a student garret at night, heaps of handwritten poems on the floor, a waxed-moustache officer holding a list |
| `delegates` | делегати до столиці | a delegation of merchants in fur coats boarding a train to the capital with a rolled petition, citizens waving them off on the platform |
| `bourse` | облігації | the stock exchange floor, brokers shouting, a large board with falling arrows only (no numbers), a nervous official holding a bundle of imperial bonds |
| `bank` | банк «Аурум» | a grand bank façade with columns; depositors crowd the closed doors while a carriage loaded with suitcases leaves around the corner |
| `hideout` | криївка на Подолі (картка ордера) | a night raid on a printer's cellar: gendarmes in blue uniforms with lanterns pull rolled banners striped light blue, black and yellow out of a crate, a hand press and scattered leaflets, a printer in an apron held by the arm, neighbours watching from the stairs |
| `guild` | гільдії | guild elders in fur-trimmed robes around a long table with a salt barrel in the middle, shaking hands over a sealed contract |
| `court` | суд; свідчення; провал роду | a city courtroom, a witness pointing a finger, the judge peering over spectacles, journalists scribbling in the gallery |
| `insider` | інсайдер у газеті | a smoky dockside tavern where a nervous informant whispers to a reporter in a flat cap who writes in a notebook |
| `raid` | нічний обшук | a night raid on a townhouse: police with lanterns carrying sacks out of the door, neighbours peeking from windows in nightcaps |
| `scandal` | скандал з дитиною | a young dandy showing off a brand-new carriage and fine horses on the embankment, gossiping ladies and a reporter watching |
| `estate` | купівля маєтку | a grand manor on Castle Hill above the city, servants unloading furniture from carts, a gilded gate being opened |
| `promo` | підвищення | a solemn appointment ceremony in the town hall: the governor pins an order on an official seen from behind, councillors applaud, one of them counts on his fingers |
| `heir` | новий голова роду | a family drawing room with ancestral portraits, a will on the table under a red wax seal, relatives in black waiting |
| `family` | рішення про дітей і родичів | a bourgeois family dinner, children at the table, an empty chair at the head of the table with a briefcase on it |
| `contractor` | зустріч із Пайком | a burly contractor in a bowler hat leaning over a desk in a dim office, pushing an envelope across, a building site visible through the window |

## Черговість генерації

1. Найчастіші: `council`, `roads`, `orphanage`, `harbour`, `tram`, `governor_party`, `revisor`, `press`, `docks`, `ball`, `raid`, `promo`.
2. Нові картки колоди: решта схем і рішень.
3. Рідкісні події: `scandal`, `insider`, `heir`, `estate`, `court`, `contractor`, `family`.
