import { redirect } from 'next/navigation';
import { route } from '../../../lib/course';
export const metadata = { robots: { index: false, follow: false } };
export default function Page() { redirect(route + '/assessment'); }
