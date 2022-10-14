import { transform } from "../transform";
import { generate } from "../codeGen";
import { baseParse } from "../parse";
import { ctx_simple_exp } from "../transformPlugins/ctx_simple_exp";
import { setup_element_node } from "../transformPlugins/setup_element_node";
import { create_mixed_node } from "../transformPlugins/create_mixed_node";
import { baseCompile } from "../baseCompile";

describe("code generator", () => {
	it("creates code for strings", () => {
		const ast = baseParse("good morning");
		transform(ast);
		const { code } = generate(ast);

		expect(code).toMatchSnapshot();
	});
	it("creates code for interpolations", () => {
		const ast = baseParse("{{message}}");
		transform(ast, {
			nodeTransforms: [ctx_simple_exp],
		});
		const { code } = generate(ast);

		expect(code).toMatchSnapshot();
	});
	it("create code for elements", () => {
		const ast = baseParse("<div></div>");
		transform(ast, {
			nodeTransforms: [setup_element_node],
		});
		const { code } = generate(ast);

		expect(code).toMatchSnapshot();
	});

	it("create code for multiple types", () => {
		const ast: any = baseParse("<div>this is {{message}}</div>");
		transform(ast, {
			//to specify, in this case, we let transformer to pass element first child only to the generator, hence we have to execute mixed-exp plugin
			//first to convert all its innertext into one node (mixed type)
			// nodeTransforms: [ctx_simple_exp, create_mixed_node, setup_element_node], //<<<you will suddenly find simple-exp plugin no longer works
			//#region what happened inside?
			/*it is due to the arrangement of ast nodes, every node will try to execute all plugins
			first in : element type (<div>),tells generator to process its first child only,(actually it kills all other children),
			but before that, executes mixed-node plugin, to aspect the type of its children
			second in: text type('this is'), triggered mixed-exp plugin, convert all the innertext into one node, so it's safe in codegen process
			third in? No we don't have the third node any more, since interpolation type is merged into mixed-exp type(removed from branch), 
			hence simple-exp plugin doesn't have a chance to be executed,
			What shall we do?
			we want simple-exp plugin to be executed as soon as possible, if we can't do that, we defer the execution timing of other plugins

			*/
			//#endregion
			nodeTransforms: [ctx_simple_exp, setup_element_node, create_mixed_node],
		});
		// console.log("ast is like", ast.codeGenNode.branches);
		const { code } = generate(ast);

		expect(code).toMatchSnapshot();
	});
	it("tiny up", () => {
		const piece = baseCompile("<div>this is {{message}}</div>");
		expect(piece).toMatchSnapshot();
	});
});
