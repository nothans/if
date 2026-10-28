// AI Providers
// Default and suggested models per provider. Suggestions populate the model picker;
// "Load available models" in settings replaces them with the provider's live list.
const PROVIDERS = {
    openai: {
        defaultModel: 'gpt-6.1-sol',
        suggestedModels: ['gpt-6.1-sol', 'gpt-6-luna'],
        modelLabel: 'OpenAI model',
    },
    anthropic: {
        defaultModel: 'claude-opus-5-5',
        suggestedModels: ['claude-opus-5-5', 'claude-sonnet-5-5', 'claude-haiku-5-5', 'claude-fable-5-1'],
        modelLabel: 'Claude model',
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
        modelLabel: 'OpenRouter model',
    },
    azure: {
        defaultModel: '',
        suggestedModels: [],
        modelLabel: 'Azure deployment name (required for /openai/v1/ endpoints)',
    },
    ollama: {
        // Whatever the user has pulled; "Load available models" fills it in.
        defaultModel: '',
        suggestedModels: [],
        modelLabel: 'Ollama model',
    },
};

// Models that were hardcoded defaults in v1.0.x; saved settings holding these are upgraded.
const LEGACY_DEFAULT_MODELS = ['gpt-4o', 'openai/gpt-4o'];

const ANTHROPIC_API_VERSION = '2026-10-21';
// Claude models that accept server-side refusal fallbacks (fallbacks: "default").
const ANTHROPIC_FALLBACK_MODELS = ['claude-fable-5-1', 'claude-opus-5-5', 'claude-opus-5', 'claude-sonnet-5-5'];
// Claude models that accept output_config.effort.
const ANTHROPIC_EFFORT_MODEL_PATTERN = /^claude-(fable|mythos|opus|sonnet|haiku)-5|^claude-opus-4-[5-8]|^claude-sonnet-4-6/;

const REQUEST_TIMEOUT_MS = 180000;

const OLLAMA_DEFAULT_URL = 'http://localhost:11434';

// Speech
// Every engine produces 24 kHz mono audio, played through one Web Audio queue.
const SPEECH_ENGINES = ['off', 'browser', 'openai', 'ollama'];
const SPEECH_SAMPLE_RATE = 24000;
// OpenAI and Ollama cap one speech request at 4,096 characters.
const SPEECH_MAX_CHARS = 4000;
const TTS_MODEL = 'gpt-4o-mini-tts';
const OPENAI_VOICES = ['alloy', 'ash', 'ballad', 'coral', 'echo', 'fable', 'nova', 'onyx', 'sage', 'shimmer', 'verse'];
// Ollama's speech model is Gradium's Phonon, which Ollama runs only on Apple Silicon.
const OLLAMA_SPEECH_MODEL = 'phonon';
// The built-in voice: Phonon 31M English (Apache 2.0) on the phonon-tts runtime, served from
// assets/vendor/phonon-tts so its worker shares the page's origin; the wasm builds come from
// jsDelivr. The model and voice catalog are pinned to commits.
const PHONON_RUNTIME_URL = 'assets/vendor/phonon-tts/index.js';
const PHONON_WASM_URL = 'https://cdn.jsdelivr.net/npm/phonon-tts@0.4.0/wasm/';
const PHONON_MODEL = 'hf://gradium/phonon-31m-en@92741c5b07d085ff840e26fea8ce43110b87852f';
const PHONON_VOICES_URL = 'https://huggingface.co/gradium/phonon-voices/resolve/0ee17205f254b5abc43b266c8a0f215565c352f7/';
const DEFAULT_PHONON_VOICE = 'Miles';
const DEFAULT_VOICES = { openai: 'onyx', browser: DEFAULT_PHONON_VOICE, ollama: DEFAULT_PHONON_VOICE };

// Settings Management
let aiService = 'openai';
let openaiKey = '';
let anthropicKey = '';
let azureEndpoint = '';
let azureKey = '';
let openrouterKey = '';
let ollamaUrl = OLLAMA_DEFAULT_URL;
let models = {};
let draftModels = {};
let speechEngine = 'off';
let speechVoices = { ...DEFAULT_VOICES };
let draftVoices = { ...DEFAULT_VOICES };
let writingStyle = '';
let storyInProgress = false;

// Loaded on first use; declared here because the settings form lists voices at startup.
let phononPromise = null;
let phononVoiceCatalogPromise = null;
const phononVoicePromises = new Map();

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
    ollamaUrl = settings.ollamaUrl || OLLAMA_DEFAULT_URL;
    models = resolveModels(settings);
    draftModels = { ...models };
    // v1.1 and earlier had one OpenAI-only switch (ttsEnabled) and voice (ttsVoice).
    speechEngine = SPEECH_ENGINES.includes(settings.speechEngine)
        ? settings.speechEngine
        : (settings.ttsEnabled ? 'openai' : 'off');
    speechVoices = { ...DEFAULT_VOICES, ...(settings.ttsVoice ? { openai: settings.ttsVoice } : {}), ...settings.speechVoices };
    draftVoices = { ...speechVoices };
    writingStyle = settings.writingStyle || '';

    document.getElementById('ai-service-select').value = aiService;
    document.getElementById('openai-key-input').value = openaiKey;
    document.getElementById('anthropic-key-input').value = anthropicKey;
    document.getElementById('azure-endpoint-input').value = azureEndpoint;
    document.getElementById('azure-key-input').value = azureKey;
    document.getElementById('openrouter-key-input').value = openrouterKey;
    document.getElementById('ollama-url-input').value = ollamaUrl;
    document.getElementById('speech-engine-select').value = speechEngine;
    document.getElementById('writing-style-input').value = writingStyle;

    updateSettingsModal();
}

