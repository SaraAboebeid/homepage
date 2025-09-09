// Three.js Bayer Dithering Background - No Module Version
(function() {
    // Check if Three.js is loaded
    if (typeof THREE === 'undefined') {
        console.error('Three.js not found. Loading from CDN...');
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/three@0.155.0/build/three.min.js';
        script.onload = () => initBackground();
        document.head.appendChild(script);
        return;
    }
    
    initBackground();
    
    function initBackground() {
        // Page-specific background configuration (extend as needed)
        // Accessible palette + structured config for readability & color-vision friendliness
        // Rationale:
        //  - Central palette avoids ad-hoc hex codes, eases global adjustments.
        //  - Dot / dot2 pairs chosen for hue & luminance separation (helpful for most CVD types).
        //  - Shapes already provide a non-color channel for redundancy.
        //  - Light theme variants can be softened independently later.
        const PALETTE = Object.freeze({
            tealDeep:    '#004452',
            teal:        '#00727E',
            blue:        '#0072B2',
            sky:         '#56B4E9',
            green:       '#009E73',
            orange:      '#E69F00',
            vermilion:   '#D55E00',
            purple:      '#CC79A7',
            yellow:      '#F0E442',
            neutralLight:'#dedccb',
            nearBlack:   '#101010'
        });

        // Derive a secondary accent if not explicitly provided (hue shift + lightness tweak)
        function deriveSecondary(hex, lightenFactor = 0.18, hueShiftDeg = 32) {
            try {
                const c = new THREE.Color(hex);
                const hsl = { h:0, s:0, l:0 };
                c.getHSL(hsl);
                hsl.h = (hsl.h + hueShiftDeg / 360) % 1;
                hsl.l = Math.min(1, hsl.l + lightenFactor);
                const out = new THREE.Color();
                out.setHSL(hsl.h, hsl.s * 0.85, hsl.l);
                return '#' + out.getHexString();
            } catch(e) {
                return hex; // fallback
            }
        }

        // Raw page descriptors (semantic, minimal duplication)
        const RAW_PAGE_CONFIG = [
            {
                file: 'index.html',
                background: PALETTE.tealDeep,
                backgroundLight: PALETTE.neutralLight,
                dot: PALETTE.green,
                dot2: PALETTE.orange,
                shape: 'ring', patternSeed: 0, cellSize: 10,
                // Landing: calm teal + green/orange accents
            },
            {
                file: 'page1.html',
                background: '#1d000e', // deep maroon mood
                backgroundLight: PALETTE.neutralLight,
                dot: PALETTE.purple,
                dot2: PALETTE.orange,
                shape: 'diamond', patternSeed: 1, cellSize: 10
            },
            {
                file: 'page2.html',
                background: '#0d001d', // deep indigo
                backgroundLight: PALETTE.neutralLight,
                dot: PALETTE.sky,
                dot2: PALETTE.green,
                shape: 'square', patternSeed: 2, cellSize: 10
            },
            {
                file: 'page3.html',
                background: '#00130f', // deep cyan-green
                backgroundLight: PALETTE.neutralLight,
                dot: PALETTE.green,
                dot2: PALETTE.vermillion,
                shape: 'cross', patternSeed: 3, cellSize: 10
            },
            {
                file: 'contact.html',
                background: PALETTE.nearBlack,
                backgroundLight: PALETTE.neutralLight,
                dot: PALETTE.orange,
                dot2: PALETTE.blue,
                shape: 'circle', patternSeed: 4, cellSize: 10
            },
            {
                file: 'about.html',
                background: '#001014',
                backgroundLight: PALETTE.neutralLight,
                dot: PALETTE.sky,
                dot2: PALETTE.vermillion,
                shape: 'ring', patternSeed: 5, cellSize: 10
            }
        ];

        // Utility: relative luminance (WCAG) & contrast ratio for debug
        function relLum(hex) {
            try {
                const c = new THREE.Color(hex);
                const rgb = [c.r, c.g, c.b].map(v => {
                    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055)/1.055, 2.4);
                });
                return 0.2126*rgb[0] + 0.7152*rgb[1] + 0.0722*rgb[2];
            } catch(e) { return 0; }
        }
        function contrast(a,b){
            const L1 = relLum(a), L2 = relLum(b);
            const hi = Math.max(L1,L2), lo = Math.min(L1,L2);
            return (hi + 0.05) / (lo + 0.05);
        }

        // Build final lookup; auto-fill *Light & dot2 if missing
        const PAGE_CONFIG = RAW_PAGE_CONFIG.reduce((acc, p) => {
            const dot2 = p.dot2 || deriveSecondary(p.dot);
            const entry = {
                background: p.background,
                backgroundLight: p.backgroundLight || p.background,
                dot: p.dot,
                dotLight: p.dotLight || p.dot, // could tone down saturation separately if desired
                dot2: dot2,
                dot2Light: p.dot2Light || dot2,
                patternSeed: p.patternSeed,
                shape: p.shape,
                cellSize: p.cellSize
            };
            acc[p.file] = entry;
            return acc;
        }, Object.create(null));
        Object.freeze(PAGE_CONFIG);

        // Optional contrast debugging (?contrastDebug=1 in URL)
        if (typeof window !== 'undefined' && window.location.search.includes('contrastDebug')) {
            Object.entries(PAGE_CONFIG).forEach(([k,v]) => {
                const c1 = contrast(v.background, v.dot).toFixed(2);
                const c2 = contrast(v.background, v.dot2).toFixed(2);
                // eslint-disable-next-line no-console
                console.log(`[contrast] ${k} bg↔dot:${c1} bg↔dot2:${c2}`);
            });
        }

        // (Rest of code continues unchanged)
        function getPageKey() {
            let file = window.location.pathname.split('/').pop();
            if (!file || file === '') file = 'index.html';
            return file;
        }
        class BayerDitherBackground {
            constructor() {
                this.scene = new THREE.Scene();
                this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
                this.renderer = new THREE.WebGLRenderer({ 
                    alpha: true, 
                    antialias: false,
                    powerPreference: "high-performance"
                });
                
                this.time = 0;
                this.timeScale = 1.0; // will speed up slightly on scroll
                this.userSpeedMultiplier = 1.0; // adjustable via settings
                this.scrollTarget = 0.0; // target scroll norm from events
                this.scrollCurrent = 0.0; // smoothed scroll value
                
                this.init();
                this.setupEventListeners();
                this.animate();
            }
            
            init() {
                // Setup renderer
                this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
                this.pixelRatio = this.renderer.getPixelRatio();
                this.renderer.setSize(window.innerWidth, window.innerHeight);
                this.renderer.domElement.style.position = 'fixed';
                this.renderer.domElement.style.top = '0';
                this.renderer.domElement.style.left = '0';
                this.renderer.domElement.style.zIndex = '-1';
                this.renderer.domElement.style.pointerEvents = 'none';
                document.body.appendChild(this.renderer.domElement);
                
                // Shader material
        const material = new THREE.ShaderMaterial({
                    transparent: true,
                    depthTest: false,
                    depthWrite: false,
                    uniforms: {
                        uTime: { value: 0 },
                        uResolution: { value: new THREE.Vector2(window.innerWidth * this.pixelRatio, window.innerHeight * this.pixelRatio) },
                        uOpacity: { value: 0.9 },
                        uBackgroundColor: { value: new THREE.Color(0x001d1d) },
            uDotColor: { value: new THREE.Color(0x55ffa7) },
            uDotColor2: { value: new THREE.Color(0xFF8F55) }, // second tone
                        uPatternSeed: { value: 0.0 },
            uScrollNorm: { value: 0.0 }, // normalized scroll position 0..1 for parallax
            uTwoToneMode: { value: 1.0 }, // 0=random noise, 1=density, 2=edge (gradient magnitude)
            uToneLow: { value: 0.4 },      // low threshold for tone mix
            uToneHigh: { value: 0.6 },      // high threshold for tone mix
            uShapeType: { value: 0.0 },      // 0 circle,1 square,2 diamond,3 cross,4 point,5 ring
            uCellSize: { value: 4.0 },        // pixel cell size (spacing)
            uParallaxScale: { value: 1.0 }    // user parallax intensity multiplier
                    },
                    vertexShader: `
                        void main() {
                            gl_Position = vec4(position, 1.0);
                        }
                    `,
                    fragmentShader: `
                        uniform float uTime;
                        uniform vec2 uResolution;
                        uniform float uOpacity;
                        uniform vec3 uBackgroundColor;
                        uniform vec3 uDotColor;
            uniform vec3 uDotColor2; // second tone
                        uniform float uPatternSeed; // per-page seed to vary pattern
                        uniform float uScrollNorm;  // 0..1 scroll progress for parallax (smoothed)
                        uniform float uTwoToneMode; // coloring mode selector
                        uniform float uToneLow;     // tone low threshold
                        uniform float uToneHigh;    // tone high threshold
                        uniform float uShapeType;   // shape selector
                        uniform float uCellSize;    // cell size / spacing
                        uniform float uParallaxScale; // user parallax scale multiplier
                        // ---- Additional stable fBm helpers (direction-free 3D value noise) ----
                        float hash11(float n){ return fract(sin(n)*43758.5453); }
                        float vnoise(vec3 p){
                            vec3 ip=floor(p); vec3 fp=fract(p);
                            float n000=hash11(dot(ip+vec3(0.,0.,0.), vec3(1.,57.,113.)));
                            float n100=hash11(dot(ip+vec3(1.,0.,0.), vec3(1.,57.,113.)));
                            float n010=hash11(dot(ip+vec3(0.,1.,0.), vec3(1.,57.,113.)));
                            float n110=hash11(dot(ip+vec3(1.,1.,0.), vec3(1.,57.,113.)));
                            float n001=hash11(dot(ip+vec3(0.,0.,1.), vec3(1.,57.,113.)));
                            float n101=hash11(dot(ip+vec3(1.,0.,1.), vec3(1.,57.,113.)));
                            float n011=hash11(dot(ip+vec3(0.,1.,1.), vec3(1.,57.,113.)));
                            float n111=hash11(dot(ip+vec3(1.,1.,1.), vec3(1.,57.,113.)));
                            vec3 w = fp*fp*fp*(fp*(fp*6.0-15.0)+10.0);
                            float x00=mix(n000,n100,w.x); float x10=mix(n010,n110,w.x);
                            float x01=mix(n001,n101,w.x); float x11=mix(n011,n111,w.x);
                            float y0=mix(x00,x10,w.y); float y1=mix(x01,x11,w.y);
                            return mix(y0,y1,w.z)*2.-1.;
                        }
                        float fbmStable(vec2 uv, float t){
                            const int OCT=5; float amp=1.; float freq=1.; float sum=1.;
                            for(int i=0;i<OCT;i++){ sum += amp * vnoise(vec3(uv*4.0*freq, t)*1.0); freq*=1.25; amp*=1.0; }
                            return sum*0.5+0.5;
                        }
                        
                        // Bayer dithering (only 8x needed)
                        float Bayer2(vec2 a){ a=floor(a); return fract(a.x/2.0 + a.y*a.y*0.75); }
                        float Bayer4(vec2 a){ return Bayer2(0.5*a)*0.25 + Bayer2(a); }
                        float Bayer8(vec2 a){ return Bayer4(0.5*a)*0.25 + Bayer2(a); }
                        
                        // Simple noise function
                        float noise(vec2 st) {
                            return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
                        }
                        
                        // FBM (Fractal Brownian Motion)
                        float fbm(vec2 st) {
                            float value = 0.0;
                            float amplitude = 0.5;
                            float frequency = 2.0;
                            
                            for (int i = 0; i < 4; i++) {
                                value += amplitude * noise(st * frequency);
                                amplitude *= 0.5;
                                frequency *= 2.0;
                            }
                            return value;
                        }
                        
                        void main() {
                            vec2 fragCoord = gl_FragCoord.xy;
                            vec2 uv = fragCoord / uResolution.xy;
                            vec2 screenUV = uv;

                            // Parallax: subtle shift with scroll (affects overall pattern positioning)
                            // Stronger parallax + slight zoom
                            float parallax = uScrollNorm; // already smoothed
                            screenUV.y += parallax * 0.25 * uParallaxScale; // adjustable vertical drift
                            screenUV.x += parallax * 0.12 * uParallaxScale; // adjustable diagonal drift
                            // Subtle zoom (scale from center)
                            float scale = 1.0 + parallax * 0.06;
                            vec2 c = screenUV - 0.5;
                            c *= scale;
                            screenUV = c + 0.5;

                            // Simplified stable fBm Bayer field only
                            float pixelSize = uCellSize; // adjustable size of shape cell in screen pixels
                            vec2 fc = fragCoord - 0.5 * uResolution;
                            vec2 uvAlt = (fc / uResolution.y);
                            float tShift = uTime*0.1*(1.0 + uPatternSeed*0.05);
                            // Base field used for both dot mask and density metrics
                            float fieldRaw = fbmStable(uvAlt + vec2(uPatternSeed*0.37 + uScrollNorm*0.4, uPatternSeed*0.61 + uScrollNorm*0.2), tShift);
                            float feed = fieldRaw * 0.5 - 0.65; // original shaping for thresholding
                            float bayerVal = Bayer8(fragCoord / pixelSize) - 0.5;
                            float thresh = feed + bayerVal;
                            float bw = smoothstep(0.45, 0.55, thresh);
                            // ---- Two-tone selection modes ----
                            float toneMix;
                            if (uTwoToneMode < 0.5) {
                                // Mode 0: random noise clusters (original approach) - cheap hash
                                float r = hash11(dot(floor(fragCoord/pixelSize), vec2(7.13, 157.37)) + uPatternSeed*13.17);
                                toneMix = smoothstep(uToneLow, uToneHigh, r);
                            } else if (uTwoToneMode < 1.5) {
                                // Mode 1: density using a tiny 4-tap blur (reuse fieldRaw plus 3 neighbors)
                                vec2 d = vec2(0.02, 0.0);
                                float n1 = fbmStable(uvAlt + d.xy, tShift);
                                float n2 = fbmStable(uvAlt + d.yx, tShift);
                                float n3 = fbmStable(uvAlt - d.yx, tShift);
                                float density = (fieldRaw + n1 + n2 + n3) * 0.25;
                                toneMix = smoothstep(uToneLow, uToneHigh, density);
                            } else {
                                // Mode 2: edge/gradient emphasis (second color on edges)
                                vec2 e = vec2(0.015,0.0);
                                float gx = fbmStable(uvAlt+e.xy, tShift) - fbmStable(uvAlt-e.xy, tShift);
                                float gy = fbmStable(uvAlt+e.yx, tShift) - fbmStable(uvAlt-e.yx, tShift);
                                float edge = sqrt(gx*gx+gy*gy); // higher at transitions
                                toneMix = smoothstep(uToneLow, uToneHigh, edge);
                            }
                            // ----- Shape mask inside each pixel-size cell -----
                            vec2 cellCoord = fragCoord / pixelSize;
                            vec2 cellUV = fract(cellCoord) - 0.5; // centered within cell
                            float shapeMask = 1.0;
                            if (uShapeType < 0.5) {
                                // Circle
                                shapeMask = step(length(cellUV), 0.42);
                            } else if (uShapeType < 1.5) {
                                // Square
                                shapeMask = step(max(abs(cellUV.x), abs(cellUV.y)), 0.42);
                            } else if (uShapeType < 2.5) {
                                // Diamond (rotated square)
                                shapeMask = step(abs(cellUV.x) + abs(cellUV.y), 0.60);
                            } else if (uShapeType < 3.5) {
                                // Cross (thicker bars for visibility)
                                float barH = step(abs(cellUV.y),0.17) * step(abs(cellUV.x),0.55);
                                float barV = step(abs(cellUV.x),0.17) * step(abs(cellUV.y),0.55);
                                shapeMask = clamp(barH + barV,0.0,1.0);
                            } else if (uShapeType < 4.5) {
                                // Point (small dot)
                                shapeMask = step(length(cellUV), 0.18);
                            } else {
                                // Ring
                                float d = length(cellUV);
                                float outer = smoothstep(0.44, 0.41, d);
                                float inner = smoothstep(0.20, 0.23, d);
                                shapeMask = outer * inner;
                            }
                            float shapeAlpha = bw * shapeMask;
                            // Boost cross alpha so it doesn't appear too sparse
                            if (uShapeType > 2.5 && uShapeType < 3.5) {
                                shapeAlpha = min(1.0, shapeAlpha * 1.8 + 0.05);
                            }
                            vec3 dotColor = mix(uDotColor2, uDotColor, toneMix);
                            vec3 finalColor = mix(uBackgroundColor, dotColor, shapeAlpha);
                            finalColor += shapeAlpha * 0.25 * dotColor; // subtle glow/boost
                            gl_FragColor = vec4(finalColor, shapeAlpha * uOpacity);
                        }
                    `
                });
                
                // Create fullscreen quad
                const geometry = new THREE.PlaneGeometry(2, 2);
                const mesh = new THREE.Mesh(geometry, material);
                this.scene.add(mesh);
                
                this.material = material;
                this.applyPageConfig();
            }

            applyPageConfig() {
                const key = getPageKey();
                const cfg = PAGE_CONFIG[key] || PAGE_CONFIG['index.html'];
                const theme = (document.body.getAttribute('data-theme') || document.documentElement.getAttribute('data-theme') || 'dark');
                const isLight = theme === 'light';
                const bg = isLight ? (cfg.backgroundLight || cfg.background) : cfg.background;
                const dot = isLight ? (cfg.dotLight || cfg.dot) : cfg.dot;
                const dot2Candidate = isLight ? (cfg.dot2Light || cfg.dot2) : cfg.dot2;
                this.material.uniforms.uBackgroundColor.value.set(bg);
                this.material.uniforms.uDotColor.value.set(dot);
                if (dot2Candidate) {
                    this.material.uniforms.uDotColor2.value.set(dot2Candidate);
                } else {
                    // derive from primary dot color
                    const c = new THREE.Color(dot);
                    const hsl = { h:0,s:0,l:0 };
                    c.getHSL(hsl);
                    hsl.h = (hsl.h + 0.12) % 1.0;
                    hsl.l = Math.min(1.0, hsl.l * (isLight ? 0.8 : 1.2));
                    this.material.uniforms.uDotColor2.value.setHSL(hsl.h, hsl.s, hsl.l);
                }
                if (typeof cfg.patternSeed === 'number') this.material.uniforms.uPatternSeed.value = cfg.patternSeed;
                // Shape selection
                const shapeMap = { circle:0, square:1, diamond:2, cross:3, point:4, ring:5 };
                const shapeType = shapeMap[cfg.shape] ?? 0;
                this.material.uniforms.uShapeType.value = shapeType;
                if (typeof cfg.cellSize === 'number') {
                    this.material.uniforms.uCellSize.value = cfg.cellSize;
                }
                // Let CSS control body bg via theme variables; do not override with inline color.
            }
            
            setupEventListeners() {
                // Handle resize
                window.addEventListener('resize', () => {
                    this.resize();
                });
                // Theme change (custom event dispatched from script.js when user toggles)
                window.addEventListener('themechange', () => {
                    this.applyPageConfig();
                });

                // Scroll: update parallax uniform & speed up animation slightly each time user scrolls
                window.addEventListener('scroll', () => {
                    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
                    const sn = maxScroll > 0 ? (window.scrollY / maxScroll) : 0;
                    this.scrollTarget = sn;
                    // Increment time scale slightly (cumulative) with a cap
                    this.timeScale = Math.min(this.timeScale + 0.05, 3.0);
                }, { passive: true });
            }
            
            resize() {
                this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
                this.pixelRatio = this.renderer.getPixelRatio();
                this.renderer.setSize(window.innerWidth, window.innerHeight);
                this.material.uniforms.uResolution.value.set(window.innerWidth * this.pixelRatio, window.innerHeight * this.pixelRatio);
                this.lastPixelRatio = this.pixelRatio;
            }
            
            animate() {
                if (!this.lastTimestamp) this.lastTimestamp = performance.now();
                const now = performance.now();
                const dt = (now - this.lastTimestamp) / 1000.0;
                this.lastTimestamp = now;
                this.time += dt * this.timeScale; // scaled delta time
                // Smooth scroll value update (easing)
                this.scrollCurrent += (this.scrollTarget - this.scrollCurrent) * 0.08;
                this.material.uniforms.uScrollNorm.value = this.scrollCurrent;
                this.material.uniforms.uTime.value = this.time * this.userSpeedMultiplier;
                this.renderer.render(this.scene, this.camera);
                requestAnimationFrame(() => this.animate());
            }
            
            setOpacity(opacity) {
                this.material.uniforms.uOpacity.value = opacity;
            }
            
            // Public method to change appearance dynamically
            setAppearance({ background, dot, dot2, twoToneMode, toneLow, toneHigh }) {
                if (background) this.material.uniforms.uBackgroundColor.value.set(background);
                if (dot) this.material.uniforms.uDotColor.value.set(dot);
                if (dot2) this.material.uniforms.uDotColor2.value.set(dot2);
                if (twoToneMode !== undefined) this.material.uniforms.uTwoToneMode.value = twoToneMode;
                if (toneLow !== undefined) this.material.uniforms.uToneLow.value = toneLow;
                if (toneHigh !== undefined) this.material.uniforms.uToneHigh.value = toneHigh;
            }
            setPatternSeed(seed){ this.material.uniforms.uPatternSeed.value = seed; }
            setCellSize(size){ if (size>0) this.material.uniforms.uCellSize.value = size; }
            setParallaxScale(scale){ this.material.uniforms.uParallaxScale.value = Math.max(0, scale); }
            setShapeType(index){ this.material.uniforms.uShapeType.value = index; }
            setAnimationSpeed(mult){ this.userSpeedMultiplier = Math.max(0.05, mult); }
            
            destroy() {
                if (this.renderer.domElement.parentNode) {
                    this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
                }
                this.renderer.dispose();
            }
        }
        
        // Auto-initialize when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                try {
                    window.bayerBackground = new BayerDitherBackground();
                    console.log('Bayer dithering background initialized successfully');
                            // Announce readiness for any late-bound UI controllers
                            window.dispatchEvent(new CustomEvent('bayerbgready'));
                } catch (error) {
                    console.error('Failed to initialize background:', error);
                }
            });
        } else {
            try {
                window.bayerBackground = new BayerDitherBackground();
                console.log('Bayer dithering background initialized successfully');
                        window.dispatchEvent(new CustomEvent('bayerbgready'));
            } catch (error) {
                console.error('Failed to initialize background:', error);
            }
        }
    }
})();
