/* Cosmos — the living WebGL universe behind every verse.
   One fragment shader layers a domain-warped nebula, a hyperspace starfield,
   a kaleidoscopic KIFS mandala and, for Chapter 11, the Vishwaroop itself:
   a blue cosmic body full of galaxies, a halo of countless arms,
   thousand blinking eyes, a thousand suns and the fiery mouths of Kāla. */
(function () {
  const VERT = `attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`;

  const FRAG = `
precision highp float;
uniform vec2 uRes; uniform float uTime; uniform vec2 uMouse;
uniform vec3 uC1; uniform vec3 uC2; uniform vec3 uC3;
uniform float uInt; uniform float uVis; uniform float uKala; uniform float uSun;
uniform float uWarp; uniform float uBeat; uniform float uChap; uniform float uCalm;
#define PI 3.14159265
#define TAU 6.2831853
mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}
float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*noise(p);p=rot(.5)*p*2.03+3.1;a*=.5;}return v;}
vec3 pal(float t){return .5+.5*cos(TAU*(t+vec3(0.,.33,.67)));}

vec3 nebula(vec2 uv,float t){
  vec2 q=vec2(fbm(uv*1.4+t*.04),fbm(uv*1.4-t*.035+5.2));
  vec2 r=vec2(fbm(uv*1.8+q*3.+t*.06+1.7),fbm(uv*1.8+q*3.-t*.05+9.2));
  float f=fbm(uv*1.1+r*2.6);
  vec3 col=mix(uC1,uC2,clamp(f*f*2.2,0.,1.));
  col=mix(col,uC3,clamp(length(r)-.4,0.,1.)*.7);
  col=mix(col,pal(f*1.3+t*.025+uChap*.071),.42*uInt*(1.-uCalm*.6));
  return col*(f*f*1.9+.04);
}

vec3 stars(vec2 uv,float t){
  vec3 c=vec3(0);
  float speed=.025+uWarp*.5+uVis*.03;
  for(int i=0;i<5;i++){
    float fi=float(i);
    float depth=fract(fi*.2+t*speed);
    float scale=mix(26.,.6,depth);
    float fade=smoothstep(0.,.3,depth)*smoothstep(1.,.85,depth);
    vec2 g=uv*scale+fi*17.3;
    vec2 id=floor(g),f=fract(g)-.5;
    float h=hash(id);
    vec2 off=vec2(hash(id+1.3),hash(id+2.7))-.5;
    float d=length(f-off*.7);
    float tw=.6+.4*sin(t*3.+h*40.);
    float s=.012/max(d,.003)*step(.55,h)*fade*tw;
    c+=min(s,4.)*mix(vec3(1),pal(h+t*.04),.45);
  }
  return c;
}

vec3 mandala(vec2 uv,float t){
  float r=length(uv); float a=atan(uv.y,uv.x);
  float N=6.+mod(uChap,7.)*2.;
  float seg=TAU/N;
  a=mod(a+t*.04,seg); a=abs(a-seg*.5);
  vec2 p=vec2(cos(a),sin(a))*r;
  p*=1.+.15*sin(t*.2)+uBeat*.12*uInt;
  vec3 col=vec3(0); float s=1.;
  for(int i=0;i<7;i++){
    p=abs(p)-vec2(.32+.06*sin(t*.27),.18+.05*cos(t*.21))*s;
    p*=rot(.62+t*.015+float(i)*.1);
    s*=.78;
    float d=abs(length(p)-.07*s);
    float d2=abs(p.y)+.002;
    col+=pal(float(i)*.11+r*.8-t*.07+uChap*.05)*(.0035/max(d,.0015)+.0006/d2)*s;
  }
  float rings=pow(abs(sin(r*26.-t*1.4)),46.)*smoothstep(1.3,.1,r);
  col+=rings*pal(r*1.5-t*.15)*.5;
  float petals=pow(abs(cos(atan(uv.y,uv.x)*N*.5+t*.1)),8.)*smoothstep(.55,.25,r)*smoothstep(.0,.2,r);
  col+=petals*mix(uC3,vec3(1.,.8,.4),.4)*.25;
  return col;
}

float sdCap(vec2 p,vec2 a,vec2 b,float r){vec2 pa=p-a,ba=b-a;float h=clamp(dot(pa,ba)/dot(ba,ba),0.,1.);return length(pa-ba*h)-r;}

float crownD(vec2 p){
  vec2 q=p-vec2(0.,.37);
  float base=max(abs(q.x)-.12,abs(q.y-.04)-.04);
  float spikes=max(abs(q.x)*1.7+q.y-.2+.05*abs(sin(q.x*30.)),-q.y);
  return min(base,spikes);
}
float body(vec2 p,float t){
  float head=length((p-vec2(0.,.3))*vec2(1.,.9))-.11;
  // the countless heads in an arc behind the main face
  float heads=1e3;
  for(int i=0;i<6;i++){
    float fi=float(i);
    float s=mod(fi,2.)<.5?-1.:1.;
    float ang=(.45+floor(fi/2.)*.38)*s;
    vec2 hc=vec2(0.,.2)+vec2(sin(ang),cos(ang))*.2*(1.+floor(fi/2.)*.35);
    heads=min(heads,length(p-hc)-.075+.012*floor(fi/2.));
  }
  float neck=sdCap(p,vec2(0.,.2),vec2(0.,.12),.05);
  float torso=sdCap(p,vec2(0.,.06),vec2(0.,-.42),.15-.03*smoothstep(-.1,-.4,p.y));
  float hips=sdCap(p,vec2(-.1,-.48),vec2(.1,-.48),.11);
  float lL=sdCap(p,vec2(-.08,-.5),vec2(-.15,-1.25),.075);
  float lR=sdCap(p,vec2(.08,-.5),vec2(.15,-1.25),.075);
  // a fan of arms from each shoulder, slowly breathing
  float arms=1e3;
  for(int i=0;i<8;i++){
    float fi=float(i);
    float ang=-1.1+fi*.36+.06*sin(t*.7+fi);
    vec2 d=vec2(cos(ang),sin(ang));
    float len=.42+.05*sin(fi*1.7);
    arms=min(arms,sdCap(p,vec2(.15,.02),vec2(.15,.02)+d*len,.032-.006*fi/8.));
    arms=min(arms,sdCap(p,vec2(-.15,.02),vec2(-.15,.02)+vec2(-d.x,d.y)*len,.032-.006*fi/8.));
  }
  float d=min(min(head,heads),min(neck,torso));
  d=min(d,min(hips,min(lL,lR)));
  return min(d,arms);
}

vec3 vishwa(vec2 uv,float t){
  vec3 col=vec3(0);
  float sc=mix(2.6,1.45,smoothstep(0.,1.,uVis));
  vec2 p=uv*sc; p.y-=.06; p*=1.+.02*sin(t*.8)+uBeat*.03;
  vec2 c=p-vec2(0.,.12);
  float r=length(c), a=atan(c.y,c.x);
  vec3 gold=vec3(1.,.78,.32);
  vec3 fire=vec3(1.,.32,.05);
  vec3 armC=mix(mix(uC2,gold,.5),fire,uKala);

  // infinite arms radiating as a halo
  float arms=40.+floor(uVis*40.);
  float wob=sin(r*7.-t*1.5)*.25+sin(a*3.+t*.4)*.1;
  float armPat=pow(abs(cos(a*arms*.5+wob)),70.);
  float armMask=smoothstep(.22,.42,r)*smoothstep(2.4,.5,r);
  col+=armPat*armMask*armC*.75*(1.-uKala*.4);
  // weapons & lotuses at the tips — chakra, conch, mace, lotus
  float cell=TAU/arms;
  float ang=(floor(a/cell+.5))*cell;
  for(int k=0;k<3;k++){
    float rr=.95+float(k)*.42+.04*sin(t+ang*5.);
    vec2 tip=vec2(cos(ang),sin(ang))*rr;
    float dt=length(c-tip);
    float ring=smoothstep(.012,0.,abs(dt-.035-.01*float(k)));
    float spokes=smoothstep(.04,.0,dt)*pow(abs(cos(atan(c.y-tip.y,c.x-tip.x)*4.+t*3.)),6.);
    col+=(ring+spokes*.7)*mix(gold,pal(ang/TAU+t*.1),.4)*1.6*armMask;
  }
  // aureoles
  col+=smoothstep(.018,0.,abs(r-.44-.02*sin(a*12.+t)))*gold*1.4;
  col+=smoothstep(.014,0.,abs(r-.6-.03*sin(a*24.-t*1.3)))*pal(a/TAU+t*.1)*1.2;
  col+=smoothstep(.02,0.,abs(r-.82-.04*sin(a*36.+t*.7)))*mix(uC3,fire,uKala)*.9;

  // thousand eyes in a log-polar lattice streaming outwards
  float L=log(max(r,.001));
  vec2 e=vec2(a/TAU*36.,L*36./TAU-t*.35);
  vec2 id=floor(e); vec2 f=fract(e)-.5;
  float h=hash(id+floor(uChap));
  float blink=clamp(sin(t*.9+h*50.)*4.+3.,0.,1.);
  float open=blink*smoothstep(.15,.6,uVis);
  float eyeD=length(f*vec2(1.,1./max(.42*open,.02)));
  float eyeMask=step(.45,h)*smoothstep(.55,.9,r)*smoothstep(3.,1.4,r);
  vec2 look=vec2(sin(t*.6+h*9.),cos(t*.5+h*7.))*.08;
  float iris=smoothstep(.17,.13,length(f-look));
  float pupil=smoothstep(.07,.05,length(f-look));
  float white=smoothstep(.42,.36,eyeD);
  vec3 eyeC=white*(vec3(.95,.9,.85)*(1.-iris)+iris*mix(pal(h+t*.05),fire,uKala)*(1.-pupil)*1.6);
  eyeC+=smoothstep(.5,.4,eyeD)*(1.-white)*gold*.6;
  col=mix(col,eyeC,white*eyeMask*.9);
  col+=smoothstep(.55,.42,eyeD)*eyeMask*gold*.25;

  // Kāla — the blazing mouths swallowing the worlds
  if(uKala>.01){
    col*=1.-uKala*.55;
    float fl=fbm(vec2(a*4.,r*5.-t*2.6))*fbm(vec2(a*9.+3.,r*3.-t*1.7));
    float mouthR=.36+.05*sin(a*7.+t*2.);
    float flames=smoothstep(.0,.6,fl*1.8)*smoothstep(1.5,.3,r)*smoothstep(.15,.3,r);
    col+=flames*mix(vec3(.6,.02,0.),vec3(1.,.55,.1),fl*fl)*1.6*uKala;
    float teeth=step(r,mouthR+.08*pow(abs(sin(a*18.)),.6))*step(mouthR-.08,r);
    col=mix(col,vec3(1.,.55,.25),teeth*uKala*.35);
    // warriors streaming like rivers into the ocean
    vec2 w=vec2(a/TAU*60.,L*14.+t*1.8);
    vec2 wid=floor(w); vec2 wf=fract(w)-.5;
    float wh=hash(wid);
    float sp=smoothstep(.12,.0,length(wf*vec2(1.,.5)))*step(.7,wh)*smoothstep(.25,.6,r);
    col+=sp*vec3(1.,.6,.3)*2.*uKala;
  }

  // the cosmic body: Shyāma blue, full of galaxies
  float bd=body(p,t);
  float inside=smoothstep(.01,-.01,bd);
  vec2 g=p*2.6; float gr=length(g), ga=atan(g.y,g.x);
  float spiral=.5+.5*sin(ga*2.+log(gr+.02)*5.-t*.6);
  float gal=fbm(g*2.2+t*.08)*spiral*exp(-gr*.45)*1.6;
  vec2 sg=p*40.; float st=step(.92,hash(floor(sg)))*smoothstep(.25,.0,length(fract(sg)-.5));
  vec3 skin=mix(vec3(.02,.07,.32),vec3(.05,.25,.75),fbm(p*3.+t*.1));
  vec3 inner=skin+gal*mix(pal(gr*.2-t*.05),vec3(1.,.8,.5),.3)*.9+st*vec3(1.)*1.2;
  inner+=smoothstep(.1,.0,length(p-vec2(0.,.3)))*gold*.35;               // the radiant face
  inner+=smoothstep(.05,.0,abs(length(p-vec2(0.,-.1))-.06))*gold;        // Kaustubha jewel
  col=mix(col,inner,inside);
  col+=(.004/max(bd,.002))*mix(gold,fire,uKala)*(1.+uBeat)*(1.-inside);  // radiant outline
  float cd=crownD(p);
  float cm=smoothstep(.006,-.006,cd);
  vec3 crownC=mix(gold,vec3(1.,.95,.7),fbm(p*30.+t))*1.2+smoothstep(.02,.0,length(p-vec2(0.,.43)))*vec3(.2,1.,.9);
  col=mix(col,crownC,cm);
  col+=(.003/max(cd,.002))*gold*(1.-cm);                                  // the golden mukuta
  col+=smoothstep(.9,.0,r)*mix(vec3(.3,.5,1.),fire,uKala)*.25;          // divine glow
  return col;
}

vec3 suns(vec2 uv,float t){
  vec3 c=vec3(0);
  for(int i=0;i<3;i++){
    vec2 g=uv*(4.+float(i)*3.)+float(i)*11.;
    vec2 id=floor(g), f=fract(g)-.5;
    float h=hash(id);
    vec2 o=(vec2(hash(id+3.),hash(id+5.))-.5)*.5;
    float d=length(f-o);
    c+=(.03/max(d,.01))*vec3(1.,.85,.6)*step(.3,h)*(.7+.3*sin(t*4.+h*30.));
  }
  return c;
}

void main(){
  vec2 uv=(gl_FragCoord.xy-.5*uRes)/min(uRes.x,uRes.y);
  float t=uTime;
  vec2 m=(uMouse-.5)*vec2(1.,-1.);
  float r0=length(uv);
  // breathing warp + transition tunnel
  uv*=1.-uWarp*.35*smoothstep(1.2,0.,r0);
  uv+=uWarp*.04*vec2(sin(uv.y*9.+t*5.),cos(uv.x*9.-t*5.));
  uv=rot(t*.008+uWarp*.6*r0)*uv;
  vec2 pv=uv+m*.04;

  vec3 col=nebula(pv*1.15,t)*.95;
  col+=stars(uv+m*.02,t)*(.55+uWarp*1.5);
  float mandAmt=(.3+.55*uInt)*(1.-uCalm*.55)*(1.-uVis*.65);
  col+=mandala(pv*(1.05+.08*sin(t*.11)),t)*mandAmt;
  if(uVis>.005){
    vec3 v=vishwa(uv+m*.015,t);
    col=col*(1.-uVis*.45-uKala*.35)+v*smoothstep(0.,.35,uVis);
  }
  if(uSun>.005){
    col+=suns(uv*rot(t*.05),t)*uSun;
    col+=vec3(1.,.93,.8)*uSun*.55*smoothstep(1.6,0.,r0);
  }
  // hyperspace streaks during transitions
  float ang=atan(uv.y,uv.x);
  float streak=pow(hash(vec2(floor(ang*80.),1.)),12.)*smoothstep(.1,1.,r0);
  col+=streak*uWarp*pal(ang/TAU+t*.3)*2.;
  // psychedelic chroma swirl pulse
  col*=1.+uBeat*.55*uInt*(1.-uCalm);
  float hueShift=sin(t*.15+r0*2.)*.5*uInt*(1.-uCalm);
  col=mix(col,col.gbr,clamp(hueShift,0.,1.)*.35);
  col*=smoothstep(1.75,.25,r0*(1.-uVis*.2));
  col=1.-exp(-col*1.25);
  col=pow(col,vec3(.88));
  gl_FragColor=vec4(col,1.);
}`;

  const Cosmos = {
    params: {
      c1: [0.05, 0.02, 0.2], c2: [0.4, 0.1, 0.6], c3: [1, 0.7, 0.3],
      int: 0.7, vis: 0, kala: 0, sun: 0, warp: 0, beat: 0, chap: 1, calm: 0,
    },
    target: null,
    mouse: [0.5, 0.5],
    scale: 0.6,

    init(canvas) {
      this.canvas = canvas;
      const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'high-performance', preserveDrawingBuffer: false });
      if (!gl) { document.body.classList.add('no-webgl'); return false; }
      this.gl = gl;
      const sh = (type, src) => {
        const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(s));
        return s;
      };
      const prog = gl.createProgram();
      gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
      gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { console.error(gl.getProgramInfoLog(prog)); return false; }
      gl.useProgram(prog);
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(prog, 'p');
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      this.u = {};
      ['uRes', 'uTime', 'uMouse', 'uC1', 'uC2', 'uC3', 'uInt', 'uVis', 'uKala', 'uSun', 'uWarp', 'uBeat', 'uChap', 'uCalm']
        .forEach(n => this.u[n] = gl.getUniformLocation(prog, n));
      this.target = JSON.parse(JSON.stringify(this.params));
      window.addEventListener('pointermove', e => { this.mouse = [e.clientX / innerWidth, e.clientY / innerHeight]; });
      this.resize();
      window.addEventListener('resize', () => this.resize());
      this.t0 = performance.now();
      this.frames = 0; this.fpsT = performance.now();
      return true;
    },

    resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.floor(innerWidth * dpr * this.scale));
      const h = Math.max(1, Math.floor(innerHeight * dpr * this.scale));
      this.canvas.width = w; this.canvas.height = h;
      if (this.gl) this.gl.viewport(0, 0, w, h);
    },

    set(p) { Object.assign(this.target, p); },

    // adaptive resolution keeps the cosmos fluid on every device
    adapt(now) {
      this.frames++;
      if (now - this.fpsT > 1500) {
        const fps = this.frames * 1000 / (now - this.fpsT);
        this.frames = 0; this.fpsT = now;
        const old = this.scale;
        if (fps < 40 && this.scale > 0.32) this.scale = Math.max(0.32, this.scale - 0.08);
        else if (fps > 57 && this.scale < 0.85) this.scale = Math.min(0.85, this.scale + 0.04);
        if (old !== this.scale) this.resize();
      }
    },

    frame(now, dt) {
      if (!this.gl) return;
      this.adapt(now);
      const P = this.params, T = this.target;
      const k = 1 - Math.exp(-dt * 1.6);
      const kf = 1 - Math.exp(-dt * 6);
      for (const c of ['c1', 'c2', 'c3']) for (let i = 0; i < 3; i++) P[c][i] += (T[c][i] - P[c][i]) * k * 0.7;
      for (const n of ['int', 'vis', 'kala', 'chap', 'calm']) P[n] += (T[n] - P[n]) * k;
      P.sun += (T.sun - P.sun) * kf;
      P.warp += (T.warp - P.warp) * kf;
      P.beat += (T.beat - P.beat) * 0.35;
      T.warp *= Math.exp(-dt * 1.2);
      T.sun *= T.sunHold ? 1 : Math.exp(-dt * 0.8);

      const gl = this.gl, u = this.u;
      gl.uniform2f(u.uRes, this.canvas.width, this.canvas.height);
      gl.uniform1f(u.uTime, (now - this.t0) / 1000);
      gl.uniform2f(u.uMouse, this.mouse[0], this.mouse[1]);
      gl.uniform3fv(u.uC1, P.c1); gl.uniform3fv(u.uC2, P.c2); gl.uniform3fv(u.uC3, P.c3);
      gl.uniform1f(u.uInt, P.int); gl.uniform1f(u.uVis, P.vis); gl.uniform1f(u.uKala, P.kala);
      gl.uniform1f(u.uSun, P.sun); gl.uniform1f(u.uWarp, P.warp); gl.uniform1f(u.uBeat, P.beat);
      gl.uniform1f(u.uChap, P.chap); gl.uniform1f(u.uCalm, P.calm);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
  };
  window.Cosmos = Cosmos;
})();
