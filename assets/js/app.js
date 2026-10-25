// AI Providers
// Default and suggested models per provider. Suggestions populate the model picker;
// "Load available models" in settings replaces them with the provider's live list.
const PROVIDERS = {
    openai: {
        defaultModel: 'gpt-6.1-sol',
        suggestedModels: ['gpt-6.1-sol', 'gpt-6-luna'],
        modelLabel: 'OpenAI Model:',
    },
    anthropic: {
        defaultModel: 'claude-opus-5-5',
        suggestedModels: ['claude-opus-5-5', 'claude-sonnet-5-5', 'claude-haiku-5-5', 'claude-fable-5-1'],
        modelLabel: 'Claude Model:',
    },
    openrouter: {
        defaultModel: 'anthropic/claude-sonnet-5.5',
        suggestedModels: [
            'anthropic/claude-sonnet-5.5',
            'anthropic/claude-haiku-5.5',
            'openai/gpt-6.1-sol',
            'openai/gpt-6-luna',
            'google/gemini-3.8-flash',
            'x-ai/grok-4.7',
            'deepseek/deepseek-v4.1-flash',
            'qwen/qwen3.8-flash',
            'moonshotai/kimi-k3',
            'mistralai/mistral-large-4-0',
            'z-ai/glm-5.3',
        ],
        modelLabel: 'OpenRouter Model:',
    },
    azure: {
        defaultModel: '',
        suggestedModels: [],
        modelLabel: 'Azure Deployment Name (required for /openai/v1/ endpoints):',
    },
};

// Models that were hardcoded defaults in v1.0.x; saved settings holding these are upgraded.
const LEGACY_DEFAULT_MODELS = ['gpt-4o', 'openai/gpt-4o'];

const ANTHROPIC_API_VERSION = '2026-10-21';
// Claude models that accept server-side refusal fallbacks (fallbacks: "default").
const ANTHROPIC_FALLBACK_MODELS = ['claude-fable-5-1', 'claude-opus-5-5', 'claude-opus-5', 'claude-sonnet-5-5'];
// Claude models that accept output_config.effort.
const ANTHROPIC_EFFORT_MODEL_PATTERN = /^claude-(fable|mythos|opus|sonnet|haiku)-5|^claude-opus-4-[5-8]|^claude-sonnet-4-6/;

const TTS_MODEL = 'gpt-4o-mini-tts';
const REQUEST_TIMEOUT_MS = 180000;

// Settings Management
let aiService = 'openai';
let openaiKey = '';
let anthropicKey = '';
let azureEndpoint = '';
let azureKey = '';
let openrouterKey = '';
let models = {};
let draftModels = {};
let ttsEnabled = false;
let ttsVoice = 'onyx';
let writingStyle = '';
let storyInProgress = false;

function resolveModels(settings) {
    const saved = settings.models || { openrouter: settings.openrouterModel };
    const resolved = {};
    Object.keys(PROVIDERS).forEach(provider => {
        const model = (saved[provider] || '').trim();
        resolved[provider] = model && !LEGACY_DEFAULT_MODELS.includes(model) ? model : PROVIDERS[provider].defaultModel;
    });
    return resolved;
}

function loadSettings() {
    const settings = JSON.parse(localStorage.getItem('infinite-if-settings')) || {};

    aiService = PROVIDERS[settings.aiService] ? settings.aiService : 'openai';
    openaiKey = settings.openaiKey || '';
    anthropicKey = settings.anthropicKey || '';
    azureEndpoint = settings.azureEndpoint || '';
    azureKey = settings.azureKey || '';
    openrouterKey = settings.openrouterKey || '';
    models = resolveModels(settings);
    draftModels = { ...models };
    ttsEnabled = settings.ttsEnabled || false;
    writingStyle = settings.writingStyle || '';
    ttsVoice = settings.ttsVoice || 'onyx';

    document.getElementById('ai-service-select').value = aiService;
    document.getElementById('openai-key-input').value = openaiKey;
    document.getElementById('anthropic-key-input').value = anthropicKey;
    document.getElementById('azure-endpoint-input').value = azureEndpoint;
    document.getElementById('azure-key-input').value = azureKey;
    document.getElementById('openrouter-key-input').value = openrouterKey;
    document.getElementById('tts-checkbox').checked = ttsEnabled;
    document.getElementById('voice-select').value = ttsVoice;
    document.getElementById('writing-style-input').value = writingStyle;

    updateSettingsModal();
}

