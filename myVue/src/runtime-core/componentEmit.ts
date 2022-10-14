import { formatEventName } from "../shared/index";

export function componentEmit(instance, eventName, ...args) {
	// console.log("Emitted event name:", eventName);

	const { props } = instance;
	const formattedEventName = formatEventName(eventName);
	props[formattedEventName](...args);
}
