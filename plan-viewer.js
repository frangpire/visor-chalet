// Full-screen, read-only plan viewer. No teleport callbacks or 3D camera controls.
export function createPlanViewer({panel,canvas,title,getPlan,onClose}){
 const ctx=canvas.getContext('2d'),points=new Map();let plan=null,scale=1,x=0,y=0,w=1,h=1,dirty=true;
 const visible=()=>!panel.hidden;
 function draw(){if(!visible())return;const d=Math.min(globalThis.devicePixelRatio||1,2);canvas.width=Math.round(w*d);canvas.height=Math.round(h*d);ctx.setTransform(d,0,0,d,0,0);ctx.fillStyle='#ecf0e6';ctx.fillRect(0,0,w,h);if(plan?.image.complete){ctx.drawImage(plan.image,x,y,plan.image.naturalWidth*scale,plan.image.naturalHeight*scale);}dirty=false;}
 function fit(){if(!plan?.image.naturalWidth)return;const b=plan.crop,I=plan.image;scale=Math.min((w-24)/(I.naturalWidth*b.w),(h-24)/(I.naturalHeight*b.h));x=w/2-(b.x+b.w/2)*I.naturalWidth*scale;y=h/2-(b.y+b.h/2)*I.naturalHeight*scale;draw();}
 function resize(){const r=canvas.getBoundingClientRect();w=r.width;h=r.height;fit();}
 function sync(){const p=getPlan();if(p?.key!==plan?.key){plan=p;title.textContent=p.label;fit();}else if(dirty)draw();}
 function zoom(f,cx=w/2,cy=h/2){if(!plan?.image.naturalWidth)return;const I=plan.image;const min=Math.min(w/I.naturalWidth,h/I.naturalHeight)*.7;const ns=Math.max(min,Math.min(scale*f,Math.max(w/I.naturalWidth,h/I.naturalHeight)*10));const k=ns/scale;x=cx-(cx-x)*k;y=cy-(cy-y)*k;scale=ns;draw();}
 function close(){if(!visible())return;panel.hidden=true;points.clear();onClose?.();}
 function position(e){const r=canvas.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top};}
 canvas.addEventListener('pointerdown',e=>{e.preventDefault();canvas.setPointerCapture(e.pointerId);points.set(e.pointerId,position(e));});
 canvas.addEventListener('pointermove',e=>{if(!points.has(e.pointerId))return;e.preventDefault();const prev=[...points.values()],old=points.get(e.pointerId),p=position(e);points.set(e.pointerId,p);const now=[...points.values()];if(now.length===1){x+=p.x-old.x;y+=p.y-old.y;draw();}else{const a=prev[0],b=prev[1],c=now[0],d=now[1],oc={x:(a.x+b.x)/2,y:(a.y+b.y)/2},nc={x:(c.x+d.x)/2,y:(c.y+d.y)/2};x+=nc.x-oc.x;y+=nc.y-oc.y;zoom(Math.hypot(c.x-d.x,c.y-d.y)/Math.max(1,Math.hypot(a.x-b.x,a.y-b.y)),nc.x,nc.y);}});
 for(const type of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(type,e=>points.delete(e.pointerId));
 canvas.addEventListener('wheel',e=>{e.preventDefault();const p=position(e);zoom(Math.exp(-e.deltaY*.0015),p.x,p.y);},{passive:false});
 for(const [id,fn] of [['planclose',close],['planfit',fit],['planplus',()=>zoom(1.3)],['planminus',()=>zoom(1/1.3)]])panel.querySelector('#'+id).onclick=fn;
 for(const type of ['pointerdown','pointerup','pointermove','click','touchstart','touchmove','touchend','wheel'])panel.addEventListener(type,e=>e.stopPropagation());
 globalThis.addEventListener('resize',()=>{if(visible())resize();});
 globalThis.addEventListener('keydown',e=>{if(!visible())return;if(e.code==='Escape'){e.preventDefault();e.stopImmediatePropagation();close();}else if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','ShiftLeft','ShiftRight'].includes(e.code)){e.preventDefault();e.stopImmediatePropagation();}},true);
 return{open(){panel.hidden=false;dirty=true;plan=null;resize();sync();panel.querySelector('#planclose').focus();},close,sync,fit,zoom,get visible(){return visible();},get state(){return{x,y,scale,w,h,key:plan?.key};}};
}