function updateSettingsModal() {
    const show = (id, visible) => {
        document.getElementById(id).style.display = visible ? 'block' : 'none';
    };
    show('openai-settings-group', aiService === 'openai');
    show('anthropic-settings-group', aiService === 'anthropic');
    show('azure-settings-group', aiService === 'azure');
    show('openrouter-settings-group', aiService === 'openrouter');
    show('tts-group', aiService === 'openai');
    show('voice-selection-group', aiService === 'openai' && document.getElementById('tts-checkbox').checked);
    updateModelPicker();
}

function updateModelPicker() {
    const provider = PROVIDERS[aiService];
    document.getElementById('model-label').textContent = provider.modelLabel;
    document.getElementById('model-input').value = draftModels[aiService] || '';
    document.getElementById('model-input').placeholder = provider.defaultModel || 'Enter a model or deployment name';
    document.getElementById('refresh-models-button').style.display = aiService === 'azure' ? 'none' : 'inline-block';
    document.getElementById('model-list-status').textContent = '';
    setModelOptions(provider.suggestedModels);
}

function setModelOptions(modelIds) {
    const datalist = document.getElementById('model-options');
    datalist.innerHTML = '';
    modelIds.forEach(id => {
        const option = document.createElement('option');
        option.value = id;
        datalist.appendChild(option);
    });
}

function saveSettings(settings) {
    localStorage.setItem('infinite-if-settings', JSON.stringify(settings));
    loadSettings();
}

// Game Elements
const startScreen = document.getElementById('start-screen');
const startButtons = document.querySelectorAll('#start-buttons button');
const gameContainer = document.getElementById('game-container');
const userInput = document.getElementById('user-input');
const submitButton = document.getElementById('submit-button');
const endStoryButton = document.getElementById('end-story-button');
const storyDiv = document.getElementById('story');
const optionsDiv = document.getElementById('options');
const optionsAndInputDiv = document.getElementById('options-and-input');
const inputArea = document.getElementById('input-area');
const restartButton = document.getElementById('restart-button');
const loadingSpinner = document.getElementById('loading-spinner');
const settingsIcon = document.getElementById('settings-icon');
const settingsModal = document.getElementById('settings-modal');
const closeModal = document.querySelector('.close');
const saveSettingsButton = document.getElementById('save-settings-button');

// Game State
let gameState = {
    location: '',
    history: [],
    seedIdea: '',
    lastIcon: '',
    storyContent: [],
    // Conversation transcript sent to the model: alternating user prompts and assistant JSON replies.
    messages: [],
};

// Initialize Settings on Startup
loadSettings();

if (!openaiKey && !anthropicKey && !azureKey && !openrouterKey) {
    settingsModal.style.display = 'block';
}

// Utility Functions
function validateIcon(iconName) {
    return validIcons.includes(iconName) ? iconName : 'help_outline';
}

function appendStory(text, iconClass) {
    const segment = document.createElement('div');
    segment.className = 'story-segment';
    iconClass = validateIcon(iconClass || 'help_outline');
    segment.innerHTML = `<span class="material-symbols-outlined">${iconClass}</span><div>${text}</div>`;
    storyDiv.appendChild(segment);
    storyDiv.scrollTop = storyDiv.scrollHeight;
    convertTextToSpeech(text);
    gameState.storyContent.push({ text, iconClass });
}

