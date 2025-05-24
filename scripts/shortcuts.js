import { domElements } from './dom.js';

export let shortcutsConfig = { shortcuts: [] };
export let isEditMode = false;
export let isAddMode = false;
export let dragStartIndex = null;

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
    domElements.shortcuts.container.innerHTML = ''; // Clear existing shortcuts
    
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
    }

    shortcuts.forEach((shortcut, index) => {
        const shortcutEl = document.createElement('div');
        shortcutEl.className = 'shortcut';
        shortcutEl.setAttribute('draggable', 'true');
        shortcutEl.dataset.index = index;
        
        // Use the full URL for favicon fetching
        shortcutEl.innerHTML = `
            <a href="${shortcut.url}">
                <img src="https://www.google.com/s2/favicons?domain_url=${encodeURIComponent(shortcut.url)}&sz=64" 
                     onerror="this.src='/icons/fallback-icon.png';" alt="${shortcut.name}">
            </a>
            <span class="shortcut-name">${shortcut.name}</span>
            ${isEditMode ? `<button class="delete-shortcut-btn" data-index="${index}">×</button>` : ''}
        `;
        domElements.shortcuts.container.appendChild(shortcutEl);
    });

    // Rest of the function (event listeners for delete and drag-and-drop) remains unchanged
    if (isEditMode) {
        document.querySelectorAll('.delete-shortcut-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = parseInt(e.target.dataset.index);
                deleteShortcut(index);
            });
        });
    }

    const shortcutEls = domElements.shortcuts.container.querySelectorAll('.shortcut');
    shortcutEls.forEach((shortcutEl, index) => {
        shortcutEl.addEventListener('dragstart', (e) => {
            dragStartIndex = index;
            shortcutEl.classList.add('dragging');
            e.dataTransfer.setData('text/plain', index);
            const rect = shortcutEl.getBoundingClientRect();
            const offsetX = e.clientX - rect.left;
            const offsetY = e.clientY - rect.top;
            e.dataTransfer.setDragImage(shortcutEl, offsetX, offsetY);
        });

        shortcutEl.addEventListener('dragend', () => {
            shortcutEl.classList.remove('dragging');
            dragStartIndex = null;
        });

        shortcutEl.addEventListener('dragover', (e) => {
            e.preventDefault();
        });

        shortcutEl.addEventListener('drop', (e) => {
            e.preventDefault();
            const dragEndIndex = parseInt(shortcutEl.dataset.index);
            if (dragStartIndex !== null && dragStartIndex !== dragEndIndex) {
                swapShortcuts(dragStartIndex, dragEndIndex);
                dragStartIndex = null;
            }
        });
    });
}

function swapShortcuts(index1, index2) {
    const temp = shortcutsConfig.shortcuts[index1];
    shortcutsConfig.shortcuts[index1] = shortcutsConfig.shortcuts[index2];
    shortcutsConfig.shortcuts[index2] = temp;
    localStorage.setItem('shortcutsConfig', JSON.stringify(shortcutsConfig));
    renderShortcuts();
}

export function reorderShortcuts(fromIndex, toIndex) {
    const [movedShortcut] = shortcutsConfig.shortcuts.splice(fromIndex, 1);
    shortcutsConfig.shortcuts.splice(toIndex, 0, movedShortcut);
    renderShortcuts();
}

export function loadShortcuts() {
    const storedConfig = localStorage.getItem('shortcutsConfig');
    if (storedConfig) {
        try {
            shortcutsConfig = JSON.parse(storedConfig);
            if (!Array.isArray(shortcutsConfig.shortcuts)) {
                console.warn('Invalid shortcuts array in stored config, resetting to empty');
                shortcutsConfig.shortcuts = [];
            }
        } catch (error) {
            console.error('Error parsing stored shortcutsConfig:', error);
            shortcutsConfig = { shortcuts: [] };
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
        alert('Please enter a valid URL');
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
    }
}

export function handleAddShortcutKeyPress(e) {
    if (e.key === 'Enter') {
        const name = domElements.shortcuts.newName?.value.trim();
        const url = domElements.shortcuts.newUrl?.value.trim();
        
        if (name && url) {
            addShortcut();
        }
    }
}