// Where people can walk on the painted city, and what stands in their way. Coordinates are pixels of the painting
// at 1600 x 900 (the panorama image fills a 16:9 box, so an SVG with this viewBox lies exactly over it).
//
// routes   polylines along the ground: cobbles of the Old Town street, the market square between the painted
//          carriages and the monument, the quay. Never over water, roofs or walls. h = a grown man's height in px at
//          the first and the last point (the street comes towards the camera, so people grow as they walk down it).
//          A route's ends lie behind an obstacle, at the edge of the picture or deep in the distance, so people
//          arrive and leave there instead of popping out of thin air.
// occ      obstacles cut out of the painting itself (monument, carriages, carts, lamp posts, the roofs in front):
//          drawn over everyone whose feet are further away than the obstacle's base line.
// spots    places where people stand (a chestnut seller, gossips, a queue).
// lamps    street lamps of this painting: they go out in the morning and come on in the evening, and light up
//          whoever walks under them.
//
// The views of each era are painted from the same point, but the eras are separate paintings, so each has its own map.
export type Pt = [number, number];
export type Zone = 'street' | 'square' | 'quay' | 'road' | 'water';
export interface Route { zone: Zone; pts: Pt[]; h: [number, number]; n: number; /** the route starts at a doorway: people come out of it and go in */ door?: boolean }
export interface Occ { pts: Pt[]; base: number }
export interface Spot { zone: Zone; x: number; y: number; h: number }
export interface CrowdMap { routes: Route[]; occ: Occ[]; spots: Spot[]; lamps: [number, number, number][]; lamplighter: { from: Pt; to: Pt; h: number }; /** where pigeons peck: x, y, height */ pigeons: [number, number, number][] }

/** Era I: the 1880s city. Stop A shows the Old Town street, stop B the right half of the market square, stop C the quay. */
const E1: CrowdMap = {
  routes: [
    // the Old Town street, coming down towards us from the lamp at the corner
    { zone: 'street', pts: [[405, 778], [372, 800], [318, 840], [255, 893], [238, 910]], h: [28, 50], n: 4 },
    { zone: 'street', pts: [[420, 786], [402, 812], [380, 850], [352, 905]], h: [29, 52], n: 3 },
    // out of the lit doorway and down the street, or the other way and in
    { zone: 'street', pts: [[312, 826], [332, 852], [352, 905]], h: [37, 50], n: 2, door: true },
    // through the opera's doors
    { zone: 'square', pts: [[736, 456], [760, 460], [892, 463]], h: [15, 15], n: 2, door: true },
    // the square: in front of the opera (behind the monument), the middle, and two short stretches in front
    { zone: 'square', pts: [[556, 462], [660, 460], [760, 458], [892, 463]], h: [15, 15], n: 6 },
    { zone: 'square', pts: [[588, 501], [650, 501], [700, 504], [760, 501], [860, 500], [925, 497]], h: [17, 17], n: 7 },
    { zone: 'square', pts: [[598, 522], [680, 524], [770, 522]], h: [19, 19], n: 3 },
    { zone: 'square', pts: [[815, 524], [900, 518], [985, 513]], h: [19, 18], n: 3 },
    // the road along the bank to the quay, and the quay itself
    { zone: 'quay', pts: [[884, 492], [1000, 497], [1100, 500], [1200, 503], [1290, 501], [1328, 499]], h: [13, 12], n: 8 },
    // carriages and the horse tram cross in front of the opera
    { zone: 'road', pts: [[548, 470], [700, 469], [905, 472]], h: [15, 15], n: 2 },
    // boats on the open water between the quay and the moored ships
    { zone: 'water', pts: [[1180, 472], [1400, 462], [1640, 450]], h: [12, 11], n: 2 },
    { zone: 'water', pts: [[1330, 440], [1640, 425]], h: [10, 10], n: 1 }
  ],
  occ: [
    // the monument: column and basin
    { pts: [[692, 393], [709, 393], [711, 461], [748, 469], [753, 487], [736, 498], [664, 498], [656, 486], [661, 470], [690, 461]], base: 498 },
    // painted carriages
    { pts: [[542, 468], [601, 467], [605, 497], [542, 497]], base: 497 },
    { pts: [[757, 504], [808, 502], [833, 511], [835, 543], [757, 543]], base: 543 },
    { pts: [[872, 477], [927, 477], [929, 501], [872, 501]], base: 501 },
    // lamp posts in the square and in the street
    { pts: [[644, 444], [651, 444], [652, 514], [643, 514]], base: 514 },
    { pts: [[264, 828], [273, 828], [274, 866], [263, 866]], base: 866 },
    { pts: [[394, 803], [403, 803], [404, 900], [393, 900]], base: 900 },
    // the roofs in front of the square and the quay
    { pts: [[480, 484], [585, 556], [622, 540], [668, 529], [762, 529], [800, 546], [842, 531], [880, 516], [1000, 513], [1200, 512], [1330, 520], [1600, 522], [1600, 900], [480, 900]], base: 2000 }
  ],
  spots: [
    { zone: 'square', x: 803, y: 486, h: 16 }, { zone: 'square', x: 618, y: 482, h: 16 }, { zone: 'square', x: 945, y: 482, h: 16 },
    { zone: 'square', x: 872, y: 458, h: 15 }, { zone: 'quay', x: 1150, y: 501, h: 13 }, { zone: 'quay', x: 1262, y: 501, h: 12 },
    { zone: 'street', x: 340, y: 860, h: 42 }
  ],
  lamps: [[170, 815, 16], [267, 772, 15], [397, 725, 12], [397, 812, 15], [610, 418, 8], [645, 450, 9], [672, 422, 8], [718, 422, 8], [750, 450, 9], [797, 421, 8], [840, 428, 8], [855, 455, 9], [915, 451, 9], [624, 487, 10], [912, 445, 9], [1100, 476, 10], [1205, 475, 10]],
  lamplighter: { from: [742, 512], to: [845, 512], h: 15 },
  pigeons: [[815, 490, 15], [640, 515, 17]]
};

