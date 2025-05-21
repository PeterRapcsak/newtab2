import { domElements } from './dom.js';

export let shortcutsConfig = { shortcuts: [] };
export let isEditMode = false;
export let isAddMode = false;
export let currentEditIndex = null;
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
    domElements.shortcuts.container.innerHTML = '';
    
    shortcutsConfig.shortcuts.forEach((shortcut, index) => {
        const shortcutEl = document.createElement('div');
        shortcutEl.className = 'shortcut';
        shortcutEl.setAttribute('draggable', 'true');
        shortcutEl.dataset.index = index;
        
        const hostname = new URL(shortcut.url).hostname;
        const domainParts = hostname.split('.');
        const mainDomain = domainParts.length > 2 ? domainParts.slice(-2).join('.') : hostname;

        shortcutEl.innerHTML = `
        <a href="${shortcut.url}">
            <img src="https://www.google.com/s2/favicons?domain=${mainDomain}&sz=64" alt="${shortcut.name}">
        </a>
        <span class="shortcut-name">${shortcut.name}</span>
        ${isEditMode ? `<button class="delete-shortcut-btn" data-index="${index}">×</button>` : ''}
        `;
        domElements.shortcuts.container.appendChild(shortcutEl);
    });

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
            localStorage.setItem('shortcutsConfig', JSON.stringify(shortcutsConfig));
            console.log('Shortcuts order saved:', shortcutsConfig.shortcuts);
        });

        shortcutEl.addEventListener('dragover', (e) => {
            e.preventDefault();
            const dragOverIndex = parseInt(shortcutEl.dataset.index);
            if (dragStartIndex !== dragOverIndex) {
                reorderShortcuts(dragStartIndex, dragOverIndex);
                dragStartIndex = dragOverIndex;
            }
        });

        shortcutEl.addEventListener('dragenter', (e) => {
            e.preventDefault();
        });

        shortcutEl.addEventListener('drop', (e) => {
            e.preventDefault();
        });
    });
}

export function reorderShortcuts(fromIndex, toIndex) {
    const [movedShortcut] = shortcutsConfig.shortcuts.splice(fromIndex, 1);
    shortcutsConfig.shortcuts.splice(toIndex, 0, movedShortcut);
    renderShortcuts();
}

export function loadShortcuts() {
    const storedConfig = localStorage.getItem('shortcutsConfig');
    if (storedConfig) {
        shortcutsConfig = JSON.parse(storedConfig);
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

export function startEditingShortcut(index) {
    if (index < 0 || index >= shortcutsConfig.shortcuts.length) {
        console.error('Invalid shortcut index:', index);
        return;
    }
    
    currentEditIndex = index;
    const shortcut = shortcutsConfig.shortcuts[index];

    if (domElements.edit.name && domElements.edit.url && domElements.edit.popup) {
        domElements.edit.name.value = shortcut.name;
        domElements.edit.url.value = shortcut.url;
        domElements.edit.popup.style.display = 'flex';
        console.log('Edit popup opened for:', shortcut);
    }
    
    if (isAddMode) toggleAddMode();
    if (isEditMode) toggleEditMode();
}

export function saveEditedShortcut() {
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
    
    localStorage.setItem('shortcutsConfig', JSON.stringify(shortcutsConfig));
    console.log('Shortcut updated:', { name, url });
    cancelEditingShortcut();
    renderShortcuts();
}

export function deleteShortcut(index) {
    if (index === null || index < 0 || index >= shortcutsConfig.shortcuts.length) {
        console.error('Invalid edit index:', index);
        return;
    }
    
    shortcutsConfig.shortcuts.splice(index, 1);
    localStorage.setItem('shortcutsConfig', JSON.stringify(shortcutsConfig));
    console.log('Shortcut deleted at index:', index);
    renderShortcuts();
}

export function cancelEditingShortcut() {
    currentEditIndex = null;
    if (domElements.edit.popup) {
        domElements.edit.popup.style.display = 'none';
    }
    if (domElements.edit.name && domElements.edit.url) {
        domElements.edit.name.value = '';
        domElements.edit.url.value = '';
    }
}

export function toggleEditMode() {
    isEditMode = !isEditMode;
    if (domElements.buttons.edit) {
        domElements.buttons.edit.textContent = isEditMode ? 'Done' : 'Edit';
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