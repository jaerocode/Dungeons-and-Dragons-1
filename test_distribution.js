const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {pathToFileURL,fileURLToPath}=require('node:url');
const read=name=>fs.readFileSync(path.join(__dirname,name),'utf8');
function assetTable(html){const start=html.indexOf('const ASSETS=')+'const ASSETS='.length,end=html.indexOf(';</script>',start);return JSON.parse(html.slice(start,end));}
const portable=read('Mines of Moria.html'),web=read('game.web.html'),css=read('game.css');
const embedded=assetTable(portable),external=assetTable(web);
assert.deepEqual(Object.keys(embedded).sort(),Object.keys(external).sort());
for(const [name,url] of Object.entries(external)){
  assert.ok(url.startsWith('./assets'),'Web assets must resolve relative to the downloaded game');
  const file=fileURLToPath(new URL(url,pathToFileURL(path.join(__dirname,'game.web.html'))));
  const source=fs.readFileSync(file),data=embedded[name];
  assert.ok(data.startsWith('data:image/'),'Standalone game must embed every room and enemy illustration');
  assert.deepEqual(Buffer.from(data.slice(data.indexOf(',')+1),'base64'),source,'Embedded illustration must match the shipped asset: '+name);
}
assert.ok(css.includes('.shell.hit:after'),'Damage overlay must cover the game shell, including combat');
assert.ok(!css.includes('.hit .scene:after'),'Damage overlay must not depend on the hidden room illustration');
for(const html of [portable,web]){assert.ok(html.includes(css));assert.ok(html.includes('if(game.hp<lastHP)'));assert.ok(html.includes('@keyframes impact'));assert.ok(!html.includes('__ASSETS__'));}
async function verifyServer(){
  if(!process.argv.includes('--server'))return;
  const response=await fetch('http://localhost:8080/',{signal:AbortSignal.timeout(5000)});assert.equal(response.status,200);
  const served=assetTable(await response.text());
  for(const [name,url] of Object.entries(served)){
    const image=await fetch(new URL(url,'http://localhost:8080/'),{signal:AbortSignal.timeout(5000)});assert.equal(image.status,200,'Server image missing: '+name);
    assert.match(image.headers.get('content-type'),/^image\//);assert.ok((await image.arrayBuffer()).byteLength>0);
  }
}
verifyServer().then(()=>console.log('Passed: portable relative asset URLs, complete embedded illustrations, full-screen combat hit feedback'+(process.argv.includes('--server')?' and live server assets.':'.'))).catch(error=>{console.error(error);process.exitCode=1;});
