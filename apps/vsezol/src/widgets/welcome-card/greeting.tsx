'use client';

import { useEffect, useState } from 'react';
import { getGreeting } from './get-greeting';

export const Greeting = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return <>{mounted ? getGreeting() : 'Hello!'}</>;
};
