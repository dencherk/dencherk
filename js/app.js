(function () {
  'use strict';

  var ICONS = window.PHOSPHOR || {};
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
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

  function icon(name, classes) {
    var svg = ICONS[name];
    if (!svg) {
      return '';
    }
    return svg.replace(
      '<svg ',
      '<svg class="' + (classes || 'h-5 w-5') + '" aria-hidden="true" focusable="false" '
    );
  }

  function isTodo(value) {
    return typeof value === 'string' && /\bTODO\b/.test(value);
  }

  function isVisible(project) {
    if (!project || project.hidden === true) {
      return false;
    }
    return !['title', 'tagline', 'description', 'icon'].some(function (field) {
      return isTodo(project[field]);
    });
  }

  function visibleProjects(type) {
    return state.projects.filter(function (project) {
      return project.type === type && isVisible(project);
    });
  }

  function projectBySlug(slug) {
    return state.projects.filter(function (project) {
      return project.slug === slug && isVisible(project);
    })[0];
  }

  function absolute(path) {
    try {
      return new URL(path, state.site.url).href;
    } catch (error) {
      return path;
    }
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

  function renderHeader(page) {
    var header = $('#site-header');
    if (!header || !state.site) {
      return;
    }

    var nav = state.site.nav;

    if (page !== 'home') {
      header.innerHTML =
        '<nav class="nav-capsule" aria-label="' +
        esc(nav.ariaLabel) +
        '">' +
        '<a class="nav-brand" href="index.html">' +
        esc(state.site.name) +
        '</a>' +
        '<a class="nav-link" href="index.html">' +
        esc(nav.homeLabel) +
        '</a>' +
        '</nav>';
      return;
    }

    var links = nav.items
      .map(function (item) {
        return (
          '<a class="nav-link" href="' +
          esc(item.href) +
          '" data-nav="' +
          esc(item.id) +
          '">' +
          esc(item.label) +
          '</a>'
        );
      })
      .join('');

    header.innerHTML =
      '<nav class="nav-capsule" aria-label="' +
      esc(nav.ariaLabel) +
      '">' +
      '<a class="nav-brand" href="#top" aria-label="' +
      esc(nav.brandLabel) +
      '">' +
      esc(state.site.name) +
      '</a>' +
      '<div class="hidden items-center gap-1 sm:flex">' +
      links +
      '</div>' +
      '<button class="nav-toggle sm:hidden" type="button" aria-expanded="false" aria-controls="mobile-menu" aria-label="' +
      esc(nav.openMenu) +
      '" data-menu-toggle>' +
      '<span class="toggle-lines" aria-hidden="true"><span></span><span></span></span>' +
      '</button>' +
      '</nav>';
  }

  function renderMenu() {
    var root = $('#menu-root');
    if (!root || !state.site) {
      return;
    }

    var nav = state.site.nav;
    var items = nav.items
      .map(function (item, index) {
        return (
          '<a class="mobile-link flex items-baseline gap-4 py-3 text-3xl font-semibold text-paper hover:text-paper" href="' +
          esc(item.href) +
          '" style="--d:' +
          Math.min(index * 60, 400) +
          'ms" data-menu-link data-nav-mobile="' +
          esc(item.id) +
          '">' +
          '<span class="text-sm font-semibold text-muted" aria-hidden="true">0' +
          (index + 1) +
          '</span>' +
          esc(item.label) +
          '</a>'
        );
      })
      .join('');

    root.innerHTML =
      '<div id="mobile-menu" class="mobile-menu sm:hidden" role="dialog" aria-modal="true" aria-label="' +
      esc(nav.menuLabel) +
      '" aria-hidden="true">' +
      '<nav class="flex h-full flex-col justify-center px-6" aria-label="' +
      esc(nav.menuLabel) +
      '">' +
      items +
      '</nav>' +
      '</div>';
  }

  function renderFooter(page) {
    var footer = $('#site-footer');
    if (!footer || !state.site) {
      return;
    }

    var data = state.site.footer;
    var year = new Date().getFullYear();
    var links =
      page === 'home'
        ? '<a class="footer-link" href="privacy.html">' +
          esc(data.privacy) +
          '</a>' +
          '<a class="footer-link" href="#top">' +
          esc(data.backToTop) +
          '</a>'
        : '<a class="footer-link" href="index.html">' +
          esc(state.site.nav.homeLabel) +
          '</a>';

    footer.innerHTML =
      '<div class="container-page flex flex-col gap-6 py-12 sm:flex-row sm:items-center sm:justify-between">' +
      '<div class="flex items-center gap-3">' +
      '<img class="h-8 w-8 rounded-lg" src="assets/favicon/favicon-32.png" width="32" height="32" alt="" loading="lazy" decoding="async">' +
      '<div>' +
      '<p class="text-sm font-semibold">' +
      esc(state.site.name) +
      '</p>' +
      '<p class="text-xs text-muted">© ' +
      year +
      '. ' +
      esc(data.rights) +
      '</p>' +
      '</div>' +
      '</div>' +
      '<div class="flex flex-wrap items-center gap-6 text-sm">' +
      links +
      '</div>' +
      '</div>';
  }

  function heroVisual() {
    var tiles = (state.site.hero.tiles || [])
      .map(function (tile) {
        var project = projectBySlug(tile.slug);
        if (!project) {
          return '';
        }
        return (
          '<div class="flex flex-col items-center gap-2 rounded-2xl border border-line bg-surface p-2 text-center">' +
          '<img class="h-12 w-12 rounded-lg" src="' +
          esc(project.icon) +
          '" width="192" height="192" alt="" loading="eager" decoding="async">' +
          '<p class="text-xs font-semibold leading-4">' +
          esc(project.title) +
          '</p>' +
          '</div>'
        );
      })
      .join('');

    var shots = visibleProjects('app')
      .slice(0, 2)
      .map(function (project, index) {
        var shot = project.screenshots && project.screenshots[0];
        if (!shot) {
          return '';
        }
        return (
          '<figure class="rounded-2xl border border-line bg-surface p-1">' +
          '<img class="aspect-[9/16] w-full rounded-xl object-cover" src="' +
          esc(shot.src) +
          '" width="' +
          (shot.width || 720) +
          '" height="' +
          (shot.height || 1280) +
          '" alt="' +
          esc(shot.alt || state.site.projects.labels.screenshotAlt) +
          '" loading="eager"' +
          (index === 0 ? ' fetchpriority="high"' : '') +
          ' decoding="async">' +
          '</figure>'
        );
      })
      .join('');

    return (
      '<div class="mx-auto w-full max-w-lg">' +
      '<div class="grid grid-cols-2 gap-3 sm:gap-4">' +
      tiles +
      shots +
      '</div>' +
      '</div>'
    );
  }

  function renderHero() {
    var hero = state.site.hero;
    var lines = hero.titleLines
      .map(function (line) {
        var words = line.split(/\s+/).filter(Boolean);
        if (words.length < 3) {
          return '<span class="block">' + esc(line) + '</span>';
        }
        var head = words.slice(0, -2).map(esc).join(' ');
        var tail = words.slice(-2).map(esc).join(' ');
        return (
          '<span class="block">' +
          head +
          ' <span class="whitespace-nowrap">' +
          tail +
          '</span></span>'
        );
      })
      .join(' ');
    var proof = hero.proof
      ? '<p class="hero-in mt-6 text-sm text-muted" style="--d:240ms">' + esc(hero.proof) + '</p>'
      : '';

    return (
      '<section class="pt-24 pb-16 sm:pb-24" id="top" aria-labelledby="hero-title">' +
      '<div class="container-page">' +
      '<div class="grid items-center gap-12 xl:grid-cols-[1fr_360px] xl:gap-12">' +
      '<div>' +
      '<p class="hero-in inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-2 text-sm font-semibold text-muted" style="--d:0ms">' +
      '<span class="h-2 w-2 rounded-full bg-muted" aria-hidden="true"></span>' +
      esc(hero.eyebrow) +
      '</p>' +
      '<h1 id="hero-title" class="hero-in mt-4 max-w-content bg-gradient-to-r from-paper to-muted bg-clip-text pb-2 text-4xl font-semibold text-transparent sm:text-5xl" style="--d:60ms">' +
      lines +
      '</h1>' +
      '<p class="hero-in mt-6 max-w-content text-lg text-muted" style="--d:120ms">' +
      esc(hero.subtitle) +
      '</p>' +
      '<div class="hero-in mt-8" style="--d:180ms">' +
      '<a class="btn btn-primary" href="' +
      esc(hero.cta.href) +
      '">' +
      esc(hero.cta.label) +
      icon('arrow-down', 'h-5 w-5') +
      '</a>' +
      '</div>' +
      proof +
      '</div>' +
      '<div class="hero-in" style="--d:300ms">' +
      heroVisual() +
      '</div>' +
      '</div>' +
      '</div>' +
      '</section>'
    );
  }

  function projectLinks(project) {
    return (project.links || [])
      .map(function (link) {
        var label = esc(link.label) + ' — ' + esc(project.title) + ', ' + esc(state.site.projects.labels.newTab);
        return (
          '<a class="btn btn-secondary" href="' +
          esc(link.url) +
          '" target="_blank" rel="noopener noreferrer" aria-label="' +
          label +
          '">' +
          esc(link.label) +
          icon('arrow-up-right', 'h-4 w-4') +
          '<span class="sr-only">, ' +
          esc(state.site.projects.labels.newTab) +
          '</span>' +
          '</a>'
        );
      })
      .join('');
  }

  function projectHeading(project) {
    var id = 'project-' + project.slug;
    return (
      '<div class="flex flex-col items-start gap-3 sm:flex-row sm:items-start sm:gap-4">' +
      '<img class="h-12 w-12 shrink-0 rounded-xl" src="' +
      esc(project.icon) +
      '" width="192" height="192" alt="" loading="lazy" decoding="async">' +
      '<div class="min-w-0">' +
      '<h4 id="' +
      esc(id) +
      '" class="text-lg font-semibold sm:text-xl">' +
      esc(project.title) +
      '</h4>' +
      '<p class="mt-2 text-sm text-muted">' +
      esc(project.tagline) +
      '</p>' +
      '</div>' +
      '</div>'
    );
  }

  function platformRow(project) {
    var iconName = project.type === 'site' ? 'globe' : 'device-mobile';
    return (
      '<p class="mt-4 flex items-center gap-2 text-xs text-muted">' +
      icon(iconName, 'h-4 w-4') +
      esc(project.platform) +
      '</p>'
    );
  }

  function appCard(project, index) {
    var shots = project.screenshots || [];
    var shot = shots[1] || shots[0];
    var id = 'project-' + project.slug;
    return (
      '<article class="card-reveal project-card grid grid-cols-[1fr_80px] gap-3 rounded-2xl border border-line bg-surface p-4 sm:grid-cols-[1fr_140px] sm:gap-6 sm:p-6" style="--i:' +
      index +
      '" aria-labelledby="' +
      esc(id) +
      '">' +
      '<div class="flex min-w-0 flex-col">' +
      projectHeading(project) +
      platformRow(project) +
      '<div class="mt-auto flex flex-wrap gap-2 pt-6">' +
      projectLinks(project) +
      '</div>' +
      '</div>' +
      (shot
        ? '<div class="self-start overflow-hidden rounded-xl border border-line bg-surface-2">' +
          '<img class="aspect-[9/16] w-full object-cover object-top" src="' +
          esc(shot.src) +
          '" width="' +
          (shot.width || 720) +
          '" height="' +
          (shot.height || 1280) +
          '" alt="' +
          esc(shot.alt || state.site.projects.labels.screenshotAlt) +
          '" loading="lazy" decoding="async">' +
          '</div>'
        : '') +
      '</article>'
    );
  }

  function siteCard(project, index) {
    var shot = (project.screenshots || [])[0];
    var id = 'project-' + project.slug;
    return (
      '<article class="card-reveal project-card grid gap-6 rounded-2xl border border-line bg-surface p-4 sm:p-6 lg:grid-cols-[1fr_1.05fr] lg:items-center" style="--i:' +
      index +
      '" aria-labelledby="' +
      esc(id) +
      '">' +
      '<div class="flex flex-col">' +
      projectHeading(project) +
      platformRow(project) +
      '<div class="mt-auto flex flex-wrap gap-2 pt-6">' +
      projectLinks(project) +
      '</div>' +
      '</div>' +
      (shot
        ? '<div class="overflow-hidden rounded-xl border border-line bg-surface-2">' +
          '<img class="aspect-[16/10] w-full object-cover object-top" src="' +
          esc(shot.src) +
          '" width="' +
          (shot.width || 1200) +
          '" height="' +
          (shot.height || 750) +
          '" alt="' +
          esc(shot.alt || state.site.projects.labels.screenshotAlt) +
          '" loading="lazy" decoding="async">' +
          '</div>'
        : '') +
      '</article>'
    );
  }

  function emptyState(empty) {
    if (!empty) {
      return '';
    }
    return (
      '<div class="mt-6 flex flex-col items-start gap-6 rounded-2xl border border-line bg-surface p-6 sm:flex-row sm:items-center sm:p-8">' +
      '<span class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-surface-2 text-muted">' +
      icon(empty.icon, 'h-6 w-6') +
      '</span>' +
      '<div>' +
      '<h4 class="text-xl font-semibold">' +
      esc(empty.title) +
      '</h4>' +
      '<p class="mt-2 text-base text-muted">' +
      esc(empty.text) +
      '</p>' +
      '</div>' +
      '</div>'
    );
  }

  function renderProjects() {
    var groups = state.site.projects.groups
      .map(function (group) {
        var items = visibleProjects(group.type);
        var cards = items
          .map(function (project, index) {
            return project.type === 'site' ? siteCard(project, index) : appCard(project, index);
          })
          .join('');
        var grid =
          group.type === 'app' ? 'grid gap-6 lg:grid-cols-2' : 'grid gap-6';
        var content = items.length ? '<div class="mt-6 ' + grid + '">' + cards + '</div>' : emptyState(group.empty);

        return (
          '<div id="group-' +
          esc(group.id) +
          '">' +
          '<div class="flex items-center justify-between gap-4">' +
          '<h3 class="text-2xl font-semibold">' +
          esc(group.title) +
          '</h3>' +
          '<span class="rounded-full border border-line px-3 py-2 text-sm font-semibold text-muted">' +
          items.length +
          '</span>' +
          '</div>' +
          content +
          '</div>'
        );
      })
      .join('');

    return (
      '<section class="reveal scroll-mt-24 py-16 sm:py-24" id="projects" aria-labelledby="projects-title" data-reveal>' +
      '<div class="container-page">' +
      '<div class="max-w-content">' +
      '<p class="eyebrow">' +
      esc(state.site.projects.eyebrow) +
      '</p>' +
      '<h2 id="projects-title" class="mt-4 text-3xl font-semibold sm:text-4xl">' +
      esc(state.site.projects.title) +
      '</h2>' +
      '<p class="mt-4 text-base text-muted sm:text-lg">' +
      esc(state.site.projects.lead) +
      '</p>' +
      '</div>' +
      '<div class="mt-12 space-y-16 sm:mt-16">' +
      groups +
      '</div>' +
      '</div>' +
      '</section>'
    );
  }

  function renderTagline() {
    var tagline = state.site.tagline;
    var plain = tagline.lines.join(' ');
    var words = tagline.lines
      .map(function (line) {
        return line
          .split(/\s+/)
          .filter(Boolean)
          .map(function (word) {
            return '<span class="tagline-word" data-word>' + esc(word) + '</span>';
          })
          .join(' ');
      })
      .join(' ');

    return (
      '<section class="reveal py-16 sm:py-24" id="approach" aria-labelledby="tagline-title" data-reveal>' +
      '<div class="container-page">' +
      '<h2 id="tagline-title" class="sr-only">' +
      esc(tagline.label) +
      '</h2>' +
      '<p class="max-w-content text-balance text-4xl font-semibold" aria-label="' +
      esc(plain) +
      '">' +
      words +
      '</p>' +
      '</div>' +
      '</section>'
    );
  }

  function renderAbout() {
    var about = state.site.about;
    var facts = about.facts
      .map(function (fact, index) {
        return (
          '<li class="card-reveal flex gap-4 rounded-2xl border border-line bg-surface p-6" style="--i:' +
          index +
          '">' +
          '<span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-paper">' +
          icon(fact.icon, 'h-5 w-5') +
          '</span>' +
          '<div>' +
          '<h3 class="text-base font-semibold">' +
          esc(fact.title) +
          '</h3>' +
          '<p class="mt-2 text-sm text-muted">' +
          esc(fact.text) +
          '</p>' +
          '</div>' +
          '</li>'
        );
      })
      .join('');

    return (
      '<section class="reveal scroll-mt-24 py-16 sm:py-24" id="about" aria-labelledby="about-title" data-reveal>' +
      '<div class="container-page grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">' +
      '<div>' +
      '<p class="eyebrow">' +
      esc(about.eyebrow) +
      '</p>' +
      '<h2 id="about-title" class="mt-4 text-3xl font-semibold sm:text-4xl">' +
      esc(about.title) +
      '</h2>' +
      '<p class="mt-6 text-base text-muted sm:text-lg">' +
      esc(about.text) +
      '</p>' +
      '</div>' +
      '<ul class="grid gap-4">' +
      facts +
      '</ul>' +
      '</div>' +
      '</section>'
    );
  }

  function contactLink(options) {
    var attrs = options.external ? ' target="_blank" rel="noopener noreferrer"' : '';
    return (
      '<a class="contact-link" href="' +
      esc(options.href) +
      '"' +
      attrs +
      '>' +
      '<span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface text-paper">' +
      icon(options.icon, 'h-5 w-5') +
      '</span>' +
      '<span class="min-w-0 flex-1">' +
      '<span class="block text-xs text-muted">' +
      esc(options.label) +
      '</span>' +
      '<span class="block break-all text-base font-semibold">' +
      esc(options.value) +
      '</span>' +
      '</span>' +
      icon('arrow-up-right', 'h-4 w-4 text-muted') +
      '</a>'
    );
  }

  function renderContacts() {
    var contacts = state.site.contacts;
    var links = '';

    if (contacts.email && !isTodo(contacts.email)) {
      links += contactLink({
        href: 'mailto:' + contacts.email,
        icon: 'envelope-simple',
        label: contacts.labels.email,
        value: contacts.email,
        external: false
      });
    }

    if (contacts.telegram && !isTodo(contacts.telegram)) {
      links += contactLink({
        href: contacts.telegram,
        icon: 'telegram-logo',
        label: contacts.labels.telegram,
        value: contacts.telegram.replace(/^https?:\/\/(t\.me\/)?/, '@'),
        external: true
      });
    }

    return (
      '<section class="reveal scroll-mt-24 pb-16 pt-16 sm:pb-24 sm:pt-24" id="contacts" aria-labelledby="contacts-title" data-reveal>' +
      '<div class="container-page">' +
      '<div class="rounded-2xl border border-line bg-surface p-6 sm:p-8">' +
      '<div class="grid gap-8 lg:grid-cols-2 lg:items-center lg:gap-16">' +
      '<div>' +
      '<p class="eyebrow">' +
      esc(contacts.eyebrow) +
      '</p>' +
      '<h2 id="contacts-title" class="mt-4 text-3xl font-semibold sm:text-4xl">' +
      esc(contacts.title) +
      '</h2>' +
      '<p class="mt-4 text-base text-muted">' +
      esc(contacts.text) +
      '</p>' +
      '</div>' +
      '<div class="flex flex-col gap-3">' +
      links +
      '</div>' +
      '</div>' +
      '</div>' +
      '</div>' +
      '</section>'
    );
  }

  function renderHome() {
    var main = $('#main');
    if (!main) {
      return;
    }
    main.innerHTML =
      renderHero() + renderProjects() + renderTagline() + renderAbout() + renderContacts();
  }

  function renderPrivacy() {
    var privacy = state.site.privacy;
    var sections = privacy.sections
      .map(function (section) {
        return (
          '<section>' +
          '<h2 class="text-xl font-semibold">' +
          esc(section.title) +
          '</h2>' +
          '<p class="mt-3 text-base text-muted">' +
          esc(section.text) +
          '</p>' +
          '</section>'
        );
      })
      .join('');

    $('#main').innerHTML =
      '<section class="pb-24 pt-24">' +
      '<div class="container-page">' +
      '<article class="max-w-content">' +
      '<p class="eyebrow">' +
      esc(privacy.eyebrow) +
      '</p>' +
      '<h1 class="mt-4 text-4xl font-semibold sm:text-5xl">' +
      esc(privacy.title) +
      '</h1>' +
      '<p class="mt-4 text-sm text-muted">' +
      esc(privacy.updated) +
      '</p>' +
      '<div class="mt-12 space-y-8">' +
      sections +
      '</div>' +
      '<a class="btn btn-secondary mt-12" href="index.html">' +
      esc(privacy.backLabel) +
      '</a>' +
      '</article>' +
      '</div>' +
      '</section>';
  }

  function renderNotFound() {
    var notFound = state.site.notFound;
    $('#main').innerHTML =
      '<section class="pb-24 pt-24">' +
      '<div class="container-page">' +
      '<div class="max-w-content">' +
      '<p class="eyebrow">' +
      esc(notFound.eyebrow) +
      '</p>' +
      '<p class="mt-6 text-7xl font-semibold text-line" aria-hidden="true">' +
      esc(notFound.code) +
      '</p>' +
      '<h1 class="mt-4 text-4xl font-semibold sm:text-5xl">' +
      esc(notFound.title) +
      '</h1>' +
      '<p class="mt-4 text-lg text-muted">' +
      esc(notFound.text) +
      '</p>' +
      '<a class="btn btn-primary mt-8" href="' +
      esc(notFound.cta.href) +
      '">' +
      esc(notFound.cta.label) +
      icon('arrow-right', 'h-5 w-5') +
      '</a>' +
      '</div>' +
      '</div>' +
      '</section>';
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

  function renderJsonLd() {
    var graph = [
      {
        '@type': 'Person',
        name: state.site.name,
        url: state.site.url,
        jobTitle: state.site.role,
        description: state.site.meta.description
      }
    ];

    visibleProjects('app').forEach(function (project) {
      var links = (project.links || []).map(function (link) {
        return link.url;
      });
      graph.push({
        '@type': 'MobileApplication',
        name: project.title,
        description: project.description,
        operatingSystem: 'Android',
        applicationCategory: 'EducationalApplication',
        image: absolute(project.icon),
        url: links[0],
        installUrl: links
      });
    });

    var script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': graph
    });
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

    menu.inert = true;

    function openMenu() {
      if (isOpen) {
        return;
      }
      isOpen = true;
      toggle.classList.add('is-open');
      toggle.setAttribute('aria-expanded', 'true');
      toggle.setAttribute('aria-label', state.site.nav.closeMenu);
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
      toggle.setAttribute('aria-label', state.site.nav.openMenu);
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

  function setupInteractions(page) {
    setupReveals();
    setupHero();

    if (page === 'home') {
      setupNav();
      setupMenu();
      setupTagline();
    }
  }

  function init() {
    var page = document.body.getAttribute('data-page') || 'home';

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
        renderHeader(page);
        renderFooter(page);

        if (page === 'home') {
          renderMenu();
          renderHome();
          renderJsonLd();
        } else if (page === 'privacy') {
          renderPrivacy();
        } else {
          renderNotFound();
        }

        setupInteractions(page);
      })
      .catch(function () {
        renderError();
      });
  }

  init();
})();






