import { createRoot } from 'react-dom/client';
import { DevConsole } from './ui/DevConsole';
import { Game } from './ui/Game';
import './ui/dev.css';

const dev = new URLSearchParams(location.search).has('dev');
if (dev) document.body.classList.add('dev');
createRoot(document.getElementById('root')!).render(dev ? <DevConsole /> : <Game />);
