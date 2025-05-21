import { domElements } from './dom.js';
import { initializeTimeTools } from './timeTools.js';
import { loadCurrencies, setupCurrencyInputs } from './currency.js';
import { setupSearch, toggleAdvancedSearch, initializeSearchSettings } from './search.js';
import { loadShortcuts, renderShortcuts, addShortcut, deleteShortcut, toggleEditMode, toggleAddMode, handleAddShortcutKeyPress } from './shortcuts.js';
import { startClock } from './clock.js';

function init() {
    startClock();
    setupSearch();
    loadShortcuts();
    loadCurrencies();
    setupCurrencyInputs();
    initializeSearchSettings();
    initializeTimeTools();

    if (domElements.shortcuts.addButton) {
        domElements.shortcuts.addButton.addEventListener('click', addShortcut);
    } else {
        console.error('Add shortcut button not found');
    }
    
    if (domElements.shortcuts.newName) {
        domElements.shortcuts.newName.addEventListener('keypress', handleAddShortcutKeyPress);
    }
    if (domElements.shortcuts.newUrl) {
        domElements.shortcuts.newUrl.addEventListener('keypress', handleAddShortcutKeyPress);
    }
    
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'button-container';

    // Create export button
    domElements.buttons.export = document.createElement('button');
    domElements.buttons.export.id = 'export-btn';
    domElements.buttons.export.classList.add('action-btn');
    domElements.buttons.export.textContent = 'Export';
    domElements.buttons.export.style.display = 'none'; // Hidden by default
    domElements.buttons.export.addEventListener('click', () => {
        const shortcutsConfig = localStorage.getItem('shortcutsConfig');
        if (shortcutsConfig) {
            const blob = new Blob([shortcutsConfig], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'shortcuts.json';
            a.click();
            URL.revokeObjectURL(url);
        } else {
            alert('No shortcuts available to export.');
        }
    });

    // Create import button
    domElements.buttons.import = document.createElement('button');
    domElements.buttons.import.id = 'import-btn';
    domElements.buttons.import.classList.add('action-btn');
    domElements.buttons.import.textContent = 'Import';
    domElements.buttons.import.style.display = 'none'; // Hidden by default
    domElements.buttons.import.addEventListener('click', () => {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.json';
        fileInput.onchange = (event) => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const importedData = e.target.result;
                        const parsedData = JSON.parse(importedData);
                        if (!parsedData.shortcuts || !Array.isArray(parsedData.shortcuts)) {
                            throw new Error('Imported data must have a "shortcuts" array');
                        }
                        localStorage.setItem('shortcutsConfig', importedData);
                        loadShortcuts();
                        console.log('Shortcuts imported successfully');
                    } catch (error) {
                        console.error('Error importing shortcuts:', error);
                        alert('Invalid file format. Please upload a valid JSON file with a "shortcuts" array.');
                    }
                };
                reader.readAsText(file);
            }
        };
        fileInput.click();
    });

    // Create edit button
    domElements.buttons.edit = document.createElement('button');
    domElements.buttons.edit.id = 'edit-btn';
    domElements.buttons.edit.textContent = 'Edit';
    domElements.buttons.edit.addEventListener('click', toggleEditMode);

    // Create new button
    domElements.buttons.new = document.createElement('button');
    domElements.buttons.new.id = 'new-btn';
    domElements.buttons.new.textContent = 'New';
    domElements.buttons.new.addEventListener('click', toggleAddMode);

    // Append in the order: import, export, edit, new
    buttonContainer.appendChild(domElements.buttons.import);
    buttonContainer.appendChild(domElements.buttons.export);
    buttonContainer.appendChild(domElements.buttons.edit);
    buttonContainer.appendChild(domElements.buttons.new);

    const rightHalf = document.querySelector('.right-half');
    if (rightHalf) {
        const addShortcutDiv = rightHalf.querySelector('.add-shortcut');
        rightHalf.insertBefore(buttonContainer, addShortcutDiv);
    }

    if (domElements.search.advancedButton) {
        domElements.search.advancedButton.addEventListener('click', toggleAdvancedSearch);
    }
}

document.addEventListener('DOMContentLoaded', init);