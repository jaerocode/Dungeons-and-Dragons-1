const assert=require('node:assert/strict'),{DungeonExplorer}=require('./game-engine');
const map=require('./dungeon_map.json'),rules=require('./game_rules.json'),options={fixedSpawns:true,bestiary:require('./bestiary.json'),loot:require('./loot.json')};
for(const cls of ['Fighter','Mage','Rogue']){
 const g=new DungeonExplorer(map,rules,cls,'Test',options);
 for(const room of map.rooms){g.roomId=room.id;for(const entry of g.roomLoot){assert.ok(g.walkable(entry.position));assert.equal(g.isDoorPosition(entry.position),false,room.id+': '+entry.id+' kapıya gelmemeli');}}
 g.roomId='armory';g.position=g.spawnPosition(g.doors()[0]);g.facing=0;g.torchLit=true;
 const staff=g.roomLoot.find(e=>e.id==='rune_staff');staff.position=g.safeLootPosition(g.position);const old=g.equipment.weapon;
 assert.ok(g.canTakeLoot(staff));assert.ok(g.takeWeapon(staff.id,staff.uid,old));const dropped=g.roomLoot.find(e=>e.id===old);
 assert.ok(dropped);assert.equal(g.isDoorPosition(dropped.position),false);assert.ok(g.distance(g.position,dropped.position)<=1);assert.ok(g.goDoor(g.doors()[0].id));assert.equal(g.roomId,'barracks');
}
console.log('Passed: all room loot avoids door blocks; weapon drops from doors land nearby and room exit stays usable for every class.');
