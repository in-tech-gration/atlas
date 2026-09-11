# DEVELOPMENT

## HOW TO | STORE DATA (API KEYS, etc.)

  ```js
  export default async function somePluginFunction(
    options,
    globalOptions,
    cliInstance,
  ) {
    // GET:
    const API_KEY = cliInstance.config.get("SOME_API_KEY");

    // SET:
    cliInstance.config.set("SOME_API_KEY", "<API_KEY_VALUE>");
  }
  ```

## HOW TO | CREATE A PLUGIN

  - Create a file inside the `plugins/` folder. Make sure it has the `.plugin.js` extension and the following structure:

  ```js
  export default async function pluginName(options, globalOptions, cliInstance) {
  }
  ```

## HOW TO | UPDATE PATTERNS FROM UPSTREAM REPO

  - `git checkout upstream/main -- data/patterns/`
  - Move `data/patterns/` into `patterns/`

## HOW TO | CHECK IF A CLI TOOL EXISTS
