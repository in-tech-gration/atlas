import querystring from "node:querystring";
import readline from 'node:readline';

/**
 * ⚠️ WORK IN PROGRESS
 * @description: Uses: Serp API (https://www.npmjs.com/package/serpapi)
 */
export default async function search(options, globalOptions, cliInstance) {

  const API_KEY = cliInstance.config.get('serp_api_key');

  if (!API_KEY) {

    console.log("ERROR: Missing SERP API Key");

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(`Please enter your SERP API KEY: `, key => {
      cliInstance.config.set("serp_api_key", key);
      console.log(`Key stored: ${key}. Please run the search command again.`);
      rl.close();
    });

    return;
  }

  if (options.length === 0) {
    return console.log("Missing search term");
  };

  const searchTerm = options.join(" ");

  try {

    const engine = "google";
    const version = "2.2.1";
    const location = "Austin, Texas";
    const source = `nodejs@${process.version.replace("v", "")},serpapi@${version}`
    const query = querystring.stringify({
      engine,
      api_key: API_KEY,
      q: searchTerm,
      location,
      output: "json",
      source,
    });
    const response = await fetch(`https://serpapi.com/search?${query}`);
    const json = await response.json();

    if (json.error) {
      throw new Error(json.error);
    }

    const organicResults = json["organic_results"];
    const sources = new Set();

    for (const result of organicResults) {

      console.log();
      console.log(`(${result.source}) ${result.title}`);
      console.log(result.snippet);
      console.log(result.link);
      sources.add(result.source);

    }

    // console.log([...sources]);

  } catch (error) {

    console.log(error);

  }

}