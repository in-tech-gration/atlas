import { TavilySearchResults } from "@langchain/community/tools/tavily_search";

export default async function web({ options, instance }) {

    if (typeof options.web === "boolean") {
        return console.log("Missing search context. Please provide some text to search the web.")
    }

    let tavilyTool;

    try {

        tavilyTool = new TavilySearchResults({
            maxResults: 5,
        });

    } catch (error) {

        console.log(chalk.redBright("Error:", error.message));

        if (error.message.includes("No Tavily API key found")) {
            console.log(`Run ${chalk.blue("atlas -S")} to set up your API keys.`);
        }

        return;

    }

    const searchResults = await tavilyTool.invoke({
        input: options.web,
    });

    const searchResultsJSON = JSON.parse(searchResults);

    let output = `Here are some search results while searching the web for "${options.web}":`

    searchResultsJSON.forEach((result, index) => {
        output += `\n\n`;
        output += `## Search result #${index}:\n\n`;
        output += `Title: ${result.title}\n`;
        output += `URL: ${result.url}\n`;
        output += `Content: ${result.content}`;
    });

    console.log(output);

}