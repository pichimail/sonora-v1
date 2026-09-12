'use client';

import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity, ArrowUp, AudioLines, Bell, ChevronLeft, ChevronRight, CircleUserRound, FileAudio, Heart,
  Image as ImageIcon, Library, ListMusic, Menu, Mic, Music2, Pause, Play, Plus, Radio, Search,
  Settings2, SlidersHorizontal, Sparkles, Upload, WandSparkles, X
} from 'lucide-react';
import { GooeyMenu, GooeySelect } from './GooeyMenu';
import { MODE_GROUPS, SONORA_MODES } from './modes';
import '@/app/sonora.css';

type Health = { database?: { configured?: boolean; ok?: boolean }; musicgptKey?: boolean; mode?: string; endpointCount?: number };
type Attachment = { id: string; name: string; type: 'audio' | 'image' | 'youtube'; url?: string; status: 'loading' | 'ready' | 'error' };
type Generation = { id: string; feature: string; title: string; status: string; eta?: number; message?: string };
type Job = { id: string; feature: string; status: string; title?: string; created_at?: string };

type MenuKey = 'tools' | 'attach' | 'controls' | 'notifications' | 'profile' | null;

const PLACEHOLDERS = [
  'R&B with female vocals about city lights',
  'Telugu folk-pop with dhol, flute and intimate vocals',
  'Lo-fi beats for a rainy late-night drive',
  'Cinematic orchestral trailer with massive drums',
  'Synthwave remix with analog bass and wide drums',
];

const sectionTags = ['[Verse]', '[Pre-Chorus]', '[Chorus]', '[Bridge]', '[Outro]'];

