'use client';
import { useEffect, useRef, useState } from 'react';
import { academy, route } from '../lib/course';
import { track } from '../lib/analytics';
import { Tracking } from './tracking';

type View = { attemptId: string; step: number; revision: number; changed: boolean; variant: string; answers: (number | null)[];
  mode: 'local' | 'webhook'; pendingDelivery: boolean;
  questions: { subject: string; prompt: string; choices: string[] }[]; result: { reference: string } | null };
const path = route + '/assessment';
async function request(method: string, input?: object): Promise<View> {
  const r = await fetch('/api/dop-assessment', { method, cache: 'no-store', headers: { 'Content-Type': 'application/json' },
    body: input ? JSON.stringify(input) : undefined, signal: AbortSignal.timeout(20000) });
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
      if (view.changed && !resultPage) track('assessment_started', { variant: view.variant, mode: view.mode });
      if (!active) return;
      if (Boolean(view.result) !== resultPage) { location.replace(path + (view.result ? '/result' : '')); return; }
      setView(view);
    }).catch(e => { if (active) setError(e.message); });
    return () => { active = false; };
  }, [resultPage]);
  async function save(step: number, choice: number | null = null, finish = false) {
    if (!v || lock.current) return;
    lock.current = true; setBusy(true); setError('');
    if (choice !== null) setView({ ...v, answers: v.answers.map((answer, i) => i === v.step ? choice : answer) });
    try {
      const view = await request(finish ? 'POST' : 'PATCH', { attemptId: v.attemptId, revision: v.revision, index: v.step, choice, step });
      if (finish && view.result) {
        if (view.changed) {
          track('assessment_completed', { variant: view.variant, mode: view.mode });
        }
        location.replace(path + '/result'); return;
      }
      setView(view);
      if (v.step !== step) {
        track('assessment_question_progress', { question: Math.min(step + 1, 9), variant: v.variant, mode: v.mode });
        requestAnimationFrame(() => {
          heading.current?.focus({ preventScroll: true });
          heading.current?.scrollIntoView({ block: 'nearest' });
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to confirm progress. Please retry.');
      if (choice !== null) setView(v);
      if (finish) {
        try {
          const view = await request('GET');
          if (view.result) location.replace(path + '/result');
          else setView(view);
        } catch { /* Keep the saved review visible for retry. */ }
      }
    }
    finally { lock.current = false; setBusy(false); }
  }
  const q = v?.questions[v.step], result = v?.result;
  return <main className="exam-shell" id="main">
    <article className="exam-card">
      <p className="eyebrow"><span/>Admission assessment</p>
      {!v && <><h1>{error ? 'Assessment access' : 'Opening your assessment…'}</h1><a className="text-link" href={route + '#admission'}>Return to registration</a></>}
      {v?.mode === 'local' && <p className="demo-note">Local demonstration · Test fixtures only. Use fictional details.</p>}
      {result ? <>
        <h1>Thank you for completing the assessment</h1>
        <p>Your answers have been received. The VLS admissions team will contact you about next steps.</p>
        <p>Application reference <strong>{result.reference}</strong></p>
        <a className="button" href={academy.whatsapp} data-track="admission_whatsapp_click">Speak to the Admission Team</a>
        <p>Keep your application reference. Starting a new registration switches this browser to the next applicant.</p>
        <a className="text-link" href={route + '?new=1#form-title'}>Register another applicant</a>
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
        <h1 ref={heading} tabIndex={-1}>{v.pendingDelivery ? 'Confirm delivery' : 'Review your answers'}</h1>
        <p>{v.pendingDelivery ? 'Your answers are saved. Retry submission to confirm delivery.' : 'Check your nine responses before submitting. Submission finalises this attempt.'}</p>
        <ol className="review-list">{v.questions.map((item, i) => <li key={i}><div>{item.prompt}<br/><strong>{item.choices[v.answers[i]!]}</strong></div>{!v.pendingDelivery && <button className="text-link" disabled={busy} onClick={() => save(i)} aria-label={'Edit question ' + (i+1)}>Edit</button>}</li>)}</ol>
        <div className="exam-nav">{!v.pendingDelivery && <button className="text-link" disabled={busy} onClick={() => save(8)}>Previous</button>}<button className="button" disabled={busy} onClick={() => save(9, null, true)}>{v.pendingDelivery ? 'Retry submission' : 'Submit assessment'}</button></div>
      </> : null}
      {error && <div role="alert"><p>{error}</p><button className="text-link" onClick={() => location.reload()}>Reload saved progress</button></div>}
    </article><Tracking variant={v?.variant ?? 'A'} trackPage={false}/>
  </main>;
}
