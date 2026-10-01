# Issue Investigator - Quick Start

## 30-Second Start

```bash
cd agents/issue-investigator

# Run with test issue
npx @flue/cli run src/agents/investigator.ts \
  --message "$(cat fixture-issue.md)"
```

---

## Test Multi-turn (Conversation Persistence)

```bash
# Message 1: Analyze issue
npx @flue/cli run src/agents/investigator.ts \
  --id test-1 \
  --message "Issue: Database query timeout after deploy"

# Message 2: Ask follow-up (same conversation)
npx @flue/cli run src/agents/investigator.ts \
  --id test-1 \
  --message "What should I check first?"

# Message 3: Another follow-up
npx @flue/cli run src/agents/investigator.ts \
  --id test-1 \
  --message "How do I increase the timeout?"
```

---

## What You Need

✅ Already configured:
- `flue.config.ts` (runtime)
- `tsconfig.json` (TypeScript)
- `src/agents/investigator.ts` (agent code)
- `package.json` (dependencies)
- `node_modules/` (286 packages)
- `.env` (API key)

⏳ Still needed:
- API credits (OpenRouter account needs funding)

---

## Files Created/Modified

```
✅ flue.config.ts     - NEW (Flue config)
✅ tsconfig.json      - NEW (TypeScript config)
✅ src/agents/investigator.ts - REFACTORED (now Flue agent)
✅ package.json       - UPDATED (added @flue/runtime, @flue/cli)
✅ FLUE_SETUP.md      - NEW (comprehensive guide)
✅ QUICK_START.md     - NEW (this file)
```

---

## The Agent (src/agents/investigator.ts)

```typescript
'use agent';

import { useModel } from '@flue/runtime';

export function IssueInvestigator() {
  useModel('openrouter/openai/gpt-4-turbo');  // provider/model-id format
  return 'You are an expert code reviewer. Analyze issues and provide:
    1. Summary (1 sentence)
    2. Relevant files (2-5)
    3. Likely cause (2-3 sentences)
    4. Suggested next steps (3-5 actions)';
}
```

**Model Specifier Format:**
- `openrouter` = provider
- `openai/gpt-4-turbo` = model-id (can contain slashes for nested models)
- Example: `openrouter/moonshotai/kimi-k2.6` for Kimi

---

## Data Flow

```
INPUT               PROCESSING              OUTPUT
(Issue text)  →  (Flue agent)  →  (Markdown report)
  •Error        •System prompt       •Summary
  •Stack trace  •LLM processing      •Files
  •Code context •Structuring          •Cause
                                      •Next steps
```

---

## API Provider Options

### Current (OpenRouter)
```bash
# Update agent to use Anthropic instead
sed -i '' "s/openrouter/anthropic/g" src/agents/investigator.ts

# Add API key
echo "ANTHROPIC_API_KEY=sk-ant-..." >> .env

# Run
npx @flue/cli run src/agents/investigator.ts --message "..."
```

---

## Troubleshooting

**"Provider is not configured"**
- Solution: Add API key to .env
- Example: `ANTHROPIC_API_KEY=sk-ant-...`

**"No credits remaining"**
- Solution: Add credits to your API account
- For OpenAI: https://platform.openai.com/account/billing
- For OpenRouter: https://openrouter.ai/account/credits

**"Command not found: flue"**
- Solution: Use `npx @flue/cli` instead of `flue`
- Full command: `npx @flue/cli run src/agents/investigator.ts --message "..."`

---

## Full Documentation

- `FLUE_SETUP.md` - Comprehensive setup guide
- `COMPLETION_SUMMARY.md` - Before/after comparison
- https://flueframework.com/docs - Full Flue docs

---

## That's It!

Your agent is ready. Just add API credits and run:

```bash
npx @flue/cli run src/agents/investigator.ts --message "Your issue here"
```
