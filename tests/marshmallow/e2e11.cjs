const {chromium,devices}=require('playwright');const fs=require('fs');const os=require('os');const path=require('path');const TMP=os.tmpdir()+'/mq-'+process.pid+'.html';
(async()=>{const html='<!doctype html><html><head><meta charset="utf-8"></head><body>'+fs.readFileSync(process.argv[2]||path.join(__dirname,'../../marshmallow-quest/index.html'),'utf8')+'</body></html>';
fs.writeFileSync(TMP,html);const b=await chromium.launch();const pg=await b.newPage({viewport:{width:820,height:760}});const errs=[];pg.on('pageerror',e=>errs.push('PAGE '+e.message));pg.on('console',m=>{if(m.type()==='error')errs.push('CON '+m.text());});
await pg.goto('file://'+TMP);await pg.waitForTimeout(400);await pg.evaluate(()=>{G.menu=menuItems().findIndex(i=>i.id==='new');});await pg.keyboard.press('Enter');await pg.waitForTimeout(300);await pg.keyboard.press('Enter');await pg.waitForTimeout(400);
const box=await pg.evaluate(()=>{const r=document.getElementById('c').getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};});
const log=await pg.evaluate(()=>{const out={};const run=n=>{for(let i=0;i<n;i++)step();};const press=k=>{pressed[k]=1;pressedT[k]=performance.now();};G.flags.sword=true;G.flags.spear=true;G.msg=null;
  // 1. buy Graham Crust at the Baker, crafted items gated by flags
  loadMap('house1',6,4,1);G.msg=null;const baker=G.map.objs.find(o=>o.type==='npc');baker.talked=true;G.coins=30;G.dayT=2600;
  press('a');run(1);while(G.msg){G.msgChar=1e9;press('a');run(1);}out.shopOpts=G.choice&&G.choice.opts.join('|');out.fireHiddenBeforeToad=!/Fire/.test(out.shopOpts||'');
  const gi=G.choice.opts.findIndex(o=>/Graham/.test(o));G.choice.idx=gi;press('a');run(1);out.ownedGraham=!!(G.toppings&&G.toppings.owned.graham);out.coinsAfter=G.coins;G.msg=null;G.msgQ=[];
  G.flags.toadDead=true;press('a');run(1);while(G.msg){G.msgChar=1e9;press('a');run(1);}out.fireShownAfterToad=/Craft: Fire/.test(G.choice.opts.join('|'));G.choice=null;
  // 2. equip from the pause screen with C, effect on damage
  press('start');run(1);out.paused=G.paused;press('c');run(1);out.topMenu=G.choice&&/TOPPINGS/.test(G.choice.title);G.choice.idx=0;press('a');run(1);out.equipped=hasTop('graham');G.choice=null;
  loadMap('overworld',24,30,0);G.msg=null;G.ents=[];P.toast=0;P.hurt=0;hurtPlayer(0.5,null);out.toastWithGraham=P.toast.toFixed(2);
  tops().eq.crust=null;P.toast=0;P.hurt=0;hurtPlayer(0.5,null);out.toastWithout=P.toast.toFixed(2);
  // 3. gold sprinkles chest in the peaks
  loadMap('peaks',32,13,1);G.msg=null;G.ents=[];P.cold=0;run(1);out.promptAtGoldChest=!!P.prompt;interact();out.ownedGold=!!tops().owned.gold;G.msg=null;G.msgQ=[];tops().eq.sprinkle='gold';out.goldOn=hasTop('gold');
  // 4. first-contact tips
  loadMap('overworld',24,30,0);G.msg=null;G.banner=null;G.ents=[mkEnemy({kind:'ember',x:26,y:30})];P.hurt=1e9;run(40);out.emberTip=G.flags.tip_ember===true;
  G.ents=[mkEnemy({kind:'knight',x:26,y:30})];G.ents[0].state='chase';run(60);out.knightTip=G.flags.tip_knight===true;
  // 5. charge ring draws below 40 and auto-pause on hidden
  G.ents=[];P.charge=20;render();out.chargeRingCode=/P\.charge\/40/.test(drawEnts.toString());P.charge=0;
  G.paused=false;document.dispatchEvent(new Event('visibilitychange'));out.autoPauseWhenVisible=G.paused===false;
  Object.defineProperty(document,'hidden',{value:true,configurable:true});document.dispatchEvent(new Event('visibilitychange'));out.autoPausedWhenHidden=G.paused===true;Object.defineProperty(document,'hidden',{value:false,configurable:true});G.paused=false;
  // 6. save round trip keeps toppings
  saveGame();const raw=JSON.parse(localStorage.getItem(SAVE_KEY));out.savedToppings=!!(raw.toppings&&raw.toppings.owned.graham&&raw.toppings.eq.sprinkle==='gold');
  return out;});
await pg.evaluate(()=>{G.paused=true;});await pg.waitForTimeout(100);await pg.screenshot({path:os.tmpdir()+'/mq_v9_pause.png',clip:box});
await pg.evaluate(()=>{G.paused=false;toppingsMenu();});await pg.waitForTimeout(100);await pg.screenshot({path:os.tmpdir()+'/mq_v9_toppings.png',clip:box});
log.errs=errs;console.log(JSON.stringify(log,null,1));await b.close();})().catch(e=>{console.log('FAILED',e.message);process.exit(1);});
