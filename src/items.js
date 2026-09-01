// Items, Weapons, Skills & Drops System

const WEAPONS = {
  // --- Primary Melee Weapons (Brutality / Survival) ---
  rusty_sword: {
    id: 'rusty_sword',
    name: 'Rusty Blade',
    type: 'primary',
    statType: 'brutality',
    icon: '🗡️',
    baseDamage: 22,
    comboCount: 3,
    attackSpeed: 0.22,
    range: 65,
    description: 'Pedang usang yang masih tajam. Memberikan damage tebasan beruntun.',
    critMultiplier: 1.5,
    color: '#ff334b'
  },
  twin_daggers: {
    id: 'twin_daggers',
    name: 'Assassin Daggers',
    type: 'primary',
    statType: 'brutality',
    icon: '⚔️',
    baseDamage: 16,
    comboCount: 3,
    attackSpeed: 0.14,
    range: 52,
    description: 'Serangan super cepat! Serangan ketiga dijamin Critical Hit 250% damage.',
    critMultiplier: 2.5,
    color: '#ff1744'
  },
  broadsword: {
    id: 'broadsword',
    name: 'Cursed Broadsword',
    type: 'primary',
    statType: 'survival',
    icon: '🪓',
    baseDamage: 45,
    comboCount: 3,
    attackSpeed: 0.38,
    range: 85,
    description: 'Pedang raksasa berbobot berat. Memiliki area luas dan stun musuh.',
    critMultiplier: 1.8,
    color: '#1cd483'
  },
  vorpan: {
    id: 'vorpan',
    name: 'Vorpan of Doom',
    type: 'primary',
    statType: 'brutality',
    icon: '🍳',
    baseDamage: 28,
    comboCount: 3,
    attackSpeed: 0.18,
    range: 58,
    description: 'Wajan besi mematikan! Menimbulkan bunyi "DING" dan crit jika menyerang musuh dari depan.',
    critMultiplier: 2.0,
    color: '#ffc83b'
  },
  blood_katana: {
    id: 'blood_katana',
    name: 'Hattori Blood Katana',
    type: 'primary',
    statType: 'brutality',
    icon: '🗡️',
    baseDamage: 34,
    comboCount: 3,
    attackSpeed: 0.19,
    range: 75,
    description: 'Katana berlumur darah. Menyebabkan efek pendarahan (Bleed) berkala pada musuh.',
    critMultiplier: 2.2,
    color: '#d50000'
  },

  // --- Secondary Ranged / Magical Weapons (Tactics / Brutality) ---
  ice_bow: {
    id: 'ice_bow',
    name: 'Frost Bow',
    type: 'secondary',
    statType: 'tactics',
    icon: '🏹',
    baseDamage: 25,
    cooldown: 0.5,
    range: 450,
    description: 'Menembakkan panah es yang memperlambat dan membekukan gerakan musuh.',
    effect: 'freeze',
    color: '#00e5ff'
  },
  electric_whip: {
    id: 'electric_whip',
    name: 'Electric Whip',
    type: 'secondary',
    statType: 'tactics',
    icon: '⚡',
    baseDamage: 32,
    cooldown: 0.4,
    range: 160,
    description: 'Pecutan petir otomatis mengunci musuh terdekat dan menyalurkan aliran listrik.',
    effect: 'shock',
    color: '#b042ff'
  },
  heavy_crossbow: {
    id: 'heavy_crossbow',
    name: 'Heavy Crossbow',
    type: 'secondary',
    statType: 'tactics',
    icon: '🎯',
    baseDamage: 55,
    cooldown: 1.0,
    range: 520,
    description: 'Menembakkan baut panah berdaya tembus tinggi yang mendorong musuh ke belakang.',
    effect: 'knockback',
    color: '#ff9800'
  },
  throwing_knives: {
    id: 'throwing_knives',
    name: 'Bleeding Kunai',
    type: 'secondary',
    statType: 'brutality',
    icon: '🗡️',
    baseDamage: 20,
    cooldown: 0.3,
    range: 380,
    description: 'Melemparkan 2 pisau beracun yang menancap dan menyebabkan efek Bleed.',
    effect: 'bleed',
    color: '#ff1744'
  },

  // --- Active Skills (Q & E) ---
  cluster_bomb: {
    id: 'cluster_bomb',
    name: 'Cluster Grenade',
    type: 'skill',
    statType: 'tactics',
    icon: '💣',
    baseDamage: 70,
    cooldown: 5.0,
    range: 200,
    description: 'Melempar granat yang meledak menjadi 4 pecahan bom kecil.',
    color: '#ff5722'
  },
  frost_blast: {
    id: 'frost_blast',
    name: 'Frost Blast',
    type: 'skill',
    statType: 'survival',
    icon: '❄️',
    baseDamage: 40,
    cooldown: 4.5,
    range: 180,
    description: 'Gelombang hawa beku yang membekukan semua musuh di depan selama 2.5 detik.',
    color: '#00e5ff'
  },
  sinew_slicer: {
    id: 'sinew_slicer',
    name: 'Sinew Slicer Turret',
    type: 'skill',
    statType: 'tactics',
    icon: '⚙️',
    baseDamage: 18,
    cooldown: 8.0,
    duration: 6.0,
    description: 'Menaruh turret otomatis yang menembakkan gergaji berputar ke musuh terdekat.',
    color: '#ff9800'
  },
  shadow_dash: {
    id: 'shadow_dash',
    name: 'Phaser Strike',
    type: 'skill',
    statType: 'brutality',
    icon: '⚡',
    baseDamage: 60,
    cooldown: 3.5,
    range: 220,
    description: 'Teleportasi instan ke belakang musuh terdekat dan serang dengan bonus damage 150%.',
    color: '#b042ff'
  }
};

