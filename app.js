"use strict";

// 1. Probability functions: normal and Student's t, without dependencies.
const Stats = (() => {
  const co = [676.5203681218851,-1259.1392167224028,771.3234287776531,
    -176.6150291621406,12.507343278686905,-0.13857109526572012,
    9.984369578019572e-6,1.5056327351493116e-7];
  function lg(z) {
    if (z < .5) return Math.log(Math.PI)-Math.log(Math.sin(Math.PI*z))-lg(1-z);
    z -= 1;
    let x = .99999999999980993;
    co.forEach((c,i) => { x += c/(z+i+1); });
    const t = z+7.5;
    return .5*Math.log(2*Math.PI)+(z+.5)*Math.log(t)-t+Math.log(x);
  }
  function fraction(a,b,x) {
    const floor = v => Math.abs(v)<1e-300 ? 1e-300 : v;
    let c=1, d=1/floor(1-(a+b)*x/(a+1)), h=d;
    for (let m=1;m<=400;m++) {
      let aa=m*(b-m)*x/((a+2*m-1)*(a+2*m));
      d=1/floor(1+aa*d); c=floor(1+aa/c); h*=d*c;
      aa=-(a+m)*(a+b+m)*x/((a+2*m)*(a+2*m+1));
      d=1/floor(1+aa*d); c=floor(1+aa/c);
      const delta=d*c; h*=delta;
      if (Math.abs(delta-1)<3e-14) break;
    }
    return h;
  }
  function beta(x,a,b) {
    if (x<=0) return 0;
    if (x>=1) return 1;
    const factor=Math.exp(lg(a+b)-lg(a)-lg(b)+a*Math.log(x)+b*Math.log1p(-x));
    return x<(a+1)/(a+b+2) ? factor*fraction(a,b,x)/a
      : 1-factor*fraction(b,a,1-x)/b;
  }
  // Complementary error function, maximum error approximately 1e-7.
  function erfc(x) {
    const z=Math.abs(x), t=1/(1+.5*z);
    const r=t*Math.exp(-z*z-1.26551223+t*(1.00002368+t*(.37409196
      +t*(.09678418+t*(-.18628806+t*(.27886807+t*(-1.13520398
      +t*(1.48851587+t*(-.82215223+t*.17087277)))))))));
    return x>=0 ? r : 2-r;
  }
  function cdf(x,kind="z",df=24) {
    if (x===Infinity) return 1;
    if (x===-Infinity) return 0;
    if (x===0) return .5;
    if (kind==="z") return .5*erfc(-x/Math.SQRT2);
    const tail=.5*beta(df/(df+x*x),df/2,.5);
    return x<0 ? tail : 1-tail;
  }
  function pdf(x,kind="z",df=24) {
    if (!Number.isFinite(x)) return 0;
    if (kind==="z") return Math.exp(-x*x/2)/Math.sqrt(2*Math.PI);
    return Math.exp(lg((df+1)/2)-lg(df/2)-.5*Math.log(df*Math.PI)
      -(df+1)/2*Math.log1p(x*x/df));
  }
  function quantile(p,kind="z",df=24) {
    if (p<=0) return -Infinity;
    if (p>=1) return Infinity;
    if (p===.5) return 0;
    if (p<.5) return -quantile(1-p,kind,df);
    let lo=0,hi=1;
    while (cdf(hi,kind,df)<p && hi<1e12) hi*=2;
    for (let i=0;i<75;i++) {
      const mid=(lo+hi)/2;
      if (cdf(mid,kind,df)<p) lo=mid; else hi=mid;
    }
    return (lo+hi)/2;
  }
  function pValue(x,tail,kind,df) {
    if (tail==="two") return Math.min(1,2*cdf(-Math.abs(x),kind,df));
    return tail==="right" ? cdf(-x,kind,df) : cdf(x,kind,df);
  }
  return {cdf,pdf,quantile,pValue};
})();
if (typeof module!=="undefined") module.exports=Stats;

