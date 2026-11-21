const {chromium,devices}=require('playwright');const fs=require('fs');const os=require('os');const path=require('path');const TMP=os.tmpdir()+'/mq-'+process.pid+'.html';
(async()=>{const html='<!doctype html><html><head><meta charset="utf-8"></head><body>'+fs.readFileSync(process.argv[2]||path.join(__dirname,'../../marshmallow-quest/index.html'),'utf8')+'</body></html>';
fs.writeFileSync(TMP,html);const b=await chromium.launch();const pg=await b.newPage({viewport:{width:820,height:760}});const errs=[];pg.on('pageerror',e=>errs.push('PAGE '+e.message));pg.on('console',m=>{if(m.type()==='error')errs.push('CON '+m.text());});
await pg.goto('file://'+TMP);await pg.waitForTimeout(400);await pg.evaluate(()=>{G.menu=menuItems().findIndex(i=>i.id==='new');});await pg.keyboard.press('Enter');await pg.waitForTimeout(300);await pg.keyboard.press('Enter');await pg.waitForTimeout(400);
const box=await pg.evaluate(()=>{const r=document.getElementById('c').getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};});
const log=await pg.evaluate(()=>{const out={};const run=n=>{for(let i=0;i<n;i++)step();};const press=k=>{pressed[k]=1;pressedT[k]=performance.now();};G.flags.sword=true;G.flags.spear=true;G.msg=null;
  // 1. quest log entries and statuses
  loadMap('overworld',24,52,1);G.msg=null;G.q.donut=1;G.q.sprinkle=3;G.seals=2;const q=questList();out.questCount=q.length;out.donutActive=q.find(x=>x.id==='donut').status==='active';out.sprinkleDone=q.find(x=>x.id==='sprinkle').status==='done';out.gauntletHidden=!q.some(x=>x.id==='gauntlet');
  press('start');run(1);press('right');run(1);out.questTab=G.pauseTab==='quests';render();press('left');run(1);out.backToMap=G.pauseTab==='map';G.paused=false;
  // 2. light budget caps the pass
  loadMap('castle',19,8,1);G.msg=null;G.flags.taunt=true;G.flags.trig_taunt=true;for(let i=0;i<40;i++)G.ents.push(mkEnemy({kind:'ember',x:15+(i%10),y:4+(i%5)}));render();out.lightsRaw=lights.length;out.lightsCapped=budgetLights().length;
  // 3. cooled keep after the boss
  G.ents=[];G.flags.bossDead=true;G.freed={fluff:1,mallo:1,squish:1,dot:1,bibi:1,king:1};loadMap('castle',19,29,1);G.msg=null;
  out.cooledNoEnemies=G.ents.length===0;out.torchesOut=G.map.objs.filter(o=>o.type==='torch').every(o=>o.out);out.lavaCrusted=G.frozen['10,15']>1000;out.buddiesVisible=G.map.objs.filter(o=>o.type==='npc'&&o.req==='bossDead').every(npcVisible);out.cooledMusic=audio.music.track;
  G.flags.bossDead=false;G.freed={};loadMap('castle',19,29,1);G.msg=null;out.hotAgain=G.ents.length>0&&!G.map.objs.find(o=>o.type==='torch').out;
  // 4. cornered block resets after 3 seconds
  loadMap('castle',29,25,3);G.msg=null;G.ents=[];const bl=G.map.objs.find(o=>o.type==='block');bl.x=37;bl.y=27;refreshSolids();P.x=30*16+3;P.y=23*16+3;run(200);out.blockReset=bl.x===bl.ox&&bl.y===bl.oy;out.resetBanner=G.banner&&G.banner.title==='BLOCK';
  bl.x=34;bl.y=26;refreshSolids();G.flags.eastDoor=true;run(200);out.plateBlockStays=bl.x===34&&bl.y===26;
  return out;});
await pg.evaluate(()=>{G.flags.bossDead=false;G.flags.eastDoor=false;loadMap('overworld',24,52,1);G.msg=null;G.q.donut=1;G.q.sprinkle=1;G.seals=1;G.paused=true;G.pauseTab='quests';});await pg.waitForTimeout(100);await pg.screenshot({path:os.tmpdir()+'/mq_v10_quests.png',clip:box});
await pg.evaluate(()=>{G.pauseTab='map';});await pg.waitForTimeout(100);await pg.screenshot({path:os.tmpdir()+'/mq_v10_map.png',clip:box});
log.errs=errs;console.log(JSON.stringify(log,null,1));await b.close();})().catch(e=>{console.log('FAILED',e.message);process.exit(1);});
