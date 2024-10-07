// Settings Management
let apiKey = '';
let ttsEnabled = false;
let ttsVoice = 'onyx';
let writingStyle = '';
let storyInProgress = false;

function loadSettings() {
    const settings = JSON.parse(localStorage.getItem('infinite-if-settings')) || {};

    apiKey = settings.apiKey || '';
    ttsEnabled = settings.ttsEnabled || false;
    writingStyle = settings.writingStyle || '';
    ttsVoice = settings.ttsVoice || 'onyx';

    document.getElementById('api-key-input').value = apiKey;
    document.getElementById('tts-checkbox').checked = ttsEnabled;
    document.getElementById('voice-select').value = ttsVoice;
    document.getElementById('writing-style-input').value = writingStyle;

    if (ttsEnabled) {
        document.getElementById('voice-selection-group').style.display = 'block';
    } else {
        document.getElementById('voice-selection-group').style.display = 'none';
    }
}

function saveSettings(settings) {
    localStorage.setItem('infinite-if-settings', JSON.stringify(settings));
    loadSettings();
}

// Initialize Settings on Startup
loadSettings();

if (!apiKey) {
    const enteredApiKey = prompt('Please enter your OpenAI API Key:');
    if (enteredApiKey) {
        saveSettings({ apiKey: enteredApiKey, ttsEnabled, writingStyle });
    } else {
        alert('API Key is required.');
    }
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

// Game State
let gameState = {
    location: '',
    history: [],
    seedIdea: '',
    lastIcon: '',
    storyContent: [],
};

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
    if (!ttsEnabled) return;

    fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + apiKey,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: 'tts-1',
            input: text,
            voice: ttsVoice,
            stream: true
        }),
    })
    .then(response => {
        if (window.currentAudio) {
            window.currentAudio.pause();
            window.currentAudio = null;
        }

        const reader = response.body.getReader();
        const audioChunks = [];

        function processStream({ done, value }) {
            if (done) {
                const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                const audioUrl = URL.createObjectURL(audioBlob);
                const audio = new Audio(audioUrl);
                window.currentAudio = audio;
                audio.play();
                return;
            }
            audioChunks.push(value);
            reader.read().then(processStream);
        }

        reader.read().then(processStream);
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

// Handle Option Selection
function handleOptionSelection(optionText, optionIcon) {
    optionsDiv.style.display = 'none';
    scrollLeftBtn.style.display = 'none';
    scrollRightBtn.style.display = 'none';    
    gameState.history.push(optionText);
    gameState.lastIcon = optionIcon || 'help_outline';
    sendRequestToOpenAI(optionText, false, optionIcon);
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

// OpenAI API Interaction
function sendRequestToOpenAI(userChoice, endStory = false, userIcon = '') {
showLoading();

let writingStyleInstruction = '';
if (writingStyle) {
    writingStyleInstruction = `Writing style: ${writingStyle}`;
}

let content;
if (gameState.history.length === 0) {
    content = `Begin a story based on the seed idea: "${gameState.seedIdea}". Use the icon "${userIcon}" for the initial description.`;
}

if (endStory) {
    content = `Provide an epic conclusion to the story so far, based on the player's history: ${gameState.history.join(' -> ')}. Seed idea: "${gameState.seedIdea}". Wrap up all loose ends and provide a satisfying ending.`;
    if (userIcon) {
        content += ` Use the icon "${userIcon}" for the epic conclusion.`;
    }
} else if (userIcon) {
    content = `The player is at "${gameState.location}". They chose to "${userChoice}" with icon "${userIcon}". Continue the story using this icon. Seed idea: "${gameState.seedIdea}"`;
} else {
    content = `The player is at "${gameState.location}". They chose to "${userChoice}". Recommend an icon for this choice. What happens next? Seed idea: "${gameState.seedIdea}"`;
}

const messages = [
    {
        role: 'system',
        content: `You are an interactive fiction game engine. Avoid repeating parts of the story. Incorporate the user action into the story segment. ${writingStyleInstruction} Generate engaging descriptions and navigation options in JSON format only. Do not include any additional text outside the JSON. The JSON format should be:

{
"description": "...",
"icon": "material-icon-name",
"options": [
{"text": "option1", "icon": "material-icon1"},
{"text": "option2", "icon": "material-icon2"},
...
],
"location": "..."
}

Provide an appropriate Material Symbol name for the description and for each option that matches the content. Use valid Material Symbols names like "forest", "rocket_launch", "emoji_nature", etc.`,
    },
];

gameState.storyContent.forEach((segment, index) => {
    messages.push({
        role: 'assistant',
        content: `Description: ${segment.text}\nIcon: ${segment.iconClass}\nPrevious Option: ${gameState.history[index-1] || 'None'}\nSeed Idea: ${gameState.seedIdea}`
    });
});

messages.push({
    role: 'user',
    content: content,
});

fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        model: 'gpt-4o',
        messages: messages,
        temperature: 0.7,
    }),
    timeout: 10000,
})
.then(response => response.json())
.then(data => {
    hideLoading();
    if (data.error) {
        if (gameState.history.length === 0) {
            alert('Error: ' + data.error.message);
            reloadApp();
        } else {
            optionsDiv.style.display = 'block';
            alert('Error: ' + data.error.message);
        }
        return;
    }
    const content = data.choices[0].message.content;
    processResponse(content, endStory);
    
    if (endStory) {
        saveStory();
    }
})
.catch(error => {
    hideLoading();
    if (gameState.history.length === 0) {
        alert('An error occurred. Please try again.');
        reloadApp();
    } else {
        optionsDiv.style.display = 'block';
        alert('An error occurred. Please try again.');
    }
});
}

