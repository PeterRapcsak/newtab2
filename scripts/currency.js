import { domElements } from './dom.js';

export const exchangeRateCache = {};
export const CACHE_EXPIRATION = 3600000;
export let lastEditedInput = 'amount';

export async function loadCurrencies() {
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
            domElements.currency.amountInput.value = '1';
            convertCurrency('amount');
        }
    } catch (error) {
        console.error('Error fetching currencies:', error);
    }
}

export async function convertCurrency(source) {
    const from = domElements.currency.fromSelect?.value;
    const to = domElements.currency.toSelect?.value;
    let amount, result;

    if (source === 'amount') {
        amount = parseFloat(domElements.currency.amountInput?.value);
        if (isNaN(amount) || amount < 0) {
            domElements.currency.resultInput.value = '';
            return;
        }
    } else {
        result = parseFloat(domElements.currency.resultInput?.value);
        if (isNaN(result) || result < 0) {
            domElements.currency.amountInput.value = '';
            return;
        }
    }

    const cacheKey = `${from}_${to}`;
    const now = Date.now();

    if (exchangeRateCache[cacheKey] && (now - exchangeRateCache[cacheKey].timestamp < CACHE_EXPIRATION)) {
        const rate = exchangeRateCache[cacheKey].rate;
        if (source === 'amount') {
            result = amount * rate;
            domElements.currency.resultInput.value = result.toFixed(2);
        } else {
            amount = result / rate;
            domElements.currency.amountInput.value = amount.toFixed(2);
        }
    } else {
        try {
            const response = await fetch(`https://api.frankfurter.app/latest?from=${from}&to=${to}`);
            const data = await response.json();
            const rate = data.rates[to];
            exchangeRateCache[cacheKey] = { rate, timestamp: now };
            if (source === 'amount') {
                result = amount * rate;
                domElements.currency.resultInput.value = result.toFixed(2);
            } else {
                amount = result / rate;
                domElements.currency.amountInput.value = amount.toFixed(2);
            }
        } catch (error) {
            console.error('Error fetching exchange rate:', error);
            domElements.currency.resultInput.value = '';
            domElements.currency.amountInput.value = '';
        }
    }
}

export function setupCurrencyInputs() {
    let debounceTimer;
    if (domElements.currency.amountInput) {
        domElements.currency.amountInput.addEventListener('input', () => {
            lastEditedInput = 'amount';
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                convertCurrency('amount');
            }, 300);
        });
    }
    if (domElements.currency.resultInput) {
        domElements.currency.resultInput.addEventListener('input', () => {
            lastEditedInput = 'result';
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                convertCurrency('result');
            }, 300);
        });
    }
    if (domElements.currency.fromSelect) {
        domElements.currency.fromSelect.addEventListener('change', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                convertCurrency(lastEditedInput);
            }, 300);
        });
    }
    if (domElements.currency.toSelect) {
        domElements.currency.toSelect.addEventListener('change', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                convertCurrency(lastEditedInput);
            }, 300);
        });
    }
}