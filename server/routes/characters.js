// server/routes/characters.js
const express  = require('express');
const { query, queryOne, execute, transaction } = require('../db');
const { authMiddleware } = require('./auth');
const { JOB_BASE, JOB_SKILLS } = require('../gameData');

const router = express.Router();
router.use(authMiddleware);

router.get('/', async (req, res) => {
  const chars = await query(
    `SELECT c.*, GROUP_CONCAT(cs.skill_id) AS learned_skills
     FROM characters c LEFT JOIN char_skills cs ON cs.character_id = c.id
     WHERE c.user_id = ? GROUP BY c.id`, [req.user.userId]
  );
  res.json(chars.map(parseChar));
});

router.post('/', async (req, res) => {
  try {
    const { name, job } = req.body;
    if (!name || !job) return res.status(400).json({ error: '缺少參數' });
    if (!JOB_BASE[job])  return res.status(400).json({ error: '無效職業' });
    if (name.length < 1 || name.length > 20) return res.status(400).json({ error: '名字需1-20字' });

    const count = await queryOne('SELECT COUNT(*) AS c FROM characters WHERE user_id=?', [req.user.userId]);
    if (count.c >= 3) return res.status(400).json({ error: '最多建立3個角色' });

    const base = JOB_BASE[job];
    const r = await execute(
      `INSERT INTO characters (user_id, name, job, max_hp, hp, max_mp, mp, stat_str, stat_int, stat_agi, stat_wis, stat_def)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [req.user.userId, name, job, base.maxHp, base.maxHp, base.maxMp, base.maxMp, base.stats.STR, base.stats.INT, base.stats.AGI, base.stats.WIS, base.stats.DEF]
    );

    const charId = r.insertId;
    const starterGear = getStarterGear(job);
    for (const gear of starterGear) {
      await execute(
        `INSERT INTO char_equipment (character_id, slot, item_id, item_name, rarity, stat_bonus) VALUES (?,?,?,?,?,?)`,
        [charId, gear.slot, gear.itemId, gear.name, gear.rarity, JSON.stringify(gear.bonus)]
      );
    }

    const newChar = await queryOne('SELECT * FROM characters WHERE id=?', [charId]);
    res.status(201).json(parseChar(newChar));
  } catch (err) {
    res.status(500).json({ error: '伺服器錯誤' });
  }
});

router.get('/:id', async (req, res) => {
  const char = await getFullChar(req.params.id, req.user.userId);
  if (!char) return res.status(404).json({ error: '角色不存在' });
  res.json(char);
});

router.patch('/:id/story', async (req, res) => {
  const { storyIndex } = req.body;
  await execute('UPDATE characters SET story_index=? WHERE id=? AND user_id=?', [storyIndex, req.params.id, req.user.userId]);
  res.json({ ok: true });
});

router.post('/:id/learn-skill', async (req, res) => {
  try {
    const { skillId, cost } = req.body;
    const char = await queryOne('SELECT * FROM characters WHERE id=? AND user_id=?', [req.params.id, req.user.userId]);
    if (!char) return res.status(404).json({ error: '角色不存在' });
    if (char.sp < cost) return res.status(400).json({ error: '技能點不足' });

    const existing = await queryOne('SELECT id, skill_level FROM char_skills WHERE character_id=? AND skill_id=?', [char.id, skillId]);
    if (existing && existing.skill_level >= 100) return res.status(400).json({ error: '技能已達最高等級 (Lv.100)' });

    await transaction(async (conn) => {
      await conn.execute('UPDATE characters SET sp=sp-? WHERE id=?', [cost, char.id]);
      if (existing) await conn.execute('UPDATE char_skills SET skill_level=skill_level+1 WHERE id=?', [existing.id]);
      else await conn.execute('INSERT INTO char_skills (character_id, skill_id, skill_level) VALUES (?,?,1)', [char.id, skillId]);
    });

    const updated = await getFullChar(char.id, req.user.userId);
    res.json(updated);
  } catch (err) { res.status(500).json({ error: '伺服器錯誤' }); }
});

router.post('/:id/equip', async (req, res) => {
  try {
    const { itemId, slot } = req.body;
    const char = await queryOne('SELECT id FROM characters WHERE id=? AND user_id=?', [req.params.id, req.user.userId]);
    if (!char) return res.status(404).json({ error: '角色不存在' });

    const invItem = await queryOne('SELECT * FROM inventory WHERE character_id=? AND item_id=?', [char.id, itemId]);
    if (!invItem) return res.status(400).json({ error: '道具不在背包中' });

    await transaction(async (conn) => {
      const old = await queryOne('SELECT * FROM char_equipment WHERE character_id=? AND slot=?', [char.id, slot]);
      if (old) {
        await conn.execute(`INSERT INTO inventory (character_id, item_id, item_name, item_type, rarity, stat_bonus, quantity) VALUES (?,?,?,?,?,?,1) ON DUPLICATE KEY UPDATE quantity=quantity+1`, [char.id, old.item_id, old.item_name, slot, old.rarity, old.stat_bonus]);
        await conn.execute('DELETE FROM char_equipment WHERE character_id=? AND slot=?', [char.id, slot]);
      }
      await conn.execute(`INSERT INTO char_equipment (character_id, slot, item_id, item_name, rarity, stat_bonus) VALUES (?,?,?,?,?,?)`, [char.id, slot, invItem.item_id, invItem.item_name, invItem.rarity, invItem.stat_bonus]);
      
      if (invItem.quantity > 1) await conn.execute('UPDATE inventory SET quantity=quantity-1 WHERE id=?', [invItem.id]);
      else await conn.execute('DELETE FROM inventory WHERE id=?', [invItem.id]);
    });

    const updated = await getFullChar(char.id, req.user.userId);
    res.json(updated);
  } catch (err) { res.status(500).json({ error: '伺服器錯誤' }); }
});

router.post('/:id/solo-reward', async (req, res) => {
  try {
    const { xp, gold, loot } = req.body;
    const char = await queryOne('SELECT * FROM characters WHERE id=? AND user_id=?', [req.params.id, req.user.userId]);
    if (!char) return res.status(404).json({ error: '角色不存在' });

    const LOOT_META = {
      '小型符文石':  { type:'material', rarity:'common'  }, '骨質碎片':    { type:'material', rarity:'common'  },
      '暗影匕首':    { type:'weapon',   rarity:'rare'    }, '惡魔之核':    { type:'material', rarity:'rare'    },
      '混沌石板':    { type:'material', rarity:'epic'    }, '守門者之鑰':  { type:'accessory',rarity:'legend'  },
    };
    const meta = LOOT_META[loot] || { type:'material', rarity:'common' };

    let newXp = (char.xp || 0) + (xp || 0), newGold = (char.gold || 0) + (gold || 0), newLevel = char.level;
    let newXpNext = char.xp_next, newMaxHp = char.max_hp, newMaxMp = char.max_mp, newSp = char.sp;
    let newStr = char.stat_str, newInt = char.stat_int, newAgi = char.stat_agi, newWis = char.stat_wis, newDef = char.stat_def;
    let leveledUp = false;

    while (newXp >= newXpNext) {
      newXp -= newXpNext; newLevel++; newXpNext = Math.floor(newXpNext * 1.4);
      newMaxHp += 15; newMaxMp += 8; newSp += 2;
      newStr++; newInt++; newAgi++; newWis++; newDef++;
      leveledUp = true;
    }

    await transaction(async (conn) => {
      await conn.execute(`UPDATE characters SET xp=?, xp_next=?, gold=?, level=?, max_hp=?, hp=?, max_mp=?, sp=?, stat_str=?, stat_int=?, stat_agi=?, stat_wis=?, stat_def=? WHERE id=?`, [newXp, newXpNext, newGold, newLevel, newMaxHp, leveledUp ? newMaxHp : char.hp, newMaxMp, newSp, newStr, newInt, newAgi, newWis, newDef, char.id]);
      if (loot) {
        const lootId = 'loot_' + loot.replace(/\s/g, '_');
        await conn.execute(`INSERT INTO inventory (character_id, item_id, item_name, item_type, rarity, stat_bonus, quantity) VALUES (?,?,?,?,?,?,1) ON DUPLICATE KEY UPDATE quantity=quantity+1`, [char.id, lootId, loot, meta.type, meta.rarity, '{}']);
      }
    });

    const updated = await getFullChar(char.id, req.user.userId);
    res.json({ character: updated, leveledUp });
  } catch (err) { res.status(500).json({ error: '伺服器錯誤' }); }
});

router.post('/:id/save-hp', async (req, res) => {
  try {
    const { hp, mp } = req.body;
    await execute('UPDATE characters SET hp=?, mp=? WHERE id=? AND user_id=?', [hp ?? 0, mp ?? 0, req.params.id, req.user.userId]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: '伺服器錯誤' }); }
});

async function getFullChar(charId, userId) {
  const char = await queryOne('SELECT * FROM characters WHERE id=? AND user_id=?', [charId, userId]);
  if (!char) return null;

  const skills  = await query('SELECT skill_id, skill_level FROM char_skills WHERE character_id=?', [charId]);
  const equip   = await query('SELECT * FROM char_equipment WHERE character_id=?', [charId]);
  const inv     = await query('SELECT * FROM inventory WHERE character_id=?', [charId]);

  return {
    ...parseChar(char),
    learnedSkills: skills.reduce((acc, s) => { acc[s.skill_id] = s.skill_level || 1; return acc; }, {}),
    equipment: equip.map(e => ({ slot: e.slot, itemId: e.item_id, name: e.item_name, rarity: e.rarity, bonus: JSON.parse(e.stat_bonus || '{}') })),
    inventory: inv.map(i => ({ id: i.id, itemId: i.item_id, name: i.item_name, type: i.item_type, rarity: i.rarity, bonus: JSON.parse(i.stat_bonus || '{}'), quantity: i.quantity })),
    availableSkills: JOB_SKILLS[char.job] || [],
  };
}

function parseChar(c) {
  return {
    id: c.id, userId: c.user_id, name: c.name, job: c.job,
    level: c.level, xp: c.xp, xpNext: c.xp_next,
    hp: c.hp, maxHp: c.max_hp, mp: c.mp, maxMp: c.max_mp,
    sp: c.sp, gold: c.gold,
    stats: { STR: c.stat_str, INT: c.stat_int, AGI: c.stat_agi, WIS: c.stat_wis, DEF: c.stat_def },
    storyIndex: c.story_index,
    createdAt: c.created_at,
    learnedSkills: c.learned_skills ? c.learned_skills.split(',') : [],
  };
}

// ✅ 新增頭部與腳部的預設裝備
function getStarterGear(job) {
  const common = [
    { slot:'head', itemId:'cloth_cap', name:'布帽', rarity:'common', bonus:{DEF:1} },
    { slot:'foot', itemId:'old_boots', name:'舊靴子', rarity:'common', bonus:{AGI:1} }
  ];
  const map = {
    mage:    [{ slot:'weapon', itemId:'staff_wood', name:'木製法杖', rarity:'common', bonus:{INT:2} }, { slot:'armor', itemId:'robe_cloth', name:'布質長袍', rarity:'common', bonus:{MP:10} }],
    warrior: [{ slot:'weapon', itemId:'sword_iron', name:'鏽鐵劍', rarity:'common', bonus:{STR:2} }, { slot:'armor', itemId:'armor_leather', name:'皮甲', rarity:'common', bonus:{DEF:3} }],
    rogue:   [{ slot:'weapon', itemId:'dagger_rusty', name:'鏽匕首', rarity:'common', bonus:{AGI:2} }, { slot:'armor', itemId:'cloak_shadow', name:'暗影斗篷', rarity:'common', bonus:{AGI:1} }],
    priest:  [{ slot:'weapon', itemId:'scepter_holy', name:'聖光法杖', rarity:'common', bonus:{WIS:2} }, { slot:'armor', itemId:'robe_holy', name:'聖職法衣', rarity:'common', bonus:{MP:15} }],
  };
  return [...common, ...(map[job] || [])];
}

module.exports = router;
