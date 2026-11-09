// Dependency-free deterministic tests of the exact Core embedded in index.html.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(__dirname+'/index.html','utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
new vm.Script(script); // Full browser script syntax, without executing DOM code.
const source=script.slice(0,script.indexOf("const $="));
const core=vm.runInNewContext(source+';Core;');
let count=0;function test(name,fn){fn();count++;console.log('PASS '+name);}
const point=(extra={})=>({lat:38.7,lon:-9.1,accuracy:5,speed:null,time:100000,...extra});
const EXPECTED={
 i3:3,i4:4,i5:5,i6:6,v6:6,flat6:6,v8:8,v10:10,v12:12,
 gt3rs:6,gtr:6,lfa:10,r8v10:10,wrx:4,mustang:8,
 m3:6,c63:8,rs3:5,aventador:12,f458:8
};
const INSPIRATIONS=['gt3rs','gtr','lfa','r8v10','wrx','mustang','m3','c63','rs3','aventador','f458','rx7'];
const ARCHITECTURES=['i3','i4','i5','i6','v6','flat6','v8','v10','v12'];
const FIELDS=['group','unofficial','kind','cyl','rotors','fireMul','idle','max','tone','exhaustQ','intakeBase','intakeRatio','intakeQ','noiseIdle','noiseLoad','rough','pulse','harmonicDecay','evenMix','oddMix','rasp','pulseGain','pulseLoad','subGain','subDiv','flutterBase','crackle','hint'];
const synthKey=e=>[e.tone,e.exhaustQ,e.intakeBase,e.intakeRatio,e.intakeQ,e.noiseIdle,e.noiseLoad,e.rough,e.pulse,e.harmonicDecay,e.evenMix,e.oddMix,e.rasp,e.kind,e.fireMul].join('|');
const popState=(over={})=>({
 enabled:true,running:true,muted:false,volume:15,intensity:50,
 event:'decel',validMotion:true,rpm:4500,maxRpm:7000,accel:-1.2,
 profile:core.engines.c63,now:10,lastPopAt:null,activeVoices:0,
 random:()=>0,...over
});

