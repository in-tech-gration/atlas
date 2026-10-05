type VideoMeta struct {
	Id              string
	Title           string
	TitleNormalized string
}

type Options struct {
	Duration                 bool
	Transcript               bool
	TranscriptWithTimestamps bool
	Comments                 bool
	Lang                     string
	Metadata                 bool
}

type VideoInfo struct {
	Transcript string         `json:"transcript"`
	Duration   int            `json:"duration"`
	Comments   []string       `json:"comments"`
	Metadata   *VideoMetadata `json:"metadata,omitempty"`
}

type VideoMetadata struct {
	Id           string   `json:"id"`
	Title        string   `json:"title"`
	Description  string   `json:"description"`
	PublishedAt  string   `json:"publishedAt"`
	ChannelId    string   `json:"channelId"`
	ChannelTitle string   `json:"channelTitle"`
	CategoryId   string   `json:"categoryId"`
	Tags         []string `json:"tags"`
	ViewCount    uint64   `json:"viewCount"`
	LikeCount    uint64   `json:"likeCount"`
}

// GRAB VIDEO TRANSCRIPTS AND COMMENTS

// GET VIDEO OR PLAYLIST ID

// Video ID pattern
videoPattern := `(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:live\/|[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|(?:s(?:horts)\/)|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]*)`

// Playlist ID pattern
playlistPattern := `[?&]list=([a-zA-Z0-9_-]+)`

// "invalid YouTube URL, can't get video or playlist ID: '%s'", url)
func GetVideoOrPlaylistId(url)

func GrabTranscriptForUrl(url string, language string) {
	"URL is a playlist, not a video"
}

func formatTimestamp(seconds float64) string {
	hours := int(seconds) / 3600
	minutes := (int(seconds) % 3600) / 60
	secs := int(seconds) % 60
	return fmt.Sprintf("%02d:%02d:%02d", hours, minutes, secs)
}

func GrabTranscriptBase(videoId string, language string) {
	if strings.Contains(scriptTag.Text(), "captionTracks") 
		regex := regexp.MustCompile(`"captionTracks":(\[.*?\])`)
	err = fmt.Errorf("transcript not found")
}

func GrabComments(videoId string) (ret []string, err error) {}

func GrabDurationForUrl(url string) {
	// ("URL is a playlist, not a video")
}

func GrabDuration(videoId string) {
	// ("error getting video details: %v", err)

	// durationStr := videoResponse.Items[0].ContentDetails.Duration
	// matches := regexp.MustCompile(`(?i)PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?`)
	// ("invalid duration string: %s", durationStr)

	// hours, _ := strconv.Atoi(matches[1])
	// minutes, _ := strconv.Atoi(matches[2])
	// seconds, _ := strconv.Atoi(matches[3])
	// ret = hours*60 + minutes + seconds/60
}

// FetchPlaylistVideos fetches all videos from a YouTube playlist.
func FetchPlaylistVideos(playlistID string) (ret []*VideoMeta, err error) {}

// SaveVideosToCSV saves the list of videos to a CSV file.
func SaveVideosToCSV(filename string, videos []*VideoMeta) (err error) {

	// Write headers
	if err = writer.Write([]string{"VideoID", "Title"}); err != nil {
		return
	}

	// Write video data
	for _, record := range videos {
		if err = writer.Write([]string{record.Id, record.Title}); err != nil {
			return
		}
	}

	return
}

// FetchAndSavePlaylist fetches all videos in a playlist and saves them to a CSV file.
func FetchAndSavePlaylist(playlistID, filename string) (err error) {
	fmt.Println("Playlist saved to", filename)
}

func FetchAndPrintPlaylist(playlistID string) (err error) {
	("error fetching playlist videos: %v", err)
	fmt.Printf("Playlist: %s\n", playlistID)
	fmt.Printf("VideoId: Title\n")
	for _, video := range videos {
		fmt.Printf("%s: %s\n", video.Id, video.Title)
	}
}

func GrabMetadata(videoId string) (metadata *VideoMetadata, err error) {

	metadata = &VideoMetadata{
		Id:           video.Id,
		Title:        video.Snippet.Title,
		Description:  video.Snippet.Description,
		PublishedAt:  video.Snippet.PublishedAt,
		ChannelId:    video.Snippet.ChannelId,
		ChannelTitle: video.Snippet.ChannelTitle,
		CategoryId:   video.Snippet.CategoryId,
		Tags:         video.Snippet.Tags,
		ViewCount:    viewCount,
		LikeCount:    likeCount,
	}

}

func GrabByFlags() (ret *VideoInfo, err error) {
	options := &Options{}
	flag.BoolVar(&options.Duration, "duration", false, "Output only the duration")
	flag.BoolVar(&options.Transcript, "transcript", false, "Output only the transcript")
	flag.BoolVar(&options.TranscriptWithTimestamps, "transcriptWithTimestamps", false, "Output only the transcript with timestamps")
	flag.BoolVar(&options.Comments, "comments", false, "Output the comments on the video")
	flag.StringVar(&options.Lang, "lang", "en", "Language for the transcript (default: English)")
	flag.BoolVar(&options.Metadata, "metadata", false, "Output video metadata")
	flag.Parse()

	if flag.NArg() == 0 {
		log.Fatal("Error: No URL provided.")
	}

	url := flag.Arg(0)
	ret, err = o.Grab(url, options)
	return
}
