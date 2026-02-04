import React, { createContext, useContext, useState, ReactNode } from "react";
import { RunningInfoInterface } from "./GlobalVariables";
// Define the shape of the context state
interface RunningContextType {
  runningInfo: RunningInfoInterface | null;
  setRunningInfo: React.Dispatch<React.SetStateAction<RunningInfoInterface>>;
}

// Create the context with a default value (undefined to enforce usage inside provider)
const RunningInfoContext = createContext<RunningContextType | null>(null);

// Create a provider component
export const RunningInfoProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [runningInfo, setRunningInfo] = useState<RunningInfoInterface>({cvValue:0,rpValue:0,modeName:"",levelName:"",inReentry:false});

  return (
    <RunningInfoContext.Provider value={{ runningInfo, setRunningInfo }}>
      {children}
    </RunningInfoContext.Provider>
  );
};

// Create a custom hook for easy access
export const useRunningInfo = (): RunningContextType => {
  const context = useContext(RunningInfoContext);
  if (!context) {
    throw new Error("useCount must be used within a CountProvider");
  }
  return context;
};
