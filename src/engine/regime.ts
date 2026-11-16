// Era II (1914–1941) lives through four powers in a row (art/LORE.md → «Перехід», docs/era2-concept.md). The office is
// the same, but its name, the paper on the table, the patron above and the very meaning of the rank change with
// each power: the imperial city government until 1917, the Provisional Government until 1918, the councils of the
// civil war until 1922, the settled socialist state (СТСД) after that.
export type Regime = 'empire' | 'provisional' | 'civil' | 'soviet';

/** the first year of each power in Era II */
export const REGIME_FROM: Record<Exclude<Regime, 'empire'>, number> = { provisional: 1917, civil: 1918, soviet: 1922 };

/** the power in charge this year (Era II only; other eras have one power each) */
export function regimeOf(s: { era: number; year: number }): Regime | null {
  if (s.era !== 2) return null;
  return s.year >= REGIME_FROM.soviet ? 'soviet' : s.year >= REGIME_FROM.civil ? 'civil' : s.year >= REGIME_FROM.provisional ? 'provisional' : 'empire';
}

/** the city paper's name in a given year: «Вісник» → «Аурумська правда» (1917–1920) → «Трибуна праці» (from 1920) */
export function paperOf(s: { era: number; year: number }): string {
  if (s.era === 1 || (s.era === 2 && s.year < 1917)) return 'Вісник Порт-Аурума';
  if (s.era === 2 && s.year < 1920) return 'Аурумська правда';
  return 'Трибуна праці';
}

/** what the morning paper says when the power changes under the official's desk */
export const REGIME_TURN: Record<Exclude<Regime, 'empire'>, { h: string; b: string }> = {
  provisional: {
    h: 'Влада в місті — у руках Тимчасового уряду',
    b: 'Градоначальника заарештовано, поліцію замінила народна міліція. Звертатися тепер треба «громадянине». На бланках управи орла вже зішкребли, а нових ще не надрукували.'
  },
  civil: {
    h: 'Місто переходить із рук у руки',
    b: 'Ради, Вальдорська Народна Республіка, знову ради: печатки міняються частіше, ніж бланки. Ревком сидить у тому самому кабінеті, де вчора сидів комісар.'
  },
  soviet: {
    h: 'Громадянську війну закінчено. Владу рад установлено назавжди',
    b: 'Союз Трудових Соціалістичних Держав. Губвиконком роздає нові печатки, а «Трибуна праці» друкує списки тих, хто «примазався» до революції.'
  }
};

type RivalLook = { name: string; title: string; f?: boolean; cases?: { gen: string; dat: string; acc: string; ins: string }; file?: { age: number; from: string; bio: string; likes: string; weak: string; quote: string }; portrait?: string };
/** Era II: who each of the three houses is under each power (art/LORE.md → «Три еліти», docs/era2-concept.md).
 *  Empire and the Provisional Government keep Era I's second generation as they are. */
