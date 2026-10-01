# Issue Investigator - GitHub Action

Analyze GitHub issues with AI and automatically generate investigation reports using the Flue Framework.

## Features

- **Automatic Repository Access**: Agent sees git-tracked files only (no secrets, no node_modules)
- **Isolated Sandbox**: Virtual filesystem prevents access to real filesystem
- **Multi-turn Analysis**: Continue investigation across multiple workflow runs
- **Markdown Reports**: Structured findings artifact for each issue
- **GitHub Integration**: Works with issue webhooks, PR context, and GitHub API
- **Downloadable Reports**: Investigation report available as workflow artifact with GitHub issue comment linking to it
- **Robust Error Handling**: Gracefully handles null/missing report output with debugging info

## Quick Start

### 1. Set up Repository Secret

Add your OpenRouter API key to repository secrets:

```bash
# GitHub → Settings → Secrets and variables → Actions → New repository secret
OPENROUTER_API_KEY = ......
```

### 2. Add to Workflow

Create `.github/workflows/investigate-issue.yml`:

```yaml
name: Investigate Issue
on:
  issues:
    types: [opened, edited]

jobs:
  investigate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Investigate Issue
        uses: ./github/issue-investigator@main
        with:
          issue_number: ${{ github.event.issue.number }}
          token: ${{ github.token }}
        env:
          OPENROUTER_API_KEY: ${{ secrets.OPENROUTER_API_KEY }}
```

### 3. Trigger

Open an issue and the agent will automatically analyze it.

---

## What the Agent Sees

### Inside the Sandbox

The agent has read-only access to `/repo` with:
- ✅ All source code files (git-tracked)
- ✅ Configuration files (`package.json`, `tsconfig.json`, etc)
- ✅ Documentation
- ✅ License files

### Outside the Sandbox

The agent **cannot** access:
- ❌ `.env` files, secrets, credentials
- ❌ `node_modules/` directory
- ❌ Build outputs, compiled files
- ❌ Binary files, symlinks
- ❌ Files > 256 KB
- ❌ Real filesystem (write protection)

This ensures the model only analyzes your actual source code, not build artifacts or sensitive files.

---

## Inputs

| Input | Required | Description |
|-------|----------|-------------|
| `issue_number` | ✅ Yes | The GitHub issue number to investigate |
| `token` | No | GitHub token for API access (defaults to `github.token`) |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENROUTER_API_KEY` | ✅ Yes | API key for OpenRouter (add to repository secrets) |

---

## How It Works

### Step-by-Step

1. **Fetch Issue Details**
   - Retrieves issue title, body, and comments from GitHub API
   - Saves to temporary file (not part of repo snapshot)

2. **Prepare Message**
   - Combines issue information into structured message
   - Truncates to 20,000 characters for efficiency

3. **Resolve Repository**
   - Uses `GITHUB_WORKSPACE` as repository root (already checked out)
   - Creates snapshot of git-tracked files
   - Seeds in-memory sandbox

4. **Run Agent**
   - Agent analyzes issue with repo context
   - Generates structured investigation report
   - Returns JSON with agent response

5. **Extract Report**
    - Parses agent JSON response
    - Saves markdown report as artifact
    - Appends to job summary for visibility
    - Handles null/missing output with fallback message

6. **Comment on Issue**
    - Posts investigation report link as issue comment
    - Provides direct link to workflow artifacts for download
    - Includes report sections summary (Summary, Relevant files, Root cause, Next steps)

### Data Flow

```
GitHub Issue
    ↓
Fetch Details (gh issue view)
    ↓
Build Message ($RUNNER_TEMP/issue-message.txt)
    ↓
Git Snapshot (/repo in sandbox)
    ↓
Flue Agent Analysis
    ↓
JSON Result ($RUNNER_TEMP/result.json)
    ↓
Extract Report ($RUNNER_TEMP/investigation-report.md)
    ├─ Handle null output gracefully
    └─ Log debugging info on failure
    ↓
Upload Artifact (30-day retention)
    ↓
Comment on Issue with Download Link
    ↓
