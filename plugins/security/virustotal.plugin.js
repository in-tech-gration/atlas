import chalk from 'chalk';
import fs from 'node:fs';
import { getFileHash } from "../../common/utils.js";

const API_KEY = "API_KEY";

/**
 * @description Scan file(s) with VirusTotal API
 * @param path file or files
 */
export default async function virusTotal(options) {

  // const __dirname = import.meta.dirname;
  const filePath = options[0];

  try {

    console.log(chalk.gray(`Scanning file: ${filePath} with VirusTotal API...`));

    // Check if the file or directory exists
    if (!fs.existsSync(filePath)) {
      console.error(chalk.red(`Error: File or directory not found: ${filePath}`));
      process.exit(1);
    }

    const fileHash = await getFileHash(filePath);

    const response = await fetch(`https://www.virustotal.com/api/v3/files/${fileHash}`, {
      headers: {
        'x-apikey': API_KEY
      }
    });
    const report = await response.json();

    // report.error => { code: 'NotFoundError', message: `File "<HASH>" not found` };
    if (report.error && report.error.code === "NotFoundError") {

      console.error(chalk.red(`Error: ${report.error.message}`));
      // console.log(`File not found in VirusTotal. You can upload it for analysis at: https://www.virustotal.com/gui/home/upload`);
      console.log(`File not found in VirusTotal. Uploading for check...`);

      // Check if it's a file or directory
      // const isDirectory = fs.statSync(path).isDirectory();    
      // if (isDirectory) {
      //   console.error(chalk.red(`Error: Path is a directory. Please provide a file path: ${path}`));
      //   process.exit(1);
      // }

      // Check if the file is larger than 32MB
      const fileSizeInBytes = fs.statSync(filePath).size;
      const maxFileSizeInBytes = 32 * 1024 * 1024; // 32MB
      if (fileSizeInBytes > maxFileSizeInBytes) {
        console.error(chalk.red(`Error: File size exceeds 32MB limit: ${filePath}`));
        process.exit(1);
      }

      const fileBuffer = fs.readFileSync(filePath);
      const form = new FormData();
      form.append("file", new Blob([fileBuffer]), filePath);

      // https://docs.virustotal.com/reference/files-scan
      const uploadResponse = await fetch('https://www.virustotal.com/api/v3/files', {
        method: 'POST',
        headers: {
          'x-apikey': API_KEY
        },
        body: form,

      });

      if (!uploadResponse.ok) {
        console.log(uploadResponse);
        console.error(chalk.red(`Error uploading file to VirusTotal: ${uploadResponse.statusText}`));
        process.exit(1);
      }

      const uploadResult = await uploadResponse.json();
      const analysisId = uploadResult.data.id;
      // console.log(uploadResult);
      // {
      //   data: {
      //     type: 'analysis',
      //     id: '<ID>',
      //     links: {
      //       self: 'https://www.virustotal.com/api/v3/analyses/ID'
      //     }
      //   }
      // }

      console.log(chalk.gray(`File uploaded successfully. Analysis ID: ${analysisId}`));
      // console.log(chalk.gray(`You can view the analysis results at: https://www.virustotal.com/gui/file/${analysisId}/detection`));

      const response = await fetch(uploadResult.data.links.self, {
        headers: {
          'x-apikey': API_KEY,
        }
      });
      const finalReport = await response.json();
      
      // "completed" | "queued"
      console.log(`Status: ${finalReport.data.attributes.status}`) 
      
      // {
      //   data: {
      //     id: '<ID>',
      //       type: 'analysis',
      //         links: {
      //       self: 'https://www.virustotal.com/api/v3/analyses/<ID>',
      //         item: 'https://www.virustotal.com/api/v3/files/<HASH>'
      //     },
      //     attributes: {
      //       date: 1774111544,
      //         status: 'completed',
      //           results: [Object],
      //             stats: [Object]
      //     }
      //   },
      //   meta: {
      //     file_info: {
      //       sha256: '<HASH>',
      //         md5: '<MD5>',
      //           sha1: '<SHA1>',
      //             size: 8521
      //     }
      //   }
      // }
      // console.log(finalReport);
      if ( finalReport.data.attributes.status === "queued" ){
        return console.log("Ongoing analysis. Report is queued. Please try in a moment.");
      }
      // console.log(finalReport);

      const analysisResponse = await fetch(finalReport.data.links.item, {
        headers: {
          'x-apikey': API_KEY,
        }
      });
      const analysisReport = await analysisResponse.json();
      displayReportResults(analysisReport);

    } else {

      console.log(chalk.blue(`File found in VirusTotal.`));
      console.log(chalk.blue(`Analysis results: https://www.virustotal.com/gui/file/${report.data.id}/detection`));
      console.log("\nTotal Votes:");
      displayReportResults(report);

    }

  } catch (error) {

    // console.log(error);
    console.error(chalk.red(`Error scanning file with VirusTotal: ${error.message}`));
    process.exit(1);

  }

}

function displayReportResults(report) {

  const { attributes } = report.data;

  Object.entries(attributes.total_votes).forEach(([engine, result]) => {
    const color = result === 0 ? chalk.green : chalk.red;
    console.log(color(`${engine}: ${result === 0 ? result : result}`));
  });
  console.log(`Meaningful Name: ${attributes.meaningful_name}`);
  console.table(attributes.names);
  
  console.log("\nLast Analysis Stats:");
  console.table(attributes.last_analysis_stats);

}