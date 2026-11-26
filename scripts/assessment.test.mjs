import assert from 'node:assert/strict';
import { randomUUID, randomBytes } from 'node:crypto';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { assign, evaluate, fixtureBanks, sourceBanks } from '../lib/server/bank.ts';
import { acknowledgeSheet, attempt, pendingSheetRegistration, pendingSheetSubmission, register, storage } from '../lib/server/attempt.ts';
import { validateLead } from '../lib/enquiry.ts';

test('source gate excludes incomplete banks, unverified keys and duplicate questions', () => {
  assert.deepEqual(sourceBanks.map(b => b.questions.length), [25,20,20]);
  assert.throws(() => assign(sourceBanks), /Insufficient/);
  assert.throws(() => assign(fixtureBanks), /Insufficient/);
  const duplicate = structuredClone(fixtureBanks);
  duplicate[0].questions.push(duplicate[0].questions[0]);
  assert.throws(() => assign(duplicate,true), /Duplicate/);
});
test('100 independent draws each assign 3+3+3, preserve fixed orders and score by shuffled positions', () => {
  const selections = new Set();
  let reordered = false;
  for (let i=0;i<100;i++) {
    const drawn = assign(fixtureBanks,true);
    assert.equal(new Set(drawn.map(q => q.id)).size,9);
    for (const b of fixtureBanks) assert.equal(drawn.filter(q => q.subject===b.subject).length,3);
    selections.add(drawn.map(q => q.id).sort().join('/'));
    for(const q of drawn) {
      const original=fixtureBanks.flatMap(b=>b.questions).find(v=>v.id===q.id);
      assert.equal(q.choices[q.key],original.choices[original.correct]);
      if (!original.shuffleOptions) assert.deepEqual(q.choices,original.choices);
      else if (q.order.some((n,k)=>n!==k)) reordered=true;
    }
    for(let score=0;score<=9;score++) {
      const result=evaluate(drawn,drawn.map((q,k)=>k<score?q.key:(q.key+1)%4));
      assert.equal(result.score,score); assert.equal(result.qualified,score>=5);
      assert.equal(result.tier,score===9?'highest':score>=7?'higher':score>=5?'standard':null);
      assert.equal(Object.values(result.subjectScores).reduce((a,b)=>a+b,0),score);
      assert.ok(Object.values(result.subjectScores).every(s=>s<=3));
    }
  }
  assert.ok(selections.size>1 && reordered);
  console.log('Distinct nine-question selections in 100 draws:',selections.size);
});
test('durable owned attempt, duplicate registration, optimistic updates, expiry and immutable final result', () => {
  process.env.DOP_TEST_STORE=mkdtempSync(join(tmpdir(),'dop-qa-'));
  const owner=randomBytes(32).toString('hex'), other=randomBytes(32).toString('hex'), key=randomUUID();
  const {lead}=validateLead({fullName:'Fictional Applicant',phone:'+12025550132',consent:true,status:'Law graduate',attribution:{ first:{utm_source:'demo'} }},'C');
  assert.equal(register(owner,key,lead).created,true);
  assert.equal(register(owner,key,lead).created,false);
  assert.throws(()=>register(other,key,lead),/use that browser session/);
  assert.throws(()=>attempt(other,'read'),/Register first/);
  let v=attempt(owner,'start');
  assert.deepEqual(v.questions,attempt(owner,'start').questions);
  assert.throws(()=>attempt(owner,'finish',{revision:v.revision}),/Review/);
  assert.throws(()=>attempt(owner,'save',{revision:0}),/changed/);
  const row=()=>JSON.parse(storage().prepare('SELECT record FROM attempts').get().record);
  const record=row();
  for(let i=0;i<9;i++) v=attempt(owner,'save',{revision:v.revision,index:i,step:i+1,choice:record.assigned[i].key});
  const finished=attempt(owner,'finish',{revision:v.revision,score:0,qualified:false});
  assert.deepEqual(finished.result,{score:9,qualified:true,reference:record.applicantReference});
  assert.equal(attempt(owner,'finish',{revision:v.revision}).changed,false);
  assert.deepEqual(finished.result,attempt(owner,'read').result);
  assert.throws(()=>attempt(owner,'save',{revision:finished.revision}),/changed/);
  assert.equal(row().admissionStatus,'PENDING_ADMIN_REVIEW');
  assert.equal(row().lead.attribution.first.utm_source,'demo');
  assert.deepEqual(row().lifecycle,['REGISTERED','ASSESSMENT_IN_PROGRESS','ASSESSMENT_COMPLETED','QUALIFIED']);
  assert.equal(Object.keys(row().result.subjectScores).length,3);
  const sheetOwner = randomBytes(32).toString('hex'), sheetKey = randomUUID();
  const sheetLead = { ...lead, phone: '+12025550133' };
  register(sheetOwner, sheetKey, sheetLead, 'sheet');
  assert.throws(() => register(sheetOwner, randomUUID(), { ...sheetLead, fullName: 'Different Applicant' }, 'sheet'), { code: 'RESUME_ASSESSMENT' });
  assert.throws(() => attempt(sheetOwner, 'start'), /Finish registration/);
  assert.equal(pendingSheetRegistration(other), null);
  assert.deepEqual(pendingSheetRegistration(sheetOwner), { requestId: sheetKey, lead: sheetLead });
  assert.equal(register(sheetOwner, randomUUID(), sheetLead, 'sheet').registration.requestId, sheetKey);
  acknowledgeSheet(sheetOwner, 'sheetRegistered');
  assert.equal(pendingSheetRegistration(sheetOwner), null);
  let sheetView = attempt(sheetOwner, 'start');
  assert.equal(sheetView.questions.length, 9);
  assert.ok(sheetView.questions.every(q => !/^\d+[.)]/.test(q.prompt)));
  assert.equal(sheetView.questions.filter(q => q.choices.length === 2).length, 3);
  const expected = sheetView.questions.map(q => ({ question: q.prompt, answer: q.choices[1] }));
  for (let i = 0; i < 9; i++) {
    if (sheetView.questions[i].choices.length === 2) {
      assert.throws(() => attempt(sheetOwner, 'save', { revision: sheetView.revision, index: i, step: i + 1, choice: 2 }), /Invalid/);
    }
    sheetView = attempt(sheetOwner, 'save', { revision: sheetView.revision, index: i, step: i + 1, choice: 1 });
  }
  assert.equal(attempt(sheetOwner, 'finish', { revision: sheetView.revision }).result, null);
  assert.deepEqual(pendingSheetSubmission(sheetOwner), { requestId: sheetKey, responses: expected });
  assert.equal(attempt(sheetOwner, 'finish').pendingDelivery, true);
  acknowledgeSheet(sheetOwner, 'sheetDelivered');
  assert.deepEqual(Object.keys(attempt(sheetOwner, 'read').result), ['reference']);
  assert.equal(pendingSheetSubmission(sheetOwner), null);
  storage().exec('UPDATE attempts SET expires=0');
  assert.throws(()=>attempt(owner,'read'),/expired/);
});
