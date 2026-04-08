---
description: Create a new 3D scene feature module inside src/features/
---

# New Feature Workflow

Use this workflow when adding a new 3D scene feature module (e.g., a new visual effect, interaction, or scene element that must run inside `<Canvas>`).

## Steps

1. **Create the feature folder**
   ```
   src/features/<feature-name>/
   ```
   Use kebab-case for the folder name (e.g., `camera-stabilizer`, `direction-label`).

2. **Create the hook file** — `use-<feature-name>.js`
   - All logic goes here: state, effects, Three.js operations, GSAP animations
   - Can access Redux store (`useSelector`, `useDispatch`) — documented project exception
   - Can use R3F hooks (`useThree`, `useFrame`, `useGLTF`)
   - Must return an object with data and handlers
   - No JSX
   ```js
   // src/features/<feature-name>/use-<feature-name>.js
   import { useMemo, useCallback } from "react";

   const useFeatureName = ({ config }) => {
     // All logic here

     return {
       // data
       // handlers
     };
   };

   export default useFeatureName;
   ```

3. **Create the component file** — `index.jsx`
   - Pure render: bind hook returns to JSX
   - No logic beyond destructuring the hook
   - Export as named or default
   ```jsx
   // src/features/<feature-name>/index.jsx
   import useFeatureName from "./use-<feature-name>";

   const FeatureName = ({ ...props }) => {
     const { data, handlers } = useFeatureName(props);

     return (
       <group>
         {/* Scene graph elements */}
       </group>
     );
   };

   export default FeatureName;
   ```

4. **Register in the scene graph** — Update `App.jsx` or `SceneEnvironment`
   ```jsx
   import FeatureName from "./features/<feature-name>";
   // Add inside <SceneEnvironment> or <Canvas>
   ```

5. **Preload assets** (if applicable)
   ```js
   // At module level in the hook file
   useGLTF.preload("/path/to/model.glb");
   ```

6. **Add tests** (recommended)
   ```
   src/features/<feature-name>/__tests__/use-<feature-name>.test.js
   ```

## Checklist

- [ ] Folder uses kebab-case
- [ ] Hook file: `use-<name>.js` — all logic, no JSX
- [ ] Component file: `index.jsx` — pure render only
- [ ] Module-level vectors/constants (no GC pressure in `useFrame`)
- [ ] GSAP: `killTweensOf()` before new tweens
- [ ] Registered in scene graph
- [ ] Tests added for business logic
