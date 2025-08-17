'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';

interface SessionWrapperProps {
  children: ReactNode;
  session?: any;
}

export default function SessionWrapper({ children, session }: SessionWrapperProps) {
  return (
    <SessionProvider 
      session={session}
      // Refetch session every 5 minutes
      refetchInterval={5 * 60}
      // Refetch session when window gains focus
      refetchOnWindowFocus={true}
      // Refetch session when the tab becomes visible
      refetchWhenOffline={false}
    >
      {children}
    </SessionProvider>
  );
}
