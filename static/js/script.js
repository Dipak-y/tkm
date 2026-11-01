// ============ MOBILE NAV TOGGLE ============
function initNavToggle(){
  const nav = document.getElementById('nav');
  const toggle = document.getElementById('navToggle');
  const links = document.getElementById('navLinks');
  if(!nav || !toggle || !links) return;

  function closeNav(){
    nav.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
  }

  toggle.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(isOpen));
  });

  // close the menu after tapping a link
  links.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', closeNav);
  });

  // close the menu if you tap/click outside it
  document.addEventListener('click', (e) => {
    if(nav.classList.contains('is-open') && !nav.contains(e.target)){
      closeNav();
    }
  });
}
initNavToggle();

// ============ SCROLL REVEAL ============
function initScrollReveal(){
  const revealTargets = document.querySelectorAll(
    '.intro__heading, .intro__text, .emedia__left, .emedia__right, .gallery__head, .gimg, .heritage__panel'
  );
  revealTargets.forEach(el => el.classList.add('reveal'));

  const observer = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        entry.target.classList.add('in');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold:0.15 });

  revealTargets.forEach(el => observer.observe(el));
}
initScrollReveal();

// ============ SUBTLE HERO PARALLAX ============
function initHeroParallax(){
  const map = document.getElementById('heroMap');
  if(!map) return;
  window.addEventListener('scroll', ()=>{
    const y = window.scrollY;
    if(y < window.innerHeight){
      map.style.transform = `translateY(${y * 0.08}px)`;
    }
  }, { passive:true });
}
initHeroParallax();

// ============ ACCORDION SERVICE CARDS ============
// CSS :hover already opens a card on pointer devices; this adds the
// same behaviour on tap for touch devices and keeps exactly one
// card open at a time.
function initCardAccordion(){
  const wrap = document.querySelector('.cards');
  if(!wrap) return;
  const cards = Array.from(wrap.querySelectorAll('.card'));

  function openCard(card){
    cards.forEach(c => c.classList.toggle('is-open', c === card));
  }

  function closeAll(){
    cards.forEach(c => c.classList.remove('is-open'));
  }

  const isTouch = window.matchMedia('(hover: none)').matches;

  if(isTouch){
    cards.forEach(card => {
      card.addEventListener('click', (e) => {
        if(card.classList.contains('is-open')) return; // let "Read more" work
        e.preventDefault();
        openCard(card);
      });
    });
  } else {
    cards.forEach(card => {
      card.addEventListener('mouseenter', () => openCard(card));
      card.addEventListener('focus', () => openCard(card));
      card.addEventListener('blur', () => card.classList.remove('is-open'));
    });
    wrap.addEventListener('mouseleave', closeAll);
  }
}
initCardAccordion();

// ============ GALLERY: SHOW ALL ALBUMS ============
function initGalleryAlbums(){
  const btn = document.getElementById('galleryAllBtn');
  const strip = document.querySelector('.gallery__strip');
  if(!btn || !strip) return;

  btn.addEventListener('click', () => {
    const expanded = strip.classList.toggle('is-expanded');
    btn.textContent = expanded ? 'Show less' : 'All albums';
  });
}
initGalleryAlbums();


