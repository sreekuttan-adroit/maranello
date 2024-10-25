if (!customElements.get('scrolling-elements')) {
	customElements.define('scrolling-elements', class ScrollingElements extends HTMLElement {
		constructor() {
			super();
		}

		connectedCallback() {
			const container = this.querySelector('.scrolling-elements-wrap');
			let groups = Array.from(container.querySelectorAll('.scrolling-elements-group'));
			let totalWidth = 0;

			const calculateTotalWidth = () => {
				totalWidth = groups.reduce((acc, group) => acc + group.offsetWidth, 0);
			};

			calculateTotalWidth();

			while (totalWidth < window.innerWidth) {
				const newGroups = [];
				groups.forEach(group => {
					const clone = group.cloneNode(true);
					container.appendChild(clone);
					newGroups.push(clone);
				});
				groups = groups.concat(newGroups);
				calculateTotalWidth();
			}
		}
	});
}
