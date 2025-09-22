import { ReactNode } from 'react';
import { Providers } from '../providers';

export default function StandaloneLayout({ children }: { children: ReactNode }) {
  return (
    <Providers>
      {children}
    </Providers>
  );
}