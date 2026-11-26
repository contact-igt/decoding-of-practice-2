'use client';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { academy, course, route } from '../lib/course';
import { track } from '../lib/analytics';
import { Tracking } from './tracking';

type View = { step: number; revision: number; changed: boolean; variant: string; answers: (number | null)[];
  questions: { subject: string; prompt: string; choices: string[] }[]; result: { reference: string; qualified: boolean; score: number } | null };
const path = route + '/assessment';
async function request(method: string, input?: object): Promise<View> {
  const r = await fetch('/api/dop-assessment', { method, cache: 'no-store', headers: { 'Content-Type': 'application/json' },
    body: input ? JSON.stringify(input) : undefined, signal: AbortSignal.timeout(10000) });
  const data = await r.json();
  if (!r.ok) throw Error(data.message || 'Unable to save. Please retry.');
  return data;
}
export function Assessment({ resultPage = false }: { resultPage?: boolean }) {
  const [v, setView] = useState<View | null>(null), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const lock = useRef(false), heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    let active = true;
    request(resultPage ? 'GET' : 'PUT').then(view => {
      if (view.changed && !resultPage) track('assessment_started', { variant: view.variant, mode: 'local' });
      if (!active) return;
      if (Boolean(view.result) !== resultPage) { location.replace(path + (view.result ? '/result' : '')); return; }
      setView(view);
    }).catch(e => { if (active) setError(e.message); });
    return () => { active = false; };
  }, [resultPage]);
  async function save(step: number, choice: number | null = null, finish = false) {
    if (!v || lock.current) return;
    lock.current = true; setBusy(true); setError('');
    try {
      const view = await request(finish ? 'POST' : 'PATCH', { revision: v.revision, index: v.step, choice, step });
      if (finish && view.result) {
        if (view.changed) {
          track('assessment_completed', { variant: view.variant, mode: 'local' });
          track(view.result.qualified ? 'assessment_qualified' : 'assessment_not_qualified', { variant: view.variant, mode: 'local' });
        }
        location.replace(path + '/result'); return;
      }
      setView(view);
      if (v.step !== step) {
        track('assessment_question_progress', { question: Math.min(step + 1, 9), variant: v.variant, mode: 'local' });
        requestAnimationFrame(() => heading.current?.focus());
      }
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to confirm progress. Please retry.'); }
    finally { lock.current = false; setBusy(false); }
  }
  const q = v?.questions[v.step], result = v?.result;
  return <main className="exam-shell">
    <header className="exam-header"><Image src={course.photos.logo} alt="VLS Law Academy" width={54} height={54}/><span>Decoding of Practice</span></header>
    <article className="exam-card">
      <p className="eyebrow"><span/>Admission assessment</p>
      {!v && <><h1>{error ? 'Assessment access' : 'Opening your assessment…'}</h1><a className="text-link" href={route + '#admission'}>Return to registration</a></>}
      {v && <p className="demo-note">Local demonstration · Test fixtures only. Use fictional details. Results do not affect admission.</p>}
      {result ? <>
        <h1>{result.qualified ? 'Congratulations! You Have Cleared the Admission Assessment.' : 'Assessment Completed'}</h1>
        <p className="exam-score">{result.score} <small>/ 9</small></p>
        <p><strong>{result.qualified ? 'Qualified for admissions review' : 'Not yet qualified'}</strong></p>
        <p>{result.qualified ? 'Based on your assessment performance, you may be eligible for a course fee concession. Our admissions team will contact you with the applicable concession, programme fees and upcoming batch details.' : 'The admissions team can guide you about preparation and available retake options. You must clear the assessment before admission.'}</p>
        <p>Application reference <strong>{result.reference}</strong></p>
        <a className="button" href={academy.whatsapp} data-track="admission_whatsapp_click">Speak to the Admission Team</a>
      </> : q && v ? <>
        <div className="exam-progress"><span>Question {v.step + 1} of 9</span><span>{q.subject}</span></div>
        <progress aria-label="Assessment progress" value={v.step + 1} max={9}/>
        <h1 ref={heading} tabIndex={-1} id="question-title">{q.prompt}</h1>
        <fieldset aria-labelledby="question-title" aria-busy={busy}>{q.choices.map((text, i) =>
          <label key={q.prompt + i}><input type="radio" name="answer" checked={v.answers[v.step] === i} onChange={() => save(v.step, i)} />{text}</label>)}</fieldset>
        <div className="exam-nav"><button className="text-link" disabled={busy || v.step === 0} onClick={() => save(v.step - 1)}>Previous</button>
          <button className="button" disabled={busy || v.answers[v.step] === null} onClick={() => save(v.step + 1)}>{v.step === 8 ? 'Review answers' : 'Next'}</button></div>
        <small role="status">{busy ? 'Saving…' : 'Progress saved on this device.'}</small>
      </> : v && !result ? <>
        <h1 ref={heading} tabIndex={-1}>Review your answers</h1><p>Check your nine responses before submitting. Submission finalises this attempt.</p>
        <ol className="review-list">{v.questions.map((item, i) => <li key={i}><div>{item.prompt}<br/><strong>{item.choices[v.answers[i]!]}</strong></div><button className="text-link" disabled={busy} onClick={() => save(i)} aria-label={'Edit question ' + (i+1)}>Edit</button></li>)}</ol>
        <div className="exam-nav"><button className="text-link" disabled={busy} onClick={() => save(8)}>Previous</button><button className="button" disabled={busy} onClick={() => save(9, null, true)}>Submit assessment</button></div>
      </> : null}
      {error && <div role="alert"><p>{error}</p><button className="text-link" onClick={() => location.reload()}>Reload saved progress</button></div>}
    </article><Tracking variant={v?.variant ?? 'A'} trackPage={false}/>
  </main>;
}
