if (!customElements.get('slideshow-component')) {
	customElements.define('slideshow-component', class SlideshowComponent extends HTMLElement {
		constructor() {
			super();
			this.slideshow = this.querySelector('.slideshow');
			this.progressBar = this.querySelector('.slideshow-progress-bar .progress-bar');
			this.start = null;
			this.progressBarWidth = 0;
			this.paused = false;
			this.startProgressBar = this.startProgressBar.bind(this);
			this.animateProgressBar = this.animateProgressBar.bind(this);
			this.resetProgressBar = this.resetProgressBar.bind(this);
		}

		connectedCallback() {
			const autoplayEnabled = this.getAttribute('data-autoplay') === 'true';
			this.autoPlaySpeed = parseInt(this.getAttribute('data-speed'), 10) * 1000;
			this.autoPlayEnabled = autoplayEnabled && this.autoPlaySpeed > 0 && !Shopify.designMode;
			this.animationType = this.getAttribute('data-animation-type') ?? 'slide';
			this.paused = !this.autoPlayEnabled;

			if (!this.slideshow) {
				return;
			}

			this.slideshow.style.display = 'block';
			this.flickity = new Flickity(this.slideshow, {
				cellAlign: 'left',
				percentPosition: true,
				fullscreen: true,
				contain: true,
				resize: true,
				draggable: true,
				prevNextButtons: false,
				fade: this.animationType === 'fade',
				cellSelector: '.slideshow-slide',
				initialIndex: 0,
				pageDots: false,
				wrapAround: true,
				accessibility: false,
				on: {
					ready: () => {
						if (this.autoPlayEnabled) {
							this.startProgressBar();
						}

						setTimeout(() => {
							this.preloadSlide(1);
						}, 3000);
					},
					change: (index) => {
						if (this.autoPlayEnabled) {
							this.resetProgressBar();
						}

						this.preloadSlide(index + 1);
					}
				},
			});

			if (this.autoPlayEnabled) {
				this.slideshow.addEventListener('mouseenter', () => {
					this.paused = true;
				});

				this.slideshow.addEventListener('mouseleave', () => {
					this.paused = false;
					this.start = performance.now() - (this.progressBarWidth / 100) * this.autoPlaySpeed;
					window.requestAnimationFrame(this.animateProgressBar.bind(this));
				});
			}

			this.flickity.on('change', (index) => {
				publish(PUB_SUB_EVENTS.slideshowSlideChange, {
					id: this.getAttribute('id'),
					index,
				});
			});
		}

		preloadSlide(index) {
			const slide = this.querySelectorAll('.slideshow-slide')[index];

			if (slide) {
				const media = slide.querySelector('.slideshow-media');
				media.style.display = 'block';

				const images = slide.querySelectorAll('img');
				[...images].forEach(image => {
					image.loading = '';
				});
			}
		}

		startProgressBar() {
			this.paused = false;
			this.start = performance.now();
			window.requestAnimationFrame(this.animateProgressBar);
		}

		resetProgressBar() {
			this.progressBarWidth = 0;
			this.progressBar.style.width = '0';
			this.start = performance.now();
		}

		animateProgressBar(currentTime) {
			if (this.paused) {
				return;
			}

			const elapsed = currentTime - this.start;
			const progress = elapsed / this.autoPlaySpeed;
			this.progressBarWidth = Math.min(progress * 100, 100);
			this.progressBar.style.width = `${this.progressBarWidth}%`;

			if (this.progressBarWidth >= 100) {
				setTimeout(() => {
					this.flickity.next();
				}, 0);
			}

			window.requestAnimationFrame(this.animateProgressBar);
		}
	});
}

