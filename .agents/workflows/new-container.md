---
description: Create a new container (smart component) inside src/containers/
---

# New Container Workflow

Use this workflow when adding a **container** — a smart component that connects business logic to UI via a hook. Containers coordinate screens but do NOT contain UI-specific rendering logic.

## Steps

1. **Create the container folder**
   ```
   src/containers/<container-name>/
   ```

2. **Create the container hook** — `use-<container-name>.js`
   - All business logic, state, and data preparation goes here
   - Can access Redux store (`useSelector`, `useDispatch`)
   - Can use `useEffect`, `useState`, `useMemo`, `useCallback`
   - Returns prepared data and handlers
   - No JSX
   ```js
   // src/containers/<container-name>/use-<container-name>.js
   import { useSelector, useDispatch } from "react-redux";
   import { useCallback } from "react";

   const useContainerName = () => {
     const dispatch = useDispatch();
     const data = useSelector((state) => state.someSlice);

     const handleAction = useCallback(() => {
       dispatch(someAction());
     }, [dispatch]);

     return {
       data,
       handleAction,
     };
   };

   export default useContainerName;
   ```

3. **Create the container component** — `index.jsx`
   - Call the container hook
   - Pass prepared data and handlers to UI components via props
   - Minimal JSX — just composition and prop passing
   ```jsx
   // src/containers/<container-name>/index.jsx
   import useContainerName from "./use-<container-name>";
   import SomeUIComponent from "../../components/<component-name>";

   const ContainerName = () => {
     const { data, handleAction } = useContainerName();

     return (
       <SomeUIComponent
         data={data}
         onAction={handleAction}
       />
     );
   };

   export default ContainerName;
   ```

4. **Add tests for the hook**
   ```
   src/containers/<container-name>/__tests__/use-<container-name>.test.js
   ```

## When to Use a Container

Ask yourself:
- Does this component need Redux store access? → **Container**
- Does it coordinate multiple UI components? → **Container**
- Does it handle lifecycle events (data fetching, subscriptions)? → **Container**
- Is it a pure visual building block? → **NOT a container** (use `/components` instead)

## Anti-Patterns

- ❌ Container with complex JSX (move rendering to a UI component)
- ❌ Container without a hook (logic must not be inline)
- ❌ Container importing another container's hook
- ❌ Business rules inside JSX expressions

## Checklist

- [ ] Folder and file use kebab-case
- [ ] Container hook: `use-<name>.js` — all logic, no JSX
- [ ] Container component: `index.jsx` — minimal JSX, just composition
- [ ] UI components receive all data via props
- [ ] No business logic in the JSX
- [ ] Tests added for the container hook
