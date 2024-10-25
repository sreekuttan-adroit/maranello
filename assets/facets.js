class FacetFiltersForm extends HTMLElement {
	constructor() {
		super();
		this.onActiveFilterClick = this.onActiveFilterClick.bind(this);
		const inputWhitelist = [
			'.facet',
			'.collection-actions-wrapper',
		]

		this.debouncedOnSubmit = debounce((event) => {
			this.onSubmitHandler(event);
		}, 500);

		this.debouncedOnSubmitReduced = debounce((event) => {
			this.onSubmitHandler(event);
		}, 250, true);

		this.addEventListener('input', (event) => {
			if (!inputWhitelist.some(selector => !!event.target.closest(selector))) {
				return false;
			}

			if (event.target.closest('price-range')) {
				this.debouncedOnSubmit(event);
			} else {
				this.debouncedOnSubmitReduced(event);
			}
		});
	}

	static setListeners() {
		const onHistoryChange = (event) => {
			const searchParams = event.state ? event.state.searchParams : FacetFiltersForm.searchParamsInitial;
			if (searchParams === FacetFiltersForm.searchParamsPrev) {
				return;
			}

			FacetFiltersForm.renderPage(searchParams, null, false);
		}
		window.addEventListener('popstate', onHistoryChange);
	}

	static toggleActiveFacets(disable = true) {
		document.querySelectorAll('.js-facet-remove').forEach((element) => {
			element.classList.toggle('disabled', disable);
		});
	}

	static renderPage(searchParams, event, updateURLHash = true, appendResults) {
		FacetFiltersForm.searchParamsPrev = searchParams;
		const sections = FacetFiltersForm.getSections();
		const countContainer = document.getElementById('ProductCount');
		document.getElementById('ProductGridContainer').querySelector('.collection').classList.add('loading');

		if (countContainer) {
			countContainer.classList.add('loading');
		}

		sections.forEach((section) => {
			const url = `${window.location.pathname}?section_id=${section.section}&${searchParams}`;
			const filterDataUrl = element => element.url === url;

			FacetFiltersForm.filterData.some(filterDataUrl) ?
			FacetFiltersForm.renderSectionFromCache(filterDataUrl, event) :
			FacetFiltersForm.renderSectionFromFetch(url, event, appendResults);
		});

		if (updateURLHash) {
			FacetFiltersForm.updateURLHash(searchParams);
		}

		if (!searchParams.includes('page')) {
			publish(PUB_SUB_EVENTS.collectionFilters, {
				filters: deserializeSearchParams(searchParams),
			});
		}
	}

	static renderSectionFromFetch(url, event, appendResults) {
		fetch(url)
			.then(response => response.text())
			.then((responseText) => {
				const html = responseText;
				FacetFiltersForm.filterData = [...FacetFiltersForm.filterData, { html, url }];
				FacetFiltersForm.renderCollectionActions(html);
				FacetFiltersForm.renderFilters(html, event);
				FacetFiltersForm.renderProductGridContainer(html, appendResults);
				FacetFiltersForm.renderProductCount(html);
			});
	}

	static renderSectionFromCache(filterDataUrl, event) {
		const html = FacetFiltersForm.filterData.find(filterDataUrl).html;
		FacetFiltersForm.renderCollectionActions(html);
		FacetFiltersForm.renderFilters(html, event);
		FacetFiltersForm.renderProductGridContainer(html);
		FacetFiltersForm.renderProductCount(html);
	}

	static renderProductGridContainer(html, appendResults) {
		const container = document.getElementById('ProductGridContainer');
		const parsedDom = new DOMParser().parseFromString(html, 'text/html');

		if (appendResults) {
			parsedDom.getElementById('product-grid')
				.prepend(...[...document.getElementById('product-grid').childNodes]);
		}
		container.innerHTML = parsedDom.getElementById('ProductGridContainer').innerHTML;
	}

	static renderProductCount(html) {
		const count = new DOMParser().parseFromString(html, 'text/html').getElementById('ProductCount')?.innerHTML
		const container = document.getElementById('ProductCount');

		if (!container) {
			return;
		}

		container.innerHTML = count;
		container.classList.remove('loading');
	}

	static renderCollectionActions(html) {
		const container = document.getElementById('CollectionActions');
		const parsedDom = new DOMParser().parseFromString(html, 'text/html');

		if (!container) {
			return;
		}

		container.classList = parsedDom.getElementById('CollectionActions').classList;
	};

	static renderFilters(html, event) {
		const parsedHTML = new DOMParser().parseFromString(html, 'text/html');

		const facetDetailsElements =
			parsedHTML.querySelectorAll('#FacetFiltersForm .js-filter');
		const isPriceFilter = (element) => {
			return !!element.querySelector('price-range');
		};

		const matchesIndex = (element) => {
			const jsFilter = event ? event.target.closest('.js-filter') : undefined;
			return jsFilter ? element.dataset.index === jsFilter.dataset.index : false;
		}
		const facetsToRender = Array.from(facetDetailsElements).filter(element => {
			if (isPriceFilter(element)) {
				return !matchesIndex(element);
			}

			return true;
		});

		facetsToRender.forEach((element) => {
			const oldElement = document.querySelector(`.js-filter[data-index="${element.dataset.index}"]`);

			// Preserve expanded status of the old element
			element.querySelector('.facet-toggle').setAttribute('aria-expanded', oldElement.querySelector('.facet-toggle').getAttribute('aria-expanded'));
			element.querySelector('collapsible-expandable').setAttribute('expanded', oldElement.querySelector('collapsible-expandable').getAttribute('expanded'));
			oldElement.innerHTML = element.innerHTML;
		});

		// Special handling for the price range
		// Do not render it entirely as the input elements will lose focus.
		const priceFilter = Array.from(facetDetailsElements).find(isPriceFilter);

		if (priceFilter) {
			document.querySelector('.js-price-range-header').innerHTML = priceFilter.querySelector('.js-price-range-header').innerHTML;
		}

		FacetFiltersForm.renderActiveFacets(parsedHTML);
	}

	static renderActiveFacets(html) {
		const activeFacetElementSelectors = ['.collection-actions-filters'];

		activeFacetElementSelectors.forEach((selector) => {
			const activeFacetsElement = html.querySelector(selector);
			if (!activeFacetsElement) {
				return;
			}

			document.querySelector(selector).innerHTML = activeFacetsElement.innerHTML;
		});

		FacetFiltersForm.toggleActiveFacets(false);
	}

	static updateURLHash(searchParams, replace) {
		if (replace) {
			history.replaceState({ searchParams }, '', `${window.location.pathname}${searchParams && '?'.concat(searchParams)}`);
		} else {
			history.pushState({ searchParams }, '', `${window.location.pathname}${searchParams && '?'.concat(searchParams)}`);
		}
	}

	static getSections() {
		return [
			{
				section: document.getElementById('product-grid').dataset.id,
			}
		]
	}

	onSubmitHandler(event) {
		event.preventDefault();
		const formData = new FormData(document.getElementById('FacetsFilterForm'));
		const searchParams = new URLSearchParams(formData).toString();
		FacetFiltersForm.renderPage(searchParams, event);
	}

	onActiveFilterClick(event) {
		event.preventDefault();
		FacetFiltersForm.toggleActiveFacets();
		const url = event.currentTarget.href.indexOf('?') == -1 ? '' : event.currentTarget.href.slice(event.currentTarget.href.indexOf('?') + 1);
		FacetFiltersForm.renderPage(url);
	}

	onAjaxPagination(event) {
		event.preventDefault();
		const next = event.currentTarget;
		const url = next.href.indexOf('?') == -1 ? '' : next.href.slice(next.href.indexOf('?') + 1);
		FacetFiltersForm.renderPage(url, event, true);
		scrollToElement(document.getElementById('ProductGridContainer'), -150);

		const params = new URLSearchParams(url);
		publish(PUB_SUB_EVENTS.pageChange, {
			page: Number(params.get('page')),
		});
	}
}

