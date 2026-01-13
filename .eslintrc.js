module.exports = {
  root: true,
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
  },
  env: {
    es6: true,
    node: true,
  },
  rules: {
    'no-console': 'warn',
    'no-debugger': 'error',
  },
  overrides: [
    {
      files: ['**/*.ts', '**/*.tsx'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        ecmaVersion: 2021,
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
      plugins: ['@typescript-eslint', 'react', 'react-native'],
      extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:react/recommended',
        'plugin:react-hooks/recommended',
        'plugin:react-native/all',
      ],
      settings: {
        react: {
          version: 'detect',
        },
      },
      env: {
        'react-native/react-native': true,
      },
      rules: {
        'no-console': 'warn',
        'no-debugger': 'error',
        '@typescript-eslint/no-explicit-any': 'warn',
        '@typescript-eslint/no-empty-function': ['warn', { allow: ['arrowFunctions', 'methods'] }],
        'react/prop-types': 'off',
        'react/react-in-jsx-scope': 'off',
      },
    },
    {
      files: ['**/*.js', '**/*.jsx'],
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      plugins: ['react', 'react-native'],
      extends: ['plugin:react/recommended', 'plugin:react-native/all'],
      env: {
        'react-native/react-native': true,
      },
      overrides: [
        {
          files: ['jest.setup.js', '**/*.test.js', '**/*.test.ts', '**/*.test.tsx'],
          env: {
            jest: true,
          },
        },
      ],
      settings: {
        react: {
          version: 'detect',
        },
      },
      rules: {
        'no-console': 'warn',
        'no-debugger': 'error',
        'react/prop-types': 'off',
        'react/react-in-jsx-scope': 'off',
      },
    },
  ],
};
