'use client';

import { useRef, useState, type FormEvent } from 'react';
import { academy, route } from '../lib/course';
import { attribution, track } from '../lib/analytics';
import { objectives, statuses, timelines, validateLead, type Errors } from '../lib/enquiry';

const initial = { fullName: '', phone: '', email: '', status: '', objective: '', timeline: '', consent: false, marketingConsent: false, question: '', website: '' };
type Field = keyof typeof initial;

export function AdmissionForm({ variant, demo }: { variant: string; demo: boolean }) {
  const [fields, setFields] = useState(initial);

  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [serverMessage, setServerMessage] = useState('');
  const active = useRef(false);
  const started = useRef(false);
  const sent = useRef<{ payload: string; id: string } | null>(null);


  function start() {
    if (started.current) return;
    started.current = true;
    track('assessment_registration_start', { variant });
  }

  function change(field: Field, value: string | boolean) {
    setFields(previous => ({ ...previous, [field]: value }));
    if (field !== 'website') setErrors(previous => ({ ...previous, [field]: undefined }));
    setServerMessage('');
  }

  function showErrors(next: Errors) {
    setErrors(next);
    const first = Object.keys(next)[0];

    requestAnimationFrame(() => document.getElementById('dop-' + first)?.focus());
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (active.current) return;
    start();
    const tracking = attribution();
    const { errors: next } = validateLead(fields, variant);
    if (Object.keys(next).length) return showErrors(next);

    // Keep the key and full logical request stable across a delivery retry.
    const values = JSON.stringify(fields);
    if (!sent.current || sent.current.payload !== values) sent.current = { id: crypto.randomUUID(), payload: values };
    const id = sent.current.id;
    active.current = true;
    setBusy(true);
    setServerMessage('');
    track('admission_form_submit', { variant });
    try {
      const session = await fetch('/api/dop-enquiry', { method: 'PUT' });
      if (!session.ok) { setServerMessage((await session.json()).message); return; }
      const response = await fetch('/api/dop-enquiry', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': id },
        body: JSON.stringify({ ...fields, attribution: tracking, variant }),
        signal: AbortSignal.timeout(10000),
      });
      const result = await response.json();
      if (!response.ok || result.accepted !== true) {
        if (result.errors) showErrors(result.errors);
        else setServerMessage(typeof result.message === 'string' ? result.message : 'We could not confirm receipt. Please try again.');
        if (response.status === 409) sent.current = null;
        return;
      }
      if (result.created) {
        track('assessment_registration_success', { variant, mode: result.mode });
        track(result.mode === 'local' ? 'dop_local_test_success' : 'admission_lead_success', { variant });
      }
      location.assign(route + '/assessment');
    } catch {
      setServerMessage('We could not confirm receipt. Please try again or contact VLS directly.');
    } finally {
      active.current = false;
      setBusy(false);
    }
  }

  function error(field: keyof Errors) {
    return errors[field] && <span className="field-error" id={`error-${field}`}>{errors[field]}</span>;
  }

  function contactField(field: 'fullName' | 'phone' | 'email', label: string, type: string, autoComplete: string, maxLength: number) {
    return <div className="field"><label htmlFor={`dop-${field}`}>{label}</label>
      <input id={`dop-${field}`} type={type} autoComplete={autoComplete} maxLength={maxLength} required={field !== 'email'}
        value={fields[field]} onChange={event => change(field, event.target.value)} aria-invalid={Boolean(errors[field])} aria-describedby={errors[field] ? `error-${field}` : undefined} />{error(field)}</div>;
  }

  function select(field: 'status' | 'objective' | 'timeline', label: string, options: readonly string[]) {
    return <div className="field"><label htmlFor={`dop-${field}`}>{label}</label>
      <select id={`dop-${field}`} required={field === 'status'} value={fields[field]} onChange={event => change(field, event.target.value)}
        aria-invalid={Boolean(errors[field])} aria-describedby={errors[field] ? `error-${field}` : undefined}>
        <option value="">Select an option</option>{options.map(option => <option key={option}>{option}</option>)}
      </select>{error(field)}</div>;
  }

  return <form className="admission-form" noValidate method="post" action="/api/dop-enquiry" onSubmit={submit} onFocusCapture={start} aria-labelledby="form-title">
    <h3 id="form-title">Register for the assessment</h3>
    {demo && <p className="demo-note">Local demonstration · Use fictional details. The questions are test fixtures.</p>}
    <p>Your progress is saved in this browser for seven days.</p>
    <noscript><p>Enable JavaScript to register. For help, <a href={academy.phoneHref}>call VLS</a>.</p></noscript>
    <fieldset disabled={busy} aria-label="Applicant details">
      {contactField('fullName', 'Full name', 'text', 'name', 100)}
      {contactField('phone', 'Mobile number with country code', 'tel', 'tel', 32)}
      {contactField('email', 'Email address (optional)', 'email', 'email', 254)}

      {select('status', 'Current professional status', statuses)}
      <details className="optional-info"><summary>Learning preferences (optional)</summary>
        {select('objective', 'Primary learning objective', objectives)}
        {select('timeline', 'Intended joining timeline', timelines)}
      </details>
      <div className="field consent-field">
        <label><input type="checkbox" id="dop-consent" required checked={fields.consent} onChange={event => change('consent', event.target.checked)} aria-invalid={Boolean(errors.consent)} aria-describedby={errors.consent ? 'error-consent' : undefined} /> <span>I agree that VLS Law Academy may process my registration and assessment information and contact me about admissions. See the <a href={academy.privacy}>Privacy Policy</a>.</span></label>
        {error('consent')}
      </div>
      <div className="field consent-field"><label><input type="checkbox" checked={fields.marketingConsent} onChange={e => change('marketingConsent', e.target.checked)} />Send me optional VLS programme promotions.</label></div>
    </fieldset>
    <a className="text-link" href={route + '/assessment'}>Resume a saved assessment</a>
    <div className="form-trap" aria-hidden="true"><label htmlFor="dop-website">Leave this field blank</label><input id="dop-website" name="website" tabIndex={-1} autoComplete="off" value={fields.website} onChange={event => change('website', event.target.value)} /></div>
    {serverMessage && <p className="form-message" role="alert">{serverMessage}</p>}
    <div className="form-actions">
      <button className="button" type="submit" disabled={busy}>{busy ? 'Registering…' : 'Register & Start Assessment'}</button>
    </div>
  </form>;
}