function convertTextToSpeech(text) {
    if (!ttsEnabled || aiService !== 'openai') return;

    fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + openaiKey,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: TTS_MODEL,
            input: text,
            voice: ttsVoice,
            instructions: `Narrate like an engaging audiobook reader of interactive fiction. ${writingStyle ? `Match this writing style: ${writingStyle}` : ''}`.trim(),
            response_format: 'mp3',
        }),
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Text-to-speech request failed with status ${response.status}`);
        }
        return response.blob();
    })
    .then(audioBlob => {
        if (window.currentAudio) {
            window.currentAudio.pause();
            window.currentAudio = null;
        }
        const audio = new Audio(URL.createObjectURL(audioBlob));
        window.currentAudio = audio;
        audio.play();
    })
    .catch(error => {
        console.error('Error with text-to-speech:', error);
    });
}

// Display Options
function displayOptions(options) {
    optionsDiv.innerHTML = '';
    optionsDiv.style.display = 'block';
    scrollLeftBtn.style.display = 'block';
    scrollRightBtn.style.display = 'block';
    options.forEach((option) => {
        const btn = document.createElement('button');
        const iconClass = validateIcon(option.icon || 'help_outline');
        btn.innerHTML = `<span class="material-symbols-outlined">${iconClass}</span> ${option.text}`;
        btn.onclick = () => {
            handleOptionSelection(option.text, iconClass);
        };
        optionsDiv.appendChild(btn);
    });
}

function showOptionsAgain() {
    if (optionsDiv.children.length === 0) return;
    optionsDiv.style.display = 'block';
    scrollLeftBtn.style.display = 'block';
    scrollRightBtn.style.display = 'block';
}

// Handle Option Selection
function handleOptionSelection(optionText, optionIcon) {
    optionsDiv.style.display = 'none';
    scrollLeftBtn.style.display = 'none';
    scrollRightBtn.style.display = 'none';
    gameState.history.push(optionText);
    gameState.lastIcon = optionIcon || 'help_outline';
    sendRequestToAIService(optionText, false, optionIcon);
}

// Loading Indicators
function showLoading() {
    loadingSpinner.style.display = 'block';
    submitButton.disabled = true;
    endStoryButton.disabled = true;
    userInput.disabled = true;
}

function hideLoading() {
    loadingSpinner.style.display = 'none';
    submitButton.disabled = false;
    endStoryButton.disabled = false;
    userInput.disabled = false;
}

// Story Response Format
// Sent as a JSON schema so providers with structured outputs return valid JSON every time.
const STORY_SCHEMA = {
    type: 'object',
    properties: {
        storyTitle: { type: 'string', description: 'A title for the entire story.' },
        description: { type: 'string', description: 'The narrative for this story segment.' },
        icon: { type: 'string', description: 'A Material Symbols icon name for this segment.' },
        options: {
            type: 'array',
            description: 'Choices the player can take next. Empty when the story has ended.',
            items: {
                type: 'object',
                properties: {
                    text: { type: 'string' },
                    icon: { type: 'string', description: 'A Material Symbols icon name for this option.' },
                },
                required: ['text', 'icon'],
                additionalProperties: false,
            },
        },
        location: { type: 'string', description: "The player's current location." },
    },
    required: ['storyTitle', 'description', 'icon', 'options', 'location'],
    additionalProperties: false,
};

function buildSystemPrompt() {
    const writingStyleInstruction = writingStyle ? `\n\nWriting style: ${writingStyle}` : '';
    return `You are the narrator and game engine for an interactive fiction game. Each turn, write the next story segment and offer the player a handful of distinct choices. Build on everything that has happened so far, weave the player's latest action into the segment, and avoid repeating earlier passages.${writingStyleInstruction}

Respond with a single JSON object and nothing else, in this shape:

