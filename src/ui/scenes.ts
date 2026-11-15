// Newspaper sketches of Era I: «замальовка нашого художника». Every deck card and the big events name a
// scene (GameState.art); the picture lives at public/art/news/<scene>.jpg (4:3, engraving style, no text).
// A scene without a picture yet falls back to a crop of the city view, so the paper never shows a hole.
// Prompts for the pictures: art/prompts/news-scenes.md.

/** where the artist stood: the caption under the sketch */
export const SCENE_CAPTION: Record<string, string> = {
  council: 'у залі міської ради',
  roads: 'на Головній вулиці',
  orphanage: 'біля сиротинцю святої Анни',
  harbour: 'у гавані',
  tram: 'на лінії конки',
  lamplighter: 'на Подолі, коли запалювали ліхтарі',
  fire: 'на Гончарній після пожежі',
  quarantine: 'біля карантинного посту',
  fair: 'на ярмарку на Ринковій',
  bridge: 'над гирлом, де будують міст',
  gymnasium: 'біля нової гімназії',
  opera: 'в опері перед прем’єрою',
  customs: 'на митниці',
  garrison: 'у дворі казарм',
  governor_party: 'на святі в губернаторському палаці',
  revisor: 'на вокзалі, де зустрічали ревізора',
  press: 'у редакції',
  docks: 'у порту',
  ball: 'на благодійному балу',
  inspector: 'на Подолі',
  portrait: 'у майстерні художника',
  poetry: 'на вечорі поезії',
  berg: 'у друкарні «Голосу Порту»',
  dinner: 'у ресторані «Гранд»',
  count: 'на Замковому пагорбі',
  gendarmes: 'у студентському кварталі',
  delegates: 'на вокзалі',
  bourse: 'на біржі',
  bank: 'під банком «Аурум»',
  hideout: 'на Подолі, біля накритої криївки',
  guild: 'у залі гільдій',
  court: 'у міському суді',
  insider: 'у шинку біля доків',
  raid: 'на вашій вулиці вночі',
  scandal: 'на набережній',
  estate: 'на Замковому пагорбі',
  promo: 'у Ратуші',
  heir: 'у родинному домі',
  family: 'у родинному домі',
  contractor: 'на будівництві'
};

export const sceneSrc = (scene: string) => `art/news/${scene}.jpg`;
export const sceneCaption = (scene: string | null | undefined) =>
  'Замальовка нашого художника ' + (scene && SCENE_CAPTION[scene] ? SCENE_CAPTION[scene] : 'з Ратушної площі') + '.';