function processResponse(content, endStory) {
    try {
        content = content.replace(/^(`{2,3}json)?/, '').replace(/`{3}$/, '').trim();
        const response = JSON.parse(content);
        let iconToUse = validateIcon(response.icon);
        storyInProgress = true;
        
        if (response.description) {
            appendStory(response.description, iconToUse);
        }
        if (endStory) {
            storyInProgress = false;
            optionsDiv.innerHTML = '';
            optionsDiv.style.display = 'none';
            scrollLeftBtn.style.display = 'none';
            scrollRightBtn.style.display = 'none';
            inputArea.style.display = 'none';
            endStoryButton.style.display = 'none';
            restartButton.style.display = 'block';
            return;
        }
        if (response.location) {
            gameState.location = response.location;
        }
        if (response.options && response.options.length > 0) {
            displayOptions(response.options);
        }
    } catch (e) {
        if (gameState.history.length === 0) {
            storyInProgress = false;
            alert('An error occurred. Please try again.');
            reloadApp();
        }
        optionsDiv.style.display = 'block';
        alert('An error occurred. Please try again.');
    }
}

// Event Listeners
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
        sendRequestToOpenAI(input);
        userInput.value = '';
    }
};

// Start Buttons
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
        sendRequestToOpenAI(customSeed, false);
    }
});

endStoryButton.onclick = () => {
    if (confirm('Are you sure you want to end the story?')) {
        sendRequestToOpenAI('End the story', true, 'wb_twilight');
    }
};

restartButton.addEventListener('click', reloadApp);

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
        sendRequestToOpenAI('', false, gameState.lastIcon);
    });
});

// Settings Modal
const settingsIcon = document.getElementById('settings-icon');
const settingsModal = document.getElementById('settings-modal');
const closeModal = document.querySelector('.close');
const saveSettingsButton = document.getElementById('save-settings-button');
const apiKeyInput = document.getElementById('api-key-input');

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

saveSettingsButton.onclick = function() {
    const apiKey = apiKeyInput.value.trim();
    const ttsEnabled = document.getElementById('tts-checkbox').checked;
    const ttsVoice = document.getElementById('voice-select').value;
    const writingStyleInput = document.getElementById('writing-style-input').value.trim() || '';

    saveSettings({ apiKey, ttsEnabled, ttsVoice, writingStyle: writingStyleInput});
    settingsModal.style.display = 'none';
}

document.getElementById('tts-checkbox').addEventListener('change', function() {
    if (this.checked) {
        document.getElementById('voice-selection-group').style.display = 'block';
    } else {
        document.getElementById('voice-selection-group').style.display = 'none';
    }
});

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

// Saving Stories
function saveStory() {
    showLoading();

    const storyContent = gameState.storyContent.map(segment => segment.text).join('\n');

    const messages = [
        {
            role: 'system',
            content: 'You are a creative title generator. Based on the story provided, create a short, engaging title that captures the essence of the story.'
        },
        {
            role: 'user',
            content: `Generate a short title for this story:\n\n${storyContent}`
        }
    ];

    fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + apiKey,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: 'gpt-4o',
            messages: messages,
            temperature: 0.7,
        }),
        timeout: 10000,
    })
    .then(response => response.json())
    .then(data => {
        hideLoading();

        let generatedTitle = '';
        if (data.error) {
            generatedTitle = gameState.seedIdea;
        } else {
            generatedTitle = data.choices[0].message.content.trim();
        }

        generatedTitle = generatedTitle.replace(/^['"]+|['"]+$/g, '');

        const story = {
            title: generatedTitle,
            date: new Date().toISOString(),
            content: gameState.storyContent,
            seedIdea: gameState.seedIdea,
            writingStyle: writingStyle
        };
        
        let savedStories = JSON.parse(localStorage.getItem('infinite-if-stories')) || [];
        savedStories.push(story);
        localStorage.setItem('infinite-if-stories', JSON.stringify(savedStories));
    })
    .catch(error => {
        hideLoading();
        console.error('Error:', error);
        alert('An error occurred while saving the story. Please try again.');
    });
}

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

// Close Modals
document.querySelectorAll('.close').forEach(closeButton => {
    closeButton.onclick = function() {
        this.closest('.modal').style.display = 'none';
    }
});

// Scroll Arrow Functionality
const scrollLeftBtn = document.getElementById('scroll-left');
const scrollRightBtn = document.getElementById('scroll-right');
const optionsContainer = document.getElementById('options');

const scrollAmount = 150; // Adjust scroll distance as needed

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