// The settings form shows the choices being made; they take effect on Save.
function selectedService() {
    return document.getElementById('ai-service-select').value;
}

function selectedSpeechEngine() {
    return document.getElementById('speech-engine-select').value;
}

function updateSettingsModal() {
    const service = selectedService();
    const engine = selectedSpeechEngine();
    const show = (id, visible) => {
        document.getElementById(id).style.display = visible ? 'block' : 'none';
    };
    show('openai-settings-group', service === 'openai' || engine === 'openai');
    show('anthropic-settings-group', service === 'anthropic');
    show('azure-settings-group', service === 'azure');
    show('openrouter-settings-group', service === 'openrouter');
    show('ollama-settings-group', service === 'ollama' || engine === 'ollama');
    show('voice-selection-group', engine !== 'off');
    updateModelPicker();
    updateVoicePicker();
}

function updateModelPicker() {
    const service = selectedService();
    const provider = PROVIDERS[service];
    document.getElementById('model-label').textContent = provider.modelLabel;
    document.getElementById('model-input').value = draftModels[service] || '';
    document.getElementById('model-input').placeholder = provider.defaultModel || (service === 'ollama' ? 'Load available models to pick one' : 'Enter a model or deployment name');
    document.getElementById('refresh-models-button').style.display = service === 'azure' ? 'none' : 'inline-block';
    document.getElementById('model-list-status').textContent = '';
    setModelOptions(provider.suggestedModels);
}

async function updateVoicePicker() {
    const engine = selectedSpeechEngine();
    const select = document.getElementById('voice-select');
    const status = document.getElementById('speech-status');
    status.textContent = engine === 'browser' ? 'Downloads a 65 MB voice model once, then runs on this device.' : '';
    if (engine === 'off') return;

    let voices;
    if (engine === 'openai') {
        voices = OPENAI_VOICES.map(id => ({ id, label: id.charAt(0).toUpperCase() + id.slice(1) }));
    } else {
        // Ollama's phonon and the built-in voice both use Gradium's voice catalog.
        try {
            voices = (await loadPhononVoiceCatalog()).map(voice => ({ id: voice.name, label: voice.label }));
        } catch (error) {
            console.error('Error loading the voice catalog:', error);
            voices = [{ id: draftVoices[engine], label: draftVoices[engine] }];
        }
        if (selectedSpeechEngine() !== engine) return;
    }
    select.innerHTML = '';
    voices.forEach(voice => select.appendChild(new Option(voice.label, voice.id)));
    select.value = voices.some(voice => voice.id === draftVoices[engine]) ? draftVoices[engine] : voices[0].id;
    draftVoices[engine] = select.value;
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

// Screens and controls
const startScreen = document.getElementById('start-screen');
const startButtons = document.querySelectorAll('#start-buttons button');
const gameContainer = document.getElementById('game-container');
const siteFooter = document.getElementById('site-footer');
const bookTitle = document.getElementById('book-title');
const storyDiv = document.getElementById('story');
const writingIndicator = document.getElementById('writing');
const writingNote = document.getElementById('writing-note');
const optionsDiv = document.getElementById('options');
const turnControls = document.getElementById('options-and-input');
const inputArea = document.getElementById('input-area');
const userInput = document.getElementById('user-input');
const submitButton = document.getElementById('submit-button');
const endStoryButton = document.getElementById('end-story-button');
const endConfirm = document.getElementById('end-confirm');
const voiceStopButton = document.getElementById('voice-stop-button');
const turnError = document.getElementById('turn-error');
const turnErrorText = document.getElementById('turn-error-text');
const endingSection = document.getElementById('ending');
const restartButton = document.getElementById('restart-button');
const newStoryButton = document.getElementById('new-story-button');
const settingsIcon = document.getElementById('settings-icon');
const settingsModal = document.getElementById('settings-modal');
const saveSettingsButton = document.getElementById('save-settings-button');
const savedStoriesModal = document.getElementById('saved-stories-modal');
const storyViewModal = document.getElementById('story-view-modal');

// Game State
let gameState = {
    location: '',
    history: [],
    seedIdea: '',
    storyTitle: '',
    lastIcon: '',
    // Each turn as shown: { text, iconClass, location, command }.
    storyContent: [],
    // Conversation transcript sent to the model: alternating user prompts and assistant JSON replies.
    messages: [],
};

const SERVICE_NAMES = { openai: 'OpenAI', anthropic: 'Claude', openrouter: 'OpenRouter', azure: 'Azure OpenAI', ollama: 'Ollama' };

// Initialize Settings on Startup
loadSettings();
updateSetupLine();

// Utility Functions
function validateIcon(iconName) {
    return validIcons.includes(iconName) ? iconName : 'help_outline';
}

function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
}

function iconElement(name, className) {
    const icon = element('span', `material-symbols-outlined ${className || ''}`.trim(), name);
    icon.setAttribute('aria-hidden', 'true');
    return icon;
}

