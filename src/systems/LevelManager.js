import { Enemy } from "../entities/Enemy.js";

const ground = (x, w) => ({ x, y: 468, w, h: 80, kind: "ground" });
const block = (x, y, w, h) => ({ x, y, w, h, kind: "ruin" });
const platform = (x, y, w) => ({ x, y, w, h: 24, kind: "platform" });
const crate = (x, y) => ({ x, y, w: 42, h: 42, kind: "crate", hp: 30, destructible: true });
const bridge = (x, y, w) => ({ x, y, w, h: 18, kind: "bridge" });
const deco = (type, x, y, variant = 0) => ({ type, x, y, variant });
const bossStats = (tier) => ({
  1: {
    bossTier: 1,
    name: "鬼面将军 一阶",
    hp: 220,
    speed: 82,
    damage: 12,
    cooldown: 1.05,
    range: 58,
    gold: 30,
    w: 62,
    h: 82,
    hurtbox: { x: -14, y: -16, w: 90, h: 104 }
  },
  2: {
    bossTier: 2,
    name: "鬼面将军 二阶",
    hp: 320,
    speed: 92,
    damage: 15,
    cooldown: 0.9,
    range: 60,
    gold: 45,
    w: 64,
    h: 84,
    hurtbox: { x: -14, y: -16, w: 92, h: 106 }
  },
  3: {
    bossTier: 3,
    name: "鬼面将军 三阶",
    hp: 430,
    speed: 102,
    damage: 18,
    cooldown: 0.78,
    range: 62,
    gold: 65,
    w: 66,
    h: 86,
    hurtbox: { x: -15, y: -18, w: 96, h: 110 }
  },
  4: {
    bossTier: 4,
    name: "鬼面将军 终阶",
    hp: 620,
    speed: 112,
    damage: 24,
    cooldown: 0.62,
    range: 66,
    gold: 100,
    w: 70,
    h: 90,
    hurtbox: { x: -18, y: -22, w: 106, h: 118 }
  }
}[tier]);

const LEVELS = [
  {
    theme: "tower",
    width: 2380,
    spawn: { x: 80, y: 350 },
    exit: { x: 2150, y: 144 },
    solids: [
      ground(0, 900),
      bridge(900, 438, 180),
      ground(1080, 300),
      platform(420, 384, 180),
      block(710, 418, 120, 50),
      crate(1160, 426),
      platform(1320, 468, 900),
      platform(1380, 352, 820),
      platform(1480, 236, 720),
      platform(1600, 136, 580),
      block(2180, 208, 42, 260),
      crate(1510, 426),
      crate(1710, 310),
      crate(1880, 194)
    ],
    decorations: [
      deco("brokenWall", 250, 404),
      deco("flag", 760, 390),
      deco("rubble", 990, 450),
      deco("towerWall", 1320, 196),
      deco("ladder", 1440, 468),
      deco("ladder", 1800, 352),
      deco("ladder", 2090, 236),
      deco("sideWall", 1378, 352),
      deco("sideWall", 2162, 352),
      deco("sideWall", 1478, 236),
      deco("sideWall", 2162, 236),
      deco("lantern", 1450, 316),
      deco("lantern", 1560, 200),
      deco("lantern", 1700, 100),
      deco("flag", 2060, 103),
      deco("rubble", 1980, 190)
    ],
    ladders: [
      { x: 1418, y: 352, w: 58, h: 116, targetX: 1460, targetY: 304, label: "第二层" },
      { x: 1788, y: 236, w: 58, h: 116, targetX: 1815, targetY: 188, label: "第三层" },
      { x: 2078, y: 136, w: 58, h: 100, targetX: 2105, targetY: 88, label: "第四层" }
    ],
    enemies: [
      ["goblin", 1500, 416, 1390, 1720],
      ["goblin", 1910, 416, 1760, 2140],
      ["goblin", 1580, 300, 1420, 1800],
      ["goblin", 1980, 300, 1820, 2140],
      ["goblin", 1740, 184, 1520, 2030]
    ]
  },
  {
    theme: "bridge",
    width: 2700,
    spawn: { x: 80, y: 350 },
    exit: { x: 2550, y: 404 },
    solids: [
      ground(0, 600),
      bridge(610, 438, 110),
      bridge(760, 438, 150),
      ground(940, 430),
      bridge(1370, 432, 170),
      ground(1550, 520),
      ground(2180, 520),
      platform(390, 372, 220),
      platform(760, 390, 230),
      platform(1240, 365, 240),
      platform(1850, 392, 250),
      platform(2220, 370, 260),
      crate(1050, 426),
      crate(2310, 328)
    ],
    decorations: [
      deco("flag", 510, 342),
      deco("brokenWall", 980, 404),
      deco("rubble", 1410, 414),
      deco("stonePillar", 1640, 372),
      deco("flag", 2000, 358),
      deco("rubble", 2460, 450)
    ],
    enemies: [
      ["goblin", 520, 320, 390, 610],
      ["wolf", 990, 420, 940, 1280],
      ["goblin", 1360, 320, 1240, 1480],
      ["wolf", 1770, 390, 1600, 2020],
      ["goblin", 2050, 340, 1850, 2120],
      ["wolf", 2360, 318, 2220, 2580]
    ]
  },
  {
    theme: "town",
    width: 3200,
    spawn: { x: 80, y: 350 },
    exit: { x: 3060, y: 404 },
    solids: [
      ground(0, 520),
      bridge(520, 438, 150),
      ground(700, 500),
      bridge(1210, 438, 140),
      ground(1370, 470),
      ground(1980, 430),
      bridge(2410, 438, 120),
      ground(2540, 660),
      platform(330, 380, 220),
      platform(720, 390, 220),
      platform(1030, 365, 260),
      platform(1490, 386, 260),
      platform(1830, 346, 230),
      platform(2140, 382, 240),
      block(2220, 398, 120, 70),
      platform(2720, 382, 220),
      platform(2920, 342, 180),
      crate(870, 426),
      crate(2320, 426),
      crate(2810, 340)
    ],
    decorations: [
      deco("house", 760, 312),
      deco("lantern", 1120, 330),
      deco("barrel", 1280, 426),
      deco("brokenDoor", 1510, 402),
      deco("house", 1760, 286),
      deco("lantern", 2050, 346),
      deco("barrel", 2360, 426),
      deco("brokenWall", 2620, 394),
      deco("lantern", 2940, 304)
    ],
    enemies: [
      ["goblin", 430, 330, 330, 520],
      ["wolf", 820, 340, 720, 930],
      ["goblin", 1150, 315, 1030, 1290],
      ["wolf", 1530, 338, 1450, 1740],
      ["goblin", 1900, 298, 1830, 2050],
      ["wolf", 2220, 332, 2140, 2380],
      ["goblin", 2630, 350, 2540, 2780],
      ["wolf", 2960, 294, 2920, 3100]
    ]
  },
  {
    theme: "arena",
    width: 2200,
    spawn: { x: 120, y: 350 },
    exit: { x: 2050, y: 404 },
    solids: [
      ground(0, 2200),
      block(320, 430, 110, 38),
      block(1760, 430, 110, 38),
      platform(680, 404, 250),
      platform(1270, 404, 250)
    ],
    decorations: [
      deco("bossGate", 940, 238),
      deco("blackFlag", 460, 340),
      deco("blackFlag", 1680, 340),
      deco("throne", 1060, 388),
      deco("stonePillar", 250, 370),
      deco("stonePillar", 1900, 370),
      deco("rubble", 1120, 450)
    ],
    enemies: [["boss", 1460, 378, 520, 2050, bossStats(4)]]
  }
];

