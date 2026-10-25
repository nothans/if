# Infinite IF | Interactive Fiction App Powered by AI

Infinite IF is an interactive fiction app powered by AI, offering endless storytelling possibilities. Dive into unique adventures or create your own, all driven by advanced language models. Create your story now at [if.NotHans.com/](https://if.nothans.com/).

![Infinite IF Start Screen](/screenshots/if-start-screen.png)

## Features

- Multiple pre-defined story seeds to start your adventure
- Custom scenario option for personalized storytelling
- AI-powered narrative generation with current models from OpenAI, Anthropic (Claude), and hundreds more via OpenRouter
- Structured JSON outputs for reliable story turns, with a fallback for models that don't support them
- Pick any model per provider, or load the provider's live model list from settings
- Interactive choices throughout the story
- Text-to-speech functionality for immersive storytelling
- Customizable writing style
- Save and manage your stories locally
- OpenAI, Anthropic, Azure OpenAI, and OpenRouter support

## Usage

1. Choose a pre-defined story seed or create a custom scenario.
2. Read the generated story segments and make choices to progress.
3. Type custom actions if desired.
4. End the story when you're ready or continue exploring.

## Settings

Access the settings menu to:

- Select your AI Service Provider (OpenAI, Anthropic, Azure OpenAI, or OpenRouter)
- Enter API Key for your AI Service Provider
- Pick a model (each provider remembers its own), or click **Load available models** to fetch the provider's current list
- Enter Azure Endpoint URL, Key, and deployment name if using Azure OpenAI
- Toggle text-to-speech functionality if using OpenAI
- Choose a TTS voice
- Set a custom writing style

API keys are stored only in your browser's local storage and are sent directly to the provider you choose.

### OpenAI
OpenAI requires an OpenAI API Key. The default model is `gpt-6.1-sol`. If OpenAI is selected as the AI Service Provider, you can also enable TTS (`gpt-4o-mini-tts`) and choose a voice.

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

### Writing Style

You can can customize the writing style. Here are some examples:

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

![Banana Splitter Story| Infinite IF](/screenshots/if-banana-splitter-story.png)

## Custom Story Prompts
Select the 'Create Your Own Adventure' option from the start screen. You will see a text box to enter your story prompt. You can use this to generate a story based on your idea.

Here are some ideas for custom story prompts:

- **Mystic Library Quest**: "Explore an infinite library where each book transports you to different realities. Choose wisely; not all stories have happy endings."
- **Lost in Time**: "As a time traveler stranded in the past, make choices that could either return you home or alter history irreversibly."
- **Enchanted Forest Journey**: "Venture through a magical forest where every path you take affects the fate of mythical creatures and the balance of nature."
- **Cyberpunk City Heist**: "Plan a heist in a futuristic city controlled by AI overlords. Your decisions could free the populace or tighten the regime's grip."
- **Haunted Mansion Mystery**: "Investigate a mansion where each room holds secrets and dangers. Unravel the mystery, but beware—some truths are best left hidden."
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
