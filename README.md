# Infinite IF | Interactive Fiction App Powered by AI

Infinite IF is an interactive fiction app powered by AI, offering endless storytelling possibilities. Dive into unique adventures or create your own, all driven by advanced language models. Create your story now at [if.NotHans.com/](https://if.nothans.com/).

![The Infinite IF start screen: the nine places a story can begin, and a field to begin anywhere](/screenshots/if-start-screen.png)

## Features

- Multiple pre-defined story seeds to start your adventure
- Custom scenario option for personalized storytelling
- AI-powered narrative generation with current models from OpenAI, Anthropic (Claude), and hundreds more via OpenRouter, or a model running on your own computer with Ollama
- Structured JSON outputs for reliable story turns, with a fallback for models that don't support them
- Pick any model per provider, or load the provider's live model list from settings
- Reads like a text adventure transcript: each passage under the name of the place, your moves printed between passages
- Numbered choices you can take with a keypress, or type any move of your own
- Reads the story aloud with a voice that runs in your browser, OpenAI's voices, or Ollama's
- Customizable writing style
- Finished stories go to your library in this browser, to read again as they were played
- OpenAI, Anthropic, Azure OpenAI, OpenRouter, and Ollama support

## Usage

1. Pick where the story begins, or type a beginning of your own.
2. Read the passage, then take a numbered choice (press its number) or type what you do.
3. Choose **End the story** when you're ready; the model writes an ending and the story goes to your library.

## Settings

Access the settings menu to:

- Select your AI Service Provider (OpenAI, Anthropic, Azure OpenAI, OpenRouter, or Ollama)
- Enter API Key for your AI Service Provider
- Pick a model (each provider remembers its own), or click **Load available models** to fetch the provider's current list
- Enter Azure Endpoint URL, Key, and deployment name if using Azure OpenAI
- Choose how the story is read aloud, and the voice
- Set a custom writing style

API keys are stored only in your browser's local storage and are sent directly to the provider you choose.

### OpenAI
OpenAI requires an OpenAI API Key. The default model is `gpt-6.1-sol`. The same key powers OpenAI's voices (`gpt-4o-mini-tts`) when you choose OpenAI under **Read the Story Aloud**.

### Anthropic
Anthropic requires an Anthropic API Key from [platform.claude.com](https://platform.claude.com). The default model is `claude-opus-5-5`; `claude-sonnet-5-5` and `claude-haiku-5-5` are faster, cheaper alternatives. Requests go straight from your browser to the Claude API.

### Azure OpenAI
Azure OpenAI accepts either endpoint style:

- The v1 endpoint, e.g. `https://{resource}.openai.azure.com/openai/v1/chat/completions`. Enter your deployment name in the model field.
- A deployment endpoint, e.g. `https://{resource}.openai.azure.com/openai/deployments/{deployment-id}/chat/completions?api-version=2024-10-21`. The model field can be left blank.

### OpenRouter
OpenRouter requires an OpenRouter API Key. The default model is `anthropic/claude-sonnet-5.5`. Use **Load available models** to browse every OpenRouter model, or find a model ID at [openrouter.ai](https://openrouter.ai). Here are some known good models (tested October 2026):

- `anthropic/claude-sonnet-5.5`
- `anthropic/claude-haiku-5.5`
- `openai/gpt-6.1-sol`
- `openai/gpt-6-luna`
- `google/gemini-3.8-flash`
- `x-ai/grok-4.7`
- `deepseek/deepseek-v4.1-flash`
- `qwen/qwen3.8-flash`
- `moonshotai/kimi-k3`
- `mistralai/mistral-large-4-0`
- `z-ai/glm-5.3`

### Ollama
Ollama runs the story on your own computer, with no API key and nothing sent to a cloud service.

1. Install [Ollama](https://ollama.com) and pull a chat model, for example `ollama pull qwen3.5:9b`.
2. In Settings, choose **Ollama (local)**. The app lists your models and picks the first one.

Story turns ask the model to skip its thinking step; on an RTX 3060 Ti that keeps a `qwen3.5:9b` turn to a few seconds instead of about 40.

Serving the app from your own computer needs nothing else: run `python -m http.server 8000` in this folder and open http://localhost:8000.
To use Ollama from if.nothans.com instead:

1. Allow the site in Ollama: set the environment variable `OLLAMA_ORIGINS` to `https://if.nothans.com` and restart Ollama (see [Ollama's FAQ](https://docs.ollama.com/faq) for each operating system).
2. When your browser asks to let the site access devices on your local network, choose Allow.

## Reading the Story Aloud

Choose a voice under **Read the Story Aloud** in Settings.
Speech starts while the rest of the segment is still being generated.

- The built-in voice runs Gradium's open [Phonon](https://huggingface.co/gradium/phonon-31m-en) model (Apache 2.0) in your browser, on the graphics card through WebGPU when the browser has it; it downloads a 65 MB model once, needs no account, and offers 37 English voices.
- OpenAI's voices use `gpt-4o-mini-tts` with your OpenAI API key.
- Ollama's voice is its `phonon` model, which Ollama runs only on Apple Silicon Macs (`ollama pull phonon`).

The built-in voice's runtime, [phonon-tts](https://www.npmjs.com/package/phonon-tts) 0.4.0 (MIT or Apache 2.0), is in `assets/vendor/phonon-tts/`; its WebAssembly files load from jsDelivr, and the model and voices from Hugging Face.

### Writing Style

You can customize the writing style. Here are some examples:

- **Pirate**: Talk like a pirate.
- **Shakespeare**: Write like Shakespeare.
- **Epic**: Write like it's an epic story.
- **Short**: Write a short story.
- **Long**: Write a long story.
- **Serious**: Write like it's a serious story.
- **Funny**: Write like it's a funny story.
- **Cute**: Write like it's a cute story.
- **Scary**: Write like it's a scary story.
- **Romantic**: Write like it's a romantic story.
- **Adventurous**: Write like it's an adventurous story.
- **German**: Write in German.

## Story Example

![A story in progress: the title, two passages under their place names, and the move that joined them](/screenshots/if-story.png)

## Custom Story Prompts
Select the 'Create Your Own Adventure' option from the start screen. You will see a text box to enter your story prompt. You can use this to generate a story based on your idea.

Here are some ideas for custom story prompts:

- **Mystic Library Quest**: "Explore an infinite library where each book transports you to different realities. Choose wisely; not all stories have happy endings."
- **Lost in Time**: "As a time traveler stranded in the past, make choices that could either return you home or alter history irreversibly."
- **Enchanted Forest Journey**: "Venture through a magical forest where every path you take affects the fate of mythical creatures and the balance of nature."
- **Cyberpunk City Heist**: "Plan a heist in a futuristic city controlled by AI overlords. Your decisions could free the populace or tighten the regime's grip."
- **Haunted Mansion Mystery**: "Investigate a mansion where each room holds secrets and dangers. Unravel the mystery, but beware: some truths are best left hidden."
- **Space Colony Survival**: "Lead a group of settlers on a distant planet. Resources are scarce, and your choices determine the colony's survival."
- **Undersea Expedition**: "Dive into the depths of an unexplored ocean trench. Discover hidden wonders or awaken ancient terrors."
- **Rebel of the Realm**: "In a kingdom ruled by a tyrant, join the rebellion. Your alliances and actions could either liberate the land or doom it."
- **Alien Diplomacy**: "As Earth's ambassador, negotiate with an alien race. Peace or interstellar war hinges on your decisions."
- **Dreamscape Explorer**: "Navigate through people's dreams to solve a looming threat. Each mind is a new world with its own rules and risks."
- **Wizard's Apprentice Trials**: "Master spells and face trials in a magic academy. Success brings power; failure has dire consequences."
- **Post-Apocalyptic Quest**: "Survive in a world ravaged by disaster. Choices about trust and resources shape humanity's future."
- **Virtual Reality Trap**: "Trapped in a VR game gone wrong, find the exit before the system collapses. Not all glitches are your friends."
- **Detective Noir**: "Solve a series of crimes in a city where nothing is as it seems. Each clue uncovers more danger."
- **Mythical Beast Rider**: "Bond with a legendary creature and defend your realm. Your decisions affect the harmony between humans and beasts."
- **Corporate Espionage**: "Infiltrate a mega-corporation to expose their secrets. One wrong move could cost you everything."
- **Cursed Artifact Hunt**: "Search for artifacts that grant wishes but carry curses. Weigh the risks of each desire you fulfill."
- **Steampunk Airship Adventure**: "Captain an airship through skies filled with pirates and monsters. Chart your course carefully."
- **Genetic Engineering Dilemmas**: "Manipulate DNA to cure diseases or enhance humans. Ethical choices lead to different societal outcomes."
- **Kingdom Builder**: "Found a new kingdom in untamed lands. Decisions on laws and alliances shape your legacy."