if (!customElements.get('slideshow-block-navigation-item')) {
	customElements.define('slideshow-block-navigation-item', class SlideshowBlockNavigationItem extends HTMLElement {
		constructor() {
			super();
			this.slideshow = this.closest('slideshow-component');
			this.progressBar = this.querySelector('.progress');
			this.requestId = null;
			this.startProgressBar = this.startProgressBar.bind(this);
			this.stopProgressBar = this.stopProgressBar.bind(this);
			this.addEventListener('mouseover', event => {
				const index = Array.from(this.parentElement.children).indexOf(this);
				this.preloadSlide(index);
			});
		}

		startProgressBar() {
			this.progressBar.style.width = `${this.slideshow.progressBarWidth}%`;
			this.requestId = window.requestAnimationFrame(this.startProgressBar);
		}

		stopProgressBar() {
			if (this.requestId) {
				window.cancelAnimationFrame(this.requestId);
			}
		}

		preloadSlide(index) {
			this.slideshow.preloadSlide(index);
		}
	});
}

if (!customElements.get('slideshow-block-navigation')) {
	customElements.define('slideshow-block-navigation', class SlideshowBlockNavigation extends HTMLElement {
		constructor() {
			super();
			this.slideshow = this.closest('slideshow-component');
			this.scroller = this.querySelector('.slideshow-block-navigation-items');
			this.autoPlayEnabled = this.slideshow.autoPlayEnabled;
		}

		connectedCallback() {
			this.flickity = this.slideshow.flickity;
			const navs = this.querySelectorAll('.slideshow-block-navigation-item');
			const initialNav = navs[this.flickity.selectedIndex];

			if (this.autoPlayEnabled) {
				initialNav.closest('slideshow-block-navigation-item')?.startProgressBar();
			}

			this.flickity.on('select', () => {
				navs.forEach(nav => {
					nav.classList.remove('is-active');

					if (this.autoPlayEnabled) {
						nav.closest('slideshow-block-navigation-item')?.stopProgressBar();
					}
				});

				const activeNav = navs[this.flickity.selectedIndex];

				activeNav.classList.add('is-active');
				scrollIntoView({
					element: activeNav,
					container: this.scroller,
				});

				if (this.autoPlayEnabled) {
					activeNav.closest('slideshow-block-navigation-item')?.startProgressBar();
				}
			});

			navs.forEach(nav => {
				nav.addEventListener('click', (event) => {
					event.preventDefault();
					const index = [...navs].findIndex(x => x === nav);
					this.flickity.select(index);
				});
			});
		}
	});
}

if (!customElements.get('slideshow-navigation')) {
	customElements.define('slideshow-navigation', class SlideshowNavigation extends HTMLElement {
		constructor() {
			super();
			this.slideshow = this.closest('slideshow-component');
		}

		connectedCallback() {
			this.flickity = this.slideshow.flickity;

			// Pagination
			const buttons = this.querySelectorAll('.js-page');

			if (buttons.length) {
				this.flickity.on('select', () => {
					buttons.forEach(button => {
						button.classList.remove('is-active');
					});

					buttons[this.flickity.selectedIndex].classList.add('is-active');
				});

				buttons.forEach(button => {
					button.addEventListener('click', () => {
						const index = [...buttons].findIndex(x => x === button);
						this.flickity.select(index);
					});
				});
			}

			// Next - Previous
			this.buttonPrev = this.querySelector('.js-prev');
			this.buttonNext = this.querySelector('.js-next');

			if (this.buttonNext && this.buttonPrev) {
				this.buttonPrev.addEventListener('click', (event) => {
					event.preventDefault();
					this.flickity.previous();
				});

				this.buttonNext.addEventListener('click', (event) => {
					event.preventDefault();
					this.flickity.next();
				});
			}
		}
	});
}

function scrollIntoView({ element, container = window, behavior = 'auto'}) {
	const elementRect = element.getBoundingClientRect();
	const containerRect = container.getBoundingClientRect();
	const elementTopRelativeToContainer = elementRect.top - containerRect.top + container.scrollTop;
	const elementHeight = elementRect.height;
	const containerHeight = containerRect.height;
	const centerOffset = Math.floor((containerHeight - elementHeight) / 2);
	container.scrollTo({
		top: elementTopRelativeToContainer - centerOffset,
		behavior: behavior
	});
}
