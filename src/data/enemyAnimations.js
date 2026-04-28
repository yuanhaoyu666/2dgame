import fatEnemySheetUrl from "../assets/enemies/fat/FatEnemy-Sheet.png";
import bossIdleUrl from "../assets/enemies/boss/boss_idle.png";
import bossWalkUrl from "../assets/enemies/boss/boss_walk.png";
import bossAttackUrl from "../assets/enemies/boss/boss_attack.png";
import bossDashUrl from "../assets/enemies/boss/boss_dash.png";
import bossHurtUrl from "../assets/enemies/boss/boss_hurt.png";
import bossDeathUrl from "../assets/enemies/boss/boss_death.png";
import wolfIdleUrl from "../assets/enemies/wolf/wolf_idle.png";
import wolfWalkUrl from "../assets/enemies/wolf/wolf_walk.png";
import wolfDashUrl from "../assets/enemies/wolf/wolf_dash.png";
import wolfAttackUrl from "../assets/enemies/wolf/wolf_attack.png";
import wolfHurtUrl from "../assets/enemies/wolf/wolf_hurt.png";
import wolfDeathUrl from "../assets/enemies/wolf/wolf_death.png";

const frame = (x, y, w = 72, h = 96) => ({ x, y, w, h });

const baseFat = {
  image: fatEnemySheetUrl,
  scale: 1.12,
  offsetX: 0,
  offsetY: 4
};

export const FAT_ENEMY_SHEET = fatEnemySheetUrl;

export const FAT_ENEMY_ANIMATIONS = {
  idle: {
    frames: [frame(30, 48), frame(125, 48), frame(220, 48), frame(315, 48)],
    fps: 5,
    loop: true,
    ...baseFat
  },
  walk: {
    frames: [frame(445, 48), frame(535, 48), frame(625, 48), frame(715, 48), frame(805, 48)],
    fps: 8,
    loop: true,
    ...baseFat
  },
  dash: {
    frames: [frame(930, 48), frame(1022, 48), frame(1115, 48), frame(1210, 48), frame(1300, 48)],
    fps: 12,
    loop: false,
    ...baseFat
  },
  punch: {
    frames: [frame(30, 220, 86, 96), frame(135, 220, 86, 96), frame(250, 220, 86, 96), frame(358, 220, 86, 96), frame(466, 220, 86, 96), frame(545, 220, 86, 96)],
    fps: 14,
    loop: false,
    ...baseFat
  },
  bellySlam: {
    frames: [frame(620, 210, 86, 112), frame(720, 210, 86, 112), frame(820, 210, 86, 112), frame(930, 230, 98, 96), frame(1050, 230, 98, 96), frame(1210, 230, 98, 96)],
    fps: 12,
    loop: false,
    ...baseFat
  },
  charge: {
    frames: [frame(30, 390, 82, 104), frame(140, 390, 82, 104), frame(250, 390, 82, 104), frame(365, 390, 92, 104), frame(475, 390, 92, 104), frame(580, 390, 92, 104)],
    fps: 14,
    loop: false,
    ...baseFat
  },
  fatMissile: {
    frames: [frame(730, 392), frame(830, 392), frame(930, 392), frame(1028, 392)],
    fps: 11,
    loop: false,
    ...baseFat
  },
  hurt: {
    frames: [frame(30, 558), frame(130, 558), frame(230, 558), frame(335, 558), frame(440, 558)],
    fps: 10,
    loop: false,
    ...baseFat
  },
  death: {
    frames: [frame(620, 558, 84, 96), frame(720, 558, 84, 96), frame(825, 558, 92, 96), frame(935, 558, 100, 96), frame(1050, 558, 115, 96), frame(1260, 558, 115, 96)],
    fps: 8,
    loop: false,
    holdLast: true,
    ...baseFat
  },
  burpJet: {
    frames: [frame(30, 755, 112, 105), frame(160, 755, 118, 105), frame(300, 755, 130, 105), frame(440, 755, 150, 105)],
    fps: 10,
    loop: false,
    scale: 1.08,
    offsetX: 20,
    offsetY: 4
  },
  fartShockwave: {
    frames: [frame(610, 755, 112, 105), frame(730, 755, 135, 105), frame(875, 755, 155, 105), frame(1035, 755, 165, 105)],
    fps: 10,
    loop: false,
    scale: 1.08,
    offsetX: 10,
    offsetY: 4
  }
};

export const FAT_MISSILE_FRAMES = [
  frame(1030, 410, 95, 60),
  frame(1140, 410, 95, 60),
  frame(1255, 410, 95, 60)
];

const baseWolf = {
  imagePath: "src/assets/enemies/wolf/wolf_*.png",
  scale: 0.78,
  offsetX: 0,
  offsetY: 3
};

export const WOLF_ANIMATIONS = {
  idle: {
    image: wolfIdleUrl,
    frameCount: 6,
    frameDuration: 0.12,
    loop: true,
    ...baseWolf
  },
  walk: {
    image: wolfWalkUrl,
    frameCount: 8,
    frameDuration: 0.1,
    loop: true,
    ...baseWolf
  },
  dash: {
    image: wolfDashUrl,
    ...baseWolf,
    frameCount: 6,
    frameDuration: 0.08,
    loop: false,
    scale: 0.8,
    offsetX: 2,
    offsetY: 3
  },
  attack: {
    image: wolfAttackUrl,
    ...baseWolf,
    frameCount: 8,
    frameDuration: 0.1,
    loop: false,
    scale: 0.8,
    offsetX: 6,
    offsetY: 3
  },
  hurt: {
    image: wolfHurtUrl,
    frameCount: 4,
    frameDuration: 0.12,
    loop: false,
    ...baseWolf
  },
  death: {
    image: wolfDeathUrl,
    frameCount: 8,
    frameDuration: 0.12,
    loop: false,
    holdLast: true,
    ...baseWolf
  }
};

const baseBoss = {
  imagePath: "src/assets/enemies/boss/boss_*.png",
  scale: 1.65,
  offsetX: 0,
  offsetY: 8
};

export const BOSS_ANIMATIONS = {
  idle: {
    image: bossIdleUrl,
    frameCount: 6,
    frameDuration: 0.14,
    loop: true,
    ...baseBoss
  },
  walk: {
    image: bossWalkUrl,
    frameCount: 8,
    frameDuration: 0.1,
    loop: true,
    ...baseBoss
  },
  dash: {
    image: bossDashUrl,
    frameCount: 6,
    frameDuration: 0.08,
    loop: false,
    ...baseBoss
  },
  attack: {
    image: bossAttackUrl,
    frameCount: 8,
    frameDuration: 0.09,
    loop: false,
    ...baseBoss
  },
  slash: {
    image: bossAttackUrl,
    frameCount: 8,
    frameDuration: 0.09,
    loop: false,
    ...baseBoss
  },
  heavy: {
    image: bossAttackUrl,
    frameCount: 8,
    frameDuration: 0.1,
    loop: false,
    ...baseBoss
  },
  hurt: {
    image: bossHurtUrl,
    frameCount: 3,
    frameDuration: 0.1,
    loop: false,
    ...baseBoss
  },
  death: {
    image: bossDeathUrl,
    frameCount: 8,
    frameDuration: 0.12,
    loop: false,
    holdLast: true,
    ...baseBoss
  },
  rage: {
    image: bossIdleUrl,
    frameCount: 6,
    frameDuration: 0.12,
    loop: true,
    ...baseBoss
  }
};
