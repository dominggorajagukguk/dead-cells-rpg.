// NPC Interaction, Merchant Shop & Collector Systems - Pixel Art Aesthetics

class NPCManager {
  constructor() {
    this.currentNPC = null;
    this.animTime = 0;
  }

  interactWith(npc, game) {
    this.currentNPC = npc;
    const modal = document.getElementById('npc-modal');
    const nameEl = document.getElementById('npc-name');
    const roleEl = document.getElementById('npc-role');
    const dialogEl = document.getElementById('npc-dialog');
    const shopContainer = document.getElementById('shop-container');
    const avatarEl = document.getElementById('npc-avatar');

    shopContainer.innerHTML = '';

    if (npc.type === 'merchant') {
      avatarEl.innerText = '👺';
      nameEl.innerText = 'Goblin Merchant';
      roleEl.innerText = 'Penjual Senjata & Perlengkapan Dungeon';
      dialogEl.innerText = '"Selamat datang, pejuang! Punya koin emas? Aku punya senjata tajam dan ramuan penambah nyawa untukmu!"';

      const shopItems = [
        {
          name: 'Vorpan of Doom',
          icon: '🍳',
          desc: '+28 Base DMG (Ding Crit!)',
          price: 60,
          currency: 'gold',
          itemKey: 'vorpan',
          type: 'primary'
        },
        {
          name: 'Hattori Blood Katana',
          icon: '🗡️',
          desc: '+34 Base DMG + Bleed Effect',
          price: 110,
          currency: 'gold',
          itemKey: 'blood_katana',
          type: 'primary'
        },
        {
          name: 'Frost Blast Scroll',
          icon: '❄️',
          desc: 'Freeze Enemies for 2.5s',
          price: 75,
          currency: 'gold',
          itemKey: 'frost_blast',
          type: 'skill'
        },
        {
          name: 'Refill Health Flask',
          icon: '🧪',
          desc: 'Isi ulang semua ramuan HP (+3 Flasks)',
          price: 40,
          currency: 'gold',
          action: 'refill_flasks'
        }
      ];

      shopItems.forEach(item => {
        const card = document.createElement('div');
        card.className = 'shop-item-card';
        card.innerHTML = `
          <div class="shop-item-name">${item.icon} ${item.name}</div>
          <div class="shop-item-desc">${item.desc}</div>
          <div class="shop-item-price">🪙 ${item.price} Gold</div>
        `;
        card.onclick = () => this.buyItem(item, game);
        shopContainer.appendChild(card);
      });

    } else if (npc.type === 'collector') {
      avatarEl.innerText = '🧙‍♂️';
      nameEl.innerText = 'The Collector';
      roleEl.innerText = 'Master of Dead Cells & Permanent Forging';
      dialogEl.innerText = '"Bawakan aku Dead Cells dari monster-monster itu. Aku akan menempa jiwamu menjadi tak terkalahkan!"';

      const collectorItems = [
        {
          name: 'Upgrade Flask Capacity',
          icon: '🧪',
          desc: '+1 Max Potion Flask (+1 Charge)',
          price: 4,
          currency: 'cells',
          action: 'upgrade_flask'
        },
        {
          name: 'Weapon Forge Tier +',
          icon: '✨',
          desc: 'Tingkatkan Tier Senjata Aktif (+35% Damage)',
          price: 3,
          currency: 'cells',
          action: 'upgrade_weapon'
        },
        {
          name: 'Ancient Brutality Rune',
          icon: '⚔️',
          desc: '+1 Permanent Brutality Stat',
          price: 5,
          currency: 'cells',
          action: 'add_brutality'
        }
      ];

      collectorItems.forEach(item => {
        const card = document.createElement('div');
        card.className = 'shop-item-card';
        card.innerHTML = `
          <div class="shop-item-name">${item.icon} ${item.name}</div>
          <div class="shop-item-desc">${item.desc}</div>
          <div class="shop-item-price" style="color: var(--cell);">💠 ${item.price} Dead Cells</div>
        `;
        card.onclick = () => this.buyCollectorUpgrade(item, game);
        shopContainer.appendChild(card);
      });
    }

    modal.classList.add('active');
    game.isPaused = true;
  }

