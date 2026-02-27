import { execSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';

// Function to check if exiftool is installed
function checkExifTool() {

  try {
    // Try to run exiftool --version
    const result = execSync('exiftool --version', { encoding: 'utf8', timeout: 5000 });
    console.log('='.repeat(60));
    console.log('🔧 ExifTool Metadata Scanner');
    console.log('-'.repeat(60));
    console.log('✅ exiftool is installed');
    console.log('='.repeat(60));
    return true;

  } catch (error) {

    console.error('❌ exiftool is not installed or not in PATH');
    console.log('\nTo install exiftool:');

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
    return false;
  }
}