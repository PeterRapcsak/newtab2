export const domElements = {
    clock: {
        hours: document.getElementById('digi-hours'),
        minutes: document.getElementById('digi-minutes'),
        ampm: document.getElementById('am-pm')
    },
    currency: {
        fromSelect: document.getElementById('from-currency'),
        toSelect: document.getElementById('to-currency'),
        amountInput: document.getElementById('amount'),
        resultInput: document.getElementById('result')
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
    buttons: {
        edit: null,
        new: null,
        import: null,
        export: null
    }
};