{
  "storyTitle": "A title for the entire story",
  "description": "The story segment",
  "icon": "material_symbol_name",
  "options": [
    {"text": "A choice", "icon": "material_symbol_name"}
  ],
  "location": "Where the player is now"
}

For every icon, use a valid Material Symbols name that fits the content, such as "forest", "rocket_launch", or "emoji_nature".`;
}

function buildUserPrompt(userChoice, endStory, userIcon) {
    if (endStory) {
        let prompt = 'Write an epic conclusion to the story so far. Wrap up all loose ends and give a satisfying ending. Return an empty options array.';
        if (userIcon) {
            prompt += ` Use the icon "${userIcon}" for the conclusion.`;
        }
        return prompt;
    }
    if (gameState.storyContent.length === 0) {
        let prompt = `Begin a story based on the seed idea: "${gameState.seedIdea}".`;
        if (userIcon) {
            prompt += ` Use the icon "${userIcon}" for the opening segment.`;
        }
        return prompt;
    }
    let prompt = `The player is at "${gameState.location}". They chose to "${userChoice}".`;
    prompt += userIcon ? ` Use the icon "${userIcon}" for this segment.` : ' Pick a fitting icon for this segment.';
    return prompt + ' What happens next?';
}

// Provider Requests
async function postJSON(url, headers, body) {
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.error) {
        const error = new Error((data.error && data.error.message) || `Request failed with status ${response.status}`);
        error.status = response.status;
        throw error;
    }
    return data;
}

// Structured outputs are not supported by every model. If a request with a schema is
// rejected as invalid, retry once without it and rely on the prompt's JSON instructions.
async function withSchemaFallback(request) {
    try {
        return await request(true);
    } catch (error) {
        if (error.status === 400) {
            return await request(false);
        }
        throw error;
    }
}

function getChatCompletionsConfig() {
    if (aiService === 'openai') {
        return {
            endpoint: 'https://api.openai.com/v1/chat/completions',
            headers: { 'Authorization': 'Bearer ' + openaiKey },
            model: models.openai,
        };
    }
    if (aiService === 'openrouter') {
        return {
            endpoint: 'https://openrouter.ai/api/v1/chat/completions',
            headers: {
                'Authorization': 'Bearer ' + openrouterKey,
                'HTTP-Referer': 'https://nothans.com/if',
                'X-Title': 'Infinite IF | Interactive Fiction App Powered by AI',
            },
            model: models.openrouter,
        };
    }
    if (aiService === 'azure') {
        return {
            endpoint: azureEndpoint,
            headers: { 'api-key': azureKey },
            model: models.azure,
        };
    }
    return null;
}

async function requestChatCompletion(config, systemPrompt, messages) {
    const data = await withSchemaFallback(useSchema => {
        const body = {
            messages: [{ role: 'system', content: systemPrompt }, ...messages],
        };
        if (config.model) {
            body.model = config.model;
        }
        if (useSchema) {
            body.response_format = {
                type: 'json_schema',
                json_schema: { name: 'story_segment', strict: true, schema: STORY_SCHEMA },
            };
        }
        return postJSON(config.endpoint, config.headers, body);
    });
    const message = data.choices && data.choices[0] && data.choices[0].message;
    if (!message) {
        throw new Error('The AI service returned an empty response.');
    }
    if (message.refusal) {
        throw new Error(`The model declined to continue: ${message.refusal}`);
    }
    return message.content;
}

async function requestAnthropicMessage(systemPrompt, messages) {
    const model = models.anthropic;
    const headers = {
        'x-api-key': anthropicKey,
        'anthropic-version': ANTHROPIC_API_VERSION,
        'anthropic-dangerous-direct-browser-access': 'true',
    };
    const supportsFallbacks = ANTHROPIC_FALLBACK_MODELS.includes(model);
    if (supportsFallbacks) {
        headers['anthropic-beta'] = 'server-side-fallback-2026-07-01';
    }

    const data = await withSchemaFallback(useSchema => {
        const body = {
            model: model,
            max_tokens: 16000,
            system: systemPrompt,
            messages: messages,
        };
        const outputConfig = {};
        if (ANTHROPIC_EFFORT_MODEL_PATTERN.test(model)) {
            // Low effort keeps turns snappy for an interactive game.
            outputConfig.effort = 'low';
        }
        if (useSchema) {
            outputConfig.format = { type: 'json_schema', schema: STORY_SCHEMA };
        }
        if (Object.keys(outputConfig).length > 0) {
            body.output_config = outputConfig;
        }
        if (supportsFallbacks) {
            body.fallbacks = 'default';
        }
        return postJSON('https://api.anthropic.com/v1/messages', headers, body);
    });

    if (data.stop_reason === 'refusal') {
        throw new Error('The model declined to continue this story. Try a different choice.');
    }
    return (data.content || [])
        .filter(block => block.type === 'text')
        .map(block => block.text)
        .join('');
}

function parseStoryJSON(text) {
    let cleaned = (text || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/```$/, '').trim();
    try {
        return JSON.parse(cleaned);
    } catch (e) {
        // Some models wrap the JSON in prose; fall back to the outermost object.
        const start = cleaned.indexOf('{');
        const end = cleaned.lastIndexOf('}');
        if (start !== -1 && end > start) {
            return JSON.parse(cleaned.slice(start, end + 1));
        }
        throw e;
    }
}

