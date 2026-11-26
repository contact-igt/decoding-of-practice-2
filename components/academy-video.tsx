'use client';
import { useEffect, useRef, useState } from 'react';
import { track } from '../lib/analytics';

type Player = { playVideo(): void; pauseVideo(): void; mute(): void; unMute(): void; getCurrentTime(): number; getDuration(): number; destroy(): void; getIframe(): HTMLIFrameElement };
type PlayerEvent = { target: Player; data: number };
type API = { Player: new (el: HTMLElement, config: object) => Player };
declare global { interface Window { YT?: API; onYouTubeIframeAPIReady?: () => void } }
let api: Promise<API> | undefined;
function youtube() {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (!api) api = new Promise<API>((resolve, reject) => {
    const script = document.createElement('script');
    const timer = setTimeout(() => { api = undefined; reject(Error('Player unavailable')); }, 12000);
    window.onYouTubeIframeAPIReady = () => { clearTimeout(timer); if (window.YT) resolve(window.YT); };
    script.onerror = () => { clearTimeout(timer); api = undefined; reject(Error('Player unavailable')); };
    script.src = 'https://www.youtube.com/iframe_api'; document.head.append(script);
  });
  return api;
}

export function AcademyVideo({ id, title, context }: { id: string; title: string; context: string }) {
  const box = useRef<HTMLElement>(null), dialog = useRef<HTMLDialogElement>(null), mount = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false), [failed, setFailed] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => { if (entry.intersectionRatio >= .6) { track('video_impression', { video: id }); observer.disconnect(); } }, { threshold: .6 });
    if (box.current) observer.observe(box.current);
    return () => observer.disconnect();
  }, [id]);
  useEffect(() => {
    if (!open || !mount.current) return;
    const root = mount.current, el = document.createElement('div'); root.replaceChildren(el);
    let closed = false, player: Player | undefined, timer: ReturnType<typeof setInterval> | undefined;
    const sent = new Set<number>();
    const timeout = setTimeout(() => { if (!closed) setFailed(true); }, 18000);
    const pause = () => { if (document.hidden) player?.pauseVideo(); };
    document.addEventListener('visibilitychange', pause);
    youtube().then(YT => {
      if (closed) return;
      player = new YT.Player(el, { host: 'https://www.youtube-nocookie.com', videoId: id,
        playerVars: { playsinline: 1, controls: 1, cc_load_policy: 1, origin: location.origin },
        events: {
          onReady: ({ target }: PlayerEvent) => { clearTimeout(timeout); target.getIframe().title = title; target.unMute(); target.playVideo(); },
          onError: () => { if (!closed) setFailed(true); },
          onStateChange: ({ target, data }: PlayerEvent) => {
            if (closed) return;
            if (data === 1) {
              track('video_start', { video: id, initiation: 'user' }); clearInterval(timer);
              timer = setInterval(() => {
                const pct = 100 * target.getCurrentTime() / target.getDuration();
                for (const threshold of [25, 50, 75]) if (pct >= threshold && !sent.has(threshold)) {
                  sent.add(threshold); track('video_progress', { video: id, percent: threshold, initiation: 'user' });
                }
              }, 1000);
              pause();
            } else { clearInterval(timer); if (data === 0) track('video_complete', { video: id, initiation: 'user' }); }
          },
        } });
    }).catch(() => { if (!closed) setFailed(true); });
    return () => { closed = true; clearTimeout(timeout); clearInterval(timer); document.removeEventListener('visibilitychange', pause); player?.destroy(); root.replaceChildren(); };
  }, [open, id, title]);
  function show() { setFailed(false); setOpen(true); dialog.current?.showModal(); }
  return <figure className="academy-video" ref={box}>
    <div className="video-frame"><iframe title={title} src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&controls=0&playsinline=1`} loading="lazy" allow="autoplay; encrypted-media; picture-in-picture" /></div>
    <figcaption><small>{context}</small><strong>{title}</strong><span>Playing connects to YouTube.</span></figcaption>
    <button type="button" className="video-card-trigger" onClick={show} aria-label={'Play video with sound: ' + title} />
    <dialog className="video-dialog" ref={dialog} onClose={() => setOpen(false)} aria-label={title}>
      <div className="video-dialog-header"><strong>{title}</strong><button type="button" onClick={() => dialog.current?.close()} aria-label="Close video" autoFocus>×</button></div>
      {open && <div className="video-dialog-player"><div className="video-mount" ref={mount}/></div>}
      {failed && <p role="alert">Video playback is unavailable. <a href={'https://www.youtube.com/watch?v=' + id} target="_blank" rel="noreferrer">Watch on YouTube</a></p>}
    </dialog>
  </figure>;
}
