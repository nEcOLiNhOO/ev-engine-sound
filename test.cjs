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
 gt3rs:6,gtr:6,lfa:10,r8v10:10,wrx:4,mustang:8,supra2jz:6,
 m3:6,c63:8,rs3:5,aventador:12,f458:8
};
const INSPIRATIONS=['gt3rs','gtr','lfa','r8v10','wrx','mustang','m3','c63','rs3','aventador','f458','rx7','supra2jz'];
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
// v3.5: version 3.4 → 3.5.
test('visible version 3.5 is exposed in Core and HTML',()=>{assert.equal(core.VERSION,'3.5');assert.match(html,/data-version="3\.5"/);assert.match(html,/>v3\.5</);assert.match(html,/Impulso v3\.5/);});
// v3.4: 21 → 22 profiles (SupraMotor 2JZ added).
test('at least 22 presets with expected keys',()=>{
 const keys=Object.keys(core.engines);
 assert(keys.length>=22,keys.length);
 assert.equal(keys.length,22);
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
 assert(fingerprints.size>=22);
 assert.equal(synth.size,fingerprints.size);
});
test('related profiles differ beyond name and cylinder or rotor count',()=>{
 const pairs=[['gt3rs','flat6'],['gtr','v6'],['lfa','v10'],['r8v10','v10'],['lfa','r8v10'],['wrx','i4'],['mustang','v8'],['i6','v6'],['m3','i6'],['c63','v8'],['c63','mustang'],['rs3','i5'],['aventador','v12'],['f458','v8'],['f458','c63'],['supra2jz','i6'],['supra2jz','m3']];
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
// v3.3 adaptation: ≥1.55 m/s² now asks for up to 3 gears (was ≤2), and upshift pops are per-profile
// (popUp affinity), so a calm I4 no longer marks hard upshifts as pop candidates while sporty/turbo ones do.
test('strong acceleration kicks down 1-3 gears into a high band and raises RPM and load',()=>{
 for(const key of ['v8','lfa','i4','rx7']){
  const k=cruiseThenAccel(key,2.5);
  assert.equal(k.before.gear,7,key);
  assert(k.downs>=1,key);
  assert(k.firstDown.from-k.firstDown.to>=1&&k.firstDown.from-k.firstDown.to<=3,key);
  assert(k.maxR>=.55*k.e.max&&k.maxR<=k.e.max*.94,key+' '+k.maxR);
  assert(k.after.load>=.8,key);
  const aff=core.GEAR_PERSONA[key].popUp;
  if(aff<.15) for(const u of k.ups) assert(!u.popWorthy,key+' calm profile: no upshift pop candidates');
 }
 const rx=cruiseThenAccel('rx7',2.5);assert(rx.ups.some(u=>u.popWorthy),'rx7 hard upshift is a pop candidate');
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
 // v3.3 adaptation: the call now passes sampleAt (GPS fix receipt time) and pop candidates come from Core.popTriggers.
 assert.match(script,/Core\.gearbox\(gbState,\{speed,accel,demand,dt,sampleAt,profile:e,style:\$\('gearStyle'\)\.value\}\)/);
 assert.match(script,/Core\.popTriggers\(gb,\{valid,prevValid,prevGear,rpm,sinceDecelPop\}\)/);
 assert.match(script,/maybePop\(ev\.event,/);
 assert.doesNotMatch(script,/thresholds=\[0,22,46,74,108,148\]/);
});
test('gear ratios are 7 descending synthetic values',()=>{
 const R=core.GEAR_RATIOS;assert.equal(R.length,8);
 for(let i=2;i<R.length;i++) assert(R[i]<R[i-1]);
});

// ---- v3.3: GPS kick-down, rev-matched blips and per-profile pops ----
// drive(): 1 Hz GPS-like fixes (Gaussian-ish noise, km/h) passed as discrete samples (sampleAt = fix time),
// 50 ms frames, page-equivalent RPM smoothing, Core.popTriggers → Core.evaluatePop like tick() does.
function drive(key,phases,{noise=.3,seed=7,style='comfort',pops=false,intensity=50,popSeed=99}={}){
 const rnd=lcg(seed),gs=()=>{let t=0;for(let i=0;i<6;i++)t+=rnd();return t-3;},pr=lcg(popSeed);
 const e=core.engines[key];let st=null,o,v=120,fixV=120,fixT=0,t=0,prevValid=false,prevGear=0,rpm=e.idle,sinceDecelPop=9,lastPopAt=null;
 const log=[];
 for(const ph of phases){const n=Math.round(ph.dur/.05);
  for(let i=0;i<n;i++){v=Math.max(0,v+ph.a*3.6*.05);t+=.05;
   if(Math.abs(t-Math.round(t))<.026&&Math.round(t)!==fixT){fixT=Math.round(t);fixV=v+gs()*noise;}
   o=core.gearbox(st,{speed:fixV,accel:0,dt:.05,sampleAt:fixT,profile:e,style});st=o.state;
   rpm+=(o.rpm-rpm)*(1-Math.exp(-.05*(o.blipping?16:5)));sinceDecelPop+=.05;let popped=0;
   for(const ev of core.popTriggers(o,{valid:true,prevValid,prevGear,rpm,sinceDecelPop})){
    if(ev.event==='decel')sinceDecelPop=0;
    const d=core.evaluatePop({enabled:pops,running:true,muted:false,volume:15,intensity,event:ev.event,validMotion:true,rpm:ev.rpm,maxRpm:e.max,accel:ev.accel??o.aEst,profile:e,now:t,lastPopAt,activeVoices:0,random:pr});
    if(d.allow){lastPopAt=t;popped++;}
   }
   log.push({t,ph:ph.name,speed:fixV,gear:o.gear,rpm:o.rpm,shift:o.shift,blip:o.blip,blipping:o.blipping,popped});
   prevValid=true;prevGear=o.gear;}
 }
 return log;
}
const KEYS=Object.keys(core.engines);
const SEEDS=Array.from({length:20},(_,i)=>100+i*17);
const CRUISE={name:'cruise',dur:25,a:0};
function firstDown(log){const acc=log.filter(x=>x.ph==='acc'),t0=acc[0].t-.05,fd=acc.find(x=>x.shift==='down');return fd?fd.t-t0:Infinity;}
const gearDrop=log=>log.filter(x=>x.ph==='cruise').pop().gear-Math.min(...log.filter(x=>x.ph==='acc').map(x=>x.gear));
// v3.4: version 3.4 and 22 profiles (was 3.3 / 21).
test('per-profile gearbox personality covers all 22 profiles (version now 3.5)',()=>{
 assert.equal(core.VERSION,'3.5');assert.equal(KEYS.length,22);
 assert.deepEqual(Object.keys(core.GEAR_PERSONA).sort(),KEYS.slice().sort());
 for(const k of KEYS){const p=core.GEAR_PERSONA[k];
  assert.equal(core.engines[k].persona,p,k);
  assert(p.kick>=.6&&p.kick<=1.2,k);assert(p.shiftLo>=.3&&p.shiftLo<p.shift&&p.shift<=.94,k);
  assert(p.relax>=2&&p.relax<=4,k+' relax '+p.relax);assert(p.blip>0&&p.blip<=.12,k);
  assert(p.popUp>=0&&p.popUp<=1&&p.popRpm>=.2&&p.popRpm<=.6,k);}
 // Desportiva modifies on top of the persona: lower kick thresholds than Conforto for every profile.
 for(const k of KEYS){const c=core.kickThresholds(core.engines[k],core.GEARBOX_STYLES.comfort),s=core.kickThresholds(core.engines[k],core.GEARBOX_STYLES.sport);
  for(let i=0;i<3;i++){assert(s[i]<c[i],k);if(i)assert(c[i]>c[i-1],k);}}
 // calm vs sporty personality really differs
 assert(core.GEAR_PERSONA.gt3rs.shift>core.GEAR_PERSONA.i6.shift);assert(core.GEAR_PERSONA.c63.popUp>core.GEAR_PERSONA.v12.popUp*5);
});
test('0.6 m/s² for 4 s from 120 km/h cruise (1 Hz noisy GPS) kicks down ≥1 gear within ~1.5 s, every profile',()=>{
 for(const k of KEYS){let in15=0;
  for(const seed of SEEDS){const log=drive(k,[CRUISE,{name:'acc',dur:4,a:.6}],{seed});
   assert.equal(log.filter(x=>x.ph==='cruise').pop().gear,7,k+' cruise gear');
   const t=firstDown(log);assert(t<=2.55,k+' seed '+seed+' first downshift '+t);assert(gearDrop(log)>=1,k);
   if(t<=1.55)in15++;}
  assert(in15>=15,k+' only '+in15+'/20 seeds within 1.5 s');
 }
});
test('1.2 m/s² for 4 s from 120 km/h kicks down ≥2 gears for every profile (also with noisier GPS)',()=>{
 for(const k of KEYS) for(const seed of SEEDS.slice(0,8)) for(const noise of [.3,.5]){
  const log=drive(k,[CRUISE,{name:'acc',dur:4,a:1.2}],{seed,noise});
  assert(gearDrop(log)>=2,k+' seed '+seed+' noise '+noise);
  for(const x of log) assert(x.rpm<=core.engines[k].max*.94,k);
 }
});
test('60 s of noisy steady 120 km/h cruise: 0 shifts for every profile, Conforto and Desportiva',()=>{
 for(const k of KEYS) for(const style of ['comfort','sport']) for(const seed of [3,11]){
  const log=drive(k,[{name:'warm',dur:15,a:0},{name:'cruise',dur:60,a:0}],{seed,noise:.5,style});
  assert.equal(log.filter(x=>x.ph==='cruise'&&x.shift).length,0,k+' '+style+' seed '+seed);
 }
});
test('after the acceleration ends the gearbox relaxes back to top gear (per-profile relax time)',()=>{
 for(const k of KEYS) for(const a of [.6,1.2]){
  const log=drive(k,[CRUISE,{name:'acc',dur:4,a},{name:'steady',dur:14,a:0}]);
  const end=log[log.length-1];assert.equal(end.gear,7,k+' a='+a);
  const back=log.find(x=>x.ph==='steady'&&x.gear===7);assert(back,k);
  const tb=back.t-log.find(x=>x.ph==='steady').t;
  assert(tb<=core.GEAR_PERSONA[k].relax+6,k+' back to 7th after '+tb.toFixed(2)+' s');
 }
});
test('deceleration from cruise downshifts with rev-matched blips (RPM overshoot, bounded)',()=>{
 for(const k of KEYS){const e=core.engines[k];
  const log=drive(k,[CRUISE,{name:'dec',dur:12,a:-1.0}]);const dec=log.filter(x=>x.ph==='dec');
  const downs=dec.filter(x=>x.shift==='down');assert(downs.length>=1,k);
  assert(downs.every(x=>x.blip),k+' every decel downshift blips');
  assert(!dec.some(x=>x.shift==='up'),k);
  const over=dec.filter(x=>x.blipping).some(x=>x.rpm>core.gearRpm(e,x.speed,x.gear)+20);assert(over,k+' blip overshoot');
  for(const x of dec) assert(x.rpm<=e.max*.94&&x.rpm>=e.idle,k);
 }
 const g3=drive('gt3rs',[CRUISE,{name:'dec',dur:12,a:-1.0}]).filter(x=>x.shift==='down').length;
 const i6=drive('i6',[CRUISE,{name:'dec',dur:12,a:-1.0}]).filter(x=>x.shift==='down').length;
 assert(g3>i6,'sporty profile downshifts more eagerly on decel ('+g3+' vs '+i6+')');
});
// Sporty = crackle propensity ≥ .42; calm = most refined; gtr/i5/v6/flat6/v10 sit in between (no hard claim).
const SPORTY=KEYS.filter(k=>core.engines[k].crackle>=.42);
const CALM=['i3','i4','i6','v12'];
const POP_SEEDS=[987654321,123456789,555555555,2024110801,1357913579]; // large seeds: small Lehmer seeds give a tiny first draw
const liftLog=(k,pops,popSeed=POP_SEEDS[0])=>drive(k,[CRUISE,{name:'acc',dur:5,a:1.2},{name:'lift',dur:8,a:-.9},{name:'steady',dur:6,a:0}],{pops,popSeed});
const popsOf=log=>log.reduce((s,x)=>s+x.popped,0);
test('accel → lift-off with pops on: sporty profiles pop, calm ones few/none, pops off → none',()=>{
 for(const k of KEYS) assert.equal(popsOf(liftLog(k,false)),0,k+' pops off');
 assert(SPORTY.length>=12,'sporty set '+SPORTY);
 for(const k of SPORTY) for(const ps of POP_SEEDS) assert(popsOf(liftLog(k,true,ps))>=1,k+' popSeed '+ps);
 for(const k of CALM) for(const ps of POP_SEEDS) assert(popsOf(liftLog(k,true,ps))<=2,k+' popSeed '+ps);
 const avg=ks=>ks.reduce((s,k)=>s+POP_SEEDS.reduce((t,ps)=>t+popsOf(liftLog(k,true,ps)),0),0)/ks.length/POP_SEEDS.length;
 assert(avg(SPORTY)>=4*avg(CALM),'sporty '+avg(SPORTY)+' vs calm '+avg(CALM));
 // lift-off generates an overrun candidate (the gearbox flags it)
 assert(liftLog('c63',false).some(x=>x.shift===null)&&core.popTriggers({liftoff:true,aEst:-.9,shift:null,blip:false},{valid:true,prevValid:true,prevGear:6,rpm:4000}).some(e=>e.event==='overrun'));
});
test('overrun pops respect every safety gate and the profile-relative rpm gate',()=>{
 const e=core.engines.c63,base={event:'overrun',maxRpm:e.max,profile:e,rpm:3500,accel:-.8};
 assert(core.evaluatePop(popState(base)).allow,'overrun allowed when valid');
 for(const over of [{enabled:false},{running:false},{muted:true},{volume:0},{validMotion:false},{activeVoices:3},{lastPopAt:9.9}])
  assert(!core.evaluatePop(popState({...base,...over})).allow,JSON.stringify(over));
 assert(!core.evaluatePop(popState({...base,rpm:e.idle*1.5})).allow,'below rpm gate');
 assert(!core.evaluatePop(popState({...base,event:'modeSwitch'})).allow);
 // gate is relative to the profile's own range: a cruise-level 2400 rpm passes on c63 (low gate) but a high-revving
 // calm i6 needs more.
 assert(core.GEAR_PERSONA.c63.popRpm*e.max<2400);
 assert(core.GEAR_PERSONA.i6.popRpm*core.engines.i6.max>2400);
 assert(!core.evaluatePop(popState({...base,profile:core.engines.i6,maxRpm:core.engines.i6.max,rpm:2400})).allow);
});
test('sim mode: raising the target / throttle at 120 km/h kicks down (page throttle-proxy formula)',()=>{
 const run=(key,throttle,target=140)=>{const e=core.engines[key];let st=null,r,v=120,minG=9,g0=null;
  for(let i=0;i<400;i++){r=core.gearbox(st,{speed:v,accel:0,demand:0,dt:.05,profile:e});st=r.state;}
  g0=r.gear;
  for(let i=0;i<100;i++){const dt=.05,diff=target-v,rate=diff>0?.5+throttle/100*5:5,ch=core.clamp(diff,-rate*3.6*dt,rate*3.6*dt);v+=ch;const a=ch/dt/3.6;
   const d=diff>.5?Math.max(core.clamp(a/3,0,1)*.5,throttle/100*core.clamp(diff/15,.3,1)):0;
   r=core.gearbox(st,{speed:v,accel:a,demand:d,dt,profile:e});st=r.state;minG=Math.min(minG,r.gear);}
  return {g0,drop:g0-minG};};
 for(const k of KEYS){const lo=run(k,20),hi=run(k,80);
  assert.equal(lo.g0,7,k);assert(lo.drop>=1,k+' throttle 20% drop '+lo.drop);assert(hi.drop>=2,k+' throttle 80% drop '+hi.drop);}
});

// ---- v3.4: SupraMotor 2JZ ----
test('SupraMotor 2JZ: label, inspiration group, i6-like firing, ranges, cruise, kick-down and lift-off pops',()=>{
 const e=core.engines.supra2jz,p=core.GEAR_PERSONA.supra2jz;
 assert.match(html,/<option value="supra2jz">SupraMotor 2JZ<\/option>/);
 const insp=html.slice(html.indexOf('<optgroup label="Inspirações de modelos"'),html.indexOf('<optgroup label="Arquiteturas de motor"'));
 assert.match(insp,/value="supra2jz"/);
 assert.equal(e.group,'inspiration');assert.equal(e.unofficial,true);
 assert.equal(e.kind,'piston');assert.equal(e.cyl,6);assert.equal(e.fireMul,core.engines.i6.fireMul);
 assert.equal(core.firingHz(e,3000),core.firingHz(core.engines.i6,3000));
 assert(e.idle>=800&&e.idle<=900,'idle '+e.idle);assert(e.max>=7000&&e.max<=7200,'max '+e.max);
 assert(e.flutterBase>0&&e.noiseLoad>core.engines.i6.noiseLoad&&e.rasp>core.engines.i6.rasp,'turbo whoosh/rasp vs I6');
 assert(e.crackle>core.engines.gtr.crackle&&e.crackle>core.engines.wrx.crackle,'louder crackle than gtr/wrx');
 assert(p.popUp>=.5&&p.kick<core.GEAR_PERSONA.i6.kick&&p.shift>=.88,'sporty turbo persona');
 // cruise at 120 in 7th within 1500–3000 rpm
 const cr=drive('supra2jz',[CRUISE]).pop();assert.equal(cr.gear,7);assert(cr.rpm>=1500&&cr.rpm<=3000,'cruise rpm '+cr.rpm);
 for(const seed of SEEDS){
  const l6=drive('supra2jz',[CRUISE,{name:'acc',dur:4,a:.6}],{seed});assert(gearDrop(l6)>=1,'0.6 seed '+seed);assert(firstDown(l6)<=2.55);
  const l12=drive('supra2jz',[CRUISE,{name:'acc',dur:4,a:1.2}],{seed});assert(gearDrop(l12)>=2,'1.2 seed '+seed);
  for(const x of l12) assert(x.rpm<=e.max*.94);
 }
 for(const ps of POP_SEEDS) assert(popsOf(liftLog('supra2jz',true,ps))>=1,'pops on, seed '+ps);
 assert.equal(popsOf(liftLog('supra2jz',false)),0,'pops off');
 // hard upshifts are pop candidates (turbo-car style)
 const k=cruiseThenAccel('supra2jz',2.5);assert(k.ups.some(u=>u.popWorthy),'upshift pop candidate');
});

// ---- v3.5: clean audio for car speakers ----
const OPS=e=>[['idle',e.idle,.08],['cruise120',core.gearRpm(e,120,7),.2],['cruiseSport',core.gearRpm(e,120,6),.25]];
const tonalGain=P=>P.pulseGain+P.subGain;
test('noise gain at idle and steady cruise is tiny for all 22 profiles (default and max slider)',()=>{
 assert.equal(KEYS.length,22);
 for(const k of KEYS){const e=core.engines[k];
  for(const [n,rpm,load] of OPS(e)){
   const P=core.audioParams(e,rpm,load,{});
   assert(P.noiseGain<=.0005,k+' '+n+' noise '+P.noiseGain);
   assert(P.noiseGain/tonalGain(P)<=.004,k+' '+n+' noise/tone '+(P.noiseGain/tonalGain(P)));
   const P100=core.audioParams(e,rpm,load,{noise:100});
   assert(P100.noiseGain<=.002,k+' '+n+' noise@100 '+P100.noiseGain);
  }}
});
test('noise rises with load (only under real load) and with the slider; slider 0 silences it',()=>{
 for(const k of KEYS){const e=core.engines[k],rpm=e.max*.6;let prev=-1;
  for(const load of [0,.2,.3,.45,.6,.8,1]){const g=core.audioParams(e,rpm,load,{}).noiseGain;assert(g>=prev,k+' load '+load);prev=g;}
  const lo=core.audioParams(e,rpm,.2,{}).noiseGain,hi=core.audioParams(e,rpm,1,{}).noiseGain;
  assert(hi>=lo*20,k+' full-load noise should be ≥20× cruise ('+hi+' vs '+lo+')');
  assert(core.audioParams(e,rpm,1,{noise:100}).noiseGain>core.audioParams(e,rpm,1,{noise:25}).noiseGain*3.5);
  assert.equal(core.audioParams(e,rpm,1,{noise:0}).noiseGain,0);
 }
 assert.equal(core.noiseGate(.2),0);assert.equal(core.noiseGate(1),1);
});
test('master chain constants: highpass 30–40 Hz, lowpass 6–8 kHz, band-limited noise, no hard limiter',()=>{
 const A=core.AUDIO;
 assert(A.hpHz>=30&&A.hpHz<=40);assert(A.lpHz>=6000&&A.lpHz<=8000);
 assert(A.noiseHpHz>=100&&A.noiseHpHz<=200&&A.noiseLpHz>=2000&&A.noiseLpHz<=3000);
 assert(A.comp.ratio<12&&A.comp.ratio<=4,'ratio '+A.comp.ratio);assert(A.comp.threshold>=-12);assert(A.comp.attack>=.01);
 assert.equal(A.clip.oversample,'4x');assert(A.clip.ceiling<1);
 assert.equal(A.volumeMax,70);assert.match(html,/<input id="volume" type="range" min="0" max="70"/);
 // soft clip: identity below the knee, monotonic, bounded by the ceiling
 assert.equal(core.softClip(.3),.3);assert.equal(core.softClip(-.5),-.5);
 let prev=-2;for(let x=-4;x<=4;x+=.01){const y=core.softClip(x);assert(y>=prev-1e-12&&Math.abs(y)<=A.clip.ceiling);prev=y;}
 const curve=core.softClipCurve();assert(curve.length>=1024&&Math.abs(curve[curve.length-1])<=A.clip.ceiling);
 // the master gain never exceeds the volume cap's value
 assert(core.audioParams(core.engines.v8,3000,.5,{volume:100}).master<=A.volumeMax/100*A.masterScale+1e-12);
 assert.doesNotMatch(script,/ratio\.value=12/);
});
test('harmonic band-limit: highest partial < sampleRate/2 (and ≤ sampleRate/4, 12 kHz) at max rpm, 44.1 and 48 kHz, every profile',()=>{
 for(const sr of [44100,48000]) for(const k of KEYS){const e=core.engines[k];
  for(const rpm of [e.idle,e.max*.5,e.max*.9,e.max]){
   const P=core.audioParams(e,rpm,1,{sampleRate:sr,character:1});
   const top=P.harmonics*(P.firing+P.flutterDepth);
   assert(top<sr/2,k+' '+sr+' rpm '+rpm+' top '+top);
   assert(top<=Math.min(sr/4,12000)+1e-9,k+' top '+top);
   assert(P.harmonics>=4&&P.harmonics<=47);
  }
  // per-rpm bands: low rpm keeps more harmonics than max rpm
  assert(core.audioParams(e,e.idle,0,{sampleRate:sr}).harmonics>=core.audioParams(e,e.max,1,{sampleRate:sr}).harmonics,k);
 }
 // band hysteresis: coming down holds the higher band until 8 % below the edge; going up switches at once
 const e=core.engines.v8,edge=core.WAVE_BANDS[1]*e.max;
 assert.equal(core.waveBand(e,edge*1.01,1),2);assert.equal(core.waveBand(e,edge*.97,2),2);assert.equal(core.waveBand(e,edge*.9,2),1);
});
test('sub-bass sits in the audible range and the flutter FM depth is capped',()=>{
 for(const k of KEYS){const e=core.engines[k];
  for(const rpm of [e.idle,e.max*.5,e.max]){const P=core.audioParams(e,rpm,.5,{character:1});
   assert(P.subF>=38&&P.subF<=160,k+' subF '+P.subF);
   assert(P.flutterDepth<=P.firing*core.AUDIO.flutterFrac+1e-9,k);
   assert(P.exhaustF<=core.AUDIO.lpHz);
   assert(P.intakeF>=250&&P.intakeF<=2000);}}
});
test('intake-noise slider: default 25 %, persisted per device, invalid values fall back',()=>{
 assert.match(html,/<input id="intakeNoise" type="range" min="0" max="100" value="25">/);
 assert.match(html,/Ruído de admissão/);
 const mem=v=>({getItem:()=>v});
 assert.equal(core.readNoisePref(null),25);assert.equal(core.readNoisePref(mem(null)),25);
 assert.equal(core.readNoisePref(mem('60')),60);assert.equal(core.readNoisePref(mem('250')),100);
 assert.equal(core.readNoisePref(mem('abc')),25);assert.equal(core.readNoisePref({getItem(){throw Error('denied');}}),25);
 assert.match(script,/setItem\('impulso\.intakeNoise'/);
});
async function pageAudioTest(){
 const nodes=[],waves=[];let sr=44100;
 const param=v=>({value:v,targets:[],setTargetAtTime(x){this.targets.push(x);this.value=x;},setValueAtTime(x){this.value=x;},cancelScheduledValues(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}});
 function node(kind,extra={}){const n={kind,out:[],connect(d){this.out.push(d);return d;},start(){},stop(){},...extra};nodes.push(n);return n;}
 class FakeAC{constructor(){this.sampleRate=sr;this.currentTime=0;this.state='running';this.destination=node('destination');}
  createGain(){return node('gain',{gain:param(1)});}
  createBiquadFilter(){return node('biquad',{frequency:param(350),Q:param(1),gain:param(0),typeName:''});}
  createDynamicsCompressor(){return node('comp',{threshold:param(-24),knee:param(30),ratio:param(12),attack:param(.003),release:param(.25)});}
  createWaveShaper(){return node('shaper',{curve:null,oversample:'none'});}
  createOscillator(){return node('osc',{frequency:param(440),setPeriodicWave(w){this.wave=w;}});}
  createBufferSource(){return node('buffer',{buffer:null,loop:false});}
  createBuffer(c,len,rate){const d=new Float32Array(len);return {getChannelData:()=>d,length:len,sampleRate:rate};}
  createPeriodicWave(re,im){const w={n:im.length-1};waves.push(w);return w;}
  resume(){return Promise.resolve();}close(){return Promise.resolve();}}
 const els={};
 for(const [,id] of html.matchAll(/id="([^"]+)"/g)) els[id]={id,textContent:'',hidden:false,value:'',checked:false,disabled:false,style:{},classList:{toggle(){},add(){},remove(){}},setAttribute(){},addEventListener(){},setPointerCapture(){},onclick:null};
 Object.assign(els.engine,{value:'v12'});els.target.value='0';els.throttle.value='45';els.volume.value='15';els.character.value='40';els.popsIntensity.value='40';els.gearStyle.value='comfort';els.intakeNoise.value='25';
 let raf=null,perf=1000;const store={};
 const ctx={document:{getElementById:id=>els[id],addEventListener(){},hidden:false},window:{isSecureContext:true,addEventListener(){},AudioContext:FakeAC,localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=v;}}},
  navigator:{geolocation:{watchPosition(){return 1;},clearWatch(){}},permissions:null},performance:{now:()=>perf},
  requestAnimationFrame:f=>{raf=f;return 1;},cancelAnimationFrame(){},Date,Math,Number,Set,Object,Array,String,Error,Float32Array,Promise,setTimeout,console};
 vm.runInNewContext(script,ctx);
 els.start.onclick();await new Promise(r=>setTimeout(r,0));
 const frames=n=>{for(let i=0;i<n;i++){perf+=50;raf(perf);}};
 frames(80); // 4 s idle (sim, target 0)
 const comp=nodes.find(n=>n.kind==='comp'),shaper=nodes.find(n=>n.kind==='shaper');
 assert(comp&&shaper,'compressor and waveshaper exist');
 assert.equal(nodes.filter(n=>n.kind==='comp').length,1);
 assert(comp.ratio.value<=4&&comp.threshold.value>=-12,'gentle compressor');
 assert.equal(shaper.oversample,'4x');assert(shaper.curve&&shaper.curve.length>=1024);
 assert.deepEqual(shaper.out.map(n=>n.kind),['destination']);
 const lp=nodes.find(n=>n.out.includes(comp)),hp=nodes.find(n=>n.out.includes(lp)),master=nodes.find(n=>n.out.includes(hp));
 assert.equal(lp.kind,'biquad');assert.equal(lp.type,'lowpass');assert.equal(hp.kind,'biquad');assert.equal(hp.type,'highpass');
 assert(lp.frequency.value>=6000&&lp.frequency.value<=8000,'LP '+lp.frequency.value);
 assert(hp.frequency.value>=30&&hp.frequency.value<=40,'HP '+hp.frequency.value);
 assert.equal(master.kind,'gain');
 // every source reaches the destination only through master → HP → LP → comp → clip
 assert.equal(nodes.filter(n=>n.out.some(d=>d.kind==='destination')).length,1);
 const noiseLp=nodes.find(n=>n.kind==='biquad'&&n.type==='lowpass'&&n.frequency.value===core.AUDIO.noiseLpHz);
 const noiseGain=noiseLp.out[0];
 assert(noiseGain.gain.value<=.0005,'idle noise gain '+noiseGain.gain.value);
 assert(master.gain.value>0&&master.gain.value<=.7*core.AUDIO.masterScale,'master '+master.gain.value);
 // accelerate hard: noise rises under load, new band-limited waves are created as rpm climbs
 els.target.value='200';els.throttle.value='100';
 frames(400);
 const peakNoise=Math.max(...noiseGain.gain.targets);
 assert(peakNoise>.002,'noise under load '+peakNoise);
 const e=core.engines.v12,allowed=new Set(core.WAVE_BANDS.map((_,b)=>core.bandHarmonics(e,b,sr,.4)));
 assert(waves.length>=2,'band switch created waves: '+waves.length);
 for(const w of waves) assert(allowed.has(w.n),'wave partials '+w.n+' not a band count');
 for(const w of waves){const band=core.WAVE_BANDS.findIndex((_,i)=>core.bandHarmonics(e,i,sr,.4)===w.n),top=core.WAVE_BANDS[band]*e.max;
  assert(w.n*(core.firingHz(e,top)*(1+core.AUDIO.flutterFrac))<sr/2,'partials vs Nyquist at the band top');}
 // slider persistence
 els.intakeNoise.value='60';
}
(async()=>{
 await pageAudioTest();count++;console.log('PASS page audio graph (fake AudioContext): master→HP→LP→gentle comp→4x soft clip, quiet idle noise, band-limited waves');
 console.log(`${count} tests passed; full inline JavaScript syntax valid. These tests cover logic and syntax only, not listening.`);
})().catch(err=>{console.error(err);process.exit(1);});
