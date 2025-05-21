let shortcutsConfig = { shortcuts: [] };
let isEditMode = false;
let isAddMode = false;
let currentEditIndex = null;
let dragStartIndex = null;

// Stopwatch Class
class Stopwatch {
  constructor(displayElement) {
    this.display = displayElement;
    this.running = false;
    this.time = 0; // Time in milliseconds
    this.interval = null;
    this.updateDisplay(); // Initialize display to "0.00" on load
  }

  startStop() {
    if (this.running) {
      this.stop();
    } else {
      this.start();
    }
  }

  start() {
    if (!this.running) {
      this.running = true;
      this.display.contentEditable = false;
      this.display.classList.add('running');
      const startTime = Date.now() - this.time;
      this.interval = setInterval(() => {
        this.time = Date.now() - startTime;
        this.updateDisplay();
      }, 10);
    }
  }

  stop() {
    if (this.running) {
      clearInterval(this.interval);
      this.running = false;
      this.display.contentEditable = true;
      this.display.classList.remove('running');
      
      // Update this.time to reflect the current displayed time
      const timeStr = this.getTimeString().replace(/:/g, '');
      this.time = parseInt(timeStr.slice(0, 2)) * 3600000 + // hours to ms
                  parseInt(timeStr.slice(2, 4)) * 60000 +    // minutes to ms
                  parseInt(timeStr.slice(4, 6)) * 1000 +      // seconds to ms
                  parseInt(timeStr.slice(7)) * 10;            // hundredths to ms
    }
  }


  reset() {
    this.stop();
    this.time = 0;
    this.updateDisplay();
  }

updateDisplay() {
    const hours = Math.floor(this.time / 3600000);
    const minutes = Math.floor((this.time % 3600000) / 60000);
    const seconds = Math.floor((this.time % 60000) / 1000);
    const hundredths = Math.floor((this.time % 1000) / 10);

    let formatted;
    if (hours > 0) {
        formatted = `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(hundredths).padStart(2, '0')}`;
    } else if (minutes > 0) {
        formatted = `${minutes}:${String(seconds).padStart(2, '0')}.${String(hundredths).padStart(2, '0')}`;
    } else {
        formatted = `${seconds}.${String(hundredths).padStart(2, '0')}`;
    }

    let displayHTML = '';
    for (const char of formatted) {
        if (/\d/.test(char)) {
            displayHTML += `<span class="digit">${char}</span>`;
        } else {
            displayHTML += char; // Add separators (":" or ".") without spans
        }
    }
    this.display.innerHTML = displayHTML;
}}




class Timer {
  constructor(displayElement) {
    this.display = displayElement;
    this.time = '000000'; // Initial time as 00:00:00
    this.running = false;
    this.remainingTime = 0;
    this.interval = null;
    this.initializeInput();
    this.updateDisplay(this.time); // Initialize with 00:00:00
  }
  
  initializeInput() {
    this.display.addEventListener('keydown', (e) => {
      // Prevent default behavior for all keys
      e.preventDefault();

      // Allow digits (0-9)
      if (/\d/.test(e.key)) {
        this.handleDigitInput(e.key);
      }
      // Allow backspace
      else if (e.key === 'Backspace') {
        this.handleBackspace();
      }
      // Explicitly block function keys (redundant but ensures clarity)
      else if (e.key.startsWith('F') && e.key.length > 1) {
        // Do nothing; default is already prevented
      }
      // All other keys (e.g., arrows, function keys) are ignored due to preventDefault
    });
  }

  handleDigitInput(digit) {
    this.time = this.time.slice(1) + digit;
    this.updateDisplay(this.time);
  }

  handleBackspace() {
    this.time = this.time.slice(0, -1) + '0';
    this.updateDisplay(this.time);
  }

  getTimeString() {
    return Array.from(this.display.querySelectorAll('.digit'))
      .map(digit => digit.textContent)
      .join('')
      .replace(/:/g, '');
  }

  updateDisplay(input = '000000') {
    const padded = input.padStart(6, '0');
    this.time = padded; // Ensure this.time matches the display
    const hours = padded.slice(0, 2);
    const minutes = padded.slice(2, 4);
    const seconds = padded.slice(4, 6);
    
    this.display.innerHTML = `
      <span class="digit">${hours}</span>:
      <span class="digit">${minutes}</span>:
      <span class="digit">${seconds}</span>
    `;
    
    this.remainingTime = 
      (parseInt(hours) * 3600) + 
      (parseInt(minutes) * 60) + 
      parseInt(seconds);
  }

  startStop() {
    if (this.running) {
      this.stop();
    } else {
      this.start();
    }
  }


