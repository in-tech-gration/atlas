import { secondsToHHMMSS } from "../tools/converter/converter.plugin.js";

export function youTubeTranscript2SRT(transcript) {

  let srt = [];

  transcript.forEach((t, index, array) => {

    const text = t._;
    const startTime = Number(t.$.start).toFixed();
    const duration = Number(t.$.dur).toFixed();
    const endTime = Number(startTime) + Number(duration);
    const startTimeInHHMMSS = secondsToHHMMSS(startTime);
    let endTimeInHHMMSS = secondsToHHMMSS(endTime);
    const isNotLastElement = index < array.length - 1;
    const nextStartTime = isNotLastElement ? Number(array[index + 1].$.start).toFixed() : Infinity;
    const srtIndex = index + 1;

    // FIX TIMING
    if (isNotLastElement && (endTime > Number(nextStartTime))) {

      // console.log({ endTime, nextStartTime });
      const nextStartTimeInHHMMSS = secondsToHHMMSS(nextStartTime);
      endTimeInHHMMSS = nextStartTimeInHHMMSS;

    }

    // START TIME                         --> END TIME
    // hours:minutes:seconds,milliseconds --> hours:minutes:seconds,milliseconds
    const srtLine = `${srtIndex}\n${startTimeInHHMMSS},0 --> ${endTimeInHHMMSS},0\n${text}`
    srt.push(srtLine);


  });

  const srtText = srt.join("\n\n");
  return srtText;

}