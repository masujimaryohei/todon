import expo from '@tooling-configs/eslint-config/expo';

/** @type {import('eslint').Linter.Config[]} */
export default [
  ...expo,
  {
    ignores: ['node_modules/**', '.expo/**', 'dist/**', 'metro.config.js'],
  },
];
