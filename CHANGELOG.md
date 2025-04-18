# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.58] - 19/04/2025

### Changed

- Moved `srt2json` to the plugins

## [0.1.57] - 18/04/2025

### Added

- Option to display the contents of a pattern using `-l [PATTERN_NAME]`
- Mac utility to mount/unmount one or more drives: `--mount`

## [0.1.56] - 08/04/2025

### Added

- Ability to play your favorite music using `mpg123` (beta).
- Add support for GEMINI AI API.
- Add Speech Synthesis via the ElevenLabs API and the `--voice` option (beta).
- Add option `--describe` for image recognition (must use model that supports image modality).
- Add support for `Frontmatter` parsing.
- Add `--srt2json` option for converting SRT files into JSON files via `srt-parser-2`.
- Add the ability to set provider and model via the `--model` option while running a `--pattern`.
- Add support for lambda functions via the `--lambdas` option.

## [0.1.55] - 25/03/2025

### Added

- Show warning when text input is larger that the current context window (Ollama)
- Add primary (`patterns-atlas/`) and secondary (`patterns/`) pattern directories

### Updated

- Update patterns from upstream `fabric` branch

## [0.1.54] - 25/03/2025

### Added

- Add 3 more Anthropic models: `claude-3-5-sonnet-latest`, `claude-3-7-sonnet-latest`, `claude-3-5-haiku-latest`, `claude-3-haiku` and `claude-3-opus-latest`
- Add verbose output (e.g. metadata, input/output tokens, etc.) using `--verbose`
- Add option `--context-window <size>` to pass custom context window value to Ollama (default: 2048)

### Changed

- Language Models is now a list that contains objects with `name`, `context_window`, `desciption` and `max_output_tokens` properties.
- Hide API keys during setup by default. Add `--setup show` option to show the keys.

## [0.1.53] - 20/03/2025

### Added

- Add version number in help screen

## [0.1.52] - 20/03/2025

### Fixed

- Continue setup even when Ollama is not installed (fix)

## [0.1.51] - 20/03/2025

### Fixed

- Continue setup even when Ollama is not installed

## [0.1.5] - 20/03/2025

### Added

- Add support for `OpenAI`
- Add support for `Anthropic`

## [0.1.4] - 18/03/2025

### Added

- Show current configuration when running `--setup`
- Add support for environmental variables
- Add support for cloud LLM providers (Groq/TogetherAI)
- Add option `-m, --model` to display the model and provider (without any parameters)
- Add option `-c, --copy` to copy output to clipboard
- Add `Jina.AI` API key support
- Add option `-w, --web [search]` to search the web using Tavily API

## [0.1.3] - 18/03/2025

### Fixed

- Handle error when Ollama is not found in the system
- Add `--update` option

## [0.1.2] - 18/03/2025

### Fixed

- Handle error when pattern name is misspelled or not properly typed

## [0.1.1] - 15/03/2025

### Added

- Add `-v, --version` option to display software version
- Add `CHANGELOG.md`
- Add `ESLint` for the development of the app
- Add `chalk` module for colorful output
- Add `prompts` module
- Add `getOllamaModels` method to get all available local Ollama models 
- Add `configstore` module for storing and retrieving configuration options
- Add `--setup` option to select Ollama model

### Fixed

- Fix uncaught error when `Ollama` is not running

### Changed

- Read version from `package.json` instead of hardcoded value
- Modify `listPatterns` to get all patterns

### Removed

## [0.1.0] - 14/03/2025

Initial Release.