function hasCredentials() {
    if (aiService === 'ollama') return true;
    if (aiService === 'anthropic') return Boolean(anthropicKey);
    if (aiService === 'openrouter') return Boolean(openrouterKey);
    if (aiService === 'azure') return Boolean(azureEndpoint && azureKey);
    return Boolean(openaiKey);
}

function modelDescription() {
    const model = models[aiService];
    if (aiService === 'ollama') return model ? `${model} on this computer` : 'Ollama on this computer';
    return model ? `${model} (${SERVICE_NAMES[aiService]})` : SERVICE_NAMES[aiService];
}

// The line under the lede: who writes the story and who reads it, with a way to change both.
function updateSetupLine() {
    const line = document.getElementById('setup-line');
    line.textContent = '';
    if (hasCredentials()) {
        line.append('Stories by ', element('b', '', modelDescription()), '. ');
        if (speechEngine === 'off') {
            line.append('Reading aloud is off. ');
        } else {
            const voice = speechEngine === 'openai' ? speechVoices.openai.charAt(0).toUpperCase() + speechVoices.openai.slice(1) : speechVoices[speechEngine];
            line.append('Read aloud by ', element('b', '', voice), '. ');
        }
    } else {
        line.append('Add an API key for OpenAI, Claude, or OpenRouter, or run a model on your computer with Ollama. ');
    }
    const change = element('button', 'link-button', hasCredentials() ? 'Change' : 'Open settings');
    change.type = 'button';
    change.addEventListener('click', () => openSettings());
    line.append(change);
}

// The transcript
function paragraphsOf(text) {
    return String(text || '').split(/\n\s*\n/).map(part => part.trim()).filter(Boolean);
}

// Models mark emphasis Markdown-style (*a ship's name*, **a warning**); show it as emphasis,
// built from text nodes so nothing in the model's text is ever parsed as HTML.
function withEmphasis(text) {
    const paragraph = element('p');
    const pattern = /\*\*([^*\n]+)\*\*|\*([^*\n]+)\*/g;
    let last = 0;
    for (const match of text.matchAll(pattern)) {
        paragraph.append(text.slice(last, match.index));
        paragraph.append(match[1] !== undefined ? element('strong', '', match[1]) : element('em', '', match[2]));
        last = match.index + match[0].length;
    }
    paragraph.append(text.slice(last));
    return paragraph;
}

function commandEcho(command) {
    const line = element('p', 'command-echo');
    const prompt = element('span', 'prompt', '>');
    prompt.setAttribute('aria-hidden', 'true');
    line.append(prompt, ` ${command}`);
    return line;
}

// One passage: the model's icon in the gutter, the place it named (when the player has moved),
// then the prose. Text only, never HTML: it comes from a model.
function renderPassage(segment, { showRoom = true, headingTag = 'h2' } = {}) {
    const article = element('article', 'passage');
    const icon = validateIcon(segment.iconClass);
    // A made-up icon name would show as a question mark in the margin; leave the margin empty.
    if (icon !== 'help_outline') article.append(iconElement(icon, 'passage-icon'));
    if (showRoom && segment.location) {
        article.append(element(headingTag, 'room', segment.location));
    }
    const prose = element('div', 'prose');
    paragraphsOf(segment.text).forEach(paragraph => prose.append(withEmphasis(paragraph)));
    article.append(prose);
    return article;
}

function renderTranscript(list, segments, headingTag) {
    list.textContent = '';
    let shownLocation = '';
    segments.forEach(segment => {
        const turn = element('li', 'turn');
        if (segment.command) turn.append(commandEcho(segment.command));
        turn.append(renderPassage(segment, { showRoom: segment.location !== shownLocation, headingTag }));
        if (segment.location) shownLocation = segment.location;
        list.append(turn);
    });
}

// Status line under the story, for the voice and for Ollama
let statusTimer = null;

function showStatus(text, clearAfterMs = 0) {
    const element = document.getElementById('status-message');
    clearTimeout(statusTimer);
    element.textContent = text;
    if (clearAfterMs) {
        statusTimer = setTimeout(() => { element.textContent = ''; }, clearAfterMs);
    }
}

// Speech playback
// Each engine yields Float32 chunks; they are scheduled back to back on one AudioContext,
// so speech starts with the first chunk instead of after the whole segment.
const speech = { context: null, nextTime: 0, sources: new Set(), controller: null };

function audioContext() {
    if (!speech.context) {
        try {
            // At the voices' own rate, chunk edges join without clicks.
            speech.context = new AudioContext({ sampleRate: SPEECH_SAMPLE_RATE });
        } catch (e) {
            speech.context = new AudioContext();
        }
    }
    if (speech.context.state === 'suspended') {
        speech.context.resume().catch(() => {});
    }
    return speech.context;
}

// Browsers only start audio after a user gesture; every click in the game is one.
document.addEventListener('pointerdown', () => {
    if (speechEngine !== 'off') audioContext();
}, { capture: true });

function stopSpeech() {
    if (speech.controller) {
        speech.controller.abort();
        speech.controller = null;
    }
    speech.sources.forEach(source => {
        try { source.stop(); } catch (e) { /* already stopped */ }
    });
    speech.sources.clear();
    speech.nextTime = 0;
    setSpeaking(false);
}

