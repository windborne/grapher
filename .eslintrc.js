module.exports = {
    env: {
      browser: true,
      es6: true,
    },
    parser: '@typescript-eslint/parser',
    parserOptions: {
      ecmaFeatures: {
        jsx: true,
      },
      ecmaVersion: 2020,
      sourceType: 'module',
      project: './tsconfig.json', 
    },
    plugins: ['react', '@typescript-eslint'],
    extends: [
      'eslint:recommended',
      'plugin:react/recommended',
      'plugin:@typescript-eslint/recommended',
    ],
    settings: {
      react: {
        version: 'detect',
      },
    },
    globals: {
      Atomics: 'readonly',
      SharedArrayBuffer: 'readonly',
      process: 'readonly',
      require: 'readonly',
      global: 'readonly',
      expect: 'readonly',
      describe: 'readonly',
      it: 'readonly',
    },
    rules: {
      'linebreak-style': ['error', 'unix'],
      quotes: ['error', 'single'],
      semi: ['error', 'always'],
      'eol-last': 'error',
      'no-multiple-empty-lines': [
        'error',
        {
          max: 3,
          maxEOF: 0,
          maxBOF: 0,
        },
      ],
      'react/no-string-refs': 'off',
      'no-useless-escape': 'off',
      'react/no-unescaped-entities': [
        'error',
        {
          forbid: ['>', '}'],
        },
      ],
      'no-empty': 'off',
      'comma-dangle': 'error',
      'no-console': 'error',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          varsIgnorePattern: '^_',
          argsIgnorePattern: '^_',
        },
      ],
      'react/no-direct-mutation-state': 'error',
      'react/no-unknown-property': 'error',
      'no-undef': 'error',
      'no-var': 'error',
      'comma-spacing': 'error',
      'func-call-spacing': ['error', 'never'],
      'prefer-arrow-callback': 'error',
      '@typescript-eslint/no-explicit-any': 'off',
      'react/prop-types': 'off',
    },
    ignorePatterns: ['src/rust'],
  };
  