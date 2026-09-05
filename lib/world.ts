import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Sky } from 'three/addons/objects/Sky.js';
import { step, OBSTACLES, ACTION_DURATION, type Session } from './session';

type Ref<T> = {current:T};
export async function createWorld(host:HTMLElement, state:Ref<Session>, notify:()=>void, ready:()=>void, fail:(s:string)=>void, quality:Ref<(high:boolean)=>void>) {
  let renderer:THREE.WebGLRenderer;
  try{renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});}catch{fail('This browser could not start 3D graphics. Enable hardware acceleration and reload.');return ()=>{};}
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.25));renderer.setSize(host.clientWidth,host.clientHeight);
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
  host.appendChild(renderer.domElement);
  renderer.domElement.setAttribute('aria-label','A human explorer on a stone path through ancient forest ruins');
  const scene=new THREE.Scene();scene.background=new THREE.Color('#b1bfaa');scene.fog=new THREE.FogExp2('#b1bfaa',0.021);
  const camera=new THREE.PerspectiveCamera(49,host.clientWidth/host.clientHeight,.1,220);
  const sky=new Sky();sky.scale.setScalar(1000);sky.material.uniforms.turbidity.value=6;sky.material.uniforms.rayleigh.value=1.5;
  const sunDirection=new THREE.Vector3(-.55,.6,-.5);sky.material.uniforms.sunPosition.value.copy(sunDirection);scene.add(sky);
  const environmentScene=new THREE.Scene();environmentScene.add(sky.clone());const pmrem=new THREE.PMREMGenerator(renderer);const env=pmrem.fromScene(environmentScene,.04);scene.environment=env.texture;scene.environmentIntensity=.5;pmrem.dispose();
  const sun=new THREE.DirectionalLight('#ffe3ac',3.1);sun.position.set(-17,26,-24);sun.castShadow=true;
  sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-22;sun.shadow.camera.right=22;sun.shadow.camera.top=25;sun.shadow.camera.bottom=-25;sun.shadow.camera.near=.5;sun.shadow.camera.far=90;sun.shadow.bias=-.0003;sun.shadow.normalBias=.035;scene.add(sun,sun.target);
  scene.add(new THREE.HemisphereLight('#d8e8ed','#303b25',1.7));
  quality.current=(high)=>{renderer.setPixelRatio(Math.min(devicePixelRatio,high?1.75:1.25));renderer.setSize(host.clientWidth,host.clientHeight);};
  const loader=new THREE.TextureLoader();
  const textures:THREE.Texture[]=[];
  const tex=async (path:string,color=false,repeat=1)=>{const t=await loader.loadAsync('/assets/'+path);t.colorSpace=color?THREE.SRGBColorSpace:THREE.NoColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(repeat,repeat);t.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());textures.push(t);return t;};
  let stoneMap:THREE.Texture,stoneNormal:THREE.Texture,groundMap:THREE.Texture,groundNormal:THREE.Texture;
  try{[stoneMap,stoneNormal,groundMap,groundNormal]=await Promise.all([tex('stone-color.jpg',true),tex('stone-normal.jpg'),tex('ground-color.jpg',true,30),tex('ground-normal.jpg',false,30)]);}catch{fail('Some scenery could not load. Please reload to try again.');renderer.dispose();renderer.domElement.remove();return ()=>{};}
  const stone=new THREE.MeshStandardMaterial({map:stoneMap,normalMap:stoneNormal,normalScale:new THREE.Vector2(.65,.65),roughness:.94,color:'#bcb8a1'});
  const darkStone=stone.clone();darkStone.color.set('#69735d');
  const ground=new THREE.MeshStandardMaterial({map:groundMap,normalMap:groundNormal,roughness:1,color:'#9aa07a'});
  const bark=stone.clone();bark.color.set('#554936');
  const brass=new THREE.MeshStandardMaterial({color:'#b79a59',metalness:.65,roughness:.6});
  const baseBox=new THREE.BoxGeometry(1,1,1);
  const box=(w:number,h:number,d:number,x:number,y:number,z:number,mat:THREE.Material=stone,parent:THREE.Object3D=scene)=>{const m=new THREE.Mesh(baseBox,mat);m.scale.set(w,h,d);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;parent.add(m);return m;};
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(150,300),ground);floor.rotation.x=-Math.PI/2;floor.position.set(0,-.22,-90);floor.receiveShadow=true;scene.add(floor);
  let seed=34;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  // Reusable stone slabs keep the draw-call budget stable along the entire route.
  const slabs=new THREE.InstancedMesh(baseBox,stone,3*102);const dummy=new THREE.Object3D();let n=0;
  for(let z=10;z>-194;z-=2){for(let lane=-1;lane<=1;lane++){dummy.position.set(lane*1.64,-.08+random()*.025,z);dummy.scale.set(1.59,.23,1.95);dummy.rotation.set(0,(random()-.5)*.017,0);dummy.updateMatrix();slabs.setMatrixAt(n++,dummy.matrix);slabs.setColorAt(n-1,new THREE.Color().setScalar(.74+random()*.26));}}
  slabs.castShadow=false;slabs.receiveShadow=true;scene.add(slabs);
  for(let z=7;z>-185;z-=4){for(const side of [-1,1]){
    box(.26,.3,3.9,side*2.65,.05,z,darkStone);
    if(Math.round((7-z)/4)%3===0){box(.9,.35,.9,side*3.5,.05,z);box(.56,2.5+random(),.6,side*3.5,1.4,z);box(.85,.25,.85,side*3.5,2.9,z);}
  }}
  // Monumental entrance and repeated ruined gateways frame the long sightline.
  const gateway=(z:number)=>{
    for(const side of [-1,1]){
      box(1.7,.45,1.9,side*4,.12,z);box(1.2,6.3,1.35,side*4,3.1,z);box(1.6,.4,1.7,side*4,6.2,z);
      for(let y=1;y<6;y+=.65)box(1.24,.07,1.39,side*4,y,z,darkStone);
      box(1.55,.32,1.65,side*4,5.6,z);
    }
    box(9.5,.75,1.8,0,6.8,z);box(10.1,.25,2,0,7.3,z);box(8.7,.28,1.5,0,7.55,z);
    for(let x=-3;x<=3;x+=.75)box(.34,.38,.12,x,6.85,z+ .95,darkStone);
    for(let k=0;k<3;k++)box(3.6-k*.7,.4,1.7-k*.2,0,7.85+k*.4,z);
  };
  gateway(-9);gateway(-59);gateway(-109);gateway(-166);
  // Irregular rock outcrops, tree trunks, branches and instanced leaves.
  const rockGeo=new THREE.IcosahedronGeometry(1,1);
  const leaves=new THREE.InstancedMesh(new THREE.SphereGeometry(1,5,3),new THREE.MeshStandardMaterial({color:'#435331',roughness:.95}),2800);
  let leafIndex=0;
  for(let i=0;i<105;i++){
    const side=i%2?1:-1,x=side*(7+random()*29),z=16-random()*211,h=7+random()*11;
    const tree=new THREE.Mesh(new THREE.CylinderGeometry(.12,.4+random()*.35,h,7),bark);tree.position.set(x,h/2-.2,z);tree.rotation.z=(random()-.5)*.13;tree.castShadow=true;scene.add(tree);
    for(let b=0;b<3;b++){
      const branch=new THREE.Mesh(new THREE.CylinderGeometry(.07,.18,4,5),bark);branch.position.set(x+(b-1)*1.3,h*.7+b*.7,z);branch.rotation.z=(b-1)*.8;branch.castShadow=true;scene.add(branch);
    }
    for(let j=0;j<23;j++){
      dummy.position.set(x+(random()-.5)*8,h-1+random()*4,z+(random()-.5)*7);dummy.scale.set(1.1+random()*1.8,.4+random()*.6,.7+random());dummy.rotation.set(random(),random()*Math.PI,random());dummy.updateMatrix();leaves.setMatrixAt(leafIndex,dummy.matrix);leaves.setColorAt(leafIndex,new THREE.Color().setHSL(.2+random()*.07,.25+random()*.15,.19+random()*.14));leafIndex++;
    }
    const rock=new THREE.Mesh(rockGeo,i%3?darkStone:stone);rock.position.set(side*(3.5+random()*8),.2,z);rock.scale.set(1+random()*2,.5+random()*1.7,1+random()*2);rock.rotation.set(random(),random()*4,random());rock.castShadow=rock.receiveShadow=true;scene.add(rock);
  }
  leaves.count=leafIndex;leaves.castShadow=true;scene.add(leaves);
  const grassGeo=new THREE.ConeGeometry(.16,.85,3);grassGeo.translate(0,.38,0);
  const grass=new THREE.InstancedMesh(grassGeo,new THREE.MeshStandardMaterial({color:'#596e32',roughness:1}),2200);
  for(let i=0;i<2200;i++){const side=i%2?1:-1;dummy.position.set(side*(2.9+random()*12),-.15,12-random()*204);dummy.scale.set(.6+random(),.5+random(),.6+random());dummy.rotation.set((random()-.5)*.4,random()*6,(random()-.5)*.4);dummy.updateMatrix();grass.setMatrixAt(i,dummy.matrix);}grass.receiveShadow=true;scene.add(grass);
  OBSTACLES.forEach((distance,i)=>{
    const z=-distance;
    if(i%2===0){for(let j=-1;j<=1;j++){const m=box(1.58,.64,.75,j*1.61,.32,z);m.rotation.y=(random()-.5)*.1;box(1.5,.055,.77,j*1.61,.67,z,brass);}}
    else {for(const side of [-1,1]){box(.7,2.4,.8,side*2.15,1.2,z);box(.9,.22,1,side*2.15,2.5,z);}box(5.1,.58,.85,0,1.62,z);box(4.2,.045,.88,0,1.31,z,brass);}
  });
  // A single animated human asset, with simulation-driven animation time.
  const runnerRoot=new THREE.Group();scene.add(runnerRoot);let mixer:THREE.AnimationMixer|undefined;
  let run:THREE.AnimationAction|undefined;let idle:THREE.AnimationAction|undefined;
  const bones:Record<string,THREE.Bone>={};
  try{
    const gltf=await new GLTFLoader().loadAsync('/assets/runner.glb');const model=gltf.scene;
    const bounds=new THREE.Box3().setFromObject(model);const height=bounds.max.y-bounds.min.y;model.scale.setScalar(1.8/height);model.position.y=-bounds.min.y*(1.8/height);model.rotation.y=0;
    model.traverse(o=>{if((o as THREE.Mesh).isMesh){o.castShadow=true;o.receiveShadow=true;}if((o as THREE.Bone).isBone)bones[o.name]=(o as THREE.Bone);});runnerRoot.add(model);
    mixer=new THREE.AnimationMixer(model);const runClip=gltf.animations.find(c=>c.name==='Run')||gltf.animations[0];const idleClip=gltf.animations.find(c=>c.name==='Idle');
    run=mixer.clipAction(runClip);run.play();if(idleClip){idle=mixer.clipAction(idleClip);idle.play();idle.setEffectiveWeight(0);}mixer.update(.2);ready();
  }catch{fail('The explorer could not load. Please reload to try again.');}
  let frame=0,last=performance.now(),previousMode=state.current.mode,previousDistance=0;
  const resize=()=>{camera.aspect=host.clientWidth/host.clientHeight;camera.updateProjectionMatrix();renderer.setSize(host.clientWidth,host.clientHeight);};
  const observer=new ResizeObserver(resize);observer.observe(host);
  const target=new THREE.Vector3();let lastAction=false;
  function animate(now:number){
    frame=requestAnimationFrame(animate);
    const s=state.current;const delta=Math.min((now-last)/1000,.05);last=now;
    const dt=step(s,delta);
    const isAction=s.mode==='action'||(s.mode==='rest'&&s.resume==='action');
    const actionProgress=isAction?Math.min(s.actionTime/ACTION_DURATION,1):0;
    const arc=Math.sin(actionProgress*Math.PI);
    // Mixer advances only with simulation time. No wall-clock catch-up after a pause.
    if(mixer && (dt>0||s.distance<previousDistance||lastAction&&!isAction))mixer.setTime(s.time+.2);
    if(run && idle){const idleWeight=s.mode==='complete'||s.mode==='ready'?1:0;idle.setEffectiveWeight(idleWeight);run.setEffectiveWeight(1-idleWeight);}
    runnerRoot.position.set(0,isAction&&s.index%2===0?arc*1.5:0,-s.distance);
    runnerRoot.rotation.x=isAction&&s.index%2===1?-arc*.8:0;
    runnerRoot.scale.y=isAction&&s.index%2===1?1-arc*.35:1;
    const intro=s.mode==='ready';
    camera.position.set(intro?-6:0,intro?3.5:3.1,-s.distance+(intro?7.5:6.3));
    target.set(intro?1.2:0,intro?2.2:1.5,-s.distance-7);camera.lookAt(target);
    sun.position.set(-17,26,-s.distance-24);sun.target.position.set(0,0,-s.distance-8);
    if(s.mode!==previousMode){notify();previousMode=s.mode;}
    previousDistance=s.distance;lastAction=isAction;
    renderer.render(scene,camera);
  }
  frame=requestAnimationFrame(animate);
  const contextLost=(event:Event)=>{event.preventDefault();if(['running','action','prompt'].includes(state.current.mode)){state.current.resume=state.current.mode;state.current.mode='rest';notify();}fail('3D graphics were interrupted. Reload to restart the journey.');};renderer.domElement.addEventListener('webglcontextlost',contextLost);
  return ()=>{cancelAnimationFrame(frame);observer.disconnect();renderer.domElement.removeEventListener('webglcontextlost',contextLost);mixer?.stopAllAction();const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>();scene.traverse(o=>{const m=o as THREE.Mesh;if(m.isMesh){geometries.add(m.geometry);(Array.isArray(m.material)?m.material:[m.material]).forEach(v=>materials.add(v));}});geometries.forEach(g=>g.dispose());materials.forEach(m=>{Object.values(m).forEach(v=>{if(v instanceof THREE.Texture)v.dispose();});m.dispose();});textures.forEach(t=>t.dispose());env.dispose();renderer.dispose();renderer.domElement.remove();};
}


