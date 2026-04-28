import { Player } from "../entities/Player.js";
import { Input } from "./Input.js";
import { LevelManager } from "./LevelManager.js";
import { Renderer } from "../ui/Renderer.js";
import { SHOP_ITEMS, WEAPONS } from "../data/weapons.js";
import { rectsOverlap, rand } from "./utils.js";

export class Game {
  constructor(canvas, hud) {
    this.canvas = canvas;
    this.hud = hud;
    this.input = new Input(canvas);
    this.renderer = new Renderer(canvas);
    this.player = new Player();
    this.levels = new LevelManager();
    this.enemies = [];
    this.attacks = [];
    this.playerProjectiles = [];
    this.floatTexts = [];
    this.particles = [];
    this.enemyProjectiles = [];
    this.enemyHazards = [];
    this.portalUnlocked = false;
    this.state = "combat";
    this.message = "";
    this.messageTimer = 0;
    this.elapsed = 0;
    this.shopOpen = false;
    this.camera = { x: 0, y: 0, shakeX: 0, shakeY: 0 };
    this.shakeTimer = 0;
    this.shakePower = 0;
    this.hitStopTimer = 0;
    this.debugSprites = false;
    this.ownedWeapons = new Set(["katana"]);
    this.safeObjects = {
      merchant: { x: 405, y: 402, w: 34, h: 66 },
      heal: { x: 600, y: 418, w: 44, h: 50 },
      portal: { x: 1080, y: 404, w: 42, h: 64 }
    };
  }

  start() {
    this.resetRun();
    this.last = performance.now();
    requestAnimationFrame((time) => this.loop(time));
  }

  resetRun() {
    this.player.resetForRun();
    this.elapsed = 0;
    this.state = "combat";
    this.shopOpen = false;
    this.portalUnlocked = false;
    this.hitStopTimer = 0;
    this.shakeTimer = 0;
    this.shakePower = 0;
    this.ownedWeapons = new Set(["katana"]);
    this.attacks = [];
    this.playerProjectiles = [];
    this.floatTexts = [];
    this.particles = [];
    this.enemyProjectiles = [];
    this.enemyHazards = [];
    this.enemies = this.levels.startLevel(1, this.player);
    this.say("第 1 关：向右推进，清掉妖怪");
  }

  loop(time) {
    const dt = Math.min(0.033, (time - this.last) / 1000);
    this.last = time;
    this.update(dt);
    this.draw();
    this.input.endFrame();
    requestAnimationFrame((next) => this.loop(next));
  }

  update(dt) {
    this.updateCommon(dt);

    if (this.state === "victory" || this.state === "defeat") {
      if (this.input.mouse.leftTap && this.input.mouse.x > 402 && this.input.mouse.x < 558 && this.input.mouse.y > 318 && this.input.mouse.y < 364) {
        this.resetRun();
      }
      return;
    }

    if (this.input.pressed("p")) {
      this.debugSkipLevel();
      return;
    }

    if (this.input.pressed("f2")) {
      this.debugSprites = !this.debugSprites;
      this.say(this.debugSprites ? "Sprite 调试：开" : "Sprite 调试：关");
    }

    if (this.hitStopTimer > 0) {
      this.hitStopTimer = Math.max(0, this.hitStopTimer - dt);
      this.updateCamera();
      return;
    }

    if (this.state !== "victory" && this.state !== "defeat") this.elapsed += dt;

    const hpBefore = this.player.hp;
    this.player.update(dt, this.input, this.levels.current);
    if (this.player.hp < hpBefore) {
      this.shake(8, 0.16);
      this.float("-25", this.player.x, this.player.y - 16, "#ff8c7a");
    }

    if (this.player.hp <= 0) {
      this.state = "defeat";
      this.spawnParticles(this.player.x + this.player.w / 2, this.player.y + this.player.h / 2, "#d94c45", 22);
      return;
    }

    if (this.input.mouse.leftTap || this.input.pressed("j")) this.queueAttack(this.player.tryLightAttack());
    if (this.input.mouse.rightTap || this.input.pressed("k")) this.queueAttack(this.player.tryRangedAttack());

    if (this.state === "combat") this.updateCombat(dt);
    if (this.state === "safe") this.updateSafeRoom();
    this.updateCamera();
  }

