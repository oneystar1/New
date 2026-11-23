const {chromium,devices}=require('playwright');const fs=require('fs');const os=require('os');const path=require('path');const TMP=os.tmpdir()+'/mq-'+process.pid+'.html';
(async()=>{const html='<!doctype html><html><head><meta charset="utf-8"></head><body>'+fs.readFileSync(process.argv[2]||path.join(__dirname,'../../marshmallow-quest/index.html'),'utf8')+'</body></html>';
fs.writeFileSync(TMP,html);const b=await chromium.launch();const pg=await b.newPage({viewport:{width:820,height:760}});const errs=[];pg.on('pageerror',e=>errs.push('PAGE '+e.message));pg.on('console',m=>{if(m.type()==='error')errs.push('CON '+m.text());});
await pg.goto('file://'+TMP);await pg.waitForTimeout(400);await pg.evaluate(()=>{G.menu=menuItems().findIndex(i=>i.id==='new');});await pg.keyboard.press('Enter');await pg.waitForTimeout(300);await pg.keyboard.press('Enter');await pg.waitForTimeout(400);
const box=await pg.evaluate(()=>{const r=document.getElementById('c').getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};});
const log=await pg.evaluate(()=>{const out={};const run=n=>{for(let i=0;i<n;i++)step();};const press=k=>{pressed[k]=1;pressedT[k]=performance.now();};G.flags.sword=true;G.flags.spear=true;G.msg=null;
  // 1. portraits: faced speakers wrap narrower and draw a face; plain tags do not
  loadMap('overworld',24,52,1);G.msg=null;say(['Puff! Thank goodness you are still white and fluffy and round.'],null,'Elder');out.elderWrap24=G.msg.lines.every(l=>l.length<=24);out.elderMood=moodFor(G.msg.lines.join(' '));render();G.msg=null;G.msgQ=[];
  say(['The gate is open.'],null,'GATE');out.gateWrap27=wrap('The gate is open.',27).length===1&&G.msg.who==='GATE';render();G.msg=null;G.msgQ=[];
  // 2. boss cutscene: trigger pans the camera to the boss, shows a card, returns, then the dialog
  G.freed={fluff:1,mallo:1,squish:1,dot:1,bibi:1};G.flags.gate=true;loadMap('castle',19,14,1);G.msg=null;const cam0=Math.round(G.cam.y);P.x=19*16+3;P.y=11*16+3;run(2);out.cutStarted=!!G.cut;out.cardName=G.cut&&G.cut.card.name;
  run(45);out.camPannedUp=Math.round(G.cam.y)<cam0;run(60);out.cardDrawn=/PYRE/.test(G.cut?G.cut.card.name:'');render();
  run(120);out.cutDone=!G.cut;out.tauntAfterCut=G.msg&&G.msg.who==='Pyre Lord';out.camBack=Math.abs(Math.round(G.cam.y)-cam0)<=1;G.msgQ=[];G.msgChar=1e9;nextMsg();G.msgChar=1e9;nextMsg();out.bossSpawned=G.ents.some(e=>e.boss);
  // skip with A
  G.flags.bossDead=false;G.flags.taunt=false;G.flags.trig_taunt=false;G.ents=G.ents.filter(e=>!e.boss);G.msg=null;G.msgQ=[];loadMap('castle',19,14,1);G.msg=null;P.x=19*16+3;P.y=11*16+3;run(2);press('a');run(1);out.cutSkipped=!G.cut&&!!G.msg;G.msg=null;G.msgQ=[];G.msgCb=null;
  // 3. ambient scheduler is safe without an audio context and advances per area
  out.ambientSafe=(()=>{try{audio.ambient();return true;}catch(e){return false;}})();
  // 4. reduced motion: shake capped, no blink skip
  G.opts.flash='reduced';G.shake=8;loadMap('overworld',24,30,0);G.msg=null;G.ents=[];render();out.shakeCapped=G.shake<=1;out.reducedOn=reduced();G.opts.flash='normal';G.shake=8;render();out.shakeNormal=G.shake===8;G.opts.flash='auto';
  // 5. credits skippable after 3 s; intro remembered
  G.scene='ending';G.endT=0;run(200);press('start');run(1);out.creditsSkippedAt200=G.scene==='title';
  out.introSeen=G.opts.introSeen===true;G.hasSave=false;G.menu=menuItems().findIndex(i=>i.id==='new');press('a');run(1);out.introPrompt=G.choice&&/opening/.test(G.choice.title);G.choice=null;
  return out;});
await pg.evaluate(()=>{G.scene='play';G.flags.sword=true;G.flags.spear=true;G.freed={fluff:1,mallo:1,squish:1,dot:1,bibi:1};G.flags.gate=true;G.flags.taunt=false;G.flags.trig_taunt=false;G.flags.bossDead=false;loadMap('castle',19,14,1);G.msg=null;G.banner=null;P.x=19*16+3;P.y=11*16+3;for(let i=0;i<70;i++)step();});await pg.waitForTimeout(100);await pg.screenshot({path:os.tmpdir()+'/mq_v12_card.png',clip:box});
await pg.evaluate(()=>{G.cut=null;loadMap('house0',6,4,1);G.msg=null;G.banner=null;say(['Puff! Thank goodness you are still white. The fire monsters took everyone.'],null,'Elder');G.msgChar=1e9;});await pg.waitForTimeout(100);await pg.screenshot({path:os.tmpdir()+'/mq_v12_portrait.png',clip:box});
log.errs=errs;console.log(JSON.stringify(log,null,1));await b.close();})().catch(e=>{console.log('FAILED',e.message);process.exit(1);});