const SAFE_ROOM = {
  theme: "safe",
  width: 1200,
  spawn: { x: 80, y: 350 },
  exit: { x: 1080, y: 404 },
  killY: 680,
  solids: [ground(0, 1200), platform(430, 382, 260), crate(315, 426), crate(680, 426)],
  decorations: [deco("lantern", 260, 390), deco("stonePillar", 760, 370), deco("flag", 980, 370)],
  enemies: []
};

export class LevelManager {
  constructor() {
    this.level = 1;
    this.current = this.makeCombatLevel(1);
  }

  makeCombatLevel(level) {
    const data = LEVELS[level - 1];
    return {
      ...data,
      killY: 700,
      number: level,
      mode: "combat",
      solids: data.solids.map((solid) => ({ ...solid })),
      decorations: (data.decorations ?? []).map((item) => ({ ...item })),
      ladders: (data.ladders ?? []).map((item) => ({ ...item })),
      portal: { x: data.exit.x, y: data.exit.y, w: 42, h: 64 }
    };
  }

  makeSafeRoom() {
    return {
      ...SAFE_ROOM,
      mode: "safe",
      number: this.level,
      solids: SAFE_ROOM.solids.map((solid) => ({ ...solid })),
      decorations: SAFE_ROOM.decorations.map((item) => ({ ...item })),
      ladders: [],
      portal: { x: SAFE_ROOM.exit.x, y: SAFE_ROOM.exit.y, w: 42, h: 64 }
    };
  }

  startLevel(level, player) {
    this.level = level;
    this.current = this.makeCombatLevel(level);
    player.setSpawn(this.current.spawn.x, this.current.spawn.y);
    return this.current.enemies.map(([type, x, y, min, max, overrides]) => new Enemy(type, x, y, min, max, overrides));
  }

  enterSafeRoom(player) {
    this.current = this.makeSafeRoom();
    player.setSpawn(this.current.spawn.x, this.current.spawn.y);
  }

  clearReward() {
    return 15 + this.level * 5;
  }
}
