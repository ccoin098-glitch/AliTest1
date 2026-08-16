// --- Language layer -------------------------------------------------------
	// GTranslate serves the language sub-domains through a proxy, so the WP origin
	// only ever sees the apex host and can't vary anything by language server-side.
	// Detect the language on the client (from <html lang>, which GTranslate sets,
	// then the URL sub-domain) and apply it where it matters.
	const heatuupI18n = {
		langs: ["en","nl","fr","de","it","es"],
		base:  "en",
		wa:    {"en":"https:\/\/wa.me\/41762890618","nl":"https:\/\/wa.me\/31644388599","fr":"https:\/\/wa.me\/32471715471","de":"https:\/\/wa.me\/41762890618","it":"https:\/\/wa.me\/41762890618","es":"https:\/\/wa.me\/41762890618"}	};
	function heatuupDetectLang() {
		const htmlLang = ( document.documentElement.lang || '' ).slice( 0, 2 ).toLowerCase();
		if ( heatuupI18n.langs.indexOf( htmlLang ) !== -1 ) return htmlLang;
		const sub = location.hostname.split( '.' )[0].toLowerCase();
		if ( heatuupI18n.langs.indexOf( sub ) !== -1 ) return sub;
		return heatuupI18n.base;
	}
	const heatuupLang = heatuupDetectLang();

	// Apply the language. Run on DOMContentLoaded because the WhatsApp buttons
	// sit further down the page than this script.
	const heatuupApplyLang = () => {
		// WhatsApp buttons → the number for the active language.
		const waLink = heatuupI18n.wa[ heatuupLang ] || heatuupI18n.wa[ heatuupI18n.base ];
		if ( waLink && waLink !== '#' ) {
			document.querySelectorAll( '.sticky-cta-wa, .wa-popup-btn, .wa-float' ).forEach( ( a ) => {
				a.setAttribute( 'href', waLink );
			} );
		}
		// Newsletter hidden lang field → active language (server sees apex on the proxy).
		document.querySelectorAll( '[data-newsletter] input[name="lang"]' ).forEach( ( i ) => {
			i.value = heatuupLang;
		} );
		// Gravity Forms: any field given the CSS class "heatuup-lang" (add it to the
		// form's hidden language field) gets the active language for notification routing.
		document.querySelectorAll( '.heatuup-lang input, input.heatuup-lang' ).forEach( ( i ) => {
			i.value = heatuupLang;
		} );
	};
	if ( document.readyState === 'loading' ) {
		document.addEventListener( 'DOMContentLoaded', heatuupApplyLang );
	} else {
		heatuupApplyLang();
	}
	// Re-apply after Gravity Forms (re-)renders its form via AJAX (e.g. validation).
	if ( window.jQuery ) {
		window.jQuery( document ).on( 'gform_post_render', heatuupApplyLang );
	}

	// In-page anchor links with reflow correction. On the GTranslate sub-domains
	// the translated (longer) text changes section heights after the click, so a
	// single smooth-scroll lands short (you'd land on an earlier section and have
	// to click again). Re-run the scroll a few times until the layout settles.
	const heatuupScrollToHash = ( hash ) => {
		const target = ( hash && hash.length > 1 ) ? document.querySelector( hash ) : null;
		if ( ! target ) return;
		[ 0, 250, 550, 900, 1300 ].forEach( ( delay ) => {
			setTimeout( () => target.scrollIntoView( { behavior: 'smooth', block: 'start' } ), delay );
		} );
	};
	document.addEventListener( 'click', ( e ) => {
		const a = e.target.closest && e.target.closest( 'a[href^="#"]' );
		if ( ! a ) return;
		const hash = a.getAttribute( 'href' );
		if ( ! hash || hash.length < 2 || ! document.querySelector( hash ) ) return; // ignore bare "#" (logo, gt-links)
		e.preventDefault();
		closeMobileMenu();
		heatuupScrollToHash( hash );
	} );

	// Nav scroll
	const navbar = document.getElementById( 'navbar' );
	window.addEventListener( 'scroll', () => {
		navbar.classList.toggle( 'scrolled', window.scrollY > 50 );
	}, { passive: true } );

	// Mobile menu
	const hamburger = document.getElementById( 'hamburger' );
	const mobileMenu = document.getElementById( 'mobileMenu' );
	const mobileClose = document.getElementById( 'mobileClose' );

	window.closeMobileMenu = function closeMobileMenu() {
		mobileMenu.classList.remove( 'open' );
		document.body.style.overflow = '';
	};

	hamburger.addEventListener( 'click', () => {
		mobileMenu.classList.add( 'open' );
		document.body.style.overflow = 'hidden';
	} );

	mobileClose.addEventListener( 'click', closeMobileMenu );

	document.addEventListener( 'keydown', ( e ) => {
		if ( e.key === 'Escape' ) {
			closeMobileMenu();
		}
	} );

	// Language dropdown (desktop nav)
	const langDropdown = document.querySelector( '[data-lang-dropdown]' );
	if ( langDropdown ) {
		const langToggle = langDropdown.querySelector( '.lang-dropdown__toggle' );
		const langCurrent = langDropdown.querySelector( '.lang-dropdown__current' );

		langToggle.addEventListener( 'click', ( e ) => {
			e.stopPropagation();
			const open = langDropdown.classList.toggle( 'open' );
			langToggle.setAttribute( 'aria-expanded', open ? 'true' : 'false' );
		} );

		// Close on outside click or Escape.
		document.addEventListener( 'click', () => {
			langDropdown.classList.remove( 'open' );
			langToggle.setAttribute( 'aria-expanded', 'false' );
		} );
		document.addEventListener( 'keydown', ( e ) => {
			if ( e.key === 'Escape' ) {
				langDropdown.classList.remove( 'open' );
				langToggle.setAttribute( 'aria-expanded', 'false' );
			}
		} );

		// Reflect the active language in the toggle + highlight its menu link
		// (shared client-side detection — see the language layer above).
		const syncLang = () => {
			const cur = heatuupDetectLang();
			if ( langCurrent ) {
				langCurrent.textContent = cur.toUpperCase();
			}
			langDropdown.querySelectorAll( '.lang-dropdown__menu a' ).forEach( ( a ) => {
				a.classList.toggle( 'is-current', a.getAttribute( 'data-gt-lang' ) === cur );
			} );
		};
		syncLang();
		setTimeout( syncLang, 1500 );
	}

	// Newsletter signup (local clone)
	const newsletter = document.querySelector( '[data-newsletter]' );
	if ( newsletter ) {
		const nlMsg = newsletter.querySelector( '.footer-newsletter__msg' );

		newsletter.addEventListener( 'submit', ( e ) => {
			e.preventDefault();
			if ( nlMsg ) {
				nlMsg.className = 'footer-newsletter__msg is-success';
				nlMsg.textContent = 'Bedankt voor uw aanmelding!';
			}
			newsletter.reset();
		} );
	}

	// Scroll animations
	const observer = new IntersectionObserver( ( entries ) => {
		entries.forEach( entry => {
			if ( entry.isIntersecting ) {
				entry.target.classList.add( 'in-view' );
				observer.unobserve( entry.target );
			}
		} );
	}, {
		threshold: 0.08,
		rootMargin: '0px 0px -40px 0px'
	} );

	document.querySelectorAll( '.fade-up' ).forEach( el => observer.observe( el ) );

	// Hero elements on load
	document.addEventListener( 'DOMContentLoaded', () => {
		document.querySelectorAll( '.hero .fade-up' ).forEach( ( el, i ) => {
			setTimeout( () => el.classList.add( 'in-view' ), 100 + i * 80 );
		} );
	} );

	// Contact form submission is handled by Gravity Forms (see #contact section).

	// ---- Mobile carousels: swipe hint + progress bar + dots + counter ----
	function initCarousels() {
		if ( window.innerWidth > 860 ) {
			return;
		}

		const carousels = [
			{
				el: document.querySelector( '.features-grid' ),
				count: 6
			},
			{
				el: document.querySelector( '.testimonials-grid' ),
				count: 3
			},
			{
				el: document.querySelector( '.collections-grid' ),
				count: 2
			},
		];

		carousels.forEach( ( {
								 el,
								 count
							 } ) => {
			if ( ! el ) {
				return;
			}

			// Swipe hint boven de carousel
			const hint = document.createElement( 'div' );
			hint.className = 'swipe-hint';
			hint.innerHTML = `<span class="swipe-hint-arrows"><span class="swipe-hint-arrow-l"><svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M7 1L3 5l4 4" stroke="#9A9188" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg></span><span class="swipe-hint-arrow-r"><svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M3 1l4 4-4 4" stroke="#9A9188" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg></span></span>Swipe`;
			el.parentElement.insertBefore( hint, el );

			// Progress bar
			const progressWrap = document.createElement( 'div' );
			progressWrap.className = 'carousel-progress-wrap';
			const progressBar = document.createElement( 'div' );
			progressBar.className = 'carousel-progress-bar';
			progressBar.style.width = ( 1 / count * 100 ) + '%';
			progressWrap.appendChild( progressBar );

			// Footer: dots links + teller rechts
			const footer = document.createElement( 'div' );
			footer.className = 'carousel-footer';

			const dotsEl = document.createElement( 'div' );
			dotsEl.className = 'carousel-dots';

			const counter = document.createElement( 'div' );
			counter.className = 'carousel-counter';
			counter.innerHTML = `<span>1</span> / ${ count }`;

			const dots = Array.from( { length: count }, ( _, i ) => {
				const d = document.createElement( 'div' );
				d.className = 'carousel-dot' + ( i === 0 ? ' active' : '' );
				d.addEventListener( 'click', () => {
					const cards = el.children;
					if ( cards[ i ] ) {
						cards[ i ].scrollIntoView( {
							behavior: 'smooth',
							block: 'nearest',
							inline: 'start'
						} );
					}
				} );
				dotsEl.appendChild( d );
				return d;
			} );

			footer.appendChild( dotsEl );
			footer.appendChild( counter );

			el.after( progressWrap );
			progressWrap.after( footer );

			// Update alles on scroll
			el.addEventListener( 'scroll', () => {
				const scrollLeft = el.scrollLeft;
				const cardWidth = el.firstElementChild?.offsetWidth || 1;
				const gap = 12;
				const active = Math.round( scrollLeft / ( cardWidth + gap ) );
				const clamped = Math.min( Math.max( active, 0 ), count - 1 );

				dots.forEach( ( d, i ) => d.classList.toggle( 'active', i === clamped ) );
				counter.innerHTML = `<span>${ clamped + 1 }</span> / ${ count }`;

				const progress = ( scrollLeft / ( el.scrollWidth - el.clientWidth ) ) * 100;
				progressBar.style.width = Math.max( progress, ( 1 / count * 100 ) ) + '%';
			}, { passive: true } );
		} );
	}

	if ( document.readyState === 'loading' ) {
		document.addEventListener( 'DOMContentLoaded', initCarousels );
	} else {
		initCarousels();
	}

	/* ROI Calculator */
	( function () {
		const seats = document.getElementById( 'roi-seats' );
		const weeks = document.getElementById( 'roi-weeks' );
		const spend = document.getElementById( 'roi-spend' );
		if ( ! seats ) {
			return;
		}

		function fmt( n ) {
			return '€' + n.toLocaleString( 'en-NL' );
		}

		function calc() {
			const s = parseInt( seats.value );
			const w = parseInt( weeks.value );
			const p = parseInt( spend.value );

			document.getElementById( 'roi-seats-val' ).textContent = s;
			document.getElementById( 'roi-weeks-val' ).textContent = w + ' wk';
			document.getElementById( 'roi-spend-val' ).textContent = '€' + p;

			const revenue = Math.round( s * 1.5 * w * 5 * p );
			const cost = Math.round( s * ( 50 + 60 ) );
			const net = revenue - cost;

			document.getElementById( 'roi-revenue' ).textContent = fmt( revenue );
			document.getElementById( 'roi-cost' ).textContent = fmt( cost );
			document.getElementById( 'roi-net' ).textContent = net >= 0 ? fmt( net ) : '-' + fmt( Math.abs( net ) );
		}

		[ seats, weeks, spend ].forEach( el => el.addEventListener( 'input', calc ) );
		calc();
	} )();

	/* FAQ Accordion */
	document.querySelectorAll( '.faq-q' ).forEach( q => {
		q.addEventListener( 'click', () => {
			const item = q.closest( '.faq-item' );
			const isOpen = item.classList.contains( 'open' );
			document.querySelectorAll( '.faq-item.open' ).forEach( i => i.classList.remove( 'open' ) );
			if ( ! isOpen ) {
				item.classList.add( 'open' );
			}
		} );
	} );

	/* Exit-intent popup */
	( function () {
		var overlay = document.getElementById( 'exit-overlay' );
		var closeBtn = document.getElementById( 'exit-modal-close' );
		var submitBtn = document.getElementById( 'exit-submit' );
		if ( ! overlay ) {
			return;
		}
		if ( sessionStorage.getItem( 'exit-popup-shown' ) ) {
			return;
		}

		var shown = false;

		function show() {
			if ( shown ) {
				return;
			}
			shown = true;
			sessionStorage.setItem( 'exit-popup-shown', '1' );
			overlay.classList.add( 'visible' );
		}

		function hide() {
			overlay.classList.remove( 'visible' );
		}

		// Desktop: muis verlaat viewport via bovenkant
		document.addEventListener( 'mouseleave', function ( e ) {
			if ( e.clientY < 10 ) {
				show();
			}
		} );

		// Mobile: visibility change (tab wisselen / home-knop)
		document.addEventListener( 'visibilitychange', function () {
			if ( document.visibilityState === 'hidden' ) {
				show();
			}
		} );

		closeBtn.addEventListener( 'click', hide );
		overlay.addEventListener( 'click', function ( e ) {
			if ( e.target === overlay ) {
				hide();
			}
		} );

		// CTA links to the real Gravity Form at #contact; just close the modal.
		if ( submitBtn ) {
			submitBtn.addEventListener( 'click', hide );
		}
	} )();

	/* Sticky mobile CTA */
	( function () {
		var cta = document.getElementById( 'sticky-cta' );
		if ( ! cta ) {
			return;
		}
		var shown = false;
		window.addEventListener( 'scroll', function () {
			if ( window.scrollY > 300 && ! shown ) {
				cta.classList.add( 'visible' );
				document.body.classList.add( 'sticky-cta-open' );
				shown = true;
			} else if ( window.scrollY <= 100 && shown ) {
				cta.classList.remove( 'visible' );
				document.body.classList.remove( 'sticky-cta-open' );
				shown = false;
			}
		}, { passive: true } );
	} )();

	/* WhatsApp popup — verschijnt na 8 seconden */
	( function () {
		var popup = document.getElementById( 'wa-popup' );
		var closeBtn = document.getElementById( 'wa-popup-close' );
		if ( ! popup || ! closeBtn ) {
			return;
		}
		if ( sessionStorage.getItem( 'wa-popup-closed' ) ) {
			return;
		}

		setTimeout( function () {
			popup.classList.add( 'visible' );
		}, 8000 );

		closeBtn.addEventListener( 'click', function () {
			popup.classList.remove( 'visible' );
			sessionStorage.setItem( 'wa-popup-closed', '1' );
		} );
	} )();

	/* Logo scroll counter — 1:1 van WebAlly header-counter.js */
	( function () {
		var MIN = 16, MAX = 99;
		var anchor = document.querySelector( '.logo-mark' );
		if ( ! anchor ) {
			return;
		}

		var counter = document.createElement( 'span' );
		counter.className = 'logo-counter';
		counter.setAttribute( 'aria-hidden', 'true' );
		counter.textContent = String( MIN );
		anchor.appendChild( counter );

		var ticking = false;

		function update() {
			ticking = false;
			var doc = document.documentElement;
			var range = ( doc.scrollHeight || 0 ) - window.innerHeight;
			if ( range <= 0 ) {
				counter.textContent = String( MIN );
				return;
			}
			var progress = Math.min( Math.max( window.scrollY / range, 0 ), 1 );
			counter.textContent = String( Math.round( MIN + progress * ( MAX - MIN ) ) );
		}

		function onScroll() {
			if ( ticking ) {
				return;
			}
			ticking = true;
			window.requestAnimationFrame( update );
		}

		update();
		window.addEventListener( 'scroll', onScroll, { passive: true } );
		window.addEventListener( 'resize', onScroll );
	} )();
