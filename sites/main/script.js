/**
 * Bunnyware Project Showcase JavaScript
 * Features:
 *  - C++ MenuAnimation Lerp Engine (ported from src/menu/menu_animation.cpp & menu_tabs.cpp)
 *  - High-FPS interpolated sliders with smooth deceleration and fill tracking
 *  - Gliding sidebar tab highlight pill (menu_client.cpp highlight_y)
 *  - Weapon profile & configuration preset live slider animations
 *  - ImGui-style in-app notification toasts
 *  - Reactive section dimming on master toggles
 *  - Interactive color dot swatches
 *  - Build guide tabs, code copy buttons, and scroll spy
 */

// ─────────────────────────────────────────────────────────────
// 1. MenuAnimation C++ Engine Replica (speed = 24.0f)
// ─────────────────────────────────────────────────────────────
class MenuAnimationEngine {
    constructor() {
        this.items = new Map();
        this.lastTime = performance.now();
        this.running = false;
    }

    /**
     * Exact C++ interpolation from src/menu/menu_animation.cpp
     * float amount = std::min(1.0f, delta_time * speed);
     * float next = current + (target - current) * amount;
     * return std::abs(next - target) < 0.0001f ? target : next;
     */
    static interpolate(current, target, dt, speed) {
        const amount = Math.min(1.0, dt * speed);
        const next = current + (target - current) * amount;
        return Math.abs(next - target) < 0.0001 ? target : next;
    }

    register(key, current, target, speed, onUpdate) {
        const item = {
            current: current,
            target: target,
            speed: speed || 24.0,
            onUpdate: onUpdate
        };
        this.items.set(key, item);
        return item;
    }

    setTarget(key, target, speed = 24.0) {
        const item = this.items.get(key);
        if (item) {
            item.target = target;
            item.speed = speed;
            this.ensureRunning();
        }
    }

    setCurrent(key, current) {
        const item = this.items.get(key);
        if (item) {
            item.current = current;
            item.target = current;
            if (item.onUpdate) item.onUpdate(current);
        }
    }

    ensureRunning() {
        if (this.running) return;
        this.running = true;
        this.lastTime = performance.now();
        requestAnimationFrame(this.step.bind(this));
    }

    step(now) {
        const dt = Math.min((now - this.lastTime) / 1000, 0.05);
        this.lastTime = now;

        let activeCount = 0;
        for (const [key, item] of this.items.entries()) {
            if (item.current !== item.target) {
                item.current = MenuAnimationEngine.interpolate(item.current, item.target, dt, item.speed);
                activeCount++;
                if (item.onUpdate) {
                    item.onUpdate(item.current);
                }
            }
        }

        if (activeCount > 0) {
            requestAnimationFrame(this.step.bind(this));
        } else {
            this.running = false;
        }
    }
}

const g_Animation = new MenuAnimationEngine();