  updateCommon(dt) {
    this.messageTimer = Math.max(0, this.messageTimer - dt);
    this.shakeTimer = Math.max(0, this.shakeTimer - dt);
    if (this.shakeTimer <= 0) this.shakePower = 0;
    this.floatTexts = this.floatTexts
      .map((text) => ({ ...text, y: text.y - 34 * dt, life: text.life - dt }))
      .filter((text) => text.life > 0);
    this.particles = this.particles
      .map((p) => ({
        ...p,
        x: p.x + p.vx * dt,
        y: p.y + p.vy * dt,
        vy: p.vy + 620 * dt,
        life: p.life - dt
      }))
      .filter((p) => p.life > 0);
    this.enemyHazards = this.enemyHazards
      .map((h) => ({ ...h, life: h.life - dt }))
      .filter((h) => h.life > 0);
  }

  updateCombat(dt) {
    const hpBefore = this.player.hp;
    for (const enemy of this.enemies) {
      const events = enemy.update(dt, this.player, this.levels.current) ?? [];
      for (const event of events) this.handleEnemyEvent(event);
    }
    this.updateEnemyProjectiles(dt);
    this.updatePlayerProjectiles(dt);
    if (this.player.hp < hpBefore) {
      this.shake(6, 0.12);
      this.float(`-${hpBefore - this.player.hp}`, this.player.x, this.player.y - 18, "#ff8c7a");
    }

    this.updateAttacks(dt);

    const dead = this.enemies.filter((enemy) => enemy.dead);
    if (dead.length) {
      for (const enemy of dead) {
        this.player.gold += enemy.gold;
        this.player.kills += 1;
        this.float(`+${enemy.gold}G`, enemy.x, enemy.y, "#f3c96a");
        this.spawnParticles(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, enemy.color, enemy.type === "boss" ? 46 : 16);
        this.spawnParticles(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, "#f3c96a", enemy.type === "boss" ? 18 : 6);
      }
      this.enemies = this.enemies.filter((enemy) => !enemy.dead);
    }

    if (this.enemies.length === 0 && !this.portalUnlocked) {
      if (this.levels.level === 4) {
        this.state = "victory";
        this.shake(10, 0.3);
      } else {
        const reward = this.levels.clearReward();
        this.player.gold += reward;
        this.portalUnlocked = true;
        this.say(`区域已清空，终点传送门开启，奖励 +${reward}G`);
      }
    }

    if (this.portalUnlocked && this.near(this.player, this.levels.current.portal, 58) && this.input.pressed("e")) {
      this.enterSafeRoom();
    }
    this.updateLadders();
  }

  updateLadders() {
    if (!this.input.pressed("e")) return;
    for (const ladder of this.levels.current.ladders ?? []) {
      const interactBox = { x: ladder.x - 18, y: ladder.y - 8, w: ladder.w + 36, h: ladder.h + 24 };
      if (!rectsOverlap(this.player, interactBox)) continue;
      this.player.x = ladder.targetX;
      this.player.y = ladder.targetY;
      this.player.vx = 0;
      this.player.vy = 0;
      this.player.onGround = false;
      this.say(`爬到${ladder.label}`);
      break;
    }
  }

  handleEnemyEvent(event) {
    if (event.type === "projectile") {
      this.enemyProjectiles.push({ ...event });
      return;
    }
    if (event.type === "hazard" || event.type === "shockwave") {
      const hazard = { damage: 0, life: 0.22, ...event };
      this.enemyHazards.push(hazard);
      if (hazard.damage && rectsOverlap(hazard, this.player)) this.player.takeDamage(hazard.damage);
      this.shake(event.type === "shockwave" ? 7 : 3, 0.12);
      return;
    }
    if (event.type === "screenShake") this.shake(event.power, event.duration);
    if (event.type === "hitFx") this.spawnParticles(event.x, event.y, "#fff2c2", 8);
  }

