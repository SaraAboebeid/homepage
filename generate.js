#!/usr/bin/env node
/**
 * Simple static HTML generator reading content.yaml
 */
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const root = __dirname;
const yamlPath = path.join(root, 'content.yaml');
const outDir = root; // write directly alongside existing assets

function loadYaml() {
  const raw = fs.readFileSync(yamlPath, 'utf8');
  return yaml.load(raw);
}

function navHtml(nav, current) {
  return `<nav class="navigation" aria-label="Primary">
${nav.map(n => `        <a href="${n.path}" class="nav-link"${n.path === current ? ' aria-current="page"' : ''}>${n.label}</a>`).join('\n')}
    </nav>`;
}

function escapeHtml(str){
  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}

function sectionHtml(sections){
  return sections.map(s => `        <section class="content-section">
            <div class="section-content">
                <div class="content-layout">
                    <div class="placeholder-image"></div>
                    <div class="text-content">
                        <h2>${escapeHtml(s.heading)}</h2>
                        <p>${escapeHtml(s.body.trim())}</p>
                    </div>
                </div>
            </div>
        </section>`).join('\n\n');
}

function buildPage(site, page){
  const nav = navHtml(site.navigation, page.file);
  const metaDesc = page.head?.meta?.description || '';
  const heroTitle = escapeHtml(page.hero || page.head?.title || '');
  const sections = sectionHtml(page.sections || []);
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="${site.defaults?.meta?.charset || 'UTF-8'}">
    <meta name="viewport" content="${site.defaults?.meta?.viewport || 'width=device-width, initial-scale=1.0'}">
    <meta name="description" content="${escapeHtml(metaDesc)}">
    <meta name="theme-color" id="theme-color-meta" content="#001d1d">
    <title>${escapeHtml(page.head?.title || '')}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" onload="this.rel='stylesheet'">
    <noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"></noscript>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <a class="skip-link" href="#main">Skip to content</a>
    <div class="scroll-progress"></div>
    ${nav}
    <main id="main" tabindex="-1">
        <section class="hero-section">
            <h1 class="website-title">${heroTitle}</h1>
            <div class="scroll-indicator"><div class="chevron-down"></div></div>
        </section>
${sections}
    </main>
    <script src="script.js"></script>
    <script src="background.js"></script>
</body>
</html>`;
}

function main(){
  const data = loadYaml();
  if(!data || !data.pages){
    console.error('No pages defined in content.yaml');
    process.exit(1);
  }
  data.pages.forEach(p => {
    const html = buildPage(data.site, p);
    const outPath = path.join(outDir, p.file);
    fs.writeFileSync(outPath, html, 'utf8');
    console.log('Generated', p.file);
  });
}

main();
