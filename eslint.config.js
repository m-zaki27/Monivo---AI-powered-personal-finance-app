// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    // Edge Functions run on Deno (`npm:` imports), which this config can't resolve.
    ignores: ['dist/*', 'supabase/functions/*'],
  },
  {
    rules: {
      // An HTML rule: in React Native, "don't" inside <Text> is just text.
      'react/no-unescaped-entities': 'off',
    },
  },
]);