test('m/s → km/h',()=>assert.equal(core.gpsSample(null,point({speed:10})).speed,36));
test('null speed remains unknown without baseline',()=>assert.equal(core.gpsSample(null,point()).speed,null));
test('negative speed uses unknown fallback',()=>assert.equal(core.gpsSample(null,point({speed:-1})).speed,null));
test('position fallback at known distance',()=>{const a=point({kmh:null}),b=point({lat:38.7001,time:102000});const r=core.gpsSample(a,b);assert(r.derived);assert(Math.abs(r.speed-20.015)<.05);});
test('jitter is stationary',()=>assert.equal(core.gpsSample(point({kmh:0}),point({lat:38.700001,time:102000})).speed,0));
test('large position jump rejected',()=>assert.equal(core.gpsSample(point({kmh:0}),point({lat:39,time:102000})).ok,false));
test('poor accuracy rejected',()=>assert.equal(core.gpsSample(null,point({accuracy:150})).ok,false));
test('invalid coordinates rejected',()=>assert.equal(core.gpsSample(null,point({lat:NaN})).ok,false));
test('duplicate timestamp rejected',()=>assert.equal(core.gpsSample(point(),point()).ok,false));
test('implausible acceleration rejected',()=>assert.equal(core.gpsSample(point({kmh:0}),point({speed:30,time:102000})).ok,false));
test('old baseline cannot derive a speed',()=>assert.equal(core.gpsSample(point({kmh:0}),point({time:125000})).speed,null));
// v3.2: mapping() is now a stateless cruise-gear helper; the old fixed 22 km/h threshold no longer exists.
test('stateless cruise mapping: gear never decreases with speed and RPM drops at a shift',()=>{let prev=core.mapping(1,'v8'),sawDrop=false;for(let s=2;s<=200;s++){const m=core.mapping(s,'v8');assert(m.gear>=prev.gear,String(s));if(m.gear>prev.gear&&m.rpm<prev.rpm)sawDrop=true;prev=m;}assert(sawDrop);assert.equal(core.mapping(0,'v8').gear,0);});
test('all engines map finite bounded RPM/load over speed sweep',()=>{for(const key of Object.keys(core.engines))for(let s=-10;s<=300;s++){const m=core.mapping(s,key,4),e=core.engines[key];assert(m.rpm>=e.idle&&m.rpm<=e.max);assert(m.load>=0&&m.load<=1);assert(m.gear>=0&&m.gear<=7);}});
test('positive acceleration increases synthetic load',()=>assert(core.mapping(40,'v6',2).load>core.mapping(40,'v6',0).load));
test('visible version 3.2 is exposed in Core and HTML',()=>{assert.equal(core.VERSION,'3.2');assert.match(html,/data-version="3\.2"/);assert.match(html,/>v3\.2</);assert.match(html,/Impulso v3\.2/);});
test('at least 21 presets with expected keys',()=>{
 const keys=Object.keys(core.engines);
 assert(keys.length>=21,keys.length);
 assert.equal(keys.length,21);
 assert.deepEqual(keys.slice().sort(),[...Object.keys(EXPECTED),'rx7'].sort());
 for(const [k,cyl] of Object.entries(EXPECTED)){
  assert.equal(core.engines[k].kind,'piston',k);
  assert.equal(core.engines[k].cyl,cyl,k);
  assert.equal(core.engines[k].fireMul,cyl/2,k);
 }
});
test('selector groups inspirations and architectures',()=>{
 assert.match(html,/<optgroup label="Inspirações de modelos"/);
 assert.match(html,/<optgroup label="Arquiteturas de motor"/);
 for(const id of INSPIRATIONS){
  assert.equal(core.engines[id].unofficial,true,id);
  assert.equal(core.engines[id].group,'inspiration',id);
  assert.match(html,new RegExp(`value="${id}"`));
 }
 for(const id of ARCHITECTURES){
  assert.equal(core.engines[id].unofficial,false,id);
  assert.equal(core.engines[id].group,'architecture',id);
  assert.match(html,new RegExp(`value="${id}"`));
 }
 assert.match(html,/BMW M3/);
 assert.match(html,/Mercedes-AMG C63/);
 assert.match(html,/Audi RS3/);
 assert.match(html,/Lamborghini Aventador/);
 assert.match(html,/Ferrari 458/);
 assert.match(html,/Mazda RX-7 · rotativo/);
});
test('honesty is present without a disclaimer wall on every option',()=>{
 assert.match(html,/Síntese original, não oficial/);
 assert.match(html,/não é uma gravação/i);
 assert.doesNotMatch(html,/<option[^>]*>[^<]*síntese não oficial/);
 const repeats=(html.match(/não oficial/gi)||[]).length;
 assert(repeats<=4,'too many unofficial repeats: '+repeats);
});
test('every profile has complete bounded unique synthesis tuning and a short hint',()=>{
 const fingerprints=new Set(),synth=new Set(),hints=new Set();
 for(const [key,e] of Object.entries(core.engines)){
  for(const field of FIELDS) assert.notEqual(e[field],undefined,key+'.'+field);
  assert(e.idle<e.max,key+' idle/max');
  assert(e.idle>=500&&e.max<=10000,key+' rpm window');
  assert(e.pulseGain<=.22&&e.pulseLoad<=.16&&e.subGain<=.18,key+' gains');
  assert(e.noiseIdle<=.025&&e.noiseLoad<=.09,key+' noise');
  assert(e.tone>=800&&e.tone<=4000,key+' tone');
  assert(e.pulse>0&&e.harmonicDecay>0&&e.evenMix>0&&e.oddMix>0,key+' wave');
  assert(e.crackle>=0&&e.crackle<=1,key+' crackle');
  assert(e.fireMul>0,key+' fireMul');
  assert.equal(typeof e.hint,'string');
  assert(e.hint.length>12&&e.hint.length<140,key+' hint length');
  assert(!hints.has(e.hint),'duplicate hint '+key);
  hints.add(e.hint);
  const fp=core.profileFingerprint(e);
  assert(!fingerprints.has(fp),'duplicate fingerprint '+key);
  fingerprints.add(fp);
  const sk=synthKey(e);
  assert(!synth.has(sk),'duplicate synthesis key '+key);
  synth.add(sk);
 }
 assert(fingerprints.size>=21);
 assert.equal(synth.size,fingerprints.size);
});
test('related profiles differ beyond name and cylinder or rotor count',()=>{
 const pairs=[['gt3rs','flat6'],['gtr','v6'],['lfa','v10'],['r8v10','v10'],['lfa','r8v10'],['wrx','i4'],['mustang','v8'],['i6','v6'],['m3','i6'],['c63','v8'],['c63','mustang'],['rs3','i5'],['aventador','v12'],['f458','v8'],['f458','c63']];
 for(const [a,b] of pairs){
  const A=core.engines[a],B=core.engines[b];
  assert.equal(A.kind,B.kind);
  if(A.kind==='piston') assert.equal(A.cyl,B.cyl,a+' vs '+b+' cyl');
  assert.notEqual(synthKey(A),synthKey(B),a+' vs '+b+' synth');
  let differentPartial=false;
  for(let i=1;i<=24;i++){
   const pa=core.harmonicPartial(A,i),pb=core.harmonicPartial(B,i);
   assert(Number.isFinite(pa)&&pa>=0,a+' partial '+i);
   assert(Number.isFinite(pb)&&pb>=0,b+' partial '+i);
   if(pa!==pb) differentPartial=true;
  }
  assert(differentPartial,a+' vs '+b+' harmonics');
 }
});
test('unknown engine key maps to a safe idle state',()=>{
 const m=core.mapping(80,'missing',2);
 assert.equal(m.gear,0);assert.equal(m.rpm,800);assert.equal(m.load,0);
});
test('mapping uses each profile idle and cap rather than a shared redline',()=>{
 const muscle=core.mapping(200,'mustang');
 const high=core.mapping(200,'lfa');
 // v3.2: at 200 km/h cruise the gearbox sits in top gear, so the cap is checked via gearRpm in 1st instead.
 assert(muscle.rpm<=core.engines.mustang.max*.94&&muscle.rpm>=core.engines.mustang.idle);
 assert(high.rpm>muscle.rpm);
 assert(high.rpm<=core.engines.lfa.max*.94);
 assert.equal(core.gearRpm(core.engines.mustang,200,1),core.engines.mustang.max*.94);
 assert.equal(core.gearRpm(core.engines.lfa,200,1),core.engines.lfa.max*.94);
 assert.equal(core.gearRpm(core.engines.mustang,2,7),core.engines.mustang.idle);
});
test('RX-7 is a rotary profile, not a piston-cylinder stand-in',()=>{
 const e=core.engines.rx7;
 assert.equal(e.kind,'rotary');
 assert.equal(e.rotors,2);
 assert.equal(e.cyl,0);
 assert.equal(e.fireMul,2);
 assert.equal(core.firingMul(e),2);
 assert.equal(core.firingHz(e,3000),100);
 assert.equal(core.firingHz(core.engines.i4,3000),100);
 assert.notEqual(synthKey(e),synthKey(core.engines.i4));
 assert.match(html,/Mazda RX-7 · rotativo/);
 assert.match(e.hint,/rotativo/i);
 assert.match(e.hint,/não é de pistões/);
 assert.doesNotMatch(html,/RX-7[^<]*(I4|quatro cilindros|4 cilindros)/i);
 const mapped=core.mapping(90,'rx7',1);
 assert(mapped.rpm>=e.idle&&mapped.rpm<=e.max);
});
test('pops stay off when disabled, muted, or stopped',()=>{
 assert.equal(core.evaluatePop(popState({enabled:false})).reason,'off');
 assert.equal(core.evaluatePop(popState({muted:true})).reason,'muted');
 assert.equal(core.evaluatePop(popState({volume:0})).reason,'muted');
 assert.equal(core.evaluatePop(popState({running:false})).reason,'stopped');
 assert.equal(core.evaluatePop(popState({intensity:0})).reason,'intensity');
});
test('pops never trigger on signal loss, mode switch, restart, hidden page or engine change',()=>{
 for(const event of ['signal-loss','mode-switch','audio-restart','hidden','engine-change','none','stale']){
  const r=core.evaluatePop(popState({event}));
  assert.equal(r.allow,false,event);
  assert.equal(r.reason,'forbidden',event);
 }
});
test('stale or invalid motion cannot create decel or upshift pops',()=>{
 assert.equal(core.evaluatePop(popState({event:'decel',validMotion:false})).reason,'invalid');
 assert.equal(core.evaluatePop(popState({event:'upshift',validMotion:false,accel:1})).reason,'invalid');
 assert.equal(core.evaluatePop(popState({event:'decel',accel:-0.1})).reason,'not-decel');
});
test('valid seeded decel, rev-release and upshift can trigger',()=>{
 const decel=core.evaluatePop(popState());
 assert.equal(decel.allow,true);
 assert.equal(decel.kind,'crackle');
 assert(decel.gain>0&&decel.gain<=core.POP_LIMITS.maxGain);
 const rev=core.evaluatePop(popState({event:'rev-release',rpm:5000,maxRpm:7000,random:()=>1}));
 assert.equal(rev.allow,true);
 assert.equal(rev.kind,'crackle');
 const lowRev=core.evaluatePop(popState({event:'rev-release',rpm:2000,maxRpm:7000}));
 assert.equal(lowRev.reason,'rpm-low');
 const up=core.evaluatePop(popState({event:'upshift',accel:1,random:()=>1}));
 assert.equal(up.allow,true);
 assert.equal(up.kind,'shift-pop');
});
test('cooldown and voice cap block a constant pop loop',()=>{
 const first=core.evaluatePop(popState({now:10,lastPopAt:null}));
 assert.equal(first.allow,true);
 const again=core.evaluatePop(popState({now:10.05,lastPopAt:10}));
 assert.equal(again.reason,'cooldown');
 const later=core.evaluatePop(popState({now:10+first.minGap+.01,lastPopAt:10}));
 assert.equal(later.allow,true);
 assert.equal(core.evaluatePop(popState({activeVoices:3})).reason,'voice-cap');
});
test('sporty profiles are more likely to crackle than refined ones with the same roll',()=>{
 const roll=()=>0.2;
 const sporty=core.evaluatePop(popState({profile:core.engines.c63,intensity:50,random:roll}));
 const refined=core.evaluatePop(popState({profile:core.engines.i6,intensity:50,random:roll}));
 assert.equal(sporty.allow,true);
 assert.equal(refined.allow,false);
 assert.equal(refined.reason,'roll');
 assert(core.engines.c63.crackle>core.engines.v8.crackle);
 assert(core.engines.f458.crackle>core.engines.lfa.crackle);
 assert(core.engines.rs3.crackle>core.engines.i5.crackle);
});
test('pop envelopes stay short and amplitude-capped',()=>{
 const dec=core.evaluatePop(popState());
 const env=core.popEnvelope(dec);
 assert(env.peak<=core.POP_LIMITS.maxGain);
 assert(env.dur<=0.1);
 assert(env.thumpPeak<env.peak);
 assert(env.nodes<=6);
 assert.equal(core.popEnvelope({allow:false}).peak,0);
});
test('pops control defaults to off and intensity is optional',()=>{
 assert.match(html,/id="popsEnable"/);
 assert.match(html,/id="popsControls" hidden/);
 assert.match(html,/id="popsIntensity"/);
 assert.doesNotMatch(html,/id="popsEnable"[^>]*checked/);
 assert.match(html,/Estalos e pops \(opcional\)/);
});

