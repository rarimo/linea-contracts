/** @type {import("prettier").Config} */
module.exports = {
  plugins: ["prettier-plugin-solidity"],
  overrides: [
    {
      files: "*.sol",
      options: {
        parser: "solidity-parse",
        bracketSpacing: true,
        printWidth: 120,
        singleQuote: false,
        tabWidth: 2,
        useTabs: false,
      },
    },
    {
      files: "*.ts",
      options: {
        printWidth: 120,
        tabWidth: 2
      }
    }
  ],
};
