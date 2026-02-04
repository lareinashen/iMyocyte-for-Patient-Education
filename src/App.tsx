import Steps from "./Pages/Steps";

import { CHANNEL_NAME } from "./data/Constants";
import { ChannelProvider } from "ably/react";
import { RunningInfoProvider } from "./data/CountContext";

function App() {
  
  return <div id="app">
    <RunningInfoProvider>
    <ChannelProvider channelName={CHANNEL_NAME} ><Steps />
  </ChannelProvider></RunningInfoProvider></div>;
}

export default App