function playChunk(samples) {
    const context = audioContext();
    const buffer = context.createBuffer(1, samples.length, SPEECH_SAMPLE_RATE);
    buffer.getChannelData(0).set(samples);
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(context.destination);
    source.onended = () => {
        speech.sources.delete(source);
        if (speech.sources.size === 0) setSpeaking(false);
    };
    const startAt = Math.max(speech.nextTime, context.currentTime + 0.05);
    source.start(startAt);
    speech.nextTime = startAt + buffer.duration;
    speech.sources.add(source);
    setSpeaking(true);
}

async function speak(text) {
    stopSpeech();
    if (speechEngine === 'off' || !text.trim()) return;
    const controller = new AbortController();
    speech.controller = controller;
    try {
        for await (const samples of speechChunks(text, controller.signal)) {
            if (controller.signal.aborted) return;
            if (samples.length) playChunk(samples);
        }
    } catch (error) {
        if (controller.signal.aborted) return;
        console.error('Speech error:', error);
        showStatus(speechErrorMessage(error), 15000);
    }
}

function speechChunks(text, signal) {
    if (speechEngine === 'browser') {
        return browserSpeech(text, signal);
    }
    if (speechEngine === 'ollama') {
        return pcmSpeech(`${ollamaBase()}/v1/audio/speech`, {}, {
            model: OLLAMA_SPEECH_MODEL,
            voice: speechVoices.ollama,
            response_format: 'pcm',
        }, text, signal);
    }
    return pcmSpeech('https://api.openai.com/v1/audio/speech', { 'Authorization': 'Bearer ' + openaiKey }, {
        model: TTS_MODEL,
        voice: speechVoices.openai,
        instructions: `Narrate like an engaging audiobook reader of interactive fiction. ${writingStyle ? `Match this writing style: ${writingStyle}` : ''}`.trim(),
        response_format: 'pcm',
    }, text, signal);
}

// Split long text at sentence ends so each request stays under the speech APIs' limit.
function splitForSpeech(text) {
    const pieces = [];
    let current = '';
    for (const sentence of text.match(/[^.!?]+[.!?]*\s*/g) || [text]) {
        if (current && current.length + sentence.length > SPEECH_MAX_CHARS) {
            pieces.push(current);
            current = '';
        }
        current += sentence;
        while (current.length > SPEECH_MAX_CHARS) {
            pieces.push(current.slice(0, SPEECH_MAX_CHARS));
            current = current.slice(SPEECH_MAX_CHARS);
        }
    }
    if (current.trim()) pieces.push(current);
    return pieces;
}

// OpenAI and Ollama stream raw 16-bit little-endian mono PCM at 24 kHz.
async function* pcmSpeech(url, headers, body, text, signal) {
    for (const input of splitForSpeech(text)) {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...headers },
            body: JSON.stringify({ ...body, input }),
            signal,
        });
        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            const detail = data.error && (data.error.message || data.error);
            const error = new Error(typeof detail === 'string' ? detail : `request failed with status ${response.status}`);
            error.status = response.status;
            throw error;
        }
        const reader = response.body.getReader();
        let carry = null;
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            let bytes = value;
            if (carry) {
                bytes = new Uint8Array(carry.length + value.length);
                bytes.set(carry);
                bytes.set(value, carry.length);
                carry = null;
            }
            // A sample can straddle two network chunks; keep its first byte for the next one.
            const usable = bytes.length - (bytes.length % 2);
            if (usable < bytes.length) carry = bytes.slice(usable);
            const view = new DataView(bytes.buffer, bytes.byteOffset, usable);
            const samples = new Float32Array(usable / 2);
            for (let i = 0; i < samples.length; i++) {
                samples[i] = view.getInt16(i * 2, true) / 32768;
            }
            yield samples;
        }
    }
}

// The built-in voice: Phonon in a Web Worker, on the GPU through WebGPU when the browser has it.
function loadPhononVoiceCatalog() {
    if (!phononVoiceCatalogPromise) {
        phononVoiceCatalogPromise = fetch(PHONON_VOICES_URL + 'voices.jsonl')
            .then(response => {
                if (!response.ok) throw new Error(`voice catalog request failed with status ${response.status}`);
                return response.text();
            })
            .then(text => text.split('\n').filter(line => line.trim()).map(line => JSON.parse(line))
                .filter(voice => voice.language === 'en')
                .map(voice => {
                    const accent = voice.locale === 'en-gb' ? 'British' : 'American';
                    const details = [accent, voice.gender].filter(Boolean).join(', ');
                    return { name: voice.name, file: voice.filename, label: `${voice.name} (${details})` };
                }));
        phononVoiceCatalogPromise.catch(() => { phononVoiceCatalogPromise = null; });
    }
    return phononVoiceCatalogPromise;
}

function loadPhonon() {
    if (!phononPromise) {
        const progress = new Map();
        const onProgress = ({ file, loaded, total }) => {
            progress.set(file, { loaded, total: total || loaded });
            let done = 0;
            let all = 0;
            progress.forEach(entry => { done += entry.loaded; all += entry.total; });
            if (all > 5e6 && done < all) {
                showStatus(`Loading the built-in voice: ${Math.round(done / 1e6)} of ${Math.round(all / 1e6)} MB (first time only).`);
            }
        };
        phononPromise = import(new URL(PHONON_RUNTIME_URL, document.baseURI).href)
            .then(({ PhononTTS }) => PhononTTS.load({
                lang: 'en',
                model: PHONON_MODEL,
                device: 'auto',
                wasmUrl: PHONON_WASM_URL + 'phonon_tts_bg.wasm',
                simdWasmUrl: PHONON_WASM_URL + 'phonon_tts_simd_bg.wasm',
                onProgress,
            }))
            .then(tts => {
                showStatus('');
                console.info(`Built-in voice on ${tts.device} (${tts.deviceReason})`);
                return tts;
            });
        phononPromise.catch(() => { phononPromise = null; });
    }
    return phononPromise;
}