/** Era II: the same city in war and revolution; the square is strewn with carts and wreckage */
const E2: CrowdMap = {
  routes: [
    { zone: 'street', pts: [[396, 799], [350, 825], [300, 860], [250, 895], [235, 908]], h: [29, 50], n: 4 },
    { zone: 'street', pts: [[412, 801], [392, 825], [365, 860], [330, 905]], h: [29, 52], n: 3 },
    { zone: 'street', pts: [[316, 818], [334, 852], [345, 905]], h: [37, 50], n: 2, door: true },
    { zone: 'square', pts: [[735, 458], [760, 458], [900, 460]], h: [16, 16], n: 2, door: true },
    // in front of the opera, between the wreckage, and along the tram rails in front
    { zone: 'square', pts: [[552, 458], [640, 457], [760, 457], [900, 460]], h: [16, 16], n: 6 },
    { zone: 'square', pts: [[600, 503], [700, 505], [790, 503], [900, 500], [1000, 503]], h: [18, 18], n: 6 },
    { zone: 'square', pts: [[688, 565], [800, 567], [950, 568], [1050, 563], [1102, 558]], h: [21, 20], n: 5 },
    // the jetty
    { zone: 'quay', pts: [[1100, 533], [1180, 527], [1262, 519]], h: [13, 12], n: 4 },
    { zone: 'road', pts: [[560, 548], [750, 556], [960, 560], [1110, 552]], h: [19, 19], n: 2 },
    // boats between the jetty and the breakwater, above the gunboat
    { zone: 'water', pts: [[1270, 458], [1440, 450], [1640, 440]], h: [11, 10], n: 2 }
  ],
  occ: [
    // the monument and its base
    { pts: [[683, 380], [702, 380], [704, 478], [735, 486], [737, 508], [652, 510], [650, 488], [681, 478]], base: 510 },
    // wreckage and carts in front of the opera
    { pts: [[538, 462], [652, 460], [652, 492], [538, 494]], base: 494 },
    { pts: [[714, 465], [832, 465], [834, 497], [714, 497]], base: 497 },
    // the tram car, the motor car, the cart, the benches, more wreckage
    { pts: [[498, 498], [562, 498], [562, 546], [498, 546]], base: 546 },
    { pts: [[744, 513], [802, 513], [804, 551], [744, 551]], base: 551 },
    { pts: [[800, 503], [916, 503], [918, 546], [800, 546]], base: 546 },
    { pts: [[918, 512], [1042, 512], [1044, 561], [918, 561]], base: 561 },
    { pts: [[558, 532], [682, 532], [684, 572], [558, 572]], base: 572 },
    // lamp posts
    { pts: [[616, 504], [625, 504], [626, 586], [615, 586]], base: 586 },
    { pts: [[1052, 488], [1061, 488], [1062, 562], [1051, 562]], base: 562 },
    { pts: [[268, 765], [277, 765], [278, 862], [267, 862]], base: 862 },
    { pts: [[396, 805], [405, 805], [406, 900], [395, 900]], base: 900 },
    // the roofs in front
    { pts: [[480, 572], [560, 582], [700, 580], [820, 585], [960, 582], [1100, 576], [1140, 560], [1320, 546], [1600, 545], [1600, 900], [480, 900]], base: 2000 }
  ],
  spots: [
    { zone: 'square', x: 870, y: 482, h: 17 }, { zone: 'square', x: 990, y: 484, h: 17 }, { zone: 'square', x: 600, y: 522, h: 19 },
    { zone: 'quay', x: 1150, y: 531, h: 13 }, { zone: 'street', x: 330, y: 856, h: 42 }
  ],
  lamps: [[188, 795, 15], [272, 770, 14], [400, 812, 12], [538, 433, 9], [667, 428, 9], [752, 430, 9], [836, 437, 9], [895, 463, 9], [620, 506, 10], [1058, 494, 10], [1225, 488, 9], [602, 422, 8], [715, 427, 8], [797, 430, 8]],
  lamplighter: { from: [700, 504], to: [900, 500], h: 15 },
  pigeons: [[850, 503, 18], [1000, 566, 20]]
};

export const CROWD: Record<1 | 2, CrowdMap> = { 1: E1, 2: E2 };
