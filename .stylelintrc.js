module.exports = {
  extends: ['stylelint-config-standard', 'stylelint-config-recess-order', 'stylelint-config-css-modules'],
  plugins: ['stylelint-order', 'stylelint-scss'],
  ignoreFiles: ['**/node_modules/**', '**/**.tsx'],
  rules: {
    'declaration-block-no-duplicate-properties': true,
    'string-quotes': 'single',
    'selector-pseudo-class-allowed-list': ['active', 'checked', 'disabled', 'focus', 'focus-within', 'hover', 'indeterminate'],
    'selector-disallowed-list': '/.*\\+.*/',
    'at-rule-no-unknown': null,
    'scss/at-rule-no-unknown': true,
  },
};
