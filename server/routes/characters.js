// server/routes/characters.js
const express  = require('express');
const { query, queryOne, execute, transaction } = require('../db');
const { authMiddleware } = require('./auth');
const { JOB_BASE, JOB_SKILLS, CRAFT_DATA, TOOL_DATA } = require('../gameData');

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
  } catch (err) { res.status(500).json({ error: '伺服器錯誤' }); }
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

// ✅ 製作裝備與道具 API
router.post('/:id/craft', async (req, res) => {
  try {
    const { craftId } = req.body;
    const char = await queryOne('SELECT id FROM characters WHERE id=? AND user_id=?', [req.params.id, req.user.userId]);
    if (!char) return res.status(404).json({ error: '角色不存在' });

    const recipe = CRAFT_DATA[craftId];
    if (!recipe) return res.status(400).json({ error: '無效的配方' });

    const inv = await query('SELECT * FROM inventory WHERE character_id=?', [char.id]);
    const invMap = {};
    for(let item of inv) invMap[item.item_name] = (invMap[item.item_name] || 0) + item.quantity;

    for (const [matName, reqQty] of Object.entries(recipe.mats)) {
        if ((invMap[matName] || 0) < reqQty) {
            return res.status(400).json({ error: `缺少素材：${matName}` });
        }
    }

    const toolId = recipe.category === 'cook' ? 'tool_cook' : 'tool_enhance';
    const toolQuery = await queryOne('SELECT skill_level FROM char_skills WHERE character_id=? AND skill_id=?', [char.id, toolId]);
    const toolLv = toolQuery ? toolQuery.skill_level : 1;
    const statMultiplier = 1 + (toolLv - 1) * 0.05;

    let finalBonus = { level: 1, base: { ...recipe.bonus } };
    for(let [k,v] of Object.entries(recipe.bonus)) {
        finalBonus[k] = Math.floor(v * statMultiplier);
    }

    await transaction(async (conn) => {
        for (const [matName, reqQty] of Object.entries(recipe.mats)) {
            let remaining = reqQty;
            const rows = await conn.execute('SELECT id, quantity FROM inventory WHERE character_id=? AND item_name=?', [char.id, matName]);
            const items = rows[0]; 
            for (let row of items) {
                if (remaining <= 0) break;
                if (row.quantity > remaining) {
                    await conn.execute('UPDATE inventory SET quantity = quantity - ? WHERE id = ?', [remaining, row.id]);
                    remaining = 0;
                } else {
                    remaining -= row.quantity;
                    await conn.execute('DELETE FROM inventory WHERE id = ?', [row.id]);
                }
            }
        }

        const dbType = recipe.type === 'tool' ? 'material' : recipe.type;
        const newId = `craft_${craftId}_${Date.now()}`; 
        
        await conn.execute(
            `INSERT INTO inventory (character_id, item_id, item_name, item_type, rarity, stat_bonus, quantity)
             VALUES (?,?,?,?,?,?,1) ON DUPLICATE KEY UPDATE quantity=quantity+1`,
            [char.id, newId, recipe.name, dbType, recipe.rarity || 'common', JSON.stringify(finalBonus)]
        );
    });

    const updated = await getFullChar(char.id, req.user.userId);
    res.json(updated);
  } catch (err) {
    console.error('[craft error]', err);
    res.status(500).json({ error: '伺服器錯誤' }); 
  }
});

// ✅ 分解裝備 API
router.post('/:id/disassemble', async (req, res) => {
  try {
      const { invId } = req.body;
      const char = await queryOne('SELECT id FROM characters WHERE id=? AND user_id=?', [req.params.id, req.user.userId]);
      if (!char) return res.status(404).json({ error: '角色不存在' });

      await execute('DELETE FROM inventory WHERE id=? AND character_id=?', [invId, char.id]);
      await execute(`INSERT INTO inventory (character_id, item_id, item_name, item_type, rarity, stat_bonus, quantity) VALUES (?, 'scrap', '裝備碎片', 'material', 'common', '{}', 1) ON DUPLICATE KEY UPDATE quantity=quantity+1`, [char.id]);

      const updated = await getFullChar(char.id, req.user.userId);
      res.json(updated);
  } catch(e) { 
      res.status(500).json({ error: '伺服器錯誤' }); 
  }
});

