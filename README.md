# iMyocyte

A React-based interactive application for visualizing and simulating myocyte (cardiac muscle cell) behavior and signal propagation.

## Overview

iMyocyte is a web application built with React, TypeScript, and Vite that provides an interactive interface for exploring myocyte properties and signal propagation patterns. The application features multiple visualization modes including ring diagrams, neighbor modes, and location-based views.

## Features

- **Multiple Visualization Modes**
  - Ring Diagram visualization
  - Neighbor Mode
  - Neighbor Ring Mode
  - Location Mode
  
- **Real-time Signal Propagation**
  - Fire signal simulation
  - Real-time updates using Ably
  
- **Interactive UI**
  - Material-UI components
  - Bootstrap styling
  - Responsive design

## Tech Stack

- **Frontend Framework:** React 18
- **Language:** TypeScript
- **Build Tool:** Vite
- **UI Libraries:** 
  - Material-UI (MUI)
  - React Bootstrap
  - Emotion (CSS-in-JS)
- **Real-time Communication:** Ably
- **Testing:** Vitest, React Testing Library
- **Linting:** ESLint

## Prerequisites

- Node.js (v16 or higher recommended)
- npm or yarn package manager

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/weiwshen/Cell_Project.git
   cd iMyocyte
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Available Scripts

### Development

```bash
npm run dev
```
Runs the app in development mode. Open [http://localhost:5173](http://localhost:5173) to view it in the browser.

### Build

```bash
npm run build
```
Builds the app for production to the `dist` folder. It compiles TypeScript and optimizes the build for best performance.

### Preview

```bash
npm run preview
```
Preview the production build locally.

### Lint

```bash
npm run lint
```
Runs ESLint to check code quality and style.

### Deploy

```bash
npm run deploy
```
Deploys the application to GitHub Pages.

## Project Structure

```
iMyocyte/
├── src/
│   ├── Pages/           # Page components
│   │   ├── ChooseMode.tsx
│   │   ├── FireSignal.tsx
│   │   ├── LocationMode.tsx
│   │   ├── NeighbourMode.tsx
│   │   ├── NeighbourRingMode.tsx
│   │   ├── RingDiagram.tsx
│   │   ├── RunningInfo.tsx
│   │   └── Steps.tsx
│   ├── Services/        # Utility functions
│   ├── assets/          # Static assets
│   ├── data/            # Data models and constants
│   │   ├── Constants.ts
│   │   ├── CountContext.tsx
│   │   ├── Enums.ts
│   │   ├── GlobalVariables.ts
│   │   └── myocyteProperties.json
│   ├── App.tsx          # Main app component
│   └── main.tsx         # Entry point
├── public/              # Public assets
├── dist/                # Build output
└── package.json         # Dependencies and scripts
```

## Configuration

The application uses Ably for real-time communication. Make sure to configure your Ably credentials if needed.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is private and not currently licensed for public use.

## Deployment

The application is configured for deployment to GitHub Pages at: http://weiwshen.github.io/Cell_Project

## Contact

For questions or support, please open an issue in the repository.

