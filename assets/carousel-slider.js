if (!customElements.get('carousel-slider')) {
	customElements.define('carousel-slider', class CarouselSlider extends HTMLElement {
		constructor() {
			super();
		}

		connectedCallback() {
			this.carousel = this.querySelector('.grid-carousel');
			this.initialize();
		}

		initialize() {
			// Flickity doesn't work with flex containers, so
			// to avoid flash of unstyled content and page jump, style the container
			// as block just before initialization. On mobile where the carousel
			// is converted to simple scroller we swap this to display: flex !important
			// using CSS.
			this.carousel.style.display = 'block';
			this.flickity = new Flickity(this.carousel, {
				cellAlign: 'left',
				groupCells: true,
				contain: true,
				resize: true,
				draggable: true,
				prevNextButtons: false,
				fade: false,
				cellSelector: '.grid-item',
				initialIndex: 0,
				pageDots: false,
				wrapAround: false,
				accessibility: false,
				watchCSS: true,
			});

			this.flickity.on('change', (index) => {
				publish(PUB_SUB_EVENTS.sliderSlideChange, {
					id: this.getAttribute('id'),
					index,
				});
			});
		}
	});
}

if (!customElements.get('carousel-navigation')) {
	customElements.define('carousel-navigation', class CarouselNavigation extends HTMLElement {
		constructor() {
			super();
		}

		connectedCallback() {
			this.init();
		}

		init(retry = 1, maxRetry = 3) {
			if (retry === maxRetry) {
				return;
			}

			const id = this.getAttribute('for');
			this.carouselComponent = document.querySelector(`#${id}`);

			if ((!this.carouselComponent || !this.carouselComponent.flickity)) {
				setTimeout(() => {
					this.init(retry + 1);
				}, 350);
				return;
			}

			this.flickity = this.carouselComponent.flickity;
			this.buttonPrev = this.querySelector('.js-prev');
			this.buttonNext = this.querySelector('.js-next');

			this.buttonPrev.addEventListener('click', (event) => {
				event.preventDefault();
				this.flickity.previous();
			});

			this.buttonNext.addEventListener('click', (event) => {
				event.preventDefault();
				this.flickity.next();
			});

			this.flickity.on('select', () => {
				this.enableButton(this.buttonPrev);
				this.enableButton(this.buttonNext);

				if (!this.flickity.slides[this.flickity.selectedIndex - 1]) {
					this.disableButton(this.buttonPrev);
				} else if (!this.flickity.slides[this.flickity.selectedIndex + 1]) {
					this.disableButton(this.buttonNext);
				}
			});
		}

		enableButton(button) {
			button.classList.remove('pill-nav-item-disabled');
			button.classList.remove('focus-none');
			button.setAttribute('aria-disabled', 'false');
		}

		disableButton(button) {
			button.classList.add('pill-nav-item-disabled');
			button.classList.add('focus-none');
			button.setAttribute('aria-disabled', 'true');
		}
	});
}
