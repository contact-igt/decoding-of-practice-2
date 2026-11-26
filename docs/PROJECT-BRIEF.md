# Decoding of Practice project brief

Owner for programme approval is VLS Law Academy. Invictus Global Tech Private Limited is the marketing and technology partner. The site serves paid search and social, academy campaigns, WhatsApp referrals, retargeting, former masterclass attendees and organic visitors.

## Product and conversion

**You Studied Law. Now Learn to Practise It.**

Decoding of Practice is a six-month, 200-hour practical legal training programme. It is for law students, fresh graduates, junior and first-generation advocates, practising advocates seeking broader exposure, returning legal professionals and judiciary aspirants seeking practical experience. Client consultation, case analysis, jurisdiction and limitation, litigation strategy, drafting, filing, evidence and proceedings are core learning themes. Copy describes intended learning and refrains from promising employment, income, clients or independent-practice outcomes.

The primary conversion is a qualified enquiry for the full programme. Phone, WhatsApp and an approved brochure are secondary paths. Track accepted enquiries separately from qualified leads and paid admissions. The qualification fields are professional status, learning goal and joining timeline. The historical internal target is 30–40 admissions. Keep it out of visitor-facing copy.

| Evidence | Scope and decision |
| --- | --- |
| User-supplied M0 and Autonomous Landing Page Build briefs | Current planning and page-copy source for six months, 200 hours, positioning, audience, practical learning and the full-course admission goal. The updated brief identifies the older public listing as superseded for this project. |
| `Sep-20-2026-Business-Law-VLS-masterclass.pdf`, pp. 3–5 and 8 | Historical academy deck corroborates six months, roughly 200 hours, broad practice areas, practical sessions and the historical ₹35,000 fee. The fee remains internal and unapproved for publication. |
| `VLS-Law-Academy-Final-Plan-May-2026.pdf`, p. 6 | Historical plan corroborates 200 hours and 12 modules. |
| `Updated Vls Brochure.pdf`, pp. 1–8 | Four Downloads variants and the Taxation checkout copy are identical (SHA-256 prefix `ab3dd9c81a05`). Twelve historical syllabus areas inform the indicative accordion. Academy must approve current titles, order, details, count and the download PDF. |
| Academy homepage and public course catalogue | Legacy 10-month weekend listing, official logo, academy credentials and contact sources. [Homepage](https://www.vlslawacademy.com/) · [Courses](https://www.vlslawacademy.com/courses) · [Contact](https://www.vlslawacademy.com/contact) |
| Public DOP, MACT, Property and AI pages | Campaign and asset references. The public DOP URL currently offers a three-hour masterclass. [DOP Masterclass](https://decodingofpractice.vlslawacademy.com/) · [MACT](https://mcop.vlslawacademy.com/) · [Property](https://propertylaw.vlslawacademy.com/) · [AI for Advocates](https://aiforadvocates.vlslawacademy.com/) |
| Business Law and Constitutional campaign sources | Local checkouts under `Documents/CODE FILES SUSHIL`. The Business public subdomain was unavailable to the source fetch. The Business ZIP, checkout and September deck cover distinct revisions. |
| Academy proof material | Academy site identifies Dr. Sivakumar as VLS faculty, B.Sc., M.L., Ph.D. (Law), Lawyer, Chennai High Court. His assignment to the current programme awaits approval. Legacy campaign testimonial files and the public bootcamp video require verified names, rights and course-context attribution before reuse. [Faculty page](https://www.vlslawacademy.com/whyvls) · [Bootcamp video](https://www.youtube.com/watch?v=qaxU1MBhhGc) |

## Source checkout and architecture

The task workspace started empty and had no independent Git repository. Git resolved to a parent home-level checkout. The separately located sources were inspected read-only. The legacy `vls-practice-main.zip` and the `vls-dop assisted with ai` checkout (`2f8a22d`) implement three-hour paid masterclasses using Next.js 16 Pages Router, React 18, JavaScript, Bootstrap and CSS modules. Their scripts are `dev`, `build`, `start` and legacy `next lint`. Business Law (`cbe9ad6`) and Constitution (`4a89499`) use Next.js App Router, TypeScript and Tailwind. Both have ESLint scripts. Constitution also declares Vitest and Playwright. Taxation, Economic Laws, AI for Advocates and static MACT references were inventoried as supporting sources. Their unrelated apps stay outside the DOP build.

The standalone implementation uses Next.js 16.4.5 App Router, strict TypeScript, Tailwind 4 and scoped CSS, React 19, local Inter and native disclosures. The proposed path is `/decoding-of-practice`, with query-preserving root redirect, `/decoding-of-practice/thank-you` and `POST /api/dop-enquiry`. Confirm the canonical production origin and campaign routing before launch. Keep the existing masterclass hostname and routes under their current owners until a separate cutover is approved.

- `lib/course.ts` provides copy, approved-publication switches, assets, contacts, programme data and the A–E headline allowlist. A is default, E requires AI approval. The curriculum list follows the historical brochure sequence and remains indicative.
- `app/decoding-of-practice/page.tsx` renders semantic programme copy, approved metadata, Course, EducationalOrganization and BreadcrumbList data. Visible FAQs are accessible natively. Robots and sitemap use explicit release configuration.
- `components/admission-form.tsx` and `lib/enquiry.ts` handle two-step qualification and shared validation. The server enforces consent, bounded input, a honeypot, rate limiting, idempotency and a signed short-lived receipt. The loopback adapter has no durable or external writes.
- `lib/analytics.ts` and `components/tracking.tsx` maintain browser attribution and a PII-free event contract. Analytics setup is described in the [M4 audit](audit/M4.md).

## Integration evidence

| Route or provider | Evidence and current availability |
| --- | --- |
| Invictus lead CRM | Historical legacy service `src/service/AcademyTraining/index.js` submits to `/vls-law-practice/create`. Invictus backend `VlsLawPracticeTable` and the matching admin use payment-oriented fields. Six-month DOP credentials, data contract, permissions and delivery are unverified. |
| Other lead capture | Constitution `app/api/enquiry/route.ts` and `lib/enquiry.ts` use a configurable server-side webhook. Business `src/lib/submitWaitlist.ts` describes its unwired waitlist. No approved DOP Google Sheets or WhatsNexus connection surfaced in the targeted audit. |
| WhatsApp | Legacy masterclass server messaging is distinct from the public academy WhatsApp click link. The public link is configured for visitors. VLS must confirm its admissions ownership and callback workflow. |
| Analytics | Legacy DOP document contains GTM, Meta Pixel and Clarity references. Economic Laws emits data-layer, Meta and Google events for its own payment funnel. No new DOP container, destination mapping, consent scope or Meta CAPI transport is approved. |

## Publication approvals

| Owner | Needs confirmation |
| --- | --- |
| VLS academics | Final syllabus and approved PDF, practice-area count, delivery format, language, calendar, assessments, recordings, internship, certificate and optional AI content. |
| VLS programme and admissions | Mentor involvement and phrasing, permission to publish photos and testimonials, DOP-specific testimonial attribution, verified contact routing, approved fee, batch dates and instalments. Hide unresolved commercial details and use the fee-enquiry copy. |
| Marketing and privacy owner | Canonical domain, consent copy and controls, approved GTM, GA4, Ads, Meta and Clarity destinations, retention and replay masking, URL scrubbing and event mapping. |
| Technical intake owner | Authorised webhook contract, durable deduplication, rate limits across deployed instances, staging credentials, webhook acceptance validation, and approval for production activation. |

## Skill provenance

| Skill | Reviewed source and project use |
| --- | --- |
| Ponytail | Reused installed text-only snapshot from `V2 lead page invictus/.agents/skills`; upstream snapshot reviewed at [`ebd8654`](https://github.com/DietrichGebert/ponytail/commit/ebd8654c2c627f721eb8f9c0d1bd4090a29f9e10). Installed snapshot’s upstream commit is unknown. SHA-256 `1316a2f3f95741d2300b116fe0c2d81ce4a9568656ed0a62643f54aaf09957f2`. No dependencies. |
| Emil design engineering | Reused installed text-only snapshot; upstream and its group-choreography reference reviewed at [`64eb3de`](https://github.com/emilkowalski/skills/commit/64eb3deb9a5fbfa041faf783e0bc3fd635872e9c). Installed snapshot’s upstream commit is unknown. SHA-256 `e71de849347050c2c573c1cf24d742d5a13459557ecffa6e562f08006f46b5b7`. CSS-only in this build. |
| Taste Skill | Upstream v2.5.1 reviewed at [`d1a2bb4`](https://github.com/Leonxlnx/taste-skill/commit/d1a2bb41d927083ac7118f60cfc9cdf711810ea0). The installed CRM adaptation targets MUI dashboards. The upstream kit requires a stop hook, scripts, reference files and browser tooling, and conflicts with the real contact and low-motion requirements. The project uses the equivalent guidelines in `AGENTS.md` and the design spec. No kit scripts or hooks were installed or run. |
| Additional reference | Set art direction explicitly, make the hero communicate the offer, and inspect rendered layouts. [OpenAI frontend design reference](https://developers.openai.com/blog/designing-delightful-frontends-with-gpt-5-4) |

## Modules

| Module | Current status | Evidence |
| --- | --- | --- |
| M0 Foundation | PASS | [Repository, brand and skill audit](audit/M0.md) |
| M1 Visual landing | PASS locally | [Visual and content audit](audit/M1-M2.md) |
| M2 Interactions | PASS locally | [Visual and content audit](audit/M1-M2.md) |
| M3 Intake | PASS locally; production BLOCKED | [Intake audit](audit/M3.md) |
| M4 Analytics and SEO | PASS locally; provider activation BLOCKED | [Tracking and search audit](audit/M4.md) |
| M5 Responsive QA | Browser and accessibility PASS; mobile LCP target FAIL | [Browser report](audit/M5.md) |
| M6 Release readiness | BLOCKED | [Release audit](audit/M6.md) |
