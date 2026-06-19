module.exports = {
    env: {
      browser: true,
      es6: true,
    },
    parser: 'babel-eslint',
    parserOptions: {
      ecmaFeatures: {
        jsx: true,
      },
      ecmaVersion: 2020,
      sourceType: 'module',
    },
    plugins: ['react'],
    extends: [
      'eslint:recommended',
      'plugin:react/recommended',
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
      quotes: 'off',
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
      'no-console': 'off',
      'no-unused-vars': [
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
      'react/prop-types': 'off',
    },
    ignorePatterns: ['src/rust'],
  };
