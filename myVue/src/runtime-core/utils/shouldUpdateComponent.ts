export function shouldUpdateComponent(vnode1, vnode2) {
	const { attributes: prevAttrs } = vnode1;
	const { attributes: currAttrs } = vnode2;
	for (const key in currAttrs) {
		if (prevAttrs[key] !== currAttrs[key]) {
			return true;
		}
	}
	return false; //probably means the component is itself
}
