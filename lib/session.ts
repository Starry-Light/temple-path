export type Mode = 'ready'|'running'|'prompt'|'action'|'rest'|'complete';
export type Session = {mode:Mode;resume:Mode;distance:number;index:number;coins:number;actionTime:number;time:number};
export const COIN_POSITIONS = [20,45,70,95,120,145];
export const SPEED = 4;
export const ACTION_DURATION = 1.2;
export function createSession():Session {return {mode:'ready',resume:'running',distance:0,index:0,coins:0,actionTime:0,time:0};}
export function confirmMovement(s:Session, hand:'left'|'right') {
  if(s.mode!=='prompt' || hand!==(s.index%2===0?'left':'right'))return false;
  s.mode='action';s.actionTime=0;return true;
}
export function toggleRest(s:Session) {
  if(s.mode==='rest'){s.mode=s.resume;return;}
  if(['running','prompt','action'].includes(s.mode)){s.resume=s.mode;s.mode='rest';}
}
export function step(s:Session, rawDt:number) {
  if(s.mode!=='running' && s.mode!=='action')return 0;
  let dt=Math.max(0,Math.min(rawDt,0.05));
  if(s.mode==='running' && s.index<COIN_POSITIONS.length){
    const remaining=(COIN_POSITIONS[s.index]-3.4-s.distance)/SPEED;
    if(dt>=remaining){dt=Math.max(0,remaining);s.mode='prompt';}
  }
  s.time+=dt;s.distance+=SPEED*dt;
  if(s.mode==='action'){
    s.actionTime+=dt;
    if(s.actionTime>=ACTION_DURATION){s.coins++;s.index++;s.actionTime=0;s.mode='running';}
  }
  if(s.index>=COIN_POSITIONS.length && s.distance>=157)s.mode='complete';
  return dt;
}
