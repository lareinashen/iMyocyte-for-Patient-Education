/**
 * Running Info Context
 *
 * This file provides a React Context for sharing simulation running information
 * across all components in the application. It stores current simulation parameters
 * like conduction velocity (CV), refractory period (RP), mode, and activity level.
 *
 * Usage:
 * - Wrap your app with <RunningInfoProvider>
 * - Access the context using the useRunningInfo() hook
 */

import React, { createContext, useContext, useState, ReactNode } from "react";
import { RunningInfoInterface } from "./GlobalVariables";

/**
 * RunningContextType - Shape of the context value
 * @property runningInfo - Current simulation parameters (CV, RP, mode, level)
 * @property setRunningInfo - Function to update the simulation parameters
 */
interface RunningContextType {
  runningInfo: RunningInfoInterface | null;
  setRunningInfo: React.Dispatch<React.SetStateAction<RunningInfoInterface>>;
}

/**
 * RunningInfoContext - React Context for simulation parameters
 * Default value is null to enforce usage within the provider
 */
const RunningInfoContext = createContext<RunningContextType | null>(null);

/**
 * RunningInfoProvider - Context provider component
 *
 * Wraps the application and provides access to simulation running information.
 * Initializes with default values (CV=0, RP=0, no mode/level, not in reentry).
 *
 * @param children - Child components that will have access to the context
 */
export const RunningInfoProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize with default simulation parameters
  const [runningInfo, setRunningInfo] = useState<RunningInfoInterface>({
    cvValue: 0,        // Conduction velocity in milliseconds
    rpValue: 0,        // Refractory period in milliseconds
    modeName: "",      // Simulation mode (e.g., "No Sympathetic Activation")
    levelName: "",     // Activity level (e.g., "Rest", "Walking", "Jogging", "Sprinting")
    inReentry: false   // Whether in reentrant arrhythmia mode
  });

  return (
    <RunningInfoContext.Provider value={{ runningInfo, setRunningInfo }}>
      {children}
    </RunningInfoContext.Provider>
  );
};

/**
 * useRunningInfo - Custom hook to access the running info context
 *
 * This hook provides easy access to the simulation parameters from any component.
 * Throws an error if used outside of RunningInfoProvider.
 *
 * @returns The context value containing runningInfo and setRunningInfo
 * @throws Error if used outside of RunningInfoProvider
 *
 * @example
 * const { runningInfo, setRunningInfo } = useRunningInfo();
 * console.log(runningInfo.cvValue); // Access current CV value
 * setRunningInfo({ ...runningInfo, cvValue: 100 }); // Update CV value
 */
export const useRunningInfo = (): RunningContextType => {
  const context = useContext(RunningInfoContext);
  if (!context) {
    throw new Error("useRunningInfo must be used within a RunningInfoProvider");
  }
  return context;
};