// ============ HERO SERVICE SLIDER ============
// Auto-advances every 2 seconds. The active service fills the hero;
// the remaining services sit on the right as cards. Click a card, use
// the arrows, or just let it run.
function initHeroSlider(){
  const hero  = document.getElementById('hero');
  const track = document.getElementById('heroTrack');
  if(!hero || !track) return;

  const INTERVAL = 2000;   // ms between slides
  const MOVE_MS  = 650;    // card-strip slide duration
  const EXPAND_MS = 950;   // card -> full-screen background
  const TEXT_OUT_MS = 380; // old text blurs out before new text blurs in
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const slideEls = Array.from(hero.querySelectorAll('.hero__slide'));
  const total = slideEls.length;
  if(total < 2) return;

  const data = slideEls.map((el, i) => ({
    title: el.dataset.title,
    desc:  el.dataset.desc,
    thumb: el.dataset.thumb,
    tag:   'Service ' + String(i + 1).padStart(2, '0')
  }));

  const content = hero.querySelector('.hero__content');
  const tagEl   = document.getElementById('heroTag');
  const titleEl = document.getElementById('heroTitle');
  const descEl  = document.getElementById('heroDesc');
  const numEl   = document.getElementById('heroNum');
  const barEl   = document.getElementById('heroBar');
  const prevBtn = document.getElementById('heroPrev');
  const nextBtn = document.getElementById('heroNext');

  let current = 0;
  let timer = null;
  let busy = false;
  let paused = false;

  // "&amp;" etc. in data-* arrive decoded already, so plain text is safe
  function setText(el, txt){ el.textContent = txt; }

  function makeCard(i){
    const d = data[i];
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'hcard';
    b.dataset.i = i;
    b.setAttribute('aria-label', 'Show ' + d.title);
    const img = document.createElement('img');
    img.src = d.thumb; img.alt = ''; img.loading = 'eager'; img.decoding = 'async';
    img.onerror = () => { img.style.display = 'none'; };
    const body = document.createElement('span');
    body.className = 'hcard__body';
    body.innerHTML = '<i class="hcard__line"></i><span class="hcard__tag"></span><span class="hcard__title"></span>';
    body.querySelector('.hcard__tag').textContent = d.tag;
    body.querySelector('.hcard__title').textContent = d.title;
    b.append(img, body);
    b.addEventListener('click', () => goTo(i));
    return b;
  }

  // cards are every service, starting with the active one (highlighted),
  // so the thumbnail of the current background is always visible too
  function railOrder(active){
    const out = [];
    for(let k = 0; k < total; k++) out.push((active + k) % total);
    return out;
  }
  function markActiveCard(card){
    Array.from(track.children).forEach(c => {
      c.classList.remove('is-active');
      c.removeAttribute('aria-current');
    });
    if(card){ card.classList.add('is-active'); card.setAttribute('aria-current', 'true'); }
  }
  function renderRail(active){
    track.replaceChildren(...railOrder(active).map(makeCard));
    markActiveCard(track.firstElementChild);
  }
  function stepSize(){
    const cards = track.children;
    if(cards.length > 1) return cards[1].offsetLeft - cards[0].offsetLeft;
    return cards[0] ? cards[0].offsetWidth + 18 : 0;
  }

  function setBg(i){
    slideEls.forEach((el, n) => el.classList.toggle('is-active', n === i));
  }
  function setInfo(i){
    current = i;
    setText(tagEl, data[i].tag);
    setText(titleEl, data[i].title);
    setText(descEl, data[i].desc);
    setText(numEl, String(i + 1).padStart(2, '0'));
    barEl.style.width = ((i + 1) / total * 100) + '%';
    // replay the blur-in text entrance
    content.classList.remove('is-out');
    content.classList.remove('is-swapping');
    void content.offsetWidth;
    content.classList.add('is-swapping');
  }
  function showSlide(i){ setBg(i); setInfo(i); }

  // grow the first card into the full-screen background
  function expandCard(card, newActive){
    const box = hero.querySelector('.hero__slides');
    const hb = box.getBoundingClientRect();
    const cb = card.getBoundingClientRect();
    const ex = document.createElement('div');
    ex.className = 'hero__expander';
    const img = document.createElement('img');
    img.alt = '';
    img.src = slideEls[newActive].querySelector('img').src;
    ex.appendChild(img);
    ex.style.left = (cb.left - hb.left) + 'px';
    ex.style.top = (cb.top - hb.top) + 'px';
    ex.style.width = cb.width + 'px';
    ex.style.height = cb.height + 'px';
    ex.style.borderRadius = getComputedStyle(card).borderRadius;
    box.appendChild(ex);
    void ex.offsetWidth;
    ex.style.left = '0px'; ex.style.top = '0px';
    ex.style.width = hb.width + 'px'; ex.style.height = hb.height + 'px';
    ex.style.borderRadius = '0px';
    setTimeout(() => {
      hero.classList.add('is-instant');
      setBg(newActive);
      void hero.offsetWidth;
      ex.remove();
      requestAnimationFrame(() => hero.classList.remove('is-instant'));
    }, EXPAND_MS + 20);
  }

  function unlockAfter(ms){
    setTimeout(() => { busy = false; }, ms);
  }

  function next(){
    if(busy) return;
    busy = true;
    const old = current;
    const newActive = (current + 1) % total;

    // park the outgoing service at the end of the strip so it slides in from the right
    track.appendChild(makeCard(old));
    const step = stepSize();
    const target = track.children[1];      // the card for the service that becomes active
    markActiveCard(target);                // highlight moves to it right away
    track.style.transition = 'transform ' + MOVE_MS + 'ms cubic-bezier(.22,1,.36,1)';
    track.style.transform = 'translateX(' + (-step) + 'px)';

    if(reduceMotion){
      showSlide(newActive);
    } else {
      // 1) card grows to full screen, 2) old text blurs out, 3) new text blurs in
      expandCard(target, newActive);
      content.classList.remove('is-swapping');
      content.classList.add('is-out');
      setTimeout(() => setInfo(newActive), TEXT_OUT_MS);
    }

    setTimeout(() => {
      track.style.transition = 'none';
      track.style.transform = 'none';
      renderRail(newActive);
    }, MOVE_MS + 30);
    unlockAfter(reduceMotion ? MOVE_MS + 30 : EXPAND_MS + 60);
  }

  function prev(){
    if(busy) return;
    busy = true;
    const newActive = (current - 1 + total) % total;
    renderRail(newActive);                 // first card = the service we're returning to (active)
    const step = stepSize();
    track.style.transition = 'none';
    track.style.transform = 'translateX(' + (-step) + 'px)';
    void track.offsetWidth;
    track.style.transition = 'transform ' + MOVE_MS + 'ms cubic-bezier(.22,1,.36,1)';
    track.style.transform = 'none';
    showSlide(newActive);
    unlockAfter(MOVE_MS + 30);
  }

  function goTo(i){
    if(i === current) return;
    if(busy) return;
    busy = true;
    track.style.transition = 'none';
    track.style.transform = 'none';
    showSlide(i);
    renderRail(i);
    unlockAfter(300);
    restart();
  }

  // ---- autoplay ----
  function tick(){
    if(!paused && !document.hidden) next();
    schedule();
  }
  function schedule(){
    clearTimeout(timer);
    timer = setTimeout(tick, INTERVAL);
  }
  function restart(){ schedule(); }

  prevBtn && prevBtn.addEventListener('click', () => { prev(); restart(); });
  nextBtn && nextBtn.addEventListener('click', () => { next(); restart(); });

  // pause while the pointer / keyboard focus is on the cards or controls,
  // so a card can be clicked without it moving away
  const hold = [hero.querySelector('.hero__rail'), hero.querySelector('.hero__controls')];
  hold.forEach(el => {
    if(!el) return;
    el.addEventListener('mouseenter', () => { paused = true; });
    el.addEventListener('mouseleave', () => { paused = false; schedule(); });
    el.addEventListener('focusin',    () => { paused = true; });
    el.addEventListener('focusout',   () => { paused = false; schedule(); });
  });

  // don't burn cycles while the hero is scrolled out of view
  if('IntersectionObserver' in window){
    new IntersectionObserver(entries => {
      entries.forEach(e => {
        paused = !e.isIntersecting;
        if(e.isIntersecting) schedule();
      });
    }, { threshold: 0.25 }).observe(hero);
  }

  // left / right arrow keys when the hero has focus
  hero.addEventListener('keydown', e => {
    if(e.key === 'ArrowRight'){ next(); restart(); }
    if(e.key === 'ArrowLeft'){ prev(); restart(); }
  });

  // init
  showSlide(0);
  renderRail(0);
  schedule();
}
initHeroSlider();


