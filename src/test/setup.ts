import '@testing-library/jest-dom';
import React from 'react';
import { vi } from 'vitest';

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
    [k: string]: unknown;
  }) => React.createElement('a', { href, ...rest }, children),
}));
