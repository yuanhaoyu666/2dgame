import { clamp, rectsOverlap } from "../systems/utils.js";

const STATS = {
  goblin: {
    name: "胖小怪",
    hp: 62,
    speed: 76,
    damage: 9,
    cooldown: 1.05,
    range: 46,
    gold: 7,
    color: "#d98f75",
    w: 38,
    h: 52,
    hurtbox: { x: -16, y: -66, w: 72, h: 118 }
  },
  wolf: {
    name: "妖狼",
    hp: 40,
    speed: 138,
    damage: 8,
    cooldown: 0.72,
    range: 40,
    gold: 8,
    color: "#9bc9d7",
    w: 40,
    h: 30,
    hurtbox: { x: -4, y: -8, w: 48, h: 42 }
  },
  boss: {
    name: "鬼面将军",
    hp: 470,
    speed: 92,
    damage: 17,
    cooldown: 0.88,
    range: 58,
    gold: 60,
    color: "#c84c43",
    w: 62,
    h: 82,
    hurtbox: { x: -10, y: -10, w: 82, h: 96 }
  }
};

export class Enemy {
  constructor(type, x, y, patrolMin, patrolMax, overrides = {}) {
    const stats = { ...STATS[type], ...overrides };
    this.type = type;
    this.bossTier = stats.bossTier ?? 0;
    this.name = stats.name;
    this.x = x;
    this.y = y;
    this.w = stats.w;
    this.h = stats.h;
    this.vx = 0;
    this.vy = 0;
    this.gravity = 1450;
    this.onGround = false;
    this.facing = -1;
    this.maxHp = stats.hp;
    this.hp = stats.hp;
    this.speed = stats.speed;
    this.damage = stats.damage;
    this.cooldownBase = stats.cooldown;
    this.attackCooldown = Math.random() * 0.45;
    this.skillCooldown = 1.2 + Math.random() * 0.8;
    this.range = stats.range;
    this.gold = stats.gold;
    this.color = stats.color;
    this.hurtbox = stats.hurtbox ?? { x: 0, y: 0, w: stats.w, h: stats.h };
    this.hitFlash = 0;
    this.dead = false;
    this.patrolMin = patrolMin ?? x - 130;
    this.patrolMax = patrolMax ?? x + 130;
    this.dashCooldown = 1.8;
    this.dashTimer = 0;
    this.aggroRange = type === "boss" ? 760 : 430;
    this.knockVx = 0;
    this.knockTimer = 0;
    this.attackFlash = 0;
    this.animationKey = "idle";
    this.animationTimer = 0;
    this.animationDuration = 0;
    this.hitOnce = false;
    this.dying = false;
  }

