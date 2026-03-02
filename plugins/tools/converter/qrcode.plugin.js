import { Jimp } from "jimp";
import QrCode from "qrcode-reader";
import fs from "node:fs";

export default async function qrCodeScanner() {
  
  if (process.argv.length < 5) {
    console.log("Missing filename.");
    process.exit();
  }
  const filename = process.argv[4];
  const buffer = await fs.promises.readFile(filename);
  const image = await Jimp.read(buffer);
  
  const qr = new QrCode();
  qr.callback = (error, value) => {
    if (error) {
      console.log( "ERROR::QRCode: " + error );
      return console.log("¯\\(ツ)/¯ ");
    };
    console.log("QR decoded:", value.result);
  };
  
  qr.decode(image.bitmap);
  
}
// Alternatives:
// npm install jsqr (Fast, low-level, pure-JS that requires raw image data -pixel buffer)

// npm install @zxing/library
/*
import { BarcodeFormat, BrowserQRCodeReader } from "@zxing/library";
const reader = new BrowserQRCodeReader();
const result = await reader.decodeFromImage(undefined, "qr.png");
console.log(result.text);

*/
// If the QR image is blown out, rotated, or printed like ancient hieroglyphs, ZXing variants usually outperform the simpler ones.

// npm install qr-scanner (Works in Node with Canvas shim)