// ---- v3.1 GPS timing fix: receipt time, never pos.timestamp age ----
const WALL=1794200000000; // fixed wall clock for determinism
const mkPos=(lat,offsetMs,speed=null,acc=5,tsStep=0)=>({coords:{latitude:lat,longitude:-9.1,accuracy:acc,speed},timestamp:WALL+offsetMs+tsStep});
function runFixes(offsetMs,{native,intervalMs,steps}){
 let track=null,last=null;
 for(let i=0;i<steps;i++){
  const received=1000+i*intervalMs;                 // receipt time (performance.now-like)
  const latStep=native?0:(20*intervalMs/1000)/111195; // ~20 m/s along latitude
  const pos=mkPos(38.7+i*latStep,offsetMs,native?20:null,5,i*intervalMs);
  const fix=core.gpsFix(pos,received,WALL+i*intervalMs);
  const step=core.gpsStep(track,fix);
  track=step.track;last={fix,result:step.result};
 }
 return last;
}
test('watch callback no longer rejects by pos.timestamp age',()=>{
 assert.doesNotMatch(html,/Posição antiga rejeitada/);
 assert.doesNotMatch(script,/Date\.now\(\)\s*-\s*p\.time/);
 assert.doesNotMatch(script,/p\.time\s*>\s*Date\.now\(\)/);
 assert.match(script,/Core\.gpsFix\(pos,performance\.now\(\),Date\.now\(\)\)/);
 assert.match(script,/maximumAge:0/);
});
for(const [label,off] of [['-60 s',-60000],['-1 h',-3600000],['+1 h',3600000]]){
 test(`timestamp offset ${label}: native speed still valid`,()=>{
  const {fix,result}=runFixes(off,{native:true,intervalMs:1000,steps:3});
  assert.equal(result.ok,true);
  assert.equal(result.speed,72);
  assert.equal(result.derived,false);
  assert(Math.abs(fix.offsetSec-off/1000)<1e-9);
  assert.equal(fix.time,3000);
 });
 test(`timestamp offset ${label}: position-derived speed still valid`,()=>{
  const {fix,result}=runFixes(off,{native:false,intervalMs:1000,steps:4});
  assert.equal(result.ok,true);
  assert.equal(result.derived,true);
  assert(Math.abs(result.speed-72)<1,String(result.speed));
  assert(Math.abs(fix.offsetSec-off/1000)<1e-9);
 });
}
test('fixes faster than 1 Hz without native speed still derive a speed',()=>{
 const {result}=runFixes(-3600000,{native:false,intervalMs:400,steps:12});
 assert.equal(result.ok,true);
 assert.notEqual(result.speed,null);
 assert(Math.abs(result.speed-72)<2,String(result.speed));
});
test('repeated raw timestamp is ignored as a duplicate, not a rejection that clears speed',()=>{
 const a=core.gpsFix(mkPos(38.7,-3600000,20),1000,WALL);
 const s1=core.gpsStep(null,a);
 assert.equal(s1.result.ok,true);
 const b=core.gpsFix(mkPos(38.7,-3600000,20),1500,WALL+500);
 const s2=core.gpsStep(s1.track,b);
 assert.equal(s2.result.ok,false);
 assert.equal(s2.result.duplicate,true);
 assert.equal(s2.track,s1.track);
});
test('receipt-time ordering still rejects jumps and implausible changes',()=>{
 const a=core.gpsFix(mkPos(38.7,-3600000,0),1000,WALL);
 const s1=core.gpsStep(null,a);
 const b=core.gpsFix(mkPos(38.7,-3600000,30,5,2000),3000,WALL+2000);
 assert.equal(core.gpsStep(s1.track,b).result.ok,false);
 const c=core.gpsFix(mkPos(39.5,-3600000,1,5,2000),3000,WALL+2000);
 assert.equal(core.gpsStep(s1.track,c).result.ok,false);
});
test('poor accuracy is still rejected regardless of timestamp',()=>{
 const f=core.gpsFix(mkPos(38.7,3600000,10,150),1000,WALL);
 assert.equal(core.gpsStep(null,f).result.ok,false);
});
test('diagnostics panel exposes timestamp offset in seconds',()=>{
 assert.match(html,/id="gpsDiag"/);
 assert.match(html,/Desvio do timestamp/);
 assert.match(html,/id="dgOffset"/);
 assert.equal(core.formatOffset(-3600),'−3600.0 s');
 assert.equal(core.formatOffset(3600),'+3600.0 s');
 assert.equal(core.formatOffset(-60.04),'−60.0 s');
 assert.equal(core.formatOffset(0),'0.0 s');
 assert.equal(core.formatOffset(null),'indisponível');
 assert.equal(core.gpsFix({coords:{latitude:1,longitude:1,accuracy:5,speed:null}},1,WALL).offsetSec,null);
});

