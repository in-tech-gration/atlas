import { execSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import { which } from '../../common/utils.js';

const EXIFTOOL = "exiftool";

/**
 * @description Function to check if exiftool is installed
 * @deprecated in favour of the more generic `which()`
 */
function checkExifTool() {

  try {

    // Try to run exiftool --version
    execSync('exiftool --version', { encoding: 'utf8', timeout: 5000 });
    return true;

  } catch (error) {

    console.error('❌ exiftool is not installed or not in PATH');
    console.log('\nTo install exiftool:');
    return false;

  }
}

/**
 * 🚧 WORK IN PROGRESS
 * @description Function to scan file metadata
 * @todo Export as JSON
 */
function scanMetadata(filename) {

  try {

    console.log(`\n🔍 Scanning metadata for: ${filename}`);
    console.log('='.repeat(60));

    // Run exiftool on the file
    const result = execSync(`exiftool "${filename}"`, { encoding: 'utf8' });

    // Parse and display the results
    const lines = result.split('\n').filter(line => line.trim());

    if (lines.length === 0) {
      console.log('No metadata found or file is not supported.');
      return;
    }

    return console.log(lines.join("\n")); // Pure/raw output

    // 🚧 TODO: Export as JSON
    // Group metadata by common categories
    const categories = {
      'File Information': [],
      'Camera/Device': [],
      'Date/Time': [],
      'Location': [],
      'Technical': [],
      'Other': []
    };

    lines.forEach(line => {
      const [key, ...values] = line.split(':');
      const value = values.join(':').trim();

      if (!key || !value) return;

      // Categorize based on key patterns
      const keyLower = key.toLowerCase();
      if (keyLower.includes('file') || keyLower.includes('directory') || keyLower.includes('size')) {
        categories['File Information'].push(`${key}: ${value}`);
      } else if (keyLower.includes('camera') || keyLower.includes('lens') || keyLower.includes('make') || keyLower.includes('model')) {
        categories['Camera/Device'].push(`${key}: ${value}`);
      } else if (keyLower.includes('date') || keyLower.includes('time') || keyLower.includes('created') || keyLower.includes('modified')) {
        categories['Date/Time'].push(`${key}: ${value}`);
      } else if (keyLower.includes('gps') || keyLower.includes('latitude') || keyLower.includes('longitude') || keyLower.includes('location')) {
        categories['Location'].push(`${key}: ${value}`);
      } else if (keyLower.includes('width') || keyLower.includes('height') || keyLower.includes('resolution') || keyLower.includes('bit') || keyLower.includes('compression')) {
        categories['Technical'].push(`${key}: ${value}`);
      } else {
        categories['Other'].push(`${key}: ${value}`);
      }
    });

    // Display categorized results
    Object.entries(categories).forEach(([category, items]) => {
      if (items.length > 0) {
        console.log(`\n📁 ${category}:`);
        items.forEach(item => {
          console.log(`  ${item}`);
        });
      }
    });

    console.log('\n' + '='.repeat(60));
    console.log('✅ Metadata scan completed successfully');

  } catch (error) {

    console.error('❌ Error scanning metadata:');
    console.error(error.message);
    process.exit(1);

  }

}

export default function exifTool(options) {

  const filename = options[0];

  try {

    if (!filename) {
      console.error('Error: Please provide a file path as an argument');
      console.error('Usage: atlas -u exiftool <file-path>');
      process.exit(1);
    }

    // Check if the file exists
    if (!fs.existsSync(filename)) {
      console.error(`Error: File not found: ${filename}`);
      process.exit(1);
    }

    // Check if it's a file (not a directory)
    if (!fs.statSync(filename).isFile()) {
      console.error(`Error: Path is not a file: ${filename}`);
      process.exit(1);
    }

    // Check if exiftool is installed. If it doesn't, it will throw an exception.
    which.sync(EXIFTOOL);

    // Scan the file metadata
    scanMetadata(filename);

  } catch (error) {

    if (error instanceof which.GetNotFoundError) {

      console.log(`Command ${EXIFTOOL} could not be found on your system.`);

      if (os.platform() === 'win32') {
        console.log('Windows:');
        console.log('1. Download from: https://exiftool.org/');
        console.log('2. Extract the executable to a directory in your PATH');
        console.log('   or add the exiftool directory to your PATH environment variable');
      } else if (os.platform() === 'darwin') {
        console.log('macOS (using Homebrew):');
        console.log('brew install exiftool');
        console.log('\nOr:');
        console.log('macPorts:');
        console.log('sudo port install exiftool');
      } else {
        console.log('Linux:');
        console.log('Ubuntu/Debian:');
        console.log('sudo apt-get install exiftool');
        console.log('\nFedora:');
        console.log('sudo dnf install exiftool');
        console.log('\nArch Linux:');
        console.log('sudo pacman -S exiftool');
      }
      console.log('\nFor other systems, visit: https://exiftool.org/');

    }

    console.log({ error });

  }

}