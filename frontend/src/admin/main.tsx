import React from 'react';
import ReactDOM from 'react-dom/client';
import '../styles/app.css';
import '../styles/admin.css';
import AdminApp from './AdminApp';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AdminApp />
  </React.StrictMode>,
);