// AI Service Interaction
async function sendRequestToAIService(userChoice, endStory = false, userIcon = '') {
    showLoading();

    const systemPrompt = buildSystemPrompt();
    const userMessage = { role: 'user', content: buildUserPrompt(userChoice, endStory, userIcon) };
    const messages = [...gameState.messages, userMessage];

    try {
        let content;
        if (aiService === 'anthropic') {
            content = await requestAnthropicMessage(systemPrompt, messages);
        } else {
            const config = getChatCompletionsConfig();
            if (!config) {
                throw new Error('No AI service selected.');
            }
            content = await requestChatCompletion(config, systemPrompt, messages);
        }
        const response = parseStoryJSON(content);
        gameState.messages.push(userMessage, { role: 'assistant', content: JSON.stringify(response) });
        hideLoading();
        processResponse(response, endStory);
    } catch (error) {
        console.error('AI service error:', error);
        hideLoading();
        handleRequestError(error, endStory);
    }
}

function handleRequestError(error, endStory) {
    let message = error && error.message ? error.message : 'An error occurred.';
    if (error && error.name === 'TimeoutError') {
        message = 'The AI service took too long to respond.';
    } else if (error instanceof SyntaxError) {
        message = 'The AI service returned a response that could not be read.';
    }
    alert(`${message} Please try again.`);

    if (gameState.storyContent.length === 0) {
        storyInProgress = false;
        reloadApp();
        return;
    }
    if (!endStory) {
        // Drop the choice that failed so it is not counted twice on retry.
        gameState.history.pop();
    }
    showOptionsAgain();
}

function processResponse(response, endStory) {
    const storyTitle = response.storyTitle || gameState.seedIdea;
    storyInProgress = true;

    appendStory(response.description || '', validateIcon(response.icon));
    if (response.location) {
        gameState.location = response.location;
    }

    if (Array.isArray(response.options) && response.options.length > 0 && !endStory) {
        displayOptions(response.options);
    }

    if (endStory) {
        const story = {
            title: storyTitle,
            date: new Date().toISOString(),
            content: gameState.storyContent,
            seedIdea: gameState.seedIdea,
            writingStyle: writingStyle
        };

        let savedStories = JSON.parse(localStorage.getItem('infinite-if-stories')) || [];
        savedStories.push(story);
        localStorage.setItem('infinite-if-stories', JSON.stringify(savedStories));

        storyInProgress = false;
        optionsDiv.innerHTML = '';
        optionsDiv.style.display = 'none';
        scrollLeftBtn.style.display = 'none';
        scrollRightBtn.style.display = 'none';
        inputArea.style.display = 'none';
        endStoryButton.style.display = 'none';
        restartButton.style.display = 'block';
    }
}

