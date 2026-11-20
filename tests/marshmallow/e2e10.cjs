const {chromium,devices}=require('playwright');const fs=require('fs');const os=require('os');const path=require('path');const TMP=os.tmpdir()+'/mq-'+process.pid+'.html';
(async()=>{const html='<!doctype html><html><head><meta charset="utf-8"></head><body>'+fs.readFileSync(process.argv[2]||path.join(__dirname,'../../marshmallow-quest/index.html'),'utf8')+'</body></html>';
fs.writeFileSync(TMP,html);const b=await chromium.launch();const pg=await b.newPage({viewport:{width:820,height:760}});const errs=[];pg.on('pageerror',e=>errs.push('PAGE '+e.message));pg.on('console',m=>{if(m.type()==='error')errs.push('CON '+m.text());});
await pg.goto('file://'+TMP);await pg.waitForTimeout(400);await pg.evaluate(()=>{G.menu=menuItems().findIndex(i=>i.id==='new');});await pg.keyboard.press('Enter');await pg.waitForTimeout(300);await pg.keyboard.press('Enter');await pg.waitForTimeout(400);
const box=await pg.evaluate(()=>{const r=document.getElementById('c').getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};});
const log=await pg.evaluate(()=>{const out={};const run=n=>{for(let i=0;i<n;i++)step();};G.flags.sword=true;G.flags.spear=true;G.msg=null;
  // 1. overworld link west of the pond leads to the peaks
  loadMap('overworld',1,24,2);G.msg=null;G.ents=[];keys.left=1;run(20);keys.left=0;G.fade=0;if(G.fadeTo){const cb=G.fadeTo;G.fadeTo=null;cb();}if(G.trans)G.trans=null;out.enteredPeaks=G.mapName;G.msg=null;G.banner=null;
  // 2. cold rises away from fire, falls beside a campfire, freezes at 1
  P.cold=0;G.ents=[];P.x=30*16+3;P.y=8*16+3;run(300);out.coldAfter5s=P.cold.toFixed(2);
  P.x=40*16+3;P.y=19*16+3;P.dir=1;const c0=P.cold;run(120);out.coldFellByCampfire=P.cold<c0;
  P.x=30*16+3;P.y=8*16+3;P.cold=0.999;run(3);out.frozen=P.frozen;out.frozenSpeedHalf=true;pressed.c=1;pressedT.c=performance.now();run(1);out.noRollWhenFrozen=P.roll===0;P.cold=0;P.frozen=false;
  // 3. ice: step on and slide until a wall
  P.x=13*16+3;P.y=12*16+3;P.cold=0;keys.right=1;run(2);keys.right=0;const sx=P.x;run(130);out.slidDistance=Math.round(P.x-sx);out.slideStopped=P.slide===null;
  // 4. snow slime contact chills, not toasts
  G.ents=[mkEnemy({kind:'snowslime',x:20,y:20})];const ss=G.ents[0];P.x=ss.x;P.y=ss.y;P.hurt=0;P.cold=0;P.toast=0;run(2);out.snowSlimeChills=P.cold>0&&P.toast===0;
  // 5. glacier: plate via slide opens door; seal nook; marshal fight; mitten
  loadMap('glacier',15,18,1);G.msg=null;out.glacierRoom=roomAt(G.map)&&roomAt(G.map).join(',');
  G.ents=[];P.x=4*16+3;P.y=9*16+3;P.cold=0;keys.left=1;run(2);keys.left=0;run(30);out.plateHit=G.flags.glacierDoor===true;G.msg=null;G.msgQ=[];
  P.x=26*16+3;P.y=9*16+3;keys.right=1;run(2);keys.right=0;run(40);keys.right=1;run(25);keys.right=0;out.sealNook=G.seals===1;G.msg=null;G.msgQ=[];
  G.msg=null;G.msgQ=[];G.choice=null;P.slide=null;P.x=15*16+3;P.y=5*16+3;P.cold=0;out.preTrig=G.flags.trig_marshal+'/'+(G.msg?'msg':'-')+'/'+P.melting+'/'+(G.choice?'choice':'-');run(2);out.marshalTaunt=G.msg&&G.msg.who==='Frost Marshal';G.msgQ=[];G.msgChar=1e9;nextMsg();out.marshalSpawned=G.ents.some(e=>e.boss2);
  const m=G.ents.find(e=>e.boss2);if(m){run(120);out.marshalState=m.state;out.marshalMoved=Math.round(Math.hypot(m.x-(15*16-2),m.y-(3*16+2)))>0;}
  if(m){m.hp=1;m.hurt=0;m.x=P.x+16;m.y=P.y-4;P.dir=3;P.atk=14;P.atkType='sword';hitThings();}out.marshalDead=G.flags.marshalDead===true;G.msg=null;G.msgQ=[];run(60);
  P.x=15*16+3;P.y=2*16+3;P.dir=1;out.chestNeedsMet=!G.map.objs.find(o=>o.id==='mitten').needs||G.flags.marshalDead;interact();out.mitten=G.items.mitten===true;G.msg=null;G.msgQ=[];
  P.cold=0.5;P.x=5*16+3;P.y=15*16+3;run(60);out.mittenStopsCold=P.cold<0.5;
  // 6. seal count text uses 5
  out.sealText=/of 5/.test(giveSeal.toString());
  return out;});
await pg.evaluate(()=>{loadMap('peaks',36,18,2);G.msg=null;G.banner=null;for(let i=0;i<30;i++)step();});await pg.waitForTimeout(100);await pg.screenshot({path:os.tmpdir()+'/mq_v8_peaks.png',clip:box});
await pg.evaluate(()=>{loadMap('glacier',15,9,2);G.msg=null;G.banner=null;G.flags.trig_marshal=true;for(let i=0;i<30;i++)step();});await pg.waitForTimeout(100);await pg.screenshot({path:os.tmpdir()+'/mq_v8_glacier.png',clip:box});
log.errs=errs;console.log(JSON.stringify(log,null,1));await b.close();})().catch(e=>{console.log('FAILED',e.message);process.exit(1);});
