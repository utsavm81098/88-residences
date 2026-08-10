/*! 88RES floor-plan viewer — scrollable, zoomable image lightbox that works
    everywhere incl. iOS. Desktop: a ~90% floating popup (site visible behind)
    with the whole plan fit inside. Mobile: full-screen, fit-to-width.
    Header has Close + zoom ± + "↓ PDF". Intercepts <a href="*.pdf"> clicks and
    window.open(pdf); falls back to the PDF if the image is missing. */
(function () {
  if (window.__res88PdfModal) return;
  window.__res88PdfModal = true;

  function isPdf(u) { try { return /\.pdf(\?|#|$)/i.test(String(u)); } catch (e) { return false; } }
  function imgUrl(pdf) { return String(pdf).replace(/\.pdf(\?.*)?$/i, '.jpg'); }
  function isMobile() {
    try { return window.matchMedia('(pointer: coarse)').matches || window.innerWidth <= 900; }
    catch (e) { return window.innerWidth <= 900; }
  }

  var overlay, box, scroller, img, titleEl, dlEl, zoom = 1, fitW = 0;

  function css() {
    var s = document.createElement('style');
    s.textContent =
      '#res88-ov{position:fixed;inset:0;z-index:2147483000;display:none;align-items:center;justify-content:center;background:rgba(10,12,16,.7)}' +
      '#res88-ov.open{display:flex}' +
      '#res88-ov .box{position:relative;display:flex;flex-direction:column;width:90vw;height:90vh;max-width:1200px;background:#1b1e24;border-radius:12px;overflow:hidden;box-shadow:0 24px 70px rgba(0,0,0,.55)}' +
      '#res88-ov .hd{flex:0 0 auto;display:flex;align-items:center;gap:10px;padding:10px 12px;background:#12151a;box-shadow:0 2px 10px rgba(0,0,0,.4)}' +
      '#res88-ov .ttl{flex:1;font:600 15px/1.2 Arial,Helvetica,sans-serif;color:#e8ebef;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
      '#res88-ov .btn{flex:0 0 auto;min-width:40px;height:40px;padding:0 12px;border:0;border-radius:8px;background:rgba(255,255,255,.12);color:#fff;font:600 15px/40px Arial,sans-serif;cursor:pointer;text-align:center;text-decoration:none}' +
      '#res88-ov .btn:hover{background:rgba(255,255,255,.22)}' +
      '#res88-ov .btn.x{background:#b9432f;font-size:20px;padding:0;width:44px}' +
      '#res88-ov .btn.x:hover{background:#d24d36}' +
      '#res88-ov .sc{flex:1 1 auto;overflow:auto;-webkit-overflow-scrolling:touch;display:flex;flex-direction:column;align-items:safe center;justify-content:safe center;padding:16px}' +
      '#res88-ov img{flex:0 0 auto;height:auto;max-width:none!important;background:#fff;box-shadow:0 6px 24px rgba(0,0,0,.4);border-radius:4px}' +
      '#res88-ov .ld{color:#cfd6dd;font:500 15px Arial,sans-serif;margin:auto;padding:40px}' +
      '@media(max-width:900px){' +
        '#res88-ov{background:rgba(10,12,16,.92)}' +
        '#res88-ov .box{width:100%;height:100%;max-width:none;border-radius:0}' +
        '#res88-ov .hd{padding-top:calc(env(safe-area-inset-top,0px) + 8px)}' +
        '#res88-ov .sc{justify-content:flex-start;padding:14px 8px calc(env(safe-area-inset-bottom,0px) + 14px)}' +
      '}';
    document.head.appendChild(s);
  }

  function build() {
    css();
    overlay = document.createElement('div');
    overlay.id = 'res88-ov';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.innerHTML =
      '<div class="box">' +
        '<div class="hd">' +
          '<span class="ttl">Floor plan</span>' +
          '<button type="button" class="btn zo" aria-label="Zoom out">−</button>' +
          '<button type="button" class="btn zi" aria-label="Zoom in">+</button>' +
          '<a class="btn dl" target="_blank" rel="noopener" title="Download PDF">↓ PDF</a>' +
          '<button type="button" class="btn x" aria-label="Close">×</button>' +
        '</div>' +
        '<div class="sc"><div class="ld">Loading…</div></div>' +
      '</div>';
    document.body.appendChild(overlay);
    box = overlay.querySelector('.box');
    scroller = overlay.querySelector('.sc');
    titleEl = overlay.querySelector('.ttl');
    dlEl = overlay.querySelector('.dl');
    overlay.querySelector('.x').addEventListener('click', close);
    overlay.querySelector('.zi').addEventListener('click', function () { setZoom(zoom * 1.4); });
    overlay.querySelector('.zo').addEventListener('click', function () { setZoom(zoom / 1.4); });
    // click on the dark backdrop (outside the box) closes
    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
    // route the mouse wheel into the popup's own scroller so the site behind
    // never moves (the theme intercepts wheel on window, so body{overflow:hidden} isn't enough)
    overlay.addEventListener('wheel', function (e) {
      if (!overlay.classList.contains('open')) return;
      scroller.scrollTop += e.deltaY;
      scroller.scrollLeft += e.deltaX;
      e.preventDefault();
      e.stopPropagation();
    }, { passive: false });
  }

  function setZoom(z) {
    zoom = Math.max(1, Math.min(z, 6));
    if (img && fitW) img.style.width = Math.round(fitW * zoom) + 'px';
  }

  function fitImage() {
    if (!img) return;
    var availW = scroller.clientWidth - 32;
    var availH = scroller.clientHeight - 32;
    var natW = img.naturalWidth || availW;
    var natH = img.naturalHeight || availH;
    var aspect = natW / natH;
    if (isMobile()) {
      fitW = Math.min(availW, natW);                 // fit width, scroll down
    } else {
      fitW = Math.min(availW, availH * aspect, natW); // fit whole plan in the box
    }
    setZoom(1);
  }

  function onKey(e) { if (e.key === 'Escape' || e.keyCode === 27) close(); }

  function fileName(url) {
    try { return decodeURIComponent(url.split('/').pop().split('?')[0].replace(/\.pdf$/i, '').replace(/-/g, ' ')); }
    catch (e) { return 'Floor plan'; }
  }

  function open(url) {
    if (!overlay) build();
    zoom = 1; fitW = 0; img = null;
    titleEl.textContent = fileName(url);
    dlEl.href = url;
    scroller.innerHTML = '<div class="ld">Loading…</div>';
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    overlay.classList.add('open');
    document.addEventListener('keydown', onKey);
    scroller.scrollTop = 0;

    img = new Image();
    img.onload = function () {
      scroller.innerHTML = '';
      scroller.appendChild(img);
      fitImage();
    };
    img.onerror = function () {
      close();
      var w = window.__res88NativeOpen || window.open;
      try { w(url, '_blank'); } catch (e) { location.href = url; }
    };
    img.alt = titleEl.textContent;
    img.src = imgUrl(url);
  }

  function close() {
    if (!overlay) return;
    overlay.classList.remove('open');
    scroller.innerHTML = '';
    img = null;
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
    document.removeEventListener('keydown', onKey);
  }

  window.addEventListener('resize', function () { if (overlay && overlay.classList.contains('open')) fitImage(); });

  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a[href]') : null;
    if (!a) return;
    if (isPdf(a.getAttribute('href')) || isPdf(a.href)) {
      e.preventDefault();
      e.stopPropagation();
      open(a.href);
    }
  }, true);

  window.__res88NativeOpen = window.open ? window.open.bind(window) : null;
  window.open = function (url) {
    if (isPdf(url)) { open(String(url)); return { closed: false, close: close, focus: function () {}, blur: function () {} }; }
    return window.__res88NativeOpen ? window.__res88NativeOpen.apply(window, arguments) : null;
  };
})();
