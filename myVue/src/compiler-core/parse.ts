import { AstNodeTypes } from "./astNodeTypes";

enum ElementTagsIdentifiers {
	START, //< of <>
	END, //</ of </>
}

export function baseParse(input: string) {
	const context = createParseContext(input);
	return createRoot(parseBranches(context, []));
}
function parseBranches(context, recentElements) {
	// console.log(
	// 	"start parsing context branch,current source is,,",
	// 	context.source
	// );
	const nodes: Array<any> = [];
	let node;
	while (!shouldTerminateParse(context, recentElements)) {
		// console.log("current element stack", recentElements);
		if (/^\{\{/.test(context.source)) {
			// {{something...
			node = parseInterpolation(context);
		} else if (/^\<\w/.test(context.source)) {
			// <something...
			node = parseElement(context, recentElements);
		} else {
			node = parseText(context);
		}

		nodes.push(node);
	}

	return nodes;
}
function parseInterpolation(context) {
	const openBrace = "{{";
	const closeBrace = "}}";
	const closeBraceIndex = context.source.indexOf(closeBrace, openBrace.length);
	proceedByLength(context, openBrace.length); //proceed to right by 2(  {{  )
	//console.log("do we have problem when we at {{?>>>", context.source);
	const parsedInterpolationContent = processWordContent(
		context,
		closeBraceIndex - openBrace.length
	).trim();
	//console.log(
	//"do we have problem when we are inside interpolation?>>>",
	//parsedInterpolationContent,
	//",,should be parsed expression,",
	//context.source,
	//",,is current source"
	//);
	proceedByLength(context, closeBrace.length); //move to the end of }}
	//console.log(
	//"do we have problem when we at }}?>>>",
	//context.source,
	//",,is current source"
	//);
	// console.log("ip ends", context.source);
	return {
		type: AstNodeTypes.INTERPOLATION,
		content: {
			type: AstNodeTypes.SIMPLE_EXPRESSION,
			content: parsedInterpolationContent,
		},
	};
}

function parseElement(context, recentElements) {
	const element: any = parseElementTags(context, ElementTagsIdentifiers.START);
	recentElements.push(element);
	// console.log(
	// 	"current element stack after parsing element tag start",
	// 	recentElements
	// );
	element.branches = parseBranches(context, recentElements);
	recentElements.pop();
	// console.log(
	// 	"current element stack after parsing element tag",
	// 	recentElements
	// );
	if (hasCorrespondingCloseTag(context, element)) {
		// console.log("start parsing close tag");
		parseElementTags(context, ElementTagsIdentifiers.END);
	} else {
		throw new Error("lost close tag");
	}

	return element;
}

function hasCorrespondingCloseTag(someCxt, someEle) {
	return (
		someCxt.source.slice(2, someEle.tag.length + 2) === someEle.tag &&
		someCxt.source.startsWith("</")
	);
}
function parseElementTags(
	context,
	elementTagsIdentifier: ElementTagsIdentifiers
) {
	const matches = /^\<\/?(\w+)\>/.exec(context.source);
	// //console.log("tag matches results", matches);
	const parsedElementTagName = matches![1];
	// console.log(
	// 	"do we have problems when we parsing tag names?>>>",
	// 	parsedElementTagName,
	// 	",,should be parsed tag"
	// );
	proceedByLength(context, matches![0].length);
	// console.log("current source", context.source);

	if (elementTagsIdentifier === ElementTagsIdentifiers.END) {
		return;
	}
	return {
		type: AstNodeTypes.ELEMENT,
		tag: parsedElementTagName,
	};
}

function parseText(context: any) {
	let textEndIndex = context.source.length;
	const textEndSymbols = ["{{", "<"];

	for (let i = 0; i < textEndSymbols.length; i++) {
		const temp = context.source.indexOf(textEndSymbols[i]);
		// console.log("qqqqqqqqqqqqq", temp);
		if (temp !== -1 && temp < textEndIndex) {
			textEndIndex = temp;
		}
	}

	const parsedText = processWordContent(context, textEndIndex);
	//console.log(
	//"parsed text is,,",
	//parsedText,
	//"current source is,,",
	//context.source
	//);
	return {
		type: AstNodeTypes.TEXT,
		content: parsedText,
	};
}
function processWordContent(context, someLength) {
	const parsedText = context.source.slice(0, someLength);
	proceedByLength(context, someLength);
	return parsedText;
}

function shouldTerminateParse(context, recentElements) {
	if (context.source.startsWith("</")) {
		for (let i = recentElements.length - 1; i >= 0; i--) {
			let lastElement = recentElements[i];
			// console.log("aaaaaaaaa", lastElement);
			if (hasCorrespondingCloseTag(context, lastElement)) {
				// console.log("out");
				return true;
			}
		}
	}

	if (context.source.length === 0) {
		return true;
	}
	return false;
}
//to proceed string pointer
function proceedByLength(someCxt, length: number) {
	someCxt.source = someCxt.source.slice(length);
}

function createRoot(branches) {
	return {
		type: AstNodeTypes.ROOT,
		branches,
	};
}
function createParseContext(input: string) {
	return {
		source: input,
	};
}
