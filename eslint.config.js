import js from "@eslint/js";
import globals from "globals";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";

export default [
  { ignores: ["dist"] },
  {
    files: ["**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: "latest",
        ecmaFeatures: { jsx: true },
        sourceType: "module",
      },
    },
    settings: { react: { version: "18.3" } },
    plugins: {
      react,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...react.configs["jsx-runtime"].rules,
      ...reactHooks.configs.recommended.rules,
      "react/jsx-no-target-blank": "off",
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      "react/no-unknown-property": [
        "error",
        {
          ignore: [
            // Core Three.js props
            "args",
            "position",
            "rotation",
            "scale",
            "quaternion",
            "matrix",
            "layers",
            "receiveShadow",
            "castShadow",
            "visible",
            "dispose",
            "attach",

            // Material props
            "map",
            "color",
            "roughness",
            "metalness",
            "emissive",
            "emissiveIntensity",
            "depthWrite",
            "depthTest",
            "polygonOffset",
            "polygonOffsetFactor",
            "polygonOffsetUnits",
            "opacity",
            "transparent",
            "side",
            "wireframe",
            "flatShading",

            // Event handlers
            "onClick",
            "onPointerOver",
            "onPointerOut",
            "onPointerDown",
            "onPointerUp",
            "onPointerMove",
            "onPointerMissed",

            // R3F specific
            "object",
            "intensity",
            "makeDefault",
            "far",
            "near",
            "fov",
            "aspect",
            "zoom",
            "fallback",
            "preset",
            "shadows",
            "dpr",
            "lookAt",
            "target",
            "distance",
            "angle",
            "penumbra",
            "decay",
            "cellSize",
            "cellThickness",
            "cellColor",
            "sectionSize",
            "sectionThickness",
            "sectionColor",
            "fadeDistance",
            "fadeStrength",
            "followCamera",
            "infiniteGrid",
          ],
        },
      ],
    },
  },
];
