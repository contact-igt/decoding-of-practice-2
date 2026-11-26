<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# VLS Law Academy · Decoding of Practice

- Read [the project brief](docs/PROJECT-BRIEF.md), [the design system](docs/DESIGN.md) and the relevant [audit](docs/audit/) before changing the DOP flow. Verify each module before changing its status.
- Optimise for qualified full-course enquiries. Keep the app and route conventions, reuse native controls and existing components, and keep dependencies and changes scoped.
- Keep approval-sensitive data in the course configuration. Publish only approved programme facts, media and proof. Verify names, intended context and usage permissions. Keep commercial details, course dates, AI, certification, services and outcome claims gated until approved.
- Use an authorised server-side intake and require durable acknowledgement before success. Protect form values and credentials, preserve validation and idempotency, and keep PII out of analytics and routine logs. Run test submissions only against loopback or an explicitly isolated intake.
- Payment collection, deployment, live data or tracking writes, ad changes, commits and pushes require separate authorisation. Keep unrelated pages and infrastructure outside the change.
- Activate [Ponytail](.agents/skills/ponytail/SKILL.md) for implementation, review and dependency decisions. Apply the smallest complete change and preserve validation, accessibility and failure handling.
- Activate [Emil design engineering](.agents/skills/emil-design-eng/SKILL.md) for interaction design and visual QA. Use immediate keyboard feedback, visible focus, restrained native transitions and reduced-motion support.
- Apply the reviewed Taste guidance for art direction and real-browser review through this project’s design rules. Use one editorial hierarchy, authentic contextual imagery, aligned edges, materially different compositions and quiet state feedback. Check actual desktop and mobile rendering. Use `DESIGN_VARIANCE=8`, `MOTION_INTENSITY=3`, `VISUAL_DENSITY=4`. Scope and precedence come from this project’s requirements.
- Reuse reviewed installed skills. Pin and inspect any required additions and their dependencies before copying project-local files. Enable hooks and execute scripts only after review and when needed.

## Model policy

| Use | Model | Standard short-context API price per 1M input / output tokens |
| --- | --- | --- |
| Default | GPT-6.2 Sol | $2 / $10 |
| Escalation | GPT-6.2 Astra | $8 / $40 |
| Visual checks | GPT-6.1 Terra | $1 / $5 |
| Routine checks | GPT-6 Luna | $0.10 / $0.50 |

Verified on 26 November 2026. Reverify on 26 December 2026 and after each 30-day interval. [OpenAI API pricing](https://developers.openai.com/api/docs/pricing)