  updateEnemyProjectiles(dt) {
    for (const projectile of this.enemyProjectiles) {
      projectile.x += projectile.vx * dt;
      projectile.y += projectile.vy * dt;
      projectile.vy += 80 * dt;
      projectile.life -= dt;
      if (!projectile.hit && rectsOverlap(projectile, this.player)) {
        this.player.takeDamage(projectile.damage);
        projectile.hit = true;
        projectile.life = 0;
        this.spawnParticles(projectile.x + projectile.w / 2, projectile.y + projectile.h / 2, "#d99a83", 12);
        this.shake(5, 0.1);
      }
    }
    this.enemyProjectiles = this.enemyProjectiles.filter((p) => p.life > 0);
  }

  updateSafeRoom() {
    if (this.input.pressed("e") && this.near(this.player, this.safeObjects.merchant, 62)) {
      this.shopOpen = !this.shopOpen;
      this.say(this.shopOpen ? "商店已打开" : "商店已关闭");
    } else if (this.input.pressed("e") && this.near(this.player, this.safeObjects.heal, 62)) {
      this.buyHeal();
    } else if (this.input.pressed("e") && this.near(this.player, this.safeObjects.portal, 58)) {
      this.nextLevel();
    }

    if (this.shopOpen) {
      if (this.input.pressed("1")) this.buyWeapon(SHOP_ITEMS[0]);
      if (this.input.pressed("2")) this.buyWeapon(SHOP_ITEMS[1]);
    }
  }

  enterSafeRoom() {
    this.state = "safe";
    this.shopOpen = false;
    this.portalUnlocked = true;
    this.attacks = [];
    this.playerProjectiles = [];
    this.levels.enterSafeRoom(this.player);
    this.safeObjects.portal = this.levels.current.portal;
    this.say("安全房：补给后从右侧传送门进入下一关");
  }

  nextLevel() {
    const next = this.levels.level + 1;
    this.state = "combat";
    this.shopOpen = false;
    this.portalUnlocked = false;
    this.attacks = [];
    this.playerProjectiles = [];
    this.enemies = this.levels.startLevel(next, this.player);
    this.say(next === 4 ? "Boss 关：鬼面将军出现" : `第 ${next} 关开始`);
  }

  debugSkipLevel() {
    if (this.levels.level >= 4) {
      this.state = "victory";
      this.shopOpen = false;
      this.portalUnlocked = false;
      this.hitStopTimer = 0;
      this.attacks = [];
      this.playerProjectiles = [];
      this.enemyProjectiles = [];
      this.enemyHazards = [];
      this.enemies = [];
      this.say("已跳到通关");
      return;
    }

    const next = this.levels.level + 1;
    this.state = "combat";
    this.shopOpen = false;
    this.portalUnlocked = false;
    this.hitStopTimer = 0;
    this.attacks = [];
    this.playerProjectiles = [];
    this.enemyProjectiles = [];
    this.enemyHazards = [];
    this.enemies = this.levels.startLevel(next, this.player);
    this.say(`跳关：第 ${next} 关`);
    this.updateCamera();
  }

  buyHeal() {
    if (this.player.hp >= this.player.maxHp) {
      this.say("生命值已满");
      return;
    }
    if (this.player.gold < 15) {
      this.say("金币不足，回血需要 15G");
      return;
    }
    this.player.gold -= 15;
    this.player.hp = Math.min(this.player.maxHp, this.player.hp + 40);
    this.spawnParticles(this.player.x + this.player.w / 2, this.player.y + 18, "#e86d66", 14);
    this.say("恢复 40HP");
  }

