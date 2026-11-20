(() => {
  const isTH = document.documentElement.lang === 'th';

  // Footer year
  const yearEl = document.getElementById('y');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Close mobile nav when clicking a link
  const navCheck = document.getElementById('navCheck');
  document.querySelectorAll('#siteNav a').forEach(link => {
    link.addEventListener('click', () => {
      if (navCheck) navCheck.checked = false;
    });
  });

  // Scroll progress bar & active nav link
  const progressBar = document.querySelector('.scroll-progress');
  const sections = [...document.querySelectorAll('section[id]')];
  const navLinks = [...document.querySelectorAll('#siteNav a[href^="#"]')];

  function updateScrollUI() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (progressBar && docHeight > 0) {
      progressBar.style.transform = `scaleX(${Math.min(1, Math.max(0, scrollTop / docHeight))})`;
    }
    let currentId = '';
    for (const sec of sections) {
      if (scrollTop >= sec.offsetTop - 140) currentId = sec.id;
    }
    navLinks.forEach(a => {
      a.classList.toggle('active', a.getAttribute('href') === `#${currentId}`);
    });
  }
  window.addEventListener('scroll', updateScrollUI, { passive: true });
  updateScrollUI();

  // Scroll reveal
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('in-view'));
  }

  // Interactive cursor spotlight on cards
  document.querySelectorAll('.card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - rect.left}px`);
      card.style.setProperty('--my', `${e.clientY - rect.top}px`);
    });
  });

  // Copy email on click with toast
  const toast = document.createElement('div');
  toast.className = 'toast';
  document.body.appendChild(toast);
  let toastTimer;

  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2000);
  }

  document.querySelectorAll('.copy-email').forEach(btn => {
    btn.addEventListener('click', async () => {
      const email = btn.dataset.email || btn.textContent.trim();
      try {
        await navigator.clipboard.writeText(email);
        showToast(isTH ? `คัดลอก ${email} แล้ว` : `Copied ${email}`);
      } catch {
        showToast(email);
      }
    });
  });

  // Works category filter
  const filterBtns = document.querySelectorAll('.filter-btn');
  const projCards = document.querySelectorAll('#works .proj');
  const worksGrid = document.querySelector('.works-grid');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;
      filterBtns.forEach(b => b.classList.toggle('active', b === btn));
      if (worksGrid) worksGrid.classList.toggle('filtered', filter !== 'all');
      projCards.forEach(card => {
        const match = filter === 'all' || card.dataset.category === filter;
        card.classList.toggle('is-hidden', !match);
      });
    });
  });

  // Slideshow cards
  document.querySelectorAll('.slideshow').forEach(box => {
    const interval = parseInt(box.dataset.interval || '4000', 10);
    let list;
    try { list = JSON.parse(box.dataset.slides || '[]'); }
    catch { list = []; }
    if (!Array.isArray(list) || list.length === 0) return;

    // Add slide counter badge
    const counter = document.createElement('span');
    counter.className = 'slide-count';
    counter.textContent = `1 / ${list.length}`;
    box.appendChild(counter);

    if (list.length < 2) return;

    const imgs = box.querySelectorAll('img.slide');
    if (imgs.length < 2) {
      const extra = document.createElement('img');
      extra.className = 'slide';
      extra.alt = '';
      box.appendChild(extra);
    }
    const [a, b] = box.querySelectorAll('img.slide');
    let i = 0;
    a.src = list[i];
    a.classList.add('active');
    b.src = list[(i + 1) % list.length];
    list.slice(2).forEach(src => { const p = new Image(); p.src = src; });

    setInterval(() => {
      i = (i + 1) % list.length;
      const show = a.classList.contains('active') ? b : a;
      const hide = show === a ? b : a;
      show.src = list[i];
      show.classList.add('active');
      hide.classList.remove('active');
      counter.textContent = `${i + 1} / ${list.length}`;
    }, interval);
  });

  // Lightbox
  const lb = document.createElement('div');
  lb.className = 'lightbox';
  lb.innerHTML = `
    <div class="lb-frame">
      <div class="lb-topbar">
        <span class="lb-title"></span>
        <span class="lb-counter"></span>
      </div>
      <button class="lb-btn lb-close" aria-label="Close">✕</button>
      <button class="lb-btn lb-prev" aria-label="Previous">‹</button>
      <img class="lightbox-img" alt="">
      <button class="lb-btn lb-next" aria-label="Next">›</button>
    </div>
  `;
  document.body.appendChild(lb);

  const imgEl = lb.querySelector('.lightbox-img');
  const titleEl = lb.querySelector('.lb-title');
  const counterEl = lb.querySelector('.lb-counter');
  const btnPrev = lb.querySelector('.lb-prev');
  const btnNext = lb.querySelector('.lb-next');
  const btnClose = lb.querySelector('.lb-close');

  let slides = [];
  let index = 0;

  function show(i) {
    index = (i + slides.length) % slides.length;
    imgEl.src = slides[index];
    counterEl.textContent = `${index + 1} / ${slides.length}`;
  }

  function openWith(list, startSrc, title) {
    slides = list;
    titleEl.textContent = title || '';
    const start = slides.findIndex(src => startSrc.endsWith(src) || src === startSrc);
    show(start >= 0 ? start : 0);
    lb.classList.add('active');
    document.body.classList.add('lb-open');
  }

  function close() {
    lb.classList.remove('active');
    document.body.classList.remove('lb-open');
  }

  document.querySelectorAll('.thumb.slideshow').forEach(box => {
    let list = [];
    try { list = JSON.parse(box.dataset.slides || '[]'); } catch {}
    const cardTitle = box.closest('.proj')?.querySelector('h3')?.textContent || '';
    box.addEventListener('click', e => {
      const img = box.querySelector('img.slide.active') || e.target.closest('img');
      if (!img) return;
      openWith(list.length ? list : [img.getAttribute('src')], img.getAttribute('src'), cardTitle);
    });
  });

  btnPrev.addEventListener('click', () => show(index - 1));
  btnNext.addEventListener('click', () => show(index + 1));
  btnClose.addEventListener('click', close);
  lb.addEventListener('click', e => { if (e.target === lb) close(); });

  document.addEventListener('keydown', e => {
    if (!lb.classList.contains('active')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') show(index - 1);
    if (e.key === 'ArrowRight') show(index + 1);
  });

  let sx = 0;
  imgEl.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
  imgEl.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - sx;
    if (Math.abs(dx) > 40) (dx > 0 ? btnPrev : btnNext).click();
  }, { passive: true });
})();
