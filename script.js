(function(){

  // ============================================================
  // EDITÁ ACÁ los textos del sitio. Guardá el archivo y listo.
  // ============================================================
  const CONTENT = {
    bio: 'Makiicamii trabaja principalmente en blackwork: líneas sólidas, formas botánicas y motivos tribales reinterpretados. Cada pieza se diseña a medida para quien la lleva.',
    instagram: '@makiicamii',
    email: 'makiicamii9@gmail.com',
    location: 'Viña del Mar, Chile',
  };

  // ============================================================
  // EDITÁ ACÁ la galería. Copiá la foto a la carpeta /images
  // (al lado de este archivo) y poné el nombre exacto acá.
  // style puede ser: 'blackwork', 'botanica' o 'tribal'
  // description es opcional: si no querés poner nada, borrala o dejala ''
  // ============================================================
  const GALLERY = [
    { title: 'Anime', style: 'botanica', image: 'images/TribalB.jpeg' },
    { title: 'Anime', style: 'botanica', image: 'images/gato.jpeg' },
    { title: 'Anime', style: 'botanica', image: 'images/anime.jpg' },
  ];
  // ============================================================

  const STYLE_LABELS = { blackwork: 'Blackwork', botanica: 'Botánica', tribal: 'Tribal' };

  // Columna lateral: UNA sola figura continua (sin repeticiones, sin costuras)
  const SIDE_COLUMN = 'M 14,0 L 55,70 L 14,140 L 55,210 L 14,280 L 55,350 L 14,420 L 55,490 L 14,560 L 55,630 L 14,700 L 55,770 L 14,840 L 14,900 Z';

  // Franja horizontal: misma lógica, para arriba/abajo de la página
  const FRIEZE = 'M 0,60 L 60,8 L 120,55 L 180,8 L 240,55 L 300,8 L 360,55 L 420,8 L 480,55 L 540,8 L 600,55 L 660,8 L 720,55 L 780,8 L 840,55 L 900,8 L 960,55 L 1020,8 L 1080,55 L 1140,8 L 1200,55 L 1200,60 Z';

  const HERO_ART = `
    <svg class="hero-art" viewBox="0 0 400 460" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="200" cy="220" r="170" stroke="#1c1c1c" stroke-width="1"/>
      <g class="tribal-ring">
        <g stroke="#f2f2f0" stroke-width="2.2" fill="none">
          <path d="M200 220 C 172 172 166 105 200 45 C 217 82 206 116 217 158 C 225 186 211 207 200 220 Z" transform="rotate(0 200 220)"/>
          <path d="M200 220 C 172 172 166 105 200 45 C 217 82 206 116 217 158 C 225 186 211 207 200 220 Z" transform="rotate(51.4 200 220)"/>
          <path d="M200 220 C 172 172 166 105 200 45 C 217 82 206 116 217 158 C 225 186 211 207 200 220 Z" transform="rotate(102.8 200 220)"/>
          <path d="M200 220 C 172 172 166 105 200 45 C 217 82 206 116 217 158 C 225 186 211 207 200 220 Z" transform="rotate(154.2 200 220)"/>
          <path d="M200 220 C 172 172 166 105 200 45 C 217 82 206 116 217 158 C 225 186 211 207 200 220 Z" transform="rotate(205.6 200 220)"/>
          <path d="M200 220 C 172 172 166 105 200 45 C 217 82 206 116 217 158 C 225 186 211 207 200 220 Z" transform="rotate(257 200 220)"/>
        </g>
        <path d="M200 220 C 172 172 166 105 200 45 C 217 82 206 116 217 158 C 225 186 211 207 200 220 Z" stroke="#c85d82" stroke-width="2.2" fill="none" transform="rotate(308.4 200 220)"/>
        <g stroke="#3a3a3a" stroke-width="1.4" fill="none">
          <path d="M200 220 C 190 195 188 155 200 110" transform="rotate(25.7 200 220)"/>
          <path d="M200 220 C 190 195 188 155 200 110" transform="rotate(77.1 200 220)"/>
          <path d="M200 220 C 190 195 188 155 200 110" transform="rotate(128.5 200 220)"/>
          <path d="M200 220 C 190 195 188 155 200 110" transform="rotate(179.9 200 220)"/>
          <path d="M200 220 C 190 195 188 155 200 110" transform="rotate(231.3 200 220)"/>
          <path d="M200 220 C 190 195 188 155 200 110" transform="rotate(282.7 200 220)"/>
          <path d="M200 220 C 190 195 188 155 200 110" transform="rotate(334.1 200 220)"/>
        </g>
      </g>
      <circle cx="200" cy="220" r="28" fill="#000" stroke="#f2f2f0" stroke-width="1.5"/>
      <circle class="pulse-dot" cx="200" cy="220" r="4" fill="#c85d82"/>
      <path d="M30 415 Q 200 448 370 415" stroke="#1c1c1c" stroke-width="1"/>
    </svg>`;

  function heroVisual(){
    const featured = GALLERY[0];
    if (!featured) return HERO_ART;
    return `
      <div class="hero-photo">
        <img src="${esc(featured.image)}" alt="${esc(featured.title)}" />
        <svg class="corner tl" viewBox="0 0 34 34"><path d="M2 34 C 2 16 16 2 34 2"/></svg>
        <svg class="corner tr" viewBox="0 0 34 34"><path d="M2 34 C 2 16 16 2 34 2"/></svg>
        <svg class="corner bl" viewBox="0 0 34 34"><path d="M2 34 C 2 16 16 2 34 2"/></svg>
        <svg class="corner br" viewBox="0 0 34 34"><path d="M2 34 C 2 16 16 2 34 2"/></svg>
      </div>`;
  }

  function bgTribal(){
    return `<div class="bg-tribal-img"></div>`;
  }

  let state = { filter: 'todos', lightboxIndex: null };

  function esc(s){
    const d = document.createElement('div');
    d.textContent = s == null ? '' : s;
    return d.innerHTML;
  }

  function styleChips(activeChip){
    let html = `<button class="filter-chip${activeChip==='todos'?' active':''}" data-filter="todos">Todos</button>`;
    for (const k in STYLE_LABELS){
      html += `<button class="filter-chip${activeChip===k?' active':''}" data-filter="${k}">${STYLE_LABELS[k]}</button>`;
    }
    return html;
  }

  function galleryGrid(){
    const list = state.filter === 'todos' ? GALLERY : GALLERY.filter(p => p.style === state.filter);
    if (list.length === 0){
      const msg = GALLERY.length === 0
        ? 'Todavía no hay piezas cargadas.'
        : 'No hay piezas con ese estilo todavía.';
      return `<div class="empty-state">${msg}</div>`;
    }
    return `<div class="grid">${list.map(p => `
      <div class="card" data-index="${GALLERY.indexOf(p)}">
        <div class="img-wrap"><img src="${esc(p.image)}" alt="${esc(p.title)}" loading="lazy" /></div>
        <div class="meta">
          <div class="style">${STYLE_LABELS[p.style] || esc(p.style)}</div>
          <div class="title">${esc(p.title)}</div>
        </div>
      </div>`).join('')}</div>`;
  }

  function lightboxHtml(){
    if (state.lightboxIndex === null) return '';
    const p = GALLERY[state.lightboxIndex];
    if (!p) return '';
    return `
      <div class="lightbox" id="lightbox-overlay">
        <button class="lightbox-close" id="lightbox-close" aria-label="Cerrar">✕</button>
        <div class="lightbox-content">
          <img src="${esc(p.image)}" alt="${esc(p.title)}" />
          <div class="lightbox-info">
            <div class="style">${STYLE_LABELS[p.style] || esc(p.style)}</div>
            <div class="title">${esc(p.title)}</div>
            ${p.description ? `<p class="desc">${esc(p.description)}</p>` : ''}
          </div>
        </div>
      </div>`;
  }

  function render(){
    const root = document.getElementById('root');
    const c = CONTENT;

    root.innerHTML = `
      <div class="app">
        ${bgTribal()}
        <nav class="top reveal reveal-1">
          <div class="brand">Makiicamii</div>
          <div class="nav-links">
            ${c.instagram ? `<a href="https://instagram.com/${esc(c.instagram.replace('@',''))}" target="_blank" rel="noreferrer">${esc(c.instagram)}</a>` : ''}
          </div>
        </nav>

        <section class="hero">
          <div class="reveal reveal-2">
            <h1>Portafolio de<br/><em>Tatuajes</em> Makii<br/>camii</h1>
            <p class="tag">${esc(c.bio)}</p>
            <div class="styles-row">
              ${Object.values(STYLE_LABELS).map(v => `<span class="style-pill">${v}</span>`).join('')}
            </div>
          </div>
          <div class="reveal reveal-3">${heroVisual()}</div>
        </section>

        <svg class="tribal-divider" viewBox="0 0 1200 22" preserveAspectRatio="none">
          <polyline points="0,4 40,4 60,18 80,4 120,4 140,18 160,4 200,4 220,18 240,4 280,4 300,18 320,4 360,4 380,18 400,4 440,4 460,18 480,4 520,4 540,18 560,4 600,4 620,18 640,4 680,4 700,18 720,4 760,4 780,18 800,4 840,4 860,18 880,4 920,4 940,18 960,4 1000,4 1020,18 1040,4 1080,4 1100,18 1120,4 1160,4 1180,18 1200,4"
            fill="none" stroke="#2e2e2e" stroke-width="1.5"/>
        </svg>

        <section class="gallery-section">
          <div class="filters reveal reveal-4">${styleChips(state.filter)}</div>
          ${galleryGrid()}
        </section>

        <footer>
          <div>© ${new Date().getFullYear()} Makiicamii${c.location ? ' · ' + esc(c.location) : ''}</div>
          <div>${esc(c.email)}</div>
        </footer>
      </div>
      ${lightboxHtml()}`;

    root.querySelectorAll('.filter-chip').forEach(btn => {
      btn.addEventListener('click', () => { state.filter = btn.dataset.filter; render(); });
    });

    root.querySelectorAll('.card').forEach(card => {
      card.addEventListener('click', () => {
        state.lightboxIndex = Number(card.dataset.index);
        render();
      });
    });

    const lbOverlay = document.getElementById('lightbox-overlay');
    const lbClose = document.getElementById('lightbox-close');
    if (lbOverlay){
      lbOverlay.addEventListener('click', (e) => {
        if (e.target === lbOverlay) { state.lightboxIndex = null; render(); }
      });
    }
    if (lbClose){
      lbClose.addEventListener('click', () => { state.lightboxIndex = null; render(); });
    }

    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1 });
      root.querySelectorAll('.card').forEach(card => io.observe(card));
    } else {
      root.querySelectorAll('.card').forEach(card => card.classList.add('in-view'));
    }
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && state.lightboxIndex !== null) {
      state.lightboxIndex = null;
      render();
    }
  });

  render();
})();
