import fs from "node:fs/promises";

export async function listSubfolders(folderPath) {
  try {
    
    const entries = await fs.readdir(folderPath, { withFileTypes: true });
    const subfolders = entries
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name);

    console.log(subfolders.join("\n"));
    

  } catch (err) {
    console.error("Error reading folder:", err);
  }
}
