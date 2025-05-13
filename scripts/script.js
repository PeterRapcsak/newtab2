let shortcutsConfig = { shortcuts: [] };
let isEditMode = false;
let isAddMode = false;
let currentEditIndex = null;
let dragStartIndex = null;

const domElements = {
    clock: {
        hours: document.getElementById('digi-hours'),
        minutes: document.getElementById('digi-minutes'),
        ampm: document.getElementById('am-pm')
    },
    currency: {
        fromSelect: document.getElementById('from-currency'),
        toSelect: document.getElementById('to-currency'),
        amountInput: document.getElementById('amount'),
        convertButton: document.getElementById('convert-btn'),
        swapButton: document.getElementById('swap-btn'),
        resultDiv: document.getElementById('result')
    },
    search: {
        input: document.getElementById('search-q'),
        button: document.getElementById('search-btn'),
        advancedButton: document.getElementById('advanced-btn')
    },
    advancedSearch: document.getElementById('advanced-search'),
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

// Fetch and populate currency dropdowns, load saved preferences
async function loadCurrencies() {
    try {
        const response = await fetch('https://api.frankfurter.app/currencies');
        const currencies = await response.json();
        const currencyList = Object.keys(currencies);
        
        if (domElements.currency.fromSelect && domElements.currency.toSelect) {
            currencyList.forEach(currency => {
                const option1 = document.createElement('option');
                option1.value = currency;
                option1.textContent = currency;
                domElements.currency.fromSelect.appendChild(option1);
                
                const option2 = document.createElement('option');
                option2.value = currency;
                option2.textContent = currency;
                domElements.currency.toSelect.appendChild(option2);
            });
            
            // Always default to EUR → HUF
            domElements.currency.fromSelect.value = 'EUR';
            domElements.currency.toSelect.value = 'HUF';
            
            // Save default preferences
            chrome.storage.local.set({
                fromCurrency: 'EUR',
                toCurrency: 'HUF'
            });

            // Automatically perform conversion when page loads
            if (domElements.currency.amountInput) {
                domElements.currency.amountInput.value = '1';
                convertCurrency();
            }
        }
    } catch (error) {
        console.error('Error fetching currencies:', error);
    }
}


// Perform currency conversion
async function convertCurrency() {
    const from = domElements.currency.fromSelect?.value;
    const to = domElements.currency.toSelect?.value;
    const amount = parseFloat(domElements.currency.amountInput?.value);
    
    if (!from || !to || isNaN(amount) || amount <= 0) {
        domElements.currency.resultDiv.textContent = 'Please enter a valid amount and select currencies.';
        return;
    }
    
    try {
        const response = await fetch(`https://api.frankfurter.app/latest?from=${from}&to=${to}`);
        const data = await response.json();
        const rate = data.rates[to];
        const result = (amount * rate).toFixed(2);
        
        // Format the result with spaces (e.g., 1 000 000,00)
        const formattedResult = new Intl.NumberFormat('hu-HU', {
            style: 'currency',
            currency: to,
            useGrouping: true
        }).format(result);
        
        domElements.currency.resultDiv.textContent = `${amount} ${from} = ${formattedResult}`;
    } catch (error) {
        console.error('Error fetching exchange rate:', error);
        domElements.currency.resultDiv.textContent = 'Error fetching exchange rate. Please try again later.';
    }
}

function handleShortcutClick(event) {
    // Middle mouse button (button 1) or ctrl/cmd+click
    if (event.button === 1 || event.ctrlKey || event.metaKey) {
        // Open in new tab (default browser behavior)
        return true;
    }
    
    // Regular click - open in current tab
    event.preventDefault();
    window.location.href = event.currentTarget.href;
    return false;
}

// Swap the selected currencies
function swapCurrencies() {
    const from = domElements.currency.fromSelect?.value;
    const to = domElements.currency.toSelect?.value;
    domElements.currency.fromSelect.value = to;
    domElements.currency.toSelect.value = from;
    chrome.storage.local.set({
        fromCurrency: to,
        toCurrency: from
    });
}

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

function setupSearch() {
    const performSearch = () => {
        const mainQuery = domElements.search.input?.value.trim();
        let query = mainQuery;
        let params = '';

        if (domElements.advancedSearch && domElements.advancedSearch.style.display !== 'none') {
            const allWords = document.getElementById('adv-all-words').value.trim();
            const exactPhrase = document.getElementById('adv-exact-phrase').value.trim();
            const anyWords = document.getElementById('adv-any-words').value.trim();
            const noneWords = document.getElementById('adv-none-words').value.trim();
            const fileTypes = Array.from(document.querySelectorAll('#advanced-search input[type="checkbox"]:checked')).map(cb => cb.value);
            const dateRange = document.getElementById('adv-date-range').value;

            if (allWords) query += ' ' + allWords.split(' ').join(' ');
            if (exactPhrase) query += ' "' + exactPhrase + '"';
            if (anyWords) {
                const anyWordsArr = anyWords.split(' ');
                query += anyWordsArr.length > 1 ? ' (' + anyWordsArr.join(' OR ') + ')' : ' ' + anyWords;
            }
            if (noneWords) query += ' -' + noneWords.split(' ').join(' -');
            if (fileTypes.length > 0) query += ' (' + fileTypes.map(ft => 'filetype:' + ft).join(' OR ') + ')';
            if (dateRange) params += '&tbs=qdr:' + dateRange;
        }

        if (query) {
            window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}${params}`, '_blank');
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
    if (domElements.search.advancedButton) {
        domElements.search.advancedButton.addEventListener('click', toggleAdvancedSearch);
    }
}

function toggleAdvancedSearch() {
    if (domElements.advancedSearch) {
        const isVisible = domElements.advancedSearch.style.display !== 'none';
        domElements.advancedSearch.style.display = isVisible ? 'none' : 'block';
        domElements.search.advancedButton.textContent = isVisible ? 'Advanced' : 'Hide Advanced';
    }
}

function renderShortcuts() {
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
        shortcutEl.innerHTML = `
        <a href="${shortcut.url}">
            <img src="https://www.google.com/s2/favicons?domain=${new URL(shortcut.url).hostname}&sz=64" alt="${shortcut.name}">
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
            chrome.storage.local.set({ shortcutsConfig }, () => {
                console.log('Shortcuts order saved:', shortcutsConfig.shortcuts);
            });
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

function reorderShortcuts(fromIndex, toIndex) {
    const [movedShortcut] = shortcutsConfig.shortcuts.splice(fromIndex, 1);
    shortcutsConfig.shortcuts.splice(toIndex, 0, movedShortcut);
    renderShortcuts();
}

function loadShortcuts() {
    chrome.storage.local.get(['shortcutsConfig'], (result) => {
        if (result.shortcutsConfig) {
            shortcutsConfig = result.shortcutsConfig;
        } else {
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

function startEditingShortcut(index) {
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

function toggleEditMode() {
    isEditMode = !isEditMode;
    if (domElements.buttons.edit) {
        domElements.buttons.edit.textContent = isEditMode ? 'Done' : 'Edit';
    }
    renderShortcuts();
}

function toggleAddMode() {
    isAddMode = !isAddMode;
    if (domElements.shortcuts.addForm && domElements.buttons.new) {
        domElements.shortcuts.addForm.style.display = isAddMode ? 'flex' : 'none';
        domElements.buttons.new.textContent = isAddMode ? 'Cancel' : 'New';
    }
}


async function fetchNewsHeadlines() {
    try {
        // Using Bloomberg's free RSS feed
        const rssUrl = 'https://www.bloomberg.com/feeds/podcasts/financial-wellness.rss';
        const response = await fetch(rssUrl);
        const text = await response.text();
        
        // Simple RSS parser
        const parser = new DOMParser();
        const rss = parser.parseFromString(text, 'text/xml');
        const items = rss.querySelectorAll('item');
        
        const newsContainer = document.getElementById('news-container');
        newsContainer.innerHTML = '';
        
        // Limit to 5 latest items
        Array.from(items).slice(0, 5).forEach(item => {
            const title = item.querySelector('title').textContent;
            const link = item.querySelector('link').textContent;
            const date = item.querySelector('pubDate').textContent;
            
            const newsItem = document.createElement('div');
            newsItem.className = 'news-item';
            newsItem.innerHTML = `
                <a href="${link}" target="_blank">
                    <span>${title}</span>
                </a>
                <span class="news-date">${new Date(date).toLocaleDateString()}</span>
            `;
            newsContainer.appendChild(newsItem);
        });
    } catch (error) {
        console.error('Error fetching news:', error);
        const newsContainer = document.getElementById('news-container');
        newsContainer.innerHTML = '<div style="color: #ff4444;">Failed to load news headlines</div>';
    }
}



function init() {
    checkDomElements();
    updateClock();
    setInterval(updateClock, 1000);
    setupSearch();
    loadShortcuts();
    loadCurrencies();

    if (domElements.currency.convertButton) {
        domElements.currency.convertButton.addEventListener('click', convertCurrency);
    }
    if (domElements.currency.swapButton) {
        domElements.currency.swapButton.addEventListener('click', swapCurrencies);
    }
    if (domElements.shortcuts.addButton) {
        domElements.shortcuts.addButton.addEventListener('click', addShortcut);
    };
    if (domElements.edit.saveButton) {
        domElements.edit.saveButton.addEventListener('click', saveEditedShortcut);
    };
    if (domElements.edit.deleteButton) {
        domElements.edit.deleteButton.addEventListener('click', deleteShortcut);
    };
    if (domElements.edit.cancelButton) {
        domElements.edit.cancelButton.addEventListener('click', cancelEditingShortcut);
    };
    
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
    if (rightHalf) rightHalf.appendChild(buttonContainer);
    
    if (domElements.edit.popup) {
        domElements.edit.popup.addEventListener('click', (e) => {
            if (e.target === domElements.edit.popup) cancelEditingShortcut();
        });
    }
}

document.addEventListener('DOMContentLoaded', init);