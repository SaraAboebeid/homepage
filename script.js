// Smooth scroll effect and section animations
document.addEventListener('DOMContentLoaded', function() {
    const sections = document.querySelectorAll('.content-section');
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const themeColorMeta = document.querySelector('#theme-color-meta');
    // THEME TOGGLE SETUP
    const THEME_KEY = 'ta-theme';
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
    function applyTheme(theme) {
        document.body.setAttribute('data-theme', theme);
        document.documentElement.setAttribute('data-theme', theme);
        // Adjust theme-color for PWA / mobile UI
        if (themeColorMeta) {
            themeColorMeta.setAttribute('content', theme === 'light' ? '#dedccb' : '#001d1d');
        }
    }
    function getStoredTheme() {
        return localStorage.getItem(THEME_KEY);
    }
    function initTheme() {
        const stored = getStoredTheme();
        const theme = stored || (prefersDark.matches ? 'dark' : 'light');
        applyTheme(theme);
    }
    initTheme();
    prefersDark.addEventListener('change', (e) => {
        if (!getStoredTheme()) {
            applyTheme(e.matches ? 'dark' : 'light');
            updateToggleIcon();
        }
    });
    // Inject toggle button
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'theme-toggle';
    toggleBtn.type = 'button';
    toggleBtn.setAttribute('aria-label', 'Toggle light and dark theme');
    toggleBtn.setAttribute('title', 'Toggle theme');
    function sunIcon() {
        return '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="5" stroke-width="2"/><path stroke-width="2" d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>';
    }
    function moonIcon() {
        return '<svg viewBox="0 0 24 24" aria-hidden="true"><path stroke-width="2" d="M21 12.79A9 9 0 0 1 11.21 3 7 7 0 1 0 21 12.79Z"/></svg>';
    }
    function currentTheme() { return (document.body.getAttribute('data-theme') || document.documentElement.getAttribute('data-theme') || 'dark'); }
    function updateToggleIcon() {
        if (currentTheme() === 'dark') {
            toggleBtn.innerHTML = sunIcon(); // show sun to indicate switching to light
        } else {
            toggleBtn.innerHTML = moonIcon();
        }
    }
    updateToggleIcon();
    toggleBtn.addEventListener('click', () => {
        const next = currentTheme() === 'dark' ? 'light' : 'dark';
        applyTheme(next);
        localStorage.setItem(THEME_KEY, next);
        updateToggleIcon();
    window.dispatchEvent(new CustomEvent('themechange', { detail: { theme: next }}));
    });
    document.body.appendChild(toggleBtn);

    /* =============================
       DITHER BACKGROUND SETTINGS UI
       ============================= */
    const SETTINGS_KEY = 'ta-dither-settings-v1';
    function loadSettings(){
        try { return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {}; } catch(e){ return {}; }
    }
    function saveSettings(s){ localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); }
    const storedSettings = loadSettings();

    // Floating gear button
    const settingsBtn = document.createElement('button');
    settingsBtn.className = 'dither-settings-btn';
    settingsBtn.type = 'button';
    settingsBtn.setAttribute('aria-label','Open background settings');
    settingsBtn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7m8.94-2.88-.7-.55a7.14 7.14 0 0 0 0-2.14l.7-.55a.5.5 0 0 0 .12-.64l-.95-1.64a.5.5 0 0 0-.6-.22l-.82.33c-.54-.46-1.15-.82-1.82-1.07l-.12-.88A.5.5 0 0 0 16.18 4h-1.9a.5.5 0 0 0-.5.42l-.12.88c-.67.25-1.28.61-1.82 1.07l-.82-.33a.5.5 0 0 0-.6.22l-.95 1.64a.5.5 0 0 0 .12.64l.7.55a7.14 7.14 0 0 0 0 2.14l-.7.55a.5.5 0 0 0-.12.64l.95 1.64c.14.24.43.34.6.22l.82-.33c.54.46 1.15.82 1.82 1.07l.12.88c.04.25.25.42.5.42h1.9c.25 0 .46-.17.5-.42l.12-.88c.67-.25 1.28-.61 1.82-1.07l.82.33c.24.1.5 0 .6-.22l.95-1.64a.5.5 0 0 0-.12-.64Z"/></svg>';
    document.body.appendChild(settingsBtn);
    // Panel (create before applying dialog semantics)
    const panel = document.createElement('div');
    panel.className = 'dither-settings-panel';
    panel.innerHTML = `
        <header class="dsp-header">
            <strong>Dither Controls</strong>
            <button type="button" class="dsp-close" aria-label="Close settings">×</button>
        </header>
        <div class="dsp-group">
            <label>Pattern Seed <span class="val" data-val-for="seed"></span></label>
            <input type="range" min="0" max="12" step="1" data-setting="patternSeed" />
        </div>
        <div class="dsp-group">
            <label>Cell Size <span class="val" data-val-for="cell"></span></label>
            <input type="range" min="2" max="24" step="1" data-setting="cellSize" />
        </div>
        <div class="dsp-group">
            <label>Tone Low <span class="val" data-val-for="toneLow"></span></label>
            <input type="range" min="0" max="1" step="0.01" data-setting="toneLow" />
        </div>
        <div class="dsp-group">
            <label>Tone High <span class="val" data-val-for="toneHigh"></span></label>
            <input type="range" min="0" max="1" step="0.01" data-setting="toneHigh" />
        </div>
        <div class="dsp-group">
            <label>Two-Tone Mode</label>
            <select data-setting="twoToneMode">
                <option value="0">Random</option>
                <option value="1">Density</option>
                <option value="2">Edge</option>
            </select>
        </div>
        <div class="dsp-group">
            <label>Shape</label>
            <select data-setting="shapeType">
                <option value="0">Circle</option>
                <option value="1">Square</option>
                <option value="2">Diamond</option>
                <option value="3">Cross</option>
                <option value="4">Point</option>
                <option value="5">Ring</option>
            </select>
        </div>
        <div class="dsp-group">
            <label>Parallax <span class="val" data-val-for="parallax"></span></label>
            <input type="range" min="0" max="2" step="0.01" data-setting="parallaxScale" />
        </div>
        <div class="dsp-group">
            <label>Speed <span class="val" data-val-for="speed"></span></label>
            <input type="range" min="0.05" max="3" step="0.05" data-setting="animSpeed" />
        </div>
        <fieldset class="dsp-fieldset">
            <legend style="font-size:.7rem;opacity:.7;">Page Colors</legend>
            <div class="dsp-group small-grid">
                <label style="font-size:.6rem;">BG <input type="color" data-color="bg" aria-label="Background color" /></label>
                <label style="font-size:.6rem;">Primary Dot <input type="color" data-color="dotPrimary" aria-label="Primary dot color" /></label>
                <label style="font-size:.6rem;">Secondary Dot <input type="color" data-color="dotSecondary" aria-label="Secondary dot color" /></label>
            </div>
        </fieldset>
        <div class="dsp-group">
            <label style="flex-direction:row;align-items:center;justify-content:space-between;display:flex;gap:.5rem;">High Contrast
                <input type="checkbox" data-pref="highContrast" style="width:auto;" />
            </label>
        </div>
        <div class="dsp-group">
            <label style="flex-direction:row;align-items:center;justify-content:space-between;display:flex;gap:.5rem;">Reduce Motion
                <input type="checkbox" data-pref="reduceMotion" style="width:auto;" />
            </label>
        </div>
        <div class="dsp-actions">
            <button type="button" class="dsp-export" title="Export settings to JSON" aria-label="Export settings">Export</button>
            <button type="button" class="dsp-reset">Reset</button>
        </div>
    `;
    document.body.appendChild(panel);
    
    // =============================
    // Per-page color overrides + export
    // =============================
    const PAGE_COLOR_OVERRIDES_KEY = 'ta-page-color-overrides-v1';
    function loadPageOverrides(){ try { return JSON.parse(localStorage.getItem(PAGE_COLOR_OVERRIDES_KEY)) || {}; } catch(e){ return {}; } }
    function savePageOverrides(data){ localStorage.setItem(PAGE_COLOR_OVERRIDES_KEY, JSON.stringify(data)); }
    function currentPageFile(){ let f = window.location.pathname.split('/').pop(); return f || 'index.html'; }
    function applyPageColorOverrides(){
        const bgObj = window.bayerBackground;
        if(!bgObj) return;
        const overrides = loadPageOverrides();
        const page = currentPageFile();
        const o = overrides[page];
        if(!o) return;
        const apply = {};
        if(o.bg) apply.background = o.bg;
        if(o.dotPrimary) apply.dot = o.dotPrimary;
        if(o.dotSecondary) apply.dot2 = o.dotSecondary;
        if(Object.keys(apply).length) bgObj.setAppearance(apply);
    }
    function initColorInputs(){
        const overrides = loadPageOverrides();
        const page = currentPageFile();
        const o = overrides[page] || {};
        // Migration: if legacy keys exist and no unified bg yet, pick dark first then light
        if(!o.bg && (o.bgDark || o.bgLight)){
            o.bg = o.bgDark || o.bgLight;
            delete o.bgDark; delete o.bgLight;
            overrides[page] = o; savePageOverrides(overrides);
        }
        panel.querySelectorAll('[data-color]').forEach(inp => {
            const k = inp.getAttribute('data-color');
            if(o[k]) {
                inp.value = o[k];
            } else if(window.bayerBackground){
                const mat = window.bayerBackground.material;
                if(k === 'dotPrimary') inp.value = '#'+mat.uniforms.uDotColor.value.getHexString();
                else if(k === 'dotSecondary') inp.value = '#'+mat.uniforms.uDotColor2.value.getHexString();
                else if(k === 'bg') inp.value = '#'+mat.uniforms.uBackgroundColor.value.getHexString();
            }
        });
    }
    function exportAllSettings(){
        const theme = (document.body.getAttribute('data-theme') || document.documentElement.getAttribute('data-theme') || 'dark');
        const dither = loadSettings();
        const prefs = loadPrefs();
        const overrides = loadPageOverrides();
        const payload = { exportedAt: new Date().toISOString(), theme, dither, prefs, pageColorOverrides: overrides };
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'technoart-settings.json';
        document.body.appendChild(a); a.click();
        setTimeout(()=>{ URL.revokeObjectURL(url); a.remove(); }, 100);
    }
    // Dialog semantics & accessibility
    panel.setAttribute('role','dialog');
    panel.setAttribute('aria-modal','true');
    const headerStrong = panel.querySelector('.dsp-header strong');
    if (headerStrong) {
        headerStrong.id = 'ditherTitle';
        panel.setAttribute('aria-labelledby','ditherTitle');
    }
    settingsBtn.setAttribute('aria-haspopup','dialog');
    settingsBtn.setAttribute('aria-expanded','false');
    function showPanel(){ panel.classList.add('open'); settingsBtn.setAttribute('aria-expanded','true'); }
    function hidePanel(){ panel.classList.remove('open'); settingsBtn.setAttribute('aria-expanded','false'); }
    function togglePanel(){
        if (panel.classList.contains('open')) { hidePanel(); settingsBtn.focus(); }
        else {
            showPanel();
            const firstInput = panel.querySelector('[data-setting]') || panel.querySelector('[data-pref]');
            (firstInput || panel).focus();
        }
    }
    settingsBtn.addEventListener('click', togglePanel);
    panel.querySelector('.dsp-close').addEventListener('click', () => { hidePanel(); settingsBtn.focus(); });
    function trapFocus(e){
        if (!panel.classList.contains('open')) return;
        if (e.key !== 'Tab') return;
        const focusable = panel.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length -1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    document.addEventListener('keydown', trapFocus);
    document.addEventListener('mousedown', (e) => {
        if (!panel.classList.contains('open')) return;
        if (panel.contains(e.target) || settingsBtn.contains(e.target)) return;
        hidePanel();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && panel.classList.contains('open')) hidePanel();
    });

    // Apply settings to background
    function applySettings(partial){
        const bg = window.bayerBackground;
        if (!bg) return;
        const current = loadSettings();
        const merged = { ...current, ...partial };
        saveSettings(merged);
    if (merged.patternSeed !== undefined) bg.setPatternSeed(Number(merged.patternSeed));
    if (merged.cellSize !== undefined) bg.setCellSize(Number(merged.cellSize));
    if (merged.parallaxScale !== undefined) bg.setParallaxScale(Number(merged.parallaxScale));
    if (merged.animSpeed !== undefined) bg.setAnimationSpeed(Number(merged.animSpeed));
    if (merged.shapeType !== undefined) bg.setShapeType(Number(merged.shapeType));
        bg.setAppearance({
            twoToneMode: merged.twoToneMode !== undefined ? Number(merged.twoToneMode) : undefined,
            toneLow: merged.toneLow !== undefined ? Number(merged.toneLow) : undefined,
            toneHigh: merged.toneHigh !== undefined ? Number(merged.toneHigh) : undefined
        });
        updateValueBadges(merged);
    }
    function updateValueBadges(s){
        const seedVal = panel.querySelector('[data-val-for="seed"]');
        const cellVal = panel.querySelector('[data-val-for="cell"]');
    const lowVal = panel.querySelector('[data-val-for="toneLow"]');
    const highVal = panel.querySelector('[data-val-for="toneHigh"]');
    const parallaxVal = panel.querySelector('[data-val-for="parallax"]');
    const speedVal = panel.querySelector('[data-val-for="speed"]');
        if (seedVal) seedVal.textContent = s.patternSeed ?? '';
        if (cellVal) cellVal.textContent = s.cellSize ?? '';
        if (lowVal) lowVal.textContent = (s.toneLow !== undefined ? Number(s.toneLow).toFixed(2) : '');
        if (highVal) highVal.textContent = (s.toneHigh !== undefined ? Number(s.toneHigh).toFixed(2) : '');
    if (parallaxVal) parallaxVal.textContent = (s.parallaxScale !== undefined ? Number(s.parallaxScale).toFixed(2) : '');
    if (speedVal) speedVal.textContent = (s.animSpeed !== undefined ? Number(s.animSpeed).toFixed(2) : '');
    }
    // Defaults
    const DEFAULTS = { patternSeed: 0, cellSize: 4, toneLow: 0.4, toneHigh: 0.6, twoToneMode: 1, shapeType: 0, parallaxScale: 1.0, animSpeed: 1.0 };
    const PREF_KEY = 'ta-ui-prefs-v1';
    function loadPrefs(){ try { return JSON.parse(localStorage.getItem(PREF_KEY)) || {}; } catch(e){ return {}; } }
    function savePrefs(p){ localStorage.setItem(PREF_KEY, JSON.stringify(p)); }
    function applyPrefs(p){
        if (p.highContrast) document.body.classList.add('high-contrast'); else document.body.classList.remove('high-contrast');
        if (p.reduceMotion) document.body.classList.add('reduce-motion'); else document.body.classList.remove('reduce-motion');
    }
    // Initialize inputs with stored or default values
    function initInputs(){
        const all = panel.querySelectorAll('[data-setting]');
        const s = { ...DEFAULTS, ...loadSettings() };
        all.forEach(el => {
            const key = el.getAttribute('data-setting');
            if (s[key] !== undefined) el.value = s[key];
        });
        applySettings(s); // also sets badges
        // Pref checkboxes
        const prefs = { highContrast:false, reduceMotion:false, ...loadPrefs() };
        panel.querySelectorAll('[data-pref]').forEach(cb => {
            const k = cb.getAttribute('data-pref');
            cb.checked = !!prefs[k];
        });
        applyPrefs(prefs);
    }
    panel.addEventListener('input', (e) => {
        const t = e.target;
        if (t.matches('[data-setting]')) {
            const key = t.getAttribute('data-setting');
            applySettings({ [key]: t.value });
        }
        if (t.matches('[data-pref]')) {
            const prefs = { highContrast:false, reduceMotion:false, ...loadPrefs() };
            prefs[t.getAttribute('data-pref')] = t.checked;
            savePrefs(prefs);
            applyPrefs(prefs);
        }
        if (t.matches('[data-color]')) {
            const overrides = loadPageOverrides();
            const page = currentPageFile();
            overrides[page] = overrides[page] || {};
            overrides[page][t.getAttribute('data-color')] = t.value;
            savePageOverrides(overrides);
            applyPageColorOverrides();
        }
    });
    panel.querySelector('.dsp-reset').addEventListener('click', () => {
        saveSettings(DEFAULTS);
        initInputs();
        // Do not clear color overrides on reset (keeps user page colors) – optional
    });
    panel.querySelector('.dsp-export')?.addEventListener('click', exportAllSettings);
    window.addEventListener('bayerbgready', initInputs, { once: true });
    if (window.bayerBackground) initInputs();
    // After init, set color pickers and apply overrides
    function lateColorInit(){ initColorInputs(); applyPageColorOverrides(); }
    window.addEventListener('bayerbgready', lateColorInit, { once: true });
    if(window.bayerBackground) lateColorInit();
    window.addEventListener('themechange', () => { applyPageColorOverrides(); });
    
    // Enhanced Intersection Observer for staggered animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                // Add a slight delay for staggered effect
                setTimeout(() => {
                    entry.target.classList.add('visible');
                }, index * 100);
            }
        });
    }, observerOptions);
    
    sections.forEach(section => {
        observer.observe(section);
    });
    
    // Enhanced parallax effect (respects reduced motion)
    let ticking = false;
    if (!prefersReducedMotion.matches) {
        function updateParallax() {
            const scrolled = window.pageYOffset;
            const heroSection = document.querySelector('.hero-section');
            if (heroSection) {
                heroSection.style.transform = `translateY(${scrolled * 0.3}px)`;
            }
            const scrollProgress = document.querySelector('.scroll-progress');
            if (scrollProgress) {
                const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
                const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
                const pct = (winScroll / height) * 100;
                scrollProgress.style.width = pct + '%';
            }
            ticking = false;
        }
        function requestTick() {
            if (!ticking) {
                requestAnimationFrame(updateParallax);
                ticking = true;
            }
        }
        window.addEventListener('scroll', requestTick, { passive: true });
    }
    
    // Smooth scrolling for navigation and scroll indicator
    document.querySelectorAll('a[href^="#"], .scroll-indicator').forEach(element => {
        element.addEventListener('click', function (e) {
            e.preventDefault();
            
            let target;
            if (this.classList.contains('scroll-indicator')) {
                // Scroll to first content section
                target = document.querySelector('.content-section');
            } else {
                target = document.querySelector(this.getAttribute('href'));
            }
            
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Enhanced page transitions
    const navLinks = document.querySelectorAll('.nav-link:not([href^="#"])');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            // Only apply transition for different pages
            if (href !== window.location.pathname.split('/').pop() && 
                !(href === 'index.html' && window.location.pathname.endsWith('/'))) {
                
                e.preventDefault();
                
                // Simple fade transition without loading circle
                document.body.style.opacity = '0';
                document.body.style.transition = 'opacity 0.3s ease';
                
                // Navigate after transition
                setTimeout(() => {
                    window.location.href = href;
                }, 300);
            }
        });
    });
    
    // Ensure only one aria-current applied (in case of dynamic navigation changes)
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const allNavLinks = document.querySelectorAll('.nav-link');
    allNavLinks.forEach(link => {
        const linkHref = link.getAttribute('href');
        if (linkHref === currentPage || (!currentPage && linkHref === 'index.html')) {
            link.setAttribute('aria-current', 'page');
        } else {
            link.removeAttribute('aria-current');
        }
    });
    
    // Add entrance animation for page load
    if (!prefersReducedMotion.matches) {
        document.body.style.opacity = '0';
        document.body.style.transition = 'opacity 0.5s ease';
        setTimeout(() => { document.body.style.opacity = '1'; }, 60);
    }
});
