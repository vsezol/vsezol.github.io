import './styles/app.css';

import { Suspense, lazy, useEffect, useState } from 'react';
import ChatApp from './components/ChatApp';

const AdminApp = lazy(() => import('./admin/AdminApp'));

export default function App() {
  const [hash, setHash] = useState(window.location.hash);

  useEffect(() => {
    const onHash = () => setHash(window.location.hash);
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  if (hash === '#admin') {
    return (
      <Suspense fallback={<div className="adm-loading-page">Loading…</div>}>
        <AdminApp />
      </Suspense>
    );
  }

  return <ChatApp />;
}
