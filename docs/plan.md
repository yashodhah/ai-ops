# Issue Investigator: implementation plan

Goal: learn the integration pattern opencode uses for "register a workflow in a repo",
using a deliberately tiny Flue agent. The agent is not the point; the wiring is.

Reference: `opencode/packages/opencode/src/cli/cmd/github.ts` (installer + template),
`opencode/github/action.yml` (composite action), https://opencode.ai/docs/github/.

## Decisions (locked)

| # | Topic | Decision |
|---|-------|----------|
| 1 | Layers replicated | Workflow template + composite action. No installer CLI, no GitHub App yet. |
| 2 | Identity | `GITHUB_TOKEN` → `github-actions[bot]`. Action takes a `token` input (default `github.token`) so a GitHub App token can be swapped in later with no agent changes. |
| 3 | Agent location | Agent lives in this repo (`agents/`), run straight from the checkout. No packaging. Later: `uses: <owner>/ms-ai-plumbing/github/issue-investigator@v1`. |
| 4 | First test repo | Dogfood: this repo, via `uses: ./github/issue-investigator`. Cross-repo is milestone 2. |
| 5 | v1 scope | Trigger → investigate → report. No `dispatch_workflow` tool (deferred to step 2). |
| 6 | Who writes output | Agent is pure (issue text in, markdown out). The workflow handles all delivery. Agent holds no GitHub credentials. |
| 7 | Delivery | Artifact (`investigation-report.md`) + `$GITHUB_STEP_SUMMARY`. No issue comment. Permissions: `contents: read`, `issues: read` only. |
| 8 | Trigger | `issue_comment` containing `/investigate`, gated in YAML on `author_association` ∈ {OWNER, MEMBER, COLLABORATOR}, issues only (not PRs). Plus `workflow_dispatch` with `issue_number` for branch testing. |
| 9 | Model/key | OpenRouter, `openrouter/<vendor>/<model>` string. `OPENROUTER_API_KEY` repo secret, passed via `env:` in the consumer workflow (not as an action input). Model is hardcoded in the agent for v1: users cannot choose it. |
| 10 | Sandbox | Flue virtual sandbox (just-bash) with `OverlayFs({ root: <checkout>, readOnly: true })`. Agent can only read the repo; no writes, no host env access. No copying step. |
| 11 | Cost guards | Job `timeout-minutes: 10`; issue title + body + comments truncated to ~20,000 chars before reaching the agent; trigger already limited to trusted users. |
| 12 | Report format | Fixed four headings: Summary, Relevant files, Likely cause, Suggested next steps. |

## Layout

```
ms-ai-plumbing/
├── agents/
│   └── issue-investigator/
│       ├── package.json            # @flue/runtime, just-bash
│       └── src/agents/investigator.ts
├── github/
│   └── issue-investigator/
│       └── action.yml              # composite action
├── .github/workflows/
│   └── issue-investigator.yml      # dogfood consumer workflow (the "template")
└── docs/plan.md
```

## Steps

### 0. Repo bootstrap
- `git init`, create the GitHub repo, push.
- Add repo secret `OPENROUTER_API_KEY`.

### 1. Agent, runnable locally
- `investigator.ts`: `useModel(...)` (OpenRouter), `useSandbox(bash(...))` pointed at the checkout through a read-only `OverlayFs`, system prompt: investigate the issue against the repo, output a markdown report with exactly four headings: Summary, Relevant files, Likely cause, Suggested next steps. Read-only intent.
- Run by hand: `OPENROUTER_API_KEY=... npx flue run src/agents/investigator.ts --message "$(cat fixture-issue.md)" --id local-1 --new`.
- Exit criterion: a sensible report on stdout for a fixture issue.

### 2. Composite action
Inputs: `issue_number` (required), `token` (default `${{ github.token }}`). No `model` input in v1.
Steps:
1. Setup Node, install agent deps (`npm ci` in `${{ github.action_path }}/../../agents/issue-investigator`; for a local `uses: ./github/issue-investigator`, `action_path` is inside the workspace, so this resolves).
2. Fetch issue: `gh issue view $N --json title,body,comments > issue.json` with `GH_TOKEN`.
3. Truncate to ~20,000 chars. Build the message **from a file**, never by interpolating issue text into shell (injection).
4. `flue run ... --id issue-$N --new --json > result.json`; extract report to `investigation-report.md`.
5. Append the report to `$GITHUB_STEP_SUMMARY`.
6. `actions/upload-artifact` with `investigation-report.md`.

### 3. Workflow (consumer template)
```yaml
on:
  issue_comment: { types: [created] }
  workflow_dispatch:
    inputs: { issue_number: { required: true } }
jobs:
  investigate:
    if: >
      github.event_name == 'workflow_dispatch' ||
      (!github.event.issue.pull_request &&
       contains(github.event.comment.body, '/investigate') &&
       contains(fromJSON('["OWNER","MEMBER","COLLABORATOR"]'), github.event.comment.author_association))
    timeout-minutes: 10
    permissions: { contents: read, issues: read }
    steps:
      - uses: actions/checkout@v4
        with: { persist-credentials: false }
      - uses: ./github/issue-investigator
        env: { OPENROUTER_API_KEY: ${{ secrets.OPENROUTER_API_KEY }} }
        with: { issue_number: ${{ github.event.issue.number || inputs.issue_number }} }
```

### 4. Verify
1. `workflow_dispatch` from a feature branch with a real issue number → artifact + summary appear.
2. Merge to `dev`/default, comment `/investigate` as owner → run fires.
3. Comment as non-collaborator (or check the `if:` logic) → no run.
4. Check the log: the API key and issue body never appear in shell-interpolated commands.

## To verify while implementing (not yet confirmed)

## Deferred
- Step 2 agent capability: `dispatch_workflow` tool / `workflow_dispatch` to a second workflow (needs `actions: write`).
- GitHub App identity (swap via the `token` input).
- Cross-repo consumption, `@v1` tagging, private-repo action access.
- Installer CLI (`plumbing install` writing the workflow file) and packaging.
