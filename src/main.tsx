import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { setupPageZoomLock } from './utils/zoomLock.ts';

// Activate global page zoom lock except for the Remotion player
setupPageZoomLock();

createRoot(document.getElementById('root')!).render(<App />);
