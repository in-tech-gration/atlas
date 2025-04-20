import { YoutubeLoader } from "@langchain/community/document_loaders/web/youtube";
import { Innertube } from "youtubei.js";

export default async function YouTube({ options, instance }) {

    const url = options.youtube
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
}