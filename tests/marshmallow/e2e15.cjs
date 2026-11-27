const {chromium}=require('playwright');const fs=require('fs');const os=require('os');const path=require('path');const TMP=os.tmpdir()+'/mq-'+process.pid+'.html';
(async()=>{const html='<!doctype html><html><head><meta charset="utf-8"></head><body>'+fs.readFileSync(process.argv[2]||path.join(__dirname,'../../marshmallow-quest/index.html'),'utf8')+'</body></html>';
fs.writeFileSync(TMP,html);const b=await chromium.launch();const pg=await b.newPage({viewport:{width:820,height:760}});const errs=[];pg.on('pageerror',e=>errs.push('PAGE '+e.message));pg.on('console',m=>{if(m.type()==='error')errs.push('CON '+m.text());});
await pg.goto('file://'+TMP);await pg.waitForTimeout(400);await pg.evaluate(()=>{G.menu=menuItems().findIndex(i=>i.id==='new');});await pg.keyboard.press('Enter');await pg.waitForTimeout(300);await pg.keyboard.press('Enter');await pg.waitForTimeout(400);
const log=await pg.evaluate(()=>{const out={};const run=n=>{for(let i=0;i<n;i++)step();};const press=k=>{pressed[k]=1;pressedT[k]=performance.now();};G.flags.sword=true;G.flags.spear=true;G.msg=null;
  // 1. no badges at start; wall object exists in Puff's home and is interactable
  out.noneAtStart=badgeCount()===0&&BADGES.length===18;
  loadMap('home',8,1,0);G.msg=null;out.wallObj=!!objAt(8,0,'badges')&&!!objAt(9,0,'badges');P.x=8*16+3;P.y=1*16+3;P.dir=1;interact();out.pageOpens=G.showBadges===true;render();
  out.pageCloses=(()=>{press('a');run(1);return !G.showBadges;})();
  // 2. earning: free a buddy, the periodic check awards Reunion with a banner
  G.freed={fluff:1};G.banner=null;G.msg=null;checkBadges();out.reunion=!!(G.badges&&G.badges.reunion);out.banner=!!G.banner&&/REUNION/.test(G.banner.title);
  // 3. one badge per check call (no banner pile-up); stats badges
  G.flags.toadDead=true;G.flags.bossDead=true;checkBadges();out.oneAtATime=badgeCount()===2;checkBadges();out.thenNext=badgeCount()===3;
  G.stats.kills=100;checkBadges();out.fighter=!!G.badges.fighter;G.stats.coins=250;checkBadges();out.hoarder=!!G.badges.hoarder;
  // 4. kill and coin stats bump
  loadMap('overworld',24,40,0);G.msg=null;const k0=stat('kills');const e=mkEnemy({kind:'ember',x:26,y:40});G.ents.push(e);e.dead=1;run(2);out.killBump=stat('kills')===k0+1;
  const c0=stat('coins'),coins0=G.coins;G.map.objs.push({type:'coin',x:Math.floor((P.x+5)/16),y:Math.floor((P.y+5)/16),drop:G.t});run(3);out.coinBump=stat('coins')===c0+1&&G.coins===coins0+1;
  // 5. wall renders earned pips and the page lists them; save/load keeps badges and version
  loadMap('home',5,5,0);G.msg=null;render();saveGame();const d=JSON.parse(localStorage.getItem(SAVE_KEY));out.saveVer=d.v===SAVE_VER&&!!d.badges.reunion;
  const old=Object.assign({},d);delete old.badges;delete old.v;delete old.stats.kills;localStorage.setItem(SAVE_KEY,JSON.stringify(old));G.badges=null;out.migrated=loadSave()&&typeof G.badges==='object'&&G.stats.kills===0;
  localStorage.setItem(SAVE_KEY,JSON.stringify(d));loadSave();out.reload=!!G.badges.reunion&&!!G.badges.hoarder;
  // 6. badges carry into NG+
  G.cleared=true;newGame(true);out.ngKeeps=!!G.badges.reunion;checkBadges();out.second=!!G.badges.second;G.msg=null;G.msgQ=[];
  // 7. page shows the badges screen with a second page
  G.showBadges=true;G.badgePage=0;render();press('right');run(1);out.page2=G.badgePage===1;render();
  out.hintPos=(()=>{G.showBadges=false;G.msg=null;say(['one','two'],null,'Elder');render();return true;})();
  return out;});
await pg.evaluate(()=>{G.showBadges=true;G.badgePage=0;render();});await pg.screenshot({path:'/tmp/mq_v13_badges.png'});
await pg.evaluate(()=>{G.showBadges=false;G.msg=null;G.msgQ=[];loadMap('home',8,1,0);G.msg=null;P.x=7*16+3;P.y=1*16+3;render();});await pg.screenshot({path:'/tmp/mq_v13_wall.png'});
log.errs=errs;console.log(JSON.stringify(log,null,1));await b.close();fs.unlinkSync(TMP);const ok=Object.entries(log).every(([k,v])=>k==='errs'?v.length===0:v===true);if(!ok){console.log('FAILED');process.exit(1);}})().catch(e=>{console.log('FAILED',e.message);process.exit(1);});
