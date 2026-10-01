# Testing Issue Investigator

## Test Issues Created

Three simple test issues have been created in the repository:

1. **Issue #1: Missing import in main.ts**
   - https://github.com/yashodhah/ai-ops/issues/1
   - Simple import error scenario

2. **Issue #2: Performance bottleneck in API endpoint**
   - https://github.com/yashodhah/ai-ops/issues/2
   - Performance issue scenario

3. **Issue #3: Bug in error handling middleware**
   - https://github.com/yashodhah/ai-ops/issues/3
   - Error handling bug scenario

## How to Test

### Test 1: Manual Trigger via workflow_dispatch

1. Go to https://github.com/yashodhah/ai-ops/actions
2. Click on "Issue Investigator" workflow
3. Click "Run workflow"
4. Enter an issue number (e.g., `1`, `2`, or `3`)
5. Click "Run workflow"
6. Wait for the job to complete (~1-2 minutes)
7. Check the **Job Summary** for the report
8. Download the artifact: `investigation-report-N.md`

### Test 2: Comment Trigger

1. Go to https://github.com/yashodhah/ai-ops/issues/1 (or any test issue)
2. Leave a comment: `/investigate`
3. The workflow should automatically trigger
4. Check the job runs in Actions tab

### Test 3: Local Agent Testing

Test the Flue agent locally without running the full workflow:

```bash
cd agents/issue-investigator
npm install

# Create a test issue message
cat > test-issue.md << 'EOF'
Issue: Missing import in main.ts

The main.ts file is trying to import a function that doesn't exist.

Error:
Cannot find module 'utils/helper'

This is blocking the build.
EOF

# Run the agent
OPENROUTER_API_KEY=your-key npx flue run src/agents/investigator.ts \
  --message "$(cat test-issue.md)" \
  --id local-test-1 \
  --new
```

## Expected Output Format

The agent should produce a markdown report like:

```markdown
## Summary
The application is missing an import statement for a utility function.

## Relevant files
- src/main.ts (line 15, attempted import)
- src/utils/helper.ts (source file location)
- package.json (dependency declarations)

## Likely cause
The import path is incorrect or the file has been moved/renamed without updating the import statement. This is a common issue when refactoring module structure.

## Suggested next steps
1. Check if src/utils/helper.ts exists in the codebase
2. Verify the correct import path
3. Search for other imports of this module and check if they're updated
4. Run `npm ls` to check module dependencies
5. Consider adding ESLint rules to catch missing imports
```

## Troubleshooting

### Workflow doesn't run on `/investigate` comment
- **Check**: You must be the repo owner, member, or collaborator
- **Check**: The comment must be on an issue (not a PR)
- **Check**: The workflow file exists at `.github/workflows/issue-investigator.yml`

### No artifact generated
- **Check**: Job logs for errors (go to Actions > Run > Investigate job)
- **Check**: `OPENROUTER_API_KEY` secret is properly set
- **Check**: Agent dependencies installed correctly

### API key issues
- **Check**: Secret is named exactly `OPENROUTER_API_KEY`
- **Check**: The key is valid and has quota
- **Check**: No extra spaces or quotes in the secret value

### Agent timeout or slow response
- Check your OpenRouter usage and rate limits
- Verify internet connection
- Check job logs for specific error messages

## Next Steps After Testing

1. ✅ Verify `workflow_dispatch` trigger works
2. ✅ Verify `/investigate` comment trigger works
3. ✅ Check that reports appear in artifacts
4. ✅ Verify no secrets leak in logs
5. 🔄 Iterate on system prompt for better analysis
6. 🔄 Test with real issues in your repositories

## Clean Up Test Issues

Once testing is complete, you can close the test issues:

```bash
gh issue close 1 --repo yashodhah/ai-ops
gh issue close 2 --repo yashodhah/ai-ops
gh issue close 3 --repo yashodhah/ai-ops
```

Or delete them directly in the GitHub UI.