async function phononVoice(tts, name) {
    if (!phononVoicePromises.has(name)) {
        const promise = loadPhononVoiceCatalog().then(catalog => {
            const voice = catalog.find(entry => entry.name === name);
            if (!voice) return undefined;  // the model's own voice
            return tts.addVoice(name, PHONON_VOICES_URL + voice.file).then(() => name);
        });
        promise.catch(() => phononVoicePromises.delete(name));
        phononVoicePromises.set(name, promise);
    }
    return phononVoicePromises.get(name);
}

async function* browserSpeech(text, signal) {
    const tts = await loadPhonon();
    const voice = await phononVoice(tts, speechVoices.browser);
    if (signal.aborted) return;
    yield* tts.stream(text, { voice, signal });
}

function speechErrorMessage(error) {
    const message = error && error.message ? error.message : String(error);
    if (speechEngine === 'ollama') {
        if (error instanceof TypeError) return `Voice: ${ollamaConnectionHelp()}`;
        if (error.status === 404 || /not found/i.test(message)) {
            return "Voice: Ollama's voice model isn't installed. It runs only on Apple Silicon Macs: run \"ollama pull phonon\" there, or pick the built-in voice in Settings.";
        }
        return `Voice: Ollama could not speak (${message}).`;
    }
    if (speechEngine === 'browser') return `Voice: the built-in voice could not start (${message}).`;
    return `Voice: OpenAI could not speak (${message}).`;
}

// Your move: numbered choices (press the number) and the command line
function displayOptions(options) {
    optionsDiv.textContent = '';
    options.slice(0, 9).forEach((option, index) => {
        const icon = validateIcon(option.icon || 'help_outline');
        const button = element('button');
        button.type = 'button';
        button.append(element('kbd', '', String(index + 1)));
        // A made-up icon name would show as a question mark; leave it out instead.
        if (icon !== 'help_outline') button.append(iconElement(icon));
        button.append(element('span', '', option.text));
        button.addEventListener('click', () => chooseOption(option.text, icon));
        const item = element('li');
        item.append(button);
        optionsDiv.append(item);
    });
}

function chooseOption(optionText, optionIcon) {
    gameState.lastIcon = optionIcon || 'help_outline';
    runTurn({ command: optionText, userChoice: optionText, userIcon: optionIcon });
}

function setWriting(on) {
    writingIndicator.hidden = !on;
    writingNote.textContent = on ? `${modelDescription()} is writing the next passage.` : '';
    optionsDiv.hidden = on;
    optionsDiv.querySelectorAll('button').forEach(button => { button.disabled = on; });
    userInput.disabled = on;
    submitButton.disabled = on;
    endStoryButton.disabled = on;
}

function setSpeaking(on) {
    voiceStopButton.hidden = !on;
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
        location: { type: 'string', description: "A short name for the place the player is now, two to five words, like 'The flooded cellar'." },
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
  "location": "A short name for where the player is now, two to five words"
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
    if (aiService === 'ollama') {
        if (!models.ollama) {
            throw new Error('Choose an Ollama model in Settings. "Load available models" lists the ones you have pulled.');
        }
        return {
            endpoint: `${ollamaBase()}/v1/chat/completions`,
            headers: {},
            model: models.ollama,
            // Thinking models such as Qwen 3.5 spend most of a turn reasoning first (41 s
            // against 4 s for one turn on an RTX 3060 Ti); a story turn doesn't need it.
            // Models that don't think ignore this.
            extraBody: { reasoning_effort: 'none' },
        };
    }
    return null;
}

function ollamaBase() {
    return (ollamaUrl || OLLAMA_DEFAULT_URL).trim().replace(/\/+$/, '');
}

function isLocalPage() {
    return ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
}

// A page on the web reaches Ollama only if Ollama allows its origin and the browser
// allows the page to reach this computer; a page served from localhost needs neither.
function ollamaConnectionHelp() {
    let help = `Could not reach Ollama at ${ollamaBase()}. Make sure Ollama is running.`;
    if (!isLocalPage()) {
        help += ` To use it from ${location.origin}, set the OLLAMA_ORIGINS environment variable to ${location.origin}, restart Ollama, and allow this site to access devices on your local network if your browser asks.`;
    }
    return help;
}

// Chrome asks before a website may reach this computer, and holds the request until then.
async function noteLocalNetworkPrompt() {
    if (isLocalPage() || !navigator.permissions) return;
    try {
        const permission = await navigator.permissions.query({ name: 'local-network-access' });
        if (permission.state === 'prompt') {
            showStatus('Your browser will ask to let this site reach Ollama on this computer. Choose Allow.', 30000);
        } else if (permission.state === 'denied') {
            showStatus('This site is blocked from reaching Ollama on this computer. Allow "Local network access" in the site settings (the icon left of the address), then try again.');
        }
    } catch (e) {
        // Browsers without this permission let the request through without asking.
    }
}

