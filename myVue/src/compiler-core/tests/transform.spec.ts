import { transform } from "../transform";
import { baseParse } from "../parse";
import { AstNodeTypes } from "../astNodeTypes";

describe("transform", () => {
	it("happy path", () => {
		const ast = baseParse("<div>this is my {{msg}}</div>");
		const plugin = (node) => {
			if (node.type === AstNodeTypes.TEXT) {
				node.content = "this is transformed message";
			}
		};
		transform(ast, {
			nodeTransforms: [plugin],
		});
		const wordContent = ast.branches[0].branches[0].content; //root.element.text.content
		expect(wordContent).toBe("this is transformed message");
	});
});
