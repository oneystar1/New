const {chromium,devices}=require('playwright');const fs=require('fs');const os=require('os');const path=require('path');const TMP=os.tmpdir()+'/mq-'+process.pid+'.html';
(async()=>{const html='<!doctype html><html><head><meta charset="utf-8"></head><body>'+fs.readFileSync(process.argv[2]||path.join(__dirname,'../../marshmallow-quest/index.html'),'utf8')+'</body></html>';
fs.writeFileSync(TMP,html);const b=await chromium.launch();const pg=await b.newPage({viewport:{width:820,height:760}});const errs=[];pg.on('pageerror',e=>errs.push('PAGE '+e.message));pg.on('console',m=>{if(m.type()==='error')errs.push('CON '+m.text());});
await pg.goto('file://'+TMP);await pg.waitForTimeout(400);await pg.evaluate(()=>{G.menu=menuItems().findIndex(i=>i.id==='new');});await pg.keyboard.press('Enter');await pg.waitForTimeout(300);await pg.keyboard.press('Enter');await pg.waitForTimeout(400);
const box=await pg.evaluate(()=>{const r=document.getElementById('c').getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};});
const log=await pg.evaluate(()=>{const out={};const run=n=>{for(let i=0;i<n;i++)step();};G.flags.sword=true;G.flags.spear=true;G.msg=null;
  // 1. east link to the coast and back
  loadMap('overworld',46,30,3);G.msg=null;G.ents=[];keys.right=1;run(20);keys.right=0;G.fade=0;if(G.fadeTo){const cb=G.fadeTo;G.fadeTo=null;cb();}G.trans=null;out.enteredCoast=G.mapName;G.msg=null;
  // 2. tides: low tide pools walkable, high tide solid; caught in a pool at the turn -> hopped out and soggy
  G.dayT=14400*0.05;G.lastTide=tideHigh();refreshSolids();out.lowTide=!tideHigh();out.poolWalkableLow=!solidAt(22*16+8,14*16+8);
  P.x=23*16+3;P.y=14*16+3;G.dayT=14400*0.2;run(2);out.highTide=tideHigh();out.poolSolidHigh=solidAt(22*16+8,14*16+8);out.hoppedOut=!!P.hop||!hitsWall(P.x,P.y,P.w,P.h);out.soggyAfterTide=P.soggy>0;out.tideBanner=G.banner&&G.banner.title==='TIDE';
  run(30);G.dayT=14400*0.05;run(2);out.backToLow=!tideHigh()&&!solidAt(22*16+8,14*16+8);
  // 3. crab pinches sideways; jelly floats; seal on the islet at low tide
  G.ents=[mkEnemy({kind:'crab',x:10,y:14})];const c=G.ents[0];P.x=14*16+3;P.y=14*16+3;P.hurt=1e9;run(120);out.crabState=c.state;out.crabFaces=c.face;
  G.ents=[];P.hurt=0;P.x=24*16+3;P.y=23*16+3;refreshSolids();keys.right=1;run(30);keys.right=0;out.seal6=G.seals===1;G.msg=null;G.msgQ=[];
  // 4. wreck: crate onto the plate opens the cabin; kraken fight: immune submerged, hittable surfaced, tentacles, compass
  loadMap('wreck',15,18,1);G.msg=null;G.dayT=14400*0.05;G.lastTide=false;refreshSolids();out.wreckRoom=roomAt(G.map)&&roomAt(G.map).join(',');
  G.ents=[];const bl=G.map.objs.find(o=>o.type==='block');bl.x=23;bl.y=12;refreshSolids();P.x=22*16+3;P.y=12*16+3;P.dir=3;keys.right=1;run(40);keys.right=0;out.wreckDoor=G.flags.wreckDoor===true;G.msg=null;G.msgQ=[];
  G.ents=[];P.x=15*16+3;P.y=7*16+3;run(2);out.krakenTaunt=G.msg&&G.msg.who==='Kraken';G.msgQ=[];G.msgChar=1e9;nextMsg();const k=G.ents.find(e=>e.boss3);out.krakenSpawned=!!k;
  if(k){k.sub=true;const hp0=k.hp;P.x=k.x-14;P.y=k.y+4;P.dir=3;P.atk=14;P.atkType='sword';hitThings();out.immuneSubmerged=k.hp===hp0;k.sub=false;k.hurt=0;P.atk=14;P.atkType='sword';hitThings();out.hurtSurfaced=k.hp<hp0;
    k.hurt=0;G.hitstop=0;P.x=10*16+3;P.y=6*16+3;k.sub=true;k.phase=9;run(3);out.tentacles=G.ents.filter(e=>e.tent).length;G.ents=G.ents.filter(e=>!e.tent);k.hurt=0;G.hitstop=0;k.sub=false;k.phase=29;P.hurt=0;run(3);out.inkShots=G.shots.filter(s=>s.ink).length;G.shots=[];
    k.hp=1;k.hurt=0;k.sub=false;P.hurt=1e9;P.x=k.x-14;P.y=k.y+4;P.dir=3;P.atk=14;P.atkType='sword';hitThings();out.krakenDead=G.flags.krakenDead===true;G.msg=null;G.msgQ=[];run(60);
    P.x=10*16+3;P.y=3*16+3;P.dir=1;interact();out.compass=G.items.compass===true;G.msg=null;G.msgQ=[];}
  // 5. compass arrow draws in the overworld; easy mode numbers; progress lines; vents
  loadMap('overworld',24,52,1);G.msg=null;G.items.compass=true;render();out.compassCode=/AREA_POS/.test(drawHUD.toString());
  G.diff='easy';out.easyLabel=menuItems().find(i=>i.id==='diff').label;P.dotUsed=false;G.F=null;G.follower=null;P.toast=P.cap;run(1);out.easySave=P.melting===0&&P.toast<P.cap;G.diff='normal';
  G.flags.spear=true;loadMap('house0',6,4,1);G.msg=null;const el=G.map.objs.find(o=>o.type==='npc');el.talked=true;talk(el);out.progressLine=G.msg&&/Granny will be insufferable/.test(G.msg.lines.join(' '));G.msg=null;G.msgQ=[];G.choice=null;
  out.ventOn=/%120\)<70/.test(updateEnemies.toString());
  return out;});
await pg.evaluate(()=>{loadMap('coast',20,14,3);G.msg=null;G.banner=null;G.dayT=14400*0.05;for(let i=0;i<30;i++)step();});await pg.waitForTimeout(100);await pg.screenshot({path:os.tmpdir()+'/mq_v11_coast.png',clip:box});
await pg.evaluate(()=>{loadMap('wreck',15,6,1);G.msg=null;G.banner=null;G.flags.trig_kraken=true;G.ents.push(mkEnemy({kind:'kraken',x:15,y:4}));for(let i=0;i<30;i++)step();});await pg.waitForTimeout(100);await pg.screenshot({path:os.tmpdir()+'/mq_v11_kraken.png',clip:box});
log.errs=errs;console.log(JSON.stringify(log,null,1));await b.close();})().catch(e=>{console.log('FAILED',e.message);process.exit(1);});
