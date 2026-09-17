import * as THREE from 'three';
import type { Session } from './session';
export function createCharacterMotion(model:THREE.Object3D, clips:THREE.AnimationClip[]) {
  const mixer=new THREE.AnimationMixer(model);
  const run=mixer.clipAction(clips.find(c=>c.name==='Run')||clips[0]).play();
  mixer.update(.2);
  let lastDistance=0;
  return {
    update(s:Session,dt:number){
      if(s.distance<lastDistance){run.reset().play();mixer.update(.2);}
      if(dt>0)mixer.update(dt);
      lastDistance=s.distance;
    },
    dispose(){mixer.stopAllAction();mixer.uncacheRoot(model);}
  };
}

