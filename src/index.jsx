import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import Present from './components/Present';
import './styles.css';

const root = ReactDOM.createRoot(document.getElementById('root'));

const presentId = new URLSearchParams(window.location.search).get('present');

root.render(presentId ? <Present id={presentId} /> : <App />);
