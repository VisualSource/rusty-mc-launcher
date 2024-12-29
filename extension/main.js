function inject() {
	const actions = document.querySelectorAll("div.actions");
	if (!actions) return;
	const action = actions.item(0);
	const split = action.querySelector("div.split-button");
	if (!split) return;

	const openBtn = split.querySelector("a.btn-cta");
	if (!openBtn) return;
	/** @type {Element} */
	const clone = openBtn.cloneNode(true);

	const text = clone.querySelector("span");
	if (text) {
		text.innerText = "RMCL";
	}

	const href = clone.getAttribute("href");
	const next = `rmcl://curseforge${href.replace(/\/install\/\d+/, "")}`;
	console.log(next);
	clone.setAttribute("href", next);

	split.insertBefore(clone, openBtn);
}

inject();
