import fs from "fs";
import path from "path";
import https from "https";

const IMAGES = {
  crocker: "https://static.wikia.nocookie.net/fairlyoddparents/images/8/8c/Denzel_Crocker.png/revision/latest",
  dexter: "https://static.wikia.nocookie.net/dexterslab/images/0/07/Dexter.png/revision/latest",
  crocker_dress: "https://static.wikia.nocookie.net/fairlyoddparents/images/2/2f/Crocker_dressed_as_a_woman.png/revision/latest",
  cosmo_wanda: "https://static.wikia.nocookie.net/fairlyoddparents/images/9/96/Cosmo_and_Wanda.png/revision/latest",
  billy: "https://static.wikia.nocookie.net/grimadventures/images/2/2c/Billy.png/revision/latest",
  mandy: "https://static.wikia.nocookie.net/grimadventures/images/1/1a/Mandy.png/revision/latest",
  grim: "https://static.wikia.nocookie.net/grimadventures/images/3/30/Grim.png/revision/latest"
};

const targetDir = path.join(".", "public", "images", "characters");

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
  console.log(`Created directory: ${targetDir}`);
}

function downloadFile(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const options = {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    };
    https.get(url, options, (response) => {
      if (response.statusCode && response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        // Handle redirect
        downloadFile(response.headers.location, dest).then(resolve).catch(reject);
        return;
      }
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to get '${url}' (${response.statusCode})`));
        return;
      }
      response.pipe(file);
      file.on("finish", () => {
        file.close();
        resolve();
      });
    }).on("error", (err) => {
      fs.unlinkSync(dest);
      reject(err);
    });
  });
}

async function run() {
  console.log("Starting secure downloads of characters...");
  for (const [key, url] of Object.entries(IMAGES)) {
    const dest = path.join(targetDir, `${key}.png`);
    console.log(`Downloading ${key} to ${dest}...`);
    try {
      await downloadFile(url, dest);
      console.log(`Successfully downloaded ${key}.png`);
    } catch (err: any) {
      console.error(`Error downloading ${key}:`, err.message);
    }
  }
  console.log("Batch download complete.");
}

run();
