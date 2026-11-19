const {chromium,devices}=require('playwright');const fs=require('fs');const os=require('os');const path=require('path');const TMP=os.tmpdir()+'/mq-'+process.pid+'.html';
(async()=>{
const html='<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>'+fs.readFileSync(process.argv[2]||path.join(__dirname,'../../marshmallow-quest/index.html'),'utf8')+'</body></html>';
fs.writeFileSync(TMP,html);const b=await chromium.launch();const pg=await b.newPage({viewport:{width:820,height:760}});const errs=[];pg.on('pageerror',e=>errs.push('PAGE '+e.message));pg.on('console',m=>{if(m.type()==='error')errs.push('CON '+m.text());});
await pg.goto('file://'+TMP);await pg.waitForTimeout(400);
const log=await pg.evaluate(()=>{const out={};const run=n=>{for(let i=0;i<n;i++)step();};const press=k=>{pressed[k]=1;pressedT[k]=performance.now();};
  // title: erase save with confirm, new game warning
  try{localStorage.setItem(SAVE_KEY,JSON.stringify({flags:{sword:true},freed:{},opened:{},q:{},taken:{},lastHome:{map:'home',x:5,y:7},map:'home',tx:5,ty:7}));}catch(e){}checkSave();loadOpts();
  out.eraseInMenu=menuItems().some(i=>i.id==='erase');G.menu=menuItems().findIndex(i=>i.id==='erase');press('a');run(1);out.eraseChoice=G.choice&&G.choice.opts.join('/');G.choice.idx=1;press('a');run(1);out.saveGoneAfterErase=!G.hasSave&&!localStorage.getItem(SAVE_KEY);
  try{localStorage.setItem(SAVE_KEY,JSON.stringify({flags:{},freed:{},opened:{},q:{},taken:{},lastHome:{map:'home',x:5,y:7},map:'home',tx:5,ty:7}));}catch(e){}checkSave();G.menu=menuItems().findIndex(i=>i.id==='new');press('a');run(1);out.newGameWarns=G.choice&&/replaced/.test(G.choice.title);G.choice.idx=1;press('a');run(1);out.introAfterConfirm=G.scene==='intro';
  // start playing
  newGame();G.flags.sword=true;G.flags.spear=true;G.msg=null;
  // prompt bubble appears facing a sign and a chest, not facing grass
  loadMap('overworld',11,51,1);G.msg=null;run(1);out.promptNearSign=!!P.prompt;loadMap('overworld',24,30,0);G.msg=null;G.ents=[];run(1);out.noPromptOnGrass=!P.prompt;
  loadMap('cave',26,13,1);G.msg=null;G.flags.toadDead=true;G.flags.trig_toad=true;run(1);out.promptAtChest=!!P.prompt;
  loadMap('castle',29,25,3);G.msg=null;G.ents=[];run(1);out.pushPromptAtBlock=P.prompt&&P.prompt.push===true;
  // enemy facing follows movement
  loadMap('castle',20,15,1);G.msg=null;G.ents=[mkEnemy({kind:'knight',x:26,y:15})];const k=G.ents[0];P.x=22*16;run(60);out.knightFacesPuffOnLeft=k.face===-1;P.x=30*16;run(60);out.knightFacesPuffOnRight=k.face===1;
  return out;});
// scaling snaps to whole device pixels on a 3x phone
const ph=await b.newPage({...devices['iPhone 13'],deviceScaleFactor:3});await ph.goto('file://'+TMP);await ph.waitForTimeout(300);await ph.tap('#c');await ph.waitForTimeout(200);
log.devicePxPerGamePx=await ph.evaluate(()=>+(document.getElementById('c').clientWidth/256*devicePixelRatio).toFixed(3));
log.errs=errs;console.log(JSON.stringify(log,null,1));await b.close();

})().catch(e=>{console.log("FAILED",e.message);process.exit(1);});
