## What & why

<!-- One concern per PR. What changed, and what problem does it solve? -->

## Checklist

- [ ] `npm run check && npm test` is green
- [ ] `npm run test:e2e` is green (required if the change touches overlay, selection, clipboard, or injection behavior)
- [ ] New behavior has a test (selector-engine heuristics especially — pin both the case you fixed and a real-word class like `editorContent` that must survive)
- [ ] No new permissions, no network, no dependencies, no build step
- [ ] Visuals verified in light **and** dark mode (if styling changed)
