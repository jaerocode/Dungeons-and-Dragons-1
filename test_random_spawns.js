const assert=require('node:assert/strict'),{DungeonExplorer}=require('./game-engine');
const map=require('./dungeon_map.json'),rules=require('./game_rules.json'),bestiary=require('./bestiary.json'),loot=require('./loot.json');
const spawn=value=>new DungeonExplorer(map,rules,'Fighter','Test',{bestiary,loot,random:()=>value});
const low=spawn(0),high=spawn(.99);assert.notDeepEqual(low.enemies.map(e=>e.position),high.enemies.map(e=>e.position));
for(let i=0;i<30;i++){const g=spawn(i/30);for(const room of map.rooms){g.roomId=room.id;const used=new Set();for(const e of g.currentEnemies){assert.ok(g.walkable(e.position));assert.equal(g.isDoorPosition(e.position),false);const key=JSON.stringify(e.position);assert.ok(!used.has(key));used.add(key);}}}
console.log('Passed: variable enemy spawn positions, valid floor blocks, no door/pillar overlap or shared enemy blocks.');