// ============ NAV BACKGROUND ON SCROLL ============
// Transparent over the hero; gets its background once the page scrolls.
function initNavScroll(){
  const nav = document.getElementById('nav');
  if(!nav) return;
  const update = () => nav.classList.toggle('is-scrolled', window.scrollY > 40);
  window.addEventListener('scroll', update, { passive:true });
  update();
}
initNavScroll();

// ============ GALLERY: CLICK IMAGE TO OPEN (LIGHTBOX) ============
function initGalleryLightbox(){
  const strip = document.querySelector('.gallery__strip');
  if(!strip) return;

  const box = document.createElement('div');
  box.className = 'lightbox';
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-modal', 'true');
  box.setAttribute('aria-hidden', 'true');
  box.innerHTML =
    '<button class="lightbox__close" type="button" aria-label="Close">&times;</button>' +
    '<button class="lightbox__nav lightbox__nav--prev" type="button" aria-label="Previous">&#10094;</button>' +
    '<figure class="lightbox__figure"><img class="lightbox__img" alt="">' +
    '<figcaption class="lightbox__cap"></figcaption></figure>' +
    '<button class="lightbox__nav lightbox__nav--next" type="button" aria-label="Next">&#10095;</button>';
  document.body.appendChild(box);

  const imgEl = box.querySelector('.lightbox__img');
  const capEl = box.querySelector('.lightbox__cap');
  let items = [], idx = 0;

  // only figures currently visible (hidden "extra" ones are skipped until expanded)
  const visibleItems = () => Array.from(strip.querySelectorAll('.gimg')).filter(f => f.offsetParent !== null);
  // swap the 700x700 crop for a large uncropped version
  const bigSrc = src => src.replace(/c_fill,w_\d+,h_\d+/, 'c_limit,w_1800');

  function show(i){
    idx = (i + items.length) % items.length;
    const fig = items[idx];
    const img = fig.querySelector('img');
    if(!img) return;
    imgEl.classList.add('is-loading');
    imgEl.onload = () => imgEl.classList.remove('is-loading');
    imgEl.onerror = () => { imgEl.onerror = null; imgEl.src = img.src; };
    imgEl.src = bigSrc(img.currentSrc || img.src);
    imgEl.alt = img.alt || '';
    const cap = fig.querySelector('figcaption span');
    capEl.textContent = cap ? cap.textContent.replace(/\s+/g, ' ').trim() : '';
  }
  function open(fig){
    items = visibleItems();
    const i = items.indexOf(fig);
    if(i < 0) return;
    show(i);
    box.classList.add('is-open');
    box.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    box.querySelector('.lightbox__close').focus();
  }
  function close(){
    box.classList.remove('is-open');
    box.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    imgEl.removeAttribute('src');
  }

  // make cards keyboard-reachable
  strip.querySelectorAll('.gimg').forEach(f => { f.tabIndex = 0; f.setAttribute('role', 'button'); });

  strip.addEventListener('click', e => {
    const fig = e.target.closest('.gimg');
    if(fig) open(fig);
  });
  strip.addEventListener('keydown', e => {
    if((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('gimg')){
      e.preventDefault(); open(e.target);
    }
  });

  box.querySelector('.lightbox__close').addEventListener('click', close);
  box.querySelector('.lightbox__nav--prev').addEventListener('click', () => show(idx - 1));
  box.querySelector('.lightbox__nav--next').addEventListener('click', () => show(idx + 1));
  box.addEventListener('click', e => { if(e.target === box) close(); });   // click backdrop

  document.addEventListener('keydown', e => {
    if(!box.classList.contains('is-open')) return;
    if(e.key === 'Escape') close();
    else if(e.key === 'ArrowLeft') show(idx - 1);
    else if(e.key === 'ArrowRight') show(idx + 1);
  });

  // swipe on touch screens
  let x0 = null;
  box.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive:true });
  box.addEventListener('touchend', e => {
    if(x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    if(Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1));
    x0 = null;
  });
}
initGalleryLightbox();

