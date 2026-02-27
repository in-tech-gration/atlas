// https://github.com/speakeasyjs/speakeasy
import chalk from 'chalk';
import clipboardy from 'clipboardy';
// Speakeasy is a one-time passcode generator, ideal for use in two-factor authentication, that supports Google Authenticator and other two-factor devices.
import speakeasy from "speakeasy";
import protobuf from "protobufjs";
import base32 from "hi-base32";

// How to extract secret key from Exported Authenticator code (QRCode):
// console.log(await extractGoogleAuthenticatorSecret("otpauth-migration://offline?data=...%3D"));

// NodeApp:
const amazonSecretKey = "";
const githubSecretKey = "";
const googleSecretKey = "";
const protonSecretKey = "";

const providersSecrets = {
  amazon: amazonSecretKey,
  github: githubSecretKey,
  google: googleSecretKey,
  proton: protonSecretKey,
}

// GitHub: Extraction of Secret from Exported data:
async function extractGoogleAuthenticatorSecret(migrationUrl) {

  // extract base64 payload
  const data = new URL(migrationUrl).searchParams.get("data");
  const buffer = Buffer.from(data, "base64");

  // load proto (https://jimmy0w0.me/posts/google-authenticator-a-deep-dive-into-exported-data-en/)
  // https://github.com/qistoph/otp_export/blob/master/OtpMigration.proto
  const root = await protobuf.load("google-auth.proto");
  const MigrationPayload = root.lookupType("MigrationPayload");

  // decode payload
  const payload = MigrationPayload.decode(buffer);

  const otpData = {}

  // loop accounts
  for (const otp of payload.otpParameters) {
    const secretBase32 = base32.encode(otp.secret).replace(/=+$/, "");

    otpData.issuer = otp.issuer;
    otpData.account = otp.name;
    otpData.secret = secretBase32;

    // generate TOTP (same as Google Authenticator)
    const token = speakeasy.totp({
      secret: secretBase32,
      encoding: "base32"
    });

    otpData.currentToken = token;
    // console.log("Current TOTP:", token);
  }

  return otpData;

}

export default function authy(options) {

  const providers = [];
  const defaultProviders = Object.keys(providersSecrets);

  if (options.length > 0) {

    const provider = options[0].toLowerCase();
    if ( defaultProviders.includes(provider) ){
      providers.push(provider);
    }

  } else {
    providers.push(...defaultProviders);
  }

  const table = {}

  for (const provider of providers) {

    table[provider] = speakeasy.totp({
      secret: providersSecrets[provider],
      encoding: "base32"
    });

    if (providers.length === 1) {
      clipboardy.writeSync(table[provider]);
      console.log(chalk.gray("Secret copied to clipboard."));
    }

  }

  console.table(table);

}