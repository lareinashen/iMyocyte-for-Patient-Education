/**
 * Main App Component
 *
 * This is the root component of the iMyocyte application. It sets up the necessary
 * context providers for:
 * - Real-time communication via Ably (ChannelProvider)
 * - Shared running state information (RunningInfoProvider)
 *
 * The app simulates cardiac myocyte (heart muscle cell) behavior and signal propagation.
 */

import Steps from "./Pages/Steps";

import { CHANNEL_NAME } from "./data/Constants";
import { ChannelProvider } from "ably/react";
import { RunningInfoProvider } from "./data/CountContext";

function App() {

  return <div id="app">
    {/* RunningInfoProvider: Provides shared state for simulation parameters (CV, RP, mode, etc.) */}
    <RunningInfoProvider>
      {/* ChannelProvider: Connects to Ably channel for real-time cell-to-cell communication */}
      <ChannelProvider channelName={CHANNEL_NAME}>
        {/* Steps: Main UI component with stepper interface for simulation setup and execution */}
        <Steps />
      </ChannelProvider>
    </RunningInfoProvider>
  </div>;
}

export default App
