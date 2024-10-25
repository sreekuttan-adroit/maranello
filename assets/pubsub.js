let subscribers = {};

function subscribe(eventName, callback) {
	if (subscribers[eventName] === undefined) {
		subscribers[eventName] = [];
	}

	subscribers[eventName] = [...subscribers[eventName], callback];

	return function unsubscribe() {
		subscribers[eventName] = subscribers[eventName].filter((cb) => {
			return cb !== callback;
		});
	};
}

function publish(eventName, data) {
	if (subscribers[eventName]) {
		subscribers[eventName].forEach((callback) => {
			callback(data);
		});
	}
}

const PUB_SUB_EVENTS = {
	cartItemRemove: 'cart:item-remove',
	cartItemAdd: 'cart:item-add',
	cartItemQuantityUpdate: 'cart:item-quantity-update',
	cartError: 'cart:error',
	sliderSlideChange: 'slider:slide-change',
	collectionFilters: 'collection:filters',
	pageChange: 'page:change',
	searchOpen: 'search:open',
	searchClose: 'search:close',
	productModalOpen: 'product:modal-open',
	productModalClose: 'product:modal-close',
	mobileMenuOpen: 'mobile-menu:open',
	mobileMenuClose: 'mobile-menu:close',
	productVariantChange: 'product:variant-change',
	productQuantityUpdate: 'product:quantity-update',
	pickupAvailabilityDrawerOpen: 'pickup-availability-drawer:open',
	pickupAvailabilityDrawerClose: 'pickup-availability-drawer:close',
	searchResultsOpen: 'search-results:open',
	searchResultsClose: 'search-results:close',
	slideshowSlideChange: 'slideshow:slide-change',
	headerCartOpen: 'header-cart:open',
	headerCartClose: 'header-cart:close',
	headerSearchOpen: 'header-search:open',
	headerSearchClose: 'header-search:close',
	sectionRefreshed: 'section-refreshed',
};
