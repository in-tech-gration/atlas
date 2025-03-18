# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.4] - 18/03/2025

### Added

- Show current configuration when running `--setup`
- Add support for environmental variables
- Add support for cloud LLM providers (Groq/TogetherAI)
- Add option `-m, --model` to display the model and provider (without any parameters)
- Add option `-c, --copy` to copy output to clipboard

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

