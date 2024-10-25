document.addEventListener('shopify:block:select', function (event) {
	// Slideshow
	const blockSelectedIsSlide = event.target.classList.contains('slideshow-slide');
	if (blockSelectedIsSlide) {
		const parentSlideshowComponent = event.target.closest('slideshow-component');
		parentSlideshowComponent.flickity.stopPlayer();
		parentSlideshowComponent.paused = true;

		const slideIndex = [...event.target.parentElement.childNodes].indexOf(event.target);

		setTimeout(function () {
			parentSlideshowComponent.flickity.select(slideIndex);
			parentSlideshowComponent.paused = true;
		}, 200);

		return;
	}

	// Tabbed content
	const blockSelectedIsTabs = !!event.target.closest('tabs-navigation');
	if (blockSelectedIsTabs) {
		const parentTabsNavigation = event.target.closest('tabs-navigation');

		if (parentTabsNavigation) {
			parentTabsNavigation?.setActiveTab?.(event.target);
		}

		return;
	}
});

document.addEventListener('shopify:block:deselect', function (event) {
	const blockDeselectedIsSlide = event.target.classList.contains('slideshow-slide');
	if (!blockDeselectedIsSlide) {
		return;
	}

	const parentSlideshowComponent = event.target.closest('slideshow-component');

	if (parentSlideshowComponent.autoPlayEnabled) {
		parentSlideshowComponent.flickity.playPlayer();
		parentSlideshowComponent.paused = false;
	}
});

document.addEventListener('shopify:section:load', function (event) {
	const mapLocations = event.target.querySelector('map-locations');
	const apiKey = mapLocations?.getAttribute('google-maps-api-key');

	if (event.target.querySelector('.rte')) {
		createResponsiveWrappers();
	}

	if (event.target.querySelector('popup-overlay')) {
		event.target.querySelector('popup-overlay').show();
	}

	if (!mapLocations || !apiKey) {
		return;
	}

	initializeGoogleMapsScript(apiKey);
});

document.addEventListener('shopify:section:select', (event) => {
	if (event.target.querySelector('popup-overlay')) {
		event.target.querySelector('popup-overlay').show();
	}
});

document.addEventListener('shopify:section:deselect', (event) => {
	if (event.target.querySelector('popup-overlay')) {
		event.target.querySelector('popup-overlay').hide();
	}
});

function createResponsiveWrappers () {
	// We wrap each RTE table by a specific class to allow wrapping
	document.querySelectorAll('.rte table').forEach(function (table) {
		table.outerHTML = '<div class="table-wrapper">' + table.outerHTML + '</div>';
	});
	document.querySelectorAll('.rte iframe').forEach(function (iframe) {
		// We scope the wrapping only for YouTube and Vimeo
		if (iframe.src.indexOf('youtube') !== - 1 || iframe.src.indexOf('youtu.be') !== - 1 || iframe.src.indexOf('vimeo') !== - 1) {
			iframe.outerHTML = '<div class="video-wrapper">' + iframe.outerHTML + '</div>'; // Re-set the src attribute on each iframe after page load for Chrome's "incorrect iFrame content on 'back'" bug.
			// https://code.google.com/p/chromium/issues/detail?id=395791. Need to specifically target video and admin bar

			iframe.src = iframe.src;
		}
	});
}
