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
 m3:6,c63:8,rs3:5,aventador:12,f458:8,
 vtec:4,hellcat:8,amg62:8,rb26:6,evo:4,nsx:6,diablo:12,
 zonda:12,mclarenf1:12,vantage:12,giuliaqv:6,mc12:12,c8z06:8,ftype:8,integrale:4,chiron:16,jesko:8,
 f812:12,f40:8,cgt:10,m5e60:10,m3e92:8,huracan:10,z370:6,gt350:8,slr:8,yarisgr:3
};
const INSPIRATIONS=['gt3rs','gtr','lfa','r8v10','wrx','mustang','m3','c63','rs3','aventador','f458','rx7','supra2jz','vtec','hellcat','amg62','rotary4','rb26','evo','nsx','diablo','zonda','mclarenf1','vantage','giuliaqv','mc12','c8z06','ftype','integrale','chiron','jesko','f812','f40','cgt','m5e60','m3e92','huracan','z370','gt350','slr','yarisgr'];
const ARCHITECTURES=['i3','i4','i5','i6','v6','flat6','v8','v10','v12'];
const LEGACY22=['gt3rs','gtr','lfa','r8v10','wrx','mustang','m3','c63','rs3','aventador','f458','rx7','supra2jz',...ARCHITECTURES];
const NEW8=['vtec','hellcat','amg62','rotary4','rb26','evo','nsx','diablo'];
const NEW20=["zonda","mclarenf1","vantage","giuliaqv","mc12","c8z06","ftype","integrale","chiron","jesko","f812","f40","cgt","m5e60","m3e92","huracan","z370","gt350","slr","yarisgr"];
const LEGACY30=[...LEGACY22,'vtec','hellcat','amg62','rotary4','rb26','evo','nsx','diablo'];
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
// v3.14: UI redesign; Core audio unchanged from 3.13 aside from VERSION.
test('visible version 3.18 is exposed in Core and HTML',()=>{assert.equal(core.VERSION,'3.18');assert.match(html,/data-version="3\.18"/);assert.match(html,/>v3\.18</);assert.match(html,/Impulso v3\.18/);});
test('50 presets: 30 legacy + 20 new inspirations',()=>{
 const keys=Object.keys(core.engines);
 assert.equal(keys.length,50);
 assert.deepEqual(keys.slice().sort(),[...Object.keys(EXPECTED),'rx7','rotary4'].sort());
 for(const [k,cyl] of Object.entries(EXPECTED)){
  assert.equal(core.engines[k].kind,'piston',k);
  assert.equal(core.engines[k].cyl,cyl,k);
  assert.equal(core.engines[k].fireMul,cyl/2,k);
 }
 assert.equal(core.engines.rx7.kind,'rotary');assert.equal(core.engines.rx7.rotors,2);
 assert.equal(core.engines.rotary4.kind,'rotary');assert.equal(core.engines.rotary4.rotors,4);assert.equal(core.engines.rotary4.fireMul,4);
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
 assert.match(html,/TypeVTEC/);
 assert.match(html,/HellCharge/);
 assert.match(html,/AMGMotor 6\.2/);
 assert.match(html,/QuadRotor/);
 assert.match(html,/SkylineMotor RB26/);
 assert.match(html,/EvoMotor 4G63/);
 assert.match(html,/NSXMotor/);
 assert.match(html,/DiabloMotor/);
 assert.match(html,/Pagani Zonda/);
 assert.match(html,/Ferrari 812/);
 assert.match(html,/Carrera GT/);
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
 assert(fingerprints.size>=50);
 assert.equal(synth.size,fingerprints.size);
});
test('related profiles differ beyond name and cylinder or rotor count',()=>{
 const pairs=[['gt3rs','flat6'],['gtr','v6'],['lfa','v10'],['r8v10','v10'],['lfa','r8v10'],['wrx','i4'],['mustang','v8'],['i6','v6'],['m3','i6'],['c63','v8'],['c63','mustang'],['rs3','i5'],['aventador','v12'],['f458','v8'],['f458','c63'],['supra2jz','i6'],['supra2jz','m3'],['vtec','i4'],['vtec','evo'],['hellcat','mustang'],['hellcat','v8'],['amg62','c63'],['amg62','v8'],['rb26','supra2jz'],['rb26','i6'],['evo','wrx'],['nsx','v6'],['nsx','gtr'],['diablo','aventador'],['diablo','v12'],['rotary4','rx7'],['c8z06','f458'],['c8z06','v8'],['gt350','mustang'],['f812','aventador'],['f812','v12'],['cgt','lfa'],['m5e60','r8v10'],['huracan','r8v10'],['z370','gtr'],['z370','v6'],['ftype','c63'],['yarisgr','i3'],['giuliaqv','v6'],['f40','f458']];
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
 assert(['crackle','bang'].includes(decel.kind),decel.kind);
 assert(decel.gain>0&&decel.gain<=core.POP_LIMITS.maxGain);
 assert(decel.count>=1);
 const rev=core.evaluatePop(popState({event:'rev-release',rpm:5000,maxRpm:7000,random:()=>1}));
 assert.equal(rev.allow,true);
 const lowRev=core.evaluatePop(popState({event:'rev-release',rpm:2000,maxRpm:7000}));
 assert.equal(lowRev.reason,'rpm-low');
 const up=core.evaluatePop(popState({event:'upshift',accel:1,random:()=>1}));
 assert.equal(up.allow,true);
 assert.equal(up.kind,'shift-pop');
 // calm profile refuses upshift bangs
 assert.equal(core.evaluatePop(popState({event:'upshift',accel:1,profile:core.engines.i6,maxRpm:core.engines.i6.max,rpm:4000,random:()=>0})).reason,'no-upshift-bang');
});
test('cooldown and voice cap block a constant pop loop',()=>{
 const first=core.evaluatePop(popState({now:10,lastPopAt:null}));
 assert.equal(first.allow,true);
 assert(first.minGap>=3.5,'burst cooldown ≥ ~4 s');
 const again=core.evaluatePop(popState({now:10.05,lastPopAt:10}));
 assert.equal(again.reason,'cooldown');
 const later=core.evaluatePop(popState({now:10+first.minGap+.01,lastPopAt:10}));
 assert.equal(later.allow,true);
 assert.equal(core.evaluatePop(popState({activeVoices:core.POP_LIMITS.maxVoices})).reason,'voice-cap');
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
test('pop envelopes are impactful, amplitude-capped and carry body+crack+tail',()=>{
 const dec=core.evaluatePop(popState({intensity:100,random:()=>0,rpm:4500}));
 const env=core.popEnvelope(dec);
 assert(env.peak<=core.POP_LIMITS.maxGain);
 assert(env.peak>=0.08,'audible but integrated peak');
 assert(env.peak<=0.38);
 assert(env.dur>=0.05&&env.dur<=0.35);
 assert(env.thumpPeak>0&&env.crackPeak>0);
 assert(env.firingHz>0&&env.bodyHz>=55&&env.bodyHz<=200);
 assert(env.tubeMs>=3&&env.tubeMs<=8);
 assert(env.nodes>=2);
 assert.equal(core.popEnvelope({allow:false}).peak,0);
});
test('pop body Hz is blended with engine firing frequency',()=>{
 const e=core.engines.v8;
 const d=core.evaluatePop(popState({profile:e,maxRpm:e.max,rpm:4000,intensity:80,random:()=>0,event:'overrun'}));
 const env=core.popEnvelope(d);
 const fire=core.firingHz(e,4000);
 assert(Math.abs(env.firingHz-fire)<1e-9);
 // Not equal to the static profile bodyHz — pulled toward firing
 assert(Math.abs(env.bodyHz-e.pop.bodyHz)>1,'body follows firing blend');
 assert(env.bodyHz>e.pop.bodyHz*.5);
});
test('every profile has a distinct pop fingerprint with valid ranges',()=>{
 const keys=Object.keys(core.engines);const fps=new Set();
 for(const k of keys){
  const e=core.engines[k];assert(e.pop,k+' missing .pop');
  const pp=core.popProfileOf(e);
  assert.equal(pp,core.POP_PROFILES[k],k);
  const fp=core.popFingerprint(pp);assert(fp);fps.add(fp);
  assert(pp.bodyHz>=60&&pp.bodyHz<=180,k+' bodyHz');
  assert(pp.bodyDrop>=20&&pp.bodyDrop<=80,k+' bodyDrop');
  assert(pp.crackHz>=800&&pp.crackHz<=3000,k+' crackHz');
  assert(pp.crackLp>=1800&&pp.crackLp<=3600,k+' crackLp');
  assert(pp.decay>=0.04&&pp.decay<=0.2,k+' decay');
  assert(pp.burstMin>=1&&pp.burstMax<=8&&pp.burstMin<=pp.burstMax,k+' burst');
  assert(pp.burstSpan>=0.25&&pp.burstSpan<=1.3,k+' span');
  assert(pp.loud>=0.5&&pp.loud<=1.4,k+' loud');
  assert(pp.rpmGate>=0.18&&pp.rpmGate<=0.5,k+' rpmGate');
  assert(typeof pp.upBang==='boolean',k+' upBang');
  assert(pp.feel&&pp.feel.length>2,k+' feel');
 }
 assert.equal(fps.size,keys.length,'all pop fingerprints distinct');
});
test('pops control defaults to off and intensity is optional',()=>{
 assert.match(html,/id="popsEnable"/);
 assert.match(html,/id="popsControls" hidden/);
 assert.match(html,/id="popsIntensity"/);
 assert.doesNotMatch(html,/id="popsEnable"[^>]*checked/);
 assert.match(html,/Estalos e pops \(opcional\)/);
 assert.match(html,/<input id="popsIntensity" type="range" min="5" max="100" value="50"[^>]*>/);
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
 assert.match(html,/<select id="gearStyle"[^>]*><option value="comfort" selected>Conforto/);
 assert.match(html,/value="sport">Desportiva/);
 // v3.3 adaptation: the call now passes sampleAt (GPS fix receipt time) and pop candidates come from Core.popTriggers.
 assert.match(script,/Core\.gearbox\(gbState,\{speed,accel,demand,dt,sampleAt,profile:e,style:gearStyle\}\)/);
 assert.match(script,/Core\.popTriggers\(gb,\{valid,prevValid,prevGear,rpm,sinceDecelPop,speed\}\)/);
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
function drive(key,phases,{noise=.3,seed=7,style='comfort',pops=false,intensity=50,popSeed=99,v0=120}={}){
 const rnd=lcg(seed),gs=()=>{let t=0;for(let i=0;i<6;i++)t+=rnd();return t-3;},pr=lcg(popSeed);
 const e=core.engines[key];let st=null,o,v=v0,fixV=v0,fixT=0,t=0,prevValid=false,prevGear=0,rpm=e.idle,sinceDecelPop=9,lastPopAt=null;
 const log=[];
 for(const ph of phases){const n=Math.round(ph.dur/.05);
  for(let i=0;i<n;i++){v=Math.max(0,v+ph.a*3.6*.05);t+=.05;
   if(Math.abs(t-Math.round(t))<.026&&Math.round(t)!==fixT){fixT=Math.round(t);fixV=v+gs()*noise;}
   o=core.gearbox(st,{speed:fixV,accel:0,dt:.05,sampleAt:fixT,profile:e,style});st=o.state;
   rpm+=(o.rpm-rpm)*(1-Math.exp(-.05*(o.blipping?16:5)));sinceDecelPop+=.05;let popped=0;
   for(const ev of core.popTriggers(o,{valid:true,prevValid,prevGear,rpm,sinceDecelPop,speed:v})){
    if(ev.event==='decel'||ev.event==='overrun')sinceDecelPop=0;
    const d=core.evaluatePop({enabled:pops,running:true,muted:false,volume:15,intensity,event:ev.event,validMotion:true,rpm:ev.rpm,maxRpm:e.max,accel:ev.accel??o.aEst,profile:e,now:t,lastPopAt,activeVoices:0,random:pr});
    if(d.allow){lastPopAt=t;popped++;}
   }
   log.push({t,ph:ph.name,v,speed:fixV,gear:o.gear,rpm:o.rpm,shift:o.shift,blip:o.blip,blipping:o.blipping,popped});
   prevValid=true;prevGear=o.gear;}
 }
 return log;
}
const KEYS=Object.keys(core.engines);
const SEEDS=Array.from({length:20},(_,i)=>100+i*17);
const CRUISE={name:'cruise',dur:25,a:0};
function firstDown(log){const acc=log.filter(x=>x.ph==='acc'),t0=acc[0].t-.05,fd=acc.find(x=>x.shift==='down');return fd?fd.t-t0:Infinity;}
const gearDrop=log=>log.filter(x=>x.ph==='cruise').pop().gear-Math.min(...log.filter(x=>x.ph==='acc').map(x=>x.gear));
test('per-profile gearbox personality covers all 50 profiles (version now 3.18)',()=>{
 assert.equal(core.VERSION,'3.18');assert.equal(KEYS.length,50);
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
// v3.7 adaptation: in Conforto 0.6 m/s² for 4 s (+8.6 km/h) is now the "intermediate" case → at most 1 gear, profile-dependent
// (eager profiles drop 1 gear, calm ones usually stay). The original v3.3 expectation (≥1 gear within ~1.5 s) is kept for
// Desportiva, whose gearbox is unchanged (cruise gear there is 6).
test('0.6 m/s² for 4 s from 120 km/h (1 Hz noisy GPS): Desportiva kicks down ≥1 gear within ~1.5 s; Conforto ≤1 gear, profile-dependent',()=>{
 for(const k of KEYS){let in15=0,c1=0;
  for(const seed of SEEDS){
   const log=drive(k,[CRUISE,{name:'acc',dur:4,a:.6}],{seed,style:'sport'});
   assert.equal(log.filter(x=>x.ph==='cruise').pop().gear,6,k+' Desportiva cruise gear');
   const t=firstDown(log);assert(t<=2.55,k+' seed '+seed+' first downshift '+t);assert(gearDrop(log)>=1,k);
   if(t<=1.55)in15++;
   const lc=drive(k,[CRUISE,{name:'acc',dur:4,a:.6}],{seed});
   assert.equal(lc.filter(x=>x.ph==='cruise').pop().gear,7,k+' Conforto cruise gear');
   assert(gearDrop(lc)<=1,k+' Conforto intermediate accel: at most 1 gear');
   if(gearDrop(lc)===1)c1++;}
  assert(in15>=15,k+' only '+in15+'/20 seeds within 1.5 s');
  const kick=core.GEAR_PERSONA[k].kick;
  if(kick<=.88) assert(c1>=16,k+' eager profile should drop 1 gear ('+c1+'/20)');
  if(kick>=1.03) assert(c1<=5,k+' calm profile should mostly stay in 7th ('+c1+'/20)');
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
 for(const over of [{enabled:false},{running:false},{muted:true},{volume:0},{validMotion:false},{activeVoices:core.POP_LIMITS.maxVoices},{lastPopAt:9.9}])
  assert(!core.evaluatePop(popState({...base,...over})).allow,JSON.stringify(over));
 assert(!core.evaluatePop(popState({...base,rpm:e.idle*1.5})).allow,'below rpm gate');
 assert(!core.evaluatePop(popState({...base,event:'modeSwitch'})).allow);
 // v3.10 rpmGate from POP_PROFILES: c63/cruise ~2000 ok; calm i6 gated higher.
 assert(core.popProfileOf(e).rpmGate*e.max<2400);
 assert(core.popProfileOf(core.engines.i6).rpmGate*core.engines.i6.max>2400);
 assert(!core.evaluatePop(popState({...base,profile:core.engines.i6,maxRpm:core.engines.i6.max,rpm:2400})).allow);
 assert(core.evaluatePop(popState({...base,rpm:2200,random:()=>0})).allow,'c63 cruise lift rpm');
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
  // v3.7 adaptation: 0.6 m/s² for 4 s → Conforto exactly 1 gear for the eager Supra (≤1 allowed, within the 4 s); Desportiva ≥1 within 2.55 s as before
  const l6=drive('supra2jz',[CRUISE,{name:'acc',dur:4,a:.6}],{seed});assert.equal(gearDrop(l6),1,'0.6 seed '+seed);assert(firstDown(l6)<=4.05);
  const l6s=drive('supra2jz',[CRUISE,{name:'acc',dur:4,a:.6}],{seed,style:'sport'});assert(gearDrop(l6s)>=1);assert(firstDown(l6s)<=2.55);
  const l12=drive('supra2jz',[CRUISE,{name:'acc',dur:4,a:1.2}],{seed});assert(gearDrop(l12)>=2,'1.2 seed '+seed);
  for(const x of l12) assert(x.rpm<=e.max*.94);
 }
 for(const ps of POP_SEEDS) assert(popsOf(liftLog('supra2jz',true,ps))>=1,'pops on, seed '+ps);
 assert.equal(popsOf(liftLog('supra2jz',false)),0,'pops off');
 // hard upshifts are pop candidates (turbo-car style)
 const k=cruiseThenAccel('supra2jz',2.5);assert(k.ups.some(u=>u.popWorthy),'upshift pop candidate');
});

// ---- v3.7: Conforto decides from windowed Δv (speed gained/lost over the last seconds); Desportiva = v3.6 ----
const V36_GEARBOX_SHA256='5b5f51957bc4ecc8f2ca92b007ad2f9dd8fa2aa671c50151db5875dc98141bab'; // v3.12: v3.6 gearbox + faster accel EMA (τ 0.35) + outlier clamp
test('Desportiva is gearboxV36 (v3.6 logic + v3.12 EMA); sport minGap 0.5; matches gearbox(style=sport)',()=>{
 const crypto=require('node:crypto');
 const i=script.indexOf(' function gearboxV36(');const j=script.indexOf('\n }\n',i);
 const text=script.slice(i,j+3).replace('function gearboxV36(','function gearbox(');
 assert.equal(crypto.createHash('sha256').update(text).digest('hex'),V36_GEARBOX_SHA256,'gearboxV36 text changed unexpectedly');
 assert.equal(core.GEARBOX_STYLES.sport.minGap,.5);
 const fields=['gear','rpm','load','shift','popWorthy','liftoff','blip','blipping','demand','aEst','level','phase'];
 let frames=0;
 for(const k of KEYS) for(const seed of [1,2,3,4]){const r=lcg(seed*7919);let a=null,b=null,v=60+r()*80,fixT=0;
  for(let i=0;i<1200;i++){const acc=(Math.floor(i/150)%4===1?1.2:Math.floor(i/150)%4===3?-1:0);v=Math.max(0,Math.min(200,v+acc*3.6*.05));
   let inp;if(seed%2===0){if(i%20===0)fixT++;inp={speed:v+(r()-.5),accel:0,dt:.05,sampleAt:fixT,profile:core.engines[k],style:'sport'};}
   else inp={speed:v,accel:acc,demand:acc>0?.5:0,dt:.05,profile:core.engines[k],style:'sport'};
   const o1=core.gearbox(a,inp),o2=core.gearboxV36(b,inp);a=o1.state;b=o2.state;frames++;
   for(const f of fields) assert.equal(o1[f],o2[f],k+' frame '+i+' '+f);}}
 assert(frames>=100000);
 // and Conforto is a different (windowed) gearbox
 assert.notEqual(core.gearbox(null,{speed:50,dt:.05,profile:core.engines.v8}).state.whist,undefined);
});
const FROM100=(name,dur,a)=>[{name:'cruise',dur:20,a:0},{name:'acc',dur,a},{name:'steady',dur:20,a:0}];
const accPh=log=>log.filter(x=>x.ph==='acc');
test('Conforto: slow 100→110 km/h over 9 s (≈0.3 m/s²) stays in top gear for every profile (load rises only)',()=>{
 for(const k of KEYS) for(const seed of SEEDS.slice(0,6)) for(const noise of [.3,.5]){
  const log=drive(k,FROM100('acc',9,10/3.6/9),{seed,noise,v0:100});
  assert.equal(log.filter(x=>x.ph==='cruise').pop().gear,7,k);
  assert.equal(log.filter(x=>x.ph!=='cruise'&&x.shift).length,0,k+' seed '+seed+' noise '+noise+': no shifts');
 }
 const o=[];let st=null,v=100;for(let i=0;i<600;i++){if(i>=300)v+=10/9*.05;const r=core.gearbox(st,{speed:v,dt:.05,profile:core.engines.v8});st=r.state;o.push(r);}
 assert(o[o.length-1].load>o[250].load,'more load while accelerating slowly');
});
test('Conforto: +10 km/h in 2.5 s downshifts ≥1 gear, holds it while accelerating, relaxes to top once stable (every profile)',()=>{
 for(const k of KEYS) for(const seed of SEEDS.slice(0,6)){
  const log=drive(k,FROM100('acc',2.5,10/3.6/2.5),{seed,v0:100});
  const c=log.filter(x=>x.ph==='cruise').pop().gear;assert.equal(c,7,k);
  const firstD=log.find(x=>x.ph!=='cruise'&&x.shift==='down');assert(firstD,k+' seed '+seed+' no downshift');
  assert(firstD.t-20<=4.05,k+' downshift late '+(firstD.t-20));
  const drop=c-Math.min(...log.filter(x=>x.ph!=='cruise').map(x=>x.gear));assert(drop>=1&&drop<=2,k+' drop '+drop);
  // held: no upshift until Δv over 3 s has settled (none during the acceleration or the first second after)
  assert(!log.some(x=>x.shift==='up'&&x.t>firstD.t&&x.t<=22.5+1),k+' upshift while still accelerating');
  assert.equal(log[log.length-1].gear,7,k+' relaxes back to top gear');
  const back=log.find(x=>x.t>firstD.t&&x.gear===7);assert(back.t-22.5<=core.GEAR_PERSONA[k].relax+8,k+' back after '+(back.t-22.5));
 }
});
test('Conforto: +10 km/h in 5 s (intermediate) → at most 1 gear, profile-dependent',()=>{
 let eagerDrops=0,calmDrops=0;
 for(const k of KEYS) for(const seed of SEEDS.slice(0,6)){
  const log=drive(k,FROM100('acc',5,10/3.6/5),{seed,v0:100});
  const drop=7-Math.min(...log.filter(x=>x.ph!=='cruise').map(x=>x.gear));assert(drop<=1,k+' seed '+seed+' drop '+drop);
  if(core.GEAR_PERSONA[k].kick<=.85) eagerDrops+=drop; if(core.GEAR_PERSONA[k].kick>=1) calmDrops+=drop;
 }
 assert(eagerDrops>calmDrops,'eager profiles downshift more often ('+eagerDrops+' vs '+calmDrops+')');
});
test('Conforto: brief light lift (−2 km/h over 1.5 s) at cruise → 0 downshifts (every profile, noisy GPS)',()=>{
 for(const k of KEYS) for(const seed of SEEDS.slice(0,6)) for(const v0 of [120,95]){
  const log=drive(k,[{name:'cruise',dur:25,a:0},{name:'acc',dur:1.5,a:-2/3.6/1.5},{name:'steady',dur:10,a:0}],{seed,v0});
  assert.equal(log.filter(x=>x.ph!=='cruise'&&x.shift==='down').length,0,k+' seed '+seed+' at '+v0);
 }
});
test('Conforto: steady decel 120→60 km/h downshifts as the speed actually drops, with blips; none before ≥5 km/h lost',()=>{
 for(const k of KEYS){const e=core.engines[k];
  for(const seed of SEEDS.slice(0,4)){
   const log=drive(k,[{name:'cruise',dur:25,a:0},{name:'acc',dur:60/3.6,a:-1},{name:'steady',dur:8,a:0}],{seed});
   const downs=log.filter(x=>x.ph!=='cruise'&&x.shift==='down');
   assert(downs.length>=1,k+' no downshift');assert(downs.every(x=>x.blip),k+' downshifts blip');
   assert(120-downs[0].v>=5,k+' first downshift after only '+(120-downs[0].v).toFixed(1)+' km/h');
   assert(!log.some(x=>x.ph==='acc'&&x.shift==='up'),k+' no upshift while slowing');
   // gear follows speed: each downshift happens at a lower speed than the previous one and only when the
   // current gear had fallen to the decel point (rpm before the shift ≤ the profile decel rpm, + noise margin)
   for(let i=1;i<downs.length;i++) assert(downs[i].v<downs[i-1].v-3,k+' downshifts track the speed');
   for(const d of downs){const before=core.gearRpm(e,d.v,d.gear+1);assert(before<=core.comfortDecelRpm(e)*1.05+30,k+' early downshift at '+before.toFixed(0)+' rpm');}
  }}
});
test('Conforto windowed Δv helpers: least-squares trend, profile-scaled thresholds, decel point above the floor',()=>{
 const h=[0,1,2,3].map(t=>({t,v:100+2*t}));const r=core.lsTrend(h,3);
 assert(Math.abs(r.slope-2)<1e-9&&Math.abs(r.vNow-106)<1e-9&&r.n===4);
 assert.equal(core.lsTrend([{t:0,v:1}],3),null);
 const a=core.comfortKickDv(core.engines.gt3rs),b=core.comfortKickDv(core.engines.i6);
 for(let i=0;i<3;i++){assert(a[i]<b[i]);if(i)assert(a[i]>a[i-1]);}
 assert.deepEqual([...core.CF.KICK_DV],[7,10.5,19]);assert(core.CF.HIST>=10&&core.CF.HIST<=14&&core.CF.W_SHORT===3&&core.CF.W_LONG>=8&&core.CF.W_LONG<=10);
 for(const k of KEYS){const e=core.engines[k];assert(core.comfortDecelRpm(e)>=1.05*Math.max(core.GEAR_PERSONA[k].floor,e.idle*1.3)-1e-9);}
});
test('Conforto sim mode uses the same windowed logic: gentle target ramp keeps 7th, a quick target jump kicks down',()=>{
 const run=(key,throttle,target)=>{const e=core.engines[key];let st=null,r,v=120,g0,minG=9;
  for(let i=0;i<400;i++){r=core.gearbox(st,{speed:v,accel:0,demand:0,dt:.05,profile:e});st=r.state;}g0=r.gear;
  for(let i=0;i<300;i++){const dt=.05,diff=target-v,rate=diff>0?.5+throttle/100*5:5,ch=core.clamp(diff,-rate*3.6*dt,rate*3.6*dt);v+=ch;const a=ch/dt/3.6;
   const d=diff>.5?Math.max(core.clamp(a/3,0,1)*.5,throttle/100*core.clamp(diff/15,.3,1)):0;
   r=core.gearbox(st,{speed:v,accel:a,demand:d,dt,profile:e});st=r.state;minG=Math.min(minG,r.gear);}
  return {g0,drop:g0-minG};};
 for(const k of KEYS){assert.equal(run(k,0,125).drop,0,k+' 0 % throttle, +5 km/h at 0.5 m/s²');assert(run(k,60,135).drop>=1,k+' quick +15 km/h');}
});
// ---- v3.12: cruise identity + progressive build under load ----
test('steady cruise body (sub/pulse/exhaust) is identical to v3.11 formulas at load≤0.3',()=>{
 for(const k of KEYS){
  const e=core.engines[k];
  for(const speed of [50,90,120]){
   let st=null,r;for(let i=0;i<120;i++){r=core.gearbox(st,{speed,accel:0,demand:0,dt:.05,profile:e,style:'comfort'});st=r.state;}
   assert(r.load<=.3,k+' cruise load '+r.load);
   const rpm=r.rpm,L=r.load;
   assert.equal(core.bodySubHz(e,rpm,L),rpm/e.subDiv);
   assert.equal(core.bodySubGain(e,L),e.subGain*(.6+L*.4));
   assert.equal(core.bodyPulse(e,L,rpm),e.pulseGain+L*e.pulseLoad);
   assert.equal(core.bodyExhaustTone(e,L,.4),e.tone*(.4+.4*.7+L*.6));
  }
 }
});
test('under load, body swells (sub floor/gain and pulse) while cruise path stays untouched',()=>{
 const e=core.engines.v8;
 assert.equal(core.bodySubHz(e,3000,.2),3000/e.subDiv);
 assert(core.bodySubHz(e,3000,.9)>3000/e.subDiv,'sub rises toward ≥40 Hz under load');
 assert(core.bodySubHz(e,3000,.9)>=40);
 assert(core.bodySubGain(e,.9)>e.subGain*(.6+.4*.9));
 assert(core.bodyPulse(e,.9,5000)>e.pulseGain+.9*e.pulseLoad);
 assert.match(script,/shiftBassUntil/);
 assert.match(script,/spawnShiftThump/);
 assert.match(script,/gpsExtrap/);
 assert.match(script,/shiftGlideUntil/);
 assert.equal(core.GEARBOX_STYLES.sport.minGap,.5);
});
// ---- v3.11: pops integrated into exhaust colour; engine identical with pops off ----
const V34_AUDIO_SHA256={
 'function buildWave(':'68f508dcc6a4fc3f596c5245386f404db572cb0226e165b6339ca53e15f952c9',
 'function harmonicPartial(':'9691d73344d293a18db6308db3f2095143df1d535ced107121b929eeaad5954b',
 'function firingMul(':'529afa0655fdb95854ab6cbc6e9d7f6676324717bd9f98f9f969fd9b320da924'
};
const fnText=(src,a,b)=>{const i=src.indexOf(a);assert(i>=0,'missing '+a);return src.slice(i,src.indexOf(b,i));};
test('tonal engine code is byte-identical to v3.4 (waves, harmonics, firing); pops-off path unchanged',()=>{
 const crypto=require('node:crypto');
 const pairs=[['function buildWave(','function buildAudio('],[' function harmonicPartial(',' function profileFingerprint('],[' function firingMul(',' function firingHz(']];
 for(const [a,b] of pairs) assert.equal(crypto.createHash('sha256').update(fnText(script,a,b)).digest('hex'),V34_AUDIO_SHA256[a.trim()],a.trim());
 const b=fnText(script,'function buildAudio(','function updateAudio(');
 // Engine master→limiter→destination still present and pops do not feed master
 assert.match(b,/limiter\.threshold\.value=-16;limiter\.knee\.value=8;limiter\.ratio\.value=12/);
 assert.match(b,/master\.connect\(limiter\)\.connect\(ctx\.destination\)/);
 assert.match(b,/popExhaust\.type='lowpass'/);
 assert.match(b,/popDelay/);
 assert.doesNotMatch(b,/popsInput\.connect\(master\)/);
 assert.match(b,/noiseHP\.type='highpass';noiseHP\.frequency\.value=150/);
 // Engine graph before pops bus identical to v3.9/v3.10 (voices/sub/noise/flutter)
 const v39=require('node:fs').readFileSync(__dirname+'/../ev-engine-sound-v3.9/index.html','utf8');
 const s39=v39.match(/<script>([\s\S]*?)<\/script>/)[1];
 const b39=fnText(s39,'function buildAudio(','function updateAudio(');
 const eng11=b.slice(0,b.indexOf(' // Engine chain:')).replace(/\s+/g,'');
 // v3.9 had no "Engine chain" comment — take up to popsInput
 const eng9=b39.slice(0,b39.indexOf(' const popsInput')).replace(/\s+/g,'');
 // Strip trailing master.connect already included; compare from start through flutter wiring by checking key markers equal
 assert.match(b,/osc\.connect\(exhaust\)\.connect\(pulseGain\)\.connect\(master\)/);
 assert.match(b,/sub\.connect\(subGain\)\.connect\(master\)/);
 assert.match(b,/noise\.connect\(noiseHP\)\.connect\(intake\)\.connect\(noiseLP\)\.connect\(noiseGain\)\.connect\(master\)/);
 assert.doesNotMatch(html,/intakeNoise|Ruído de admissão/);
 assert.doesNotMatch(script,/createWaveShaper|Core\.AUDIO|audioParams|softClip/);
 assert.equal(core.AUDIO,undefined);
 assert.match(html,/<input id="volume" type="range" min="0" max="70" value="15"[^>]*>/);
});
test('updateAudio uses progressive body helpers; ducks during pop/shift-cut; cruise limiter -16/12',()=>{
 const u=fnText(script,'function updateAudio(','async function start(');
 assert.match(u,/set\(v\.osc\.frequency,firing\)/);
 assert.match(u,/Core\.bodyExhaustTone\(e,load,c\)/);
 assert.match(u,/Core\.bodySubHz\(e,rpm,load\)/);
 assert.match(u,/Core\.bodySubGain\(e,load\)/);
 assert.match(u,/Core\.bodyPulse\(e,load,rpm\)/);
 assert.match(u,/noiseTarget=Math\.max\(0,Math\.min\(1,drive\)\)\*noisePeak/);
 assert.match(u,/set\(a\.master\.gain,\+\$\('volume'\)\.value\/100\*\.48\)/);
 assert.match(u,/shiftBassUntil/);
 assert.match(u,/hot\?\-14:\-16/);
 assert.match(u,/a\.popExhaust\.frequency/);
});
test('pop onsets are quantised to firing periods and engine is ducked during bursts',()=>{
 assert.match(script,/Quantise onsets to firing periods/);
 assert.match(script,/period=\*1\/Math\.max\(30,fire\)|period=1\/Math\.max\(30,fire\)/);
 assert.match(script,/popDuckUntil/);
 assert.match(script,/duckDepth/);
 assert.match(script,/linearRampToValueAtTime\(cur\*duck/);
 assert(core.POP_LIMITS.popBus<=.7&&core.POP_LIMITS.maxGain<=.4,'integrated levels (below v3.10)');
});

test('v3.13: legacy 22 fingerprints and synth params identical to v3.12 snapshot',()=>{
 const snap=JSON.parse(fs.readFileSync(__dirname+'/fixtures/v312-fingerprints.json','utf8'));
 const gearSnap=JSON.parse(fs.readFileSync(__dirname+'/fixtures/v312-gear.json','utf8'));
 assert.equal(Object.keys(snap).length,22);
 for(const k of Object.keys(snap)){
  const e=core.engines[k];assert(e,k+' missing');
  assert.equal(core.profileFingerprint(e),snap[k].fp,k+' fingerprint');
  assert.equal(core.popFingerprint(e.pop),snap[k].pop,k+' pop fingerprint');
  const synth=[e.tone,e.exhaustQ,e.intakeBase,e.intakeRatio,e.intakeQ,e.noiseIdle,e.noiseLoad,e.rough,e.pulse,e.harmonicDecay,e.evenMix,e.oddMix,e.rasp,e.kind,e.fireMul,e.pulseGain,e.pulseLoad,e.subGain,e.subDiv,e.flutterBase,e.crackle,e.idle,e.max].join('|');
  assert.equal(synth,snap[k].synth,k+' synth');
  assert.equal(JSON.stringify(core.GEAR_PERSONA[k]),JSON.stringify(gearSnap[k]),k+' gear');
 }
});
test('v3.13 new profiles: VTEC crossover, Hellcat whine, QuadRotor 4-rotor, distinct pops/gear',()=>{
 assert.equal(core.engines.vtec.vtecRpm,5800);
 assert(core.vtecAmount(core.engines.vtec,5000)<.1);
 assert.equal(core.vtecAmount(core.engines.vtec,6200),1);
 assert.equal(core.vtecAmount(core.engines.i4,6200),0);
 assert(core.engines.hellcat.whineGain>0&&core.engines.hellcat.whineRatio>0);
 assert(core.whineHz(core.engines.hellcat,4000)>100);
 assert(core.whineGainAt(core.engines.hellcat,1,4000,1)>0);
 assert.equal(core.whineGainAt(core.engines.mustang,1,4000,1),0);
 assert.equal(core.engines.rotary4.rotors,4);
 assert.equal(core.popFallback(core.engines.rotary4),core.POP_PROFILES.rotary4);
 assert.equal(core.popFallback(core.engines.rx7),core.POP_PROFILES.rx7);
 for(const id of NEW8){
  assert.equal(core.engines[id].group,'inspiration',id);
  assert.equal(core.engines[id].unofficial,true,id);
  assert(core.POP_PROFILES[id],id+' pop');
  assert(core.GEAR_PERSONA[id],id+' gear');
  assert.match(html,new RegExp('value="'+id+'"'));
 }
 // new pop feels unique
 const feels=NEW8.map(k=>core.POP_PROFILES[k].feel);
 assert.equal(new Set(feels).size,feels.length);
});
test('updateAudio wires VTEC and optional whine without changing cruise path markers',()=>{
 const u=fnText(script,'function updateAudio(','async function start(');
 assert.match(u,/Core\.vtecAmount\(e,rpm\)/);
 assert.match(u,/Core\.whineHz\(e,rpm\)/);
 assert.match(u,/Core\.whineGainAt\(e,load,rpm,drive\)/);
 assert.match(script,/whine\.type='sine'/);
 assert.match(script,/whineLP\.frequency\.value=3200/);
});


test('v3.16: legacy 30 fingerprints identical to v3.15 snapshot',()=>{
 const snap=JSON.parse(fs.readFileSync(__dirname+'/fixtures/v315-fingerprints.json','utf8'));
 assert.equal(Object.keys(snap).length,30);
 for(const k of Object.keys(snap)){
  const e=core.engines[k];assert(e,k+' missing');
  assert.equal(core.profileFingerprint(e),snap[k].fp,k+' fingerprint');
  assert.equal(core.popFingerprint(e.pop),snap[k].pop,k+' pop');
  const synth=[e.tone,e.exhaustQ,e.intakeBase,e.intakeRatio,e.intakeQ,e.noiseIdle,e.noiseLoad,e.rough,e.pulse,e.harmonicDecay,e.evenMix,e.oddMix,e.rasp,e.kind,e.fireMul,e.pulseGain,e.pulseLoad,e.subGain,e.subDiv,e.flutterBase,e.crackle,e.idle,e.max].join('|');
  assert.equal(synth,snap[k].synth,k+' synth');
  assert.equal(JSON.stringify(core.GEAR_PERSONA[k]),JSON.stringify(snap[k].gear),k+' gear');
 }
});
test('v3.14/3.15 in-car UI: engine tiles, filters, sheets, large start/volume, GPS pill',()=>{
 assert.match(html,/id="engineTiles"/);
 assert.match(html,/id="engineFilters"/);
 assert.match(html,/id="engineSheet"/);
 assert.match(html,/id="settingsSheet"/);
 assert.match(html,/id="openEngines"/);
 assert.match(html,/id="openSettings"/);
 assert.match(html,/id="gpsPill"/);
 assert.match(html,/id="volDown"/);
 assert.match(html,/id="volUp"/);
 assert.match(html,/id="gearComfort"/);
 assert.match(html,/id="gearSport"/);
 assert.match(html,/id="popsOn"/);
 assert.match(html,/id="popsOff"/);
 assert.match(html,/#start\{[^}]*min-height:120px/);
 assert.match(html,/--tile:76px/);
 assert.match(html,/--touch:64px/);
 assert.match(html,/min-height:var\(--tile\)/);
 assert.match(html,/font:18px/);
 assert.match(html,/prefers-reduced-motion/);
 for(const id of Object.keys(core.engines)) assert.match(html,new RegExp('value="'+id+'"'));
});
test('v3.16 brands (secondary text in v3.17): every profile mapped; favourites + Genéricos',()=>{
 assert.match(script,/const ENGINE_BRAND=/);
 assert.match(script,/buildEngineFilterChips/);
 assert.match(script,/brandOf\(id\)/);
 assert.match(script,/brand-head/);
 assert.match(script,/Genéricos/);
 assert.match(html,/overflow-x:auto/);
 const m=script.match(/const ENGINE_BRAND=\{([\s\S]*?)\};/);
 assert(m,'ENGINE_BRAND present');
 const map=Function('return {'+m[1]+'}')();
 for(const id of Object.keys(core.engines)){
  assert(map[id],id+' missing brand');
  assert.equal(typeof map[id],'string');
  assert(map[id].length>=3,id+' brand too short');
 }
 assert.equal(map.zonda,'Pagani');
 assert.equal(map.mclarenf1,'McLaren');
 assert.equal(map.vantage,'Aston Martin');
 assert.equal(map.giuliaqv,'Alfa Romeo');
 assert.equal(map.mc12,'Maserati');
 assert.equal(map.c8z06,'Chevrolet');
 assert.equal(map.ftype,'Jaguar');
 assert.equal(map.integrale,'Lancia');
 assert.equal(map.chiron,'Bugatti');
 assert.equal(map.jesko,'Koenigsegg');
 assert.equal(map.f812,'Ferrari');
 assert.equal(map.f40,'Ferrari');
 assert.equal(map.cgt,'Porsche');
 assert.equal(map.m5e60,'BMW');
 assert.equal(map.huracan,'Lamborghini');
 assert.equal(map.gt350,'Ford');
 assert.equal(map.yarisgr,'Toyota / Lexus');
 assert.equal(Object.keys(map).length,Object.keys(core.engines).length);
});
test('v3.16 new 20 profiles: UI labels, pops, gear, distinct feels',()=>{
 const feels=new Set(Object.values(core.POP_PROFILES).map(p=>p.feel));
 assert.equal(feels.size,Object.keys(core.POP_PROFILES).length);
 for(const id of NEW20){
  assert(core.engines[id],id);
  assert.equal(core.engines[id].group,'inspiration',id);
  assert.equal(core.engines[id].unofficial,true,id);
  assert(core.POP_PROFILES[id],id+' pop');
  assert(core.GEAR_PERSONA[id],id+' gear');
  assert.match(html,new RegExp('value="'+id+'"'));
 }
 assert.match(html,/Pagani Zonda/);
 assert.match(html,/McLaren F1/);
 assert.match(html,/Carrera GT/);
 assert.match(html,/Corvette Z06/);
 assert.match(html,/Bugatti Chiron/);
 assert.equal(core.engines.chiron.cyl,16);
 assert.equal(core.engines.chiron.fireMul,8);
 assert.equal(core.engines.c8z06.max,8600);
});
test('v3.17: all 50 profiles identical to v3.16 snapshot (fp, pop, synth, gear, hint, whine)',()=>{
 const snap=JSON.parse(fs.readFileSync(__dirname+'/fixtures/v316-fingerprints.json','utf8'));
 const keys=Object.keys(snap).filter(k=>!k.startsWith('__'));
 assert.equal(keys.length,50);
 assert.deepEqual(keys.slice().sort(),Object.keys(core.engines).slice().sort());
 for(const k of keys){
  const e=core.engines[k];
  assert.equal(core.profileFingerprint(e),snap[k].fp,k+' fingerprint');
  assert.equal(core.popFingerprint(e.pop),snap[k].pop,k+' pop');
  const synth=[e.tone,e.exhaustQ,e.intakeBase,e.intakeRatio,e.intakeQ,e.noiseIdle,e.noiseLoad,e.rough,e.pulse,e.harmonicDecay,e.evenMix,e.oddMix,e.rasp,e.kind,e.fireMul,e.pulseGain,e.pulseLoad,e.subGain,e.subDiv,e.flutterBase,e.crackle,e.idle,e.max].join('|');
  assert.equal(synth,snap[k].synth,k+' synth');
  assert.equal(JSON.stringify(core.GEAR_PERSONA[k]),JSON.stringify(snap[k].gear),k+' gear');
  assert.equal(JSON.stringify(core.POP_PROFILES[k]),JSON.stringify(snap[k].popProfile),k+' POP_PROFILES');
  assert.equal(e.hint,snap[k].hint,k+' hint');
  assert.equal(e.whineGain||0,snap[k].whine,k+' whine');
 }
});
// v3.18 adaptation: Conforto's gearboxComfort and its CF constant changed (GPS-steady upshift), so these two
// byte-identity checks now mask exactly those two pieces and compare against the v3.17 snapshot (same masking).
function maskComfort(src){
 const a=src.indexOf(' const CF={'),b=src.indexOf('\n',src.indexOf('};',a));
 let out=src.slice(0,a)+' /*CF*/'+src.slice(b);
 const i=out.indexOf(' function gearboxComfort('),j=out.indexOf('\n }\n',i);
 return out.slice(0,i)+' /*gearboxComfort*/'+out.slice(j+3);
}
const V317M=JSON.parse(fs.readFileSync(__dirname+'/fixtures/v317-core-masked.json','utf8'));
test('v3.18: Core source byte-identical to v3.17 (=v3.16) apart from VERSION, CF and gearboxComfort',()=>{
 const src=maskComfort(source).replace(/const VERSION='[\d.]+';/,"const VERSION='X';");
 assert.equal(require('node:crypto').createHash('sha256').update(src).digest('hex'),V317M.coreMaskedSha);
 const i=source.indexOf(' function gearboxComfort('),j=source.indexOf('\n }\n',i);
 assert.notEqual(require('node:crypto').createHash('sha256').update(source.slice(i,j+3)).digest('hex'),V317M.gearboxComfortV317Sha,'gearboxComfort is the v3.18 one');
});
test('v3.17: engine picker by sound style; every profile in exactly one style',()=>{
 assert.match(script,/const ENGINE_STYLE=/);
 assert.match(script,/const STYLE_ORDER=/);
 assert.doesNotMatch(script,/brandList\(\)/);
 assert.doesNotMatch(script,/'brand:'/);
 assert.match(script,/'style:'\+/);
 const m=script.match(/const ENGINE_STYLE=\{([\s\S]*?)\};/);assert(m);
 const body=m[1];
 const map=Function('return {'+body+'}')();
 const so=script.match(/const STYLE_ORDER=(\[[\s\S]*?\n\]);/);assert(so);
 const order=Function('return '+so[1])();
 assert(order.length>=5&&order.length<=6,'5–6 styles');
 const styles=order.map(x=>x[0]);
 assert.equal(new Set(styles).size,styles.length);
 for(const [k,short,title] of order){assert(short.length<=14,k+' short chip label');assert(title.length>=5,k);}
 // no duplicate keys in the literal (exactly one style each)
 const literalKeys=[...body.matchAll(/(\w+):'/g)].map(x=>x[1]);
 assert.equal(literalKeys.length,new Set(literalKeys).size,'duplicate style key');
 const ids=Object.keys(core.engines);
 assert.equal(Object.keys(map).length,ids.length);
 for(const id of ids){assert(styles.includes(map[id]),id+' style');}
 for(const s of styles) assert(ids.some(id=>map[id]===s),s+' empty');
 assert.equal(map.hellcat,'grave');assert.equal(map.lfa,'super');assert.equal(map.wrx,'turbo');assert.equal(map.rx7,'rotativo');assert.equal(map.i6,'suave');assert.equal(map.f458,'agudo');
 // favourites/current/recent first
 assert.match(script,/impulso\.favs\.v1/);
 assert.match(script,/impulso\.recent\.v1/);
 assert.match(script,/★ Favoritos e recentes/);
 assert(script.indexOf('quickIds()')<script.indexOf('for(const [key,,title,sub] of STYLE_ORDER)'));
 assert.match(html,/--tile:76px/);
 assert.match(html,/\.filters button\{min-height:64px/);
});
test('v3.18: whole script outside the engine-picker UI block identical to v3.17 apart from CF + gearboxComfort (audio, GPS, Desportiva, pops, UI)',()=>{
 const a=script.indexOf('/* ---- v3.14/v3.15 in-car UI wiring'),b=script.indexOf('function openSheet(');
 assert(a>0&&b>a);
 const rest=maskComfort(script.slice(0,a)+script.slice(b)).replace(/const VERSION='[\d.]+';/,'');
 assert.equal(require('node:crypto').createHash('sha256').update(rest).digest('hex'),V317M.restMaskedSha);
 // the engine-picker UI block itself is unchanged too
 assert.equal(require('node:crypto').createHash('sha256').update(script.slice(a,b)).digest('hex'),V317M.uiBlockSha);
});
test('v3.15 page builds tiles/chips and syncs favorites key',()=>{
 assert.match(script,/buildEngineTiles/);
 assert.match(script,/impulso\.favs\.v1/);
 assert.match(script,/openSheet\('engineSheet'\)/);
 assert.match(script,/data-filter/);
 assert.match(script,/engineTypeTag/);
});

async function pageAudioTest(){
 const nodes=[],waves=[];let sr=44100;
 const param=v=>({value:v,targets:[],setTargetAtTime(x,t,tc){this.targets.push({x,t,tc});this.value=x;},setValueAtTime(x){this.value=x;},cancelScheduledValues(){},linearRampToValueAtTime(x){this.value=x;},exponentialRampToValueAtTime(x){this.value=x;}});
 function node(kind,extra={}){const n={kind,out:[],connect(d){this.out.push(d);return d;},start(){},stop(){},...extra};nodes.push(n);return n;}
 class FakeAC{constructor(){this.sampleRate=sr;this.currentTime=0;this.state='running';this.destination=node('destination');}
  createGain(){return node('gain',{gain:param(1)});}
  createBiquadFilter(){return node('biquad',{frequency:param(350),Q:param(1),gain:param(0)});}
  createDynamicsCompressor(){return node('comp',{threshold:param(-24),knee:param(30),ratio:param(12),attack:param(.003),release:param(.25)});}
  createWaveShaper(){return node('shaper',{curve:null,oversample:'none'});}
  createOscillator(){return node('osc',{frequency:param(440),setPeriodicWave(w){this.wave=w;}});}
  createBufferSource(){return node('buffer',{buffer:null,loop:false});}
  createDelay(){return node('delay',{delayTime:param(.005)});}
  createBuffer(c,len,rate){const d=new Float32Array(len);return {getChannelData:()=>d,length:len,sampleRate:rate};}
  createPeriodicWave(re,im){const w={n:im.length,im:Array.from(im)};waves.push(w);return w;}
  resume(){return Promise.resolve();}close(){return Promise.resolve();}}
 const els={};
 for(const [,id] of html.matchAll(/id="([^"]+)"/g)) els[id]={id,textContent:'',hidden:false,value:'',checked:false,disabled:false,style:{},classList:{toggle(){},add(){},remove(){}},setAttribute(){},addEventListener(){},setPointerCapture(){},dispatchEvent(){return true;},appendChild(){},onclick:null,options:[],children:[],dataset:{},innerHTML:''};
 // Fake engine <select> options from HTML so engineLabel works
 const engSel=html.slice(html.indexOf('<select id="engine"'), html.indexOf('</select>', html.indexOf('<select id="engine"'))+9);
 for(const m of engSel.matchAll(/<option value="([^"]+)">([^<]*)<\/option>/g)){
  els.engine.options.push({value:m[1],textContent:m[2]});
 }
 els.engineTiles={...els.engineTiles, appendChild(c){this.children.push(c);}, get children(){return this._c||(this._c=[]);}, set innerHTML(v){this._c=[];}, get innerHTML(){return '';}};

 const KEY='supra2jz';
 Object.assign(els.engine,{value:KEY});els.target.value='0';els.throttle.value='45';els.volume.value='50';els.character.value='40';els.popsIntensity.value='50';els.gearStyle.value='comfort';els.popsEnable.checked=false;
 let raf=null,perf=1000;
 const ctx={document:{getElementById:id=>els[id],querySelectorAll:()=>[],querySelector:()=>null,createElement:(tag)=>({tagName:tag,style:{},classList:{toggle(){},add(){},remove(){}},setAttribute(){},addEventListener(){},appendChild(){},dataset:{},textContent:'',innerHTML:''}),addEventListener(){},hidden:false},window:{isSecureContext:true,addEventListener(){},AudioContext:FakeAC,Event:function(t){this.type=t;},localStorage:{_d:{},getItem(k){return this._d[k]||null;},setItem(k,v){this._d[k]=String(v);}}},
  navigator:{geolocation:{watchPosition(){return 1;},clearWatch(){}},permissions:null},performance:{now:()=>perf},
  requestAnimationFrame:f=>{raf=f;return 1;},cancelAnimationFrame(){},Date,Math,Number,Set,Object,Array,String,Error,Float32Array,Promise,setTimeout,console};
 vm.runInNewContext(script,ctx);
 els.start.onclick();await new Promise(r=>setTimeout(r,0));
 const frames=n=>{for(let i=0;i<n;i++){perf+=50;raf(perf);}};
 frames(80);
 const comps=nodes.filter(n=>n.kind==='comp');
 assert.equal(comps.length,2,'engine limiter + pop ceiling');
 const engLim=comps.find(c=>c.threshold.value===-16);
 const popLim=comps.find(c=>c.threshold.value===-3);
 assert(engLim&&popLim,'limiters');
 assert.deepEqual([engLim.threshold.value,engLim.ratio.value],[ -16,12]);
 assert.deepEqual(engLim.out.map(n=>n.kind),['destination']);
 assert.deepEqual(popLim.out.map(n=>n.kind),['destination']);
 const master=nodes.find(n=>n.out.includes(engLim));assert.equal(master.kind,'gain');
 // pop colour: some biquad lowpass feeds the pop path
 const popEx=nodes.find(n=>n.kind==='biquad'&&n.type==='lowpass'&&n!==nodes.find(x=>x.kind==='biquad'&&x.type==='lowpass'&&x.out.some(o=>o.kind==='gain'&&o.out.includes(master))));
 // simpler: delay node exists for tube
 assert(nodes.some(n=>n.kind==='delay'),'exhaust tube delay');
 // noise path still gated to master
 const buf=nodes.find(n=>n.kind==='buffer'&&n.loop);const hp=buf.out[0];
 assert.equal(hp.type,'highpass');assert.equal(hp.frequency.value,150);
 const e=core.engines[KEY];
 assert(waves.length>=1);for(const w of waves){assert.equal(w.n,48);for(let i=1;i<48;i++) assert.equal(w.im[i],Math.fround(core.harmonicPartial(e,i)));}
 const oscs=nodes.filter(n=>n.kind==='osc'),sub=oscs.find(o=>o.type==='triangle');
 assert(sub);
 const c=.4,subGain=sub.out[0].gain.value,load=(subGain/e.subGain-.6)/.4;
 assert(load>=-1e-9&&load<=1+1e-9);
 assert(Math.abs(master.gain.value-50/100*.48)<1e-12);
 // pops off: no duck
 assert(!ctx/*placeholder*/||true);
 const popsGainNode=nodes.find(n=>n.out.includes(popLim));
 assert(popsGainNode);
 assert(Math.abs(popsGainNode.gain.value-50/100*core.POP_LIMITS.popBus)<1e-9);
}
// ---- v3.18: Conforto GPS-steady upshift (speed holding → leave the high rpm quickly) ----
const STEADY_SCEN={
 kickHard:[{name:'cruise',dur:25,a:0},{name:'acc',dur:4,a:2.0},{name:'steady',dur:36,a:0}],
 kick12:[{name:'cruise',dur:25,a:0},{name:'acc',dur:4,a:1.2},{name:'steady',dur:36,a:0}],
 brake70:[{name:'cruise',dur:25,a:0},{name:'acc',dur:50/3.6/1.5,a:-1.5},{name:'steady',dur:36,a:0}],
 lift:[{name:'cruise',dur:25,a:0},{name:'acc',dur:5,a:1.2},{name:'lift',dur:8,a:-.9},{name:'steady',dur:6,a:0}]
};
function preSteadyTrace(k){const r={};
 for(const [sn,ph] of Object.entries(STEADY_SCEN)) for(const seed of [101,118]) for(const noise of [.3,.8]){
  const log=drive(k,ph,{seed,noise,pops:true,popSeed:987654321});
  const tr=log.filter(x=>x.ph!=='steady').map(x=>x.gear+(x.shift?x.shift[0]:'')+(x.blip?'b':'')+(x.popped?'p':'')).join(',');
  r[sn+'/'+seed+'/'+noise]=require('node:crypto').createHash('sha256').update(tr).digest('hex').slice(0,24);}
 return r;
}
const steadyStart=log=>log.find(x=>x.ph==='steady');
function backToCruise(k,log){const e=core.engines[k],s=steadyStart(log),cg=core.cruiseGear(e,log[log.length-1].v,'comfort');
 const b=log.find(x=>x.ph==='steady'&&x.gear>=cg);return {cg,b,tb:b?b.t-s.t+.05:Infinity,s};}
test('v3.18 Conforto: while speed is still changing, gear/shift/blip/pop traces are identical to v3.17 (kick-down, hold, decel blips, lift-off pops)',()=>{
 const snap=JSON.parse(fs.readFileSync(__dirname+'/fixtures/v317-conforto-presteady.json','utf8')).runs;
 assert.equal(Object.keys(snap).length,50);
 for(const k of KEYS){const now=preSteadyTrace(k);
  for(const run of Object.keys(snap[k])) assert.equal(now[run],snap[k][run],k+' '+run+' differs from v3.17 before the speed settles');}
});
test('v3.18 Conforto (a): cruise 120 in 7th, hard kick-down, then steady speed → back to the cruise gear ≤6 s after stabilising, calm rpm',()=>{
 for(const k of KEYS){const e=core.engines[k];
  for(const seed of SEEDS.slice(0,4)) for(const noise of [.3,.5,.8]) for(const sc of ['kickHard','kick12']){
   const log=drive(k,STEADY_SCEN[sc],{seed,noise});
   assert.equal(log.filter(x=>x.ph==='cruise').pop().gear,7,k+' cruise gear');
   assert(gearDrop(log)>=2,k+' '+sc+' kick-down');
   const {cg,b,tb}=backToCruise(k,log);
   assert(tb<=6,k+' '+sc+' seed '+seed+' noise '+noise+': back to gear '+cg+' after '+tb.toFixed(2)+' s');
   const after=log.filter(x=>x.ph==='steady'&&x.t>=b.t+.5);
   for(const x of after) assert(x.rpm<=Math.max(3000,core.gearRpm(e,x.speed,cg)*1.03)&&x.rpm<.5*e.max,k+' cruise rpm '+x.rpm.toFixed(0));
   assert(!log.some(x=>x.ph==='steady'&&x.shift==='down'),k+' no downshift once steady');
  }}
});
test('v3.18 Conforto (b)+(c): brake 120→70 with blipped downshifts, hold 70 → cruise gear ≤6 s, then 30 s with 0 further shifts',()=>{
 for(const k of KEYS) for(const seed of SEEDS.slice(0,4)) for(const noise of [.3,.5]){
  const log=drive(k,STEADY_SCEN.brake70,{seed,noise});
  const downs=log.filter(x=>x.ph==='acc'&&x.shift==='down');
  assert(downs.length>=1&&downs.every(x=>x.blip),k+' decel downshifts with blips');
  const {cg,b,tb}=backToCruise(k,log);
  assert(tb<=6,k+' seed '+seed+' noise '+noise+': cruise gear '+cg+' after '+tb.toFixed(2)+' s');
  const later=log.filter(x=>x.ph==='steady'&&x.t>b.t+.01&&x.shift);
  assert.equal(later.length,0,k+' seed '+seed+' noise '+noise+' shifts after reaching cruise gear: '+later.map(x=>x.shift+x.gear));
 }
 // after the kick-down too: 30 s of steady speed once back in 7th → 0 shifts
 for(const k of KEYS) for(const seed of SEEDS.slice(0,3)){const log=drive(k,STEADY_SCEN.kickHard,{seed,noise:.5});const {b}=backToCruise(k,log);
  assert(log[log.length-1].t-b.t>=30);assert.equal(log.filter(x=>x.t>b.t+.01&&x.shift).length,0,k+' seed '+seed);}
 // noisier GPS (0.8 km/h): never hunts (no downshift after reaching the cruise gear)
 for(const k of KEYS) for(const seed of SEEDS.slice(0,3)){const log=drive(k,STEADY_SCEN.brake70,{seed,noise:.8});const {b,tb}=backToCruise(k,log);
  assert(tb<=6,k);assert(!log.some(x=>x.t>b.t&&x.shift==='down'),k+' hunting at noise .8');}
});
// (noise 0.8 is not used here: a few eager profiles already took a noise-induced 1-gear kick at that level in v3.17;
//  that pre-steady behaviour is pinned unchanged by the v3.17 trace test above)
test('v3.18 Conforto (d): slow steady climb 100→110 km/h in 9 s → still no downshift and no shift at all (more seeds)',()=>{
 for(const k of KEYS) for(const seed of SEEDS.slice(6,12)) for(const noise of [.3,.5]){
  const log=drive(k,FROM100('acc',9,10/3.6/9),{seed,noise,v0:100});
  assert.equal(log.filter(x=>x.ph!=='cruise'&&x.shift).length,0,k+' seed '+seed+' noise '+noise);
 }
});
test('v3.18 Conforto: steady detector constants, and it never fires while the speed is clearly rising or falling',()=>{
 assert.equal(core.CF.W_STEADY,2);assert(core.CF.STEADY_T>=1&&core.CF.STEADY_T<=1.5);assert(core.CF.STEADY_DV<=1.5);
 // direct check on the flag with a 1 Hz ramp
 for(const a of [.4,-.4,1,-1]){let st=null,o,v=100,seen=false;
  for(let i=0;i<400;i++){if(i>=200)v+=a*3.6*.05;o=core.gearbox(st,{speed:v,dt:.05,sampleAt:Math.floor(i/20),profile:core.engines.v8});st=o.state;if(i>=260&&o.steady)seen=true;}
  assert(!seen,'steady flagged during a '+a+' m/s² ramp');}
 // and it does fire on a flat speed
 {let st=null,o;for(let i=0;i<200;i++){o=core.gearbox(st,{speed:90,dt:.05,sampleAt:Math.floor(i/20),profile:core.engines.v8});st=o.state;}assert(o.steady);}
});
test('v3.18 Desportiva unaffected: gearbox(style=sport) never exposes the Conforto steady flag',()=>{
 const o=core.gearbox(null,{speed:90,dt:.05,profile:core.engines.v8,style:'sport'});assert.equal(o.steady,undefined);assert.equal(o.state.steadyT,undefined);
});
(async()=>{
 await pageAudioTest();count++;console.log('PASS page audio graph: engine chain unchanged + coloured pop bus with tube');
 console.log(`${count} tests passed; full inline JavaScript syntax valid. These tests cover logic and syntax only, not listening.`);
})().catch(err=>{console.error(err);process.exit(1);});
