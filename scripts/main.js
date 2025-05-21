import { domElements } from './dom.js';
import { initializeTimeTools } from './timeTools.js';
import { loadCurrencies, setupCurrencyInputs } from './currency.js';
import { setupSearch, toggleAdvancedSearch, initializeSearchSettings } from './search.js'; // Updated import
import { loadShortcuts, renderShortcuts, addShortcut, startEditingShortcut, saveEditedShortcut, deleteShortcut, cancelEditingShortcut, toggleEditMode, toggleAddMode, handleAddShortcutKeyPress } from './shortcuts.js';
import { startClock } from './clock.js';

function checkDomElements() {
    console.log('Checking DOM elements:', {
        popup: domElements.edit.popup,
        name: domElements.edit.name,
        url: domElements.edit.url,
        saveButton: domElements.edit.saveButton,
        deleteButton: domElements.edit.deleteButton,
        cancelButton: domElements.edit.cancelButton
    });
    if (!domElements.edit.name) console.error('Edit name input not found');
    if (!domElements.edit.url) console.error('Edit URL input not found');
    if (!domElements.edit.saveButton) console.error('Save button not found');
    if (!domElements.edit.deleteButton) console.error('Delete button not found');
}

function initializeEngineSettings() {
    const engineSelect = document.getElementById('search-engine-select');
    engineSelect.value = selectedEngine;
    engineSelect.addEventListener('change', (e) => {
        selectedEngine = e.target.value;
    });
}

function init() {
    checkDomElements();
    startClock();
    setupSearch();
    loadShortcuts();
    loadCurrencies();
    setupCurrencyInputs();
    initializeSearchSettings();
    initializeTimeTools();

    if (domElements.edit.saveButton) {
        domElements.edit.saveButton.addEventListener('click', saveEditedShortcut);
    }
    if (domElements.edit.deleteButton) {
        domElements.edit.deleteButton.addEventListener('click', () => deleteShortcut(currentEditIndex));
    }
    if (domElements.edit.cancelButton) {
        domElements.edit.cancelButton.addEventListener('click', cancelEditingShortcut);
    }

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
    domElements.buttons.new = document.createElement('button');
    domElements.buttons.new.id = 'new-btn';
    domElements.buttons.new.textContent = 'New';
    domElements.buttons.new.addEventListener('click', toggleAddMode);
    domElements.buttons.edit = document.createElement('button');
    domElements.buttons.edit.id = 'edit-btn';
    domElements.buttons.edit.textContent = 'Edit';
    domElements.buttons.edit.addEventListener('click', toggleEditMode);
    buttonContainer.appendChild(domElements.buttons.new);
    buttonContainer.appendChild(domElements.buttons.edit);
    const rightHalf = document.querySelector('.right-half');
    if (rightHalf) {
        const addShortcutDiv = rightHalf.querySelector('.add-shortcut');
        rightHalf.insertBefore(buttonContainer, addShortcutDiv);
    }
    
    if (domElements.edit.popup) {
        domElements.edit.popup.addEventListener('click', (e) => {
            if (e.target === domElements.edit.popup) cancelEditingShortcut();
        });
    }

    if (domElements.search.advancedButton) {
        domElements.search.advancedButton.addEventListener('click', toggleAdvancedSearch);
    }
}

document.addEventListener('DOMContentLoaded', init);