// 2. State and display. Keep an entered statistic exact rather than snapping
// it to the slider. SE is a scale factor for the original t curve.
if (typeof document!=="undefined") {
  const $=id=>document.getElementById(id);
  const state={kind:"z",scale:"standard",tail:"two",alpha:.05,p:Stats.pValue(7/3,"two","z",24),df:24,mean:100,sd:15,se:3,sign:1,n:25,observed:7/3};
  const defaults={...state}, plot=$("plot");
  const g={left:65,right:950,top:60,base:355};
  let domain=4.4,dragDomain=null,dragging=false;
  const q=p=>Stats.quantile(p,state.kind,state.df);
  const pdf=x=>Stats.pdf(x,state.kind,state.df);
  const original=x=>state.mean+x*state.se;
  const axis=x=>state.scale==="original" ? original(x) : x;
  const symbol=()=>state.kind;
  function probability(p) {
    if (p>0 && p<.0001) return p.toExponential(2);
    return Math.abs(p*100-Math.round(p*100))<1e-9 ? p.toFixed(2) : p.toFixed(4);
  }
  function setObserved(z) {
    state.observed=z;
    state.sign=z<0?-1:1;
    state.p=Stats.pValue(z,state.tail,state.kind,state.df);
  }
  function fmt(x,d=3) {
    if (!Number.isFinite(x)) return x<0 ? "−∞" : "∞";
    if (Math.abs(x)>=1e6 || (Math.abs(x)>0 && Math.abs(x)<.001))
      return x.toExponential(2).replace("-","−");
    return (Math.abs(x)<.5*10**-d ? 0 : x).toFixed(d).replace("-","−");
  }
  function statistic() {
    if (state.observed!==null) return state.observed;
    if (state.tail==="two") return state.sign*q(1-state.p/2);
    return state.tail==="right" ? q(1-state.p) : q(state.p);
  }
  function criticals() {
    if (state.tail==="two") return [-q(1-state.alpha/2),q(1-state.alpha/2)];
    return [q(state.tail==="right" ? 1-state.alpha : state.alpha)];
  }
  function bands(p,observed=null) {
    if (state.tail==="two") {
      const cutoff=observed===null?q(1-p/2):Math.abs(observed);
      return [[-domain,-cutoff],[cutoff,domain]];
    }
    return state.tail==="right" ? [[observed===null?q(1-p):observed,domain]]
      : [[-domain,observed===null?q(p):observed]];
  }
  function tag(name,attrs,content="") {
    return "<"+name+" "+Object.entries(attrs).map(([k,v])=>k+'="'+v+'"').join(" ")+">"+content+"</"+name+">";
  }
  function draw(stat,crit) {
    domain=dragDomain ?? Math.max(4.4,...crit.map(x=>Math.abs(x)*1.25),Number.isFinite(stat)?Math.abs(stat)*1.18:0);
    const px=x=>g.left+(x+domain)/(2*domain)*(g.right-g.left);
    const py=x=>g.base-pdf(x)/pdf(0)*(g.base-g.top);
    const text=(x,y,s,cls="")=>tag("text",{x,y,"text-anchor":"middle",class:cls},s);
    const line=(x,y,x2,y2,stroke,dash="")=>tag("line",{x1:x,y1:y,x2,y2,stroke,"stroke-width":1.5,"stroke-dasharray":dash});
    function path(a,b,fill=false) {
      a=Math.max(-domain,a);b=Math.min(domain,b);
      if (!(a<b)) return "";
      const count=Math.max(60,Math.ceil((b-a)/(2*domain)*1400));
      let d=fill ? "M "+px(a)+" "+g.base+" L "+px(a)+" "+py(a) : "M "+px(a)+" "+py(a);
      for (let i=1;i<=count;i++) {
        const x=a+(b-a)*i/count;
        d+=" L "+px(x).toFixed(3)+" "+py(x).toFixed(3);
      }
      return d+(fill ? " L "+px(b)+" "+g.base+" Z" : "");
    }
    let svg=tag("title",{id:"plot-title"},"Sampling distribution under H₀")
      +tag("desc",{id:"plot-desc"},"Red rejection regions; purple p-value areas. Alpha "+state.alpha+", p-value "+state.p+". Observed statistic "+fmt(stat)+".");
    svg+=tag("path",{d:path(-domain,domain,true),fill:"#f1f3f8"});
    bands(state.alpha).forEach(([a,b])=>{
      svg+=tag("path",{d:path(a,b,true),fill:"#efb8bc","fill-opacity":.85});
      a=Math.max(a,-domain);b=Math.min(b,domain);
      if (b>a) svg+=tag("rect",{x:px(a),y:g.base+5,width:px(b)-px(a),height:5,fill:"#c44248"});
    });
    bands(state.p,stat).forEach(([a,b])=>{
      svg+=tag("path",{d:path(a,b,true),fill:"#512888","fill-opacity":.48});
    });
    svg+=line(px(0),g.top,px(0),g.base,"#bcc5d2","4 6");
    svg+=tag("path",{d:path(-domain,domain),fill:"none",stroke:"#001641","stroke-width":2.5});
    svg+=line(g.left,g.base,g.right,g.base,"#8b98ab");
    const step=domain>30?20:domain>12?5:domain>6?2:1;
    const every=Math.ceil((2*domain/step)/10);
    for (let i=Math.ceil(-domain/step);i<=Math.floor(domain/step);i++) {
      if (i%every!==0) continue;
      const x=i*step;
      svg+=line(px(x),g.base,px(x),g.base+14,"#8b98ab");
      svg+=text(px(x),g.base+38,fmt(axis(x),state.scale==="original"?2:0));
    }
    crit.forEach(c=>{
      svg+=line(px(c),py(c),px(c),g.base+8,"#c44248","5 4");
      svg+=text(px(c),g.base+68,"Critical: "+fmt(axis(c),2),"crit-text");
    });
    const x=px(Math.max(-domain,Math.min(domain,stat)));
    svg+=line(x,36,x,g.base+13,"#001641","6 4");
    if (state.tail==="two" && Number.isFinite(stat) && Math.abs(stat)>.001)
      svg+=line(px(-stat),py(-stat),px(-stat),g.base,"#9270b9","3 5");
    svg+=text(Math.max(g.left+90,Math.min(g.right-90,x)),24,"Observed: "+fmt(axis(stat)),"stat-text");
    svg+=tag("circle",{id:"stat-handle",class:"handle",cx:x,cy:g.base,r:11,fill:"#001641",
      stroke:"white","stroke-width":3,tabindex:0,role:"button","aria-label":"Observed statistic. Use left and right arrows to move it."});
    svg+=text((g.left+g.right)/2,g.base+108,state.scale==="original"?"Original scale":"Standardized statistic ("+symbol()+")");
    svg+=text((g.left+g.right)/2,505,"Drag the navy marker • Purple areas together = "+probability(state.p));
    plot.innerHTML=svg;
  }
  function render(keepObservedInput=false) {
    const stat=statistic(),crit=criticals();
    const reject=state.p<state.alpha-1e-10, boundary=Math.abs(state.p-state.alpha)<1e-10;
    $("se").textContent=fmt(state.se);
    $("df").textContent=state.df;
    $("sd-label").textContent=state.kind==="t"?"Standard deviation (sample estimate)":"Standard deviation under H₀";
    $("p-slider").value=Math.round(state.p*100)/100;
    $("p-output").textContent=probability(state.p);
    if (!keepObservedInput) {
      $("observed").value=Number.isFinite(stat)?Number(original(stat).toPrecision(7)):"";
      $("observed").placeholder=Number.isFinite(stat)?"":fmt(stat);
    }
    $("chart-title").textContent=state.kind==="z"
      ? (state.scale==="standard"?"Standard normal distribution":"Normal sampling distribution")
      : (state.scale==="standard"?"Student’s t distribution":"Student’s t on the original scale");
    $("chart-subtitle").textContent="Assuming H₀ is true · n = "+state.n+(state.kind==="t"?" · DF = "+state.df:"")
      +(state.scale==="original"?" · Mean = "+state.mean+" · SE = "+fmt(state.se):"");
    $("stat-label").textContent="Observed "+symbol();$("stat-value").textContent=fmt(stat);
    $("original-value").textContent="Original value: "+fmt(original(stat));
    $("critical-values").textContent=crit.map(x=>fmt(x)).join(", ");
    $("critical-original").textContent=state.scale==="original"?"Original scale: "+crit.map(x=>fmt(original(x))).join(", "):symbol()+" scale";
    $("comparison").textContent="p = "+probability(state.p)+" "+(boundary?"=":reject?"<":">")+" α = "+state.alpha.toFixed(2);
    $("decision").textContent=reject?"Reject H₀":"Fail to reject H₀";
    $("decision-box").classList.toggle("reject",reject);
    $("decision-note").textContent=boundary?"At the boundary: this demo uses p < α.":reject?"Statistically significant":"Not statistically significant";
    $("explanation").textContent=state.tail==="two"
      ? "Purple includes both tails beyond ±"+fmt(Math.abs(stat))+" on the "+symbol()+" scale. Each tail contains "+probability(state.p/2)+". Red marks the rejection regions, with "+(state.alpha/2).toFixed(3)+" in each tail."
      : "Purple is the area to the "+state.tail+" of the observed statistic. Red marks the "+state.tail+" rejection region, with total area "+state.alpha.toFixed(2)+".";
    $("endpoint-note").hidden=Number.isFinite(stat);
    $("endpoint-note").textContent="This endpoint requires an infinite statistic. The marker is shown at the chart edge; it is not a finite cutoff.";
    draw(stat,crit);
  }

  // 3. Form input and dragging. Invalid entries retain the last valid plot.
  document.querySelectorAll('input[type="radio"]').forEach(input=>{
    input.addEventListener("change",()=>{
      const observed=statistic();
      const key={distribution:"kind",scale:"scale",tail:"tail",alpha:"alpha"}[input.name];
      state[key]=input.name==="alpha"?Number(input.value):input.value;
      if(key==="kind" || key==="tail")setObserved(observed);
      render();
    });
  });
  ["mean","sd","n"].forEach(id=>$(id).addEventListener("input",()=>{
    const value=Number($(id).value);
    if (!$(id).checkValidity() || !Number.isFinite(value)) return;
    const z=statistic(),raw=original(z);
    state[id]=value;
    state.se=state.sd/Math.sqrt(state.n);
    state.df=state.n-1;
    setObserved((raw-state.mean)/state.se);
    render();
  }));
  $("observed").addEventListener("input",()=>{
    const value=Number($("observed").value);
    if(!$("observed").checkValidity() || !Number.isFinite(value))return;
    setObserved((value-state.mean)/state.se);
    render(true);
  });
  $("p-slider").addEventListener("input",e=>{state.observed=null;state.p=Number(e.target.value);render();});
  $("reset").addEventListener("click",()=>{
    Object.assign(state,defaults);
    ["mean","sd","n"].forEach(id=>{$(id).value=state[id];});
    const mapping={distribution:"kind",scale:"scale",tail:"tail",alpha:"alpha"};
    document.querySelectorAll('input[type="radio"]').forEach(input=>{
      input.checked=input.name==="alpha"?Number(input.value)===state.alpha:input.value===state[mapping[input.name]];
    });
    dragDomain=null;render();
  });
  function drag(event) {
    const point=new DOMPoint(event.clientX,event.clientY).matrixTransform(plot.getScreenCTM().inverse());
    const fraction=Math.max(0,Math.min(1,(point.x-g.left)/(g.right-g.left)));
    const z=-dragDomain+fraction*2*dragDomain;
    state.sign=z<0?-1:1;
    state.observed=null;
    state.p=Math.round(Stats.pValue(z,state.tail,state.kind,state.df)*100)/100;
    render();
  }
  plot.addEventListener("pointerdown",event=>{
    if (event.button!==0) return;
    dragging=true;dragDomain=domain;plot.setPointerCapture(event.pointerId);drag(event);
  });
  plot.addEventListener("pointermove",event=>{if(dragging)drag(event);});
  function stopDrag(){if(dragging){dragging=false;dragDomain=null;render();}}
  ["pointerup","pointercancel","lostpointercapture"].forEach(name=>plot.addEventListener(name,stopDrag));
  plot.addEventListener("keydown",event=>{
    if(!["ArrowLeft","ArrowRight"].includes(event.key))return;
    event.preventDefault();
    const dir=event.key==="ArrowRight"?1:-1;
    let delta=state.tail==="left"?dir:state.tail==="right"?-dir:-dir*state.sign;
    if(state.tail==="two" && state.p===1){state.sign=dir;delta=-1;}
    state.observed=null;
    state.p=Math.max(0,Math.min(1,Number((state.p+delta*.01).toFixed(2))));
    render();$("stat-handle").focus();
  });
  render();
}
