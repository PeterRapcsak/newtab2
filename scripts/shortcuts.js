import { domElements } from './dom.js';

export let shortcutsConfig = { shortcuts: [] };
export let isEditMode = false;
export let isAddMode = false;
export let dragStartIndex = null;

const BASE_ICON_URL = "https://www.gstatic.com/images/branding/product/1x/";

const GOOGLE_SERVICE_ICONS = {
    "analytics.google.com": "analytics",
    "books.google.com": "books",
    "calendar.google.com": "calendar",
    "classroom.google.com": "classroom",
    "docs.google.com": "docs",
    "drive.google.com": "drive",
    "earth.google.com": "earth",
    "finance.google.com": "finance",
    "groups.google.com": "groups",
    "keep.google.com": "keep",
    "mail.google.com": "gmail",
    "maps.google.com": "maps",
    "meet.google.com": "meet",
    "news.google.com": "news",
    "photos.google.com": "photos",
    "play.google.com": "play_prism_48dp.png",
    "podcasts.google.com": "podcasts",
    "scholar.google.com": "scholar",
    "sheets.google.com": "sheets",
    "slides.google.com": "slides",
    "translate.google.com": "translate",
};

const FALLBACK_ICON_URL = '/icons/fallback-icon.png';

export function handleShortcutClick(event) {
    if (event.button === 1 || event.ctrlKey || event.metaKey) {
        return true;
    }
    
    event.preventDefault();
    window.location.href = event.currentTarget.href;
    return false;
}

export function renderShortcuts() {
    if (!domElements.shortcuts.container) {
        console.error('Shortcuts container not found');
        return;
    }
    domElements.shortcuts.container.innerHTML = '';
    
    let shortcuts = [];
    try {
        const storedConfig = localStorage.getItem('shortcutsConfig');
        if (storedConfig) {
            const parsedConfig = JSON.parse(storedConfig);
            if (parsedConfig && Array.isArray(parsedConfig.shortcuts)) {
                shortcuts = parsedConfig.shortcuts;
            }
        }
    } catch (error) {
        console.error('Error parsing shortcutsConfig from localStorage:', error);
        shortcutsConfig.shortcuts = [];
        shortcuts = shortcutsConfig.shortcuts;
    }

    shortcuts.forEach((shortcut, index) => {
        const shortcutEl = document.createElement('div');
        shortcutEl.className = 'shortcut';
        shortcutEl.setAttribute('draggable', 'true');
        shortcutEl.dataset.index = index.toString();
        
        let domain = 'unknown.domain';
        let shortcutHref = shortcut.url; 

        try {
            const urlObject = new URL(shortcut.url);
            domain = urlObject.hostname;
        } catch (e) {
            console.error(`Invalid URL for shortcut '${shortcut.name}': ${shortcut.url}.`, e);
        }

        let iconSrc;
        if (GOOGLE_SERVICE_ICONS[domain]) {
            let iconName = GOOGLE_SERVICE_ICONS[domain];
            if (iconName.endsWith('.png')) {
                iconSrc = BASE_ICON_URL + iconName;
            } else {
                iconSrc = BASE_ICON_URL + iconName + '_48dp.png';
            }
        } else if (domain === 'unknown.domain') { 
            iconSrc = FALLBACK_ICON_URL;
        } else {
            iconSrc = `https://icons.duckduckgo.com/ip3/${domain}.ico`;
        }

        const linkElement = document.createElement('a');
        linkElement.href = shortcutHref;

        const imgElement = document.createElement('img');
        imgElement.alt = shortcut.name;
        imgElement.src = iconSrc; 

        imgElement.onerror = function() {
            if (this.src !== FALLBACK_ICON_URL) {
                const attemptedSrc = this.src;
                this.onerror = null;
                this.src = FALLBACK_ICON_URL; 
                console.warn(`Failed to load icon for "${shortcut.name}" (domain: ${domain}, attempted src: ${attemptedSrc}). Using fallback.`);
            } else if (!this.dataset.fallbackAttempted) {
                this.dataset.fallbackAttempted = "true";
                this.onerror = null;
                console.error(`Fallback icon itself (${FALLBACK_ICON_URL}) failed to load for "${shortcut.name}".`);
            }
        };
        linkElement.appendChild(imgElement);

        const nameSpan = document.createElement('span');
        nameSpan.className = 'shortcut-name';
        nameSpan.textContent = shortcut.name;

        shortcutEl.appendChild(linkElement);
        shortcutEl.appendChild(nameSpan);

        if (isEditMode) {
            const deleteButton = document.createElement('button');
            deleteButton.className = 'delete-shortcut-btn';
            deleteButton.setAttribute('data-index', index.toString());
            deleteButton.textContent = '×';
            shortcutEl.appendChild(deleteButton);
        }
        
        domElements.shortcuts.container.appendChild(shortcutEl);
    });

    if (isEditMode) {
        document.querySelectorAll('.delete-shortcut-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const indexToDelete = parseInt(e.target.dataset.index);
                deleteShortcut(indexToDelete);
            });
        });
    }

    const shortcutEls = domElements.shortcuts.container.querySelectorAll('.shortcut');
    shortcutEls.forEach((shortcutElItem, itemIndex) => { 
        shortcutElItem.addEventListener('dragstart', (e) => {
            dragStartIndex = itemIndex;
            shortcutElItem.classList.add('dragging');
            e.dataTransfer.setData('text/plain', itemIndex.toString());
            const rect = shortcutElItem.getBoundingClientRect();
            const offsetX = e.clientX - rect.left;
            const offsetY = e.clientY - rect.top;
            e.dataTransfer.setDragImage(shortcutElItem, offsetX, offsetY);
        });

        shortcutElItem.addEventListener('dragend', () => {
            shortcutElItem.classList.remove('dragging');
            dragStartIndex = null;
        });

        shortcutElItem.addEventListener('dragover', (e) => {
            e.preventDefault();
        });

        shortcutElItem.addEventListener('drop', (e) => {
            e.preventDefault();
            const dragEndIndex = parseInt(shortcutElItem.dataset.index);
            if (dragStartIndex !== null && dragStartIndex !== dragEndIndex) {
                swapShortcuts(dragStartIndex, dragEndIndex);
            }
            dragStartIndex = null;
        });
    });
}