/* Contact form -> EmailJS */
const form = document.querySelector('.contact-form');
if(form){
  const status = form.querySelector('.form-status');
  const button = form.querySelector('button[type="submit"]');

  /* Event date: today or later only */
  const dateInput = form.querySelector('input[name="event_date"]');
  const todayStr = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); /* local date, not UTC */
    return d.toISOString().split('T')[0];
  };
  const checkDate = () => {
    if(!dateInput) return true;
    dateInput.min = todayStr();
    if(dateInput.value && dateInput.value < dateInput.min){
      dateInput.setCustomValidity('Please choose today or a future date.');
      return false;
    }
    dateInput.setCustomValidity('');
    return true;
  };
  /* Phone: exactly 10 digits */
  const phoneInput = form.querySelector('input[name="phone"]');
  const checkPhone = () => {
    if(!phoneInput) return true;
    phoneInput.value = phoneInput.value.replace(/\D/g, '').slice(0, 10); /* digits only */
    if(phoneInput.value.length !== 10){
      phoneInput.setCustomValidity('Contact number must be exactly 10 digits.');
      return false;
    }
    phoneInput.setCustomValidity('');
    return true;
  };
  if(phoneInput) phoneInput.addEventListener('input', checkPhone);

  if(dateInput){
    dateInput.min = todayStr();
    dateInput.addEventListener('input', checkDate);
    dateInput.addEventListener('change', checkDate);
  }

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if(form.website && form.website.value) return; /* bot */
    checkDate();
    checkPhone();
    if(!form.reportValidity()) return;

    const label = button.innerHTML;
    button.disabled = true;
    button.innerHTML = 'Sending…';

    try{
      await emailjs.sendForm(
        'service_5lophjf',
        'template_udnu8km',
        form,
        {publicKey:'OWYN_oXM6TeZTPDf-'}
      );
      status.className = 'form-status is-visible success';
      status.textContent = 'Thank you! Your message has been sent.';
      form.reset();
    }catch(err){
      status.className = 'form-status is-visible error';
      status.textContent = 'Could not send. Please try again.';
    }finally{
      button.disabled = false;
      button.innerHTML = label;
    }
  });
}

