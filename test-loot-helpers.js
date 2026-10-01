const assert=require('node:assert/strict');
function collectRoom(g){for(const e of [...g.availableLoot]){g.position={...e.position};if(g.canTakeLoot(e))assert.ok(g.takeLoot(e.uid));}}
function takeWeaponAt(g,id){const e=g.roomLoot.find(e=>e.id===id);assert.ok(e,'Yerde silah olmalı: '+id);g.position={...e.position};return g.takeWeapon(id,e.uid);}
module.exports={collectRoom,takeWeaponAt};
