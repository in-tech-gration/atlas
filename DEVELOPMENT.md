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
    const { verbose: isVerbose } = globalOptions;
  }
  ```

## HOW TO | UPDATE PATTERNS FROM UPSTREAM REPO

  - `git checkout upstream/main -- data/patterns/`
  - Move `data/patterns/` into `patterns/`

## HOW TO | SAVE CONTENT TO THE CLIPBOARD

  ```js
  import clipboardy from "clipboardy";

  clipboardy.writeSync(output);
  ```

## HOW TO | CREATE A SELECTION MENU USING @clack/prompts

  ```js
  import { text, select, tasks, spinner, isCancel } from "@clack/prompts";

  const action = await select({
    message: "What would you like to do?",
    options: [
      { value: "drink", label: "Drink something", hint: "Soda maybe?" },
      { value: "eat", label: "Eat something", hint: "Burger maybe?" },
    ],
  });

  if (isCancel(action)) {
    console.log("Operation cancelled");
    process.exit(0);
  }

  if (action === "exit") process.exit();

  switch (action) {
    case "drink": {
      const name = await text({
        message: "Enter item name:",
        validate: (value) => {
          if (!value) return "Name is required";
          return undefined;
        },
      });

      if (isCancel(name)) {
        console.log("Operation cancelled");
        break;
      }

      const spin = spinner();
      spin.start("Making cocktail...");

      await tasks([
        {
          title: "Async task #1",
          task: async () => {
            return "Task #1 Finished";
          },
        },
        {
          title: "Async task #2",
          task: async () => {
            return "Task #2 Finished";
          },
        },
      ]);

      spin.stop("Cocktail served!");
      break;
    }
  }
  ```

<!-- ## HOW TO | CHECK IF A CLI TOOL EXISTS -->
