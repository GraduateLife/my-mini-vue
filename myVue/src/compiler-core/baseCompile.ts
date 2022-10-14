import { transform } from "./transform";
import { generate } from "./codeGen";
import { baseParse } from "./parse";
import { create_mixed_node } from "./transformPlugins/create_mixed_node";
import { ctx_simple_exp } from "./transformPlugins/ctx_simple_exp";
import { setup_element_node } from "./transformPlugins/setup_element_node";

export function baseCompile(template: string) {
	const ast: any = baseParse(template);
	transform(ast, {
		nodeTransforms: [ctx_simple_exp, setup_element_node, create_mixed_node],
	});

	return generate(ast).code;
}
