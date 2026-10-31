# UI Design evaluations

`audits/` preserves eight HTML cases and gold labels. The
rule-matching scorer is a Node.js adaptation; it does not measure visual
quality or prove WCAG compliance.

Use a fresh agent session per case. Give it the installed skill and the HTML
plus only the `prompt` from `expected.json` (paths have been relocated to this
fixture directory). Keep expected labels hidden from the evaluating
agent. Record reports as `<case-id>.md` outside the tracked fixture directory.

Run `node tests/ui-design/harness/evaluate.mjs --reports /absolute/reports` to
check all eight reports. Missing reports fail. Every must rule must be found;
forbidden rule findings fail; should recall is informational. Finding-table
matching does not verify the cited evidence or proposed fix. `--self-check`
only checks fixture integrity.

`triggers.json` records invocation prompts. Evaluate trigger selection separately
from audit quality. `generation.json` adds in-place token and component-adjustment
tasks. Copy `existing-system/` into a temporary workspace; the prompts name
`theme.css` as the Tailwind entry and that directory as the component directory.
These cases use artifact/behavior checks rather than rule-count scores. Never count a
prepared prompt or a synthetic report as a completed model evaluation.

For each real run, record the host/model, prompt, skill path/revision, artifact
location, static checks, browser checks, findings and unverified items. Keep
trigger, generator, audit and visual results separate.
