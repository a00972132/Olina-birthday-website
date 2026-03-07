const BirthdaySite = {
    memories: [],
    createMemoryVisual,
    launchConfetti
};

window.BirthdaySite = BirthdaySite;

document.addEventListener("DOMContentLoaded", () => {
    initComplimentSpotlight();
    initConfettiTriggers();
    initLetterReveal();
    loadMemories();

    window.setTimeout(() => {
        launchConfetti(18);
    }, 350);
});

function initComplimentSpotlight() {
    const spotlightText = document.getElementById("spotlight-text");
    const spotlightButton = document.getElementById("spotlight-button");
    const compliments = [
        "Olina has the kind of energy that makes even ordinary days feel properly eventful.",
        "If birthdays were ranked by vibe alone, this one already won because it belongs to Olina.",
        "Stylish, funny, warm, and impossible to forget is a strong combination.",
        "Some people light up a room. Olina apparently upgraded that feature to full neighborhood coverage."
    ];

    if (!spotlightText || !spotlightButton) {
        return;
    }

    let currentIndex = 0;

    const renderCompliment = () => {
        spotlightText.textContent = compliments[currentIndex];
        currentIndex = (currentIndex + 1) % compliments.length;
    };

    spotlightButton.addEventListener("click", renderCompliment);
    renderCompliment();
}

function initConfettiTriggers() {
    document.querySelectorAll("[data-confetti-trigger]").forEach((button) => {
        button.addEventListener("click", () => launchConfetti(28));
    });
}

function initLetterReveal() {
    const trigger = document.getElementById("open-letter");
    const stage = document.getElementById("letter-stage");
    const card = document.getElementById("letter-card");

    if (!trigger || !stage || !card) {
        return;
    }

    trigger.addEventListener("click", () => {
        const isOpen = stage.classList.toggle("is-open");
        trigger.setAttribute("aria-expanded", String(isOpen));
        card.setAttribute("aria-hidden", String(!isOpen));

        if (isOpen) {
            launchConfetti(26);
        }
    });
}

async function loadMemories() {
    const grid = document.getElementById("photo-grid");
    const status = document.getElementById("gallery-status");

    if (!grid || !status) {
        return;
    }

    try {
        const response = await fetch("data/photos.json");

        if (!response.ok) {
            throw new Error(`Request failed with ${response.status}`);
        }

        const data = await response.json();
        const memories = Array.isArray(data) ? data : [];

        BirthdaySite.memories = memories;
        renderGallery(memories, grid, status);
        document.dispatchEvent(new CustomEvent("birthday:memories-ready", { detail: memories }));
    } catch (error) {
        console.warn("Unable to fetch memories directly, using embedded fallback data instead.", error);

        const fallbackMemories = readEmbeddedMemories();

        if (!fallbackMemories.length) {
            status.textContent = "";
            return;
        }

        BirthdaySite.memories = fallbackMemories;
        renderGallery(fallbackMemories, grid, status);
        status.textContent = "";
        document.dispatchEvent(new CustomEvent("birthday:memories-ready", { detail: fallbackMemories }));
    }
}

function readEmbeddedMemories() {
    const embeddedData = document.getElementById("photo-data");

    if (!embeddedData) {
        return [];
    }

    try {
        const parsed = JSON.parse(embeddedData.textContent);
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.error("Embedded photo data is invalid:", error);
        return [];
    }
}

function renderGallery(memories, grid, status) {
    grid.innerHTML = "";

    if (!memories.length) {
        status.textContent = "";
        return;
    }

    status.textContent = "";

    memories.forEach((memory) => {
        const card = document.createElement("article");
        card.className = "memory-card";

        const visual = createMemoryVisual(memory, { showBadge: false });
        const copy = document.createElement("div");
        copy.className = "memory-copy";

        const title = document.createElement("h3");
        title.textContent = memory.title || "Birthday memory";

        const caption = document.createElement("p");
        caption.textContent = memory.caption || "A very good moment.";

        const note = document.createElement("small");
        note.textContent = memory.note || "";

        const ageGame = document.createElement("div");
        ageGame.className = "memory-age-game";

        const agePrompt = document.createElement("span");
        agePrompt.className = "memory-age-label";
        agePrompt.textContent = "Guess the age";

        const revealButton = document.createElement("button");
        revealButton.className = "mini-button memory-age-button";
        revealButton.type = "button";
        revealButton.textContent = "Reveal Age";

        const ageAnswer = document.createElement("small");
        ageAnswer.className = "memory-age-answer";
        ageAnswer.textContent = "";

        revealButton.addEventListener("click", () => {
            ageAnswer.textContent = "Answer: 18, obviously.";
        });

        ageGame.append(agePrompt, revealButton);
        copy.append(title, caption, note, ageGame, ageAnswer);
        card.append(visual, copy);
        grid.appendChild(card);
    });
}

function createMemoryVisual(memory, options = {}) {
    const { showBadge = false, compact = false } = options;
    const visual = document.createElement("div");
    visual.className = `memory-visual${compact ? " compact" : ""}`;

    const image = document.createElement("img");
    image.src = memory.src || "";
    image.alt = memory.caption || memory.title || "Birthday memory";
    image.loading = "lazy";

    image.addEventListener("error", () => {
        visual.innerHTML = "";
        visual.appendChild(createMemoryFallback(memory, { showBadge }));
    });

    if (memory.src) {
        visual.appendChild(image);
    } else {
        visual.appendChild(createMemoryFallback(memory, { showBadge }));
    }

    if (showBadge && Number.isFinite(Number(memory.age))) {
        const badge = document.createElement("span");
        badge.className = "memory-badge";
        badge.textContent = `Age ${memory.age}`;
        visual.appendChild(badge);
    }

    return visual;
}

function createMemoryFallback(memory, options = {}) {
    const { showBadge = false } = options;
    const fallback = document.createElement("div");
    fallback.className = "memory-fallback";

    const initials = document.createElement("strong");
    const sourceText = memory.title || memory.caption || "Olina";
    initials.textContent = sourceText
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0].toUpperCase())
        .join("");

    const label = document.createElement("span");
    label.textContent = showBadge && memory.age
        ? `${memory.title || "Birthday memory"} • age ${memory.age}`
        : memory.title || "Birthday memory";

    fallback.append(initials, label);
    return fallback;
}

function launchConfetti(count = 24) {
    const layer = document.getElementById("confetti-layer");
    const colors = ["#ef6f51", "#f4b942", "#2d8f85", "#bf4d6d", "#ffffff"];

    if (!layer) {
        return;
    }

    for (let index = 0; index < count; index += 1) {
        const piece = document.createElement("span");
        const startX = Math.random() * 100;
        const drift = (Math.random() - 0.5) * 24;
        const size = 8 + Math.random() * 12;

        piece.className = "confetti-piece";
        piece.style.left = `${startX}vw`;
        piece.style.width = `${size}px`;
        piece.style.height = `${size * 1.4}px`;
        piece.style.setProperty("--x-start", `${Math.random() * 20 - 10}vw`);
        piece.style.setProperty("--x-end", `${drift}vw`);
        piece.style.setProperty("--spin", `${Math.random() * 720 - 360}deg`);
        piece.style.setProperty("--piece-color", colors[index % colors.length]);
        piece.style.animationDelay = `${Math.random() * 180}ms`;

        layer.appendChild(piece);
        window.setTimeout(() => piece.remove(), 2200);
    }
}
