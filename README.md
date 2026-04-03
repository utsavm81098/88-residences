# 🏗️ Crprus-3D

Crprus-3D is an immersive, interactive 3D web application designed for exploring architectural building models. It allows users to view building structures with high-fidelity, interact with specific units or apartments (like hovering to see details and clicking to focus), and visualize different data-points like apartment type, area, direction, and availability status.

## 🚀 Key Features

*   **Interactive 3D Building Viewer:** Explore a detailed 3D building model loaded from a GLTF file (`building.gltf`).
*   **Unit Interaction:** Hover over individual apartments (units) to see tooltips with details like type, bedrooms, area, direction, and status. Click on a unit to smoothly animate the camera and focus on it.
*   **Performance Optimized:** Uses `three.js` optimizations and instancing patterns for smooth rendering. Culls invisible faces and efficiently handles intersection events.
*   **Adaptive Camera Controls:** Utilizes orbital controls that automatically adapt to different screen sizes (mobile vs desktop) to ensure a consistently good viewing experience without losing the model.
*   **Direction Labels:** Interactive 3D North, South, East, West labels that orient themselves towards the camera for easy spatial navigation.
*   **Status Indicators:** Visual color-coding of units based on their availability status (e.g., Available, Sold, Restricted).
*   **UI Overlay Systems:** Uses HTML overlays built with React layered cleanly over the WebGL canvas using `@react-three/drei`'s `Html` wrapper for tooltips and controls.

## 🛠️ Tech Stack

*   **Core:** [React](https://react.dev/) (v19)
*   **3D Rendering Engine:** [Three.js](https://threejs.org/)
*   **React + Three.js Integration:** [@react-three/fiber](https://docs.pmnd.rs/react-three-fiber/getting-started/introduction) (v9) & [@react-three/drei](https://github.com/pmndrs/drei) (v10)
*   **Animations:** [GSAP (GreenSock)](https://gsap.com/) for smooth camera transitions and UI animations.
*   **Styling:** Custom CSS and [TailwindCSS](https://tailwindcss.com/)
*   **Icons:** [@tabler/icons-react](https://tabler.io/icons)
*   **Build Tool & Dev Server:** [Vite](https://vitejs.dev/)

## 📂 Project Structure

This project follows a feature-based modular architecture to ensure scalability and maintainability.

```text
src/
├── main.jsx                          # Application entry point
├── app/                              # Root application level components
│   ├── App.jsx                       # Root component (Canvas setup & providers)
│   └── App.css                       # Global styles
├── features/                         # Core domain features
│   ├── building/                     # 3D Building logic
│   │   ├── BuildingModel.jsx         # Presentation layer
│   │   ├── useBuilding.js            # Model loading, cloning, and material setup hook
│   │   ├── useBuildingInteraction.js # Pointer handlers (hover, click, raycasting)
│   │   └── useCameraRotation.js      # Camera animation logic
│   ├── controls/                     # User view controls
│   │   └── AdaptiveControls.jsx      # OrbitControls tailored for device breakpoints
│   ├── environment/                  # Scene rendering environment
│   │   └── SceneEnvironment.jsx      # Lighting, HDR, Grid, and PostProcessing
│   ├── direction/                    # 3D Compass/Direction labels
│   │   ├── DirectionLabel.jsx        # Billboard text labels rendering
│   │   └── useDirectionLabel.js      # Layout and camera-tracking logic
│   └── lighting/                     # Dynamic lighting setups
│       └── CameraLight.jsx           # Camera-attached directional lighting
├── components/                       # Shared and reusable UI components
│   └── ui/                           # DOM based Interface overlays
│       └── tooltip/                  # The interactive unit infobox
│           ├── BuildingTooltip.jsx
│           ├── BuildingTooltip.css
│           └── StatCell.jsx
├── hooks/                            # Global shared React hooks
│   ├── useDeviceDetect.js            # Breakpoint tracking and device identification
│   ├── useFitCamera.js               # Logic to frame object within viewport
│   └── useTooltip.js                 # Global tooltip state management
├── data/                             # Static and mock data structures
│   └── unitData.js                   # Configuration for each apartment unit (Box001-Box020)
├── config/                           # Application configuration constants
│   ├── scene.config.js               # Scene constants (camera pos, HDR paths, etc)
│   ├── colors.config.js              # Theme and unit status colors
│   └── breakpoints.config.js         # Responsive design breakpoints matching CSS
├── constants/                        # Enums and magic strings
│   └── status.js                     # Unit status definitions (Available, Sold, etc.)
├── utils/                            # Pure helper functions
│   └── helpers.js                    # Functions like flattenUnitData
├── styles/                           # Global stylesheets
│   └── index.css                     # Base styling, layer setup, CSS variables
└── assets/                           # Static assets like images and generic models
```

### Key Folders Explained:
*   `features/`: encapsulates domain-specific logic. Everything needed for the 'building' feature is contained within its subfolder.
*   `components/`: contains standard UI elements that are agnostic to the domain data.
*   `hooks/`: are general-purpose utilities that bridge React state with imperative logic, often managing things like window resizing or global states.
*   `config/ & constants/`: house magic numbers and configuration, making it easy to tweak colors, starting positions, or data schemas without hunting through component code.

## 🏃‍♂️ Getting Started

### Prerequisites

*   Node.js (v18 or higher recommended)
*   npm (or yarn/pnpm)

### Setup Instructions

1.  **Clone the repository:**
    ```bash
    git clone [repository-url]
    cd crprus-3d
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Ensure you have the 3D assets:**
    *   Place your `.hdr` environment maps in the `/public/hdr/` directory (e.g., `/public/hdr/san_bridge_2k.hdr`).
    *   Place your GLTF/GLB models in the `/public/model/` directory (e.g., `/public/model/typeD/building.gltf`).

4.  **Start the development server:**
    ```bash
    npm run dev
    ```

5.  **Open in Browser:**
    Navigate to `http://localhost:5173` (or the port specified by Vite) to view the application.

## 🏗️ Building for Production

To create an optimized production build:

```bash
npm run build
```

This will output the compiled application into the `dist/` directory, ready to be deployed to any static hosting service.

## 🧹 Code Style & Linting

This project uses ESLint for code quality.

To run the linter:
```bash
npm run lint
```
