export function randCol () {
	return [
		Math.random() * 255,
		Math.random() * 255,
		Math.random() * 255
	];
}

export function testColor (target, current, threshold = 20) {

	const [tr, tg, tb] = target;
	const [ur, ug, ub] = current;

	const dr = Math.abs(tr - ur);
	const dg = Math.abs(tg - ug);
	const db = Math.abs(tb - ub);

	return dr < threshold && dg < threshold && db < threshold;
}
