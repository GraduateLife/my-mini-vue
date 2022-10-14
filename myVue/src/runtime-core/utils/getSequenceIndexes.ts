export function getSequenceIndexes(arr: number[]): number[] {
	const p = arr.slice(); //复制输入数组
	const result = [0];
	let left, right, u, v, c;
	const len = arr.length;
	for (left = 0; left < len; left++) {
		if (arr[left] !== 0) {
			right = result[result.length - 1];
			if (arr[right] < arr[left]) {
				p[left] = right;
				result.push(left);
				continue;
			}
			//二分查找来推连在一起的递增子串（的索引）
			u = 0;
			v = result.length - 1;
			while (u < v) {
				c = (u + v) >> 1; //<= middle

				if (arr[result[c]] < arr[left]) {
					u = c + 1;
				} else {
					v = c;
				}
			}
			if (arr[left] < arr[result[u]]) {
				if (u > 0) {
					p[left] = result[u - 1];
				}
				result[u] = left;
			}
		}
	}
	u = result.length;
	v = result[u - 1];
	while (u-- > 0) {
		result[u] = v;
		v = p[v];
	}
	return result;
}
