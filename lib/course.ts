export const route = '/decoding-of-practice';
export const title = 'Decoding of Practice | 6-Month Practical Legal Training | VLS Law Academy';
export const description = 'Develop practical legal skills with VLS Law Academy’s six-month, 200-hour Decoding of Practice programme. Explore practical training and the nine-question admission assessment.';

type Course = {
  name: string;
  duration: string;
  hours: number;
  curriculumCountApproved: boolean;
  brochure: string | null;
  batch: string | null;
  fee: string | null;
  format: string | null;
  schedule: string | null;
  paymentOptions: string | null;
  certificate: string | null;
  ai: boolean;
  testimonials: ReadonlyArray<{ name: string; role: string; quote: string; video?: string; poster?: string }>;
  mentor: { name: string; credentials: string; role: string; photo: string; video: string | null; currentProgrammeApproved: boolean };
  photos: { logo: string; hero: string; classroom: string; gallery: ReadonlyArray<ReadonlyArray<{ src: string; alt: string }>> };
};

export const course: Course = {
  name: 'Decoding of Practice',
  duration: 'Six months',
  hours: 200,
  curriculumCountApproved: false,
  brochure: null,
  batch: null,
  fee: null,
  format: null,
  schedule: null,
  paymentOptions: null,
  certificate: null,
  ai: false,
  testimonials: [],
  mentor: {
    name: 'Dr. Sivakumar', credentials: 'B.Sc., M.L., Ph.D. (Law)',
    role: 'Lawyer, Chennai High Court', photo: '/vls/mentor.webp',
    video: null, currentProgrammeApproved: false,
  },
  photos: {
    logo: '/vls/logo.png', hero: '/vls/hero.webp', classroom: '/vls/classroom.webp',
    gallery: [
      [
        { src: '/vls/academy-1.webp', alt: 'A VLS instructor presenting in class' },
        { src: '/vls/academy-2.webp', alt: 'Participants working through a classroom exercise' },
        { src: '/vls/academy-3.webp', alt: 'A VLS faculty member explaining a topic on screen' },
      ],
      [
        { src: '/vls/classroom.webp', alt: 'Participants taking notes during a VLS Law Academy class' },
        { src: '/vls/academy-5.webp', alt: 'Learners facing the instructor in a VLS classroom' },
        { src: '/vls/hero.webp', alt: 'An instructor teaching a group at VLS Law Academy' },
      ],
    ],
  },
};

export const academy = {
  website: 'https://www.vlslawacademy.com/',
  email: 'contact@vlslawacademy.com',
  phone: '+91 95002 07811',
  phoneHref: 'tel:+919500207811',
  secondaryPhone: '+91 95000 25216',
  secondaryPhoneHref: 'tel:+919500025216',
  whatsapp: 'https://wa.me/919500025216',
  map: 'https://maps.app.goo.gl/zwL1sgrgFjKqKJKA8',
  address: 'No. 1910, 2nd Floor, H Block 5th Street, 12th Main Road, Anna Nagar West, Chennai, Tamil Nadu 600040',
  privacy: 'https://www.vlslawacademy.com/privacy-policy',
  terms: 'https://www.vlslawacademy.com/terms-and-conditions',
  social: [
    ['Instagram', 'https://www.instagram.com/vlslawacademy/'],
    ['YouTube', 'https://www.youtube.com/@VLSLAWACADEMY'],
    ['Facebook', 'https://www.facebook.com/vlslawacademy'],
    ['LinkedIn', 'https://in.linkedin.com/company/vls-lawacademy'],
  ],
} as const;

const headlines = {
  A: 'You Studied Law. Now Learn to Practise It.',
  B: 'What Will You Do When Your First Client Walks In?',
  C: 'Your LLB Was the Beginning. Build Your Practical Legal Skills.',
  D: 'Build the Confidence to Approach Legal Practice.',
  E: 'The Future of Law Is Changing. Is Your Practice Ready?',
} as const;

export function campaign(value: string | string[] | undefined) {
  const allowed = value === 'B' || value === 'C' || value === 'D' || (value === 'E' && course.ai);
  const id = allowed ? value : 'A';
  return { id, headline: headlines[id] };
}

