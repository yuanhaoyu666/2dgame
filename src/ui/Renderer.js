import { SHOP_ITEMS, WEAPONS } from "../data/weapons.js";
import { PLAYER_ANIMATIONS, PLAYER_SHADOW } from "../data/playerAnimations.js";
import { BOSS_ANIMATIONS, FAT_ENEMY_ANIMATIONS, FAT_ENEMY_SHEET, FAT_MISSILE_FRAMES, WOLF_ANIMATIONS } from "../data/enemyAnimations.js";
import { PROJECTILE_ASSETS } from "../data/projectiles.js";

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.ctx.imageSmoothingEnabled = false;
    this.images = new Map();
    this.processedImages = new Map();
    this.loadPlayerImages();
    this.loadEnemyImages();
    this.loadProjectileImages();
  }

  clear() {
    this.ctx.imageSmoothingEnabled = false;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  loadPlayerImages() {
    const sources = new Set([PLAYER_SHADOW.image]);
    for (const anim of Object.values(PLAYER_ANIMATIONS)) {
      sources.add(anim.image);
      if (anim.shadow) sources.add(anim.shadow);
    }
    for (const src of sources) {
      const image = new Image();
      image.src = src;
      this.images.set(src, image);
    }
  }

  loadEnemyImages() {
    const sources = new Set([FAT_ENEMY_SHEET]);
    for (const animations of [FAT_ENEMY_ANIMATIONS, WOLF_ANIMATIONS, BOSS_ANIMATIONS]) {
      for (const anim of Object.values(animations)) {
        if (anim.image) sources.add(anim.image);
      }
    }
    for (const src of sources) {
      this.loadChromaKeyedSheet(src, { darkThreshold: 34, removeDarkBlue: true });
    }
  }

  loadChromaKeyedSheet(src, options = {}) {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext("2d");
      context.imageSmoothingEnabled = false;
      context.drawImage(image, 0, 0);
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < pixels.data.length; i += 4) {
        const r = pixels.data[i];
        const g = pixels.data[i + 1];
        const b = pixels.data[i + 2];
        const darkThreshold = options.darkThreshold ?? 18;
        const darkPixel = r < darkThreshold && g < darkThreshold && b < darkThreshold;
        const darkBlueBackdrop = options.removeDarkBlue && r < 34 && g < 38 && b < 52 && b >= r;
        if (darkPixel || darkBlueBackdrop) pixels.data[i + 3] = 0;
      }
      context.putImageData(pixels, 0, 0);
      this.processedImages.set(src, canvas);
    };
    image.src = src;
    this.images.set(src, image);
  }

  loadProjectileImages() {
    for (const asset of Object.values(PROJECTILE_ASSETS)) {
      const image = new Image();
      image.src = asset.image;
      this.images.set(asset.image, image);
    }
  }

  sx(x, camera) {
    return Math.round(x - camera.x + camera.shakeX);
  }

  sy(y, camera) {
    return Math.round(y + camera.shakeY);
  }

  drawWorld(game) {
    this.drawSky(game);
    this.drawParallaxRuins(game);
    this.drawDecorations(game, "back");
    this.drawSolids(game.levels.current, game.camera);
    this.drawDecorations(game, "front");
  }

  drawSky(game) {
    const ctx = this.ctx;
    const theme = game.levels.current.theme ?? "tower";
    const sky = {
      tower: ["#ff874d", "#ffd36f", "#26313c"],
      bridge: ["#f37d4c", "#edc66c", "#263948"],
      town: ["#c8665a", "#e1a75d", "#252a35"],
      arena: ["#3c2934", "#8a3d45", "#12151f"],
      safe: ["#54775a", "#d0a85f", "#28352d"]
    }[theme] ?? ["#ff7847", "#ffd46d", "#252e39"];
    const gradient = ctx.createLinearGradient(0, 0, 0, 540);
    gradient.addColorStop(0, sky[0]);
    gradient.addColorStop(0.48, sky[1]);
    gradient.addColorStop(1, sky[2]);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 960, 540);

    ctx.fillStyle = theme === "arena" ? "rgba(210, 215, 235, 0.72)" : "rgba(255, 250, 185, 0.86)";
    ctx.beginPath();
    ctx.arc((theme === "arena" ? 730 : 178) - game.camera.x * 0.08, theme === "arena" ? 130 : 232, theme === "arena" ? 48 : 78, 0, Math.PI * 2);
    ctx.fill();
  }

  drawParallaxRuins(game) {
    const ctx = this.ctx;
    const cam = game.camera.x;
    const theme = game.levels.current.theme ?? "tower";
    const farColor = theme === "arena" ? "#2c2030" : theme === "bridge" ? "#8d5a5f" : theme === "town" ? "#7c4a58" : "#a95a5c";
    const midColor = theme === "arena" ? "#181720" : theme === "bridge" ? "#4d4555" : theme === "town" ? "#4e394c" : "#61415a";
    this.mountainLayer(cam * 0.08, theme);
    this.ruinLayer(cam * 0.18, 354, farColor, 0.52, theme);
    this.ruinLayer(cam * 0.34, 414, midColor, 0.72, theme);
    ctx.fillStyle = theme === "arena" ? "rgba(9, 11, 18, 0.82)" : "rgba(17, 24, 33, 0.72)";
    for (let x = -120 - (cam * 0.5) % 260; x < 1100; x += 260) {
      ctx.fillRect(x, 388, 160, 120);
      ctx.clearRect(x + 24, 430, 26, 78);
      ctx.clearRect(x + 95, 424, 24, 84);
      ctx.fillRect(x + 130, 360, 18, 28);
    }
  }

  mountainLayer(offset, theme) {
    const ctx = this.ctx;
    ctx.globalAlpha = theme === "arena" ? 0.32 : 0.38;
    ctx.fillStyle = theme === "bridge" ? "#5d6172" : theme === "arena" ? "#191a24" : "#6a5b67";
    ctx.beginPath();
    ctx.moveTo(-80 - (offset % 360), 358);
    for (let x = -80 - (offset % 360); x < 1120; x += 180) {
      ctx.lineTo(x + 90, 250 + ((x / 180) % 2) * 34);
      ctx.lineTo(x + 180, 358);
    }
    ctx.lineTo(1100, 540);
    ctx.lineTo(-100, 540);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  ruinLayer(offset, baseY, color, alpha, theme = "tower") {
    const ctx = this.ctx;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    for (let x = -180 - (offset % 320); x < 1100; x += 320) {
      const towerBoost = theme === "arena" ? 70 : 0;
      ctx.fillRect(x, baseY - 90 - towerBoost, 120, 150 + towerBoost);
      ctx.fillRect(x + 28, baseY - 126 - towerBoost, 62, 40);
      ctx.fillRect(x + 170, baseY - 54, 92, 114);
      if (theme === "town") {
        ctx.fillRect(x + 205, baseY - 95, 44, 42);
        ctx.fillRect(x + 188, baseY - 112, 78, 18);
      }
      ctx.clearRect(x + 34, baseY - 40, 20, 58);
      ctx.clearRect(x + 188, baseY - 14, 24, 54);
    }
    ctx.globalAlpha = 1;
  }

  drawSolids(level, camera) {
    const ctx = this.ctx;
    for (const solid of level.solids) {
      if (solid.destroyed) continue;
      const x = this.sx(solid.x, camera);
      const y = this.sy(solid.y, camera);
      if (x > 1000 || x + solid.w < -60) continue;
      const palette = {
        ground: ["#101820", "#2c3f31"],
        platform: ["#171d26", "#3d3943"],
        ruin: ["#1a2028", "#4a3e46"],
        crate: ["#5f3f2b", "#9b6a3c"],
        bridge: ["#2b1f1f", "#7d5642"]
      }[solid.kind] ?? ["#1a2028", "#30303a"];
      ctx.fillStyle = palette[0];
      ctx.fillRect(x, y, solid.w, solid.h);
      ctx.fillStyle = palette[1];
      ctx.fillRect(x, y, solid.w, Math.min(10, solid.h));
      ctx.fillStyle = "rgba(124, 181, 112, 0.58)";
      if (solid.kind === "ground" || solid.kind === "platform") {
        for (let i = 8; i < solid.w; i += 54) ctx.fillRect(x + i, y - 4, 22, 4);
      }
      ctx.fillStyle = "rgba(239, 154, 119, 0.36)";
      for (let i = 0; i < solid.w; i += 38) ctx.fillRect(x + i + 5, y + 16, 22, 4);
      ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
      ctx.fillRect(x, y + solid.h - Math.min(10, solid.h), solid.w, Math.min(10, solid.h));
      ctx.strokeStyle = "rgba(230, 205, 160, 0.22)";
      ctx.lineWidth = 2;
      for (let i = 18; i < solid.w; i += 86) {
        ctx.beginPath();
        ctx.moveTo(x + i, y + 13);
        ctx.lineTo(x + i + 18, y + 20);
        ctx.lineTo(x + i + 8, y + 28);
        ctx.stroke();
      }
      if (solid.kind === "crate") {
        ctx.strokeStyle = "#2a1f18";
        ctx.lineWidth = 3;
        ctx.strokeRect(x + 4, y + 4, solid.w - 8, solid.h - 8);
        ctx.beginPath();
        ctx.moveTo(x + 8, y + 8);
        ctx.lineTo(x + solid.w - 8, y + solid.h - 8);
        ctx.moveTo(x + solid.w - 8, y + 8);
        ctx.lineTo(x + 8, y + solid.h - 8);
        ctx.stroke();
      }
    }
  }

  drawDecorations(game, layer) {
    const decorations = game.levels.current.decorations ?? [];
    const camera = game.camera;
    for (const item of decorations) {
      const front = ["rubble", "barrel", "lantern"].includes(item.type);
      if ((layer === "front") !== front) continue;
      this.drawDecoration(item, camera);
    }
  }

  drawDecoration(item, camera) {
    const ctx = this.ctx;
    const x = this.sx(item.x, camera);
    const y = this.sy(item.y, camera);
    if (x < -180 || x > 1120) return;
    if (item.type === "flag" || item.type === "blackFlag") {
      ctx.fillStyle = "#17161b";
      ctx.fillRect(x, y - 58, 6, 70);
      ctx.fillStyle = item.type === "blackFlag" ? "#07070a" : "#923d35";
      ctx.fillRect(x + 6, y - 58, 42, 24);
      ctx.fillRect(x + 30, y - 38, 18, 12);
    } else if (item.type === "lantern") {
      ctx.fillStyle = "#2a1b16";
      ctx.fillRect(x, y - 42, 4, 46);
      ctx.fillStyle = "#f3b45e";
      ctx.fillRect(x - 8, y - 18, 20, 18);
      ctx.fillStyle = "rgba(244, 190, 98, 0.25)";
      ctx.fillRect(x - 18, y - 25, 40, 32);
    } else if (item.type === "rubble") {
      ctx.fillStyle = "#5b534d";
      ctx.fillRect(x, y, 28, 10);
      ctx.fillRect(x + 34, y + 4, 18, 8);
      ctx.fillRect(x + 58, y - 4, 12, 12);
    } else if (item.type === "brokenWall") {
      ctx.fillStyle = "#2f3035";
      ctx.fillRect(x, y - 52, 70, 68);
      ctx.clearRect(x + 12, y - 30, 18, 46);
      ctx.fillStyle = "#4d3b43";
      ctx.fillRect(x + 44, y - 70, 34, 18);
    } else if (item.type === "stonePillar") {
      ctx.fillStyle = "#33353c";
      ctx.fillRect(x, y - 72, 34, 88);
      ctx.fillStyle = "#57515a";
      ctx.fillRect(x - 8, y - 80, 50, 10);
      ctx.fillRect(x - 6, y + 8, 46, 8);
    } else if (item.type === "towerWall") {
      ctx.fillStyle = "rgba(20, 22, 28, 0.48)";
      ctx.fillRect(x, y, 900, 288);
      ctx.fillStyle = "rgba(98, 64, 70, 0.38)";
      for (let i = 28; i < 850; i += 86) ctx.fillRect(x + i, y + 22, 48, 8);
    } else if (item.type === "house") {
      ctx.fillStyle = "#261d25";
      ctx.fillRect(x, y - 66, 150, 82);
      ctx.fillStyle = "#503743";
      ctx.fillRect(x - 12, y - 84, 174, 20);
      ctx.fillStyle = "#15161b";
      ctx.fillRect(x + 24, y - 24, 24, 40);
    } else if (item.type === "barrel") {
      ctx.fillStyle = "#6d4630";
      ctx.fillRect(x, y - 26, 28, 32);
      ctx.strokeStyle = "#2a1c18";
      ctx.strokeRect(x + 3, y - 23, 22, 26);
    } else if (item.type === "brokenDoor") {
      ctx.fillStyle = "#442b24";
      ctx.fillRect(x, y - 52, 42, 68);
      ctx.fillStyle = "#1b1514";
      ctx.fillRect(x + 10, y - 30, 18, 46);
    } else if (item.type === "bossGate") {
      ctx.fillStyle = "#111119";
      ctx.fillRect(x, y - 150, 330, 230);
      ctx.fillStyle = "#2e2630";
      ctx.fillRect(x + 35, y - 115, 260, 170);
      ctx.fillStyle = "#0b0b10";
      ctx.fillRect(x + 118, y - 40, 95, 120);
      ctx.fillStyle = "#5b4650";
      ctx.fillRect(x + 20, y - 150, 290, 18);
    } else if (item.type === "throne") {
      ctx.fillStyle = "#21191f";
      ctx.fillRect(x, y - 40, 90, 56);
      ctx.fillStyle = "#4e353f";
      ctx.fillRect(x + 16, y - 78, 58, 44);
    } else if (item.type === "door") {
      ctx.fillStyle = "#171318";
      ctx.fillRect(x, y - 58, 48, 58);
      ctx.fillStyle = "#4c332c";
      ctx.fillRect(x + 6, y - 52, 36, 52);
      ctx.fillStyle = "#d0a45d";
      ctx.fillRect(x + 33, y - 28, 5, 5);
      ctx.strokeStyle = "#20191a";
      ctx.strokeRect(x + 6, y - 52, 36, 52);
    } else if (item.type === "ladder") {
      ctx.fillStyle = "#7a5137";
      ctx.fillRect(x, y - 86, 6, 86);
      ctx.fillRect(x + 28, y - 86, 6, 86);
      ctx.fillStyle = "#b38254";
      for (let i = 0; i < 7; i += 1) ctx.fillRect(x + 2, y - 78 + i * 12, 30, 5);
    } else if (item.type === "sideWall") {
      ctx.fillStyle = "rgba(25, 27, 33, 0.62)";
      ctx.fillRect(x, y - 108, 34, 108);
      ctx.fillStyle = "rgba(93, 70, 76, 0.5)";
      ctx.fillRect(x + 7, y - 86, 20, 8);
      ctx.fillRect(x + 7, y - 42, 20, 8);
    }
  }

  drawPlayer(player, camera) {
    if (this.drawPlayerSprite(player, camera)) return;
    const ctx = this.ctx;
    const x = this.sx(player.x, camera);
    const y = this.sy(player.y, camera);
    const t = performance.now() / 100;
    const running = Math.abs(player.vx) > 35 && player.onGround;
    const bob = running ? Math.sin(t) * 2 : 0;
    const leg = running ? Math.sin(t) * 4 : 0;
    const attacking = player.attackAnim > 0;
    const airborne = !player.onGround;

    ctx.save();
    ctx.translate(x + player.w / 2, y + player.h / 2 + bob);
    ctx.scale(player.facing, 1);

    ctx.fillStyle = player.hurtFlash > 0 ? "#ff6f68" : player.invincible > 0 ? "#fff0a8" : "#dfe3d7";
    ctx.fillRect(-10, -24, 20, 15);
    ctx.fillStyle = "#24272b";
    ctx.fillRect(-8, -28, 16, 5);
    ctx.fillStyle = "#b43c35";
    ctx.fillRect(-12, -8, 24, 18);
    ctx.fillStyle = "#26313b";
    ctx.fillRect(-10, -8, 20, 7);
    ctx.fillStyle = "#15181e";
    ctx.fillRect(-9, 11, 7, 15 + (airborne ? 2 : leg));
    ctx.fillRect(4, 11, 7, 15 + (airborne ? -1 : -leg));
    ctx.fillStyle = "#f0d6b8";
    ctx.fillRect(9, -13, 5, 18);

    ctx.fillStyle = "#ebe0c3";
    const swordX = attacking ? 8 : 12;
    const swordY = attacking ? -18 : -10;
    const swordW = attacking ? 50 : 34;
    ctx.fillRect(swordX, swordY, swordW, 4);
    ctx.fillStyle = "#f4c76b";
    ctx.fillRect(6, -9, 8, 6);
    ctx.restore();
  }

  drawPlayerSprite(player, camera) {
    const key = this.getPlayerAnimationKey(player);
    const anim = PLAYER_ANIMATIONS[key] ?? PLAYER_ANIMATIONS.idle;
    const image = this.images.get(anim.image);
    if (!image || !image.complete || image.naturalWidth === 0) return false;

    const frame = this.getPlayerFrame(player, anim, key);
    const bottomX = this.sx(player.x + player.w / 2, camera);
    const bottomY = this.sy(player.y + player.h, camera);

    this.drawPlayerShadow(player, camera, anim, bottomX, bottomY);

    const destW = anim.frameWidth * anim.scale;
    const destH = anim.frameHeight * anim.scale;
    const drawX = Math.round(-destW / 2 + anim.offsetX);
    const drawY = Math.round(-destH + anim.offsetY);

    const ctx = this.ctx;
    ctx.save();
    ctx.translate(bottomX, bottomY);
    ctx.scale(player.facing, 1);
    if (player.invincible > 0 && Math.floor(performance.now() / 80) % 2 === 0) ctx.globalAlpha = 0.72;
    ctx.drawImage(
      image,
      frame * anim.frameWidth,
      0,
      anim.frameWidth,
      anim.frameHeight,
      drawX,
      drawY,
      destW,
      destH
    );
    ctx.restore();
    return true;
  }

  drawPlayerShadow(player, camera, anim, bottomX, bottomY) {
    const shadowConfig = anim.shadow ? { ...PLAYER_SHADOW, image: anim.shadow, frameCount: anim.frameCount } : PLAYER_SHADOW;
    const shadow = this.images.get(shadowConfig.image);
    if (!shadow || !shadow.complete || shadow.naturalWidth === 0) return;
    const shadowFrame = anim.shadow ? Math.min(this.getPlayerFrame(player, anim, this.getPlayerAnimationKey(player)), shadowConfig.frameCount - 1) : 0;
    const destW = shadowConfig.frameWidth * shadowConfig.scale;
    const destH = shadowConfig.frameHeight * shadowConfig.scale;
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = 0.48;
    ctx.translate(bottomX, bottomY);
    ctx.scale(player.facing, 1);
    ctx.drawImage(
      shadow,
      shadowFrame * shadowConfig.frameWidth,
      0,
      shadowConfig.frameWidth,
      shadowConfig.frameHeight,
      Math.round(-destW / 2 + shadowConfig.offsetX),
      Math.round(-destH + shadowConfig.offsetY),
      destW,
      destH
    );
    ctx.restore();
  }

  getPlayerAnimationKey(player) {
    if (player.hp <= 0) return "death";
    if (player.animationTimer > 0) return player.animationKey;
    if (Math.abs(player.vx) > 28 && player.onGround) return "walk";
    return "idle";
  }

  getPlayerFrame(player, anim, key) {
    if (anim.loop) {
      return Math.floor((performance.now() / 1000) * anim.fps) % anim.frameCount;
    }
    if (key === "death" && player.hp <= 0 && player.animationTimer <= 0) return anim.frameCount - 1;
    const duration = player.animationDuration || anim.duration || anim.frameCount / anim.fps;
    const progress = 1 - Math.max(0, player.animationTimer) / duration;
    return Math.max(0, Math.min(anim.frameCount - 1, Math.floor(progress * anim.frameCount)));
  }

  drawEnemy(enemy, camera) {
    if (this.drawConfiguredEnemySprite(enemy, camera)) {
      if (this.currentGame?.debugSprites) this.drawEnemyDebug(enemy, camera);
      return;
    }
    const ctx = this.ctx;
    const x = this.sx(enemy.x, camera);
    const y = this.sy(enemy.y, camera);
    if (x > 1030 || x + enemy.w < -70) return;
    ctx.save();
    ctx.translate(x + enemy.w / 2, y + enemy.h / 2);
    ctx.scale(enemy.facing, 1);
    const body = enemy.hitFlash > 0 ? "#fff6d7" : enemy.attackFlash > 0 ? "#ff7b61" : enemy.color;

    if (enemy.type === "wolf") {
      ctx.fillStyle = body;
      ctx.fillRect(-20, -6, 34, 18);
      ctx.fillRect(6, -16, 18, 18);
      ctx.fillStyle = "#263238";
      ctx.fillRect(-17, 10, 6, 10);
      ctx.fillRect(7, 10, 6, 10);
      ctx.fillStyle = "#f8d86d";
      ctx.fillRect(18, -11, 4, 4);
      ctx.fillStyle = "#d9edf3";
      ctx.fillRect(20, -2, 7, 3);
    } else if (enemy.type === "boss") {
      ctx.fillStyle = "#2a1b22";
      ctx.fillRect(-28, -39, 56, 75);
      ctx.fillStyle = body;
      ctx.fillRect(-22, -31, 44, 34);
      ctx.fillStyle = "#f0dbc1";
      ctx.fillRect(-16, -40, 32, 18);
      ctx.fillStyle = "#121116";
      ctx.fillRect(-11, -34, 8, 5);
      ctx.fillRect(4, -34, 8, 5);
      ctx.fillStyle = "#d93d34";
      ctx.fillRect(-5, -25, 10, 5);
      ctx.fillStyle = "#c8b995";
      ctx.fillRect(21, -10, 48, 5);
      ctx.fillStyle = "#15181e";
      ctx.fillRect(-20, 20, 11, 20);
      ctx.fillRect(8, 20, 11, 20);
    } else {
      ctx.fillStyle = body;
      ctx.fillRect(-12, -16, 24, 32);
      ctx.fillStyle = "#29311f";
      ctx.fillRect(-14, 3, 28, 15);
      ctx.fillStyle = "#1a1517";
      ctx.fillRect(4, -9, 5, 5);
      ctx.fillStyle = "#d8e58f";
      ctx.fillRect(12, -1, 10, 4);
      ctx.fillStyle = "#15181e";
      ctx.fillRect(-10, 14, 7, 11);
      ctx.fillRect(4, 14, 7, 11);
    }
    ctx.restore();

    ctx.fillStyle = "#171717";
    ctx.fillRect(x, y - 10, enemy.w, 4);
    ctx.fillStyle = enemy.type === "boss" ? "#d93838" : "#e2564f";
    ctx.fillRect(x, y - 10, enemy.w * Math.max(0, enemy.hp / enemy.maxHp), 4);
  }

  drawConfiguredEnemySprite(enemy, camera) {
    const config = {
      goblin: { animations: FAT_ENEMY_ANIMATIONS, key: this.getFatEnemyAnimationKey(enemy), hpColor: "#e2564f", flash: "brightness(1.9)" },
      wolf: { animations: WOLF_ANIMATIONS, key: this.getWolfAnimationKey(enemy), hpColor: "#9c5fe8", flash: "brightness(1.8) saturate(1.3)" },
      boss: { animations: BOSS_ANIMATIONS, key: this.getBossAnimationKey(enemy), hpColor: enemy.bossTier >= 4 ? "#d92f32" : "#e05a48", bossBar: true, flash: "brightness(1.85) saturate(1.25)" }
    }[enemy.type];
    if (!config) return false;
    const anim = config.animations[config.key] ?? config.animations.idle;
    return this.drawSpriteAnimation(enemy, camera, anim, config.key, config);
  }

  drawSpriteAnimation(enemy, camera, anim, key, options = {}) {
    const sheet = this.processedImages.get(anim.image);
    if (!sheet) return false;
    const frameIndex = this.getAnimationFrame(enemy, anim, key);
    const frame = anim.frames?.[frameIndex];
    const frameCount = anim.frameCount ?? anim.frames?.length ?? 1;
    const frameWidth = anim.frameWidth ?? frame?.w ?? Math.floor(sheet.width / frameCount);
    const frameHeight = anim.frameHeight ?? frame?.h ?? sheet.height;
    const sx = frame?.x ?? frameIndex * frameWidth;
    const sy = frame?.y ?? (anim.row ?? 0) * frameHeight;
    const scale = anim.scale ?? 1;
    const destW = frameWidth * scale;
    const destH = frameHeight * scale;
    const bottomX = this.sx(enemy.x + enemy.w / 2, camera);
    const bottomY = this.sy(enemy.y + enemy.h, camera);
    const drawX = Math.round(-destW / 2 + (anim.offsetX ?? 0));
    const drawY = Math.round(-destH + (anim.offsetY ?? 0));

    const ctx = this.ctx;
    ctx.save();
    ctx.translate(bottomX, bottomY);
    ctx.scale(enemy.facing, 1);
    if (enemy.hitFlash > 0) {
      ctx.globalAlpha = 0.94;
      ctx.filter = options.flash ?? "brightness(1.8)";
    }
    ctx.drawImage(sheet, sx, sy, frameWidth, frameHeight, drawX, drawY, destW, destH);
    ctx.restore();

    enemy.debugSprite = {
      x: bottomX + drawX,
      y: bottomY + drawY,
      w: destW,
      h: destH,
      key,
      frame: frameIndex,
      frameCount
    };

    if (options.bossBar) {
      const barW = enemy.w + 24;
      const barX = Math.round(bottomX - barW / 2);
      const barY = Math.max(8, Math.round(bottomY + drawY - 12));
      ctx.fillStyle = "#130d0f";
      ctx.fillRect(barX, barY, barW, 7);
      ctx.fillStyle = options.hpColor;
      ctx.fillRect(barX, barY, barW * Math.max(0, enemy.hp / enemy.maxHp), 7);
      ctx.strokeStyle = "rgba(245,210,160,0.45)";
      ctx.strokeRect(barX, barY, barW, 7);
      return true;
    }

    const x = this.sx(enemy.x, camera);
    const y = this.sy(enemy.y, camera);
    ctx.fillStyle = "#171717";
    ctx.fillRect(x, y - 10, enemy.w, 4);
    ctx.fillStyle = options.hpColor ?? "#e2564f";
    ctx.fillRect(x, y - 10, enemy.w * Math.max(0, enemy.hp / enemy.maxHp), 4);
    return true;
  }

  drawEnemyDebug(enemy, camera) {
    const ctx = this.ctx;
    const hitX = this.sx(enemy.x, camera);
    const hitY = this.sy(enemy.y, camera);
    ctx.save();
    ctx.lineWidth = 1;
    ctx.strokeStyle = "#46ff7a";
    ctx.strokeRect(hitX, hitY, enemy.w, enemy.h);
    const hurt = enemy.getHurtBox ? enemy.getHurtBox() : enemy;
    ctx.strokeStyle = "#ff4c7d";
    ctx.strokeRect(this.sx(hurt.x, camera), this.sy(hurt.y, camera), hurt.w, hurt.h);
    if (enemy.debugSprite) {
      ctx.strokeStyle = "#5bd8ff";
      ctx.strokeRect(enemy.debugSprite.x, enemy.debugSprite.y, enemy.debugSprite.w, enemy.debugSprite.h);
      ctx.fillStyle = "#ffffff";
      ctx.font = "12px Microsoft YaHei, sans-serif";
      ctx.fillText(`${enemy.debugSprite.key} ${enemy.debugSprite.frame + 1}/${enemy.debugSprite.frameCount}`, enemy.debugSprite.x, enemy.debugSprite.y - 4);
    }
    ctx.restore();
  }

  getAnimationFrame(enemy, anim, key) {
    const frameCount = anim.frameCount ?? anim.frames?.length ?? 1;
    const frameDuration = anim.frameDuration ?? 1 / (anim.fps ?? 8);
    if (anim.loop) return Math.floor((performance.now() / 1000) / frameDuration) % frameCount;
    if (key === "death" && enemy.hp <= 0 && enemy.animationTimer <= 0) return frameCount - 1;
    const duration = enemy.animationDuration || frameCount * frameDuration;
    const progress = 1 - Math.max(0, enemy.animationTimer) / duration;
    return Math.max(0, Math.min(frameCount - 1, Math.floor(progress * frameCount)));
  }

  drawFatEnemySprite(enemy, camera) {
    const sheet = this.processedImages.get(FAT_ENEMY_SHEET);
    if (!sheet) return false;
    const animKey = this.getFatEnemyAnimationKey(enemy);
    const anim = FAT_ENEMY_ANIMATIONS[animKey] ?? FAT_ENEMY_ANIMATIONS.idle;
    const frameIndex = this.getFatEnemyFrame(enemy, anim, animKey);
    const frame = anim.frames[frameIndex];
    const bottomX = this.sx(enemy.x + enemy.w / 2, camera);
    const bottomY = this.sy(enemy.y + enemy.h, camera);
    const destW = frame.w * anim.scale;
    const destH = frame.h * anim.scale;

    const ctx = this.ctx;
    ctx.save();
    ctx.translate(bottomX, bottomY);
    ctx.scale(enemy.facing, 1);
    if (enemy.hitFlash > 0) {
      ctx.globalAlpha = 0.92;
      ctx.filter = "brightness(1.9)";
    }
    ctx.drawImage(
      sheet,
      frame.x,
      frame.y,
      frame.w,
      frame.h,
      Math.round(-destW / 2 + anim.offsetX),
      Math.round(-destH + anim.offsetY),
      destW,
      destH
    );
    ctx.restore();

    const x = this.sx(enemy.x, camera);
    const y = this.sy(enemy.y, camera);
    ctx.fillStyle = "#171717";
    ctx.fillRect(x, y - 10, enemy.w, 4);
    ctx.fillStyle = "#e2564f";
    ctx.fillRect(x, y - 10, enemy.w * Math.max(0, enemy.hp / enemy.maxHp), 4);
    return true;
  }

  getFatEnemyAnimationKey(enemy) {
    if (enemy.hp <= 0) return "death";
    if (enemy.animationTimer > 0) return enemy.animationKey;
    if (Math.abs(enemy.vx) > 12 && enemy.onGround) return "walk";
    return "idle";
  }

  getFatEnemyFrame(enemy, anim, key) {
    if (anim.loop) return Math.floor((performance.now() / 1000) * anim.fps) % anim.frames.length;
    if (key === "death" && enemy.hp <= 0 && enemy.animationTimer <= 0) return anim.frames.length - 1;
    const duration = enemy.animationDuration || anim.frames.length / anim.fps;
    const progress = 1 - Math.max(0, enemy.animationTimer) / duration;
    return Math.max(0, Math.min(anim.frames.length - 1, Math.floor(progress * anim.frames.length)));
  }

  drawWolfSprite(enemy, camera) {
    const sheet = this.processedImages.get(WOLF_SHEET);
    if (!sheet) return false;
    const animKey = this.getWolfAnimationKey(enemy);
    const anim = WOLF_ANIMATIONS[animKey] ?? WOLF_ANIMATIONS.idle;
    const frameIndex = this.getWolfFrame(enemy, anim, animKey);
    const frame = anim.frames[frameIndex];
    const bottomX = this.sx(enemy.x + enemy.w / 2, camera);
    const bottomY = this.sy(enemy.y + enemy.h, camera);
    const destW = frame.w * anim.scale;
    const destH = frame.h * anim.scale;

    const ctx = this.ctx;
    ctx.save();
    ctx.translate(bottomX, bottomY);
    ctx.scale(enemy.facing, 1);
    if (enemy.hitFlash > 0) {
      ctx.globalAlpha = 0.94;
      ctx.filter = "brightness(1.8) saturate(1.3)";
    }
    ctx.drawImage(
      sheet,
      frame.x,
      frame.y,
      frame.w,
      frame.h,
      Math.round(-destW / 2 + anim.offsetX),
      Math.round(-destH + anim.offsetY),
      destW,
      destH
    );
    ctx.restore();

    const x = this.sx(enemy.x, camera);
    const y = this.sy(enemy.y, camera);
    ctx.fillStyle = "#171717";
    ctx.fillRect(x, y - 10, enemy.w, 4);
    ctx.fillStyle = "#9c5fe8";
    ctx.fillRect(x, y - 10, enemy.w * Math.max(0, enemy.hp / enemy.maxHp), 4);
    return true;
  }

  getWolfAnimationKey(enemy) {
    if (enemy.hp <= 0) return "death";
    if (enemy.animationTimer > 0) return enemy.animationKey;
    if (enemy.dashTimer > 0) return "dash";
    if (Math.abs(enemy.vx) > 14 && enemy.onGround) return "walk";
    return "idle";
  }

  getWolfFrame(enemy, anim, key) {
    if (anim.loop) return Math.floor((performance.now() / 1000) * anim.fps) % anim.frames.length;
    if (key === "death" && enemy.hp <= 0 && enemy.animationTimer <= 0) return anim.frames.length - 1;
    const duration = enemy.animationDuration || anim.frames.length / anim.fps;
    const progress = 1 - Math.max(0, enemy.animationTimer) / duration;
    return Math.max(0, Math.min(anim.frames.length - 1, Math.floor(progress * anim.frames.length)));
  }

  drawBossSprite(enemy, camera) {
    const sheet = this.processedImages.get(BOSS_SHEET);
    if (!sheet) return false;
    const animKey = this.getBossAnimationKey(enemy);
    const anim = BOSS_ANIMATIONS[animKey] ?? BOSS_ANIMATIONS.idle;
    const frameIndex = this.getBossFrame(enemy, anim, animKey);
    const frameWidth = anim.frameWidth ?? anim.frames?.[frameIndex]?.w ?? 96;
    const frameHeight = anim.frameHeight ?? anim.frames?.[frameIndex]?.h ?? 96;
    const sx = anim.frames?.[frameIndex]?.x ?? frameIndex * frameWidth;
    const sy = anim.frames?.[frameIndex]?.y ?? anim.row * frameHeight;
    const bottomX = this.sx(enemy.x + enemy.w / 2, camera);
    const bottomY = this.sy(enemy.y + enemy.h, camera);
    const destW = frameWidth * anim.scale;
    const destH = frameHeight * anim.scale;

    const ctx = this.ctx;
    ctx.save();
    ctx.translate(bottomX, bottomY);
    ctx.scale(enemy.facing, 1);
    if (enemy.hitFlash > 0) {
      ctx.globalAlpha = 0.94;
      ctx.filter = "brightness(1.85) saturate(1.25)";
    }
    const drawX = Math.round(-destW / 2 + anim.offsetX);
    const drawY = Math.round(-destH + anim.offsetY);

    ctx.drawImage(
      sheet,
      sx,
      sy,
      frameWidth,
      frameHeight,
      drawX,
      drawY,
      destW,
      destH
    );
    ctx.restore();

    const x = this.sx(enemy.x, camera);
    const barY = Math.max(8, Math.round(bottomY + drawY - 12));
    const barW = enemy.w + 24;
    const barX = Math.round(bottomX - barW / 2);
    ctx.fillStyle = "#130d0f";
    ctx.fillRect(barX, barY, barW, 7);
    ctx.fillStyle = enemy.bossTier >= 4 ? "#d92f32" : "#e05a48";
    ctx.fillRect(barX, barY, barW * Math.max(0, enemy.hp / enemy.maxHp), 7);
    ctx.strokeStyle = "rgba(245,210,160,0.45)";
    ctx.strokeRect(barX, barY, barW, 7);
    return true;
  }

  getBossAnimationKey(enemy) {
    if (enemy.hp <= 0) return "death";
    if (enemy.animationTimer > 0) return enemy.animationKey;
    if (enemy.hp <= enemy.maxHp / 2 && enemy.attackFlash > 0.18) return "rage";
    if (Math.abs(enemy.vx) > 20 && enemy.onGround) return "walk";
    return "idle";
  }

  getBossFrame(enemy, anim, key) {
    const frameCount = anim.frameCount ?? anim.frames?.length ?? 1;
    if (anim.loop) return Math.floor((performance.now() / 1000) * anim.fps) % frameCount;
    if (key === "death" && enemy.hp <= 0 && enemy.animationTimer <= 0) return frameCount - 1;
    const duration = enemy.animationDuration || frameCount / anim.fps;
    const progress = 1 - Math.max(0, enemy.animationTimer) / duration;
    return Math.max(0, Math.min(frameCount - 1, Math.floor(progress * frameCount)));
  }

  drawAttack(attack, camera) {
    if (!attack.active) return;
    const ctx = this.ctx;
    ctx.fillStyle = attack.kind === "heavy" ? "rgba(244, 189, 88, 0.42)" : "rgba(233, 232, 218, 0.25)";
    ctx.fillRect(this.sx(attack.x, camera), this.sy(attack.y, camera), attack.w, attack.h);
  }

  drawParticle(particle, camera) {
    const ctx = this.ctx;
    ctx.globalAlpha = Math.max(0, particle.life);
    ctx.fillStyle = particle.color;
    ctx.fillRect(this.sx(particle.x, camera), this.sy(particle.y, camera), particle.size, particle.size);
    ctx.globalAlpha = 1;
  }

  drawEnemyProjectile(projectile, camera) {
    const sheet = this.processedImages.get(FAT_ENEMY_SHEET);
    const ctx = this.ctx;
    if (sheet) {
      const frame = FAT_MISSILE_FRAMES[Math.floor((performance.now() / 1000) * 10) % FAT_MISSILE_FRAMES.length];
      const scale = 0.65;
      ctx.save();
      ctx.translate(this.sx(projectile.x + projectile.w / 2, camera), this.sy(projectile.y + projectile.h / 2, camera));
      if (projectile.vx < 0) ctx.scale(-1, 1);
      ctx.drawImage(sheet, frame.x, frame.y, frame.w, frame.h, -frame.w * scale / 2, -frame.h * scale / 2, frame.w * scale, frame.h * scale);
      ctx.restore();
      return;
    }
    ctx.fillStyle = "#d99a83";
    ctx.fillRect(this.sx(projectile.x, camera), this.sy(projectile.y, camera), projectile.w, projectile.h);
  }

  drawPlayerProjectile(projectile, camera) {
    const asset = PROJECTILE_ASSETS.arrow;
    const image = this.images.get(asset.image);
    const ctx = this.ctx;
    if (image && image.complete && image.naturalWidth > 0) {
      const w = asset.frameWidth * asset.scale;
      const h = asset.frameHeight * asset.scale;
      ctx.save();
      ctx.translate(this.sx(projectile.x + projectile.w / 2, camera), this.sy(projectile.y + projectile.h / 2, camera));
      if (projectile.facing < 0) ctx.scale(-1, 1);
      ctx.drawImage(image, 0, 0, asset.frameWidth, asset.frameHeight, -w / 2 + asset.offsetX, -h / 2 + asset.offsetY, w, h);
      ctx.restore();
      return;
    }
    ctx.fillStyle = "#dff8ff";
    ctx.fillRect(this.sx(projectile.x, camera), this.sy(projectile.y, camera), projectile.w, projectile.h);
  }

  drawEnemyHazard(hazard, camera) {
    const ctx = this.ctx;
    ctx.globalAlpha = Math.max(0, Math.min(1, hazard.life / 0.22));
    ctx.fillStyle = hazard.color ?? "rgba(170, 164, 77, 0.38)";
    ctx.fillRect(this.sx(hazard.x, camera), this.sy(hazard.y, camera), hazard.w, hazard.h);
    ctx.globalAlpha = 1;
  }

  drawPortal(portal, camera) {
    if (!portal) return;
    const ctx = this.ctx;
    const x = this.sx(portal.x, camera);
    const y = this.sy(portal.y, camera);
    const pulse = 1 + Math.sin(performance.now() / 160) * 0.08;
    ctx.save();
    ctx.translate(x + portal.w / 2, y + portal.h / 2);
    ctx.scale(pulse, pulse);
    ctx.fillStyle = "rgba(49, 201, 255, 0.18)";
    ctx.fillRect(-portal.w / 2 - 6, -portal.h / 2 - 6, portal.w + 12, portal.h + 12);
    ctx.strokeStyle = "#68ddff";
    ctx.lineWidth = 6;
    ctx.strokeRect(-portal.w / 2, -portal.h / 2, portal.w, portal.h);
    ctx.strokeStyle = "#e3fbff";
    ctx.lineWidth = 2;
    ctx.strokeRect(-portal.w / 2 + 9, -portal.h / 2 + 9, portal.w - 18, portal.h - 18);
    ctx.restore();
  }

  drawSafeRoom(game) {
    const ctx = this.ctx;
    const cam = game.camera;
    const merchant = game.safeObjects.merchant;
    const heal = game.safeObjects.heal;
    const mx = this.sx(merchant.x, cam);
    const my = this.sy(merchant.y, cam);
    ctx.fillStyle = "#d5a05d";
    ctx.fillRect(mx, my + 8, merchant.w, merchant.h - 8);
    ctx.fillStyle = "#2b1f16";
    ctx.fillRect(mx + 5, my - 6, merchant.w - 10, 14);
    ctx.fillStyle = "#f2d3a1";
    ctx.fillRect(mx + 10, my + 12, 14, 12);
    ctx.fillStyle = "#6d3e2d";
    ctx.fillRect(mx - 10, my + 40, merchant.w + 20, 10);

    const hx = this.sx(heal.x, cam);
    const hy = this.sy(heal.y, cam);
    ctx.fillStyle = "#5d1f27";
    ctx.fillRect(hx - 5, hy + 4, heal.w + 10, heal.h);
    ctx.fillStyle = "#df655c";
    ctx.fillRect(hx, hy, heal.w, heal.h);
    ctx.fillStyle = "#fff2dd";
    ctx.fillRect(hx + 18, hy + 8, 8, 34);
    ctx.fillRect(hx + 7, hy + 21, 30, 8);
  }

  drawText(game) {
    const ctx = this.ctx;
    ctx.fillStyle = "#f5efe2";
    ctx.font = "16px Microsoft YaHei, sans-serif";
    const mode = game.state === "safe" ? "安全房" : `第 ${game.levels.level} 关`;
    ctx.fillText(`${mode} / 武器：${game.player.weapon.name}`, 24, 32);
    ctx.fillText(`HP ${Math.ceil(game.player.hp)}/${game.player.maxHp}`, 24, 58);
    ctx.fillText(`Stamina ${Math.ceil(game.player.stamina)}/${game.player.maxStamina}`, 184, 58);
    ctx.fillStyle = "#f3c96a";
    ctx.beginPath();
    ctx.arc(418, 54, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#5a3b16";
    ctx.fillRect(415, 51, 6, 2);
    ctx.fillStyle = "#f5efe2";
    ctx.fillText(`Gold ${game.player.gold}`, 432, 58);
    this.bar(24, 42, 130, 8, game.player.hp / game.player.maxHp, "#d94c45");
    this.bar(184, 42, 150, 8, game.player.stamina / game.player.maxStamina, "#63c37b");

    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(245,239,226,0.9)";
    ctx.fillText("A/D移动  Space跳跃  Shift翻滚  左键/J普攻  右键/K弓箭  E互动", 480, 524);
    ctx.textAlign = "left";

    if (game.messageTimer > 0) {
      ctx.textAlign = "center";
      ctx.font = "20px Microsoft YaHei, sans-serif";
      ctx.fillStyle = "#f3c96a";
      ctx.fillText(game.message, 480, 92);
      ctx.textAlign = "left";
    }

    this.drawInteractionHints(game);

    for (const text of game.floatTexts) {
      ctx.globalAlpha = text.life;
      ctx.fillStyle = text.color;
      ctx.font = "18px Microsoft YaHei, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(text.text, text.x - game.camera.x + game.camera.shakeX, text.y + game.camera.shakeY);
      ctx.globalAlpha = 1;
      ctx.textAlign = "left";
    }

    if (game.state === "safe") this.drawShop(game);
  }

  drawInteractionHints(game) {
    const ctx = this.ctx;
    ctx.textAlign = "center";
    ctx.font = "17px Microsoft YaHei, sans-serif";
    ctx.fillStyle = "#dff8ff";
    if (game.portalUnlocked && game.near(game.player, game.levels.current.portal, 58)) {
      const portal = game.levels.current.portal;
      ctx.fillText("按 E 进入传送门", portal.x - game.camera.x + portal.w / 2, portal.y - 22);
    }
    for (const ladder of game.levels.current.ladders ?? []) {
      const box = { x: ladder.x - 18, y: ladder.y - 8, w: ladder.w + 36, h: ladder.h + 24 };
      const player = game.player;
      const touching = player.x < box.x + box.w && player.x + player.w > box.x && player.y < box.y + box.h && player.y + player.h > box.y;
      if (touching) {
        ctx.fillText(`按 E 爬到${ladder.label}`, ladder.x - game.camera.x + ladder.w / 2, ladder.y - 18);
      }
    }
    if (game.state === "safe") {
      const cam = game.camera;
      const merchant = game.safeObjects.merchant;
      const heal = game.safeObjects.heal;
      if (game.near(game.player, merchant, 62)) ctx.fillText("按 E 打开商店", merchant.x - cam.x + 17, merchant.y - 22);
      if (game.near(game.player, heal, 62)) ctx.fillText("按 E 花费 15G 回血", heal.x - cam.x + 22, heal.y - 22);
      if (game.near(game.player, game.safeObjects.portal, 58)) ctx.fillText("按 E 前往下一关", game.safeObjects.portal.x - cam.x + 21, game.safeObjects.portal.y - 18);
    }
    ctx.textAlign = "left";
  }

  drawShop(game) {
    if (!game.shopOpen) return;
    const ctx = this.ctx;
    ctx.fillStyle = "rgba(18,18,18,0.9)";
    ctx.fillRect(278, 122, 404, 224);
    ctx.strokeStyle = "rgba(245,239,226,0.34)";
    ctx.strokeRect(278, 122, 404, 224);
    ctx.textAlign = "center";
    ctx.fillStyle = "#f5efe2";
    ctx.font = "22px Microsoft YaHei, sans-serif";
    ctx.fillText("商店", 480, 160);
    ctx.font = "16px Microsoft YaHei, sans-serif";
    SHOP_ITEMS.forEach((item, index) => {
      const owned = game.ownedWeapons.has(item.weaponId);
      const equipped = game.player.weapon.id === item.weaponId;
      const weapon = WEAPONS[item.weaponId];
      const y = 204 + index * 50;
      ctx.fillStyle = owned ? "#aee0c0" : "#f5efe2";
      ctx.fillText(`${index + 1}. ${item.label}  ${item.price}G  近战 ${weapon.damage} / 弓箭 ${weapon.arrowDamage}`, 480, y);
      ctx.fillStyle = "#c9c0aa";
      ctx.fillText(`${item.effect} / 弓箭间隔 ${weapon.arrowCooldown.toFixed(2)}s${equipped ? " / 已装备" : owned ? " / 已购买" : ""}`, 480, y + 22);
    });
    ctx.fillStyle = "#f3c96a";
    ctx.fillText("按 1 / 2 购买或装备，按 E 关闭", 480, 320);
    ctx.textAlign = "left";
  }

  drawEndScreen(game, title, subtitle) {
    const ctx = this.ctx;
    ctx.fillStyle = "rgba(10,10,10,0.78)";
    ctx.fillRect(0, 0, 960, 540);
    ctx.textAlign = "center";
    ctx.fillStyle = "#f5efe2";
    ctx.font = "46px Microsoft YaHei, sans-serif";
    ctx.fillText(title, 480, 190);
    ctx.font = "20px Microsoft YaHei, sans-serif";
    ctx.fillText(subtitle, 480, 238);
    ctx.fillText(`击杀 ${game.player.kills}  金币 ${game.player.gold}  用时 ${game.elapsed.toFixed(1)}s`, 480, 276);
    ctx.fillStyle = "#f3c96a";
    ctx.fillRect(402, 318, 156, 46);
    ctx.fillStyle = "#191919";
    ctx.font = "20px Microsoft YaHei, sans-serif";
    ctx.fillText("重新开始", 480, 348);
    ctx.textAlign = "left";
  }

  bar(x, y, width, height, pct, color) {
    const ctx = this.ctx;
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(x, y, width, height);
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width * Math.max(0, pct), height);
  }
}
