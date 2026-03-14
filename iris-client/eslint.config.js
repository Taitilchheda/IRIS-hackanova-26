module.exports = {
  extends: ['next/core-web-vitals'],
  rules: {
    // Disable TypeScript errors for missing dependencies in test files
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    // Allow console logs in development
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
  },
  env: {
    jest: true,
  },
}
