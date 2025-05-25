import { domElements } from './dom.js';

export const searchEngines = [
    { id: 'google', name: 'Google', url: 'https://www.google.com/search?q=', icon: 'https://www.google.com/favicon.ico' },
    { id: 'bing', name: 'Bing', url: 'https://www.bing.com/search?q=', icon: 'https://www.bing.com/favicon.ico' },
    { id: 'duckduckgo', name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=', icon: 'https://duckduckgo.com/favicon.ico' },
    { id: 'brave', name: 'Brave', url: 'https://search.brave.com/search?q=', icon: 'https://search.brave.com/favicon.ico' },
    { id: 'yandex', name: 'Yandex', url: 'https://yandex.com/search/?text=', icon: 'https://yandex.com/favicon.ico' },
    { id: 'startpage', name: 'Startpage', url: 'https://startpage.com/do/dsearch?query=', icon: 'https://startpage.com/favicon.ico' },
    { id: 'baidu', name: 'Baidu', url: 'https://www.baidu.com/s?wd=', icon: 'https://www.baidu.com/favicon.ico' }
];
export let selectedEngine = 'google';


export function initializeSearchSettings() {
    const engineSelect = document.getElementById('search-engine-select');
    if (engineSelect) {
        engineSelect.value = selectedEngine;
        engineSelect.addEventListener('change', (e) => {
            selectedEngine = e.target.value;
            console.log('Selected engine:', selectedEngine);
        });
    } else {
        console.error('Search engine not found');
    }
}


export function setupSearch() {
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
                chrome.tabs.create({ url: searchUrl });
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

export function toggleAdvancedSearch() {
    if (domElements.advancedSearch) {
        const isVisible = domElements.advancedSearch.style.display !== 'none';
        domElements.advancedSearch.style.display = isVisible ? 'none' : 'block';
        domElements.search.advancedButton.textContent = isVisible ? 'Advanced' : 'Hide Advanced';
    }
}

const lensBtn = document.getElementById('lens-btn');
const lensInput = document.getElementById('lens-input');
const searchBar = document.querySelector('.search-bar');

if (lensBtn) {
    lensBtn.addEventListener('click', () => {
        chrome.tabs.create({ url: 'https://www.bing.com/visualsearch' });
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
        chrome.tabs.create({ url: 'https://www.bing.com/visualsearch' });
    });
}