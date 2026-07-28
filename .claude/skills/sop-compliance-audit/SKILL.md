---
name: sop-compliance-audit
description: Automated audit of the codebase against the React.js Internal Coding Standard SOP
---

# SOP Compliance Audit Skill

This skill audits the current codebase against the React.js Internal Coding Standard (SOP) and generates a compliance report.

## Usage

When asked to audit the codebase for SOP compliance, or when the `/frontend-architecture` workflow is invoked, follow these steps:

## Step 1: File Naming Audit

Run the following command to find non-kebab-case source files:

```bash
find src -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" | grep -v node_modules | grep -v __tests__ | while read f; do
  basename=$(basename "$f")
  if echo "$basename" | grep -qE '[A-Z]'; then
    echo "❌ NON-KEBAB: $f"
  fi
done
```

## Step 2: Store Access in UI Components

Check if any file in `src/components/` directly accesses the Redux store:

```bash
grep -rn "useSelector\|useDispatch\|from.*redux\|from.*store" src/components/ --include="*.js" --include="*.jsx"
```

**Expected:** Zero results. UI components should receive data via props only.

## Step 3: Console.log Usage

Find raw console statements that should use the centralized logger:

```bash
grep -rn "console\.\(log\|error\|warn\|info\)" src/ --include="*.js" --include="*.jsx" | grep -v "logger.js" | grep -v "node_modules"
```

**Expected:** Zero results in production code. Only `src/utils/logger.js` should use `console.*`.

## Step 4: Hardcoded Colors

Find hardcoded color values in JSX that should use design tokens:

```bash
grep -rn 'bg-\[#\|text-\[#\|border-\[#' src/ --include="*.jsx"
```

**Expected:** Minimal results. Colors should come from Tailwind theme or CSS custom properties.

## Step 5: dangerouslySetInnerHTML

Check for XSS-vulnerable patterns:

```bash
grep -rn "dangerouslySetInnerHTML" src/ --include="*.js" --include="*.jsx"
```

**Expected:** Zero results.

## Step 6: Error Boundary Check

Verify an Error Boundary exists at the app root:

```bash
grep -rn "ErrorBoundary\|getDerivedStateFromError\|componentDidCatch" src/ --include="*.js" --include="*.jsx"
```

**Expected:** At least one result in `src/main.jsx` or a dedicated error boundary component.

## Step 7: Folder Structure Check

Verify the target folder structure exists:

```bash
for dir in assets components containers features hooks lib store utils config; do
  if [ -d "src/$dir" ]; then
    echo "✅ src/$dir exists"
  else
    echo "❌ src/$dir MISSING"
  fi
done
```

## Step 8: Configuration Files Check

Verify required config files at project root:

```bash
for file in .nvmrc .env.example .prettierrc eslint.config.js; do
  if [ -f "$file" ]; then
    echo "✅ $file exists"
  else
    echo "❌ $file MISSING"
  fi
done

# Check engines field in package.json
node -e "const p=require('./package.json'); console.log(p.engines ? '✅ engines field exists' : '❌ engines field MISSING')"
```

## Step 9: Hook Pattern Audit

Check that hooks in `src/hooks/` don't return JSX:

```bash
grep -rn "return.*<\|return.*jsx\|React.createElement" src/hooks/ --include="*.js"
```

**Expected:** Zero results.

## Output Format

Generate a compliance report structured as:

```markdown
# SOP Compliance Report — [Date]

## Summary
- ✅ Compliant: X/Y checks
- ❌ Violations: Z items
- 🟡 Warnings: W items

## Violations (Blockers)
1. [File path] — [Description] — [SOP §X reference]

## Warnings (Non-blocking)
1. [File path] — [Description] — [SOP §X reference]

## Compliant Areas
- [List of passing checks]

## Recommended Actions
1. [Priority-ordered action items]
```