  update(dt, player, level) {
    const events = [];
    this.hitFlash = Math.max(0, this.hitFlash - dt);
    this.attackFlash = Math.max(0, this.attackFlash - dt);
    this.attackCooldown = Math.max(0, this.attackCooldown - dt);
    this.skillCooldown = Math.max(0, this.skillCooldown - dt);
    this.dashCooldown = Math.max(0, this.dashCooldown - dt);
    this.dashTimer = Math.max(0, this.dashTimer - dt);
    this.knockTimer = Math.max(0, this.knockTimer - dt);
    this.animationTimer = Math.max(0, this.animationTimer - dt);
    this.knockVx *= Math.max(0, 1 - dt * 7);

    if (this.dying) {
      this.vx = 0;
      this.applyPhysics(dt, level);
      if (this.animationTimer <= 0) this.dead = true;
      return events;
    }

    const dx = player.x + player.w / 2 - (this.x + this.w / 2);
    const dy = Math.abs(player.y + player.h / 2 - (this.y + this.h / 2));
    const distanceX = Math.abs(dx);
    const canSeePlayer = distanceX < this.aggroRange && dy < 155;

    if (this.type === "goblin") {
      this.updateFatGoblin(dt, player, level, events, dx, dy, distanceX, canSeePlayer);
      return events;
    }

    let targetSpeed = this.speed * this.facing;
    if (this.type === "boss" && this.hp <= this.maxHp / 2) {
      this.cooldownBase = 0.54;
      this.speed = Math.max(this.speed, 122);
    }

    if (canSeePlayer) {
      this.facing = dx >= 0 ? 1 : -1;
      targetSpeed = this.speed * this.facing;
    } else if (this.x < this.patrolMin) {
      this.facing = 1;
      targetSpeed = this.speed;
    } else if (this.x > this.patrolMax) {
      this.facing = -1;
      targetSpeed = -this.speed;
    }

    if (this.onGround && !this.hasGroundAhead(level)) {
      this.facing *= -1;
      targetSpeed = this.speed * this.facing;
    }

    if (this.type === "wolf" && canSeePlayer && this.dashCooldown <= 0 && distanceX < 250) {
      this.dashTimer = 0.24;
      this.dashCooldown = 1.35;
      this.attackFlash = 0.24;
      this.animationKey = "dash";
      this.animationTimer = 0.24;
      this.animationDuration = 0.24;
    }

    if (this.type === "boss" && canSeePlayer && this.dashCooldown <= 0 && distanceX > 120) {
      this.dashTimer = 0.34;
      this.dashCooldown = this.hp <= this.maxHp / 2 ? 1.35 : 2.05;
      this.attackFlash = 0.3;
      this.animationKey = "dash";
      this.animationTimer = 0.34;
      this.animationDuration = 0.34;
    }

    const dashSpeed = this.type === "boss" ? 405 : 360;
    this.vx = this.dashTimer > 0 ? this.facing * dashSpeed : targetSpeed;
    if (this.knockTimer > 0) this.vx += this.knockVx;

    if (distanceX <= this.range && dy < 62 && this.attackCooldown <= 0) {
      if (player.takeDamage(this.damage)) this.attackFlash = 0.16;
      this.attackCooldown = this.cooldownBase;
      this.animationKey = this.type === "boss" ? "slash" : this.type === "wolf" ? "attack" : "idle";
      this.animationTimer = this.type === "boss" ? 0.36 : this.type === "wolf" ? 0.34 : 0;
      this.animationDuration = this.animationTimer;
    }

    if (this.type === "boss" && this.animationTimer <= 0) {
      this.animationKey = Math.abs(this.vx) > 16 && this.onGround ? "walk" : "idle";
    }
    if (this.type === "wolf" && this.animationTimer <= 0) {
      this.animationKey = Math.abs(this.vx) > 16 && this.onGround ? "walk" : "idle";
    }

    this.applyPhysics(dt, level);
    return events;
  }