  start() {
    if (this.remainingTime > 0 && !this.running) {
      this.running = true;
      this.display.contentEditable = false;
      this.display.classList.add('running');
      
      this.interval = setInterval(() => {
        if (--this.remainingTime <= 0) {
          this.stop();
          this.remainingTime = 0;
          this.display.classList.add('finished');
        }
        
        const hours = Math.floor(this.remainingTime / 3600);
        const minutes = Math.floor((this.remainingTime % 3600) / 60);
        const seconds = this.remainingTime % 60;
        
        this.display.innerHTML = `
          <span class="digit">${String(hours).padStart(2, '0')}</span>:
          <span class="digit">${String(minutes).padStart(2, '0')}</span>:
          <span class="digit">${String(seconds).padStart(2, '0')}</span>
        `;
      }, 1000);
    }
  }

  stop() {
    if (this.running) {
      clearInterval(this.interval);
      this.running = false;
    }
    this.display.contentEditable = true;
    this.display.classList.remove('running', 'finished');
    
    // Set this.time to match the current remaining time
    const hours = Math.floor(this.remainingTime / 3600);
    const minutes = Math.floor((this.remainingTime % 3600) / 60);
    const seconds = this.remainingTime % 60;
    this.time = `${String(hours).padStart(2, '0')}${String(minutes).padStart(2, '0')}${String(seconds).padStart(2, '0')}`;
  }

  reset() {
    this.stop();
    this.remainingTime = 0;
    this.updateDisplay('000000'); // Sets this.time to '000000' and display to 00:00:00
    this.display.classList.remove('finished');
  }
}

// Initialize Time Tools
function initializeTimeTools() {
  // Stopwatch
  const stopwatchDisplay = document.querySelector('.stopwatch .display');
  const stopwatch = new Stopwatch(stopwatchDisplay);
  document.querySelector('.stopwatch .start-stop').addEventListener('click', () => {
    stopwatch.startStop();
  });
  document.querySelector('.stopwatch .reset').addEventListener('click', () => {
    stopwatch.reset();
  });

  // Timer
  const timerDisplay = document.querySelector('.timer .display');
  const timer = new Timer(timerDisplay);
  document.querySelector('.timer .start-stop').addEventListener('click', () => {
    timer.startStop();
  });
  document.querySelector('.timer .reset').addEventListener('click', () => {
    timer.reset();
  });
}

















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

const lensBtn = document.getElementById('lens-btn');
const lensInput = document.getElementById('lens-input');
const searchBar = document.querySelector('.search-bar');

if (lensBtn) {
    lensBtn.addEventListener('click', () => {
        window.open('https://www.bing.com/visualsearch', '_blank');
    });
}

if (searchBar) {
    searchBar.addEventListener('dragover', e => {
        e.preventDefault();
        searchBar.classList.add('drag-over');
    });

    searchBar.addEventListener('dragleave', e => {
        searchBar.classList.remove('drag-over');
    });

    searchBar.addEventListener('drop', e => {
        e.preventDefault();
        searchBar.classList.remove('drag-over');
        window.open('https://www.bing.com/visualsearch', '_blank');
    });
}

// Fetch and populate currency dropdowns
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
            
            domElements.currency.fromSelect.value = 'EUR';
            domElements.currency.toSelect.value = 'HUF';

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
        domElements.currency.resultDiv.textContent = '';
        return;
    }

    try {
        const response = await fetch(`https://api.frankfurter.app/latest?from=${from}&to=${to}`);
        const data = await response.json();
        const rate = data.rates[to];
        const result = amount * rate;

        const numberFormatter = new Intl.NumberFormat('hu-HU', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
            useGrouping: true
        });

        const currencyFormatter = new Intl.NumberFormat('hu-HU', {
            style: 'currency',
            currency: to,
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        });

        const formattedResult = currencyFormatter.format(result);

        domElements.currency.resultDiv.textContent = `${formattedResult}`;
    } catch (error) {
        console.error('Error fetching exchange rate:', error);
        domElements.currency.resultDiv.textContent = 'Error fetching exchange rate. Please try again later.';
    }
}

// Swap the selected currencies
function swapCurrencies() {
    const from = domElements.currency.fromSelect?.value;
    const to = domElements.currency.toSelect?.value;
    domElements.currency.fromSelect.value = to;
    domElements.currency.toSelect.value = from;
    convertCurrency();
}

// Add automatic conversion with debounce
if (domElements.currency.amountInput) {
    let debounceTimer;
    domElements.currency.amountInput.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            convertCurrency();
        }, 100); // 300ms debounce delay
    });
}

