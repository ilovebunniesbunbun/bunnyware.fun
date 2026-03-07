document.addEventListener("DOMContentLoaded", () => {
    const searchBtn = document.getElementById("search-btn");
    const searchInput = document.getElementById("search-input");

    // Math using BigInt for SteamID64 conversion
    const STEAM64_BASE = 76561197960265728n;

    function parseInput(input) {
        // split by space, comma, newline
        const tokens = input.split(/[\s,]+/).filter(t => t.trim() !== "");
        const steamID64s = [];
        const vanityNames = [];

        tokens.forEach(token => {
            // Check if it's already a 17-digit SteamID64
            if (/^7656[\d]{13}$/.test(token)) {
                steamID64s.push(token);
                return;
            }

            // Check if it's a profile URL with STEAMID64 (e.g. steamcommunity.com/profiles/765611.../)
            const profileMatch = token.match(/profiles\/(7656[\d]{13})/);
            if (profileMatch) {
                steamID64s.push(profileMatch[1]);
                return;
            }

            // Check if it's a standard SteamID (e.g. STEAM_0:1:12345678)
            const steamIDMatch = token.match(/STEAM_0:([01]):(\d+)/);
            if (steamIDMatch) {
                const Y = BigInt(steamIDMatch[1]);
                const Z = BigInt(steamIDMatch[2]);
                const W = (Z * 2n) + Y;
                const steamID64 = STEAM64_BASE + W;
                steamID64s.push(steamID64.toString());
                return;
            }

            // Check if it's a SteamID3 (e.g. [U:1:12345678] or simply U:1:12345678)
            const steamID3Match = token.match(/\[?U:1:(\d+)\]?/);
            if (steamID3Match) {
                const W = BigInt(steamID3Match[1]);
                const steamID64 = STEAM64_BASE + W;
                steamID64s.push(steamID64.toString());
                return;
            }

            // Check if it's a vanity URL (e.g. steamcommunity.com/id/customurl/ or https://steamcommunity.com/id/customurl/)
            const vanityMatch = token.match(/\/id\/([^\/\s?]+)/);
            if (vanityMatch) {
                vanityNames.push(vanityMatch[1]);
                return;
            }

            // Fallback: treat as a potential vanity name (e.g. just "bastet-")
            // Only if it doesn't look like a number or known format
            if (!/^\d+$/.test(token)) {
                vanityNames.push(token);
            } else {
                steamID64s.push(token);
            }
        });

        return {
            steamID64s: [...new Set(steamID64s)],
            vanityNames: [...new Set(vanityNames)]
        };
    }

    async function resolveVanityName(vanityName, steamKey) {
        try {
            const res = await fetch(`/api/resolve?key=${steamKey}&vanityurl=${encodeURIComponent(vanityName)}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            if (data.response && data.response.success === 1 && data.response.steamid) {
                return data.response.steamid;
            }
            return null;
        } catch (e) {
            console.error(`Failed to resolve vanity "${vanityName}":`, e);
            return null;
        }
    }

    searchBtn.addEventListener("click", async () => {
        const input = searchInput.value;
        const { steamID64s, vanityNames } = parseInput(input);

        if (steamID64s.length === 0 && vanityNames.length === 0) {
            alert("No valid SteamIDs or Profile URLs recognized. Try providing standard SteamIDs, SteamID64s, or vanity URLs.");
            return;
        }

        // Get steam key for vanity resolution
        let steamKey = "";
        const steamMatch = document.cookie.match(/(^| )steam_key=([^;]+)/);
        if (steamMatch) steamKey = steamMatch[2];

        // Resolve vanity names if we have any
        if (vanityNames.length > 0) {
            if (!steamKey) {
                alert("A Steam Web API Key is required to resolve vanity URLs. Please set one using the 'Set API Key' button.");
                return;
            }

            searchBtn.disabled = true;
            searchBtn.textContent = "Resolving...";

            const resolvePromises = vanityNames.map(name => resolveVanityName(name, steamKey));
            const results = await Promise.all(resolvePromises);

            const failed = [];
            results.forEach((id, i) => {
                if (id) {
                    steamID64s.push(id);
                } else {
                    failed.push(vanityNames[i]);
                }
            });

            searchBtn.disabled = false;
            searchBtn.textContent = "Check Stats";

            if (failed.length > 0) {
                alert(`Could not resolve the following vanity URL(s): ${failed.join(", ")}`);
            }
        }

        const uniqueIds = [...new Set(steamID64s)];
        if (uniqueIds.length === 0) {
            alert("No valid SteamIDs could be resolved.");
            return;
        }

        // Build the query parameter string, delimited by '+'
        const queryParam = uniqueIds.join('+');

        // Get steam key if available
        let steamKeyParam = "";
        if (steamKey) steamKeyParam = `&steamkey=${steamKey}`;

        // Get leetify key
        let leetifyKeyParam = "";
        const leetifyMatch = document.cookie.match(/(^| )leetify_key=([^;]+)/);
        if (leetifyMatch) leetifyKeyParam = `&leetifykey=${leetifyMatch[2]}`;

        // Redirect to the search subdomain. 
        window.location.href = `https://search.bunnyware.fun/index.html?profile=${queryParam}${leetifyKeyParam}${steamKeyParam}`;
    });

    // Allow Enter key to submit
    searchInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            searchBtn.click();
        }
    });

    // API Key Modal Functionality
    const apiModal = document.getElementById("api-key-modal");
    const apiBtn = document.getElementById("api-key-btn");
    const closeApiBtn = document.getElementById("close-api-modal");
    const saveApiBtn = document.getElementById("save-api-keys");
    const leetifyInput = document.getElementById("leetify-key-input");
    const steamInput = document.getElementById("steam-key-input");
    const apiStatus = document.getElementById("api-key-status");

    function openApiModal(e) {
        if (e) e.preventDefault();
        apiModal.style.display = "flex";
        apiStatus.textContent = "";

        // Pre-fill Leetify key
        const lMatch = document.cookie.match(/(^| )leetify_key=([^;]+)/);
        if (lMatch) leetifyInput.value = lMatch[2];

        // Pre-fill Steam key
        const sMatch = document.cookie.match(/(^| )steam_key=([^;]+)/);
        if (sMatch) steamInput.value = sMatch[2];
    }

    function closeApiModal() {
        apiModal.style.display = "none";
    }

    if (apiBtn) apiBtn.addEventListener('click', openApiModal);
    if (closeApiBtn) closeApiBtn.addEventListener('click', closeApiModal);

    apiModal.addEventListener('click', function (e) {
        if (e.target === apiModal) {
            closeApiModal();
        }
    });

    // Close modal with Escape key
    document.addEventListener('keydown', function (e) {
        if (e.key === "Escape" && apiModal.style.display === "flex") {
            closeApiModal();
        }
    });

    if (saveApiBtn) {
        saveApiBtn.addEventListener('click', function () {
            const lKey = leetifyInput.value.trim();
            const sKey = steamInput.value.trim();

            // Save cookies for 365 days
            document.cookie = `leetify_key=${lKey}; max-age=${365 * 24 * 60 * 60}; path=/; SameSite=Strict`;
            document.cookie = `steam_key=${sKey}; max-age=${365 * 24 * 60 * 60}; path=/; SameSite=Strict`;

            apiStatus.style.color = "#98f8c1";
            apiStatus.textContent = "API Keys saved successfully!";
            setTimeout(() => {
                closeApiModal();
            }, 1000);
        });
    }
});
