# Issue Investigator - Flue Framework Agent

Your issue investigator has been successfully converted to a Flue Framework agent! 

## What Changed

✅ **Converted from:** Raw Node.js script with direct axios calls  
✅ **Converted to:** Flue agent with multi-turn conversation support  
✅ **Gains:**
- Persistent conversations (ask follow-up questions to the same agent)
- Durable conversation IDs for tracking issues
- Built-in streaming responses
- Hot-reload ready for future deployments
- Type-safe with TypeScript support

## Project Structure

```
agents/issue-investigator/
├── flue.config.ts              # Flue runtime config (target: node)
├── tsconfig.json               # TypeScript configuration
├── package.json                # Dependencies (@flue/runtime, @flue/cli)
├── .env                        # API credentials
├── src/
│   └── agents/
│       └── investigator.ts     # The agent (use agent directive)
├── fixture-issue.md            # Test issue
└── FLUE_SETUP.md              # This file
```

## Running the Agent

### Single Message (One-shot)
```bash
# From the agent directory
npx @flue/cli run src/agents/investigator.ts \
  --message "Your issue description here"

# Or from file
npx @flue/cli run src/agents/investigator.ts \
  --message "$(cat fixture-issue.md)"
```

### Multi-turn Conversation
```bash
# First message - creates new conversation
npx @flue/cli run src/agents/investigator.ts \
  --id issue-1 \
  --message "Here's my issue: ..."

# Follow-up message - same conversation
npx @flue/cli run src/agents/investigator.ts \
  --id issue-1 \
  --message "Can you tell me more about the likely cause?"

# Another follow-up
npx @flue/cli run src/agents/investigator.ts \
  --id issue-1 \
  --message "What if I fix step 1 first?"
```

## Input → Processing → Output

### INPUT
- GitHub issue description
- Error messages and stack traces
- Code snippets and context
- (Provided via `--message` or stdin)

### PROCESSING
- LLM analyzes the issue using system instructions
- Structures findings into 4 sections
- Considers code patterns and context

### OUTPUT
Markdown report with:
1. **Summary** - One-sentence recap
2. **Relevant files** - 2-5 files with context
3. **Likely cause** - 2-3 sentence hypothesis
4. **Suggested next steps** - 3-5 concrete actions

## Environment Setup

### Option 1: Anthropic (Claude - Recommended)
```bash
# Set your API key
echo "ANTHROPIC_API_KEY=sk-ant-..." >> .env

# Update agent to use Claude
# Currently set to: openai/gpt-4-turbo
# Change to: anthropic/claude-sonnet-4-6
```

### Option 2: OpenRouter (Current)
Already configured in `.env` with existing key.

### Option 3: OpenAI
```bash
echo "OPENAI_API_KEY=sk-..." >> .env
# Keep model as: openai/gpt-4-turbo
```

## Type Checking

```bash
npm run type-check
```

## API Credentials Used

The agent supports any model available through Pi/Flue providers:
- ✅ Anthropic (Claude)
- ✅ OpenAI (GPT-4, GPT-5)
- ✅ OpenRouter (Multi-provider)
- ✅ Other Pi-supported providers

See `https://flueframework.com/models.json` for full list.

## Next Steps

1. **Add API Credits** (if using OpenAI)
   - Visit: https://platform.openai.com/account/billing/overview

2. **Choose Your Model**
   - Edit `src/agents/investigator.ts` line 18
   - Update the `useModel()` call

3. **Test Multi-turn**
   ```bash
   npx @flue/cli run src/agents/investigator.ts --id test-1 --message "Your first issue"
   npx @flue/cli run src/agents/investigator.ts --id test-1 --message "Tell me more"
   ```

4. **Deploy (Optional)**
   - Add `@flue/vite` and `hono` to create a web server
   - Create `src/app.ts` with agent routing
   - Run `vite dev` for local server

## Debugging

View conversation history:
```bash
# Check the local database
cat node_modules/.cache/flue/run.db
```

View agent logs:
```bash
# Enable verbose logging (Flue will output more details)
npx @flue/cli run src/agents/investigator.ts \
  --message "Your issue" \
  --verbose
```

## Files Modified/Created

- ✅ `flue.config.ts` - New Flue configuration
- ✅ `tsconfig.json` - New TypeScript config for Flue
- ✅ `src/agents/investigator.ts` - Refactored to Flue agent
- ✅ `package.json` - Updated with Flue dependencies
- ✅ `.env` - Kept (Flue loads automatically)

## Documentation

Full Flue documentation offline:
```bash
npx flue docs search "agent hooks"
npx flue docs read "docs/guide/building-agents"
npx flue docs
```

Or online at: https://flueframework.com/docs
