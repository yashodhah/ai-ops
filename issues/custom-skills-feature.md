# Issue: Cannot Provide Custom Skills to Agent

## Problem Statement

Currently, the Issue Investigator agent has a fixed system prompt and cannot be extended with custom skills or domain-specific knowledge. There is no mechanism for users to inject custom analysis patterns, language-specific guidance, or framework-specific debugging strategies.

## Current Limitations

- **No skill/capability extension**: Agent behavior is hardcoded in the prompt
- **No contextual adaptation**: Cannot load skills based on issue type, programming language, or repository characteristics
- **No reusability**: Cannot share analysis patterns across different projects
- **No configuration**: No way to customize agent behavior without code changes

## Desired Behavior

Users should be able to:

1. **Define custom skills** - Create skill definitions that extend agent capabilities with:
   - Domain-specific knowledge (e.g., TypeScript analysis, async patterns)
   - Language-specific guidance
   - Framework-specific debugging strategies
   - Custom analysis patterns

2. **Load skills dynamically** - Skills should be loadable from:
   - Configuration files (JSON)
   - Skill directory (auto-discovery)
   - Environment variables
   - Custom skill registries

3. **Conditional skill activation** - Skills should support:
   - Context-based conditions (issue type, language, labels)
   - Selective loading based on repository characteristics
   - Priority-based skill selection

4. **Skill composition** - Skills should support:
   - Dependencies (some skills build on others)
   - Validation (ensure skill format and content)
   - Metadata (author, version, tags, examples)

## Example Solution Outline

### Skill Definition Structure
```json
{
  "id": "typescript-analysis",
  "name": "TypeScript Analysis",
  "description": "Specialized analysis for TypeScript type errors and compilation issues",
  "category": "codebase-knowledge",
  "version": "1.0.0",
  "condition": "(context) => context.repositoryLanguage === 'typescript'",
  "content": "## TypeScript-Specific Analysis\n\n1. **Type System Issues**\n   - Check for implicit `any` types...",
  "dependencies": []
}
```

### Usage
```bash
SKILLS_CONFIG=./skills.json \
REPO_LANGUAGE=typescript \
flue run src/agents/investigator.ts --message "Issue text"
```

## Implementation Requirements

- [ ] Create skill type definitions and interfaces
- [ ] Implement skill validation system
- [ ] Build skill registry for managing loaded skills
- [ ] Implement skill loader from files/configs
- [ ] Add skill injection mechanism into agent prompt
- [ ] Support skill dependencies and resolution
- [ ] Add conditional skill activation
- [ ] Create example skills (TypeScript, Error traces, Async, Dependencies)
- [ ] Document skill creation and usage
- [ ] Add comprehensive tests

## Success Criteria

- ✅ Users can define and load custom skills without modifying agent code
- ✅ Skills are validated before injection
- ✅ Skills can be conditionally activated based on context
- ✅ Skills are composable with dependency resolution
- ✅ Comprehensive documentation with examples
- ✅ All tests passing (unit tests for registry, loader, injector)

## Notes

This feature should be optional - if no skills are configured, the agent works with default behavior. Skills should enhance but not break existing functionality.
