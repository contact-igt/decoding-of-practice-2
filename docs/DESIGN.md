# VLS design system

Authority is the [official academy website](https://www.vlslawacademy.com/). Inspected live at 1280px and 390px on 26 November 2026 in the Codex in-app browser. Examined DOM, CSSOM, computed styles, imagery, contacts and responsive menu. The public brand is direct and institutional, with red and black on white, faculty imagery and documentary classroom photography.

## Extracted and implemented values

| Purpose | Official source | DOP application |
| --- | --- | --- |
| Primary red | CTA and social controls `rgb(178, 10, 10)` / `#B20A0A` | CTA, links, accents and editorial emphasis through `--color-vls-red`. |
| Ink and headings | Body `rgb(12, 12, 12)` / `#0C0C0C`. Homepage hero heading `#000000`. | `#0C0C0C` for ink and dark editorial sections. |
| White and secondary surface | Body `#FFFFFF`, footer and contact panel `rgb(236, 236, 236)` / `#ECECEC`. | Primary, form and footer tokens. |
| Supporting treatments | CTA hover `#585656` on `#D9D9D9`. Legacy contact form and inherited carousel styles include `#DA7426` and `#003471`. | DOP keeps one red action system. Derived tones include `#850808` on hover, `#F5F5F5` section surface, `#505050` muted text, and `#D2D2D2` dividers. The dark sections use `#F0AAAA` for high-contrast red emphasis. |
| Type | Computed family Inter in body, navigation, CTA and headings. Homepage hero heading 48px bold at 1280px and 26px at 390px. Stylesheets also declare Anton, Onest and Poppins. | Self-hosted Inter for reading and UI. Iowan Old Style / Georgia is the editorial headline adaptation. Headlines scale fluently and copy stays at least 16px for reading. |
| Controls | White type on red, 6px radius, 1px black outline and 2.4px offset black shadow for the main CTA. Font Awesome and academy SVG education icons appear on the source site. | Keep the recognisable 6px radius and white-on-red contrast. Use clean fill, visible focus and minimal disclosure/check symbols. Keep interaction targets comfortably sized and use a compact sticky header. |
| Logo | Black scales and red/black wordmark, `/assets/icons/vls-logo-black.png`, visible in header and footer. | Bundled PNG is byte-identical to the official 234×234 source. Colour and aspect ratio are preserved. [Original logo](https://www.vlslawacademy.com/assets/icons/vls-logo-black.png) |

Styles observed in the official [site stylesheet](https://www.vlslawacademy.com/css/style.css), [responsive stylesheet](https://www.vlslawacademy.com/css/responsive.css) and computed Next.js styles. Bootstrap defaults such as `--primary: #007BFF` appear in the CSS without representing the academy’s brand red.

## Photographs and contacts

- Hero is the academy classroom image `IMG_9237.jpg` from the Business Law checkout and main site. Crop around the instructor and learners, keeping the photograph legible at narrow widths. [Original photograph](https://www.vlslawacademy.com/assets/images/IMG_9237.jpg)
- Methodology uses participants taking notes from `IMG_9235.jpg`, also in the Business Law checkout and main training gallery. [Original photograph](https://www.vlslawacademy.com/assets/images/IMG_9235.jpg)
- The Dr. Sivakumar portrait comes from the Business Law campaign asset based on an official academy campaign portrait. Primary site lists his credentials. Current cohort participation stays gated in the course configuration. [Portrait source](https://aiforadvocates.vlslawacademy.com/dr-sivakumar.svg) · [Academy faculty](https://www.vlslawacademy.com/whyvls)
- Source contact data is +91 95002 07811, +91 95000 25216, contact@vlslawacademy.com, and No. 1910, 2nd Floor, H Block 5th Street, 12th Main Road, Anna Nagar West, Chennai, Tamil Nadu 600040. The source homepage links WhatsApp to the second number. The footer’s LinkedIn admin URL is replaced with the public VLS company profile. Links include Instagram, YouTube, Facebook, official privacy and terms. [Academy contact](https://www.vlslawacademy.com/contact) · [Terms](https://www.vlslawacademy.com/terms-and-conditions) · [Privacy](https://www.vlslawacademy.com/privacy-policy) · [LinkedIn](https://in.linkedin.com/company/vls-lawacademy)

## Conversion journey

- Hero pairs an asymmetric classroom photograph with the full-course positioning, a six-month and 200-hour commitment, and one dominant enquiry CTA. Curriculum is the lower-emphasis action.
- First-case questions lead to the programme’s four learning pillars. The fictional laptop dispute demonstrates the sequence of practical decisions using native, keyboard-operable disclosures. The programme facts then prepare visitors to explore curriculum and methodology.
- Authentic photography and academy faculty support credibility. Audience copy and intended learning outcomes help visitors assess fit. Testimonials and the brochure link appear when academy approval is recorded. The AI section and variant E stay off until approval.
- The admissions section answers the fee question and leads into two short enquiry steps. Status, goal and timeline support follow-up. Consent precedes submission. Confirmed acceptance leads to a separate receipt page. Phone and WhatsApp are the secondary contact paths.
- FAQs answer unresolved programme details through admissions. The closing CTA returns to the form. A sticky mobile CTA stays clear of the form and keyboard focus.

## Design dials and acceptance

- `DESIGN_VARIANCE=8` supports imagery and typography with distinct compositions for the hero, case flow, curriculum, portrait and admissions.
- `MOTION_INTENSITY=3` limits motion to reversible focus, press and hover feedback. Disclosures and reading are immediate. Reduced motion removes transforms and decorative transitions.
- `VISUAL_DENSITY=4` establishes a restrained editorial rhythm with consistent gutters, thin dividers and ample section margins.
- Test 320, 375, 390, 430, 768, 1024, 1440 and 1920px. Accept only readable layouts with no clipping, horizontal overflow, blocked CTAs, missing images or broken internal anchors. Review full-page 390 and 1440px captures.
- Meet WCAG AA contrast and keyboard operation. Verify focus, input error associations, native disclosures, mobile navigation, consent and no-JavaScript readability of programme content.
- Target Lighthouse Performance 90+ and Accessibility, SEO and Best Practices 95+. Target LCP ≤2.5 s, INP ≤200 ms and CLS ≤0.1. Report lab observations separately from field measures.