// Loot Drop Entity (Dropped Gold, Cells, Scrolls, Weapons)
class DropEntity {
  constructor(x, y, type, data = {}) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 160;
    this.vy = -180 - Math.random() * 120;
    this.type = type; // 'gold', 'cell', 'scroll', 'weapon', 'chest'
    this.data = data;
    this.w = 20;
    this.h = 20;
    this.grounded = false;
    this.lifeTime = 0;
    this.collected = false;
  }

  update(dt, level) {
    this.lifeTime += dt;

    if (!this.grounded) {
      this.vy += 600 * dt;
      this.x += this.vx * dt;
      this.y += this.vy * dt;

      // Platform / Floor collision
      const checkX = this.x;
      const checkY = this.y + 10;
      if (level.isSolid(checkX, checkY)) {
        this.y = Math.floor(checkY / level.tileSize) * level.tileSize - 10;
        this.vy = 0;
        this.vx = 0;
        this.grounded = true;
      }
    }
  }

  draw(ctx, camera) {
    const rx = this.x - camera.x;
    const ry = this.y - camera.y + Math.sin(this.lifeTime * 4) * 3;

    ctx.save();
    ctx.translate(rx, ry);

    if (this.type === 'gold') {
      ctx.fillStyle = '#ffc83b';
      ctx.shadowColor = '#ffc83b';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(0, 0, 6, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.type === 'cell') {
      ctx.fillStyle = '#00e5ff';
      ctx.shadowColor = '#00e5ff';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(0, -8);
      ctx.lineTo(6, 0);
      ctx.lineTo(0, 8);
      ctx.lineTo(-6, 0);
      ctx.closePath();
      ctx.fill();
    } else if (this.type === 'scroll') {
      ctx.fillStyle = '#ffd700';
      ctx.font = '22px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('📜', 0, 6);
    } else if (this.type === 'weapon') {
      // Weapon pedestal aura
      ctx.fillStyle = this.data.color || '#ff334b';
      ctx.shadowColor = this.data.color || '#ff334b';
      ctx.shadowBlur = 12;
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(this.data.icon || '🗡️', 0, 6);

      // Draw item name banner
      ctx.font = 'bold 12px Rajdhani';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(this.data.name, 0, -18);
    }

    ctx.restore();
  }
}

window.WEAPONS = WEAPONS;
window.DropEntity = DropEntity;
