'use strict';

module.exports = {
    root: true,
    extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:@typescript-eslint/recommended-requiring-type-checking"
    ],
    env: {
        "browser": true
    },
    parser: "@typescript-eslint/parser",
    parserOptions: {
        "tsconfigRootDir": __dirname,
        "project": "tsconfig.json",
        "sourceType": "module",
    },
    plugins: [
        "@typescript-eslint",
        "@typescript-eslint/tslint",
    ],
    rules: {
        "@typescript-eslint/no-empty-function": "warn",
        "@typescript-eslint/restrict-template-expressions": "off",
        "@typescript-eslint/unbound-method": "off",
        "@typescript-eslint/no-unsafe-call": "off",
        "@typescript-eslint/no-unsafe-return": "off", // this one is giving me an error.  Need to look close into it
        "@typescript-eslint/no-inferrable-types": "off",
        "@typescript-eslint/adjacent-overload-signatures": "error",
        "@typescript-eslint/explicit-member-accessibility": [
            "error",
            {
                "accessibility": "explicit",
                "overrides": {
                    "constructors": "no-public"
                }
            }
        ],
        "@typescript-eslint/member-delimiter-style": [
            "error",
            {
                "multiline": {
                    "delimiter": "semi",
                    "requireLast": true
                },
                "singleline": {
                    "delimiter": "semi",
                    "requireLast": false
                }
            }
        ],
        "no-param-reassign": "error",
        "no-unused-expressions": "off",
        "@typescript-eslint/no-unused-expressions": "error",
        "@typescript-eslint/prefer-namespace-keyword": "error",
        "semi": "off",
        "@typescript-eslint/semi": [
            "error",
            "always"
        ],
        "@typescript-eslint/type-annotation-spacing": "error",
        "comma-dangle": ["error", "always-multiline"],
        "guard-for-in": "warn",
        "no-caller": "error",
        "no-cond-assign": "error",
        "no-console": [
            "error",
            {
                "allow": [
                    "debug",
                    "info",
                    "dirxml",
                    "warn",
                    "error",
                    "dir",
                    "time",
                    "timeEnd",
                    "timeLog",
                    "trace",
                    "assert",
                    "clear",
                    "count",
                    "countReset",
                    "group",
                    "groupCollapsed",
                    "groupEnd",
                    "table",
                    "Console",
                    "markTimeline",
                    "profile",
                    "profileEnd",
                    "timeline",
                    "timelineEnd",
                    "timeStamp",
                    "context"
                ]
            }
        ],
        "no-eval": "error",
        "no-extra-boolean-cast": "off",
        "no-extra-semi": "error", // in eslint:recommended
        "no-fallthrough": "error", // in eslint:recommended
        "no-magic-numbers": "error",
        "no-new-wrappers": "error",
        "no-redeclare": "error",
        "no-shadow": [
            "error",
            {
                "hoist": "all"
            }
        ],
        "no-undef": "off",
        "no-underscore-dangle": "off",
        "no-unused-vars": "off",
        '@typescript-eslint/no-unused-vars': ['error', {"argsIgnorePattern": "^_"}],
    }
};