// ✅ 升級工具 API
router.post('/:id/upgrade-tool', async (req, res) => {
    try {
        const { toolId } = req.body;
        const char = await queryOne('SELECT id FROM characters WHERE id=? AND user_id=?', [req.params.id, req.user.userId]);
        if (!char) return res.status(404).json({ error: '角色不存在' });
        
        const toolDef = TOOL_DATA[toolId];
        if (!toolDef) return res.status(400).json({ error: '無效的工具' });

        const existing = await queryOne('SELECT id, skill_level FROM char_skills WHERE character_id=? AND skill_id=?', [char.id, toolId]);
        const currentLv = existing ? existing.skill_level : 1;
        if (currentLv >= 100) return res.status(400).json({ error: '工具已達最高等級 (Lv.100)' });

        const inv = await query('SELECT * FROM inventory WHERE character_id=?', [char.id]);
        const invMap = {};
        for(let item of inv) invMap[item.item_name] = (invMap[item.item_name] || 0) + item.quantity;

        for (const [matName, baseQty] of Object.entries(toolDef.baseReq)) {
            const reqQty = baseQty * currentLv;
            if ((invMap[matName] || 0) < reqQty) return res.status(400).json({ error: `缺少素材：${matName} ×${reqQty}` });
        }

        await transaction(async (conn) => {
            for (const [matName, baseQty] of Object.entries(toolDef.baseReq)) {
                let remaining = baseQty * currentLv;
                const rows = await conn.execute('SELECT id, quantity FROM inventory WHERE character_id=? AND item_name=?', [char.id, matName]);
                const items = rows[0]; 
                for (let row of items) {
                    if (remaining <= 0) break;
                    if (row.quantity > remaining) {
                        await conn.execute('UPDATE inventory SET quantity = quantity - ? WHERE id = ?', [remaining, row.id]);
                        remaining = 0;
                    } else {
                        remaining -= row.quantity;
                        await conn.execute('DELETE FROM inventory WHERE id = ?', [row.id]);
                    }
                }
            }

            if (existing) {
                await conn.execute('UPDATE char_skills SET skill_level=skill_level+1 WHERE id=?', [existing.id]);
            } else {
                await conn.execute('INSERT INTO char_skills (character_id, skill_id, skill_level) VALUES (?,?,2)', [char.id, toolId]);
            }
        });

        const updated = await getFullChar(char.id, req.user.userId);
        res.json(updated);
    } catch(e) { res.status(500).json({ error: '伺服器錯誤' }); }
});

