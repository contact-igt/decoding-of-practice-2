import { redirect } from 'next/navigation';
import { route } from '../lib/course';

export default async function Home({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const parameters = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams)) {
    if (typeof value === 'string') parameters.set(key, value);
  }
  redirect(route + (parameters.size ? '?' + parameters.toString() : ''));
}
