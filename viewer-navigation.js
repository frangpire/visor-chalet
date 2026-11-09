import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js?v=1862980e43c81197';

// Separate screen-only camera: the walking/XR rig and all safety checks stay untouched.
export function initialView(search) {
 const p=new URLSearchParams(search);
 return p.get('mode')==='aerial'?'aerial':(p.get('mode')==='walk'||p.has('view')?'walk':'aerial');
}
export function createNavigation({renderer,walkCamera,onChange=()=>{},clearInput=()=>{},search='',viewport=()=>({width:innerWidth,height:innerHeight}),urlChange=()=>{}}) {
 const aerialCamera=new THREE.PerspectiveCamera(70,1,0.1,900);
 const orbit=new OrbitControls(aerialCamera,renderer.domElement);
 orbit.touchRotateDirection=-1; // Screen-finger rotation only; mouse, pinch and two-finger pan stay unchanged.
 orbit.enabled=false; orbit.enableDamping=true; orbit.dampingFactor=0.08;
 orbit.screenSpacePanning=false; orbit.minDistance=6; orbit.maxDistance=160;
 orbit.minPolarAngle=0.05; orbit.maxPolarAngle=Math.PI/2-0.035;
 let mode='walk',resumeMode='walk',screenBlocked=false;
 function resize(){const {width,height}=viewport();aerialCamera.aspect=width/height;
  // Keep the photograph's horizontal field and enough vertical field on wide screens.
  const v=THREE.MathUtils.radToDeg(2*Math.atan(Math.tan(Math.PI/4)/aerialCamera.aspect));
  aerialCamera.fov=Math.max(55,Math.min(105,v));aerialCamera.updateProjectionMatrix();}
 function reset(){
  resize();const damping=orbit.enableDamping;orbit.enableDamping=false;orbit.update();
  aerialCamera.position.set(25,14,22);orbit.target.set(8,0.5,6);orbit.update();
  // Portrait screens need a little more distance to keep the whole house in frame.
  if(aerialCamera.aspect<1.25){
   const corners=[];for(const b of [[-5.2,-4.1,0,19.8,13.9,7.8],[-0.5,-16,0,12.3,-4,1],[-10.5,-12.6,0,-7.2,-8.3,2.8]])
    for(const x of [b[0],b[3]])for(const y of [b[1],b[4]])for(const z of [b[2],b[5]])corners.push(new THREE.Vector3(x,z,-y));
   for(let i=0;i<16;i++){aerialCamera.updateMatrixWorld(true);const fits=corners.every(c=>{const p=c.clone().project(aerialCamera);return Math.abs(p.x)<0.9&&Math.abs(p.y)<0.9&&p.z<1;});if(fits)break;aerialCamera.position.sub(orbit.target).multiplyScalar(1.12).add(orbit.target);orbit.update();}
  }
  orbit.enableDamping=damping;
 }

 function change(next,write=true){mode=next;orbit.enabled=next==='aerial'&&!renderer.xr.isPresenting&&!screenBlocked;clearInput();onChange(next);if(write)urlChange(next);}
 reset();
 return {
  aerialCamera,orbit,initial:initialView(search),get mode(){return mode;},
  get camera(){return renderer.xr.isPresenting||mode==='walk'?walkCamera:aerialCamera;},
  get walking(){return mode==='walk'||renderer.xr.isPresenting;},
  aerial(resetView=true,write=true){if(renderer.xr.isPresenting)return false;document.exitPointerLock?.();if(resetView)reset();change('aerial',write);return true;},
  walkingMode(write=true){change('walk',write);},
  beginXR(){resumeMode=mode;const fromAerial=mode==='aerial';change('walk',false);return fromAerial;},
  endXR(){change(resumeMode,false);},
  setScreenBlocked(blocked){screenBlocked=!!blocked;orbit.enabled=mode==='aerial'&&!renderer.xr.isPresenting&&!screenBlocked;},
  update(){orbit.enabled=mode==='aerial'&&!renderer.xr.isPresenting&&!screenBlocked;if(orbit.enabled)orbit.update();},resize
 };
}
