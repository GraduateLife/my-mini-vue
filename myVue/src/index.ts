//mini-vue output file

export * from "./runtime-dom";
export * from "./reactivity";
import { receiveRenderFunction } from "./runtime-dom";

import { baseCompile } from "./compiler-core/index";
import * as runtimeDom from "./runtime-dom";
console.log("ready");
function generateRenderFunction(template) {
	const funcString = baseCompile(template);
	const render = new Function("Vue", funcString)(runtimeDom);
	console.log("render", render);
	return render;
}

receiveRenderFunction(generateRenderFunction);
