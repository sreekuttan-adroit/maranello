if (!customElements.get('video-modal')) {
	customElements.define('video-modal', class VideoModal extends ModalDialog {
		constructor() {
			super();
		}

		hide() {
			super.hide();
		}

		show(opener) {
			super.show(opener);
			this.playMedia();
		}

		playMedia() {
			const deferredMedia = this.querySelector('deferred-media');

			if (deferredMedia) {
				deferredMedia.loadContent();
			}
		}
	});
}
