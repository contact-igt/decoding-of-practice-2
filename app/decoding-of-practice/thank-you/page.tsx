import { redirect } from 'next/navigation';
import { route } from '../../../lib/course';
import { cookies } from 'next/headers';
import { receiptCookie, verifyReceipt } from '../../../lib/receipt';
export const metadata = { robots: { index: false, follow: false } };
export default async function Page() {
  if (!process.env.DOP_GOOGLE_SHEETS_URL) redirect(route + '/assessment');
  const receipt = (await cookies()).get(receiptCookie)?.value;
  const secret = process.env.DOP_GOOGLE_SHEETS_TOKEN;
  if (!receipt || !secret || !verifyReceipt(receipt, 'webhook', secret)) redirect(route + '#admission');
  return <main className="exam-shell"><div className="exam-card"><h1>Registration received.</h1><p>Your details have been saved. VLS admissions will contact you with the next steps for your assessment.</p><a className="button" href={route}>Return to the programme</a></div></main>;
}
