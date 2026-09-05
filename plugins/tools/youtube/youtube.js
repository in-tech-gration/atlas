import xml2js from "xml2js";

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
 * @param {string} videoId - YouTube video ID
 * @param {string} language - Language code, e.g., "en", "hi"
 * @returns {Promise<Array<{ caption: string, startTime: number, endTime: number }>>} _
 */
async function getYoutubeTranscript(videoId, language = "en") {

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
  if (!tracks) throw new Error("No captions found.");
  const track = tracks.find(t => t.languageCode === language);
  if (!track) throw new Error(`No captions for language: ${language}`);

  const baseUrl = track.baseUrl.replace(/&fmt=\w+$/, "");

  // Step 4
  const xml = await fetch(baseUrl).then(res => res.text());
  const json = await xml2js.parseStringPromise(xml);
  const transcript = json.transcript.text.map(t => {
    return `${t._} `;
  }).join("").replaceAll("&#39;", "'");

  return transcript;

}

export default async function YouTube({ options, instance }) {

  /**
   * @type {string}
   */
  const youTubeURLorId = options.youtube;

  if (!youTubeURLorId) {
    return console.log("Missing YouTube URL or VideoID.");
  }

  let videoId = youTubeURLorId;

  if (videoId.startsWith("http")) {
    videoId = getYouTubeVideoIdFromURL(youTubeURLorId);
  }

  try {

    const transcript = await getYoutubeTranscript(videoId);
    console.log(transcript);

  } catch (error) {
    
    console.log(error);

  }

}

