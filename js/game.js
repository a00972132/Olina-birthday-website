function initBirthdayGames() {
    if (window.__birthdayGamesInitialized) {
        return;
    }

    window.__birthdayGamesInitialized = true;

    const stage = document.getElementById("game-stage");
    const form = document.getElementById("game-form");
    const input = document.getElementById("location-guess");
    const feedback = document.getElementById("game-feedback");
    const prompt = document.getElementById("game-prompt");
    const nextButton = document.getElementById("next-round");
    const scoreValue = document.getElementById("score-value");
    const streakValue = document.getElementById("streak-value");
    const roundValue = document.getElementById("round-number");

    if (stage && form && input && feedback && prompt && nextButton && scoreValue && streakValue && roundValue) {
        const state = {
            memories: [],
            currentMemory: null,
            usedIndices: new Set(),
            score: 0,
            streak: 0,
            bestStreak: 0,
            round: 1,
            locked: false
        };

        form.addEventListener("submit", (event) => {
            event.preventDefault();

            if (!state.currentMemory || state.locked) {
                return;
            }

            const guess = input.value.trim();

            if (!guess) {
                setFeedback("Pick a location first.", "error");
                return;
            }

            state.locked = true;
            nextButton.disabled = false;

            if (guess === state.currentMemory.location) {
                state.score += 1;
                state.streak += 1;
                state.bestStreak = Math.max(state.bestStreak, state.streak);
                setFeedback("Correct. That memory matches perfectly.", "success");

                if (window.BirthdaySite && typeof window.BirthdaySite.launchConfetti === "function") {
                    window.BirthdaySite.launchConfetti(16);
                }
            } else {
                state.streak = 0;
                setFeedback("Not quite. Try the next memory and keep the mystery alive.", "error");
            }

            syncScore();
        });

        nextButton.addEventListener("click", () => {
            state.round += 1;
            renderRound();
        });

        document.addEventListener("birthday:memories-ready", (event) => {
            setMemories(event.detail);
        });

        if (window.BirthdaySite && Array.isArray(window.BirthdaySite.memories) && window.BirthdaySite.memories.length) {
            setMemories(window.BirthdaySite.memories);
        } else {
            stage.innerHTML = "<p class=\"game-stage-note\">Waiting for memory data...</p>";
        }

        function setMemories(memories) {
            state.memories = memories.filter((memory) => typeof memory.location === "string" && memory.location.trim());

            if (!state.memories.length) {
                prompt.textContent = "Add memories with a location value to play the game.";
                stage.innerHTML = "<p class=\"game-stage-note\">No playable memories yet.</p>";
                return;
            }

            populateLocationOptions(state.memories);
            renderRound();
        }

        function renderRound() {
            const memory = pickMemory();

            if (!memory) {
                prompt.textContent = "No memory available for this round.";
                stage.innerHTML = "<p class=\"game-stage-note\">Try adding more memories.</p>";
                return;
            }

            state.currentMemory = memory;
            state.locked = false;
            roundValue.textContent = String(state.round);
            input.value = "";
            nextButton.disabled = true;
            feedback.textContent = "";
            feedback.className = "game-feedback";

            prompt.textContent = `${memory.title}: where was this taken?`;
            stage.innerHTML = "";

            const wrapper = document.createElement("div");
            wrapper.className = "game-memory";

            const visualFactory = window.BirthdaySite && typeof window.BirthdaySite.createMemoryVisual === "function"
                ? window.BirthdaySite.createMemoryVisual
                : null;

            if (visualFactory) {
                wrapper.appendChild(visualFactory(memory, { compact: true, showBadge: false }));
            }

            const caption = document.createElement("p");
            caption.className = "game-stage-note";
            caption.textContent = memory.caption || "A strong birthday memory.";

            wrapper.appendChild(caption);
            stage.appendChild(wrapper);
        }

        function pickMemory() {
            if (!state.memories.length) {
                return null;
            }

            if (state.usedIndices.size === state.memories.length) {
                state.usedIndices.clear();
            }

            let index = Math.floor(Math.random() * state.memories.length);

            while (state.usedIndices.has(index) && state.usedIndices.size < state.memories.length) {
                index = Math.floor(Math.random() * state.memories.length);
            }

            state.usedIndices.add(index);
            return state.memories[index];
        }

        function setFeedback(message, tone) {
            feedback.textContent = message;
            feedback.className = `game-feedback ${tone === "success" ? "is-success" : "is-error"}`;
        }

        function populateLocationOptions(memories) {
            const locations = [...new Set(memories.map((memory) => memory.location).filter(Boolean))].sort((left, right) =>
                left.localeCompare(right)
            );

            input.innerHTML = "";

            const placeholder = document.createElement("option");
            placeholder.value = "";
            placeholder.textContent = "Choose a location";
            input.appendChild(placeholder);

            locations.forEach((location) => {
                const option = document.createElement("option");
                option.value = location;
                option.textContent = location;
                input.appendChild(option);
            });
        }

        function syncScore() {
            scoreValue.textContent = String(state.score);
            streakValue.textContent = String(state.bestStreak);
        }
    }

    initTruthDareRoulette();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initBirthdayGames);
} else {
    initBirthdayGames();
}

