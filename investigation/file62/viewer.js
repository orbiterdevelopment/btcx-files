"use strict";
/* BTCX 002E — Browser-only EWA-style GPU Gaussian-splat explorer.
   No third-party dependencies. This is an independent WebGL2 implementation,
   not the original investigator's exact CPU renderer. */
(() => {
  const DATA_URL = "./data/file62.splat";
  const FALLBACK_URL = "https://raw.githubusercontent.com/orbiterdevelopment/btcx-files/btc-x/file62-investigation-viewer/investigation/file62/data/file62.splat";
  const N_EXPECTED = 184148;
  const el = (id) => document.getElementById(id);
  const status = (s, error = false) => { el("status").textContent = s; el("status").classList.toggle("error", error); };
  const canvas = el("scene");
  const gl = canvas.getContext("webgl2", {alpha: false, premultipliedAlpha: false, antialias: false, preserveDrawingBuffer: true});
  if (!gl) {
    status("WebGL2 unavailable. Use Chrome with hardware acceleration, or open the fallback viewer below.", true);
    el("fallback").hidden = false;
    return;
  }
  const vsrc = [
    "#version 300 es",
    "precision highp float;",
    "precision highp int;",
    "layout(location=0) in uint aIndex;",
    "uniform highp sampler2D uPosTex;",
    "uniform highp sampler2D uScaleTex;",
    "uniform highp sampler2D uQuatTex;",
    "uniform highp sampler2D uColorTex;",
    "uniform ivec2 uTextureSize;",
    "uniform mat3 uBasis;",
    "uniform vec3 uEye;",
    "uniform vec2 uViewport;",
    "uniform float uFocal;",
    "uniform float uNear;",
    "out vec2 vLocal;",
    "out vec4 vColor;",
    "mat3 quaternionRotation(vec4 q) {",
    "  q = normalize(q);",
    "  float w=q.x, x=q.y, y=q.z, z=q.w;",
    "  return mat3(",
    "    1.-2.*(y*y+z*z), 2.*(x*y+z*w), 2.*(x*z-y*w),",
    "    2.*(x*y-z*w), 1.-2.*(x*x+z*z), 2.*(y*z+x*w),",
    "    2.*(x*z+y*w), 2.*(y*z-x*w), 1.-2.*(x*x+y*y)",
    "  );",
    "}",
    "void main() {",
    "  int idx = int(aIndex);",
    "  ivec2 loc = ivec2(idx % uTextureSize.x, idx / uTextureSize.x);",
    "  vec3 position = texelFetch(uPosTex, loc, 0).xyz;",
    "  vec3 scale = texelFetch(uScaleTex, loc, 0).xyz;",
    "  vec4 rotation = texelFetch(uQuatTex, loc, 0);",
    "  vColor = texelFetch(uColorTex, loc, 0);",
    "  vec3 pc = uBasis * (position - uEye);",
    "  if (pc.z < uNear || vColor.a <= 0.) {",
    "    gl_Position=vec4(2.,2.,2.,1.); vLocal=vec2(10.);return;",
    "  }",
    "  mat3 A = uBasis * quaternionRotation(rotation);",
    "  float invZ=1./pc.z;",
    "  vec3 a = A[0]*scale.x, b=A[1]*scale.y, c=A[2]*scale.z;",
    "  vec2 p0=uFocal*invZ*vec2(a.x-pc.x*invZ*a.z,a.y-pc.y*invZ*a.z);",
    "  vec2 p1=uFocal*invZ*vec2(b.x-pc.x*invZ*b.z,b.y-pc.y*invZ*b.z);",
    "  vec2 p2=uFocal*invZ*vec2(c.x-pc.x*invZ*c.z,c.y-pc.y*invZ*c.z);",
    "  float ca=p0.x*p0.x+p1.x*p1.x+p2.x*p2.x+0.3;",
    "  float cb=p0.x*p0.y+p1.x*p1.y+p2.x*p2.y;",
    "  float cc=p0.y*p0.y+p1.y*p1.y+p2.y*p2.y+0.3;",
    "  float disc=sqrt(max(0.,(ca-cc)*(ca-cc)+4.*cb*cb));",
    "  float lambda1=max(0.3,0.5*(ca+cc+disc));",
    "  float lambda2=max(0.3,0.5*(ca+cc-disc));",
    "  float theta=0.5*atan(2.*cb, ca-cc);",
    "  vec2 axis1=vec2(cos(theta),sin(theta));",
    "  vec2 axis2=vec2(-sin(theta),cos(theta));",
    "  vec2 corner=vec2((gl_VertexID==1 || gl_VertexID==3)?1.:-1.,",
    "                   (gl_VertexID>=2)?1.:-1.);",
    "  vec2 delta=3.*(axis1*sqrt(lambda1)*corner.x+axis2*sqrt(lambda2)*corner.y);",
    "  vec2 screen=vec2(pc.x*invZ*uFocal,pc.y*invZ*uFocal)+uViewport*0.5+delta;",
    "  vec2 clip=2.*screen/uViewport-1.;",
    "  gl_Position=vec4(clip.x,-clip.y,0.,1.);",
    "  vLocal=corner*3.;",
    "}"
  ].join("\n");
  const fsrc = [
    "#version 300 es",
    "precision highp float;",
    "in vec2 vLocal;",
    "in vec4 vColor;",
    "out vec4 fragColor;",
    "void main(){",
    "  float sq=dot(vLocal,vLocal);",
    "  if(sq>9.) discard;",
    "  float alpha=min(0.99,vColor.a*exp(-0.5*sq));",
    "  if(alpha<0.00392157) discard;",
    "  fragColor=vec4(vColor.rgb,alpha);",
    "}"
  ].join("\n");
  function shader(type, source) {
    const s=gl.createShader(type);
    gl.shaderSource(s,source);gl.compileShader(s);
    if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }
  function program(v, f) {
    const p=gl.createProgram();gl.attachShader(p,shader(gl.VERTEX_SHADER,v));gl.attachShader(p,shader(gl.FRAGMENT_SHADER,f));
    gl.linkProgram(p);
    if(!gl.getProgramParameter(p,gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    return p;
  }
  let p;
  try { p=program(vsrc,fsrc); } catch(e) {
    status("Shader initialization failed: "+e.message,true); return;
  }
  gl.useProgram(p);
  const uniform = {};
  ["uPosTex","uScaleTex","uQuatTex","uColorTex","uTextureSize","uBasis","uEye","uViewport","uFocal","uNear"].forEach(k=>uniform[k]=gl.getUniformLocation(p,k));
  const texNames=["uPosTex","uScaleTex","uQuatTex","uColorTex"];
  const textures=[];
  const idBuffer=gl.createBuffer(),vao=gl.createVertexArray();
  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER,idBuffer);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribIPointer(0,1,gl.UNSIGNED_INT,4,0);
  gl.vertexAttribDivisor(0,1);
  gl.bindVertexArray(null);
  gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.disable(gl.DEPTH_TEST);
  gl.uniform1f(uniform.uNear,0.2);
  let data=null, count=0, maskFlags=null, alphas=null, ids=[], compareIds=[], depth=null;
  const pos=[0,0,0];
  let yaw=-0.1046,pitch=0.015,fov=38,opacity=0,mode="all",dragging=false,pointer=null,needsSort=true;
  let framePending=false, latestSort=0,sortTimer=null, loadedFrom="";
  const DEG=Math.PI/180;
  const maskStats={};
  function basis() {
    const sy=Math.sin(yaw),cy=Math.cos(yaw),sp=Math.sin(pitch),cp=Math.cos(pitch);
    const right=[cy,0,-sy];
    const down=[-sp*sy,cp,-sp*cy];
    const forward=[cp*sy,sp,cp*cy];
    return {right,down,forward,
      mat:new Float32Array([right[0],down[0],forward[0],right[1],down[1],forward[1],right[2],down[2],forward[2]])};
  }
  function pose(eye,lookAt,FOV=38) {
    pos.splice(0,3,...eye);
    const dx=lookAt[0]-eye[0],dy=lookAt[1]-eye[1],dz=lookAt[2]-eye[2];
    yaw=Math.atan2(dx,dz);
    pitch=Math.atan2(dy,Math.hypot(dx,dz));
    fov=FOV;el("fov").value=FOV;el("fovValue").textContent=FOV+"°";
    needsSort=true;schedule();
  }
  function applyPreset(v) {
    if(v==="capture")pose([0,0,0],[-0.105,0.015,1],38);
    if(v==="figure")pose([0,0,0],[6.95,-2.8,22.5],14);
    if(v==="front")pose([6.95,-2.8,18],[6.95,-2.8,24],38);
    if(v==="entry")pose([6.95,-2.8,20],[6.95,-2.8,26],38);
    if(v==="inside")pose([6.95,-2.8,22.5],[6.95,-2.8,29],38);
    if(v==="exit")pose([6.95,-2.8,27],[6.95,-2.8,33],38);
    if(v==="lookback")pose([6.95,-2.8,27],[6.95,-2.8,21],38);
    if(v==="far")pose([0,0,0],[0,0,75],38);
    el("preset").value=v;
  }
  function createTexture(values,w,h,index) {
    const t=gl.createTexture();textures.push(t);
    gl.activeTexture(gl.TEXTURE0+index);gl.bindTexture(gl.TEXTURE_2D,t);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA32F,w,h,0,gl.RGBA,gl.FLOAT,values);
    gl.uniform1i(uniform[texNames[index]],index);
  }
  async function parseAndLoad(buffer, source) {
    if(buffer.byteLength%32!==0) throw new Error("File size is not divisible by 32; expected standard .splat records.");
    count=buffer.byteLength/32;
    if(count>N_EXPECTED+100000) throw new Error("Unexpectedly large model.");
    if(count!==N_EXPECTED)status("Warning: record count is "+count.toLocaleString()+" (expected 184,148).");
    const view=new DataView(buffer),w=512,h=Math.ceil(count/w),packed=w*h;
    const arrays=[new Float32Array(packed*4),new Float32Array(packed*4),new Float32Array(packed*4),new Float32Array(packed*4)];
    maskFlags=new Uint8Array(count);alphas=new Float32Array(count);
    depth=new Float32Array(count);
    let nfigure=0,nfog=0,nbehind=0,valid=0;
    const twoDeg=2*DEG;
    for(let i=0;i<count;i++) {
      const off=i*32,t=i*4;
      const x=view.getFloat32(off,true),y=view.getFloat32(off+4,true),z=view.getFloat32(off+8,true);
      const sx=view.getFloat32(off+12,true),sy=view.getFloat32(off+16,true),sz=view.getFloat32(off+20,true);
      const a=view.getUint8(off+27)/255;
      const ok=[x,y,z,sx,sy,sz].every(Number.isFinite);
      if(!ok)continue; valid++;
      arrays[0].set([x,y,z,1],t);
      arrays[1].set([sx,sy,sz,0],t);
      const qraw=[view.getUint8(off+28)-128,view.getUint8(off+29)-128,view.getUint8(off+30)-128,view.getUint8(off+31)-128];
      const qn=Math.hypot(...qraw)||1;
      arrays[2].set(qraw.map(q=>q/qn),t);
      arrays[3].set([view.getUint8(off+24)/255,view.getUint8(off+25)/255,view.getUint8(off+26)/255,a],t);
      alphas[i]=a;
      const isFigure=(x>6 && x<7.9 && y>-4.6 && y<-1 && z>21 && z<24);
      const isFog=(z>15 && z<32 && Math.atan2(x,z)>twoDeg && !isFigure);
      const isBehind=(z>40 && z<55);
      maskFlags[i]=(isFigure?1:0)|(isFog?2:0)|(isBehind?4:0);
      nfigure+=isFigure;nfog+=isFog;nbehind+=isBehind;
    }
    maskStats.figure=nfigure;maskStats.fog=nfog;maskStats.behind=nbehind;
    el("counts").textContent="Records: "+count.toLocaleString()+" · Valid: "+valid.toLocaleString()+" · Figure: "+nfigure.toLocaleString()+" · Fog mask: "+nfog.toLocaleString();
    if(nfigure!==1414)el("verification").textContent="Figure count differs from published 1,414. Check source and masks.";
    else el("verification").textContent="Published figure-box count reproduced: 1,414 (if no viewer record reorder).";
    for(let i=0;i<4;i++)createTexture(arrays[i],w,h,i);
    gl.uniform2i(uniform.uTextureSize,w,h);
    data=arrays;loadedFrom=source;
    if(crypto && crypto.subtle) {
      crypto.subtle.digest("SHA-256",buffer).then(hash=>{
        const hex=Array.from(new Uint8Array(hash)).map(x=>x.toString(16).padStart(2,"0")).join("");
        el("hash").textContent="Source SHA-256: "+hex;
      }).catch(()=>{});
    }
    needsSort=true;status("Loaded "+count.toLocaleString()+" splats from "+source);
    schedule();
  }
  async function getModel() {
    const remote=[DATA_URL,FALLBACK_URL];
    let error="";
    for(const url of remote){
      try{
        status("Loading model: "+url);
        const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),25000);
        let response;
        try {response=await fetch(url,{signal:ctrl.signal});}finally{clearTimeout(timer);}
        if(!response.ok)throw new Error("HTTP "+response.status);
        const buf=await response.arrayBuffer();
        await parseAndLoad(buf,url);return;
      }catch(e){error += url+": "+e.message+"; ";}
    }
    status("Automatic loading failed. Choose a .splat file below, or use the external 3D viewer. "+error,true);
    el("fallback").hidden=false;
  }
  function isVisible(i,selectedMode) {
    if(alphas[i]<opacity)return false;
    const m=maskFlags[i];
    if(selectedMode==="figure")return !!(m&1);
    if(selectedMode==="exclude")return !(m&1);
    if(selectedMode==="fog")return !(m&2);
    if(selectedMode==="behind")return !!(m&4);
    return true;
  }
  function sortIndices() {
    if(!data)return;
    const {forward}=basis();
    for(let i=0;i<count;i++) {
      const j=i*4;
      depth[i]=forward[0]*(data[0][j]-pos[0])+forward[1]*(data[0][j+1]-pos[1])+forward[2]*(data[0][j+2]-pos[2]);
    }
    if(mode==="compare"){
      ids=[];compareIds=[];
      for(let i=0;i<count;i++) {
        if(depth[i]<=0.2 || alphas[i]<opacity)continue;
        ids.push(i);if(!(maskFlags[i]&1))compareIds.push(i);
      }
      ids.sort((a,b)=>depth[b]-depth[a]);compareIds.sort((a,b)=>depth[b]-depth[a]);
    } else {
      ids=[];
      for(let i=0;i<count;i++)if(depth[i]>0.2 && isVisible(i,mode))ids.push(i);
      ids.sort((a,b)=>depth[b]-depth[a]);
    }
    needsSort=false;latestSort=performance.now();
    el("visible").textContent=mode==="compare" ? "Left: "+ids.length.toLocaleString()+" · Right: "+compareIds.length.toLocaleString()
      : "Visible: "+ids.length.toLocaleString()+" / "+count.toLocaleString();
  }
  function updateSize() {
    const rect=canvas.getBoundingClientRect(),w=Math.max(2,Math.floor(rect.width*Math.min(devicePixelRatio||1,2))),
      h=Math.max(2,Math.floor(rect.height*Math.min(devicePixelRatio||1,2)));
    if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;needsSort=true;}
  }
  function drawPart(list,viewX,viewW,viewH) {
    const b=basis();
    gl.viewport(viewX,0,viewW,viewH);
    gl.scissor(viewX,0,viewW,viewH);
    gl.uniformMatrix3fv(uniform.uBasis,false,b.mat);
    gl.uniform3fv(uniform.uEye,new Float32Array(pos));
    gl.uniform2f(uniform.uViewport,viewW,viewH);
    gl.uniform1f(uniform.uFocal,0.5*viewH/Math.tan(fov*DEG/2));
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER,idBuffer);
    gl.bufferData(gl.ARRAY_BUFFER,new Uint32Array(list),gl.DYNAMIC_DRAW);
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP,0,4,list.length);
    gl.bindVertexArray(null);
  }
  function draw() {
    framePending=false;updateSize();
    if(!data)return;
    if(needsSort)sortIndices();
    gl.enable(gl.SCISSOR_TEST);
    gl.viewport(0,0,canvas.width,canvas.height);
    gl.scissor(0,0,canvas.width,canvas.height);
    gl.clearColor(0.045,0.061,0.088,1);gl.clear(gl.COLOR_BUFFER_BIT);
    if(mode==="compare"){
      const half=Math.floor(canvas.width/2);
      drawPart(ids,0,half,canvas.height);
      drawPart(compareIds,half,canvas.width-half,canvas.height);
    }else drawPart(ids,0,canvas.width,canvas.height);
    gl.disable(gl.SCISSOR_TEST);
    el("pose").textContent="Camera: ("+pos.map(v=>v.toFixed(2)).join(", ")+") · yaw "+(yaw/DEG).toFixed(1)+"° · pitch "+(pitch/DEG).toFixed(1)+"° · FOV "+fov+"°";
    el("comparelabels").hidden=mode!=="compare";
  }
  function schedule() {
    if(!framePending){framePending=true;requestAnimationFrame(draw);}
  }
  function cameraMoved() {
    needsSort=true;
    if(performance.now()-latestSort>175)schedule();
    clearTimeout(sortTimer);
    sortTimer=setTimeout(schedule,200);
  }
  canvas.addEventListener("pointerdown",e=>{
    canvas.setPointerCapture(e.pointerId);dragging=true;pointer=[e.clientX,e.clientY];e.preventDefault();
  });
  canvas.addEventListener("pointermove",e=>{
    if(!dragging)return;
    const dx=e.clientX-pointer[0],dy=e.clientY-pointer[1];pointer=[e.clientX,e.clientY];
    yaw+=dx*0.004;pitch=Math.max(-1.42,Math.min(1.42,pitch+dy*0.004));
    cameraMoved();
  });
  function endPointer(){dragging=false;pointer=null;cameraMoved();}
  canvas.addEventListener("pointerup",endPointer);
  canvas.addEventListener("pointercancel",endPointer);
  canvas.addEventListener("wheel",e=>{
    e.preventDefault();
    const f=basis().forward, amount=(e.deltaY>0?1:-1)*(e.shiftKey?4:1);
    for(let k=0;k<3;k++)pos[k]+=f[k]*amount;
    cameraMoved();
  },{passive:false});
  document.addEventListener("keydown",e=>{
    if(["INPUT","TEXTAREA","SELECT"].includes(document.activeElement.tagName))return;
    const step=e.shiftKey?2:0.55;
    const b=basis(),move={w:b.forward,s:b.forward.map(v=>-v),a:b.right.map(v=>-v),d:b.right,q:b.down.map(v=>-v),e:b.down}[e.key.toLowerCase()];
    if(move){e.preventDefault();for(let k=0;k<3;k++)pos[k]+=move[k]*step;cameraMoved();}
  });
  el("preset").addEventListener("change",e=>applyPreset(e.target.value));
  el("mask").addEventListener("change",e=>{mode=e.target.value;needsSort=true;schedule();});
  el("opacity").addEventListener("input",e=>{opacity=Number(e.target.value)/100;el("opacityValue").textContent=e.target.value+"%";needsSort=true;schedule();});
  el("fov").addEventListener("input",e=>{fov=Number(e.target.value);el("fovValue").textContent=fov+"°";schedule();});
  el("reset").addEventListener("click",()=>{el("mask").value="all";mode="all";el("opacity").value="0";opacity=0;el("opacityValue").textContent="0%";applyPreset("capture");});
  el("sourcefile").addEventListener("change",async e=>{
    if(!e.target.files?.length)return;
    try{status("Reading selected file...");await parseAndLoad(await e.target.files[0].arrayBuffer(),e.target.files[0].name);}
    catch(err){status(err.message,true);}
  });
  el("snapshot").addEventListener("click",()=>{
    schedule();
    setTimeout(()=>{const a=document.createElement("a");a.href=canvas.toDataURL("image/png");a.download="btcx-file62-"+mode+".png";a.click();},100);
  });
  el("copy").addEventListener("click",async()=>{
    const payload={
      source:loadedFrom,pose:{eye:[...pos],yawDegrees:yaw/DEG,pitchDegrees:pitch/DEG,vFOV:fov},
      mode,opacityThreshold:opacity,figureBox:{x:[6,7.9],y:[-4.6,-1],z:[21,24]},
      counts:{total:count,figure:maskStats.figure,fogZoom:maskStats.fog,behind:maskStats.behind,visible:ids.length}
    };
    try{await navigator.clipboard.writeText(JSON.stringify(payload,null,2));status("Camera settings copied.");}
    catch(err){status("Clipboard unavailable; use browser security context (HTTPS).",true);}
  });
  window.addEventListener("resize",schedule);
  applyPreset("capture");
  getModel();
})();