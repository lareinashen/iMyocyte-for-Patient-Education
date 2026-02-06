/**
 * Main entry point for the iMyocyte application
 *
 * This file initializes the React application and sets up the Ably real-time
 * communication client that enables multiple myocyte cells to communicate
 * with each other in real-time.
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'bootstrap/dist/css/bootstrap.css'
import App from './App.tsx'

import * as Ably from 'ably';
import { AblyProvider } from 'ably/react';
import { ABLY_API_KEY } from './data/Constants.ts';
import { cellID } from './data/GlobalVariables.ts';

// Initialize Ably real-time client with API key and unique cell ID
// This enables real-time communication between different myocyte cells
const client = new Ably.Realtime({ key: ABLY_API_KEY, clientId: cellID });

// Get the root DOM element and create React root
const container = document.getElementById('root')!;
const root = createRoot(container!);

// Render the application wrapped in StrictMode and AblyProvider
// AblyProvider makes the Ably client available to all child components
root.render(
  <StrictMode>
    <AblyProvider client={client}>
      <App />
    </AblyProvider>
  </StrictMode>
)