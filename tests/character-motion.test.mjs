import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';
import * as THREE from 'three';
import {createSession} from '../lib/session.ts';
const source=await readFile(new URL('../lib/character-motion.ts',import.meta.url),'utf8');
const js=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText.replace("from 'three'",`from '${import.meta.resolve('three')}'`).replace("from './session'",`from '${new URL('../lib/session.ts',import.meta.url).href}'`);
const {createCharacterMotion}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
const setup=()=>{const model=new THREE.Group();const leg=new THREE.Bone();leg.name='mixamorigLeftUpLeg';model.add(leg);const clip=(name,values)=>new THREE.AnimationClip(name,1,[new THREE.QuaternionKeyframeTrack(leg.name+'.quaternion',[0,.5,1],values)]);const idle=clip('Idle',[0,0,0,1,0,0,0,1,0,0,0,1]);const run=clip('Run',[0,0,0,1,.5,0,0,.866,0,0,0,1]);return {leg,motion:createCharacterMotion(model,[idle,run]),s:createSession()};};
test('running advances, airborne legs hold their jump pose rather than cycling',()=>{const {leg,motion,s}=setup();s.mode='running';s.distance=1;motion.update(s,.05);const before=leg.quaternion.clone();s.distance=2;motion.update(s,.05);assert.ok(before.angleTo(leg.quaternion)>.01);s.mode='action';s.actionTime=.4;motion.update(s,.05);const jump=leg.quaternion.clone();s.actionTime=1.1;motion.update(s,.05);assert.ok(jump.angleTo(leg.quaternion)<.00001);motion.dispose();});
test('a rest pause preserves the exact blended jump pose',()=>{const {leg,motion,s}=setup();s.mode='action';s.actionTime=.1;motion.update(s,.05);const before=leg.quaternion.clone();s.mode='rest';s.resume='action';for(let i=0;i<100;i++)motion.update(s,0);assert.deepEqual(before.toArray(),leg.quaternion.toArray());motion.dispose();});
test('slide bends the leg without scaling the character',()=>{const {leg,motion,s}=setup();s.mode='action';s.index=1;s.actionTime=.85;motion.update(s,.05);assert.ok(leg.quaternion.angleTo(new THREE.Quaternion())>1);assert.deepEqual(leg.scale.toArray(),[1,1,1]);motion.dispose();});

