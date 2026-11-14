import { FlatCompat } from '@eslint/eslintrc';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) });

const config = [
  { ignores: ['.next', 'node_modules', 'src/lib/api/schema.d.ts', 'public/sw.js', 'next-env.d.ts', 'playwright-report', 'test-results'] },
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-restricted-syntax': [
        'error',
        { selector: "CallExpression[callee.name='parseFloat']", message: 'Do not use parseFloat for money. Use src/lib/money.ts.' },
        { selector: "CallExpression[callee.object.name='window'][callee.property.name='alert']", message: 'Show errors inline, never window.alert.' },
        { selector: "CallExpression[callee.name='alert']", message: 'Show errors inline, never alert.' },
      ],
    },
  },
];

export default config;