  buyItem(item, game) {
    if (game.player.gold < item.price) {
      game.showToast('Gold tidak cukup!');
      window.soundEngine.playHit(false, true);
      return;
    }

    game.player.gold -= item.price;
    window.soundEngine.playUpgrade();

    if (item.action === 'refill_flasks') {
      game.player.flasks = game.player.maxFlasks;
      game.showToast('Health Flasks terisi penuh!');
    } else if (item.type === 'primary') {
      game.player.primary = { ...WEAPONS[item.itemKey], tier: game.currentStage };
      game.showToast(`Memperoleh ${item.name}!`);
    } else if (item.type === 'skill') {
      game.player.skill2 = { ...WEAPONS[item.itemKey], tier: game.currentStage };
      game.showToast(`Skill ${item.name} dipasang di [E]!`);
    }

    game.updateHUD();
  }

  buyCollectorUpgrade(item, game) {
    if (game.player.cells < item.price) {
      game.showToast('Dead Cells tidak cukup!');
      window.soundEngine.playHit(false, true);
      return;
    }

    game.player.cells -= item.price;
    window.soundEngine.playUpgrade();

    if (item.action === 'upgrade_flask') {
      game.player.maxFlasks++;
      game.player.flasks = game.player.maxFlasks;
      game.showToast('Kapasitas Flask bertambah!');
    } else if (item.action === 'upgrade_weapon') {
      game.player.primary.tier++;
      game.showToast(`Senjata diupgrade ke Tier ${game.player.primary.tier}!`);
    } else if (item.action === 'add_brutality') {
      game.player.brutality++;
      game.player.recalculateStats();
      game.showToast('Brutality bertambah!');
    }

    game.updateHUD();
  }

  draw(ctx, npcs, camera) {
    this.animTime += 0.016;

    for (const npc of npcs) {
      const rx = Math.round(npc.x - camera.x);
      const ry = Math.round(npc.y - camera.y);
      const bob = Math.sin(this.animTime * 4) * 3;

      ctx.save();
      ctx.translate(rx, ry + bob);

      if (npc.type === 'merchant') {
        // Goblin Merchant Sprite
        ctx.fillStyle = '#2e7d32';
        ctx.fillRect(-12, -44, 24, 44); // Body
        // Big backpack
        ctx.fillStyle = '#6d4c41';
        ctx.fillRect(-22, -38, 10, 26);
        ctx.fillStyle = '#ffd54f';
        ctx.fillRect(-22, -20, 10, 4); // Gold buckle

        // Pointy Goblin Ears & Cap
        ctx.fillStyle = '#e65100';
        ctx.fillRect(-14, -48, 28, 8);
        ctx.fillStyle = '#4caf50';
        ctx.fillRect(-18, -42, 6, 6); // Left ear
        ctx.fillRect(12, -42, 6, 6); // Right ear

        // Glowing Merchant Coins
        ctx.fillStyle = '#ffd700';
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 10;
        ctx.fillRect(4, -26, 6, 6);
      } else {
        // The Collector Sprite
        ctx.fillStyle = '#311b92';
        ctx.fillRect(-14, -50, 28, 50); // Mystic Robe
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(-14, -50, 28, 6); // Golden Mantle

        // Hooded Mask
        ctx.fillStyle = '#1a237e';
        ctx.fillRect(-10, -44, 20, 16);
        ctx.fillStyle = '#00e5ff';
        ctx.shadowColor = '#00e5ff';
        ctx.shadowBlur = 10;
        ctx.fillRect(-4, -38, 8, 4); // Glowing Blue Visor

        // Orbiting Soul Cells
        for (let i = 0; i < 3; i++) {
          const orbitAngle = this.animTime * 3 + (i * Math.PI * 2 / 3);
          const ox = Math.cos(orbitAngle) * 24;
          const oy = Math.sin(orbitAngle) * 12 - 25;
          ctx.fillStyle = '#00e5ff';
          ctx.shadowColor = '#00e5ff';
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.arc(ox, oy, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Name & Interaction Speech Bubble
      ctx.font = 'bold 13px Rajdhani';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#000';
      ctx.shadowBlur = 4;
      ctx.fillText(npc.name, 0, -56);

      ctx.restore();
    }
  }
}

window.NPCManager = NPCManager;
