const assert=require('node:assert/strict');
const {DungeonExplorer}=require('./game-engine');
const map=require('./dungeon_map.json'),rules=require('./game_rules.json');
const g=new DungeonExplorer(map,rules,'Rogue','Kaşif',{bestiary:require('./bestiary.json'),loot:require('./loot.json')});
assert.equal(g.inspected.size,0);
const letter=g.roomLoot.find(e=>g.items.get(e.id).type==='reading');
assert.ok(letter);g.position={...letter.position};
assert.ok(g.visibleLoot.includes(letter));assert.ok(g.takeLoot(letter.uid));
assert.equal(g.inventory[letter.id],1);assert.ok(g.items.get(letter.id).text.length>50);assert.ok(g.canUseItem(letter.id));
g.roomId='hall';g.position={x:25,y:26};g.facing=0;
for(const dir of [3,1,0,2]){const before={...g.position};g.navigate(dir);assert.equal(g.facing,dir);assert.deepEqual(g.position,before);g.navigate(dir);assert.notDeepEqual(g.position,before);}
const ui=require('node:fs').readFileSync('game-ui.js','utf8');
assert.ok(ui.includes("querySelectorAll('[data-enter-door]')"));
assert.ok(!ui.includes("actionButton('inspect'"));
console.log('Passed: visible loot without inspection, collectible readable letters, absolute WASD turn-then-move, clickable map doors.');
