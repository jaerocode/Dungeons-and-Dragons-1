const assert=require('node:assert/strict'),{DungeonExplorer}=require('./game-engine');
const map=require('./dungeon_map.json'),rules=require('./game_rules.json'),bestiary=require('./bestiary.json'),loot=require('./loot.json');
for(let i=0;i<50;i++){
 const g=new DungeonExplorer(map,rules,'Rogue','Test',{bestiary,loot,random:()=>i/50});g.roomId='troll_hall';const troll=g.currentEnemies[0],cells=g.enemyCells(troll),[x,y,w,h]=g.room.bounds;
 assert.equal(cells.length,4);assert.equal(new Set(cells.map(p=>p.x+':'+p.y)).size,4);
 for(const p of cells){assert.ok(p.x>=x+1&&p.x<x+w-1&&p.y>=y+1&&p.y<y+h-1);assert.ok(g.walkable(p));assert.equal(g.isDoorPosition(p),false);assert.ok(!g.roomLoot.some(e=>g.distance(e.position,p)===0));}
 g.position={x:troll.position.x+2,y:troll.position.y+1};g.checkEncounter();assert.ok(g.combat,'Proximity uses the far edge of the 2×2 footprint');
 g.combat.phase='player';g.flee(3);assert.equal(g.resultNotice.title,'Kaçışın kesildi!');assert.ok(g.combat);
 g.roomId='guardian';assert.deepEqual(g.currentEnemies.map(e=>e.definition.kind),['barrow_wight']);
}
console.log('Passed: 2×2 troll footprint, wall clearance, no pillars/doors/loot, far-edge proximity, blocked escape and sole Barrow-wight guardian.');
