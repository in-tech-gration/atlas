import { fixErrorEndtime } from "../fix-srt.plugin.js";
import { describe, expect, test } from '@jest/globals';
import { parse, CaptionTimeSpanValidator } from "../verify-srt.plugin.js";

const problematicSrt = `1
00:00:03,880 --> 00:00:10,340
[Music]

2
00:00:27,520 --> 00:00:33,960
[Music]

3
00:00:30,640 --> 00:00:36,360
and I think I’ll put it this way:

4
00:00:33,960 --> 00:00:38,879
it could well be that in a

5
00:00:36,360 --> 00:00:41,600
reasonable world, we’d still

6
00:00:38,879 --> 00:00:43,559
have huge computer centers with big

7
00:00:41,600 --> 00:00:45,039
computers sitting there and so on, and

8
00:00:43,559 --> 00:00:48,039
maybe they’d also be slower

9
00:00:45,039 --> 00:00:48,039
than they are today

10
00:00:52,199 --> 00:01:00,920
and if you use that at the beginning`;

const expectedFixedSrt = `1
00:00:03,880 --> 00:00:10,340
[Music]

2
00:00:27,520 --> 00:00:30,640
[Music]

3
00:00:30,640 --> 00:00:33,960
and I think I’ll put it this way:

4
00:00:33,960 --> 00:00:36,360
it could well be that in a

5
00:00:36,360 --> 00:00:38,879
reasonable world, we’d still

6
00:00:38,879 --> 00:00:41,600
have huge computer centers with big

7
00:00:41,600 --> 00:00:43,559
computers sitting there and so on, and

8
00:00:43,559 --> 00:00:45,039
maybe they’d also be slower

9
00:00:45,039 --> 00:00:48,039
than they are today

10
00:00:52,199 --> 00:01:00,920
and if you use that at the beginning`;

describe('Fix SRT', () => {

  test('based on caption time span inconsistencies (YouTube Automatic Transcription)', () => {

    /*
    If the end time of the previous subtitle is less than the start time
    of the next subtitle, the start time of the next subtitle is set as
    the end time of the previous subtitle.
    */
    const parsedSrt = parse(problematicSrt);
    const ctsValidator = new CaptionTimeSpanValidator(parsedSrt);
    const ctsValidationReport = ctsValidator.validate();    
    const fixedSrt = fixErrorEndtime(parsedSrt, ctsValidationReport);
    expect(fixedSrt).toEqual(expectedFixedSrt);

  });

});