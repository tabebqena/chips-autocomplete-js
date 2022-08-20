module.exports = {
  env: {
    browser: true
  },
  extends: [
    "eslint:recommended",
    "plugin:es5/no-es2015"
  ],
  overrides: [
  ],
  parserOptions: {
    ecmaVersion: 'latest'
  },
  rules: {

    "es5/no-arrow-functions": "error"

  },
  "plugins": [
    "es5"
  ]
}
