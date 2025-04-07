export default function initializeLLM({ instance, options } = {}) {

    if (!instance) {
        throw new Error("CLI instance is required");
    }

    const llmProvider = instance.config.get('llm_provider');
    const model = instance.config.get('model');

    if (!llmProvider || !model) {
        return console.log(chalk.redBright("You must select a language model in order to use the AI capabilities of atlas"));
    }

    const llmOptions = {
        provider: llmProvider,
        model
    }

    if (options && "temperature" in options) {
        llmOptions.temperature = parseFloat(options.temperature);
    }

    if (options && "contextWindow" in options && llmProvider === "provider_ollama") {
        llmOptions.numCtx = parseInt(options.contextWindow);
    }

    const { isSupported, errorMessage } = instance.initLLM(llmOptions);

    if (!isSupported) {
        return console.log(`LLM Provider currently not supported. Please run ${chalk.bold("atlas -S")} and select supported provider.`);
    }

    if (errorMessage) {
        return console.log(chalk.red(errorMessage));
    }

    return {
        llmProvider,
        model,
    }

}