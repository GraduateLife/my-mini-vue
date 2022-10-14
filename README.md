# my-mini-vue

A project refers to VUE3 source code and another famous github project:  https://github.com/cuixiaorui/mini-vue

## Usage

<p>Initialize Project ↓</p>
<code>
    yarn init -y          
</code>
<p></p>
To see the examples in the project, please use live server extension in vscode (or similar thing) to avoid CORS policy

I have already include the bundles (both es module format and commonjs format) in <code>lib</code> file so you don't have to build it again.

##  Intro

Project reproduces VUE3 <code>reactivity</code>, <code>runtime-core</code>, <code>runtime-dom</code> as well as <code>compiler-core</code> modules so far. 
To make sure original functions are not affected during refactoring, I developed the project in TDD style (by unit tests in Jest).

It is worth mentioning that, the project is just aims to understand how VUE3 works and practice TDD workflow, hence in most of cases, I will only make sure the main 
process tests (happy path) are passed, instead of checking other edge cases. 

##  Description

This project has similar structure as VUE3 framework, though I won't use exactly identical API names as its'. I have left comments in the source code to
help understanding what every block of codes has done. 

###  reactivity 

To store reactive states, following APIs are reproduced:
<pre>
effect() includes stop() and run()
reactive()
isReactive()
ref()
isRef()
shallowRef()
unRef()
proxyRef()
readonly()
isReadonly()
shallowReadonly()
computed()
</pre>

### runtime-core

To create vitual nodes and mount/update corresponding elements, its main process is fully reproduced.

And reproduced following APIs:
<pre>
h()
emit()
inject()
provide()
getCurrentInstance()
nextTick()
</pre>
and props,slots, part of instance publicProrties 

### runtime-dom

To create HTML elements to view window, is fully reproduced.

And reproduced following APIs:
<pre>
customRenderer()
</pre>

### compiler-core

To convert vue template into render function for runtime-core usage.

Supports elements, interpolations and texts so far.

Still working on other types :)

## Appreciations
Again, many thanks to my TDD teacher, 崔效瑞 https://github.com/cuixiaorui
