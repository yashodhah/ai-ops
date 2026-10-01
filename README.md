# MS AI Plumbing

A GitHub workflow for automated issue investigation powered by AI.

## Overview

**Issue Investigator** is a reusable GitHub Action that analyzes GitHub issues using AI to provide:
- **Summary**: One-sentence recap of the issue
- **Relevant files**: 2-5 most relevant repository files with context
- **Likely cause**: Hypothesis for what's causing the issue
- **Suggested next steps**: 3-5 concrete debugging or fix steps

## Features

- 🤖 **AI-powered analysis**: Uses OpenRouter to analyze issues against your repository code
- 🔒 **Read-only access**: Safe read-only sandbox with no write permissions to the repo
- 🛡️ **Secure**: API keys passed via environment, never exposed in logs
- ⚡ **Fast**: Runs in under 10 minutes with cost guards
- 🔐 **Permission-scoped**: Minimal GitHub permissions (read-only)

## Usage

### Option 1: Manual Trigger (workflow_dispatch)

Trigger the workflow manually from the Actions tab with an issue number.

### Option 2: Comment Trigger

Comment `/investigate` on any issue. The workflow will automatically run if:
- You are the repository owner, member, or collaborator
- The comment is on an issue (not a pull request)

Example:
```
/investigate
```

## Setup

### Prerequisites

- GitHub repository
- OpenRouter API key ([get one here](https://openrouter.ai/))

### Configuration

1. **Add the secret** to your repository:
   - Go to **Settings > Secrets and variables > Actions**
   - Create a new secret named `OPENROUTER_API_KEY`
   - Paste your OpenRouter API key as the value

2. **Add the workflow file** to your repository:
   ```bash
   mkdir -p .github/workflows
   cp .github/workflows/issue-investigator.yml your-repo/.github/workflows/
   ```

3. **Copy the action directory**:
   ```bash
   cp -r github/issue-investigator your-repo/github/
   cp -r agents/issue-investigator your-repo/agents/
   ```

4. **Commit and push**

### Using in Your Repository

Add to your `.github/workflows/issue-investigator.yml`:

```yaml
name: Issue Investigator

on:
  issue_comment:
    types: [created]
  workflow_dispatch:
    inputs:
      issue_number:
        description: 'Issue number to investigate'
        required: true
        type: number

jobs:
  investigate:
    if: >
      github.event_name == 'workflow_dispatch' ||
      (!github.event.issue.pull_request &&
       contains(github.event.comment.body, '/investigate') &&
       contains(fromJSON('["OWNER","MEMBER","COLLABORATOR"]'), github.event.comment.author_association))
    timeout-minutes: 10
    permissions:
      contents: read
      issues: read
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          persist-credentials: false

      - uses: ./github/issue-investigator
        env:
          OPENROUTER_API_KEY: ${{ secrets.OPENROUTER_API_KEY }}
        with:
          issue_number: ${{ github.event.issue.number || inputs.issue_number }}
```

## How It Works

1. **Trigger**: Comment `/investigate` on an issue or use `workflow_dispatch`
2. **Fetch**: The workflow fetches the issue title, body, and comments
3. **Investigate**: The Flue agent analyzes the issue against your repository code in a read-only sandbox
4. **Report**: A markdown report is generated and uploaded as an artifact
5. **Summary**: The report is appended to the GitHub Actions job summary

## Architecture

```
ms-ai-plumbing/
├── agents/
│   └── issue-investigator/
│       ├── package.json            # Flue runtime dependencies
│       └── src/agents/investigator.ts  # AI investigation logic
├── github/
│   └── issue-investigator/
│       └── action.yml              # Composite action (orchestration)
└── .github/workflows/
    └── issue-investigator.yml      # Reusable workflow template
```

### Agent (`investigator.ts`)
- **Input**: Issue text (title + body + comments, truncated to ~20,000 chars)
- **Model**: OpenRouter (configurable, defaults to GPT-4)
- **Sandbox**: Read-only access to repository via Flue's `OverlayFs`
- **Output**: Markdown report with four sections

### Action (`action.yml`)
- **Role**: Orchestrates the investigation pipeline
- **Steps**:
  1. Setup Node.js
  2. Install Flue agent dependencies
  3. Fetch issue details via GitHub CLI
  4. Prepare safe message (no shell interpolation)
  5. Run the agent via Flue
  6. Extract and upload report

### Workflow
- **Triggers**: `issue_comment` and `workflow_dispatch`
- **Guards**: Trusted user check, issue-only filter, 10-minute timeout
- **Permissions**: Minimal (read-only)

## Security Considerations

✓ **No shell injection**: Issue text is passed via file, never interpolated  
✓ **Read-only sandbox**: Agent cannot modify repository or access host environment  
✓ **Secret protection**: API keys passed via `env:`, never in action inputs  
✓ **Minimal permissions**: Only `contents:read` and `issues:read`  
✓ **Trusted users only**: Comments gated on author association  
✓ **Cost guards**: Message truncation (20,000 chars) and 10-minute timeout  

## Future Enhancements

- **GitHub App identity**: Swap `token` input to use a GitHub App instead of `GITHUB_TOKEN`
- **Workflow dispatch**: Add `dispatch_workflow` tool to trigger secondary workflows
- **Custom models**: Allow repositories to override the model via action input
- **Cross-repo support**: Reusable action with `@v1` tags for external consumption

## Development

### Local Testing

Test the agent locally:

```bash
cd agents/issue-investigator
npm install
export OPENROUTER_API_KEY="your-key"
npx flue run src/agents/investigator.ts \
  --message "$(cat fixture-issue.md)" \
  --id local-1 \
  --new
```

### Repository Structure

```
agents/issue-investigator/
├── package.json
└── src/
    └── agents/
        └── investigator.ts

github/issue-investigator/
└── action.yml

.github/workflows/
└── issue-investigator.yml
```

## License

MIT

## Contributing

Contributions welcome! Please open an issue or PR.

## Troubleshooting

### Workflow doesn't trigger on `/investigate` comment
- Check that you're the owner, member, or collaborator
- Verify the comment is on an issue (not a PR)
- Check the workflow file is in `.github/workflows/`

### No report generated
- Verify `OPENROUTER_API_KEY` secret is set correctly
- Check the workflow run logs for errors
- Ensure the agent dependencies installed (`npm ci`)

### API rate limiting
- Check your OpenRouter quota and plan
- Consider increasing the message truncation threshold
- Monitor API usage in your OpenRouter dashboard

## References

- [Flue Documentation](https://flue.dev)
- [OpenRouter API](https://openrouter.ai/)
- [GitHub Actions](https://github.com/features/actions)
- [GitHub Composite Actions](https://docs.github.com/en/actions/creating-actions/creating-a-composite-action)
