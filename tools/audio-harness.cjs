// Yalnız testler için WebAudio sözleşmesi ve denetlenebilir zamanlayıcılar.
module.exports=function(){
 const contexts=[],timers=new Map();let next=0;
 class Param{constructor(value=0){this.value=value;this.calls=[];}setValueAtTime(v,t){this.value=v;this.calls.push(['value',v,t]);}setTargetAtTime(v,t,c){this.value=v;this.calls.push(['target',v,t,c]);}linearRampToValueAtTime(v,t){this.value=v;this.calls.push(['linear',v,t]);}exponentialRampToValueAtTime(v,t){this.value=v;this.calls.push(['exponential',v,t]);}cancelScheduledValues(t){this.calls.push(['cancel',t]);}}
 class Node{constructor(type){this.type=type;this.gain=new Param();this.frequency=new Param();this.starts=[];this.stops=[];this.connections=[];}connect(n){this.connections.push(n);return n;}disconnect(){this.connections=[];}start(t=0){this.starts.push(t);}stop(t=0){this.stops.push(t);}}
 class AudioContext{
  constructor(){this.state='suspended';this.currentTime=0;this.sampleRate=8000;this.destination={};this.nodes=[];this.resumes=0;this.suspends=0;this.closes=0;contexts.push(this);}
  node(type){const n=new Node(type);this.nodes.push(n);return n;}
  createGain(){return this.node('gain');}createOscillator(){return this.node('oscillator');}createBufferSource(){return this.node('buffer');}createBiquadFilter(){return this.node('filter');}
  createBuffer(channels,length){return{getChannelData:()=>new Float32Array(length)};}
  resume(){this.state='running';this.resumes++;return Promise.resolve();}suspend(){this.state='suspended';this.suspends++;return Promise.resolve();}close(){this.state='closed';this.closes++;return Promise.resolve();}
 }
 return{AudioContext,contexts,timers,setTimeout:(f,ms)=>{const id=++next;timers.set(id,{f,ms});return id;},clearTimeout:id=>timers.delete(id),flush:()=>{const pending=[...timers.values()];timers.clear();pending.forEach(x=>x.f());}};
};