export function SonoraStudio() {
  const [modeKey, setModeKey] = useState('create');
  const [prompt, setPrompt] = useState('');
  const [lyrics, setLyrics] = useState('');
  const [lyricsOn, setLyricsOn] = useState(false);
  const [activeMenu, setActiveMenu] = useState<MenuKey>(null);
  const [toolGroup, setToolGroup] = useState<(typeof MODE_GROUPS)[number] | null>(null);
  const [toolSearch, setToolSearch] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [health, setHealth] = useState<Health>({});
  const [busy, setBusy] = useState(false);
  const [sidePanel, setSidePanel] = useState<'library' | 'search' | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [model, setModel] = useState('v6');
  const [gender, setGender] = useState('auto');
  const [voiceId, setVoiceId] = useState('');
  const [vocalOnly, setVocalOnly] = useState(false);
  const [albumCover, setAlbumCover] = useState(true);
  const [timestamps, setTimestamps] = useState(true);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [toast, setToast] = useState('');
  const [youtube, setYoutube] = useState('');
  const [playerOpen, setPlayerOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const mode = useMemo(() => SONORA_MODES.find((item) => item.key === modeKey) || SONORA_MODES[0], [modeKey]);

  useEffect(() => {
    fetch('/api/sonora/health').then((response) => response.json()).then(setHealth).catch(() => setHealth({}));
  }, []);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (media.matches) return;
    const id = window.setInterval(() => setPlaceholderIndex((value) => (value + 1) % PLACEHOLDERS.length), 4200);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.key === '/' && !['INPUT', 'TEXTAREA'].includes((event.target as HTMLElement)?.tagName)) {
        event.preventDefault();
        document.getElementById('sonora-prompt')?.focus();
      }
      if (event.key === 'Escape') {
        setActiveMenu(null);
        setToolGroup(null);
        setSidePanel(null);
      }
    };
    document.addEventListener('keydown', key);
    return () => document.removeEventListener('keydown', key);
  }, []);

  const closeMenus = useCallback(() => {
    setActiveMenu(null);
    setToolGroup(null);
  }, []);

  const openMenu = useCallback((key: Exclude<MenuKey, null>, open: boolean) => {
    setActiveMenu(open ? key : null);
    if (!open || key !== 'tools') setToolGroup(null);
  }, []);

  const hasAudio = attachments.some((item) => item.type === 'audio' && item.status === 'ready');
  const hasImage = attachments.some((item) => item.type === 'image' && item.status === 'ready');
  const reason = mode.needsAudio && !hasAudio ? 'Attach audio first' : mode.needsImage && !hasImage ? 'Attach an image first' : mode.needsLyrics && !lyrics.trim() ? 'Add lyrics first' : !prompt.trim() && !lyrics.trim() && !['stems','vocal-remover','denoise','deecho','dereverb','key-bpm','midi','transcribe','cutter','converter','speed','mastering'].includes(mode.key) ? 'Describe what you want' : '';

  async function uploadFile(file: File) {
    const id = crypto.randomUUID();
    const kind = file.type.startsWith('image/') ? 'image' : 'audio';
    setAttachments((items) => [...items, { id, name: file.name, type: kind, status: 'loading' }]);
    const form = new FormData();
    form.append('file', file);
    try {
      const response = await fetch('/api/sonora/upload', { method: 'POST', body: form });
      const result = await response.json();
      setAttachments((items) => items.map((item) => item.id === id ? { ...item, status: response.ok ? 'ready' : 'error', url: result.url || '' } : item));
    } catch {
      setAttachments((items) => items.map((item) => item.id === id ? { ...item, status: 'error' } : item));
    }
  }

  function onFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) void uploadFile(file);
    event.target.value = '';
    closeMenus();
  }

  function addYoutube(event: FormEvent) {
    event.preventDefault();
    const value = youtube.trim();
    if (!value) return;
    setAttachments((items) => [...items, { id: crypto.randomUUID(), name: 'YouTube reference', type: 'youtube', url: value, status: 'ready' }]);
    setYoutube('');
    closeMenus();
  }

  async function generateLyrics() {
    const query = encodeURIComponent(prompt || 'Write an original song');
    setBusy(true);
    try {
      const response = await fetch(`/api/sonora/lyrics?prompt=${query}`);
      const result = await response.json();
      if (typeof result.lyrics === 'string') { setLyrics(result.lyrics); setLyricsOn(true); }
      else setToast(result.message || 'Lyrics generation did not return text.');
    } catch { setToast('Unable to generate lyrics.'); }
    finally { setBusy(false); }
  }

  async function generate() {
    if (reason || busy) return;
    setBusy(true);
    const audio = attachments.find((item) => item.type === 'audio' && item.status === 'ready');
    const image = attachments.find((item) => item.type === 'image' && item.status === 'ready');
    const payload: Record<string, unknown> = {
      prompt: prompt.slice(0, 1000), lyrics: lyricsOn ? lyrics.slice(0, 5000) : '', music_style: prompt.slice(0, 1000),
      model, gender: gender === 'auto' ? '' : gender, voice_id: voiceId, vocal_only: vocalOnly,
      generate_album_cover: albumCover, lyrics_timestamps: timestamps, audio_url: audio?.url || '', image_url: image?.url || '',
    };
    try {
      const response = mode.key === 'lyrics'
        ? await fetch(`/api/sonora/lyrics?prompt=${encodeURIComponent(prompt)}`)
        : await fetch(`/api/sonora/${mode.key}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const result = await response.json();
      if (!response.ok || result.success === false) throw new Error(result.message || 'Generation failed');
      if (mode.key === 'lyrics' && result.lyrics) { setLyrics(String(result.lyrics)); setLyricsOn(true); }
      const item: Generation = { id: result.sonora_job_id || result.task_id || crypto.randomUUID(), feature: mode.label, title: prompt || mode.label, status: result.status || 'IN_QUEUE', eta: Number(result.eta || 0), message: result.message };
      setGenerations((items) => [item, ...items].slice(0, 8));
      setPlayerOpen(true);
      setToast(result.mock ? 'Queued in safe mode.' : 'Generation queued.');
    } catch (error) { setToast(error instanceof Error ? error.message : 'Generation failed'); }
    finally { setBusy(false); }
  }

  async function openLibrary() {
    closeMenus();
    setSidePanel('library');
    try {
      const response = await fetch('/api/sonora/jobs');
      const result = await response.json();
      setJobs(Array.isArray(result.jobs) ? result.jobs : []);
    } catch { setJobs([]); }
  }

  function chooseMode(key: string) {
    setModeKey(key);
    setToolGroup(null);
    setActiveMenu(null);
  }

  const searchedModes = SONORA_MODES.filter((item) => !toolSearch || `${item.label} ${item.description}`.toLowerCase().includes(toolSearch.toLowerCase()));

  return (
    <main className="sonora-root" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const file = event.dataTransfer.files?.[0]; if (file) void uploadFile(file); }}>
      <svg className="sonora-filter-defs" aria-hidden="true"><defs><filter id="sonora-goo"><feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur"/><feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -10" result="goo"/></filter></defs></svg>
      <input ref={fileRef} hidden type="file" accept="audio/*,image/*" onChange={onFile} />

      <aside className="sonora-rail" aria-label="Primary navigation">
        <button className="sonora-logo" aria-label="Sonora"><AudioLines size={18}/></button>
        <button className="sonora-nav-icon active" onClick={() => setSidePanel(null)} aria-label="Create"><Sparkles size={18}/><span>Create</span></button>
        <button className="sonora-nav-icon" onClick={() => setSidePanel('search')} aria-label="Search"><Search size={18}/><span>Search</span></button>
        <button className="sonora-nav-icon" onClick={openLibrary} aria-label="Library"><Library size={18}/><span>Library</span></button>
        <div className="sonora-rail-spacer"/>
        <GooeyMenu open={activeMenu === 'notifications'} onOpenChange={(open) => openMenu('notifications', open)} placement="top-left" label="Notifications" trigger={<button className="sonora-nav-icon" aria-label="Notifications"><Bell size={18}/><span>Notifications</span></button>}>
          <div className="sonora-menu-head"><b>Notifications</b><span>All caught up</span></div>
          <div className="sonora-empty-mini">Generation updates will appear here.</div>
        </GooeyMenu>
        <GooeyMenu open={activeMenu === 'profile'} onOpenChange={(open) => openMenu('profile', open)} placement="top-left" label="Profile" trigger={<button className="sonora-nav-icon" aria-label="Profile"><CircleUserRound size={18}/><span>Profile</span></button>}>
          <div className="sonora-menu-list">
            <button className="sonora-menu-row" onClick={() => setToast('Account settings will use Google OAuth after environment setup.')}><Settings2 size={15}/><span>Account settings</span></button>
            <button className="sonora-menu-row" onClick={() => setToast('Sonora v1')}><Activity size={15}/><span>System status</span></button>
          </div>
        </GooeyMenu>
      </aside>

      <header className="sonora-mobile-header"><button className="sonora-logo"><AudioLines size={17}/></button><b>Sonora</b><button className="sonora-plain-icon" onClick={() => setActiveMenu(activeMenu === 'profile' ? null : 'profile')}><Menu size={19}/></button></header>

      <section className="sonora-main">
        <div className="sonora-statusbar">
          <span className="sonora-status-copy"><i className={`sonora-dot ${health.musicgptKey ? 'live' : ''}`}/>{health.musicgptKey ? 'MusicGPT live' : 'Safe mode'}</span>
          <span className="sonora-status-copy"><i className={`sonora-dot ${health.database?.ok ? 'live' : ''}`}/>{health.database?.ok ? 'Neon connected' : 'Database pending'}</span>
          <button className="sonora-upgrade" onClick={() => setToast('Billing is not enabled yet.')}><Sparkles size={13}/> Upgrade</button>
        </div>

        <section className="sonora-hero">
          <div className="sonora-heading-wrap"><p>SONORA MUSIC SYSTEM</p><h1>Make the track you have in mind.</h1><span>{mode.description}</span></div>

          <div className="sonora-composer">
            {attachments.length ? <div className="sonora-attachments">{attachments.map((item) => <div className={`sonora-attachment ${item.status}`} key={item.id}><div className="sonora-thumb">{item.type === 'image' ? <ImageIcon size={19}/> : <FileAudio size={19}/>}</div><div><b>{item.name}</b><span>{item.status}</span></div><button onClick={() => setAttachments((items) => items.filter((entry) => entry.id !== item.id))}><X size={12}/></button></div>)}</div> : null}

            <div className="sonora-input-stack">
              <textarea id="sonora-prompt" value={prompt} maxLength={1000} onChange={(event) => setPrompt(event.target.value)} aria-label="Music prompt"/>
              {!prompt ? <AnimatePresence mode="wait"><motion.span key={placeholderIndex} className="sonora-placeholder" initial={{ opacity: 0, y: 5, filter: 'blur(5px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, y: -5, filter: 'blur(5px)' }}>{PLACEHOLDERS[placeholderIndex]}</motion.span></AnimatePresence> : null}
            </div>

            <AnimatePresence initial={false}>{lyricsOn ? <motion.div className="sonora-lyrics" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}><div className="sonora-lyrics-head"><span>Lyrics</span><button onClick={generateLyrics} disabled={busy}><WandSparkles size={13}/> Improve</button></div><textarea value={lyrics} maxLength={5000} onChange={(event) => setLyrics(event.target.value)} placeholder="Write or generate lyrics…"/><div className="sonora-tags">{sectionTags.map((tag) => <button key={tag} onClick={() => setLyrics((value) => `${value}${value ? '\n\n' : ''}${tag}\n`)}>{tag}</button>)}</div></motion.div> : null}</AnimatePresence>

            <div className="sonora-composer-actions">
              <div className="sonora-actions-left">
                <GooeyMenu open={activeMenu === 'attach'} onOpenChange={(open) => openMenu('attach', open)} placement="top-left" label="Attach" trigger={<button className="sonora-round-button" aria-label="Attach"><Plus size={18}/></button>}>
                  <div className="sonora-menu-list">
                    <button className="sonora-menu-row" onClick={() => fileRef.current?.click()}><Upload size={15}/><span>Upload audio or image</span></button>
                    <button className="sonora-menu-row" onClick={() => { closeMenus(); setToast('Use your browser microphone recorder from the next audio capture pass.'); }}><Mic size={15}/><span>Record audio</span></button>
                    <form className="sonora-youtube" onSubmit={addYoutube}><label>YouTube / reference URL</label><div><input value={youtube} onChange={(event) => setYoutube(event.target.value)} placeholder="https://…"/><button type="submit"><ArrowUp size={14}/></button></div></form>
                  </div>
                </GooeyMenu>
                <button className={`sonora-pill ${lyricsOn ? 'active' : ''}`} onClick={() => setLyricsOn((value) => !value)}><ListMusic size={15}/> Lyrics</button>
                <GooeyMenu open={activeMenu === 'tools'} onOpenChange={(open) => openMenu('tools', open)} placement="top-left" className="sonora-tools-menu" label="Tools" trigger={<button className="sonora-pill"><SlidersHorizontal size={15}/>{mode.label}</button>}>
                  <AnimatePresence mode="wait" initial={false}>
                    {!toolGroup ? <motion.div key="groups" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }}>
                      <div className="sonora-tool-search"><Search size={14}/><input value={toolSearch} onChange={(event) => setToolSearch(event.target.value)} placeholder="Search tools"/></div>
                      {toolSearch ? <div className="sonora-menu-list tool-scroll">{searchedModes.map((item) => <button className="sonora-menu-row tool-row" key={item.key} onClick={() => chooseMode(item.key)}><span><b>{item.label}</b><small>{item.description}</small></span><ChevronRight size={14}/></button>)}</div> : <div className="sonora-menu-list">{MODE_GROUPS.map((group) => <button className="sonora-menu-row" key={group} onClick={() => setToolGroup(group)}><span>{group}</span><ChevronRight size={14}/></button>)}</div>}
                    </motion.div> : <motion.div key={toolGroup} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}><button className="sonora-back-row" onClick={() => setToolGroup(null)}><ChevronLeft size={15}/>{toolGroup}</button><div className="sonora-menu-list tool-scroll">{SONORA_MODES.filter((item) => item.group === toolGroup).map((item) => <button className={`sonora-menu-row tool-row ${item.key === modeKey ? 'active' : ''}`} key={item.key} onClick={() => chooseMode(item.key)}><span><b>{item.label}</b><small>{item.description}</small></span></button>)}</div></motion.div>}
                  </AnimatePresence>
                </GooeyMenu>
              </div>

              <div className="sonora-actions-right">
                <GooeyMenu open={activeMenu === 'controls'} onOpenChange={(open) => openMenu('controls', open)} placement="top-right" className="sonora-controls-menu" label="Generation controls" trigger={<button className="sonora-round-button" aria-label="Generation settings"><Settings2 size={17}/></button>}>
                  <div className="sonora-control-grid">
                    <label><span>Model</span><GooeySelect label="Model" value={model} onChange={setModel} options={[{label:'v6',value:'v6'},{label:'v5.5',value:'v5.5'},{label:'v5',value:'v5'}]}/></label>
                    <label><span>Vocal gender</span><GooeySelect label="Gender" value={gender} onChange={setGender} options={[{label:'Auto',value:'auto'},{label:'Female',value:'female'},{label:'Male',value:'male'}]}/></label>
                    <label className="wide"><span>Voice ID</span><input value={voiceId} onChange={(event) => setVoiceId(event.target.value)} placeholder="Optional voice ID"/></label>
                    <ToggleRow label="Vocal only" value={vocalOnly} setValue={setVocalOnly}/><ToggleRow label="Album cover" value={albumCover} setValue={setAlbumCover}/><ToggleRow label="Lyric timestamps" value={timestamps} setValue={setTimestamps}/>
                  </div>
                </GooeyMenu>
                <button className={`sonora-submit ${!reason ? 'valid' : ''}`} onClick={generate} disabled={Boolean(reason) || busy} aria-label={reason || 'Generate'}>{busy ? <Activity className="spin" size={17}/> : <ArrowUp size={18}/>}</button>
              </div>
            </div>
          </div>
          <div className="sonora-caption">{reason || `${prompt.length}/1000 · ${mode.label}`} {mode.key !== 'lyrics' ? <button onClick={generateLyrics}>Generate lyrics</button> : null}</div>
        </section>
      </section>

      <AnimatePresence>{sidePanel ? <><motion.button className="sonora-scrim" aria-label="Close panel" onClick={() => setSidePanel(null)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}/><motion.aside className="sonora-side-panel" initial={{ x: '100%', opacity: 0.7 }} animate={{ x: 0, opacity: 1 }} exit={{ x: '100%', opacity: 0.5 }} transition={{ type: 'spring', stiffness: 320, damping: 34 }}><header><div><span>{sidePanel === 'library' ? 'LIBRARY' : 'SEARCH'}</span><h2>{sidePanel === 'library' ? 'Your generations' : 'Find anything'}</h2></div><button onClick={() => setSidePanel(null)}><X size={17}/></button></header>{sidePanel === 'library' ? <div className="sonora-job-list">{jobs.length ? jobs.map((job) => <button key={job.id} className="sonora-job" onClick={() => setToast(`${job.feature} · ${job.status}`)}><span className="sonora-job-art"><Music2 size={16}/></span><span><b>{job.title || job.feature}</b><small>{job.feature} · {job.status}</small></span><Play size={14}/></button>) : <div className="sonora-empty">No persisted generations yet.</div>}</div> : <SearchPanel modes={SONORA_MODES} onChoose={(key) => { chooseMode(key); setSidePanel(null); }}/>}</motion.aside></> : null}</AnimatePresence>

      <AnimatePresence>{generations.length ? <motion.div className="sonora-generation-tray" initial={{ y: 35, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 35, opacity: 0 }}><div><span className="sonora-pulse"/><b>{generations[0].feature}</b><span>{generations[0].message || generations[0].status}</span></div><button onClick={() => setGenerations((items) => items.slice(1))}><X size={14}/></button></motion.div> : null}</AnimatePresence>

      <AnimatePresence>{playerOpen ? <motion.div className="sonora-player" initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}><div className="sonora-player-art"><Music2 size={17}/></div><div className="sonora-player-copy"><b>{generations[0]?.title || 'Sonora preview'}</b><span>{generations[0]?.feature || 'Ready when generation completes'}</span></div><div className="sonora-wave"><i/><i/><i/><i/><i/><i/><i/><i/></div><button onClick={() => setToast('Playback becomes available when the provider returns an audio URL.')}><Play size={17}/></button><button onClick={() => setToast('Saved to your library.')}><Heart size={17}/></button><button onClick={() => setPlayerOpen(false)}><X size={16}/></button></motion.div> : null}</AnimatePresence>

      <nav className="sonora-mobile-tabs"><button onClick={() => setSidePanel(null)}><Sparkles size={18}/><span>Create</span></button><button onClick={() => setSidePanel('search')}><Search size={18}/><span>Search</span></button><button onClick={openLibrary}><Library size={18}/><span>Library</span></button><button onClick={() => setActiveMenu(activeMenu === 'profile' ? null : 'profile')}><CircleUserRound size={18}/><span>Me</span></button></nav>

      <AnimatePresence>{toast ? <motion.button className="sonora-toast" onClick={() => setToast('')} initial={{ opacity: 0, y: 16, scale: .96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: .96 }} onAnimationComplete={() => window.setTimeout(() => setToast(''), 2800)}>{toast}</motion.button> : null}</AnimatePresence>
    </main>
  );
}

function ToggleRow({ label, value, setValue }: { label: string; value: boolean; setValue: (value: boolean) => void }) {
  return <button type="button" className="sonora-toggle-row" onClick={() => setValue(!value)}><span>{label}</span><i className={value ? 'on' : ''}><b/></i></button>;
}

function SearchPanel({ modes, onChoose }: { modes: typeof SONORA_MODES; onChoose: (key: string) => void }) {
  const [query, setQuery] = useState('');
  const results = modes.filter((item) => !query || `${item.label} ${item.description}`.toLowerCase().includes(query.toLowerCase()));
  return <div className="sonora-search-panel"><div className="sonora-search-box"><Search size={16}/><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search tools and workflows"/></div><div className="sonora-job-list">{results.map((item) => <button className="sonora-job" key={item.key} onClick={() => onChoose(item.key)}><span className="sonora-job-art"><Sparkles size={15}/></span><span><b>{item.label}</b><small>{item.description}</small></span><ChevronRight size={14}/></button>)}</div></div>;
}
