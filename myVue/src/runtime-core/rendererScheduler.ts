const queue: Array<Function> = []; // micro task queue
let shouldStartFlush: boolean = true;
const p = Promise.resolve(); //only need on promise object
export function addQueueJob(jobName: Function) {
	if (!queue.includes(jobName)) {
		queue.push(jobName);
	}
	//only need to execute once
	if (shouldStartFlush) {
		flushQueue();
	}
}

export function nextTick(fn) {
	return fn ? p.then(fn) : p;
}

function flushQueue() {
	shouldStartFlush = false;
	nextTick(doTheJobs);
}

function doTheJobs() {
	let job;
	while ((job = queue.shift())) {
		job && job();
	}
}
