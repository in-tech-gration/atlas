import { exec } from "node:child_process";
import chalk from "chalk";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

export default function runPlay({ options, stdin }) {

    let stringJSON = stdin; // data has the following TS schema: { artist: null | string, words: null | string[]}

    if (typeof options.play !== "boolean") {
        stringJSON = options.play;
    }

    let data = null;

    try {
        data = JSON.parse(stringJSON);
        console.log(`Searching for artist: ${chalk.cyan(data.artist)}, keywords: ${chalk.cyan(data.words)}`);
        
    } catch (error) {
        console.log(chalk.redBright("Error parsing JSON string. Please provide a valid JSON string."));
        if (options.verbose) {
            console.log(error);
        }
        return;
    }

    if (options.verbose) {
        console.log(chalk.gray("[VERBOSE OUTPUT ENABLED][ LLM JSON RESPONSE ]"));
        console.log({ data });
    }

    const musicDirectory = path.join(os.homedir(), "Music");
    const mpg123 = path.join("/opt/homebrew/bin/mpg123");
    // Create regex based on `data`:

    let regexData = "";
    let artist = null;
    if (data.artist) {
        artist = data.artist.toLowerCase();
        regexData += artist.split(" ").map(word => `(?=.*${word})`).join('');
    }
    let words = null;
    if (data.words) {
        words = data.words.map(word => word.toLowerCase());
        regexData += words.map(word => `(?=.*${word})`).join('');
    }

    const regex = new RegExp(regexData, 'i');

    async function findFilesRecursively(directory) {
        let results = [];
        const files = await fs.readdir(directory, { withFileTypes: true });

        for (const file of files) {

            const filePath = path.join(directory, file.name);

            if (file.isDirectory()) {
                results = results.concat(await findFilesRecursively(filePath));
                continue;
            }
            const textMatch = regex.test(file.name);
            const isMp3 = file.name.endsWith('.mp3');
            if (textMatch && isMp3) {
                results.push(filePath);
            }

        }

        return results;
    }

    findFilesRecursively(musicDirectory)
    .then((files) => {
        console.log(chalk.green(`Found ${files.length} matching files in ${musicDirectory}`));
        if (files.length > 0) {

            console.log(`Playing: "${files[0]}"`);

            if (options.verbose) {
                console.log(`Playing: ${mpg123} "${files[0]}". Press 'q' to quit and stop the music.`);
            }
            exec(`${mpg123} --control "${files[0]}"`);

        } else {
            console.log("No matching files found.");
        }
    })
    .catch((error) => {
        console.error("Error reading music directory:", error);
    });

} 
