// In-memory storage for shortcuts
let shortcutsConfig = { shortcuts: [] };
let isEditMode = false;
let isAddMode = false;
let currentEditIndex = null;

// DOM elements cache
const domElements = {
    clock: {
        hours: document.getElementById('digi-hours'),
        minutes: document.getElementById('digi-minutes'),
        ampm: document.getElementById('am-pm')
    },
    search: {
        input: document.getElementById('search-q'),
        button: document.getElementById('search-btn')
    },
    shortcuts: {
        container: document.getElementById('shortcuts-container'),
        addForm: document.querySelector('.add-shortcut'),
        newName: document.getElementById('new-shortcut-name'),
        newUrl: document.getElementById('new-shortcut-url'),
        addButton: document.getElementById('add-shortcut-btn')
    },
    edit: {
        popup: document.getElementById('edit-popup'),
        content: document.querySelector('.edit-popup-content'),
        name: document.getElementById('edit-shortcut-name'),
        url: document.getElementById('edit-shortcut-url'),
        saveButton: document.getElementById('save-shortcut-btn'),
        deleteButton: document.getElementById('delete-shortcut-btn'),
        cancelButton: document.getElementById('cancel-shortcut-btn')
    },
    buttons: {
        edit: null,
        new: null
    }
};

// Debug function to check DOM elements
function checkDomElements() {
    console.log('Checking DOM elements:', {
        popup: domElements.edit.popup,
        name: domElements.edit.name,
        url: domElements.edit.url,
        saveButton: domElements.edit.saveButton,
        deleteButton: domElements.edit.deleteButton,
        cancelButton: domElements.edit.cancelButton
    });
    if (!domElements.edit.popup) console.error('Edit popup not found');
    if (!domElements.edit.name) console.error('Edit name input not found');
    if (!domElements.edit.url) console.error('Edit URL input not found');
    if (!domElements.edit.saveButton) console.error('Save button not found');
    if (!domElements.edit.deleteButton) console.error('Delete button not found');
    if (!domElements.edit.cancelButton) console.error('Cancel button not found');
}

// Clock functionality
function updateClock() {
    const now = new Date();
    const hours = now.getHours() % 12 || 12;
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const ampm = now.getHours() >= 12 ? 'PM' : 'AM';
    
    if (domElements.clock.hours && domElements.clock.minutes && domElements.clock.ampm) {
        domElements.clock.hours.textContent = hours;
        domElements.clock.minutes.textContent = minutes;
        domElements.clock.ampm.textContent = ampm;
    }
}

// Search functionality
function setupSearch() {
    const performSearch = () => {
        const query = domElements.search.input?.value.trim();
        if (query) {
            window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank');
        }
    };
    
    if (domElements.search.button) {
        domElements.search.button.addEventListener('click', performSearch);
    }
    if (domElements.search.input) {
        domElements.search.input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') performSearch();
        });
    }
}

// Render shortcuts to the UI
function renderShortcuts() {
    if (!domElements.shortcuts.container) {
        console.error('Shortcuts container not found');
        return;
    }
    domElements.shortcuts.container.innerHTML = '';
    
    shortcutsConfig.shortcuts.forEach((shortcut, index) => {
        const shortcutEl = document.createElement('div');
        shortcutEl.className = 'shortcut';
        shortcutEl.innerHTML = `
            <a href="${shortcut.url}" target="_blank">
                <img src="https://www.google.com/s2/favicons?domain=${new URL(shortcut.url).hostname}&sz=64" alt="${shortcut.name}">
            </a>
            <span class="shortcut-name">${shortcut.name}</span>
            ${isEditMode ? `<button class="delete-shortcut-btn" data-index="${index}">&times;</button>` : ''}
        `;
        domElements.shortcuts.container.appendChild(shortcutEl);
    });

    // Add event listeners for delete buttons if in edit mode
    if (isEditMode) {
        document.querySelectorAll('.delete-shortcut-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = parseInt(e.target.dataset.index);
                deleteShortcut(index);
            });
        });
    }
}

// Load shortcuts from chrome.storage
function loadShortcuts() {
    chrome.storage.local.get(['shortcutsConfig'], (result) => {
        if (result.shortcutsConfig) {
            shortcutsConfig = result.shortcutsConfig;
        } else {
            // Default shortcuts if none exist
            shortcutsConfig = {
                shortcuts: [
                    { name: "YouTube", url: "https://www.youtube.com/" },
                    { name: "Google", url: "https://www.google.com" },
                    { name: "GitHub", url: "https://github.com" },
                    { name: "DeepSeek", url: "https://chat.deepseek.com/" }
                ]
            };
            chrome.storage.local.set({ shortcutsConfig }, () => {
                console.log('Default shortcuts saved');
            });
        }
        renderShortcuts();
    });
}

// Add new shortcut
function addShortcut() {
    const name = domElements.shortcuts.newName?.value.trim();
    let url = domElements.shortcuts.newUrl?.value.trim();
    
    if (!name || !url) {
        alert('Please enter both a name and URL');
        return;
    }
    
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
    }
    
    try {
        new URL(url);
    } catch {
        alert('Please enter a valid URL');
        return;
    }
    
    shortcutsConfig.shortcuts.push({ name, url });
    
    chrome.storage.local.set({ shortcutsConfig }, () => {
        if (domElements.shortcuts.newName && domElements.shortcuts.newUrl) {
            domElements.shortcuts.newName.value = '';
            domElements.shortcuts.newUrl.value = '';
        }
        toggleAddMode();
        renderShortcuts();
    });
}

