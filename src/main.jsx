import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './app/App';
import '@fontsource-variable/figtree';
import '@fontsource-variable/bricolage-grotesque/wdth.css';
import './styles/custom.scss';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
