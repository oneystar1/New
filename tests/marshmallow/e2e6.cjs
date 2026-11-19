const {chromium,devices}=require('playwright');const fs=require('fs');const os=require('os');const path=require('path');const TMP=os.tmpdir()+'/mq-'+process.pid+'.html';
(async()=>{const html='<!doctype html><html><head><meta charset="utf-8"></head><body>'+fs.readFileSync(process.argv[2]||path.join(__dirname,'../../marshmallow-quest/index.html'),'utf8')+'</body></html>';
fs.writeFileSync(TMP,html);const b=await chromium.launch();const pg=await b.newPage({viewport:{width:600,height:520}});const errs=[];pg.on('pageerror',e=>errs.push('PAGE '+e.message));pg.on('console',m=>{if(m.type()==='error')errs.push('CON '+m.text());});
await pg.goto('file://'+TMP);await pg.waitForTimeout(400);await pg.evaluate(()=>{G.menu=menuItems().findIndex(i=>i.id==='new');});await pg.keyboard.press('Enter');await pg.waitForTimeout(300);await pg.keyboard.press('Enter');await pg.waitForTimeout(400);
const r=await pg.evaluate(()=>{const out={};G.flags.sword=true;G.flags.spear=true;G.msg=null;const run=n=>{for(let i=0;i<n;i++)step();};
  // 1. loot on a looted tile
  loadMap('overworld',24,30,0);G.msg=null;G.ents=[];const tx=Math.floor((P.x+5)/T),ty=Math.floor((P.y+5)/T);
  G.map.objs.push({type:'coin',x:tx,y:ty,drop:1});run(2);const c1=G.coins;G.map.objs.push({type:'coin',x:tx,y:ty,drop:2});run(2);const c2=G.coins;out.secondDropOnSameTileCollected=(c2-c1)===1;out.dropsLeftInObjs=G.map.objs.filter(o=>o.drop).length;
  for(let k=0;k<20;k++)G.map.objs.push({type:'coin',x:40,y:40,drop:3});loadMap('cave',2,14,3);loadMap('overworld',24,30,0);out.dropsAfterReload=MAPS.overworld.objs.filter(o=>o.drop).length;
  // 2. goal after clear
  const saveF=Object.assign({},G.flags),saveFr=Object.assign({},G.freed);G.flags.bossDead=true;G.freed={fluff:1,mallo:1,squish:1,dot:1,bibi:1,king:1};G.flags.gate=true;out.goalAfterClear=goalText().slice(0,40);G.flags=saveF;G.freed=saveFr;
  // 3. checkpoint: melt deep in the keep -> respawn at the keep entrance
  G.flags.gate=true;loadMap('castle',19,29,1);G.msg=null;out.checkpoint=JSON.stringify(G.checkpoint);
  P.x=20*16+3;P.y=15*16+3;P.toast=P.cap;run(1);out.meltingStarted=P.melting>0;run(95);G.fade=0;if(G.fadeTo){const cb=G.fadeTo;G.fadeTo=null;cb();}
  out.respawn=G.mapName+' '+Math.floor((P.x+5)/T)+','+Math.floor((P.y+5)/T);G.msg=null;G.msgQ=[];
  // 4. boss: taunt once, die, come back -> no boss at the door, keep music; walk in again -> boss spawns without dialog
  G.freed={fluff:1,mallo:1,squish:1,dot:1,bibi:1};G.flags.taunt=true;G.flags.trig_taunt=true;G.flags.bossFight=true;loadMap('castle',19,29,1);G.msg=null;
  out.bossAtDoor=G.ents.some(e=>e.boss);out.musicAtDoor=audio.music.track;out.trigReset=G.flags.trig_taunt===false;
  P.x=19*16+3;P.y=11*16+3;run(2);out.bossOnReentry=G.ents.some(e=>e.boss);out.dialogOnReentry=!!G.msg;out.musicOnReentry=audio.music.track;out.bannerOnReentry=G.banner&&G.banner.title;
  // 5. thaw rescue
  G.msg=null;loadMap('grotto',4,13,1);G.msg=null;G.flags.trig_toad=true;G.ents=[];G.frozen['4,12']=3;refreshSolids();P.x=4*16+3;P.y=12*16+8;P.hurt=1e9;run(6);out.thawRescueHop=!!P.hop||!hitsWall(P.x,P.y,P.w,P.h);run(20);out.thawFreeAfter=!hitsWall(P.x,P.y,P.w,P.h);
  // 6. camera lead, sword step, roll cancel
  loadMap('overworld',24,30,0);G.msg=null;G.ents=[];P.dir=3;run(60);out.camLeadRight=Math.round(G.cam.x-(P.x+5-W/2));P.dir=2;run(60);out.camLeadLeft=Math.round(G.cam.x-(P.x+5-W/2));
  const x0=P.x;P.dir=3;P.atk=14;P.atkType='sword';run(14);out.swordStepPx=(P.x-x0).toFixed(1);
  P.atk=14;P.atkType='sword';run(7);pressed.c=1;P.rollCd=0;run(1);out.rollCancelled=P.roll>0&&P.atk===0;
  P.roll=0;P.atk=14;P.atkType='sword';run(2);pressed.c=1;P.rollCd=0;run(1);out.earlyCancelBlocked=P.roll===0&&P.atk>0;
  return out;});
console.log(JSON.stringify(r,null,1));console.log(errs);await b.close();})();
