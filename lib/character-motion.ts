import * as THREE from 'three';
import type { Session } from './session';
import { ACTION_DURATION } from './session';

type Pose = { bone:THREE.Bone; position:THREE.Vector3; rotation:THREE.Quaternion }[];
const smooth=(x:number)=>{const t=THREE.MathUtils.clamp(x,0,1);return t*t*(3-2*t);};
export function createCharacterMotion(model:THREE.Object3D, clips:THREE.AnimationClip[]) {
  const mixer=new THREE.AnimationMixer(model);
  const bones:THREE.Bone[]=[];
  model.traverse(o=>{if((o as THREE.Bone).isBone)bones.push(o as THREE.Bone);});
  const capture=():Pose=>bones.map(bone=>({bone,position:bone.position.clone(),rotation:bone.quaternion.clone()}));
  const idle=mixer.clipAction(clips.find(c=>c.name==='Idle')||clips[0]).play();
  mixer.update(0); const neutral=capture();
  idle.stop();
  const run=mixer.clipAction(clips.find(c=>c.name==='Run')||clips[0]).play();
  mixer.update(.2);
  let takeoff=capture(),wasAction=false,runTime=.2,lastDistance=0;
  const makePose=(slide:boolean):Pose=>neutral.map(p=>{
    const pose={...p,position:p.position.clone(),rotation:p.rotation.clone()};
    const name=p.bone.name.replace(/^mixamorig[:]?/,'');
    let angle=0;
    if(/UpLeg$/.test(name))angle=slide?1.3:.8;
    else if(/^(Left|Right)Leg$/.test(name))angle=slide?-2.1:-1.35;
    else if(/Foot$/.test(name))angle=slide?.8:.45;
    else if(name==='Spine')angle=slide?-.65:-.18;
    if(angle)pose.rotation.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),angle));
    return pose;
  });
  const jump=makePose(false),slide=makePose(true);
  return {
    update(s:Session,dt:number){
      const action=s.mode==='action'||(s.mode==='rest'&&s.resume==='action');
      if(s.distance<lastDistance){runTime=.2;wasAction=false;}
      if(action&&!wasAction)takeoff=capture();
      if(action){
        // Sample a single takeoff pose: the running clip never advances in the air.
        const p=THREE.MathUtils.clamp(s.actionTime/ACTION_DURATION,0,1);
        const blend=smooth(p/.16)*(1-smooth((p-.80)/.20));
        const target=s.index%2===0?jump:slide;
        target.forEach((pose,i)=>{pose.bone.position.lerpVectors(takeoff[i].position,pose.position,blend);pose.bone.quaternion.slerpQuaternions(takeoff[i].rotation,pose.rotation,blend);});
      }else if(dt>0||wasAction||s.distance<lastDistance){
        runTime+=dt;run.time=runTime; mixer.update(0);
      }
      wasAction=action;lastDistance=s.distance;
    },
    dispose(){mixer.stopAllAction();mixer.uncacheRoot(model);}
  };
}