// Event Listeners

// Close Modals
document.querySelectorAll('.close').forEach(closeButton => {
    closeButton.onclick = function() {
        this.closest('.modal').style.display = 'none';
    }
});

// User Input
userInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        submitButton.click();
    }
});

submitButton.onclick = () => {
    const input = userInput.value.trim();
    if (input) {
        optionsDiv.style.display = 'none';
        scrollLeftBtn.style.display = 'none';
        scrollRightBtn.style.display = 'none';    
        gameState.history.push(input);
        gameState.lastIcon = '';
        sendRequestToAIService(input);
        userInput.value = '';
    }
};

// End Story Button
endStoryButton.onclick = () => {
    if (confirm('Are you sure you want to end the story?')) {
        sendRequestToAIService('End the story', true, 'wb_twilight');
    }
};

// Restart Button
restartButton.addEventListener('click', reloadApp);

// Start Buttons
startButtons.forEach(button => {
    button.addEventListener('click', () => {
        if (button.getAttribute('id') === 'custom-scenario-button') {
            return;
        }
        gameState.seedIdea = button.getAttribute('data-seed');
        gameState.location = gameState.seedIdea;
        gameState.lastIcon = button.getAttribute('data-icon') || 'help_outline';
        startScreen.style.display = 'none';
        gameContainer.style.display = 'flex';
        inputArea.style.display = 'flex';
        endStoryButton.style.display = 'inline-block';
        restartButton.style.display = 'none';
        storyDiv.innerHTML = '';
        optionsDiv.innerHTML = '';
        optionsDiv.style.display = 'none';
        gameState.history = [];
        gameState.storyContent = [];
        gameState.messages = [];
        sendRequestToAIService('', false, gameState.lastIcon);
    });
});

// Custom Scenario Button
document.getElementById('custom-scenario-button').addEventListener('click', () => {
    const customSeed = prompt('Enter your custom adventure seed:');
    if (customSeed) {
        gameState.seedIdea = customSeed;
        gameState.location = customSeed;
        gameState.lastIcon = 'edit';
        startScreen.style.display = 'none';
        gameContainer.style.display = 'flex';
        inputArea.style.display = 'flex';
        endStoryButton.style.display = 'inline-block';
        restartButton.style.display = 'none';
        storyDiv.innerHTML = '';
        optionsDiv.innerHTML = '';
        optionsDiv.style.display = 'none';
        gameState.history = [];
        gameState.storyContent = [];
        gameState.messages = [];
        sendRequestToAIService(customSeed, false);
    }
});

settingsIcon.onclick = function() {
    settingsModal.style.display = 'block';     
}

closeModal.onclick = function() {
    settingsModal.style.display = 'none';
}

window.onclick = function(event) {
    if (event.target == settingsModal) {
        settingsModal.style.display = 'none';
    }
    if (event.target == savedStoriesModal) {
        savedStoriesModal.style.display = 'none';
    }
    if (event.target == document.getElementById('story-view-modal')) {
        document.getElementById('story-view-modal').style.display = 'none';
    }
}

// Reloading the App
const reloadIcon = document.getElementById('reload-icon');
reloadIcon.addEventListener('click', reloadApp);

const navHomeLink = document.getElementById('nav-home-link');
navHomeLink.addEventListener('click', reloadApp);

function reloadApp(event) {
    if (event) {
        event.preventDefault(); 
    }
    if (storyInProgress) {
        if (confirm('Are you sure you want to restart? All progress will be lost.')) {
            storyInProgress = false;
            location.reload();
        }
    } else {
        location.reload();
    }
}

// Settings
document.getElementById('ai-service-select').addEventListener('change', function() {
    aiService = this.value;
    updateSettingsModal();
});