async function requestChatCompletion(config, systemPrompt, messages) {
    const data = await withSchemaFallback(useSchema => {
        const body = {
            messages: [{ role: 'system', content: systemPrompt }, ...messages],
        };
        if (config.model) {
            body.model = config.model;
        }
        Object.assign(body, config.extraBody);
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
// Ask the model for the next turn and return its story JSON; the conversation transcript
// grows only when the turn succeeds.
async function requestStoryTurn(userChoice, endStory, userIcon) {
    const systemPrompt = buildSystemPrompt();
    const userMessage = { role: 'user', content: buildUserPrompt(userChoice, endStory, userIcon) };
    const messages = [...gameState.messages, userMessage];

    if (aiService === 'ollama') {
        await noteLocalNetworkPrompt();
    }
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
    return response;
}

// One turn: echo the player's move, show where the next passage will go, then fill it in.
// A turn that fails leaves no trace in the story, so "Try again" asks the same question.
async function runTurn(turn) {
    turnError.hidden = true;
    endConfirm.hidden = true;
    const item = element('li', 'turn');
    if (turn.command) {
        item.append(commandEcho(turn.command));
        storyDiv.append(item);
    }
    setWriting(true);
    try {
        const response = await requestStoryTurn(turn.userChoice || '', Boolean(turn.endStory), turn.userIcon || '');
        if (aiService === 'ollama' && /Ollama on this computer/.test(document.getElementById('status-message').textContent)) {
            showStatus('');
        }
        setWriting(false);
        presentTurn(item, response, turn);
    } catch (error) {
        console.error('AI service error:', error);
        setWriting(false);
        item.remove();
        showTurnError(error, turn);
    }
}

function presentTurn(item, response, turn) {
    const segment = {
        text: response.description || '',
        iconClass: validateIcon(response.icon),
        location: (response.location || '').trim(),
        command: turn.command || '',
    };
    gameState.storyTitle = (response.storyTitle || '').trim() || gameState.storyTitle || gameState.seedIdea;
    bookTitle.textContent = gameState.storyTitle;
    document.title = `${gameState.storyTitle}: Infinite IF`;

    item.append(renderPassage(segment, { showRoom: segment.location !== gameState.location }));
    if (!item.isConnected) storyDiv.append(item);
    item.classList.add('arrive');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    item.scrollIntoView({ block: 'start', behavior: reduced ? 'auto' : 'smooth' });
    speak(segment.text);

    gameState.storyContent.push(segment);
    if (turn.command) gameState.history.push(turn.command);
    if (segment.location) gameState.location = segment.location;
    storyInProgress = true;

    if (turn.endStory) {
        finishStory();
    } else {
        displayOptions(Array.isArray(response.options) ? response.options : []);
        if (window.matchMedia('(pointer: fine)').matches) userInput.focus({ preventScroll: true });
    }
}

function turnErrorMessage(error) {
    if (error && error.name === 'TimeoutError') return 'the AI service took too long to respond.';
    if (aiService === 'ollama' && error instanceof TypeError) return ollamaConnectionHelp();
    if (error instanceof SyntaxError) return 'the AI service returned a response that could not be read.';
    return error && error.message ? error.message : 'something went wrong.';
}

let failedTurn = null;

function showTurnError(error, turn) {
    failedTurn = turn;
    turnErrorText.textContent = turnErrorMessage(error);
    // Before the first passage there is no story to go back to.
    document.getElementById('error-home-button').hidden = gameState.storyContent.length > 0;
    turnError.hidden = false;
    turnError.scrollIntoView({ block: 'nearest' });
}

function finishStory() {
    const story = {
        title: gameState.storyTitle || gameState.seedIdea,
        date: new Date().toISOString(),
        content: gameState.storyContent,
        seedIdea: gameState.seedIdea,
        writingStyle: writingStyle,
    };
    const savedStories = JSON.parse(localStorage.getItem('infinite-if-stories')) || [];
    savedStories.push(story);
    localStorage.setItem('infinite-if-stories', JSON.stringify(savedStories));

    storyInProgress = false;
    optionsDiv.textContent = '';
    turnControls.hidden = true;
    endingSection.hidden = false;
}

// Event Listeners

// Dialogs: the close button, a click on the backdrop, and Escape (native) all close them.
document.querySelectorAll('dialog').forEach(dialog => {
    dialog.querySelectorAll('.close').forEach(button => button.addEventListener('click', () => dialog.close()));
    dialog.addEventListener('click', event => {
        if (event.target === dialog) dialog.close();
    });
});

function openSettings(note) {
    loadSettings();  // drop any changes from a previous visit that were not saved
    document.getElementById('settings-note').textContent = note || '';
    if (!settingsModal.open) settingsModal.showModal();
}

settingsIcon.addEventListener('click', () => openSettings());

// Starting a story
function startStory(seed, icon) {
    if (!hasCredentials()) {
        openSettings(`To begin, add an API key for ${SERVICE_NAMES[aiService]}, or choose Ollama to run a model on your computer.`);
        return;
    }
    gameState = { location: '', history: [], seedIdea: seed, storyTitle: '', lastIcon: icon, storyContent: [], messages: [] };
    startScreen.hidden = true;
    siteFooter.hidden = true;
    gameContainer.hidden = false;
    newStoryButton.hidden = false;
    turnControls.hidden = false;
    endingSection.hidden = true;
    turnError.hidden = true;
    bookTitle.textContent = seed;
    document.title = `${seed}: Infinite IF`;
    storyDiv.textContent = '';
    optionsDiv.textContent = '';
    window.scrollTo(0, 0);
    warmUpVoice();
    runTurn({ command: '', userChoice: '', userIcon: icon });
}

startButtons.forEach(button => {
    button.addEventListener('click', () => startStory(button.dataset.seed, button.dataset.icon || 'help_outline'));
});

document.getElementById('custom-seed-form').addEventListener('submit', event => {
    event.preventDefault();
    const seed = document.getElementById('custom-seed-input').value.trim();
    if (seed) startStory(seed, 'edit');
});

// Typing a move
inputArea.addEventListener('submit', event => {
    event.preventDefault();
    const input = userInput.value.trim();
    if (!input || userInput.disabled) return;
    gameState.lastIcon = '';
    userInput.value = '';
    runTurn({ command: input, userChoice: input, userIcon: '' });
});

// Press 1 to 9 to take a choice, unless typing somewhere.
document.addEventListener('keydown', event => {
    if (gameContainer.hidden || event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.target.closest('input, textarea, select, dialog')) return;
    if (!/^[1-9]$/.test(event.key)) return;
    const button = optionsDiv.querySelectorAll('button')[Number(event.key) - 1];
    if (button && !button.disabled) {
        event.preventDefault();
        button.click();
    }
});

// Ending the story: confirm in place, then ask for an ending.
endStoryButton.addEventListener('click', () => {
    endConfirm.hidden = false;
    document.getElementById('end-confirm-yes').focus();
});

document.getElementById('end-confirm-no').addEventListener('click', () => {
    endConfirm.hidden = true;
    endStoryButton.focus();
});

document.getElementById('end-confirm-yes').addEventListener('click', () => {
    runTurn({ command: 'End the story', userChoice: 'End the story', endStory: true, userIcon: 'wb_twilight' });
});

document.getElementById('retry-button').addEventListener('click', () => {
    if (failedTurn) runTurn(failedTurn);
});

document.getElementById('error-home-button').addEventListener('click', () => location.reload());

voiceStopButton.addEventListener('click', stopSpeech);

// Leaving the story
restartButton.addEventListener('click', reloadApp);
newStoryButton.addEventListener('click', reloadApp);
document.getElementById('nav-home-link').addEventListener('click', reloadApp);
document.getElementById('ending-library-button').addEventListener('click', () => openLibrary());

function reloadApp(event) {
    if (event) {
        event.preventDefault();
    }
    if (storyInProgress && !confirm('Start over? This story has not been saved; end it to keep it in your library.')) {
        return;
    }
    storyInProgress = false;
    location.reload();
}

// Settings
document.getElementById('ai-service-select').addEventListener('change', function() {
    updateSettingsModal();
    // Ollama's models are whatever this computer has; list them right away.
    if (this.value === 'ollama' && !draftModels.ollama) {
        document.getElementById('refresh-models-button').click();
    }
});

document.getElementById('model-input').addEventListener('input', function() {
    draftModels[selectedService()] = this.value;
});

document.getElementById('speech-engine-select').addEventListener('change', updateSettingsModal);

document.getElementById('voice-select').addEventListener('change', function() {
    draftVoices[selectedSpeechEngine()] = this.value;
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
        // Newest first, so current models lead the list.
        return data.data
            .filter(model => /^(gpt-|o\d|chatgpt-)/.test(model.id) && !nonChat.test(model.id))
            .sort((a, b) => (b.created || 0) - (a.created || 0))
            .map(model => model.id);
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
    if (provider === 'ollama') {
        const base = (document.getElementById('ollama-url-input').value.trim() || OLLAMA_DEFAULT_URL).replace(/\/+$/, '');
        const data = await getJSON(`${base}/v1/models`, {});
        // The speech model and embedding models can't write a story.
        return data.data
            .map(model => model.id)
            .filter(id => !/^phonon(:|$)/.test(id) && !/embed/i.test(id));
    }
    return [];
}

document.getElementById('refresh-models-button').addEventListener('click', async function() {
    const provider = selectedService();
    const status = document.getElementById('model-list-status');
    const input = document.getElementById('model-input');
    status.textContent = 'Loading models...';
    this.disabled = true;
    try {
        const modelIds = await fetchAvailableModels(provider);
        if (provider !== selectedService()) return;
        setModelOptions(modelIds);
        if (provider === 'ollama' && modelIds.length === 0) {
            status.textContent = 'Ollama has no chat models yet. Pull one (for example "ollama pull qwen3.5:9b") and load again.';
            return;
        }
        if (provider === 'ollama' && !input.value.trim()) {
            input.value = modelIds[0];
            draftModels.ollama = modelIds[0];
        }
        status.textContent = `${modelIds.length} models available. Clear the field to browse them.`;
    } catch (error) {
        console.error('Error loading models:', error);
        if (provider === selectedService()) {
            status.textContent = provider === 'ollama' && error instanceof TypeError
                ? ollamaConnectionHelp()
                : `Could not load models: ${error.message}`;
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
    const ollamaUrl = document.getElementById('ollama-url-input').value.trim().replace(/\/+$/, '') || OLLAMA_DEFAULT_URL;
    const speechEngine = selectedSpeechEngine();
    const writingStyleInput = document.getElementById('writing-style-input').value.trim() || '';

    draftModels[aiService] = document.getElementById('model-input').value;
    const savedModels = {};
    Object.keys(PROVIDERS).forEach(provider => {
        savedModels[provider] = (draftModels[provider] || '').trim();
    });
    if (speechEngine !== 'off') {
        draftVoices[speechEngine] = document.getElementById('voice-select').value || draftVoices[speechEngine];
    }

    saveSettings({ aiService, openaiKey, anthropicKey, azureEndpoint, azureKey, openrouterKey, ollamaUrl, models: savedModels, speechEngine, speechVoices: { ...draftVoices }, writingStyle: writingStyleInput });
    settingsModal.close();
    updateSetupLine();
    warmUpVoice();
}

// Start loading the built-in voice while the first story segment is being written.
function warmUpVoice() {
    if (speechEngine === 'browser') {
        loadPhonon().catch(error => showStatus(speechErrorMessage(error), 15000));
    }
}

// Library: finished stories, newest first
function readSavedStories() {
    try {
        return JSON.parse(localStorage.getItem('infinite-if-stories')) || [];
    } catch (e) {
        return [];
    }
}

const relativeTime = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });

function timeAgo(isoDate) {
    const seconds = (new Date(isoDate).getTime() - Date.now()) / 1000;
    if (!Number.isFinite(seconds)) return '';
    const steps = [['year', 31536000], ['month', 2592000], ['week', 604800], ['day', 86400], ['hour', 3600], ['minute', 60]];
    for (const [unit, size] of steps) {
        if (Math.abs(seconds) >= size) return relativeTime.format(Math.round(seconds / size), unit);
    }
    return relativeTime.format(0, 'minute');
}

function openLibrary() {
    displaySavedStories();
    if (storyViewModal.open) storyViewModal.close();
    if (!savedStoriesModal.open) savedStoriesModal.showModal();
}

document.getElementById('saved-stories-icon').addEventListener('click', openLibrary);

function displaySavedStories() {
    const container = document.getElementById('saved-stories-list');
    container.textContent = '';
    const savedStories = readSavedStories();

    if (savedStories.length === 0) {
        const empty = element('div', 'library-empty');
        empty.append(element('p', '', 'Finished stories are kept here, in this browser. Play a few turns, then choose "End the story" to add one.'));
        const begin = element('button', 'button-primary', 'Start a story');
        begin.type = 'button';
        begin.addEventListener('click', () => {
            savedStoriesModal.close();
            if (gameContainer.hidden) document.querySelector('#start-buttons button').focus();
        });
        empty.append(begin);
        container.append(empty);
        return;
    }

    const list = element('ul', 'library-list');
    savedStories
        .map((story, index) => ({ story, index }))
        .sort((a, b) => new Date(b.story.date) - new Date(a.story.date))
        .forEach(({ story, index }) => {
            const item = element('li', 'book');
            const passages = (story.content || []).length;
            const meta = [story.seedIdea, `${passages} ${passages === 1 ? 'passage' : 'passages'}`, `finished ${timeAgo(story.date)}`]
                .filter(Boolean).join(', ');
            item.append(element('h3', '', story.title || story.seedIdea || 'Untitled'), element('p', 'book-meta', meta));
            const actions = element('div', 'button-row');
            const read = element('button', 'button-quiet view-story', 'Read');
            read.type = 'button';
            read.addEventListener('click', () => viewStory(index));
            const remove = element('button', 'button-quiet delete-story', 'Delete');
            remove.type = 'button';
            remove.setAttribute('aria-label', `Delete ${story.title || 'this story'}`);
            remove.addEventListener('click', () => deleteStory(index));
            actions.append(read, remove);
            item.append(actions);
            list.append(item);
        });
    container.append(list);
}

function deleteStory(index) {
    const savedStories = readSavedStories();
    const story = savedStories[index];
    if (!story || !confirm(`Delete "${story.title || 'this story'}"? This cannot be undone.`)) return;
    savedStories.splice(index, 1);
    localStorage.setItem('infinite-if-stories', JSON.stringify(savedStories));
    displaySavedStories();
}

// The reader: a finished story as the same transcript it was played in.
function viewStory(index) {
    const story = readSavedStories()[index];
    if (!story) return;
    document.getElementById('story-view-title').textContent = story.title || story.seedIdea || 'Untitled';
    const passages = (story.content || []).length;
    const meta = [story.seedIdea, story.writingStyle ? `written as: ${story.writingStyle}` : '', `${passages} ${passages === 1 ? 'passage' : 'passages'}`, `finished ${timeAgo(story.date)}`];
    document.getElementById('story-view-meta').textContent = meta.filter(Boolean).join(', ');
    renderTranscript(document.getElementById('story-view-content'), story.content || [], 'h3');
    savedStoriesModal.close();
    storyViewModal.showModal();
    storyViewModal.scrollTop = 0;
}

document.getElementById('story-view-back').addEventListener('click', openLibrary);

// Prevent Leaving the Page if the Story is in Progress
window.addEventListener('beforeunload', function (event) {
    if (storyInProgress) {
        event.preventDefault();
        return 'Are you sure you want to leave? All progress will be lost.';
    }
});
