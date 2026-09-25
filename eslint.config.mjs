import nextPluginConfig from "eslint-config-next";

/**
 * ESLint flat config.
 * eslint-config-next v16 exports ready-to-use flat configs,
 * so we just spread them and add our ignore list.
 *
 * @type {import("eslint").Linter.Config[]}
 */
const eslintConfig = [
  ...nextPluginConfig,
  {
    ignores: [".next/**", "out/**", "node_modules/**"],
  },
];

export default eslintConfig;
