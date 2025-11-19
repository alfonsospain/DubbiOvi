'use client';

import React, { ReactNode } from 'react';
import { initializeFirebase, FirebaseProvider } from '.';

// This is a client-side only provider that ensures Firebase is initialized once.
export const FirebaseClientProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const firebase = initializeFirebase();

  return <FirebaseProvider value={firebase}>{children}</FirebaseProvider>;
};
