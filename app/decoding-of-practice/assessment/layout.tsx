import type { ReactNode } from 'react';
import { Footer, Header } from '../../../components/site';

export default function AssessmentLayout({ children }: { children: ReactNode }) {
  return <>
    <a className="skip-link" href="#main">Skip to content</a>
    <Header assessment />
    {children}
    <Footer />
  </>;
}
