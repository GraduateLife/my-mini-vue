import { AstNodeTypes } from "../astNodeTypes";
import { baseParse } from "../parse";

describe("Parse", () => {
	describe("interpolation ", () => {
		it("happy path", () => {
			const ast = baseParse("{{       message        }}");
			expect(ast.branches[0]).toStrictEqual({
				type: AstNodeTypes.INTERPOLATION,
				content: {
					type: AstNodeTypes.SIMPLE_EXPRESSION,
					content: "message",
				},
			});
		});
	});
	describe("element labels", () => {
		it("happy path", () => {
			const ast = baseParse("<div></div>");
			expect(ast.branches[0]).toStrictEqual({
				type: AstNodeTypes.ELEMENT,
				tag: "div",
				branches: [],
			});
		});
	});

	describe("text", () => {
		it("happy path", () => {
			const ast = baseParse("some text");
			expect(ast.branches[0]).toStrictEqual({
				type: AstNodeTypes.TEXT,
				content: "some text",
			});
		});
	});
});

describe("much more complex cases", () => {
	it("union types", () => {
		const ast = baseParse("<p>this is,{{message}}</p>");
		expect(ast.branches[0]).toStrictEqual({
			type: AstNodeTypes.ELEMENT,
			tag: "p",
			branches: [
				{
					type: AstNodeTypes.TEXT,
					content: "this is,",
				},
				{
					type: AstNodeTypes.INTERPOLATION,
					content: {
						type: AstNodeTypes.SIMPLE_EXPRESSION,
						content: "message",
					},
				},
			],
		});
	});

	it("multiple tags", () => {
		const ast = baseParse("<p><div>this is</div>{{message}}</p>");
		expect(ast.branches[0]).toStrictEqual({
			type: AstNodeTypes.ELEMENT,
			tag: "p",
			branches: [
				{
					type: AstNodeTypes.ELEMENT,
					tag: "div",
					branches: [
						{
							type: AstNodeTypes.TEXT,
							content: "this is",
						},
					],
				},
				{
					type: AstNodeTypes.INTERPOLATION,
					content: {
						type: AstNodeTypes.SIMPLE_EXPRESSION,
						content: "message",
					},
				},
			],
		});
	});
	it("throws error when close tag is lost", () => {
		expect(() => {
			baseParse("<p><invalid></p>");
		}).toThrowError("lost close tag");
	});
});
