/* eslint-disable no-undef */
// Copyright 2015-2016 by ChartIQ, Inc.

(function (definition) {
	"use strict";
	// @webcomponents/custom-elements.min requires Promises to work.
	// If you are running this in an environment without Promieses, be sure to load a polyfill.
	if (typeof exports === "object" && typeof module === "object") {
		module.exports = definition(
			require("chartiq"),
			require("thirdparty/object-observe"),
			require("thirdparty/@webcomponents/custom-elements.min")
		);
	} else if (typeof define === "function" && define.amd) {
		define(["chartiq", "thirdparty/object-observe", "thirdparty/@webcomponents/custom-elements.min"], definition);
	} else if (typeof window !== "undefined" || typeof self !== "undefined") {
		var global = typeof window !== "undefined" ? window : self;
		definition(global, global, global);
	} else {
		throw new Error("Only CommonJS, RequireJS, and <script> tags supported for componentUI.js.");
	}
})(function (_exports, oo, wc) {
	var CIQ = _exports.CIQ;
	var claims = [];

	// node.stxtap([selector],callback)
	jQuery.fn.extend({
		stxtap: function (arg1, arg2) {
			return this.each(function () {
				CIQ.installTapEvent(this /*, {stopPropagation:true}*/);
				if (typeof arg1 == "string") {
					$(this).on("stxtap", arg1, function (e) {
						arg2.call(this, e);
					});
				} else {
					$(this).on("stxtap", function (e) {
						arg1.call(this, e);
					});
				}
			});
		},
	});

	jQuery.fn.extend($.expr[":"], {
		trulyvisible: function (node, j, attr) {
			var parents = $(node).parents();
			parents = parents.add(node);
			for (var i = 0; i < parents.length; i++) {
				var p = $(parents[i]);
				if (p.css("opacity") === "0") return false;
				if (p.css("visibility") === "hidden") return false;
				if (p.css("height") === "0px" && p.css("overflow-y") == "hidden") return false;
				if (!p.is(":visible")) return false;
			}
			return true;
		},
	});

	/**
	 * Creates a virtual DOM and then compares contents before rendering. If the contents
	 * are the same then no rendering is done. This prevents flicker. React style.
	 *
	 * Designed to be used as a helper method for the included {@link WebComponents}. A full tutorial on how to work with and customize the Web Components can be found here: {@tutorial Web Component Interface}
	 *
	 */
	jQuery.fn.extend({
		parentsAndMe: function (arg1) {
			var us = $(this).parents();
			us = us.add($(this));
			return us;
		},
		cqvirtual: function (arg1) {
			var virtual = this.clone();
			virtual.empty();
			virtual.original = this;
			return virtual;
		},
		cqrender: function (arg1) {
			if (this[0].innerHTML == this.original[0].innerHTML) return this.original;
			this.original.empty();
			var children = this.children();
			if (children.length) {
				var newStuff = children.detach();
				this.original.append(newStuff);
			}

			return this.original;
		},
		// Returns a guaranteed width. For instance, cq-context or any other wrapping tag can have
		// a width of zero, so we need to go one level up to get the actual width
		guaranteedWidth: function () {
			var node = this;
			var w = node.width();
			while (!w) {
				node = node.parent();
				if (node[0].tagName === "BODY" || node[0] === window) {
					return window.innerWidth;
				}
				w = node.width();
			}
			return w;
		},
		// See guaranteedWidth
		guaranteedHeight: function () {
			var node = this;
			var h = node.height();
			while (!h) {
				node = node.parent();
				if (node[0].tagName === "BODY" || node[0] === window) {
					return window.innerHeight;
				}
				h = node.height();
			}
			return h;
		},
		emptyExceptTemplate: function () {
			this.children().not("template").remove();
			return this;
		},
		// Returns true if an attribute exists, or is not explicitly set to false
		truthyAttr: function (arg1) {
			var val = this.attr(arg1);
			if (typeof val == "undefined") return false;
			if (val.toLowerCase() == "false") return false;
			if (val == "0") return false;
			return true;
		},
		// More efficient because it doesn't change the DOM unless it needs to. Returns true
		// if a change was made. Note that this does not support jquery chaining!
		attrBetter: function (attribute, value) {
			if (typeof value == "undefined") value = "true";
			var val = this.attr(attribute);
			if (val === value) return false;
			this.attr(attribute, value);
			return true;
		},
		// More efficient because it doesn't change the DOM unless it needs to. Returns true
		// if a change was made. Note that this does not support jquery chaining!
		removeAttrBetter: function (attribute) {
			var val = this.attr(attribute);
			if (!val && val !== "") return false;
			this.removeAttr(attribute);
			return true;
		},
		// More efficient because it doesn't change the DOM unless it needs to. Returns true
		// if a change was made. Note that this is a setter function only. It is not meant to replace
		// the getter aspect of jquery's built in text()
		textBetter: function (str) {
			if (this.text() === str) return false;
			this.text(str);
			return true;
		},
	});

	jQuery.queryString = function (sParam) {
		var sPageURL = window.location.search.substring(1);
		var sURLVariables = sPageURL.split("&");
		for (var i = 0; i < sURLVariables.length; i++) {
			var sParameterName = sURLVariables[i].split("=");
			if (sParameterName[0] == sParam) return sParameterName[1];
		}
		return null;
	};

	/*
	 * http://www.backalleycoder.com/2013/03/18/cross-browser-event-based-element-resize-detection/
	 */

	(function () {
		var attachEvent = document.attachEvent;
		var isIE = navigator.userAgent.match(/Trident/);
		var requestFrame = (function () {
			var raf =
				window.requestAnimationFrame ||
				window.mozRequestAnimationFrame ||
				window.webkitRequestAnimationFrame ||
				function (fn) {
					return setTimeout(fn, 20);
				};
			return function (fn) {
				return raf(fn);
			};
		})();

		var cancelFrame = (function () {
			var cancel =
				window.cancelAnimationFrame ||
				window.mozCancelAnimationFrame ||
				window.webkitCancelAnimationFrame ||
				window.clearTimeout;
			return function (id) {
				return cancel(id);
			};
		})();

		function resizeListener(e) {
			var win = e.target || e.srcElement;
			if (win.__resizeRAF__) cancelFrame(win.__resizeRAF__);
			win.__resizeRAF__ = requestFrame(function () {
				var trigger = win.__resizeTrigger__;
				trigger.__resizeListeners__.forEach(function (fn) {
					fn.call(trigger, e);
				});
			});
		}

		function objectLoad(e) {
			this.contentDocument.defaultView.__resizeTrigger__ = this.__resizeElement__;
			this.contentDocument.defaultView.addEventListener("resize", resizeListener);
		}

		/**
		 * Attaches a callback to listen for resize events on the DOM.
		 *
		 * Designed to be used as a helper method for the included {@link WebComponents}. A full tutorial on how to work with and customize the Web Components can be found here: {@tutorial Web Component Interface}
		 *
		 * @param {node} element
		 * @param {function} callback
		 * @memberof CIQ
		 */
		CIQ.addResizeListener = function (element, fn) {
			var uiManager = $("cq-ui-manager");
			if (uiManager.length > 0) {
				uiManager = uiManager[0];
				uiManager.registerForResize(element);
			}
			if (!element.__resizeListeners__) {
				element.__resizeListeners__ = [];
				if (attachEvent) {
					element.__resizeTrigger__ = element;
					element.attachEvent("onresize", resizeListener);
				} else {
					//if (!getComputedStyle(element) || getComputedStyle(element).position == 'static') element.style.position = 'relative';
					var obj = (element.__resizeTrigger__ = document.createElement("object"));
					obj.setAttribute(
						"style",
						"visibility:hidden; display: block; position: absolute; top: 0; left: 0; height: 100%; width: 100%; overflow: hidden; pointer-events: none; z-index: -1; border:0px;"
					);
					obj.__resizeElement__ = element;
					obj.onload = objectLoad;
					obj.type = "text/html";
					if (isIE) element.appendChild(obj);
					obj.data = "about:blank";
					if (!isIE) element.appendChild(obj);
				}
			}
			element.__resizeListeners__.push(fn);
		};

		/**
		 * Removes an attached a callback to listen for an element.
		 *
		 * Designed to be used as a helper method for the included {@link WebComponents}. A full tutorial on how to work with and customize the Web Components can be found here: {@tutorial Web Component Interface}
		 *
		 * @param {node} element
		 * @param {function} callback
		 * @memberof CIQ
		 */
		CIQ.removeResizeListener = function (element, fn) {
			var uiManager = $("cq-ui-manager");
			if (uiManager.length > 0) {
				uiManager = uiManager[0];
				uiManager.unregisterForResize(element);
			}
			element.__resizeListeners__.splice(element.__resizeListeners__.indexOf(fn), 1);
			if (!element.__resizeListeners__.length) {
				if (attachEvent) element.detachEvent("onresize", resizeListener);
				else {
					element.__resizeTrigger__.contentDocument.defaultView.removeEventListener("resize", resizeListener);
					element.__resizeTrigger__ = !element.removeChild(element.__resizeTrigger__);
				}
			}
		};
	})();

	/**
	 * The following is a set of Web Components used in our sample templates to illustrate how the API can be leveraged to build a full featured UI to control the chart.
	 *
	 * Feel free to use them as provided or modify as needed to meet your needs. You can find all of the source code for these webComponents in `js/components.js` and `js/componentUI.js`.
	 *
	 * This implementation assumes the chart is attached to to a quotefeed for interactive data loading.
	 * If you will not be using a quotefeed, you will need to adjust these components accordingly.
	 *
	 * >Two special tags are required to run the framework:
	 * >
	 * >`cq-ui-manager` is a component that manages all menus and dialogs on the page. It does so by attaching itself to the "body" and monitoring touch & mouse events,  and then instantiating menus and dialogs. For instance, when a user taps on the screen, they expect that any open menus will be closed. This is one of the responsibilities that cq-ui-manager assumes.
	 * > <br>**One  cq-ui-manager tag is allowed for the entire page, even when multiple charts are instantiated. **
	 * >
	 * > `cq-context` is a special tag that "groups" a set of components to a particular chart. Any component that is nested within a cq-context will look to that context in order to find its chart. For instance, menu items within a cq-context will interact with the chart engine that is attached to the context.
	 *
	 * **Performance considerations:** These web components include dynamically updating modules that will react to every data change and redraw certain elements.
	 * Although visually pleasing, they can sometimes cause performance issues on slow devices or when multiple charts are displayed.
	 * See {@link CIQ.UI.animatePrice} for setting options.
	 *
	 * See {@link CIQ.UI.ContextTag}, which provides a model and base functionality for many components
	 *
	 * See the following tutorial for further details on how to work with and customize the included Web Components: {@tutorial Web Component Interface}
	 *
	 * @namespace WebComponents
	 */
	function WebComponents() {}

	/**
	 * Namespace for UI helper objects.
	 *
	 * Designed to be used as a helper methods for the included {@link WebComponents}. A full tutorial on how to work with and customize the Web Components can be found here: {@tutorial Web Component Interface}
	 *
	 * @namespace CIQ.UI
	 */
	CIQ.UI = {};

	/**
	 * Executes a function in the nearest parent component (container). For instance, a cq-close tag might call "close"
	 * on its containing component
	 *
	 * Designed to be used as a helper method for the included {@link WebComponents}. A full tutorial on how to work with and customize the Web Components can be found here: {@tutorial Web Component Interface}
	 *
	 * @memberof CIQ.UI
	 * @param {object} self
	 * @param  {string} fn   The name of the function
	 * @param  {Array}   args Arguments array (a "spread" is also supported)
	 */
	CIQ.UI.containerExecute = function (self, fn, args) {
		var myArgs = args;
		if (args && myArgs.constructor !== Array) myArgs = Array.prototype.slice.call(arguments, 2);
		var parents = self.node.parents();
		for (var i = 0; i < parents.length; i++) {
			var parent = parents[i];
			if (parent[fn] && parent[fn].constructor == Function) {
				return parent[fn].apply(parent, myArgs);
			}
		}
		return null;
	};

	/**
	 * Convenience function to display the changing price of a node (price flash green/red).
	 *
	 * Designed to be used as a helper method for the included {@link WebComponents}. A full tutorial on how to work with and customize the Web Components can be found here: {@tutorial Web Component Interface}
	 *
	 * This functionality can be CPU expensive if many updates per second or multiple charts on a screen exist.
	 * To disable simply set `CIQ.UI.animatePrice = function () { };`
	 * @kind function
	 * @memberof CIQ.UI
	 * @param {node} node
	 * @param {number} newPrice
	 * @param {number} oldPrice
	 */
	CIQ.UI.animatePrice = function (node, newPrice, oldPrice) {
		node.removeClass("cq-stable");
		if (newPrice > oldPrice) node.addClass("cq-up");
		else if (newPrice < oldPrice) node.addClass("cq-down");
		setTimeout(function () {
			node.addClass("cq-stable").removeClass("cq-up").removeClass("cq-down");
		}, 0);
	};

	/**
	 * Convenience function for making a new jquery node from a HTML5 template.
	 *
	 * Designed to be used as a helper method for the included {@link WebComponents}. A full tutorial on how to work with and customize the Web Components can be found here: {@tutorial Web Component Interface}
	 *
	 * @kind function
	 * @memberof CIQ.UI
	 * @param {Selector} node Selector or HTMLElement
	 * @param {Selector} [appendTo] If set, then the template will automatically be appended to this node.
	 * If appendTo==true then the new node will automatically be added in place (appended to the template's parent)
	 * @return {JQuery}      A jquery node representing what was extracted from the template
	 */
	CIQ.UI.makeFromTemplate = function (node, appendTo) {
		var jqNode = $(node);
		var n = jqNode[0].content; // regular way
		var newNode;

		function copyNodes(n) {
			return function () {
				n.appendChild(this.cloneNode(true));
			};
		}
		function appendNodes(n) {
			return function () {
				if (n === true) jqNode.parent().append(this);
				else $(n).append(this);
			};
		}

		if (!n /*IE11*/ || !n.childNodes.length /*React*/) {
			// IE11 can't read the content since <template> tag is nothing special
			// React can't read content past the document-fragment
			n = document.createElement("DIV");
			jqNode.children().each(copyNodes(n));
			newNode = n.cloneNode(true);
		} else {
			newNode = document.importNode(n, true);
		}

		var jqchildren = $(newNode).children();
		if (appendTo) jqchildren.each(appendNodes(appendTo));

		return jqchildren;
	};

	/**
	 * Utility to splits a string form function into function name and arguments
	 *
	 * Designed to be used as a helper method for the included {@link WebComponents}. A full tutorial on how to work with and customize the Web Components can be found here: {@tutorial Web Component Interface}
	 *
	 * @param  {string} cmd The string function call
	 * @return {object|null} Null or object containing helperName, functionName and args
	 * @memberof CIQ.UI
	 * @private
	 */
	CIQ.UI.splitMethod = function (cmd) {
		if (!cmd) return null;
		var openParentheses = cmd.indexOf("(");
		var closeParentheses = cmd.lastIndexOf(")");
		if (openParentheses == -1 || closeParentheses == -1) {
			console.log("malformed stxtap attribute: " + cmd);
			return null;
		}
		var helperName = null,
			functionName;
		var beforeParentheses = cmd.substring(0, openParentheses);
		var period = beforeParentheses.indexOf(".");
		if (period == -1) {
			// web component
			functionName = beforeParentheses;
		} else {
			helperName = beforeParentheses.substring(0, period);
			functionName = cmd.substring(period + 1, openParentheses);
		}
		var args = cmd.substring(openParentheses + 1, closeParentheses);
		var parsed = args.match(/('[^']+'|[^,]+)/g);
		var isFloat = new RegExp("^[0-9]+([,.][0-9]+)?$", "g");
		var isInteger = new RegExp("^\\d+$");
		var argArray = [];
		if (parsed) {
			for (var i = 0; i < parsed.length; i++) {
				var arg = parsed[i];
				while (arg.charAt(0) == " ") arg = arg.substring(1);
				if (arg.indexOf('"') != -1 || arg.indexOf("'") != -1) {
					argArray.push(arg.substring(1, arg.length - 1));
				} else if (arg == "true") {
					argArray.push(true);
				} else if (arg == "false") {
					argArray.push(false);
				} else if (arg == "null") {
					argArray.push(null);
				} else if (isInteger.test(arg)) {
					argArray.push(parseInt(arg, 10));
				} else if (isFloat.test(arg)) {
					argArray.push(parseFloat(arg));
				} else {
					var a = arg.split(".");
					var aObj = window;
					for (var b = 0; b < a.length; b++) {
						aObj = aObj[a[b]];
					}
					argArray.push(aObj);
				}
			}
		}

		return {
			helperName: helperName,
			functionName: functionName,
			args: argArray,
		};
	};

	/**
	 * Static method to create an observable.
	 *
	 * Designed to be used as a helper method for the included {@link WebComponents}. A full tutorial on how to work with and customize the Web Components can be found here: {@tutorial Web Component Interface}
	 *
	 * @param  {Object} params Parameters
	 * @param {string} [params.selector] The selector to effect the observable (adding class, setting value)
	 * @param {Object} params.obj The object to observe
	 * @param {string} [params.member] The member of the object to observe. Pass an array to observe multiple members. Or pass nothing to observe any change to the object.
	 * @param {string} [params.condition] Optional condition for the member to trigger the action
	 * @param {string} params.action The action to take. "class" - add or remove a class. "callback" - calls back with params
	 * @param {string} params.value The value for the action (i.e. class name, callback function)
	 * @memberof CIQ.UI
	 *
	 * @example - Add or remove a class based on whether stx.layout.crosshair is true or false
	 * CIQ.UI.observe({selector:".toggle", obj:stx.layout, member:"crosshair", action:"class", value:"active"});

	 * @example - Add or remove a class based on whether stx.layout.chartType=="candle"
	 * CIQ.UI.observe({selector:".toggle", obj:stx.layout, member:"chartType", condition:"candle", action:"class", value:"active"});

	 * @example - Get a callback from a change in value
	 * CIQ.UI.observe({selector:".toggle", obj:stx.layout, member:"chartType", condition:"candle", action:"callback", value:function(params){
	 *    console.log("new value is" + params.obj[params.member]);
	 * }});

	 */
	CIQ.UI.observe = function (params) {
		var self = this;
		function observed(change) {
			var match = false;
			if (!params.member) {
				// wildcard
				match = true;
			} else if (change.name === params.member) {
				match = true;
			} else if (params.member.constructor == Array) {
				for (var i = 0; i < params.member.length; i++) {
					if (change.name === params.member[i]) match = true;
				}
			}
			if (match) {
				var nodes = $(params.selector);
				if (!nodes.length && params.action === "callback") {
					// simple callback not associated with a selector
					params.value.call(self, params);
					return;
				}
				if (params.action === "class") nodes.removeClass(params.value);
				nodes.each(function () {
					var isTrue = false;
					if (params.member) {
						if (params.condition) {
							if (params.obj[params.member] === params.condition) isTrue = true;
						} else {
							isTrue = params.obj[params.member];
						}
					}
					if (params.action === "class") {
						if (isTrue) nodes.addClass(params.value);
					}
					if (params.action === "callback") {
						params.value.call(self, params, this);
					}
					if (params.action === "value") {
						if (params.value) {
							this.value = params.value;
						} else {
							if (!params.obj[params.member]) this.value = "";
							else this.value = params.obj[params.member];
						}
					}
				});
			}
		}

		Object.observe(
			params.obj,
			function (changes) {
				changes.forEach(observed);
			},
			["update", "add", "delete"]
		);
		observed({ name: params.member }); // initialize
	};

	/**
	 * Utility function that returns all contexts on the screen.
	 *
	 * Designed to be used as a helper method for the included {@link WebComponents}. A full tutorial on how to work with and customize the Web Components can be found here: {@tutorial Web Component Interface}
	 *
	 * @return {JQuery} A jquery node with all contexts
	 */
	CIQ.UI.allContexts = function () {
		return $("cq-context,*[cq-context]");
	};

	/**
	 * Utility to get the context for a tag.
	 *
	 * Designed to be used as a helper method for the included {@link WebComponents}. A full tutorial on how to work with and customize the Web Components can be found here: {@tutorial Web Component Interface}
	 *
	 * It traverses up the parent stack looking for a parent with a context member, or the actual cq-context. If no context can be found then returns null.
	 * @param  {HTMLElement} me The element to get the context for
	 * @return {CIQ.UI.Context}    The context or null if none found
	 */
	CIQ.UI.getMyContext = function (me) {
		var nodes = $(me).parentsAndMe();
		for (var i = 0; i < nodes.length; i++) {
			var node = nodes[i];
			if (node.context) return node.context;
			if (node.CIQ && node.CIQ.UI) return node.CIQ.UI.context;
		}
		return null;
	};
	/**
	 * Utility to run a function across all contexts.
	 *
	 * Designed to be used as a helper method for the included {@link WebComponents}. A full tutorial on how to work with and customize the Web Components can be found here: {@tutorial Web Component Interface}
	 *
	 * "this" will be set to the context.
	 * @param  {Function} func Function to run
	 * @example
	 *  CIQ.UI.contextsForEach(function(){
	 *  	this.stx.doSomething();
	 *  });
	 */
	CIQ.UI.contextsForEach = function (func) {
		var contexts = CIQ.UI.allContexts();
		contexts.each(function () {
			func.apply(this.CIQ.UI.context);
		});
	};

	CIQ.UI.release = false;

	/**
	 * Set this flag to true to bypass bindings when adding a component to the DOM.
	 *
	 * Designed to be used with the included {@link WebComponents}. A full tutorial on how to work with and customize the Web Components can be found here: {@tutorial Web Component Interface}
	 *
	 * For instance when components are created by html2canvas we don't want them to do any heavy lifting.
	 * @type {Boolean}
	 */
	CIQ.UI.bypassBindings = false;

	/**
	 * Starts the UI.
	 *
	 * Designed to be used as a helper method for the included {@link WebComponents}. A full tutorial on how to work with and customize the Web Components can be found here: {@tutorial Web Component Interface}
	 *
	 * @param {Function} [cb] Optional callback returns when web components are initialized
	 */
	CIQ.UI.begin = function (cb) {
		CIQ.UI.release = true;
		setTimeout(function () {
			BaseComponent.nextTick();
			if (cb) cb();
		}, 0); // release the bindings
	};

	/**
	 * Utility method for adding multiple inheritances to a base object.
	 *
	 * Designed to be used as a helper method for the included {@link WebComponents}. A full tutorial on how to work with and customize the Web Components can be found here: {@tutorial Web Component Interface}
	 *
	 * @param {Object} target Target object
	 * @param {Object} source Source object
	 */
	CIQ.UI.addInheritance = function (target, source) {
		// We put this in a catch loop because BaseComponent is itself an HTMLElement and the browser barfs on trying to copy some
		// of those values
		for (var key in source.prototype) {
			try {
				target.prototype[key] = source.prototype[key];
			} catch (e) {}
		}
	};

	var inputTypesSupported = {};
	/**
	 * Utility method for checking if an HTML5 input type is supported.
	 *
	 * Designed to be used as a helper method for the included {@link WebComponents}. A full tutorial on how to work with and customize the Web Components can be found here: {@tutorial Web Component Interface}
	 *
	 * Will return the type passed in if it's supported, or a fallback type if it is not.
	 * @param {String} type HTML5 input type to be tested
	 * @return {String} The supported input type, or the fallback input type (usually "text").
	 * @memberof CIQ.UI
	 * @since 6.3.0
	 */
	CIQ.UI.supportedInputType = function (type) {
		if (!inputTypesSupported[type]) {
			// https://stackoverflow.com/questions/10193294/how-can-i-tell-if-a-browser-supports-input-type-date
			var input = document.createElement("input");
			input.setAttribute("type", type);
			inputTypesSupported[type] = input.type;
		}
		return inputTypesSupported[type];
	};

	/**
	 * UI context helper class.
	 *
	 * Designed to be used as a helper method for the included {@link WebComponents}. A full tutorial on how to work with and customize the Web Components can be found here: {@tutorial Web Component Interface}
	 *
	 * Construct with an {@link CIQ.ChartEngine} object
	 * @param {CIQ.ChartEngine} stx The chart object to associate this UI
	 * @param {HTMLElement} topNode The top node of the DOM tree for this context. That node should contain
	 * all of the UI elements associated with the CIQ.ChartEngine
	 * @param {object} [params] Optional parameters
	 * @name CIQ.UI.Context
	
	 */
	var Context = (CIQ.UI.Context = function (stx, topNode, params) {
		this.params = params ? params : {};
		this.stx = stx;
		topNode = this.topNode = $(topNode)[0];
		this.node = $(this.topNode);
		if (CIQ.isMobile) topNode.setAttribute("ciq-mobile", "");
		var storage = CIQ.UI.Context.assembleContext(topNode);
		this.advertised = {};
		topNode.CIQ.UI.context = this;
		// Search through all of the components that have registered themselves. Call setContext() on each
		// so that they can get their context. This usually initializes and makes the component active.
		for (var i = 0; i < storage.Components.length; i++) {
			storage.Components[i].setContextPrivate(this);
		}
	});

	/**
	 * The DOM tag for a context that needs some storage.
	 *
	 * Designed to be used as a helper method for the included {@link WebComponents}. A full tutorial on how to work with and customize the Web Components can be found here: {@tutorial Web Component Interface}
	 *
	 * ContextTag components register themselves by placing themselves in this storage.
	 * This method creates that storage, if it hasn't already been created.
	 * @param  {HTMLElement} contextElement The context node
	 * @returns {object} The storage object
	 * @private
	 */
	Context.assembleContext = function (contextElement) {
		if (!contextElement.CIQ) contextElement.CIQ = {}; // claim our namespace
		if (!contextElement.CIQ.UI) contextElement.CIQ.UI = {};
		if (!contextElement.CIQ.UI.Components) contextElement.CIQ.UI.Components = [];
		return contextElement.CIQ.UI;
	};

	/**
	 * Abstract method that should be overridden. See example.
	 *
	 * Designed to be used as a helper method for the included {@link WebComponents}. A full tutorial on how to work with and customize the Web Components can be found here: {@tutorial Web Component Interface}
	 *
	 * @param  {Object} data A symbol data object acceptable for {@link CIQ.ChartEngine#loadChart}
	 * @memberof CIQ.UI.Context
	 * @alias changeSymbol
	 * @example
	UIContext.changeSymbol=function(data){
		var stx=this.stx;
		if(this.loader) this.loader.show();
		if(data.symbol==data.symbol.toLowerCase())
			data.symbol=data.symbol.toUpperCase(); // set a pretty display version


		// reset comparisons - remove this loop to transfer from symbol to symbol.
		for(var field in stx.chart.series) {
			// keep studies
			if (stxx.chart.series[field].parameters.bucket != "study" ) stx.removeSeries(field);
		}

		var self=this;
		stx.loadChart(data, function(err) {
			if(err){
				// add 'symbol not found error' here if one needed.
				if(self.loader) self.loader.hide();
				return;

			}
			if(self.loader) self.loader.hide();
			restoreDrawings(stx, stx.chart.symbol);
		});
	};
	 *
	 */
	Context.prototype.changeSymbol = function (data) {
		console.log("Please implement CIQ.UI.Context.prototype.changeSymbol");
	};

	/**
	 * Sets the [lookup driver]{@link CIQ.ChartEngine.Driver.Lookup} to be used with the [cq-lookup web component]{@link WebComponents.cq-lookup}.
	 *
	 * Designed to be used as a helper method for the included {@link WebComponents}. A full tutorial on how to work with and customize the Web Components can be found here: {@tutorial Web Component Interface}
	 *
	 * The lookup driver will be called to search for matching symbols as data is typed into the set `UIContext.UISymbolLookup` field.
	 *
	 * See `function startUI()` in sample-template-advanced.html for complete sample implementation.
	 *
	 * @param {CIQ.ChartEngine.Driver.Lookup} driver Lookup driver for cq-lookup component
	 * @memberof CIQ.UI.Context
	 * @alias setLookupDriver
	 * @example
	 * UIContext=new CIQ.UI.Context(stxx, $("cq-context,[cq-context]"));
	 * UIContext.setLookupDriver(new CIQ.ChartEngine.Driver.Lookup.ChartIQ());
	 * UIContext.UISymbolLookup=$(".ciq-search cq-lookup")[0];
	 * UIContext.UISymbolLookup.setCallback(function(context, data){
	 *	context.changeSymbol(data);
	 * });
	 */
	Context.prototype.setLookupDriver = function (driver) {
		this.lookupDriver = driver;
		if (driver.deprecated)
			console.warn("Using deprecated Lookup Driver, please see documentation: CIQ.ChartEngine.Driver.Lookup");
	};

	/**
	 * Attaches a Helper to the context, so that it can be found later on.
	 *
	 * Designed to be used as a helper method for the included {@link WebComponents}. A full tutorial on how to work with and customize the Web Components can be found here: {@tutorial Web Component Interface}
	 *
	 * @param {CIQ.UI.Helper} uiHelper A UI Helper to attach
	 * @param {string} helperName The helperName of the element. For instance "Loader"
	 * @memberof CIQ.UI.Context
	 * @alias advertiseAs
	 */
	Context.prototype.advertiseAs = function (uiHelper, helperName) {
		this.advertised[helperName] = uiHelper;
	};

	/**
	 * Finds the nearest (parent) node that contains the class (CIQ.UI.Element type) referenced by an stxtap attribute.
	 *
	 * Designed to be used as a helper method for the included {@link WebComponents}. A full tutorial on how to work with and customize the Web Components can be found here: {@tutorial Web Component Interface}
	 *
	 * Returns `null` if none found.
	 * @param  {string} helperName The type of UI Helper to look for
	 * @return {Array.CIQ.UI.Helper} The associated array of helpers or null if none found
	 * @memberof CIQ.UI.Context
	 * @private
	 */
	Context.prototype.getAdvertised = function (helperName) {
		return this.advertised[helperName];
	};

	/**
	 * Attaches a loader to a UI context.
	 *
	 * Designed to be used as a helper method for the included {@link WebComponents}. A full tutorial on how to work with and customize the Web Components can be found here: {@tutorial Web Component Interface}
	 *
	 * @param {CIQ.UI.Loader} loader Loader instance
	 * @memberof CIQ.UI.Context
	 * @alias setLoader
	 */
	Context.prototype.setLoader = function (loader) {
		this.loader = loader;
	};

	/**
	 * Checks if the context in modal mode.
	 *
	 * Designed to be used as a helper method for the included {@link WebComponents}. A full tutorial on how to work with and customize the Web Components can be found here: {@tutorial Web Component Interface}
	 *
	 * @return {Boolean} true if in modal mode
	 * @memberof CIQ.UI.Context
	 * @alias isModal
	 */
	Context.prototype.isModal = function () {
		return this.stx.openDialog !== "";
	};

	/**
	 * Abstract class for {@link WebComponents} using this framework
	 *
	 * Provides a base set of functionality for web components
	 *
	 * @see {@link WebComponents}
	 * @memberof CIQ.UI
	 * @namespace BaseComponent
	 * @type {HTMLElement}
	 */
	class BaseComponent extends HTMLElement {
		constructor() {
			super();
			this.node = $(this);
		}

		/**
		 * Called automatically when a tag is instantiated
		 * @kind function
		 * @memberof CIQ.UI.BaseComponent
		 * @private
		 */
		connectedCallback() {
			if (this.attached) return;
			// "this" will be the instance of the tag that extends BaseComponent.
			BaseComponent.buildReverseBindings(this);
			this.attached = true;
		}

		/**
		 * Called automatically when a tag is removed from the DOM.
		 * @kind function
		 * @memberOf CIQ.UI.BaseComponent
		 * @private
		 */
		disconnectedCallback() {
			this.attached = false;
		}

		/**
		 * Locates the nearest UI helper for the given attribute. If none exists then it is created at the topNode.
		 *
		 * Designed to be used as a helper method for the included {@link WebComponents}. A full tutorial on how to work with and customize the WebComponents can be found here: {@tutorial Web Component Interface}
		 *
		 * @param  {HTMLElement} node    The node with either stxbind or stxtap attribute
		 * @param {string} [binding] The type of binding or helper name being looked for, otherwise the stxbind and then stxtap attributes are queried
		 * @param {string} attribute Either "stxtap" or "stxbind". Only required if binding==null.
		 * @return {CIQ.UI.Helper}     A UI helper object
		 * @memberof CIQ.UI.BaseComponent
		 */
		static getHelper(node, binding, attribute) {
			if (!node) return;
			node = $(node)[0];
			if (!binding) {
				binding = node.getAttribute(attribute);
				if (!binding) return null;
			}
			var helper;
			var paren = binding.indexOf("(");
			var beforeParen = binding.substring(0, paren);
			var period = binding.indexOf(".");
			if (paren == -1 || beforeParen.indexOf(".") != -1) {
				// Layout or Layout.Chart or Layout.Chart('blah')
				var helperName = period === -1 ? binding : binding.substring(0, period);
				var context = node.context;
				if (!context) {
					if (!node.context) node.context = CIQ.UI.getMyContext(node);
					context = node.context;
				}
				if (!context) {
					console.log("No context attached to " + node.tagName + ". A context is required when binding to a helper.");
					return null;
				}
				helper = context.getAdvertised(helperName);
			} else {
				// bind to nearest web component // chart()
				var f = binding.substring(0, paren);
				var parents = $(node).parents();
				for (var i = 0; i < parents.length; i++) {
					var component = parents[i];
					if (typeof component[f] == "function") {
						return component;
					}
				}
			}
			return helper;
		}

		/**
		 * Activates an element that was tapped on via the stxtap attribute.
		 *
		 * Designed to be used as a helper method for the included {@link WebComponents}. A full tutorial on how to work with and customize the WebComponents can be found here: {@tutorial Web Component Interface}
		 *
		 * The contents of stxtap should be the name of a class derived from {@link CIQ.UI.Element}, a member function of that class and the arguments.
		 *
		 * The DOM tree will be searched for an instance of that class.
		 * If one cannot be found, then an instance will be created on the spot.
		 * The instance itself should attach itself if it wants to be re-used.
		 * @param  {HTMLElement} node The node that was tapped
		 * @param {Event} e The event that triggered the function
		 * @param {Object} [params] Optional object to send as last argument
		 * @param {Boolean} [setter] If true then use stxsetget instead of stxtap
		 * @memberof CIQ.UI.BaseComponent
		 * @private
		 */
		static activate(node, e, params, setter) {
			var attribute = setter ? "stxsetget" : "stxtap";
			var method = CIQ.UI.splitMethod(node.getAttribute(attribute));
			if (!method) return;
			var helperName = method.helperName;
			var f = method.functionName;
			if (setter) f = "set" + f;
			// All helper methods take the node that was activated as the first argument
			var argArray = [{ node: node, e: e, params: params }].concat(method.args);

			if (helperName) {
				var helper = BaseComponent.getHelper(node, null, attribute);

				if (!helper[f]) {
					console.log("Method '" + f + "' not found in helper", helper);
					return;
				}
				helper[f].apply(helper, argArray);
			} else {
				// Look for nearest parent web component that contains our desired activation function
				var parents = $(node).parents();
				for (var j = 0; j < parents.length; j++) {
					var component = parents[j];
					if (typeof component[f] === "function") {
						component[f].apply(component, argArray);
					}
				}
			}
		}

		/**
		 * We need to attach a safeClickTouch.
		 *
		 * Designed to be used as a helper method for the included {@link WebComponents}. A full tutorial on how to work with and customize the WebComponents can be found here: {@tutorial Web Component Interface}
		 *
		 * @param  {HTMLElement}   node The element to attach a tap event to
		 * @param  {Function} cb   The callback when tapped
		 * @memberof CIQ.UI.BaseComponent
		 * @private
		 */
		makeTap(node, cb) {
			BaseComponent.makeTap(node, cb);
		}

		static makeTap(node, cb) {
			node.selectFC = cb;
			$(node).stxtap(cb);
		}

		/**
		 * Set bindings for a node that has been created dynamically. The attribute can be either "stxbind", "stxtap" or "stxsetget".
		 * @memberof CIQ.UI.BaseComponent
		 * @deprecated
		 * @see {@link CIQ.UI.BaseComponent.bindNode}
		 */
		static bind(node, params) {
			console.warn(
				"CIQ.UI.BaseComponent#bind will deprecated in a future release.\n If you to to bind anything use CIQ.UI.BaseComponent.bindNode() instead"
			);
			this.bindNode(node, params);
		}

		/**
		 * Set bindings for a node that has been created dynamically. The attribute can be either "stxbind", "stxtap" or "stxsetget".
		 *
		 * Designed to be used as a helper method for the included {@link WebComponents}. A full tutorial on how to work with and customize the WebComponents can be found here: {@tutorial Web Component Interface}
		 *
		 * In the case of stxsetget, a "set" and "get" will be prepended to the bound method.
		 * <Helper>.getXxxxx() will be called once during this initialization. That method should set up a binding.
		 *
		 * When tapping (or changing value in the case of an input field) <Helper>.setXxxx() will be called.
		 *
		 * bindings in web components will search for the nearest parent component that contains the expected function:
		 * @example
		 * stxtap="tool('gartley')" // Will look for the next parent with method "tool"
		 *
		 * To explicitly target a web component, use a prefix
		 * @example
		 * stxtap="DrawingToolbar.tool('gartley')"
		 *
		 * @param  {HTMLElement} node      The node to bind
		 * @param {Object} [params] Optional parameters that will be passed as final argument
		 * @memberof CIQ.UI.BaseComponent
		 * @since 7.0.0 Previously {@link CIQ.UI.BaseComponent#bind}
		 */
		static bindNode(node, params) {
			node = $(node)[0]; // If jquery, convert to raw HTMLElement
			var helper;
			var binding = node.getAttribute("stxbind");
			var tap = node.getAttribute("stxtap");
			var setget = node.getAttribute("stxsetget");

			// One way binding
			function bindHelper(helper) {
				var method;
				var paren = binding.indexOf("(");
				method = binding.substring(binding.indexOf(".") + 1);
				if (paren !== -1) {
					method = binding.substring(0, paren);
				}
				if (helper) helper[method](node);
			}
			if (binding && binding !== "") {
				helper = BaseComponent.getHelper(node, binding, "stxbind");
				bindHelper(helper);
			}

			// "tap" binding
			function closure(node) {
				return function (e) {
					// BaseComponent.e=e;
					BaseComponent.activate(node, e, params, false);
				};
			}
			if (tap && tap !== "") {
				if (node.tagName == "INPUT" && (node.type === "text" || node.type === "number")) {
					BaseComponent.inputEntry(node, closure(node));
				} else {
					BaseComponent.makeTap(node, closure(node));
				}
			}

			// Setter/Getter binding
			function setGetHelper(helper) {
				function createSetter() {
					return function (e) {
						// BaseComponent.e=e;
						BaseComponent.activate(node, e, params, true);
					};
				}
				var method = CIQ.UI.splitMethod(setget);
				if (!method) {
					console.log("Syntax error " + setget);
					return;
				}
				var argArray = [node].concat(method.args).concat(params);
				if (helper) helper["get" + method.functionName].apply(helper, argArray);
				if (node.type === "text" || node.type === "number") {
					BaseComponent.inputEntry(node, createSetter());
				} else {
					BaseComponent.makeTap(node, createSetter());
				}
			}
			if (setget) {
				helper = BaseComponent.getHelper(node, setget, "stxsetget");
				setGetHelper(helper);
			}
		}

		/**
		 * Schedules a node to be processed for binding. The binding will occur in the next tick, in order
		 * to provide time for the DOM to be completed.
		 * @param  {HTMLElement} node The node to be bound
		 * @member CIQ.UI.BaseComponent
		 * @private
		 */
		static scheduleForBinding(node, holder) {
			BaseComponent.scheduledBindings.push({ node: node, parentTag: holder });

			// This ensures that one and only one nextTick event will occur
			if (BaseComponent.timeout) clearTimeout(BaseComponent.timeout);
			BaseComponent.timeout = setTimeout(BaseComponent.nextTick, 0);
		}

		/**
		 * We need to attach an input entry event
		 * @param  {HTMLElement}   node The element to attach input entry event to
		 * @param  {Function} cb   The callback when entered
		 * @memberof CIQ.UI.BaseComponent
		 */
		inputEntry(node, cb) {
			BaseComponent.inputEntry(node, cb);
		}

		static inputEntry(node, cb) {
			$(node).on("keypress", function (e) {
				switch (e.which) {
					case 13:
					case 9:
						cb();
				}
			});
		}

		/**
		 * Claim any keystrokes that come in. Once claimed, any keystrokes
		 * that come in will be passed to the helper. It can then choose
		 * to capture or propagate the keystrokes. This allows a helper to capture
		 * keystrokes even if it doesn't have mouse focus.
		 * @param {HTMLElement} helper The element to that should claim a keystroke
		 * @memberof CIQ.UI.BaseComponent
		 */
		addClaim(helper) {
			claims.push({ helper: helper });
		}

		/**
		 * Remove a claim on keystrokes.
		 * @param  {CIQ.UI.Helper} helper Helper or ContextTag
		 * @memberof CIQ.UI.BaseComponent
		 */
		removeClaim(helper) {
			for (var i = 0; i < claims.length; i++) {
				if (claims[i].helper === helper) {
					claims.splice(i, 1);
					return;
				}
			}
		}

		/**
		 * Travels the DOM tree and locates stxbind attributes.
		 *
		 * Designed to be used as a helper method for the included {@link WebComponents}. A full tutorial on how to work with and customize the Web Components can be found here: {@tutorial Web Component Interface}
		 *
		 * UI elements can use these to configure menus or dialogs.
		 * To effect reverse binding, set the value of the stxbind attribute to a Helper class name and data element.
		 * For instance "Layout.chartStyle".
		 * The Helper element will seek out all children with "stxtap" attribution and examine the arguments to that function call for a match.
		 * @param {HTMLElement} [traverseNode] Specify the node to traverse. Defaults to topNode for the context.
		 * @memberof CIQ.UI.BaseComponent
		 */
		static buildReverseBindings(traverseNode) {
			if (CIQ.UI.bypassBindings) return;
			var acceptFunc = function (node) {
				if (node.hasAttribute("stxbind") || node.hasAttribute("stxtap") || node.hasAttribute("stxsetget")) {
					return NodeFilter.FILTER_ACCEPT;
				}
			};

			var walker = document.createNodeIterator(
				traverseNode,
				NodeFilter.SHOW_ELEMENT,
				CIQ.isIE ? acceptFunc : { acceptNode: acceptFunc },
				false
			);

			var node;

			node = walker.nextNode();
			while (node) {
				BaseComponent.scheduleForBinding(node, traverseNode);
				node = walker.nextNode();
			}
		}

		/**
		 * Static method. Gets called once and only once per DOM processing cycle, and only
		 * if it's been triggered by a call to scheduledForBinding.
		 * @private
		 * @static
		 * @member CIQ.UI.BaseComponent
		 */
		static nextTick() {
			if (!CIQ.UI.release) return; // UI hasn't started yet
			clearTimeout(BaseComponent.timeout);
			var scheduledBindings = BaseComponent.scheduledBindings;
			// We traverse through the bindings backwards which ensures that we attempt to bind to the closest
			// web component ancestor to the actual binding.
			for (var i = scheduledBindings.length - 1; i >= 0; i--) {
				var binding = scheduledBindings[i];
				if (binding.node.ciqAlreadyBound) continue; // a node can only be bound once in it's lifetime
				BaseComponent.bindNode(binding.node, { parent: binding.parentTag });
				binding.node.ciqAlreadyBound = true;
			}
		}
	}

	BaseComponent.scheduledBindings = [];

	CIQ.UI.BaseComponent = BaseComponent;

	/**
	 * Abstract class for web components that use a {@link CIQ.UI.Context} in order to gain access to a ChartEngine
	 * @see {@link WebComponents}
	 * @memberof CIQ.UI
	 * @namespace ContextTag
	 * @type {HTMLElement}
	 */
	class ContextTag extends BaseComponent {
		constructor() {
			super();
			this.injections = [];
		}

		/**
		 * Convenience function that creates an array of injections for the component and sets a variable of node equal to self.
		 *
		 * Designed to be used as a helper method for the included {@link WebComponents}. A full tutorial on how to work with and customize the WebComponents can be found here: {@tutorial Web Component Interface}
		 *
		 * @kind function
		 * @memberof CIQ.UI.ContextTag
		 */
		connectedCallback() {
			if (this.attached) return;
			this.setContextHolder();
			super.connectedCallback();
		}

		/**
		 * Removes all the the injections for a context tag and resets the tag to its default state.
		 *
		 * Designed to be used as a helper method for the included {@link WebComponents}. A full tutorial on how to work with and customize the WebComponents can be found here: {@tutorial Web Component Interface}
		 *
		 * @kind function
		 * @memberof CIQ.UI.ContextTag
		 */
		disconnectedCallback() {
			if (this.context && this.injections) {
				for (var i = 0; i < this.injections.length; i++) {
					this.context.stx.removeInjection(this.injections[i]);
				}
				this.injections = [];
			}
		}

		/**
		 * Stores the component in the contextHolder so that when the context
		 * is started it knows that this tag is contextual.
		 *
		 * Designed to be used as a helper method for the included {@link WebComponents}. A full tutorial on how to work with and customize the WebComponents can be found here: {@tutorial Web Component Interface}
		 *
		 * @kind function
		 * @memberof CIQ.UI.ContextTag
		 */
		setContextHolder() {
			var nearestContext = this.node.parents("cq-context,*[cq-context]");
			if (!nearestContext.length) {
				console.log("No cq-context found for " + this.tagName);
				return;
			}
			var contextElement = nearestContext[0];
			var storage = Context.assembleContext(contextElement);
			storage.Components.push(this);

			// This will only get called for components that are generated dynamically, after a context
			// has already been established
			if (storage.context) this.setContextPrivate(storage.context);
		}

		/**
		 * This is called for every registered component when the context is constructed. You can override
		 * this as an initialization.
		 * @kind function
		 * @memberof CIQ.UI.ContextTag
		 * @param {CIQ.UI.Context} context The context
		 */
		setContext(context) {
			/* override me */
		}

		/**
		 * @kind function
		 * @memberof CIQ.UI.ContextTag
		 * @param {CIQ.UI.Context} context The context
		 * @private
		 */
		setContextPrivate(context) {
			this.context = context;
			this.uiManager = $("cq-ui-manager");
			if (this.uiManager.length > 0) this.uiManager = this.uiManager[0];

			var node = $(this);
			if (typeof node.attr("cq-marker") != "undefined") {
				node.detach();
				this.marker = new CIQ.Marker({
					stx: context.stx,
					node: node[0],
					xPositioner: "none",
					yPositioner: "none",
					permanent: true,
				});
			}
			setTimeout(
				(function (s, c) {
					return function () {
						s.setContext(c);
					};
				})(this, context)
			);
		}

		/**
		 *
		 * @kind function
		 * @memberof CIQ.UI.ContextTag
		 * @param {string} position Where in the animation loop the injection should be added. Append or Prepend.
		 * @param {string} injection What function to add the injection too
		 * @param {function} code The callback to fired when the injection occurs
		 * @private
		 */
		addInjection(position, injection, code) {
			this.injections.push(this.context.stx[position](injection, code));
		}
	}

	CIQ.UI.ContextTag = ContextTag;

	/**
	 * A tag that is modally aware of the chart
	 *
	 * Inherits {@link CIQ.UI.ContextTag}
	 * @namespace CIQ.UI.ModalTag
	 * @memberof CIQ.UI
	 * @private
	 */
	class ModalTag extends ContextTag {
		constructor() {
			super();
		}

		/**
		 *
		 * @kind function
		 * @memberof CIQ.UI.ModalTag
		 * @private
		 */
		connectedCallback() {
			if (this.attached) return;
			var node = $(this);
			var self = this;
			node.mouseover(function () {
				self.modalBegin();
			});
			node.mouseout(function () {
				self.modalEnd();
			});
			super.connectedCallback();
		}

		/**
		 *
		 * @kind function
		 * @memberof CIQ.UI.ModalTag
		 * @private
		 */
		modalBegin() {
			if (!this.context) return;
			this.context.stx.modalBegin();
		}

		/**
		 *
		 * @kind function
		 * @memberof CIQ.UI.ModalTag
		 * @private
		 */
		modalEnd() {
			if (!this.context) return;
			if (this.uiManager.activeMenuStack.length) return; // If an active menu then don't turn off the modal. Let uiManager handle it.
			this.context.stx.modalEnd();
		}
	}

	CIQ.UI.ModalTag = ModalTag;

	/**
	 * A tag that is inside of a cq-dialog.
	 *
	 * Designed to be used as a helper method for the included {@link WebComponents}. A full tutorial on how to work with and customize the Web Components can be found here: {@tutorial Web Component Interface}
	 *
	 * Inherits {@link CIQ.UI.BaseComponent}
	 * @namespace CIQ.UI.DialogContentTag
	 * @memberof CIQ.UI
	 */

	class DialogContentTag extends BaseComponent {
		constructor() {
			super();
		}

		/**
		 * Close the dialog
		 *
		 * Designed to be used as a helper method for the included {@link WebComponents}. A full tutorial on how to work with and customize the WebComponents can be found here: {@tutorial Web Component Interface}
		 *
		 */
		close() {
			this.node.parents("cq-dialog")[0].close();
			this.node.find("cq-swatch").each(function () {
				if (this.colorPicker) this.colorPicker.close();
			});
		}

		/**
		 * Opens the parent dialog.
		 *
		 * Designed to be used as a helper method for the included {@link WebComponents}. A full tutorial on how to work with and customize the WebComponents can be found here: {@tutorial Web Component Interface}
		 *
		 * @param {Object} [params] Optional params
		 * @param {CIQ.UI.Context} [params.context] Optionally pass in a context to set
		 */
		open(params) {
			if (params && params.context) this.setContext(params.context);
			var tagName = this.tagName.toLowerCase();
			this.node.closest("cq-dialog,cq-menu").each(function () {
				this.addActiveAttribute(tagName);
				this.open(params);
			});
		}

		/**
		 * Dynamically set the context for a dialog, so that it knows which chart to change when there
		 * are more than one chart on the screen.
		 * @param {CIQ.UI.Context} context The context to set
		 */
		setContext(context) {
			this.context = context;
		}
	}

	CIQ.UI.DialogContentTag = DialogContentTag;

	/**
	 * Abstract class for UI Helpers.
	 *
	 * Designed to be used as a helper method for the included {@link WebComponents}. A full tutorial on how to work with and customize the Web Components can be found here: {@tutorial Web Component Interface}
	 *
	 * @name CIQ.UI.Helper
	
	 */
	CIQ.UI.Helper = function (node, context) {
		this.node = node;
		this.context = context;
		this.injections = []; // To keep track of injections for later removal
	};

	/**
	 * Adds an injection. These will be automatically destroyed if the helper object is destroyed.
	 *
	 * Designed to be used as a helper method for the included {@link WebComponents}. A full tutorial on how to work with and customize the Web Components can be found here: {@tutorial Web Component Interface}
	 *
	 * @param {string} position  "prepend" or "append"
	 * @param {string} injection The injection name. i.e. "draw"
	 * @param {Function} code      The code to be run
	 * @memberof CIQ.UI.Helper
	 */
	CIQ.UI.Helper.prototype.addInjection = function (position, injection, code) {
		this.injections.push(this.context.stx[position](injection, code));
	};

	/**
	 * Removes injections from the ChartEngine
	 *
	 * Designed to be used as a helper method for the included {@link WebComponents}. A full tutorial on how to work with and customize the Web Components can be found here: {@tutorial Web Component Interface}
	 *
	 * @memberof CIQ.UI.Helper
	 */
	CIQ.UI.Helper.prototype.destroy = function () {
		for (var i = 0; i < this.injections.length; i++) {
			this.context.stx.removeInjection(this.injections[i]);
		}
		this.injections = [];
	};

	/**
	 * @name CIQ.UI.Lookup
	
	 * @deprecated - use {@link CIQ.ChartEngine.Driver.Lookup}
	 * @since 6.0.0 deprecated
	 */
	CIQ.UI.Lookup = function () {};

	/**
	 * @name CIQ.UI.Lookup.Driver
	
	 * @deprecated - use {@link CIQ.ChartEngine.Driver.Lookup}
	 * @since 6.0.0 deprecated
	 */
	CIQ.UI.Lookup.Driver = function () {
		this.deprecated = true;
	};

	/**
	 * @memberof CIQ.UI.Lookup.Driver
	 * @deprecated - use {@link CIQ.ChartEngine.Driver.Lookup#acceptText}
	 * @since 6.0.0 deprecated
	 */
	CIQ.UI.Lookup.Driver.prototype.acceptText = function (text, filter, maxResults, cb) {
		if (!this.cb) return;
	};

	/**
	 * @name CIQ.UI.Lookup.Driver.ChartIQ
	
	 * @deprecated use {@link CIQ.ChartEngine.Driver.Lookup.ChartIQ}
	 * @since 6.0.0 deprecated
	 */
	CIQ.UI.Lookup.Driver.ChartIQ = function (exchanges) {
		this.exchanges = exchanges;
		if (!this.exchanges)
			this.exchanges = [
				"XNYS",
				"XASE",
				"XNAS",
				"XASX",
				"INDCBSX",
				"INDXASE",
				"INDXNAS",
				"IND_DJI",
				"ARCX",
				"INDARCX",
				"forex",
			];
		this.url = "https://symbols.chartiq.com/chiq.symbolserver.SymbolLookup.service";
		this.requestCounter = 0; //used to invalidate old requests
		//t=ibm&m=10&x=[]&e=STOCKS
	};
	CIQ.UI.Lookup.Driver.ChartIQ.ciqInheritsFrom(CIQ.UI.Lookup.Driver);
	/**
	 * @memberof CIQ.UI.Lookup.Driver.ChartIQ
	 * @deprecated use {@link CIQ.ChartEngine.Driver.Lookup.ChartIQ#acceptText}
	 * @since 6.0.0 deprecated
	 */
	CIQ.UI.Lookup.Driver.ChartIQ.prototype.acceptText = function (text, filter, maxResults, cb) {
		if (filter == "FX") filter = "FOREX";
		if (isNaN(parseInt(maxResults, 10))) maxResults = 100;
		var url = this.url + "?t=" + encodeURIComponent(text) + "&m=" + maxResults + "&x=[";
		if (this.exchanges) {
			url += this.exchanges.join(",");
		}
		url += "]";
		if (filter && filter.toUpperCase() != "ALL") {
			url += "&e=" + filter;
		}

		var counter = ++this.requestCounter;
		var self = this;
		function handleResponse(status, response) {
			if (counter < self.requestCounter) return;
			if (status != 200) return;
			try {
				response = JSON.parse(response);
				var symbols = response.payload.symbols;

				var results = [];
				for (var i = 0; i < symbols.length; i++) {
					var fields = symbols[i].split("|");
					var item = {
						symbol: fields[0],
						name: fields[1],
						exchDisp: fields[2],
					};
					results.push({
						display: [item.symbol, item.name, item.exchDisp],
						data: item,
					});
				}
				cb(results);
			} catch (e) {}
		}
		CIQ.postAjax({ url: url, cb: handleResponse });
	};

	if (CIQ.Marker) {
		/**
		 * A heads up marker for displaying OHLC values on the chart.
		 *
		 * Designed to be used as a helper method for the included {@link WebComponents}. A full tutorial on how to work with and customize the Web Components can be found here: {@tutorial Web Component Interface}
		 *
		 * @name CIQ.Marker.HeadsUp
		
		 * @param {object} params
		 * @param showClass
		 */
		CIQ.Marker.HeadsUp = function (params, showClass) {
			if (!this.className) this.className = "CIQ.Marker.HeadsUp";
			CIQ.Marker.call(this, params);
			this.prevTick = null;
			this.showClass = showClass;
		};

		CIQ.Marker.HeadsUp.ciqInheritsFrom(CIQ.Marker, false);

		/**
		 * Determines the location of the HeadsUp Marker.
		 *
		 * Designed to be used as a helper method for the included {@link WebComponents}. A full tutorial on how to work with and customize the Web Components can be found here: {@tutorial Web Component Interface}
		 *
		 * @memberof CIQ.Marker.HeadsUp
		 * @param {object} params
		 */
		CIQ.Marker.HeadsUp.placementFunction = function (params) {
			function getBottomPixel(stx, panel, containerHeight, price) {
				return Math.round(containerHeight - stx.pixelFromPrice(price, panel));
			}

			var panel = params.panel;
			var chart = panel.chart;
			var stx = params.stx;
			var useHighs = stx.chart.highLowBars || stx.highLowBars[stx.layout.chartType];
			if (!params.showClass) params.showClass = "stx-show";

			for (var i = 0; i < params.arr.length; ++i) {
				var marker = params.arr[i];
				var node = $(marker.node);
				if (panel.hidden || !CIQ.ChartEngine.insideChart) {
					node.removeClass(params.showClass);
					return;
				}
				if (marker.params.x < 0 || marker.params.x >= chart.dataSet.length) {
					node.removeClass(params.showClass);
					return;
				}
				// show the hud if on, except if the crosshair is on or a drawing tool is selected
				if (stx.layout.crosshair || stx.currentVectorParameters.vectorType) {
					node.removeClass(params.showClass);
					return;
				}
				var quote = chart.dataSet[marker.params.x];
				var x = stx.pixelFromTick(marker.params.x);
				if (!quote || x < chart.left || x > chart.right) {
					node.removeClass(params.showClass);
					return;
				}
				// gap bar, hide HUD
				if (!quote[stx.chart.defaultPlotField] && quote[stx.chart.defaultPlotField] !== 0) {
					node.removeClass(params.showClass);
					return;
				}
				node.addClass(params.showClass);

				if (!marker.clientWidth) marker.clientWidth = node.width();
				if (!marker.clientHeight) marker.clientHeight = node.height();
				if (marker.clientWidth > x) {
					node.removeClass("stx-left");
					node.addClass("stx-right");
					node.css({
						left: x + "px",
						right: "auto",
					});
				} else {
					node.addClass("stx-left");
					node.removeClass("stx-right");
					node.css({
						right: stx.chart.canvasWidth - x + "px",
						left: "auto",
					});
				}

				var bottom;
				var containerHeight = marker.params.chartContainer ? stx.chart.canvasHeight : panel.bottom;
				if (useHighs) {
					bottom = getBottomPixel(
						stx,
						panel,
						containerHeight,
						stx.getBarBounds(quote)[panel.yAxis.flipped ? "low" : "high"]
					);
				} else {
					bottom = getBottomPixel(stx, panel, containerHeight, quote[stx.chart.defaultPlotField]);
				}
				// Keep below top of screen
				var top = containerHeight - bottom - marker.clientHeight + stx.top;
				if (top < 0) {
					node.addClass("stx-below");
					bottom =
						(useHighs ? getBottomPixel(stx, panel, containerHeight, stx.getBarBounds(quote).low) : bottom) -
						marker.clientHeight;
				} else {
					node.removeClass("stx-below");
				}

				var bottomPX = bottom + "px";

				if (marker.node.style.bottom != bottomPX) {
					marker.node.style.bottom = bottomPX;
				}
			}
		};
	}

	function getBottomPixel(stx, panel, containerHeight, price) {
		return Math.round(containerHeight - stx.pixelFromPrice(price, panel));
	}

	/**
	 * UI Helper that keeps the heads up display operating.
	 *
	 * Designed to be used as a helper method for the included {@link WebComponents}. A full tutorial on how to work with and customize the Web Components can be found here: {@tutorial Web Component Interface}
	 *
	 * There are three modes:
	 * - params.followMouse=true - The heads up display will follow the mouse
	 * - params.staticNode=true - The heads up will simply update a DOM node managed by you
	 * - default - The heads up will be a marker within the chart, positioned in the chart panel unless overidden
	 *
	 * @param {HtmlElement} node The node which should be the template for the heads up.
	 * @param {CIQ.UI.Context} context The context
	 * @param {Object} [params] Optional parameters
	 * @param {Boolean} [autoStart=true] If true then start the heads up on construction
	 * @param {boolean} [followMouse=false] If true then the heads up will follow the mouse. In this case, the node should be a template
	 * that will be removed from the document and then added dynamically into the chart container.
	 * @param {Boolean} [staticNode=false] If true then the node will not be added as a marker
	 * @param {string} [showClass="stx-show"] The class that will be added to display the heads up
	 * @name CIQ.UI.HeadsUp
	
	 * @since
	 * <br>&bull;  3.0.0
	 * <br>&bull;  6.0.0 now also has internationalizer support for dates. See {@link CIQ.I18N.setLocale} or {@link CIQ.I18N.localize}
	 */
	CIQ.UI.HeadsUp = function (node, context, params) {
		this.params = params ? params : {};
		if (typeof this.params.autoStart == "undefined") this.params.autoStart = true;
		this.node = $(node);
		this.node.detach();
		this.context = context;
		this.maxVolume = { lastCheckDate: null, value: 0 }; // This contains the maximum volume in the dataSet, used to generate the volume icon element
		if (this.params.autoStart) this.begin();
	};

	CIQ.UI.HeadsUp.ciqInheritsFrom(CIQ.UI.Helper);

	/**
	 * Begins the heads up operation. This uses injections to manage the contents and location of the display. See {@link CIQ.UI.HeadsUp#end} to stop
	 * the heads up.
	 * @memberof CIQ.UI.HeadsUp
	 * @private
	 */
	CIQ.UI.HeadsUp.prototype.begin = function () {
		var params;
		if (this.params.followMouse) {
			this.node.css({ top: "auto" }); // allow style.bottom to override the default top value
			params = {
				stx: this.context.stx,
				label: "headsup",
				xPositioner: "bar",
				chartContainer: true,
				x: 0,
				node: this.node[0],
			};
			this.marker = new CIQ.Marker.HeadsUp(params, this.params.showClass);
			//this.node.addClass(this.params.showClass);

			this.addInjection(
				"append",
				"handleMouseOut",
				(function (self) {
					return function () {
						self.followMouse(-1);
					};
				})(this)
			);
		} else if (this.params.staticNode) {
			// placeholder
		} else {
			this.node.css({ top: "", left: "" }); // Remove any existing styles
			params = {
				stx: this.context.stx,
				label: "headsup",
				xPositioner: "none",
				chartContainer: false,
				node: this.node[0],
			};
			$.extend(params, this.params); // Override default marker setup by passing marker parameters into CIQ.UI.HaedsUp
			this.marker = new CIQ.Marker(params);
			//this.node.addClass(this.params.showClass);
		}

		// enable the crosshairs for touch devices
		if (CIQ.isMobile) {
			this.context.stx.layout.crosshair = true;
		}

		this.calculateMaxVolume();
		this.addInjection(
			"prepend",
			"headsUpHR",
			(function (self) {
				return function () {
					self.position();
				};
			})(this)
		);
		this.addInjection(
			"append",
			"createXAxis",
			(function (self) {
				return function () {
					self.position();
				};
			})(this)
		);
		this.addInjection(
			"append",
			"createDataSet",
			(function (self) {
				return function (dontRoll, whichChart, params) {
					self.calculateMaxVolume(params.appending);
				};
			})(this)
		);
	};

	/**
	 * Stops the heads up from operating by removing injections and hiding. You can start it again by calling {@link CIQ.UI.HeadsUp#begin}.
	 * @memberOf CIQ.UI.HeadsUp
	 * @private
	 */
	CIQ.UI.HeadsUp.prototype.end = function () {
		if (CIQ.isMobile) {
			this.context.stx.layout.crosshair = false;
		}
		if (this.marker) this.marker.remove();
		this.destroy();
		this.marker = null;
	};

	/**
	 * @memberof CIQ.UI.HeadsUp
	 * @param {boolean} appending
	 * @private
	 */
	CIQ.UI.HeadsUp.prototype.calculateMaxVolume = function (appending) {
		if (!appending) this.maxVolume = { lastCheckDate: null, value: 0 };
		var dataSet = this.context.stx.chart.dataSet;
		if (!dataSet || !dataSet.length) return;
		for (var i = dataSet.length - 1; i >= 0; i--) {
			var q = dataSet[i];
			if (q.DT < this.maxVolume.lastCheckDate) break;
			if (q.Volume > this.maxVolume.value) this.maxVolume.value = q.Volume;
		}
		this.maxVolume.lastCheckDate = dataSet[dataSet.length - 1].DT;
	};

	/**
	 * Determines information inside of the HeadsUp display based on position.
	 * @memberof CIQ.UI.HeadsUp
	 * @private
	 */
	CIQ.UI.HeadsUp.prototype.position = function () {
		var stx = this.context.stx;
		var bar = stx.barFromPixel(stx.cx);
		this.tick = stx.tickFromPixel(stx.cx);
		var prices = stx.chart.xaxis[bar];
		var currentQuote = stx.chart.currentQuote;
		var plotField = stx.chart.defaultPlotField;
		var highLowBars = stx.chart.highLowBars || stx.highLowBars[stx.layout.chartType];
		if (!plotField || highLowBars) plotField = "Close";

		var node = this.node;
		var self = this;

		function formatPrice(value) {
			var numStr = "";
			var chartScale = stx.layout.chartScale,
				panel = stx.chart.panel,
				yAxis = stx.chart.yAxis;
			if (yAxis.originalPriceFormatter && yAxis.originalPriceFormatter.func) {
				numStr = yAxis.originalPriceFormatter.func(stx, panel, value);
			} else if (yAxis.priceFormatter && chartScale != "percent" && chartScale != "relative") {
				numStr = yAxis.priceFormatter(stx, panel, value);
			} else {
				numStr = stx.formatYAxisPrice(value, panel);
			}
			return numStr.replace(/(\.[0-9]*[1-9])0+$|\.0*$/, "$1");
		}

		function printValues() {
			self.timeout = null;
			node.find("cq-hu-price").text("N/A");
			node.find("cq-hu-open").text("N/A");
			node.find("cq-hu-close").text("N/A");
			node.find("cq-hu-high").text("N/A");
			node.find("cq-hu-low").text("N/A");
			node.find("cq-hu-date").text("N/A");
			node.find("cq-hu-volume").text("N/A");
			node.find("cq-volume-rollup").text("");
			function valOrNA(text) {
				return CIQ.isValidNumber(parseFloat(text)) ? text : "N/A";
			}
			if (prices) {
				if (prices.data) {
					var quote = CIQ.clone(prices.data);
					if (quote.Open === undefined) quote.Open = quote.Close;
					if (quote.High === undefined) quote.High = Math.max(quote.Open, quote.Close);
					if (quote.Low === undefined) quote.Low = Math.min(quote.Open, quote.Close);

					node.find("cq-hu-open").text(valOrNA(formatPrice(quote.Open)));
					node.find("cq-hu-price").text(valOrNA(formatPrice(quote[plotField])));
					node.find("cq-hu-close").text(valOrNA(formatPrice(quote.Close)));
					node.find("cq-hu-high").text(valOrNA(formatPrice(quote.High)));
					node.find("cq-hu-low").text(valOrNA(formatPrice(quote.Low)));

					var volume = CIQ.condenseInt(quote.Volume);
					var rollup = volume.charAt(volume.length - 1);
					if (rollup > "9") {
						volume = volume.substring(0, volume.length - 1);
						node.find("cq-volume-rollup").text(rollup.toUpperCase());
					}
					node.find("cq-hu-volume").text(volume);
					var tickDate = quote.displayDate;
					if (!tickDate) tickDate = quote.DT;
					if (stx.internationalizer) {
						if (CIQ.ChartEngine.isDailyInterval(stx.layout.interval)) {
							node.find("cq-hu-date").text(stx.internationalizer.yearMonthDay.format(tickDate));
						} else {
							node
								.find("cq-hu-date")
								.text(
									stx.internationalizer.yearMonthDay.format(tickDate) +
										" " +
										stx.internationalizer.hourMinute.format(tickDate)
								);
						}
					} else {
						if (CIQ.ChartEngine.isDailyInterval(stx.layout.interval)) {
							node.find("cq-hu-date").text(CIQ.mmddyyyy(CIQ.yyyymmddhhmm(tickDate)));
						} else {
							node.find("cq-hu-date").text(CIQ.mmddhhmm(CIQ.yyyymmddhhmmssmmm(tickDate)));
						}
					}
					var visuals = node.find("cq-volume-visual");
					if (visuals.length) {
						var relativeCandleSize = self.maxVolume.value ? quote.Volume / self.maxVolume.value : 0;
						visuals.css({ width: Math.round(relativeCandleSize * 100) + "%" });
					}
				}
				if (currentQuote && currentQuote[plotField] && self.tick == stx.chart.dataSet.length - 1) {
					node.find("cq-hu-price").text(valOrNA(stx.formatPrice(currentQuote[plotField])));
				}
			}
		}
		if (this.tick != this.prevTick || (stx.chart.dataSegment && bar == stx.chart.dataSegment.length - 1)) {
			if (this.timeout) clearTimeout(this.timeout);
			var ms = this.params.followMouse ? 0 : 0; // IE and FF struggle to keep up with the dynamic heads up.
			this.timeout = setTimeout(printValues, ms);
		}
		this.prevTick = this.tick; // We don't want to update the dom every pixel, just when we cross into a new candle
		if (this.params.followMouse) {
			if (stx.openDialog) this.tick = -1; // Turn off the headsup when a modal is on
			this.followMouse(this.tick);
		}
	};

	CIQ.UI.HeadsUp.prototype.followMouse = function (tick) {
		this.marker.params.x = tick;
		var self = this;
		self.marker.render();
	};

	CIQ.UI.DrawingEdit = DrawingEdit;

	/**
	 * UI Helper to allow drawings to be edited, cloned, or deleted with a context menu via <cq-drawing-context>.
	 *
	 * Designed to be used as a helper method for the included {@link WebComponents}. A full tutorial on how to work with and customize the Web Components can be found here: {@tutorial Web Component Interface}
	 *
	 *
	 * @name CIQ.UI.DrawingEdit
	 * @param {HTMLElement} [node=context.topNode] Automatically attaches to the top node of the context
	 * @param {CIQ.UI.Context} context The context for the chart
	
	 * @example <caption>Required DOM</caption>
	 * <cq-dialog>
	 * 	<cq-drawing-context>
	 * 		<div stxtap="DrawingEdit.text()" cq-edit-text>Text</div>
	 * 		<div stxtap="DrawingEdit.edit()">Edit</div>
	 * 		<div stxtap="DrawingEdit.clone()">Clone</div>
	 * 		<div stxtap="DrawingEdit.remove()">Delete</div>
	 * 	</cq-drawing-context>
	 * </cq-dialog>
	 *
	 * @example <caption>Edit state attribute, value is the tool name</caption>
	 * <cq-toolbar cq-drawing-edit="none"></cq-toolbar>
	 *
	 * @since 6.2.0
	 */
	function DrawingEdit(node, context) {
		var stx = context.stx;
		var $node = $(node || context.topNode);

		this.node = $node[0];
		this.context = context;
		this.editing = null;
		this.drawingContext = $("cq-drawing-context");
		this.cvpController = $node.find("cq-cvp-controller");
		this.toolbar = $node.find("cq-toolbar");
		this.toolbar.on("change", onToolbarChangeEditOrEnd(stx, this));
		this.count = stx.drawingObjects.length;

		context.advertiseAs(this, "DrawingEdit");
		stx.addEventListener("drawing", onDrawingEndEdit(this));
		stx.addEventListener("drawingEdit", onDrawingEditShowContext(this));

		$node.find("cq-toolbar .ciq-drawing-edit-only:has(.ciq-btn)").hover(onButtonHoverHighlightDrawing(stx, this));
	}

	DrawingEdit.ciqInheritsFrom(CIQ.UI.Helper);

	/**
	 * Listens for the "change" event from the <cq-toolbar> component.
	 * Applies the new currentVectorParameters to the drawing in edit mode.
	 * @param {CIQ.ChartEngine} stx
	 * @param {CIQ.UI.DrawingEdit} self
	 * @returns {Function}
	 * @private
	 */
	function onToolbarChangeEditOrEnd(stx, self) {
		return function () /* onChange */ {
			if (!self.editing) return;
			if (self.editing.name !== stx.currentVectorParameters.vectorType) {
				self.endEdit(null, "tool");
				return;
			}
			self.editing.copyConfig();
			stx.draw();
			stx.changeOccurred("vector");
		};
	}

	/**
	 * Listens for the "drawing" event from the CIQ.ChartEngine instance.
	 * Ends the edit mode when a drawing is deleted.
	 * @param {CIQ.UI.DrawingEdit} self
	 * @returns {Function}
	 * @private
	 */
	function onDrawingEndEdit(self) {
		return function (/* stx:onDrawing */ params) {
			var count = params.drawings.length;

			if (self.count !== count) {
				self.endEdit(null, "count");
				self.count = count;
			}
		};
	}

	/**
	 * Listens for the "drawingEdit" event from the CIQ.ChartEngine instance.
	 * When forceEdit is true, then edit mode is entered immediately, usually for touch devices.
	 * Otherwise, the context menu is shown by passing the event parameters directly to {CIQ.UI.DrawingEdit#showContext}.
	 * @param {CIQ.UI.DrawingEdit} self
	 * @returns {Function}
	 * @private
	 */
	function onDrawingEditShowContext(self) {
		return function (/* stx:onDrawingEdit */ params) {
			if (params.forceEdit === true) {
				self.endEdit(null, "edit");
				self.showToolbar(params.drawing);
				self.beginEdit(params.drawing);
			} else {
				self.showContext(params);
			}
		};
	}

	/**
	 * Listens for the "mouseenter" & "mouseleave" events from the done editing button.
	 * Causes the edited drawing to be highlighted on hover.
	 * @param {CIQ.ChartEngine} stx
	 * @param {CIQ.UI.DrawingEdit} self
	 * @returns {Function}
	 * @private
	 */
	function onButtonHoverHighlightDrawing(stx, self) {
		return function (/* onHover */ event) {
			var enter = event.type === "mouseenter";
			if (self.editing && self.editing.highlighted !== enter) {
				self.editing.highlighted = enter;
				stx.draw();
			}
		};
	}

	/**
	 * Show the drawing context menu at the current cursor position.
	 *
	 * Used internally by the DrawingEdit instance.
	 *
	 * @memberof CIQ.UI.DrawingEdit
	 * @param {Object} params Object directly from the "drawingEdit" event.
	 * @param {CIQ.Drawing} params.drawing The drawing to show the dialog for.
	 * @since 6.2.0
	 * @private
	 */
	DrawingEdit.prototype.showContext = function (params) {
		params.context = this.context;
		params.x = CIQ.ChartEngine.crosshairX;
		params.y = CIQ.ChartEngine.crosshairY;
		this.count = this.context.stx.drawingObjects.length; // update to avoid race conditions
		this.drawingContext.each(function () {
			this.open(params);
		});
	};

	DrawingEdit.prototype.getToolActivator = function (tool) {
		var menuitem = this.toolbar.find('cq-item[cq-tool="' + tool + '"]');
		if (!menuitem.length) menuitem = this.toolbar.find("cq-item[stxtap=\"tool('" + tool + "')\"]");
		return {
			node: menuitem[0],
		};
	};

	/**
	 * Update all instances of <cq-toolbar> and dispatch a showToolbar event.
	 * Used internally by the DrawingEdit instance.
	 *
	 * @memberof CIQ.UI.DrawingEdit
	 * @param {CIQ.Drawing} drawing The vector instance to sync with the toolbar.
	 * @since 6.2.0
	 * @private
	 */
	DrawingEdit.prototype.showToolbar = function (drawing) {
		var self = this;
		var activator = self.getToolActivator(drawing.name);
		var node = self.node;

		this.toolbar.each(function () {
			var lineWidth = drawing.lineWidth;
			var pattern = drawing.pattern;
			var isFib = drawing.parameters && drawing instanceof CIQ.Drawing.fibonacci;

			if (isFib) {
				lineWidth = drawing.parameters.fibs[0].parameters.lineWidth;
				pattern = drawing.parameters.fibs[0].parameters.pattern;
			}

			this.tool(activator, drawing.name);
			this.sync({
				lineWidth: lineWidth,
				pattern: pattern,
				annotation: {
					font: drawing.font ? CIQ.clone(drawing.font) : {},
				},
				fillColor: drawing.fillColor,
				currentColor: drawing.color,
				axisLabel: drawing.axisLabel,
			});

			self.cvpController.each(function () {
				this.sync(drawing);
			});

			// tool called the drawing initializeParameters method, so we now need to override the defaults
			if (isFib) {
				this.context.stx.currentVectorParameters.fibonacci = CIQ.clone(drawing.parameters);
			}
		});
	};

	/**
	 * Setup the given drawing for edit mode.
	 * Used internally by the DrawingEdit instance.
	 * @memberof CIQ.UI.DrawingEdit
	 * @param {CIQ.Drawing} drawing The vector instance to synchronize with currentVectorParameters.
	 * @fires CIQ.UI.DrawingEdit#drawing-edit-begin
	 * @since 6.2.0
	 * @private
	 * @example <caption>Hide elements during edit mode</caption>
	 * <cq-toolbar cq-drawing-edit="segment">
	 * 	<div class="ciq-drawing-edit-hidden">This element is hidden</div>
	 * </cq-toolbar>
	 */
	DrawingEdit.prototype.beginEdit = function (drawing) {
		// the property is enough, the editing is handled by <cq-toolbar>'s change event and the drawing copyConfig method
		this.editing = drawing;
		this.beforeEdit = drawing.serialize();
		this.toolbar.attr("cq-drawing-edit", drawing.name);

		var beginEvent = null;
		var detail = {
			drawing: drawing,
			tool: drawing.name,
		};

		if (typeof CustomEvent === "function") {
			beginEvent = new CustomEvent("drawing-edit-begin", {
				bubbles: true,
				cancelable: true,
				detail: detail,
			});
		} else {
			beginEvent = document.createEvent("CustomEvent");
			beginEvent.initCustomEvent("drawing-edit-begin", true, true, detail);
		}

		/**
		 * Drawing edit begin - the start of "edit mode" for a specific drawing.
		 *
		 * @event CIQ.UI.DrawingEdit#drawing-edit-begin
		 * @type {CustomEvent}
		 * @property {CIQ.Drawing} detail.drawing object to setup for editing
		 * @property {string} detail.tool the vector type / tool name
		 * @example <caption>Open the drawing toolbar</caption>
		 * drawingEdit.node.addEventListener('drawing-edit-begin', function(event) {
		 * 	if ($('body').hasClass('toolbar-on')) return;
		 * 	$('.ciq-draw').each(function() {
		 * 		this.priorVectorType = event.detail.tool;
		 * 		this.set(true);
		 * 	});
		 * }, false);
		 */
		this.node.dispatchEvent(beginEvent);
	};

	/**
	 * Teardown the current edit mode.
	 *
	 * Designed to be used as a helper method for the included {@link WebComponents}. A full tutorial on how to work with and customize the Web Components can be found here: {@tutorial Web Component Interface}
	 *
	 * Used internally by the DrawingEdit instance. May also be used by the UI
	 * to explicitly stop editing.
	 *
	 * @memberof CIQ.UI.DrawingEdit
	 * @param {Object} activator not used, passed by stxtap binding
	 * @param {string} action a friendly name that caused the edit mode to end
	 * @fires CIQ.UI.DrawingEdit#drawing-edit-end
	 * @example <caption>Button to manually end edit mode</caption>
	 * <div class="ciq-drawing-edit-only" cq-section>
	 * 	<div class="ciq-btn" stxtap="DrawingEdit.endEdit('close')">Done Editing</div>
	 * </div>
	 *
	 * @since 6.2.0
	 */
	DrawingEdit.prototype.endEdit = function (activator, action) {
		var stx = this.context.stx;
		var endEvent = null;
		var toolName = null;

		if (this.editing) {
			toolName = this.editing.name;

			var detail = {
				action: action,
				drawing: this.editing,
				tool: toolName,
			};

			if (typeof CustomEvent === "function") {
				endEvent = new CustomEvent("drawing-edit-end", {
					bubbles: true,
					cancelable: true,
					detail: detail,
				});
			} else {
				endEvent = document.createEvent("CustomEvent");
				endEvent.initCustomEvent("drawing-edit-end", true, true, detail);
			}

			var index = stx.drawingObjects.indexOf(this.editing);
			var before = stx.exportDrawings();

			if (index > -1 && this.beforeEdit) {
				before[index] = this.beforeEdit;
				stx.undoStamp(before, stx.exportDrawings());
			}

			if (action === "close" && this.editing.highlighted) {
				this.editing.highlighted = false;
				stx.draw();
			}
		}

		this.editing = null;
		this.beforeEdit = null;
		this.toolbar.attr("cq-drawing-edit", "none");

		// display the saved parameters if they exist in localstorage
		if (toolName && action === "close") {
			activator = this.getToolActivator(toolName);
			this.toolbar.each(function () {
				this.tool(activator, toolName);
			});
		}

		if (endEvent) {
			/**
			 * Drawing edit end - signals the end of "edit mode" to allow for additional teardown.
			 *
			 * @event CIQ.UI.DrawingEdit#drawing-edit-end
			 * @type {CustomEvent}
			 * @property {string} detail.action value is the method or description that caused editing teardown
			 * @property {CIQ.Drawing} detail.drawing object to teardown from editing
			 * @property {string} detail.tool the vector type / tool name
			 * @example <caption>Close the drawing toolbar</caption>
			 * drawingEdit.node.addEventListener('drawing-edit-end', function(event) {
			 * 	if (event.detail.action === 'close') {
			 * 		$('.ciq-draw').each(function() {
			 * 			this.set(false);
			 * 		});
			 * 	}
			 * }, false);
			 */
			this.node.dispatchEvent(endEvent);
		}
	};

	/**
	 * Drawing context menu edit settings option.
	 *
	 * Designed to be used as a helper method for the included {@link WebComponents}. A full tutorial on how to work with and customize the Web Components can be found here: {@tutorial Web Component Interface}
	 *
	 *
	 * @memberof CIQ.UI.DrawingEdit
	 * @since 6.2.0
	 */
	DrawingEdit.prototype.edit = function () {
		var self = this;

		this.drawingContext.each(function () {
			this.close();

			self.endEdit(null, "edit");
			self.showToolbar(this.drawing);
			self.beginEdit(this.drawing);
		});
	};

	/**
	 * Drawing context menu edit text option.
	 *
	 * Used for drawing tools with an edit() function, such as annotation and callout.
	 *
	 * Will allow re-application of this function.
	 *
	 * @memberof CIQ.UI.DrawingEdit
	 * @since 7.0.0
	 */
	DrawingEdit.prototype.text = function () {
		var self = this;

		this.drawingContext.each(function () {
			this.close();

			self.endEdit(null, "text");
			if (this.drawing.edit) this.drawing.edit(null, true);
		});
	};

	/**
	 * Drawing context menu clone option.
	 *
	 * Designed to be used as a helper method for the included {@link WebComponents}. A full tutorial on how to work with and customize the Web Components can be found here: {@tutorial Web Component Interface}
	 *
	 * @memberof CIQ.UI.DrawingEdit
	 * @since 6.2.0
	 */
	DrawingEdit.prototype.clone = function () {
		var self = this;
		var stx = this.context.stx;

		this.endEdit(null, "clone");
		this.drawingContext.each(function () {
			this.close();

			var clone = new CIQ.Drawing[this.drawing.name]();

			for (var key in this.drawing) {
				if (Object.prototype.hasOwnProperty.call(this.drawing, key)) {
					clone[key] = this.drawing[key];
				}
			}

			self.count += 1;
			stx.addDrawing(clone);
			stx.activateRepositioning(clone);
		});
	};

	/**
	 * Change the order of the drawingObjects array, which determines the layering of drawings.
	 *
	 * Designed to be used as a helper method for the included {@link WebComponents}. A full tutorial on how to work with and customize the Web Components can be found here: {@tutorial Web Component Interface}
	 *
	 * @param {Object} activator
	 * @param {string} layer the action to apply to the current drawing. May be "up", "down", "top", or "bottom"
	 * @since 6.2.0
	 */
	DrawingEdit.prototype.reorderLayer = function (activator, layer) {
		var self = this;
		var stx = this.context.stx;

		this.endEdit(null, "reorderLayer");
		this.drawingContext.each(function () {
			this.close();

			var lastIndex = stx.drawingObjects.length - 1;
			var removeIndex = stx.drawingObjects.indexOf(this.drawing);
			var insertIndex = NaN;

			if (removeIndex === -1) return;

			switch (layer) {
				case "up":
					if (removeIndex < lastIndex) {
						insertIndex = removeIndex + 1;
					}
					break;
				case "down":
					if (removeIndex > 0) {
						insertIndex = removeIndex - 1;
					}
					break;
				case "top":
					if (removeIndex < lastIndex) {
						insertIndex = lastIndex;
					}
					break;
				case "bottom":
					if (removeIndex > 0) {
						insertIndex = 0;
					}
					break;
			}

			if (insertIndex !== insertIndex) return; // NaN check

			var before = stx.exportDrawings();

			stx.drawingObjects.splice(removeIndex, 1);
			stx.drawingObjects.splice(insertIndex, 0, this.drawing);
			stx.undoStamp(before, stx.exportDrawings());
			stx.draw();
			stx.changeOccurred("vector");
		});
	};

	/**
	 * Drawing context menu remove/delete option.
	 *
	 * Designed to be used as a helper method for the included {@link WebComponents}. A full tutorial on how to work with and customize the Web Components can be found here: {@tutorial Web Component Interface}
	 *
	 * @memberof CIQ.UI.DrawingEdit
	 * @since 6.2.0
	 */
	DrawingEdit.prototype.remove = function () {
		var self = this;
		var stx = this.context.stx;

		this.endEdit(null, "remove");
		this.drawingContext.each(function () {
			if (this.drawing.permanent) return;

			var before = stx.exportDrawings();

			self.count -= 1;
			stx.removeDrawing(this.drawing);
			stx.undoStamp(before, stx.exportDrawings());

			this.close();
		});
	};

	/**
	 * UI Helper for managing study interaction, editing, deleting etc.
	 *
	 * Designed to be used as a helper method for the included {@link WebComponents}. A full tutorial on how to work with and customize the Web Components can be found here: {@tutorial Web Component Interface}
	 *
	 * Requires the [StudyDialog web component]{@link WebComponents.cq-study-dialog}
	 *
	 * It sets up {@link CIQ.ChartEngine.callbacks#studyOverlayEdit} and {@link CIQ.ChartEngine.callbacks#studyPanelEdit} callbacks
	 * in order to display a dialog for editing study parameters and a context menu for editing or deleting overlays.
	 * @name CIQ.UI.StudyEdit
	 * @param {HTMLElement} [node=context.topNode] Automatically attaches to the top node of the context
	 * @param {CIQ.UI.Context} context The context for the chart
	
	 * @since  4.1.0 contextDialog is no longer passed in.
	 */
	CIQ.UI.StudyEdit = function (node, context) {
		this.context = context;
		this.node = node ? node : context.topNode;
		this.contextDialog = document.querySelectorAll("cq-study-context");
		context.advertiseAs(this, "StudyEdit");
		this.initialize();
	};

	CIQ.UI.StudyEdit.ciqInheritsFrom(CIQ.UI.Helper);

	/**
	 * Closes Study Edit dialog.
	 *
	 * Designed to be used as a helper method for the included {@link WebComponents}. A full tutorial on how to work with and customize the Web Components can be found here: {@tutorial Web Component Interface}
	 *
	 * @memberof CIQ.UI.StudyEdit
	 */
	CIQ.UI.StudyEdit.prototype.remove = function () {
		CIQ.Studies.removeStudy(this.params.stx, this.params.sd);
		this.contextDialog.forEach(function (studyContext) {
			studyContext.close();
		});
	};

	/**
	 * Proxy for editing a study.
	 *
	 * Designed to be used as a helper method for the included {@link WebComponents}. A full tutorial on how to work with and customize the Web Components can be found here: {@tutorial Web Component Interface}
	 *
	 * Assumes the params for the study have already been set.
	 * @memberof CIQ.UI.StudyEdit
	 */
	CIQ.UI.StudyEdit.prototype.edit = function () {
		this.contextDialog.forEach(function (studyContext) {
			studyContext.close();
		});
		this.editPanel(this.params);
	};

	/**
	 * Finds the StudyDialog web component and proxies the parameters over to it.
	 *
	 * Designed to be used as a helper method for the included {@link WebComponents}. A full tutorial on how to work with and customize the Web Components can be found here: {@tutorial Web Component Interface}
	 *
	 * @memberof CIQ.UI.StudyEdit
	 * @param  {Object} params Parameters from studyPanelEdit callback
	 */
	CIQ.UI.StudyEdit.prototype.editPanel = function (params) {
		params.context = this.context;
		// Make sure we don't open the dialog in the context menu position
		params.x = null;
		params.y = null;
		$("cq-study-dialog").each(function () {
			this.open(params);
		});
	};

	/**
	 * Displays the `Edit Settings`, `Delete Study` context dialog for overlay studies and prepares the parameters for editing.
	 * Designed to be used as a helper method for the included {@link WebComponents}. A full tutorial on how to work with and customize the Web Components can be found here: {@tutorial Web Component Interface}
	 *
	 * @memberof CIQ.UI.StudyEdit
	 * @param  {Object} params Parameters from studyOverlayEdit callback
	 */
	CIQ.UI.StudyEdit.prototype.editOverlay = function (params) {
		this.params = params;
		params.context = this.context;
		if (params.forceEdit) {
			this.editPanel(params);
		} else {
			this.contextDialog.forEach(function (studyContext) {
				params.x = CIQ.ChartEngine.crosshairX;
				params.y = CIQ.ChartEngine.crosshairY;
				studyContext.open(params);
			});
		}
	};

	/**
	 * Creates the callbacks for self and the context.
	 *
	 * Designed to be used as a helper method for the included {@link WebComponents}. A full tutorial on how to work with and customize the Web Components can be found here: {@tutorial Web Component Interface}
	 *
	 * @memberof CIQ.UI.StudyEdit
	 */
	CIQ.UI.StudyEdit.prototype.initialize = function () {
		var stx = this.context.stx;
		var self = this;

		function closure(fc) {
			return function () {
				fc.apply(self, arguments);
			};
		}
		// DO NOT USE CALLBACKS
		// these are deprecated, use addEventListener instead
		// stx.callbacks.studyOverlayEdit=closure(self.editOverlay);
		// stx.callbacks.studyPanelEdit=closure(self.editPanel);
		stx.addEventListener("studyOverlayEdit", closure(self.editOverlay));
		stx.addEventListener("studyPanelEdit", closure(self.editPanel));
	};

	/**
	 * UI Helper for Layout changes, for instance tapping items on the display menu.
	 *
	 * Designed to be used as a helper method for the included {@link WebComponents}. A full tutorial on how to work with and customize the Web Components can be found here: {@tutorial Web Component Interface}
	 *
	 * This Helper is also responsible for initializing menu items in the "display" menu based on the <a href="CIQ.ChartEngine.html#layout%5B%60chartType%60%5D">chart layout</a>
	 * @name CIQ.UI.Layout
	 * @param {CIQ.UI.Context} context The context
	 * @param {Object} [params] Parameters
	 * @param {string} [params.activeClassName="ciq-active"] The class name to be added to a node when a layout item is enabled
	
	 * @since  4.1.0 Layout no longer takes a node as its first parameter
	 */
	CIQ.UI.Layout = function (context, params) {
		this.params = params ? params : {};
		if (!this.params.activeClassName) this.params.activeClassName = "ciq-active";
		this.context = context;
		context.advertiseAs(this, "Layout");
	};

	CIQ.UI.Layout.ciqInheritsFrom(CIQ.UI.Helper);

	/**
	 * Activates the chart type radio button on the 'Display' drop down.
	 *
	 * Designed to be used as a helper method for the included {@link WebComponents}. A full tutorial on how to work with and customize the Web Components can be found here: {@tutorial Web Component Interface}
	 *
	 * @memberof CIQ.UI.Layout
	 * @param {HTMLElement} node
	 * @param {string} chartType
	 * @private
	 */
	CIQ.UI.Layout.prototype.getChartType = function (node, chartType) {
		var activeClassName = this.params.activeClassName;
		// A little complexity here to consolidate two fields (aggregationType and chartType) into one
		// set of radio buttons
		function showChartType(params, node) {
			var layout = params.obj;
			if (layout.aggregationType && layout.aggregationType != "ohlc") {
				if (chartType !== layout.aggregationType) {
					$(node).removeClass(activeClassName);
				} else {
					$(node).addClass(activeClassName);
				}
			} else {
				if (chartType !== layout.chartType) {
					$(node).removeClass(activeClassName);
				} else {
					$(node).addClass(activeClassName);
				}
			}
		}
		CIQ.UI.observe({
			selector: node,
			obj: this.context.stx.layout,
			member: ["chartType", "aggregationType"],
			action: "callback",
			value: showChartType,
		});
	};

	/**
	 * Convenience function to set the chart type or the aggregation type from the 'Display' drop down.
	 *
	 * Designed to be used as a helper method for the included {@link WebComponents}. A full tutorial on how to work with and customize the Web Components can be found here: {@tutorial Web Component Interface}
	 *
	 * Leverages {@link CIQ.ChartEngine#setChartType}  and {@link CIQ.ChartEngine#setAggregationType}
	 *
	 * @memberof CIQ.UI.Layout
	 * @param {HTMLElement} node
	 * @param {string} chartType
	 */
	CIQ.UI.Layout.prototype.setChartType = function (node, chartType) {
		var aggregations = {
			heikinashi: true,
			kagi: true,
			linebreak: true,
			pandf: true,
			rangebars: true,
			renko: true,
		};
		if (aggregations[chartType]) {
			// this.context.stx.setChartType("candle");
			this.context.stx.setAggregationType(chartType);
		} else {
			this.context.stx.setChartType(chartType);
			// this.context.stx.setAggregationType(null);
		}
	};

	/**
	 * @memberof CIQ.UI.Layout
	 * @param {HTMLElement} node
	 * @param {string} chartScale
	 * @private
	 */
	CIQ.UI.Layout.prototype.getChartScale = function (node, chartScale) {
		CIQ.UI.observe({
			selector: node,
			obj: this.context.stx.layout,
			member: "chartScale",
			condition: chartScale,
			action: "class",
			value: this.params.activeClassName,
		});
	};

	/**
	 * Convenience function to set the chart scale from the 'Display' drop down.
	 *
	 * Designed to be used as a helper method for the included {@link WebComponents}. A full tutorial on how to work with and customize the Web Components can be found here: {@tutorial Web Component Interface}
	 *
	 * Leverages {@link CIQ.ChartEngine#setChartScale}
	 *
	 * @memberof CIQ.UI.Layout
	 * @param {HTMLElement} node
	 * @param {string} chartType
	 */
	CIQ.UI.Layout.prototype.setChartScale = function (node, chartScale) {
		var stx = this.context.stx;
		var layoutScale = stx.layout.chartScale;
		if (layoutScale == chartScale) {
			stx.setChartScale(null);
		} else if (!layoutScale || layoutScale == "linear") {
			stx.setChartScale(chartScale);
		}
	};

	/**
	 * @memberof CIQ.UI.Layout
	 * @param {HTMLElement} node
	 * @since 6.3.0
	 * @private
	 */
	CIQ.UI.Layout.prototype.getFlippedChart = function (node) {
		CIQ.UI.observe({
			selector: node,
			obj: this.context.stx.layout,
			member: "flipped",
			condition: true,
			action: "class",
			value: this.params.activeClassName,
		});
	};

	/**
	 * Convenience function to set the Inverted Y-axis mode from the 'Display' drop down.
	 *
	 * Designed to be used as a helper method for the included {@link WebComponents}. A full tutorial on how to work with and customize the Web Components can be found here: {@tutorial Web Component Interface}
	 *
	 * Leverages {@link CIQ.ChartEngine#flipChart}
	 * @memberof CIQ.UI.Layout
	 * @param {HTMLElement} node
	 * @since 6.3.0
	 */
	CIQ.UI.Layout.prototype.setFlippedChart = function (node) {
		var stx = this.context.stx;
		stx.flipChart(!stx.layout.flipped);
	};

	/**
	 * @memberof CIQ.UI.Layout
	 * @param {HTMLElement} node
	 * @private
	 */
	CIQ.UI.Layout.prototype.getExtendedHours = function (node) {
		CIQ.UI.observe({
			selector: node,
			obj: this.context.stx.layout,
			member: "extended",
			condition: true,
			action: "class",
			value: this.params.activeClassName,
		});
	};

	/**
	 * Convenience function to set extended hours mode from the 'Display' drop down.
	 *
	 * Designed to be used as a helper method for the included {@link WebComponents}. A full tutorial on how to work with and customize the Web Components can be found here: {@tutorial Web Component Interface}
	 *
	 * See  {@link CIQ.Market} and {@link CIQ.ExtendedHours}
	 * @memberof CIQ.UI.Layout
	 * @param {HTMLElement} node
	 */
	CIQ.UI.Layout.prototype.setExtendedHours = function (node) {
		var stx = this.context.stx;
		stx.layout.extended = !stx.layout.extended;
		stx.changeOccurred("layout");

		// check if extended hours exists for this security
		if (stx.layout.extended && !(stx.chart.market.market_def && stx.chart.market.sessions.length)) {
			CIQ.alert("There are no Extended Hours for this instrument.");
		}
		if (stx.extendedHours) {
			var loader = this.context.loader;
			if (loader) loader.show();
			stx.extendedHours.set(stx.layout.extended, null, function () {
				loader.hide();
			});
		}
	};

	/**
	 * @memberof CIQ.UI.Layout
	 * @param {HTMLElement} node
	 * @private
	 */
	CIQ.UI.Layout.prototype.getRangeSlider = function (node) {
		CIQ.UI.observe({
			selector: node,
			obj: this.context.stx.layout,
			member: "rangeSlider",
			condition: true,
			action: "class",
			value: this.params.activeClassName,
		});
	};

	/**
	 * Convenience function to toggle the range slider mode from the 'Display' drop down.
	 *
	 * Designed to be used as a helper method for the included {@link WebComponents}. A full tutorial on how to work with and customize the Web Components can be found here: {@tutorial Web Component Interface}
	 *
	 * See  {@link CIQ.CIQ.RangeSlider}
	 *
	 * @memberof CIQ.UI.Layout
	 * @param {HTMLElement} node
	 */
	CIQ.UI.Layout.prototype.setRangeSlider = function (node) {
		var stx = this.context.stx;
		stx.layout.rangeSlider = !stx.layout.rangeSlider;
		if (stx.slider) stx.slider.display(stx.layout.rangeSlider);
		stx.changeOccurred("layout");
	};

	/**
	 * @memberof CIQ.UI.Layout
	 * @param {HTMLElement} node
	 * @param {string} aggregationType
	 * @private
	 */
	CIQ.UI.Layout.prototype.getAggregationType = function (node, aggregationType) {
		CIQ.UI.observe({
			selector: node,
			obj: this.context.stx.layout,
			member: "aggregationType",
			condition: aggregationType,
			action: "class",
			value: this.params.activeClassName,
		});
	};

	/**
	 * Convenience function to set aggregation type from the 'Display' drop down.
	 *
	 * Designed to be used as a helper method for the included {@link WebComponents}. A full tutorial on how to work with and customize the Web Components can be found here: {@tutorial Web Component Interface}
	 *
	 * Leverages {@link CIQ.ChartEngine#setAggregationType}
	 * @memberof CIQ.UI.Layout
	 * @param {HTMLElement} node
	 * @param {string} aggregationType
	 */
	CIQ.UI.Layout.prototype.setAggregationType = function (node, aggregationType) {
		if (this.context.stx.layout.aggregationType == aggregationType) {
			this.context.stx.setAggregationType(null);
		} else {
			this.context.stx.setAggregationType(aggregationType);
		}
	};

	/**
	 * @memberof CIQ.UI.Layout
	 * @param {HTMLElement} node
	 * @param {string} field
	 * @private
	 */
	CIQ.UI.Layout.prototype.getAggregationEdit = function (node, field) {
		var stx = this.context.stx;
		function populateEditField(params) {
			var name = params.selector.name;
			var value = params.obj[params.member];
			if (!value && stx.chart.defaultChartStyleConfig[name]) {
				$(params.selector).val(stx.chart.defaultChartStyleConfig[name]);
			} else {
				$(params.selector).val(value);
			}
		}

		var tuple = CIQ.deriveFromObjectChain(stx.layout, field);
		CIQ.UI.observe({
			selector: node,
			obj: tuple.obj,
			member: tuple.member,
			action: "callback",
			value: populateEditField,
		});
	};

	/**
	 * @memberof CIQ.UI.Layout
	 * @param {HTMLElement} node
	 * @param {string} field
	 * @private
	 */
	CIQ.UI.Layout.prototype.setAggregationEdit = function (node, field) {
		var stx = this.context.stx;

		function completeAggEdit() {
			stx.changeOccurred("layout");
			stx.createDataSet();
			stx.draw();
		}

		if (field === "auto") {
			if (stx.layout.aggregationType === "kagi") {
				stx.layout.kagi = null;
			} else if (stx.layout.aggregationType === "renko") {
				stx.layout.renko = null;
			} else if (stx.layout.aggregationType === "linebreak") {
				stx.layout.priceLines = null;
			} else if (stx.layout.aggregationType === "rangebars") {
				stx.layout.rangebars = null;
			} else if (stx.layout.aggregationType === "pandf") {
				if (!stx.layout.pandf) {
					stx.layout.pandf = { box: null, reversal: null };
				}
				stx.layout.pandf.box = null;
				stx.layout.pandf.reversal = null;
			}
			completeAggEdit();

			//Get parent based on button node. This will grab the entire dialog so every text box will
			// get set to its default values
			var dialog = $(node).offsetParent();

			$(dialog)
				.find(".ciq" + stx.layout.aggregationType + " input")
				.each(function () {
					var name = this.name;
					if (name == "box" || name == "reversal") name = "pandf." + name;
					var tuple = CIQ.deriveFromObjectChain(stx.layout, name);
					if (tuple && !tuple.obj[tuple.member] && stx.chart.defaultChartStyleConfig[this.name])
						$(this).val(stx.chart.defaultChartStyleConfig[this.name]);
				});
		} else {
			var tuple = CIQ.deriveFromObjectChain(stx.layout, field);
			tuple.obj[tuple.member] = $(node.node).val();
			completeAggEdit();
		}
	};

	/**
	 * @memberof CIQ.UI.Layout
	 * @param {HTMLElement} node
	 * @param {string} aggregationType
	 * @private
	 */
	CIQ.UI.Layout.prototype.showAggregationEdit = function (node, aggregationType) {
		var dialog = $("cq-aggregation-dialog");
		dialog[0].open({ context: this.context, aggregationType: aggregationType });
	};

	/**
	 * Removes all studies from the top most node.
	 *
	 * Designed to be used as a helper method for the included {@link WebComponents}. A full tutorial on how to work with and customize the Web Components can be found here: {@tutorial Web Component Interface}
	 *
	 * @memberof CIQ.UI.Layout
	 * @param {HTMLElement} node
	 */
	CIQ.UI.Layout.prototype.clearStudies = function (node) {
		var stx = this.context.stx;
		for (var id in stx.layout.studies) {
			var sd = stx.layout.studies[id];
			if (!sd.customLegend && !sd.permanent) CIQ.Studies.removeStudy(stx, sd);
		}
		stx.draw();
	};

	/**
	 * Convenience function to set periodicity from the menu drop down.
	 *
	 * Designed to be used as a helper method for the included {@link WebComponents}. A full tutorial on how to work with and customize the Web Components can be found here: {@tutorial Web Component Interface}
	 *
	 * Leverages {@link CIQ.ChartEngine#setPeriodicity}

	 * @memberof CIQ.UI.Layout
	 * @param {HTMLElement} node
	 * @param {number} periodicity
	 * @param {number} interval
	 * @param {number} timeUnit
	 */
	CIQ.UI.Layout.prototype.setPeriodicity = function (node, periodicity, interval, timeUnit) {
		var self = this;
		if (self.context.loader) self.context.loader.show();
		self.context.stx.setPeriodicity({ period: periodicity, interval: interval, timeUnit: timeUnit }, function () {
			if (self.context.loader) self.context.loader.hide();
		});
	};

	/**
	 * Sets the display periodicity.
	 *
	 * Usually this is called from an observer that is in {@link CIQ.UI.Layout#periodicity}
	 *
	 * Designed to be used as a helper method for the included {@link WebComponents}. A full tutorial on how to work with and customize the Web Components can be found here: {@tutorial Web Component Interface}
	 *
	 * @param  {CIQ.ChartEngine} stx    The chart object to examine for periodicity
	 * @param  {Object} params Parameters
	 * @param {HTMLElement} params.selector The selector to update
	 */
	CIQ.UI.Layout.prototype.showPeriodicity = function (stx, params) {
		var text = "";
		var periodicity = stx.layout.periodicity,
			interval = stx.layout.interval,
			timeUnit = stx.layout.timeUnit;
		if (isNaN(interval)) {
			timeUnit = interval;
			interval = 1;
		}
		periodicity *= interval;
		text = periodicity;
		if (timeUnit == "day") {
			text += "D";
		} else if (timeUnit == "week") {
			text += "W";
		} else if (timeUnit == "month") {
			text += "M";
		} else if (timeUnit == "tick") {
			text += "T";
		} else if (timeUnit == "second") {
			text += "s";
		} else if (timeUnit == "millisecond") {
			text += "ms";
		} else if (periodicity >= 60 && periodicity % 15 === 0) {
			text = periodicity / 60 + "H";
		} else {
			text += "m";
		}
		$(params.selector).empty().append(CIQ.translatableTextNode(stx, text));
	};

	CIQ.UI.Layout.prototype.periodicity = function (node) {
		var self = this;
		function showPeriodicity(params) {
			self.showPeriodicity(self.context.stx, params);
		}
		CIQ.UI.observe({
			selector: node,
			obj: this.context.stx.layout,
			member: ["interval", "periodicity", "timeUnit"],
			action: "callback",
			value: showPeriodicity,
		});
	};

	/**
	 * Populates and displays the language widget.
	 *
	 * Designed to be used as a helper method for the included {@link WebComponents}. A full tutorial on how to work with and customize the Web Components can be found here: {@tutorial Web Component Interface}
	 *
	 * @memberof CIQ.UI.Layout
	 */
	CIQ.UI.Layout.prototype.setLanguage = function () {
		var dialog = $("cq-language-dialog").each(function () {
			this.open();
		});
	};

	/**
	 * Displays the current language in language widget.
	 *
	 * Designed to be used as a helper method for the included {@link WebComponents}. A full tutorial on how to work with and customize the Web Components can be found here: {@tutorial Web Component Interface}
	 *
	 * @memberof CIQ.UI.Layout
	 * @since 6.1.0 defaults to English
	 */
	CIQ.UI.Layout.prototype.getLanguage = function (node) {
		function showLanguage(params, node) {
			if (!CIQ.I18N.languages) CIQ.I18N.languages = { en: "English" };
			$(node).find("cq-language-name").text(CIQ.I18N.languages[CIQ.I18N.language]);
			$(node).find("cq-flag").attr("cq-lang", CIQ.I18N.language);
		}

		CIQ.UI.observe({
			selector: node,
			obj: CIQ.I18N,
			member: "language",
			action: "callback",
			value: showLanguage,
		});
	};

	/**
	 * UI Helper for capturing and handling keystrokes. cb to capture the key.
	 *
	 * Developer is responsible for calling e.preventDefault() and/or e.stopPropagation();
	 *
	 * @name CIQ.UI.Keystroke
	 * @param {Function} [cb] Callback when key pressed
	
	 */
	CIQ.UI.Keystroke = function (cb) {
		this.cb = cb;
		this.shift = false;
		this.ctrl = false;
		this.cmd = false;
		this.capsLock = false;
		this.downValue = ""; // Android Chrome bug requires a workaround for keyup.
		this.initialize();
	};

	/**
	 * Set this to true to bypass key capture. Shift, CTRL, CMD will still be toggled however.
	 *
	 * @memberof CIQ.UI.Keystroke
	 * @type {Boolean}
	 */
	CIQ.UI.Keystroke.noKeyCapture = false;

	// http://stackoverflow.com/questions/30743490/capture-keys-typed-on-android-virtual-keyboard-using-javascript
	// On Chrome Android, the keydown/keyup events are broken. We have to figure out the key that was pressed by
	// examining the value of an input box before (keydown) and after (keyup) and identifying what changed
	// Note that CIQ.isAndroid is false when the user requests "desktop site" and so some input boxes won't work
	// in that situation. There is no workaround other than to always treat 229 as a false value (it is a swedish character)
	CIQ.UI.Keystroke.prototype.androidWorkaroundKeyup = function (e) {
		var newValue = e.target.value;
		var key;
		if (newValue.length > this.downValue.length) {
			key = newValue.charAt(newValue.length - 1);
			e.which = key.charCodeAt(0);
		} else {
			key = "Delete";
		}
		this.key = key;
		this.cb({ key: key, e: e, keystroke: this });
	};

	// Managing keystroke events. We will get three key events from the browser: keydown, keyup, keypress
	// These come in a specific order: http://www.quirksmode.org/dom/events/keys.html
	// keypress gives you the capitalized or uncapitalized key, unlike keyup/keydown
	// which only give you the actual physical key that was pressed on the keyboard
	// keypress is triggered *before* the action modifies the input field
	//
	// We can capture keystrokes on the body, or on an input field. What we want to make sure is that
	// the input field is actually updated when we process the stroke. Since keypress and keydown occur
	// before the input field is updated, we save any key that has been handled by these in this.key
	// but we don't process the stroke until the keyup event is fired. This ensures that our handlers
	// will always have the right key (capitalized) and that input field value will be up to date.
	CIQ.UI.Keystroke.prototype.keyup = function (e) {
		if (this.implementAndroidWorkaround) {
			this.androidWorkaroundKeyup(e);
			this.implementAndroidWorkaround = false;
			return;
		}

		switch (e.key) {
			case "Shift":
				this.shift = false;
				this.cb({ key: e.key, e: e, keystroke: this });
				return;
			case "Control":
			case "Alt":
				this.ctrl = false;
				this.cb({ key: e.key, e: e, keystroke: this });
				return;
			case "Meta":
			case "Win":
				this.cmd = false;
				this.cb({ key: e.key, e: e, keystroke: this });
				return;
			default:
				break;
		}
		// This is where we handle the keystroke, regardless of whether we captured the key with a down or press event
		// The exception to this is the arrow keys, which are processed in keydown
		if (this.key) this.cb({ key: this.key, e: e, keystroke: this });
	};

	CIQ.UI.Keystroke.prototype.keydown = function (e) {
		if (this.noKeyCapture) return;
		if (e.which == 229 && CIQ.isAndroid) {
			this.implementAndroidWorkaround = true;
			return;
		}
		this.key = e.key;
		switch (e.key) {
			case "Meta":
			case "Win":
				this.cmd = true;
				break;
			case "Shift":
				this.shift = true;
				break;
			case "Control":
			case "Alt":
				this.ctrl = true;
				break;
			case "CapsLock":
				this.capsLock = !this.capsLock;
				break;
			case "ArrowUp":
			case "ArrowDown":
			case "ArrowLeft":
			case "ArrowRight":
			case "Up":
			case "Down":
			case "Left":
			case "Right":
				// If you hold a key down, then keydown will repeat. These are the keys
				// that we want to capture repeat action.
				this.key = null;
				this.cb({ key: e.key, e: e, keystroke: this });
				break;
		}
	};

	/**
	 * Identifies a keypress event.
	 * @memberof CIQ.UI.Keystroke
	 * @param e
	 */
	CIQ.UI.Keystroke.prototype.keypress = function (e) {
		if (this.noKeyCapture) return;
		var keyCode = e.which;
		if (keyCode < 32 || keyCode > 222) return; // handled by keydown
		this.key = e.key;
	};

	/**
	 * Initializes member functions.
	 * @memberof CIQ.UI.Keystroke
	 * @private
	 */
	CIQ.UI.Keystroke.prototype.initialize = function () {
		var self = this;
		$(document).on("keyup", function (e) {
			self.keyup(e);
		});
		$(document).on("keydown", function (e) {
			self.downValue = e.target.value;
			self.keydown(e);
		});
		$(document).on("keypress", function (e) {
			self.keypress(e);
		});
		$(window).on("blur", function (e) {
			// otherwise ctrl-t to switch tabs causes ctrl to get stuck
			self.ctrl = false;
			self.cb({ key: "Control", e: e, keystroke: self });
		});
	};

	/**
	 * UI Helper for capturing and handling keystrokes.
	 *
	 * A helper or ContextTag can "claim" keystrokes and intercept them, otherwise the keystrokes will be handled by keyup and keydown.
	 *
	 * @param {HTMLElement} [node] The node or selector to which to attach. Defaults to `document` which means that hot keys will act globally.
	 * If set to any other element (selector) then hot keys will only function when the mouse is hovering over that element.
	 * @param {CIQ.UI.Context} context The context for the chart
	 * @param {Object} [params] Parameters to drive the helper
	 * @param {Function} [params.cb] Callback to handle hot keys.
	 * @name CIQ.UI.KeystrokeHub
	 * @since  5.1.0 Setting `node` to anything other than `document` allows keystrokes to be restricted by hover focus
	
	 */
	CIQ.UI.KeystrokeHub = function (node, context, params) {
		if (!node) node = "document";
		this.node = $(node);
		this.infocus = false;
		var self = this;
		if (node[0] === document || node[0] === document.body || node[0] === window) {
			this.infocus = true;
		} else {
			this.node.on("mouseout", function () {
				self.infocus = false;
			});
			this.node.on("mouseover", function () {
				self.infocus = true;
			});
		}
		this.context = context;
		this.params = params ? params : {};
		this.uiManager = $("cq-ui-manager");
		if (this.uiManager.length > 0) {
			this.uiManager = this.uiManager[0];
			this.uiManager.keystrokeHub = this; // Register the keystroke hub so that it can be found
		}

		function handler() {
			return function () {
				self.handler.apply(self, arguments);
			};
		}
		this.keystroke = new CIQ.UI.Keystroke(handler());
	};

	CIQ.UI.KeystrokeHub.ciqInheritsFrom(CIQ.UI.Helper);

	/**
	 * Global default hotkey method. Pass this or your own method in to {@link CIQ.UI.KeystrokeHub}
	 * @memberof CIQ.UI.KeystrokeHub
	 * @param  {number} key The pressed key
	 * @param  {CIQ.UI.KeystrokeHub} hub The hub that processed the key
	 * @return {boolean}     Return true if you captured the key
	 */
	CIQ.UI.KeystrokeHub.defaultHotKeys = function (key, hub) {
		var stx = hub.context.stx;
		var push = 1;
		switch (key) {
			case "ArrowUp":
			case "Up":
				if (stx.allowZoom) stx.zoomIn();
				break;
			case "ArrowDown":
			case "Down":
				if (stx.allowZoom) stx.zoomOut();
				break;
			case "Home":
				stx.home();
				stx.headsUpHR();
				break;
			case "End":
				stx.chart.scroll = stx.chart.dataSet.length;
				stx.draw();
				stx.headsUpHR();
				break;
			case "ArrowLeft":
			case "Left":
				if (stx.ctrl) {
					if (stx.allowZoom) stx.zoomOut();
				} else if (stx.allowScroll) {
					push = 1;
					if (stx.shift || hub.capsLock) push = Math.max(5, 5 * (8 - Math.round(stx.layout.candleWidth)));
					if (stx.chart.scroll + push >= stx.chart.dataSet.length) push = stx.chart.dataSet.length - stx.chart.scroll;
					stx.chart.scroll += push;
					stx.draw();
					stx.headsUpHR();
				}
				break;
			case "ArrowRight":
			case "Right":
				if (stx.ctrl) {
					if (stx.allowZoom) stx.zoomIn();
				} else if (stx.allowScroll) {
					push = 1;
					if (stx.shift || hub.capsLock) push = Math.max(5, 5 * (8 - Math.round(stx.layout.candleWidth)));
					stx.chart.scroll -= push;
					stx.draw();
					stx.headsUpHR();
				}
				break;
			case "Delete":
			case "Backspace":
			case "Del":
				if (CIQ.ChartEngine.drawingLine) {
					stx.undo();
				} else if (stx.anyHighlighted) {
					stx.deleteHighlighted();
				} else {
					return false;
				}
				break;
			case "Escape":
			case "Esc":
				if (CIQ.ChartEngine.drawingLine) {
					stx.undo();
				} else {
					if (hub.uiManager) hub.uiManager.closeMenu();
				}
				break;
			default:
				return false; // not captured
		}
		return true;
	};

	/**
	 * Change the active context for the hub, for instance when dealing with multiple charts.
	 *
	 * @param {CIQ.UI.Context} context The context
	 * @memberof CIQ.UI.KeystrokeHub
	 */
	CIQ.UI.KeystrokeHub.prototype.setActiveContext = function (context) {
		this.context = context;
	};

	/**
	 * @param hub
	 * @param key
	 * @param e Event
	 * @param keystroke
	 * @memberof CIQ.UI.KeystrokeHub
	 * @private
	 */
	CIQ.UI.KeystrokeHub.prototype.processKeyStrokeClaims = function (hub, key, e, keystroke) {
		for (var i = claims.length - 1; i > -1; i--) {
			var helper = claims[i].helper;
			var response = helper.keyStroke(hub, key, e, keystroke);
			if (response) {
				if (!response.allowDefault) e.preventDefault();
				return true;
			}
		}
		return false;
	};

	/**
	 * Handles keystrokes
	 * @param  {object} obj Event object
	 * @memberof CIQ.UI.KeystrokeHub
	 * @private
	 */
	CIQ.UI.KeystrokeHub.prototype.handler = function (obj) {
		var stx = this.context.stx;
		if (stx.editingAnnotation) return;
		// If the keystrokehub is associated with a specific element, then it will only
		// process key events when that element is in focus
		if (!this.infocus) return;

		var e = obj.e,
			key = obj.key,
			keystroke = obj.keystroke,
			targetTagName = obj.e.target.tagName;
		switch (key) {
			case "Shift":
				stx.shift = keystroke.shift;
				break;
			case "Control":
			case "Alt":
				stx.ctrl = keystroke.ctrl;
				break;
			case "Meta":
			case "Win":
				stx.cmd = keystroke.cmd;
				break;
			case "CapsLock":
				this.capsLock = !this.capsLock;
				break;
			default:
				break;
		}
		if (!CIQ.ChartEngine.drawingLine) {
			if (this.processKeyStrokeClaims(this, key, e, keystroke)) return;
		}

		if (e.key != "Escape" && e.key != "Esc") {
			if (this.context.isModal()) return;
		}

		if (targetTagName == "INPUT" || targetTagName == "TEXTAREA") return; // target is not the chart

		if (this.params.cb) {
			if (this.params.cb(key, this)) e.preventDefault();
		}
	};

	/**
	 * Self registering global web component that manages the overall UI on the attached div tag.
	 *
	 * Designed to be used as a helper method for the included {@link WebComponents}. A full tutorial on how to work with and customize the Web Components can be found here: {@tutorial Web Component Interface}
	 *
	 * This component keeps track of open menus and dialogs and attaches click and tap (onclick or ontouch) events in order to close them.
	 *
	 * By default it is attached to the **"body"**, but it can be changed to a different div tag if this behavior is too broad for your particular implementation.
	 * @namespace WebComponents.cq-ui-manager
	 * @memberof WebComponents
	 */
	class UIManager extends HTMLElement {
		/**
		 * Prevents underlay clicks and handles tap events and callbacks.
		 *
		 * Designed to be used as a helper method for the included {@link WebComponents}. A full tutorial on how to work with and customize the WebComponents can be found here: {@tutorial Web Component Interface}
		 *
		 * Creates an array of the active Menus to keep track of which component is currently active.
		 * @memberof WebComponents.cq-ui-manager
		
		 */
		constructor() {
			super();
			this.activeMenuStack = [];
			this.registeredForResize = [];
			this.keystrokehub = null;
			CIQ.installTapEvent($("body")[0], { preventUnderlayClick: false });

			var self = this;
			function handleTap() {
				self.closeTopMenu();
			}
			$("body").on("stxtap", handleTap);
		}

		/**
		 * Attach a callback to an individual component as part of the context.
		 *
		 * Designed to be used as a helper method for the included {@link WebComponents}. A full tutorial on how to work with and customize the WebComponents can be found here: {@tutorial Web Component Interface}
		 *
		 * @memberof WebComponents.cq-ui-manager
		 * @alias attachedCallback
		 */
		connectedCallback() {
			var self = this;
			this.resize = function () {
				var rr = self.registeredForResize;
				for (var i = 0; i < rr.length; i++) {
					if (typeof rr[i].resize == "function") rr[i].resize();
				}
			};
			window.addEventListener("resize", this.resize);
		}

		/**
		 * Removes a callback from a component.
		 *
		 * Designed to be used as a helper method for the included {@link WebComponents}. A full tutorial on how to work with and customize the WebComponents can be found here: {@tutorial Web Component Interface}
		 *
		 * @memberof WebComponents.cq-ui-manager
		 * @alias detachedCallback
		 */
		disconnectedCallback() {
			window.removeEventListener("resize", this.resize);
		}

		/**
		 * Closes the current acttive menu and resets the activeMenuStack.
		 *
		 *  Designed to be used as a helper method for the included {@link WebComponents}. A full tutorial on how to work with and customize the WebComponents can be found here: {@tutorial Web Component Interface}
		 *
		 * @memberof WebComponents.cq-ui-manager
		 * @alias closeMenu
		 * @param {HTMLElement} element
		 */
		closeMenu(menu) {
			var activeMenuStack = this.activeMenuStack;
			var parents = $(menu).parents("cq-menu");
			var closeThese = [];
			if (menu) {
				// if menu is specified then close it
				closeThese.push(menu);
				// along with any active parent menus
				for (var i = 0; i < parents.length; i++) {
					var parent = parents[i];
					if (parent.active) closeThese.push(parent);
				}
			} else {
				// close them all if no menu is specified
				closeThese = activeMenuStack;
			}
			// hide all the items we've decided to close
			for (var j = 0; j < closeThese.length; j++) {
				closeThese[j].hide();
			}
			// filter out the ones that are inactive
			this.activeMenuStack = activeMenuStack.filter(function (item) {
				return item.active;
			});
			this.ifAllClosed();
		}

		/**
		 * @memberof WebComponents.cq-ui-manager
		 * @alias closeTopMenu
		 * @example
		 * <cq-dialog>
		 * 	<cq-drawing-context>
		 * 		<cq-menu cq-close-top="cq-dialog[cq-drawing-context]">
		 * 			<div>This is a sub-menu</div>
		 * 			<cq-menu-dropdown>
		 * 				<cq-item>A stxtap event that bubbles to body will call UIManager#closeTopMenu</cq-item>
		 * 				<cq-item>With the cq-close-top attribute above, the dialog will be closed as well</cq-item>
		 * 			</cq-menu-dropdown>
		 * 		</cq-menu>
		 * 	</cq-drawing-context>
		 * </cq-dialog>
		 * @since 6.2.0 Added "cq-close-top" menu attribute to optionally close parent menus
		 */
		closeTopMenu() {
			var activeMenuStack = this.activeMenuStack;
			if (!activeMenuStack.length) return;
			var menu = activeMenuStack[activeMenuStack.length - 1];
			// If the top menu is a dialog, and isn't active yet then it has just been added, don't remove it
			var self = this;
			if (!menu.isDialog || menu.active) {
				activeMenuStack.pop();
				menu.hide();
				setTimeout(function () {
					self.ifAllClosed(); // Put this in a timeout so that a click on the body doesn't start a drawing
				}, 0);
			}
			var close = menu.getAttribute("cq-close-top");
			if (close) {
				$(menu)
					.parents(close)
					.each(function () {
						self.closeMenu(this);
					});
			}
		}

		/**
		 * Find all lifts for the menu, but not lifts that are within nested menus.
		 * @memberof WebComponets.cq-ui-manager
		 * @alias findLifts
		 * @param  {HTMLElement} menu The menu to search
		 * @return {JQuery}      Jquery selector containing any lifts
		 */
		findLifts(menu) {
			var lifts = $(menu)
				.find("*[cq-lift]")
				.filter(function () {
					// only valid if the closest cq-menu or cq-dialog parent is the menu itself
					// otherwise the lift is in a nested menu
					var closest = $(this).closest("cq-menu,cq-dialog");
					return closest.length && closest[0] == menu;
				});
			return lifts;
		}

		/**
		 * @memberof WebComponents.cq-ui-manager
		 * @alias ifAllClosed
		 */
		ifAllClosed() {
			if (!this.activeMenuStack.length) {
				$("cq-context,*[cq-context]").each(function () {
					if (this.CIQ && this.CIQ.UI && this.CIQ.UI.context && this.CIQ.UI.context.stx)
						this.CIQ.UI.context.stx.modalEnd();
				});
			}
		}

		/**
		 * Lifts a menu to an absolute position on the body, so that it can rise above any
		 * overflow: hidden, scroll or iscroll situations.
		 *
		 * Designed to be used as a helper method for the included {@link WebComponents}. A full tutorial on how to work with and customize the WebComponents can be found here: {@tutorial Web Component Interface}
		 *
		 * Use cq-lift attribute to indicate that the menu should be lifted when opened
		 *
		 * context.lifts is an array that contains all of the current lifts so that they can be restored when the menu is closed
		 * @memberof WebComponents.cq-ui-manager
		 */
		lift(element) {
			var node = $(element);
			if (!node.length) return;
			var n = $(node)[0];
			n.remember = {
				parentNode: n.parentNode,
				css: {
					position: n.style.position,
					display: n.style.display,
					left: n.style.left,
					top: n.style.top,
					height: n.style.height,
					width: n.style.width,
					opacity: n.style.opacity,
				},
			};
			var offset = n.getBoundingClientRect();
			var height = node.prop("scrollHeight");
			node.detach();
			node.prop("reduceMenuHeight", 5);
			node.css({
				position: "absolute",
				display: "block",
				left: offset.left + "px",
				top: offset.top + "px",
				height: height + "px",
				opacity: 1,
			});
			$("body").append(node);
			if (typeof n.resize != "undefined") n.resize();
			node.find("cq-scroll").each(function () {
				this.resize();
			});
			// };
		}

		/**
		 * Opens a menu item within the UI.Context.
		 *
		 * Designed to be used as a helper method for the included {@link WebComponents}. A full tutorial on how to work with and customize the WebComponents can be found here: {@tutorial Web Component Interface}
		 *
		 * @memberof WebComponents.cq-ui-manager
		 * @alias openMenu
		 * @param {HTMLElement} menu
		 * @param {object} params
		 */
		openMenu(menu, params) {
			// Find the first input box, if any, and give focus
			setTimeout(function () {
				$(menu).find("input[cq-focus]:first-child").focus();
			}, 0);
			this.activeMenuStack.push(menu);
			menu.show(params);
			$("cq-context,*[cq-context]").each(function () {
				if (this.CIQ && this.CIQ.UI && this.CIQ.UI.context && this.CIQ.UI.context.stx)
					this.CIQ.UI.context.stx.modalBegin();
			});
		}

		/**
		 *
		 * @memberof WebComponents.cq-ui-manager
		 * @alias registerForResize
		 * @param {HTMLElement} element
		 * @private
		 */
		registerForResize(element) {
			this.registeredForResize.push(element);
		}

		/**
		 *
		 * @memberof WebComponents.cq-ui-manager
		 * @alias restoreLift
		 * @param {HTMLElement} element
		 */
		restoreLift(element) {
			var node = $(element);
			if (!node.length) return;
			var remember = node[0].remember;
			node.detach();
			node.css(remember.css);
			$(remember.parentNode).append(node);
		}

		/**
		 * Sets the top level menu in the activeMenuStack.
		 *
		 * Designed to be used as a helper method for the included {@link WebComponents}. A full tutorial on how to work with and customize the WebComponents can be found here: {@tutorial Web Component Interface}
		 *
		 * @memberof WebComponents.cq-ui-manager
		 * @alias topMenu
		 * @return activeMenuStack
		 */
		topMenu() {
			var activeMenuStack = this.activeMenuStack;
			if (!activeMenuStack.length) return null;
			return activeMenuStack[activeMenuStack.length - 1];
		}

		/**
		 * @memberof WebComponents.cq-ui-manager
		 * @alias unregisterForResize
		 * @param {HTMLElement} element
		 * @private
		 */
		unregisterForResize(element) {
			var rr = this.registeredForResize;
			for (var i = 0; i < rr.length; i++) {
				if (rr[i] === element) {
					rr.splice(i, 1);
					return;
				}
			}
		}
	}
	CIQ.UI.UIManager = UIManager;

	customElements.define("cq-ui-manager", UIManager);
	return _exports;
});
