import { WEAPONS } from "../data/weapons.js";
import { clamp, rectsOverlap } from "../systems/utils.js";

export class Player {
  constructor() {
    this.x = 90;
    this.y = 350;
    this.spawnX = 90;
    this.spawnY = 350;
    this.w = 30;
    this.h = 48;
    this.vx = 0;
    this.vy = 0;
    this.speed = 260;
    this.accel = 2400;
    this.groundFriction = 1850;
    this.airAccel = 1450;
    this.jumpPower = 575;
    this.gravity = 1550;
    this.fallGravity = 1880;
    this.maxFall = 760;
    this.onGround = false;
    this.coyoteTimer = 0;
    this.jumpBuffer = 0;
    this.facing = 1;
    this.maxHp = 100;
    this.hp = 100;
    this.maxStamina = 100;
    this.stamina = 100;
    this.gold = 0;
    this.weapon = WEAPONS.katana;
    this.invincible = 0;
    this.hurtFlash = 0;
    this.rollTimer = 0;
    this.attackCooldown = 0;
    this.heavyCooldown = 0;
    this.heavyWindup = 0;
    this.attackAnim = 0;
    this.animationKey = "idle";
    this.animationTimer = 0;
    this.animationDuration = 0;
    this.kills = 0;
  }

  resetForRun() {
    Object.assign(this, new Player());
  }

  setSpawn(x, y) {
    this.spawnX = x;
    this.spawnY = y;
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
  }

  update(dt, input, level) {
    this.attackCooldown = Math.max(0, this.attackCooldown - dt);
    this.heavyCooldown = Math.max(0, this.heavyCooldown - dt);
    this.heavyWindup = Math.max(0, this.heavyWindup - dt);
    this.attackAnim = Math.max(0, this.attackAnim - dt);
    this.animationTimer = Math.max(0, this.animationTimer - dt);
    this.invincible = Math.max(0, this.invincible - dt);
    this.hurtFlash = Math.max(0, this.hurtFlash - dt);
    this.rollTimer = Math.max(0, this.rollTimer - dt);
    this.coyoteTimer = this.onGround ? 0.1 : Math.max(0, this.coyoteTimer - dt);
    this.jumpBuffer = Math.max(0, this.jumpBuffer - dt);
    this.stamina = clamp(this.stamina + dt * 28, 0, this.maxStamina);

    let move = 0;
    if (input.down("a")) move -= 1;
    if (input.down("d")) move += 1;
    if (move !== 0 && this.rollTimer <= 0) this.facing = Math.sign(move);

    if (input.pressed(" ") || input.pressed("space")) this.jumpBuffer = 0.12;

    if (input.pressed("shift") && this.stamina >= 25 && this.rollTimer <= 0) {
      this.stamina -= 25;
      this.rollTimer = 0.24;
      this.invincible = 0.34;
      this.vx = this.facing * 610;
    }

    if (this.rollTimer <= 0) {
      const target = move * this.speed;
      const rate = this.onGround ? this.accel : this.airAccel;
      if (move !== 0) {
        this.vx += Math.sign(target - this.vx) * rate * dt;
        if (Math.sign(target - this.vx) !== Math.sign(target - (this.vx - Math.sign(target - this.vx) * rate * dt))) this.vx = target;
      } else if (this.onGround) {
        const slow = Math.min(Math.abs(this.vx), this.groundFriction * dt);
        this.vx -= Math.sign(this.vx) * slow;
      }
      this.vx = clamp(this.vx, -this.speed, this.speed);
    }

    if (this.jumpBuffer > 0 && (this.onGround || this.coyoteTimer > 0)) {
      this.vy = -this.jumpPower;
      this.onGround = false;
      this.coyoteTimer = 0;
      this.jumpBuffer = 0;
    }

    const gravity = this.vy > 0 ? this.fallGravity : this.gravity;
    this.vy = clamp(this.vy + gravity * dt, -900, this.maxFall);
    this.moveAndCollide(dt, level);

    if (this.y > level.killY) {
      this.takeDamage(25);
      this.x = this.spawnX;
      this.y = this.spawnY;
      this.vx = 0;
      this.vy = 0;
      this.invincible = 0.8;
    }
  }

  tryLightAttack() {
    if (this.attackCooldown > 0 || this.heavyWindup > 0) return null;
    this.attackCooldown = this.weapon.cooldown;
    this.attackAnim = 0.14;
    this.playAction("attack1", 0.34);
    return {
      kind: "light",
      damage: this.weapon.damage,
      range: this.weapon.range + 12,
      height: 44,
      knockback: 135,
      life: 0.13,
      hitStop: 0.045,
      shake: 4
    };
  }

  tryRangedAttack() {
    const staminaCost = this.weapon.arrowStaminaCost;
    if (this.heavyCooldown > 0 || this.heavyWindup > 0 || this.stamina < staminaCost) return null;
    this.stamina -= staminaCost;
    this.heavyCooldown = this.weapon.arrowCooldown;
    this.heavyWindup = this.weapon.arrowWindup;
    this.attackAnim = this.weapon.arrowWindup + 0.28;
    this.playAction("attack3", 0.46);
    return {
      kind: "arrow",
      damage: this.weapon.arrowDamage,
      speed: this.weapon.arrowSpeed,
      w: 30,
      h: 10,
      knockback: 85,
      life: 1.8,
      delay: this.weapon.arrowWindup,
      hitStop: 0.035,
      shake: 3
    };
  }

  takeDamage(amount) {
    if (this.invincible > 0) return false;
    this.hp = clamp(this.hp - amount, 0, this.maxHp);
    this.invincible = 0.55;
    this.hurtFlash = 0.18;
    this.playAction(this.hp <= 0 ? "death" : "hurt", this.hp <= 0 ? 0.5 : 0.28);
    return true;
  }

  playAction(key, duration) {
    this.animationKey = key;
    this.animationTimer = duration;
    this.animationDuration = duration;
  }

  moveAndCollide(dt, level) {
    this.x += this.vx * dt;
    this.x = clamp(this.x, 0, level.width - this.w);
    for (const solid of level.solids) {
      if (!rectsOverlap(this, solid)) continue;
      if (this.vx > 0) this.x = solid.x - this.w;
      if (this.vx < 0) this.x = solid.x + solid.w;
      this.vx = 0;
    }

    const wasGrounded = this.onGround;
    this.y += this.vy * dt;
    this.onGround = false;
    for (const solid of level.solids) {
      if (!rectsOverlap(this, solid)) continue;
      if (this.vy > 0) {
        this.y = solid.y - this.h;
        this.onGround = true;
      }
      if (this.vy < 0) this.y = solid.y + solid.h;
      this.vy = 0;
    }
    if (wasGrounded && !this.onGround) this.coyoteTimer = 0.1;
  }

  getAttackOrigin() {
    return {
      x: this.facing > 0 ? this.x + this.w : this.x,
      y: this.y + this.h * 0.48
    };
  }
}