// Start editing a shortcut
function startEditingShortcut(index) {
    if (index < 0 || index >= shortcutsConfig.shortcuts.length) {
        console.error('Invalid shortcut index:', index);
        return;
    }
    
    currentEditIndex = index;
    const shortcut = shortcutsConfig.shortcuts[index];

    // Populate and show popup
    if (domElements.edit.name && domElements.edit.url && domElements.edit.popup) {
        domElements.edit.name.value = shortcut.name;
        domElements.edit.url.value = shortcut.url;
        domElements.edit.popup.style.display = 'flex';
        console.log('Edit popup opened for:', shortcut);
    } else {
        console.error('Edit popup elements missing');
    }
    
    // Disable other modes
    if (isAddMode) toggleAddMode();
    if (isEditMode) toggleEditMode();
}

// Save edited shortcut
function saveEditedShortcut() {
    if (currentEditIndex === null || currentEditIndex < 0 || currentEditIndex >= shortcutsConfig.shortcuts.length) {
        console.error('Invalid edit index:', currentEditIndex);
        return;
    }
    
    const name = domElements.edit.name?.value.trim();
    let url = domElements.edit.url?.value.trim();
    
    if (!name || !url) {
        alert('Please enter both a name and URL');
        return;
    }
    
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
    }
    
    try {
        new URL(url);
    } catch {
        alert('Please enter a valid URL');
        return;
    }
    
    shortcutsConfig.shortcuts[currentEditIndex] = { name, url };
    
    chrome.storage.local.set({ shortcutsConfig }, () => {
        console.log('Shortcut updated:', { name, url });
        cancelEditingShortcut();
        renderShortcuts();
    });
}

// Delete a shortcut
function deleteShortcut(index) {
    if (index === null || index < 0 || index >= shortcutsConfig.shortcuts.length) {
        console.error('Invalid edit index:', index);
        return;
    }
    
    shortcutsConfig.shortcuts.splice(index, 1);
    chrome.storage.local.set({ shortcutsConfig }, () => {
        console.log('Shortcut deleted at index:', index);
        renderShortcuts();
    });
}

// Cancel editing shortcut
function cancelEditingShortcut() {
    currentEditIndex = null;
    if (domElements.edit.popup) {
        domElements.edit.popup.style.display = 'none';
    }
    if (domElements.edit.name && domElements.edit.url) {
        domElements.edit.name.value = '';
        domElements.edit.url.value = '';
    }
}

// Toggle edit mode
function toggleEditMode() {
    isEditMode = !isEditMode;
    if (domElements.buttons.edit) {
        domElements.buttons.edit.textContent = isEditMode ? 'Done' : 'Edit';
    }
    renderShortcuts();
}

// Toggle add shortcut form visibility
function toggleAddMode() {
    isAddMode = !isAddMode;
    if (domElements.shortcuts.addForm && domElements.buttons.new) {
        domElements.shortcuts.addForm.style.display = isAddMode ? 'flex' : 'none';
        domElements.buttons.new.textContent = isAddMode ? 'Cancel' : 'New';
    }
}

// Initialize everything
function init() {
    // Debug DOM elements
    checkDomElements();
    
    // Start clock
    updateClock();
    setInterval(updateClock, 1000);
    
    // Setup search
    setupSearch();
    
    // Load initial shortcuts
    loadShortcuts();
    
    // Setup shortcut buttons
    if (domElements.shortcuts.addButton) {
        domElements.shortcuts.addButton.addEventListener('click', addShortcut);
    } else {
        console.error('Add shortcut button not found');
    }
    
    // Setup edit popup buttons
    if (domElements.edit.saveButton) {
        domElements.edit.saveButton.addEventListener('click', saveEditedShortcut);
    } else {
        console.error('Save shortcut button not found');
    }
    
    if (domElements.edit.deleteButton) {
        domElements.edit.deleteButton.addEventListener('click', deleteShortcut);
    } else {
        console.error('Delete shortcut button not found');
    }
    
    if (domElements.edit.cancelButton) {
        domElements.edit.cancelButton.addEventListener('click', cancelEditingShortcut);
    } else {
        console.error('Cancel shortcut button not found');
    }
    
    // Create and setup control buttons
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'button-container';
    
    // New button
    domElements.buttons.new = document.createElement('button');
    domElements.buttons.new.id = 'new-btn';
    domElements.buttons.new.textContent = 'New';
    domElements.buttons.new.addEventListener('click', toggleAddMode);
    
    // Edit button
    domElements.buttons.edit = document.createElement('button');
    domElements.buttons.edit.id = 'edit-btn';
    domElements.buttons.edit.textContent = 'Edit';
    domElements.buttons.edit.addEventListener('click', toggleEditMode);
    
    buttonContainer.appendChild(domElements.buttons.new);
    buttonContainer.appendChild(domElements.buttons.edit);
    const rightHalf = document.querySelector('.right-half');
    if (rightHalf) {
        rightHalf.appendChild(buttonContainer);
    } else {
        console.error('Right half container not found');
    }
    
    // Close popup when clicking outside
    if (domElements.edit.popup) {
        domElements.edit.popup.addEventListener('click', (e) => {
            if (e.target === domElements.edit.popup) {
                cancelEditingShortcut();
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', init);