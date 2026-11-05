# Contributing to AIMFORGE

Thanks for helping. AIMFORGE is a static site: plain ES modules, three.js vendored in `vendor/`, no build step, no dependencies.

## Run it locally

```bash
git clone https://github.com/apurvamukherjee/aim-forge
cd aim-forge
python3 -m http.server 8000   # or: npx serve
```

Open <http://localhost:8000>. It must be served over HTTP; opening `index.html` directly won't load the modules. You need a desktop browser with WebGL 2.

## Checks

There's no test suite yet. CI runs a syntax check on every module; run it before opening a PR:

```bash
for f in js/*.js; do node --check "$f"; done
```

Then play through the mode you touched in the browser and watch the console for errors.

## Code style

- Plain JavaScript ES modules, no frameworks, no new dependencies without discussing in an issue first.
- Match the style of the surrounding file (2-space indent, named exports).
- Keep everything generated in code: no binary model, texture or audio assets.

## Pull requests

1. Fork, then branch from `main` (`fix/short-name` or `feat/short-name`).
2. Keep PRs small and focused on one change.
3. Describe what changed and how you tested it; include a screenshot or clip for visual changes.
4. CI must pass.

Not sure where to start? Look for issues labelled [good first issue](https://github.com/apurvamukherjee/aim-forge/labels/good%20first%20issue). Questions go to [Discussions](https://github.com/apurvamukherjee/aim-forge/discussions); bugs go to Issues.

## Response times

Every new issue and PR gets a first reply within one day. If something sits longer, a polite ping on the thread is welcome.
