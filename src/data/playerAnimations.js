import idleUrl from "../assets/player/Soldier-Idle.png";
import walkUrl from "../assets/player/Soldier-Walk.png";
import attack1Url from "../assets/player/Soldier-Attack01.png";
import attack2Url from "../assets/player/Soldier-Attack02.png";
import attack3Url from "../assets/player/Soldier-Attack03.png";
import hurtUrl from "../assets/player/Soldier-Hurt.png";
import deathUrl from "../assets/player/Soldier-Death.png";
import shadowUrl from "../assets/player/Soldier-Shadow.png";
import attackShadowUrl from "../assets/player/Soldier-Shadow_attack2.png";

const base = {
  frameWidth: 100,
  frameHeight: 100,
  scale: 3,
  offsetX: 0,
  offsetY: 132
};

export const PLAYER_ANIMATIONS = {
  idle: {
    ...base,
    image: idleUrl,
    frameCount: 6,
    fps: 7,
    loop: true
  },
  walk: {
    ...base,
    image: walkUrl,
    frameCount: 8,
    fps: 12,
    loop: true
  },
  attack1: {
    ...base,
    image: attack1Url,
    shadow: attackShadowUrl,
    frameCount: 6,
    fps: 18,
    loop: false,
    duration: 0.34,
    offsetY: 123
  },
  attack2: {
    ...base,
    image: attack2Url,
    shadow: attackShadowUrl,
    frameCount: 6,
    fps: 18,
    loop: false,
    duration: 0.34,
    offsetY: 126
  },
  attack3: {
    ...base,
    image: attack3Url,
    shadow: attackShadowUrl,
    frameCount: 9,
    fps: 20,
    loop: false,
    duration: 0.46,
    offsetY: 129
  },
  hurt: {
    ...base,
    image: hurtUrl,
    frameCount: 4,
    fps: 14,
    loop: false,
    duration: 0.28
  },
  death: {
    ...base,
    image: deathUrl,
    frameCount: 4,
    fps: 8,
    loop: false,
    duration: 0.5,
    holdLast: true
  }
};

export const PLAYER_SHADOW = {
  image: shadowUrl,
  frameWidth: 100,
  frameHeight: 100,
  frameCount: 1,
  scale: 3,
  offsetX: 0,
  offsetY: 132
};
