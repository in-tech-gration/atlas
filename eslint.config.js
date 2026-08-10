import globals from "globals";
import pluginJs from "@eslint/js";
import { jsdoc } from 'eslint-plugin-jsdoc';

/** @type {import('eslint').Linter.Config[]} */
export default [
  jsdoc({ config: 'flat/recommended' }),
  {
    languageOptions: { globals: { ...globals.browser, ...globals.node } }
  },
  pluginJs.configs.recommended,
  {
    rules: {
      "no-unused-vars": "warn",
      "no-unused-labels": "off",
      "no-unreachable": "off",
      "jsdoc/require-jsdoc": "off"
    },
  }
];