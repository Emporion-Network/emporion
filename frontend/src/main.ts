import { mount } from 'svelte';
import 'remixicon/fonts/remixicon.css';
import App from './App.svelte';
import './app.scss';

const app = mount(App, {
  target: document.getElementById('app') as HTMLElement,
});

export default app;
