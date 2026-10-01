import { defineAgent } from "@flue/runtime";
import { bash } from "just-bash";
import { OverlayFs } from "just-bash";

const agent = defineAgent(async (message, { useModel, useSandbox }) => {
  // Initialize OpenRouter model
  const model = useModel("openrouter/openai/gpt-4", {
    apiKey: process.env.OPENROUTER_API_KEY,
  });

  // Set up read-only sandbox with OverlayFs pointed at the repo checkout
  const repoRoot = process.cwd();
  const sandbox = useSandbox(
    bash({
      overlay: new OverlayFs({
        root: repoRoot,
        readOnly: true,
      }),
    })
  );

  // System prompt for issue investigation
  const systemPrompt = `You are an expert code reviewer and issue investigator. Your task is to investigate a GitHub issue against the repository code to provide a concise, actionable analysis.

You have read-only access to the repository via bash commands. You can:
- Browse the file structure (ls, find)
- Read file contents (cat)
- Search for patterns (grep)
- Understand the repo language and framework

Analyze the issue and produce a markdown report with exactly four sections:
1. **Summary**: A one-sentence recap of the issue.
2. **Relevant files**: List 2-5 files most relevant to this issue (with brief context).
3. **Likely cause**: Your hypothesis for what's causing the issue (2-3 sentences).
4. **Suggested next steps**: 3-5 concrete debugging or fix steps.

Be concise, precise, and grounded in the actual code you see in the repository.`;

  // Send the issue text and request investigation
  const response = await model.generate({
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: message,
      },
    ],
  });

  return response.text;
});

export default agent;
