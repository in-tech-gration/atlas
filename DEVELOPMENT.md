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

