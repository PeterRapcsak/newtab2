import { domElements } from './dom.js';

export function updateClock() {
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

export function startClock() {
    updateClock();
    setInterval(updateClock, 1000);
}