  updateFatGoblin(dt, player, level, events, dx, dy, distanceX, canSeePlayer) {
    if (this.animationTimer <= 0 && ["punch", "bellySlam", "charge", "fatMissile", "burpJet", "fartShockwave"].includes(this.animationKey)) {
      this.animationKey = "idle";
      this.hitOnce = false;
    }

    if (canSeePlayer) this.facing = dx >= 0 ? 1 : -1;

    let targetSpeed = this.speed * this.facing;
    if (!canSeePlayer) {
      if (this.x < this.patrolMin) this.facing = 1;
      if (this.x > this.patrolMax) this.facing = -1;
      targetSpeed = this.speed * this.facing;
    }

    if (this.onGround && !this.hasGroundAhead(level)) {
      this.facing *= -1;
      targetSpeed = this.speed * this.facing;
    }

    if (canSeePlayer && this.animationTimer <= 0 && this.skillCooldown <= 0) {
      if (distanceX > 260) this.startFatSkill("fatMissile", 0.55);
      else if (distanceX > 155) this.startFatSkill(Math.random() > 0.5 ? "charge" : "burpJet", 0.55);
      else if (distanceX > 80) this.startFatSkill(Math.random() > 0.5 ? "bellySlam" : "fartShockwave", 0.65);
    }

    if (canSeePlayer && distanceX <= this.range && dy < 70 && this.attackCooldown <= 0 && this.animationTimer <= 0) {
      this.startFatSkill("punch", 0.42);
    }

    if (this.animationKey === "charge") {
      this.vx = this.facing * 355;
      if (!this.hitOnce && distanceX < 74 && dy < 74) {
        if (player.takeDamage(13)) events.push({ type: "screenShake", power: 7, duration: 0.12 });
        this.hitOnce = true;
      }
    } else if (this.animationKey === "bellySlam") {
      this.vx = 0;
      if (!this.hitOnce && this.animationTimer < 0.28 && distanceX < 92 && dy < 82) {
        if (player.takeDamage(15)) events.push({ type: "shockwave", x: this.x - 24, y: this.y + this.h - 26, w: this.w + 48, h: 30, color: "#d2c290" });
        this.hitOnce = true;
      }
    } else if (this.animationKey === "burpJet") {
      this.vx = 0;
      if (!this.hitOnce && this.animationTimer < 0.32) {
        events.push({
          type: "hazard",
          x: this.facing > 0 ? this.x + this.w - 4 : this.x - 110,
          y: this.y + 10,
          w: 114,
          h: 42,
          damage: 9,
          color: "rgba(172, 168, 81, 0.45)"
        });
        this.hitOnce = true;
      }
    } else if (this.animationKey === "fartShockwave") {
      this.vx = 0;
      if (!this.hitOnce && this.animationTimer < 0.36) {
        events.push({ type: "shockwave", x: this.x - 70, y: this.y + 12, w: this.w + 140, h: 78, damage: 11, color: "rgba(170, 164, 77, 0.38)" });
        this.hitOnce = true;
      }
    } else if (this.animationKey === "fatMissile") {
      this.vx = 0;
      if (!this.hitOnce && this.animationTimer < 0.22) {
        events.push({
          type: "projectile",
          x: this.facing > 0 ? this.x + this.w : this.x - 34,
          y: this.y + 23,
          vx: this.facing * 260,
          vy: -15,
          w: 34,
          h: 24,
          damage: 10,
          life: 2.2
        });
        this.hitOnce = true;
      }
    } else if (this.animationKey === "punch") {
      this.vx = 0;
      if (!this.hitOnce && this.animationTimer < 0.22 && distanceX <= this.range + 14 && dy < 70) {
        if (player.takeDamage(this.damage)) events.push({ type: "hitFx", x: player.x + player.w / 2, y: player.y + 20 });
        this.hitOnce = true;
      }
    } else {
      this.vx = targetSpeed;
      this.animationKey = Math.abs(this.vx) > 10 ? "walk" : "idle";
    }

    if (this.knockTimer > 0) this.vx += this.knockVx;
    this.applyPhysics(dt, level);
  }

  startFatSkill(key, duration) {
    this.animationKey = key;
    this.animationTimer = duration;
    this.animationDuration = duration;
    this.attackCooldown = this.cooldownBase;
    this.skillCooldown = 1.2 + Math.random() * 1.1;
    this.hitOnce = false;
    this.attackFlash = 0.15;
  }

  applyPhysics(dt, level) {
    this.vy += this.gravity * dt;
    this.moveAndCollide(dt, level);
    if (this.y > level.killY) this.dead = true;
  }

  hasGroundAhead(level) {
    const probe = {
      x: this.x + (this.facing > 0 ? this.w + 8 : -10),
      y: this.y + this.h + 4,
      w: 10,
      h: 12
    };
    return level.solids.some((solid) => rectsOverlap(probe, solid));
  }

  moveAndCollide(dt, level) {
    this.x += this.vx * dt;
    this.x = clamp(this.x, 0, level.width - this.w);
    for (const solid of level.solids) {
      if (!rectsOverlap(this, solid)) continue;
      if (this.vx > 0) {
        this.x = solid.x - this.w;
        this.facing = -1;
      }
      if (this.vx < 0) {
        this.x = solid.x + solid.w;
        this.facing = 1;
      }
      this.vx = 0;
    }

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
  }

  hit(amount, facing, knockback) {
    this.hp -= amount;
    this.hitFlash = 0.16;
    this.animationKey = this.hp <= 0 ? "death" : "hurt";
    this.animationTimer = this.hp <= 0 ? 0.75 : 0.35;
    this.animationDuration = this.animationTimer;
    this.knockVx = facing * knockback;
    this.knockTimer = 0.18;
    if (this.hp <= 0) this.dying = true;
  }

  getHurtBox() {
    return {
      x: this.x + this.hurtbox.x,
      y: this.y + this.hurtbox.y,
      w: this.hurtbox.w,
      h: this.hurtbox.h
    };
  }
}
