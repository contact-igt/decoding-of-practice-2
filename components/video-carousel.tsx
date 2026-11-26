'use client';
import { useEffect, useRef, useState, type ReactNode } from 'react';

export function VideoCarousel({ label, children }: { label: string; children: ReactNode }) {
  const track = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false), [hovered, setHovered] = useState(false), [focused, setFocused] = useState(false);
  function move(direction: number) {
    const row = track.current;
    const first = row?.firstElementChild as HTMLElement | null;
    if (!row || !first) return;
    const distance = first.getBoundingClientRect().width + parseFloat(getComputedStyle(row).columnGap || '0');
    const end = row.scrollWidth - row.clientWidth;
    const next = direction > 0 && row.scrollLeft >= end - 2 ? 0 : direction < 0 && row.scrollLeft <= 2 ? end : row.scrollLeft + direction * distance;
    row.scrollTo({ left: next, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  }
  useEffect(() => {
    if (paused || hovered || focused || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = setInterval(() => { if (!document.hidden && !document.querySelector('dialog[open]')) move(1); }, 6000);
    return () => clearInterval(timer);
  }, [paused, hovered, focused]);
  return <div className="video-carousel" role="region" aria-roledescription="carousel" aria-label={label}
    onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onFocusCapture={() => setFocused(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}>
    <div className="video-carousel-track" ref={track}>{children}</div>
    <div className="video-carousel-controls"><button type="button" onClick={() => move(-1)} aria-label={'Previous ' + label}>←</button><button type="button" onClick={() => move(1)} aria-label={'Next ' + label}>→</button><button type="button" className="carousel-pause" onClick={() => setPaused(value => !value)}>{paused ? 'Play slides' : 'Pause slides'}</button></div>
  </div>;
}
