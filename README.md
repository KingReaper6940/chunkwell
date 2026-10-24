# Chunkwell

[Open Chunkwell](https://chunkwell.vercel.app)

**A good place to make a break.**

Split plain text into parts with an explicit UTF-8 byte, UTF-16 unit, code point, or grapheme budget. Inspect every boundary and keep a receipt that can reconstruct the supplied text exactly.

## Features

- Strict budgets, including long text with no spaces.
- Whole graphemes: combining marks, flags, and joined emoji stay together.
- Two boundary preferences: pack tightly or prefer late line breaks and whitespace.
- No inserted counters, separators, overlap, trimming, or Unicode normalization.
- Per-part counts, utilization, and half-open UTF-16 / byte offsets.
- Copy or save individual parts; export a JSON receipt, count-only CSV, or rejoined text.
- Verify pasted receipt structure and compare its reconstructed text with the current source.
- Local processing without accounts, uploads, analytics, external fonts, or app storage.

## Run locally

Node.js 20 or newer. No dependencies to install.

```sh
git clone https://github.com/KingReaper6940/chunkwell.git
cd chunkwell
npm test
npm run build
npm run dev
```

Open http://127.0.0.1:4184. The development server serves only allowlisted build assets on loopback.

## Use

1. Paste plain text or load the fictional example.
2. Choose the counting unit used by your destination and a whole-number budget.
3. Choose a boundary preference and select **Make the parts**.
4. Inspect and copy/save each part. Parts are paginated in groups of eight.
5. Save a receipt to keep all text, settings, counts, and offsets.
6. To check a receipt, paste the reference text into the source, split it, and use **Verify a receipt against this source**. Matching counts alone do not prove it matches your original; the source comparison does.

Editing an input clears the previous result. Download anything you need before closing the tab.

## What is counted?

| Text | UTF-8 bytes | UTF-16 units | Code points | Graphemes |
| --- | ---: | ---: | ---: | ---: |
| a | 1 | 1 | 1 | 1 |
| 🙂 | 4 | 2 | 1 | 1 |
| e + combining acute | 3 | 2 | 2 | 1 |

All modes cut only at grapheme boundaries. A grapheme larger than the selected budget produces an explicit error; the tool never breaks it to fit. Grapheme boundaries come from the runtime's `Intl.Segmenter` and may vary across Unicode versions.

Readable mode first finds the largest fitting prefix, then prefers the latest newline after 60% of that prefix's used budget. If none exists, it prefers late whitespace. Otherwise it keeps the fitting prefix. It does not understand sentence or document structure. Separators belong to the preceding part.

Offsets use `[start, end)`: start is included, end is excluded. UTF-16 offsets address JavaScript string slices; byte offsets address UTF-8 encoding. Neither represents token offsets.

## Receipts and examples

[Source](examples/source.txt), [receipt](examples/receipt.json), and [count table](examples/counts.csv) are reproducible with:

```sh
node scripts/example.mjs
```

The bundled example has 450 UTF-16 units, 469 UTF-8 bytes, and three readable parts at a 160-byte budget: 158, 160, and 151 bytes.

JSON includes **all text**, including whitespace. The CSV contains only numeric counts/offsets and a fixed unit identifier; it deliberately omits source text. Rejoined TXT adds no separator or byte-order mark. Receipts check internal consistency and exact source equality, **not** authenticity, authorship, or cryptographic integrity. An edited receipt with recomputed metadata is a different valid receipt.

## Limitations

- Maximum source: 100,000 UTF-16 units. Budget: 1–100,000. Maximum output: 500 parts. Receipt input: 1.5 million UTF-16 units.
- Browser textareas normalize CRLF/CR line endings to LF. Exact preservation applies to the string actually supplied to the engine; browser paste is not a byte-preserving file import. The engine itself preserves CRLF (covered by tests).
- Lone UTF-16 surrogates are rejected. No encoding detection, file upload, binary splitting, or normalization.
- Links, sentences, words, code fences, JSON, and markup may cross boundaries. Parts are not necessarily standalone valid documents.
- No token estimates, service-specific presets, suffix overhead, compression, or protocol framing. Check your destination's actual counting rules.
- Modern `Intl.Segmenter`, `TextEncoder`, Blob, and module support are required. Clipboard access may require HTTPS and browser permission; select the text or save a file if unavailable.
- Text stays in page memory until edited or the tab closes. Browser extensions, the operating system, clipboard, downloads, and hosting environment remain outside the app's control.
- Native download destinations and clipboard permissions were not verified in automated browser QA. Receipt content and browser reconstruction were verified.

## Screenshot

The app was verified through browser DOM state, but the browser screenshot service timed out on both local and production pages. A real screenshot is pending; no mockup is presented as the running app.

## Verification

`npm test` runs 15 tests. They cover unbroken-text byte caps, multibyte characters, joined emoji, combining marks, CRLF, bounds, invalid input, tampered receipts, exact reconstruction, and 256 seeded combinations of units/boundary modes. CI runs Node 20 and 22 on Linux and Windows.

Browser checks cover the example receipt round-trip, the 5,000-byte regression, two intact emoji at a one-grapheme budget, error-state invalidation, and a 390px responsive layout with no page overflow.

## Deploy to Vercel

Import this repository with **Other** as the framework, root directory `.`, build command `npm run build`, output directory `dist`, and an empty install command. These settings are included in `vercel.json`. No environment variables, database, server functions, or paid APIs are needed. Other static hosts work if they serve `.mjs` as JavaScript.

## Background

A [reported byte-limit failure in edge-tts](https://github.com/rany2/edge-tts/issues/499) illustrates why unbroken text needs a strict fallback bound. The reporter explicitly identifies the issue as AI-assisted and human-reviewed; Chunkwell tests its own implementation and makes no claim about upstream releases. Existing tools such as [Message Splitter](https://www.celsoazevedo.com/files/message-splitter/) already offer multiple counting units. Chunkwell focuses on explicit receipts and source comparison, with no novelty or market-demand claim.

MIT licensed. See [LICENSE](LICENSE).
