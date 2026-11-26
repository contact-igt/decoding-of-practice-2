'use client';
import { useRef, useState } from 'react';
import { testimonialVideos } from '../lib/course';

export function TestimonialCarousel() {
  const notes = [
    ['PRACTICAL LEARNING', 'Decoding of Practice helped make legal practice easier to understand.'],
    ['LEARNING IN CONTEXT', 'The programme connected legal concepts with the realities of practice.'],
    ['A NEW PERSPECTIVE', 'Decoding of Practice added a useful perspective to their legal journey.'],
  ];
  const [selected, setSelected] = useState<number | null>(null), [order, setOrder] = useState([0, 1, 2]), [failed, setFailed] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null), video = useRef<HTMLVideoElement>(null);
  function show(index: number) { setFailed(false); setSelected(index); dialog.current?.showModal(); }
  function close() { video.current?.pause(); setSelected(null); }
  function move(direction: number) {
    setOrder(current => direction > 0
      ? [...current.slice(1), current[0]]
      : [current[current.length - 1], ...current.slice(0, -1)]);
  }
  return <>
    <section className="testimonial-carousel" role="region" aria-roledescription="carousel" aria-label="student testimonials">
      <button className="testimonial-arrow testimonial-arrow-previous" type="button" onClick={() => move(-1)} aria-label="Previous student testimonial">←</button>
      <div className="testimonial-track">
        {order.map(index => { const src = testimonialVideos[index]; return <article className="testimonial-card" key={src} role="button" tabIndex={0} onClick={() => show(index)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); show(index); } }} aria-label={`Watch student story ${index + 1}`}>
          <video className="testimonial-preview" src={src} autoPlay muted loop playsInline preload="metadata" aria-hidden="true" />
          <div className="testimonial-note"><span>{notes[index][0]}</span><p>{notes[index][1]}</p></div>
        </article>; })}
      </div>
      <button className="testimonial-arrow testimonial-arrow-next" type="button" onClick={() => move(1)} aria-label="Next student testimonial">→</button>
    </section>
    <dialog className="video-dialog" ref={dialog} onClose={close} aria-label="Student testimonial">
      <div className="video-dialog-header"><strong>Student story {selected === null ? '' : selected + 1}</strong><button type="button" onClick={() => dialog.current?.close()} aria-label="Close video" autoFocus>×</button></div>
      {selected !== null && <video ref={video} className="testimonial-player" src={testimonialVideos[selected]} controls autoPlay playsInline onError={() => setFailed(true)} />}
      {failed && selected !== null && <p role="alert">Video playback is unavailable. <a href={testimonialVideos[selected]} target="_blank" rel="noreferrer">Open video</a></p>}
    </dialog>
  </>;
}