  buyWeapon(item) {
    if (this.ownedWeapons.has(item.weaponId)) {
      this.player.weapon = WEAPONS[item.weaponId];
      this.say(`已装备：${this.player.weapon.name}`);
      return;
    }
    if (this.player.gold < item.price) {
      this.say("金币不足，买不起这把武器");
      return;
    }
    this.player.gold -= item.price;
    this.ownedWeapons.add(item.weaponId);
    this.player.weapon = WEAPONS[item.weaponId];
    this.say(`已购买并装备：${this.player.weapon.name}`);
  }

  queueAttack(config) {
    if (!config) return;
    const origin = this.player.getAttackOrigin();
    if (config.kind === "arrow") {
      this.playerProjectiles.push({
        ...config,
        x: this.player.facing > 0 ? origin.x + 8 : origin.x - config.w - 8,
        y: origin.y - config.h / 2 - 4,
        vx: this.player.facing * config.speed,
        facing: this.player.facing,
        age: 0,
        active: !config.delay,
        hit: false
      });
      return;
    }
    this.attacks.push({
      ...config,
      x: this.player.facing > 0 ? origin.x : origin.x - config.range,
      y: origin.y - config.height / 2,
      w: config.range,
      h: config.height,
      facing: this.player.facing,
      age: 0,
      active: !config.delay,
      hit: new Set()
    });
  }

  updateAttacks(dt) {
    for (const attack of this.attacks) {
      attack.age += dt;
      if (attack.delay && attack.age >= attack.delay) attack.active = true;
      if (!attack.active) continue;
      this.hitDestructibles(attack);

      for (const enemy of this.enemies) {
        if (enemy.dying) continue;
        if (attack.hit.has(enemy)) continue;
        if (rectsOverlap(attack, enemy.getHurtBox ? enemy.getHurtBox() : enemy)) {
          enemy.hit(attack.damage, attack.facing, attack.knockback);
          attack.hit.add(enemy);
          this.float(`-${attack.damage}`, enemy.x + enemy.w / 2, enemy.y - 12, "#fff2a8");
          this.spawnParticles(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, "#fff2c2", 6);
          this.shake(attack.shake, 0.1);
          this.hitStopTimer = Math.max(this.hitStopTimer, attack.hitStop);
        }
      }
    }
    this.attacks = this.attacks.filter((attack) => attack.age < attack.life);
  }

  hitDestructibles(attack) {
    if (attack.hitDestructibles) return;
    attack.hitDestructibles = true;
    for (const solid of this.levels.current.solids) {
      if (!solid.destructible || solid.destroyed) continue;
      if (!rectsOverlap(attack, solid)) continue;
      solid.hp -= attack.damage;
      this.spawnParticles(solid.x + solid.w / 2, solid.y + solid.h / 2, "#9b6a3c", 10);
      this.float(`-${attack.damage}`, solid.x + solid.w / 2, solid.y - 8, "#f3c96a");
      this.shake(3, 0.08);
      if (solid.hp <= 0) {
        solid.destroyed = true;
        this.spawnParticles(solid.x + solid.w / 2, solid.y + solid.h / 2, "#b38254", 18);
      }
    }
    this.levels.current.solids = this.levels.current.solids.filter((solid) => !solid.destroyed);
  }