// ✅ 強化裝備 API
router.post('/:id/enhance', async (req, res) => {
    try {
        const { invId, isEquipped } = req.body;
        const char = await queryOne('SELECT id, gold FROM characters WHERE id=? AND user_id=?', [req.params.id, req.user.userId]);
        if (!char) return res.status(404).json({ error: '角色不存在' });

        let itemRow;
        if (isEquipped) {
            itemRow = await queryOne('SELECT * FROM char_equipment WHERE character_id=? AND slot=?', [char.id, invId]);
        } else {
            itemRow = await queryOne('SELECT * FROM inventory WHERE character_id=? AND id=?', [char.id, invId]);
        }
        if (!itemRow) return res.status(400).json({ error: '找不到該裝備' });

        let bonus = JSON.parse(itemRow.stat_bonus || '{}');
        if (!bonus.base) {
            bonus.base = {};
            for(let k in bonus) { if (k !== 'level' && k !== 'base') bonus.base[k] = bonus[k]; }
        }
        const currentLv = bonus.level || 1;

        const toolQuery = await queryOne('SELECT skill_level FROM char_skills WHERE character_id=? AND skill_id=?', [char.id, 'tool_enhance']);
        const toolLv = toolQuery ? toolQuery.skill_level : 1;

        if (currentLv >= 100) return res.status(400).json({ error: '裝備已達滿級 Lv.100！' });
        if (currentLv >= toolLv) return res.status(400).json({ error: `裝備等級(${currentLv})不能超過強化工具等級(${toolLv})！` });

        const goldCost = currentLv * 100;
        const oreCost = Math.ceil(currentLv / 5);

        if (char.gold < goldCost) return res.status(400).json({ error: `金幣不足，需要 ${goldCost}G` });
        const oreItem = await queryOne('SELECT id, quantity FROM inventory WHERE character_id=? AND item_name=?', [char.id, '魔晶礦石']);
        if (!oreItem || oreItem.quantity < oreCost) return res.status(400).json({ error: `魔晶礦石不足，需要 ${oreCost} 個` });

        await transaction(async (conn) => {
            await conn.execute('UPDATE characters SET gold=gold-? WHERE id=?', [goldCost, char.id]);
            if (oreItem.quantity > oreCost) {
                await conn.execute('UPDATE inventory SET quantity=quantity-? WHERE id=?', [oreCost, oreItem.id]);
            } else {
                await conn.execute('DELETE FROM inventory WHERE id=?', [oreItem.id]);
            }

            const newLv = currentLv + 1;
            for(let k in bonus.base) {
                bonus[k] = Math.floor(bonus.base[k] * (1 + (newLv - 1) * 0.1));
            }
            bonus.level = newLv;

            if (isEquipped) {
                await conn.execute('UPDATE char_equipment SET stat_bonus=? WHERE id=?', [JSON.stringify(bonus), itemRow.id]);
            } else {
                await conn.execute('UPDATE inventory SET stat_bonus=? WHERE id=?', [JSON.stringify(bonus), itemRow.id]);
            }
        });

        const updated = await getFullChar(char.id, req.user.userId);
        res.json(updated);
    } catch(e) { res.status(500).json({ error: '伺服器錯誤' }); }
});


// ✅ 新增：採集獲得物品 API (負責將採集到的材料存入資料庫)
router.post('/:id/gather', async (req, res) => {
  try {
    const { xp, gold, item } = req.body;
    const char = await queryOne('SELECT * FROM characters WHERE id=? AND user_id=?', [req.params.id, req.user.userId]);
    if (!char) return res.status(404).json({ error: '角色不存在' });

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
      if (item) {
        const itemId = 'mat_' + item.replace(/\s/g, '_');
        await conn.execute(`INSERT INTO inventory (character_id, item_id, item_name, item_type, rarity, stat_bonus, quantity) VALUES (?,?,?,?,?,?,1) ON DUPLICATE KEY UPDATE quantity=quantity+1`, [char.id, itemId, item, 'material', 'common', '{}']);
      }
    });

    const updated = await getFullChar(char.id, req.user.userId);
    res.json({ character: updated, leveledUp });
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
      '史萊姆核心':  { type:'material', rarity:'common' }, '哥布林耳環':  { type:'material', rarity:'common' },
      '蝙蝠翅膀':    { type:'material', rarity:'common' }, '狼牙':        { type:'material', rarity:'common' },
      '古樹之心':    { type:'material', rarity:'rare'   }, '洞窟結晶':    { type:'material', rarity:'common' },
      '蜘蛛絲':      { type:'material', rarity:'common' }, '枯骨':        { type:'material', rarity:'common' },
      '石魔之核':    { type:'material', rarity:'rare'   }, '龍鱗':        { type:'material', rarity:'epic' },
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

function getStarterGear(job) {
  const common = [
    { slot:'head', itemId:'cloth_cap', name:'布帽', rarity:'common', bonus:{DEF:1} },
    { slot:'foot', itemId:'old_boots', name:'舊靴子', rarity:'common', bonus:{AGI:1} }
  ];
  const map = {
    mage:    [{ slot:'weapon', itemId:'staff_wood', name:'木製法杖', rarity:'common', bonus:{INT:2} }],
    warrior: [{ slot:'weapon', itemId:'sword_iron', name:'鏽鐵劍', rarity:'common', bonus:{STR:2} }],
    rogue:   [{ slot:'weapon', itemId:'dagger_rusty', name:'鏽匕首', rarity:'common', bonus:{AGI:2} }],
    priest:  [{ slot:'weapon', itemId:'scepter_holy', name:'聖光法杖', rarity:'common', bonus:{WIS:2} }],
  };
  return [...common, ...(map[job] || [])];
}

module.exports = router;
