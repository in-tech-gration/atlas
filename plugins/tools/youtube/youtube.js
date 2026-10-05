import fs from "node:fs/promises";
import xml2js from "xml2js";
import Innertube from "youtubei.js";
import { youTubeTranscript2SRT } from "../../subtitles/subtitle-utils.js";
import { select, isCancel, confirm, text } from '@clack/prompts';

// WORK IN PROGRESS

function getYouTubeVideoIdFromURL(url) {

  const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);

  if (match && match[2].length == 11) {
    return match[2];
  } else {
    return false;
  }

}

/**
 * Get captions for a given YouTube video and language (default: English).
 * Based on: https://medium.com/@aqib-2/extract-youtube-transcripts-using-innertube-api-2025-javascript-guide-dc417b762f49
 * @param {object} params _
 * @param {object} params.videoId - YouTube video ID
 * @param {object} params.language - Language code, e.g., "en", "hi"
 * @param {object} params.srt - Whether to output transcript in SRT format
 * @returns {Promise<Array<{ caption: string, startTime: number, endTime: number }>>} _
 */
async function getYoutubeTranscript({ videoId, language = "en", srt = false }) {

  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

  // Step 1
  const html = await fetch(videoUrl).then(res => res.text());
  const apiKeyMatch = html.match(/"INNERTUBE_API_KEY":"([^"]+)"/);
  if (!apiKeyMatch) throw new Error("INNERTUBE_API_KEY not found.");
  const apiKey = apiKeyMatch[1];

  // Step 2
  const playerData = await fetch(`https://www.youtube.com/youtubei/v1/player?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      context: {
        client: {
          clientName: "ANDROID",
          clientVersion: "20.10.38"
        }
      },
      videoId
    })
  })
    .then(res => res.json())
    .catch(e => console.log(e));

  // Step 3
  const tracks = playerData?.captions?.playerCaptionsTracklistRenderer?.captionTracks;

  if (!tracks) {
    throw new Error("No captions found.");
  }

  const track = tracks.find(t => t.languageCode === language);
  let baseUrl;
  let hasCustomTrack = false;

  if (!track) {

    console.log(`No captions for language '${language}'.`);

    const options = tracks.map(track => {

      const name = track.name.runs[0].text;

      return {
        value: track.languageCode,
        label: name,
        hint: track.languageCode,
      }
    })

    const action = await select({
      message: 'Please select another caption:',
      options,
    });

    if (isCancel(action)) {
      console.log('Operation cancelled');
      process.exit(0);
    }

    if (action === 'exit') return;

    const selectedTrack = tracks.find(t => {
      return t.languageCode === action;
    })

    // console.log({ action, selectedTrack });
    baseUrl = selectedTrack.baseUrl.replace(/&fmt=\w+$/, "");
    hasCustomTrack = true;

  } else {

    baseUrl = track.baseUrl.replace(/&fmt=\w+$/, "");

  }

  // Step 4
  const xml = await fetch(baseUrl).then(res => res.text());
  const json = await xml2js.parseStringPromise(xml);
  let transcript = "";

  // SRT FORMAT:
  if (srt) {

    transcript = youTubeTranscript2SRT(json.transcript.text);

  } else {

    transcript = json.transcript.text.map(t => {
      return `${t._} `;
    }).join("");

  }

  // DECODE HTML ENTITIES
  const escapeMap = {
    '&quot;': '"',
    '&amp;': '&',
    '&#x27;': '\'',
    '&lt;': '<',
    '&gt;': '>',
    '&#x60;': '`',
    "&#39;": "'",
  };

  Object.entries(escapeMap).forEach(([code, value]) => {
    transcript = transcript.replaceAll(code, value);
  });

  // Write to file (for custom language selection)
  if (hasCustomTrack) {
    const saveToFile = await confirm({
      message: "Save transcript to a file?",
    });
    if (saveToFile) {
      const name = await text({
        message: 'Enter filename for transcript file:',
        initialValue: `${videoId}.transcript.txt`,
      });
      await fs.writeFile(name, transcript);
    }
  }

  return transcript;

}

export default async function YouTube({ options, instance }) {

  /**
   * @type {string}
   */
  const youTubeURLorId = options.youtube;
  const isVerbose = options.verbose;

  if (!youTubeURLorId) {
    return console.log("Missing YouTube URL or VideoID.");
  }

  let videoId = youTubeURLorId;

  if (videoId.startsWith("http")) {
    videoId = getYouTubeVideoIdFromURL(youTubeURLorId);
  }

  try {

    const { format } = options;
    const transcript = await getYoutubeTranscript({
      videoId,
      language: "en",
      srt: Boolean(format),
    });

    console.log(transcript);

  } catch (error) {

    if (isVerbose) {
      return console.log(error);
    }

    console.log(error.message);

  }

}

