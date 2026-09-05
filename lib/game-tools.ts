import type { Session } from './session';
import { confirmMovement, toggleRest } from './session';
type Tool = {name:string;description:string;inputSchema:object;annotations:{readOnlyHint:boolean};execute:(input:unknown)=>unknown};
type ModelDocument = Document & {modelContext?:{registerTool:(tool:Tool,options:{signal:AbortSignal})=>void|Promise<void>}};
export function registerGameTools(get:()=>Session,notify:()=>void){
  const context=(document as ModelDocument).modelContext;
  if(!context?.registerTool)return ()=>{};
  const lifecycle=new AbortController();
  const register=(tool:Tool)=>{try{Promise.resolve(context.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{}};
  register({name:'read_journey',description:'Read the current game mode, movement prompt and completed movement count.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute:()=>({...get()})});
  register({name:'simulate_hand_movement',description:'Simulate a close or open hand input for the current untimed prompt. This is a game control, not a measured patient movement.',inputSchema:{type:'object',properties:{movement:{type:'string',enum:['close','open']}},required:['movement'],additionalProperties:false},annotations:{readOnlyHint:false},execute:(input)=>{const kind=(input as {movement?:unknown})?.movement;if(kind!=='close'&&kind!=='open')throw new Error('movement must be close or open');if(!confirmMovement(get(),kind))throw new Error('This movement is not currently requested.');notify();return {...get()};}});
  register({name:'toggle_journey_rest',description:'Pause the current journey for a rest, or resume from an existing rest pause.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:false},execute:()=>{toggleRest(get());notify();return {...get()};}});
  return()=>lifecycle.abort();
}
