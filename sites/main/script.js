// Image Modal Functionality
const modal = document.getElementById("image-modal");
const modalImg = document.getElementById("expanded-img");

function openModal(imageSrc) {
    modal.style.display = "flex";
    modalImg.src = imageSrc;
}

function closeModal() {
    modal.style.display = "none";
}

// Close modal when clicking outside the image
modal.addEventListener('click', function (e) {
    if (e.target === modal) {
        closeModal();
    }
});

// Close modal with Escape key
document.addEventListener('keydown', function (e) {
    if (e.key === "Escape") {
        if (modal.style.display === "flex") closeModal();
    }
});

// Troll Pay Button Logic
const payButton = document.getElementById("pay-button");

payButton.addEventListener('click', function () {
    // Redirects to YouTube video when clicked
    // The hover state won't show the link in the status bar because it's a button, not an <a> tag
    window.location.href = 'https://www.youtube.com/watch?v=EvAhPPejzBQ';
});

// Hamburger Menu Toggle
const hamburger = document.getElementById('hamburger');
const navLinks = document.querySelector('.nav-links');

if (hamburger && navLinks) {
    hamburger.addEventListener('click', function () {
        hamburger.classList.toggle('active');
        navLinks.classList.toggle('open');
    });

    // Close menu when a nav link is clicked
    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navLinks.classList.remove('open');
        });
    });
}

// Typewriter Effect with Typo
document.addEventListener("DOMContentLoaded", function () {
    const titleElement = document.querySelector(".title");
    if (!titleElement) return;

    // Clear the server-side text content but leave a zero-width space 
    // so the container doesn't completely collapse its height/baseline.
    titleElement.textContent = "\u200B";

    const typeWord = async (word, speed = 150) => {
        for (let i = 0; i < word.length; i++) {
            // Remove the zero-width space right before the first real letter is typed
            if (titleElement.textContent === "\u200B") {
                titleElement.textContent = "";
            }
            titleElement.textContent += word[i];
            // Add a little randomness to typing speed for realism
            const randomSpeed = speed + (Math.random() * 50 - 25);
            await new Promise(resolve => setTimeout(resolve, randomSpeed));
        }
    };

    const deleteWord = async (count, speed = 100) => {
        for (let i = 0; i < count; i++) {
            titleElement.textContent = titleElement.textContent.slice(0, -1);
            await new Promise(resolve => setTimeout(resolve, speed));
        }
    };

    const runTypewriter = async () => {
        // Wait before starting
        await new Promise(resolve => setTimeout(resolve, 500));

        // Type the typo: "bnuyy"
        await typeWord("bnuyy", 150);

        // Pause so the user notices the typo
        await new Promise(resolve => setTimeout(resolve, 800));

        // Delete 4 characters back to leave "b"
        await deleteWord(4, 100);

        // Brief pause before correcting
        await new Promise(resolve => setTimeout(resolve, 300));

        // Type the rest of the correct word
        await typeWord("unnyware", 120);

        // Wait 1.5s and then remove the flashing cursor
        await new Promise(resolve => setTimeout(resolve, 1500));
        titleElement.classList.add("done-typing");
    };

    runTypewriter();
});
