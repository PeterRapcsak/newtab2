export class Stopwatch {
    constructor(displayElement) {
        this.display = displayElement;
        this.running = false;
        this.time = 0;
        this.interval = null;
        this.display.contentEditable = false;
        this.updateDisplay();
    }

    start() {
        if (!this.running) {
            this.running = true;
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
            this.display.classList.remove('running');
        }
    }

    reset() {
        this.stop();
        this.time = 0;
        this.updateDisplay();
    }

    updateDisplay() {
        const totalSeconds = (this.time / 1000).toFixed(2);
        this.display.innerHTML = `
            <span class="digit">${totalSeconds}</span>
        `;
    }
}

export class Timer {
    constructor(displayElement) {
        this.display = displayElement;
        this.running = false;
        this.remainingTime = 0;
        this.interval = null;
        this.inputBuffer = '';
        this.display.setAttribute('tabindex', '0'); // Makes the element focusable
        this.display.contentEditable = false; // Prevents direct text editing
        this.display.setAttribute('aria-readonly', 'true'); // Accessibility

        // Prevent default behavior for all keydown events except numbers
        this.display.addEventListener('keydown', (e) => {
            if (this.running) {
                e.preventDefault();
                return;
            }
            if (/[0-9]/.test(e.key)) {
                e.preventDefault();
                this.handleInput(e.key);
            } else {
                e.preventDefault(); // Block all other keys
            }
        });

        // Prevent pasting or other input methods
        this.display.addEventListener('input', (e) => {
            e.preventDefault();
            this.updateDisplayFromSeconds(); // Revert to current time
        });

        // Prevent context menu or other interactions
        this.display.addEventListener('paste', (e) => e.preventDefault());
        this.display.addEventListener('cut', (e) => e.preventDefault());

        this.updateDisplayFromSeconds();
    }

    start() {
        if (this.remainingTime > 0 && !this.running) {
            this.running = true;
            this.display.classList.add('running');
            this.interval = setInterval(() => {
                if (--this.remainingTime <= 0) {
                    this.stop();
                    this.remainingTime = 0;
                    this.display.classList.add('finished');
                }
                this.updateDisplayFromSeconds();
            }, 1000);
        }
    }

    stop() {
        if (this.running) {
            clearInterval(this.interval);
            this.running = false;
            this.display.classList.remove('running', 'finished');
        }
    }

    reset() {
        this.stop();
        this.remainingTime = 0;
        this.inputBuffer = '';
        this.display.classList.remove('finished');
        this.updateDisplayFromSeconds();
    }

    setTime(seconds) {
        this.remainingTime = seconds;
        this.updateDisplayFromSeconds();
    }

    updateDisplayFromSeconds() {
        const hours = Math.floor(this.remainingTime / 3600);
        const minutes = Math.floor((this.remainingTime % 3600) / 60);
        const seconds = this.remainingTime % 60;
        this.display.innerHTML = `
            <span class="digit hours">${String(hours).padStart(2, '0')}</span><span class="time-segment">:</span>
            <span class="digit minutes">${String(minutes).padStart(2, '0')}</span><span class="time-segment">:</span>
            <span class="digit seconds">${String(seconds).padStart(2, '0')}</span>
        `;
    }

    handleInput(value) {
        if (this.running) return;
        this.inputBuffer = (this.inputBuffer + value).slice(-6);
        const padded = this.inputBuffer.padStart(6, '0');
        let hours = parseInt(padded.slice(0, 2)) || 0;
        let minutes = parseInt(padded.slice(2, 4)) || 0;
        let seconds = parseInt(padded.slice(4, 6)) || 0;
        hours = Math.min(hours, 99);
        minutes = Math.min(minutes, 59);
        seconds = Math.min(seconds, 59);
        this.remainingTime = hours * 3600 + minutes * 60 + seconds;
        this.updateDisplayFromSeconds();
    }
}

export let stopwatch;
export let timer;
export let activeTool = 'stopwatch';

export function initializeTimeTools() {
    const stopwatchDisplay = document.querySelector('.stopwatch .display');
    stopwatch = new Stopwatch(stopwatchDisplay);

    const timerDisplay = document.querySelector('.timer .display');
    timer = new Timer(timerDisplay);

    const hoursEl = timerDisplay.querySelector('.hours');
    const minutesEl = timerDisplay.querySelector('.minutes');
    const secondsEl = timerDisplay.querySelector('.seconds');

    const toggleButtons = document.querySelectorAll('.toggle-btn');
    const startStopBtn = document.querySelector('.controls .start-stop');
    const resetBtn = document.querySelector('.controls .reset');

    function updateUI() {
        const icon = startStopBtn.querySelector('i');
        const isRunning = activeTool === 'stopwatch' ? stopwatch.running : timer.running;
        icon.classList.toggle('fa-play', !isRunning);
        icon.classList.toggle('fa-pause', isRunning);
        startStopBtn.setAttribute('aria-label', isRunning ? 'Pause' : 'Start');
    }

    toggleButtons.forEach(button => {
        button.addEventListener('click', () => {
            const target = button.dataset.target;
            if (activeTool !== target) {
                activeTool = target;
                toggleButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                document.querySelector('.stopwatch').classList.toggle('active', target === 'stopwatch');
                document.querySelector('.timer').classList.toggle('active', target === 'timer');
                if (activeTool === 'stopwatch') {
                    stopwatch.updateDisplay();
                } else {
                    timer.updateDisplayFromSeconds();
                }
                updateUI();
            }
        });
    });

    startStopBtn.addEventListener('click', () => {
        if (activeTool === 'stopwatch') {
            if (stopwatch.running) stopwatch.stop();
            else stopwatch.start();
        } else {
            if (timer.running) timer.stop();
            else timer.start();
        }
        updateUI();
    });

    resetBtn.addEventListener('click', () => {
        if (activeTool === 'stopwatch') {
            stopwatch.reset();
        } else {
            timer.reset();
        }
        updateUI();
    });

    document.querySelector('.toggle-btn[data-target="stopwatch"]').classList.add('active');
    document.querySelector('.stopwatch').classList.add('active');
    updateUI();
}