document.addEventListener("DOMContentLoaded", async () => {
    const resultsGrid = document.getElementById("results-grid");
    const loadingText = document.getElementById("loading");

    // Parse URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const profileParam = urlParams.get('profile');
    const leetifyKeyParam = urlParams.get('leetifykey');
    const steamKeyParam = urlParams.get('steamkey');

    let leetifyKey = leetifyKeyParam;
    let steamKey = steamKeyParam;

    if (leetifyKey) {
        document.cookie = `leetify_key=${leetifyKey}; max-age=${365 * 24 * 60 * 60}; path=/; SameSite=Strict`;
    } else {
        const match = document.cookie.match(/(^| )leetify_key=([^;]+)/);
        if (match) leetifyKey = match[2];
    }

    if (steamKey) {
        document.cookie = `steam_key=${steamKey}; max-age=${365 * 24 * 60 * 60}; path=/; SameSite=Strict`;
    } else {
        const match = document.cookie.match(/(^| )steam_key=([^;]+)/);
        if (match) steamKey = match[2];
    }

    if (!profileParam) {
        loadingText.innerHTML = "No profiles provided in the URL.<br><a href='https://stats.bunnyware.fun/index.html'>Go back to search</a>";
        return;
    }

    if (!leetifyKey) {
        loadingText.innerHTML = "No Leetify API Key found.<br>Please set one at <a href='https://stats.bunnyware.fun/index.html'>the stats page</a>.";
        return;
    }

    // Split by literal '+' or spaces
    const profiles = profileParam.split(/[\s+]+/).filter(Boolean);

    loadingText.style.display = "none";

    // Fetch Steam avatars in bulk if possible, or one by one
    let steamAvatars = {};
    if (steamKey) {
        try {
            // Using internal Cloudflare Pages Function as a proxy
            const steamRes = await fetch(`/api/steam?key=${steamKey}&steamids=${profiles.join(',')}`);
            if (steamRes.ok) {
                const steamData = await steamRes.json();
                if (steamData.response && steamData.response.players) {
                    steamData.response.players.forEach(p => {
                        steamAvatars[p.steamid] = p.avatarfull;
                    });
                }
            }
        } catch (e) {
            console.error("Steam API (Proxy) Error:", e);
        }
    }

    for (const profileId of profiles) {
        await fetchAndRenderProfile(profileId, leetifyKey, steamAvatars[profileId]);
    }

    async function fetchAndRenderProfile(profileId, key, steamAvatar) {
        const cardNode = createPlaceholderCard(profileId);
        if (steamAvatar) {
            const avatarImg = cardNode.querySelector('.player-avatar');
            if (avatarImg) avatarImg.src = steamAvatar;
        }
        resultsGrid.appendChild(cardNode);

        try {
            const res = await fetch(`https://api-public.cs-prod.leetify.com/v3/profile?steam64_id=${profileId}`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${key}`,
                    "Accept": "application/json"
                }
            });

            if (!res.ok) {
                throw new Error(`Failed to load data for ${profileId} (${res.status})`);
            }

            const data = await res.json();
            updateCardWithData(cardNode, data, profileId);

        } catch (err) {
            console.error(err);
            cardNode.innerHTML = `<div class="error-text">Couldn't load stats for ${profileId}. Make sure it's a valid SteamID64 and API key is correct.</div>`;
        }
    }

    function createPlaceholderCard(profileId) {
        const template = document.getElementById("player-card-template");
        const node = template.content.cloneNode(true);
        const cardDiv = node.querySelector('.player-card');

        node.querySelector('.player-name').textContent = "Loading...";
        node.querySelector('.player-steamid').textContent = profileId;

        const wrapper = document.createElement("div");
        wrapper.appendChild(node);
        return wrapper.firstElementChild;
    }

    function updateCardWithData(card, data, profileId) {
        // Using the v3 public API schema from api-public-docs.cs-prod.leetify.com

        const name = data.name || profileId;
        // The new public API doesn't return avatarId, so we will use the default rabbit avatar
        const avatarUrl = 'baby_bun.png';

        const ranks = data.ranks || {};
        const rating = data.rating || {};
        const stats = data.stats || {};

        card.querySelector('.player-name').textContent = name;
        const currentAvatar = card.querySelector('.player-avatar').src;
        // Only set default if it's currently a placeholder or if it's explicitly the baby_bun and we have something else
        if (!currentAvatar || currentAvatar.includes('baby_bun.png')) {
            card.querySelector('.player-avatar').src = avatarUrl;
        }

        const ratingVal = card.querySelector('.rating-val');
        if (ranks.leetify != null) {
            ratingVal.textContent = ranks.leetify.toFixed(2);
            if (ranks.leetify > 10) ratingVal.style.color = "#ff6b6b"; // Red
            else if (ranks.leetify > 5) ratingVal.style.color = "#ffa94d"; // Orange
            else ratingVal.style.color = "#ffffff";
        } else {
            ratingVal.textContent = "N/A";
            ratingVal.style.color = "#ffffff";
        }

        // Aim Bar
        const aimVal = rating.aim != null ? Math.round(rating.aim) : 0;
        card.querySelector('.aim-val').textContent = rating.aim != null ? aimVal : "N/A";
        const aimFill = card.querySelector('.aim-fill');
        if (aimFill) {
            aimFill.style.width = aimVal + "%";
            if (aimVal <= 80) aimFill.style.backgroundColor = "#98f8c1"; // Green
            else if (aimVal <= 90) aimFill.style.backgroundColor = "#ffa94d"; // Orange
            else aimFill.style.backgroundColor = "#ff6b6b"; // Red
        }

        // Positioning Bar
        const posVal = rating.positioning != null ? Math.round(rating.positioning) : 0;
        card.querySelector('.pos-val').textContent = rating.positioning != null ? posVal : "N/A";
        const posFill = card.querySelector('.pos-fill');
        if (posFill) {
            posFill.style.width = posVal + "%";
            posFill.style.backgroundColor = "#ffffff";
        }

        // Utility Bar
        const utilVal = rating.utility != null ? Math.round(rating.utility) : 0;
        card.querySelector('.util-val').textContent = rating.utility != null ? utilVal : "N/A";
        const utilFill = card.querySelector('.util-fill');
        if (utilFill) {
            utilFill.style.width = utilVal + "%";
            utilFill.style.backgroundColor = "#ffffff";
        }

        // TTD (Reaction) Bar
        const ttdVal = stats.reaction_time_ms != null ? Math.round(stats.reaction_time_ms) : 0;
        card.querySelector('.ttd-val').textContent = stats.reaction_time_ms != null ? ttdVal + "ms" : "N/A";
        const ttdFill = card.querySelector('.ttd-fill');
        if (ttdFill) {
            const ttdPercent = Math.min((ttdVal / 1000) * 100, 100);
            ttdFill.style.width = ttdPercent + "%";
            if (ttdVal < 501) ttdFill.style.backgroundColor = "#ff6b6b"; // Red
            else if (ttdVal <= 550) ttdFill.style.backgroundColor = "#ffa94d"; // Orange
            else ttdFill.style.backgroundColor = "#98f8c1"; // Green
        }

        card.querySelector('.match-val').textContent = data.total_matches != null ? data.total_matches : "0";
        const wrVal = card.querySelector('.wr-val');
        if (data.winrate != null) {
            const winPercent = data.winrate * 100;
            wrVal.textContent = winPercent.toFixed(1) + "%";
            if (winPercent > 75) wrVal.style.color = "#ff6b6b"; // Red
            else wrVal.style.color = "#ffffff";
        } else {
            wrVal.textContent = "N/A";
            wrVal.style.color = "#ffffff";
        }

        card.querySelector('.premier-val').textContent = ranks.premier != null ? ranks.premier : "N/A";
        card.querySelector('.faceit-val').textContent = ranks.faceit != null ? `Lvl ${ranks.faceit} (${ranks.faceit_elo || '?'})` : "N/A";
        card.querySelector('.preaim-val').textContent = stats.preaim != null ? Math.round(stats.preaim) + "°" : "N/A";
        card.querySelector('.spray-val').textContent = stats.spray_accuracy != null ? Math.round(stats.spray_accuracy) + "%" : "N/A";

        // Link to the Leetify Profile if the ID is available
        const leetifyLink = card.querySelector('.leetify-link');
        if (data.id) {
            leetifyLink.href = `https://leetify.com/app/profile/${data.id}`;
            leetifyLink.style.display = "inline-block";
        } else {
            leetifyLink.style.display = "none";
        }
    }
});
