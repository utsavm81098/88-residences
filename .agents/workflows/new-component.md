---
description: Create a new pure UI component inside src/components/
---

# New Component Workflow

Use this workflow when adding a new **pure UI component** — a presentational building block with no business logic, no store access, no API calls.

## Steps

1. **Create the component folder**
   ```
   src/components/<component-name>/
   ```
   or for shadcn/ui primitives:
   ```
   src/components/ui/<component-name>.jsx
   ```

2. **Create the component file** — `index.jsx`
   - Props-only interface (no `useSelector`, no `useDispatch`)
   - Emit user interactions via callback props
   - Use design tokens from Tailwind / CSS custom properties
   - Use `cn()` for conditional classes
   ```jsx
   // src/components/<component-name>/index.jsx
   import { cn } from "@/lib/utils";

   const ComponentName = ({ title, isActive, onClick, className }) => {
     return (
       <div
         className={cn(
           "base-styles",
           isActive && "active-styles",
           className
         )}
         onClick={onClick}
       >
         <h3>{title}</h3>
       </div>
     );
   };

   export default ComponentName;
   ```

3. **Define clear prop interface**
   - Document expected props with JSDoc or comments
   - Provide default values where appropriate
   - Use descriptive callback names (`onSelect`, `onClose`, `onChange`)

4. **Use design tokens** — never hardcode colors
   ```jsx
   // ❌ BAD
   <div className="bg-[#1f2530] text-[#ffffff]">

   // ✅ GOOD
   <div className="bg-sidebar text-foreground">
   ```

5. **Add tests** (if the component has interactive behavior)
   ```
   src/components/<component-name>/__tests__/<component-name>.test.jsx
   ```

## Checklist

- [ ] Folder and file use kebab-case
- [ ] Component name is PascalCase
- [ ] No `useSelector` or `useDispatch` inside the component
- [ ] No API calls or business logic
- [ ] Props-only data flow
- [ ] Callbacks for user interactions
- [ ] Design tokens used (no hardcoded colors/spacing)
- [ ] `cn()` used for conditional classes
- [ ] Reusable in different contexts
