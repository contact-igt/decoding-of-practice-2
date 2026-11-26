# VLS Law Academy · Decoding of Practice

A local Next.js App Router project for full-course admissions. See the [project brief](docs/PROJECT-BRIEF.md), [design system](docs/DESIGN.md) and [release audit](docs/audit/M6.md).

## Run locally

```sh
npm ci
DOP_LOCAL_TEST=1 npm run dev
```

Open [the local programme page](http://127.0.0.1:3000/decoding-of-practice). Use synthetic form values to verify the loopback flow. It returns a clearly labelled test receipt and sends no lead externally. With local test mode off and no authorised webhook configured, the form gives an unavailable message and the phone and WhatsApp links remain available.

## Verify

```sh
npm run verify
DOP_LOCAL_TEST=1 npm start
# In another shell
npm run test:browser
```

The browser script uses installed Chrome on macOS, a browser at `CHROME_PATH`, or Playwright Chromium installed through `npx playwright install chromium`. It needs a loopback server with the explicit test adapter. Use `DOP_TEST_ORIGIN` to change the default server port and `DOP_TEST_OUTPUT` to change the screenshot directory.

## Release configuration

Use the server variables in [.env.example](.env.example) through the approved runtime secret store. Set the canonical origin and indexing only after release approval. Keep `DOP_LOCAL_TEST` off outside loopback. The optional approved intake must accept `Idempotency-Key` and return a 2xx JSON body with `{"accepted": true}` only after durable lead acceptance. Enable provider tags through an approved GTM container and verify the [analytics contract](docs/audit/M4.md) in an isolated property before activation.