/* Gallery slider: arrows + mouse drag. Self-contained so it works even if script.js is cached or stops early. */
(function(){
  function init(){
    var strip = document.querySelector('.gallery__strip');
    var prev  = document.querySelector('.gslide-btn--prev');
    var next  = document.querySelector('.gslide-btn--next');
    if(!strip || !prev || !next) return;

    /* drop any older listeners on the arrows, then bind fresh ones */
    var p2 = prev.cloneNode(true); prev.parentNode.replaceChild(p2, prev); prev = p2;
    var n2 = next.cloneNode(true); next.parentNode.replaceChild(n2, next); next = n2;

    function step(){
      var tile = strip.querySelector('.gimg');
      if(!tile) return strip.clientWidth;
      var gap = parseFloat(getComputedStyle(strip).columnGap) || 0;
      var w = tile.getBoundingClientRect().width + gap;
      return w * Math.max(1, Math.floor((strip.clientWidth + gap) / w));
    }
    function update(){
      prev.disabled = strip.scrollLeft <= 2;
      next.disabled = strip.scrollLeft >= strip.scrollWidth - strip.clientWidth - 2;
    }
    prev.addEventListener('click', function(){ strip.scrollBy({ left: -step(), behavior: 'smooth' }); });
    next.addEventListener('click', function(){ strip.scrollBy({ left:  step(), behavior: 'smooth' }); });
    strip.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    window.addEventListener('load', update);
    update();

    /* mouse drag (touch swipes natively) */
    var down = false, moved = false, startX = 0, startLeft = 0, blockClick = false;
    Array.prototype.forEach.call(strip.querySelectorAll('img'), function(img){ img.draggable = false; });
    strip.addEventListener('mousedown', function(e){
      if(e.button !== 0) return;
      down = true; moved = false; startX = e.clientX; startLeft = strip.scrollLeft;
    });
    window.addEventListener('mousemove', function(e){
      if(!down) return;
      var dx = e.clientX - startX;
      if(!moved && Math.abs(dx) > 5){ moved = true; strip.classList.add('is-dragging'); }
      if(moved){ strip.scrollLeft = startLeft - dx; e.preventDefault(); }
    });
    function end(){
      if(!down) return;
      down = false;
      if(moved){
        blockClick = true; setTimeout(function(){ blockClick = false; }, 0);
        strip.classList.remove('is-dragging');
      }
    }
    window.addEventListener('mouseup', end);
    window.addEventListener('mouseleave', end);
    window.addEventListener('click', function(e){
      if(blockClick && strip.contains(e.target)){ e.stopPropagation(); e.preventDefault(); }
    }, true);
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();

/* Gallery auto-slide: moves one photo every 3 seconds, loops back to the start.
   Pauses on hover/touch/drag, while the lightbox is open, off-screen, or when the tab is hidden. */
(function(){
  var DELAY = 3000;

  function init(){
    var strip = document.querySelector('.gallery__strip');
    if(!strip) return;
    if(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var timer = null, hovering = false, visible = true;

    function stepPx(){
      var tile = strip.querySelector('.gimg');
      if(!tile) return strip.clientWidth;
      var gap = parseFloat(getComputedStyle(strip).columnGap) || 0;
      return tile.getBoundingClientRect().width + gap;
    }
    function lightboxOpen(){
      return !!document.querySelector('.lightbox.is-open');
    }
    function dragging(){
      return strip.classList.contains('is-dragging');
    }
    function tick(){
      if(hovering || !visible || document.hidden || lightboxOpen() || dragging()) return;
      var max = strip.scrollWidth - strip.clientWidth;
      if(strip.scrollLeft >= max - 4){
        strip.scrollTo({ left: 0, behavior: 'smooth' });      // end reached: loop back
      } else {
        strip.scrollBy({ left: stepPx(), behavior: 'smooth' });
      }
    }
    function start(){ stop(); timer = setInterval(tick, DELAY); }
    function stop(){ if(timer){ clearInterval(timer); timer = null; } }

    /* pause while the pointer is on the gallery; restart the 3s count when it leaves */
    var area = strip.closest('.gallery__slider') || strip;
    area.addEventListener('mouseenter', function(){ hovering = true; });
    area.addEventListener('mouseleave', function(){ hovering = false; start(); });
    area.addEventListener('touchstart', function(){ hovering = true; }, { passive: true });
    area.addEventListener('touchend', function(){ setTimeout(function(){ hovering = false; start(); }, 3000); }, { passive: true });
    /* a manual arrow click or drag restarts the 3s count so it does not jump straight after */
    area.addEventListener('click', start);
    strip.addEventListener('mouseup', start);

    /* only run while the gallery is on screen */
    if('IntersectionObserver' in window){
      new IntersectionObserver(function(entries){
        visible = entries[0].isIntersecting;
      }, { threshold: 0.25 }).observe(strip);
    }
    document.addEventListener('visibilitychange', function(){ if(!document.hidden) start(); });

    start();
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();