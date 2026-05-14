"use client";

import { useEffect, useState } from 'react';

export function AppBootOverlay() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(false), 900);
    return () => window.clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className="eterx-app-loader" aria-label="Loading EterX">
      <div className="eterx-app-loader-logo-shell">
        <img src="/logo.png" alt="EterX" className="eterx-app-loader-logo" />
      </div>
    </div>
  );
}
