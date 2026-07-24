import fs from "node:fs";
import { writeFile } from "fs/promises";
import { pipeline } from "node:stream";
// import url from 'node:url';
import chalk from 'chalk';
import { createWriteStream } from "node:fs";
import { promisify } from "node:util";
import zlib from "node:zlib";

const PRODVERSION = "139.0.7258.139";

const chromeExtensionDownloadURL = (extensionId) => {

  return `https://clients2.google.com/service/update2/crx?response=redirect&prodversion=${PRODVERSION}&acceptformat=crx2,crx3&x=id%3D${extensionId}%26uc`

}

/**
 * ⚠️ WORK IN PROGRESS
 */
export default async function chrome(options, globalOptions, cliInstance) {

  return console.log("Work in progress...");

  let extensionId = null;

  if ( options[0].startsWith("https://") ){

    const url = options[0];
    const { pathname } = new URL(url);
    const pathnameSplit = pathname.split("/");
    extensionId = pathnameSplit[pathnameSplit.length - 1]; 

  }

  extensionId = options[0];

  if (!extensionId) {

    throw new Error("Missing extension ID");

  }

  // console.log("chrome", extensionId);
  // Download Chrome Extension:

  console.log(`Started downloading Chrome Extension with id ${extensionId}`);
  
  const url = chromeExtensionDownloadURL(extensionId);
  const filePath = `${extensionId}.crx`;
  
  try {
  
    const response = await fetch(url);
  
    // #1 ✅
    const buffer = await response.arrayBuffer();
    await writeFile(filePath, Buffer.from(buffer));
    console.log("Download complete");
  
    // #2 ✅
    // const streamPipeline = promisify(pipeline);
    // if (!response.ok) throw new Error(`Failed: ${response.status}`);
    // /* response.body === ReadableStream */
    // await streamPipeline(response.body, createWriteStream(filePath));
    // console.log("Download complete!");
  
  } catch (error) {
  
    console.log(error);
  
  }

}