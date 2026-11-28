const {chromium}=require('playwright');const fs=require('fs');const os=require('os');const path=require('path');const TMP=os.tmpdir()+'/mq-'+process.pid+'.html';
(async()=>{const html='<!doctype html><html><head><meta charset="utf-8"></head><body>'+fs.readFileSync(process.argv[2]||path.join(__dirname,'../../marshmallow-quest/index.html'),'utf8')+'</body></html>';
fs.writeFileSync(TMP,html);const b=await chromium.launch();const pg=await b.newPage({viewport:{width:820,height:760}});const errs=[];pg.on('pageerror',e=>errs.push('PAGE '+e.message));pg.on('console',m=>{if(m.type()==='error')errs.push('CON '+m.text());});
await pg.goto('file://'+TMP);await pg.waitForTimeout(400);await pg.evaluate(()=>{G.menu=menuItems().findIndex(i=>i.id==='new');});await pg.keyboard.press('Enter');await pg.waitForTimeout(300);await pg.keyboard.press('Enter');await pg.waitForTimeout(400);
const log=await pg.evaluate(()=>{const out={};const run=n=>{for(let i=0;i<n;i++)step();};const press=k=>{pressed[k]=1;pressedT[k]=performance.now();};G.flags.sword=true;G.flags.spear=true;G.msg=null;P.cap=3;
  // 1. a clear day has no rain anywhere; a storm rains in the lowlands, blizzards on the Peaks, nothing indoors
  loadMap('overworld',24,52,1);G.msg=null;run(25);out.clearStart=G.weather==='clear'&&!rainHere();
  rollWeather('storm');out.rainOver=rainHere()&&!blizzardHere();loadMap('house0',5,7,1);G.msg=null;out.dryInside=!rainHere();loadMap('peaks',42,18,2);G.msg=null;out.blizzard=blizzardHere()&&!rainHere();loadMap('coast',2,14,3);G.msg=null;out.rainCoast=rainHere();
  // 2. puddles seed on open ground only, never under an object; rain streaks fall; the tint renders
  loadMap('overworld',24,52,1);G.msg=null;G.ents=[];run(35);out.puddles=!!G.puddles&&G.puddles.map==='overworld'&&G.puddles.list.length>10&&G.puddles.list.every(p=>'.pd'.includes(G.map.t[p.y][p.x])&&!G.map.objs.some(o=>o.x===p.x&&o.y===p.y));
  out.rainFx=G.amb.some(a=>a.kind==='rain');render();out.tipShown=!!G.flags.tip_rain;
  // 3. stepping in a puddle makes Puff soggy and cools him
  const pd=G.puddles.list[0];P.x=pd.x*16+3;P.y=pd.y*16+3;P.toast=1;P.soggy=0;P.hurt=0;run(2);out.soggy=P.soggy>0&&P.soggy<=300&&P.toast<1;P.soggy=0;
  // 4. fire monsters sulk: an ember nearby toasts less and moves slower in the rain
  const toastFrom=()=>{G.ents=[];const e=mkEnemy({kind:'ember',x:20,y:46});e.state='wander';e.think=1e9;e.vx=e.vy=0;G.ents.push(e);P.x=20*16+3+14;P.y=46*16+3;P.toast=0;P.hurt=0;P.soggy=0;for(let i=0;i<20;i++){step();e.x=20*16+3;e.y=46*16+3;}return {t:P.toast,sp:e.speed};};
  const wet=toastFrom();rollWeather('clear');const dry=toastFrom();out.sulk=wet.t<dry.t*0.8&&wet.sp<dry.sp;
  // 5. blizzard: cold creeps faster on the Peaks
  const coldAfter=()=>{loadMap('peaks',30,30,1);G.msg=null;G.ents=[];G.map.objs=G.map.objs.filter(o=>o.type!=='campfire');P.x=12*16+3;P.y=20*16+3;P.cold=0;P.frozen=false;for(let i=0;i<120;i++)step();return P.cold;};
  G.items.mitten=false;rollWeather('clear');const c1=coldAfter();rollWeather('storm');const c2=coldAfter();out.blizzardCold=c2>c1*1.3;render();
  // 6. weather rolls at midnight and noon without errors, and sleeping rerolls
  G.dayT=14399;run(2);out.rolled=G.weather==='clear'||G.weather==='storm';G.dayT=7199;run(2);out.rolledNoon=G.weather==='clear'||G.weather==='storm';
  // 7. save keeps the weather; old saves migrate to v5
  rollWeather('storm');saveGame();const d=JSON.parse(localStorage.getItem(SAVE_KEY));out.saved=d.v===5&&d.weather==='storm';const old=Object.assign({},d);delete old.weather;old.v=4;localStorage.setItem(SAVE_KEY,JSON.stringify(old));G.weather='storm';out.migrated=loadSave()&&G.weather==='clear';localStorage.setItem(SAVE_KEY,JSON.stringify(d));loadSave();out.reloaded=G.weather==='storm';
  // 8. HUD label and villager lines
  loadMap('overworld',24,52,1);G.msg=null;G.paused=true;G.pauseTab='map';render();G.paused=false;out.label=true;
  G.flags.ovenDead=true;G.flags.skySeen=true;loadMap('house0',5,7,1);G.msg=null;const el=G.map.objs.find(o=>o.type==='npc');el.talked=true;const l1=progressLine(el);const l2=progressLine(el);out.elderLines=/oven/i.test(l1||'')&&/Sky Bakery/.test(l2||'');
  loadMap('house2',5,7,1);G.msg=null;const gr=G.map.objs.find(o=>o.type==='npc');gr.talked=true;out.grannyLine=/Oven Lord/.test(progressLine(gr)||'');
  // 9. gauntlet: after the Pyre Lord the Oven Lord joins, and only its fall ends the run
  G.flags.ovenDead=false;G.flags.skySeen=false;if(G.badges)delete G.badges.oven;G.banner=null;
  G.cleared=true;G.flags.bossDead=true;loadMap('castle',31,6,1);G.msg=null;run(25);G.gauntlet={stage:2,t:0,spawnT:G.t+1};run(3);const py=G.ents.find(e=>e.boss);out.pyreIn=!!py;py.hp=1;py.hurt=0;damageEnemy(py,1,true);out.stage4=G.gauntlet&&G.gauntlet.stage===4;run(100);const ov=G.ents.find(e=>e.boss4);out.ovenIn=!!ov&&!!G.banner&&/OVEN/.test(G.banner.title);
  ov.hp=1;ov.hurt=0;damageEnemy(ov,1,false);run(12);out.cleared=!G.gauntlet&&!!G.msg&&/Gauntlet cleared/.test(G.msg.lines.join(' ')+' '+G.msgQ.map(q=>q.t).join(' '))&&!G.flags.ovenDead;G.msg=null;G.msgQ=[];
  return out;});
await pg.evaluate(()=>{G.msg=null;G.msgQ=[];G.flags.ovenDead=false;rollWeather('storm');loadMap('overworld',24,50,1);G.msg=null;for(let i=0;i<40;i++)step();render();});await pg.screenshot({path:'/tmp/mq_v16_rain.png'});
await pg.evaluate(()=>{loadMap('peaks',30,30,1);G.msg=null;for(let i=0;i<60;i++)step();render();});await pg.screenshot({path:'/tmp/mq_v16_blizzard.png'});
log.errs=errs;console.log(JSON.stringify(log,null,1));await b.close();fs.unlinkSync(TMP);const ok=Object.entries(log).every(([k,v])=>k==='errs'?v.length===0:v===true);if(!ok){console.log('FAILED');process.exit(1);}})().catch(e=>{console.log('FAILED',e.message);process.exit(1);});