  updatePlayerProjectiles(dt) {
    for (const projectile of this.playerProjectiles) {
      projectile.age += dt;
      if (projectile.delay && projectile.age >= projectile.delay) projectile.active = true;
      if (!projectile.active) continue;
      projectile.x += projectile.vx * dt;
      for (const solid of this.levels.current.solids) {
        if (!solid.destructible || solid.destroyed || projectile.hit) continue;
        if (!rectsOverlap(projectile, solid)) continue;
        solid.hp -= projectile.damage;
        projectile.hit = true;
        this.spawnParticles(projectile.x + projectile.w / 2, projectile.y + projectile.h / 2, "#b38254", 8);
        if (solid.hp <= 0) {
          solid.destroyed = true;
          this.spawnParticles(solid.x + solid.w / 2, solid.y + solid.h / 2, "#b38254", 18);
        }
      }
      this.levels.current.solids = this.levels.current.solids.filter((solid) => !solid.destroyed);
      for (const enemy of this.enemies) {
        if (enemy.dying || projectile.hit) continue;
        if (rectsOverlap(projectile, enemy.getHurtBox ? enemy.getHurtBox() : enemy)) {
          enemy.hit(projectile.damage, projectile.facing, projectile.knockback);
          projectile.hit = true;
          this.float(`-${projectile.damage}`, enemy.x + enemy.w / 2, enemy.y - 16, "#dff8ff");
          this.spawnParticles(projectile.x + projectile.w / 2, projectile.y + projectile.h / 2, "#dff8ff", 8);
          this.shake(projectile.shake, 0.08);
          this.hitStopTimer = Math.max(this.hitStopTimer, projectile.hitStop);
        }
      }
    }
    this.playerProjectiles = this.playerProjectiles.filter((projectile) => !projectile.hit && projectile.age < projectile.life);
  }

  updateCamera() {
    const target = this.player.x + this.player.w / 2 - this.canvas.width * 0.42;
    const max = Math.max(0, this.levels.current.width - this.canvas.width);
    this.camera.x += (Math.max(0, Math.min(max, target)) - this.camera.x) * 0.16;
    this.camera.y = 0;
    const power = this.shakePower * (this.shakeTimer > 0 ? 1 : 0);
    this.camera.shakeX = power ? rand(-power, power) : 0;
    this.camera.shakeY = power ? rand(-power, power) : 0;
  }

  near(a, b, range) {
    const ax = a.x + a.w / 2;
    const ay = a.y + a.h / 2;
    const bx = b.x + b.w / 2;
    const by = b.y + b.h / 2;
    return Math.hypot(ax - bx, ay - by) <= range;
  }

  shake(power, duration) {
    this.shakePower = Math.max(this.shakePower, power);
    this.shakeTimer = Math.max(this.shakeTimer, duration);
  }

  spawnParticles(x, y, color, count) {
    for (let i = 0; i < count; i += 1) {
      this.particles.push({
        x,
        y,
        vx: rand(-150, 150),
        vy: rand(-230, -60),
        size: rand(3, 7),
        color,
        life: rand(0.35, 0.75)
      });
    }
  }

  float(text, x, y, color) {
    this.floatTexts.push({ text, x, y, color, life: 0.85 });
  }

  say(message) {
    this.message = message;
    this.messageTimer = 2.4;
  }

  draw() {
    const renderer = this.renderer;
    renderer.currentGame = this;
    renderer.clear();
    renderer.drawWorld(this);
    for (const particle of this.particles) renderer.drawParticle(particle, this.camera);
    for (const hazard of this.enemyHazards) renderer.drawEnemyHazard(hazard, this.camera);
    for (const projectile of this.enemyProjectiles) renderer.drawEnemyProjectile(projectile, this.camera);
    for (const projectile of this.playerProjectiles) renderer.drawPlayerProjectile(projectile, this.camera);
    for (const attack of this.attacks) renderer.drawAttack(attack, this.camera);
    for (const enemy of this.enemies) renderer.drawEnemy(enemy, this.camera);
    if (this.portalUnlocked || this.state === "safe") renderer.drawPortal(this.levels.current.portal, this.camera);
    if (this.state === "safe") renderer.drawSafeRoom(this);
    renderer.drawPlayer(this.player, this.camera);
    renderer.drawText(this);

    if (this.state === "victory") renderer.drawEndScreen(this, "通关成功", "鬼面将军已被击败");
    if (this.state === "defeat") renderer.drawEndScreen(this, "挑战失败", "流浪武士倒下了");
  }
}
