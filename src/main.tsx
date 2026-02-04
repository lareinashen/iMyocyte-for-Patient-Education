import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'bootstrap/dist/css/bootstrap.css'
import App from './App.tsx'

import * as Ably from 'ably';
import { AblyProvider } from 'ably/react';
import { ABLY_API_KEY } from './data/Constants.ts';
import { cellID } from './data/GlobalVariables.ts';

const client = new Ably.Realtime({ key: ABLY_API_KEY, clientId: cellID });

const container = document.getElementById('root')!;
const root = createRoot(container!);

root.render(
  <StrictMode>
    <AblyProvider client={client}>
      <App />
    </AblyProvider>
  </StrictMode>
)

//"C:\Program Files\Google\Chrome\Application\chrome.exe" --disable-web-security --user-data-dir="C:\chrome-dev"