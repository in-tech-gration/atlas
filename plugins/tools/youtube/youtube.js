import { YoutubeLoader } from "@langchain/community/document_loaders/web/youtube";
import { Innertube } from "youtubei.js";
import chalk from "chalk";

function getYouTubeVideoIdFromURL(url) {

  const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);

  if (match && match[2].length == 11) {
    return match[2];
  } else {
    return false;
  }

}

export default async function YouTube({ options, instance }) {

  const url = options.youtube;

  try {

    // https://js.langchain.com/docs/integrations/document_loaders/web_loaders/youtube/
    const loader = YoutubeLoader.createFromUrl(url, {
      language: "en",
      addVideoInfo: false,
    });

    // Silencing stderr due to a bug in the Youtube API
    // See: https://github.com/LuanRT/YouTube.js/blob/main/docs/updating-the-parser.md
    process.stderr.write = () => { };

    const docs = await loader.load();
    // docs.metadata.source|description|title|view_count|author
    console.log(docs[0].pageContent);

  } catch (error) {

    // Try the auto-generated subtitles if all else fails:
    disabled: {
      break disabled;
      const videoId = getYouTubeVideoIdFromURL(url);
      const innertube = await Innertube.create(/* options */);
      const videoInfo = await innertube.getInfo(videoId);
      const captions = videoInfo.captions?.caption_tracks ?? [];
      if (captions.length > 0 && captions[0].kind === "asr") {
        console.log(captions[0].name); // { text: "English (auto-generated)" }
        console.log(captions[0].base_url);
      }
    }

    console.log(chalk.redBright("Error:", error.message));

  }
}