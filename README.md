# Infinite IF | Interactive Fiction App Powered by AI

Infinite IF is an interactive fiction app powered by AI, offering endless storytelling possibilities. Dive into unique adventures or create your own, all driven by advanced language models. Create your story now at [NotHans.com/if](https://nothans.com/if).

![Infinite IF Start Screen](/screenshots/if-start-screen.png)

## Features

- Multiple pre-defined story seeds to start your adventure
- Custom scenario option for personalized storytelling
- AI-powered narrative generation using OpenAI's GPT-4o LLM
- Interactive choices throughout the story
- Text-to-speech functionality for immersive storytelling
- Customizable writing style
- Save and manage your stories locally
- OpenAI and Azure OpenAI support

## Usage

1. Choose a pre-defined story seed or create a custom scenario.
2. Read the generated story segments and make choices to progress.
3. Type custom actions if desired.
4. End the story when you're ready or continue exploring.

## Settings

Access the settings menu to:

- Select your AI Service Provider (OpenAI or Azure OpenAI are currently supported)
- Enter API Key for your AI Service Provider
- Enter Azure Endpoint URL and Key if using Azure OpenAI
- Toggle text-to-speech functionality if using OpenAI
- Choose a TTS voice
- Set a custom writing style

### OpenAI
OpenAI requires an OpenAI API Key. If OpenAI is selected as the AI Service Provider, you can also enable TTS and choose a voice.

### Azure OpenAI
Azure OpenAI support requires the full Completions endpoint from your account (e.g., `https://{endpoint}/openai/deployments/{deployment-id}/completions?api-version=2024-06-01`)

### OpenRouter
OpenRounter requires an OpenRouter Model ID for the OpenRouter Chat Completions Endpoint. Find the model ID by going to [openrouter.ai](https://openrouter.ai) and clicking on the model you want to use. Here are some known good models:

- `openai/gpt-4o`
- `openai/gpt-4o-mini`
- `openai/gpt-4-turbo`
- `anthropic/claude-3.5-sonnet`
- `anthropic/claude-3.5-sonnet:beta`
- `meta-llama/llama-3.1-70b-instruct`
- `mistralai/mistral-tiny`
- `mistralai/mistral-small`
- `mistralai/mistral-large`
- `nousresearch/hermes-3-llama-3.1-405b:free`

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
