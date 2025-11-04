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




    (function initInPageOverlay() {
      const modal = document.getElementById('myModal');
      if (!modal) return;
      const sourceImg = modal.querySelector('img');
      const src = sourceImg && sourceImg.src;
      if (!src) return;

      const fallback = document.getElementById('imageFallback');
      const fallbackOpen = fallback && fallback.querySelector('.imageFallbackOpen');
      const fallbackClose = fallback && fallback.querySelector('.imageFallbackClose');

      const ensureStyles = () => {
        if (document.getElementById('siteImageOverlayStyles')) return;
        const s = document.createElement('style');
        s.id = 'siteImageOverlayStyles';
        s.textContent = `
          /* Overlay (in-page) */
          #siteImageOverlay { position:fixed; inset:0; display:flex; align-items:center; justify-content:center;
                              z-index:2147483647; -webkit-tap-highlight-color:transparent; }
          #siteImageOverlay .backdrop { position:absolute; inset:0; background:rgba(0,0,0,0.75); backdrop-filter: blur(2px);
                                       animation: overlayIn .22s ease forwards; }
          #siteImageOverlay .panel { position:relative; z-index:2; max-width:92vw; max-height:92vh; width:auto;
                                     border-radius:12px; box-shadow: 0 20px 40px rgba(0,0,0,0.35);
                                     background: transparent; display:flex; align-items:center; justify-content:center;
                                     animation: panelPop .26s cubic-bezier(.2,.8,.2,1) forwards; }
          /* IMPORTANT: align-items:flex-start -> évite que l'image trop haute soit centrée et coupée */
          #siteImageOverlay .panel .content { max-height:90vh; max-width:100%; overflow:auto; -webkit-overflow-scrolling:touch;
                                              display:flex; align-items:flex-start; justify-content:center; padding: 1rem 0.5rem; }
          #siteImageOverlay img { display:block; max-width:100%; height:auto; user-select:none; -webkit-user-drag:none; }
          #siteImageOverlay .close { position:absolute; top:10px; right:10px; z-index:3; background:rgba(0,0,0,0.4);
                                     border:0; color:#fff; font-size:22px; line-height:1; padding:6px 10px; border-radius:8px;
                                     cursor:pointer; }
          #siteImageOverlay .close:focus { outline:2px solid rgba(255,255,255,0.14); }
          @keyframes overlayIn { from { opacity:0 } to { opacity:1 } }
          @keyframes overlayOut { from { opacity:1 } to { opacity:0 } }
          @keyframes panelPop { from { opacity:0; transform:scale(.98) } to { opacity:1; transform:scale(1) } }
        `;
        document.head.appendChild(s);
      };

      let overlayEl = null;

      const createOverlay = (imageSrc) => {
        ensureStyles();
        if (document.getElementById('siteImageOverlay')) return document.getElementById('siteImageOverlay');

        const ov = document.createElement('div');
        ov.id = 'siteImageOverlay';
        ov.innerHTML = `
          <div class="backdrop" data-role="backdrop"></div>
          <div class="panel" role="dialog" aria-modal="true" aria-label="Image agrandie">
            <button class="close" aria-label="Fermer la vue agrandie">×</button>
            <div class="content">
              <img src="${imageSrc.replace(/"/g, '&quot;')}" alt="">
            </div>
          </div>
        `;

        const backdrop = ov.querySelector('.backdrop');
        const closeBtn = ov.querySelector('.close');
        const panel = ov.querySelector('.panel');
        const content = ov.querySelector('.content');
        const imageNode = ov.querySelector('img');

        // Close only when clicking the backdrop or close button (not when interacting with the image)
        backdrop.addEventListener('click', closeOverlay);
        closeBtn.addEventListener('click', (e) => { e.stopPropagation(); closeOverlay(); });

        // Allow scrolling / panning inside .content on mobile without closing
        // Do not attach click-to-close on the image so scrolling/pinch won't close.
        // Prevent accidental backdrop click when user starts a drag from the image area:
        let touchMoved = false;
        imageNode.addEventListener('touchstart', () => { touchMoved = false; }, { passive: true });
        imageNode.addEventListener('touchmove', () => { touchMoved = true; }, { passive: true });
        imageNode.addEventListener('click', (e) => {
          // treat taps (no movement) as no-op (image won't close). This keeps behavior consistent.
          if (touchMoved) e.preventDefault();
        });

        // ESC to close
        const onKey = (e) => { if (e.key === 'Escape') closeOverlay(); };
        ov._onKey = onKey;

        document.body.appendChild(ov);
        document.body.style.overflow = 'hidden'; // lock background scroll
        document.addEventListener('keydown', onKey, { passive: true });

        // accessibility: focus the close button
        try { closeBtn.focus(); } catch (e) { /* noop */ }

        overlayEl = ov;
        return ov;
      };

      const closeOverlay = () => {
        const ov = overlayEl || document.getElementById('siteImageOverlay');
        if (!ov) return;
        const backdrop = ov.querySelector('.backdrop');
        const panel = ov.querySelector('.panel');

        // play fade-out
        if (backdrop) backdrop.style.animation = 'overlayOut .18s ease forwards';
        if (panel) { panel.style.transition = 'opacity .16s ease, transform .16s ease'; panel.style.opacity = '0'; panel.style.transform = 'scale(.98)'; }

        setTimeout(() => {
          try {
            if (ov._onKey) document.removeEventListener('keydown', ov._onKey);
            ov.remove();
          } catch (e) { /* noop */ }
          if (document.body) document.body.style.overflow = '';
          overlayEl = null;
        }, 220);
      };

      // open automatically on load (short delay)
      setTimeout(() => {
        createOverlay(src);
      }, 300);

      // fallback handlers: allow manual open if auto-open suppressed or removed
      if (fallbackOpen) {
        fallbackOpen.addEventListener('click', (e) => {
          e.preventDefault();
          createOverlay(src);
          if (fallback && fallback.classList.contains('is-open')) {
            // ferme le fallback si ouvert
            fallback.classList.remove('is-open');
            fallback.style.display = 'none';
          }
        });
      }
      if (fallbackClose) {
        fallbackClose.addEventListener('click', (e) => {
          e.preventDefault();
          if (fallback && fallback.classList.contains('is-open')) {
            fallback.classList.remove('is-open');
            fallback.style.display = 'none';
          }
        });
      }
    })();


    /* ----------------------------------------------------------------
      REMPLACEMENT : overlay IN-PAGE UNIQUEMENT (masque #myModal)
      - Supprime toute logique de pop-up / window.open
      - Affiche un overlay centré responsive avec l'image
      - Permet scroll/pan sur mobile sans fermer l'overlay
      - Ferme sur backdrop / bouton close / Esc
    ---------------------------------------------------------------- */
    (function initSiteImageOverlayOnly() {
      const modal = document.getElementById('myModal');
      if (!modal) return;
      const srcImgEl = modal.querySelector('img');
      const src = srcImgEl && srcImgEl.src;
      if (!src) return;

      // S'assure que l'élément source n'est pas visible dans la page
      try {
        modal.setAttribute('aria-hidden', 'true');
        modal.style.display = 'none';
      } catch (e) { /* noop */ }

      const ensureStyles = () => {
        if (document.getElementById('siteImageOverlayStyles')) return;
        const s = document.createElement('style');
        s.id = 'siteImageOverlayStyles';
        s.textContent = `
          /* Overlay (in-page) */
          #siteImageOverlay { position:fixed; inset:0; display:flex; align-items:center; justify-content:center;
                              z-index:2147483647; -webkit-tap-highlight-color:transparent; }
          #siteImageOverlay .backdrop { position:absolute; inset:0; background:rgba(0,0,0,0.78); backdrop-filter: blur(3px);
                                       animation: overlayIn .22s ease forwards; }
          #siteImageOverlay .panel { position:relative; z-index:2; width:auto; max-width:94vw; max-height:94vh;
                                     border-radius:10px; overflow:hidden; display:flex; align-items:center; justify-content:center;
                                     background:transparent; box-shadow: 0 20px 40px rgba(0,0,0,0.36);
                                     animation: panelPop .26s cubic-bezier(.2,.8,.2,1) forwards; }
          #siteImageOverlay .panel .content { max-height:92vh; max-width:92vw; overflow:auto; -webkit-overflow-scrolling:touch;
                                              display:flex; align-items:center; justify-content:center; padding: 0.75rem; }
          #siteImageOverlay img { display:block; max-width:100%; height:auto; user-select:none; -webkit-user-drag:none; }
          #siteImageOverlay .close { position:absolute; top:10px; right:10px; z-index:3; background:rgba(0,0,0,0.45);
                                     border:0; color:#fff; font-size:22px; line-height:1; padding:6px 10px; border-radius:8px;
                                     cursor:pointer; }
          #siteImageOverlay .close:focus { outline:2px solid rgba(255,255,255,0.14); }
          @keyframes overlayIn { from { opacity:0 } to { opacity:1 } }
          @keyframes overlayOut { from { opacity:1 } to { opacity:0 } }
          @keyframes panelPop { from { opacity:0; transform:scale(.98) } to { opacity:1; transform:scale(1) } }

          /* Mobile tweaks: allow image to take most of height and be scrollable */
          @media (max-width: 720px) {
            #siteImageOverlay .panel { max-width:98vw; max-height:98vh; border-radius:6px; }
            #siteImageOverlay .panel .content { padding: 0.5rem; }
          }
        `;
        document.head.appendChild(s);
      };

      let overlayEl = null;

      const createOverlay = (imageSrc) => {
        ensureStyles();
        if (document.getElementById('siteImageOverlay')) return document.getElementById('siteImageOverlay');

        const ov = document.createElement('div');
        ov.id = 'siteImageOverlay';
        ov.innerHTML = `
          <div class="backdrop" data-role="backdrop" aria-hidden="true"></div>
          <div class="panel" role="dialog" aria-modal="true" aria-label="Image agrandie">
            <button class="close" aria-label="Fermer la vue agrandie">×</button>
            <div class="content">
              <img src="${imageSrc.replace(/"/g, '&quot;')}" alt="">
            </div>
          </div>
        `;

        const backdrop = ov.querySelector('.backdrop');
        const closeBtn = ov.querySelector('.close');
        const panel = ov.querySelector('.panel');
        const content = ov.querySelector('.content');
        const imageNode = ov.querySelector('img');

        // Clic sur le backdrop ferme
        backdrop.addEventListener('click', closeOverlay);
        // Clic sur la croix ferme
        closeBtn.addEventListener('click', (e) => { e.stopPropagation(); closeOverlay(); });

        // Ne PAS fermer au clic sur l'image - pour permettre le scroll/pinch/zoom.
        // Pour éviter fermeture accidentelle quand l'utilisateur glisse, on n'attache pas click-close sur l'image.
        // Mais si tu veux fermer au simple tap, on peut l'ajouter conditionnellement.
        // Configuration: touches -> si movement important, ne pas traiter comme tap.
        let touchMoved = false;
        imageNode.addEventListener('touchstart', () => { touchMoved = false; }, { passive: true });
        imageNode.addEventListener('touchmove', () => { touchMoved = true; }, { passive: true });
        imageNode.addEventListener('click', (e) => {
          // aucun comportement de fermeture ici : on garde l'image interactive
          if (touchMoved) e.preventDefault();
        });

        // ESC pour fermer
        const onKey = (e) => { if (e.key === 'Escape') closeOverlay(); };
        ov._onKey = onKey;

        document.body.appendChild(ov);
        // verrouille le scroll page en arrière-plan
        document.body.style.overflow = 'hidden';
        document.addEventListener('keydown', onKey, { passive: true });

        // accessibilité : focus sur close
        try { closeBtn.focus(); } catch (e) { /* noop */ }

        overlayEl = ov;
        return ov;
      };

      const closeOverlay = () => {
        const ov = overlayEl || document.getElementById('siteImageOverlay');
        if (!ov) return;
        const backdrop = ov.querySelector('.backdrop');
        const panel = ov.querySelector('.panel');

        // animation out
        if (backdrop) backdrop.style.animation = 'overlayOut .18s ease forwards';
        if (panel) { panel.style.transition = 'opacity .16s ease, transform .16s ease'; panel.style.opacity = '0'; panel.style.transform = 'scale(.98)'; }

        setTimeout(() => {
          try {
            if (ov._onKey) document.removeEventListener('keydown', ov._onKey);
            ov.remove();
          } catch (e) { /* noop */ }
          if (document.body) document.body.style.overflow = '';
          overlayEl = null;
        }, 220);
      };

      // ouverture automatique (court délai)
      setTimeout(() => {
        createOverlay(src);
      }, 300);

    })();

  });
})();
