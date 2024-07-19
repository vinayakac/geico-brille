import $ from "jquery";
import './gdk/css/geico-design-kit.css';
import './gdk/js/geico-design-kit.bundle.js';
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter as Router } from "react-router-dom";


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  // removed strictmode so that the page does not load 2 times every time, as this throws the GDK components into disarray
  // <React.StrictMode> 
  <>
  <Router>
    <App />
    <script type='text/javascript' src='./custom.js'></script>
  </Router>
  </>
  // </React.StrictMode>

);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
