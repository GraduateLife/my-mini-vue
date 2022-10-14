export { toDisplayString } from "../shared/toDisplayString";
export const isObject = (val) => {
	return val !== null && val !== undefined && typeof val === "object";
};

export const isChanged = (newValue, oldValue) => {
	return !Object.is(newValue, oldValue);
};
export const hasProperty = (objectName, keyName) =>
	Object.prototype.hasOwnProperty.call(objectName, keyName);

export const formatEventName = (str: string) =>
	str ? "on" + capitalize(camelize(str)) : "";

//aaa=>Aaa
const capitalize = (str: string) =>
	str ? str.charAt(0).toUpperCase() + str.slice(1) : "";
//kebab-case-good=>kebabCaseGood
const camelize = (kebabStr: string) => {
	return kebabStr.replace(/-[a-z]/g, (matched, index) => {
		return matched.charAt(1).toUpperCase();
	});
};
