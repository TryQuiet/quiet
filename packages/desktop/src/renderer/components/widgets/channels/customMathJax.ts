// // import mathjax from 'mathjax-full/js/mathjax'
// var mathjax = require('mathjax-full/js/mathjax');
// var tex$1 = require('mathjax-full/js/input/tex');
// var mathml$1 = require('mathjax-full/js/input/mathml');
// var svg$1 = require('mathjax-full/js/output/svg');
// var browserAdaptor = require('mathjax-full/js/adaptors/browserAdaptor');
// var html = require('mathjax-full/js/handlers/html');
// var MathItem = require('mathjax-full/js/core/MathItem');

// const onError = (e) => {console.log('ERROR', e)}
// // create and register adaptor bound to the real DOM
// var adaptor = browserAdaptor.browserAdaptor();
// html.RegisterHTMLHandler(adaptor);

// var tex = new tex$1.TeX({ packages: ["base", "ams"] });
// // var mathml = new mathml$1.MathML({});
// var svg = new svg$1.SVG({ fontCache: "none" });
// var markErrors = [MathItem.STATE.TYPESET + 1, null, onError];

// var tex_html = mathjax.mathjax.document("", {
//     InputJax: tex,
//     OutputJax: svg,
//     renderActions: {
//         markErrors: markErrors,
//     },
// });





'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var React = require('react');
var mathjax = require('mathjax-full/js/mathjax');
var tex$1 = require('mathjax-full/js/input/tex');
var mathml$1 = require('mathjax-full/js/input/mathml');
var svg$1 = require('mathjax-full/js/output/svg');
var browserAdaptor = require('mathjax-full/js/adaptors/browserAdaptor');
var html = require('mathjax-full/js/handlers/html');
var MathItem = require('mathjax-full/js/core/MathItem');

function _interopNamespace(e) {
    if (e && e.__esModule) return e;
    var n = Object.create(null);
    if (e) {
        Object.keys(e).forEach(function (k) {
            if (k !== 'default') {
                var d = Object.getOwnPropertyDescriptor(e, k);
                Object.defineProperty(n, k, d.get ? d : {
                    enumerable: true,
                    get: function () { return e[k]; }
                });
            }
        });
    }
    n["default"] = e;
    return Object.freeze(n);
}

export function convertToSvg(src, display, settings) {
    const math = src.trim();
    const converted = tex_html.convert(math, { display: display, ...settings })
    // return converted
    tex_html.updateDocument()
    return adaptor.outerHTML(converted)
}

// create and register adaptor bound to the real DOM
var adaptor = browserAdaptor.browserAdaptor();
html.RegisterHTMLHandler(adaptor);
//  Create input and output jax and a document using them on the content from
//  the HTML file (see:
//  https://github.com/mathjax/MathJax-demos-node/blob/master/direct/tex2svg)
var tex = new tex$1.TeX({ packages: ["base", "ams"] });
var mathml = new mathml$1.MathML({});
var svg = new svg$1.SVG({ fontCache: "none" });
var markErrors = [MathItem.STATE.TYPESET + 1, null, onError];
var tex_html = mathjax.mathjax.document("", {
    InputJax: tex,
    OutputJax: svg,
    renderActions: {
        markErrors: markErrors,
    },
});
var mathml_html = mathjax.mathjax.document("", {
    InputJax: mathml,
    OutputJax: svg,
    renderActions: {
        markErrors: markErrors,
    },
});
function onError(math) {
    console.log('onError')
    var root = math.root, typesetRoot = math.typesetRoot;
    if (root.toString().substr(0, 14) === "math([merror([") {
        var merror = root.childNodes[0].childNodes[0];
        var text = merror.attributes.get("data-mjx-error") ||
            merror.childNodes[0].childNodes[0].getText();
        console.log('onError text', text)
        adaptor.setAttribute(typesetRoot, "data-mjx-error", text);
    }
}
function updateCSS(nodeID, text) {
    var styleNode = document.getElementById(nodeID);
    if (styleNode === null) {
        styleNode = document.createElement("style");
        styleNode.setAttribute("id", nodeID);
        document.head.appendChild(styleNode);
    }
    styleNode.innerHTML = text;
}
var CancelationException = /** @class */ (function () {
    function CancelationException() {
    }
    return CancelationException;
}());
export function convertPromise(srcSpec, node, display, settings) {
    var src = srcSpec.src, lang = srcSpec.lang;
    if (!node)
        throw new Error();
    var html = tex_html;
    if (lang == "MathML")
        html = mathml_html;
    var math = src.trim();
    // const metrics = svg.getMetricsFor(node, display);
    var canceled = false;
    var cancel = function () { return (canceled = true); };
    var res = mathjax.mathjax
        .handleRetriesFor(function () {
        if (canceled) {
            throw new CancelationException();
        }
        var dom = html.convert(math, { display: display , ...settings});
        return dom;
    })
        .then(function (dom) {
        // do stuff with dom
        html.updateDocument();
        updateCSS("MATHJAX-SVG-STYLESHEET", svg.cssStyles.cssText);
        var err = adaptor.getAttribute(dom, "data-mjx-error");
        if (err) {
            throw err;
        }
        return adaptor.outerHTML(dom);
    })
        .catch(function (err) {
        if (!(err instanceof CancelationException)) {
            throw err;
        }
        else {
            console.log("cancelled render!");
        }
    });
    return { promise: res.then(function (v) { return (v ? v : ""); }), cancel: cancel };
}


export function customConvertPromise(srcSpec, node, display, settings) {
    var src = srcSpec.src//, lang = srcSpec.lang;
    // if (!node)
    //     throw new Error();
    // var html = tex_html;
    // if (lang == "MathML")
    //     html = mathml_html;
    var math = src.trim();
    // const metrics = svg.getMetricsFor(node, display);
    var canceled = false;
    var cancel = function () { return (canceled = true); };
    var res = mathjax.mathjax
        .handleRetriesFor(function () {
        if (canceled) {
            throw new CancelationException();
        }
        // var dom = html.convert(math, __assign({ display: display }, settings));
        var dom = tex_html.convert(math, { display: display, ...settings });
        return dom;
    })
        .then(function (dom) {
        // do stuff with dom
        tex_html.updateDocument();
        // updateCSS("MATHJAX-SVG-STYLESHEET", svg.cssStyles.cssText);
        var err = adaptor.getAttribute(dom, "data-mjx-error");
        if (err) {
            throw err;
        }
        return adaptor.outerHTML(dom);
    })
        .catch(function (err) {
        if (!(err instanceof CancelationException)) {
            throw err;
        }
        else {
            console.log("cancelled render!");
        }
    });
    return { promise: res.then(function (v) { return (v ? v : ""); }), cancel: cancel };
}