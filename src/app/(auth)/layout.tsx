'use client';

import { ReactNode } from 'react';
import Image from 'next/image';
import { Providers } from '../providers';

/**
 * Minimal layout for authentication pages.
 * Does not include navigation, project selector, or other authenticated UI elements.
 */
function AuthLayoutContent({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo and title */}
        <div className="flex flex-col items-center mb-8">
          <Image
            src="/logo.png"
            alt="LacyLights"
            width={80}
            height={80}
            className="mb-4"
            priority
          />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            LacyLights
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Theatrical Lighting Control
          </p>
        </div>
        {/* Content (login form, etc.) */}
        {children}
      </div>
    </div>
  );
}

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <Providers>
      <AuthLayoutContent>{children}</AuthLayoutContent>
    </Providers>
  );
}
