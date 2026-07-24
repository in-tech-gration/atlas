import fs from "fs";

/**
 * The SNSS format is used by Chromium and derivatives (Google Chrome, Opera, Vivaldi, etc.) to store browsing sessions. The information is stored in the files "Current Tabs", "Current Session", "Last Tabs" and "Last Session".
 * 
 * ⚠️ WORK IN PROGRESS
 */
export default function snssParser() {

  return console.log("Work in progress...");

  class PickleReader {

    constructor(buffer) {
      this.buffer = buffer;
      this.offset = 0;
    }

    align() {
      const padding = (4 - (this.offset % 4)) % 4;
      this.offset += padding;
    }

    readInt32() {
      this.align();
      if (this.offset + 4 > this.buffer.length) return 0;
      const val = this.buffer.readInt32LE(this.offset);
      this.offset += 4;
      return val;
    }

    readString8() {
      const len = this.readInt32();
      if (len <= 0 || len > 10000) return "";
      const str = this.buffer.toString('utf8', this.offset, this.offset + len);
      this.offset += len;
      this.align();
      return str.replace(/\0+$/, '');
    }

    readString16() {
      const charCount = this.readInt32();
      const byteLen = charCount * 2;
      if (charCount <= 0 || byteLen > 10000) return "";
      const str = this.buffer.toString('utf16le', this.offset, this.offset + byteLen);
      this.offset += byteLen;
      this.align();
      return str.replace(/\0+$/, '');
    }
  }

  // --- DEBUG UTILITY ---
  function dumpRawCommand(type, size, payload) {
    console.log(`\n[DEBUG] Command Type: ${type} | Size: ${size}`);
    // Create a hex dump: 16 bytes per line
    const hex = payload.toString('hex').match(/.{1,32}/g) || [];
    const ascii = payload.toString('ascii').replace(/[^\x20-\x7E]/g, '.').match(/.{1,16}/g) || [];

    hex.forEach((line, i) => {
      console.log(`  ${line.padEnd(32)} | ${ascii[i] || ''}`);
    });
  }

  function parseSNSS(filePath) {
    const data = fs.readFileSync(filePath);
    if (data.slice(0, 4).toString() !== 'SNSS') throw new Error("Invalid SNSS header");

    let pos = 8;
    const navigations = [];
    const tabToGroup = {};   // Maps tabId -> groupId
    const groupMetadata = {}; // Maps groupId -> groupTitle

    while (pos + 3 < data.length) {
      const size = data.readUInt16LE(pos);
      const type = data[pos + 2];
      const payload = data.slice(pos + 3, pos + 2 + size);

      // dumpRawCommand(type, size, payload);

      const reader = new PickleReader(payload);
      reader.readInt32(); // Skip internal pickle size

      if (type === 1 || type === 6) {
        // Navigation Update
        const tabId = reader.readInt32();
        reader.readInt32(); // index
        const url = reader.readString8();
        const pageTitle = reader.readString16();
        if (url.startsWith('http')) {
          navigations.push({ tabId, url, pageTitle });
        }
      } else if (type === 17) {
        // kCommandSetTabGroup (Maps Tab to a Group)
        const tabId = reader.readInt32();
        // In the pickle, the high/low bits of the Token represent the Group ID
        const groupIdLow = reader.readInt32();
        const groupIdHigh = reader.readInt32();
        const groupId = `${groupIdHigh}-${groupIdLow}`;
        tabToGroup[tabId] = groupId;
      } else if (type === 18) {
        // kCommandSetTabGroupMetadata (Defines Group Title)
        const groupIdLow = reader.readInt32();
        const groupIdHigh = reader.readInt32();
        const groupId = `${groupIdHigh}-${groupIdLow}`;
        const groupTitle = reader.readString16(); // This is the "Tab Group" text
        groupMetadata[groupId] = groupTitle;
      }

      pos += (2 + size);
    }

    // Merge the data
    return navigations.map(nav => {
      const groupId = tabToGroup[nav.tabId];
      return {
        tabId: nav.tabId,
        url: nav.url,
        pageTitle: nav.pageTitle,
        tabGroupTitle: groupId ? (groupMetadata[groupId] || "Unnamed Group") : "No Group"
      };
    });
  }

  // CLI Execution
  const inputFile = process.argv[4];
  if (!inputFile) {
    console.log("Usage: node script.js <session_file>");
    process.exit(1);
  }

  try {
    const results = parseSNSS(inputFile);
    // console.log({ results });
    fs.writeFileSync(inputFile + ".json", JSON.stringify(results, null, 2));
    console.log(`Extracted ${results.length} items with group metadata.`);
  } catch (e) {
    console.error("Error:", e.message);
  }

}