FacetFiltersForm.filterData = [];
FacetFiltersForm.searchParamsInitial = window.location.search.slice(1);
FacetFiltersForm.searchParamsPrev = window.location.search.slice(1);
customElements.define('facet-filters-form', FacetFiltersForm);
FacetFiltersForm.setListeners();

class PriceRange extends HTMLElement {
	constructor() {
		super();
		this.querySelectorAll('input')
			.forEach(element => element.addEventListener('change', this.onRangeChange.bind(this)));

		this.setMinAndMaxValues();
	}

	onRangeChange(event) {
		this.adjustToValidValues(event.currentTarget);
		this.setMinAndMaxValues();
	}

	setMinAndMaxValues() {
		const inputs = this.querySelectorAll('input');
		const minInput = inputs[0];
		const maxInput = inputs[1];
		if (maxInput.value) minInput.setAttribute('max', maxInput.value);
		if (minInput.value) maxInput.setAttribute('min', minInput.value);
		if (minInput.value === '') maxInput.setAttribute('min', 0);
		if (maxInput.value === '') minInput.setAttribute('max', maxInput.getAttribute('max'));
	}

	adjustToValidValues(input) {
		const value = Number(input.value);
		const min = Number(input.getAttribute('min'));
		const max = Number(input.getAttribute('max'));

		if (value < min) input.value = min;
		if (value > max) input.value = max;
	}
}

customElements.define('price-range', PriceRange);

class FacetRemove extends HTMLElement {
	constructor() {
		super();
		this.querySelector('a').addEventListener('click', (event) => {
			event.preventDefault();
			const form = this.closest('facet-filters-form') || document.querySelector('facet-filters-form');
			form.onActiveFilterClick(event);
		});
	}
}

customElements.define('facet-remove', FacetRemove);

class AjaxPaginate extends HTMLElement {
	constructor() {
		super();
		const form = this.closest('facet-filters-form') || document.querySelector('facet-filters-form');
		const buttons = this.querySelectorAll('a');

		buttons.forEach(button => {
			button.addEventListener('click', (event) => {
				event.preventDefault();
				form.onAjaxPagination(event);
			});
		});
	}
}

customElements.define('ajax-paginate', AjaxPaginate);

function scrollToElement(element, offset) {
	const elementRect = element.getBoundingClientRect();
	const absoluteElementTop = elementRect.top + window.pageYOffset;
	window.scrollTo({
		top: absoluteElementTop + offset,
		behavior: 'smooth'
	});
}

/**
 * Accepts a query string from faceted filtering and returns a
 * deserialized object.
 *
 * @param {string} queryString The query string.
 * @returns {{}}
 */
const deserializeSearchParams = (queryString) => {
	const params = new URLSearchParams(queryString);
	const result = {};

	for (const [key, value] of params.entries()) {
		if (result[key]) {
			result[key] = `${result[key]},${value}`
		} else if (value) {
			result[key] = value;
		}
	}

	return result
}