// ---- v3.2 virtual automatic gearbox ----
function lcg(seed){let s=seed;return()=>{s=(s*16807)%2147483647;return s/2147483647;};}
function gpsLike(key,{v=120,secs=10,style='comfort',start=null,seed=7,noise=.8}={}){
 const rnd=lcg(seed),gauss=()=>{let s=0;for(let i=0;i<6;i++)s+=rnd();return s-3;};
 const e=core.engines[key];let st=start,r,prev=v,acc=0,shifts=0,ups=0,downs=0,flips=0,lastDir=null,pops=0,minR=1e9,maxR=0;
 for(let i=0;i<secs*20;i++){
  if(i%20===0){const s=v+gauss()*noise;acc=(s-prev)/3.6;prev=s;}  // 1 Hz GPS, accel held between fixes
  r=core.gearbox(st,{speed:prev,accel:acc,dt:.05,profile:e,style});st=r.state; // demand undefined → from smoothed accel
  if(r.shift){shifts++;if(r.shift==='up')ups++;else downs++;if(lastDir&&lastDir!==r.shift)flips++;lastDir=r.shift;}
  if(r.popWorthy)pops++;
  if(i>=secs*20-40){minR=Math.min(minR,r.rpm);maxR=Math.max(maxR,r.rpm);}
 }
 return {r,shifts,ups,downs,flips,pops,minR,maxR};
}
const startIn=(g)=>({gear:g,sinceShift:5,accelEma:0,cruiseTime:0,shifts:0});
test('steady 120 km/h with GPS-like noise converges to top gear at calm RPM without hunting',()=>{
 for(const key of ['v8','mustang','i4','m3','c63','lfa','f458','rx7','v12','gt3rs','wrx']){
  const out=gpsLike(key,{start:startIn(4)});
  assert.equal(out.r.gear,7,key);
  assert(out.minR>=1800&&out.maxR<=3000,key+' rpm '+out.minR+'-'+out.maxR);
  assert(out.shifts<=3,key+' shifts '+out.shifts);
  assert.equal(out.downs,0,key);
  assert.equal(out.flips,0,key);
  assert.equal(out.pops,0,key+' cruise upshifts must not be pop candidates');
  assert(out.r.load>=.15&&out.r.load<=.3,key+' load '+out.r.load);
 }
});
test('long noisy cruise in top gear stays put (no shifts in 60 s, several seeds)',()=>{
 for(const seed of [3,11,29,97]){
  const out=gpsLike('v8',{secs:60,start:startIn(7),seed,noise:1.2});
  assert.equal(out.shifts,0,'seed '+seed);
  assert.equal(out.r.gear,7);
 }
});
test('every profile cruises calmly in Conforto at 120 km/h and stays within idle..max*0.94',()=>{
 for(const [key,e] of Object.entries(core.engines)){
  const out=gpsLike(key,{start:startIn(3)});
  assert(out.r.rpm>=e.idle&&out.r.rpm<=e.max*.94,key);
  assert(out.r.rpm<=3000&&out.r.rpm>=1500,key+' '+out.r.rpm);
  assert(out.flips===0,key);
 }
});
function cruiseThenAccel(key,a,style='comfort'){
 const e=core.engines[key];let st=null,r;
 for(let i=0;i<120;i++){r=core.gearbox(st,{speed:100,accel:0,dt:.05,profile:e,style});st=r.state;}
 const before=r;let v=100,maxR=0,downs=0,firstDown=null,ups=[];
 for(let i=0;i<120;i++){v+=a*3.6*.05;r=core.gearbox(st,{speed:v,accel:a,dt:.05,profile:e,style});st=r.state;maxR=Math.max(maxR,r.rpm);
  if(r.shift==='down'){downs++;if(!firstDown)firstDown={from:before.gear,to:r.gear};}
  if(r.shift==='up')ups.push(r);}
 return {before,after:r,maxR,downs,firstDown,ups,e};
}
test('strong acceleration kicks down 1-2 gears into a high band and raises RPM and load',()=>{
 for(const key of ['v8','lfa','i4','rx7']){
  const k=cruiseThenAccel(key,2.5);
  assert.equal(k.before.gear,7,key);
  assert(k.downs>=1,key);
  assert(k.firstDown.from-k.firstDown.to>=1&&k.firstDown.from-k.firstDown.to<=2,key);
  assert(k.maxR>=.55*k.e.max&&k.maxR<=k.e.max*.94,key+' '+k.maxR);
  assert(k.after.load>=.8,key);
  for(const u of k.ups) assert(u.popWorthy,key+' demanding upshift is a pop candidate');
 }
});
test('mild acceleration does not kick down from cruise',()=>{
 const k=cruiseThenAccel('v8',.4);
 assert.equal(k.downs,0);
});
test('deceleration downshifts progressively, never upshifts, and ends in 1st',()=>{
 for(const key of ['v8','lfa','mustang']){
  const e=core.engines[key];let st=null,r;
  for(let i=0;i<120;i++){r=core.gearbox(st,{speed:120,accel:0,dt:.05,profile:e});st=r.state;}
  let v=120,downs=0,ups=0,lastT=-9,minGap=9,t=0;
  while(v>6){v-=2.5*3.6*.05;t+=.05;r=core.gearbox(st,{speed:v,accel:-2.5,dt:.05,profile:e});st=r.state;
   if(r.shift){if(r.shift==='down')downs++;else ups++;minGap=Math.min(minGap,t-lastT);lastT=t;}
   assert(r.rpm>=e.idle&&r.rpm<=e.max*.94);assert(r.load<=.2);}
  assert(downs>=4,key);assert.equal(ups,0,key);assert.equal(r.gear,1,key);
  assert(minGap>=.95,key+' minGap '+minGap);
 }
});
test('stopped means neutral; moving off engages 1st',()=>{
 const e=core.engines.v8;
 let r=core.gearbox(null,{speed:0,accel:0,dt:.05,profile:e});
 assert.equal(r.gear,0);assert.equal(r.rpm,e.idle);
 r=core.gearbox(r.state,{speed:3,accel:1,dt:.05,profile:e});
 assert.equal(r.gear,1);
 r=core.gearbox(r.state,{speed:0,accel:-1,dt:.05,profile:e});
 assert.equal(r.gear,0);
 assert.deepEqual(core.gearbox(null,{speed:50,profile:undefined}).gear,0);
});
test('minimum time between ordinary shifts is respected',()=>{
 const e=core.engines.v8;let st=startIn(1),r,t=0,last=-9,gaps=[];
 for(let i=0;i<400;i++){t+=.05;r=core.gearbox(st,{speed:Math.min(120,10+t*12),accel:3.3,demand:.5,dt:.05,profile:e});st=r.state;if(r.shift){gaps.push(t-last);last=t;}}
 assert(gaps.slice(1).every(g=>g>=.95),gaps.join(','));
});
test('Desportiva holds a lower gear and higher RPM than Conforto at cruise',()=>{
 for(const key of ['v8','m3','lfa','rx7','mustang']){
  const c=gpsLike(key,{start:startIn(4),style:'comfort',secs:12});
  const s=gpsLike(key,{start:startIn(4),style:'sport',secs:12});
  assert(s.r.gear<c.r.gear,key);
  assert(s.r.rpm>c.r.rpm+300,key+' '+s.r.rpm+' vs '+c.r.rpm);
  assert(s.r.rpm<=core.engines[key].max*.94);
 }
 assert(core.GEARBOX_STYLES.sport.kick<core.GEARBOX_STYLES.comfort.kick);
});
test('sim throttle demand: 0→120 km/h upshifts each gear and settles to calm top gear',()=>{
 const e=core.engines.v8;let st=null,r,v=0,ups=0;
 for(let i=0;i<1200;i++){const target=120,diff=target-v,a=diff>0?2.75:0;v=Math.min(target,v+a*3.6*.05);
  const d=target-v>.5?Math.max(core.clamp(a/3,0,1)*.5,.45*core.clamp((target-v)/15,.3,1)):0;
  r=core.gearbox(st,{speed:v,accel:v<target?a:0,demand:d,dt:.05,profile:e});st=r.state;if(r.shift==='up')ups++;}
 assert.equal(r.gear,7);assert(ups>=6);assert(r.rpm<2300);assert(r.load<.25);
});
test('page wires the gearbox, Caixa selector defaults to Conforto, pops upshift gated by popWorthy',()=>{
 assert.match(html,/<select id="gearStyle"><option value="comfort" selected>Conforto/);
 assert.match(html,/value="sport">Desportiva/);
 assert.match(script,/Core\.gearbox\(gbState,\{speed,accel,demand,dt,profile:e,style:\$\('gearStyle'\)\.value\}\)/);
 assert.match(script,/gb\.shift==='up'&&gb\.popWorthy&&prevGear>=1\) maybePop\('upshift'/);
 assert.doesNotMatch(script,/thresholds=\[0,22,46,74,108,148\]/);
});
test('gear ratios are 7 descending synthetic values',()=>{
 const R=core.GEAR_RATIOS;assert.equal(R.length,8);
 for(let i=2;i<R.length;i++) assert(R[i]<R[i-1]);
});
console.log(`${count} tests passed; full inline JavaScript syntax valid. These tests cover logic and syntax only, not listening.`);
