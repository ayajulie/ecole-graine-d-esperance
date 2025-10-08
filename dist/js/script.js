


(() => {
  'use strict';

  // Utilitaires
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const on = (el, ev, fn, opts) => el && el.addEventListener(ev, fn, opts);
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

  // Lance après que le DOM soit prêt
  on(document, 'DOMContentLoaded', () => {

    /* ----------------------------------------------------------------
       NAVBAR TRANSPARENTE (optimisé: listener passif + init à T0)
    ---------------------------------------------------------------- */
    const navbar = $('#navbar');
    const logo = $('#logo');
    const TOP_THRESHOLD = 500;

    const applyNavbarState = () => {
      const past = window.pageYOffset > TOP_THRESHOLD;
      navbar && navbar.classList.toggle('top', !past);
      if (logo) logo.src = past ? './img/logo-color.png' : './img/logo-white.png';
    };

    on(window, 'scroll', applyNavbarState, { passive: true });
    applyNavbarState(); // état initial

    /* ----------------------------------------------------------------
       SMOOTH SCROLL NATIF (remplace jQuery.animate)
       - supporte .navbar a et .btn pointant vers ancre
    ---------------------------------------------------------------- */
    on(document, 'click', (e) => {
      const link = e.target.closest('.navbar a[href^="#"], .btn[href^="#"]');
      if (!link) return;
      const hash = link.getAttribute('href');
      if (!hash || hash === '#') return;

      const target = document.getElementById(hash.slice(1));
      if (!target) return;

      e.preventDefault();
      const y = target.getBoundingClientRect().top + window.pageYOffset - 100;
      window.scrollTo({ top: y, behavior: 'smooth' });
      history.pushState(null, '', hash); // met à jour l’URL
    });

    /* ----------------------------------------------------------------
       SLIDESHOW (scope local + cache des listes)
    ---------------------------------------------------------------- */
    (function slideshow() {
      const slides = $$('.mySlides');
      const dots = $$('.dot');
      if (!slides.length) return;

      let index = 1;

      const render = () => {
        if (!slides.length) return;
        index = clamp(index, 1, slides.length);
        slides.forEach((s, i) => { s.style.display = (i === index - 1) ? 'block' : 'none'; });
        dots.forEach((d, i) => d.classList.toggle('active', i === index - 1));
      };

      // Expose proprement si les contrôles existent dans le DOM
      const nextBtn = $('[data-slides="next"]');
      const prevBtn = $('[data-slides="prev"]');
      on(nextBtn, 'click', () => { index += 1; if (index > slides.length) index = 1; render(); });
      on(prevBtn, 'click', () => { index -= 1; if (index < 1) index = slides.length; render(); });

      // Dots cliquables
      dots.forEach((dot, i) => on(dot, 'click', () => { index = i + 1; render(); }));

      // Si tu utilises des fonctions globales existantes, ré-expose minimalement :
      window.plusSlides = (n) => { index += Number(n) || 0; if (index > slides.length) index = 1; if (index < 1) index = slides.length; render(); };
      window.currentSlide = (n) => { index = clamp(Number(n) || 1, 1, slides.length); render(); };

      render();
    })();

    /* ----------------------------------------------------------------
       HAMBURGER / NAV MOBILE
    ---------------------------------------------------------------- */
    const hamburger = $('.hamburger');
    const navMenu = $('.nav-menu');
    const navLinks = $$('.nav-link');

    const mobileMenu = () => {
      hamburger.classList.toggle('active');
      navMenu.classList.toggle('active');
    };
    const closeMenu = () => {
      hamburger.classList.remove('active');
      navMenu.classList.remove('active');
    };

    on(hamburger, 'click', mobileMenu);
    navLinks.forEach(a => on(a, 'click', closeMenu));

    /* ----------------------------------------------------------------
       DISPLAY CARDS avec catégories + carte par défaut
       - Clic catégorie => filtre liens + cartes et ouvre une carte par défaut
       - Clic lien => n'affiche que la carte correspondante du groupe actif
       - Toujours 1 carte visible à la fois
    ---------------------------------------------------------------- */
    /* ----------------------------------------------------------------
       DISPLAY CARDS avec catégories + carte par défaut (robuste)
       - Clic catégorie => filtre liens + cartes et ouvre une carte par défaut
       - Clic lien => n'affiche que la carte correspondante du groupe actif
       - Toujours 1 carte visible à la fois
    ---------------------------------------------------------------- */
    (function cardsSwitch() {
      const tabs = Array.from(document.querySelectorAll('.group-tab'));
      const links = Array.from(document.querySelectorAll('.card-link'));
      const cards = Array.from(document.querySelectorAll('.card'));
      if (!tabs.length || !links.length || !cards.length) return;

      let activeGroup = null;
      const selectedByGroup = new Map(); // mémorise la dernière carte ouverte par groupe

      const hardHideAllCards = () => {
        cards.forEach(c => {
          c.classList.remove('is-visible');
          c.style.display = 'none';       // <= inline, pour passer devant un CSS récalcitrant
        });
      };

      const showOnlyCard = (cardId) => {
        hardHideAllCards();
        const card = document.getElementById(cardId);
        if (!card) return;
        card.classList.add('is-visible');
        card.style.display = 'flex';      // adapte à 'block' si besoin
      };

      const activateLink = (link) => {
        links.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
      };

      const filterByGroup = () => {
        // Liens
        links.forEach(l => {
          const match = activeGroup && l.getAttribute('data-group') === activeGroup;
          l.classList.toggle('is-hidden', !match);
          if (!match) l.classList.remove('active');
        });
        // Cartes : rien d'affiché à ce stade
        cards.forEach(c => {
          const match = activeGroup && c.getAttribute('data-group') === activeGroup;
          c.classList.toggle('is-hidden', !match);
          c.classList.remove('is-visible');
          c.style.display = 'none';
        });
      };

      const openDefaultForActiveGroup = () => {
        if (!activeGroup) return;

        // 1) dernière choisie dans ce groupe
        const rememberedId = selectedByGroup.get(activeGroup);
        let linkToOpen = rememberedId
          ? document.querySelector(`.card-link[data-group="${activeGroup}"][data-card="${rememberedId}"]`)
          : null;

        // 2) sinon, un lien marqué data-default
        if (!linkToOpen) {
          linkToOpen = document.querySelector(`.card-link[data-group="${activeGroup}"][data-default]`);
        }

        // 3) sinon, le premier lien du groupe
        if (!linkToOpen) {
          linkToOpen = document.querySelector(`.card-link[data-group="${activeGroup}"]`);
        }

        if (linkToOpen) {
          const id = linkToOpen.getAttribute('data-card');
          activateLink(linkToOpen);
          selectedByGroup.set(activeGroup, id);
          showOnlyCard(id);
        }
      };

      const setActiveTab = (tab) => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        activeGroup = tab.getAttribute('data-group');
        filterByGroup();
        openDefaultForActiveGroup();
      };

      // Clic onglet (catégorie)
      tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
          e.preventDefault();
          setActiveTab(tab);
        });
      });

      // Clic lien (personne)
      links.forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          if (link.getAttribute('data-group') !== activeGroup) return; // ignore si mauvaise catégorie
          const id = link.getAttribute('data-card');
          activateLink(link);
          selectedByGroup.set(activeGroup, id);
          showOnlyCard(id);
        });
      });

      // --- Initialisation ---
      // Active l’onglet .active s’il existe, sinon le 1er onglet (pratique + évite le "rien ne se passe")
      const initialTab = document.querySelector('.group-tab.active') || tabs[0];
      if (initialTab) {
        setActiveTab(initialTab);
      } else {
        // aucun onglet par défaut -> tout masqué
        links.forEach(l => l.classList.add('is-hidden'));
        hardHideAllCards();
      }
    })();


    /* --------------------------------------------------------------
       ACCORDÉON – un seul ouvert + auto-scroll au début de la réponse
    -------------------------------------------------------------- */
    (function initAccordion() {
      // Trouve un conteneur qui contient bien des triggers
      const roots = Array.from(document.querySelectorAll('[data-accordion], .faq'));
      const root = roots.find(r => r.querySelector('.faq__trigger, button[aria-controls], [data-accordion-trigger]'));
      if (!root) { console.warn('[accordion] root introuvable'); return; }

      const triggers = Array.from(root.querySelectorAll('.faq__trigger, button[aria-controls], [data-accordion-trigger]'));
      if (triggers.length === 0) { console.warn('[accordion] aucun trigger trouvé'); return; }

      const hidePanel = (p) => { if (!p) return; p.hidden = true; p.classList.remove('is-open'); p.style.display = 'none'; };
      const showPanel = (p) => { if (!p) return; p.hidden = false; p.classList.add('is-open'); p.style.display = ''; };

      const getPanel = (btn) => document.getElementById(btn.getAttribute('aria-controls'));

      // Offset dynamique pour header fixe
      const getStickyHeaderOffset = () => {
        const nav = document.getElementById('navbar');
        if (!nav) return 0;
        const cs = getComputedStyle(nav);
        if (cs.position === 'fixed' || cs.position === 'sticky') {
          return Math.ceil(nav.getBoundingClientRect().height);
        }
        return 0;
      };

      // Scroll vers le haut du panel en compensant le header
      const scrollToPanelTop = (panel) => {
        if (!panel) return;
        const offset = getStickyHeaderOffset() + 8; // petite marge
        const y = panel.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      };

      // Préparation & vérifs
      triggers.forEach((btn, i) => {
        if (!btn.id) btn.id = `acc-${i}-${Math.random().toString(36).slice(2, 7)}`;
        const panel = getPanel(btn);
        if (!panel) {
          console.warn('[accordion] trigger sans panel correspondant', btn);
          return;
        }
        panel.setAttribute('role', 'region');
        panel.setAttribute('aria-labelledby', btn.id);
        const expanded = btn.getAttribute('aria-expanded') === 'true';
        if (expanded) showPanel(panel); else hidePanel(panel);
      });

      const openOnly = (btn) => {
        triggers.forEach(b => {
          const p = getPanel(b);
          const active = b === btn;
          b.setAttribute('aria-expanded', active ? 'true' : 'false');
          active ? showPanel(p) : hidePanel(p);
        });
      };

      // Clic : ouvre + scroll jusqu’au début du contenu
      root.addEventListener('click', (e) => {
        const btn = e.target.closest('.faq__trigger, button[aria-controls], [data-accordion-trigger]');
        if (!btn || !root.contains(btn)) return;

        const expanded = btn.getAttribute('aria-expanded') === 'true';
        if (expanded) {
          btn.setAttribute('aria-expanded', 'false');
          hidePanel(getPanel(btn));
        } else {
          openOnly(btn);
          const panel = getPanel(btn);
          // attendre le reflow pour garantir la bonne position (surtout mobile)
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              scrollToPanelTop(panel);
            });
          });
        }
      });

      // Navigation clavier (Enter/Espace/↑/↓/Home/End)
      root.addEventListener('keydown', (e) => {
        const list = triggers.filter(b => root.contains(b));
        const idx = list.indexOf(document.activeElement);
        if (idx === -1) return;
        switch (e.key) {
          case 'Enter':
          case ' ':
            e.preventDefault();
            document.activeElement.click();
            break;
          case 'ArrowDown':
            e.preventDefault();
            list[(idx + 1) % list.length].focus();
            break;
          case 'ArrowUp':
            e.preventDefault();
            list[(idx - 1 + list.length) % list.length].focus();
            break;
          case 'Home':
            e.preventDefault();
            list[0].focus();
            break;
          case 'End':
            e.preventDefault();
            list[list.length - 1].focus();
            break;
        }
      });

      // (Optionnel) ouvrir la première question par défaut
      // openOnly(triggers[0]);

      console.log('[accordion] initialisé avec auto-scroll :', { triggers: triggers.length });
    })();


  });
})();
