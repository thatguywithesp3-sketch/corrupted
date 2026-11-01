// Corrupted! logo stamps: 4 per era + final. Outputs logos.html (all SVGs) for rendering.
import fs from 'node:fs';
const W = 500, H = 340;
let uid = 0;

// rough-ink filter: wobbly edge + missing-ink speckles. k = displacement, holes = how much ink is missing
function ink(k = 3.5, holes = 2.2, seed = 1, freq = 0.035) {
  const id = 'f' + (++uid);
  return { id, def: `<filter id="${id}" x="-10%" y="-10%" width="120%" height="120%">
    <feTurbulence type="fractalNoise" baseFrequency="${freq}" numOctaves="2" seed="${seed}" result="w"/>
    <feDisplacementMap in="SourceGraphic" in2="w" scale="${k}" xChannelSelector="R" yChannelSelector="G" result="d"/>
    <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" seed="${seed + 9}" result="n"/>
    <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -3.2 0 0 0 ${holes}" result="m"/>
    <feComposite in="d" in2="m" operator="in"/>
  </filter>` };
}
const svg = (defs, body, bg = 'transparent') =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs>${defs}</defs>${bg !== 'transparent' ? `<rect width="${W}" height="${H}" fill="${bg}"/>` : ''}${body}</svg>`;
const circlePath = (id, cx, cy, r, top = true) => top
  ? `<path id="${id}" d="M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}" fill="none"/>`
  : `<path id="${id}" d="M ${cx - r} ${cy} A ${r} ${r} 0 0 0 ${cx + r} ${cy}" fill="none"/>`;
const T = (x, y, s, fam, txt, fill, extra = '') => `<text x="${x}" y="${y}" font-family="${fam}" font-size="${s}" fill="${fill}" text-anchor="middle" ${extra}>${txt}</text>`;

const L = {}; // era -> [{name, svg}]
const add = (era, name, s) => (L[era] = L[era] || []).push({ name, svg: s });

// ---------------- ERA I · 1874 · gilded age
{
  // A. wax seal
  const f = ink(5, 4, 3, 0.02), g = 'g' + (++uid), p1 = 'p' + (++uid), p2 = 'p' + (++uid);
  const blob = 'M250 24 C306 20 344 50 368 78 C404 88 418 130 414 164 C434 200 412 246 380 266 C366 304 320 322 280 316 C244 336 198 328 168 308 C126 310 92 276 86 240 C60 210 66 164 84 134 C82 92 118 60 158 52 C182 30 218 20 250 24 Z';
  add(1, 'Воскова печатка', svg(`${f.def}<radialGradient id="${g}" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#D2453A"/><stop offset=".55" stop-color="#9E1C16"/><stop offset="1" stop-color="#5C0C08"/></radialGradient>
     <path id="${p1}" d="M 148 172 A 102 102 0 0 1 352 172" fill="none"/><path id="${p2}" d="M 136 172 A 114 114 0 0 0 364 172" fill="none"/>`,
    `<g filter="url(#${f.id})"><path d="${blob}" fill="url(#${g})"/></g>
     <circle cx="250" cy="172" r="128" fill="none" stroke="#5C0C08" stroke-width="5" opacity=".6"/>
     <circle cx="250" cy="172" r="84" fill="#C23A2E" stroke="#5C0C08" stroke-width="3"/>
     <circle cx="250" cy="172" r="84" fill="none" stroke="#F0A090" stroke-width="1.2" opacity=".35" transform="translate(-1.2 -1.2)"/>
     <text font-family="IM Fell English SC" font-size="20" fill="#F2B0A0" fill-opacity=".75" letter-spacing="7"><textPath href="#${p1}" startOffset="50%" text-anchor="middle">VALDORIA · 1874</textPath></text>
     <text font-family="IM Fell English SC" font-size="17" fill="#F2B0A0" fill-opacity=".75" letter-spacing="4"><textPath href="#${p2}" startOffset="50%" text-anchor="middle">SIGILLUM · CORRUPTIONIS</textPath></text>
     ${T(250, 168, 34, 'Abril Fatface', 'CORRUPTED', '#4A0906', 'textLength="150" lengthAdjust="spacingAndGlyphs"')}
     ${T(250, 214, 44, 'Abril Fatface', '!', '#4A0906')}`));
}
{
  // B. wood-type rubber stamp
  const f = ink(3, 2.4, 5);
  add(1, 'Гумовий штамп', svg(f.def, `<g filter="url(#${f.id})" transform="rotate(-7 250 170)" fill="none" stroke="#B3221A">
     <rect x="40" y="78" width="420" height="184" rx="6" stroke-width="7"/><rect x="54" y="92" width="392" height="156" rx="3" stroke-width="2.5"/>
     ${T(250, 124, 18, 'Old Standard TT', 'МІСТО ПОРТ-АУРУМ · СПРАВА № 214', '#B3221A', 'stroke="none" letter-spacing="3" font-weight="700"')}
     ${T(250, 212, 76, 'Ultra', 'CORRUPTED!', '#B3221A', 'stroke="none" textLength="380" lengthAdjust="spacingAndGlyphs"')}
     ${T(250, 238, 15, 'Old Standard TT', '— ПІДПИС РЕВІЗОРА —', '#B3221A', 'stroke="none" letter-spacing="4"')}</g>`));
}
{
  // C. branding iron (тавро)
  const f = ink(4, 2.6, 8, 0.05), g = 'g' + (++uid);
  add(1, 'Тавро', svg(`${f.def}<radialGradient id="${g}" cx="50%" cy="50%" r="60%"><stop offset="0" stop-color="#2A1206"/><stop offset=".7" stop-color="#4A2410"/><stop offset="1" stop-color="#7A4A22" stop-opacity="0"/></radialGradient>`,
    `<ellipse cx="250" cy="170" rx="236" ry="130" fill="url(#${g})" opacity=".55"/>
     <g filter="url(#${f.id})" fill="#1E0C04"><ellipse cx="250" cy="170" rx="205" ry="104" fill="none" stroke="#1E0C04" stroke-width="10"/>
     ${T(250, 194, 66, 'Rye', 'CORRUPTED', '#1E0C04', 'textLength="330" lengthAdjust="spacingAndGlyphs"')}
     <path d="M250 96 l10 18 h-20 z M250 244 l10 -18 h-20 z" />
     ${T(422, 194, 66, 'Rye', '!', '#1E0C04')}</g>`));
}
{
  // D. Victorian poster ribbon
  const f = ink(2.5, 2.8, 11);
  add(1, 'Афішна стрічка', svg(f.def, `<g filter="url(#${f.id})">
     <path d="M20 132 L70 120 L60 170 L70 220 L20 208 L40 170 Z M480 132 L430 120 L440 170 L430 220 L480 208 L460 170 Z" fill="#7A1410"/>
     <path d="M60 104 Q250 84 440 104 L440 236 Q250 216 60 236 Z" fill="#B3221A"/>
     <path d="M70 114 Q250 95 430 114 L430 226 Q250 207 70 226 Z" fill="none" stroke="#F2DFA8" stroke-width="2"/>
     ${T(250, 194, 72, 'Sancreek', 'Corrupted!', '#F7EBD0')}
     ${T(250, 68, 20, 'Old Standard TT', '★ ВЕЛИКА ДИНАСТИЧНА ВИСТАВА ★', '#3A1A10', 'letter-spacing="2" font-weight="700"')}
     ${T(250, 280, 18, 'Old Standard TT', 'У ГОЛОВНИХ РОЛЯХ — РІД ГРАБСІВ', '#3A1A10', 'letter-spacing="3" font-style="italic"')}</g>`));
}

// ---------------- ERA II · 1918 · revolution
{
  const f = ink(3, 2.2, 13);
  add(2, 'Конструктивістський клин', svg(f.def, `<g filter="url(#${f.id})">
     <polygon points="30,250 470,90 470,150 30,310" fill="#C4161C"/>
     <polygon points="30,60 300,60 270,110 30,110" fill="#111"/>
     ${T(165, 96, 30, 'Russo One', 'ВИРОК', '#F2E6CF', 'letter-spacing="8"')}
     ${T(252, 222, 40, 'Stalinist One', 'CORRUPTED!', '#F2E6CF', 'transform="rotate(-20 250 200)" textLength="400" lengthAdjust="spacingAndGlyphs"')}</g>`));
}
{
  const f = ink(3, 2.3, 17), p1 = 'p' + (++uid), p2 = 'p' + (++uid);
  add(2, 'Печатка ревкому', svg(`${f.def}${circlePath(p1, 250, 170, 108)}${circlePath(p2, 250, 170, 112, false)}`, `<g filter="url(#${f.id})" transform="rotate(10 250 170)">
     <circle cx="250" cy="170" r="140" fill="none" stroke="#C4161C" stroke-width="6"/><circle cx="250" cy="170" r="94" fill="none" stroke="#C4161C" stroke-width="3"/>
     <text font-family="Russo One" font-size="22" fill="#C4161C" letter-spacing="4"><textPath href="#${p1}" startOffset="50%" text-anchor="middle">РЕВКОМ ВАЛЬДОРІЇ</textPath></text>
     <text font-family="Russo One" font-size="16" fill="#C4161C" letter-spacing="3"><textPath href="#${p2}" startOffset="50%" text-anchor="middle">НАДЗВИЧАЙНА КОМІСІЯ · 1918</textPath></text>
     <rect x="150" y="142" width="200" height="56" fill="#C4161C"/>
     ${T(250, 184, 38, 'Russo One', 'CORRUPTED!', '#F2E6CF', 'textLength="184" lengthAdjust="spacingAndGlyphs"')}</g>`));
}
{
  const f = ink(1.5, 2.6, 19), f2 = ink(3, 2.2, 21);
  add(2, 'Мандат', svg(`${f.def}${f2.def}`, `<rect x="40" y="40" width="420" height="260" fill="#E9DFC6"/>
     <g filter="url(#${f.id})" fill="#262019" font-family="Special Elite">
     <text x="64" y="84" font-size="17">МАНДАТ № 0-17</text><text x="64" y="112" font-size="15">Пред'явник цього — гр. Грабс —</text>
     <text x="64" y="134" font-size="15">визнається винним у тому, що є</text></g>
     <g filter="url(#${f2.id})" transform="rotate(-6 250 210)">
     <rect x="70" y="160" width="360" height="96" fill="none" stroke="#C4161C" stroke-width="7"/>
     ${T(250, 230, 62, 'Rubik Mono One', 'CORRUPTED!', '#C4161C', 'textLength="330" lengthAdjust="spacingAndGlyphs"')}</g>`));
}
{
  const f = ink(5, 2.0, 23, 0.06);
  add(2, 'Лінорит', svg(f.def, `<g filter="url(#${f.id})">
     <rect x="24" y="70" width="452" height="200" fill="#111"/>
     <polygon points="24,70 160,70 24,200" fill="#C4161C"/><polygon points="476,270 340,270 476,140" fill="#C4161C"/>
     ${T(250, 206, 62, 'Rubik Mono One', 'CORRUPTED!', '#F2E6CF', 'textLength="410" lengthAdjust="spacingAndGlyphs"')}
     ${T(250, 116, 20, 'Russo One', 'ГЕТЬ ЧЕСНІСТЬ!', '#F2E6CF', 'letter-spacing="10"')}</g>`));
}

// ---------------- ERA III · 1949 · socialist realism (violet office ink)
{
  const f = ink(2.5, 2.4, 29), p1 = 'p' + (++uid), V = '#4B3A9E';
  const C = 2 * Math.PI * 118;
  add(3, 'Гербова печатка (фіолетова)', svg(`${f.def}<path id="${p1}" d="M 250 52 A 118 118 0 1 1 249.9 52" fill="none"/>`, `<g filter="url(#${f.id})" transform="rotate(-12 250 170)" fill="${V}">
     <circle cx="250" cy="170" r="146" fill="none" stroke="${V}" stroke-width="4"/><circle cx="250" cy="170" r="140" fill="none" stroke="${V}" stroke-width="1.5"/><circle cx="250" cy="170" r="98" fill="none" stroke="${V}" stroke-width="2"/>
     <text font-family="Oswald" font-weight="700" font-size="20" textLength="${(C * 0.96).toFixed(0)}" lengthAdjust="spacing"><textPath href="#${p1}">МІНІСТЕРСТВО ДЕРЖАВНОГО ПЛАНУ ВАЛЬДОРІЇ • ДЛЯ ДОКУМЕНТІВ •</textPath></text>
     ${T(250, 152, 17, 'PT Mono', 'ВИСНОВОК:', V)}
     ${T(250, 194, 40, 'Oswald', 'CORRUPTED!', V, 'font-weight="700" textLength="176" lengthAdjust="spacingAndGlyphs"')}
     <line x1="176" y1="210" x2="324" y2="210" stroke="${V}" stroke-width="2"/>${T(250, 230, 14, 'PT Mono', '«___» ________ 1949', V)}</g>`));
}
{
  const f = ink(2.5, 2.3, 31), R = '#B01E22';
  add(3, 'Гриф «Таємно»', svg(f.def, `<g filter="url(#${f.id})" transform="rotate(5 250 170)">
     <rect x="50" y="100" width="400" height="140" fill="none" stroke="${R}" stroke-width="5"/>
     ${T(250, 134, 18, 'PT Mono', 'ЦІЛКОМ ТАЄМНО · ЕКЗ. ЄДИНИЙ', R, 'letter-spacing="2"')}
     <line x1="70" y1="146" x2="430" y2="146" stroke="${R}" stroke-width="2"/>
     ${T(250, 222, 76, 'Oswald', 'CORRUPTED!', R, 'font-weight="700" textLength="360" lengthAdjust="spacingAndGlyphs"')}</g>`));
}
{
  const f = ink(1.5, 2.8, 37), g = 'g' + (++uid);
  let rays = ''; for (let i = 0; i < 24; i++) { const a = (i * 15) * Math.PI / 180; rays += `<line x1="250" y1="170" x2="${250 + Math.cos(a) * 240}" y2="${170 + Math.sin(a) * 240}" stroke="#E8B64A" stroke-width="${i % 2 ? 6 : 14}" opacity=".55"/>`; }
  let laurel = ''; for (let i = 0; i < 9; i++) { const t = i / 8, a = (200 + t * 120) * Math.PI / 180, x = 250 + Math.cos(a) * 150, y = 200 - Math.sin(a) * -60; laurel += `<ellipse cx="${x.toFixed(1)}" cy="${(250 - Math.sin(t * Math.PI) * 30).toFixed(1)}" rx="12" ry="5" transform="rotate(${-30 + t * 60} ${x.toFixed(1)} ${(250 - Math.sin(t * Math.PI) * 30).toFixed(1)})" fill="#B8852A"/>`; }
  add(3, 'Урочиста емблема', svg(`${f.def}<linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F6D77A"/><stop offset="1" stop-color="#B8852A"/></linearGradient>`, `<g filter="url(#${f.id})">${rays}
     <rect x="60" y="120" width="380" height="96" rx="4" fill="#B01E22" stroke="url(#${g})" stroke-width="5"/>
     ${T(250, 192, 60, 'Ruslan Display', 'CORRUPTED!', 'url(#' + g + ')', 'stroke="#5A0E0E" stroke-width="1.5" textLength="340" lengthAdjust="spacingAndGlyphs"')}
     ${T(250, 296, 18, 'Oswald', 'ВИКОНАНО ДОСТРОКОВО', '#7A1414', 'letter-spacing="5" font-weight="700"')}</g>`));
}
{
  const f = ink(1.2, 2.9, 41), f2 = ink(2.6, 2.3, 43);
  add(3, 'Обкладинка справи', svg(`${f.def}${f2.def}`, `<rect x="70" y="30" width="360" height="280" fill="#D9C9A0" stroke="#8C7A50" stroke-width="2"/>
     <g filter="url(#${f.id})" fill="#2A2418">${T(250, 78, 30, 'Oswald', 'СПРАВА №', '#2A2418', 'font-weight="700" letter-spacing="6"')}
     <line x1="120" y1="104" x2="380" y2="104" stroke="#2A2418" stroke-width="1.5"/>${T(250, 98, 22, 'PT Mono', '1949 / 214-Г', '#2A2418')}
     ${T(250, 290, 15, 'PT Mono', 'ЗБЕРІГАТИ ВІЧНО', '#2A2418', 'letter-spacing="4"')}</g>
     <g filter="url(#${f2.id})" transform="rotate(-9 250 190)"><rect x="100" y="144" width="300" height="92" rx="10" fill="none" stroke="#4B3A9E" stroke-width="5"/>
     ${T(250, 210, 56, 'Oswald', 'CORRUPTED!', '#4B3A9E', 'font-weight="700" textLength="270" lengthAdjust="spacingAndGlyphs"')}</g>`));
}

// ---------------- ERA IV · 1990s · xerox, fax, wild capitalism
{
  const f = ink(1.5, 2.2, 47, 0.08), f2 = ink(3, 2.1, 49);
  add(4, 'Факс', svg(`${f.def}${f2.def}`, `<rect x="30" y="40" width="440" height="260" fill="#F1EEE4"/>
     <g filter="url(#${f.id})" font-family="PT Mono" fill="#1A1A1A"><text x="44" y="62" font-size="13">31-12-1993 23:58  FROM: +380 44 000 00 00   P.01</text>
     <line x1="44" y1="70" x2="456" y2="70" stroke="#1A1A1A" stroke-width="1"/>${[0,1,2,3,4,5].map(i=>`<rect x="44" y="${82+i*30}" width="${380-(i*37)%140}" height="7" fill="#1A1A1A" opacity=".35"/>`).join('')}</g>
     <g filter="url(#${f2.id})" transform="rotate(-11 250 190)"><rect x="70" y="140" width="360" height="104" fill="none" stroke="#1A1A1A" stroke-width="6"/>
     ${T(250, 216, 70, 'Black Ops One', 'CORRUPTED!', '#1A1A1A', 'textLength="330" lengthAdjust="spacingAndGlyphs"')}</g>`));
}
{
  const f = ink(2.5, 2.7, 53, 0.05);
  add(4, 'Ксерокопія', svg(f.def, `<g filter="url(#${f.id})" transform="rotate(3 250 170)">
     <rect x="40" y="80" width="420" height="180" fill="#C2185B"/>
     <rect x="40" y="80" width="420" height="180" fill="none" stroke="#111" stroke-width="10"/>
     ${T(250, 210, 104, 'Anton', 'CORRUPTED!', '#111', 'textLength="390" lengthAdjust="spacingAndGlyphs"')}
     ${T(250, 116, 18, 'PT Mono', '«ВЕЧІРНІЙ СКАНДАЛ» · ЕКСКЛЮЗИВ', '#111', 'font-weight="700"')}</g>`));
}
{
  const f = ink(1.5, 2.6, 59);
  let tape = ''; for (let i = 0; i < 6; i++) tape += `<polygon points="${i * 22},0 ${i * 22 + 11},0 ${i * 22 - 15},64 ${i * 22 - 26},64" fill="#111"/><polygon points="${560 + i * 22},0 ${571 + i * 22},0 ${545 + i * 22},64 ${534 + i * 22},64" fill="#111"/>`;
  add(4, 'Стрічка «Не перетинати»', svg(`${f.def}<clipPath id="tc"><rect width="640" height="64"/></clipPath>`, `<g filter="url(#${f.id})" transform="rotate(-10 250 170) translate(-70 138)">
     <rect width="640" height="64" fill="#F2C318"/><g clip-path="url(#tc)">${tape}</g>
     <line x1="0" y1="4" x2="640" y2="4" stroke="#111" stroke-width="3"/><line x1="0" y1="60" x2="640" y2="60" stroke="#111" stroke-width="3"/>
     ${T(320, 48, 46, 'Anton', 'CORRUPTED! · НЕ ПЕРЕТИНАТИ', '#111', 'textLength="400" lengthAdjust="spacingAndGlyphs"')}</g>`));
}
{
  const f = ink(2.8, 2.3, 61);
  add(4, 'Трафарет', svg(f.def, `<g filter="url(#${f.id})" transform="rotate(-4 250 170)">
     <rect x="36" y="96" width="428" height="148" fill="none" stroke="#2B2B2B" stroke-width="5" stroke-dasharray="26 8"/>
     ${T(250, 208, 84, 'Black Ops One', 'CORRUPTED!', '#C2185B', 'textLength="390" lengthAdjust="spacingAndGlyphs"')}
     ${T(250, 82, 16, 'PT Mono', 'ТОВ «ГРАБС-ІНВЕСТ» · ЕКСПОРТ-ІМПОРТ', '#2B2B2B', 'font-weight="700"')}</g>`));
}

// ---------------- ERA V · 2000s · tabloid gloss
{
  const f = ink(1.2, 2.9, 67);
  let star = ''; for (let i = 0; i < 32; i++) { const r = i % 2 ? 120 : 160, a = i / 32 * Math.PI * 2; star += `${(250 + Math.cos(a) * r * 1.35).toFixed(1)},${(170 + Math.sin(a) * r * 0.95).toFixed(1)} `; }
  add(5, 'Таблоїдний вибух', svg(f.def, `<g filter="url(#${f.id})"><polygon points="${star}" fill="#FFE200" stroke="#D0021B" stroke-width="6"/>
     ${T(250, 130, 24, 'Bowlby One SC', 'ЕКСКЛЮЗИВ!', '#D0021B', 'transform="rotate(-6 250 170)"')}
     ${T(250, 200, 58, 'Bowlby One SC', 'CORRUPTED!', '#111', 'transform="rotate(-6 250 170)" textLength="350" lengthAdjust="spacingAndGlyphs"')}
     ${T(250, 236, 18, 'Archivo Black', 'ФОТО НА СТОР. 3', '#D0021B', 'transform="rotate(-6 250 170)"')}</g>`));
}
{
  const g = 'g' + (++uid), g2 = 'g' + (++uid);
  add(5, 'Хромований глянець', svg(`<linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".45" stop-color="#B9C2CC"/><stop offset=".5" stop-color="#55606C"/><stop offset=".75" stop-color="#E7ECF0"/><stop offset="1" stop-color="#8A949E"/></linearGradient>
     <linearGradient id="${g2}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FF2E88"/><stop offset="1" stop-color="#8A0A5C"/></linearGradient>`,
    `<rect x="40" y="100" width="420" height="140" rx="70" fill="url(#${g2})"/><rect x="48" y="108" width="404" height="60" rx="30" fill="#FFFFFF" opacity=".18"/>
     ${T(250, 196, 66, 'Bungee', 'CORRUPTED!', 'url(#' + g + ')', 'stroke="#1A1A1A" stroke-width="3" textLength="380" lengthAdjust="spacingAndGlyphs"')}
     <path d="M402 112 l6 14 l14 6 l-14 6 l-6 14 l-6 -14 l-14 -6 l14 -6 z" fill="#FFF"/>`));
}
{
  const f = ink(2.5, 2.4, 71);
  add(5, 'Штамп «Компромат»', svg(f.def, `<g filter="url(#${f.id})" transform="rotate(-8 250 170)">
     <rect x="44" y="92" width="412" height="156" rx="16" fill="none" stroke="#D0021B" stroke-width="9"/>
     ${T(250, 206, 78, 'Archivo Black', 'CORRUPTED!', '#D0021B', 'textLength="370" lengthAdjust="spacingAndGlyphs"')}
     ${T(250, 236, 16, 'Archivo Black', 'ВИДАНО ДЛЯ ЕФІРУ', '#D0021B', 'letter-spacing="6"')}</g>`));
}
{
  add(5, 'Біжучий рядок новин', svg('', `<rect x="10" y="118" width="480" height="104" fill="#0A1A3A"/><rect x="10" y="118" width="150" height="104" fill="#D0021B"/>
     ${T(85, 162, 22, 'Archivo Black', 'ТЕРМІНОВО', '#FFF')}${T(85, 194, 18, 'Archivo Black', 'LIVE ●', '#FFE200')}
     ${T(323, 192, 54, 'Anton', 'CORRUPTED!', '#FFF', 'textLength="300" lengthAdjust="spacingAndGlyphs"')}<rect x="10" y="222" width="480" height="26" fill="#FFE200"/>
     <text x="20" y="241" font-family="Archivo Black" font-size="15" fill="#0A1A3A">РІД ГРАБСІВ: НОВІ ПОДРОБИЦІ · ДЕПУТАТ НЕ КОМЕНТУЄ · ДОЛАР —</text>`));
}

// ---------------- ERA VI · 2010s · flat, social
{
  const p = []; for (let i = 0; i < 24; i++) { const r = i % 2 ? 128 : 146, a = i / 24 * Math.PI * 2; p.push(`${(250 + Math.cos(a) * r).toFixed(1)},${(170 + Math.sin(a) * r).toFixed(1)}`); }
  add(6, '«Верифіковано»', svg('', `<polygon points="${p.join(' ')}" fill="#E0245E"/>
     <circle cx="250" cy="170" r="108" fill="none" stroke="#FFF" stroke-width="3" stroke-dasharray="2 6"/>
     <path d="M196 116 l20 20 l40 -40" fill="none" stroke="#FFF" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" transform="translate(30 0)"/>
     ${T(250, 210, 40, 'Montserrat', 'CORRUPTED!', '#FFF', 'font-weight="900" textLength="200" lengthAdjust="spacingAndGlyphs"')}
     ${T(250, 238, 13, 'Montserrat', 'ПІДТВЕРДЖЕНИЙ АКАУНТ', '#FFF', 'font-weight="700" letter-spacing="2"')}`));
}
{
  add(6, 'Хештег-стікер', svg('', `<g transform="rotate(-5 250 170)"><rect x="44" y="104" width="412" height="132" rx="66" fill="#FFF" stroke="#111" stroke-width="4"/>
     <rect x="58" y="118" width="384" height="104" rx="52" fill="#00A8A8"/>
     ${T(250, 194, 60, 'Montserrat', '#CORRUPTED', '#FFF', 'font-weight="900" textLength="340" lengthAdjust="spacingAndGlyphs"')}</g>
     <circle cx="430" cy="110" r="26" fill="#E0245E" stroke="#FFF" stroke-width="4"/>${T(430, 119, 24, 'Montserrat', '!', '#FFF', 'font-weight="900"')}`));
}
{
  const f = ink(1.2, 2.8, 79);
  add(6, 'Тонкий штамп', svg(f.def, `<g filter="url(#${f.id})" transform="rotate(-6 250 170)">
     <rect x="60" y="96" width="380" height="148" fill="none" stroke="#E0245E" stroke-width="3"/>
     ${T(250, 210, 96, 'Bebas Neue', 'CORRUPTED!', '#E0245E', 'textLength="340" lengthAdjust="spacingAndGlyphs"')}
     ${T(250, 128, 13, 'Montserrat', 'ЛАЙКІВ: 12 400 · ПОШИРЕНЬ: 3 100', '#E0245E', 'font-weight="700" letter-spacing="2"')}</g>`));
}
{
  add(6, 'Іконка застосунку', svg('', `<rect x="160" y="40" width="180" height="180" rx="42" fill="#111"/><rect x="160" y="40" width="180" height="180" rx="42" fill="none" stroke="#E0245E" stroke-width="6"/>
     ${T(250, 166, 120, 'Montserrat', 'C!', '#E0245E', 'font-weight="900"')}
     ${T(250, 290, 44, 'Montserrat', 'CORRUPTED!', '#111', 'font-weight="900" letter-spacing="1"')}`));
}

// ---------------- ERA VII · 2020s · glitch, digital
{
  add(7, 'Гліч', svg('', `<rect x="20" y="100" width="460" height="140" fill="#0B0F14"/>
     ${T(256, 204, 74, 'Rubik', 'CORRUPTED!', '#00E5FF', 'font-weight="900" opacity=".85" textLength="420" lengthAdjust="spacingAndGlyphs"')}
     ${T(244, 198, 74, 'Rubik', 'CORRUPTED!', '#FF1744', 'font-weight="900" opacity=".85" textLength="420" lengthAdjust="spacingAndGlyphs"')}
     ${T(250, 201, 74, 'Rubik', 'CORRUPTED!', '#FFF', 'font-weight="900" textLength="420" lengthAdjust="spacingAndGlyphs"')}
     <rect x="20" y="150" width="460" height="7" fill="#0B0F14"/><rect x="20" y="178" width="460" height="3" fill="#0B0F14"/>
     <g transform="translate(18 0)"><rect x="150" y="181" width="160" height="12" fill="#0B0F14"/></g><rect x="168" y="181" width="160" height="12" fill="#FF1744" opacity=".5"/>
     ${T(250, 134, 13, 'Space Mono', 'REC ● CAM_04 · ДЕПУТАТСЬКИЙ ПАРКІНГ', '#9AA', '')}`));
}
{
  add(7, 'Термінал', svg('', `<rect x="30" y="70" width="440" height="200" rx="10" fill="#0B0F14"/><circle cx="54" cy="92" r="6" fill="#FF5F56"/><circle cx="74" cy="92" r="6" fill="#FFBD2E"/><circle cx="94" cy="92" r="6" fill="#27C93F"/>
     <text x="52" y="136" font-family="Space Mono" font-size="16" fill="#7CFC9A">$ audit --family grabs</text>
     <text x="52" y="160" font-family="Space Mono" font-size="16" fill="#7CFC9A">&gt; 150 years scanned...</text>
     ${T(250, 222, 54, 'Space Mono', '[CORRUPTED!]', '#FF1744', 'font-weight="700" textLength="390" lengthAdjust="spacingAndGlyphs"')}
     <rect x="52" y="240" width="14" height="20" fill="#7CFC9A"/>`));
}
{
  const hex = (r) => [0, 1, 2, 3, 4, 5].map((i) => { const a = (60 * i - 30) * Math.PI / 180; return `${(250 + r * Math.cos(a)).toFixed(1)},${(170 + r * Math.sin(a)).toFixed(1)}`; }).join(' ');
  add(7, 'Блокчейн-печатка', svg('', `<polygon points="${hex(150)}" fill="#111"/><polygon points="${hex(136)}" fill="none" stroke="#00E5FF" stroke-width="2"/>
     ${T(250, 130, 16, 'Space Mono', '0xC0RRUPT3D', '#00E5FF')}
     ${T(250, 192, 46, 'Rubik', 'CORRUPTED!', '#FFF', 'font-weight="900" textLength="250" lengthAdjust="spacingAndGlyphs"')}
     ${T(250, 228, 14, 'Space Mono', 'hash verified · on-chain', '#00E5FF')}`));
}
{
  let px = ''; const pat = ['1110111', '1000001', '1011101', '1011101', '1011101', '1000001', '1110111'];
  pat.forEach((row, y) => [...row].forEach((c, x) => { if (c === '1') px += `<rect x="${60 + x * 12}" y="${110 + y * 12}" width="12" height="12" fill="#FF1744"/>`; }));
  add(7, 'ШІ-детектор', svg('', `<rect x="40" y="90" width="420" height="160" rx="20" fill="none" stroke="#FF1744" stroke-width="5"/>${px}
     ${T(300, 180, 44, 'Space Mono', 'CORRUPTED!', '#FF1744', 'font-weight="700" textLength="250" lengthAdjust="spacingAndGlyphs"')}
     ${T(300, 214, 12, 'Space Mono', 'AI DETECTED · 99.7% CONFIDENCE', '#FF1744')}`));
}

// ---------------- FINAL · averaged mark
{
  const f = ink(3.2, 2.3, 101), p1 = 'p' + (++uid);
  const fin = (bg) => svg(f.def, `<g filter="url(#${f.id})" transform="rotate(-8 250 170)">
     <rect x="28" y="84" width="444" height="172" rx="8" fill="none" stroke="#C0201A" stroke-width="8"/>
     <rect x="42" y="98" width="416" height="144" rx="4" fill="none" stroke="#C0201A" stroke-width="2.5"/>
     ${T(250, 126, 15, 'Oswald', 'СПРАВА РОДУ ГРАБСІВ · 1874 — 2024', '#C0201A', 'font-weight="700" letter-spacing="4"')}
     ${T(250, 214, 84, 'Alfa Slab One', 'CORRUPTED!', '#C0201A', 'textLength="396" lengthAdjust="spacingAndGlyphs"')}
     ${T(250, 238, 13, 'Oswald', 'ПІДСТАВИ ДЛЯ ЗАКРИТТЯ СПРАВИ — ВІДСУТНІ', '#C0201A', 'font-weight="700" letter-spacing="3"')}</g>`, bg);
  L.final = [{ name: 'Фінальний штамп', svg: fin('transparent') }];
}

const FONTS = ['rye', 'ultra', 'abril-fatface', 'im-fell-english-sc', 'old-standard-tt', 'stalinist-one', 'russo-one', 'rubik-mono-one', 'special-elite', 'oswald', 'ruslan-display', 'pt-mono', 'black-ops-one', 'anton', 'bowlby-one-sc', 'bungee', 'archivo-black', 'bebas-neue', 'rubik-glitch', 'space-mono', 'press-start-2p', 'alfa-slab-one', 'sancreek'];
const links = FONTS.map((f) => `<link rel="stylesheet" href="node_modules/@fontsource/${f}/index.css">`).join('') +
  ['old-standard-tt/700', 'oswald/700', 'montserrat/700', 'montserrat/900', 'rubik/900', 'space-mono/700'].map((f) => `<link rel="stylesheet" href="node_modules/@fontsource/${f}.css">`).join('');
let html = `<!doctype html><meta charset="utf-8">${links}<style>body{margin:0;background:transparent}.s{display:inline-block;width:${W}px;height:${H}px}</style>`;
const order = [];
for (const k of [1, 2, 3, 4, 5, 6, 7, 'final']) L[k].forEach((v, i) => { const id = `e${k}-${i + 1}`; order.push({ id, era: k, name: v.name }); html += `<div class="s" id="${id}">${v.svg}</div>`; });
fs.writeFileSync('logos.html', html);
fs.writeFileSync('logos.json', JSON.stringify(order));
for (const k of Object.keys(L)) L[k].forEach((v, i) => fs.writeFileSync(`out/e${k}-${i + 1}.svg`, v.svg));
console.log(order.length);