document.getElementById('model-input').addEventListener('input', function() {
    draftModels[aiService] = this.value;
});

// Fetch the provider's live model list so newly released models show up without an app update.
async function fetchAvailableModels(provider) {
    const getJSON = async (url, headers) => {
        const response = await fetch(url, { headers, signal: AbortSignal.timeout(30000) });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error((data.error && data.error.message) || `Request failed with status ${response.status}`);
        }
        return data;
    };

    if (provider === 'openai') {
        const key = document.getElementById('openai-key-input').value.trim();
        const data = await getJSON('https://api.openai.com/v1/models', { 'Authorization': 'Bearer ' + key });
        const nonChat = /audio|realtime|tts|transcribe|whisper|image|dall-e|embedding|moderation|search|instruct|babbage|davinci/;
        return data.data
            .map(model => model.id)
            .filter(id => /^(gpt-|o\d|chatgpt-)/.test(id) && !nonChat.test(id))
            .sort()
            .reverse();
    }
    if (provider === 'anthropic') {
        const key = document.getElementById('anthropic-key-input').value.trim();
        const data = await getJSON('https://api.anthropic.com/v1/models?limit=1000', {
            'x-api-key': key,
            'anthropic-version': ANTHROPIC_API_VERSION,
            'anthropic-dangerous-direct-browser-access': 'true',
        });
        // Returned newest first.
        return data.data.map(model => model.id);
    }
    if (provider === 'openrouter') {
        const data = await getJSON('https://openrouter.ai/api/v1/models', {});
        return data.data
            .filter(model => !model.architecture || !model.architecture.output_modalities || model.architecture.output_modalities.includes('text'))
            .map(model => model.id)
            .sort();
    }
    return [];
}

document.getElementById('refresh-models-button').addEventListener('click', async function() {
    const provider = aiService;
    const status = document.getElementById('model-list-status');
    status.textContent = 'Loading models...';
    this.disabled = true;
    try {
        const modelIds = await fetchAvailableModels(provider);
        if (provider !== aiService) return;
        setModelOptions(modelIds);
        status.textContent = `${modelIds.length} models available. Clear the field to browse them.`;
    } catch (error) {
        console.error('Error loading models:', error);
        if (provider === aiService) {
            status.textContent = `Could not load models: ${error.message}`;
        }
    } finally {
        this.disabled = false;
    }
});

saveSettingsButton.onclick = function() {
    const aiService = document.getElementById('ai-service-select').value || 'openai';
    const openaiKey = document.getElementById('openai-key-input').value.trim();
    const anthropicKey = document.getElementById('anthropic-key-input').value.trim();
    const azureEndpoint = document.getElementById('azure-endpoint-input').value.trim();
    const azureKey = document.getElementById('azure-key-input').value.trim();
    const openrouterKey = document.getElementById('openrouter-key-input').value.trim();
    const ttsEnabled = document.getElementById('tts-checkbox').checked;
    const ttsVoice = document.getElementById('voice-select').value;
    const writingStyleInput = document.getElementById('writing-style-input').value.trim() || '';

    draftModels[aiService] = document.getElementById('model-input').value;
    const savedModels = {};
    Object.keys(PROVIDERS).forEach(provider => {
        savedModels[provider] = (draftModels[provider] || '').trim();
    });

    saveSettings({ aiService, openaiKey, anthropicKey, azureEndpoint, azureKey, openrouterKey, models: savedModels, ttsEnabled, ttsVoice, writingStyle: writingStyleInput });
    settingsModal.style.display = 'none';
}

document.getElementById('tts-checkbox').addEventListener('change', function() {
    if (this.checked) {
        document.getElementById('voice-selection-group').style.display = 'block';
    } else {
        document.getElementById('voice-selection-group').style.display = 'none';
    }
});

// Saved Stories Management
const savedStoriesIcon = document.getElementById('saved-stories-icon');
const savedStoriesModal = document.getElementById('saved-stories-modal');

