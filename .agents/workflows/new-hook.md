---
description: Create a new custom hook inside src/hooks/
---

# New Hook Workflow

Use this workflow when adding a **global reusable hook** — a hook that is NOT tied to a specific feature or container.

## Steps

1. **Create the hook file**
   ```
   src/hooks/use-<hook-name>.js
   ```
   Use kebab-case for the file name. Hook function uses camelCase.

2. **Implement the hook**
   ```js
   // src/hooks/use-<hook-name>.js
   import { useState, useEffect, useCallback } from "react";

   /**
    * Brief description of what this hook does
    * @param {Object} config - Configuration options
    * @returns {Object} { data, handlers }
    */
   const useHookName = (config = {}) => {
     // State
     const [value, setValue] = useState(null);

     // Effects
     useEffect(() => {
       // Setup / cleanup
     }, []);

     // Handlers
     const handleChange = useCallback((newValue) => {
       setValue(newValue);
     }, []);

     return {
       value,
       handleChange,
     };
   };

   export default useHookName;
   ```

3. **Rules to follow**
   - ✅ Accept config via parameters (no hardcoded values)
   - ✅ Return an object with data and handlers
   - ✅ One hook per file
   - ✅ Generic enough to work in any component
   - ❌ No JSX or HTML
   - ❌ No styling logic
   - ❌ No direct DOM manipulation
   - ❌ No dependency on specific pages or features

4. **Add tests**
   ```
   src/hooks/__tests__/use-<hook-name>.test.js
   ```
   ```js
   import { renderHook, act } from "@testing-library/react";
   import useHookName from "../use-<hook-name>";

   describe("useHookName", () => {
     it("returns expected initial state", () => {
       const { result } = renderHook(() => useHookName());
       expect(result.current.value).toBeNull();
     });

     it("updates value via handleChange", () => {
       const { result } = renderHook(() => useHookName());
       act(() => {
         result.current.handleChange("new-value");
       });
       expect(result.current.value).toBe("new-value");
     });
   });
   ```

## Decision Guide

| Question | Answer → Action |
|---|---|
| Is this hook used by only one feature? | Co-locate in `src/features/<feature>/` |
| Is this hook used by only one container? | Co-locate in `src/containers/<name>/` |
| Is this hook reusable across features? | Place in `src/hooks/` |

## Checklist

- [ ] File name: `use-<name>.js` (kebab-case)
- [ ] Hook function: `useHookName` (camelCase)
- [ ] Returns object `{ data, handlers }`
- [ ] No JSX, no DOM, no styling
- [ ] Accepts config via parameters
- [ ] Generic and reusable
- [ ] Tests added
