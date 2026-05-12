# 🏗️ 88Residences

88Residences is an immersive, interactive 3D web application designed for exploring architectural building models. It allows users to view building structures with high-fidelity, interact with specific units or apartments (like hovering to see details and clicking to focus), and visualize different data-points like apartment type, area, direction, and availability status.

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
├── main.jsx                    # Application entry point
├── App.jsx                     # Root layout — Canvas + Navigation + State
├── App.css                     # Global styles
├── index.css                   # Tailwind + CSS Variables
│
├── features/                   # 3D Scene features (R3F modules)
│   ├── building/               # GLB logic, interactions, instance management
│   ├── scene-environment/      # Lights, HDR, Grid, Post-processing
│   ├── building-tooltip/       # Desktop hover tooltips & detail popups
│   ├── adaptive-controls/      # Responsive OrbitControls
│   └── direction-label/        # 3D Billboard compass labels
│
├── containers/                 # Smart UI components (Redux connected)
│   ├── inventory-sidebar/      # Unit list & filtering logic
│   ├── top-navigation/         # Building switcher & global actions
│   ├── mobile-menu/            # GSAP-driven bottom sheet
│   └── unit-info-card/         # Selected unit detail views
│
├── components/                 # Pure UI components (Presentational)
│   ├── ui/                     # shadcn/ui primitives (Button, Card, etc.)
│   ├── providers/              # Context & Query providers
│   └── error-boundary/         # Error resilience components
│
├── store/                      # Redux Toolkit state management
│   ├── index.js                # Store configuration
│   └── slices/                 # State domains (building, tooltip, etc.)
│
├── hooks/                      # Shared React hooks
├── utils/                      # Helper functions & global constants
├── assets/                     # Static icons & SVGs
├── layouts/                    # Page layout containers
├── pages/                      # Route-level components
├── routes/                     # React Router configuration
├── services/                   # API clients & services
└── i18n/                       # Internationalization configuration
```

### Key Folders Explained:

*   **`features/`**: Encapsulates 3D-specific logic that runs inside the R3F `<Canvas>`.
*   **`containers/`**: Smart components that connect business logic (Redux) to UI components.
*   **`components/`**: Houses presentational UI building blocks and global providers.
*   **`store/`**: Centralized state management using Redux Toolkit slices.
*   **`hooks/`**: Global shared React hooks for things like responsive design and API calls.
*   **`utils/`**: Shared constants, configuration, and helper functions.
*   **`pages/ & routes/`**: Defines the application's routing structure and views.

## 🏃‍♂️ Getting Started

### Prerequisites

*   Node.js (v18 or higher recommended)
*   npm (or yarn/pnpm)

### Setup Instructions

1.  **Clone the repository:**
    ```bash
    git clone [repository-url]
    cd 88-residences
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
