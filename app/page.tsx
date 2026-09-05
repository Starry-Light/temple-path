'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Pause, Play, RotateCcw, Hand, Mountain, Footprints, Maximize, Leaf, Check, Keyboard } from 'lucide-react';
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
  const move = (kind:'close'|'open') => { confirmMovement(session.current, kind); sync(); };
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
      if(e.code==='KeyF'){e.preventDefault();confirmMovement(session.current,'close');sync();}
      if(e.code==='KeyO'){e.preventDefault();confirmMovement(session.current,'open');sync();}
      if(e.code==='Escape'){toggleRest(session.current);sync();}
    };
    const visibility = () => {if(document.hidden && ['running','action','prompt'].includes(session.current.mode)){toggleRest(session.current);sync();}};
    window.addEventListener('keydown',keys);document.addEventListener('visibilitychange',visibility);
    return()=>{cancelled=true;cleanup();unregister();window.removeEventListener('keydown',keys);document.removeEventListener('visibilitychange',visibility);};
  },[]);
  const prompt=state.mode==='prompt'; const close=state.index%2===0; const atStart=state.mode==='ready';
  return <main className="game-shell">
    <div ref={viewport} className="world" aria-label="3D temple running game" /><div className="vignette" />{error && !atStart && <div className="scene-error" role="alert">{error} <button onClick={()=>location.reload()}>Reload game</button></div>}
    <header className="topbar">
      <a className="wordmark" href="/" aria-label="Temple Path home"><Mountain size={28}/><span>TEMPLE <b>PATH</b></span></a>
      <div className="chapter"><span className="live-dot"/> THE LOST GARDENS <span className="divider">/</span> CHAPTER 01</div>
      <div className="top-actions"><Button className="glass-button" onClick={()=>{const next=quality==='balanced'?'high':'balanced';setQuality(next);renderQuality.current(next==='high');}} aria-label={`Graphics: ${quality}. Click to switch.`}>{quality==='balanced'?'Balanced':'High'} quality</Button><Button className="icon-button" aria-label="Toggle full screen" onClick={()=>{(document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen()).catch(()=>{});}}><Maximize/></Button></div>
    </header>
    {!atStart && <aside className="session-stat"><span className="eyebrow">YOUR JOURNEY</span><strong>{state.completed}<small> / 6</small></strong><span>movements completed</span><div className="journey-dots">{Array.from({length:6},(_,i)=><span key={i} className={i<state.completed?'done':''}/>)}</div></aside>}
    {atStart && <section className="intro-panel">
      <div className="eyebrow gold"><span className="small-line"/> A JOURNEY AT YOUR PACE</div>
      <h1>Every movement.<br/><em>A way forward.</em></h1>
      <p>Explore an ancient world, one movement at a time. The adventure waits for you.</p>
      <div className="intro-facts"><span><Mountain size={17}/> A 3D temple adventure</span><span><Pause size={17}/> No time limits</span></div>
      <Button className="primary-button" disabled={!loaded || !!error} onClick={start}>{error?'Unable to start':loaded?'Begin journey':'Preparing the garden…'}<ArrowRight size={20}/></Button>
      <div className="input-note"><Keyboard size={16}/> Play with your keyboard or mouse</div>
      {error && <p role="alert">{error} <button onClick={()=>location.reload()}>Reload</button></p>}
    </section>}
    {prompt && <section className="movement-panel" aria-live="polite">
      <div className="prompt-top"><span className="eyebrow gold">MOVEMENT {state.index+1} OF 6</span><span className="paused-label"><Pause size={12}/> WORLD PAUSED</span></div>
      <div className="movement-heading"><div className="hand-icon"><Hand size={35}/></div><div><h2>{close?'Close your hand':'Open your hand'}</h2><p>{close?'Clench your fist to jump over the stones.':'Unclench your fist to duck beneath the arch.'}</p></div></div>
      <div className="reassurance">Take your time. Everything will wait.</div>
      <Button className="primary-button" onClick={()=>move(close?'close':'open')}><span>{close?'Close hand':'Open hand'}</span><span className="keycap">{close?'F':'O'}</span><ArrowRight size={20}/></Button>
      <span className="mouse-hint">Press {close?'F':'O'} or click the button to simulate this movement</span>
    </section>}
    {state.mode==='rest' && <section className="rest-panel" aria-live="polite"><Leaf size={30} className="gold"/><span className="eyebrow">TAKE A BREATHER</span><h2>Your journey can wait.</h2><p>Everything is held exactly where you left it.</p><Button className="primary-button" onClick={rest}>Continue journey<Play size={18}/></Button></section>}
    {state.mode==='complete' && <section className="rest-panel" aria-live="polite"><div className="completion-icon"><Check size={30}/></div><span className="eyebrow gold">CHAPTER COMPLETE</span><h2>Six movements.<br/>A path explored.</h2><p>You reached the garden. Thank you for playing.</p><Button className="primary-button" onClick={start}>Explore again<RotateCcw size={18}/></Button></section>}
    {state.mode==='running' && <div className="travel-caption"><Footprints size={18}/><span>Follow the path. Your next movement is just ahead.</span></div>}
    {state.mode==='action' && <div className="action-feedback"><Check size={18}/>{state.index%2===0?'Hand closed · jumping':'Hand open · ducking'}</div>}
    <footer className="bottom-bar"><span className="location"><span className="location-number">01</span><span>THE LOST GARDENS<small>Morning light · Temple trail</small></span></span><div className="control-legend"><span><kbd>F</kbd> Close hand</span><span><kbd>O</kbd> Open hand</span></div>{!atStart && state.mode!=='complete' ? <Button className="glass-button rest-button" onClick={rest}>{state.mode==='rest'?<Play size={16}/>:<Pause size={16}/>} {state.mode==='rest'?'Resume':'Take a break'} <kbd>Esc</kbd></Button>:<span className="pace-note"><Leaf size={16}/> Always at your pace</span>}</footer>
  </main>;
}


