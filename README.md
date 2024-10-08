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