Append to Job Summary
```

---

## File Locations

Within the action workflow, files are stored at:

| File | Location | Purpose |
|------|----------|---------|
| Issue JSON | `$RUNNER_TEMP/issue.json` | Issue metadata from API |
| Message | `$RUNNER_TEMP/issue-message.txt` | Formatted message for agent |
| Result | `$RUNNER_TEMP/result.json` | Agent response JSON |
| Report | `$RUNNER_TEMP/investigation-report.md` | Final markdown report |
| Artifact | Actions artifacts | Downloaded from job summary |

**Note:** All scratch files use `$RUNNER_TEMP/` to keep the repo snapshot clean. The agent can only see git-tracked files at `/repo`.

---

## Repository Structure

```
agents/issue-investigator/
├── src/
│   ├── agents/
│   │   └── investigator.ts          # Main agent (Flue Framework)
│   └── shared/
│       ├── repository.ts            # Git repo abstraction
│       └── repository.test.ts       # 12 tests for snapshot logic
├── package.json                     # Dependencies (just-bash, @flue/runtime)
└── QUICK_START.md                   # Local development guide

github/issue-investigator/
├── action.yml                       # GitHub Action definition
└── README.md                         # This file
```

---

## Environment Detection

The action automatically handles different environments:

### Local Development

```bash
cd agents/issue-investigator
export OPENROUTER_API_KEY="your-key"
npx flue run src/agents/investigator.ts --message "Your question"
```

Repository resolution: `git rev-parse --show-toplevel`

### GitHub Actions

```yaml
env:
  FLUE_REPO_ROOT: ${{ github.workspace }}
  OPENROUTER_API_KEY: ${{ secrets.OPENROUTER_API_KEY }}
```

Repository resolution: `GITHUB_WORKSPACE` → `FLUE_REPO_ROOT`

### Override

```bash
export FLUE_REPO_ROOT="/path/to/repo"
```

---

## Testing Locally

```bash
cd agents/issue-investigator

# Run test suite (validates repository abstraction)
npm test

# Expected: 12 tests pass
# ✔ Resolver tests (explicit, github-actions, local)
# ✔ Snapshot tests (includes/excludes logic)
# ✔ Sandbox isolation test (just-bash integration)
```

---

## Performance

- **Cold start:** ~5-10s (dependency install)
- **Warm run:** ~30-60s (API call + analysis)
- **Artifact size:** Typically 1-5 KB (markdown report)
- **Sandbox memory:** ~50-500 MB depending on repo size

---

## Security

✅ **What's protected:**
- `.env` files not accessible (gitignored)
- API keys hidden (not in git snapshot)
- Binary files excluded (can't leak source)
- No write access (sandbox is read-only)
- Symlinks followed but not accessed

⚠️ **What's not protected:**
- Source code is visible to the model (by design)
- Any secret tracked in git will be visible
- API key needed to run action (keep in secrets)

**Best Practice:** Never commit secrets. Use `.env` + `.gitignore`.

---

## Related Documentation

- [Flue Framework Docs](https://flueframework.com/docs)
- [Just-Bash Virtual Sandbox](https://github.com/vercel-labs/just-bash)
- [OpenRouter API](https://openrouter.ai/docs)
- [Local Development Guide](../agents/issue-investigator/QUICK_START.md)

---

## Recent Changes

### Bug Fix: Null Markdown Report Extraction

**Issue:** Report markdown file was empty when agent output was null or missing.

**Root Cause:** The `jq -r '.output'` extraction didn't handle cases where the output field was absent or null, resulting in empty reports.

**Fix (v1.1.0):**
- Changed extraction to `jq -r '.output // empty'` with null checking
- Added fallback message when report is empty: "Investigation encountered an error or produced empty output"
- Added debugging output to show full result structure on failure
- Better error logging in GitHub Actions logs

**Result:** Reports now always contain content—either the analysis or a clear error message explaining why generation failed.

### Enhancement: Downloadable Reports with Issue Comments

**Feature:** Investigation reports are now:
1. **Automatically commented** on the GitHub issue with a formatted report link
2. **Directly downloadable** from the workflow run artifacts (30-day retention)
3. **Easily accessible** without needing to navigate GitHub Actions UI

**How it works:**
- After report generation, the action posts a comment to the issue
- Comment includes link to workflow run artifacts
- Artifact link makes the `.md` file directly downloadable
- Job summary appends the full report text for quick viewing

---

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review action logs in GitHub Actions UI
3. Test locally: `cd agents/issue-investigator && npm test`
4. Check repository is properly initialized: `git status`

---

## License

MIT
