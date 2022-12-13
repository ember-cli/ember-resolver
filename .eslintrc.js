module.exports = {
  root: true,
  parser: "babel-eslint",
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: "module",
    ecmaFeatures: {
      legacyDecorators: true,
    },
  },
  plugins: ["ember"],
  extends: ["eslint:recommended", "plugin:ember/recommended"],
  env: {
    browser: true,
  },
  rules: {
    "ember/no-jquery": "error",
  },
  overrides: [
    // node files
    {
      files: [
        ".eslintrc.js",
        ".template-lintrc.js",
        "ember-cli-build.js",
        "addon/index.js",
        "addon/blueprints/*/index.js",
        "addon/config/**/*.js",
        "test-app/config/**/*.js",
        "test-app/server/**/*.js",
        "test-app/testem.js",
      ],
      excludedFiles: [
        "addon/addon/**",
        "addon/addon-test-support/**",
        "addon/app/**",
      ],
      parserOptions: {
        sourceType: "script",
      },
      env: {
        browser: false,
        node: true,
      },
    },
    // ts files
    {
      files: ["**/*.ts"],
      parser: "@typescript-eslint/parser",
      parserOptions: { project: "addon/tsconfig.json" },
      plugins: ["@typescript-eslint"],
      extends: [
        "plugin:@typescript-eslint/eslint-recommended",
        "plugin:@typescript-eslint/recommended",
      ],
      rules: {
        "@typescript-eslint/no-unused-vars": [
          "warn",
          {
            vars: "all",
            args: "all",
            argsIgnorePattern: "^_",
            caughtErrors: "all",
          },
        ],
      },
    },
  ],
};