export const RIVAL_LOOK: Partial<Record<Regime, Record<string, RivalLook>>> = {
  civil: {
    r3: {
      name: 'Всеволод Кречетов-Задонський', title: 'ротмістр армії монархістів',
      cases: { gen: 'Всеволода Кречетова-Задонського', dat: 'Всеволоду Кречетову-Задонському', acc: 'Всеволода Кречетова-Задонського', ins: 'Всеволодом Кречетовим-Задонським' },
      file: { age: 23, from: 'онук графа Анатолія, юнкер', bio: 'Воював за імперію у Верхньому Ауруму й проти Конкордії. Дід відплив з урядом ВНР, онук лишився — за монархістів, за трон Святогорських. Кажуть, у місті в нього надто багато знайомих серед тих, проти кого він воює.', likes: 'шаблі, кавалерію, старі родові листи', weak: 'надто хоче вижити; за гарантію життя здасть будь-кого', quote: '«Трон — це ідея. А жити хочеться конкретно.»' },
      portrait: 'art/rivals/r3-g3.jpg'
    }
  },
  soviet: {
    r1: {
      name: 'Товариш Солонар', title: 'червоний директор тресту «Аурумсталь»',
      cases: { gen: 'Товариша Солонара', dat: 'Товаришу Солонару', acc: 'Товариша Солонара', ins: 'Товаришем Солонаром' },
      file: { age: 59, from: 'колишній власник ливарні, тепер «спец»', bio: 'Ливарню в нього забрали, але домни без нього не запустити. Тепер він червоний директор тресту, що колись був його власністю, і підписується «товариш». Склади порожні, зате знає всіх, хто ще має вугілля.', likes: 'домни, точні звіти, старих постачальників', weak: 'боїться слова «колишній» у своїй анкеті', quote: '«Ливарня та сама. Просто тепер я в ній гість.»' }
    },
    r2: {
      name: 'Товаришка Берг', title: 'редакторка «Трибуни праці»', f: true,
      cases: { gen: 'Товаришки Берг', dat: 'Товаришці Берг', acc: 'Товаришку Берг', ins: 'Товаришкою Берг' },
      file: { age: 54, from: 'колишня видавчиня «Голосу Порту»', bio: 'Ельза Берг вчасно змінила шапку газети й тепер редагує «Трибуну праці». Вона досі продає думку міста, тільки покупець тепер один. Її статті читають у губвиконкомі раніше за протоколи.', likes: 'передовиці, списки «примазаних», чай без цукру', weak: 'сама була «буржуазною пресою» і знає, що це пам’ятають', quote: '«Я завжди писала правду. Просто правда змінилася.»' }
    },
    r3: {
      name: 'Громадянин Кречетов', title: 'співробітник органів',
      cases: { gen: 'Громадянина Кречетова', dat: 'Громадянину Кречетову', acc: 'Громадянина Кречетова', ins: 'Громадянином Кречетовим' },
      file: { age: 27, from: 'онук графа, колишній білий офіцер', bio: 'У громадянську воював за монархістів, а потім здав своїх генералів спецслужбам СРС — і отримав місце в новій державі. Тепер служить в органах і веде папку на кожного, з ким колись пив за трон. «Задонський» зник з паспорта, але не з досьє.', likes: 'папки, тишу, чужі листи', weak: 'його минуле знають ті, кого він ще не встиг прибрати', quote: '«Ми ж свої люди. Колишні.»' },
      portrait: 'art/rivals/r3-g3.jpg'
    }
  }
};

/** dress the magnates for the power in charge (Era II): names, titles, cases, files */
export function dressRivals(c: { rivals: { id: string; name: string; title: string; f?: boolean; cases?: unknown; file?: unknown; portrait?: string }[] } | null | undefined, reg: Regime | null) {
  if (!c || !reg) return;
  const look = RIVAL_LOOK[reg] || {};
  // the count's grandson stays in the city from the civil war on
  const inherit = reg === 'soviet' ? { ...RIVAL_LOOK.civil, ...look } : look;
  c.rivals.forEach((r) => {
    const l = inherit[r.id];
    if (!l) return;
    Object.assign(r, { name: l.name, title: l.title, f: l.f ?? r.f, cases: l.cases, file: l.file, portrait: l.portrait });
  });
}

/** the four institutions' names under each power (the same buildings on the map) */
export function instName(s: { era: number; year: number }, id: 'charity' | 'press' | 'whisper' | 'okhrana'): string {
  const reg = regimeOf(s), y = s.year;
  if (id === 'press') return '«' + paperOf(s).replace('Порт-Аурума', '').trim() + '»';
  if (id === 'charity') return reg === 'civil' || reg === 'soviet' ? 'Дитбудинок' : 'Сиротинець';
  if (id === 'whisper') return reg === 'soviet' && y < 1929 ? 'Непманський ринок' : 'Ринок';
  if (!reg || reg === 'empire') return 'Жандармерія';
  return reg === 'provisional' ? 'Міліція' : reg === 'civil' ? 'Губчека' : y < 1934 ? 'ДПУ' : 'НКВС';
}
