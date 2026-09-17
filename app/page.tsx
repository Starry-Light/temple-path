'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Pause, Play, RotateCcw, Mountain, Footprints, Maximize, Leaf, Check, Keyboard, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { registerGameTools } from '@/lib/game-tools';
import { createSession, confirmMovement, toggleRest, type Session } from '@/lib/session';
export default function Home() {
  const viewport = useRef<HTMLDivElement>(null);
  const session = useRef(createSession());
  const [state, setState] = useState<Session>({...session.current});
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const [quality, setQuality] = useState<'balanced'|'high'>('balanced');
  const renderQuality = useRef<(high:boolean)=>void>(()=>{});
  const sync = () => setState({...session.current});
  const move = (hand:'left'|'right') => { confirmMovement(session.current, hand); sync(); };
  const rest = () => { toggleRest(session.current); sync(); };
  const start = () => { session.current = createSession(); session.current.mode='running'; sync(); };
  useEffect(() => {
    let cleanup = () => {}; let cancelled=false; const unregister=registerGameTools(()=>session.current,sync);
    import('@/lib/world').then(async ({createWorld}) => {
      if(cancelled || !viewport.current) return;
      cleanup = await createWorld(viewport.current, session, () => setState({...session.current}), () => {if(!cancelled)setLoaded(true);}, (message) => {if(!cancelled)setError(message);}, renderQuality);
      if(cancelled) cleanup();
    }).catch(()=>setError('The 3D scene could not load. Please reload to try again.'));
    const keys = (e:KeyboardEvent) => {
      if(e.repeat || e.ctrlKey || e.metaKey || e.altKey || /INPUT|SELECT|TEXTAREA/.test((e.target as HTMLElement)?.tagName))return;
      if(e.code==='KeyL'){e.preventDefault();confirmMovement(session.current,'left');sync();}
      if(e.code==='KeyR'){e.preventDefault();confirmMovement(session.current,'right');sync();}
      if(e.code==='Escape'){toggleRest(session.current);sync();}
    };
    const visibility = () => {if(document.hidden && ['running','action','prompt'].includes(session.current.mode)){toggleRest(session.current);sync();}};
    window.addEventListener('keydown',keys);document.addEventListener('visibilitychange',visibility);
    return()=>{cancelled=true;cleanup();unregister();window.removeEventListener('keydown',keys);document.removeEventListener('visibilitychange',visibility);};
  },[]);
  const prompt=state.mode==='prompt'; const left=state.index%2===0; const atStart=state.mode==='ready';
  return <main className="game-shell">
    <div ref={viewport} className="world" aria-label="3D temple running game" /><div className="vignette" />{error && !atStart && <div className="scene-error" role="alert">{error} <button onClick={()=>location.reload()}>Reload game</button></div>}
    <header className="topbar">
      <a className="wordmark" href="/" aria-label="Temple Path home"><Mountain size={28}/><span>TEMPLE <b>PATH</b></span></a>
      <div className="chapter"><span className="live-dot"/> THE LOST GARDENS <span className="divider">/</span> CHAPTER 01</div>
      <div className="top-actions"><Button className="glass-button" onClick={()=>{const next=quality==='balanced'?'high':'balanced';setQuality(next);renderQuality.current(next==='high');}} aria-label={`Graphics: ${quality}. Click to switch.`}>{quality==='balanced'?'Balanced':'High'} quality</Button><Button className="icon-button" aria-label="Toggle full screen" onClick={()=>{(document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen()).catch(()=>{});}}><Maximize/></Button></div>
    </header>
    {!atStart && <aside className="session-stat"><span className="eyebrow">COINS COLLECTED</span><strong>{state.coins}<small> / 6</small></strong><span>ancient coins found</span><div className="journey-dots">{Array.from({length:6},(_,i)=><span key={i} className={i<state.coins?'done':''}/>)}</div></aside>}
    {atStart && <section className="intro-panel">
      <div className="eyebrow gold"><span className="small-line"/> A JOURNEY AT YOUR PACE</div>
      <h1>Every movement.<br/><em>A way forward.</em></h1>
      <p>Explore an ancient world and collect its lost coins, one movement at a time.</p>
      <div className="intro-facts"><span><Mountain size={17}/> A 3D temple adventure</span><span><Pause size={17}/> No time limits</span></div>
      <Button className="primary-button" disabled={!loaded || !!error} onClick={start}>{error?'Unable to start':loaded?'Begin journey':'Preparing the garden…'}<ArrowRight size={20}/></Button>
      <div className="input-note"><Keyboard size={16}/> Play with your keyboard or mouse</div>
      {error && <p role="alert">{error} <button onClick={()=>location.reload()}>Reload</button></p>}
    </section>}
    {prompt && <section className="movement-panel" aria-live="polite">
      <div className="prompt-top"><span className="eyebrow gold">COIN {state.index+1} OF 6</span><span className="paused-label"><Pause size={12}/> WORLD PAUSED</span></div>
      <div className="movement-heading"><div className="hand-icon"><Coins size={35}/></div><div><h2>Clench your {left?'left':'right'} fist</h2><p>Clench your {left?'left':'right'} fist to collect the coin.</p></div></div>
      <div className="reassurance">Take your time. Everything will wait.</div>
      <Button className="primary-button" onClick={()=>move(left?'left':'right')}><span>Clench {left?'left':'right'} fist</span><span className="keycap">{left?'L':'R'}</span><ArrowRight size={20}/></Button>
      <span className="mouse-hint">Press {left?'L':'R'} or click the button to simulate this movement</span>
    </section>}
    {state.mode==='rest' && <section className="rest-panel" aria-live="polite"><Leaf size={30} className="gold"/><span className="eyebrow">TAKE A BREATHER</span><h2>Your journey can wait.</h2><p>Everything is held exactly where you left it.</p><Button className="primary-button" onClick={rest}>Continue journey<Play size={18}/></Button></section>}
    {state.mode==='complete' && <section className="rest-panel" aria-live="polite"><div className="completion-icon"><Check size={30}/></div><span className="eyebrow gold">CHAPTER COMPLETE</span><h2>Six coins collected.<br/>The path is yours.</h2><p>You found every coin in the garden. Thank you for playing.</p><Button className="primary-button" onClick={start}>Explore again<RotateCcw size={18}/></Button></section>}
    {state.mode==='running' && <div className="travel-caption"><Footprints size={18}/><span>Follow the path. The next coin is just ahead.</span></div>}
    {state.mode==='action' && <div className="action-feedback"><Coins size={18}/>{state.index%2===0?'Left':'Right'} fist clenched · coin {state.coins+1} collected</div>}
    <footer className="bottom-bar"><span className="location"><span className="location-number">01</span><span>THE LOST GARDENS<small>Morning light · Temple trail</small></span></span><div className="control-legend"><span><kbd>L</kbd> Left fist</span><span><kbd>R</kbd> Right fist</span></div>{!atStart && state.mode!=='complete' ? <Button className="glass-button rest-button" onClick={rest}>{state.mode==='rest'?<Play size={16}/>:<Pause size={16}/>} {state.mode==='rest'?'Resume':'Take a break'} <kbd>Esc</kbd></Button>:<span className="pace-note"><Leaf size={16}/> Always at your pace</span>}</footer>
  </main>;
}


