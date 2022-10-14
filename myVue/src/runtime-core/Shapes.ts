export enum Shapes {
	ELEMENT = 1, //HTML elements（or any REAL elements）
	STATEFUL_COMPONENT = 1 << 1, //components
	TEXT_CHILD = 1 << 2, //HTML innerText
	ARRAY_CHILDREN = 1 << 3, //child components
	OBJECT_CHILDREN = 1 << 4, //slots
}

//位运算比对象属性效率高