function swapShortcuts(index1, index2) {
    const currentShortcuts = shortcutsConfig.shortcuts;
    const temp = currentShortcuts[index1];
    currentShortcuts[index1] = currentShortcuts[index2];
    currentShortcuts[index2] = temp;
    localStorage.setItem('shortcutsConfig', JSON.stringify(shortcutsConfig));
    renderShortcuts(); 
}

export function reorderShortcuts(fromIndex, toIndex) {
    const [movedShortcut] = shortcutsConfig.shortcuts.splice(fromIndex, 1);
    shortcutsConfig.shortcuts.splice(toIndex, 0, movedShortcut);
    localStorage.setItem('shortcutsConfig', JSON.stringify(shortcutsConfig));
    renderShortcuts();
}

export function loadShortcuts() {
    const storedConfig = localStorage.getItem('shortcutsConfig');
    if (storedConfig) {
        try {
            const parsed = JSON.parse(storedConfig);
            if (parsed && typeof parsed === 'object' && Array.isArray(parsed.shortcuts)) {
                 shortcutsConfig = parsed;
            } else {
                console.warn('Stored shortcutsConfig has invalid structure. Resetting to default.');
                throw new Error('Invalid structure');
            }
        } catch (error) {
            console.error('Error parsing stored shortcutsConfig or invalid structure:', error);
            shortcutsConfig = {
                shortcuts: [
                    { name: "YouTube", url: "https://www.youtube.com/" },
                    { name: "Google", url: "https://www.google.com" },
                    { name: "GitHub", url: "https://github.com" },
                    { name: "DeepSeek", url: "https://chat.deepseek.com/" }
                ]
            };
            localStorage.setItem('shortcutsConfig', JSON.stringify(shortcutsConfig));
        }
    } else {
        shortcutsConfig = {
            shortcuts: [
                { name: "YouTube", url: "https://www.youtube.com/" },
                { name: "Google", url: "https://www.google.com" },
                { name: "GitHub", url: "https://github.com" },
                { name: "DeepSeek", url: "https://chat.deepseek.com/" }
            ]
        };
        localStorage.setItem('shortcutsConfig', JSON.stringify(shortcutsConfig));
        console.log('Default shortcuts saved');
    }
    renderShortcuts();
}

export function addShortcut() {
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
        alert('Please enter a valid URL (e.g., https://example.com)');
        return;
    }
    
    shortcutsConfig.shortcuts.push({ name, url });
    
    localStorage.setItem('shortcutsConfig', JSON.stringify(shortcutsConfig));
    if (domElements.shortcuts.newName && domElements.shortcuts.newUrl) {
        domElements.shortcuts.newName.value = '';
        domElements.shortcuts.newUrl.value = '';
    }
    toggleAddMode();
    renderShortcuts();
}

export function deleteShortcut(index) {
    if (index === null || index < 0 || index >= shortcutsConfig.shortcuts.length) {
        console.error('Invalid delete index:', index);
        return;
    }
    
    shortcutsConfig.shortcuts.splice(index, 1);
    localStorage.setItem('shortcutsConfig', JSON.stringify(shortcutsConfig));
    console.log('Shortcut deleted at index:', index);
    renderShortcuts();
}

export function toggleEditMode() {
    isEditMode = !isEditMode;
    if (domElements.buttons.edit) {
        domElements.buttons.edit.textContent = isEditMode ? 'Done' : 'Edit';
    }
    if (domElements.buttons.import) {
        domElements.buttons.import.style.display = isEditMode ? '' : 'none';
    }
    if (domElements.buttons.export) {
        domElements.buttons.export.style.display = isEditMode ? '' : 'none';
    }
    renderShortcuts();
}

export function toggleAddMode() {
    isAddMode = !isAddMode;
    if (domElements.shortcuts.addForm && domElements.buttons.new) {
        domElements.shortcuts.addForm.style.display = isAddMode ? 'flex' : 'none';
        domElements.buttons.new.textContent = isAddMode ? 'Cancel' : 'New';
        if (isAddMode && domElements.shortcuts.newName) {
            domElements.shortcuts.newName.focus();
        }
    }
}

export function handleAddShortcutKeyPress(e) {
    if (e.key === 'Enter') {
        const name = domElements.shortcuts.newName?.value.trim();
        const url = domElements.shortcuts.newUrl?.value.trim();
        
        if (name && url) {
            addShortcut();
        } else if (name && !url && e.target === domElements.shortcuts.newName) {
            domElements.shortcuts.newUrl?.focus();
        } else if (!name && url && e.target === domElements.shortcuts.newUrl) {
            domElements.shortcuts.newName?.focus();
        }
    }
}