export const caseSteps = [
  ['Client consultation', 'A customer brings in the invoice for a recently purchased laptop that keeps shutting down. Ask when the fault appeared, what the seller promised, and what the customer has already tried.'],
  ['Facts and legal analysis', 'Put the purchase, complaints and responses in date order. Read the invoice and warranty alongside the correspondence to identify the issues and gaps in the record.'],
  ['Litigation strategy', 'Consider jurisdiction, limitation, maintainability, possible remedies and the parties who may need to be involved. Evaluate ways to resolve the dispute before deciding how to proceed.'],
  ['Legal drafting', 'Turn the facts and supporting documents into a coherent draft. Connect each material assertion to the record and state the relief sought clearly.'],
  ['Filing procedures', 'Identify what the relevant forum requires. Organise the filing set, review the necessary documents and understand what can happen during scrutiny.'],
  ['Evidence and arguments', 'Match the documents to the issues they support. Prepare a clear argument, account for gaps in the evidence and anticipate questions from the forum.'],
  ['Court proceedings', 'Follow how the matter may move through notice, responses, hearings and orders. Practise explaining the next procedural step to the client.'],
] as const;

export const curriculum = [
  ['Constitutional Law and Practice', 'Explore constitutional remedies and how advocates approach writ proceedings.'],
  ['Civil Procedure', 'Follow the progression of a civil matter from pleadings to trial and execution.'],
  ['Criminal Procedure', 'Understand the stages of criminal proceedings and the documents used along the way.'],
  ['Criminal Laws', 'Practise organising facts, legal issues and a case record in an offence-based matter.'],
  ['Property Law', 'Explore the role of documents, registration and forum selection in property matters.'],
  ['Family Law', 'Understand how practitioners approach family disputes and related proceedings.'],
  ['Motor Accident Law', 'Explore claim preparation, supporting records and the role of the claims tribunal.'],
  ['Consumer Protection Law', 'Follow how advocates organise documents and approach a consumer dispute.'],
  ['Corporate Law', 'Explore common corporate disputes and the forums that hear them.'],
  ['Taxation Law', 'Understand where tax disputes may be heard and how practitioners approach procedural questions.'],
  ['Economic Law', 'Explore how regulated matters progress through relevant authorities and forums.'],
  ['Business Law', 'Connect contract documents and commercial disputes to practical decisions about next steps.'],
] as const;

export const testimonialVideos = [
  'https://res.cloudinary.com/dd3olj1ax/video/upload/v1761892348/vls-testimonal3_ajrnrk.mp4',
  'https://res.cloudinary.com/dd3olj1ax/video/upload/v1762343697/vls_testimonal4_fmdamk.mp4',
  'https://res.cloudinary.com/dd3olj1ax/video/upload/v1761891831/vls-testimoanl1_ddcvpb.mp4',
] as const;

export const faqs = [
  ['What is Decoding of Practice?', 'It is a structured practical legal training programme focused on how legal matters are handled, from client consultation to court procedures.'],
  ['How long is the programme?', 'The programme is structured across six months, with 200 hours of practical legal training.'],
  ['Who can join?', 'The programme is designed for law students, graduates, junior and practising advocates, and professionals returning to practice. Ask admissions about eligibility for the upcoming batch.'],
  ['Is it suitable for fresh graduates?', 'Yes. The programme is designed to help graduates build familiarity with client consultations, case preparation and procedures they may encounter as they enter practice.'],
  ['Can practising advocates join?', 'Yes. It is designed to be relevant to advocates who want structured exposure to additional areas of legal practice.'],
  ['Will it cover legal drafting and procedures?', 'Yes. The learning includes drafting, case preparation, filing and an introduction to how proceedings move through their relevant forums.'],
  ['Is it an AIBE preparation course?', 'Decoding of Practice focuses on developing practical legal skills. VLS offers separate AIBE preparation.'],
  ['Are classes online or offline?', course.format ?? 'Ask the admissions team which formats are available for the upcoming batch.'],
  ['What are the class timings?', course.schedule ?? 'The admissions team can share the current schedule when it is confirmed.'],
  ['Is AI training included?', course.ai ? 'The programme includes AI-assisted legal practice, with an emphasis on verification and professional judgment.' : 'AI training has not been confirmed for this programme. Ask admissions about the current curriculum.'],
  ['What is the fee?', course.fee ?? 'Speak with our admission team for programme fees and upcoming batch details.'],
  ['Are instalments available?', course.paymentOptions ?? 'Ask the admissions team which payment options apply to the upcoming batch.'],
  ['Is certification provided?', course.certificate ?? 'The admissions team can confirm the current certification policy.'],
  ['Is the assessment compulsory?', 'Applicants register and complete the assessment as part of the admissions process.'],
  ['How many questions are included?', 'Nine multiple-choice questions, with three drawn from each subject bank.'],
  ['How long does it take?', 'Allow approximately five minutes. You can resume in the same browser while your session is active.'],
  ['What happens after I submit my answers?', 'You’ll see a confirmation. The VLS admissions team will contact you about next steps.'],
  ['Who will contact me about admission?', 'The VLS admissions team will use the contact details you provide at registration.'],
] as const;