// ─────────────────────────────────────────────────────────────
// 2. ImGui Notification Toast Manager
// ─────────────────────────────────────────────────────────────
function showToast(message, duration = 3000) {
    let container = document.getElementById('gui-toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'gui-toast-container';
        container.className = 'gui-toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'gui-toast';
    toast.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        <span>${message}</span>
    `;
    container.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 250);
    }, duration);
}

// ─────────────────────────────────────────────────────────────
// DOM Ready Orchestration
// ─────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {

    // ─────────────────────────────────────────────────────────
    // 3. Gliding Sidebar Pill Navigation (menu_client.cpp highlight_y)
    // ─────────────────────────────────────────────────────────
    const sidebar = document.querySelector('.gui-sidebar');
    let sidebarPill = document.getElementById('gui-sidebar-pill');
    if (sidebar && !sidebarPill) {
        sidebarPill = document.createElement('div');
        sidebarPill.id = 'gui-sidebar-pill';
        sidebarPill.className = 'gui-sidebar-pill';
        sidebar.prepend(sidebarPill);
    }

    const guiTabBtns = document.querySelectorAll('.gui-tab-btn');
    const guiTabViews = document.querySelectorAll('.gui-tab-view');

    let isHorizontalSidebar = false;

    const checkSidebarOrientation = () => {
        return window.innerWidth <= 768;
    };

    const updatePillGeometry = (instant = false) => {
        if (!sidebar || !sidebarPill) return;
        const activeBtn = sidebar.querySelector('.gui-tab-btn.active');
        if (!activeBtn) return;

        isHorizontalSidebar = checkSidebarOrientation();

        const targetPos = isHorizontalSidebar ? activeBtn.offsetLeft : activeBtn.offsetTop;
        const targetDim = isHorizontalSidebar ? activeBtn.offsetWidth : activeBtn.offsetHeight;

        sidebarPill.style.opacity = '1';

        if (instant) {
            g_Animation.setCurrent('pill_pos', targetPos);
            g_Animation.setCurrent('pill_dim', targetDim);
            if (isHorizontalSidebar) {
                sidebarPill.style.transform = `translateX(${targetPos}px)`;
                sidebarPill.style.width = `${targetDim}px`;
                sidebarPill.style.height = '';
                sidebarPill.style.top = '0.35rem';
                sidebarPill.style.bottom = '0.35rem';
                sidebarPill.style.left = '0';
                sidebarPill.style.right = 'auto';
            } else {
                sidebarPill.style.transform = `translateY(${targetPos}px)`;
                sidebarPill.style.height = `${targetDim}px`;
                sidebarPill.style.width = '';
                sidebarPill.style.left = '0.35rem';
                sidebarPill.style.right = '0.35rem';
                sidebarPill.style.top = '0';
                sidebarPill.style.bottom = 'auto';
            }
        } else {
            g_Animation.setTarget('pill_pos', targetPos, 24.0);
            g_Animation.setTarget('pill_dim', targetDim, 24.0);
        }
    };

    // Register pill in MenuAnimation
    if (sidebarPill) {
        g_Animation.register('pill_pos', 0, 0, 24.0, (pos) => {
            if (isHorizontalSidebar) {
                sidebarPill.style.transform = `translateX(${Math.round(pos)}px)`;
            } else {
                sidebarPill.style.transform = `translateY(${Math.round(pos)}px)`;
            }
        });

        g_Animation.register('pill_dim', 36, 36, 24.0, (dim) => {
            if (isHorizontalSidebar) {
                sidebarPill.style.width = `${Math.round(dim)}px`;
            } else {
                sidebarPill.style.height = `${Math.round(dim)}px`;
            }
        });

        // Initialize position
        setTimeout(() => updatePillGeometry(true), 20);
        window.addEventListener('resize', () => updatePillGeometry(false));
    }

    guiTabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');

            guiTabBtns.forEach(b => b.classList.remove('active'));
            guiTabViews.forEach(v => v.classList.remove('active'));

            btn.classList.add('active');
            const activeView = document.getElementById(`tab-view-${targetTab}`);
            if (activeView) {
                activeView.classList.add('active');
            }

            updatePillGeometry(false);
        });
    });

    // ─────────────────────────────────────────────────────────
    // 4. Interpolated Sliders (RenderSliderFloat / RenderSmoothSliderTrack)
    // ─────────────────────────────────────────────────────────
    const slidersMap = new Map();

    const formatSliderValue = (val, step, unit) => {
        let formatted;
        if (step && step.includes('.')) {
            const decimals = step.split('.')[1].length;
            formatted = Number(val).toFixed(decimals);
        } else {
            formatted = Math.round(Number(val)).toString();
        }
        return formatted + (unit || '');
    };

    document.querySelectorAll('.gui-slider-group').forEach((group, index) => {
        const input = group.querySelector('.gui-range');
        if (!input) return;

        // Auto-wrap into .gui-slider-wrapper if not already structured
        let wrapper = group.querySelector('.gui-slider-wrapper');
        let track, fill, thumb;

        if (!wrapper) {
            wrapper = document.createElement('div');
            wrapper.className = 'gui-slider-wrapper';
            input.parentNode.insertBefore(wrapper, input);

            track = document.createElement('div');
            track.className = 'gui-slider-track';
            fill = document.createElement('div');
            fill.className = 'gui-slider-fill';
            thumb = document.createElement('div');
            thumb.className = 'gui-slider-thumb';

            track.appendChild(fill);
            track.appendChild(thumb);
            wrapper.appendChild(track);
            wrapper.appendChild(input);
        } else {
            track = wrapper.querySelector('.gui-slider-track');
            fill = wrapper.querySelector('.gui-slider-fill');
            thumb = wrapper.querySelector('.gui-slider-thumb');
        }

        const valDisplay = group.querySelector('.gui-slider-val');
        const unit = input.getAttribute('data-unit') || (valDisplay ? valDisplay.getAttribute('data-unit') : '') || '';
        const min = parseFloat(input.min) || 0;
        const max = parseFloat(input.max) || 100;
        const step = input.step || '1';
        const initialVal = parseFloat(input.value) || min;

        // Store reference for programmatic preset animations
        const sliderKey = `slider_${index}`;
        slidersMap.set(input, { sliderKey, min, max, step, unit, valDisplay, input });

        // Register in lerp loop (speed = 24.0f matching Bunnyware C++ menu)
        g_Animation.register(sliderKey, initialVal, initialVal, 24.0, (currentVal) => {
            const fraction = max > min ? Math.max(0, Math.min(1, (currentVal - min) / (max - min))) : 0;
            const pct = (fraction * 100).toFixed(3);
            if (fill) fill.style.width = `${pct}%`;
            if (thumb) thumb.style.left = `${pct}%`;
        });

        // Calculate and set initial visually exact position
        const initialFraction = max > min ? (initialVal - min) / (max - min) : 0;
        if (fill) fill.style.width = `${(initialFraction * 100).toFixed(2)}%`;
        if (thumb) thumb.style.left = `${(initialFraction * 100).toFixed(2)}%`;

        // User input handling (dragging, clicking track, arrow keys)
        input.addEventListener('input', () => {
            const targetVal = parseFloat(input.value);
            g_Animation.setTarget(sliderKey, targetVal, 24.0);
            if (valDisplay) {
                valDisplay.textContent = formatSliderValue(targetVal, step, unit);
            }
        });

        // Hover & Active micro-scale feedback
        input.addEventListener('pointerdown', () => wrapper.classList.add('active'));
        window.addEventListener('pointerup', () => wrapper.classList.remove('active'));
        input.addEventListener('focus', () => wrapper.classList.add('active'));
        input.addEventListener('blur', () => wrapper.classList.remove('active'));
    });

    /**
     * Programmatically animate a slider to a new value with smooth lerp
     */
    const animateSliderTo = (inputElement, targetVal) => {
        const item = slidersMap.get(inputElement);
        if (!item) return;
        const clampedVal = Math.max(item.min, Math.min(item.max, targetVal));
        item.input.value = clampedVal;
        g_Animation.setTarget(item.sliderKey, clampedVal, 20.0);
        if (item.valDisplay) {
            item.valDisplay.textContent = formatSliderValue(clampedVal, item.step, item.unit);
        }
    };

    // ─────────────────────────────────────────────────────────
    // 5. Weapon Category Profile Live Interpolation (Aim Tab)
    // ─────────────────────────────────────────────────────────
    const weaponSelect = document.querySelector('#tab-view-aim .gui-select');
    if (weaponSelect) {
        const aimSliders = document.querySelectorAll('#tab-view-aim .gui-range');
        // aimSliders[0]: FOV, aimSliders[1]: Smoothing
        const fovSlider = aimSliders[0];
        const smoothSlider = aimSliders[1];

        const weaponProfiles = {
            'Rifles': { fov: 3.5, smooth: 8.5 },
            'Light Pistols': { fov: 2.2, smooth: 6.0 },
            'Heavy Pistols': { fov: 1.6, smooth: 11.0 },
            'SMGs': { fov: 4.8, smooth: 5.5 },
            'Scout': { fov: 1.8, smooth: 14.0 },
            'AWP': { fov: 1.2, smooth: 18.0 },
            'Auto Snipers': { fov: 2.8, smooth: 9.0 },
            'Shotguns': { fov: 6.0, smooth: 4.0 },
            'LMGs': { fov: 4.0, smooth: 7.0 }
        };

        weaponSelect.addEventListener('change', () => {
            const selectedText = weaponSelect.options[weaponSelect.selectedIndex].text;
            let profileKey = Object.keys(weaponProfiles).find(k => selectedText.startsWith(k));
            if (!profileKey) profileKey = 'Rifles';

            const profile = weaponProfiles[profileKey];
            if (fovSlider && smoothSlider) {
                animateSliderTo(fovSlider, profile.fov);
                animateSliderTo(smoothSlider, profile.smooth);
                showToast(`Applied ${profileKey} profile: FOV ${profile.fov}°, Smooth ${profile.smooth}`);
            }
        });
    }

    // ─────────────────────────────────────────────────────────
    // 6. Config Profile Management (Config Tab)
    // ─────────────────────────────────────────────────────────
    const configSelect = document.querySelector('#tab-view-config select.gui-select');
    const loadConfigBtn = document.querySelector('#tab-view-config .gui-btn:nth-of-type(1)');
    const saveConfigBtn = document.querySelector('#tab-view-config .gui-btn:nth-of-type(2)');

    const configPresets = {
        'legit_premier.json': {
            aimFov: 3.5,
            aimSmooth: 8.5,
            hitChance: 84,
            headRatio: 60,
            reactionDelay: 35
        },
        'movement_surf.json': {
            aimFov: 1.0,
            aimSmooth: 20.0,
            hitChance: 50,
            headRatio: 30,
            reactionDelay: 100
        },
        'competitive_faceit.json': {
            aimFov: 1.8,
            aimSmooth: 15.0,
            hitChance: 92,
            headRatio: 75,
            reactionDelay: 65
        },
        'hvhh_test.json': {
            aimFov: 18.0,
            aimSmooth: 2.0,
            hitChance: 100,
            headRatio: 90,
            reactionDelay: 0
        }
    };

    if (loadConfigBtn && configSelect) {
        loadConfigBtn.addEventListener('click', () => {
            const chosenFile = configSelect.value.trim();
            const preset = configPresets[chosenFile] || configPresets['legit_premier.json'];

            // Find matching sliders across Aim tab
            const aimSliders = document.querySelectorAll('#tab-view-aim .gui-range');
            if (aimSliders.length >= 7) {
                animateSliderTo(aimSliders[0], preset.aimFov);
                animateSliderTo(aimSliders[1], preset.aimSmooth);
                animateSliderTo(aimSliders[5], preset.hitChance);
                animateSliderTo(aimSliders[6], preset.headRatio);
                animateSliderTo(aimSliders[7], preset.reactionDelay);
            }

            showToast(`[Bunnyware] Loaded configuration: ${chosenFile}`);
        });
    }

    if (saveConfigBtn) {
        saveConfigBtn.addEventListener('click', () => {
            const configNameInput = document.querySelector('#tab-view-config input[type="text"]');
            const name = configNameInput ? configNameInput.value.trim() : 'custom_profile';
            showToast(`[Bunnyware] Configuration saved to ~/.config/bunnyware/${name}.json`);
        });
    }

    // ─────────────────────────────────────────────────────────
    // 7. Master Feature Toggles (Soft dimming dependent options)
    // ─────────────────────────────────────────────────────────
    const masterToggles = [
        { label: 'Enable Aimbot', sectionSelector: '#tab-view-aim .gui-section-col:first-child .gui-card:nth-child(2)' },
        { label: 'Enable Triggerbot', sectionSelector: '#tab-view-aim .gui-section-col:last-child .gui-card:nth-child(2)' },
        { label: 'Enable Enemy Player ESP', sectionSelector: '#tab-view-visuals .gui-section-col:first-child .gui-card:nth-child(2)' },
        { label: 'Enable World ESP', sectionSelector: '#tab-view-world .gui-section-col:first-child .gui-card:nth-child(2)' }
    ];

    document.querySelectorAll('.gui-control-row').forEach(row => {
        const label = row.querySelector('.gui-label');
        if (!label) return;
        const text = label.textContent.trim();
        const toggleRule = masterToggles.find(t => text.includes(t.label));
        if (toggleRule) {
            const input = row.querySelector('input[type="checkbox"]');
            const targetSection = document.querySelector(toggleRule.sectionSelector);
            if (input && targetSection) {
                const updateDepState = () => {
                    if (input.checked) {
                        targetSection.style.opacity = '1';
                        targetSection.style.filter = 'none';
                        targetSection.style.pointerEvents = 'auto';
                    } else {
                        targetSection.style.opacity = '0.4';
                        targetSection.style.filter = 'grayscale(0.6)';
                        targetSection.style.pointerEvents = 'none';
                    }
                    targetSection.style.transition = 'opacity 0.22s ease, filter 0.22s ease';
                };
                input.addEventListener('change', updateDepState);
                updateDepState();
            }
        }
    });

    // ─────────────────────────────────────────────────────────
    // 8. Interactive Color Dot Swatches
    // ─────────────────────────────────────────────────────────
    const palette = ['#e6e4e0', '#ef4444', '#06b6d4', '#22c55e', '#f97316', '#a855f7', '#eab308'];
    document.querySelectorAll('.gui-color-dot').forEach(dot => {
        let paletteIndex = 0;
        dot.addEventListener('click', () => {
            paletteIndex = (paletteIndex + 1) % palette.length;
            dot.style.background = palette[paletteIndex];
            dot.style.transform = 'scale(1.25)';
            setTimeout(() => {
                dot.style.transform = 'scale(1)';
            }, 120);
        });
    });

    // ─────────────────────────────────────────────────────────
    // 9. Mobile Hamburger Menu
    // ─────────────────────────────────────────────────────────
    const hamburger = document.getElementById('hamburger-btn');
    const navMenu = document.getElementById('nav-menu');

    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            navMenu.classList.toggle('open');
            hamburger.setAttribute('aria-expanded', navMenu.classList.contains('open'));
        });

        navMenu.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('open');
                hamburger.setAttribute('aria-expanded', 'false');
            });
        });
    }

    // ─────────────────────────────────────────────────────────
    // 10. Active Section Navigation Spy
    // ─────────────────────────────────────────────────────────
    const sections = document.querySelectorAll('section[id], header[id]');
    const navLinks = document.querySelectorAll('.nav-link');

    window.addEventListener('scroll', () => {
        let current = '';
        const scrollPosition = window.pageYOffset + 140;

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    });

    // ─────────────────────────────────────────────────────────
    // 11. Build Guide Tabs
    // ─────────────────────────────────────────────────────────
    const buildTabBtns = document.querySelectorAll('.build-tab-btn');
    const buildTabPanes = document.querySelectorAll('.build-tab-pane');

    buildTabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetPane = btn.getAttribute('data-pane');

            buildTabBtns.forEach(b => b.classList.remove('active'));
            buildTabPanes.forEach(p => p.classList.remove('active'));

            btn.classList.add('active');
            const activePane = document.getElementById(`build-pane-${targetPane}`);
            if (activePane) {
                activePane.classList.add('active');
            }
        });
    });

    // ─────────────────────────────────────────────────────────
    // 12. Code Copy Buttons
    // ─────────────────────────────────────────────────────────
    document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const targetId = btn.getAttribute('data-target');
            let textToCopy = '';

            if (targetId) {
                const targetElem = document.getElementById(targetId);
                if (targetElem) {
                    textToCopy = targetElem.innerText.trim();
                }
            } else if (btn.getAttribute('data-copy')) {
                textToCopy = btn.getAttribute('data-copy');
            }

            if (textToCopy) {
                try {
                    await navigator.clipboard.writeText(textToCopy);
                    const originalHtml = btn.innerHTML;
                    btn.innerHTML = `
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        <span style="color:#4ade80;">Copied!</span>
                    `;
                    setTimeout(() => {
                        btn.innerHTML = originalHtml;
                    }, 2000);
                } catch (err) {
                    console.error('Failed to copy text: ', err);
                }
            }
        });
    });
});
