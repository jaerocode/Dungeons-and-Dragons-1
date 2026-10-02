const assert=require('node:assert/strict');
function collectRoom(g){g.inspect();for(const e of [...g.availableLoot]){g.position={...e.position};if(g.canTakeLoot(e))assert.ok(g.takeLoot(e.uid));}}
function takeWeaponAt(g,id){const e=g.roomLoot.find(e=>e.id===id);assert.ok(e,'Yerde silah olmalı: '+id);g.position={...e.position};g.inspect();return g.takeWeapon(id,e.uid);}
function winCombat(g){let turns=0;while(g.combat){assert.ok(!g.dead&&turns++<60,'Karşılaşma tamamlanabilmeli');if(g.combat.phase==='enemy')g.enemyTurn();else if(!g.prepared)g.prepare();else if(g.combat.ap<g.attackCost)g.endTurn();else g.attack();}assert.ok(!g.dead);}
module.exports={collectRoom,takeWeaponAt,winCombat};
