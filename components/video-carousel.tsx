'use client';
import { Children, useEffect, useState, type ReactNode } from 'react';

export function VideoCarousel({ label, children }: { label: string; children: ReactNode }) {
  const slides = Children.toArray(children);
  const [offset, setOffset] = useState(0);
  function move(direction: number) { setOffset(current => (current + direction + slides.length) % slides.length); }
  useEffect(() => {
    if (slides.length < 2 || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => {
      if (!document.hidden && !document.querySelector('dialog[open]')) setOffset(current => (current + 1) % slides.length);
    }, 3500);
    return () => window.clearInterval(timer);
  }, [slides.length]);
  return <div className="video-carousel" role="region" aria-roledescription="carousel" aria-label={label}
  >
    <button className="video-carousel-arrow video-carousel-previous" type="button" onClick={() => move(-1)} aria-label={'Previous ' + label}>←</button>
    <div className="video-carousel-track" aria-live="polite">{slides.map((_, index) => slides[(index + offset) % slides.length])}</div>
    <button className="video-carousel-arrow video-carousel-next" type="button" onClick={() => move(1)} aria-label={'Next ' + label}>→</button>
  </div>;
}
