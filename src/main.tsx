import { createRoot } from 'react-dom/client';
import { DevConsole } from './ui/DevConsole';
import './ui/dev.css';

createRoot(document.getElementById('root')!).render(<DevConsole />);
