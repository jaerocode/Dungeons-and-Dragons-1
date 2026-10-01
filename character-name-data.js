const fs=require('node:fs');
const source=fs.readFileSync(require('node:path').join(__dirname,'character_generator.py'),'utf8');
// Keep browser suggestions in sync with the Python character generator.
const names=JSON.parse(source.match(/^NAMES = (\{[\s\S]*?\n\})/m)[1]);
const surnames=JSON.parse(source.match(/^SURNAMES = (\[[\s\S]*?\n\])/m)[1]);
module.exports={names:Object.values(names).flatMap(genders=>Object.values(genders).flat()),surnames};
