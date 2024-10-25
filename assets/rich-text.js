if (!customElements.get('rich-text-more')) {
	customElements.define('rich-text-more', class MediaGallery extends HTMLElement {
		constructor() {
			super();
			this.button = this.querySelector('button');
			this.container = this.closest('.section-rich-text');
			this.button.addEventListener('click', this.handleClick);
		}

		handleClick = () => {
			this.container.classList.toggle('is-expanded');
		}
	});
}
