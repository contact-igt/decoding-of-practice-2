import Image from 'next/image';
import { academy, course, route } from '../lib/course';

const links = [
  ['Programme', 'programme'],
  ['Curriculum', 'curriculum'],
  ['Mentorship', 'mentorship'],
  ...(course.testimonials.length ? [['Student Experiences', 'experiences']] : []),
  ['FAQs', 'faqs'],
];

export function Header({ assessment = false }: { assessment?: boolean }) {
  return <header className="site-header">
    <div className={assessment ? 'shell header-inner header-inner-logo-only' : 'shell header-inner'}>
      <a className="brand" href={route}>
        <Image src={course.photos.logo} alt="VLS Law Academy" width={62} height={62} />
      </a>
      {!assessment && <>
      <nav className="desktop-nav" aria-label="Programme navigation">
        {links.map(([label, id]) => <a key={id} href={`#${id}`}>{label}</a>)}
      </nav>
      <a className="button header-cta" href="#admission" data-track="assessment_cta_click" data-placement="header">Take the Admission Assessment</a>
      <details className="mobile-nav">
        <summary aria-label="Open navigation menu"><span className="menu-icon" aria-hidden="true" /></summary>
        <nav aria-label="Mobile programme navigation">
          {links.map(([label, id]) => <a key={id} href={`#${id}`}>{label}</a>)}
          <a href="#admission" data-track="assessment_cta_click" data-placement="menu">Take the Admission Assessment</a>
        </nav>
      </details>
      </>}
    </div>
  </header>;
}

export function Footer() {
  return <footer className="site-footer">
    <div className="shell footer-grid">
      <div className="footer-brand">
        <a href={academy.website}><Image src={course.photos.logo} alt="VLS Law Academy" width={82} height={82} /></a>
        <p>Practical legal education<br />in Chennai, India.</p>
      </div>
      <section aria-label="Contact VLS Law Academy">
        <h2>Contact</h2>
        <address><a href={academy.map}>{academy.address}</a></address>
        <a href={academy.phoneHref} data-track="phone_click">{academy.phone}</a>
        <a href={academy.secondaryPhoneHref} data-track="phone_click">{academy.secondaryPhone}</a>
        <a href={`mailto:${academy.email}`}>{academy.email}</a>
      </section>
      <section aria-label="Social media and academy website">
        <h2>Follow VLS</h2>
        {academy.social.map(([label, href]) => <a key={label} href={href}>{label}</a>)}
        <a href={academy.website}>Academy website</a>
      </section>
    </div>
    <div className="shell footer-end">
      <span>© {new Date().getFullYear()} VLS Law Academy</span>
      <a href={academy.privacy}>Privacy Policy</a><a href={academy.terms}>Terms</a>
    </div>
  </footer>;
}
