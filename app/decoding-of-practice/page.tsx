import type { Metadata } from 'next';
import Image from 'next/image';
import { AcademyVideo } from '../../components/academy-video';
import { TestimonialCarousel } from '../../components/testimonial-carousel';
import { VideoCarousel } from '../../components/video-carousel';
import { AdmissionForm } from '../../components/admission-form';
import { Tracking } from '../../components/tracking';
import { Footer, Header } from '../../components/site';
import { academy, campaign, caseSteps, course, curriculum, description, faqs, route, title } from '../../lib/course';
import { indexable, publicSite } from '../../lib/site-url';

export const metadata: Metadata = {
  title, description,
  robots: { index: indexable, follow: indexable },
  alternates: { canonical: new URL(route, publicSite) },
  openGraph: {
    type: 'website', locale: 'en_IN', siteName: 'VLS Law Academy', title, description,
    url: new URL(route, publicSite), images: [{ url: new URL('/vls/hero.webp', publicSite), width: 1680, height: 945, alt: 'A training session at VLS Law Academy' }],
  },
  twitter: { card: 'summary_large_image', title, description, images: [new URL('/vls/hero.webp', publicSite)] },
};

const questions = [
  'What do I ask my first client?', 'Which court or forum should I approach?',
  'What goes into the first draft?', 'What happens after I file?',
];

const pillars = [
  ['Understand', 'Connect legal principles to situations that arise in practice.'],
  ['Analyse', 'Identify issues, possible remedies and procedural choices.'],
  ['Practise', 'Work through drafting and case preparation in context.'],
  ['Build confidence', 'Develop practical judgment through structured learning.'],
];

const audience = [
  ['Law students and fresh graduates', 'Prepare for the first client conversation, draft and filing you’ll encounter after university.'],
  ['Junior and first-generation advocates', 'Develop a repeatable approach to preparing a matter and spotting the questions to ask next.'],
  ['Practising advocates', 'Broaden your exposure to matters and procedures you see less often in your own practice.'],
  ['Returning legal professionals', 'Rebuild familiarity with everyday workflows and plan a structured return to practice.'],
];

