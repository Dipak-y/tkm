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