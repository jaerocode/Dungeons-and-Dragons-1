const assert=require('node:assert/strict');
const {DungeonExplorer}=require('./game-engine');
const map=require('./dungeon_map.json'),rules=require('./game_rules.json'),loot=require('./loot.json'),bestiary=require('./bestiary.json');
for(const cls of ['Fighter','Mage','Rogue']){
  const game=new DungeonExplorer(map,rules,cls,'Kaşif',{loot,bestiary});
  assert.equal(game.inventory.old_map,undefined);
  const entry=game.nearbyLoot.find(e=>e.id==='old_map');
  assert.ok(entry,'Harita ilk odada hemen alınabilmeli');
  assert.ok(game.takeLoot(entry.uid));
  assert.equal(game.inventory.old_map,1);
  assert.equal(game.takeLoot(entry.uid),false,'Aynı harita tekrar alınamaz');
  game.goDoor(game.doors()[0].id);
  assert.equal(game.inventory.old_map,1,'Harita odalar arasında taşınmalı');
  const turn=game.turn,weapon=game.equipment.weapon;
  assert.ok(game.canUseItem('old_map'));game.useItem('old_map');
  assert.equal(game.turn,turn);assert.equal(game.equipment.weapon,weapon);assert.equal(game.inventory.old_map,1);
}
console.log('Passed: all classes collect and carry the map; no duplicate pickup, consumption, weapon swap or turn cost.');