window.addEventListener("load", initBirthdayGames);

function initTruthDareRoulette() {
    const truths = [
        "Who's your most dangerous crush right now?",
        "What's the pettiest reason you've ever disliked someone?",
        "Which person here would survive best on a chaotic girls trip?",
        "What is one text you almost sent and definitely should not have?",
        "What's your most irrational ick?",
        "Who here would you trust to hide a body and why?"
    ];
    const dares = [
        "Do your hottest runway walk across the room right now.",
        "Send a dramatic voice note saying only 'it's happening.'",
        "Let the group choose a new lock-screen pose for you.",
        "Recreate your best flirty face for ten full seconds.",
        "Call someone 'legend' in your next text, no explanation.",
        "Give an acceptance speech for winning hottest person alive."
    ];
    const truthWheel = document.getElementById("truth-wheel");
    const dareWheel = document.getElementById("dare-wheel");
    const truthResult = document.getElementById("truth-result");
    const dareResult = document.getElementById("dare-result");
    const spinButton = document.getElementById("spin-roulette");
    const spinAgainButton = document.getElementById("spin-again");
    const feedback = document.getElementById("roulette-feedback");

    if (!truthWheel || !dareWheel || !truthResult || !dareResult || !spinButton || !spinAgainButton || !feedback) {
        return;
    }

    let truthRotation = 0;
    let dareRotation = 0;
    let spinning = false;
    let lastTruth = "";
    let lastDare = "";

    spinButton.addEventListener("click", spin);
    spinAgainButton.addEventListener("click", spin);

    function spin() {
        if (spinning) {
            return;
        }

        spinning = true;
        spinButton.disabled = true;
        spinAgainButton.disabled = true;
        feedback.textContent = "Spinning...";
        feedback.className = "game-feedback";

        const truthPick = pickOne(truths, lastTruth);
        const darePick = pickOne(dares, lastDare);

        lastTruth = truthPick;
        lastDare = darePick;

        truthRotation += 1260 + Math.floor(Math.random() * 540);
        dareRotation += 1380 + Math.floor(Math.random() * 620);

        truthWheel.style.transform = `rotate(${truthRotation}deg)`;
        dareWheel.style.transform = `rotate(${dareRotation}deg)`;

        truthResult.textContent = "Truth loading...";
        dareResult.textContent = "Dare loading...";

        window.setTimeout(() => {
            truthResult.textContent = truthPick;
            dareResult.textContent = darePick;
            feedback.textContent = "";
            feedback.className = "game-feedback";
            spinning = false;
            spinButton.disabled = false;
            spinAgainButton.disabled = false;

            if (window.BirthdaySite && typeof window.BirthdaySite.launchConfetti === "function") {
                window.BirthdaySite.launchConfetti(14);
            }
        }, 3250);
    }

    function pickOne(options, previousValue) {
        if (options.length < 2) {
            return options[0];
        }

        let nextValue = options[Math.floor(Math.random() * options.length)];

        while (nextValue === previousValue) {
            nextValue = options[Math.floor(Math.random() * options.length)];
        }

        return nextValue;
    }
}

function initChessGame() {
    return;
}