export default async function DOP({ searchParams }: { searchParams: Promise<{ variant?: string | string[] }> }) {
  const { id, headline } = campaign((await searchParams).variant);
  const structured = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'EducationalOrganization', '@id': `${academy.website}#academy`, name: 'VLS Law Academy', url: academy.website, email: academy.email, telephone: academy.phone, sameAs: academy.social.map(([, url]) => url) },
      { '@type': 'Course', name: course.name, description, url: new URL(route, publicSite).href, provider: { '@id': `${academy.website}#academy` }, timeRequired: 'PT200H' },
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'VLS Law Academy', item: academy.website },
        { '@type': 'ListItem', position: 2, name: course.name, item: new URL(route, publicSite).href },
      ] },
    ],
  };

  return <>
    <a className="skip-link" href="#main">Skip to content</a>
    <Header />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structured).replace(/</g, '\\u003c') }} />
    <main id="main">
      <section className="hero" aria-labelledby="hero-title">
        <div className="shell hero-grid">
          <div className="hero-copy">
            <p className="eyebrow"><span />{course.name}</p>
            <h1 id="hero-title">{id === 'A' ? <>You Studied Law.<br /><em>Now Learn to Practise It.</em></> : headline}</h1>
            <p className="hero-lead">A six-month, {course.hours}-hour practical legal training programme for law students, graduates and advocates.</p>
            <p className="hero-assessment">Your admission journey starts with a short assessment.</p>
            <div className="hero-actions">
              <a className="button" href="#admission" data-track="assessment_cta_click" data-placement="hero">Take the Admission Assessment</a>
              <a className="text-link" href="#curriculum" data-track="hero_cta_click" data-placement="curriculum">Explore the Curriculum</a>
            </div>
            <p className="assessment-meta">9 questions • Approximately 5 minutes • Performance-based fee concession</p>
          </div>
          <figure className="hero-photo">
            <picture><source media="(max-width: 720px)" srcSet="/vls/hero-mobile.webp"/><Image src={course.photos.hero} alt="An instructor teaching a group at VLS Law Academy" width={1680} height={945}
              sizes="(max-width: 720px) 92vw, (max-width: 1150px) 49vw, 640px" loading="eager" fetchPriority="high" decoding="sync" /></picture>
          </figure>
          <dl className="hero-facts">
            <div><dt>Duration</dt><dd>6 months</dd></div>
            <div><dt>Structured learning</dt><dd>{course.hours} hours</dd></div>
            <div><dt>Approach</dt><dd>Practitioner-led</dd></div>
            {course.curriculumCountApproved && <div><dt>Curriculum</dt><dd>{curriculum.length} practice areas</dd></div>}
          </dl>
        </div>
      </section>

      <section className="section section-soft how-admission" aria-labelledby="how-title"><div className="shell editorial-grid">
        <div><p className="eyebrow"><span/>Admissions</p><h2 id="how-title">How Admission Works</h2><p className="section-lead">Complete our nine-question online assessment for an opportunity to qualify for a course fee concession based on your performance.</p></div>
        <ol>{['Register your details.', 'Complete the online assessment.', 'Qualify for a potential course fee concession.', 'Receive admission guidance from the VLS team.'].map((line,i) => <li key={line}><span>0{i+1}</span>{line}</li>)}</ol>
      </div></section>
      <section className="section first-case" aria-labelledby="first-case">
        <div className="shell editorial-grid">
          <div>
            <p className="eyebrow"><span />From the classroom to practice</p>
            <h2 id="first-case">You Have the Degree.<br />Are You Ready for <em>Your First Case?</em></h2>
            <p className="section-lead">A real brief brings decisions textbooks can only introduce. Working through those decisions takes practice.</p>
          </div>
          <ul className="question-list">{questions.map((q, i) => <li key={q}><span aria-hidden="true">0{i + 1}</span>{q}</li>)}</ul>
        </div>
      </section>

      <section className="section" id="programme">
        <div className="shell">
          <div className="editorial-grid programme-intro">
            <div><p className="eyebrow"><span />The programme</p><h2>The Bridge Between Legal Education and Legal Practice.</h2></div>
            <p className="section-lead">Decoding of Practice brings together case discussions, drafting exercises and practitioner guidance. Follow a matter from the first client meeting to preparation for a hearing.</p>
          </div>
          <div className="photo-strip">{[["academy-1","A VLS instructor presenting in class"],["academy-2","Participants working through a classroom exercise"],["academy-3","A VLS faculty member explaining a topic on screen"]].map(([photo,alt]) => <Image key={photo} src={"/vls/"+photo+".webp"} width={600} height={380} alt={alt} sizes="(max-width:720px) 32vw, 30vw"/>)}</div>
          <dl className="pillars">{pillars.map(([label, copy], i) => <div key={label}><span aria-hidden="true">{String(i + 1).padStart(2, '0')}</span><dt>{label}</dt><dd>{copy}</dd></div>)}</dl>
        </div>
      </section>

      <section className="section section-dark" id="case-journey">
        <div className="shell journey-grid">
          <div className="journey-intro">
            <p className="eyebrow"><span />Walk through a case</p>
            <h2>What Happens When Your First Client Walks In?</h2>
            <p className="section-lead">A customer buys a laptop that repeatedly shuts down. The seller and service centre disagree about what happens next. Where would you begin?</p>
            <p className="case-note">Fictional consumer dispute for educational use. For legal advice on a specific matter, consult an advocate.</p>
          </div>
          <ol className="timeline">{caseSteps.map(([name, copy], index) => <li key={name}>
            <details name="case-steps" data-track-toggle="case_stage_expand" data-item={index + 1} open={!index}>
              <summary><span className="step-index" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>{name}<span className="disclosure" aria-hidden="true" /></summary>
              <p>{copy}</p>
            </details>
          </li>)}</ol>
          <div className="journey-end">
            <p>This is the difference between knowing the law and understanding how to practise it.</p>
            <a className="text-link" href="#curriculum">Explore the Six-Month Programme</a>
          </div>
        </div>
      </section>

      <section className="section overview">
        <div className="shell editorial-grid">
          <div><p className="eyebrow"><span />At a glance</p><h2>Six Months. 200 Hours.<br /><em>A Structured Path Forward.</em></h2></div>
          <ul className="check-list"><li>Case-based discussions across areas of law</li><li>Drafting and procedural exercises</li><li>Practical court and tribunal workflows</li><li>Learning guided by practising advocates</li></ul>
        </div>
      </section>

      <section className="section section-soft" id="curriculum">
        <div className="shell curriculum-grid">
          <div>
            <p className="eyebrow"><span />Curriculum</p>
            <h2>Explore the Different Dimensions of Legal Practice.</h2>
            <p className="section-lead">Explore the indicative practice areas below. Our admissions team can share the confirmed syllabus for the upcoming batch.</p>
            {course.brochure ? <a className="button" href={course.brochure} download data-track="brochure_download">Download Detailed Curriculum</a> : <a className="text-link" href="#admission" data-track="assessment_cta_click" data-placement="curriculum">Take the Admission Assessment</a>}
          </div>
          <div className="accordion">{curriculum.map(([name, copy], index) => <details key={name} name="curriculum-rows" data-track-toggle="module_expand" data-item={index + 1}>
            <summary>{name}<span className="disclosure" aria-hidden="true" /></summary><p>{copy}</p>
          </details>)}</div>
        </div>
      </section>

      <section className="section">
        <div className="shell methodology-grid">
          <figure className="editorial-photo"><Image src={course.photos.classroom} alt="Participants taking notes during a VLS Law Academy class" width={1280} height={720} sizes="(max-width: 860px) 92vw, 54vw" /></figure>
          <div><p className="eyebrow"><span />Practical learning</p><h2>Learn Law the Way It Is Practised.</h2>
            <p className="section-lead">Discuss how a matter might proceed. Work through the relevant record, prepare a draft and compare your reasoning with a practitioner’s approach.</p>
            <p>Bring those exercises back to the court observation and professional experience you gain over time.</p>
          </div>
        </div>
      </section>

      <section className="section section-soft classroom-videos"><div className="shell"><p className="eyebrow"><span/>From the academy classroom</p><h2>See how practitioners explain a matter.</h2>
        <VideoCarousel label="academy videos"><AcademyVideo id="N080sjReJ-k" title="Understanding Document Registration" context="Academy teaching · Property law"/>
        <AcademyVideo id="FKMjanDI_Gs" title="How is compensation calculated in a Motor Accident Claim?" context="Academy teaching · Claims practice"/>
        <AcademyVideo id="SWJQmcKjJ_w" title="Understanding Referred Charge Sheets in Criminal Proceedings" context="Academy teaching · Criminal practice"/></VideoCarousel></div></section>
      <section className="section section-soft mentor-section" id="mentorship">
        <div className="shell mentor-grid">
          <div><figure className="mentor-photo"><Image src={course.mentor.photo} alt={course.mentor.name} width={720} height={900} sizes="(max-width: 720px) 85vw, 400px" /></figure><Image className="mentor-teaching" src="/vls/academy-6.webp" width={480} height={270} alt="An academy teaching session" sizes="(max-width:720px) 45vw, 230px"/></div>
          <div><p className="eyebrow"><span />Mentorship</p><h2>Learn From Those Who Practise the Law.</h2>
            <p className="section-lead">Practitioner-led learning puts procedural choices and drafting decisions in the context of real legal work.</p>
            <div className="mentor-name"><h3>{course.mentor.name}</h3><p>{course.mentor.credentials}<br />{course.mentor.role}<br />{course.mentor.currentProgrammeApproved ? 'Decoding of Practice mentor' : 'VLS Law Academy faculty'}</p></div>
            {course.mentor.currentProgrammeApproved && course.mentor.video && <video controls preload="none" poster={course.mentor.photo} src={course.mentor.video} data-track-video="mentor_video_play" />}
          </div>
        </div>
      </section>

      <section className="section audience-section">
        <div className="shell editorial-grid">
          <div><p className="eyebrow"><span />Who should join</p><h2>Wherever You Are in Your Legal Journey, Take the Next Step.</h2><p className="section-lead">The programme can also suit judiciary aspirants looking for practical exposure.</p></div>
          <dl className="audience-list">{audience.map(([name, copy]) => <div key={name}><dt>{name}</dt><dd>{copy}</dd></div>)}</dl>
        </div>
      </section>

      {!!course.testimonials.length && <section className="section section-soft" id="experiences"><div className="shell"><p className="eyebrow"><span />Student experiences</p><h2>Real Students. Real Legal Journeys.</h2><div className="pillars">
        {course.testimonials.map(({ name, role, quote, video, poster }) => <article key={name}><h3>{name}</h3><p>{role}</p><blockquote>{quote}</blockquote>{video && <video controls preload="none" poster={poster} src={video} data-track-video="testimonial_video_play" />}</article>)}
      </div></div></section>}

      {course.ai && <section className="section section-soft"><div className="shell editorial-grid"><h2>The Future of Legal Practice Is Evolving. Be Prepared.</h2><p className="section-lead">Explore AI-assisted case analysis, litigation strategy and drafting alongside legal verification, professional judgment and client confidentiality.</p></div></section>}

      <section className="section section-soft outcomes">
        <div className="shell editorial-grid"><div><p className="eyebrow"><span />Learning goals</p><h2>Build the Skills Behind Your Legal Career.</h2></div>
          <ul className="check-list"><li>Prepare more thoroughly for a client consultation.</li><li>Analyse facts and documents in a structured way.</li><li>Build familiarity with drafting, filing and procedure.</li><li>Understand how matters may progress across different areas of law.</li><li>Approach practical legal situations with greater confidence.</li></ul>
        </div>
      </section>

      <section className="section student-experience"><div className="shell"><div><h2>Hear from our students.</h2><p className="section-lead">Watch students share their experiences with VLS Law Academy.</p></div>
        <TestimonialCarousel /></div></section>
      <section className="section admission" id="admission">
        <div className="shell admission-grid">
          <div className="admission-copy"><p className="eyebrow"><span />Admission assessment</p><h2>Start your application.</h2>
            <p className="section-lead">Register before beginning the nine questions. Clear the assessment to proceed to admissions review. VLS will confirm the applicable concession and final fee.</p>
            <dl className="admission-facts"><div><dt>Programme</dt><dd>{course.name}</dd></div><div><dt>Commitment</dt><dd>{course.duration}, {course.hours} hours</dd></div>
              {([['Next batch', course.batch], ['Programme fee', course.fee], ['Format', course.format], ['Schedule', course.schedule], ['Payment options', course.paymentOptions]] as const).map(([label, value]) => value && <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
            </dl>
            <div className="hero-actions"><a className="button" href="#form-title" data-track="assessment_cta_click" data-placement="investment">Take the Admission Assessment</a>
              <a className="text-link" href={academy.phoneHref} data-track="phone_click">Call for assessment help</a></div>
          </div>
          <AdmissionForm variant={id} sheetRegistration={Boolean(process.env.DOP_GOOGLE_SHEETS_URL)} demo={!process.env.DOP_GOOGLE_SHEETS_URL && process.env.DOP_LOCAL_TEST === '1' && process.env.DOP_ALLOW_INDEXING !== 'true'} />
        </div>
      </section>

      <section className="section section-soft" id="faqs"><div className="shell curriculum-grid">
        <div><p className="eyebrow"><span />FAQs</p><h2>Frequently Asked Questions</h2></div>
        <div className="accordion">{faqs.map(([question, answer]) => <details key={question} name="faq-rows"><summary>{question}<span className="disclosure" aria-hidden="true" /></summary><p>{answer}</p></details>)}</div>
      </div></section>

      <section className="section section-dark closing"><div className="shell editorial-grid">
        <div className="closing-photo"><Image src="/vls/academy-5.webp" alt="Learners facing the instructor in a VLS classroom" width={800} height={450} sizes="(max-width:720px) 90vw, 45vw"/></div><div className="closing-copy"><p className="eyebrow"><span />Take the next step</p><h2>Your Degree Was the Beginning.<br /><em>Your Practice Is the Next Chapter.</em></h2>
        <p className="section-lead">Register, complete your assessment and receive guidance from VLS admissions.</p>
          <div className="closing-actions"><a className="button" href="#admission" data-track="assessment_cta_click" data-placement="closing">Take the Admission Assessment</a><a className="text-link" href={academy.whatsapp} data-track="admission_whatsapp_click">Message VLS on WhatsApp</a></div>
        </div>
      </div></section>
    </main>
    <nav className="mobile-contact-bar" aria-label="Quick contact links">
      <a className="mobile-assessment-cta" href="#admission" data-track="assessment_cta_click" data-placement="sticky"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h8l4 4v14H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"/><path d="M14 3v5h5M9 13h6M9 17h4"/><path d="m15 16 2 2 4-5"/></svg><span>Take the Admission Assessment</span></a>
      <a href={academy.phoneHref} aria-label="Call VLS Law Academy" data-track="phone_click"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.6 3.8 9 3l2 4.7-2 1.5a14 14 0 0 0 5.8 5.8l1.5-2L21 15l-.8 2.4a3 3 0 0 1-3.3 2C10 18.3 5.7 14 4.6 7.1a3 3 0 0 1 2-3.3Z"/></svg><span>Call</span></a>
      <a href={`mailto:${academy.email}`} aria-label="Email VLS Law Academy"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/></svg><span>Email</span></a>
      <a href={academy.social.find(([name]) => name === 'YouTube')?.[1]} target="_blank" rel="noreferrer" aria-label="VLS Law Academy on YouTube"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2.5" y="5" width="19" height="14" rx="4"/><path d="m10 9 5 3-5 3z"/></svg><span>YouTube</span></a>
      <a href={academy.social.find(([name]) => name === 'Instagram')?.[1]} target="_blank" rel="noreferrer" aria-label="VLS Law Academy on Instagram"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5h.01"/></svg><span>Instagram</span></a>
    </nav>
    <Footer />
    <Tracking variant={id} />
  </>;
}