function handleShortcutClick(event) {
    if (event.button === 1 || event.ctrlKey || event.metaKey) {
        return true;
    }
    
    event.preventDefault();
    window.location.href = event.currentTarget.href;
    return false;
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
            if (dateRange && selectedEngine === 'google') params += '&tbs=qdr:' + dateRange;
        }

        if (query) {
            const engine = searchEngines.find(e => e.id === selectedEngine);
            if (engine) {
                let searchUrl = `${engine.url}${encodeURIComponent(query)}`;
                if (selectedEngine === 'google' && params) {
                    searchUrl += params;
                }
                window.open(searchUrl, '_blank');
            }
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

function reorderShortcuts(fromIndex, toIndex) {
    const [movedShortcut] = shortcutsConfig.shortcuts.splice(fromIndex, 1);
    shortcutsConfig.shortcuts.splice(toIndex, 0, movedShortcut);
    renderShortcuts();
}

function loadShortcuts() {
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
    
    localStorage.setItem('shortcutsConfig', JSON.stringify(shortcutsConfig));
    if (domElements.shortcuts.newName && domElements.shortcuts.newUrl) {
        domElements.shortcuts.newName.value = '';
        domElements.shortcuts.newUrl.value = '';
    }
    toggleAddMode();
    renderShortcuts();
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
    
    localStorage.setItem('shortcutsConfig', JSON.stringify(shortcutsConfig));
    console.log('Shortcut updated:', { name, url });
    cancelEditingShortcut();
    renderShortcuts();
}

function deleteShortcut(index) {
    if (index === null || index < 0 || index >= shortcutsConfig.shortcuts.length) {
        console.error('Invalid edit index:', index);
        return;
    }
    
    shortcutsConfig.shortcuts.splice(index, 1);
    localStorage.setItem('shortcutsConfig', JSON.stringify(shortcutsConfig));
    console.log('Shortcut deleted at index:', index);
    renderShortcuts();
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
        const rssUrl = 'https://www.bloomberg.com/feeds/podcasts/financial-wellness.rss';
        const response = await fetch(rssUrl);
        const text = await response.text();
        
        const parser = new DOMParser();
        const rss = parser.parseFromString(text, 'text/xml');
        const items = rss.querySelectorAll('item');
        
        const newsContainer = document.getElementById('news-container');
        newsContainer.innerHTML = '';
        
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

const searchEngines = [
    { id: 'google', name: 'Google', url: 'https://www.google.com/search?q=', icon: 'https://www.google.com/favicon.ico' },
    { id: 'bing', name: 'Bing', url: 'https://www.bing.com/search?q=', icon: 'https://www.bing.com/favicon.ico' },
    { id: 'duckduckgo', name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=', icon: 'https://duckduckgo.com/favicon.ico' },
    { id: 'brave', name: 'Brave', url: 'https://search.brave.com/search?q=', icon: 'https://search.brave.com/favicon.ico' },
    { id: 'yandex', name: 'Yandex', url: 'https://yandex.com/search/?text=', icon: 'https://yandex.com/favicon.ico' },
    { id: 'startpage', name: 'Startpage', url: 'https://startpage.com/do/dsearch?query=', icon: 'https://startpage.com/favicon.ico' },
    { id: 'baidu', name: 'Baidu', url: 'https://www.baidu.com/s?wd=', icon: 'https://www.baidu.com/favicon.ico' }
];
let selectedEngine = 'google';

function initializeEngineSettings() {
    const engineSelect = document.getElementById('search-engine-select');
    engineSelect.value = selectedEngine;
    engineSelect.addEventListener('change', (e) => {
        selectedEngine = e.target.value;
    });
}

function init() {
    checkDomElements();
    updateClock();
    setInterval(updateClock, 1000);
    setupSearch();
    loadShortcuts();
    loadCurrencies();
    initializeEngineSettings();
    initializeTimeTools(); // Add this line

    if (domElements.currency.swapButton) {
        domElements.currency.swapButton.addEventListener('click', swapCurrencies);
    }
    if (domElements.shortcuts.addButton) {
        domElements.shortcuts.addButton.addEventListener('click', addShortcut);
    }
    if (domElements.edit.saveButton) {
        domElements.edit.saveButton.addEventListener('click', saveEditedShortcut);
    }
    if (domElements.edit.deleteButton) {
        domElements.edit.deleteButton.addEventListener('click', () => deleteShortcut(currentEditIndex));
    }
    if (domElements.edit.cancelButton) {
        domElements.edit.cancelButton.addEventListener('click', cancelEditingShortcut);
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
    
    const engineSelect = document.getElementById('search-engine-select');
    engineSelect.addEventListener('change', (e) => {
        selectedEngine = e.target.value;
    });

    initializeEngineSettings();
}

document.addEventListener('DOMContentLoaded', init);