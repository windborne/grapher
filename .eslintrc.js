module.exports = {
    "env": {
        "browser": true,
        "es6": true
    },
    "extends": [
        "eslint:recommended",
        "plugin:react/recommended"
    ],
    "settings": {
        "react": {
            "version": "detect"
        }
    },
    "globals": {
        "Atomics": "readonly",
        "SharedArrayBuffer": "readonly",
        "process": "readonly",

        // for tests to not be sad
        "require": "readonly",
        "global": "readonly",
        "expect": "readonly",
        "describe": "readonly",
        "it": "readonly"
    },
    "parser": "babel-eslint",
    "parserOptions": {
        "ecmaFeatures": {
            "jsx": true
        },
        "ecmaVersion": 2018,
        "sourceType": "module"
    },
    "plugins": [
        "react"
    ],
    "rules": {
        "linebreak-style": [
            "error",
            "unix"
        ],
        "quotes": [
            "error",
            "single"
        ],
        "semi": [
            "error",
            "always"
        ],
        "eol-last": "error",
        "no-multiple-empty-lines": [
            "error", {
                "max": 3,
                "maxEOF": 0, // note: since we have eol-last, there actually will be 1 at the end of each file
                "maxBOF": 0
            }
        ],
        "react/no-string-refs": "off",
        "no-useless-escape": "off",
        "react/no-unescaped-entities": [
            "error", {
                "forbid": [">", "}"]
            }
        ],
        "no-empty": "off",
        "comma-dangle": "error",
        "no-console": "error",

        "no-unused-vars": [
            "error", {
                "varsIgnorePattern": "^_",
                "argsIgnorePattern": "^_"
            }
        ],
        "react/no-direct-mutation-state": "error",
        "react/no-unknown-property": "error",
        "no-undef": "error",
        "no-var": "error",
        "comma-spacing": "error",
        "func-call-spacing": ["error", "never"],
        "prefer-arrow-callback": "error"
    },
    "ignorePatterns": ["src/rust"]
};
