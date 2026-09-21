// ============================================
// assets/js/periodico.js
// Periódico digital interactivo (noticias + videos + galerías)
// ============================================
(function () {
  'use strict';

  // 1. Leer datos generados por Jekyll/Liquid en noticias.html
  const dataScript = document.getElementById('contenido-data');
  if (!dataScript) return; // Si no existe (otra página), no hacer nada

  let contenido = [];
  try {
    contenido = JSON.parse(dataScript.textContent);
  } catch (e) {
    console.error('Error leyendo datos del periódico:', e);
    contenido = [];
  }

  // 2. Ordenar por fecha, más reciente primero
  contenido.sort((a, b) => (b.sortdate || 0) - (a.sortdate || 0));

  const book = document.getElementById('book');
  const bookContainer = document.getElementById('bookContainer');
  const pageIndicator = document.getElementById('pageIndicator');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');

  if (!book || contenido.length === 0) {
    if (book) {
      book.innerHTML = `
        <div class="page" style="position:relative;">
          <div class="page-front" style="position:static; display:flex; align-items:center; justify-content:center; text-align:center; height:100%;">
            <div>
              <div style="font-size:3rem;">📰</div>
              <h2 style="font-family:Georgia,serif; margin-top:10px;">Aún no hay contenido publicado</h2>
              <p style="color:#888; margin-top:8px;">Vuelve pronto para ver nuestras noticias, videos y fotos.</p>
            </div>
          </div>
        </div>`;
    }
    if (prevBtn) prevBtn.disabled = true;
    if (nextBtn) nextBtn.disabled = true;
    if (pageIndicator) pageIndicator.textContent = '0 / 0';
    return;
  }

  const totalSheets = Math.ceil(contenido.length / 2);
  let currentSheet = 0;
  let isDragging = false;
  let startX = 0;
  let dragProgress = 0;
  let activePage = null;

  function catClass(type) {
    if (type === 'video') return 'cat-video';
    if (type === 'galeria') return 'cat-galeria';
    return 'cat-noticia';
  }

  function escapeHtml(str) {
    return (str || '').toString();
  }

  function buildCard(item, pageNum, side) {
    if (!item) {
      return `<div class="page-header"><div class="masthead">Notiatanasiano</div></div><div class="page-num ${side}">${pageNum}</div>`;
    }

    let media = '';
    if (item.type === 'noticia') {
      media = item.img
        ? `<img class="article-img" src="${item.img}" alt="${escapeHtml(item.title)}" loading="lazy">`
        : '';
    } else if (item.type === 'video') {
      media = `
        <div class="video-wrap">
          <iframe src="https://www.youtube.com/embed/${item.videoId}" allowfullscreen loading="lazy"></iframe>
        </div>`;
    } else if (item.type === 'galeria' && Array.isArray(item.fotos)) {
      const imgs = item.fotos
        .map((f, i) => `<img src="${f}" class="${i === 0 ? 'full-span' : ''}" data-full="${f}" loading="lazy">`)
        .join('');
      media = `<div class="gallery-grid">${imgs}</div>`;
    }

    // Para noticias, item.text ya viene con formato HTML (párrafos, listas, etc.)
    // desde noticia.content en Jekyll. Para video/galería es texto plano.
    const bodyHtml =
      item.type === 'noticia'
        ? `<div class="article-text drop-cap">${item.text}</div>`
        : `<p class="article-text">${escapeHtml(item.text)}</p>`;

    return `
      <div class="page-header">
        <div class="masthead">El Bárbula</div>
        <div class="page-sub"><span>Edición Digital</span><span>${item.date || ''}</span></div>
      </div>
      <span class="category-tag ${catClass(item.type)}">${escapeHtml(item.cat)}</span>
      <h2 class="headline">${escapeHtml(item.title)}</h2>
      <div class="byline">${escapeHtml(item.author)}</div>
      ${media}
      ${bodyHtml}
      <div class="page-num ${side}">${pageNum}</div>
    `;
  }

  function createSheets() {
    book.innerHTML = '';
    for (let i = 0; i < totalSheets; i++) {
      const front = contenido[i * 2];
      const back = contenido[i * 2 + 1];
      const page = document.createElement('div');
      page.className = 'page';
      page.style.zIndex = totalSheets - i;
      page.dataset.index = i;
      page.innerHTML = `
        <div class="page-front">${buildCard(front, i * 2 + 1, 'right')}</div>
        <div class="page-back">${buildCard(back, i * 2 + 2, 'left')}</div>
      `;
      book.appendChild(page);
    }
    attachGalleryEvents();
    updateBook(true);
  }

  function attachGalleryEvents() {
    document.querySelectorAll('.gallery-grid img').forEach((img) => {
      img.addEventListener('click', (e) => {
        e.stopPropagation();
        openLightbox(img.dataset.full);
      });
    });
  }

  function openLightbox(src) {
    const box = document.createElement('div');
    box.className = 'lightbox';
    box.innerHTML = `<span class="lightbox-close">&times;</span><img src="${src}">`;
    box.addEventListener('click', () => box.remove());
    document.body.appendChild(box);
  }

  function updateBook(instant) {
    const pages = document.querySelectorAll('.page');
    pages.forEach((page, i) => {
      page.style.transition = instant ? 'none' : 'transform 0.6s cubic-bezier(.4,0,.2,1)';
      if (i < currentSheet) {
        page.style.transform = 'rotateY(-180deg)';
        page.style.zIndex = i;
      } else if (i === currentSheet && dragProgress !== 0) {
        page.style.transform = `rotateY(${dragProgress}deg)`;
        page.style.zIndex = totalSheets + 1;
      } else {
        page.style.transform = 'rotateY(0deg)';
        page.style.zIndex = totalSheets - i;
      }
    });
    if (pageIndicator) pageIndicator.textContent = `${currentSheet + 1} / ${totalSheets}`;
    if (prevBtn) prevBtn.disabled = currentSheet === 0;
    if (nextBtn) nextBtn.disabled = currentSheet === totalSheets - 1;
  }

  function nextPage() {
    if (currentSheet < totalSheets - 1) {
      currentSheet++;
      dragProgress = 0;
      updateBook(false);
    }
  }
  function prevPage() {
    if (currentSheet > 0) {
      currentSheet--;
      dragProgress = 0;
      updateBook(false);
    }
  }

  if (nextBtn) nextBtn.addEventListener('click', nextPage);
  if (prevBtn) prevBtn.addEventListener('click', prevPage);

  function getX(e) {
    return e.touches ? e.touches[0].clientX : e.clientX;
  }

  book.addEventListener('mousedown', startDrag);
  book.addEventListener('touchstart', startDrag, { passive: true });

  function startDrag(e) {
    if (
      e.target.closest('.gallery-grid') ||
      e.target.closest('.video-wrap') ||
      e.target.closest('.read-more-link')
    )
      return;
    const pages = document.querySelectorAll('.page');
    if (currentSheet >= totalSheets) return;
    activePage = pages[currentSheet];
    if (!activePage) return;
    isDragging = true;
    startX = getX(e);
    activePage.style.transition = 'none';
  }

  window.addEventListener('mousemove', onDrag);
  window.addEventListener('touchmove', onDrag, { passive: true });

  function onDrag(e) {
    if (!isDragging || !activePage || !bookContainer) return;
    const x = getX(e);
    const delta = x - startX;
    const containerWidth = bookContainer.offsetWidth;
    let deg = (delta / containerWidth) * 180;
    deg = Math.max(-180, Math.min(0, deg));
    dragProgress = deg;
    activePage.style.transform = `rotateY(${deg}deg)`;
  }

  window.addEventListener('mouseup', endDrag);
  window.addEventListener('touchend', endDrag);

  function endDrag() {
    if (!isDragging) return;
    isDragging = false;
    if (dragProgress < -90) {
      nextPage();
    } else {
      dragProgress = 0;
      updateBook(false);
    }
    activePage = null;
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') nextPage();
    if (e.key === 'ArrowLeft') prevPage();
  });

  createSheets();
})();
