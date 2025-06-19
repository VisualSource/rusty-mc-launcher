function inject() {
	const actions = document.querySelectorAll("div.actions");
	if (!actions) return;
	const action = actions.item(0);
	const split = action.querySelector("div.split-button");
	if (!split) return;

	const btns = split.querySelectorAll("a.btn-cta");
	if (!btns) return;
	const lastBtn = btns.item(btns.length - 1);
	if (!lastBtn) return;

	/** @type {Element} */
	const clone = lastBtn.cloneNode(true);

	const text = clone.querySelector("span");
	if (text) {
		text.innerText = "RMCL";
	}

	const href = clone.getAttribute("href");
	const next = `rmcl://curseforge${href.replace(/\/install\/\d+/, "")}`;
	clone.setAttribute("href", next);

	split.insertBefore(clone, lastBtn);
}

inject();
