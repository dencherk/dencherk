(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var RENDER = window.DencherkRender;
  var state = {
    site: null,
    projects: []
  };

  var ESCAPES = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };

  function $(selector, root) {
    return (root || document).querySelector(selector);
  }

  function $$(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function esc(value) {
    return String(value === null || value === undefined ? '' : value).replace(
      /[&<>"']/g,
      function (character) {
        return ESCAPES[character];
      }
    );
  }

  function setMeta(attribute, name, content) {
    if (!content) {
      return;
    }
    var element = document.head.querySelector('meta[' + attribute + '="' + name + '"]');
    if (!element) {
      element = document.createElement('meta');
      element.setAttribute(attribute, name);
      document.head.appendChild(element);
    }
    element.setAttribute('content', content);
  }

  function setCanonical(url) {
    var link = document.head.querySelector('link[rel="canonical"]');
    if (!url) {
      if (link) {
        link.remove();
      }
      return;
    }
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      document.head.appendChild(link);
    }
    link.setAttribute('href', url);
  }

  function absolute(path) {
    try {
      return new URL(path, state.site.url).href;
    } catch (error) {
      return path;
    }
  }

  function applyMeta(page) {
    var site = state.site;
    var base = site.url.endsWith('/') ? site.url : site.url + '/';
    var title;
    var description;
    var canonical;

    if (page === 'privacy') {
      title = site.privacy.metaTitle;
      description = site.privacy.metaDescription;
      canonical = absolute('privacy.html');
    } else if (page === 'notfound') {
      title = site.notFound.metaTitle;
      description = site.notFound.metaDescription;
      canonical = null;
    } else {
      title = site.meta.title;
      description = site.meta.description;
      canonical = base;
    }

    document.title = title;
    document.documentElement.lang = site.lang || 'ru';
    setMeta('name', 'description', description);
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:site_name', site.name);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:url', canonical || base);
    setMeta('property', 'og:image', absolute(site.meta.ogImage));
    setMeta('property', 'og:image:width', String(site.meta.ogImageWidth || 1200));
    setMeta('property', 'og:image:height', String(site.meta.ogImageHeight || 630));
    setMeta('property', 'og:image:alt', title);
    setMeta('name', 'twitter:title', title);
    setMeta('name', 'twitter:description', description);
    setMeta('name', 'twitter:image', absolute(site.meta.ogImage));
    setMeta('name', 'theme-color', site.meta.themeColor || '#181818');
    setCanonical(canonical);
  }

  function renderError() {
    var message =
      (state.site && state.site.ui && state.site.ui.loadingError) ||
      'Не удалось загрузить данные сайта. Обновите страницу.';
    var main = $('#main');
    if (main) {
      main.innerHTML =
        '<section class="pb-24 pt-24">' +
        '<div class="container-page">' +
        '<div class="max-w-content">' +
        '<h1 class="text-3xl font-semibold">Не удалось открыть страницу</h1>' +
        '<p class="mt-4 text-base text-muted">' +
        esc(message) +
        '</p>' +
        '<a class="btn btn-secondary mt-8" href="index.html">На главную</a>' +
        '</div>' +
        '</div>' +
        '</section>';
    }
  }

  function renderJsonLd(renderer) {
    $$('script[type="application/ld+json"]', document.head).forEach(function (element) {
      element.remove();
    });
    var script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(renderer.jsonLd());
    document.head.appendChild(script);
  }

  function setActiveSection(id) {
    $$('[data-nav]').forEach(function (link) {
      var active = link.getAttribute('data-nav') === id;
      link.classList.toggle('is-active', active);
      if (active) {
        link.setAttribute('aria-current', 'true');
      } else {
        link.removeAttribute('aria-current');
      }
    });
    $$('[data-nav-mobile]').forEach(function (link) {
      var active = link.getAttribute('data-nav-mobile') === id;
      link.classList.toggle('text-paper', active);
      link.classList.toggle('text-muted', !active);
      if (active) {
        link.setAttribute('aria-current', 'true');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  }

  function setupNav() {
    var sections = ['projects', 'about', 'contacts']
      .map(function (id) {
        return document.getElementById(id);
      })
      .filter(Boolean);

    if (!sections.length || !('IntersectionObserver' in window)) {
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: '-45% 0px -50% 0px', threshold: 0 }
    );

    sections.forEach(function (section) {
      observer.observe(section);
    });

    $$('[data-nav], [data-nav-mobile]').forEach(function (link) {
      link.addEventListener('click', function () {
        setActiveSection(link.getAttribute('data-nav') || link.getAttribute('data-nav-mobile'));
      });
    });
  }

  function setupMenu() {
    var toggle = $('[data-menu-toggle]');
    var menu = $('#mobile-menu');
    if (!toggle || !menu) {
      return;
    }

    var links = $$('[data-menu-link]', menu);
    var isOpen = false;
    var openLabel = toggle.getAttribute('data-label-open') || toggle.getAttribute('aria-label') || '';
    var closeLabel = toggle.getAttribute('data-label-close') || openLabel;

    menu.inert = true;

    function openMenu() {
      if (isOpen) {
        return;
      }
      isOpen = true;
      toggle.classList.add('is-open');
      toggle.setAttribute('aria-expanded', 'true');
      toggle.setAttribute('aria-label', closeLabel);
      menu.classList.add('is-open');
      menu.setAttribute('aria-hidden', 'false');
      menu.inert = false;
      document.body.classList.add('overflow-hidden');
      window.setTimeout(function () {
        if (links[0]) {
          links[0].focus();
        }
      }, 60);
    }

    function closeMenu(restoreFocus) {
      if (!isOpen) {
        return;
      }
      isOpen = false;
      toggle.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', openLabel);
      menu.classList.remove('is-open');
      menu.setAttribute('aria-hidden', 'true');
      menu.inert = true;
      document.body.classList.remove('overflow-hidden');
      if (restoreFocus) {
        toggle.focus();
      }
    }

    toggle.addEventListener('click', function () {
      if (isOpen) {
        closeMenu(true);
      } else {
        openMenu();
      }
    });

    links.forEach(function (link) {
      link.addEventListener('click', function () {
        closeMenu(false);
      });
    });

    document.addEventListener('keydown', function (event) {
      if (!isOpen) {
        return;
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        closeMenu(true);
      }
      if (event.key === 'Tab') {
        var focusable = $$('a[href], button:not([disabled])', menu);
        if (!focusable.length) {
          return;
        }
        var first = focusable[0];
        var last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    });

    var desktop = window.matchMedia('(min-width: 640px)');
    var onChange = function (event) {
      if (event.matches) {
        closeMenu(false);
      }
    };
    if (typeof desktop.addEventListener === 'function') {
      desktop.addEventListener('change', onChange);
    } else if (typeof desktop.addListener === 'function') {
      desktop.addListener(onChange);
    }
  }

  function setupReveals() {
    var elements = $$('[data-reveal]');
    if (!elements.length) {
      return;
    }

    if (reduceMotion.matches || !('IntersectionObserver' in window)) {
      elements.forEach(function (element) {
        element.classList.add('is-revealed');
      });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.3 }
    );

    elements.forEach(function (element) {
      observer.observe(element);
    });
  }

  function setupTagline() {
    var section = document.getElementById('approach');
    if (!section) {
      return;
    }

    var words = $$('[data-word]', section);
    if (!words.length) {
      return;
    }

    if (reduceMotion.matches) {
      words.forEach(function (word) {
        word.classList.add('is-lit');
      });
      return;
    }

    var ticking = false;

    function update() {
      ticking = false;
      var rect = section.getBoundingClientRect();
      var viewport = window.innerHeight || 1;
      var start = viewport * 0.9;
      var end = viewport * 0.45;
      var total = rect.height + (start - end);
      var progress = (start - rect.top) / total;
      var count = Math.floor(progress * (words.length + 1));

      if (count < 0) {
        count = 0;
      }
      if (count > words.length) {
        count = words.length;
      }

      words.forEach(function (word, index) {
        word.classList.toggle('is-lit', index < count);
      });
    }

    function onScroll() {
      if (ticking) {
        return;
      }
      ticking = true;
      window.requestAnimationFrame(update);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    update();
  }

  function setupHero() {
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () {
        document.body.classList.add('is-ready');
      });
    });
  }

  function setupSkipLink(page) {
    if (page !== 'notfound') {
      return;
    }

    var skip = $('.skip-link');
    var main = $('#main');
    if (!skip || !main) {
      return;
    }

    // <base href="/"> makes plain #main point at the home page, so keep the
    // skip link inside this document by moving focus with JavaScript.
    skip.addEventListener('click', function (event) {
      event.preventDefault();
      main.focus();
    });
  }

  function setupInteractions(page) {
    setupSkipLink(page);
    setupReveals();
    setupHero();

    if (page === 'home') {
      setupNav();
      setupMenu();
      setupTagline();
    }
  }

  function renderPage(page, renderer) {
    var header = $('#site-header');
    var footer = $('#site-footer');
    var main = $('#main');

    if (header) {
      header.innerHTML = renderer.header(page);
    }
    if (footer) {
      footer.innerHTML = renderer.footer(page);
    }
    if (!main) {
      return;
    }

    if (page === 'home') {
      var menuRoot = $('#menu-root');
      if (menuRoot) {
        menuRoot.innerHTML = renderer.menu();
      }
      main.innerHTML = renderer.home();
      renderJsonLd(renderer);
    } else if (page === 'privacy') {
      main.innerHTML = renderer.privacy();
    } else {
      main.innerHTML = renderer.notFound();
    }
  }

  function init() {
    var page = document.body.getAttribute('data-page') || 'home';
    var main = $('#main');

    if (main && main.hasAttribute('data-prerendered')) {
      setupInteractions(page);
      return;
    }

    if (!RENDER) {
      return;
    }

    Promise.all([
      fetch('data/site.json').then(function (response) {
        if (!response.ok) {
          throw new Error('site.json');
        }
        return response.json();
      }),
      fetch('data/projects.json').then(function (response) {
        if (!response.ok) {
          throw new Error('projects.json');
        }
        return response.json();
      })
    ])
      .then(function (data) {
        state.site = data[0];
        state.projects = (data[1] && data[1].projects) || [];

        applyMeta(page);

        var renderer = RENDER.create(state.site, state.projects);
        renderPage(page, renderer);
        setupInteractions(page);
      })
      .catch(function () {
        renderError();
      });
  }

  init();
})();
