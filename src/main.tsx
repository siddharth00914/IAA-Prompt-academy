import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

// No StrictMode (react-dev.md): canvas/GSAP effects must not run twice.
createRoot(document.getElementById('root')!).render(<App />);