savedStoriesIcon.onclick = function() {
    savedStoriesModal.style.display = 'block';
    displaySavedStories();
}

function displaySavedStories() {
    const savedStoriesList = document.getElementById('saved-stories-list');
    savedStoriesList.innerHTML = '';
    
    let savedStories = JSON.parse(localStorage.getItem('infinite-if-stories')) || [];
    
    let sortedStories = savedStories.slice().sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (sortedStories.length === 0) {
        savedStoriesList.innerHTML = '<p>No saved stories yet.</p>';
        return;
    }
    
    sortedStories.forEach((story) => {
        const originalIndex = savedStories.indexOf(story);
        
        const storyElement = document.createElement('div');
        storyElement.className = 'saved-story';
        storyElement.innerHTML = `
            <h4>${story.title}</h4>
            <p><span class="timeago" datetime="${story.date}"></span></p>
            <p>Seed: ${story.seedIdea}</p>
            ${story.writingStyle ? `<p>Writing Style: ${story.writingStyle}</p>` : ''}
            <p>
                <button class="view-story" data-index="${originalIndex}">View</button>
                <button class="delete-story" data-index="${originalIndex}">Delete</button>
            </p>
        `;
        savedStoriesList.appendChild(storyElement);
    });
    
    timeago.render(document.querySelectorAll('.timeago'));
    
    const deleteButtons = document.querySelectorAll('.delete-story');
    deleteButtons.forEach(button => {
        button.addEventListener('click', function() {
            const index = this.getAttribute('data-index');
            deleteStory(index);
        });
    });

    const viewButtons = document.querySelectorAll('.view-story');
    viewButtons.forEach(button => {
        button.addEventListener('click', function() {
            const index = this.getAttribute('data-index');
            viewStory(index);
        });
    });
}

function deleteStory(index) {
    if (confirm('Are you sure you want to delete this story?')) {
        let savedStories = JSON.parse(localStorage.getItem('infinite-if-stories')) || [];
        savedStories.splice(index, 1);
        localStorage.setItem('infinite-if-stories', JSON.stringify(savedStories));
        displaySavedStories();
    }
}

// View Story Modal
function viewStory(index) {
    const savedStories = JSON.parse(localStorage.getItem('infinite-if-stories')) || [];
    const story = savedStories[index];
    
    if (!story) {
        alert('Story not found');
        return;
    }

    const storyViewModal = document.getElementById('story-view-modal');
    const storyViewTitle = document.getElementById('story-view-title');
    const storyViewContent = document.getElementById('story-view-content');

    storyViewTitle.textContent = story.title;
    storyViewContent.innerHTML = '';

    story.content.forEach(segment => {
        const segmentElement = document.createElement('div');
        segmentElement.className = 'story-segment';
        segmentElement.innerHTML = `<span class="material-symbols-outlined">${segment.iconClass}</span><div>${segment.text}</div>`;
        storyViewContent.appendChild(segmentElement);
    });

    storyViewModal.style.display = 'block';
}

// Scroll Arrow Functionality
const scrollLeftBtn = document.getElementById('scroll-left');
const scrollRightBtn = document.getElementById('scroll-right');
const optionsContainer = document.getElementById('options');
const scrollAmount = 150;

scrollLeftBtn.addEventListener('click', () => {
    optionsContainer.scrollBy({
        top: 0,
        left: -scrollAmount,
        behavior: 'smooth'
    });
});

scrollRightBtn.addEventListener('click', () => {
    optionsContainer.scrollBy({
        top: 0,
        left: scrollAmount,
        behavior: 'smooth'
    });
});

// Prevent Leaving the Page if the Story is in Progress
window.addEventListener('beforeunload', function (event) {
    if (storyInProgress) {
        event.preventDefault();
        return 'Are you sure you want to leave? All progress will be lost.';
    }
});