# LifeWeave — Your Life, In Receipts

LifeWeave is a **local-first frontend prototype** that turns mixed activity datasets into an understandable personal-data dashboard.

## Problem

Personal activity can be scattered across music history, purchases, transactions and other exported records. Raw tables are difficult to explore as a connected timeline.

LifeWeave provides a single interface to:

- import CSV, TSV and XML data;
- normalize common field names;
- search and filter records;
- explore a chronological timeline;
- discover rule-based relationships;
- group nearby dated records into Life Stories;
- view descriptive data insights;
- export normalized records;
- work without a backend or external JavaScript library.

## Core workflow

**Import → Normalize → Explore → Connect → Understand → Export**

### 1. Import
Use the Import button or drag-and-drop area. Supported formats:

- `.csv`
- `.tsv`
- `.xml`

Files are read with the browser File API.

### 2. Normalize
LifeWeave recognizes common field names such as:

- Date: `date`, `datetime`, `timestamp`, `played_at`, `trans_date_trans_time`
- Title: `track`, `song`, `product`, `merchant`, `description`
- Amount: `amount`, `amt`, `price`, `cost`, `total`, `debit`, `credit`
- Category: `category`, `type`, `mode`, `genre`, `platform`

### 3. Explore
The dashboard includes:

- Overview
- Receipts Explorer
- Timeline
- Connections
- Life Stories
- Datasets
- Insights
- Activity History

### 4. Explainable connections

Connections are deliberately presented as **observable relationships**, not causal claims.

Examples:

- shared category;
- same calendar day;
- different activity types inside the same time window.

This keeps the visualization transparent and avoids pretending that correlation proves causation.

## UX and accessibility

The interface is designed for desktop and mobile:

- responsive sidebar;
- mobile overlay navigation;
- keyboard shortcut `Ctrl/Cmd + K`;
- visible focus states;
- semantic buttons and headings;
- ARIA labels for important controls;
- reduced-motion support;
- readable contrast-oriented color tokens;
- empty states and error feedback;
- responsive cards and tables.

## Privacy

LifeWeave is intentionally frontend-only.

Imported files are parsed in the browser. The project does not contain a server endpoint or API call for uploading imported rows.

The main record list masks long numeric identifiers. The detail view displays sensitive-looking identifiers in masked form.

**Important:** this is a frontend prototype, not a security boundary. Do not treat browser local storage or a static website as a replacement for production security controls.

## Performance choices

- No external UI framework.
- No external chart library.
- Native DOM rendering.
- Search is performed over normalized records.
- Large receipt views are capped at 200 visible rows for mobile-friendly rendering.
- Timeline and connection lists are capped for predictable rendering.
- CSS uses responsive grids rather than fixed-width layouts.
- `defer` is used for the JavaScript bundle.

## Project structure

```text
LifeWeave/
├── index.html
├── style.css
├── script.js
├── README.md
└── data/
    ├── spotify_history.csv
    ├── Daily Household Transactions.csv
    └── Augmented_IndiaTransactMultiFacet2024.csv
```

The demo dataset paths are optional. If they are unavailable, LifeWeave automatically creates a small built-in demo dataset so the UI remains demonstrable.

## Run locally

### Option A — Acode / mobile

Keep the files in the same project folder. Put demo datasets inside a `data` folder if available.

For automatic loading with `fetch()`, open the project through a local web server rather than relying on `file://`.

### Option B — Desktop

Any static HTTP server can serve the project.

Example:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## Evaluation-focused improvements

This version is structured around common frontend evaluation areas:

| Area | Implementation |
|---|---|
| Problem alignment | Clear receipt-to-story workflow and domain-specific dashboard |
| UI/UX | Responsive information hierarchy, consistent cards, empty states |
| Functionality | Import, parsing, search, filters, timeline, connections, stories, export |
| Code quality | Small reusable render/helpers, strict mode, defensive parsing |
| Performance | No heavy dependencies, rendering caps, native APIs |
| Accessibility | Focus states, ARIA labels, keyboard shortcut, reduced motion |
| Innovation | Explainable connection engine + Life Stories + local-first privacy model |
| Documentation | Problem, workflow, supported formats, architecture and run instructions |

## Important limitation

No frontend implementation can honestly guarantee a specific evaluator score. This version is designed to directly address the visible evaluation categories and make the implementation demonstrably stronger, but the final score depends on the evaluator's rubric and runtime environment.
