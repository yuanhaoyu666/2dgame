export const WEAPONS = {
  katana: {
    id: "katana",
    name: "普通武士刀",
    damage: 18,
    cooldown: 0.38,
    range: 56,
    arrowDamage: 16,
    arrowCooldown: 0.82,
    arrowWindup: 0.12,
    arrowSpeed: 520,
    arrowStaminaCost: 18
  },
  tachi: {
    id: "tachi",
    name: "太刀",
    damage: 26,
    cooldown: 0.52,
    range: 66,
    arrowDamage: 18,
    arrowCooldown: 0.95,
    arrowWindup: 0.15,
    arrowSpeed: 520,
    arrowStaminaCost: 20
  },
  dual: {
    id: "dual",
    name: "双刀",
    damage: 13,
    cooldown: 0.24,
    range: 50,
    arrowDamage: 13,
    arrowCooldown: 0.62,
    arrowWindup: 0.1,
    arrowSpeed: 560,
    arrowStaminaCost: 16
  }
};

export const SHOP_ITEMS = [
  { weaponId: "tachi", price: 35, label: "太刀", effect: "近战高伤害，射箭间隔稍慢" },
  { weaponId: "dual", price: 35, label: "双刀", effect: "近战攻速快，射箭间隔更短" }
];
