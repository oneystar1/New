const {chromium}=require('playwright');const fs=require('fs');const os=require('os');const path=require('path');const TMP=os.tmpdir()+'/mq-'+process.pid+'.html';
(async()=>{const html='<!doctype html><html><head><meta charset="utf-8"></head><body>'+fs.readFileSync(process.argv[2]||path.join(__dirname,'../../marshmallow-quest/index.html'),'utf8')+'</body></html>';
fs.writeFileSync(TMP,html);const b=await chromium.launch();const pg=await b.newPage({viewport:{width:820,height:760}});const errs=[];pg.on('pageerror',e=>errs.push('PAGE '+e.message));pg.on('console',m=>{if(m.type()==='error')errs.push('CON '+m.text());});
await pg.goto('file://'+TMP);await pg.waitForTimeout(400);await pg.evaluate(()=>{G.menu=menuItems().findIndex(i=>i.id==='new');});await pg.keyboard.press('Enter');await pg.waitForTimeout(300);await pg.keyboard.press('Enter');await pg.waitForTimeout(400);
const log=await pg.evaluate(()=>{const out={};const run=n=>{for(let i=0;i<n;i++)step();};const press=k=>{pressed[k]=1;pressedT[k]=performance.now();};G.flags.sword=true;G.flags.spear=true;G.items.swordLv=3;G.msg=null;P.cap=3;
  // 1. the oven door asks, then opens into the arena with a checkpoint
  G.items.mitten=true;loadMap('sky',22,4,1);G.msg=null;run(25);P.x=22*16+3;P.y=4*16+3;P.dir=1;interact();out.doorAsks=!!G.choice&&/Open/.test(JSON.stringify(G.choice));
  const cb=G.choice.cb;G.choice=null;cb(0);run(40);out.inOven=G.mapName==='oven';out.checkpoint=G.checkpoint&&G.checkpoint.map==='oven';out.hotArena=G.map.heat===1.0;
  // 2. walking up fires the intro; A skips it; the boss spawns after the taunt
  P.x=9*16+3;P.y=9*16+3;run(2);out.cut=!!G.cut&&G.cut.card.name==='OVEN LORD';press('a');run(1);out.taunt=!!G.msg&&G.msg.who==='Oven Lord';for(let i=0;i<8&&G.msg;i++){G.msgChar=1e9;nextMsg();}
  const bo=G.ents.find(e=>e.boss4);out.spawned=!!bo&&G.flags.bossFight===true&&audio.music.track==='boss';
  // 3. bake sprays cinders; stomp lays a burning line and shakes a crumb loose
  P.x=9*16+3;P.y=11*16+3;P.hurt=0;bo.state='bake';bo.st=19;const sh0=G.shots.length;run(40);out.cinders=G.shots.length>sh0;
  bo.state='stomp';bo.st=59;bo.x=9*16;bo.y=5*16;run(2);out.trail=G.patches.length>5;out.crumb=G.ents.some(e=>e.kind==='crumb');
  // 4. phase two tints the screen and lays coil rows; the health bar renders
  bo.hp=Math.ceil(bo.maxhp/2);bo.state='wander';bo.st=0;bo.phase=149;G.patches=[];run(2);out.phase2=G.bossPhase===2&&G.patches.length>5;render();
  // 5. kill: flag, music back, chest opens, Oven Mitt halves lava heat and grows the meter
  G.patches=[];for(const e of G.ents)if(e.kind==='crumb')e.gone=true;G.ents=G.ents.filter(e=>!e.gone);bo.hp=1;bo.hurt=0;damageEnemy(bo,1,false);out.dead=G.flags.ovenDead===true&&G.flags.bossFight===false&&G.map.heat===0.3;
  G.msg=null;G.msgQ=[];run(60);const cap0=P.cap;P.x=9*16+3;P.y=2*16+3;P.dir=1;interact();out.mitt=G.items.mitt===true&&P.cap>cap0&&!!G.opened.mitt;G.msg=null;G.msgQ=[];
  // lava heat with and without the mitt
  const lavaHeat=()=>{P.x=2*16+3;P.y=6*16+3;P.toast=0;P.hurt=0;P.soggy=0;for(let i=0;i<30;i++)step();return P.toast;};G.ents=[];G.items.mitt=false;const h1=lavaHeat();G.items.mitt=true;const h2=lavaHeat();out.mittHalves=h2>0&&h2<h1*0.7;
  // 6. re-entry: dead boss stays dead, the door offers to go in, badge and quest flip
  loadMap('oven',9,12,1);G.msg=null;run(25);P.x=9*16+3;P.y=9*16+3;run(2);out.staysDead=!G.cut&&!G.ents.some(e=>e.boss4);
  checkBadges();out.badge=!!(G.badges&&G.badges.oven)||BADGES.find(b=>b.id==='oven').cond();out.quest=questList().some(q=>q.id==='sky'&&q.status==='done');
  // 7. a live boss comes back on re-entry with a banner instead of a cutscene
  G.flags.ovenDead=false;G.flags.ovenMet=true;G.opened.mitt=false;loadMap('oven',9,12,1);G.msg=null;run(25);P.x=9*16+3;P.y=9*16+3;run(2);out.respawn=!G.cut&&G.ents.some(e=>e.boss4)&&!!G.banner&&/OVEN/.test(G.banner.title);
  out.melt=(()=>{P.toast=P.cap;P.melting=1;step();return true;})();
  return out;});
await pg.evaluate(()=>{G.msg=null;G.msgQ=[];G.choice=null;G.fade=0;G.fadeTo=0;loadMap('oven',9,12,1);G.msg=null;for(let i=0;i<25;i++)step();G.flags.ovenDead=false;const e=G.map.enemies.find(x=>x.kind==='ovenlord');G.ents.push(mkEnemy(e));G.flags.bossFight=true;const bo=G.ents.find(x=>x.boss4);bo.state='bake';bo.st=30;bo.hp=bo.maxhp-3;P.x=9*16+3;P.y=10*16+3;for(let i=0;i<12;i++)step();render();});await pg.screenshot({path:'/tmp/mq_v15_oven.png'});
log.errs=errs;console.log(JSON.stringify(log,null,1));await b.close();fs.unlinkSync(TMP);const ok=Object.entries(log).every(([k,v])=>k==='errs'?v.length===0:v===true);if(!ok){console.log('FAILED');process.exit(1);}})().catch(e=>{console.log('FAILED',e.message);process.exit(1);});
