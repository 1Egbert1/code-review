#!/usr/bin/env node
import{createRequire as __cr}from 'node:module';const require=__cr(import.meta.url);
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __commonJS = (cb, mod) => function __require2() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/nodes/identity.js
var require_identity = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/nodes/identity.js"(exports) {
    "use strict";
    var ALIAS = /* @__PURE__ */ Symbol.for("yaml.alias");
    var DOC = /* @__PURE__ */ Symbol.for("yaml.document");
    var MAP = /* @__PURE__ */ Symbol.for("yaml.map");
    var PAIR = /* @__PURE__ */ Symbol.for("yaml.pair");
    var SCALAR = /* @__PURE__ */ Symbol.for("yaml.scalar");
    var SEQ = /* @__PURE__ */ Symbol.for("yaml.seq");
    var NODE_TYPE = /* @__PURE__ */ Symbol.for("yaml.node.type");
    var isAlias = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === ALIAS;
    var isDocument = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === DOC;
    var isMap = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === MAP;
    var isPair = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === PAIR;
    var isScalar = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === SCALAR;
    var isSeq = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === SEQ;
    function isCollection(node) {
      if (node && typeof node === "object")
        switch (node[NODE_TYPE]) {
          case MAP:
          case SEQ:
            return true;
        }
      return false;
    }
    function isNode(node) {
      if (node && typeof node === "object")
        switch (node[NODE_TYPE]) {
          case ALIAS:
          case MAP:
          case SCALAR:
          case SEQ:
            return true;
        }
      return false;
    }
    var hasAnchor = (node) => (isScalar(node) || isCollection(node)) && !!node.anchor;
    exports.ALIAS = ALIAS;
    exports.DOC = DOC;
    exports.MAP = MAP;
    exports.NODE_TYPE = NODE_TYPE;
    exports.PAIR = PAIR;
    exports.SCALAR = SCALAR;
    exports.SEQ = SEQ;
    exports.hasAnchor = hasAnchor;
    exports.isAlias = isAlias;
    exports.isCollection = isCollection;
    exports.isDocument = isDocument;
    exports.isMap = isMap;
    exports.isNode = isNode;
    exports.isPair = isPair;
    exports.isScalar = isScalar;
    exports.isSeq = isSeq;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/visit.js
var require_visit = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/visit.js"(exports) {
    "use strict";
    var identity = require_identity();
    var BREAK = /* @__PURE__ */ Symbol("break visit");
    var SKIP = /* @__PURE__ */ Symbol("skip children");
    var REMOVE = /* @__PURE__ */ Symbol("remove node");
    function visit(node, visitor) {
      const visitor_ = initVisitor(visitor);
      if (identity.isDocument(node)) {
        const cd = visit_(null, node.contents, visitor_, Object.freeze([node]));
        if (cd === REMOVE)
          node.contents = null;
      } else
        visit_(null, node, visitor_, Object.freeze([]));
    }
    visit.BREAK = BREAK;
    visit.SKIP = SKIP;
    visit.REMOVE = REMOVE;
    function visit_(key, node, visitor, path) {
      const ctrl = callVisitor(key, node, visitor, path);
      if (identity.isNode(ctrl) || identity.isPair(ctrl)) {
        replaceNode(key, path, ctrl);
        return visit_(key, ctrl, visitor, path);
      }
      if (typeof ctrl !== "symbol") {
        if (identity.isCollection(node)) {
          path = Object.freeze(path.concat(node));
          for (let i = 0; i < node.items.length; ++i) {
            const ci = visit_(i, node.items[i], visitor, path);
            if (typeof ci === "number")
              i = ci - 1;
            else if (ci === BREAK)
              return BREAK;
            else if (ci === REMOVE) {
              node.items.splice(i, 1);
              i -= 1;
            }
          }
        } else if (identity.isPair(node)) {
          path = Object.freeze(path.concat(node));
          const ck = visit_("key", node.key, visitor, path);
          if (ck === BREAK)
            return BREAK;
          else if (ck === REMOVE)
            node.key = null;
          const cv = visit_("value", node.value, visitor, path);
          if (cv === BREAK)
            return BREAK;
          else if (cv === REMOVE)
            node.value = null;
        }
      }
      return ctrl;
    }
    async function visitAsync(node, visitor) {
      const visitor_ = initVisitor(visitor);
      if (identity.isDocument(node)) {
        const cd = await visitAsync_(null, node.contents, visitor_, Object.freeze([node]));
        if (cd === REMOVE)
          node.contents = null;
      } else
        await visitAsync_(null, node, visitor_, Object.freeze([]));
    }
    visitAsync.BREAK = BREAK;
    visitAsync.SKIP = SKIP;
    visitAsync.REMOVE = REMOVE;
    async function visitAsync_(key, node, visitor, path) {
      const ctrl = await callVisitor(key, node, visitor, path);
      if (identity.isNode(ctrl) || identity.isPair(ctrl)) {
        replaceNode(key, path, ctrl);
        return visitAsync_(key, ctrl, visitor, path);
      }
      if (typeof ctrl !== "symbol") {
        if (identity.isCollection(node)) {
          path = Object.freeze(path.concat(node));
          for (let i = 0; i < node.items.length; ++i) {
            const ci = await visitAsync_(i, node.items[i], visitor, path);
            if (typeof ci === "number")
              i = ci - 1;
            else if (ci === BREAK)
              return BREAK;
            else if (ci === REMOVE) {
              node.items.splice(i, 1);
              i -= 1;
            }
          }
        } else if (identity.isPair(node)) {
          path = Object.freeze(path.concat(node));
          const ck = await visitAsync_("key", node.key, visitor, path);
          if (ck === BREAK)
            return BREAK;
          else if (ck === REMOVE)
            node.key = null;
          const cv = await visitAsync_("value", node.value, visitor, path);
          if (cv === BREAK)
            return BREAK;
          else if (cv === REMOVE)
            node.value = null;
        }
      }
      return ctrl;
    }
    function initVisitor(visitor) {
      if (typeof visitor === "object" && (visitor.Collection || visitor.Node || visitor.Value)) {
        return Object.assign({
          Alias: visitor.Node,
          Map: visitor.Node,
          Scalar: visitor.Node,
          Seq: visitor.Node
        }, visitor.Value && {
          Map: visitor.Value,
          Scalar: visitor.Value,
          Seq: visitor.Value
        }, visitor.Collection && {
          Map: visitor.Collection,
          Seq: visitor.Collection
        }, visitor);
      }
      return visitor;
    }
    function callVisitor(key, node, visitor, path) {
      if (typeof visitor === "function")
        return visitor(key, node, path);
      if (identity.isMap(node))
        return visitor.Map?.(key, node, path);
      if (identity.isSeq(node))
        return visitor.Seq?.(key, node, path);
      if (identity.isPair(node))
        return visitor.Pair?.(key, node, path);
      if (identity.isScalar(node))
        return visitor.Scalar?.(key, node, path);
      if (identity.isAlias(node))
        return visitor.Alias?.(key, node, path);
      return void 0;
    }
    function replaceNode(key, path, node) {
      const parent = path[path.length - 1];
      if (identity.isCollection(parent)) {
        parent.items[key] = node;
      } else if (identity.isPair(parent)) {
        if (key === "key")
          parent.key = node;
        else
          parent.value = node;
      } else if (identity.isDocument(parent)) {
        parent.contents = node;
      } else {
        const pt = identity.isAlias(parent) ? "alias" : "scalar";
        throw new Error(`Cannot replace node with ${pt} parent`);
      }
    }
    exports.visit = visit;
    exports.visitAsync = visitAsync;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/doc/directives.js
var require_directives = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/doc/directives.js"(exports) {
    "use strict";
    var identity = require_identity();
    var visit = require_visit();
    var escapeChars = {
      "!": "%21",
      ",": "%2C",
      "[": "%5B",
      "]": "%5D",
      "{": "%7B",
      "}": "%7D"
    };
    var escapeTagName = (tn) => tn.replace(/[!,[\]{}]/g, (ch) => escapeChars[ch]);
    var Directives = class _Directives {
      constructor(yaml, tags) {
        this.docStart = null;
        this.docEnd = false;
        this.yaml = Object.assign({}, _Directives.defaultYaml, yaml);
        this.tags = Object.assign({}, _Directives.defaultTags, tags);
      }
      clone() {
        const copy = new _Directives(this.yaml, this.tags);
        copy.docStart = this.docStart;
        return copy;
      }
      /**
       * During parsing, get a Directives instance for the current document and
       * update the stream state according to the current version's spec.
       */
      atDocument() {
        const res = new _Directives(this.yaml, this.tags);
        switch (this.yaml.version) {
          case "1.1":
            this.atNextDocument = true;
            break;
          case "1.2":
            this.atNextDocument = false;
            this.yaml = {
              explicit: _Directives.defaultYaml.explicit,
              version: "1.2"
            };
            this.tags = Object.assign({}, _Directives.defaultTags);
            break;
        }
        return res;
      }
      /**
       * @param onError - May be called even if the action was successful
       * @returns `true` on success
       */
      add(line, onError) {
        if (this.atNextDocument) {
          this.yaml = { explicit: _Directives.defaultYaml.explicit, version: "1.1" };
          this.tags = Object.assign({}, _Directives.defaultTags);
          this.atNextDocument = false;
        }
        const parts = line.trim().split(/[ \t]+/);
        const name = parts.shift();
        switch (name) {
          case "%TAG": {
            if (parts.length !== 2) {
              onError(0, "%TAG directive should contain exactly two parts");
              if (parts.length < 2)
                return false;
            }
            const [handle, prefix] = parts;
            this.tags[handle] = prefix;
            return true;
          }
          case "%YAML": {
            this.yaml.explicit = true;
            if (parts.length !== 1) {
              onError(0, "%YAML directive should contain exactly one part");
              return false;
            }
            const [version] = parts;
            if (version === "1.1" || version === "1.2") {
              this.yaml.version = version;
              return true;
            } else {
              const isValid = /^\d+\.\d+$/.test(version);
              onError(6, `Unsupported YAML version ${version}`, isValid);
              return false;
            }
          }
          default:
            onError(0, `Unknown directive ${name}`, true);
            return false;
        }
      }
      /**
       * Resolves a tag, matching handles to those defined in %TAG directives.
       *
       * @returns Resolved tag, which may also be the non-specific tag `'!'` or a
       *   `'!local'` tag, or `null` if unresolvable.
       */
      tagName(source, onError) {
        if (source === "!")
          return "!";
        if (source[0] !== "!") {
          onError(`Not a valid tag: ${source}`);
          return null;
        }
        if (source[1] === "<") {
          const verbatim = source.slice(2, -1);
          if (verbatim === "!" || verbatim === "!!") {
            onError(`Verbatim tags aren't resolved, so ${source} is invalid.`);
            return null;
          }
          if (source[source.length - 1] !== ">")
            onError("Verbatim tags must end with a >");
          return verbatim;
        }
        const [, handle, suffix] = source.match(/^(.*!)([^!]*)$/s);
        if (!suffix)
          onError(`The ${source} tag has no suffix`);
        const prefix = this.tags[handle];
        if (prefix) {
          try {
            return prefix + decodeURIComponent(suffix);
          } catch (error) {
            onError(String(error));
            return null;
          }
        }
        if (handle === "!")
          return source;
        onError(`Could not resolve tag: ${source}`);
        return null;
      }
      /**
       * Given a fully resolved tag, returns its printable string form,
       * taking into account current tag prefixes and defaults.
       */
      tagString(tag) {
        for (const [handle, prefix] of Object.entries(this.tags)) {
          if (tag.startsWith(prefix))
            return handle + escapeTagName(tag.substring(prefix.length));
        }
        return tag[0] === "!" ? tag : `!<${tag}>`;
      }
      toString(doc) {
        const lines = this.yaml.explicit ? [`%YAML ${this.yaml.version || "1.2"}`] : [];
        const tagEntries = Object.entries(this.tags);
        let tagNames;
        if (doc && tagEntries.length > 0 && identity.isNode(doc.contents)) {
          const tags = {};
          visit.visit(doc.contents, (_key, node) => {
            if (identity.isNode(node) && node.tag)
              tags[node.tag] = true;
          });
          tagNames = Object.keys(tags);
        } else
          tagNames = [];
        for (const [handle, prefix] of tagEntries) {
          if (handle === "!!" && prefix === "tag:yaml.org,2002:")
            continue;
          if (!doc || tagNames.some((tn) => tn.startsWith(prefix)))
            lines.push(`%TAG ${handle} ${prefix}`);
        }
        return lines.join("\n");
      }
    };
    Directives.defaultYaml = { explicit: false, version: "1.2" };
    Directives.defaultTags = { "!!": "tag:yaml.org,2002:" };
    exports.Directives = Directives;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/doc/anchors.js
var require_anchors = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/doc/anchors.js"(exports) {
    "use strict";
    var identity = require_identity();
    var visit = require_visit();
    function anchorIsValid(anchor) {
      if (/[\x00-\x19\s,[\]{}]/.test(anchor)) {
        const sa = JSON.stringify(anchor);
        const msg = `Anchor must not contain whitespace or control characters: ${sa}`;
        throw new Error(msg);
      }
      return true;
    }
    function anchorNames(root) {
      const anchors = /* @__PURE__ */ new Set();
      visit.visit(root, {
        Value(_key, node) {
          if (node.anchor)
            anchors.add(node.anchor);
        }
      });
      return anchors;
    }
    function findNewAnchor(prefix, exclude) {
      for (let i = 1; true; ++i) {
        const name = `${prefix}${i}`;
        if (!exclude.has(name))
          return name;
      }
    }
    function createNodeAnchors(doc, prefix) {
      const aliasObjects = [];
      const sourceObjects = /* @__PURE__ */ new Map();
      let prevAnchors = null;
      return {
        onAnchor: (source) => {
          aliasObjects.push(source);
          prevAnchors ?? (prevAnchors = anchorNames(doc));
          const anchor = findNewAnchor(prefix, prevAnchors);
          prevAnchors.add(anchor);
          return anchor;
        },
        /**
         * With circular references, the source node is only resolved after all
         * of its child nodes are. This is why anchors are set only after all of
         * the nodes have been created.
         */
        setAnchors: () => {
          for (const source of aliasObjects) {
            const ref = sourceObjects.get(source);
            if (typeof ref === "object" && ref.anchor && (identity.isScalar(ref.node) || identity.isCollection(ref.node))) {
              ref.node.anchor = ref.anchor;
            } else {
              const error = new Error("Failed to resolve repeated object (this should not happen)");
              error.source = source;
              throw error;
            }
          }
        },
        sourceObjects
      };
    }
    exports.anchorIsValid = anchorIsValid;
    exports.anchorNames = anchorNames;
    exports.createNodeAnchors = createNodeAnchors;
    exports.findNewAnchor = findNewAnchor;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/doc/applyReviver.js
var require_applyReviver = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/doc/applyReviver.js"(exports) {
    "use strict";
    function applyReviver(reviver, obj2, key, val) {
      if (val && typeof val === "object") {
        if (Array.isArray(val)) {
          for (let i = 0, len = val.length; i < len; ++i) {
            const v0 = val[i];
            const v1 = applyReviver(reviver, val, String(i), v0);
            if (v1 === void 0)
              delete val[i];
            else if (v1 !== v0)
              val[i] = v1;
          }
        } else if (val instanceof Map) {
          for (const k of Array.from(val.keys())) {
            const v0 = val.get(k);
            const v1 = applyReviver(reviver, val, k, v0);
            if (v1 === void 0)
              val.delete(k);
            else if (v1 !== v0)
              val.set(k, v1);
          }
        } else if (val instanceof Set) {
          for (const v0 of Array.from(val)) {
            const v1 = applyReviver(reviver, val, v0, v0);
            if (v1 === void 0)
              val.delete(v0);
            else if (v1 !== v0) {
              val.delete(v0);
              val.add(v1);
            }
          }
        } else {
          for (const [k, v0] of Object.entries(val)) {
            const v1 = applyReviver(reviver, val, k, v0);
            if (v1 === void 0)
              delete val[k];
            else if (v1 !== v0)
              val[k] = v1;
          }
        }
      }
      return reviver.call(obj2, key, val);
    }
    exports.applyReviver = applyReviver;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/nodes/toJS.js
var require_toJS = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/nodes/toJS.js"(exports) {
    "use strict";
    var identity = require_identity();
    function toJS(value, arg, ctx) {
      if (Array.isArray(value))
        return value.map((v, i) => toJS(v, String(i), ctx));
      if (value && typeof value.toJSON === "function") {
        if (!ctx || !identity.hasAnchor(value))
          return value.toJSON(arg, ctx);
        const data = { aliasCount: 0, count: 1, res: void 0 };
        ctx.anchors.set(value, data);
        ctx.onCreate = (res2) => {
          data.res = res2;
          delete ctx.onCreate;
        };
        const res = value.toJSON(arg, ctx);
        if (ctx.onCreate)
          ctx.onCreate(res);
        return res;
      }
      if (typeof value === "bigint" && !ctx?.keep)
        return Number(value);
      return value;
    }
    exports.toJS = toJS;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/nodes/Node.js
var require_Node = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/nodes/Node.js"(exports) {
    "use strict";
    var applyReviver = require_applyReviver();
    var identity = require_identity();
    var toJS = require_toJS();
    var NodeBase = class {
      constructor(type) {
        Object.defineProperty(this, identity.NODE_TYPE, { value: type });
      }
      /** Create a copy of this node.  */
      clone() {
        const copy = Object.create(Object.getPrototypeOf(this), Object.getOwnPropertyDescriptors(this));
        if (this.range)
          copy.range = this.range.slice();
        return copy;
      }
      /** A plain JavaScript representation of this node. */
      toJS(doc, { mapAsMap, maxAliasCount, onAnchor, reviver } = {}) {
        if (!identity.isDocument(doc))
          throw new TypeError("A document argument is required");
        const ctx = {
          anchors: /* @__PURE__ */ new Map(),
          doc,
          keep: true,
          mapAsMap: mapAsMap === true,
          mapKeyWarned: false,
          maxAliasCount: typeof maxAliasCount === "number" ? maxAliasCount : 100
        };
        const res = toJS.toJS(this, "", ctx);
        if (typeof onAnchor === "function")
          for (const { count, res: res2 } of ctx.anchors.values())
            onAnchor(res2, count);
        return typeof reviver === "function" ? applyReviver.applyReviver(reviver, { "": res }, "", res) : res;
      }
    };
    exports.NodeBase = NodeBase;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/nodes/Alias.js
var require_Alias = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/nodes/Alias.js"(exports) {
    "use strict";
    var anchors = require_anchors();
    var visit = require_visit();
    var identity = require_identity();
    var Node = require_Node();
    var toJS = require_toJS();
    var Alias = class extends Node.NodeBase {
      constructor(source) {
        super(identity.ALIAS);
        this.source = source;
        Object.defineProperty(this, "tag", {
          set() {
            throw new Error("Alias nodes cannot have tags");
          }
        });
      }
      /**
       * Resolve the value of this alias within `doc`, finding the last
       * instance of the `source` anchor before this node.
       */
      resolve(doc, ctx) {
        if (ctx?.maxAliasCount === 0)
          throw new ReferenceError("Alias resolution is disabled");
        let nodes;
        if (ctx?.aliasResolveCache) {
          nodes = ctx.aliasResolveCache;
        } else {
          nodes = [];
          visit.visit(doc, {
            Node: (_key, node) => {
              if (identity.isAlias(node) || identity.hasAnchor(node))
                nodes.push(node);
            }
          });
          if (ctx)
            ctx.aliasResolveCache = nodes;
        }
        let found = void 0;
        for (const node of nodes) {
          if (node === this)
            break;
          if (node.anchor === this.source)
            found = node;
        }
        if (found && ctx) {
          const { anchors: anchors2, doc: doc2, maxAliasCount } = ctx;
          let data = anchors2.get(found);
          if (!data) {
            toJS.toJS(found, null, ctx);
            data = anchors2.get(found);
          }
          if (data?.res === void 0) {
            const msg = "This should not happen: Alias anchor was not resolved?";
            throw new ReferenceError(msg);
          }
          if (maxAliasCount >= 0) {
            data.count += 1;
            if (data.aliasCount === 0)
              data.aliasCount = getAliasCount(doc2, found, anchors2);
            if (data.count * data.aliasCount > maxAliasCount) {
              const msg = "Excessive alias count indicates a resource exhaustion attack";
              throw new ReferenceError(msg);
            }
          }
        }
        return found;
      }
      toJSON(_arg, ctx) {
        if (!ctx)
          return { source: this.source };
        const source = this.resolve(ctx.doc, ctx);
        if (!source) {
          const msg = `Unresolved alias (the anchor must be set before the alias): ${this.source}`;
          throw new ReferenceError(msg);
        }
        return ctx.anchors.get(source).res;
      }
      toString(ctx, _onComment, _onChompKeep) {
        const src = `*${this.source}`;
        if (ctx) {
          anchors.anchorIsValid(this.source);
          if (ctx.options.verifyAliasOrder && !ctx.anchors.has(this.source)) {
            const msg = `Unresolved alias (the anchor must be set before the alias): ${this.source}`;
            throw new Error(msg);
          }
          if (ctx.implicitKey)
            return `${src} `;
        }
        return src;
      }
    };
    function getAliasCount(doc, node, anchors2) {
      if (identity.isAlias(node)) {
        const source = node.resolve(doc);
        const anchor = anchors2 && source && anchors2.get(source);
        return anchor ? anchor.count * anchor.aliasCount : 0;
      } else if (identity.isCollection(node)) {
        let count = 0;
        for (const item of node.items) {
          const c = getAliasCount(doc, item, anchors2);
          if (c > count)
            count = c;
        }
        return count;
      } else if (identity.isPair(node)) {
        const kc = getAliasCount(doc, node.key, anchors2);
        const vc = getAliasCount(doc, node.value, anchors2);
        return Math.max(kc, vc);
      }
      return 1;
    }
    exports.Alias = Alias;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/nodes/Scalar.js
var require_Scalar = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/nodes/Scalar.js"(exports) {
    "use strict";
    var identity = require_identity();
    var Node = require_Node();
    var toJS = require_toJS();
    var isScalarValue = (value) => !value || typeof value !== "function" && typeof value !== "object";
    var Scalar = class extends Node.NodeBase {
      constructor(value) {
        super(identity.SCALAR);
        this.value = value;
      }
      toJSON(arg, ctx) {
        return ctx?.keep ? this.value : toJS.toJS(this.value, arg, ctx);
      }
      toString() {
        return String(this.value);
      }
    };
    Scalar.BLOCK_FOLDED = "BLOCK_FOLDED";
    Scalar.BLOCK_LITERAL = "BLOCK_LITERAL";
    Scalar.PLAIN = "PLAIN";
    Scalar.QUOTE_DOUBLE = "QUOTE_DOUBLE";
    Scalar.QUOTE_SINGLE = "QUOTE_SINGLE";
    exports.Scalar = Scalar;
    exports.isScalarValue = isScalarValue;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/doc/createNode.js
var require_createNode = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/doc/createNode.js"(exports) {
    "use strict";
    var Alias = require_Alias();
    var identity = require_identity();
    var Scalar = require_Scalar();
    var defaultTagPrefix = "tag:yaml.org,2002:";
    function findTagObject(value, tagName, tags) {
      if (tagName) {
        const match = tags.filter((t) => t.tag === tagName);
        const tagObj = match.find((t) => !t.format) ?? match[0];
        if (!tagObj)
          throw new Error(`Tag ${tagName} not found`);
        return tagObj;
      }
      return tags.find((t) => t.identify?.(value) && !t.format);
    }
    function createNode(value, tagName, ctx) {
      if (identity.isDocument(value))
        value = value.contents;
      if (identity.isNode(value))
        return value;
      if (identity.isPair(value)) {
        const map = ctx.schema[identity.MAP].createNode?.(ctx.schema, null, ctx);
        map.items.push(value);
        return map;
      }
      if (value instanceof String || value instanceof Number || value instanceof Boolean || typeof BigInt !== "undefined" && value instanceof BigInt) {
        value = value.valueOf();
      }
      const { aliasDuplicateObjects, onAnchor, onTagObj, schema, sourceObjects } = ctx;
      let ref = void 0;
      if (aliasDuplicateObjects && value && typeof value === "object") {
        ref = sourceObjects.get(value);
        if (ref) {
          ref.anchor ?? (ref.anchor = onAnchor(value));
          return new Alias.Alias(ref.anchor);
        } else {
          ref = { anchor: null, node: null };
          sourceObjects.set(value, ref);
        }
      }
      if (tagName?.startsWith("!!"))
        tagName = defaultTagPrefix + tagName.slice(2);
      let tagObj = findTagObject(value, tagName, schema.tags);
      if (!tagObj) {
        if (value && typeof value.toJSON === "function") {
          value = value.toJSON();
        }
        if (!value || typeof value !== "object") {
          const node2 = new Scalar.Scalar(value);
          if (ref)
            ref.node = node2;
          return node2;
        }
        tagObj = value instanceof Map ? schema[identity.MAP] : Symbol.iterator in Object(value) ? schema[identity.SEQ] : schema[identity.MAP];
      }
      if (onTagObj) {
        onTagObj(tagObj);
        delete ctx.onTagObj;
      }
      const node = tagObj?.createNode ? tagObj.createNode(ctx.schema, value, ctx) : typeof tagObj?.nodeClass?.from === "function" ? tagObj.nodeClass.from(ctx.schema, value, ctx) : new Scalar.Scalar(value);
      if (tagName)
        node.tag = tagName;
      else if (!tagObj.default)
        node.tag = tagObj.tag;
      if (ref)
        ref.node = node;
      return node;
    }
    exports.createNode = createNode;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/nodes/Collection.js
var require_Collection = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/nodes/Collection.js"(exports) {
    "use strict";
    var createNode = require_createNode();
    var identity = require_identity();
    var Node = require_Node();
    function collectionFromPath(schema, path, value) {
      let v = value;
      for (let i = path.length - 1; i >= 0; --i) {
        const k = path[i];
        if (typeof k === "number" && Number.isInteger(k) && k >= 0) {
          const a = [];
          a[k] = v;
          v = a;
        } else {
          v = /* @__PURE__ */ new Map([[k, v]]);
        }
      }
      return createNode.createNode(v, void 0, {
        aliasDuplicateObjects: false,
        keepUndefined: false,
        onAnchor: () => {
          throw new Error("This should not happen, please report a bug.");
        },
        schema,
        sourceObjects: /* @__PURE__ */ new Map()
      });
    }
    var isEmptyPath = (path) => path == null || typeof path === "object" && !!path[Symbol.iterator]().next().done;
    var Collection2 = class extends Node.NodeBase {
      constructor(type, schema) {
        super(type);
        Object.defineProperty(this, "schema", {
          value: schema,
          configurable: true,
          enumerable: false,
          writable: true
        });
      }
      /**
       * Create a copy of this collection.
       *
       * @param schema - If defined, overwrites the original's schema
       */
      clone(schema) {
        const copy = Object.create(Object.getPrototypeOf(this), Object.getOwnPropertyDescriptors(this));
        if (schema)
          copy.schema = schema;
        copy.items = copy.items.map((it) => identity.isNode(it) || identity.isPair(it) ? it.clone(schema) : it);
        if (this.range)
          copy.range = this.range.slice();
        return copy;
      }
      /**
       * Adds a value to the collection. For `!!map` and `!!omap` the value must
       * be a Pair instance or a `{ key, value }` object, which may not have a key
       * that already exists in the map.
       */
      addIn(path, value) {
        if (isEmptyPath(path))
          this.add(value);
        else {
          const [key, ...rest] = path;
          const node = this.get(key, true);
          if (identity.isCollection(node))
            node.addIn(rest, value);
          else if (node === void 0 && this.schema)
            this.set(key, collectionFromPath(this.schema, rest, value));
          else
            throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
        }
      }
      /**
       * Removes a value from the collection.
       * @returns `true` if the item was found and removed.
       */
      deleteIn(path) {
        const [key, ...rest] = path;
        if (rest.length === 0)
          return this.delete(key);
        const node = this.get(key, true);
        if (identity.isCollection(node))
          return node.deleteIn(rest);
        else
          throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
      }
      /**
       * Returns item at `key`, or `undefined` if not found. By default unwraps
       * scalar values from their surrounding node; to disable set `keepScalar` to
       * `true` (collections are always returned intact).
       */
      getIn(path, keepScalar) {
        const [key, ...rest] = path;
        const node = this.get(key, true);
        if (rest.length === 0)
          return !keepScalar && identity.isScalar(node) ? node.value : node;
        else
          return identity.isCollection(node) ? node.getIn(rest, keepScalar) : void 0;
      }
      hasAllNullValues(allowScalar) {
        return this.items.every((node) => {
          if (!identity.isPair(node))
            return false;
          const n = node.value;
          return n == null || allowScalar && identity.isScalar(n) && n.value == null && !n.commentBefore && !n.comment && !n.tag;
        });
      }
      /**
       * Checks if the collection includes a value with the key `key`.
       */
      hasIn(path) {
        const [key, ...rest] = path;
        if (rest.length === 0)
          return this.has(key);
        const node = this.get(key, true);
        return identity.isCollection(node) ? node.hasIn(rest) : false;
      }
      /**
       * Sets a value in this collection. For `!!set`, `value` needs to be a
       * boolean to add/remove the item from the set.
       */
      setIn(path, value) {
        const [key, ...rest] = path;
        if (rest.length === 0) {
          this.set(key, value);
        } else {
          const node = this.get(key, true);
          if (identity.isCollection(node))
            node.setIn(rest, value);
          else if (node === void 0 && this.schema)
            this.set(key, collectionFromPath(this.schema, rest, value));
          else
            throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
        }
      }
    };
    exports.Collection = Collection2;
    exports.collectionFromPath = collectionFromPath;
    exports.isEmptyPath = isEmptyPath;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/stringify/stringifyComment.js
var require_stringifyComment = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/stringify/stringifyComment.js"(exports) {
    "use strict";
    var stringifyComment = (str2) => str2.replace(/^(?!$)(?: $)?/gm, "#");
    function indentComment(comment, indent) {
      if (/^\n+$/.test(comment))
        return comment.substring(1);
      return indent ? comment.replace(/^(?! *$)/gm, indent) : comment;
    }
    var lineComment = (str2, indent, comment) => str2.endsWith("\n") ? indentComment(comment, indent) : comment.includes("\n") ? "\n" + indentComment(comment, indent) : (str2.endsWith(" ") ? "" : " ") + comment;
    exports.indentComment = indentComment;
    exports.lineComment = lineComment;
    exports.stringifyComment = stringifyComment;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/stringify/foldFlowLines.js
var require_foldFlowLines = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/stringify/foldFlowLines.js"(exports) {
    "use strict";
    var FOLD_FLOW = "flow";
    var FOLD_BLOCK = "block";
    var FOLD_QUOTED = "quoted";
    function foldFlowLines(text2, indent, mode = "flow", { indentAtStart, lineWidth = 80, minContentWidth = 20, onFold, onOverflow } = {}) {
      if (!lineWidth || lineWidth < 0)
        return text2;
      if (lineWidth < minContentWidth)
        minContentWidth = 0;
      const endStep = Math.max(1 + minContentWidth, 1 + lineWidth - indent.length);
      if (text2.length <= endStep)
        return text2;
      const folds = [];
      const escapedFolds = {};
      let end = lineWidth - indent.length;
      if (typeof indentAtStart === "number") {
        if (indentAtStart > lineWidth - Math.max(2, minContentWidth))
          folds.push(0);
        else
          end = lineWidth - indentAtStart;
      }
      let split = void 0;
      let prev = void 0;
      let overflow = false;
      let i = -1;
      let escStart = -1;
      let escEnd = -1;
      if (mode === FOLD_BLOCK) {
        i = consumeMoreIndentedLines(text2, i, indent.length);
        if (i !== -1)
          end = i + endStep;
      }
      for (let ch; ch = text2[i += 1]; ) {
        if (mode === FOLD_QUOTED && ch === "\\") {
          escStart = i;
          switch (text2[i + 1]) {
            case "x":
              i += 3;
              break;
            case "u":
              i += 5;
              break;
            case "U":
              i += 9;
              break;
            default:
              i += 1;
          }
          escEnd = i;
        }
        if (ch === "\n") {
          if (mode === FOLD_BLOCK)
            i = consumeMoreIndentedLines(text2, i, indent.length);
          end = i + indent.length + endStep;
          split = void 0;
        } else {
          if (ch === " " && prev && prev !== " " && prev !== "\n" && prev !== "	") {
            const next = text2[i + 1];
            if (next && next !== " " && next !== "\n" && next !== "	")
              split = i;
          }
          if (i >= end) {
            if (split) {
              folds.push(split);
              end = split + endStep;
              split = void 0;
            } else if (mode === FOLD_QUOTED) {
              while (prev === " " || prev === "	") {
                prev = ch;
                ch = text2[i += 1];
                overflow = true;
              }
              const j = i > escEnd + 1 ? i - 2 : escStart - 1;
              if (escapedFolds[j])
                return text2;
              folds.push(j);
              escapedFolds[j] = true;
              end = j + endStep;
              split = void 0;
            } else {
              overflow = true;
            }
          }
        }
        prev = ch;
      }
      if (overflow && onOverflow)
        onOverflow();
      if (folds.length === 0)
        return text2;
      if (onFold)
        onFold();
      let res = text2.slice(0, folds[0]);
      for (let i2 = 0; i2 < folds.length; ++i2) {
        const fold = folds[i2];
        const end2 = folds[i2 + 1] || text2.length;
        if (fold === 0)
          res = `
${indent}${text2.slice(0, end2)}`;
        else {
          if (mode === FOLD_QUOTED && escapedFolds[fold])
            res += `${text2[fold]}\\`;
          res += `
${indent}${text2.slice(fold + 1, end2)}`;
        }
      }
      return res;
    }
    function consumeMoreIndentedLines(text2, i, indent) {
      let end = i;
      let start = i + 1;
      let ch = text2[start];
      while (ch === " " || ch === "	") {
        if (i < start + indent) {
          ch = text2[++i];
        } else {
          do {
            ch = text2[++i];
          } while (ch && ch !== "\n");
          end = i;
          start = i + 1;
          ch = text2[start];
        }
      }
      return end;
    }
    exports.FOLD_BLOCK = FOLD_BLOCK;
    exports.FOLD_FLOW = FOLD_FLOW;
    exports.FOLD_QUOTED = FOLD_QUOTED;
    exports.foldFlowLines = foldFlowLines;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/stringify/stringifyString.js
var require_stringifyString = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/stringify/stringifyString.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    var foldFlowLines = require_foldFlowLines();
    var getFoldOptions = (ctx, isBlock) => ({
      indentAtStart: isBlock ? ctx.indent.length : ctx.indentAtStart,
      lineWidth: ctx.options.lineWidth,
      minContentWidth: ctx.options.minContentWidth
    });
    var containsDocumentMarker = (str2) => /^(%|---|\.\.\.)/m.test(str2);
    function lineLengthOverLimit(str2, lineWidth, indentLength) {
      if (!lineWidth || lineWidth < 0)
        return false;
      const limit = lineWidth - indentLength;
      const strLen = str2.length;
      if (strLen <= limit)
        return false;
      for (let i = 0, start = 0; i < strLen; ++i) {
        if (str2[i] === "\n") {
          if (i - start > limit)
            return true;
          start = i + 1;
          if (strLen - start <= limit)
            return false;
        }
      }
      return true;
    }
    function doubleQuotedString(value, ctx) {
      const json = JSON.stringify(value);
      if (ctx.options.doubleQuotedAsJSON)
        return json;
      const { implicitKey } = ctx;
      const minMultiLineLength = ctx.options.doubleQuotedMinMultiLineLength;
      const indent = ctx.indent || (containsDocumentMarker(value) ? "  " : "");
      let str2 = "";
      let start = 0;
      for (let i = 0, ch = json[i]; ch; ch = json[++i]) {
        if (ch === " " && json[i + 1] === "\\" && json[i + 2] === "n") {
          str2 += json.slice(start, i) + "\\ ";
          i += 1;
          start = i;
          ch = "\\";
        }
        if (ch === "\\")
          switch (json[i + 1]) {
            case "u":
              {
                str2 += json.slice(start, i);
                const code = json.substr(i + 2, 4);
                switch (code) {
                  case "0000":
                    str2 += "\\0";
                    break;
                  case "0007":
                    str2 += "\\a";
                    break;
                  case "000b":
                    str2 += "\\v";
                    break;
                  case "001b":
                    str2 += "\\e";
                    break;
                  case "0085":
                    str2 += "\\N";
                    break;
                  case "00a0":
                    str2 += "\\_";
                    break;
                  case "2028":
                    str2 += "\\L";
                    break;
                  case "2029":
                    str2 += "\\P";
                    break;
                  default:
                    if (code.substr(0, 2) === "00")
                      str2 += "\\x" + code.substr(2);
                    else
                      str2 += json.substr(i, 6);
                }
                i += 5;
                start = i + 1;
              }
              break;
            case "n":
              if (implicitKey || json[i + 2] === '"' || json.length < minMultiLineLength) {
                i += 1;
              } else {
                str2 += json.slice(start, i) + "\n\n";
                while (json[i + 2] === "\\" && json[i + 3] === "n" && json[i + 4] !== '"') {
                  str2 += "\n";
                  i += 2;
                }
                str2 += indent;
                if (json[i + 2] === " ")
                  str2 += "\\";
                i += 1;
                start = i + 1;
              }
              break;
            default:
              i += 1;
          }
      }
      str2 = start ? str2 + json.slice(start) : json;
      return implicitKey ? str2 : foldFlowLines.foldFlowLines(str2, indent, foldFlowLines.FOLD_QUOTED, getFoldOptions(ctx, false));
    }
    function singleQuotedString(value, ctx) {
      if (ctx.options.singleQuote === false || ctx.implicitKey && value.includes("\n") || /[ \t]\n|\n[ \t]/.test(value))
        return doubleQuotedString(value, ctx);
      const indent = ctx.indent || (containsDocumentMarker(value) ? "  " : "");
      const res = "'" + value.replace(/'/g, "''").replace(/\n+/g, `$&
${indent}`) + "'";
      return ctx.implicitKey ? res : foldFlowLines.foldFlowLines(res, indent, foldFlowLines.FOLD_FLOW, getFoldOptions(ctx, false));
    }
    function quotedString(value, ctx) {
      const { singleQuote } = ctx.options;
      let qs;
      if (singleQuote === false)
        qs = doubleQuotedString;
      else {
        const hasDouble = value.includes('"');
        const hasSingle = value.includes("'");
        if (hasDouble && !hasSingle)
          qs = singleQuotedString;
        else if (hasSingle && !hasDouble)
          qs = doubleQuotedString;
        else
          qs = singleQuote ? singleQuotedString : doubleQuotedString;
      }
      return qs(value, ctx);
    }
    var blockEndNewlines;
    try {
      blockEndNewlines = new RegExp("(^|(?<!\n))\n+(?!\n|$)", "g");
    } catch {
      blockEndNewlines = /\n+(?!\n|$)/g;
    }
    function blockString({ comment, type, value }, ctx, onComment, onChompKeep) {
      const { blockQuote, commentString, lineWidth } = ctx.options;
      if (!blockQuote || /\n[\t ]+$/.test(value)) {
        return quotedString(value, ctx);
      }
      const indent = ctx.indent || (ctx.forceBlockIndent || containsDocumentMarker(value) ? "  " : "");
      const literal = blockQuote === "literal" ? true : blockQuote === "folded" || type === Scalar.Scalar.BLOCK_FOLDED ? false : type === Scalar.Scalar.BLOCK_LITERAL ? true : !lineLengthOverLimit(value, lineWidth, indent.length);
      if (!value)
        return literal ? "|\n" : ">\n";
      let chomp;
      let endStart;
      for (endStart = value.length; endStart > 0; --endStart) {
        const ch = value[endStart - 1];
        if (ch !== "\n" && ch !== "	" && ch !== " ")
          break;
      }
      let end = value.substring(endStart);
      const endNlPos = end.indexOf("\n");
      if (endNlPos === -1) {
        chomp = "-";
      } else if (value === end || endNlPos !== end.length - 1) {
        chomp = "+";
        if (onChompKeep)
          onChompKeep();
      } else {
        chomp = "";
      }
      if (end) {
        value = value.slice(0, -end.length);
        if (end[end.length - 1] === "\n")
          end = end.slice(0, -1);
        end = end.replace(blockEndNewlines, `$&${indent}`);
      }
      let startWithSpace = false;
      let startEnd;
      let startNlPos = -1;
      for (startEnd = 0; startEnd < value.length; ++startEnd) {
        const ch = value[startEnd];
        if (ch === " ")
          startWithSpace = true;
        else if (ch === "\n")
          startNlPos = startEnd;
        else
          break;
      }
      let start = value.substring(0, startNlPos < startEnd ? startNlPos + 1 : startEnd);
      if (start) {
        value = value.substring(start.length);
        start = start.replace(/\n+/g, `$&${indent}`);
      }
      const indentSize = indent ? "2" : "1";
      let header = (startWithSpace ? indentSize : "") + chomp;
      if (comment) {
        header += " " + commentString(comment.replace(/ ?[\r\n]+/g, " "));
        if (onComment)
          onComment();
      }
      if (!literal) {
        const foldedValue = value.replace(/\n+/g, "\n$&").replace(/(?:^|\n)([\t ].*)(?:([\n\t ]*)\n(?![\n\t ]))?/g, "$1$2").replace(/\n+/g, `$&${indent}`);
        let literalFallback = false;
        const foldOptions = getFoldOptions(ctx, true);
        if (blockQuote !== "folded" && type !== Scalar.Scalar.BLOCK_FOLDED) {
          foldOptions.onOverflow = () => {
            literalFallback = true;
          };
        }
        const body = foldFlowLines.foldFlowLines(`${start}${foldedValue}${end}`, indent, foldFlowLines.FOLD_BLOCK, foldOptions);
        if (!literalFallback)
          return `>${header}
${indent}${body}`;
      }
      value = value.replace(/\n+/g, `$&${indent}`);
      return `|${header}
${indent}${start}${value}${end}`;
    }
    function plainString(item, ctx, onComment, onChompKeep) {
      const { type, value } = item;
      const { actualString, implicitKey, indent, indentStep, inFlow } = ctx;
      if (implicitKey && value.includes("\n") || inFlow && /[[\]{},]/.test(value)) {
        return quotedString(value, ctx);
      }
      if (/^[\n\t ,[\]{}#&*!|>'"%@`]|^[?-]$|^[?-][ \t]|[\n:][ \t]|[ \t]\n|[\n\t ]#|[\n\t :]$/.test(value)) {
        return implicitKey || inFlow || !value.includes("\n") ? quotedString(value, ctx) : blockString(item, ctx, onComment, onChompKeep);
      }
      if (!implicitKey && !inFlow && type !== Scalar.Scalar.PLAIN && value.includes("\n")) {
        return blockString(item, ctx, onComment, onChompKeep);
      }
      if (containsDocumentMarker(value)) {
        if (indent === "") {
          ctx.forceBlockIndent = true;
          return blockString(item, ctx, onComment, onChompKeep);
        } else if (implicitKey && indent === indentStep) {
          return quotedString(value, ctx);
        }
      }
      const str2 = value.replace(/\n+/g, `$&
${indent}`);
      if (actualString) {
        const test = (tag) => tag.default && tag.tag !== "tag:yaml.org,2002:str" && tag.test?.test(str2);
        const { compat, tags } = ctx.doc.schema;
        if (tags.some(test) || compat?.some(test))
          return quotedString(value, ctx);
      }
      return implicitKey ? str2 : foldFlowLines.foldFlowLines(str2, indent, foldFlowLines.FOLD_FLOW, getFoldOptions(ctx, false));
    }
    function stringifyString(item, ctx, onComment, onChompKeep) {
      const { implicitKey, inFlow } = ctx;
      const ss = typeof item.value === "string" ? item : Object.assign({}, item, { value: String(item.value) });
      let { type } = item;
      if (type !== Scalar.Scalar.QUOTE_DOUBLE) {
        if (/[\x00-\x08\x0b-\x1f\x7f-\x9f\u{D800}-\u{DFFF}]/u.test(ss.value))
          type = Scalar.Scalar.QUOTE_DOUBLE;
      }
      const _stringify = (_type) => {
        switch (_type) {
          case Scalar.Scalar.BLOCK_FOLDED:
          case Scalar.Scalar.BLOCK_LITERAL:
            return implicitKey || inFlow ? quotedString(ss.value, ctx) : blockString(ss, ctx, onComment, onChompKeep);
          case Scalar.Scalar.QUOTE_DOUBLE:
            return doubleQuotedString(ss.value, ctx);
          case Scalar.Scalar.QUOTE_SINGLE:
            return singleQuotedString(ss.value, ctx);
          case Scalar.Scalar.PLAIN:
            return plainString(ss, ctx, onComment, onChompKeep);
          default:
            return null;
        }
      };
      let res = _stringify(type);
      if (res === null) {
        const { defaultKeyType, defaultStringType } = ctx.options;
        const t = implicitKey && defaultKeyType || defaultStringType;
        res = _stringify(t);
        if (res === null)
          throw new Error(`Unsupported default string type ${t}`);
      }
      return res;
    }
    exports.stringifyString = stringifyString;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/stringify/stringify.js
var require_stringify = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/stringify/stringify.js"(exports) {
    "use strict";
    var anchors = require_anchors();
    var identity = require_identity();
    var stringifyComment = require_stringifyComment();
    var stringifyString = require_stringifyString();
    function createStringifyContext(doc, options) {
      const opt = Object.assign({
        blockQuote: true,
        commentString: stringifyComment.stringifyComment,
        defaultKeyType: null,
        defaultStringType: "PLAIN",
        directives: null,
        doubleQuotedAsJSON: false,
        doubleQuotedMinMultiLineLength: 40,
        falseStr: "false",
        flowCollectionPadding: true,
        indentSeq: true,
        lineWidth: 80,
        minContentWidth: 20,
        nullStr: "null",
        simpleKeys: false,
        singleQuote: null,
        trailingComma: false,
        trueStr: "true",
        verifyAliasOrder: true
      }, doc.schema.toStringOptions, options);
      let inFlow;
      switch (opt.collectionStyle) {
        case "block":
          inFlow = false;
          break;
        case "flow":
          inFlow = true;
          break;
        default:
          inFlow = null;
      }
      return {
        anchors: /* @__PURE__ */ new Set(),
        doc,
        flowCollectionPadding: opt.flowCollectionPadding ? " " : "",
        indent: "",
        indentStep: typeof opt.indent === "number" ? " ".repeat(opt.indent) : "  ",
        inFlow,
        options: opt
      };
    }
    function getTagObject(tags, item) {
      if (item.tag) {
        const match = tags.filter((t) => t.tag === item.tag);
        if (match.length > 0)
          return match.find((t) => t.format === item.format) ?? match[0];
      }
      let tagObj = void 0;
      let obj2;
      if (identity.isScalar(item)) {
        obj2 = item.value;
        let match = tags.filter((t) => t.identify?.(obj2));
        if (match.length > 1) {
          const testMatch = match.filter((t) => t.test);
          if (testMatch.length > 0)
            match = testMatch;
        }
        tagObj = match.find((t) => t.format === item.format) ?? match.find((t) => !t.format);
      } else {
        obj2 = item;
        tagObj = tags.find((t) => t.nodeClass && obj2 instanceof t.nodeClass);
      }
      if (!tagObj) {
        const name = obj2?.constructor?.name ?? (obj2 === null ? "null" : typeof obj2);
        throw new Error(`Tag not resolved for ${name} value`);
      }
      return tagObj;
    }
    function stringifyProps(node, tagObj, { anchors: anchors$1, doc }) {
      if (!doc.directives)
        return "";
      const props = [];
      const anchor = (identity.isScalar(node) || identity.isCollection(node)) && node.anchor;
      if (anchor && anchors.anchorIsValid(anchor)) {
        anchors$1.add(anchor);
        props.push(`&${anchor}`);
      }
      const tag = node.tag ?? (tagObj.default ? null : tagObj.tag);
      if (tag)
        props.push(doc.directives.tagString(tag));
      return props.join(" ");
    }
    function stringify(item, ctx, onComment, onChompKeep) {
      if (identity.isPair(item))
        return item.toString(ctx, onComment, onChompKeep);
      if (identity.isAlias(item)) {
        if (ctx.doc.directives)
          return item.toString(ctx);
        if (ctx.resolvedAliases?.has(item)) {
          throw new TypeError(`Cannot stringify circular structure without alias nodes`);
        } else {
          if (ctx.resolvedAliases)
            ctx.resolvedAliases.add(item);
          else
            ctx.resolvedAliases = /* @__PURE__ */ new Set([item]);
          item = item.resolve(ctx.doc);
        }
      }
      let tagObj = void 0;
      const node = identity.isNode(item) ? item : ctx.doc.createNode(item, { onTagObj: (o) => tagObj = o });
      tagObj ?? (tagObj = getTagObject(ctx.doc.schema.tags, node));
      const props = stringifyProps(node, tagObj, ctx);
      if (props.length > 0)
        ctx.indentAtStart = (ctx.indentAtStart ?? 0) + props.length + 1;
      const str2 = typeof tagObj.stringify === "function" ? tagObj.stringify(node, ctx, onComment, onChompKeep) : identity.isScalar(node) ? stringifyString.stringifyString(node, ctx, onComment, onChompKeep) : node.toString(ctx, onComment, onChompKeep);
      if (!props)
        return str2;
      return identity.isScalar(node) || str2[0] === "{" || str2[0] === "[" ? `${props} ${str2}` : `${props}
${ctx.indent}${str2}`;
    }
    exports.createStringifyContext = createStringifyContext;
    exports.stringify = stringify;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/stringify/stringifyPair.js
var require_stringifyPair = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/stringify/stringifyPair.js"(exports) {
    "use strict";
    var identity = require_identity();
    var Scalar = require_Scalar();
    var stringify = require_stringify();
    var stringifyComment = require_stringifyComment();
    function stringifyPair({ key, value }, ctx, onComment, onChompKeep) {
      const { allNullValues, doc, indent, indentStep, options: { commentString, indentSeq, simpleKeys } } = ctx;
      let keyComment = identity.isNode(key) && key.comment || null;
      if (simpleKeys) {
        if (keyComment) {
          throw new Error("With simple keys, key nodes cannot have comments");
        }
        if (identity.isCollection(key) || !identity.isNode(key) && typeof key === "object") {
          const msg = "With simple keys, collection cannot be used as a key value";
          throw new Error(msg);
        }
      }
      let explicitKey = !simpleKeys && (!key || keyComment && value == null && !ctx.inFlow || identity.isCollection(key) || (identity.isScalar(key) ? key.type === Scalar.Scalar.BLOCK_FOLDED || key.type === Scalar.Scalar.BLOCK_LITERAL : typeof key === "object"));
      ctx = Object.assign({}, ctx, {
        allNullValues: false,
        implicitKey: !explicitKey && (simpleKeys || !allNullValues),
        indent: indent + indentStep
      });
      let keyCommentDone = false;
      let chompKeep = false;
      let str2 = stringify.stringify(key, ctx, () => keyCommentDone = true, () => chompKeep = true);
      if (!explicitKey && !ctx.inFlow && str2.length > 1024) {
        if (simpleKeys)
          throw new Error("With simple keys, single line scalar must not span more than 1024 characters");
        explicitKey = true;
      }
      if (ctx.inFlow) {
        if (allNullValues || value == null) {
          if (keyCommentDone && onComment)
            onComment();
          return str2 === "" ? "?" : explicitKey ? `? ${str2}` : str2;
        }
      } else if (allNullValues && !simpleKeys || value == null && explicitKey) {
        str2 = `? ${str2}`;
        if (keyComment && !keyCommentDone) {
          str2 += stringifyComment.lineComment(str2, ctx.indent, commentString(keyComment));
        } else if (chompKeep && onChompKeep)
          onChompKeep();
        return str2;
      }
      if (keyCommentDone)
        keyComment = null;
      if (explicitKey) {
        if (keyComment)
          str2 += stringifyComment.lineComment(str2, ctx.indent, commentString(keyComment));
        str2 = `? ${str2}
${indent}:`;
      } else {
        str2 = `${str2}:`;
        if (keyComment)
          str2 += stringifyComment.lineComment(str2, ctx.indent, commentString(keyComment));
      }
      let vsb, vcb, valueComment;
      if (identity.isNode(value)) {
        vsb = !!value.spaceBefore;
        vcb = value.commentBefore;
        valueComment = value.comment;
      } else {
        vsb = false;
        vcb = null;
        valueComment = null;
        if (value && typeof value === "object")
          value = doc.createNode(value);
      }
      ctx.implicitKey = false;
      if (!explicitKey && !keyComment && identity.isScalar(value))
        ctx.indentAtStart = str2.length + 1;
      chompKeep = false;
      if (!indentSeq && indentStep.length >= 2 && !ctx.inFlow && !explicitKey && identity.isSeq(value) && !value.flow && !value.tag && !value.anchor) {
        ctx.indent = ctx.indent.substring(2);
      }
      let valueCommentDone = false;
      const valueStr = stringify.stringify(value, ctx, () => valueCommentDone = true, () => chompKeep = true);
      let ws = " ";
      if (keyComment || vsb || vcb) {
        ws = vsb ? "\n" : "";
        if (vcb) {
          const cs = commentString(vcb);
          ws += `
${stringifyComment.indentComment(cs, ctx.indent)}`;
        }
        if (valueStr === "" && !ctx.inFlow) {
          if (ws === "\n" && valueComment)
            ws = "\n\n";
        } else {
          ws += `
${ctx.indent}`;
        }
      } else if (!explicitKey && identity.isCollection(value)) {
        const vs0 = valueStr[0];
        const nl0 = valueStr.indexOf("\n");
        const hasNewline = nl0 !== -1;
        const flow = ctx.inFlow ?? value.flow ?? value.items.length === 0;
        if (hasNewline || !flow) {
          let hasPropsLine = false;
          if (hasNewline && (vs0 === "&" || vs0 === "!")) {
            let sp0 = valueStr.indexOf(" ");
            if (vs0 === "&" && sp0 !== -1 && sp0 < nl0 && valueStr[sp0 + 1] === "!") {
              sp0 = valueStr.indexOf(" ", sp0 + 1);
            }
            if (sp0 === -1 || nl0 < sp0)
              hasPropsLine = true;
          }
          if (!hasPropsLine)
            ws = `
${ctx.indent}`;
        }
      } else if (valueStr === "" || valueStr[0] === "\n") {
        ws = "";
      }
      str2 += ws + valueStr;
      if (ctx.inFlow) {
        if (valueCommentDone && onComment)
          onComment();
      } else if (valueComment && !valueCommentDone) {
        str2 += stringifyComment.lineComment(str2, ctx.indent, commentString(valueComment));
      } else if (chompKeep && onChompKeep) {
        onChompKeep();
      }
      return str2;
    }
    exports.stringifyPair = stringifyPair;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/log.js
var require_log = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/log.js"(exports) {
    "use strict";
    var node_process = __require("process");
    function debug(logLevel, ...messages) {
      if (logLevel === "debug")
        console.log(...messages);
    }
    function warn(logLevel, warning) {
      if (logLevel === "debug" || logLevel === "warn") {
        if (typeof node_process.emitWarning === "function")
          node_process.emitWarning(warning);
        else
          console.warn(warning);
      }
    }
    exports.debug = debug;
    exports.warn = warn;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/yaml-1.1/merge.js
var require_merge = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/yaml-1.1/merge.js"(exports) {
    "use strict";
    var identity = require_identity();
    var Scalar = require_Scalar();
    var MERGE_KEY = "<<";
    var merge2 = {
      identify: (value) => value === MERGE_KEY || typeof value === "symbol" && value.description === MERGE_KEY,
      default: "key",
      tag: "tag:yaml.org,2002:merge",
      test: /^<<$/,
      resolve: () => Object.assign(new Scalar.Scalar(Symbol(MERGE_KEY)), {
        addToJSMap: addMergeToJSMap
      }),
      stringify: () => MERGE_KEY
    };
    var isMergeKey = (ctx, key) => (merge2.identify(key) || identity.isScalar(key) && (!key.type || key.type === Scalar.Scalar.PLAIN) && merge2.identify(key.value)) && ctx?.doc.schema.tags.some((tag) => tag.tag === merge2.tag && tag.default);
    function addMergeToJSMap(ctx, map, value) {
      const source = resolveAliasValue(ctx, value);
      if (identity.isSeq(source))
        for (const it of source.items)
          mergeValue(ctx, map, it);
      else if (Array.isArray(source))
        for (const it of source)
          mergeValue(ctx, map, it);
      else
        mergeValue(ctx, map, source);
    }
    function mergeValue(ctx, map, value) {
      const source = resolveAliasValue(ctx, value);
      if (!identity.isMap(source))
        throw new Error("Merge sources must be maps or map aliases");
      const srcMap = source.toJSON(null, ctx, Map);
      for (const [key, value2] of srcMap) {
        if (map instanceof Map) {
          if (!map.has(key))
            map.set(key, value2);
        } else if (map instanceof Set) {
          map.add(key);
        } else if (!Object.prototype.hasOwnProperty.call(map, key)) {
          Object.defineProperty(map, key, {
            value: value2,
            writable: true,
            enumerable: true,
            configurable: true
          });
        }
      }
      return map;
    }
    function resolveAliasValue(ctx, value) {
      return ctx && identity.isAlias(value) ? value.resolve(ctx.doc, ctx) : value;
    }
    exports.addMergeToJSMap = addMergeToJSMap;
    exports.isMergeKey = isMergeKey;
    exports.merge = merge2;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/nodes/addPairToJSMap.js
var require_addPairToJSMap = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/nodes/addPairToJSMap.js"(exports) {
    "use strict";
    var log = require_log();
    var merge2 = require_merge();
    var stringify = require_stringify();
    var identity = require_identity();
    var toJS = require_toJS();
    function addPairToJSMap(ctx, map, { key, value }) {
      if (identity.isNode(key) && key.addToJSMap)
        key.addToJSMap(ctx, map, value);
      else if (merge2.isMergeKey(ctx, key))
        merge2.addMergeToJSMap(ctx, map, value);
      else {
        const jsKey = toJS.toJS(key, "", ctx);
        if (map instanceof Map) {
          map.set(jsKey, toJS.toJS(value, jsKey, ctx));
        } else if (map instanceof Set) {
          map.add(jsKey);
        } else {
          const stringKey = stringifyKey(key, jsKey, ctx);
          const jsValue = toJS.toJS(value, stringKey, ctx);
          if (stringKey in map)
            Object.defineProperty(map, stringKey, {
              value: jsValue,
              writable: true,
              enumerable: true,
              configurable: true
            });
          else
            map[stringKey] = jsValue;
        }
      }
      return map;
    }
    function stringifyKey(key, jsKey, ctx) {
      if (jsKey === null)
        return "";
      if (typeof jsKey !== "object")
        return String(jsKey);
      if (identity.isNode(key) && ctx?.doc) {
        const strCtx = stringify.createStringifyContext(ctx.doc, {});
        strCtx.anchors = /* @__PURE__ */ new Set();
        for (const node of ctx.anchors.keys())
          strCtx.anchors.add(node.anchor);
        strCtx.inFlow = true;
        strCtx.inStringifyKey = true;
        const strKey = key.toString(strCtx);
        if (!ctx.mapKeyWarned) {
          let jsonStr = JSON.stringify(strKey);
          if (jsonStr.length > 40)
            jsonStr = jsonStr.substring(0, 36) + '..."';
          log.warn(ctx.doc.options.logLevel, `Keys with collection values will be stringified due to JS Object restrictions: ${jsonStr}. Set mapAsMap: true to use object keys.`);
          ctx.mapKeyWarned = true;
        }
        return strKey;
      }
      return JSON.stringify(jsKey);
    }
    exports.addPairToJSMap = addPairToJSMap;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/nodes/Pair.js
var require_Pair = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/nodes/Pair.js"(exports) {
    "use strict";
    var createNode = require_createNode();
    var stringifyPair = require_stringifyPair();
    var addPairToJSMap = require_addPairToJSMap();
    var identity = require_identity();
    function createPair(key, value, ctx) {
      const k = createNode.createNode(key, void 0, ctx);
      const v = createNode.createNode(value, void 0, ctx);
      return new Pair(k, v);
    }
    var Pair = class _Pair {
      constructor(key, value = null) {
        Object.defineProperty(this, identity.NODE_TYPE, { value: identity.PAIR });
        this.key = key;
        this.value = value;
      }
      clone(schema) {
        let { key, value } = this;
        if (identity.isNode(key))
          key = key.clone(schema);
        if (identity.isNode(value))
          value = value.clone(schema);
        return new _Pair(key, value);
      }
      toJSON(_, ctx) {
        const pair = ctx?.mapAsMap ? /* @__PURE__ */ new Map() : {};
        return addPairToJSMap.addPairToJSMap(ctx, pair, this);
      }
      toString(ctx, onComment, onChompKeep) {
        return ctx?.doc ? stringifyPair.stringifyPair(this, ctx, onComment, onChompKeep) : JSON.stringify(this);
      }
    };
    exports.Pair = Pair;
    exports.createPair = createPair;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/stringify/stringifyCollection.js
var require_stringifyCollection = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/stringify/stringifyCollection.js"(exports) {
    "use strict";
    var identity = require_identity();
    var stringify = require_stringify();
    var stringifyComment = require_stringifyComment();
    function stringifyCollection(collection, ctx, options) {
      const flow = ctx.inFlow ?? collection.flow;
      const stringify2 = flow ? stringifyFlowCollection : stringifyBlockCollection;
      return stringify2(collection, ctx, options);
    }
    function stringifyBlockCollection({ comment, items }, ctx, { blockItemPrefix, flowChars, itemIndent, onChompKeep, onComment }) {
      const { indent, options: { commentString } } = ctx;
      const itemCtx = Object.assign({}, ctx, { indent: itemIndent, type: null });
      let chompKeep = false;
      const lines = [];
      for (let i = 0; i < items.length; ++i) {
        const item = items[i];
        let comment2 = null;
        if (identity.isNode(item)) {
          if (!chompKeep && item.spaceBefore)
            lines.push("");
          addCommentBefore(ctx, lines, item.commentBefore, chompKeep);
          if (item.comment)
            comment2 = item.comment;
        } else if (identity.isPair(item)) {
          const ik = identity.isNode(item.key) ? item.key : null;
          if (ik) {
            if (!chompKeep && ik.spaceBefore)
              lines.push("");
            addCommentBefore(ctx, lines, ik.commentBefore, chompKeep);
          }
        }
        chompKeep = false;
        let str3 = stringify.stringify(item, itemCtx, () => comment2 = null, () => chompKeep = true);
        if (comment2)
          str3 += stringifyComment.lineComment(str3, itemIndent, commentString(comment2));
        if (chompKeep && comment2)
          chompKeep = false;
        lines.push(blockItemPrefix + str3);
      }
      let str2;
      if (lines.length === 0) {
        str2 = flowChars.start + flowChars.end;
      } else {
        str2 = lines[0];
        for (let i = 1; i < lines.length; ++i) {
          const line = lines[i];
          str2 += line ? `
${indent}${line}` : "\n";
        }
      }
      if (comment) {
        str2 += "\n" + stringifyComment.indentComment(commentString(comment), indent);
        if (onComment)
          onComment();
      } else if (chompKeep && onChompKeep)
        onChompKeep();
      return str2;
    }
    function stringifyFlowCollection({ items }, ctx, { flowChars, itemIndent }) {
      const { indent, indentStep, flowCollectionPadding: fcPadding, options: { commentString } } = ctx;
      itemIndent += indentStep;
      const itemCtx = Object.assign({}, ctx, {
        indent: itemIndent,
        inFlow: true,
        type: null
      });
      let reqNewline = false;
      let linesAtValue = 0;
      const lines = [];
      for (let i = 0; i < items.length; ++i) {
        const item = items[i];
        let comment = null;
        if (identity.isNode(item)) {
          if (item.spaceBefore)
            lines.push("");
          addCommentBefore(ctx, lines, item.commentBefore, false);
          if (item.comment)
            comment = item.comment;
        } else if (identity.isPair(item)) {
          const ik = identity.isNode(item.key) ? item.key : null;
          if (ik) {
            if (ik.spaceBefore)
              lines.push("");
            addCommentBefore(ctx, lines, ik.commentBefore, false);
            if (ik.comment)
              reqNewline = true;
          }
          const iv = identity.isNode(item.value) ? item.value : null;
          if (iv) {
            if (iv.comment)
              comment = iv.comment;
            if (iv.commentBefore)
              reqNewline = true;
          } else if (item.value == null && ik?.comment) {
            comment = ik.comment;
          }
        }
        if (comment)
          reqNewline = true;
        let str2 = stringify.stringify(item, itemCtx, () => comment = null);
        reqNewline || (reqNewline = lines.length > linesAtValue || str2.includes("\n"));
        if (i < items.length - 1) {
          str2 += ",";
        } else if (ctx.options.trailingComma) {
          if (ctx.options.lineWidth > 0) {
            reqNewline || (reqNewline = lines.reduce((sum, line) => sum + line.length + 2, 2) + (str2.length + 2) > ctx.options.lineWidth);
          }
          if (reqNewline) {
            str2 += ",";
          }
        }
        if (comment)
          str2 += stringifyComment.lineComment(str2, itemIndent, commentString(comment));
        lines.push(str2);
        linesAtValue = lines.length;
      }
      const { start, end } = flowChars;
      if (lines.length === 0) {
        return start + end;
      } else {
        if (!reqNewline) {
          const len = lines.reduce((sum, line) => sum + line.length + 2, 2);
          reqNewline = ctx.options.lineWidth > 0 && len > ctx.options.lineWidth;
        }
        if (reqNewline) {
          let str2 = start;
          for (const line of lines)
            str2 += line ? `
${indentStep}${indent}${line}` : "\n";
          return `${str2}
${indent}${end}`;
        } else {
          return `${start}${fcPadding}${lines.join(" ")}${fcPadding}${end}`;
        }
      }
    }
    function addCommentBefore({ indent, options: { commentString } }, lines, comment, chompKeep) {
      if (comment && chompKeep)
        comment = comment.replace(/^\n+/, "");
      if (comment) {
        const ic = stringifyComment.indentComment(commentString(comment), indent);
        lines.push(ic.trimStart());
      }
    }
    exports.stringifyCollection = stringifyCollection;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/nodes/YAMLMap.js
var require_YAMLMap = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/nodes/YAMLMap.js"(exports) {
    "use strict";
    var stringifyCollection = require_stringifyCollection();
    var addPairToJSMap = require_addPairToJSMap();
    var Collection2 = require_Collection();
    var identity = require_identity();
    var Pair = require_Pair();
    var Scalar = require_Scalar();
    function findPair(items, key) {
      const k = identity.isScalar(key) ? key.value : key;
      for (const it of items) {
        if (identity.isPair(it)) {
          if (it.key === key || it.key === k)
            return it;
          if (identity.isScalar(it.key) && it.key.value === k)
            return it;
        }
      }
      return void 0;
    }
    var YAMLMap = class extends Collection2.Collection {
      static get tagName() {
        return "tag:yaml.org,2002:map";
      }
      constructor(schema) {
        super(identity.MAP, schema);
        this.items = [];
      }
      /**
       * A generic collection parsing method that can be extended
       * to other node classes that inherit from YAMLMap
       */
      static from(schema, obj2, ctx) {
        const { keepUndefined, replacer } = ctx;
        const map = new this(schema);
        const add = (key, value) => {
          if (typeof replacer === "function")
            value = replacer.call(obj2, key, value);
          else if (Array.isArray(replacer) && !replacer.includes(key))
            return;
          if (value !== void 0 || keepUndefined)
            map.items.push(Pair.createPair(key, value, ctx));
        };
        if (obj2 instanceof Map) {
          for (const [key, value] of obj2)
            add(key, value);
        } else if (obj2 && typeof obj2 === "object") {
          for (const key of Object.keys(obj2))
            add(key, obj2[key]);
        }
        if (typeof schema.sortMapEntries === "function") {
          map.items.sort(schema.sortMapEntries);
        }
        return map;
      }
      /**
       * Adds a value to the collection.
       *
       * @param overwrite - If not set `true`, using a key that is already in the
       *   collection will throw. Otherwise, overwrites the previous value.
       */
      add(pair, overwrite) {
        let _pair;
        if (identity.isPair(pair))
          _pair = pair;
        else if (!pair || typeof pair !== "object" || !("key" in pair)) {
          _pair = new Pair.Pair(pair, pair?.value);
        } else
          _pair = new Pair.Pair(pair.key, pair.value);
        const prev = findPair(this.items, _pair.key);
        const sortEntries = this.schema?.sortMapEntries;
        if (prev) {
          if (!overwrite)
            throw new Error(`Key ${_pair.key} already set`);
          if (identity.isScalar(prev.value) && Scalar.isScalarValue(_pair.value))
            prev.value.value = _pair.value;
          else
            prev.value = _pair.value;
        } else if (sortEntries) {
          const i = this.items.findIndex((item) => sortEntries(_pair, item) < 0);
          if (i === -1)
            this.items.push(_pair);
          else
            this.items.splice(i, 0, _pair);
        } else {
          this.items.push(_pair);
        }
      }
      delete(key) {
        const it = findPair(this.items, key);
        if (!it)
          return false;
        const del = this.items.splice(this.items.indexOf(it), 1);
        return del.length > 0;
      }
      get(key, keepScalar) {
        const it = findPair(this.items, key);
        const node = it?.value;
        return (!keepScalar && identity.isScalar(node) ? node.value : node) ?? void 0;
      }
      has(key) {
        return !!findPair(this.items, key);
      }
      set(key, value) {
        this.add(new Pair.Pair(key, value), true);
      }
      /**
       * @param ctx - Conversion context, originally set in Document#toJS()
       * @param {Class} Type - If set, forces the returned collection type
       * @returns Instance of Type, Map, or Object
       */
      toJSON(_, ctx, Type) {
        const map = Type ? new Type() : ctx?.mapAsMap ? /* @__PURE__ */ new Map() : {};
        if (ctx?.onCreate)
          ctx.onCreate(map);
        for (const item of this.items)
          addPairToJSMap.addPairToJSMap(ctx, map, item);
        return map;
      }
      toString(ctx, onComment, onChompKeep) {
        if (!ctx)
          return JSON.stringify(this);
        for (const item of this.items) {
          if (!identity.isPair(item))
            throw new Error(`Map items must all be pairs; found ${JSON.stringify(item)} instead`);
        }
        if (!ctx.allNullValues && this.hasAllNullValues(false))
          ctx = Object.assign({}, ctx, { allNullValues: true });
        return stringifyCollection.stringifyCollection(this, ctx, {
          blockItemPrefix: "",
          flowChars: { start: "{", end: "}" },
          itemIndent: ctx.indent || "",
          onChompKeep,
          onComment
        });
      }
    };
    exports.YAMLMap = YAMLMap;
    exports.findPair = findPair;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/common/map.js
var require_map = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/common/map.js"(exports) {
    "use strict";
    var identity = require_identity();
    var YAMLMap = require_YAMLMap();
    var map = {
      collection: "map",
      default: true,
      nodeClass: YAMLMap.YAMLMap,
      tag: "tag:yaml.org,2002:map",
      resolve(map2, onError) {
        if (!identity.isMap(map2))
          onError("Expected a mapping for this tag");
        return map2;
      },
      createNode: (schema, obj2, ctx) => YAMLMap.YAMLMap.from(schema, obj2, ctx)
    };
    exports.map = map;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/nodes/YAMLSeq.js
var require_YAMLSeq = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/nodes/YAMLSeq.js"(exports) {
    "use strict";
    var createNode = require_createNode();
    var stringifyCollection = require_stringifyCollection();
    var Collection2 = require_Collection();
    var identity = require_identity();
    var Scalar = require_Scalar();
    var toJS = require_toJS();
    var YAMLSeq = class extends Collection2.Collection {
      static get tagName() {
        return "tag:yaml.org,2002:seq";
      }
      constructor(schema) {
        super(identity.SEQ, schema);
        this.items = [];
      }
      add(value) {
        this.items.push(value);
      }
      /**
       * Removes a value from the collection.
       *
       * `key` must contain a representation of an integer for this to succeed.
       * It may be wrapped in a `Scalar`.
       *
       * @returns `true` if the item was found and removed.
       */
      delete(key) {
        const idx = asItemIndex(key);
        if (typeof idx !== "number")
          return false;
        const del = this.items.splice(idx, 1);
        return del.length > 0;
      }
      get(key, keepScalar) {
        const idx = asItemIndex(key);
        if (typeof idx !== "number")
          return void 0;
        const it = this.items[idx];
        return !keepScalar && identity.isScalar(it) ? it.value : it;
      }
      /**
       * Checks if the collection includes a value with the key `key`.
       *
       * `key` must contain a representation of an integer for this to succeed.
       * It may be wrapped in a `Scalar`.
       */
      has(key) {
        const idx = asItemIndex(key);
        return typeof idx === "number" && idx < this.items.length;
      }
      /**
       * Sets a value in this collection. For `!!set`, `value` needs to be a
       * boolean to add/remove the item from the set.
       *
       * If `key` does not contain a representation of an integer, this will throw.
       * It may be wrapped in a `Scalar`.
       */
      set(key, value) {
        const idx = asItemIndex(key);
        if (typeof idx !== "number")
          throw new Error(`Expected a valid index, not ${key}.`);
        const prev = this.items[idx];
        if (identity.isScalar(prev) && Scalar.isScalarValue(value))
          prev.value = value;
        else
          this.items[idx] = value;
      }
      toJSON(_, ctx) {
        const seq = [];
        if (ctx?.onCreate)
          ctx.onCreate(seq);
        let i = 0;
        for (const item of this.items)
          seq.push(toJS.toJS(item, String(i++), ctx));
        return seq;
      }
      toString(ctx, onComment, onChompKeep) {
        if (!ctx)
          return JSON.stringify(this);
        return stringifyCollection.stringifyCollection(this, ctx, {
          blockItemPrefix: "- ",
          flowChars: { start: "[", end: "]" },
          itemIndent: (ctx.indent || "") + "  ",
          onChompKeep,
          onComment
        });
      }
      static from(schema, obj2, ctx) {
        const { replacer } = ctx;
        const seq = new this(schema);
        if (obj2 && Symbol.iterator in Object(obj2)) {
          let i = 0;
          for (let it of obj2) {
            if (typeof replacer === "function") {
              const key = obj2 instanceof Set ? it : String(i++);
              it = replacer.call(obj2, key, it);
            }
            seq.items.push(createNode.createNode(it, void 0, ctx));
          }
        }
        return seq;
      }
    };
    function asItemIndex(key) {
      let idx = identity.isScalar(key) ? key.value : key;
      if (idx && typeof idx === "string")
        idx = Number(idx);
      return typeof idx === "number" && Number.isInteger(idx) && idx >= 0 ? idx : null;
    }
    exports.YAMLSeq = YAMLSeq;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/common/seq.js
var require_seq = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/common/seq.js"(exports) {
    "use strict";
    var identity = require_identity();
    var YAMLSeq = require_YAMLSeq();
    var seq = {
      collection: "seq",
      default: true,
      nodeClass: YAMLSeq.YAMLSeq,
      tag: "tag:yaml.org,2002:seq",
      resolve(seq2, onError) {
        if (!identity.isSeq(seq2))
          onError("Expected a sequence for this tag");
        return seq2;
      },
      createNode: (schema, obj2, ctx) => YAMLSeq.YAMLSeq.from(schema, obj2, ctx)
    };
    exports.seq = seq;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/common/string.js
var require_string = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/common/string.js"(exports) {
    "use strict";
    var stringifyString = require_stringifyString();
    var string = {
      identify: (value) => typeof value === "string",
      default: true,
      tag: "tag:yaml.org,2002:str",
      resolve: (str2) => str2,
      stringify(item, ctx, onComment, onChompKeep) {
        ctx = Object.assign({ actualString: true }, ctx);
        return stringifyString.stringifyString(item, ctx, onComment, onChompKeep);
      }
    };
    exports.string = string;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/common/null.js
var require_null = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/common/null.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    var nullTag = {
      identify: (value) => value == null,
      createNode: () => new Scalar.Scalar(null),
      default: true,
      tag: "tag:yaml.org,2002:null",
      test: /^(?:~|[Nn]ull|NULL)?$/,
      resolve: () => new Scalar.Scalar(null),
      stringify: ({ source }, ctx) => typeof source === "string" && nullTag.test.test(source) ? source : ctx.options.nullStr
    };
    exports.nullTag = nullTag;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/core/bool.js
var require_bool = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/core/bool.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    var boolTag = {
      identify: (value) => typeof value === "boolean",
      default: true,
      tag: "tag:yaml.org,2002:bool",
      test: /^(?:[Tt]rue|TRUE|[Ff]alse|FALSE)$/,
      resolve: (str2) => new Scalar.Scalar(str2[0] === "t" || str2[0] === "T"),
      stringify({ source, value }, ctx) {
        if (source && boolTag.test.test(source)) {
          const sv = source[0] === "t" || source[0] === "T";
          if (value === sv)
            return source;
        }
        return value ? ctx.options.trueStr : ctx.options.falseStr;
      }
    };
    exports.boolTag = boolTag;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/stringify/stringifyNumber.js
var require_stringifyNumber = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/stringify/stringifyNumber.js"(exports) {
    "use strict";
    function stringifyNumber({ format, minFractionDigits, tag, value }) {
      if (typeof value === "bigint")
        return String(value);
      const num2 = typeof value === "number" ? value : Number(value);
      if (!isFinite(num2))
        return isNaN(num2) ? ".nan" : num2 < 0 ? "-.inf" : ".inf";
      let n = Object.is(value, -0) ? "-0" : JSON.stringify(value);
      if (!format && minFractionDigits && (!tag || tag === "tag:yaml.org,2002:float") && /^-?\d/.test(n) && !n.includes("e")) {
        let i = n.indexOf(".");
        if (i < 0) {
          i = n.length;
          n += ".";
        }
        let d = minFractionDigits - (n.length - i - 1);
        while (d-- > 0)
          n += "0";
      }
      return n;
    }
    exports.stringifyNumber = stringifyNumber;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/core/float.js
var require_float = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/core/float.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    var stringifyNumber = require_stringifyNumber();
    var floatNaN = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      test: /^(?:[-+]?\.(?:inf|Inf|INF)|\.nan|\.NaN|\.NAN)$/,
      resolve: (str2) => str2.slice(-3).toLowerCase() === "nan" ? NaN : str2[0] === "-" ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY,
      stringify: stringifyNumber.stringifyNumber
    };
    var floatExp = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      format: "EXP",
      test: /^[-+]?(?:\.[0-9]+|[0-9]+(?:\.[0-9]*)?)[eE][-+]?[0-9]+$/,
      resolve: (str2) => parseFloat(str2),
      stringify(node) {
        const num2 = Number(node.value);
        return isFinite(num2) ? num2.toExponential() : stringifyNumber.stringifyNumber(node);
      }
    };
    var float = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      test: /^[-+]?(?:\.[0-9]+|[0-9]+\.[0-9]*)$/,
      resolve(str2) {
        const node = new Scalar.Scalar(parseFloat(str2));
        const dot = str2.indexOf(".");
        if (dot !== -1 && str2[str2.length - 1] === "0")
          node.minFractionDigits = str2.length - dot - 1;
        return node;
      },
      stringify: stringifyNumber.stringifyNumber
    };
    exports.float = float;
    exports.floatExp = floatExp;
    exports.floatNaN = floatNaN;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/core/int.js
var require_int = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/core/int.js"(exports) {
    "use strict";
    var stringifyNumber = require_stringifyNumber();
    var intIdentify = (value) => typeof value === "bigint" || Number.isInteger(value);
    var intResolve = (str2, offset, radix, { intAsBigInt }) => intAsBigInt ? BigInt(str2) : parseInt(str2.substring(offset), radix);
    function intStringify(node, radix, prefix) {
      const { value } = node;
      if (intIdentify(value) && value >= 0)
        return prefix + value.toString(radix);
      return stringifyNumber.stringifyNumber(node);
    }
    var intOct = {
      identify: (value) => intIdentify(value) && value >= 0,
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "OCT",
      test: /^0o[0-7]+$/,
      resolve: (str2, _onError, opt) => intResolve(str2, 2, 8, opt),
      stringify: (node) => intStringify(node, 8, "0o")
    };
    var int = {
      identify: intIdentify,
      default: true,
      tag: "tag:yaml.org,2002:int",
      test: /^[-+]?[0-9]+$/,
      resolve: (str2, _onError, opt) => intResolve(str2, 0, 10, opt),
      stringify: stringifyNumber.stringifyNumber
    };
    var intHex = {
      identify: (value) => intIdentify(value) && value >= 0,
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "HEX",
      test: /^0x[0-9a-fA-F]+$/,
      resolve: (str2, _onError, opt) => intResolve(str2, 2, 16, opt),
      stringify: (node) => intStringify(node, 16, "0x")
    };
    exports.int = int;
    exports.intHex = intHex;
    exports.intOct = intOct;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/core/schema.js
var require_schema = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/core/schema.js"(exports) {
    "use strict";
    var map = require_map();
    var _null = require_null();
    var seq = require_seq();
    var string = require_string();
    var bool = require_bool();
    var float = require_float();
    var int = require_int();
    var schema = [
      map.map,
      seq.seq,
      string.string,
      _null.nullTag,
      bool.boolTag,
      int.intOct,
      int.int,
      int.intHex,
      float.floatNaN,
      float.floatExp,
      float.float
    ];
    exports.schema = schema;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/json/schema.js
var require_schema2 = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/json/schema.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    var map = require_map();
    var seq = require_seq();
    function intIdentify(value) {
      return typeof value === "bigint" || Number.isInteger(value);
    }
    var stringifyJSON = ({ value }) => JSON.stringify(value);
    var jsonScalars = [
      {
        identify: (value) => typeof value === "string",
        default: true,
        tag: "tag:yaml.org,2002:str",
        resolve: (str2) => str2,
        stringify: stringifyJSON
      },
      {
        identify: (value) => value == null,
        createNode: () => new Scalar.Scalar(null),
        default: true,
        tag: "tag:yaml.org,2002:null",
        test: /^null$/,
        resolve: () => null,
        stringify: stringifyJSON
      },
      {
        identify: (value) => typeof value === "boolean",
        default: true,
        tag: "tag:yaml.org,2002:bool",
        test: /^true$|^false$/,
        resolve: (str2) => str2 === "true",
        stringify: stringifyJSON
      },
      {
        identify: intIdentify,
        default: true,
        tag: "tag:yaml.org,2002:int",
        test: /^-?(?:0|[1-9][0-9]*)$/,
        resolve: (str2, _onError, { intAsBigInt }) => intAsBigInt ? BigInt(str2) : parseInt(str2, 10),
        stringify: ({ value }) => intIdentify(value) ? value.toString() : JSON.stringify(value)
      },
      {
        identify: (value) => typeof value === "number",
        default: true,
        tag: "tag:yaml.org,2002:float",
        test: /^-?(?:0|[1-9][0-9]*)(?:\.[0-9]*)?(?:[eE][-+]?[0-9]+)?$/,
        resolve: (str2) => parseFloat(str2),
        stringify: stringifyJSON
      }
    ];
    var jsonError = {
      default: true,
      tag: "",
      test: /^/,
      resolve(str2, onError) {
        onError(`Unresolved plain scalar ${JSON.stringify(str2)}`);
        return str2;
      }
    };
    var schema = [map.map, seq.seq].concat(jsonScalars, jsonError);
    exports.schema = schema;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/yaml-1.1/binary.js
var require_binary = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/yaml-1.1/binary.js"(exports) {
    "use strict";
    var node_buffer = __require("buffer");
    var Scalar = require_Scalar();
    var stringifyString = require_stringifyString();
    var binary = {
      identify: (value) => value instanceof Uint8Array,
      // Buffer inherits from Uint8Array
      default: false,
      tag: "tag:yaml.org,2002:binary",
      /**
       * Returns a Buffer in node and an Uint8Array in browsers
       *
       * To use the resulting buffer as an image, you'll want to do something like:
       *
       *   const blob = new Blob([buffer], { type: 'image/jpeg' })
       *   document.querySelector('#photo').src = URL.createObjectURL(blob)
       */
      resolve(src, onError) {
        if (typeof node_buffer.Buffer === "function") {
          return node_buffer.Buffer.from(src, "base64");
        } else if (typeof atob === "function") {
          const str2 = atob(src.replace(/[\n\r]/g, ""));
          const buffer = new Uint8Array(str2.length);
          for (let i = 0; i < str2.length; ++i)
            buffer[i] = str2.charCodeAt(i);
          return buffer;
        } else {
          onError("This environment does not support reading binary tags; either Buffer or atob is required");
          return src;
        }
      },
      stringify({ comment, type, value }, ctx, onComment, onChompKeep) {
        if (!value)
          return "";
        const buf = value;
        let str2;
        if (typeof node_buffer.Buffer === "function") {
          str2 = buf instanceof node_buffer.Buffer ? buf.toString("base64") : node_buffer.Buffer.from(buf.buffer).toString("base64");
        } else if (typeof btoa === "function") {
          let s = "";
          for (let i = 0; i < buf.length; ++i)
            s += String.fromCharCode(buf[i]);
          str2 = btoa(s);
        } else {
          throw new Error("This environment does not support writing binary tags; either Buffer or btoa is required");
        }
        type ?? (type = Scalar.Scalar.BLOCK_LITERAL);
        if (type !== Scalar.Scalar.QUOTE_DOUBLE) {
          const lineWidth = Math.max(ctx.options.lineWidth - ctx.indent.length, ctx.options.minContentWidth);
          const n = Math.ceil(str2.length / lineWidth);
          const lines = new Array(n);
          for (let i = 0, o = 0; i < n; ++i, o += lineWidth) {
            lines[i] = str2.substr(o, lineWidth);
          }
          str2 = lines.join(type === Scalar.Scalar.BLOCK_LITERAL ? "\n" : " ");
        }
        return stringifyString.stringifyString({ comment, type, value: str2 }, ctx, onComment, onChompKeep);
      }
    };
    exports.binary = binary;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/yaml-1.1/pairs.js
var require_pairs = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/yaml-1.1/pairs.js"(exports) {
    "use strict";
    var identity = require_identity();
    var Pair = require_Pair();
    var Scalar = require_Scalar();
    var YAMLSeq = require_YAMLSeq();
    function resolvePairs(seq, onError) {
      if (identity.isSeq(seq)) {
        for (let i = 0; i < seq.items.length; ++i) {
          let item = seq.items[i];
          if (identity.isPair(item))
            continue;
          else if (identity.isMap(item)) {
            if (item.items.length > 1)
              onError("Each pair must have its own sequence indicator");
            const pair = item.items[0] || new Pair.Pair(new Scalar.Scalar(null));
            if (item.commentBefore)
              pair.key.commentBefore = pair.key.commentBefore ? `${item.commentBefore}
${pair.key.commentBefore}` : item.commentBefore;
            if (item.comment) {
              const cn = pair.value ?? pair.key;
              cn.comment = cn.comment ? `${item.comment}
${cn.comment}` : item.comment;
            }
            item = pair;
          }
          seq.items[i] = identity.isPair(item) ? item : new Pair.Pair(item);
        }
      } else
        onError("Expected a sequence for this tag");
      return seq;
    }
    function createPairs(schema, iterable, ctx) {
      const { replacer } = ctx;
      const pairs2 = new YAMLSeq.YAMLSeq(schema);
      pairs2.tag = "tag:yaml.org,2002:pairs";
      let i = 0;
      if (iterable && Symbol.iterator in Object(iterable))
        for (let it of iterable) {
          if (typeof replacer === "function")
            it = replacer.call(iterable, String(i++), it);
          let key, value;
          if (Array.isArray(it)) {
            if (it.length === 2) {
              key = it[0];
              value = it[1];
            } else
              throw new TypeError(`Expected [key, value] tuple: ${it}`);
          } else if (it && it instanceof Object) {
            const keys = Object.keys(it);
            if (keys.length === 1) {
              key = keys[0];
              value = it[key];
            } else {
              throw new TypeError(`Expected tuple with one key, not ${keys.length} keys`);
            }
          } else {
            key = it;
          }
          pairs2.items.push(Pair.createPair(key, value, ctx));
        }
      return pairs2;
    }
    var pairs = {
      collection: "seq",
      default: false,
      tag: "tag:yaml.org,2002:pairs",
      resolve: resolvePairs,
      createNode: createPairs
    };
    exports.createPairs = createPairs;
    exports.pairs = pairs;
    exports.resolvePairs = resolvePairs;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/yaml-1.1/omap.js
var require_omap = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/yaml-1.1/omap.js"(exports) {
    "use strict";
    var identity = require_identity();
    var toJS = require_toJS();
    var YAMLMap = require_YAMLMap();
    var YAMLSeq = require_YAMLSeq();
    var pairs = require_pairs();
    var YAMLOMap = class _YAMLOMap extends YAMLSeq.YAMLSeq {
      constructor() {
        super();
        this.add = YAMLMap.YAMLMap.prototype.add.bind(this);
        this.delete = YAMLMap.YAMLMap.prototype.delete.bind(this);
        this.get = YAMLMap.YAMLMap.prototype.get.bind(this);
        this.has = YAMLMap.YAMLMap.prototype.has.bind(this);
        this.set = YAMLMap.YAMLMap.prototype.set.bind(this);
        this.tag = _YAMLOMap.tag;
      }
      /**
       * If `ctx` is given, the return type is actually `Map<unknown, unknown>`,
       * but TypeScript won't allow widening the signature of a child method.
       */
      toJSON(_, ctx) {
        if (!ctx)
          return super.toJSON(_);
        const map = /* @__PURE__ */ new Map();
        if (ctx?.onCreate)
          ctx.onCreate(map);
        for (const pair of this.items) {
          let key, value;
          if (identity.isPair(pair)) {
            key = toJS.toJS(pair.key, "", ctx);
            value = toJS.toJS(pair.value, key, ctx);
          } else {
            key = toJS.toJS(pair, "", ctx);
          }
          if (map.has(key))
            throw new Error("Ordered maps must not include duplicate keys");
          map.set(key, value);
        }
        return map;
      }
      static from(schema, iterable, ctx) {
        const pairs$1 = pairs.createPairs(schema, iterable, ctx);
        const omap2 = new this();
        omap2.items = pairs$1.items;
        return omap2;
      }
    };
    YAMLOMap.tag = "tag:yaml.org,2002:omap";
    var omap = {
      collection: "seq",
      identify: (value) => value instanceof Map,
      nodeClass: YAMLOMap,
      default: false,
      tag: "tag:yaml.org,2002:omap",
      resolve(seq, onError) {
        const pairs$1 = pairs.resolvePairs(seq, onError);
        const seenKeys = [];
        for (const { key } of pairs$1.items) {
          if (identity.isScalar(key)) {
            if (seenKeys.includes(key.value)) {
              onError(`Ordered maps must not include duplicate keys: ${key.value}`);
            } else {
              seenKeys.push(key.value);
            }
          }
        }
        return Object.assign(new YAMLOMap(), pairs$1);
      },
      createNode: (schema, iterable, ctx) => YAMLOMap.from(schema, iterable, ctx)
    };
    exports.YAMLOMap = YAMLOMap;
    exports.omap = omap;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/yaml-1.1/bool.js
var require_bool2 = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/yaml-1.1/bool.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    function boolStringify({ value, source }, ctx) {
      const boolObj = value ? trueTag : falseTag;
      if (source && boolObj.test.test(source))
        return source;
      return value ? ctx.options.trueStr : ctx.options.falseStr;
    }
    var trueTag = {
      identify: (value) => value === true,
      default: true,
      tag: "tag:yaml.org,2002:bool",
      test: /^(?:Y|y|[Yy]es|YES|[Tt]rue|TRUE|[Oo]n|ON)$/,
      resolve: () => new Scalar.Scalar(true),
      stringify: boolStringify
    };
    var falseTag = {
      identify: (value) => value === false,
      default: true,
      tag: "tag:yaml.org,2002:bool",
      test: /^(?:N|n|[Nn]o|NO|[Ff]alse|FALSE|[Oo]ff|OFF)$/,
      resolve: () => new Scalar.Scalar(false),
      stringify: boolStringify
    };
    exports.falseTag = falseTag;
    exports.trueTag = trueTag;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/yaml-1.1/float.js
var require_float2 = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/yaml-1.1/float.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    var stringifyNumber = require_stringifyNumber();
    var floatNaN = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      test: /^(?:[-+]?\.(?:inf|Inf|INF)|\.nan|\.NaN|\.NAN)$/,
      resolve: (str2) => str2.slice(-3).toLowerCase() === "nan" ? NaN : str2[0] === "-" ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY,
      stringify: stringifyNumber.stringifyNumber
    };
    var floatExp = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      format: "EXP",
      test: /^[-+]?(?:[0-9][0-9_]*)?(?:\.[0-9_]*)?[eE][-+]?[0-9]+$/,
      resolve: (str2) => parseFloat(str2.replace(/_/g, "")),
      stringify(node) {
        const num2 = Number(node.value);
        return isFinite(num2) ? num2.toExponential() : stringifyNumber.stringifyNumber(node);
      }
    };
    var float = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      test: /^[-+]?(?:[0-9][0-9_]*)?\.[0-9_]*$/,
      resolve(str2) {
        const node = new Scalar.Scalar(parseFloat(str2.replace(/_/g, "")));
        const dot = str2.indexOf(".");
        if (dot !== -1) {
          const f = str2.substring(dot + 1).replace(/_/g, "");
          if (f[f.length - 1] === "0")
            node.minFractionDigits = f.length;
        }
        return node;
      },
      stringify: stringifyNumber.stringifyNumber
    };
    exports.float = float;
    exports.floatExp = floatExp;
    exports.floatNaN = floatNaN;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/yaml-1.1/int.js
var require_int2 = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/yaml-1.1/int.js"(exports) {
    "use strict";
    var stringifyNumber = require_stringifyNumber();
    var intIdentify = (value) => typeof value === "bigint" || Number.isInteger(value);
    function intResolve(str2, offset, radix, { intAsBigInt }) {
      const sign2 = str2[0];
      if (sign2 === "-" || sign2 === "+")
        offset += 1;
      str2 = str2.substring(offset).replace(/_/g, "");
      if (intAsBigInt) {
        switch (radix) {
          case 2:
            str2 = `0b${str2}`;
            break;
          case 8:
            str2 = `0o${str2}`;
            break;
          case 16:
            str2 = `0x${str2}`;
            break;
        }
        const n2 = BigInt(str2);
        return sign2 === "-" ? BigInt(-1) * n2 : n2;
      }
      const n = parseInt(str2, radix);
      return sign2 === "-" ? -1 * n : n;
    }
    function intStringify(node, radix, prefix) {
      const { value } = node;
      if (intIdentify(value)) {
        const str2 = value.toString(radix);
        return value < 0 ? "-" + prefix + str2.substr(1) : prefix + str2;
      }
      return stringifyNumber.stringifyNumber(node);
    }
    var intBin = {
      identify: intIdentify,
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "BIN",
      test: /^[-+]?0b[0-1_]+$/,
      resolve: (str2, _onError, opt) => intResolve(str2, 2, 2, opt),
      stringify: (node) => intStringify(node, 2, "0b")
    };
    var intOct = {
      identify: intIdentify,
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "OCT",
      test: /^[-+]?0[0-7_]+$/,
      resolve: (str2, _onError, opt) => intResolve(str2, 1, 8, opt),
      stringify: (node) => intStringify(node, 8, "0")
    };
    var int = {
      identify: intIdentify,
      default: true,
      tag: "tag:yaml.org,2002:int",
      test: /^[-+]?[0-9][0-9_]*$/,
      resolve: (str2, _onError, opt) => intResolve(str2, 0, 10, opt),
      stringify: stringifyNumber.stringifyNumber
    };
    var intHex = {
      identify: intIdentify,
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "HEX",
      test: /^[-+]?0x[0-9a-fA-F_]+$/,
      resolve: (str2, _onError, opt) => intResolve(str2, 2, 16, opt),
      stringify: (node) => intStringify(node, 16, "0x")
    };
    exports.int = int;
    exports.intBin = intBin;
    exports.intHex = intHex;
    exports.intOct = intOct;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/yaml-1.1/set.js
var require_set = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/yaml-1.1/set.js"(exports) {
    "use strict";
    var identity = require_identity();
    var Pair = require_Pair();
    var YAMLMap = require_YAMLMap();
    var YAMLSet = class _YAMLSet extends YAMLMap.YAMLMap {
      constructor(schema) {
        super(schema);
        this.tag = _YAMLSet.tag;
      }
      add(key) {
        let pair;
        if (identity.isPair(key))
          pair = key;
        else if (key && typeof key === "object" && "key" in key && "value" in key && key.value === null)
          pair = new Pair.Pair(key.key, null);
        else
          pair = new Pair.Pair(key, null);
        const prev = YAMLMap.findPair(this.items, pair.key);
        if (!prev)
          this.items.push(pair);
      }
      /**
       * If `keepPair` is `true`, returns the Pair matching `key`.
       * Otherwise, returns the value of that Pair's key.
       */
      get(key, keepPair) {
        const pair = YAMLMap.findPair(this.items, key);
        return !keepPair && identity.isPair(pair) ? identity.isScalar(pair.key) ? pair.key.value : pair.key : pair;
      }
      set(key, value) {
        if (typeof value !== "boolean")
          throw new Error(`Expected boolean value for set(key, value) in a YAML set, not ${typeof value}`);
        const prev = YAMLMap.findPair(this.items, key);
        if (prev && !value) {
          this.items.splice(this.items.indexOf(prev), 1);
        } else if (!prev && value) {
          this.items.push(new Pair.Pair(key));
        }
      }
      toJSON(_, ctx) {
        return super.toJSON(_, ctx, Set);
      }
      toString(ctx, onComment, onChompKeep) {
        if (!ctx)
          return JSON.stringify(this);
        if (this.hasAllNullValues(true))
          return super.toString(Object.assign({}, ctx, { allNullValues: true }), onComment, onChompKeep);
        else
          throw new Error("Set items must all have null values");
      }
      static from(schema, iterable, ctx) {
        const { replacer } = ctx;
        const set4 = new this(schema);
        if (iterable && Symbol.iterator in Object(iterable))
          for (let value of iterable) {
            if (typeof replacer === "function")
              value = replacer.call(iterable, value, value);
            set4.items.push(Pair.createPair(value, null, ctx));
          }
        return set4;
      }
    };
    YAMLSet.tag = "tag:yaml.org,2002:set";
    var set3 = {
      collection: "map",
      identify: (value) => value instanceof Set,
      nodeClass: YAMLSet,
      default: false,
      tag: "tag:yaml.org,2002:set",
      createNode: (schema, iterable, ctx) => YAMLSet.from(schema, iterable, ctx),
      resolve(map, onError) {
        if (identity.isMap(map)) {
          if (map.hasAllNullValues(true))
            return Object.assign(new YAMLSet(), map);
          else
            onError("Set items must all have null values");
        } else
          onError("Expected a mapping for this tag");
        return map;
      }
    };
    exports.YAMLSet = YAMLSet;
    exports.set = set3;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/yaml-1.1/timestamp.js
var require_timestamp = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/yaml-1.1/timestamp.js"(exports) {
    "use strict";
    var stringifyNumber = require_stringifyNumber();
    function parseSexagesimal(str2, asBigInt) {
      const sign2 = str2[0];
      const parts = sign2 === "-" || sign2 === "+" ? str2.substring(1) : str2;
      const num2 = (n) => asBigInt ? BigInt(n) : Number(n);
      const res = parts.replace(/_/g, "").split(":").reduce((res2, p) => res2 * num2(60) + num2(p), num2(0));
      return sign2 === "-" ? num2(-1) * res : res;
    }
    function stringifySexagesimal(node) {
      let { value } = node;
      let num2 = (n) => n;
      if (typeof value === "bigint")
        num2 = (n) => BigInt(n);
      else if (isNaN(value) || !isFinite(value))
        return stringifyNumber.stringifyNumber(node);
      let sign2 = "";
      if (value < 0) {
        sign2 = "-";
        value *= num2(-1);
      }
      const _60 = num2(60);
      const parts = [value % _60];
      if (value < 60) {
        parts.unshift(0);
      } else {
        value = (value - parts[0]) / _60;
        parts.unshift(value % _60);
        if (value >= 60) {
          value = (value - parts[0]) / _60;
          parts.unshift(value);
        }
      }
      return sign2 + parts.map((n) => String(n).padStart(2, "0")).join(":").replace(/000000\d*$/, "");
    }
    var intTime = {
      identify: (value) => typeof value === "bigint" || Number.isInteger(value),
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "TIME",
      test: /^[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+$/,
      resolve: (str2, _onError, { intAsBigInt }) => parseSexagesimal(str2, intAsBigInt),
      stringify: stringifySexagesimal
    };
    var floatTime = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      format: "TIME",
      test: /^[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+\.[0-9_]*$/,
      resolve: (str2) => parseSexagesimal(str2, false),
      stringify: stringifySexagesimal
    };
    var timestamp = {
      identify: (value) => value instanceof Date,
      default: true,
      tag: "tag:yaml.org,2002:timestamp",
      // If the time zone is omitted, the timestamp is assumed to be specified in UTC. The time part
      // may be omitted altogether, resulting in a date format. In such a case, the time part is
      // assumed to be 00:00:00Z (start of day, UTC).
      test: RegExp("^([0-9]{4})-([0-9]{1,2})-([0-9]{1,2})(?:(?:t|T|[ \\t]+)([0-9]{1,2}):([0-9]{1,2}):([0-9]{1,2}(\\.[0-9]+)?)(?:[ \\t]*(Z|[-+][012]?[0-9](?::[0-9]{2})?))?)?$"),
      resolve(str2) {
        const match = str2.match(timestamp.test);
        if (!match)
          throw new Error("!!timestamp expects a date, starting with yyyy-mm-dd");
        const [, year, month, day, hour, minute, second] = match.map(Number);
        const millisec = match[7] ? Number((match[7] + "00").substr(1, 3)) : 0;
        let date = Date.UTC(year, month - 1, day, hour || 0, minute || 0, second || 0, millisec);
        const tz = match[8];
        if (tz && tz !== "Z") {
          let d = parseSexagesimal(tz, false);
          if (Math.abs(d) < 30)
            d *= 60;
          date -= 6e4 * d;
        }
        return new Date(date);
      },
      stringify: ({ value }) => value?.toISOString().replace(/(T00:00:00)?\.000Z$/, "") ?? ""
    };
    exports.floatTime = floatTime;
    exports.intTime = intTime;
    exports.timestamp = timestamp;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/yaml-1.1/schema.js
var require_schema3 = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/yaml-1.1/schema.js"(exports) {
    "use strict";
    var map = require_map();
    var _null = require_null();
    var seq = require_seq();
    var string = require_string();
    var binary = require_binary();
    var bool = require_bool2();
    var float = require_float2();
    var int = require_int2();
    var merge2 = require_merge();
    var omap = require_omap();
    var pairs = require_pairs();
    var set3 = require_set();
    var timestamp = require_timestamp();
    var schema = [
      map.map,
      seq.seq,
      string.string,
      _null.nullTag,
      bool.trueTag,
      bool.falseTag,
      int.intBin,
      int.intOct,
      int.int,
      int.intHex,
      float.floatNaN,
      float.floatExp,
      float.float,
      binary.binary,
      merge2.merge,
      omap.omap,
      pairs.pairs,
      set3.set,
      timestamp.intTime,
      timestamp.floatTime,
      timestamp.timestamp
    ];
    exports.schema = schema;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/tags.js
var require_tags = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/tags.js"(exports) {
    "use strict";
    var map = require_map();
    var _null = require_null();
    var seq = require_seq();
    var string = require_string();
    var bool = require_bool();
    var float = require_float();
    var int = require_int();
    var schema = require_schema();
    var schema$1 = require_schema2();
    var binary = require_binary();
    var merge2 = require_merge();
    var omap = require_omap();
    var pairs = require_pairs();
    var schema$2 = require_schema3();
    var set3 = require_set();
    var timestamp = require_timestamp();
    var schemas = /* @__PURE__ */ new Map([
      ["core", schema.schema],
      ["failsafe", [map.map, seq.seq, string.string]],
      ["json", schema$1.schema],
      ["yaml11", schema$2.schema],
      ["yaml-1.1", schema$2.schema]
    ]);
    var tagsByName = {
      binary: binary.binary,
      bool: bool.boolTag,
      float: float.float,
      floatExp: float.floatExp,
      floatNaN: float.floatNaN,
      floatTime: timestamp.floatTime,
      int: int.int,
      intHex: int.intHex,
      intOct: int.intOct,
      intTime: timestamp.intTime,
      map: map.map,
      merge: merge2.merge,
      null: _null.nullTag,
      omap: omap.omap,
      pairs: pairs.pairs,
      seq: seq.seq,
      set: set3.set,
      timestamp: timestamp.timestamp
    };
    var coreKnownTags = {
      "tag:yaml.org,2002:binary": binary.binary,
      "tag:yaml.org,2002:merge": merge2.merge,
      "tag:yaml.org,2002:omap": omap.omap,
      "tag:yaml.org,2002:pairs": pairs.pairs,
      "tag:yaml.org,2002:set": set3.set,
      "tag:yaml.org,2002:timestamp": timestamp.timestamp
    };
    function getTags(customTags, schemaName, addMergeTag) {
      const schemaTags = schemas.get(schemaName);
      if (schemaTags && !customTags) {
        return addMergeTag && !schemaTags.includes(merge2.merge) ? schemaTags.concat(merge2.merge) : schemaTags.slice();
      }
      let tags = schemaTags;
      if (!tags) {
        if (Array.isArray(customTags))
          tags = [];
        else {
          const keys = Array.from(schemas.keys()).filter((key) => key !== "yaml11").map((key) => JSON.stringify(key)).join(", ");
          throw new Error(`Unknown schema "${schemaName}"; use one of ${keys} or define customTags array`);
        }
      }
      if (Array.isArray(customTags)) {
        for (const tag of customTags)
          tags = tags.concat(tag);
      } else if (typeof customTags === "function") {
        tags = customTags(tags.slice());
      }
      if (addMergeTag)
        tags = tags.concat(merge2.merge);
      return tags.reduce((tags2, tag) => {
        const tagObj = typeof tag === "string" ? tagsByName[tag] : tag;
        if (!tagObj) {
          const tagName = JSON.stringify(tag);
          const keys = Object.keys(tagsByName).map((key) => JSON.stringify(key)).join(", ");
          throw new Error(`Unknown custom tag ${tagName}; use one of ${keys}`);
        }
        if (!tags2.includes(tagObj))
          tags2.push(tagObj);
        return tags2;
      }, []);
    }
    exports.coreKnownTags = coreKnownTags;
    exports.getTags = getTags;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/Schema.js
var require_Schema = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/Schema.js"(exports) {
    "use strict";
    var identity = require_identity();
    var map = require_map();
    var seq = require_seq();
    var string = require_string();
    var tags = require_tags();
    var sortMapEntriesByKey = (a, b) => a.key < b.key ? -1 : a.key > b.key ? 1 : 0;
    var Schema = class _Schema {
      constructor({ compat, customTags, merge: merge2, resolveKnownTags, schema, sortMapEntries, toStringDefaults }) {
        this.compat = Array.isArray(compat) ? tags.getTags(compat, "compat") : compat ? tags.getTags(null, compat) : null;
        this.name = typeof schema === "string" && schema || "core";
        this.knownTags = resolveKnownTags ? tags.coreKnownTags : {};
        this.tags = tags.getTags(customTags, this.name, merge2);
        this.toStringOptions = toStringDefaults ?? null;
        Object.defineProperty(this, identity.MAP, { value: map.map });
        Object.defineProperty(this, identity.SCALAR, { value: string.string });
        Object.defineProperty(this, identity.SEQ, { value: seq.seq });
        this.sortMapEntries = typeof sortMapEntries === "function" ? sortMapEntries : sortMapEntries === true ? sortMapEntriesByKey : null;
      }
      clone() {
        const copy = Object.create(_Schema.prototype, Object.getOwnPropertyDescriptors(this));
        copy.tags = this.tags.slice();
        return copy;
      }
    };
    exports.Schema = Schema;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/stringify/stringifyDocument.js
var require_stringifyDocument = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/stringify/stringifyDocument.js"(exports) {
    "use strict";
    var identity = require_identity();
    var stringify = require_stringify();
    var stringifyComment = require_stringifyComment();
    function stringifyDocument(doc, options) {
      const lines = [];
      let hasDirectives = options.directives === true;
      if (options.directives !== false && doc.directives) {
        const dir = doc.directives.toString(doc);
        if (dir) {
          lines.push(dir);
          hasDirectives = true;
        } else if (doc.directives.docStart)
          hasDirectives = true;
      }
      if (hasDirectives)
        lines.push("---");
      const ctx = stringify.createStringifyContext(doc, options);
      const { commentString } = ctx.options;
      if (doc.commentBefore) {
        if (lines.length !== 1)
          lines.unshift("");
        const cs = commentString(doc.commentBefore);
        lines.unshift(stringifyComment.indentComment(cs, ""));
      }
      let chompKeep = false;
      let contentComment = null;
      if (doc.contents) {
        if (identity.isNode(doc.contents)) {
          if (doc.contents.spaceBefore && hasDirectives)
            lines.push("");
          if (doc.contents.commentBefore) {
            const cs = commentString(doc.contents.commentBefore);
            lines.push(stringifyComment.indentComment(cs, ""));
          }
          ctx.forceBlockIndent = !!doc.comment;
          contentComment = doc.contents.comment;
        }
        const onChompKeep = contentComment ? void 0 : () => chompKeep = true;
        let body = stringify.stringify(doc.contents, ctx, () => contentComment = null, onChompKeep);
        if (contentComment)
          body += stringifyComment.lineComment(body, "", commentString(contentComment));
        if ((body[0] === "|" || body[0] === ">") && lines[lines.length - 1] === "---") {
          lines[lines.length - 1] = `--- ${body}`;
        } else
          lines.push(body);
      } else {
        lines.push(stringify.stringify(doc.contents, ctx));
      }
      if (doc.directives?.docEnd) {
        if (doc.comment) {
          const cs = commentString(doc.comment);
          if (cs.includes("\n")) {
            lines.push("...");
            lines.push(stringifyComment.indentComment(cs, ""));
          } else {
            lines.push(`... ${cs}`);
          }
        } else {
          lines.push("...");
        }
      } else {
        let dc = doc.comment;
        if (dc && chompKeep)
          dc = dc.replace(/^\n+/, "");
        if (dc) {
          if ((!chompKeep || contentComment) && lines[lines.length - 1] !== "")
            lines.push("");
          lines.push(stringifyComment.indentComment(commentString(dc), ""));
        }
      }
      return lines.join("\n") + "\n";
    }
    exports.stringifyDocument = stringifyDocument;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/doc/Document.js
var require_Document = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/doc/Document.js"(exports) {
    "use strict";
    var Alias = require_Alias();
    var Collection2 = require_Collection();
    var identity = require_identity();
    var Pair = require_Pair();
    var toJS = require_toJS();
    var Schema = require_Schema();
    var stringifyDocument = require_stringifyDocument();
    var anchors = require_anchors();
    var applyReviver = require_applyReviver();
    var createNode = require_createNode();
    var directives = require_directives();
    var Document = class _Document {
      constructor(value, replacer, options) {
        this.commentBefore = null;
        this.comment = null;
        this.errors = [];
        this.warnings = [];
        Object.defineProperty(this, identity.NODE_TYPE, { value: identity.DOC });
        let _replacer = null;
        if (typeof replacer === "function" || Array.isArray(replacer)) {
          _replacer = replacer;
        } else if (options === void 0 && replacer) {
          options = replacer;
          replacer = void 0;
        }
        const opt = Object.assign({
          intAsBigInt: false,
          keepSourceTokens: false,
          logLevel: "warn",
          prettyErrors: true,
          strict: true,
          stringKeys: false,
          uniqueKeys: true,
          version: "1.2"
        }, options);
        this.options = opt;
        let { version } = opt;
        if (options?._directives) {
          this.directives = options._directives.atDocument();
          if (this.directives.yaml.explicit)
            version = this.directives.yaml.version;
        } else
          this.directives = new directives.Directives({ version });
        this.setSchema(version, options);
        this.contents = value === void 0 ? null : this.createNode(value, _replacer, options);
      }
      /**
       * Create a deep copy of this Document and its contents.
       *
       * Custom Node values that inherit from `Object` still refer to their original instances.
       */
      clone() {
        const copy = Object.create(_Document.prototype, {
          [identity.NODE_TYPE]: { value: identity.DOC }
        });
        copy.commentBefore = this.commentBefore;
        copy.comment = this.comment;
        copy.errors = this.errors.slice();
        copy.warnings = this.warnings.slice();
        copy.options = Object.assign({}, this.options);
        if (this.directives)
          copy.directives = this.directives.clone();
        copy.schema = this.schema.clone();
        copy.contents = identity.isNode(this.contents) ? this.contents.clone(copy.schema) : this.contents;
        if (this.range)
          copy.range = this.range.slice();
        return copy;
      }
      /** Adds a value to the document. */
      add(value) {
        if (assertCollection(this.contents))
          this.contents.add(value);
      }
      /** Adds a value to the document. */
      addIn(path, value) {
        if (assertCollection(this.contents))
          this.contents.addIn(path, value);
      }
      /**
       * Create a new `Alias` node, ensuring that the target `node` has the required anchor.
       *
       * If `node` already has an anchor, `name` is ignored.
       * Otherwise, the `node.anchor` value will be set to `name`,
       * or if an anchor with that name is already present in the document,
       * `name` will be used as a prefix for a new unique anchor.
       * If `name` is undefined, the generated anchor will use 'a' as a prefix.
       */
      createAlias(node, name) {
        if (!node.anchor) {
          const prev = anchors.anchorNames(this);
          node.anchor = // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
          !name || prev.has(name) ? anchors.findNewAnchor(name || "a", prev) : name;
        }
        return new Alias.Alias(node.anchor);
      }
      createNode(value, replacer, options) {
        let _replacer = void 0;
        if (typeof replacer === "function") {
          value = replacer.call({ "": value }, "", value);
          _replacer = replacer;
        } else if (Array.isArray(replacer)) {
          const keyToStr = (v) => typeof v === "number" || v instanceof String || v instanceof Number;
          const asStr = replacer.filter(keyToStr).map(String);
          if (asStr.length > 0)
            replacer = replacer.concat(asStr);
          _replacer = replacer;
        } else if (options === void 0 && replacer) {
          options = replacer;
          replacer = void 0;
        }
        const { aliasDuplicateObjects, anchorPrefix, flow, keepUndefined, onTagObj, tag } = options ?? {};
        const { onAnchor, setAnchors, sourceObjects } = anchors.createNodeAnchors(
          this,
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
          anchorPrefix || "a"
        );
        const ctx = {
          aliasDuplicateObjects: aliasDuplicateObjects ?? true,
          keepUndefined: keepUndefined ?? false,
          onAnchor,
          onTagObj,
          replacer: _replacer,
          schema: this.schema,
          sourceObjects
        };
        const node = createNode.createNode(value, tag, ctx);
        if (flow && identity.isCollection(node))
          node.flow = true;
        setAnchors();
        return node;
      }
      /**
       * Convert a key and a value into a `Pair` using the current schema,
       * recursively wrapping all values as `Scalar` or `Collection` nodes.
       */
      createPair(key, value, options = {}) {
        const k = this.createNode(key, null, options);
        const v = this.createNode(value, null, options);
        return new Pair.Pair(k, v);
      }
      /**
       * Removes a value from the document.
       * @returns `true` if the item was found and removed.
       */
      delete(key) {
        return assertCollection(this.contents) ? this.contents.delete(key) : false;
      }
      /**
       * Removes a value from the document.
       * @returns `true` if the item was found and removed.
       */
      deleteIn(path) {
        if (Collection2.isEmptyPath(path)) {
          if (this.contents == null)
            return false;
          this.contents = null;
          return true;
        }
        return assertCollection(this.contents) ? this.contents.deleteIn(path) : false;
      }
      /**
       * Returns item at `key`, or `undefined` if not found. By default unwraps
       * scalar values from their surrounding node; to disable set `keepScalar` to
       * `true` (collections are always returned intact).
       */
      get(key, keepScalar) {
        return identity.isCollection(this.contents) ? this.contents.get(key, keepScalar) : void 0;
      }
      /**
       * Returns item at `path`, or `undefined` if not found. By default unwraps
       * scalar values from their surrounding node; to disable set `keepScalar` to
       * `true` (collections are always returned intact).
       */
      getIn(path, keepScalar) {
        if (Collection2.isEmptyPath(path))
          return !keepScalar && identity.isScalar(this.contents) ? this.contents.value : this.contents;
        return identity.isCollection(this.contents) ? this.contents.getIn(path, keepScalar) : void 0;
      }
      /**
       * Checks if the document includes a value with the key `key`.
       */
      has(key) {
        return identity.isCollection(this.contents) ? this.contents.has(key) : false;
      }
      /**
       * Checks if the document includes a value at `path`.
       */
      hasIn(path) {
        if (Collection2.isEmptyPath(path))
          return this.contents !== void 0;
        return identity.isCollection(this.contents) ? this.contents.hasIn(path) : false;
      }
      /**
       * Sets a value in this document. For `!!set`, `value` needs to be a
       * boolean to add/remove the item from the set.
       */
      set(key, value) {
        if (this.contents == null) {
          this.contents = Collection2.collectionFromPath(this.schema, [key], value);
        } else if (assertCollection(this.contents)) {
          this.contents.set(key, value);
        }
      }
      /**
       * Sets a value in this document. For `!!set`, `value` needs to be a
       * boolean to add/remove the item from the set.
       */
      setIn(path, value) {
        if (Collection2.isEmptyPath(path)) {
          this.contents = value;
        } else if (this.contents == null) {
          this.contents = Collection2.collectionFromPath(this.schema, Array.from(path), value);
        } else if (assertCollection(this.contents)) {
          this.contents.setIn(path, value);
        }
      }
      /**
       * Change the YAML version and schema used by the document.
       * A `null` version disables support for directives, explicit tags, anchors, and aliases.
       * It also requires the `schema` option to be given as a `Schema` instance value.
       *
       * Overrides all previously set schema options.
       */
      setSchema(version, options = {}) {
        if (typeof version === "number")
          version = String(version);
        let opt;
        switch (version) {
          case "1.1":
            if (this.directives)
              this.directives.yaml.version = "1.1";
            else
              this.directives = new directives.Directives({ version: "1.1" });
            opt = { resolveKnownTags: false, schema: "yaml-1.1" };
            break;
          case "1.2":
          case "next":
            if (this.directives)
              this.directives.yaml.version = version;
            else
              this.directives = new directives.Directives({ version });
            opt = { resolveKnownTags: true, schema: "core" };
            break;
          case null:
            if (this.directives)
              delete this.directives;
            opt = null;
            break;
          default: {
            const sv = JSON.stringify(version);
            throw new Error(`Expected '1.1', '1.2' or null as first argument, but found: ${sv}`);
          }
        }
        if (options.schema instanceof Object)
          this.schema = options.schema;
        else if (opt)
          this.schema = new Schema.Schema(Object.assign(opt, options));
        else
          throw new Error(`With a null YAML version, the { schema: Schema } option is required`);
      }
      // json & jsonArg are only used from toJSON()
      toJS({ json, jsonArg, mapAsMap, maxAliasCount, onAnchor, reviver } = {}) {
        const ctx = {
          anchors: /* @__PURE__ */ new Map(),
          doc: this,
          keep: !json,
          mapAsMap: mapAsMap === true,
          mapKeyWarned: false,
          maxAliasCount: typeof maxAliasCount === "number" ? maxAliasCount : 100
        };
        const res = toJS.toJS(this.contents, jsonArg ?? "", ctx);
        if (typeof onAnchor === "function")
          for (const { count, res: res2 } of ctx.anchors.values())
            onAnchor(res2, count);
        return typeof reviver === "function" ? applyReviver.applyReviver(reviver, { "": res }, "", res) : res;
      }
      /**
       * A JSON representation of the document `contents`.
       *
       * @param jsonArg Used by `JSON.stringify` to indicate the array index or
       *   property name.
       */
      toJSON(jsonArg, onAnchor) {
        return this.toJS({ json: true, jsonArg, mapAsMap: false, onAnchor });
      }
      /** A YAML representation of the document. */
      toString(options = {}) {
        if (this.errors.length > 0)
          throw new Error("Document with errors cannot be stringified");
        if ("indent" in options && (!Number.isInteger(options.indent) || Number(options.indent) <= 0)) {
          const s = JSON.stringify(options.indent);
          throw new Error(`"indent" option must be a positive integer, not ${s}`);
        }
        return stringifyDocument.stringifyDocument(this, options);
      }
    };
    function assertCollection(contents) {
      if (identity.isCollection(contents))
        return true;
      throw new Error("Expected a YAML collection as document contents");
    }
    exports.Document = Document;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/errors.js
var require_errors = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/errors.js"(exports) {
    "use strict";
    var YAMLError = class extends Error {
      constructor(name, pos, code, message) {
        super();
        this.name = name;
        this.code = code;
        this.message = message;
        this.pos = pos;
      }
    };
    var YAMLParseError = class extends YAMLError {
      constructor(pos, code, message) {
        super("YAMLParseError", pos, code, message);
      }
    };
    var YAMLWarning = class extends YAMLError {
      constructor(pos, code, message) {
        super("YAMLWarning", pos, code, message);
      }
    };
    var prettifyError = (src, lc) => (error) => {
      if (error.pos[0] === -1)
        return;
      error.linePos = error.pos.map((pos) => lc.linePos(pos));
      const { line, col } = error.linePos[0];
      error.message += ` at line ${line}, column ${col}`;
      let ci = col - 1;
      let lineStr = src.substring(lc.lineStarts[line - 1], lc.lineStarts[line]).replace(/[\n\r]+$/, "");
      if (ci >= 60 && lineStr.length > 80) {
        const trimStart = Math.min(ci - 39, lineStr.length - 79);
        lineStr = "\u2026" + lineStr.substring(trimStart);
        ci -= trimStart - 1;
      }
      if (lineStr.length > 80)
        lineStr = lineStr.substring(0, 79) + "\u2026";
      if (line > 1 && /^ *$/.test(lineStr.substring(0, ci))) {
        let prev = src.substring(lc.lineStarts[line - 2], lc.lineStarts[line - 1]);
        if (prev.length > 80)
          prev = prev.substring(0, 79) + "\u2026\n";
        lineStr = prev + lineStr;
      }
      if (/[^ ]/.test(lineStr)) {
        let count = 1;
        const end = error.linePos[1];
        if (end?.line === line && end.col > col) {
          count = Math.max(1, Math.min(end.col - col, 80 - ci));
        }
        const pointer = " ".repeat(ci) + "^".repeat(count);
        error.message += `:

${lineStr}
${pointer}
`;
      }
    };
    exports.YAMLError = YAMLError;
    exports.YAMLParseError = YAMLParseError;
    exports.YAMLWarning = YAMLWarning;
    exports.prettifyError = prettifyError;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/compose/resolve-props.js
var require_resolve_props = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/compose/resolve-props.js"(exports) {
    "use strict";
    function resolveProps(tokens, { flow, indicator, next, offset, onError, parentIndent, startOnNewline }) {
      let spaceBefore = false;
      let atNewline = startOnNewline;
      let hasSpace = startOnNewline;
      let comment = "";
      let commentSep = "";
      let hasNewline = false;
      let reqSpace = false;
      let tab = null;
      let anchor = null;
      let tag = null;
      let newlineAfterProp = null;
      let comma = null;
      let found = null;
      let start = null;
      for (const token of tokens) {
        if (reqSpace) {
          if (token.type !== "space" && token.type !== "newline" && token.type !== "comma")
            onError(token.offset, "MISSING_CHAR", "Tags and anchors must be separated from the next token by white space");
          reqSpace = false;
        }
        if (tab) {
          if (atNewline && token.type !== "comment" && token.type !== "newline") {
            onError(tab, "TAB_AS_INDENT", "Tabs are not allowed as indentation");
          }
          tab = null;
        }
        switch (token.type) {
          case "space":
            if (!flow && (indicator !== "doc-start" || next?.type !== "flow-collection") && token.source.includes("	")) {
              tab = token;
            }
            hasSpace = true;
            break;
          case "comment": {
            if (!hasSpace)
              onError(token, "MISSING_CHAR", "Comments must be separated from other tokens by white space characters");
            const cb = token.source.substring(1) || " ";
            if (!comment)
              comment = cb;
            else
              comment += commentSep + cb;
            commentSep = "";
            atNewline = false;
            break;
          }
          case "newline":
            if (atNewline) {
              if (comment)
                comment += token.source;
              else if (!found || indicator !== "seq-item-ind")
                spaceBefore = true;
            } else
              commentSep += token.source;
            atNewline = true;
            hasNewline = true;
            if (anchor || tag)
              newlineAfterProp = token;
            hasSpace = true;
            break;
          case "anchor":
            if (anchor)
              onError(token, "MULTIPLE_ANCHORS", "A node can have at most one anchor");
            if (token.source.endsWith(":"))
              onError(token.offset + token.source.length - 1, "BAD_ALIAS", "Anchor ending in : is ambiguous", true);
            anchor = token;
            start ?? (start = token.offset);
            atNewline = false;
            hasSpace = false;
            reqSpace = true;
            break;
          case "tag": {
            if (tag)
              onError(token, "MULTIPLE_TAGS", "A node can have at most one tag");
            tag = token;
            start ?? (start = token.offset);
            atNewline = false;
            hasSpace = false;
            reqSpace = true;
            break;
          }
          case indicator:
            if (anchor || tag)
              onError(token, "BAD_PROP_ORDER", `Anchors and tags must be after the ${token.source} indicator`);
            if (found)
              onError(token, "UNEXPECTED_TOKEN", `Unexpected ${token.source} in ${flow ?? "collection"}`);
            found = token;
            atNewline = indicator === "seq-item-ind" || indicator === "explicit-key-ind";
            hasSpace = false;
            break;
          case "comma":
            if (flow) {
              if (comma)
                onError(token, "UNEXPECTED_TOKEN", `Unexpected , in ${flow}`);
              comma = token;
              atNewline = false;
              hasSpace = false;
              break;
            }
          // else fallthrough
          default:
            onError(token, "UNEXPECTED_TOKEN", `Unexpected ${token.type} token`);
            atNewline = false;
            hasSpace = false;
        }
      }
      const last = tokens[tokens.length - 1];
      const end = last ? last.offset + last.source.length : offset;
      if (reqSpace && next && next.type !== "space" && next.type !== "newline" && next.type !== "comma" && (next.type !== "scalar" || next.source !== "")) {
        onError(next.offset, "MISSING_CHAR", "Tags and anchors must be separated from the next token by white space");
      }
      if (tab && (atNewline && tab.indent <= parentIndent || next?.type === "block-map" || next?.type === "block-seq"))
        onError(tab, "TAB_AS_INDENT", "Tabs are not allowed as indentation");
      return {
        comma,
        found,
        spaceBefore,
        comment,
        hasNewline,
        anchor,
        tag,
        newlineAfterProp,
        end,
        start: start ?? end
      };
    }
    exports.resolveProps = resolveProps;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/compose/util-contains-newline.js
var require_util_contains_newline = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/compose/util-contains-newline.js"(exports) {
    "use strict";
    function containsNewline(key) {
      if (!key)
        return null;
      switch (key.type) {
        case "alias":
        case "scalar":
        case "double-quoted-scalar":
        case "single-quoted-scalar":
          if (key.source.includes("\n"))
            return true;
          if (key.end) {
            for (const st of key.end)
              if (st.type === "newline")
                return true;
          }
          return false;
        case "flow-collection":
          for (const it of key.items) {
            for (const st of it.start)
              if (st.type === "newline")
                return true;
            if (it.sep) {
              for (const st of it.sep)
                if (st.type === "newline")
                  return true;
            }
            if (containsNewline(it.key) || containsNewline(it.value))
              return true;
          }
          return false;
        default:
          return true;
      }
    }
    exports.containsNewline = containsNewline;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/compose/util-flow-indent-check.js
var require_util_flow_indent_check = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/compose/util-flow-indent-check.js"(exports) {
    "use strict";
    var utilContainsNewline = require_util_contains_newline();
    function flowIndentCheck(indent, fc, onError) {
      if (fc?.type === "flow-collection") {
        const end = fc.end[0];
        if (end.indent === indent && (end.source === "]" || end.source === "}") && utilContainsNewline.containsNewline(fc)) {
          const msg = "Flow end indicator should be more indented than parent";
          onError(end, "BAD_INDENT", msg, true);
        }
      }
    }
    exports.flowIndentCheck = flowIndentCheck;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/compose/util-map-includes.js
var require_util_map_includes = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/compose/util-map-includes.js"(exports) {
    "use strict";
    var identity = require_identity();
    function mapIncludes(ctx, items, search) {
      const { uniqueKeys } = ctx.options;
      if (uniqueKeys === false)
        return false;
      const isEqual = typeof uniqueKeys === "function" ? uniqueKeys : (a, b) => a === b || identity.isScalar(a) && identity.isScalar(b) && a.value === b.value;
      return items.some((pair) => isEqual(pair.key, search));
    }
    exports.mapIncludes = mapIncludes;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/compose/resolve-block-map.js
var require_resolve_block_map = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/compose/resolve-block-map.js"(exports) {
    "use strict";
    var Pair = require_Pair();
    var YAMLMap = require_YAMLMap();
    var resolveProps = require_resolve_props();
    var utilContainsNewline = require_util_contains_newline();
    var utilFlowIndentCheck = require_util_flow_indent_check();
    var utilMapIncludes = require_util_map_includes();
    var startColMsg = "All mapping items must start at the same column";
    function resolveBlockMap({ composeNode, composeEmptyNode }, ctx, bm, onError, tag) {
      const NodeClass = tag?.nodeClass ?? YAMLMap.YAMLMap;
      const map = new NodeClass(ctx.schema);
      if (ctx.atRoot)
        ctx.atRoot = false;
      let offset = bm.offset;
      let commentEnd = null;
      for (const collItem of bm.items) {
        const { start, key, sep: sep2, value } = collItem;
        const keyProps = resolveProps.resolveProps(start, {
          indicator: "explicit-key-ind",
          next: key ?? sep2?.[0],
          offset,
          onError,
          parentIndent: bm.indent,
          startOnNewline: true
        });
        const implicitKey = !keyProps.found;
        if (implicitKey) {
          if (key) {
            if (key.type === "block-seq")
              onError(offset, "BLOCK_AS_IMPLICIT_KEY", "A block sequence may not be used as an implicit map key");
            else if ("indent" in key && key.indent !== bm.indent)
              onError(offset, "BAD_INDENT", startColMsg);
          }
          if (!keyProps.anchor && !keyProps.tag && !sep2) {
            commentEnd = keyProps.end;
            if (keyProps.comment) {
              if (map.comment)
                map.comment += "\n" + keyProps.comment;
              else
                map.comment = keyProps.comment;
            }
            continue;
          }
          if (keyProps.newlineAfterProp || utilContainsNewline.containsNewline(key)) {
            onError(key ?? start[start.length - 1], "MULTILINE_IMPLICIT_KEY", "Implicit keys need to be on a single line");
          }
        } else if (keyProps.found?.indent !== bm.indent) {
          onError(offset, "BAD_INDENT", startColMsg);
        }
        ctx.atKey = true;
        const keyStart = keyProps.end;
        const keyNode = key ? composeNode(ctx, key, keyProps, onError) : composeEmptyNode(ctx, keyStart, start, null, keyProps, onError);
        if (ctx.schema.compat)
          utilFlowIndentCheck.flowIndentCheck(bm.indent, key, onError);
        ctx.atKey = false;
        if (utilMapIncludes.mapIncludes(ctx, map.items, keyNode))
          onError(keyStart, "DUPLICATE_KEY", "Map keys must be unique");
        const valueProps = resolveProps.resolveProps(sep2 ?? [], {
          indicator: "map-value-ind",
          next: value,
          offset: keyNode.range[2],
          onError,
          parentIndent: bm.indent,
          startOnNewline: !key || key.type === "block-scalar"
        });
        offset = valueProps.end;
        if (valueProps.found) {
          if (implicitKey) {
            if (value?.type === "block-map" && !valueProps.hasNewline)
              onError(offset, "BLOCK_AS_IMPLICIT_KEY", "Nested mappings are not allowed in compact mappings");
            if (ctx.options.strict && keyProps.start < valueProps.found.offset - 1024)
              onError(keyNode.range, "KEY_OVER_1024_CHARS", "The : indicator must be at most 1024 chars after the start of an implicit block mapping key");
          }
          const valueNode = value ? composeNode(ctx, value, valueProps, onError) : composeEmptyNode(ctx, offset, sep2, null, valueProps, onError);
          if (ctx.schema.compat)
            utilFlowIndentCheck.flowIndentCheck(bm.indent, value, onError);
          offset = valueNode.range[2];
          const pair = new Pair.Pair(keyNode, valueNode);
          if (ctx.options.keepSourceTokens)
            pair.srcToken = collItem;
          map.items.push(pair);
        } else {
          if (implicitKey)
            onError(keyNode.range, "MISSING_CHAR", "Implicit map keys need to be followed by map values");
          if (valueProps.comment) {
            if (keyNode.comment)
              keyNode.comment += "\n" + valueProps.comment;
            else
              keyNode.comment = valueProps.comment;
          }
          const pair = new Pair.Pair(keyNode);
          if (ctx.options.keepSourceTokens)
            pair.srcToken = collItem;
          map.items.push(pair);
        }
      }
      if (commentEnd && commentEnd < offset)
        onError(commentEnd, "IMPOSSIBLE", "Map comment with trailing content");
      map.range = [bm.offset, offset, commentEnd ?? offset];
      return map;
    }
    exports.resolveBlockMap = resolveBlockMap;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/compose/resolve-block-seq.js
var require_resolve_block_seq = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/compose/resolve-block-seq.js"(exports) {
    "use strict";
    var YAMLSeq = require_YAMLSeq();
    var resolveProps = require_resolve_props();
    var utilFlowIndentCheck = require_util_flow_indent_check();
    function resolveBlockSeq({ composeNode, composeEmptyNode }, ctx, bs, onError, tag) {
      const NodeClass = tag?.nodeClass ?? YAMLSeq.YAMLSeq;
      const seq = new NodeClass(ctx.schema);
      if (ctx.atRoot)
        ctx.atRoot = false;
      if (ctx.atKey)
        ctx.atKey = false;
      let offset = bs.offset;
      let commentEnd = null;
      for (const { start, value } of bs.items) {
        const props = resolveProps.resolveProps(start, {
          indicator: "seq-item-ind",
          next: value,
          offset,
          onError,
          parentIndent: bs.indent,
          startOnNewline: true
        });
        if (!props.found) {
          if (props.anchor || props.tag || value) {
            if (value?.type === "block-seq")
              onError(props.end, "BAD_INDENT", "All sequence items must start at the same column");
            else
              onError(offset, "MISSING_CHAR", "Sequence item without - indicator");
          } else {
            commentEnd = props.end;
            if (props.comment)
              seq.comment = props.comment;
            continue;
          }
        }
        const node = value ? composeNode(ctx, value, props, onError) : composeEmptyNode(ctx, props.end, start, null, props, onError);
        if (ctx.schema.compat)
          utilFlowIndentCheck.flowIndentCheck(bs.indent, value, onError);
        offset = node.range[2];
        seq.items.push(node);
      }
      seq.range = [bs.offset, offset, commentEnd ?? offset];
      return seq;
    }
    exports.resolveBlockSeq = resolveBlockSeq;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/compose/resolve-end.js
var require_resolve_end = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/compose/resolve-end.js"(exports) {
    "use strict";
    function resolveEnd(end, offset, reqSpace, onError) {
      let comment = "";
      if (end) {
        let hasSpace = false;
        let sep2 = "";
        for (const token of end) {
          const { source, type } = token;
          switch (type) {
            case "space":
              hasSpace = true;
              break;
            case "comment": {
              if (reqSpace && !hasSpace)
                onError(token, "MISSING_CHAR", "Comments must be separated from other tokens by white space characters");
              const cb = source.substring(1) || " ";
              if (!comment)
                comment = cb;
              else
                comment += sep2 + cb;
              sep2 = "";
              break;
            }
            case "newline":
              if (comment)
                sep2 += source;
              hasSpace = true;
              break;
            default:
              onError(token, "UNEXPECTED_TOKEN", `Unexpected ${type} at node end`);
          }
          offset += source.length;
        }
      }
      return { comment, offset };
    }
    exports.resolveEnd = resolveEnd;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/compose/resolve-flow-collection.js
var require_resolve_flow_collection = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/compose/resolve-flow-collection.js"(exports) {
    "use strict";
    var identity = require_identity();
    var Pair = require_Pair();
    var YAMLMap = require_YAMLMap();
    var YAMLSeq = require_YAMLSeq();
    var resolveEnd = require_resolve_end();
    var resolveProps = require_resolve_props();
    var utilContainsNewline = require_util_contains_newline();
    var utilMapIncludes = require_util_map_includes();
    var blockMsg = "Block collections are not allowed within flow collections";
    var isBlock = (token) => token && (token.type === "block-map" || token.type === "block-seq");
    function resolveFlowCollection({ composeNode, composeEmptyNode }, ctx, fc, onError, tag) {
      const isMap = fc.start.source === "{";
      const fcName = isMap ? "flow map" : "flow sequence";
      const NodeClass = tag?.nodeClass ?? (isMap ? YAMLMap.YAMLMap : YAMLSeq.YAMLSeq);
      const coll = new NodeClass(ctx.schema);
      coll.flow = true;
      const atRoot = ctx.atRoot;
      if (atRoot)
        ctx.atRoot = false;
      if (ctx.atKey)
        ctx.atKey = false;
      let offset = fc.offset + fc.start.source.length;
      for (let i = 0; i < fc.items.length; ++i) {
        const collItem = fc.items[i];
        const { start, key, sep: sep2, value } = collItem;
        const props = resolveProps.resolveProps(start, {
          flow: fcName,
          indicator: "explicit-key-ind",
          next: key ?? sep2?.[0],
          offset,
          onError,
          parentIndent: fc.indent,
          startOnNewline: false
        });
        if (!props.found) {
          if (!props.anchor && !props.tag && !sep2 && !value) {
            if (i === 0 && props.comma)
              onError(props.comma, "UNEXPECTED_TOKEN", `Unexpected , in ${fcName}`);
            else if (i < fc.items.length - 1)
              onError(props.start, "UNEXPECTED_TOKEN", `Unexpected empty item in ${fcName}`);
            if (props.comment) {
              if (coll.comment)
                coll.comment += "\n" + props.comment;
              else
                coll.comment = props.comment;
            }
            offset = props.end;
            continue;
          }
          if (!isMap && ctx.options.strict && utilContainsNewline.containsNewline(key))
            onError(
              key,
              // checked by containsNewline()
              "MULTILINE_IMPLICIT_KEY",
              "Implicit keys of flow sequence pairs need to be on a single line"
            );
        }
        if (i === 0) {
          if (props.comma)
            onError(props.comma, "UNEXPECTED_TOKEN", `Unexpected , in ${fcName}`);
        } else {
          if (!props.comma)
            onError(props.start, "MISSING_CHAR", `Missing , between ${fcName} items`);
          if (props.comment) {
            let prevItemComment = "";
            loop: for (const st of start) {
              switch (st.type) {
                case "comma":
                case "space":
                  break;
                case "comment":
                  prevItemComment = st.source.substring(1);
                  break loop;
                default:
                  break loop;
              }
            }
            if (prevItemComment) {
              let prev = coll.items[coll.items.length - 1];
              if (identity.isPair(prev))
                prev = prev.value ?? prev.key;
              if (prev.comment)
                prev.comment += "\n" + prevItemComment;
              else
                prev.comment = prevItemComment;
              props.comment = props.comment.substring(prevItemComment.length + 1);
            }
          }
        }
        if (!isMap && !sep2 && !props.found) {
          const valueNode = value ? composeNode(ctx, value, props, onError) : composeEmptyNode(ctx, props.end, sep2, null, props, onError);
          coll.items.push(valueNode);
          offset = valueNode.range[2];
          if (isBlock(value))
            onError(valueNode.range, "BLOCK_IN_FLOW", blockMsg);
        } else {
          ctx.atKey = true;
          const keyStart = props.end;
          const keyNode = key ? composeNode(ctx, key, props, onError) : composeEmptyNode(ctx, keyStart, start, null, props, onError);
          if (isBlock(key))
            onError(keyNode.range, "BLOCK_IN_FLOW", blockMsg);
          ctx.atKey = false;
          const valueProps = resolveProps.resolveProps(sep2 ?? [], {
            flow: fcName,
            indicator: "map-value-ind",
            next: value,
            offset: keyNode.range[2],
            onError,
            parentIndent: fc.indent,
            startOnNewline: false
          });
          if (valueProps.found) {
            if (!isMap && !props.found && ctx.options.strict) {
              if (sep2)
                for (const st of sep2) {
                  if (st === valueProps.found)
                    break;
                  if (st.type === "newline") {
                    onError(st, "MULTILINE_IMPLICIT_KEY", "Implicit keys of flow sequence pairs need to be on a single line");
                    break;
                  }
                }
              if (props.start < valueProps.found.offset - 1024)
                onError(valueProps.found, "KEY_OVER_1024_CHARS", "The : indicator must be at most 1024 chars after the start of an implicit flow sequence key");
            }
          } else if (value) {
            if ("source" in value && value.source?.[0] === ":")
              onError(value, "MISSING_CHAR", `Missing space after : in ${fcName}`);
            else
              onError(valueProps.start, "MISSING_CHAR", `Missing , or : between ${fcName} items`);
          }
          const valueNode = value ? composeNode(ctx, value, valueProps, onError) : valueProps.found ? composeEmptyNode(ctx, valueProps.end, sep2, null, valueProps, onError) : null;
          if (valueNode) {
            if (isBlock(value))
              onError(valueNode.range, "BLOCK_IN_FLOW", blockMsg);
          } else if (valueProps.comment) {
            if (keyNode.comment)
              keyNode.comment += "\n" + valueProps.comment;
            else
              keyNode.comment = valueProps.comment;
          }
          const pair = new Pair.Pair(keyNode, valueNode);
          if (ctx.options.keepSourceTokens)
            pair.srcToken = collItem;
          if (isMap) {
            const map = coll;
            if (utilMapIncludes.mapIncludes(ctx, map.items, keyNode))
              onError(keyStart, "DUPLICATE_KEY", "Map keys must be unique");
            map.items.push(pair);
          } else {
            const map = new YAMLMap.YAMLMap(ctx.schema);
            map.flow = true;
            map.items.push(pair);
            const endRange = (valueNode ?? keyNode).range;
            map.range = [keyNode.range[0], endRange[1], endRange[2]];
            coll.items.push(map);
          }
          offset = valueNode ? valueNode.range[2] : valueProps.end;
        }
      }
      const expectedEnd = isMap ? "}" : "]";
      const [ce, ...ee] = fc.end;
      let cePos = offset;
      if (ce?.source === expectedEnd)
        cePos = ce.offset + ce.source.length;
      else {
        const name = fcName[0].toUpperCase() + fcName.substring(1);
        const msg = atRoot ? `${name} must end with a ${expectedEnd}` : `${name} in block collection must be sufficiently indented and end with a ${expectedEnd}`;
        onError(offset, atRoot ? "MISSING_CHAR" : "BAD_INDENT", msg);
        if (ce && ce.source.length !== 1)
          ee.unshift(ce);
      }
      if (ee.length > 0) {
        const end = resolveEnd.resolveEnd(ee, cePos, ctx.options.strict, onError);
        if (end.comment) {
          if (coll.comment)
            coll.comment += "\n" + end.comment;
          else
            coll.comment = end.comment;
        }
        coll.range = [fc.offset, cePos, end.offset];
      } else {
        coll.range = [fc.offset, cePos, cePos];
      }
      return coll;
    }
    exports.resolveFlowCollection = resolveFlowCollection;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/compose/compose-collection.js
var require_compose_collection = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/compose/compose-collection.js"(exports) {
    "use strict";
    var identity = require_identity();
    var Scalar = require_Scalar();
    var YAMLMap = require_YAMLMap();
    var YAMLSeq = require_YAMLSeq();
    var resolveBlockMap = require_resolve_block_map();
    var resolveBlockSeq = require_resolve_block_seq();
    var resolveFlowCollection = require_resolve_flow_collection();
    function resolveCollection(CN, ctx, token, onError, tagName, tag) {
      const coll = token.type === "block-map" ? resolveBlockMap.resolveBlockMap(CN, ctx, token, onError, tag) : token.type === "block-seq" ? resolveBlockSeq.resolveBlockSeq(CN, ctx, token, onError, tag) : resolveFlowCollection.resolveFlowCollection(CN, ctx, token, onError, tag);
      const Coll = coll.constructor;
      if (tagName === "!" || tagName === Coll.tagName) {
        coll.tag = Coll.tagName;
        return coll;
      }
      if (tagName)
        coll.tag = tagName;
      return coll;
    }
    function composeCollection(CN, ctx, token, props, onError) {
      const tagToken = props.tag;
      const tagName = !tagToken ? null : ctx.directives.tagName(tagToken.source, (msg) => onError(tagToken, "TAG_RESOLVE_FAILED", msg));
      if (token.type === "block-seq") {
        const { anchor, newlineAfterProp: nl } = props;
        const lastProp = anchor && tagToken ? anchor.offset > tagToken.offset ? anchor : tagToken : anchor ?? tagToken;
        if (lastProp && (!nl || nl.offset < lastProp.offset)) {
          const message = "Missing newline after block sequence props";
          onError(lastProp, "MISSING_CHAR", message);
        }
      }
      const expType = token.type === "block-map" ? "map" : token.type === "block-seq" ? "seq" : token.start.source === "{" ? "map" : "seq";
      if (!tagToken || !tagName || tagName === "!" || tagName === YAMLMap.YAMLMap.tagName && expType === "map" || tagName === YAMLSeq.YAMLSeq.tagName && expType === "seq") {
        return resolveCollection(CN, ctx, token, onError, tagName);
      }
      let tag = ctx.schema.tags.find((t) => t.tag === tagName && t.collection === expType);
      if (!tag) {
        const kt = ctx.schema.knownTags[tagName];
        if (kt?.collection === expType) {
          ctx.schema.tags.push(Object.assign({}, kt, { default: false }));
          tag = kt;
        } else {
          if (kt) {
            onError(tagToken, "BAD_COLLECTION_TYPE", `${kt.tag} used for ${expType} collection, but expects ${kt.collection ?? "scalar"}`, true);
          } else {
            onError(tagToken, "TAG_RESOLVE_FAILED", `Unresolved tag: ${tagName}`, true);
          }
          return resolveCollection(CN, ctx, token, onError, tagName);
        }
      }
      const coll = resolveCollection(CN, ctx, token, onError, tagName, tag);
      const res = tag.resolve?.(coll, (msg) => onError(tagToken, "TAG_RESOLVE_FAILED", msg), ctx.options) ?? coll;
      const node = identity.isNode(res) ? res : new Scalar.Scalar(res);
      node.range = coll.range;
      node.tag = tagName;
      if (tag?.format)
        node.format = tag.format;
      return node;
    }
    exports.composeCollection = composeCollection;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/compose/resolve-block-scalar.js
var require_resolve_block_scalar = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/compose/resolve-block-scalar.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    function resolveBlockScalar(ctx, scalar, onError) {
      const start = scalar.offset;
      const header = parseBlockScalarHeader(scalar, ctx.options.strict, onError);
      if (!header)
        return { value: "", type: null, comment: "", range: [start, start, start] };
      const type = header.mode === ">" ? Scalar.Scalar.BLOCK_FOLDED : Scalar.Scalar.BLOCK_LITERAL;
      const lines = scalar.source ? splitLines(scalar.source) : [];
      let chompStart = lines.length;
      for (let i = lines.length - 1; i >= 0; --i) {
        const content = lines[i][1];
        if (content === "" || content === "\r")
          chompStart = i;
        else
          break;
      }
      if (chompStart === 0) {
        const value2 = header.chomp === "+" && lines.length > 0 ? "\n".repeat(Math.max(1, lines.length - 1)) : "";
        let end2 = start + header.length;
        if (scalar.source)
          end2 += scalar.source.length;
        return { value: value2, type, comment: header.comment, range: [start, end2, end2] };
      }
      let trimIndent = scalar.indent + header.indent;
      let offset = scalar.offset + header.length;
      let contentStart = 0;
      for (let i = 0; i < chompStart; ++i) {
        const [indent, content] = lines[i];
        if (content === "" || content === "\r") {
          if (header.indent === 0 && indent.length > trimIndent)
            trimIndent = indent.length;
        } else {
          if (indent.length < trimIndent) {
            const message = "Block scalars with more-indented leading empty lines must use an explicit indentation indicator";
            onError(offset + indent.length, "MISSING_CHAR", message);
          }
          if (header.indent === 0)
            trimIndent = indent.length;
          contentStart = i;
          if (trimIndent === 0 && !ctx.atRoot) {
            const message = "Block scalar values in collections must be indented";
            onError(offset, "BAD_INDENT", message);
          }
          break;
        }
        offset += indent.length + content.length + 1;
      }
      for (let i = lines.length - 1; i >= chompStart; --i) {
        if (lines[i][0].length > trimIndent)
          chompStart = i + 1;
      }
      let value = "";
      let sep2 = "";
      let prevMoreIndented = false;
      for (let i = 0; i < contentStart; ++i)
        value += lines[i][0].slice(trimIndent) + "\n";
      for (let i = contentStart; i < chompStart; ++i) {
        let [indent, content] = lines[i];
        offset += indent.length + content.length + 1;
        const crlf = content[content.length - 1] === "\r";
        if (crlf)
          content = content.slice(0, -1);
        if (content && indent.length < trimIndent) {
          const src = header.indent ? "explicit indentation indicator" : "first line";
          const message = `Block scalar lines must not be less indented than their ${src}`;
          onError(offset - content.length - (crlf ? 2 : 1), "BAD_INDENT", message);
          indent = "";
        }
        if (type === Scalar.Scalar.BLOCK_LITERAL) {
          value += sep2 + indent.slice(trimIndent) + content;
          sep2 = "\n";
        } else if (indent.length > trimIndent || content[0] === "	") {
          if (sep2 === " ")
            sep2 = "\n";
          else if (!prevMoreIndented && sep2 === "\n")
            sep2 = "\n\n";
          value += sep2 + indent.slice(trimIndent) + content;
          sep2 = "\n";
          prevMoreIndented = true;
        } else if (content === "") {
          if (sep2 === "\n")
            value += "\n";
          else
            sep2 = "\n";
        } else {
          value += sep2 + content;
          sep2 = " ";
          prevMoreIndented = false;
        }
      }
      switch (header.chomp) {
        case "-":
          break;
        case "+":
          for (let i = chompStart; i < lines.length; ++i)
            value += "\n" + lines[i][0].slice(trimIndent);
          if (value[value.length - 1] !== "\n")
            value += "\n";
          break;
        default:
          value += "\n";
      }
      const end = start + header.length + scalar.source.length;
      return { value, type, comment: header.comment, range: [start, end, end] };
    }
    function parseBlockScalarHeader({ offset, props }, strict, onError) {
      if (props[0].type !== "block-scalar-header") {
        onError(props[0], "IMPOSSIBLE", "Block scalar header not found");
        return null;
      }
      const { source } = props[0];
      const mode = source[0];
      let indent = 0;
      let chomp = "";
      let error = -1;
      for (let i = 1; i < source.length; ++i) {
        const ch = source[i];
        if (!chomp && (ch === "-" || ch === "+"))
          chomp = ch;
        else {
          const n = Number(ch);
          if (!indent && n)
            indent = n;
          else if (error === -1)
            error = offset + i;
        }
      }
      if (error !== -1)
        onError(error, "UNEXPECTED_TOKEN", `Block scalar header includes extra characters: ${source}`);
      let hasSpace = false;
      let comment = "";
      let length = source.length;
      for (let i = 1; i < props.length; ++i) {
        const token = props[i];
        switch (token.type) {
          case "space":
            hasSpace = true;
          // fallthrough
          case "newline":
            length += token.source.length;
            break;
          case "comment":
            if (strict && !hasSpace) {
              const message = "Comments must be separated from other tokens by white space characters";
              onError(token, "MISSING_CHAR", message);
            }
            length += token.source.length;
            comment = token.source.substring(1);
            break;
          case "error":
            onError(token, "UNEXPECTED_TOKEN", token.message);
            length += token.source.length;
            break;
          /* istanbul ignore next should not happen */
          default: {
            const message = `Unexpected token in block scalar header: ${token.type}`;
            onError(token, "UNEXPECTED_TOKEN", message);
            const ts = token.source;
            if (ts && typeof ts === "string")
              length += ts.length;
          }
        }
      }
      return { mode, indent, chomp, comment, length };
    }
    function splitLines(source) {
      const split = source.split(/\n( *)/);
      const first = split[0];
      const m = first.match(/^( *)/);
      const line0 = m?.[1] ? [m[1], first.slice(m[1].length)] : ["", first];
      const lines = [line0];
      for (let i = 1; i < split.length; i += 2)
        lines.push([split[i], split[i + 1]]);
      return lines;
    }
    exports.resolveBlockScalar = resolveBlockScalar;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/compose/resolve-flow-scalar.js
var require_resolve_flow_scalar = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/compose/resolve-flow-scalar.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    var resolveEnd = require_resolve_end();
    function resolveFlowScalar(scalar, strict, onError) {
      const { offset, type, source, end } = scalar;
      let _type;
      let value;
      const _onError = (rel, code, msg) => onError(offset + rel, code, msg);
      switch (type) {
        case "scalar":
          _type = Scalar.Scalar.PLAIN;
          value = plainValue(source, _onError);
          break;
        case "single-quoted-scalar":
          _type = Scalar.Scalar.QUOTE_SINGLE;
          value = singleQuotedValue(source, _onError);
          break;
        case "double-quoted-scalar":
          _type = Scalar.Scalar.QUOTE_DOUBLE;
          value = doubleQuotedValue(source, _onError);
          break;
        /* istanbul ignore next should not happen */
        default:
          onError(scalar, "UNEXPECTED_TOKEN", `Expected a flow scalar value, but found: ${type}`);
          return {
            value: "",
            type: null,
            comment: "",
            range: [offset, offset + source.length, offset + source.length]
          };
      }
      const valueEnd = offset + source.length;
      const re = resolveEnd.resolveEnd(end, valueEnd, strict, onError);
      return {
        value,
        type: _type,
        comment: re.comment,
        range: [offset, valueEnd, re.offset]
      };
    }
    function plainValue(source, onError) {
      let badChar = "";
      switch (source[0]) {
        /* istanbul ignore next should not happen */
        case "	":
          badChar = "a tab character";
          break;
        case ",":
          badChar = "flow indicator character ,";
          break;
        case "%":
          badChar = "directive indicator character %";
          break;
        case "|":
        case ">": {
          badChar = `block scalar indicator ${source[0]}`;
          break;
        }
        case "@":
        case "`": {
          badChar = `reserved character ${source[0]}`;
          break;
        }
      }
      if (badChar)
        onError(0, "BAD_SCALAR_START", `Plain value cannot start with ${badChar}`);
      return unfoldLines(source);
    }
    function singleQuotedValue(source, onError) {
      if (source[source.length - 1] !== "'" || source.length === 1)
        onError(source.length, "MISSING_CHAR", "Missing closing 'quote");
      return unfoldLines(source.slice(1, -1)).replace(/''/g, "'");
    }
    function unfoldLines(source) {
      const line = /(.*?)\r?\n/sy;
      let match = line.exec(source);
      if (!match)
        return source;
      let trimEnd, trimBoth;
      try {
        trimEnd = new RegExp("(?<![ 	])[ 	]+$");
        trimBoth = new RegExp("^[ 	]+|(?<![ 	])[ 	]+$", "g");
      } catch {
        trimEnd = /[ \t]+$/;
        trimBoth = /^[ \t]+|[ \t]+$/g;
      }
      let res = match[1].replace(trimEnd, "");
      let sep2 = " ";
      let pos = line.lastIndex;
      while (match = line.exec(source)) {
        const lm = match[1].replace(trimBoth, "");
        if (lm === "") {
          if (sep2 === "\n")
            res += sep2;
          else
            sep2 = "\n";
        } else {
          res += sep2 + lm;
          sep2 = " ";
        }
        pos = line.lastIndex;
      }
      const last = /[ \t]*(.*)/sy;
      last.lastIndex = pos;
      match = last.exec(source);
      return res + sep2 + (match?.[1] ?? "");
    }
    function doubleQuotedValue(source, onError) {
      let res = "";
      for (let i = 1; i < source.length - 1; ++i) {
        const ch = source[i];
        if (ch === "\r" && source[i + 1] === "\n")
          continue;
        if (ch === "\n") {
          const { fold, offset } = foldNewline(source, i);
          res += fold;
          i = offset;
        } else if (ch === "\\") {
          let next = source[++i];
          const cc = escapeCodes[next];
          if (cc)
            res += cc;
          else if (next === "\n") {
            next = source[i + 1];
            while (next === " " || next === "	")
              next = source[++i + 1];
          } else if (next === "\r" && source[i + 1] === "\n") {
            next = source[++i + 1];
            while (next === " " || next === "	")
              next = source[++i + 1];
          } else if (next === "x" || next === "u" || next === "U") {
            const length = next === "x" ? 2 : next === "u" ? 4 : 8;
            res += parseCharCode(source, i + 1, length, onError);
            i += length;
          } else {
            const raw = source.substr(i - 1, 2);
            onError(i - 1, "BAD_DQ_ESCAPE", `Invalid escape sequence ${raw}`);
            res += raw;
          }
        } else if (ch === " " || ch === "	") {
          const wsStart = i;
          let next = source[i + 1];
          while (next === " " || next === "	")
            next = source[++i + 1];
          if (next !== "\n" && !(next === "\r" && source[i + 2] === "\n"))
            res += i > wsStart ? source.slice(wsStart, i + 1) : ch;
        } else {
          res += ch;
        }
      }
      if (source[source.length - 1] !== '"' || source.length === 1)
        onError(source.length, "MISSING_CHAR", 'Missing closing "quote');
      return res;
    }
    function foldNewline(source, offset) {
      let fold = "";
      let ch = source[offset + 1];
      while (ch === " " || ch === "	" || ch === "\n" || ch === "\r") {
        if (ch === "\r" && source[offset + 2] !== "\n")
          break;
        if (ch === "\n")
          fold += "\n";
        offset += 1;
        ch = source[offset + 1];
      }
      if (!fold)
        fold = " ";
      return { fold, offset };
    }
    var escapeCodes = {
      "0": "\0",
      // null character
      a: "\x07",
      // bell character
      b: "\b",
      // backspace
      e: "\x1B",
      // escape character
      f: "\f",
      // form feed
      n: "\n",
      // line feed
      r: "\r",
      // carriage return
      t: "	",
      // horizontal tab
      v: "\v",
      // vertical tab
      N: "\x85",
      // Unicode next line
      _: "\xA0",
      // Unicode non-breaking space
      L: "\u2028",
      // Unicode line separator
      P: "\u2029",
      // Unicode paragraph separator
      " ": " ",
      '"': '"',
      "/": "/",
      "\\": "\\",
      "	": "	"
    };
    function parseCharCode(source, offset, length, onError) {
      const cc = source.substr(offset, length);
      const ok = cc.length === length && /^[0-9a-fA-F]+$/.test(cc);
      const code = ok ? parseInt(cc, 16) : NaN;
      try {
        return String.fromCodePoint(code);
      } catch {
        const raw = source.substr(offset - 2, length + 2);
        onError(offset - 2, "BAD_DQ_ESCAPE", `Invalid escape sequence ${raw}`);
        return raw;
      }
    }
    exports.resolveFlowScalar = resolveFlowScalar;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/compose/compose-scalar.js
var require_compose_scalar = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/compose/compose-scalar.js"(exports) {
    "use strict";
    var identity = require_identity();
    var Scalar = require_Scalar();
    var resolveBlockScalar = require_resolve_block_scalar();
    var resolveFlowScalar = require_resolve_flow_scalar();
    function composeScalar(ctx, token, tagToken, onError) {
      const { value, type, comment, range } = token.type === "block-scalar" ? resolveBlockScalar.resolveBlockScalar(ctx, token, onError) : resolveFlowScalar.resolveFlowScalar(token, ctx.options.strict, onError);
      const tagName = tagToken ? ctx.directives.tagName(tagToken.source, (msg) => onError(tagToken, "TAG_RESOLVE_FAILED", msg)) : null;
      let tag;
      if (ctx.options.stringKeys && ctx.atKey) {
        tag = ctx.schema[identity.SCALAR];
      } else if (tagName)
        tag = findScalarTagByName(ctx.schema, value, tagName, tagToken, onError);
      else if (token.type === "scalar")
        tag = findScalarTagByTest(ctx, value, token, onError);
      else
        tag = ctx.schema[identity.SCALAR];
      let scalar;
      try {
        const res = tag.resolve(value, (msg) => onError(tagToken ?? token, "TAG_RESOLVE_FAILED", msg), ctx.options);
        scalar = identity.isScalar(res) ? res : new Scalar.Scalar(res);
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        onError(tagToken ?? token, "TAG_RESOLVE_FAILED", msg);
        scalar = new Scalar.Scalar(value);
      }
      scalar.range = range;
      scalar.source = value;
      if (type)
        scalar.type = type;
      if (tagName)
        scalar.tag = tagName;
      if (tag.format)
        scalar.format = tag.format;
      if (comment)
        scalar.comment = comment;
      return scalar;
    }
    function findScalarTagByName(schema, value, tagName, tagToken, onError) {
      if (tagName === "!")
        return schema[identity.SCALAR];
      const matchWithTest = [];
      for (const tag of schema.tags) {
        if (!tag.collection && tag.tag === tagName) {
          if (tag.default && tag.test)
            matchWithTest.push(tag);
          else
            return tag;
        }
      }
      for (const tag of matchWithTest)
        if (tag.test?.test(value))
          return tag;
      const kt = schema.knownTags[tagName];
      if (kt && !kt.collection) {
        schema.tags.push(Object.assign({}, kt, { default: false, test: void 0 }));
        return kt;
      }
      onError(tagToken, "TAG_RESOLVE_FAILED", `Unresolved tag: ${tagName}`, tagName !== "tag:yaml.org,2002:str");
      return schema[identity.SCALAR];
    }
    function findScalarTagByTest({ atKey, directives, schema }, value, token, onError) {
      const tag = schema.tags.find((tag2) => (tag2.default === true || atKey && tag2.default === "key") && tag2.test?.test(value)) || schema[identity.SCALAR];
      if (schema.compat) {
        const compat = schema.compat.find((tag2) => tag2.default && tag2.test?.test(value)) ?? schema[identity.SCALAR];
        if (tag.tag !== compat.tag) {
          const ts = directives.tagString(tag.tag);
          const cs = directives.tagString(compat.tag);
          const msg = `Value may be parsed as either ${ts} or ${cs}`;
          onError(token, "TAG_RESOLVE_FAILED", msg, true);
        }
      }
      return tag;
    }
    exports.composeScalar = composeScalar;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/compose/util-empty-scalar-position.js
var require_util_empty_scalar_position = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/compose/util-empty-scalar-position.js"(exports) {
    "use strict";
    function emptyScalarPosition(offset, before, pos) {
      if (before) {
        pos ?? (pos = before.length);
        for (let i = pos - 1; i >= 0; --i) {
          let st = before[i];
          switch (st.type) {
            case "space":
            case "comment":
            case "newline":
              offset -= st.source.length;
              continue;
          }
          st = before[++i];
          while (st?.type === "space") {
            offset += st.source.length;
            st = before[++i];
          }
          break;
        }
      }
      return offset;
    }
    exports.emptyScalarPosition = emptyScalarPosition;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/compose/compose-node.js
var require_compose_node = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/compose/compose-node.js"(exports) {
    "use strict";
    var Alias = require_Alias();
    var identity = require_identity();
    var composeCollection = require_compose_collection();
    var composeScalar = require_compose_scalar();
    var resolveEnd = require_resolve_end();
    var utilEmptyScalarPosition = require_util_empty_scalar_position();
    var CN = { composeNode, composeEmptyNode };
    function composeNode(ctx, token, props, onError) {
      const atKey = ctx.atKey;
      const { spaceBefore, comment, anchor, tag } = props;
      let node;
      let isSrcToken = true;
      switch (token.type) {
        case "alias":
          node = composeAlias(ctx, token, onError);
          if (anchor || tag)
            onError(token, "ALIAS_PROPS", "An alias node must not specify any properties");
          break;
        case "scalar":
        case "single-quoted-scalar":
        case "double-quoted-scalar":
        case "block-scalar":
          node = composeScalar.composeScalar(ctx, token, tag, onError);
          if (anchor)
            node.anchor = anchor.source.substring(1);
          break;
        case "block-map":
        case "block-seq":
        case "flow-collection":
          try {
            node = composeCollection.composeCollection(CN, ctx, token, props, onError);
            if (anchor)
              node.anchor = anchor.source.substring(1);
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            onError(token, "RESOURCE_EXHAUSTION", message);
          }
          break;
        default: {
          const message = token.type === "error" ? token.message : `Unsupported token (type: ${token.type})`;
          onError(token, "UNEXPECTED_TOKEN", message);
          isSrcToken = false;
        }
      }
      node ?? (node = composeEmptyNode(ctx, token.offset, void 0, null, props, onError));
      if (anchor && node.anchor === "")
        onError(anchor, "BAD_ALIAS", "Anchor cannot be an empty string");
      if (atKey && ctx.options.stringKeys && (!identity.isScalar(node) || typeof node.value !== "string" || node.tag && node.tag !== "tag:yaml.org,2002:str")) {
        const msg = "With stringKeys, all keys must be strings";
        onError(tag ?? token, "NON_STRING_KEY", msg);
      }
      if (spaceBefore)
        node.spaceBefore = true;
      if (comment) {
        if (token.type === "scalar" && token.source === "")
          node.comment = comment;
        else
          node.commentBefore = comment;
      }
      if (ctx.options.keepSourceTokens && isSrcToken)
        node.srcToken = token;
      return node;
    }
    function composeEmptyNode(ctx, offset, before, pos, { spaceBefore, comment, anchor, tag, end }, onError) {
      const token = {
        type: "scalar",
        offset: utilEmptyScalarPosition.emptyScalarPosition(offset, before, pos),
        indent: -1,
        source: ""
      };
      const node = composeScalar.composeScalar(ctx, token, tag, onError);
      if (anchor) {
        node.anchor = anchor.source.substring(1);
        if (node.anchor === "")
          onError(anchor, "BAD_ALIAS", "Anchor cannot be an empty string");
      }
      if (spaceBefore)
        node.spaceBefore = true;
      if (comment) {
        node.comment = comment;
        node.range[2] = end;
      }
      return node;
    }
    function composeAlias({ options }, { offset, source, end }, onError) {
      const alias = new Alias.Alias(source.substring(1));
      if (alias.source === "")
        onError(offset, "BAD_ALIAS", "Alias cannot be an empty string");
      if (alias.source.endsWith(":"))
        onError(offset + source.length - 1, "BAD_ALIAS", "Alias ending in : is ambiguous", true);
      const valueEnd = offset + source.length;
      const re = resolveEnd.resolveEnd(end, valueEnd, options.strict, onError);
      alias.range = [offset, valueEnd, re.offset];
      if (re.comment)
        alias.comment = re.comment;
      return alias;
    }
    exports.composeEmptyNode = composeEmptyNode;
    exports.composeNode = composeNode;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/compose/compose-doc.js
var require_compose_doc = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/compose/compose-doc.js"(exports) {
    "use strict";
    var Document = require_Document();
    var composeNode = require_compose_node();
    var resolveEnd = require_resolve_end();
    var resolveProps = require_resolve_props();
    function composeDoc(options, directives, { offset, start, value, end }, onError) {
      const opts = Object.assign({ _directives: directives }, options);
      const doc = new Document.Document(void 0, opts);
      const ctx = {
        atKey: false,
        atRoot: true,
        directives: doc.directives,
        options: doc.options,
        schema: doc.schema
      };
      const props = resolveProps.resolveProps(start, {
        indicator: "doc-start",
        next: value ?? end?.[0],
        offset,
        onError,
        parentIndent: 0,
        startOnNewline: true
      });
      if (props.found) {
        doc.directives.docStart = true;
        if (value && (value.type === "block-map" || value.type === "block-seq") && !props.hasNewline)
          onError(props.end, "MISSING_CHAR", "Block collection cannot start on same line with directives-end marker");
      }
      doc.contents = value ? composeNode.composeNode(ctx, value, props, onError) : composeNode.composeEmptyNode(ctx, props.end, start, null, props, onError);
      const contentEnd = doc.contents.range[2];
      const re = resolveEnd.resolveEnd(end, contentEnd, false, onError);
      if (re.comment)
        doc.comment = re.comment;
      doc.range = [offset, contentEnd, re.offset];
      return doc;
    }
    exports.composeDoc = composeDoc;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/compose/composer.js
var require_composer = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/compose/composer.js"(exports) {
    "use strict";
    var node_process = __require("process");
    var directives = require_directives();
    var Document = require_Document();
    var errors = require_errors();
    var identity = require_identity();
    var composeDoc = require_compose_doc();
    var resolveEnd = require_resolve_end();
    function getErrorPos(src) {
      if (typeof src === "number")
        return [src, src + 1];
      if (Array.isArray(src))
        return src.length === 2 ? src : [src[0], src[1]];
      const { offset, source } = src;
      return [offset, offset + (typeof source === "string" ? source.length : 1)];
    }
    function parsePrelude(prelude) {
      let comment = "";
      let atComment = false;
      let afterEmptyLine = false;
      for (let i = 0; i < prelude.length; ++i) {
        const source = prelude[i];
        switch (source[0]) {
          case "#":
            comment += (comment === "" ? "" : afterEmptyLine ? "\n\n" : "\n") + (source.substring(1) || " ");
            atComment = true;
            afterEmptyLine = false;
            break;
          case "%":
            if (prelude[i + 1]?.[0] !== "#")
              i += 1;
            atComment = false;
            break;
          default:
            if (!atComment)
              afterEmptyLine = true;
            atComment = false;
        }
      }
      return { comment, afterEmptyLine };
    }
    var Composer = class {
      constructor(options = {}) {
        this.doc = null;
        this.atDirectives = false;
        this.prelude = [];
        this.errors = [];
        this.warnings = [];
        this.onError = (source, code, message, warning) => {
          const pos = getErrorPos(source);
          if (warning)
            this.warnings.push(new errors.YAMLWarning(pos, code, message));
          else
            this.errors.push(new errors.YAMLParseError(pos, code, message));
        };
        this.directives = new directives.Directives({ version: options.version || "1.2" });
        this.options = options;
      }
      decorate(doc, afterDoc) {
        const { comment, afterEmptyLine } = parsePrelude(this.prelude);
        if (comment) {
          const dc = doc.contents;
          if (afterDoc) {
            doc.comment = doc.comment ? `${doc.comment}
${comment}` : comment;
          } else if (afterEmptyLine || doc.directives.docStart || !dc) {
            doc.commentBefore = comment;
          } else if (identity.isCollection(dc) && !dc.flow && dc.items.length > 0) {
            let it = dc.items[0];
            if (identity.isPair(it))
              it = it.key;
            const cb = it.commentBefore;
            it.commentBefore = cb ? `${comment}
${cb}` : comment;
          } else {
            const cb = dc.commentBefore;
            dc.commentBefore = cb ? `${comment}
${cb}` : comment;
          }
        }
        if (afterDoc) {
          for (let i = 0; i < this.errors.length; ++i)
            doc.errors.push(this.errors[i]);
          for (let i = 0; i < this.warnings.length; ++i)
            doc.warnings.push(this.warnings[i]);
        } else {
          doc.errors = this.errors;
          doc.warnings = this.warnings;
        }
        this.prelude = [];
        this.errors = [];
        this.warnings = [];
      }
      /**
       * Current stream status information.
       *
       * Mostly useful at the end of input for an empty stream.
       */
      streamInfo() {
        return {
          comment: parsePrelude(this.prelude).comment,
          directives: this.directives,
          errors: this.errors,
          warnings: this.warnings
        };
      }
      /**
       * Compose tokens into documents.
       *
       * @param forceDoc - If the stream contains no document, still emit a final document including any comments and directives that would be applied to a subsequent document.
       * @param endOffset - Should be set if `forceDoc` is also set, to set the document range end and to indicate errors correctly.
       */
      *compose(tokens, forceDoc = false, endOffset = -1) {
        for (const token of tokens)
          yield* this.next(token);
        yield* this.end(forceDoc, endOffset);
      }
      /** Advance the composer by one CST token. */
      *next(token) {
        if (node_process.env.LOG_STREAM)
          console.dir(token, { depth: null });
        switch (token.type) {
          case "directive":
            this.directives.add(token.source, (offset, message, warning) => {
              const pos = getErrorPos(token);
              pos[0] += offset;
              this.onError(pos, "BAD_DIRECTIVE", message, warning);
            });
            this.prelude.push(token.source);
            this.atDirectives = true;
            break;
          case "document": {
            const doc = composeDoc.composeDoc(this.options, this.directives, token, this.onError);
            if (this.atDirectives && !doc.directives.docStart)
              this.onError(token, "MISSING_CHAR", "Missing directives-end/doc-start indicator line");
            this.decorate(doc, false);
            if (this.doc)
              yield this.doc;
            this.doc = doc;
            this.atDirectives = false;
            break;
          }
          case "byte-order-mark":
          case "space":
            break;
          case "comment":
          case "newline":
            this.prelude.push(token.source);
            break;
          case "error": {
            const msg = token.source ? `${token.message}: ${JSON.stringify(token.source)}` : token.message;
            const error = new errors.YAMLParseError(getErrorPos(token), "UNEXPECTED_TOKEN", msg);
            if (this.atDirectives || !this.doc)
              this.errors.push(error);
            else
              this.doc.errors.push(error);
            break;
          }
          case "doc-end": {
            if (!this.doc) {
              const msg = "Unexpected doc-end without preceding document";
              this.errors.push(new errors.YAMLParseError(getErrorPos(token), "UNEXPECTED_TOKEN", msg));
              break;
            }
            this.doc.directives.docEnd = true;
            const end = resolveEnd.resolveEnd(token.end, token.offset + token.source.length, this.doc.options.strict, this.onError);
            this.decorate(this.doc, true);
            if (end.comment) {
              const dc = this.doc.comment;
              this.doc.comment = dc ? `${dc}
${end.comment}` : end.comment;
            }
            this.doc.range[2] = end.offset;
            break;
          }
          default:
            this.errors.push(new errors.YAMLParseError(getErrorPos(token), "UNEXPECTED_TOKEN", `Unsupported token ${token.type}`));
        }
      }
      /**
       * Call at end of input to yield any remaining document.
       *
       * @param forceDoc - If the stream contains no document, still emit a final document including any comments and directives that would be applied to a subsequent document.
       * @param endOffset - Should be set if `forceDoc` is also set, to set the document range end and to indicate errors correctly.
       */
      *end(forceDoc = false, endOffset = -1) {
        if (this.doc) {
          this.decorate(this.doc, true);
          yield this.doc;
          this.doc = null;
        } else if (forceDoc) {
          const opts = Object.assign({ _directives: this.directives }, this.options);
          const doc = new Document.Document(void 0, opts);
          if (this.atDirectives)
            this.onError(endOffset, "MISSING_CHAR", "Missing directives-end indicator line");
          doc.range = [0, endOffset, endOffset];
          this.decorate(doc, false);
          yield doc;
        }
      }
    };
    exports.Composer = Composer;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/parse/cst-scalar.js
var require_cst_scalar = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/parse/cst-scalar.js"(exports) {
    "use strict";
    var resolveBlockScalar = require_resolve_block_scalar();
    var resolveFlowScalar = require_resolve_flow_scalar();
    var errors = require_errors();
    var stringifyString = require_stringifyString();
    function resolveAsScalar(token, strict = true, onError) {
      if (token) {
        const _onError = (pos, code, message) => {
          const offset = typeof pos === "number" ? pos : Array.isArray(pos) ? pos[0] : pos.offset;
          if (onError)
            onError(offset, code, message);
          else
            throw new errors.YAMLParseError([offset, offset + 1], code, message);
        };
        switch (token.type) {
          case "scalar":
          case "single-quoted-scalar":
          case "double-quoted-scalar":
            return resolveFlowScalar.resolveFlowScalar(token, strict, _onError);
          case "block-scalar":
            return resolveBlockScalar.resolveBlockScalar({ options: { strict } }, token, _onError);
        }
      }
      return null;
    }
    function createScalarToken(value, context) {
      const { implicitKey = false, indent, inFlow = false, offset = -1, type = "PLAIN" } = context;
      const source = stringifyString.stringifyString({ type, value }, {
        implicitKey,
        indent: indent > 0 ? " ".repeat(indent) : "",
        inFlow,
        options: { blockQuote: true, lineWidth: -1 }
      });
      const end = context.end ?? [
        { type: "newline", offset: -1, indent, source: "\n" }
      ];
      switch (source[0]) {
        case "|":
        case ">": {
          const he = source.indexOf("\n");
          const head = source.substring(0, he);
          const body = source.substring(he + 1) + "\n";
          const props = [
            { type: "block-scalar-header", offset, indent, source: head }
          ];
          if (!addEndtoBlockProps(props, end))
            props.push({ type: "newline", offset: -1, indent, source: "\n" });
          return { type: "block-scalar", offset, indent, props, source: body };
        }
        case '"':
          return { type: "double-quoted-scalar", offset, indent, source, end };
        case "'":
          return { type: "single-quoted-scalar", offset, indent, source, end };
        default:
          return { type: "scalar", offset, indent, source, end };
      }
    }
    function setScalarValue(token, value, context = {}) {
      let { afterKey = false, implicitKey = false, inFlow = false, type } = context;
      let indent = "indent" in token ? token.indent : null;
      if (afterKey && typeof indent === "number")
        indent += 2;
      if (!type)
        switch (token.type) {
          case "single-quoted-scalar":
            type = "QUOTE_SINGLE";
            break;
          case "double-quoted-scalar":
            type = "QUOTE_DOUBLE";
            break;
          case "block-scalar": {
            const header = token.props[0];
            if (header.type !== "block-scalar-header")
              throw new Error("Invalid block scalar header");
            type = header.source[0] === ">" ? "BLOCK_FOLDED" : "BLOCK_LITERAL";
            break;
          }
          default:
            type = "PLAIN";
        }
      const source = stringifyString.stringifyString({ type, value }, {
        implicitKey: implicitKey || indent === null,
        indent: indent !== null && indent > 0 ? " ".repeat(indent) : "",
        inFlow,
        options: { blockQuote: true, lineWidth: -1 }
      });
      switch (source[0]) {
        case "|":
        case ">":
          setBlockScalarValue(token, source);
          break;
        case '"':
          setFlowScalarValue(token, source, "double-quoted-scalar");
          break;
        case "'":
          setFlowScalarValue(token, source, "single-quoted-scalar");
          break;
        default:
          setFlowScalarValue(token, source, "scalar");
      }
    }
    function setBlockScalarValue(token, source) {
      const he = source.indexOf("\n");
      const head = source.substring(0, he);
      const body = source.substring(he + 1) + "\n";
      if (token.type === "block-scalar") {
        const header = token.props[0];
        if (header.type !== "block-scalar-header")
          throw new Error("Invalid block scalar header");
        header.source = head;
        token.source = body;
      } else {
        const { offset } = token;
        const indent = "indent" in token ? token.indent : -1;
        const props = [
          { type: "block-scalar-header", offset, indent, source: head }
        ];
        if (!addEndtoBlockProps(props, "end" in token ? token.end : void 0))
          props.push({ type: "newline", offset: -1, indent, source: "\n" });
        for (const key of Object.keys(token))
          if (key !== "type" && key !== "offset")
            delete token[key];
        Object.assign(token, { type: "block-scalar", indent, props, source: body });
      }
    }
    function addEndtoBlockProps(props, end) {
      if (end)
        for (const st of end)
          switch (st.type) {
            case "space":
            case "comment":
              props.push(st);
              break;
            case "newline":
              props.push(st);
              return true;
          }
      return false;
    }
    function setFlowScalarValue(token, source, type) {
      switch (token.type) {
        case "scalar":
        case "double-quoted-scalar":
        case "single-quoted-scalar":
          token.type = type;
          token.source = source;
          break;
        case "block-scalar": {
          const end = token.props.slice(1);
          let oa = source.length;
          if (token.props[0].type === "block-scalar-header")
            oa -= token.props[0].source.length;
          for (const tok of end)
            tok.offset += oa;
          delete token.props;
          Object.assign(token, { type, source, end });
          break;
        }
        case "block-map":
        case "block-seq": {
          const offset = token.offset + source.length;
          const nl = { type: "newline", offset, indent: token.indent, source: "\n" };
          delete token.items;
          Object.assign(token, { type, source, end: [nl] });
          break;
        }
        default: {
          const indent = "indent" in token ? token.indent : -1;
          const end = "end" in token && Array.isArray(token.end) ? token.end.filter((st) => st.type === "space" || st.type === "comment" || st.type === "newline") : [];
          for (const key of Object.keys(token))
            if (key !== "type" && key !== "offset")
              delete token[key];
          Object.assign(token, { type, indent, source, end });
        }
      }
    }
    exports.createScalarToken = createScalarToken;
    exports.resolveAsScalar = resolveAsScalar;
    exports.setScalarValue = setScalarValue;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/parse/cst-stringify.js
var require_cst_stringify = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/parse/cst-stringify.js"(exports) {
    "use strict";
    var stringify = (cst) => "type" in cst ? stringifyToken(cst) : stringifyItem(cst);
    function stringifyToken(token) {
      switch (token.type) {
        case "block-scalar": {
          let res = "";
          for (const tok of token.props)
            res += stringifyToken(tok);
          return res + token.source;
        }
        case "block-map":
        case "block-seq": {
          let res = "";
          for (const item of token.items)
            res += stringifyItem(item);
          return res;
        }
        case "flow-collection": {
          let res = token.start.source;
          for (const item of token.items)
            res += stringifyItem(item);
          for (const st of token.end)
            res += st.source;
          return res;
        }
        case "document": {
          let res = stringifyItem(token);
          if (token.end)
            for (const st of token.end)
              res += st.source;
          return res;
        }
        default: {
          let res = token.source;
          if ("end" in token && token.end)
            for (const st of token.end)
              res += st.source;
          return res;
        }
      }
    }
    function stringifyItem({ start, key, sep: sep2, value }) {
      let res = "";
      for (const st of start)
        res += st.source;
      if (key)
        res += stringifyToken(key);
      if (sep2)
        for (const st of sep2)
          res += st.source;
      if (value)
        res += stringifyToken(value);
      return res;
    }
    exports.stringify = stringify;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/parse/cst-visit.js
var require_cst_visit = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/parse/cst-visit.js"(exports) {
    "use strict";
    var BREAK = /* @__PURE__ */ Symbol("break visit");
    var SKIP = /* @__PURE__ */ Symbol("skip children");
    var REMOVE = /* @__PURE__ */ Symbol("remove item");
    function visit(cst, visitor) {
      if ("type" in cst && cst.type === "document")
        cst = { start: cst.start, value: cst.value };
      _visit(Object.freeze([]), cst, visitor);
    }
    visit.BREAK = BREAK;
    visit.SKIP = SKIP;
    visit.REMOVE = REMOVE;
    visit.itemAtPath = (cst, path) => {
      let item = cst;
      for (const [field, index] of path) {
        const tok = item?.[field];
        if (tok && "items" in tok) {
          item = tok.items[index];
        } else
          return void 0;
      }
      return item;
    };
    visit.parentCollection = (cst, path) => {
      const parent = visit.itemAtPath(cst, path.slice(0, -1));
      const field = path[path.length - 1][0];
      const coll = parent?.[field];
      if (coll && "items" in coll)
        return coll;
      throw new Error("Parent collection not found");
    };
    function _visit(path, item, visitor) {
      let ctrl = visitor(item, path);
      if (typeof ctrl === "symbol")
        return ctrl;
      for (const field of ["key", "value"]) {
        const token = item[field];
        if (token && "items" in token) {
          for (let i = 0; i < token.items.length; ++i) {
            const ci = _visit(Object.freeze(path.concat([[field, i]])), token.items[i], visitor);
            if (typeof ci === "number")
              i = ci - 1;
            else if (ci === BREAK)
              return BREAK;
            else if (ci === REMOVE) {
              token.items.splice(i, 1);
              i -= 1;
            }
          }
          if (typeof ctrl === "function" && field === "key")
            ctrl = ctrl(item, path);
        }
      }
      return typeof ctrl === "function" ? ctrl(item, path) : ctrl;
    }
    exports.visit = visit;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/parse/cst.js
var require_cst = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/parse/cst.js"(exports) {
    "use strict";
    var cstScalar = require_cst_scalar();
    var cstStringify = require_cst_stringify();
    var cstVisit = require_cst_visit();
    var BOM = "\uFEFF";
    var DOCUMENT = "";
    var FLOW_END = "";
    var SCALAR = "";
    var isCollection = (token) => !!token && "items" in token;
    var isScalar = (token) => !!token && (token.type === "scalar" || token.type === "single-quoted-scalar" || token.type === "double-quoted-scalar" || token.type === "block-scalar");
    function prettyToken(token) {
      switch (token) {
        case BOM:
          return "<BOM>";
        case DOCUMENT:
          return "<DOC>";
        case FLOW_END:
          return "<FLOW_END>";
        case SCALAR:
          return "<SCALAR>";
        default:
          return JSON.stringify(token);
      }
    }
    function tokenType(source) {
      switch (source) {
        case BOM:
          return "byte-order-mark";
        case DOCUMENT:
          return "doc-mode";
        case FLOW_END:
          return "flow-error-end";
        case SCALAR:
          return "scalar";
        case "---":
          return "doc-start";
        case "...":
          return "doc-end";
        case "":
        case "\n":
        case "\r\n":
          return "newline";
        case "-":
          return "seq-item-ind";
        case "?":
          return "explicit-key-ind";
        case ":":
          return "map-value-ind";
        case "{":
          return "flow-map-start";
        case "}":
          return "flow-map-end";
        case "[":
          return "flow-seq-start";
        case "]":
          return "flow-seq-end";
        case ",":
          return "comma";
      }
      switch (source[0]) {
        case " ":
        case "	":
          return "space";
        case "#":
          return "comment";
        case "%":
          return "directive-line";
        case "*":
          return "alias";
        case "&":
          return "anchor";
        case "!":
          return "tag";
        case "'":
          return "single-quoted-scalar";
        case '"':
          return "double-quoted-scalar";
        case "|":
        case ">":
          return "block-scalar-header";
      }
      return null;
    }
    exports.createScalarToken = cstScalar.createScalarToken;
    exports.resolveAsScalar = cstScalar.resolveAsScalar;
    exports.setScalarValue = cstScalar.setScalarValue;
    exports.stringify = cstStringify.stringify;
    exports.visit = cstVisit.visit;
    exports.BOM = BOM;
    exports.DOCUMENT = DOCUMENT;
    exports.FLOW_END = FLOW_END;
    exports.SCALAR = SCALAR;
    exports.isCollection = isCollection;
    exports.isScalar = isScalar;
    exports.prettyToken = prettyToken;
    exports.tokenType = tokenType;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/parse/lexer.js
var require_lexer = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/parse/lexer.js"(exports) {
    "use strict";
    var cst = require_cst();
    function isEmpty(ch) {
      switch (ch) {
        case void 0:
        case " ":
        case "\n":
        case "\r":
        case "	":
          return true;
        default:
          return false;
      }
    }
    var hexDigits = new Set("0123456789ABCDEFabcdef");
    var tagChars = new Set("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-#;/?:@&=+$_.!~*'()");
    var flowIndicatorChars = new Set(",[]{}");
    var invalidAnchorChars = new Set(" ,[]{}\n\r	");
    var isNotAnchorChar = (ch) => !ch || invalidAnchorChars.has(ch);
    var Lexer = class {
      constructor() {
        this.atEnd = false;
        this.blockScalarIndent = -1;
        this.blockScalarKeep = false;
        this.buffer = "";
        this.flowKey = false;
        this.flowLevel = 0;
        this.indentNext = 0;
        this.indentValue = 0;
        this.lineEndPos = null;
        this.next = null;
        this.pos = 0;
      }
      /**
       * Generate YAML tokens from the `source` string. If `incomplete`,
       * a part of the last line may be left as a buffer for the next call.
       *
       * @returns A generator of lexical tokens
       */
      *lex(source, incomplete = false) {
        if (source) {
          if (typeof source !== "string")
            throw TypeError("source is not a string");
          this.buffer = this.buffer ? this.buffer + source : source;
          this.lineEndPos = null;
        }
        this.atEnd = !incomplete;
        let next = this.next ?? "stream";
        while (next && (incomplete || this.hasChars(1)))
          next = yield* this.parseNext(next);
      }
      atLineEnd() {
        let i = this.pos;
        let ch = this.buffer[i];
        while (ch === " " || ch === "	")
          ch = this.buffer[++i];
        if (!ch || ch === "#" || ch === "\n")
          return true;
        if (ch === "\r")
          return this.buffer[i + 1] === "\n";
        return false;
      }
      charAt(n) {
        return this.buffer[this.pos + n];
      }
      continueScalar(offset) {
        let ch = this.buffer[offset];
        if (this.indentNext > 0) {
          let indent = 0;
          while (ch === " ")
            ch = this.buffer[++indent + offset];
          if (ch === "\r") {
            const next = this.buffer[indent + offset + 1];
            if (next === "\n" || !next && !this.atEnd)
              return offset + indent + 1;
          }
          return ch === "\n" || indent >= this.indentNext || !ch && !this.atEnd ? offset + indent : -1;
        }
        if (ch === "-" || ch === ".") {
          const dt = this.buffer.substr(offset, 3);
          if ((dt === "---" || dt === "...") && isEmpty(this.buffer[offset + 3]))
            return -1;
        }
        return offset;
      }
      getLine() {
        let end = this.lineEndPos;
        if (typeof end !== "number" || end !== -1 && end < this.pos) {
          end = this.buffer.indexOf("\n", this.pos);
          this.lineEndPos = end;
        }
        if (end === -1)
          return this.atEnd ? this.buffer.substring(this.pos) : null;
        if (this.buffer[end - 1] === "\r")
          end -= 1;
        return this.buffer.substring(this.pos, end);
      }
      hasChars(n) {
        return this.pos + n <= this.buffer.length;
      }
      setNext(state) {
        this.buffer = this.buffer.substring(this.pos);
        this.pos = 0;
        this.lineEndPos = null;
        this.next = state;
        return null;
      }
      peek(n) {
        return this.buffer.substr(this.pos, n);
      }
      *parseNext(next) {
        switch (next) {
          case "stream":
            return yield* this.parseStream();
          case "line-start":
            return yield* this.parseLineStart();
          case "block-start":
            return yield* this.parseBlockStart();
          case "doc":
            return yield* this.parseDocument();
          case "flow":
            return yield* this.parseFlowCollection();
          case "quoted-scalar":
            return yield* this.parseQuotedScalar();
          case "block-scalar":
            return yield* this.parseBlockScalar();
          case "plain-scalar":
            return yield* this.parsePlainScalar();
        }
      }
      *parseStream() {
        let line = this.getLine();
        if (line === null)
          return this.setNext("stream");
        if (line[0] === cst.BOM) {
          yield* this.pushCount(1);
          line = line.substring(1);
        }
        if (line[0] === "%") {
          let dirEnd = line.length;
          let cs = line.indexOf("#");
          while (cs !== -1) {
            const ch = line[cs - 1];
            if (ch === " " || ch === "	") {
              dirEnd = cs - 1;
              break;
            } else {
              cs = line.indexOf("#", cs + 1);
            }
          }
          while (true) {
            const ch = line[dirEnd - 1];
            if (ch === " " || ch === "	")
              dirEnd -= 1;
            else
              break;
          }
          const n = (yield* this.pushCount(dirEnd)) + (yield* this.pushSpaces(true));
          yield* this.pushCount(line.length - n);
          this.pushNewline();
          return "stream";
        }
        if (this.atLineEnd()) {
          const sp = yield* this.pushSpaces(true);
          yield* this.pushCount(line.length - sp);
          yield* this.pushNewline();
          return "stream";
        }
        yield cst.DOCUMENT;
        return yield* this.parseLineStart();
      }
      *parseLineStart() {
        const ch = this.charAt(0);
        if (!ch && !this.atEnd)
          return this.setNext("line-start");
        if (ch === "-" || ch === ".") {
          if (!this.atEnd && !this.hasChars(4))
            return this.setNext("line-start");
          const s = this.peek(3);
          if ((s === "---" || s === "...") && isEmpty(this.charAt(3))) {
            yield* this.pushCount(3);
            this.indentValue = 0;
            this.indentNext = 0;
            return s === "---" ? "doc" : "stream";
          }
        }
        this.indentValue = yield* this.pushSpaces(false);
        if (this.indentNext > this.indentValue && !isEmpty(this.charAt(1)))
          this.indentNext = this.indentValue;
        return yield* this.parseBlockStart();
      }
      *parseBlockStart() {
        const [ch0, ch1] = this.peek(2);
        if (!ch1 && !this.atEnd)
          return this.setNext("block-start");
        if ((ch0 === "-" || ch0 === "?" || ch0 === ":") && isEmpty(ch1)) {
          const n = (yield* this.pushCount(1)) + (yield* this.pushSpaces(true));
          this.indentNext = this.indentValue + 1;
          this.indentValue += n;
          return "block-start";
        }
        return "doc";
      }
      *parseDocument() {
        yield* this.pushSpaces(true);
        const line = this.getLine();
        if (line === null)
          return this.setNext("doc");
        let n = yield* this.pushIndicators();
        switch (line[n]) {
          case "#":
            yield* this.pushCount(line.length - n);
          // fallthrough
          case void 0:
            yield* this.pushNewline();
            return yield* this.parseLineStart();
          case "{":
          case "[":
            yield* this.pushCount(1);
            this.flowKey = false;
            this.flowLevel = 1;
            return "flow";
          case "}":
          case "]":
            yield* this.pushCount(1);
            return "doc";
          case "*":
            yield* this.pushUntil(isNotAnchorChar);
            return "doc";
          case '"':
          case "'":
            return yield* this.parseQuotedScalar();
          case "|":
          case ">":
            n += yield* this.parseBlockScalarHeader();
            n += yield* this.pushSpaces(true);
            yield* this.pushCount(line.length - n);
            yield* this.pushNewline();
            return yield* this.parseBlockScalar();
          default:
            return yield* this.parsePlainScalar();
        }
      }
      *parseFlowCollection() {
        let nl, sp;
        let indent = -1;
        do {
          nl = yield* this.pushNewline();
          if (nl > 0) {
            sp = yield* this.pushSpaces(false);
            this.indentValue = indent = sp;
          } else {
            sp = 0;
          }
          sp += yield* this.pushSpaces(true);
        } while (nl + sp > 0);
        const line = this.getLine();
        if (line === null)
          return this.setNext("flow");
        if (indent !== -1 && indent < this.indentNext && line[0] !== "#" || indent === 0 && (line.startsWith("---") || line.startsWith("...")) && isEmpty(line[3])) {
          const atFlowEndMarker = indent === this.indentNext - 1 && this.flowLevel === 1 && (line[0] === "]" || line[0] === "}");
          if (!atFlowEndMarker) {
            this.flowLevel = 0;
            yield cst.FLOW_END;
            return yield* this.parseLineStart();
          }
        }
        let n = 0;
        while (line[n] === ",") {
          n += yield* this.pushCount(1);
          n += yield* this.pushSpaces(true);
          this.flowKey = false;
        }
        n += yield* this.pushIndicators();
        switch (line[n]) {
          case void 0:
            return "flow";
          case "#":
            yield* this.pushCount(line.length - n);
            return "flow";
          case "{":
          case "[":
            yield* this.pushCount(1);
            this.flowKey = false;
            this.flowLevel += 1;
            return "flow";
          case "}":
          case "]":
            yield* this.pushCount(1);
            this.flowKey = true;
            this.flowLevel -= 1;
            return this.flowLevel ? "flow" : "doc";
          case "*":
            yield* this.pushUntil(isNotAnchorChar);
            return "flow";
          case '"':
          case "'":
            this.flowKey = true;
            return yield* this.parseQuotedScalar();
          case ":": {
            const next = this.charAt(1);
            if (this.flowKey || isEmpty(next) || next === ",") {
              this.flowKey = false;
              yield* this.pushCount(1);
              yield* this.pushSpaces(true);
              return "flow";
            }
          }
          // fallthrough
          default:
            this.flowKey = false;
            return yield* this.parsePlainScalar();
        }
      }
      *parseQuotedScalar() {
        const quote = this.charAt(0);
        let end = this.buffer.indexOf(quote, this.pos + 1);
        if (quote === "'") {
          while (end !== -1 && this.buffer[end + 1] === "'")
            end = this.buffer.indexOf("'", end + 2);
        } else {
          while (end !== -1) {
            let n = 0;
            while (this.buffer[end - 1 - n] === "\\")
              n += 1;
            if (n % 2 === 0)
              break;
            end = this.buffer.indexOf('"', end + 1);
          }
        }
        const qb = this.buffer.substring(0, end);
        let nl = qb.indexOf("\n", this.pos);
        if (nl !== -1) {
          while (nl !== -1) {
            const cs = this.continueScalar(nl + 1);
            if (cs === -1)
              break;
            nl = qb.indexOf("\n", cs);
          }
          if (nl !== -1) {
            end = nl - (qb[nl - 1] === "\r" ? 2 : 1);
          }
        }
        if (end === -1) {
          if (!this.atEnd)
            return this.setNext("quoted-scalar");
          end = this.buffer.length;
        }
        yield* this.pushToIndex(end + 1, false);
        return this.flowLevel ? "flow" : "doc";
      }
      *parseBlockScalarHeader() {
        this.blockScalarIndent = -1;
        this.blockScalarKeep = false;
        let i = this.pos;
        while (true) {
          const ch = this.buffer[++i];
          if (ch === "+")
            this.blockScalarKeep = true;
          else if (ch > "0" && ch <= "9")
            this.blockScalarIndent = Number(ch) - 1;
          else if (ch !== "-")
            break;
        }
        return yield* this.pushUntil((ch) => isEmpty(ch) || ch === "#");
      }
      *parseBlockScalar() {
        let nl = this.pos - 1;
        let indent = 0;
        let ch;
        loop: for (let i2 = this.pos; ch = this.buffer[i2]; ++i2) {
          switch (ch) {
            case " ":
              indent += 1;
              break;
            case "\n":
              nl = i2;
              indent = 0;
              break;
            case "\r": {
              const next = this.buffer[i2 + 1];
              if (!next && !this.atEnd)
                return this.setNext("block-scalar");
              if (next === "\n")
                break;
            }
            // fallthrough
            default:
              break loop;
          }
        }
        if (!ch && !this.atEnd)
          return this.setNext("block-scalar");
        if (indent >= this.indentNext) {
          if (this.blockScalarIndent === -1)
            this.indentNext = indent;
          else {
            this.indentNext = this.blockScalarIndent + (this.indentNext === 0 ? 1 : this.indentNext);
          }
          do {
            const cs = this.continueScalar(nl + 1);
            if (cs === -1)
              break;
            nl = this.buffer.indexOf("\n", cs);
          } while (nl !== -1);
          if (nl === -1) {
            if (!this.atEnd)
              return this.setNext("block-scalar");
            nl = this.buffer.length;
          }
        }
        let i = nl + 1;
        ch = this.buffer[i];
        while (ch === " ")
          ch = this.buffer[++i];
        if (ch === "	") {
          while (ch === "	" || ch === " " || ch === "\r" || ch === "\n")
            ch = this.buffer[++i];
          nl = i - 1;
        } else if (!this.blockScalarKeep) {
          do {
            let i2 = nl - 1;
            let ch2 = this.buffer[i2];
            if (ch2 === "\r")
              ch2 = this.buffer[--i2];
            const lastChar = i2;
            while (ch2 === " ")
              ch2 = this.buffer[--i2];
            if (ch2 === "\n" && i2 >= this.pos && i2 + 1 + indent > lastChar)
              nl = i2;
            else
              break;
          } while (true);
        }
        yield cst.SCALAR;
        yield* this.pushToIndex(nl + 1, true);
        return yield* this.parseLineStart();
      }
      *parsePlainScalar() {
        const inFlow = this.flowLevel > 0;
        let end = this.pos - 1;
        let i = this.pos - 1;
        let ch;
        while (ch = this.buffer[++i]) {
          if (ch === ":") {
            const next = this.buffer[i + 1];
            if (isEmpty(next) || inFlow && flowIndicatorChars.has(next))
              break;
            end = i;
          } else if (isEmpty(ch)) {
            let next = this.buffer[i + 1];
            if (ch === "\r") {
              if (next === "\n") {
                i += 1;
                ch = "\n";
                next = this.buffer[i + 1];
              } else
                end = i;
            }
            if (next === "#" || inFlow && flowIndicatorChars.has(next))
              break;
            if (ch === "\n") {
              const cs = this.continueScalar(i + 1);
              if (cs === -1)
                break;
              i = Math.max(i, cs - 2);
            }
          } else {
            if (inFlow && flowIndicatorChars.has(ch))
              break;
            end = i;
          }
        }
        if (!ch && !this.atEnd)
          return this.setNext("plain-scalar");
        yield cst.SCALAR;
        yield* this.pushToIndex(end + 1, true);
        return inFlow ? "flow" : "doc";
      }
      *pushCount(n) {
        if (n > 0) {
          yield this.buffer.substr(this.pos, n);
          this.pos += n;
          return n;
        }
        return 0;
      }
      *pushToIndex(i, allowEmpty) {
        const s = this.buffer.slice(this.pos, i);
        if (s) {
          yield s;
          this.pos += s.length;
          return s.length;
        } else if (allowEmpty)
          yield "";
        return 0;
      }
      *pushIndicators() {
        let n = 0;
        loop: while (true) {
          switch (this.charAt(0)) {
            case "!":
              n += yield* this.pushTag();
              n += yield* this.pushSpaces(true);
              continue loop;
            case "&":
              n += yield* this.pushUntil(isNotAnchorChar);
              n += yield* this.pushSpaces(true);
              continue loop;
            case "-":
            // this is an error
            case "?":
            // this is an error outside flow collections
            case ":": {
              const inFlow = this.flowLevel > 0;
              const ch1 = this.charAt(1);
              if (isEmpty(ch1) || inFlow && flowIndicatorChars.has(ch1)) {
                if (!inFlow)
                  this.indentNext = this.indentValue + 1;
                else if (this.flowKey)
                  this.flowKey = false;
                n += yield* this.pushCount(1);
                n += yield* this.pushSpaces(true);
                continue loop;
              }
            }
          }
          break loop;
        }
        return n;
      }
      *pushTag() {
        if (this.charAt(1) === "<") {
          let i = this.pos + 2;
          let ch = this.buffer[i];
          while (!isEmpty(ch) && ch !== ">")
            ch = this.buffer[++i];
          return yield* this.pushToIndex(ch === ">" ? i + 1 : i, false);
        } else {
          let i = this.pos + 1;
          let ch = this.buffer[i];
          while (ch) {
            if (tagChars.has(ch))
              ch = this.buffer[++i];
            else if (ch === "%" && hexDigits.has(this.buffer[i + 1]) && hexDigits.has(this.buffer[i + 2])) {
              ch = this.buffer[i += 3];
            } else
              break;
          }
          return yield* this.pushToIndex(i, false);
        }
      }
      *pushNewline() {
        const ch = this.buffer[this.pos];
        if (ch === "\n")
          return yield* this.pushCount(1);
        else if (ch === "\r" && this.charAt(1) === "\n")
          return yield* this.pushCount(2);
        else
          return 0;
      }
      *pushSpaces(allowTabs) {
        let i = this.pos - 1;
        let ch;
        do {
          ch = this.buffer[++i];
        } while (ch === " " || allowTabs && ch === "	");
        const n = i - this.pos;
        if (n > 0) {
          yield this.buffer.substr(this.pos, n);
          this.pos = i;
        }
        return n;
      }
      *pushUntil(test) {
        let i = this.pos;
        let ch = this.buffer[i];
        while (!test(ch))
          ch = this.buffer[++i];
        return yield* this.pushToIndex(i, false);
      }
    };
    exports.Lexer = Lexer;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/parse/line-counter.js
var require_line_counter = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/parse/line-counter.js"(exports) {
    "use strict";
    var LineCounter = class {
      constructor() {
        this.lineStarts = [];
        this.addNewLine = (offset) => this.lineStarts.push(offset);
        this.linePos = (offset) => {
          let low = 0;
          let high = this.lineStarts.length;
          while (low < high) {
            const mid = low + high >> 1;
            if (this.lineStarts[mid] < offset)
              low = mid + 1;
            else
              high = mid;
          }
          if (this.lineStarts[low] === offset)
            return { line: low + 1, col: 1 };
          if (low === 0)
            return { line: 0, col: offset };
          const start = this.lineStarts[low - 1];
          return { line: low, col: offset - start + 1 };
        };
      }
    };
    exports.LineCounter = LineCounter;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/parse/parser.js
var require_parser = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/parse/parser.js"(exports) {
    "use strict";
    var node_process = __require("process");
    var cst = require_cst();
    var lexer = require_lexer();
    function includesToken(list, type) {
      for (let i = 0; i < list.length; ++i)
        if (list[i].type === type)
          return true;
      return false;
    }
    function findNonEmptyIndex(list) {
      for (let i = 0; i < list.length; ++i) {
        switch (list[i].type) {
          case "space":
          case "comment":
          case "newline":
            break;
          default:
            return i;
        }
      }
      return -1;
    }
    function isFlowToken(token) {
      switch (token?.type) {
        case "alias":
        case "scalar":
        case "single-quoted-scalar":
        case "double-quoted-scalar":
        case "flow-collection":
          return true;
        default:
          return false;
      }
    }
    function getPrevProps(parent) {
      switch (parent.type) {
        case "document":
          return parent.start;
        case "block-map": {
          const it = parent.items[parent.items.length - 1];
          return it.sep ?? it.start;
        }
        case "block-seq":
          return parent.items[parent.items.length - 1].start;
        /* istanbul ignore next should not happen */
        default:
          return [];
      }
    }
    function getFirstKeyStartProps(prev) {
      if (prev.length === 0)
        return [];
      let i = prev.length;
      loop: while (--i >= 0) {
        switch (prev[i].type) {
          case "doc-start":
          case "explicit-key-ind":
          case "map-value-ind":
          case "seq-item-ind":
          case "newline":
            break loop;
        }
      }
      while (prev[++i]?.type === "space") {
      }
      return prev.splice(i, prev.length);
    }
    function arrayPushArray(target, source) {
      if (source.length < 1e5)
        Array.prototype.push.apply(target, source);
      else
        for (let i = 0; i < source.length; ++i)
          target.push(source[i]);
    }
    function fixFlowSeqItems(fc) {
      if (fc.start.type === "flow-seq-start") {
        for (const it of fc.items) {
          if (it.sep && !it.value && !includesToken(it.start, "explicit-key-ind") && !includesToken(it.sep, "map-value-ind")) {
            if (it.key)
              it.value = it.key;
            delete it.key;
            if (isFlowToken(it.value)) {
              if (it.value.end)
                arrayPushArray(it.value.end, it.sep);
              else
                it.value.end = it.sep;
            } else
              arrayPushArray(it.start, it.sep);
            delete it.sep;
          }
        }
      }
    }
    var Parser = class {
      /**
       * @param onNewLine - If defined, called separately with the start position of
       *   each new line (in `parse()`, including the start of input).
       */
      constructor(onNewLine) {
        this.atNewLine = true;
        this.atScalar = false;
        this.indent = 0;
        this.offset = 0;
        this.onKeyLine = false;
        this.stack = [];
        this.source = "";
        this.type = "";
        this.lexer = new lexer.Lexer();
        this.onNewLine = onNewLine;
      }
      /**
       * Parse `source` as a YAML stream.
       * If `incomplete`, a part of the last line may be left as a buffer for the next call.
       *
       * Errors are not thrown, but yielded as `{ type: 'error', message }` tokens.
       *
       * @returns A generator of tokens representing each directive, document, and other structure.
       */
      *parse(source, incomplete = false) {
        if (this.onNewLine && this.offset === 0)
          this.onNewLine(0);
        for (const lexeme of this.lexer.lex(source, incomplete))
          yield* this.next(lexeme);
        if (!incomplete)
          yield* this.end();
      }
      /**
       * Advance the parser by the `source` of one lexical token.
       */
      *next(source) {
        this.source = source;
        if (node_process.env.LOG_TOKENS)
          console.log("|", cst.prettyToken(source));
        if (this.atScalar) {
          this.atScalar = false;
          yield* this.step();
          this.offset += source.length;
          return;
        }
        const type = cst.tokenType(source);
        if (!type) {
          const message = `Not a YAML token: ${source}`;
          yield* this.pop({ type: "error", offset: this.offset, message, source });
          this.offset += source.length;
        } else if (type === "scalar") {
          this.atNewLine = false;
          this.atScalar = true;
          this.type = "scalar";
        } else {
          this.type = type;
          yield* this.step();
          switch (type) {
            case "newline":
              this.atNewLine = true;
              this.indent = 0;
              if (this.onNewLine)
                this.onNewLine(this.offset + source.length);
              break;
            case "space":
              if (this.atNewLine && source[0] === " ")
                this.indent += source.length;
              break;
            case "explicit-key-ind":
            case "map-value-ind":
            case "seq-item-ind":
              if (this.atNewLine)
                this.indent += source.length;
              break;
            case "doc-mode":
            case "flow-error-end":
              return;
            default:
              this.atNewLine = false;
          }
          this.offset += source.length;
        }
      }
      /** Call at end of input to push out any remaining constructions */
      *end() {
        while (this.stack.length > 0)
          yield* this.pop();
      }
      get sourceToken() {
        const st = {
          type: this.type,
          offset: this.offset,
          indent: this.indent,
          source: this.source
        };
        return st;
      }
      *step() {
        const top = this.peek(1);
        if (this.type === "doc-end" && top?.type !== "doc-end") {
          while (this.stack.length > 0)
            yield* this.pop();
          this.stack.push({
            type: "doc-end",
            offset: this.offset,
            source: this.source
          });
          return;
        }
        if (!top)
          return yield* this.stream();
        switch (top.type) {
          case "document":
            return yield* this.document(top);
          case "alias":
          case "scalar":
          case "single-quoted-scalar":
          case "double-quoted-scalar":
            return yield* this.scalar(top);
          case "block-scalar":
            return yield* this.blockScalar(top);
          case "block-map":
            return yield* this.blockMap(top);
          case "block-seq":
            return yield* this.blockSequence(top);
          case "flow-collection":
            return yield* this.flowCollection(top);
          case "doc-end":
            return yield* this.documentEnd(top);
        }
        yield* this.pop();
      }
      peek(n) {
        return this.stack[this.stack.length - n];
      }
      *pop(error) {
        const token = error ?? this.stack.pop();
        if (!token) {
          const message = "Tried to pop an empty stack";
          yield { type: "error", offset: this.offset, source: "", message };
        } else if (this.stack.length === 0) {
          yield token;
        } else {
          const top = this.peek(1);
          if (token.type === "block-scalar") {
            token.indent = "indent" in top ? top.indent : 0;
          } else if (token.type === "flow-collection" && top.type === "document") {
            token.indent = 0;
          }
          if (token.type === "flow-collection")
            fixFlowSeqItems(token);
          switch (top.type) {
            case "document":
              top.value = token;
              break;
            case "block-scalar":
              top.props.push(token);
              break;
            case "block-map": {
              const it = top.items[top.items.length - 1];
              if (it.value) {
                top.items.push({ start: [], key: token, sep: [] });
                this.onKeyLine = true;
                return;
              } else if (it.sep) {
                it.value = token;
              } else {
                Object.assign(it, { key: token, sep: [] });
                this.onKeyLine = !it.explicitKey;
                return;
              }
              break;
            }
            case "block-seq": {
              const it = top.items[top.items.length - 1];
              if (it.value)
                top.items.push({ start: [], value: token });
              else
                it.value = token;
              break;
            }
            case "flow-collection": {
              const it = top.items[top.items.length - 1];
              if (!it || it.value)
                top.items.push({ start: [], key: token, sep: [] });
              else if (it.sep)
                it.value = token;
              else
                Object.assign(it, { key: token, sep: [] });
              return;
            }
            /* istanbul ignore next should not happen */
            default:
              yield* this.pop();
              yield* this.pop(token);
          }
          if ((top.type === "document" || top.type === "block-map" || top.type === "block-seq") && (token.type === "block-map" || token.type === "block-seq")) {
            const last = token.items[token.items.length - 1];
            if (last && !last.sep && !last.value && last.start.length > 0 && findNonEmptyIndex(last.start) === -1 && (token.indent === 0 || last.start.every((st) => st.type !== "comment" || st.indent < token.indent))) {
              if (top.type === "document")
                top.end = last.start;
              else
                top.items.push({ start: last.start });
              token.items.splice(-1, 1);
            }
          }
        }
      }
      *stream() {
        switch (this.type) {
          case "directive-line":
            yield { type: "directive", offset: this.offset, source: this.source };
            return;
          case "byte-order-mark":
          case "space":
          case "comment":
          case "newline":
            yield this.sourceToken;
            return;
          case "doc-mode":
          case "doc-start": {
            const doc = {
              type: "document",
              offset: this.offset,
              start: []
            };
            if (this.type === "doc-start")
              doc.start.push(this.sourceToken);
            this.stack.push(doc);
            return;
          }
        }
        yield {
          type: "error",
          offset: this.offset,
          message: `Unexpected ${this.type} token in YAML stream`,
          source: this.source
        };
      }
      *document(doc) {
        if (doc.value)
          return yield* this.lineEnd(doc);
        switch (this.type) {
          case "doc-start": {
            if (findNonEmptyIndex(doc.start) !== -1) {
              yield* this.pop();
              yield* this.step();
            } else
              doc.start.push(this.sourceToken);
            return;
          }
          case "anchor":
          case "tag":
          case "space":
          case "comment":
          case "newline":
            doc.start.push(this.sourceToken);
            return;
        }
        const bv = this.startBlockValue(doc);
        if (bv)
          this.stack.push(bv);
        else {
          yield {
            type: "error",
            offset: this.offset,
            message: `Unexpected ${this.type} token in YAML document`,
            source: this.source
          };
        }
      }
      *scalar(scalar) {
        if (this.type === "map-value-ind") {
          const prev = getPrevProps(this.peek(2));
          const start = getFirstKeyStartProps(prev);
          let sep2;
          if (scalar.end) {
            sep2 = scalar.end;
            sep2.push(this.sourceToken);
            delete scalar.end;
          } else
            sep2 = [this.sourceToken];
          const map = {
            type: "block-map",
            offset: scalar.offset,
            indent: scalar.indent,
            items: [{ start, key: scalar, sep: sep2 }]
          };
          this.onKeyLine = true;
          this.stack[this.stack.length - 1] = map;
        } else
          yield* this.lineEnd(scalar);
      }
      *blockScalar(scalar) {
        switch (this.type) {
          case "space":
          case "comment":
          case "newline":
            scalar.props.push(this.sourceToken);
            return;
          case "scalar":
            scalar.source = this.source;
            this.atNewLine = true;
            this.indent = 0;
            if (this.onNewLine) {
              let nl = this.source.indexOf("\n") + 1;
              while (nl !== 0) {
                this.onNewLine(this.offset + nl);
                nl = this.source.indexOf("\n", nl) + 1;
              }
            }
            yield* this.pop();
            break;
          /* istanbul ignore next should not happen */
          default:
            yield* this.pop();
            yield* this.step();
        }
      }
      *blockMap(map) {
        const it = map.items[map.items.length - 1];
        switch (this.type) {
          case "newline":
            this.onKeyLine = false;
            if (it.value) {
              const end = "end" in it.value ? it.value.end : void 0;
              const last = Array.isArray(end) ? end[end.length - 1] : void 0;
              if (last?.type === "comment")
                end?.push(this.sourceToken);
              else
                map.items.push({ start: [this.sourceToken] });
            } else if (it.sep) {
              it.sep.push(this.sourceToken);
            } else {
              it.start.push(this.sourceToken);
            }
            return;
          case "space":
          case "comment":
            if (it.value) {
              map.items.push({ start: [this.sourceToken] });
            } else if (it.sep) {
              it.sep.push(this.sourceToken);
            } else {
              if (this.atIndentedComment(it.start, map.indent)) {
                const prev = map.items[map.items.length - 2];
                const end = prev?.value?.end;
                if (Array.isArray(end)) {
                  arrayPushArray(end, it.start);
                  end.push(this.sourceToken);
                  map.items.pop();
                  return;
                }
              }
              it.start.push(this.sourceToken);
            }
            return;
        }
        if (this.indent >= map.indent) {
          const atMapIndent = !this.onKeyLine && this.indent === map.indent;
          const atNextItem = atMapIndent && (it.sep || it.explicitKey) && this.type !== "seq-item-ind";
          let start = [];
          if (atNextItem && it.sep && !it.value) {
            const nl = [];
            for (let i = 0; i < it.sep.length; ++i) {
              const st = it.sep[i];
              switch (st.type) {
                case "newline":
                  nl.push(i);
                  break;
                case "space":
                  break;
                case "comment":
                  if (st.indent > map.indent)
                    nl.length = 0;
                  break;
                default:
                  nl.length = 0;
              }
            }
            if (nl.length >= 2)
              start = it.sep.splice(nl[1]);
          }
          switch (this.type) {
            case "anchor":
            case "tag":
              if (atNextItem || it.value) {
                start.push(this.sourceToken);
                map.items.push({ start });
                this.onKeyLine = true;
              } else if (it.sep) {
                it.sep.push(this.sourceToken);
              } else {
                it.start.push(this.sourceToken);
              }
              return;
            case "explicit-key-ind":
              if (!it.sep && !it.explicitKey) {
                it.start.push(this.sourceToken);
                it.explicitKey = true;
              } else if (atNextItem || it.value) {
                start.push(this.sourceToken);
                map.items.push({ start, explicitKey: true });
              } else {
                this.stack.push({
                  type: "block-map",
                  offset: this.offset,
                  indent: this.indent,
                  items: [{ start: [this.sourceToken], explicitKey: true }]
                });
              }
              this.onKeyLine = true;
              return;
            case "map-value-ind":
              if (it.explicitKey) {
                if (!it.sep) {
                  if (includesToken(it.start, "newline")) {
                    Object.assign(it, { key: null, sep: [this.sourceToken] });
                  } else {
                    const start2 = getFirstKeyStartProps(it.start);
                    this.stack.push({
                      type: "block-map",
                      offset: this.offset,
                      indent: this.indent,
                      items: [{ start: start2, key: null, sep: [this.sourceToken] }]
                    });
                  }
                } else if (it.value) {
                  map.items.push({ start: [], key: null, sep: [this.sourceToken] });
                } else if (includesToken(it.sep, "map-value-ind")) {
                  this.stack.push({
                    type: "block-map",
                    offset: this.offset,
                    indent: this.indent,
                    items: [{ start, key: null, sep: [this.sourceToken] }]
                  });
                } else if (isFlowToken(it.key) && !includesToken(it.sep, "newline")) {
                  const start2 = getFirstKeyStartProps(it.start);
                  const key = it.key;
                  const sep2 = it.sep;
                  sep2.push(this.sourceToken);
                  delete it.key;
                  delete it.sep;
                  this.stack.push({
                    type: "block-map",
                    offset: this.offset,
                    indent: this.indent,
                    items: [{ start: start2, key, sep: sep2 }]
                  });
                } else if (start.length > 0) {
                  it.sep = it.sep.concat(start, this.sourceToken);
                } else {
                  it.sep.push(this.sourceToken);
                }
              } else {
                if (!it.sep) {
                  Object.assign(it, { key: null, sep: [this.sourceToken] });
                } else if (it.value || atNextItem) {
                  map.items.push({ start, key: null, sep: [this.sourceToken] });
                } else if (includesToken(it.sep, "map-value-ind")) {
                  this.stack.push({
                    type: "block-map",
                    offset: this.offset,
                    indent: this.indent,
                    items: [{ start: [], key: null, sep: [this.sourceToken] }]
                  });
                } else {
                  it.sep.push(this.sourceToken);
                }
              }
              this.onKeyLine = true;
              return;
            case "alias":
            case "scalar":
            case "single-quoted-scalar":
            case "double-quoted-scalar": {
              const fs = this.flowScalar(this.type);
              if (atNextItem || it.value) {
                map.items.push({ start, key: fs, sep: [] });
                this.onKeyLine = true;
              } else if (it.sep) {
                this.stack.push(fs);
              } else {
                Object.assign(it, { key: fs, sep: [] });
                this.onKeyLine = true;
              }
              return;
            }
            default: {
              const bv = this.startBlockValue(map);
              if (bv) {
                if (bv.type === "block-seq") {
                  if (!it.explicitKey && it.sep && !includesToken(it.sep, "newline")) {
                    yield* this.pop({
                      type: "error",
                      offset: this.offset,
                      message: "Unexpected block-seq-ind on same line with key",
                      source: this.source
                    });
                    return;
                  }
                } else if (atMapIndent) {
                  map.items.push({ start });
                }
                this.stack.push(bv);
                return;
              }
            }
          }
        }
        yield* this.pop();
        yield* this.step();
      }
      *blockSequence(seq) {
        const it = seq.items[seq.items.length - 1];
        switch (this.type) {
          case "newline":
            if (it.value) {
              const end = "end" in it.value ? it.value.end : void 0;
              const last = Array.isArray(end) ? end[end.length - 1] : void 0;
              if (last?.type === "comment")
                end?.push(this.sourceToken);
              else
                seq.items.push({ start: [this.sourceToken] });
            } else
              it.start.push(this.sourceToken);
            return;
          case "space":
          case "comment":
            if (it.value)
              seq.items.push({ start: [this.sourceToken] });
            else {
              if (this.atIndentedComment(it.start, seq.indent)) {
                const prev = seq.items[seq.items.length - 2];
                const end = prev?.value?.end;
                if (Array.isArray(end)) {
                  arrayPushArray(end, it.start);
                  end.push(this.sourceToken);
                  seq.items.pop();
                  return;
                }
              }
              it.start.push(this.sourceToken);
            }
            return;
          case "anchor":
          case "tag":
            if (it.value || this.indent <= seq.indent)
              break;
            it.start.push(this.sourceToken);
            return;
          case "seq-item-ind":
            if (this.indent !== seq.indent)
              break;
            if (it.value || includesToken(it.start, "seq-item-ind"))
              seq.items.push({ start: [this.sourceToken] });
            else
              it.start.push(this.sourceToken);
            return;
        }
        if (this.indent > seq.indent) {
          const bv = this.startBlockValue(seq);
          if (bv) {
            this.stack.push(bv);
            return;
          }
        }
        yield* this.pop();
        yield* this.step();
      }
      *flowCollection(fc) {
        const it = fc.items[fc.items.length - 1];
        if (this.type === "flow-error-end") {
          let top;
          do {
            yield* this.pop();
            top = this.peek(1);
          } while (top?.type === "flow-collection");
        } else if (fc.end.length === 0) {
          switch (this.type) {
            case "comma":
            case "explicit-key-ind":
              if (!it || it.sep)
                fc.items.push({ start: [this.sourceToken] });
              else
                it.start.push(this.sourceToken);
              return;
            case "map-value-ind":
              if (!it || it.value)
                fc.items.push({ start: [], key: null, sep: [this.sourceToken] });
              else if (it.sep)
                it.sep.push(this.sourceToken);
              else
                Object.assign(it, { key: null, sep: [this.sourceToken] });
              return;
            case "space":
            case "comment":
            case "newline":
            case "anchor":
            case "tag":
              if (!it || it.value)
                fc.items.push({ start: [this.sourceToken] });
              else if (it.sep)
                it.sep.push(this.sourceToken);
              else
                it.start.push(this.sourceToken);
              return;
            case "alias":
            case "scalar":
            case "single-quoted-scalar":
            case "double-quoted-scalar": {
              const fs = this.flowScalar(this.type);
              if (!it || it.value)
                fc.items.push({ start: [], key: fs, sep: [] });
              else if (it.sep)
                this.stack.push(fs);
              else
                Object.assign(it, { key: fs, sep: [] });
              return;
            }
            case "flow-map-end":
            case "flow-seq-end":
              fc.end.push(this.sourceToken);
              return;
          }
          const bv = this.startBlockValue(fc);
          if (bv)
            this.stack.push(bv);
          else {
            yield* this.pop();
            yield* this.step();
          }
        } else {
          const parent = this.peek(2);
          if (parent.type === "block-map" && (this.type === "map-value-ind" && parent.indent === fc.indent || this.type === "newline" && !parent.items[parent.items.length - 1].sep)) {
            yield* this.pop();
            yield* this.step();
          } else if (this.type === "map-value-ind" && parent.type !== "flow-collection") {
            const prev = getPrevProps(parent);
            const start = getFirstKeyStartProps(prev);
            fixFlowSeqItems(fc);
            const sep2 = fc.end.splice(1, fc.end.length);
            sep2.push(this.sourceToken);
            const map = {
              type: "block-map",
              offset: fc.offset,
              indent: fc.indent,
              items: [{ start, key: fc, sep: sep2 }]
            };
            this.onKeyLine = true;
            this.stack[this.stack.length - 1] = map;
          } else {
            yield* this.lineEnd(fc);
          }
        }
      }
      flowScalar(type) {
        if (this.onNewLine) {
          let nl = this.source.indexOf("\n") + 1;
          while (nl !== 0) {
            this.onNewLine(this.offset + nl);
            nl = this.source.indexOf("\n", nl) + 1;
          }
        }
        return {
          type,
          offset: this.offset,
          indent: this.indent,
          source: this.source
        };
      }
      startBlockValue(parent) {
        switch (this.type) {
          case "alias":
          case "scalar":
          case "single-quoted-scalar":
          case "double-quoted-scalar":
            return this.flowScalar(this.type);
          case "block-scalar-header":
            return {
              type: "block-scalar",
              offset: this.offset,
              indent: this.indent,
              props: [this.sourceToken],
              source: ""
            };
          case "flow-map-start":
          case "flow-seq-start":
            return {
              type: "flow-collection",
              offset: this.offset,
              indent: this.indent,
              start: this.sourceToken,
              items: [],
              end: []
            };
          case "seq-item-ind":
            return {
              type: "block-seq",
              offset: this.offset,
              indent: this.indent,
              items: [{ start: [this.sourceToken] }]
            };
          case "explicit-key-ind": {
            this.onKeyLine = true;
            const prev = getPrevProps(parent);
            const start = getFirstKeyStartProps(prev);
            start.push(this.sourceToken);
            return {
              type: "block-map",
              offset: this.offset,
              indent: this.indent,
              items: [{ start, explicitKey: true }]
            };
          }
          case "map-value-ind": {
            this.onKeyLine = true;
            const prev = getPrevProps(parent);
            const start = getFirstKeyStartProps(prev);
            return {
              type: "block-map",
              offset: this.offset,
              indent: this.indent,
              items: [{ start, key: null, sep: [this.sourceToken] }]
            };
          }
        }
        return null;
      }
      atIndentedComment(start, indent) {
        if (this.type !== "comment")
          return false;
        if (this.indent <= indent)
          return false;
        return start.every((st) => st.type === "newline" || st.type === "space");
      }
      *documentEnd(docEnd) {
        if (this.type !== "doc-mode") {
          if (docEnd.end)
            docEnd.end.push(this.sourceToken);
          else
            docEnd.end = [this.sourceToken];
          if (this.type === "newline")
            yield* this.pop();
        }
      }
      *lineEnd(token) {
        switch (this.type) {
          case "comma":
          case "doc-start":
          case "doc-end":
          case "flow-seq-end":
          case "flow-map-end":
          case "map-value-ind":
            yield* this.pop();
            yield* this.step();
            break;
          case "newline":
            this.onKeyLine = false;
          // fallthrough
          case "space":
          case "comment":
          default:
            if (token.end)
              token.end.push(this.sourceToken);
            else
              token.end = [this.sourceToken];
            if (this.type === "newline")
              yield* this.pop();
        }
      }
    };
    exports.Parser = Parser;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/public-api.js
var require_public_api = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/public-api.js"(exports) {
    "use strict";
    var composer = require_composer();
    var Document = require_Document();
    var errors = require_errors();
    var log = require_log();
    var identity = require_identity();
    var lineCounter = require_line_counter();
    var parser = require_parser();
    function parseOptions(options) {
      const prettyErrors = options.prettyErrors !== false;
      const lineCounter$1 = options.lineCounter || prettyErrors && new lineCounter.LineCounter() || null;
      return { lineCounter: lineCounter$1, prettyErrors };
    }
    function parseAllDocuments(source, options = {}) {
      const { lineCounter: lineCounter2, prettyErrors } = parseOptions(options);
      const parser$1 = new parser.Parser(lineCounter2?.addNewLine);
      const composer$1 = new composer.Composer(options);
      const docs = Array.from(composer$1.compose(parser$1.parse(source)));
      if (prettyErrors && lineCounter2)
        for (const doc of docs) {
          doc.errors.forEach(errors.prettifyError(source, lineCounter2));
          doc.warnings.forEach(errors.prettifyError(source, lineCounter2));
        }
      if (docs.length > 0)
        return docs;
      return Object.assign([], { empty: true }, composer$1.streamInfo());
    }
    function parseDocument(source, options = {}) {
      const { lineCounter: lineCounter2, prettyErrors } = parseOptions(options);
      const parser$1 = new parser.Parser(lineCounter2?.addNewLine);
      const composer$1 = new composer.Composer(options);
      let doc = null;
      for (const _doc of composer$1.compose(parser$1.parse(source), true, source.length)) {
        if (!doc)
          doc = _doc;
        else if (doc.options.logLevel !== "silent") {
          doc.errors.push(new errors.YAMLParseError(_doc.range.slice(0, 2), "MULTIPLE_DOCS", "Source contains multiple documents; please use YAML.parseAllDocuments()"));
          break;
        }
      }
      if (prettyErrors && lineCounter2) {
        doc.errors.forEach(errors.prettifyError(source, lineCounter2));
        doc.warnings.forEach(errors.prettifyError(source, lineCounter2));
      }
      return doc;
    }
    function parse3(src, reviver, options) {
      let _reviver = void 0;
      if (typeof reviver === "function") {
        _reviver = reviver;
      } else if (options === void 0 && reviver && typeof reviver === "object") {
        options = reviver;
      }
      const doc = parseDocument(src, options);
      if (!doc)
        return null;
      doc.warnings.forEach((warning) => log.warn(doc.options.logLevel, warning));
      if (doc.errors.length > 0) {
        if (doc.options.logLevel !== "silent")
          throw doc.errors[0];
        else
          doc.errors = [];
      }
      return doc.toJS(Object.assign({ reviver: _reviver }, options));
    }
    function stringify(value, replacer, options) {
      let _replacer = null;
      if (typeof replacer === "function" || Array.isArray(replacer)) {
        _replacer = replacer;
      } else if (options === void 0 && replacer) {
        options = replacer;
      }
      if (typeof options === "string")
        options = options.length;
      if (typeof options === "number") {
        const indent = Math.round(options);
        options = indent < 1 ? void 0 : indent > 8 ? { indent: 8 } : { indent };
      }
      if (value === void 0) {
        const { keepUndefined } = options ?? replacer ?? {};
        if (!keepUndefined)
          return void 0;
      }
      if (identity.isDocument(value) && !_replacer)
        return value.toString(options);
      return new Document.Document(value, _replacer, options).toString(options);
    }
    exports.parse = parse3;
    exports.parseAllDocuments = parseAllDocuments;
    exports.parseDocument = parseDocument;
    exports.stringify = stringify;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/index.js
var require_dist = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/index.js"(exports) {
    "use strict";
    var composer = require_composer();
    var Document = require_Document();
    var Schema = require_Schema();
    var errors = require_errors();
    var Alias = require_Alias();
    var identity = require_identity();
    var Pair = require_Pair();
    var Scalar = require_Scalar();
    var YAMLMap = require_YAMLMap();
    var YAMLSeq = require_YAMLSeq();
    var cst = require_cst();
    var lexer = require_lexer();
    var lineCounter = require_line_counter();
    var parser = require_parser();
    var publicApi = require_public_api();
    var visit = require_visit();
    exports.Composer = composer.Composer;
    exports.Document = Document.Document;
    exports.Schema = Schema.Schema;
    exports.YAMLError = errors.YAMLError;
    exports.YAMLParseError = errors.YAMLParseError;
    exports.YAMLWarning = errors.YAMLWarning;
    exports.Alias = Alias.Alias;
    exports.isAlias = identity.isAlias;
    exports.isCollection = identity.isCollection;
    exports.isDocument = identity.isDocument;
    exports.isMap = identity.isMap;
    exports.isNode = identity.isNode;
    exports.isPair = identity.isPair;
    exports.isScalar = identity.isScalar;
    exports.isSeq = identity.isSeq;
    exports.Pair = Pair.Pair;
    exports.Scalar = Scalar.Scalar;
    exports.YAMLMap = YAMLMap.YAMLMap;
    exports.YAMLSeq = YAMLSeq.YAMLSeq;
    exports.CST = cst;
    exports.Lexer = lexer.Lexer;
    exports.LineCounter = lineCounter.LineCounter;
    exports.Parser = parser.Parser;
    exports.parse = publicApi.parse;
    exports.parseAllDocuments = publicApi.parseAllDocuments;
    exports.parseDocument = publicApi.parseDocument;
    exports.stringify = publicApi.stringify;
    exports.visit = visit.visit;
    exports.visitAsync = visit.visitAsync;
  }
});

// node_modules/.pnpm/bottleneck@2.19.5/node_modules/bottleneck/light.js
var require_light = __commonJS({
  "node_modules/.pnpm/bottleneck@2.19.5/node_modules/bottleneck/light.js"(exports, module) {
    (function(global2, factory) {
      typeof exports === "object" && typeof module !== "undefined" ? module.exports = factory() : typeof define === "function" && define.amd ? define(factory) : global2.Bottleneck = factory();
    })(exports, (function() {
      "use strict";
      var commonjsGlobal = typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : {};
      function getCjsExportFromNamespace(n) {
        return n && n["default"] || n;
      }
      var load = function(received, defaults, onto = {}) {
        var k, ref, v;
        for (k in defaults) {
          v = defaults[k];
          onto[k] = (ref = received[k]) != null ? ref : v;
        }
        return onto;
      };
      var overwrite = function(received, defaults, onto = {}) {
        var k, v;
        for (k in received) {
          v = received[k];
          if (defaults[k] !== void 0) {
            onto[k] = v;
          }
        }
        return onto;
      };
      var parser = {
        load,
        overwrite
      };
      var DLList;
      DLList = class DLList {
        constructor(incr, decr) {
          this.incr = incr;
          this.decr = decr;
          this._first = null;
          this._last = null;
          this.length = 0;
        }
        push(value) {
          var node;
          this.length++;
          if (typeof this.incr === "function") {
            this.incr();
          }
          node = {
            value,
            prev: this._last,
            next: null
          };
          if (this._last != null) {
            this._last.next = node;
            this._last = node;
          } else {
            this._first = this._last = node;
          }
          return void 0;
        }
        shift() {
          var value;
          if (this._first == null) {
            return;
          } else {
            this.length--;
            if (typeof this.decr === "function") {
              this.decr();
            }
          }
          value = this._first.value;
          if ((this._first = this._first.next) != null) {
            this._first.prev = null;
          } else {
            this._last = null;
          }
          return value;
        }
        first() {
          if (this._first != null) {
            return this._first.value;
          }
        }
        getArray() {
          var node, ref, results;
          node = this._first;
          results = [];
          while (node != null) {
            results.push((ref = node, node = node.next, ref.value));
          }
          return results;
        }
        forEachShift(cb) {
          var node;
          node = this.shift();
          while (node != null) {
            cb(node), node = this.shift();
          }
          return void 0;
        }
        debug() {
          var node, ref, ref1, ref2, results;
          node = this._first;
          results = [];
          while (node != null) {
            results.push((ref = node, node = node.next, {
              value: ref.value,
              prev: (ref1 = ref.prev) != null ? ref1.value : void 0,
              next: (ref2 = ref.next) != null ? ref2.value : void 0
            }));
          }
          return results;
        }
      };
      var DLList_1 = DLList;
      var Events;
      Events = class Events {
        constructor(instance) {
          this.instance = instance;
          this._events = {};
          if (this.instance.on != null || this.instance.once != null || this.instance.removeAllListeners != null) {
            throw new Error("An Emitter already exists for this object");
          }
          this.instance.on = (name, cb) => {
            return this._addListener(name, "many", cb);
          };
          this.instance.once = (name, cb) => {
            return this._addListener(name, "once", cb);
          };
          this.instance.removeAllListeners = (name = null) => {
            if (name != null) {
              return delete this._events[name];
            } else {
              return this._events = {};
            }
          };
        }
        _addListener(name, status, cb) {
          var base;
          if ((base = this._events)[name] == null) {
            base[name] = [];
          }
          this._events[name].push({ cb, status });
          return this.instance;
        }
        listenerCount(name) {
          if (this._events[name] != null) {
            return this._events[name].length;
          } else {
            return 0;
          }
        }
        async trigger(name, ...args) {
          var e, promises;
          try {
            if (name !== "debug") {
              this.trigger("debug", `Event triggered: ${name}`, args);
            }
            if (this._events[name] == null) {
              return;
            }
            this._events[name] = this._events[name].filter(function(listener) {
              return listener.status !== "none";
            });
            promises = this._events[name].map(async (listener) => {
              var e2, returned;
              if (listener.status === "none") {
                return;
              }
              if (listener.status === "once") {
                listener.status = "none";
              }
              try {
                returned = typeof listener.cb === "function" ? listener.cb(...args) : void 0;
                if (typeof (returned != null ? returned.then : void 0) === "function") {
                  return await returned;
                } else {
                  return returned;
                }
              } catch (error) {
                e2 = error;
                {
                  this.trigger("error", e2);
                }
                return null;
              }
            });
            return (await Promise.all(promises)).find(function(x) {
              return x != null;
            });
          } catch (error) {
            e = error;
            {
              this.trigger("error", e);
            }
            return null;
          }
        }
      };
      var Events_1 = Events;
      var DLList$1, Events$1, Queues;
      DLList$1 = DLList_1;
      Events$1 = Events_1;
      Queues = class Queues {
        constructor(num_priorities) {
          var i;
          this.Events = new Events$1(this);
          this._length = 0;
          this._lists = (function() {
            var j, ref, results;
            results = [];
            for (i = j = 1, ref = num_priorities; 1 <= ref ? j <= ref : j >= ref; i = 1 <= ref ? ++j : --j) {
              results.push(new DLList$1((() => {
                return this.incr();
              }), (() => {
                return this.decr();
              })));
            }
            return results;
          }).call(this);
        }
        incr() {
          if (this._length++ === 0) {
            return this.Events.trigger("leftzero");
          }
        }
        decr() {
          if (--this._length === 0) {
            return this.Events.trigger("zero");
          }
        }
        push(job) {
          return this._lists[job.options.priority].push(job);
        }
        queued(priority) {
          if (priority != null) {
            return this._lists[priority].length;
          } else {
            return this._length;
          }
        }
        shiftAll(fn) {
          return this._lists.forEach(function(list) {
            return list.forEachShift(fn);
          });
        }
        getFirst(arr = this._lists) {
          var j, len, list;
          for (j = 0, len = arr.length; j < len; j++) {
            list = arr[j];
            if (list.length > 0) {
              return list;
            }
          }
          return [];
        }
        shiftLastFrom(priority) {
          return this.getFirst(this._lists.slice(priority).reverse()).shift();
        }
      };
      var Queues_1 = Queues;
      var BottleneckError;
      BottleneckError = class BottleneckError extends Error {
      };
      var BottleneckError_1 = BottleneckError;
      var BottleneckError$1, DEFAULT_PRIORITY, Job, NUM_PRIORITIES, parser$1;
      NUM_PRIORITIES = 10;
      DEFAULT_PRIORITY = 5;
      parser$1 = parser;
      BottleneckError$1 = BottleneckError_1;
      Job = class Job {
        constructor(task, args, options, jobDefaults, rejectOnDrop, Events2, _states, Promise2) {
          this.task = task;
          this.args = args;
          this.rejectOnDrop = rejectOnDrop;
          this.Events = Events2;
          this._states = _states;
          this.Promise = Promise2;
          this.options = parser$1.load(options, jobDefaults);
          this.options.priority = this._sanitizePriority(this.options.priority);
          if (this.options.id === jobDefaults.id) {
            this.options.id = `${this.options.id}-${this._randomIndex()}`;
          }
          this.promise = new this.Promise((_resolve, _reject) => {
            this._resolve = _resolve;
            this._reject = _reject;
          });
          this.retryCount = 0;
        }
        _sanitizePriority(priority) {
          var sProperty;
          sProperty = ~~priority !== priority ? DEFAULT_PRIORITY : priority;
          if (sProperty < 0) {
            return 0;
          } else if (sProperty > NUM_PRIORITIES - 1) {
            return NUM_PRIORITIES - 1;
          } else {
            return sProperty;
          }
        }
        _randomIndex() {
          return Math.random().toString(36).slice(2);
        }
        doDrop({ error, message = "This job has been dropped by Bottleneck" } = {}) {
          if (this._states.remove(this.options.id)) {
            if (this.rejectOnDrop) {
              this._reject(error != null ? error : new BottleneckError$1(message));
            }
            this.Events.trigger("dropped", { args: this.args, options: this.options, task: this.task, promise: this.promise });
            return true;
          } else {
            return false;
          }
        }
        _assertStatus(expected) {
          var status;
          status = this._states.jobStatus(this.options.id);
          if (!(status === expected || expected === "DONE" && status === null)) {
            throw new BottleneckError$1(`Invalid job status ${status}, expected ${expected}. Please open an issue at https://github.com/SGrondin/bottleneck/issues`);
          }
        }
        doReceive() {
          this._states.start(this.options.id);
          return this.Events.trigger("received", { args: this.args, options: this.options });
        }
        doQueue(reachedHWM, blocked) {
          this._assertStatus("RECEIVED");
          this._states.next(this.options.id);
          return this.Events.trigger("queued", { args: this.args, options: this.options, reachedHWM, blocked });
        }
        doRun() {
          if (this.retryCount === 0) {
            this._assertStatus("QUEUED");
            this._states.next(this.options.id);
          } else {
            this._assertStatus("EXECUTING");
          }
          return this.Events.trigger("scheduled", { args: this.args, options: this.options });
        }
        async doExecute(chained, clearGlobalState, run, free) {
          var error, eventInfo, passed;
          if (this.retryCount === 0) {
            this._assertStatus("RUNNING");
            this._states.next(this.options.id);
          } else {
            this._assertStatus("EXECUTING");
          }
          eventInfo = { args: this.args, options: this.options, retryCount: this.retryCount };
          this.Events.trigger("executing", eventInfo);
          try {
            passed = await (chained != null ? chained.schedule(this.options, this.task, ...this.args) : this.task(...this.args));
            if (clearGlobalState()) {
              this.doDone(eventInfo);
              await free(this.options, eventInfo);
              this._assertStatus("DONE");
              return this._resolve(passed);
            }
          } catch (error1) {
            error = error1;
            return this._onFailure(error, eventInfo, clearGlobalState, run, free);
          }
        }
        doExpire(clearGlobalState, run, free) {
          var error, eventInfo;
          if (this._states.jobStatus(this.options.id === "RUNNING")) {
            this._states.next(this.options.id);
          }
          this._assertStatus("EXECUTING");
          eventInfo = { args: this.args, options: this.options, retryCount: this.retryCount };
          error = new BottleneckError$1(`This job timed out after ${this.options.expiration} ms.`);
          return this._onFailure(error, eventInfo, clearGlobalState, run, free);
        }
        async _onFailure(error, eventInfo, clearGlobalState, run, free) {
          var retry2, retryAfter;
          if (clearGlobalState()) {
            retry2 = await this.Events.trigger("failed", error, eventInfo);
            if (retry2 != null) {
              retryAfter = ~~retry2;
              this.Events.trigger("retry", `Retrying ${this.options.id} after ${retryAfter} ms`, eventInfo);
              this.retryCount++;
              return run(retryAfter);
            } else {
              this.doDone(eventInfo);
              await free(this.options, eventInfo);
              this._assertStatus("DONE");
              return this._reject(error);
            }
          }
        }
        doDone(eventInfo) {
          this._assertStatus("EXECUTING");
          this._states.next(this.options.id);
          return this.Events.trigger("done", eventInfo);
        }
      };
      var Job_1 = Job;
      var BottleneckError$2, LocalDatastore, parser$2;
      parser$2 = parser;
      BottleneckError$2 = BottleneckError_1;
      LocalDatastore = class LocalDatastore {
        constructor(instance, storeOptions, storeInstanceOptions) {
          this.instance = instance;
          this.storeOptions = storeOptions;
          this.clientId = this.instance._randomIndex();
          parser$2.load(storeInstanceOptions, storeInstanceOptions, this);
          this._nextRequest = this._lastReservoirRefresh = this._lastReservoirIncrease = Date.now();
          this._running = 0;
          this._done = 0;
          this._unblockTime = 0;
          this.ready = this.Promise.resolve();
          this.clients = {};
          this._startHeartbeat();
        }
        _startHeartbeat() {
          var base;
          if (this.heartbeat == null && (this.storeOptions.reservoirRefreshInterval != null && this.storeOptions.reservoirRefreshAmount != null || this.storeOptions.reservoirIncreaseInterval != null && this.storeOptions.reservoirIncreaseAmount != null)) {
            return typeof (base = this.heartbeat = setInterval(() => {
              var amount, incr, maximum, now, reservoir;
              now = Date.now();
              if (this.storeOptions.reservoirRefreshInterval != null && now >= this._lastReservoirRefresh + this.storeOptions.reservoirRefreshInterval) {
                this._lastReservoirRefresh = now;
                this.storeOptions.reservoir = this.storeOptions.reservoirRefreshAmount;
                this.instance._drainAll(this.computeCapacity());
              }
              if (this.storeOptions.reservoirIncreaseInterval != null && now >= this._lastReservoirIncrease + this.storeOptions.reservoirIncreaseInterval) {
                ({
                  reservoirIncreaseAmount: amount,
                  reservoirIncreaseMaximum: maximum,
                  reservoir
                } = this.storeOptions);
                this._lastReservoirIncrease = now;
                incr = maximum != null ? Math.min(amount, maximum - reservoir) : amount;
                if (incr > 0) {
                  this.storeOptions.reservoir += incr;
                  return this.instance._drainAll(this.computeCapacity());
                }
              }
            }, this.heartbeatInterval)).unref === "function" ? base.unref() : void 0;
          } else {
            return clearInterval(this.heartbeat);
          }
        }
        async __publish__(message) {
          await this.yieldLoop();
          return this.instance.Events.trigger("message", message.toString());
        }
        async __disconnect__(flush) {
          await this.yieldLoop();
          clearInterval(this.heartbeat);
          return this.Promise.resolve();
        }
        yieldLoop(t = 0) {
          return new this.Promise(function(resolve, reject) {
            return setTimeout(resolve, t);
          });
        }
        computePenalty() {
          var ref;
          return (ref = this.storeOptions.penalty) != null ? ref : 15 * this.storeOptions.minTime || 5e3;
        }
        async __updateSettings__(options) {
          await this.yieldLoop();
          parser$2.overwrite(options, options, this.storeOptions);
          this._startHeartbeat();
          this.instance._drainAll(this.computeCapacity());
          return true;
        }
        async __running__() {
          await this.yieldLoop();
          return this._running;
        }
        async __queued__() {
          await this.yieldLoop();
          return this.instance.queued();
        }
        async __done__() {
          await this.yieldLoop();
          return this._done;
        }
        async __groupCheck__(time) {
          await this.yieldLoop();
          return this._nextRequest + this.timeout < time;
        }
        computeCapacity() {
          var maxConcurrent, reservoir;
          ({ maxConcurrent, reservoir } = this.storeOptions);
          if (maxConcurrent != null && reservoir != null) {
            return Math.min(maxConcurrent - this._running, reservoir);
          } else if (maxConcurrent != null) {
            return maxConcurrent - this._running;
          } else if (reservoir != null) {
            return reservoir;
          } else {
            return null;
          }
        }
        conditionsCheck(weight) {
          var capacity;
          capacity = this.computeCapacity();
          return capacity == null || weight <= capacity;
        }
        async __incrementReservoir__(incr) {
          var reservoir;
          await this.yieldLoop();
          reservoir = this.storeOptions.reservoir += incr;
          this.instance._drainAll(this.computeCapacity());
          return reservoir;
        }
        async __currentReservoir__() {
          await this.yieldLoop();
          return this.storeOptions.reservoir;
        }
        isBlocked(now) {
          return this._unblockTime >= now;
        }
        check(weight, now) {
          return this.conditionsCheck(weight) && this._nextRequest - now <= 0;
        }
        async __check__(weight) {
          var now;
          await this.yieldLoop();
          now = Date.now();
          return this.check(weight, now);
        }
        async __register__(index, weight, expiration) {
          var now, wait2;
          await this.yieldLoop();
          now = Date.now();
          if (this.conditionsCheck(weight)) {
            this._running += weight;
            if (this.storeOptions.reservoir != null) {
              this.storeOptions.reservoir -= weight;
            }
            wait2 = Math.max(this._nextRequest - now, 0);
            this._nextRequest = now + wait2 + this.storeOptions.minTime;
            return {
              success: true,
              wait: wait2,
              reservoir: this.storeOptions.reservoir
            };
          } else {
            return {
              success: false
            };
          }
        }
        strategyIsBlock() {
          return this.storeOptions.strategy === 3;
        }
        async __submit__(queueLength, weight) {
          var blocked, now, reachedHWM;
          await this.yieldLoop();
          if (this.storeOptions.maxConcurrent != null && weight > this.storeOptions.maxConcurrent) {
            throw new BottleneckError$2(`Impossible to add a job having a weight of ${weight} to a limiter having a maxConcurrent setting of ${this.storeOptions.maxConcurrent}`);
          }
          now = Date.now();
          reachedHWM = this.storeOptions.highWater != null && queueLength === this.storeOptions.highWater && !this.check(weight, now);
          blocked = this.strategyIsBlock() && (reachedHWM || this.isBlocked(now));
          if (blocked) {
            this._unblockTime = now + this.computePenalty();
            this._nextRequest = this._unblockTime + this.storeOptions.minTime;
            this.instance._dropAllQueued();
          }
          return {
            reachedHWM,
            blocked,
            strategy: this.storeOptions.strategy
          };
        }
        async __free__(index, weight) {
          await this.yieldLoop();
          this._running -= weight;
          this._done += weight;
          this.instance._drainAll(this.computeCapacity());
          return {
            running: this._running
          };
        }
      };
      var LocalDatastore_1 = LocalDatastore;
      var BottleneckError$3, States;
      BottleneckError$3 = BottleneckError_1;
      States = class States {
        constructor(status1) {
          this.status = status1;
          this._jobs = {};
          this.counts = this.status.map(function() {
            return 0;
          });
        }
        next(id) {
          var current, next;
          current = this._jobs[id];
          next = current + 1;
          if (current != null && next < this.status.length) {
            this.counts[current]--;
            this.counts[next]++;
            return this._jobs[id]++;
          } else if (current != null) {
            this.counts[current]--;
            return delete this._jobs[id];
          }
        }
        start(id) {
          var initial;
          initial = 0;
          this._jobs[id] = initial;
          return this.counts[initial]++;
        }
        remove(id) {
          var current;
          current = this._jobs[id];
          if (current != null) {
            this.counts[current]--;
            delete this._jobs[id];
          }
          return current != null;
        }
        jobStatus(id) {
          var ref;
          return (ref = this.status[this._jobs[id]]) != null ? ref : null;
        }
        statusJobs(status) {
          var k, pos, ref, results, v;
          if (status != null) {
            pos = this.status.indexOf(status);
            if (pos < 0) {
              throw new BottleneckError$3(`status must be one of ${this.status.join(", ")}`);
            }
            ref = this._jobs;
            results = [];
            for (k in ref) {
              v = ref[k];
              if (v === pos) {
                results.push(k);
              }
            }
            return results;
          } else {
            return Object.keys(this._jobs);
          }
        }
        statusCounts() {
          return this.counts.reduce(((acc, v, i) => {
            acc[this.status[i]] = v;
            return acc;
          }), {});
        }
      };
      var States_1 = States;
      var DLList$2, Sync;
      DLList$2 = DLList_1;
      Sync = class Sync {
        constructor(name, Promise2) {
          this.schedule = this.schedule.bind(this);
          this.name = name;
          this.Promise = Promise2;
          this._running = 0;
          this._queue = new DLList$2();
        }
        isEmpty() {
          return this._queue.length === 0;
        }
        async _tryToRun() {
          var args, cb, error, reject, resolve, returned, task;
          if (this._running < 1 && this._queue.length > 0) {
            this._running++;
            ({ task, args, resolve, reject } = this._queue.shift());
            cb = await (async function() {
              try {
                returned = await task(...args);
                return function() {
                  return resolve(returned);
                };
              } catch (error1) {
                error = error1;
                return function() {
                  return reject(error);
                };
              }
            })();
            this._running--;
            this._tryToRun();
            return cb();
          }
        }
        schedule(task, ...args) {
          var promise, reject, resolve;
          resolve = reject = null;
          promise = new this.Promise(function(_resolve, _reject) {
            resolve = _resolve;
            return reject = _reject;
          });
          this._queue.push({ task, args, resolve, reject });
          this._tryToRun();
          return promise;
        }
      };
      var Sync_1 = Sync;
      var version = "2.19.5";
      var version$1 = {
        version
      };
      var version$2 = /* @__PURE__ */ Object.freeze({
        version,
        default: version$1
      });
      var require$$2 = () => console.log("You must import the full version of Bottleneck in order to use this feature.");
      var require$$3 = () => console.log("You must import the full version of Bottleneck in order to use this feature.");
      var require$$4 = () => console.log("You must import the full version of Bottleneck in order to use this feature.");
      var Events$2, Group, IORedisConnection$1, RedisConnection$1, Scripts$1, parser$3;
      parser$3 = parser;
      Events$2 = Events_1;
      RedisConnection$1 = require$$2;
      IORedisConnection$1 = require$$3;
      Scripts$1 = require$$4;
      Group = (function() {
        class Group2 {
          constructor(limiterOptions = {}) {
            this.deleteKey = this.deleteKey.bind(this);
            this.limiterOptions = limiterOptions;
            parser$3.load(this.limiterOptions, this.defaults, this);
            this.Events = new Events$2(this);
            this.instances = {};
            this.Bottleneck = Bottleneck_1;
            this._startAutoCleanup();
            this.sharedConnection = this.connection != null;
            if (this.connection == null) {
              if (this.limiterOptions.datastore === "redis") {
                this.connection = new RedisConnection$1(Object.assign({}, this.limiterOptions, { Events: this.Events }));
              } else if (this.limiterOptions.datastore === "ioredis") {
                this.connection = new IORedisConnection$1(Object.assign({}, this.limiterOptions, { Events: this.Events }));
              }
            }
          }
          key(key = "") {
            var ref;
            return (ref = this.instances[key]) != null ? ref : (() => {
              var limiter;
              limiter = this.instances[key] = new this.Bottleneck(Object.assign(this.limiterOptions, {
                id: `${this.id}-${key}`,
                timeout: this.timeout,
                connection: this.connection
              }));
              this.Events.trigger("created", limiter, key);
              return limiter;
            })();
          }
          async deleteKey(key = "") {
            var deleted, instance;
            instance = this.instances[key];
            if (this.connection) {
              deleted = await this.connection.__runCommand__(["del", ...Scripts$1.allKeys(`${this.id}-${key}`)]);
            }
            if (instance != null) {
              delete this.instances[key];
              await instance.disconnect();
            }
            return instance != null || deleted > 0;
          }
          limiters() {
            var k, ref, results, v;
            ref = this.instances;
            results = [];
            for (k in ref) {
              v = ref[k];
              results.push({
                key: k,
                limiter: v
              });
            }
            return results;
          }
          keys() {
            return Object.keys(this.instances);
          }
          async clusterKeys() {
            var cursor, end, found, i, k, keys, len, next, start;
            if (this.connection == null) {
              return this.Promise.resolve(this.keys());
            }
            keys = [];
            cursor = null;
            start = `b_${this.id}-`.length;
            end = "_settings".length;
            while (cursor !== 0) {
              [next, found] = await this.connection.__runCommand__(["scan", cursor != null ? cursor : 0, "match", `b_${this.id}-*_settings`, "count", 1e4]);
              cursor = ~~next;
              for (i = 0, len = found.length; i < len; i++) {
                k = found[i];
                keys.push(k.slice(start, -end));
              }
            }
            return keys;
          }
          _startAutoCleanup() {
            var base;
            clearInterval(this.interval);
            return typeof (base = this.interval = setInterval(async () => {
              var e, k, ref, results, time, v;
              time = Date.now();
              ref = this.instances;
              results = [];
              for (k in ref) {
                v = ref[k];
                try {
                  if (await v._store.__groupCheck__(time)) {
                    results.push(this.deleteKey(k));
                  } else {
                    results.push(void 0);
                  }
                } catch (error) {
                  e = error;
                  results.push(v.Events.trigger("error", e));
                }
              }
              return results;
            }, this.timeout / 2)).unref === "function" ? base.unref() : void 0;
          }
          updateSettings(options = {}) {
            parser$3.overwrite(options, this.defaults, this);
            parser$3.overwrite(options, options, this.limiterOptions);
            if (options.timeout != null) {
              return this._startAutoCleanup();
            }
          }
          disconnect(flush = true) {
            var ref;
            if (!this.sharedConnection) {
              return (ref = this.connection) != null ? ref.disconnect(flush) : void 0;
            }
          }
        }
        Group2.prototype.defaults = {
          timeout: 1e3 * 60 * 5,
          connection: null,
          Promise,
          id: "group-key"
        };
        return Group2;
      }).call(commonjsGlobal);
      var Group_1 = Group;
      var Batcher, Events$3, parser$4;
      parser$4 = parser;
      Events$3 = Events_1;
      Batcher = (function() {
        class Batcher2 {
          constructor(options = {}) {
            this.options = options;
            parser$4.load(this.options, this.defaults, this);
            this.Events = new Events$3(this);
            this._arr = [];
            this._resetPromise();
            this._lastFlush = Date.now();
          }
          _resetPromise() {
            return this._promise = new this.Promise((res, rej) => {
              return this._resolve = res;
            });
          }
          _flush() {
            clearTimeout(this._timeout);
            this._lastFlush = Date.now();
            this._resolve();
            this.Events.trigger("batch", this._arr);
            this._arr = [];
            return this._resetPromise();
          }
          add(data) {
            var ret;
            this._arr.push(data);
            ret = this._promise;
            if (this._arr.length === this.maxSize) {
              this._flush();
            } else if (this.maxTime != null && this._arr.length === 1) {
              this._timeout = setTimeout(() => {
                return this._flush();
              }, this.maxTime);
            }
            return ret;
          }
        }
        Batcher2.prototype.defaults = {
          maxTime: null,
          maxSize: null,
          Promise
        };
        return Batcher2;
      }).call(commonjsGlobal);
      var Batcher_1 = Batcher;
      var require$$4$1 = () => console.log("You must import the full version of Bottleneck in order to use this feature.");
      var require$$8 = getCjsExportFromNamespace(version$2);
      var Bottleneck2, DEFAULT_PRIORITY$1, Events$4, Job$1, LocalDatastore$1, NUM_PRIORITIES$1, Queues$1, RedisDatastore$1, States$1, Sync$1, parser$5, splice = [].splice;
      NUM_PRIORITIES$1 = 10;
      DEFAULT_PRIORITY$1 = 5;
      parser$5 = parser;
      Queues$1 = Queues_1;
      Job$1 = Job_1;
      LocalDatastore$1 = LocalDatastore_1;
      RedisDatastore$1 = require$$4$1;
      Events$4 = Events_1;
      States$1 = States_1;
      Sync$1 = Sync_1;
      Bottleneck2 = (function() {
        class Bottleneck3 {
          constructor(options = {}, ...invalid) {
            var storeInstanceOptions, storeOptions;
            this._addToQueue = this._addToQueue.bind(this);
            this._validateOptions(options, invalid);
            parser$5.load(options, this.instanceDefaults, this);
            this._queues = new Queues$1(NUM_PRIORITIES$1);
            this._scheduled = {};
            this._states = new States$1(["RECEIVED", "QUEUED", "RUNNING", "EXECUTING"].concat(this.trackDoneStatus ? ["DONE"] : []));
            this._limiter = null;
            this.Events = new Events$4(this);
            this._submitLock = new Sync$1("submit", this.Promise);
            this._registerLock = new Sync$1("register", this.Promise);
            storeOptions = parser$5.load(options, this.storeDefaults, {});
            this._store = (function() {
              if (this.datastore === "redis" || this.datastore === "ioredis" || this.connection != null) {
                storeInstanceOptions = parser$5.load(options, this.redisStoreDefaults, {});
                return new RedisDatastore$1(this, storeOptions, storeInstanceOptions);
              } else if (this.datastore === "local") {
                storeInstanceOptions = parser$5.load(options, this.localStoreDefaults, {});
                return new LocalDatastore$1(this, storeOptions, storeInstanceOptions);
              } else {
                throw new Bottleneck3.prototype.BottleneckError(`Invalid datastore type: ${this.datastore}`);
              }
            }).call(this);
            this._queues.on("leftzero", () => {
              var ref;
              return (ref = this._store.heartbeat) != null ? typeof ref.ref === "function" ? ref.ref() : void 0 : void 0;
            });
            this._queues.on("zero", () => {
              var ref;
              return (ref = this._store.heartbeat) != null ? typeof ref.unref === "function" ? ref.unref() : void 0 : void 0;
            });
          }
          _validateOptions(options, invalid) {
            if (!(options != null && typeof options === "object" && invalid.length === 0)) {
              throw new Bottleneck3.prototype.BottleneckError("Bottleneck v2 takes a single object argument. Refer to https://github.com/SGrondin/bottleneck#upgrading-to-v2 if you're upgrading from Bottleneck v1.");
            }
          }
          ready() {
            return this._store.ready;
          }
          clients() {
            return this._store.clients;
          }
          channel() {
            return `b_${this.id}`;
          }
          channel_client() {
            return `b_${this.id}_${this._store.clientId}`;
          }
          publish(message) {
            return this._store.__publish__(message);
          }
          disconnect(flush = true) {
            return this._store.__disconnect__(flush);
          }
          chain(_limiter) {
            this._limiter = _limiter;
            return this;
          }
          queued(priority) {
            return this._queues.queued(priority);
          }
          clusterQueued() {
            return this._store.__queued__();
          }
          empty() {
            return this.queued() === 0 && this._submitLock.isEmpty();
          }
          running() {
            return this._store.__running__();
          }
          done() {
            return this._store.__done__();
          }
          jobStatus(id) {
            return this._states.jobStatus(id);
          }
          jobs(status) {
            return this._states.statusJobs(status);
          }
          counts() {
            return this._states.statusCounts();
          }
          _randomIndex() {
            return Math.random().toString(36).slice(2);
          }
          check(weight = 1) {
            return this._store.__check__(weight);
          }
          _clearGlobalState(index) {
            if (this._scheduled[index] != null) {
              clearTimeout(this._scheduled[index].expiration);
              delete this._scheduled[index];
              return true;
            } else {
              return false;
            }
          }
          async _free(index, job, options, eventInfo) {
            var e, running;
            try {
              ({ running } = await this._store.__free__(index, options.weight));
              this.Events.trigger("debug", `Freed ${options.id}`, eventInfo);
              if (running === 0 && this.empty()) {
                return this.Events.trigger("idle");
              }
            } catch (error1) {
              e = error1;
              return this.Events.trigger("error", e);
            }
          }
          _run(index, job, wait2) {
            var clearGlobalState, free, run;
            job.doRun();
            clearGlobalState = this._clearGlobalState.bind(this, index);
            run = this._run.bind(this, index, job);
            free = this._free.bind(this, index, job);
            return this._scheduled[index] = {
              timeout: setTimeout(() => {
                return job.doExecute(this._limiter, clearGlobalState, run, free);
              }, wait2),
              expiration: job.options.expiration != null ? setTimeout(function() {
                return job.doExpire(clearGlobalState, run, free);
              }, wait2 + job.options.expiration) : void 0,
              job
            };
          }
          _drainOne(capacity) {
            return this._registerLock.schedule(() => {
              var args, index, next, options, queue;
              if (this.queued() === 0) {
                return this.Promise.resolve(null);
              }
              queue = this._queues.getFirst();
              ({ options, args } = next = queue.first());
              if (capacity != null && options.weight > capacity) {
                return this.Promise.resolve(null);
              }
              this.Events.trigger("debug", `Draining ${options.id}`, { args, options });
              index = this._randomIndex();
              return this._store.__register__(index, options.weight, options.expiration).then(({ success, wait: wait2, reservoir }) => {
                var empty;
                this.Events.trigger("debug", `Drained ${options.id}`, { success, args, options });
                if (success) {
                  queue.shift();
                  empty = this.empty();
                  if (empty) {
                    this.Events.trigger("empty");
                  }
                  if (reservoir === 0) {
                    this.Events.trigger("depleted", empty);
                  }
                  this._run(index, next, wait2);
                  return this.Promise.resolve(options.weight);
                } else {
                  return this.Promise.resolve(null);
                }
              });
            });
          }
          _drainAll(capacity, total = 0) {
            return this._drainOne(capacity).then((drained) => {
              var newCapacity;
              if (drained != null) {
                newCapacity = capacity != null ? capacity - drained : capacity;
                return this._drainAll(newCapacity, total + drained);
              } else {
                return this.Promise.resolve(total);
              }
            }).catch((e) => {
              return this.Events.trigger("error", e);
            });
          }
          _dropAllQueued(message) {
            return this._queues.shiftAll(function(job) {
              return job.doDrop({ message });
            });
          }
          stop(options = {}) {
            var done, waitForExecuting;
            options = parser$5.load(options, this.stopDefaults);
            waitForExecuting = (at) => {
              var finished;
              finished = () => {
                var counts;
                counts = this._states.counts;
                return counts[0] + counts[1] + counts[2] + counts[3] === at;
              };
              return new this.Promise((resolve, reject) => {
                if (finished()) {
                  return resolve();
                } else {
                  return this.on("done", () => {
                    if (finished()) {
                      this.removeAllListeners("done");
                      return resolve();
                    }
                  });
                }
              });
            };
            done = options.dropWaitingJobs ? (this._run = function(index, next) {
              return next.doDrop({
                message: options.dropErrorMessage
              });
            }, this._drainOne = () => {
              return this.Promise.resolve(null);
            }, this._registerLock.schedule(() => {
              return this._submitLock.schedule(() => {
                var k, ref, v;
                ref = this._scheduled;
                for (k in ref) {
                  v = ref[k];
                  if (this.jobStatus(v.job.options.id) === "RUNNING") {
                    clearTimeout(v.timeout);
                    clearTimeout(v.expiration);
                    v.job.doDrop({
                      message: options.dropErrorMessage
                    });
                  }
                }
                this._dropAllQueued(options.dropErrorMessage);
                return waitForExecuting(0);
              });
            })) : this.schedule({
              priority: NUM_PRIORITIES$1 - 1,
              weight: 0
            }, () => {
              return waitForExecuting(1);
            });
            this._receive = function(job) {
              return job._reject(new Bottleneck3.prototype.BottleneckError(options.enqueueErrorMessage));
            };
            this.stop = () => {
              return this.Promise.reject(new Bottleneck3.prototype.BottleneckError("stop() has already been called"));
            };
            return done;
          }
          async _addToQueue(job) {
            var args, blocked, error, options, reachedHWM, shifted, strategy;
            ({ args, options } = job);
            try {
              ({ reachedHWM, blocked, strategy } = await this._store.__submit__(this.queued(), options.weight));
            } catch (error1) {
              error = error1;
              this.Events.trigger("debug", `Could not queue ${options.id}`, { args, options, error });
              job.doDrop({ error });
              return false;
            }
            if (blocked) {
              job.doDrop();
              return true;
            } else if (reachedHWM) {
              shifted = strategy === Bottleneck3.prototype.strategy.LEAK ? this._queues.shiftLastFrom(options.priority) : strategy === Bottleneck3.prototype.strategy.OVERFLOW_PRIORITY ? this._queues.shiftLastFrom(options.priority + 1) : strategy === Bottleneck3.prototype.strategy.OVERFLOW ? job : void 0;
              if (shifted != null) {
                shifted.doDrop();
              }
              if (shifted == null || strategy === Bottleneck3.prototype.strategy.OVERFLOW) {
                if (shifted == null) {
                  job.doDrop();
                }
                return reachedHWM;
              }
            }
            job.doQueue(reachedHWM, blocked);
            this._queues.push(job);
            await this._drainAll();
            return reachedHWM;
          }
          _receive(job) {
            if (this._states.jobStatus(job.options.id) != null) {
              job._reject(new Bottleneck3.prototype.BottleneckError(`A job with the same id already exists (id=${job.options.id})`));
              return false;
            } else {
              job.doReceive();
              return this._submitLock.schedule(this._addToQueue, job);
            }
          }
          submit(...args) {
            var cb, fn, job, options, ref, ref1, task;
            if (typeof args[0] === "function") {
              ref = args, [fn, ...args] = ref, [cb] = splice.call(args, -1);
              options = parser$5.load({}, this.jobDefaults);
            } else {
              ref1 = args, [options, fn, ...args] = ref1, [cb] = splice.call(args, -1);
              options = parser$5.load(options, this.jobDefaults);
            }
            task = (...args2) => {
              return new this.Promise(function(resolve, reject) {
                return fn(...args2, function(...args3) {
                  return (args3[0] != null ? reject : resolve)(args3);
                });
              });
            };
            job = new Job$1(task, args, options, this.jobDefaults, this.rejectOnDrop, this.Events, this._states, this.Promise);
            job.promise.then(function(args2) {
              return typeof cb === "function" ? cb(...args2) : void 0;
            }).catch(function(args2) {
              if (Array.isArray(args2)) {
                return typeof cb === "function" ? cb(...args2) : void 0;
              } else {
                return typeof cb === "function" ? cb(args2) : void 0;
              }
            });
            return this._receive(job);
          }
          schedule(...args) {
            var job, options, task;
            if (typeof args[0] === "function") {
              [task, ...args] = args;
              options = {};
            } else {
              [options, task, ...args] = args;
            }
            job = new Job$1(task, args, options, this.jobDefaults, this.rejectOnDrop, this.Events, this._states, this.Promise);
            this._receive(job);
            return job.promise;
          }
          wrap(fn) {
            var schedule, wrapped;
            schedule = this.schedule.bind(this);
            wrapped = function(...args) {
              return schedule(fn.bind(this), ...args);
            };
            wrapped.withOptions = function(options, ...args) {
              return schedule(options, fn, ...args);
            };
            return wrapped;
          }
          async updateSettings(options = {}) {
            await this._store.__updateSettings__(parser$5.overwrite(options, this.storeDefaults));
            parser$5.overwrite(options, this.instanceDefaults, this);
            return this;
          }
          currentReservoir() {
            return this._store.__currentReservoir__();
          }
          incrementReservoir(incr = 0) {
            return this._store.__incrementReservoir__(incr);
          }
        }
        Bottleneck3.default = Bottleneck3;
        Bottleneck3.Events = Events$4;
        Bottleneck3.version = Bottleneck3.prototype.version = require$$8.version;
        Bottleneck3.strategy = Bottleneck3.prototype.strategy = {
          LEAK: 1,
          OVERFLOW: 2,
          OVERFLOW_PRIORITY: 4,
          BLOCK: 3
        };
        Bottleneck3.BottleneckError = Bottleneck3.prototype.BottleneckError = BottleneckError_1;
        Bottleneck3.Group = Bottleneck3.prototype.Group = Group_1;
        Bottleneck3.RedisConnection = Bottleneck3.prototype.RedisConnection = require$$2;
        Bottleneck3.IORedisConnection = Bottleneck3.prototype.IORedisConnection = require$$3;
        Bottleneck3.Batcher = Bottleneck3.prototype.Batcher = Batcher_1;
        Bottleneck3.prototype.jobDefaults = {
          priority: DEFAULT_PRIORITY$1,
          weight: 1,
          expiration: null,
          id: "<no-id>"
        };
        Bottleneck3.prototype.storeDefaults = {
          maxConcurrent: null,
          minTime: 0,
          highWater: null,
          strategy: Bottleneck3.prototype.strategy.LEAK,
          penalty: null,
          reservoir: null,
          reservoirRefreshInterval: null,
          reservoirRefreshAmount: null,
          reservoirIncreaseInterval: null,
          reservoirIncreaseAmount: null,
          reservoirIncreaseMaximum: null
        };
        Bottleneck3.prototype.localStoreDefaults = {
          Promise,
          timeout: null,
          heartbeatInterval: 250
        };
        Bottleneck3.prototype.redisStoreDefaults = {
          Promise,
          timeout: null,
          heartbeatInterval: 5e3,
          clientTimeout: 1e4,
          Redis: null,
          clientOptions: {},
          clusterNodes: null,
          clearDatastore: false,
          connection: null
        };
        Bottleneck3.prototype.instanceDefaults = {
          datastore: "local",
          connection: null,
          id: "<no-id>",
          rejectOnDrop: true,
          trackDoneStatus: false,
          Promise
        };
        Bottleneck3.prototype.stopDefaults = {
          enqueueErrorMessage: "This limiter has been stopped and cannot accept new jobs.",
          dropWaitingJobs: true,
          dropErrorMessage: "This limiter has been stopped."
        };
        return Bottleneck3;
      }).call(commonjsGlobal);
      var Bottleneck_1 = Bottleneck2;
      var lib = Bottleneck_1;
      return lib;
    }));
  }
});

// src/cli/main.ts
import { execFile } from "node:child_process";
import { mkdir, readFile as readFile3, writeFile } from "node:fs/promises";
import { join as join3 } from "node:path";
import { promisify } from "node:util";

// src/config/load.ts
var import_yaml = __toESM(require_dist(), 1);
import { readFile } from "node:fs/promises";
import { join } from "node:path";

// src/config/defaults.ts
var DEFAULT_SKIP_PATHS = [
  "**/*.lock",
  "**/dist/**",
  "**/*.min.js",
  "**/vendor/**"
];
var DEFAULT_CONFIG = {
  configVersion: 1,
  platform: {
    kind: "github",
    repository: null,
    tokenEnv: "GITHUB_TOKEN"
  },
  llm: {
    preset: "deepseek",
    baseUrl: "https://api.deepseek.com/v1",
    model: "deepseek-chat",
    apiKeyEnv: "AI_REVIEW_API_KEY",
    temperature: 0.2,
    maxOutputTokens: 4096,
    contextWindow: 65536,
    pricing: null,
    headers: {},
    structuredOutput: "auto"
  },
  routing: {
    enabled: true,
    tiers: {},
    byDimension: {
      correctness: "strong",
      security: "strong",
      convention: "cheap"
    },
    fileRiskThreshold: 60,
    // 0 表示不启用规模级路由。见规格书 20.2：小改动往往影响全局，不该自动降档。
    smallChangeLines: 0,
    defaultTier: "standard"
  },
  review: {
    dimensions: {
      correctness: { enabled: true, severityFloor: "minor" },
      security: { enabled: true, severityFloor: "minor" },
      // 规范性问题噪声最大，默认关闭；检出仓库已有静态检查时也会自动静音。
      convention: { enabled: false, severityFloor: "minor" }
    },
    maxInlineComments: 15,
    maxSummaryPreexisting: 3,
    maxSummaryFileLevel: 3,
    checkpoint: false,
    skipPaths: DEFAULT_SKIP_PATHS,
    maxBudgetUsd: 0.5,
    crossFileDepth: 1,
    crossFileMaxFiles: 30,
    concurrency: 4,
    respectLintConfig: true
  },
  gate: {
    enabled: false,
    blockingSeverity: "blocker",
    // 必须是各维度 schema 里的真实类别名。写抽象名（如 'crash'）会让门禁永远不触发——
    // 这条错很难发现：配置校验只查类型，不查枚举是否对得上维度。
    blockingCategories: [
      // 正确性：会崩、会算错、会卡死的那几类
      "null-safety",
      "logic",
      "concurrency",
      "error-handling",
      "resource",
      "boundary",
      // 安全性：全部
      "injection",
      "authz",
      "secret-exposure",
      "unsafe-deserialization",
      "path-traversal",
      "ssrf",
      "crypto-misuse",
      "frontend-exposure"
    ],
    confidenceThreshold: 0.8,
    exemptionStore: "issue-comment"
  },
  inspection: {
    enabled: false,
    weights: {
      complexity: 20,
      duplication: 20,
      dependency: 20,
      "type-safety": 20,
      test: 20
    },
    maxScorePerDimension: 20,
    sampleSize: 60,
    carrier: "auto",
    wikiPagePrefix: "",
    historyDepth: 12
  },
  output: {
    inline: true,
    summary: true,
    language: "zh-CN",
    resolveMode: "edit"
  }
};

// src/config/validate.ts
function isObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
var TOP_KEYS = [
  "configVersion",
  "platform",
  "llm",
  "routing",
  "review",
  "gate",
  "inspection",
  "output"
];
var PLATFORM_KEYS = ["kind", "repository", "tokenEnv"];
var LLM_KEYS = [
  "preset",
  "baseUrl",
  "model",
  "apiKeyEnv",
  "temperature",
  "maxOutputTokens",
  "contextWindow",
  "pricing",
  "headers",
  "structuredOutput"
];
var PRICING_KEYS = [
  "inputPerMTok",
  "outputPerMTok",
  "cacheWriteShortMultiplier",
  "cacheWriteLongMultiplier",
  "cacheReadMultiplier"
];
var ROUTING_KEYS = [
  "enabled",
  "tiers",
  "byDimension",
  "fileRiskThreshold",
  "smallChangeLines",
  "defaultTier"
];
var TIER_KEYS = ["model", "maxOutputTokens", "contextWindow", "pricing"];
var REVIEW_KEYS = [
  "dimensions",
  "maxInlineComments",
  "maxSummaryPreexisting",
  "maxSummaryFileLevel",
  "checkpoint",
  "skipPaths",
  "maxBudgetUsd",
  "crossFileDepth",
  "crossFileMaxFiles",
  "concurrency",
  "respectLintConfig"
];
var DIMENSION_KEYS = ["enabled", "severityFloor"];
var GATE_KEYS = [
  "enabled",
  "blockingSeverity",
  "blockingCategories",
  "confidenceThreshold",
  "exemptionStore"
];
var INSPECTION_KEYS = [
  "enabled",
  "weights",
  "maxScorePerDimension",
  "sampleSize",
  "carrier",
  "wikiPagePrefix",
  "historyDepth"
];
var OUTPUT_KEYS = ["inline", "summary", "language", "resolveMode"];
var REVIEWER_IDS = ["correctness", "security", "convention"];
var SEVERITIES = ["blocker", "major", "minor", "nit"];
var SCORE_DIMENSIONS = [
  "complexity",
  "duplication",
  "dependency",
  "type-safety",
  "test"
];
function validateConfig(value) {
  const errors = [];
  if (!isObject(value)) {
    return [{ path: "", message: "\u914D\u7F6E\u5FC5\u987B\u662F\u4E00\u4E2A\u5BF9\u8C61" }];
  }
  expectKeys(errors, "", value, TOP_KEYS);
  const version = value["configVersion"];
  if (version !== void 0 && version !== 1) {
    const shown = typeof version === "number" || typeof version === "string" ? String(version) : typeof version;
    errors.push({ path: "configVersion", message: `\u53EA\u652F\u6301\u7248\u672C 1\uFF0C\u6536\u5230 ${shown}` });
  }
  checkPlatform(errors, value["platform"]);
  checkLlm(errors, value["llm"]);
  checkRouting(errors, value["routing"]);
  checkReview(errors, value["review"]);
  checkGate(errors, value["gate"]);
  checkInspection(errors, value["inspection"]);
  checkOutput(errors, value["output"]);
  return errors;
}
function expectKeys(errors, path, obj2, allowed) {
  for (const key of Object.keys(obj2)) {
    if (!allowed.includes(key)) {
      errors.push({
        path: path === "" ? key : `${path}.${key}`,
        message: "\u672A\u77E5\u5B57\u6BB5\uFF0C\u8BF7\u68C0\u67E5\u62FC\u5199"
      });
    }
  }
}
function expectObject(errors, path, value) {
  if (value === void 0) return null;
  if (!isObject(value)) {
    errors.push({ path, message: "\u5E94\u4E3A\u5BF9\u8C61" });
    return null;
  }
  return value;
}
function expectBoolean(errors, path, value) {
  if (value !== void 0 && typeof value !== "boolean") {
    errors.push({ path, message: "\u5E94\u4E3A\u5E03\u5C14\u503C" });
  }
}
function expectString(errors, path, value) {
  if (value !== void 0 && typeof value !== "string") {
    errors.push({ path, message: "\u5E94\u4E3A\u5B57\u7B26\u4E32" });
  }
}
function expectNullableString(errors, path, value) {
  if (value !== void 0 && value !== null && typeof value !== "string") {
    errors.push({ path, message: "\u5E94\u4E3A\u5B57\u7B26\u4E32\u6216 null" });
  }
}
function expectInteger(errors, path, value, min, max = Number.MAX_SAFE_INTEGER) {
  if (value === void 0) return;
  if (typeof value !== "number" || !Number.isInteger(value)) {
    errors.push({ path, message: "\u5E94\u4E3A\u6574\u6570" });
    return;
  }
  if (value < min || value > max) {
    errors.push({
      path,
      message: `\u5E94\u5728 ${String(min)}~${String(max)} \u4E4B\u95F4\uFF0C\u6536\u5230 ${String(value)}`
    });
  }
}
function expectNumberInRange(errors, path, value, min, max) {
  if (value === void 0) return;
  if (typeof value !== "number" || Number.isNaN(value)) {
    errors.push({ path, message: "\u5E94\u4E3A\u6570\u5B57" });
    return;
  }
  if (value < min || value > max) {
    errors.push({
      path,
      message: `\u5E94\u5728 ${String(min)}~${String(max)} \u4E4B\u95F4\uFF0C\u6536\u5230 ${String(value)}`
    });
  }
}
function expectEnum(errors, path, value, allowed) {
  if (value === void 0) return;
  if (typeof value !== "string" || !allowed.includes(value)) {
    errors.push({ path, message: `\u5E94\u4E3A ${allowed.join(" / ")} \u4E4B\u4E00` });
  }
}
function expectStringArray(errors, path, value) {
  if (value === void 0) return;
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    errors.push({ path, message: "\u5E94\u4E3A\u5B57\u7B26\u4E32\u6570\u7EC4" });
  }
}
function checkPlatform(errors, raw) {
  const obj2 = expectObject(errors, "platform", raw);
  if (obj2 === null) return;
  expectKeys(errors, "platform", obj2, PLATFORM_KEYS);
  if (obj2["kind"] !== void 0 && obj2["kind"] !== "github") {
    errors.push({ path: "platform.kind", message: "\u5F53\u524D\u53EA\u652F\u6301 github" });
  }
  expectNullableString(errors, "platform.repository", obj2["repository"]);
  expectString(errors, "platform.tokenEnv", obj2["tokenEnv"]);
}
function checkPricing(errors, path, raw) {
  if (raw === null) return;
  const obj2 = expectObject(errors, path, raw);
  if (obj2 === null) return;
  expectKeys(errors, path, obj2, PRICING_KEYS);
  expectNumberInRange(errors, `${path}.inputPerMTok`, obj2["inputPerMTok"], 0, 1e4);
  expectNumberInRange(errors, `${path}.outputPerMTok`, obj2["outputPerMTok"], 0, 1e5);
  expectNumberInRange(
    errors,
    `${path}.cacheWriteShortMultiplier`,
    obj2["cacheWriteShortMultiplier"],
    0,
    10
  );
  expectNumberInRange(
    errors,
    `${path}.cacheWriteLongMultiplier`,
    obj2["cacheWriteLongMultiplier"],
    0,
    10
  );
  expectNumberInRange(errors, `${path}.cacheReadMultiplier`, obj2["cacheReadMultiplier"], 0, 10);
}
function checkLlm(errors, raw) {
  const obj2 = expectObject(errors, "llm", raw);
  if (obj2 === null) return;
  expectKeys(errors, "llm", obj2, LLM_KEYS);
  expectString(errors, "llm.preset", obj2["preset"]);
  expectString(errors, "llm.baseUrl", obj2["baseUrl"]);
  expectString(errors, "llm.model", obj2["model"]);
  expectString(errors, "llm.apiKeyEnv", obj2["apiKeyEnv"]);
  expectNumberInRange(errors, "llm.temperature", obj2["temperature"], 0, 2);
  expectInteger(errors, "llm.maxOutputTokens", obj2["maxOutputTokens"], 1);
  expectInteger(errors, "llm.contextWindow", obj2["contextWindow"], 1);
  const pricing = obj2["pricing"];
  if (pricing === void 0 || pricing === null) {
  } else {
    checkPricing(errors, "llm.pricing", pricing);
  }
  const headers = obj2["headers"];
  if (headers !== void 0) {
    if (!isObject(headers)) {
      errors.push({ path: "llm.headers", message: "\u5E94\u4E3A\u5BF9\u8C61" });
    } else {
      for (const [key, val] of Object.entries(headers)) {
        if (typeof val !== "string") {
          errors.push({ path: `llm.headers.${key}`, message: "\u8BF7\u6C42\u5934\u503C\u5E94\u4E3A\u5B57\u7B26\u4E32" });
        }
      }
    }
  }
  expectEnum(errors, "llm.structuredOutput", obj2["structuredOutput"], [
    "auto",
    "json-schema",
    "json-object",
    "none"
  ]);
}
function checkRouting(errors, raw) {
  const obj2 = expectObject(errors, "routing", raw);
  if (obj2 === null) return;
  expectKeys(errors, "routing", obj2, ROUTING_KEYS);
  expectBoolean(errors, "routing.enabled", obj2["enabled"]);
  expectNumberInRange(errors, "routing.fileRiskThreshold", obj2["fileRiskThreshold"], 0, 100);
  expectInteger(errors, "routing.smallChangeLines", obj2["smallChangeLines"], 0);
  expectString(errors, "routing.defaultTier", obj2["defaultTier"]);
  const tiers = obj2["tiers"];
  if (tiers !== void 0) {
    if (!isObject(tiers)) {
      errors.push({ path: "routing.tiers", message: "\u5E94\u4E3A\u5BF9\u8C61" });
    } else {
      for (const [name, tier] of Object.entries(tiers)) {
        const tierPath = `routing.tiers.${name}`;
        const tierObj = expectObject(errors, tierPath, tier);
        if (tierObj === null) continue;
        expectKeys(errors, tierPath, tierObj, TIER_KEYS);
        expectString(errors, `${tierPath}.model`, tierObj["model"]);
        expectInteger(errors, `${tierPath}.maxOutputTokens`, tierObj["maxOutputTokens"], 1);
        expectInteger(errors, `${tierPath}.contextWindow`, tierObj["contextWindow"], 1);
        if (tierObj["pricing"] !== void 0 && tierObj["pricing"] !== null) {
          checkPricing(errors, `${tierPath}.pricing`, tierObj["pricing"]);
        }
      }
    }
  }
  const byDimension = obj2["byDimension"];
  if (byDimension !== void 0) {
    if (!isObject(byDimension)) {
      errors.push({ path: "routing.byDimension", message: "\u5E94\u4E3A\u5BF9\u8C61" });
    } else {
      expectKeys(errors, "routing.byDimension", byDimension, REVIEWER_IDS);
      for (const [key, val] of Object.entries(byDimension)) {
        if (typeof val !== "string") {
          errors.push({ path: `routing.byDimension.${key}`, message: "\u5E94\u4E3A\u6863\u4F4D\u540D\u5B57\u7B26\u4E32" });
        }
      }
    }
  }
  if (isObject(tiers)) {
    const known = new Set(Object.keys(tiers));
    const declared = obj2["defaultTier"];
    if (typeof declared === "string" && known.size > 0 && !known.has(declared)) {
      errors.push({
        path: "routing.defaultTier",
        message: `\u6863\u4F4D ${declared} \u672A\u5728 routing.tiers \u4E2D\u5B9A\u4E49`
      });
    }
    if (isObject(byDimension)) {
      for (const [key, val] of Object.entries(byDimension)) {
        if (typeof val === "string" && known.size > 0 && !known.has(val)) {
          errors.push({
            path: `routing.byDimension.${key}`,
            message: `\u6863\u4F4D ${val} \u672A\u5728 routing.tiers \u4E2D\u5B9A\u4E49`
          });
        }
      }
    }
  }
}
function checkReview(errors, raw) {
  const obj2 = expectObject(errors, "review", raw);
  if (obj2 === null) return;
  expectKeys(errors, "review", obj2, REVIEW_KEYS);
  expectInteger(errors, "review.maxInlineComments", obj2["maxInlineComments"], 0);
  expectInteger(errors, "review.maxSummaryPreexisting", obj2["maxSummaryPreexisting"], 0);
  expectInteger(errors, "review.maxSummaryFileLevel", obj2["maxSummaryFileLevel"], 0);
  expectBoolean(errors, "review.checkpoint", obj2["checkpoint"]);
  expectStringArray(errors, "review.skipPaths", obj2["skipPaths"]);
  expectNumberInRange(errors, "review.maxBudgetUsd", obj2["maxBudgetUsd"], 0, 1e4);
  expectInteger(errors, "review.crossFileDepth", obj2["crossFileDepth"], 0, 2);
  expectInteger(errors, "review.crossFileMaxFiles", obj2["crossFileMaxFiles"], 0);
  expectInteger(errors, "review.concurrency", obj2["concurrency"], 1, 64);
  expectBoolean(errors, "review.respectLintConfig", obj2["respectLintConfig"]);
  const dimensions = obj2["dimensions"];
  if (dimensions !== void 0) {
    if (!isObject(dimensions)) {
      errors.push({ path: "review.dimensions", message: "\u5E94\u4E3A\u5BF9\u8C61" });
    } else {
      expectKeys(errors, "review.dimensions", dimensions, REVIEWER_IDS);
      for (const id of REVIEWER_IDS) {
        const dim = dimensions[id];
        if (dim === void 0) continue;
        const dimPath = `review.dimensions.${id}`;
        const dimObj = expectObject(errors, dimPath, dim);
        if (dimObj === null) continue;
        expectKeys(errors, dimPath, dimObj, DIMENSION_KEYS);
        expectBoolean(errors, `${dimPath}.enabled`, dimObj["enabled"]);
        expectEnum(errors, `${dimPath}.severityFloor`, dimObj["severityFloor"], SEVERITIES);
      }
    }
  }
}
function checkGate(errors, raw) {
  const obj2 = expectObject(errors, "gate", raw);
  if (obj2 === null) return;
  expectKeys(errors, "gate", obj2, GATE_KEYS);
  expectBoolean(errors, "gate.enabled", obj2["enabled"]);
  if (obj2["blockingSeverity"] !== void 0 && obj2["blockingSeverity"] !== "blocker") {
    errors.push({
      path: "gate.blockingSeverity",
      message: "\u5F53\u524D\u53EA\u5141\u8BB8 blocker\u2014\u2014\u975E\u81F4\u547D\u95EE\u9898\u4E0D\u5F97\u963B\u585E\u5408\u5E76"
    });
  }
  expectStringArray(errors, "gate.blockingCategories", obj2["blockingCategories"]);
  expectNumberInRange(errors, "gate.confidenceThreshold", obj2["confidenceThreshold"], 0, 1);
  const store = obj2["exemptionStore"];
  if (store !== void 0 && store !== null && store !== "issue-comment") {
    errors.push({ path: "gate.exemptionStore", message: "\u5F53\u524D\u53EA\u652F\u6301 issue-comment \u6216 null" });
  }
}
function checkInspection(errors, raw) {
  const obj2 = expectObject(errors, "inspection", raw);
  if (obj2 === null) return;
  expectKeys(errors, "inspection", obj2, INSPECTION_KEYS);
  expectBoolean(errors, "inspection.enabled", obj2["enabled"]);
  expectInteger(errors, "inspection.maxScorePerDimension", obj2["maxScorePerDimension"], 1);
  expectInteger(errors, "inspection.sampleSize", obj2["sampleSize"], 0);
  expectEnum(errors, "inspection.carrier", obj2["carrier"], ["auto", "wiki", "issue"]);
  expectString(errors, "inspection.wikiPagePrefix", obj2["wikiPagePrefix"]);
  expectInteger(errors, "inspection.historyDepth", obj2["historyDepth"], 1, 120);
  const weights = obj2["weights"];
  if (weights !== void 0) {
    if (!isObject(weights)) {
      errors.push({ path: "inspection.weights", message: "\u5E94\u4E3A\u5BF9\u8C61" });
    } else {
      expectKeys(errors, "inspection.weights", weights, SCORE_DIMENSIONS);
      let sum = 0;
      let complete = true;
      for (const dim of SCORE_DIMENSIONS) {
        const val = weights[dim];
        if (val === void 0) {
          complete = false;
          continue;
        }
        if (typeof val !== "number" || Number.isNaN(val) || val < 0) {
          errors.push({ path: `inspection.weights.${dim}`, message: "\u5E94\u4E3A\u975E\u8D1F\u6570\u5B57" });
          complete = false;
          continue;
        }
        sum += val;
      }
      if (complete && Math.abs(sum - 100) > 0.01) {
        errors.push({
          path: "inspection.weights",
          message: `\u4E94\u4E2A\u7EF4\u5EA6\u6743\u91CD\u5408\u8BA1\u5E94\u4E3A 100\uFF0C\u5F53\u524D ${String(sum)}`
        });
      }
    }
  }
}
function checkOutput(errors, raw) {
  const obj2 = expectObject(errors, "output", raw);
  if (obj2 === null) return;
  expectKeys(errors, "output", obj2, OUTPUT_KEYS);
  expectBoolean(errors, "output.inline", obj2["inline"]);
  expectBoolean(errors, "output.summary", obj2["summary"]);
  expectEnum(errors, "output.language", obj2["language"], ["zh-CN", "en"]);
  expectEnum(errors, "output.resolveMode", obj2["resolveMode"], ["edit", "delete"]);
}

// src/config/merge.ts
function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function deepMerge(base, override) {
  if (override === void 0) return base;
  if (Array.isArray(override)) return [...override];
  if (isPlainObject(base) && isPlainObject(override)) {
    const merged = { ...base };
    for (const [key, value] of Object.entries(override)) {
      merged[key] = deepMerge(base[key], value);
    }
    return merged;
  }
  return override;
}
function resolveConfig(layers) {
  let merged = DEFAULT_CONFIG;
  for (const layer of layers) {
    if (layer === void 0 || layer === null) continue;
    merged = deepMerge(merged, layer);
  }
  const errors = validateConfig(merged);
  if (errors.length > 0) {
    return { ok: false, errors };
  }
  return { ok: true, config: merged };
}

// src/config/load.ts
var CONFIG_FILE = ".ai-review.yml";
var LOCAL_CONFIG_FILE = "ai-review.local.yml";
async function readYamlIfExists(path) {
  try {
    const text2 = await readFile(path, "utf8");
    return (0, import_yaml.parse)(text2);
  } catch (error) {
    const code = error.code;
    if (code === "ENOENT") return null;
    throw error;
  }
}
function envOverrides() {
  const llm = {};
  if (process.env["ACR_MODEL"] !== void 0) llm["model"] = process.env["ACR_MODEL"];
  if (process.env["ACR_BASE_URL"] !== void 0) llm["baseUrl"] = process.env["ACR_BASE_URL"];
  const platform = {};
  if (process.env["ACR_REPOSITORY"] !== void 0)
    platform["repository"] = process.env["ACR_REPOSITORY"];
  const overrides = {};
  if (Object.keys(llm).length > 0) overrides["llm"] = llm;
  if (Object.keys(platform).length > 0) overrides["platform"] = platform;
  return overrides;
}
async function loadConfig(cwd) {
  const sources = [];
  const layers = [];
  const main2 = await readYamlIfExists(join(cwd, CONFIG_FILE));
  if (main2 !== null) {
    sources.push(CONFIG_FILE);
    layers.push(main2);
  }
  const local = await readYamlIfExists(join(cwd, LOCAL_CONFIG_FILE));
  if (local !== null) {
    sources.push(LOCAL_CONFIG_FILE);
    layers.push(local);
  }
  const env = envOverrides();
  if (Object.keys(env).length > 0) {
    sources.push("\u73AF\u5883\u53D8\u91CF");
    layers.push(env);
  }
  const resolved = resolveConfig(layers);
  return resolved.ok ? { ok: true, config: resolved.config, sources } : { ok: false, errors: resolved.errors };
}

// src/core/context/budget.ts
var DROP_ORDER = ["L3", "L2", "L1", "L4"];
var KEEP_RANK = {
  L0: 0,
  L1: 1,
  L2: 2,
  L3: 3,
  L4: 4
};
function applyBudget(segments, input) {
  const budget = Math.max(0, input.budgetTokens);
  const kept = [...segments];
  const dropped = [];
  let used = kept.reduce((sum, segment) => sum + segment.estimatedTokens, 0);
  for (const tier of DROP_ORDER) {
    if (used <= budget) break;
    const candidates = kept.filter((segment) => segment.tier === tier).sort((a, b) => b.estimatedTokens - a.estimatedTokens);
    for (const candidate of candidates) {
      if (used <= budget) break;
      const index = kept.indexOf(candidate);
      if (index < 0) continue;
      kept.splice(index, 1);
      used -= candidate.estimatedTokens;
      dropped.push({
        tier: candidate.tier,
        path: candidate.path,
        title: candidate.title,
        estimatedTokens: candidate.estimatedTokens
      });
    }
  }
  kept.sort((a, b) => KEEP_RANK[a.tier] - KEEP_RANK[b.tier]);
  return {
    segments: kept,
    trim: {
      budgetTokens: budget,
      reservedTokens: input.reservedTokens,
      usedTokens: used,
      dropped,
      // 只剩 L0 仍超预算：材料已经不全，下游必须在报告里说明
      overBudget: used > budget
    }
  };
}

// src/core/context/tokens.ts
var ASCII_CHARS_PER_TOKEN = 4;
function isWide(char) {
  const code = char.codePointAt(0);
  if (code === void 0) return false;
  return code >= 11904 && code <= 40959 || // CJK 部首、假名、统一表意文字
  code >= 44032 && code <= 55215 || // 韩文
  code >= 63744 && code <= 64255 || // CJK 兼容表意
  code >= 65280 && code <= 65519 || // 全角标点与字母
  code >= 12288 && code <= 12351;
}
function estimateTokens(text2) {
  if (text2 === "") return 0;
  let wide = 0;
  let narrow = 0;
  for (const char of text2) {
    if (isWide(char)) wide += 1;
    else narrow += 1;
  }
  return wide + Math.ceil(narrow / ASCII_CHARS_PER_TOKEN);
}

// src/core/context/tiers.ts
var CONTROL_KEYWORDS = /* @__PURE__ */ new Set([
  "if",
  "for",
  "while",
  "switch",
  "catch",
  "else",
  "do",
  "try",
  "return",
  "finally",
  "with"
]);
var INDENT_DEF = /^\s*(?:async\s+)?(?:def|class)\s+([A-Za-z_]\w*)/;
var KEYWORD_DEF = /\b(?:function|func|fn|fun|sub|proc)\s+([A-Za-z_]\w*)/;
function indentOf(line) {
  let width = 0;
  for (const char of line) {
    if (char === " ") width += 1;
    else if (char === "	") width += 4;
    else break;
  }
  return width;
}
function leadingWord(line) {
  const match = /^\s*([A-Za-z_]\w*)/.exec(line);
  return match?.[1] ?? "";
}
function nameOfHeader(line) {
  const indentDef = INDENT_DEF.exec(line);
  if (indentDef?.[1] !== void 0) return indentDef[1];
  const keywordDef = KEYWORD_DEF.exec(line);
  if (keywordDef?.[1] !== void 0) return keywordDef[1];
  const call = /([A-Za-z_$][\w$]*)\s*\([^;]*\)\s*(?::[^{]*)?\{?\s*$/.exec(line);
  if (call?.[1] !== void 0 && !CONTROL_KEYWORDS.has(call[1])) return call[1];
  return null;
}
function isBlockHeader(line, nextLine) {
  const trimmed = line.trim();
  if (trimmed === "" || trimmed.startsWith("//") || trimmed.startsWith("#")) return false;
  if (leadingWord(line) && CONTROL_KEYWORDS.has(leadingWord(line))) return false;
  const hasOpen = trimmed.includes("{");
  if (hasOpen) {
    return /[()]/.test(trimmed) || KEYWORD_DEF.test(trimmed) || INDENT_DEF.test(trimmed);
  }
  if (nextLine !== null && nextLine.trim().startsWith("{")) {
    return /[()]/.test(trimmed) || KEYWORD_DEF.test(trimmed);
  }
  return false;
}
function braceRegions(lines) {
  const regions = [];
  const depthAfter = [];
  const stack = [];
  let depth = 0;
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? "";
    const header = isBlockHeader(line, lines[index + 1] ?? null);
    if (header) {
      stack.push({ line: index + 1, base: depth, name: nameOfHeader(line) ?? "(anonymous)" });
    }
    for (const char of line) {
      if (char === "{") depth += 1;
      else if (char === "}") depth = Math.max(0, depth - 1);
    }
    depthAfter.push(depth);
    while (stack.length > 0) {
      const top = stack[stack.length - 1];
      if (top === void 0) break;
      if (depth > top.base) break;
      regions.push({ startLine: top.line, endLine: index + 1, name: top.name });
      stack.pop();
    }
  }
  for (const open of stack) {
    regions.push({ startLine: open.line, endLine: lines.length, name: open.name });
  }
  return regions;
}
function indentRegions(lines) {
  const regions = [];
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? "";
    const match = INDENT_DEF.exec(line);
    if (match === null) continue;
    const base = indentOf(line);
    let lastContent = index + 1;
    for (let next = index + 1; next < lines.length; next += 1) {
      const candidate = lines[next] ?? "";
      if (candidate.trim() === "") continue;
      if (indentOf(candidate) <= base) break;
      lastContent = next + 1;
    }
    regions.push({
      startLine: index + 1,
      endLine: Math.max(index + 1, lastContent),
      name: match[1] ?? "(anonymous)"
    });
  }
  return regions;
}
function findEnclosingRegion(lines, targetLine) {
  if (targetLine < 1 || targetLine > lines.length) return null;
  const regions = braceRegions(lines);
  const pool = regions.length > 0 ? regions : indentRegions(lines);
  let best = null;
  for (const region of pool) {
    if (region.startLine > targetLine || region.endLine < targetLine) continue;
    if (best === null || region.startLine > best.startLine) best = region;
  }
  return best;
}
function listFunctions(lines) {
  const regions = braceRegions(lines);
  const pool = regions.length > 0 ? regions : indentRegions(lines);
  return pool.filter((region) => region.name !== "(anonymous)");
}
function renderDiffLine(line) {
  const mark = line.anchor.kind === "added" ? "+" : line.anchor.kind === "removed" ? "-" : " ";
  const number = line.anchor.newLine ?? line.anchor.oldLine ?? 0;
  return `${String(number).padStart(5, " ")} ${mark} ${line.text}`;
}
function renderChangedLines(lines) {
  const out = [];
  let lastNew = null;
  let lastOld = null;
  for (const line of lines) {
    const { kind, newLine, oldLine } = line.anchor;
    const reference = kind === "removed" ? oldLine : newLine;
    const lastReference = kind === "removed" ? lastOld : lastNew;
    if (reference !== null && lastReference !== null && reference !== lastReference + 1) {
      out.push("      \xB7\xB7\xB7");
    }
    out.push(renderDiffLine(line));
    if (newLine !== null) lastNew = newLine;
    if (oldLine !== null) lastOld = oldLine;
  }
  return out.join("\n");
}
function complementRanges(totalLines, covered) {
  const sorted = [...covered].sort((a, b) => a.startLine - b.startLine);
  const result = [];
  let cursor = 1;
  for (const region of sorted) {
    if (region.startLine > cursor) {
      result.push({ startLine: cursor, endLine: region.startLine - 1, name: "" });
    }
    cursor = Math.max(cursor, region.endLine + 1);
  }
  if (cursor <= totalLines) result.push({ startLine: cursor, endLine: totalLines, name: "" });
  return result;
}
function renderRegion(lines, region) {
  const out = [];
  for (let line = region.startLine; line <= region.endLine; line += 1) {
    out.push(`${String(line).padStart(5, " ")} | ${lines[line - 1] ?? ""}`);
  }
  return out.join("\n");
}
function buildFileSegments(file, content, options = {}) {
  const segments = [];
  const changed = file.lines.filter((line) => line.anchor.kind !== "context");
  const l0Content = renderChangedLines(changed.length > 0 ? changed : file.lines);
  segments.push({
    tier: "L0",
    path: file.path,
    title: `${file.path} \u7684\u6539\u52A8\uFF08${changed.length} \u884C\uFF09`,
    content: l0Content,
    estimatedTokens: estimateTokens(l0Content)
  });
  if (content === null) return segments;
  const lines = content.split("\n");
  const seen = /* @__PURE__ */ new Set();
  const regions = [];
  for (const line of changed) {
    const target = line.anchor.newLine;
    if (target === null) continue;
    const region = findEnclosingRegion(lines, target);
    if (region === null) continue;
    const key = `${region.startLine}:${region.endLine}`;
    if (seen.has(key)) continue;
    seen.add(key);
    regions.push(region);
  }
  for (const region of regions) {
    const body = renderRegion(lines, region);
    segments.push({
      tier: "L1",
      path: file.path,
      title: `${file.path} \u7684 ${region.name}() \u7B2C ${region.startLine}-${region.endLine} \u884C`,
      content: body,
      estimatedTokens: estimateTokens(body)
    });
  }
  const l4Max = options.l4MaxLines ?? 400;
  const rest = complementRanges(lines.length, regions);
  const anchors = changed.map((line) => line.anchor.newLine).filter((value) => value !== null);
  const picked = pickNearest(rest, anchors, l4Max);
  if (picked.length > 0) {
    const kept = picked.reduce((sum, region) => sum + (region.endLine - region.startLine + 1), 0);
    const body = picked.map((region) => renderRegion(lines, region)).join("\n      \xB7\xB7\xB7\n");
    segments.push({
      tier: "L4",
      path: file.path,
      title: `${file.path} \u7684\u5176\u4F59\u90E8\u5206\uFF08${kept} \u884C\uFF09`,
      content: body,
      estimatedTokens: estimateTokens(body)
    });
  }
  return segments;
}
function distanceToChanges(region, anchors) {
  if (anchors.length === 0) return region.startLine;
  let best = Number.POSITIVE_INFINITY;
  for (const anchor of anchors) {
    if (anchor >= region.startLine && anchor <= region.endLine) return 0;
    const distance = anchor < region.startLine ? region.startLine - anchor : anchor - region.endLine;
    if (distance < best) best = distance;
  }
  return best;
}
function pickNearest(regions, anchors, maxLines) {
  if (maxLines <= 0) return [];
  const ordered = [...regions].sort(
    (a, b) => distanceToChanges(a, anchors) - distanceToChanges(b, anchors)
  );
  const picked = [];
  let budget = maxLines;
  for (const region of ordered) {
    if (budget <= 0) break;
    const size = region.endLine - region.startLine + 1;
    if (size <= budget) {
      picked.push(region);
      budget -= size;
      continue;
    }
    const anchor = anchors.length > 0 ? anchors[0] : region.startLine;
    if (anchor === void 0) break;
    const centre = Math.min(Math.max(anchor, region.startLine), region.endLine);
    const half = Math.floor(budget / 2);
    const start = Math.max(region.startLine, centre - half);
    const end = Math.min(region.endLine, start + budget - 1);
    if (end >= start) picked.push({ startLine: start, endLine: end, name: "" });
    budget = 0;
  }
  return picked.sort((a, b) => a.startLine - b.startLine);
}

// src/core/context/assemble.ts
function computeBudget(options) {
  const ratio = options.inputRatio ?? 0.7;
  const overhead = options.promptOverheadTokens ?? 2500;
  const raw = Math.floor((options.contextWindow - options.maxOutputTokens) * ratio) - overhead;
  return Math.max(0, raw);
}
function assembleContext(snapshot, options) {
  const segments = [];
  for (const file of snapshot.diff.files) {
    if (file.skippedReason !== null) continue;
    const content = snapshot.fileContents.get(file.path) ?? null;
    segments.push(...buildFileSegments(file, content, { l4MaxLines: options.l4MaxLines ?? 400 }));
  }
  if (snapshot.conventions !== null && snapshot.conventions.trim() !== "") {
    segments.push({
      tier: "L3",
      path: null,
      title: "\u4ED3\u5E93\u7EA6\u5B9A\uFF08\u8D21\u732E\u6307\u5357\uFF09",
      content: snapshot.conventions,
      estimatedTokens: estimateTokens(snapshot.conventions)
    });
  }
  if (snapshot.buildContext !== null && snapshot.buildContext.trim() !== "") {
    segments.push({
      tier: "L2",
      path: null,
      title: "\u4F9D\u8D56\u6E05\u5355\u4E0E\u6784\u5EFA\u914D\u7F6E\uFF08\u5B89\u5168\u5BA1\u6838\u4F9D\u636E\uFF09",
      content: snapshot.buildContext,
      estimatedTokens: estimateTokens(snapshot.buildContext)
    });
  }
  if (options.extraSegments !== void 0) {
    segments.push(...options.extraSegments);
  }
  return applyBudget(segments, {
    budgetTokens: computeBudget(options),
    reservedTokens: options.promptOverheadTokens ?? 2500
  });
}
function selectForFile(bundle, path) {
  return bundle.segments.filter((segment) => segment.path === null || segment.path === path);
}

// src/core/context/crossfile.ts
var DECL_LINE = /^\s*export\s+(?:default\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/;
var DECL_ARROW = /^\s*export\s+(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?\(/;
function declarationName(text2) {
  return DECL_LINE.exec(text2)?.[1] ?? DECL_ARROW.exec(text2)?.[1] ?? null;
}
function paramsOf(text2) {
  const open = text2.indexOf("(");
  if (open < 0) return { paramCount: 0, required: 0 };
  let depth = 0;
  let inner = "";
  for (let index = open; index < text2.length; index += 1) {
    const char = text2[index] ?? "";
    if (char === "(") depth += 1;
    else if (char === ")") {
      depth -= 1;
      if (depth === 0) break;
    } else if (depth === 1) inner += char;
  }
  const parts = inner.split(",").map((part) => part.trim()).filter((part) => part !== "");
  const required = parts.filter(
    (part) => !part.startsWith("...") && !part.includes("=") && !/\?\s*:/.test(part)
  ).length;
  return { paramCount: parts.length, required };
}
function findSignatureChanges(diff) {
  const changes = [];
  for (const file of diff.files) {
    if (file.skippedReason !== null) continue;
    const removed = /* @__PURE__ */ new Map();
    const added = /* @__PURE__ */ new Map();
    for (const line of file.lines) {
      const name = declarationName(line.text);
      if (name === null) continue;
      if (line.anchor.kind === "removed") removed.set(name, line);
      else if (line.anchor.kind === "added") added.set(name, line);
    }
    for (const [name, addedLine] of added) {
      const before = removed.get(name);
      if (before === void 0) continue;
      const after = paramsOf(addedLine.text);
      const previous = paramsOf(before.text);
      if (after.paramCount === previous.paramCount && after.required === previous.required)
        continue;
      const line = addedLine.anchor.newLine;
      if (line === null) continue;
      changes.push({
        path: file.path,
        name,
        line,
        side: "new",
        evidence: addedLine.text,
        kind: "params-changed",
        paramCountAfter: after.paramCount,
        requiredAfter: after.required,
        hasRestAfter: /\.\.\./.test(addedLine.text)
      });
    }
    for (const [name, removedLine] of removed) {
      if (added.has(name)) continue;
      const line = removedLine.anchor.oldLine;
      if (line === null) continue;
      changes.push({
        path: file.path,
        name,
        line,
        side: "old",
        evidence: removedLine.text,
        kind: "export-removed",
        paramCountAfter: 0,
        requiredAfter: 0,
        hasRestAfter: false
      });
    }
  }
  return changes;
}
var MAX_CITED_SITES = 10;
function checkSignatureChanges(changes, index) {
  const findings = [];
  const skipped = [];
  for (const change of changes) {
    const sites = (index.calls.get(change.name) ?? []).filter((site) => site.path !== change.path);
    if (change.kind === "export-removed") {
      if (sites.length === 0) {
        skipped.push({
          path: change.path,
          name: change.name,
          reason: "\u6CA1\u6709\u627E\u5230\u8C03\u7528\u70B9\uFF0C\u53EF\u80FD\u672A\u88AB\u4F7F\u7528\u6216\u4E3A\u52A8\u6001\u5F15\u7528"
        });
        continue;
      }
      findings.push(
        makeFinding(
          change,
          sites.map((site) => `${site.path}:${site.line}`),
          "\u8BE5\u5BFC\u51FA\u7B26\u53F7\u5DF2\u88AB\u5220\u9664\uFF0C\u4F46\u4ECD\u6709\u8C03\u7528\u70B9"
        )
      );
      continue;
    }
    const offending = sites.filter((site) => {
      if (site.argCount < change.requiredAfter) return true;
      if (!change.hasRestAfter && site.argCount > change.paramCountAfter) return true;
      return false;
    });
    if (offending.length === 0) {
      skipped.push({ path: change.path, name: change.name, reason: "\u8C03\u7528\u70B9\u5B9E\u53C2\u4E2A\u6570\u4E0E\u65B0\u7B7E\u540D\u4E00\u81F4" });
      continue;
    }
    findings.push(
      makeFinding(
        change,
        offending.map(
          (site) => `${site.path}:${site.line}\uFF08\u4F20\u5165 ${site.argCount} \u4E2A\uFF0C\u9700\u8981 ${change.requiredAfter} \u4E2A\uFF09`
        ),
        "\u51FD\u6570\u7B7E\u540D\u7684\u53C2\u6570\u4E2A\u6570\u5DF2\u53D8\u5316\uFF0C\u4F46\u8FD9\u4E9B\u8C03\u7528\u70B9\u6CA1\u6709\u540C\u6B65\u4FEE\u6539"
      )
    );
  }
  return { findings, skipped };
}
function makeFinding(change, sites, problem) {
  const cited = sites.slice(0, MAX_CITED_SITES);
  const rest = sites.length - cited.length;
  return {
    file: change.path,
    line: change.line,
    side: change.side,
    severity: "major",
    category: "logic",
    title: `${change.name}() \u7684\u8C03\u7528\u65B9\u672A\u540C\u6B65\u4FEE\u6539`,
    body: [
      `${problem}\u3002`,
      "",
      "\u8C03\u7528\u70B9\uFF1A",
      ...cited.map((site) => `- ${site}`),
      ...rest > 0 ? [`- \u53E6\u6709 ${rest} \u5904`] : [],
      "",
      change.kind === "export-removed" ? "\u540E\u679C\uFF1A\u8C03\u7528\u65B9\u4F1A\u5F97\u5230 undefined \u6216\u629B\u51FA TypeError\u3002" : "\u540E\u679C\uFF1A\u5C11\u4F20\u7684\u53C2\u6570\u5728\u8FD0\u884C\u65F6\u662F undefined\uFF0C\u53EF\u80FD\u5728\u4E0B\u6E38\u67D0\u5904\u624D\u70B8\uFF1B\u591A\u4F20\u7684\u53C2\u6570\u88AB\u9759\u9ED8\u5FFD\u7565\uFF0C\u8BF4\u660E\u8C03\u7528\u65B9\u8FD8\u505C\u7559\u5728\u65E7\u5951\u7EA6\u4E0A\u3002"
    ].join("\n"),
    evidence: change.evidence,
    suggestion: null,
    // 规则结论，但依赖语法级解析：动态引用看不见，个数统计对多行调用可能有偏差
    confidence: 0.85
  };
}
function resolveSource(fromPath, source, known) {
  if (!source.startsWith(".")) return null;
  const base = fromPath.split("/").slice(0, -1);
  const segments = [...base];
  for (const part of source.split("/")) {
    if (part === "." || part === "") continue;
    if (part === "..") segments.pop();
    else segments.push(part);
  }
  const joined = segments.join("/");
  const candidates = [
    joined,
    `${joined}.ts`,
    `${joined}.tsx`,
    `${joined}.js`,
    `${joined}.jsx`,
    `${joined}.mjs`,
    `${joined}/index.ts`,
    `${joined}/index.tsx`
  ];
  return candidates.find((candidate) => known.has(candidate)) ?? null;
}
function buildImportSegments(index, changedPaths, options = {}) {
  if ((options.depth ?? 1) <= 0) return [];
  const known = new Set(index.files.keys());
  const maxFiles = options.maxFiles ?? 30;
  const segments = [];
  let usedFiles = 0;
  for (const path of changedPaths) {
    const file = index.files.get(path);
    if (file === void 0) continue;
    const lines = [];
    for (const ref of file.imports) {
      const resolved = resolveSource(path, ref.source, known);
      if (resolved === null) continue;
      if (usedFiles >= maxFiles) break;
      usedFiles += 1;
      const target = index.files.get(resolved);
      if (target === void 0) continue;
      const wanted = target.exports.filter(
        (symbol) => ref.names.includes("default") || ref.names.includes(symbol.name)
      );
      for (const symbol of wanted) {
        lines.push(`${resolved}:${symbol.line}  ${symbol.signatureText.split("\n")[0] ?? ""}`);
      }
    }
    if (lines.length === 0) continue;
    const content = lines.join("\n");
    segments.push({
      tier: "L2",
      path,
      title: `${path} \u5F15\u7528\u7684\u7B26\u53F7\u7B7E\u540D\uFF08${lines.length} \u4E2A\uFF09`,
      content,
      estimatedTokens: estimateTokens(content)
    });
  }
  return segments;
}

// src/core/context/symbols.ts
var DECL = /^\s*export\s+(?:default\s+)?(?:declare\s+)?(?:async\s+)?(function|const|let|var|class|interface|type|enum)\s+([A-Za-z_$][\w$]*)/;
var IMPORT_NAMED = /^\s*import\s+(?:type\s+)?{([^}]*)\}\s*from\s*['"]([^'"]+)['"]/;
var IMPORT_DEFAULT = /^\s*import\s+(?:type\s+)?([A-Za-z_$][\w$]*)\s*(?:,\s*{[^}]*})?\s*from\s*['"]([^'"]+)['"]/;
function splitTopLevel(text2, separator) {
  const parts = [];
  let depth = 0;
  let current = "";
  let quote = null;
  for (let index = 0; index < text2.length; index += 1) {
    const char = text2[index] ?? "";
    if (quote !== null) {
      current += char;
      if (char === "\\") {
        current += text2[index + 1] ?? "";
        index += 1;
      } else if (char === quote) {
        quote = null;
      }
      continue;
    }
    if (char === '"' || char === "'" || char === "`") {
      quote = char;
      current += char;
      continue;
    }
    if (char === "(" || char === "[" || char === "{" || char === "<") depth += 1;
    if (char === ")" || char === "]" || char === "}" || char === ">") depth -= 1;
    if (char === separator && depth === 0) {
      parts.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  parts.push(current);
  return parts;
}
function takeParens(text2, openIndex) {
  let depth = 0;
  let quote = null;
  for (let index = openIndex; index < text2.length; index += 1) {
    const char = text2[index] ?? "";
    if (quote !== null) {
      if (char === "\\") index += 1;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === '"' || char === "'" || char === "`") {
      quote = char;
      continue;
    }
    if (char === "(") depth += 1;
    else if (char === ")") {
      depth -= 1;
      if (depth === 0) return { inner: text2.slice(openIndex + 1, index), end: index };
    }
  }
  return null;
}
function analyseParams(inner) {
  const raw = splitTopLevel(inner, ",").map((part) => part.trim()).filter((part) => part !== "");
  let required = 0;
  let hasRest = false;
  for (const param of raw) {
    if (param.startsWith("...")) {
      hasRest = true;
      continue;
    }
    const hasDefault = splitTopLevel(param, "=").length > 1;
    const optional = /\?\s*:/.test(param) || /^\s*[A-Za-z_$][\w$]*\?\s*$/.test(param);
    if (!hasDefault && !optional) required += 1;
  }
  return { paramCount: raw.length, requiredParams: required, hasRest };
}
function joinDeclaration(lines, startLine) {
  const collected = [];
  let depth = 0;
  for (let offset = 0; offset < 8; offset += 1) {
    const text2 = lines[startLine - 1 + offset];
    if (text2 === void 0) break;
    collected.push(text2);
    for (const char of text2) {
      if (char === "(" || char === "{" || char === "[") depth += 1;
      if (char === ")" || char === "}" || char === "]") depth -= 1;
    }
    if (depth <= 0 && /[()]/.test(collected.join("\n"))) break;
  }
  return collected.join("\n");
}
function parseExports(lines) {
  const symbols = [];
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? "";
    const match = DECL.exec(line);
    if (match === null) continue;
    const raw = match[1] ?? "";
    const kind = raw === "let" || raw === "var" ? "const" : raw;
    const name = match[2] ?? "";
    const signatureText = joinDeclaration(lines, index + 1);
    let params = { paramCount: 0, requiredParams: 0, hasRest: false };
    if (kind === "function") {
      const open = signatureText.indexOf("(", signatureText.indexOf(name));
      if (open >= 0) {
        const parens = takeParens(signatureText, open);
        if (parens !== null) params = analyseParams(parens.inner);
      }
    } else if (kind === "const") {
      const arrow = signatureText.indexOf("=>");
      const open = signatureText.indexOf("(");
      if (arrow >= 0 && open >= 0 && open < arrow) {
        const parens = takeParens(signatureText, open);
        if (parens !== null) params = analyseParams(parens.inner);
        else if (/^\s*[A-Za-z_$][\w$]*\s*=>/.test(signatureText)) {
          params = { paramCount: 1, requiredParams: 1, hasRest: false };
        }
      }
    }
    symbols.push({
      name,
      kind,
      line: index + 1,
      signatureText,
      paramCount: params.paramCount,
      requiredParams: params.requiredParams,
      hasRest: params.hasRest
    });
  }
  return symbols;
}
function parseImports(lines) {
  const imports = [];
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? "";
    const named = IMPORT_NAMED.exec(line);
    if (named !== null) {
      const names = (named[1] ?? "").split(",").map((part) => part.trim().replace(/^type\s+/, "")).map((part) => part.split(/\s+as\s+/)[0] ?? part).filter((part) => part !== "");
      imports.push({ line: index + 1, source: named[2] ?? "", names });
      continue;
    }
    const single = IMPORT_DEFAULT.exec(line);
    if (single !== null) {
      imports.push({ line: index + 1, source: single[2] ?? "", names: ["default"] });
    }
  }
  return imports;
}
var NOT_A_CALL = /* @__PURE__ */ new Set([
  "if",
  "for",
  "while",
  "switch",
  "catch",
  "return",
  "typeof",
  "await",
  "function",
  "super",
  "import",
  "constructor",
  "do",
  "else"
]);
function findCallsInLine(path, lineNumber, text2) {
  const sites = [];
  const pattern = /(?<![\w$.])([A-Za-z_$][\w$]*)\s*\(/g;
  for (const match of text2.matchAll(pattern)) {
    const name = match[1];
    if (name === void 0 || NOT_A_CALL.has(name)) continue;
    const open = (match.index ?? 0) + match[0].length - 1;
    const parens = takeParens(text2, open);
    if (parens === null) continue;
    const args = splitTopLevel(parens.inner, ",").map((part) => part.trim()).filter((part) => part !== "");
    sites.push({ name, path, line: lineNumber, text: text2.trim(), argCount: args.length });
  }
  return sites;
}
function buildSymbolIndex(files) {
  const parsed = /* @__PURE__ */ new Map();
  const calls = /* @__PURE__ */ new Map();
  for (const [path, content] of files) {
    if (content === "") continue;
    const lines = content.split("\n");
    parsed.set(path, { exports: parseExports(lines), imports: parseImports(lines) });
    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index] ?? "";
      if (IMPORT_NAMED.test(line) || IMPORT_DEFAULT.test(line) || DECL.test(line)) continue;
      for (const site of findCallsInLine(path, index + 1, line)) {
        const existing = calls.get(site.name);
        if (existing === void 0) calls.set(site.name, [site]);
        else existing.push(site);
      }
    }
  }
  return { files: parsed, calls };
}

// src/core/diff/index-lines.ts
function buildLineIndex(diff) {
  const byNewLine = /* @__PURE__ */ new Map();
  const byOldLine = /* @__PURE__ */ new Map();
  const files = /* @__PURE__ */ new Set();
  for (const file of diff.files) {
    files.add(file.path);
    if (file.oldPath !== null) files.add(file.oldPath);
    if (file.skippedReason !== null || file.lines.length === 0) continue;
    let newSide = byNewLine.get(file.path);
    if (newSide === void 0) {
      newSide = /* @__PURE__ */ new Map();
      byNewLine.set(file.path, newSide);
    }
    let oldSide = byOldLine.get(file.path);
    if (oldSide === void 0) {
      oldSide = /* @__PURE__ */ new Map();
      byOldLine.set(file.path, oldSide);
    }
    for (const line of file.lines) {
      const { anchor } = line;
      if (anchor.newLine !== null) newSide.set(anchor.newLine, anchor);
      if (anchor.oldLine !== null) oldSide.set(anchor.oldLine, anchor);
    }
  }
  return { byNewLine, byOldLine, files };
}
function lookupAnchor(index, file, line, side) {
  const table = side === "new" ? index.byNewLine : index.byOldLine;
  return table.get(file)?.get(line) ?? null;
}

// src/core/reconcile/checkpoint.ts
import { createHash } from "node:crypto";
var CHECKPOINT_VERSION = "v1";
var CHECKPOINT_PATTERN = /<!--\s*acr:v1\|kind=checkpoint\|([^>]*?)-->/;
function renderCheckpoint(state) {
  const fields = [
    `kind=checkpoint`,
    `head=${state.headSha}`,
    `base=${state.baseSha}`,
    `cfg=${state.configHash}`,
    `pv=${state.promptHash}`,
    `at=${state.reviewedAt}`
  ];
  return `<!-- acr:v1|${fields.join("|")} -->`;
}
function parseCheckpoint(body) {
  const match = CHECKPOINT_PATTERN.exec(body);
  if (match === null) return null;
  const fields = /* @__PURE__ */ new Map();
  for (const segment of (match[1] ?? "").split("|")) {
    const index = segment.indexOf("=");
    if (index <= 0) continue;
    fields.set(segment.slice(0, index).trim(), segment.slice(index + 1).trim());
  }
  const headSha = fields.get("head");
  const baseSha = fields.get("base");
  const configHash = fields.get("cfg");
  const promptHash = fields.get("pv");
  if (headSha === void 0 || baseSha === void 0) return null;
  if (configHash === void 0 || promptHash === void 0) return null;
  return {
    version: CHECKPOINT_VERSION,
    headSha,
    baseSha,
    configHash,
    promptHash,
    reviewedAt: fields.get("at") ?? ""
  };
}
function stableHash(value) {
  return createHash("sha256").update(JSON.stringify(value), "utf8").digest("hex").slice(0, 16);
}
function computeConfigHash(config) {
  const dimensions = Object.entries(config.review.dimensions).sort(([a], [b]) => a.localeCompare(b)).map(([name, setting]) => [name, setting.enabled, setting.severityFloor]);
  return stableHash({ dimensions, model: config.llm.model });
}
function computePromptHash(versions) {
  const sorted = Object.entries(versions).sort(([a], [b]) => a.localeCompare(b));
  return stableHash(sorted);
}
async function decideCheckpoint(input) {
  if (!input.enabled) return { use: false, reason: "disabled", detail: "\u672A\u542F\u7528\u68C0\u67E5\u70B9" };
  if (input.summary === null) {
    return { use: false, reason: "no-summary", detail: "\u6CA1\u6709\u627E\u5230\u4E0A\u4E00\u8F6E\u7684\u6458\u8981\u8BC4\u8BBA" };
  }
  if (input.expectedAuthor === null) {
    return { use: false, reason: "foreign-author", detail: "\u65E0\u6CD5\u786E\u8BA4\u6458\u8981\u4F5C\u8005\uFF0C\u6309\u5B58\u7591\u5904\u7406" };
  }
  if (input.summary.author !== input.expectedAuthor) {
    return {
      use: false,
      reason: "foreign-author",
      detail: `\u6458\u8981\u7531 ${input.summary.author} \u53D1\u5E03\uFF0C\u4E0D\u662F\u672C\u4EE4\u724C\uFF08${input.expectedAuthor}\uFF09`
    };
  }
  const state = parseCheckpoint(input.summary.body);
  if (state === null) {
    return { use: false, reason: "unparsable", detail: "\u6458\u8981\u91CC\u8BFB\u4E0D\u51FA\u68C0\u67E5\u70B9\uFF0C\u53EF\u80FD\u7248\u672C\u4E0D\u7B26" };
  }
  if (state.baseSha !== input.current.baseSha) {
    return {
      use: false,
      reason: "base-moved",
      detail: `\u57FA\u51C6\u5206\u652F\u5DF2\u79FB\u52A8\uFF08${state.baseSha.slice(0, 7)} \u2192 ${input.current.baseSha.slice(0, 7)}\uFF09\uFF0C\u884C\u53F7\u57FA\u51C6\u53D8\u4E86`
    };
  }
  if (state.configHash !== input.current.configHash || state.promptHash !== input.current.promptHash) {
    return {
      use: false,
      reason: "basis-changed",
      detail: "\u914D\u7F6E\u6216\u63D0\u793A\u8BCD\u7248\u672C\u5DF2\u53D8\u5316\uFF0C\u4E24\u8F6E\u7ED3\u8BBA\u4E0D\u53EF\u6BD4"
    };
  }
  if (state.headSha === input.current.headSha) {
    return { use: false, reason: "nothing-new", detail: "\u5934\u90E8\u672A\u53D8\u5316\uFF0C\u6CA1\u6709\u65B0\u589E\u63D0\u4EA4" };
  }
  const ancestor = await input.isAncestor(state.headSha, input.current.headSha).catch(() => false);
  if (!ancestor) {
    return {
      use: false,
      reason: "not-ancestor",
      detail: "\u65E0\u6CD5\u8BC1\u660E\u68C0\u67E5\u70B9\u662F\u5F53\u524D\u5934\u90E8\u7684\u7956\u5148\uFF08\u53EF\u80FD\u88AB\u5F3A\u63A8\u6216\u53D8\u57FA\uFF09"
    };
  }
  return { use: true, from: state.headSha, to: input.current.headSha };
}

// src/core/reconcile/plan.ts
function positionOf(finding) {
  const { anchor } = finding;
  if (anchor.kind === "removed") {
    return anchor.oldLine === null ? null : { path: anchor.file, line: anchor.oldLine, side: "old" };
  }
  return anchor.newLine === null ? null : { path: anchor.file, line: anchor.newLine, side: "new" };
}
function defaultRender(finding) {
  return `**${finding.title}**

${finding.body}`;
}
var REPLACE_SEVERITIES = /* @__PURE__ */ new Set(["blocker", "major"]);
function planActions(options) {
  const render = options.renderBody ?? defaultRender;
  const actions = [];
  const warnings = [];
  let outdatedKept = 0;
  const byFingerprint = /* @__PURE__ */ new Map();
  for (const comment of options.existing) {
    if (comment.marker === null) continue;
    byFingerprint.set(comment.marker.fingerprint, comment);
  }
  const allFingerprints = new Set(options.findings.map((finding) => finding.fingerprint));
  const inlineFingerprints = new Set(options.inline.map((finding) => finding.fingerprint));
  for (const finding of options.inline) {
    const previous = byFingerprint.get(finding.fingerprint);
    if (previous === void 0) {
      actions.push({ kind: "create", target: "inline", finding, body: render(finding) });
      continue;
    }
    if (previous.resolved) {
      actions.push({ kind: "keep", commentId: previous.commentId, finding });
      continue;
    }
    const current = positionOf(finding);
    const unchanged = current !== null && previous.path === current.path && previous.line === current.line && previous.side === current.side;
    if (unchanged) {
      actions.push({ kind: "keep", commentId: previous.commentId, finding });
      continue;
    }
    if (REPLACE_SEVERITIES.has(finding.severity)) {
      actions.push({
        kind: "replace",
        commentId: previous.commentId,
        finding,
        body: render(finding)
      });
      continue;
    }
    outdatedKept += 1;
    actions.push({ kind: "keep", commentId: previous.commentId, finding });
    warnings.push({
      kind: "other",
      message: `\u300C${finding.title}\u300D\u7684\u4EE3\u7801\u4F4D\u7F6E\u5DF2\u53D8\u52A8\uFF0C\u65E7\u8BC4\u8BBA\u4FDD\u7559\uFF08\u5E73\u53F0\u4F1A\u6807\u8BB0\u4E3A\u8FC7\u65F6\uFF09`,
      target: `${current?.path ?? previous.path}:${String(current?.line ?? previous.line ?? 0)}`
    });
  }
  for (const comment of options.existing) {
    if (comment.marker === null) continue;
    const fingerprint = comment.marker.fingerprint;
    if (inlineFingerprints.has(fingerprint)) continue;
    if (allFingerprints.has(fingerprint)) continue;
    if (comment.resolved) continue;
    actions.push({ kind: "resolve", commentId: comment.commentId, finding: null });
  }
  return { actions, warnings, outdatedKept };
}
function resolvedNotice(isoTime) {
  return `> \u672C\u8F6E\u672A\u518D\u53D1\u73B0\u6B64\u95EE\u9898\uFF08${isoTime}\uFF09\u3002\u53EF\u80FD\u662F\u5DF2\u4FEE\u590D\uFF0C\u4E5F\u53EF\u80FD\u662F\u672C\u6B21\u5BA1\u67E5\u672A\u8986\u76D6\u5230\uFF0C\u8BF7\u81EA\u884C\u786E\u8BA4\u3002`;
}

// src/core/cost/pricing.ts
var PER_MILLION = 1e6;
function computeCost(usage, pricing) {
  if (pricing === null) return null;
  const inputPrice = pricing.inputPerMTok / PER_MILLION;
  const outputPrice = pricing.outputPerMTok / PER_MILLION;
  const uncachedInput = usage.uncachedInput * inputPrice;
  const cacheWriteShort = usage.cacheWriteShort * inputPrice * pricing.cacheWriteShortMultiplier;
  const cacheWriteLong = usage.cacheWriteLong * inputPrice * pricing.cacheWriteLongMultiplier;
  const cacheRead = usage.cacheRead * inputPrice * pricing.cacheReadMultiplier;
  const output = usage.output * outputPrice;
  return {
    uncachedInput,
    cacheWriteShort,
    cacheWriteLong,
    cacheRead,
    output,
    total: uncachedInput + cacheWriteShort + cacheWriteLong + cacheRead + output
  };
}
function formatUsd(value) {
  if (value === 0) return "$0";
  if (value >= 0.01) return `$${value.toFixed(3)}`;
  if (value >= 1e-4) return `$${value.toFixed(5)}`;
  return `$${value.toExponential(2)}`;
}

// src/core/reviewers/rules/frontend.ts
var SOURCE = {
  name: "alibaba/f2e-spec \u8981\u70B9\u63D0\u70BC\uFF08\u8868\u8FF0\u81EA\u64B0\uFF09",
  url: "https://github.com/alibaba/f2e-spec",
  license: "own",
  modified: "\u4EC5\u63D0\u70BC\u89C4\u5219\u8981\u6C42\uFF0C\u7528\u672C\u9879\u76EE\u81EA\u5DF1\u7684\u8BDD\u91CD\u5199\uFF0C\u672A\u590D\u5236\u89C4\u7EA6\u539F\u6587"
};
var WEB_LANGS = ["typescript", "javascript"];
function rule(id, level, dimension, instruction, basis, options = {}) {
  return {
    id,
    level,
    dimension,
    title: instruction.slice(0, 30),
    instruction,
    languages: options.languages ?? [...WEB_LANGS],
    ...options.pathPatterns === void 0 ? {} : { pathPatterns: options.pathPatterns },
    source: { ...SOURCE, basis: `f2e-spec ${basis}` }
  };
}
var FRONTEND_RULES = {
  entries: [
    // ── 编码规约 ──────────────────────────────────────────────────────────
    rule(
      "fe-naming",
      "mandatory",
      "naming",
      "\u7EC4\u4EF6\u7528\u5927\u9A7C\u5CF0\uFF0C\u53D8\u91CF\u4E0E\u51FD\u6570\u7528\u5C0F\u9A7C\u5CF0\uFF0C\u5E38\u91CF\u5168\u5927\u5199\u4E0B\u5212\u7EBF\u5206\u9694\uFF0C\u6587\u4EF6\u540D\u5728\u56E2\u961F\u5185\u4FDD\u6301\u4E00\u79CD\u98CE\u683C\u5E76\u524D\u540E\u4E00\u81F4\u3002",
      "docs/coding \u547D\u540D"
    ),
    rule(
      "fe-explicit-any",
      "mandatory",
      "coding",
      "\u4E0D\u8981\u7528 any \u6216 @ts-ignore \u7ED5\u5F00\u7C7B\u578B\u68C0\u67E5\uFF1B\u786E\u5B9E\u65E0\u6CD5\u8868\u8FBE\u65F6\u7528 unknown \u5E76\u663E\u5F0F\u6536\u7A84\u3002",
      "docs/coding TypeScript"
    ),
    rule(
      "fe-cleanup-side-effects",
      "mandatory",
      "coding",
      "\u6CE8\u518C\u7684\u5B9A\u65F6\u5668\u3001\u4E8B\u4EF6\u76D1\u542C\u3001\u8BA2\u9605\u5FC5\u987B\u5728\u5378\u8F7D\u6216\u4F9D\u8D56\u53D8\u5316\u65F6\u6E05\u7406\uFF0C\u5426\u5219\u4F1A\u91CD\u590D\u53E0\u52A0\u3002",
      "docs/coding \u526F\u4F5C\u7528"
    ),
    rule(
      "fe-no-param-mutation",
      "recommended",
      "coding",
      "\u4E0D\u8981\u76F4\u63A5\u4FEE\u6539\u5165\u53C2\u4E0E props\uFF0C\u9700\u8981\u53D8\u66F4\u65F6\u521B\u5EFA\u65B0\u5BF9\u8C61\uFF0C\u907F\u514D\u8C03\u7528\u65B9\u6570\u636E\u88AB\u6084\u6084\u6539\u6389\u3002",
      "docs/coding \u6570\u636E\u6D41"
    ),
    rule(
      "fe-key-stable",
      "recommended",
      "coding",
      "\u5217\u8868\u6E32\u67D3\u7684 key \u7528\u7A33\u5B9A\u552F\u4E00\u6807\u8BC6\uFF0C\u4E0D\u8981\u7528\u6570\u7EC4\u4E0B\u6807\u2014\u2014\u589E\u5220\u6392\u5E8F\u65F6\u4F1A\u5BFC\u81F4\u72B6\u6001\u9519\u4F4D\u3002",
      "docs/coding \u5217\u8868\u6E32\u67D3"
    ),
    rule(
      "fe-state-minimal",
      "recommended",
      "coding",
      "\u80FD\u4ECE\u65E2\u6709\u72B6\u6001\u63A8\u5BFC\u51FA\u6765\u7684\u503C\u4E0D\u8981\u53E6\u5B58\u4E00\u4EFD\uFF0C\u91CD\u590D\u72B6\u6001\u8FDF\u65E9\u4F1A\u4E0D\u540C\u6B65\u3002",
      "docs/coding \u72B6\u6001\u7BA1\u7406"
    ),
    rule(
      "fe-no-magic-value",
      "recommended",
      "coding",
      "\u91CD\u590D\u51FA\u73B0\u6216\u542B\u4E49\u4E0D\u660E\u7684\u5B57\u9762\u91CF\u8981\u62BD\u6210\u5177\u540D\u5E38\u91CF\uFF0C\u907F\u514D\u6563\u843D\u5404\u5904\u96BE\u4EE5\u7EDF\u4E00\u4FEE\u6539\u3002",
      "docs/coding \u5E38\u91CF"
    ),
    // ── 工程规约 ──────────────────────────────────────────────────────────
    rule(
      "fe-dir-by-feature",
      "recommended",
      "frontend",
      "\u76EE\u5F55\u6309\u529F\u80FD\u6216\u4E1A\u52A1\u57DF\u7EC4\u7EC7\uFF0C\u4E0D\u8981\u6309\u6587\u4EF6\u7C7B\u578B\u628A components/hooks/utils \u644A\u5E73\u6210\u5927\u4ED3\u5E93\u3002",
      "docs/engineering \u76EE\u5F55\u7ED3\u6784"
    ),
    rule(
      "fe-import-alias",
      "recommended",
      "frontend",
      "\u8DE8\u6A21\u5757\u5F15\u7528\u4F7F\u7528\u8DEF\u5F84\u522B\u540D\uFF0C\u907F\u514D ../../../ \u8FD9\u79CD\u4E00\u79FB\u52A8\u5C31\u5168\u65AD\u7684\u76F8\u5BF9\u8DEF\u5F84\u3002",
      "docs/engineering \u6A21\u5757\u5F15\u7528"
    ),
    rule(
      "fe-file-single-purpose",
      "reference",
      "frontend",
      "\u4E00\u4E2A\u6587\u4EF6\u53EA\u627F\u62C5\u4E00\u4EF6\u4E8B\uFF1B\u8D85\u8FC7\u6570\u767E\u884C\u6216\u540C\u65F6\u5904\u7406\u591A\u79CD\u804C\u8D23\u65F6\u8003\u8651\u62C6\u5206\u3002",
      "docs/engineering \u6587\u4EF6\u7EC4\u7EC7"
    ),
    // ── 安全规约 ──────────────────────────────────────────────────────────
    rule(
      "fe-no-untrusted-html",
      "mandatory",
      "security",
      "\u5916\u90E8\u6570\u636E\u4E0D\u5F97\u76F4\u63A5\u5199\u5165 innerHTML / dangerouslySetInnerHTML / v-html\uFF1B\u5FC5\u987B\u5148\u51C0\u5316\u6216\u6539\u7528\u6587\u672C\u7ED1\u5B9A\u3002",
      "docs/coding \u5B89\u5168\u6E32\u67D3"
    ),
    rule(
      "fe-no-secret-in-bundle",
      "mandatory",
      "security",
      "\u5BC6\u94A5\u3001\u4EE4\u724C\u3001\u5185\u90E8\u5730\u5740\u4E0D\u5F97\u51FA\u73B0\u5728\u524D\u7AEF\u6E90\u7801\u6216\u7528\u516C\u5F00\u524D\u7F00\u6CE8\u5165\u7684\u73AF\u5883\u53D8\u91CF\u91CC\uFF0C\u5B83\u4EEC\u90FD\u4F1A\u88AB\u6253\u8FDB\u4EA7\u7269\u3002",
      "docs/engineering \u73AF\u5883\u53D8\u91CF"
    ),
    rule(
      "fe-token-storage",
      "mandatory",
      "security",
      "\u957F\u671F\u6709\u6548\u7684\u4EE4\u724C\u4E0D\u8981\u653E localStorage\uFF1B\u4F18\u5148\u7528 httpOnly Cookie\uFF0C\u4F1A\u8BDD\u6001\u4EE4\u724C\u653E\u5185\u5B58\u3002",
      "docs/coding \u5B58\u50A8"
    ),
    rule(
      "fe-state-change-guard",
      "mandatory",
      "security",
      "\u5199\u64CD\u4F5C\u8BF7\u6C42\u8981\u5E26\u9632\u4F2A\u4EE4\u724C\u6216\u540C\u6E90\u6821\u9A8C\uFF1B\u4EC5\u9760\u524D\u7AEF\u9690\u85CF\u6309\u94AE\u4E0D\u6784\u6210\u6743\u9650\u63A7\u5236\u3002",
      "docs/coding \u8BF7\u6C42"
    )
  ]
};

// src/core/reviewers/rules/general.ts
var SOURCE2 = { name: "\u672C\u9879\u76EE", url: null, license: "own" };
var GENERAL_RULES = [
  {
    id: "general-await-async",
    level: "mandatory",
    dimension: "coding",
    title: "\u5F02\u6B65\u8C03\u7528\u5FC5\u987B\u88AB\u7B49\u5F85\u6216\u663E\u5F0F\u5FFD\u7565",
    instruction: "\u8C03\u7528\u8FD4\u56DE Promise \u7684\u51FD\u6570\u65F6\uFF0C\u8981\u4E48 await / return\uFF0C\u8981\u4E48\u663E\u5F0F\u6807\u6CE8\u4E3A\u4F55\u4E0D\u7B49\u5F85\uFF1B\u88F8\u8C03\u7528\u662F\u7F3A\u9677\u3002",
    // 限定到 JS 系：Java / Go 没有 Promise，注进去只会占名额
    languages: ["typescript", "javascript"],
    source: SOURCE2
  },
  {
    id: "general-no-empty-catch",
    level: "mandatory",
    dimension: "exception-log",
    title: "\u5F02\u5E38\u4E0D\u5F97\u9759\u9ED8\u541E\u6389",
    instruction: "catch \u91CC\u81F3\u5C11\u8981\u8BB0\u5F55\u6216\u4E0A\u629B\uFF1B\u53EA\u7559\u4E00\u4E2A\u7A7A\u5757\u4F1A\u8BA9\u7EBF\u4E0A\u95EE\u9898\u5931\u53BB\u552F\u4E00\u7EBF\u7D22\u3002",
    languages: ["*"],
    source: SOURCE2
  },
  {
    id: "general-early-return",
    level: "recommended",
    dimension: "coding",
    title: "\u4F18\u5148\u65E9\u8FD4\u56DE\uFF0C\u51CF\u5C11\u5D4C\u5957",
    instruction: "\u80FD\u7528\u65E9\u8FD4\u56DE\u6D88\u6389\u7684\u5D4C\u5957\u5C31\u6D88\u6389\uFF1B\u5224\u65AD\u6761\u4EF6\u5199\u5728\u524D\u9762\uFF0C\u4E3B\u6D41\u7A0B\u4E0D\u8981\u5305\u5728\u4E09\u5C42 if \u91CC\u3002",
    languages: ["*"],
    source: SOURCE2
  },
  {
    id: "general-test-one-assertion",
    level: "recommended",
    dimension: "unit-test",
    title: "\u4E00\u4E2A\u7528\u4F8B\u53EA\u9A8C\u8BC1\u4E00\u4EF6\u4E8B",
    instruction: "\u5355\u4E2A\u6D4B\u8BD5\u53EA\u65AD\u8A00\u4E00\u4E2A\u884C\u4E3A\uFF1B\u5931\u8D25\u65F6\u8981\u80FD\u4ECE\u540D\u5B57\u76F4\u63A5\u770B\u51FA\u54EA\u6761\u884C\u4E3A\u574F\u4E86\u3002",
    languages: ["*"],
    pathPatterns: ["**/*.test.*", "**/*.spec.*", "**/__tests__/**"],
    source: SOURCE2
  },
  {
    id: "general-api-boundary-validation",
    level: "mandatory",
    dimension: "security",
    title: "\u63A5\u53E3\u8FB9\u754C\u5FC5\u987B\u6821\u9A8C\u5165\u53C2",
    instruction: "\u5904\u7406\u5916\u90E8\u8F93\u5165\u7684\u5165\u53E3\u8981\u5148\u6821\u9A8C\u7ED3\u6784\u518D\u4F7F\u7528\uFF1B\u5185\u90E8\u8C03\u7528\u53EF\u4EE5\u4FE1\u4EFB\uFF0C\u8FB9\u754C\u4E0D\u884C\u3002",
    languages: ["*"],
    pathPatterns: ["**/api/**", "**/routes/**", "**/controllers/**", "**/handlers/**"],
    source: SOURCE2
  },
  {
    id: "general-no-hardcoded-secret",
    level: "mandatory",
    dimension: "security",
    title: "\u4E0D\u5F97\u5728\u6E90\u7801\u91CC\u5199\u6B7B\u51ED\u8BC1",
    instruction: "\u5BC6\u94A5\u3001\u53E3\u4EE4\u3001\u4EE4\u724C\u4ECE\u73AF\u5883\u53D8\u91CF\u6216\u5BC6\u94A5\u670D\u52A1\u8BFB\u53D6\uFF0C\u5199\u5B57\u9762\u91CF\u7B49\u4E8E\u628A\u5B83\u6C38\u4E45\u7559\u5728\u7248\u672C\u5386\u53F2\u91CC\u3002",
    languages: ["*"],
    source: SOURCE2
  }
];

// src/core/reviewers/rules/java-build.ts
var BASIS_PREFIX = "\u300A\u963F\u91CC\u5DF4\u5DF4Java\u5F00\u53D1\u624B\u518C\u300Bv1.3.0";
var SOURCE3 = {
  name: "\u300A\u963F\u91CC\u5DF4\u5DF4Java\u5F00\u53D1\u624B\u518C\u300B\u8981\u70B9\u63D0\u70BC\uFF08\u8868\u8FF0\u81EA\u64B0\uFF09",
  url: "https://github.com/alibaba/p3c",
  license: "own",
  modified: "\u4EC5\u63D0\u70BC\u89C4\u5219\u8981\u6C42\uFF0C\u7528\u672C\u9879\u76EE\u81EA\u5DF1\u7684\u8BDD\u91CD\u5199\uFF0C\u672A\u590D\u5236\u6761\u6587\u539F\u6587"
};
function rule2(id, level, dimension, instruction, clause, languages, basis) {
  return {
    id,
    level,
    dimension,
    title: instruction.slice(0, 30),
    instruction,
    languages,
    clauses: clause,
    source: { ...SOURCE3, basis: `${BASIS_PREFIX} ${basis}` }
  };
}
var JAVA_BUILD_RULES = {
  entries: [
    // ── 应用分层 ──────────────────────────────────────────────────────────
    rule2(
      "java-dao-exception-wrap",
      "reference",
      "architecture",
      "DAO \u5C42\u628A\u5E95\u5C42\u5F02\u5E38\u7EDF\u4E00\u5305\u88C5\u6210\u81EA\u5B9A\u4E49\u5F02\u5E38\u518D\u4E0A\u629B\uFF0C\u4E14\u4E0D\u5728\u8FD9\u91CC\u6253\u65E5\u5FD7\u2014\u2014\u65E5\u5FD7\u7531\u66F4\u4E0A\u5C42\u5728\u62FF\u5230\u5B8C\u6574\u4E0A\u4E0B\u6587\u540E\u6253\u4E00\u6B21\u3002",
      ["eng-layer-2"],
      ["java"],
      "\u5DE5\u7A0B\u7ED3\u6784\xB7\u5E94\u7528\u5206\u5C42"
    ),
    rule2(
      "java-domain-model-naming",
      "reference",
      "architecture",
      "\u9886\u57DF\u6A21\u578B\u6309\u804C\u8D23\u5206\u5F00\uFF1ADO \u5BF9\u5E94\u8868\u7ED3\u6784\u3001DTO \u7528\u4E8E\u8DE8\u5C42\u4F20\u8F93\u3001VO \u7528\u4E8E\u5C55\u793A\uFF0C\u4E0D\u8981\u628A\u4E09\u8005\u5408\u6210\u4E00\u4E2A\u7C7B\u3002",
      ["eng-layer-3"],
      ["java"],
      "\u5DE5\u7A0B\u7ED3\u6784\xB7\u5E94\u7528\u5206\u5C42"
    ),
    // ── 二方库依赖 ────────────────────────────────────────────────────────
    rule2(
      "java-gav-format",
      "mandatory",
      "architecture",
      "GroupID \u6309 com.{\u516C\u53F8}.{\u4E1A\u52A1\u7EBF}[.{\u5B50\u4E1A\u52A1\u7EBF}] \u7EC4\u7EC7\uFF0C\u6700\u591A\u56DB\u7EA7\uFF1BArtifactID \u7528\u4EA7\u54C1\u7EBF\u540D\u3002",
      ["eng-lib-1"],
      ["xml"],
      "\u5DE5\u7A0B\u7ED3\u6784\xB7\u4E8C\u65B9\u5E93\u4F9D\u8D56"
    ),
    rule2(
      "java-semver-format",
      "mandatory",
      "architecture",
      "\u4E8C\u65B9\u5E93\u7248\u672C\u53F7\u7528\u300C\u4E3B.\u6B21.\u4FEE\u8BA2\u300D\u4E09\u6BB5\u5F0F\uFF1A\u4E3B\u7248\u672C\u5BF9\u5E94\u4E0D\u517C\u5BB9\u6539\u52A8\uFF0C\u6B21\u7248\u672C\u5BF9\u5E94\u517C\u5BB9\u7684\u65B0\u529F\u80FD\uFF0C\u4FEE\u8BA2\u5BF9\u5E94\u517C\u5BB9\u7684\u95EE\u9898\u4FEE\u590D\u3002",
      ["eng-lib-2"],
      ["xml"],
      "\u5DE5\u7A0B\u7ED3\u6784\xB7\u4E8C\u65B9\u5E93\u4F9D\u8D56"
    ),
    rule2(
      "java-api-no-enum-return",
      "mandatory",
      "architecture",
      "\u4E8C\u65B9\u5E93\u5BF9\u5916\u63A5\u53E3\u7684\u8FD4\u56DE\u503C\u4E0D\u4F7F\u7528\u679A\u4E3E\u7C7B\u578B\uFF08\u4E5F\u4E0D\u653E\u5728\u8FD4\u56DE\u7684 POJO \u91CC\uFF09\uFF1A\u8C03\u7528\u65B9\u5347\u7EA7\u4E0D\u540C\u6B65\u65F6\u65E0\u6CD5\u53CD\u5E8F\u5217\u5316\u3002",
      ["eng-lib-5"],
      ["java"],
      "\u5DE5\u7A0B\u7ED3\u6784\xB7\u4E8C\u65B9\u5E93\u4F9D\u8D56"
    ),
    rule2(
      "java-duplicate-artifact-version",
      "mandatory",
      "architecture",
      "\u540C\u4E00\u4E2A GroupId + ArtifactId \u5728\u540C\u4E00\u4EFD pom \u91CC\u4E0D\u5F97\u58F0\u660E\u4E24\u4E2A\u4E0D\u540C\u7248\u672C\uFF0C\u9760 dependencyManagement \u7EDF\u4E00\u3002",
      ["eng-lib-7"],
      ["xml"],
      "\u5DE5\u7A0B\u7ED3\u6784\xB7\u4E8C\u65B9\u5E93\u4F9D\u8D56"
    ),
    rule2(
      "java-pom-dependency-blocks",
      "recommended",
      "architecture",
      "\u4F9D\u8D56\u58F0\u660E\u653E <dependencies>\uFF0C\u7248\u672C\u7EDF\u4E00\u653E <dependencyManagement>\uFF0C\u4E24\u8005\u4E0D\u8981\u6DF7\u5199\u3002",
      ["eng-lib-8"],
      ["xml"],
      "\u5DE5\u7A0B\u7ED3\u6784\xB7\u4E8C\u65B9\u5E93\u4F9D\u8D56"
    ),
    // ── 服务器 ────────────────────────────────────────────────────────────
    rule2(
      "java-jvm-heapdump",
      "recommended",
      "architecture",
      "JVM \u542F\u52A8\u53C2\u6570\u52A0 -XX:+HeapDumpOnOutOfMemoryError \u5E76\u6307\u5B9A dump \u8DEF\u5F84\uFF0C\u5426\u5219 OOM \u73B0\u573A\u76F4\u63A5\u4E22\u5931\u3002",
      ["eng-server-3"],
      ["xml"],
      "\u5DE5\u7A0B\u7ED3\u6784\xB7\u670D\u52A1\u5668"
    ),
    rule2(
      "java-jvm-heap-fixed",
      "recommended",
      "architecture",
      "\u7EBF\u4E0A\u73AF\u5883 -Xms \u4E0E -Xmx \u8BBE\u6210\u76F8\u540C\u503C\uFF0C\u907F\u514D\u5806\u4F38\u7F29\u5E26\u6765\u7684\u989D\u5916 GC \u538B\u529B\u3002",
      ["eng-server-4"],
      ["xml"],
      "\u5DE5\u7A0B\u7ED3\u6784\xB7\u670D\u52A1\u5668"
    ),
    rule2(
      "java-redirect-internal",
      "reference",
      "architecture",
      "\u670D\u52A1\u5668\u5185\u90E8\u8DF3\u8F6C\u7528 forward\uFF0C\u5916\u90E8\u5730\u5740\u7528\u7EDF\u4E00\u7684 URL \u62FC\u88C5\u5DE5\u5177\u751F\u6210\uFF0C\u4E0D\u8981\u624B\u5199\u5B57\u7B26\u4E32\u62FC\u63A5\u3002",
      ["eng-server-5"],
      ["java"],
      "\u5DE5\u7A0B\u7ED3\u6784\xB7\u670D\u52A1\u5668"
    )
  ]
};

// src/core/reviewers/rules/java-core.ts
var BASIS_PREFIX2 = "\u300A\u963F\u91CC\u5DF4\u5DF4Java\u5F00\u53D1\u624B\u518C\u300Bv1.3.0";
var SOURCE4 = {
  name: "\u300A\u963F\u91CC\u5DF4\u5DF4Java\u5F00\u53D1\u624B\u518C\u300B\u8981\u70B9\u63D0\u70BC\uFF08\u8868\u8FF0\u81EA\u64B0\uFF09",
  url: "https://github.com/alibaba/p3c",
  license: "own",
  modified: "\u4EC5\u63D0\u70BC\u89C4\u5219\u8981\u6C42\uFF0C\u7528\u672C\u9879\u76EE\u81EA\u5DF1\u7684\u8BDD\u91CD\u5199\uFF0C\u672A\u590D\u5236\u6761\u6587\u539F\u6587"
};
function rule3(id, level, dimension, instruction, clause, basis) {
  return {
    id,
    level,
    dimension,
    title: instruction.slice(0, 30),
    instruction,
    languages: ["java"],
    clauses: clause,
    source: { ...SOURCE4, basis: `${BASIS_PREFIX2} ${basis}` }
  };
}
var JAVA_CORE_RULES = {
  entries: [
    // ── 命名补充 ──────────────────────────────────────────────────────────
    rule3(
      "java-array-bracket",
      "mandatory",
      "naming",
      "\u6570\u7EC4\u7684\u4E2D\u62EC\u53F7\u8DDF\u5728\u7C7B\u578B\u540E\u9762\uFF1A\u5199 String[] args\uFF0C\u4E0D\u5199 String args[]\u3002",
      ["naming-6"],
      "\u7F16\u7A0B\u89C4\u7EA6\xB7\u547D\u540D\u98CE\u683C"
    ),
    rule3(
      "java-package-naming",
      "mandatory",
      "naming",
      "\u5305\u540D\u5168\u5C0F\u5199\uFF0C\u6BCF\u6BB5\u53EA\u6709\u4E00\u4E2A\u81EA\u7136\u8BED\u4E49\u7684\u82F1\u6587\u5355\u8BCD\uFF0C\u7528\u5355\u6570\u5F62\u5F0F\u3002",
      ["naming-8"],
      "\u7F16\u7A0B\u89C4\u7EA6\xB7\u547D\u540D\u98CE\u683C"
    ),
    rule3(
      "java-enum-naming",
      "reference",
      "naming",
      "\u679A\u4E3E\u7C7B\u540D\u4EE5 Enum \u7ED3\u5C3E\uFF0C\u679A\u4E3E\u6210\u5458\u5168\u5927\u5199\u3001\u4E0B\u5212\u7EBF\u5206\u9694\u3002",
      ["naming-13"],
      "\u7F16\u7A0B\u89C4\u7EA6\xB7\u547D\u540D\u98CE\u683C"
    ),
    // ── OOP 补充 ──────────────────────────────────────────────────────────
    rule3(
      "java-static-access",
      "mandatory",
      "coding",
      "\u8BBF\u95EE\u9759\u6001\u6210\u5458\u76F4\u63A5\u7528\u7C7B\u540D\uFF0C\u4E0D\u8981\u7ED5\u5BF9\u8C61\u5F15\u7528\u2014\u2014\u540E\u8005\u4F1A\u8BA9\u4EBA\u8BEF\u4EE5\u4E3A\u5B83\u662F\u5B9E\u4F8B\u6210\u5458\u3002",
      ["oop-1"],
      "\u7F16\u7A0B\u89C4\u7EA6\xB7OOP \u89C4\u7EA6"
    ),
    rule3(
      "java-varargs-type",
      "mandatory",
      "coding",
      "\u53EF\u53D8\u53C2\u6570\u53EA\u5728\u53C2\u6570\u7C7B\u578B\u4E00\u81F4\u3001\u8BED\u4E49\u76F8\u540C\u65F6\u4F7F\u7528\uFF1B\u4E0D\u8981\u7528 Object... \u63A5\u6536\u4EFB\u610F\u53C2\u6570\u3002",
      ["oop-3"],
      "\u7F16\u7A0B\u89C4\u7EA6\xB7OOP \u89C4\u7EA6"
    ),
    rule3(
      "java-signature-stability",
      "mandatory",
      "coding",
      "\u5BF9\u5916\u66B4\u9732\u6216\u4E8C\u65B9\u5E93\u4F9D\u8D56\u7684\u63A5\u53E3\u65B9\u6CD5\u4E0D\u5F97\u968F\u610F\u6539\u7B7E\u540D\uFF1B\u5E9F\u5F03\u65F6\u5FC5\u987B\u6807 @Deprecated \u5E76\u5728\u6CE8\u91CA\u91CC\u5199\u660E\u66FF\u4EE3\u65B9\u6848\u3002",
      ["oop-4"],
      "\u7F16\u7A0B\u89C4\u7EA6\xB7OOP \u89C4\u7EA6"
    ),
    rule3(
      "java-no-deprecated-usage",
      "mandatory",
      "coding",
      "\u65B0\u4EE3\u7801\u4E0D\u5F97\u8C03\u7528\u5DF2\u6807 @Deprecated \u7684\u7C7B\u6216\u65B9\u6CD5\uFF0C\u6539\u7528\u6CE8\u91CA\u91CC\u6307\u51FA\u7684\u66FF\u4EE3\u5B9E\u73B0\u3002",
      ["oop-5"],
      "\u7F16\u7A0B\u89C4\u7EA6\xB7OOP \u89C4\u7EA6"
    ),
    rule3(
      "java-pojo-wrapper-type",
      "mandatory",
      "coding",
      "POJO \u5C5E\u6027\u4E0E RPC \u63A5\u53E3\u7684\u51FA\u5165\u53C2\u4F7F\u7528\u5305\u88C5\u7C7B\u578B\uFF0C\u5C40\u90E8\u53D8\u91CF\u7528\u57FA\u672C\u7C7B\u578B\u2014\u2014POJO \u7528\u57FA\u672C\u7C7B\u578B\u4F1A\u8BA9\u300C\u672A\u8D4B\u503C\u300D\u548C\u300C\u96F6\u503C\u300D\u65E0\u6CD5\u533A\u5206\u3002",
      ["oop-8"],
      "\u7F16\u7A0B\u89C4\u7EA6\xB7OOP \u89C4\u7EA6"
    ),
    rule3(
      "java-pojo-no-default-value",
      "mandatory",
      "coding",
      "DO/DTO/VO \u7684\u5C5E\u6027\u4E0D\u8981\u5199\u9ED8\u8BA4\u503C\uFF0C\u521D\u503C\u8BE5\u7531\u4F7F\u7528\u65B9\u663E\u5F0F\u8D4B\u503C\u3002",
      ["oop-9"],
      "\u7F16\u7A0B\u89C4\u7EA6\xB7OOP \u89C4\u7EA6"
    ),
    rule3(
      "java-serial-version-uid",
      "mandatory",
      "coding",
      "\u5E8F\u5217\u5316\u7C7B\u7684 serialVersionUID \u53EA\u5728\u5B8C\u5168\u4E0D\u517C\u5BB9\u5347\u7EA7\u65F6\u4FEE\u6539\uFF1B\u4EC5\u65B0\u589E\u5B57\u6BB5\u4E0D\u8981\u52A8\u5B83\u3002",
      ["oop-10"],
      "\u7F16\u7A0B\u89C4\u7EA6\xB7OOP \u89C4\u7EA6"
    ),
    rule3(
      "java-constructor-no-logic",
      "mandatory",
      "coding",
      "\u6784\u9020\u65B9\u6CD5\u53EA\u505A\u8D4B\u503C\uFF0C\u4E0D\u5199\u4E1A\u52A1\u903B\u8F91\u3001\u4E0D\u53D1\u8FDC\u7A0B\u8C03\u7528\u3001\u4E0D\u505A IO\uFF1B\u521D\u59CB\u5316\u903B\u8F91\u653E\u5355\u72EC\u7684 init \u65B9\u6CD5\u3002",
      ["oop-11"],
      "\u7F16\u7A0B\u89C4\u7EA6\xB7OOP \u89C4\u7EA6"
    ),
    rule3(
      "java-pojo-tostring",
      "mandatory",
      "coding",
      "POJO \u5FC5\u987B\u5B9E\u73B0 toString\uFF1B\u7EE7\u627F\u7236\u7C7B\u65F6\u628A super.toString() \u4E32\u8FDB\u6765\uFF0C\u5426\u5219\u6392\u67E5\u65E5\u5FD7\u65F6\u770B\u4E0D\u5230\u7236\u7C7B\u5B57\u6BB5\u3002",
      ["oop-12"],
      "\u7F16\u7A0B\u89C4\u7EA6\xB7OOP \u89C4\u7EA6"
    ),
    rule3(
      "java-split-tail-check",
      "recommended",
      "coding",
      "\u7528 split \u7684\u7ED3\u679C\u6309\u7D22\u5F15\u53D6\u503C\u524D\uFF0C\u5148\u5224\u65AD\u672B\u6BB5\u662F\u5426\u4E3A\u7A7A\uFF1A\u7ED3\u5C3E\u5206\u9694\u7B26\u4E0D\u4F1A\u4EA7\u751F\u5C3E\u968F\u7A7A\u5143\u7D20\u3002",
      ["oop-13"],
      "\u7F16\u7A0B\u89C4\u7EA6\xB7OOP \u89C4\u7EA6"
    ),
    rule3(
      "java-accessor-no-logic",
      "recommended",
      "coding",
      "getter/setter \u91CC\u4E0D\u5199\u4E1A\u52A1\u903B\u8F91\uFF1Bsetter \u7528 this.\u6210\u5458 = \u53C2\u6570 \u7684\u5F62\u5F0F\u8D4B\u503C\u3002",
      ["oop-16"],
      "\u7F16\u7A0B\u89C4\u7EA6\xB7OOP \u89C4\u7EA6"
    ),
    rule3(
      "java-clone-caution",
      "recommended",
      "coding",
      "\u614E\u7528 Object.clone\uFF1A\u5B83\u662F\u6D45\u62F7\u8D1D\uFF0C\u4E14\u7ED5\u8FC7\u6784\u9020\u65B9\u6CD5\u3002\u9700\u8981\u590D\u5236\u65F6\u7528\u62F7\u8D1D\u6784\u9020\u6216\u663E\u5F0F\u9010\u5B57\u6BB5\u8D4B\u503C\u3002",
      ["oop-19"],
      "\u7F16\u7A0B\u89C4\u7EA6\xB7OOP \u89C4\u7EA6"
    ),
    rule3(
      "java-access-modifier-strict",
      "recommended",
      "coding",
      "\u8BBF\u95EE\u63A7\u5236\u4ECE\u4E25\uFF1A\u5DE5\u5177\u7C7B\u6784\u9020\u65B9\u6CD5\u8BBE\u4E3A private\uFF0C\u53EA\u5728\u672C\u7C7B\u7528\u7684\u6210\u5458\u8BBE\u4E3A private\uFF0C\u4E0D\u4E3A\u65B9\u4FBF\u800C\u653E\u5BBD\u53EF\u89C1\u6027\u3002",
      ["oop-20"],
      "\u7F16\u7A0B\u89C4\u7EA6\xB7OOP \u89C4\u7EA6"
    ),
    // ── 集合补充 ──────────────────────────────────────────────────────────
    rule3(
      "java-equals-hashcode-pair",
      "mandatory",
      "coding",
      "\u91CD\u5199 equals \u5C31\u5FC5\u987B\u91CD\u5199 hashCode\uFF1B\u8981\u653E\u8FDB Set \u6216\u4F5C Map \u952E\u7684\u5BF9\u8C61\uFF0C\u4E24\u4E2A\u90FD\u8981\u91CD\u5199\u3002",
      ["coll-1"],
      "\u7F16\u7A0B\u89C4\u7EA6\xB7\u96C6\u5408\u5904\u7406"
    ),
    rule3(
      "java-toarray-typed",
      "mandatory",
      "coding",
      "\u96C6\u5408\u8F6C\u6570\u7EC4\u7528 toArray(new T[0]) \u6216 toArray(new T[size])\uFF0C\u4E0D\u8981\u7528\u65E0\u53C2 toArray \u518D\u5F3A\u8F6C\u3002",
      ["coll-4"],
      "\u7F16\u7A0B\u89C4\u7EA6\xB7\u96C6\u5408\u5904\u7406"
    ),
    rule3(
      "java-generic-wildcard",
      "mandatory",
      "coding",
      "<? extends T> \u7684\u96C6\u5408\u4E0D\u80FD\u5199\u5165\uFF0C<? super T> \u7684\u96C6\u5408\u4E0D\u80FD\u8BFB\u53D6\uFF1B\u4F5C\u4E3A\u53C2\u6570\u7C7B\u578B\u65F6\u6309\u300C\u751F\u4EA7\u8005 extends\u3001\u6D88\u8D39\u8005 super\u300D\u9009\u3002",
      ["coll-6"],
      "\u7F16\u7A0B\u89C4\u7EA6\xB7\u96C6\u5408\u5904\u7406"
    ),
    rule3(
      "java-comparator-contract",
      "mandatory",
      "coding",
      "Comparator \u5FC5\u987B\u6EE1\u8DB3\u81EA\u53CD\u3001\u4F20\u9012\u3001\u4E00\u81F4\u4E09\u6761\u7EA6\u5B9A\uFF1B\u4E0D\u8981\u7528\u300C\u4E24\u4E2A\u503C\u76F8\u51CF\u300D\u5B9E\u73B0\u6BD4\u8F83\uFF0C\u6EA2\u51FA\u4F1A\u7834\u574F\u6392\u5E8F\u3002",
      ["coll-8"],
      "\u7F16\u7A0B\u89C4\u7EA6\xB7\u96C6\u5408\u5904\u7406"
    ),
    rule3(
      "java-map-null-key",
      "recommended",
      "coding",
      "\u6CE8\u610F\u5404 Map \u5B9E\u73B0\u80FD\u5426\u5B58 null \u952E\u503C\uFF1AConcurrentHashMap \u4E0E Hashtable \u90FD\u4E0D\u5141\u8BB8 null \u952E\u548C null \u503C\u3002",
      ["coll-11"],
      "\u7F16\u7A0B\u89C4\u7EA6\xB7\u96C6\u5408\u5904\u7406"
    ),
    rule3(
      "java-set-for-dedup",
      "reference",
      "coding",
      "\u53BB\u91CD\u7528 Set\uFF0C\u4E0D\u8981\u7528 List.contains \u9010\u4E2A\u6BD4\u5BF9\u2014\u2014\u540E\u8005\u662F\u5E73\u65B9\u7EA7\u590D\u6742\u5EA6\u3002",
      ["coll-13"],
      "\u7F16\u7A0B\u89C4\u7EA6\xB7\u96C6\u5408\u5904\u7406"
    ),
    // ── 并发 ──────────────────────────────────────────────────────────────
    rule3(
      "java-singleton-thread-safe",
      "mandatory",
      "coding",
      "\u5355\u4F8B\u7684\u5B9E\u4F8B\u5316\u5FC5\u987B\u7EBF\u7A0B\u5B89\u5168\uFF0C\u4E14\u5355\u4F8B\u91CC\u7684\u53EF\u53D8\u72B6\u6001\u4E5F\u8981\u8003\u8651\u5E76\u53D1\u8BBF\u95EE\u3002",
      ["concur-1"],
      "\u7F16\u7A0B\u89C4\u7EA6\xB7\u5E76\u53D1\u5904\u7406"
    ),
    rule3(
      "java-thread-naming",
      "mandatory",
      "coding",
      "\u521B\u5EFA\u7EBF\u7A0B\u6216\u7EBF\u7A0B\u6C60\u5FC5\u987B\u6307\u5B9A\u6709\u610F\u4E49\u7684\u7EBF\u7A0B\u540D\uFF08\u542B\u4E1A\u52A1\u6807\u8BC6\uFF09\uFF0C\u5426\u5219\u51FA\u95EE\u9898\u65F6\u65E0\u6CD5\u4ECE\u7EBF\u7A0B\u6808\u5B9A\u4F4D\u3002",
      ["concur-2"],
      "\u7F16\u7A0B\u89C4\u7EA6\xB7\u5E76\u53D1\u5904\u7406"
    ),
    rule3(
      "java-no-raw-thread",
      "mandatory",
      "coding",
      "\u4E0D\u5F97\u663E\u5F0F new Thread \u6216 new Thread(...).start()\uFF0C\u7EBF\u7A0B\u7EDF\u4E00\u7531\u7EBF\u7A0B\u6C60\u63D0\u4F9B\u3002",
      ["concur-3"],
      "\u7F16\u7A0B\u89C4\u7EA6\xB7\u5E76\u53D1\u5904\u7406"
    ),
    rule3(
      "java-no-executors",
      "mandatory",
      "coding",
      "\u7EBF\u7A0B\u6C60\u7528 new ThreadPoolExecutor(...) \u663E\u5F0F\u6784\u9020\u5E76\u6307\u5B9A\u961F\u5217\u4E0E\u62D2\u7EDD\u7B56\u7565\uFF0C\u4E0D\u7528 Executors \u7684\u5DE5\u5382\u65B9\u6CD5\u2014\u2014\u90A3\u4E9B\u65B9\u6CD5\u7684\u961F\u5217\u65E0\u754C\uFF0C\u4F1A OOM\u3002",
      ["concur-4"],
      "\u7F16\u7A0B\u89C4\u7EA6\xB7\u5E76\u53D1\u5904\u7406"
    ),
    rule3(
      "java-simpledateformat-thread",
      "mandatory",
      "coding",
      "SimpleDateFormat \u4E0D\u8981\u4F5C\u4E3A static \u5B57\u6BB5\u5171\u4EAB\uFF1B\u5FC5\u987B\u5171\u4EAB\u65F6\u52A0\u9501\uFF0C\u6216\u6539\u7528 DateTimeFormatter\u3002",
      ["concur-5"],
      "\u7F16\u7A0B\u89C4\u7EA6\xB7\u5E76\u53D1\u5904\u7406"
    ),
    rule3(
      "java-lost-update",
      "mandatory",
      "coding",
      "\u5E76\u53D1\u66F4\u65B0\u540C\u4E00\u884C\u8BB0\u5F55\u8981\u9632\u4E22\u5931\u66F4\u65B0\uFF1A\u5E94\u7528\u5C42\u52A0\u9501\u3001\u7F13\u5B58\u52A0\u9501\uFF0C\u6216\u6570\u636E\u5E93\u4E50\u89C2\u9501\uFF08\u7528 version \u4F5C\u66F4\u65B0\u6761\u4EF6\uFF09\u3002",
      ["concur-8"],
      "\u7F16\u7A0B\u89C4\u7EA6\xB7\u5E76\u53D1\u5904\u7406"
    ),
    rule3(
      "java-no-timer",
      "mandatory",
      "coding",
      "\u591A\u4EFB\u52A1\u5B9A\u65F6\u4E0D\u8981\u7528 Timer\uFF1A\u4E00\u4E2A\u4EFB\u52A1\u629B\u5F02\u5E38\u4F1A\u8BA9\u5176\u4F59\u4EFB\u52A1\u5168\u90E8\u7EC8\u6B62\u3002\u6539\u7528 ScheduledExecutorService\u3002",
      ["concur-9"],
      "\u7F16\u7A0B\u89C4\u7EA6\xB7\u5E76\u53D1\u5904\u7406"
    ),
    rule3(
      "java-countdown-latch-finally",
      "recommended",
      "coding",
      "CountDownLatch \u7684 countDown() \u653E\u8FDB finally\uFF0C\u5426\u5219\u4EFB\u52A1\u629B\u5F02\u5E38\u4F1A\u8BA9\u7B49\u5F85\u65B9\u4E00\u76F4\u6302\u5230\u8D85\u65F6\u3002",
      ["concur-10"],
      "\u7F16\u7A0B\u89C4\u7EA6\xB7\u5E76\u53D1\u5904\u7406"
    ),
    rule3(
      "java-random-shared",
      "recommended",
      "coding",
      "Random \u5B9E\u4F8B\u4E0D\u8981\u8DE8\u7EBF\u7A0B\u5171\u4EAB\uFF0C\u4E89\u7528\u540C\u4E00\u4E2A seed \u4F1A\u663E\u8457\u964D\u901F\uFF1B\u5E76\u53D1\u573A\u666F\u7528 ThreadLocalRandom\u3002",
      ["concur-11"],
      "\u7F16\u7A0B\u89C4\u7EA6\xB7\u5E76\u53D1\u5904\u7406"
    ),
    rule3(
      "java-dcl-volatile",
      "recommended",
      "coding",
      "\u53CC\u91CD\u68C0\u67E5\u9501\u61D2\u52A0\u8F7D\uFF0C\u5B9E\u4F8B\u5B57\u6BB5\u5FC5\u987B\u52A0 volatile\uFF0C\u5426\u5219\u53EF\u80FD\u62FF\u5230\u672A\u521D\u59CB\u5316\u5B8C\u6210\u7684\u5BF9\u8C61\u3002",
      ["concur-12"],
      "\u7F16\u7A0B\u89C4\u7EA6\xB7\u5E76\u53D1\u5904\u7406"
    ),
    rule3(
      "java-hashmap-shared-mutation",
      "reference",
      "coding",
      "\u5171\u4EAB\u4E14\u4F1A\u88AB\u5E76\u53D1\u5199\u7684\u573A\u666F\u4E0D\u8981\u7528 HashMap\uFF08\u6269\u5BB9\u53EF\u80FD\u5F62\u6210\u6B7B\u94FE\uFF09\uFF0C\u6539\u7528 ConcurrentHashMap\u3002",
      ["concur-14"],
      "\u7F16\u7A0B\u89C4\u7EA6\xB7\u5E76\u53D1\u5904\u7406"
    ),
    rule3(
      "java-threadlocal-static",
      "reference",
      "coding",
      "ThreadLocal \u7528 static final \u4FEE\u9970\uFF0C\u907F\u514D\u6BCF\u4E2A\u5B9E\u4F8B\u5404\u6301\u4E00\u4EFD\u9020\u6210\u6CC4\u6F0F\u3002",
      ["concur-15"],
      "\u7F16\u7A0B\u89C4\u7EA6\xB7\u5E76\u53D1\u5904\u7406"
    ),
    // ── 控制语句 ──────────────────────────────────────────────────────────
    rule3(
      "java-switch-default",
      "mandatory",
      "coding",
      "switch \u6BCF\u4E2A case \u90FD\u8981\u4EE5 break/return \u7ED3\u675F\uFF0C\u9700\u8981\u8D2F\u7A7F\u65F6\u5FC5\u987B\u6CE8\u91CA\u8BF4\u660E\uFF1B\u5FC5\u987B\u6709 default \u4E14\u653E\u5728\u6700\u540E\uFF0C\u54EA\u6015\u91CC\u9762\u662F\u7A7A\u7684\u3002",
      ["ctrl-1"],
      "\u7F16\u7A0B\u89C4\u7EA6\xB7\u63A7\u5236\u8BED\u53E5"
    ),
    rule3(
      "java-mandatory-braces",
      "mandatory",
      "coding",
      "if/else/for/while/do \u4E00\u5F8B\u5E26\u5927\u62EC\u53F7\uFF0C\u5373\u4F7F\u53EA\u6709\u4E00\u884C\u3002\u7701\u7565\u5927\u62EC\u53F7\u662F\u5386\u53F2\u4E0A\u4E00\u7C7B\u8457\u540D\u7EBF\u4E0A\u4E8B\u6545\u7684\u6210\u56E0\u3002",
      ["ctrl-2"],
      "\u7F16\u7A0B\u89C4\u7EA6\xB7\u63A7\u5236\u8BED\u53E5"
    ),
    rule3(
      "java-early-return",
      "recommended",
      "coding",
      "\u5F02\u5E38\u5206\u652F\u7528\u65E9\u8FD4\u56DE\u5904\u7406\uFF0C\u628A\u4E3B\u6D41\u7A0B\u7559\u5728\u6700\u5916\u5C42\uFF0C\u4E0D\u8981\u7528\u529B\u5C42\u5C42\u5D4C\u5957\u7684 if-else \u8868\u8FBE\u3002",
      ["ctrl-3"],
      "\u7F16\u7A0B\u89C4\u7EA6\xB7\u63A7\u5236\u8BED\u53E5"
    ),
    rule3(
      "java-loop-hoist",
      "recommended",
      "coding",
      "\u5FAA\u73AF\u4F53\u5185\u4E0D\u505A\u53EF\u5916\u63D0\u7684\u64CD\u4F5C\uFF1A\u5BF9\u8C61\u521B\u5EFA\u3001\u8FDE\u63A5\u83B7\u53D6\u3001\u4E0D\u53D8\u7684\u5224\u65AD\u90FD\u63D0\u5230\u5FAA\u73AF\u5916\u3002",
      ["ctrl-5"],
      "\u7F16\u7A0B\u89C4\u7EA6\xB7\u63A7\u5236\u8BED\u53E5"
    ),
    // ── 注释 ──────────────────────────────────────────────────────────────
    rule3(
      "java-javadoc-required",
      "mandatory",
      "coding",
      "\u7C7B\u3001\u7C7B\u5C5E\u6027\u3001\u7C7B\u65B9\u6CD5\u4EE5\u53CA\u6240\u6709\u62BD\u8C61\u65B9\u6CD5\u4E0E\u63A5\u53E3\u65B9\u6CD5\uFF0C\u5FC5\u987B\u7528 /** */ \u5F62\u5F0F\u7684 Javadoc\uFF1B\u63A5\u53E3\u65B9\u6CD5\u8FD8\u8981\u8BF4\u660E\u5B83\u505A\u4EC0\u4E48\uFF0C\u800C\u4E0D\u53EA\u662F\u5199\u53C2\u6570\u3002",
      ["comment-1", "comment-2"],
      "\u7F16\u7A0B\u89C4\u7EA6\xB7\u6CE8\u91CA\u89C4\u7EA6"
    ),
    rule3(
      "java-class-author-date",
      "mandatory",
      "coding",
      "\u7C7B\u6CE8\u91CA\u91CC\u5FC5\u987B\u5199\u521B\u5EFA\u8005\u4E0E\u521B\u5EFA\u65E5\u671F\uFF0C\u65B9\u4FBF\u51FA\u95EE\u9898\u65F6\u627E\u5230\u6700\u65E9\u5199\u5B83\u7684\u4EBA\u3002",
      ["comment-3"],
      "\u7F16\u7A0B\u89C4\u7EA6\xB7\u6CE8\u91CA\u89C4\u7EA6"
    ),
    rule3(
      "java-enum-field-comment",
      "mandatory",
      "coding",
      "\u679A\u4E3E\u7684\u6BCF\u4E2A\u6210\u5458\u90FD\u8981\u5199\u6CE8\u91CA\u8BF4\u660E\u5B83\u4EE3\u8868\u4EC0\u4E48\uFF0C\u5426\u5219\u8BFB\u4EE3\u7801\u7684\u4EBA\u53EA\u80FD\u731C\u3002",
      ["comment-5"],
      "\u7F16\u7A0B\u89C4\u7EA6\xB7\u6CE8\u91CA\u89C4\u7EA6"
    ),
    rule3(
      "java-no-commented-code",
      "reference",
      "coding",
      "\u4E0D\u8981\u7559\u5927\u6BB5\u88AB\u6CE8\u91CA\u6389\u7684\u4EE3\u7801\u3002\u786E\u5B9E\u6709\u7528\u5C31\u5728\u4E0A\u65B9\u8BF4\u660E\u539F\u56E0\uFF0C\u6CA1\u7528\u5C31\u5220\u6389\u2014\u2014\u5B83\u53EA\u4F1A\u8BA9\u540E\u6765\u7684\u4EBA\u4E0D\u6562\u52A8\u3002",
      ["comment-8"],
      "\u7F16\u7A0B\u89C4\u7EA6\xB7\u6CE8\u91CA\u89C4\u7EA6"
    ),
    rule3(
      "java-todo-format",
      "reference",
      "coding",
      "TODO/FIXME \u5FC5\u987B\u5199\u660E\u6807\u8BB0\u4EBA\u4E0E\u6807\u8BB0\u65F6\u95F4\uFF1B\u65E0\u4E3B\u7684 TODO \u6C38\u8FDC\u4E0D\u4F1A\u88AB\u5904\u7406\u3002",
      ["comment-11"],
      "\u7F16\u7A0B\u89C4\u7EA6\xB7\u6CE8\u91CA\u89C4\u7EA6"
    ),
    // ── 其它 ──────────────────────────────────────────────────────────────
    rule3(
      "java-regex-precompile",
      "mandatory",
      "coding",
      "\u6B63\u5219\u8868\u8FBE\u5F0F\u7F16\u8BD1\u6210 static final Pattern \u590D\u7528\uFF0C\u4E0D\u8981\u5728\u9AD8\u9891\u8DEF\u5F84\u91CC\u53CD\u590D Pattern.compile\u3002",
      ["misc-1"],
      "\u7F16\u7A0B\u89C4\u7EA6\xB7\u5176\u5B83"
    ),
    rule3(
      "java-velocity-escape",
      "mandatory",
      "coding",
      "\u6A21\u677F\u91CC\u8F93\u51FA\u540E\u7AEF\u53D8\u91CF\u7528 $!{var}\uFF08\u5E26\u611F\u53F9\u53F7\uFF09\uFF0C\u7F3A\u503C\u65F6\u624D\u4E0D\u4F1A\u628A\u8868\u8FBE\u5F0F\u539F\u6837\u6253\u5728\u9875\u9762\u4E0A\u3002",
      ["misc-3"],
      "\u7F16\u7A0B\u89C4\u7EA6\xB7\u5176\u5B83"
    ),
    rule3(
      "java-random-int",
      "mandatory",
      "coding",
      "\u53D6\u6574\u6570\u968F\u673A\u6570\u7528 Random.nextInt(bound)\uFF0C\u4E0D\u8981\u628A Math.random() \u4E58\u500D\u6570\u518D\u53D6\u6574\u2014\u2014\u90A3\u4F1A\u5F15\u5165\u5206\u5E03\u504F\u5DEE\u548C\u8FB9\u754C\u9519\u8BEF\u3002",
      ["misc-4"],
      "\u7F16\u7A0B\u89C4\u7EA6\xB7\u5176\u5B83"
    ),
    rule3(
      "java-current-time-millis",
      "mandatory",
      "coding",
      "\u53D6\u5F53\u524D\u6BEB\u79D2\u7528 System.currentTimeMillis()\uFF0C\u4E0D\u8981 new Date().getTime() \u591A\u9020\u4E00\u4E2A\u5BF9\u8C61\u3002",
      ["misc-5"],
      "\u7F16\u7A0B\u89C4\u7EA6\xB7\u5176\u5B83"
    )
  ]
};

// src/core/reviewers/rules/java-db.ts
var BASIS_PREFIX3 = "\u300A\u963F\u91CC\u5DF4\u5DF4Java\u5F00\u53D1\u624B\u518C\u300Bv1.3.0";
var SOURCE5 = {
  name: "\u300A\u963F\u91CC\u5DF4\u5DF4Java\u5F00\u53D1\u624B\u518C\u300B\u8981\u70B9\u63D0\u70BC\uFF08\u8868\u8FF0\u81EA\u64B0\uFF09",
  url: "https://github.com/alibaba/p3c",
  license: "own",
  modified: "\u4EC5\u63D0\u70BC\u89C4\u5219\u8981\u6C42\uFF0C\u7528\u672C\u9879\u76EE\u81EA\u5DF1\u7684\u8BDD\u91CD\u5199\uFF0C\u672A\u590D\u5236\u6761\u6587\u539F\u6587"
};
var SQL_ONLY = ["sql"];
var SQL_ANYWHERE = ["sql", "xml", "java"];
function rule4(id, level, instruction, clause, languages, basis) {
  return {
    id,
    level,
    dimension: "database",
    title: instruction.slice(0, 30),
    instruction,
    languages,
    clauses: clause,
    source: { ...SOURCE5, basis: `${BASIS_PREFIX3} ${basis}` }
  };
}
var JAVA_DB_RULES = {
  entries: [
    // ── 建表 ──────────────────────────────────────────────────────────────
    rule4(
      "java-db-name-lowercase",
      "mandatory",
      "\u8868\u540D\u4E0E\u5B57\u6BB5\u540D\u53EA\u7528\u5C0F\u5199\u5B57\u6BCD\u3001\u6570\u5B57\u548C\u4E0B\u5212\u7EBF\uFF1A\u4E0D\u4EE5\u6570\u5B57\u5F00\u5934\uFF0C\u4E0D\u51FA\u73B0\u8FDE\u7EED\u4E24\u4E2A\u4E0B\u5212\u7EBF\uFF0C\u4E0D\u7528\u590D\u6570\u8868\u540D\u3002",
      ["db-table-2", "db-table-3"],
      SQL_ONLY,
      "MySQL \u6570\u636E\u5E93\xB7\u5EFA\u8868\u89C4\u7EA6"
    ),
    rule4(
      "java-db-no-reserved-word",
      "mandatory",
      "\u4E0D\u5F97\u7528 SQL \u4FDD\u7559\u5B57\u505A\u8868\u540D\u6216\u5B57\u6BB5\u540D\uFF08desc\u3001order\u3001range\u3001match\u3001group\u3001key \u7B49\uFF09\u3002",
      ["db-table-4"],
      SQL_ONLY,
      "MySQL \u6570\u636E\u5E93\xB7\u5EFA\u8868\u89C4\u7EA6"
    ),
    rule4(
      "java-db-char-for-fixed",
      "mandatory",
      "\u5B58\u50A8\u957F\u5EA6\u51E0\u4E4E\u56FA\u5B9A\u7684\u5B57\u7B26\u4E32\u7528 char \u800C\u4E0D\u662F varchar\u3002",
      ["db-table-7"],
      SQL_ONLY,
      "MySQL \u6570\u636E\u5E93\xB7\u5EFA\u8868\u89C4\u7EA6"
    ),
    rule4(
      "java-db-column-comment",
      "recommended",
      "\u6BCF\u4E2A\u5B57\u6BB5\u90FD\u8981\u6709 COMMENT\uFF0C\u8BF4\u660E\u5B83\u5B58\u4EC0\u4E48\u3001\u53D6\u503C\u8303\u56F4\uFF1B\u5B57\u6BB5\u542B\u4E49\u53D8\u5316\u65F6\u540C\u6B65\u6539\u6CE8\u91CA\u3002",
      ["db-table-12"],
      SQL_ONLY,
      "MySQL \u6570\u636E\u5E93\xB7\u5EFA\u8868\u89C4\u7EA6"
    ),
    // ── 索引 ──────────────────────────────────────────────────────────────
    rule4(
      "java-db-unique-index",
      "mandatory",
      "\u4E1A\u52A1\u4E0A\u5177\u6709\u552F\u4E00\u6027\u7684\u5B57\u6BB5\uFF08\u542B\u7EC4\u5408\uFF09\u5FC5\u987B\u5EFA\u552F\u4E00\u7D22\u5F15\uFF0C\u4E0D\u8981\u53EA\u9760\u5E94\u7528\u5C42\u5148\u67E5\u540E\u63D2\u3002",
      ["db-index-1"],
      SQL_ONLY,
      "MySQL \u6570\u636E\u5E93\xB7\u7D22\u5F15\u89C4\u7EA6"
    ),
    rule4(
      "java-db-join-limit",
      "mandatory",
      "\u4E00\u6761\u67E5\u8BE2\u6700\u591A\u5173\u8054\u4E09\u5F20\u8868\uFF1Bjoin \u7684\u5B57\u6BB5\u7C7B\u578B\u5FC5\u987B\u5B8C\u5168\u4E00\u81F4\uFF0C\u4E14\u88AB\u5173\u8054\u5B57\u6BB5\u8981\u6709\u7D22\u5F15\u3002",
      ["db-index-2"],
      SQL_ANYWHERE,
      "MySQL \u6570\u636E\u5E93\xB7\u7D22\u5F15\u89C4\u7EA6"
    ),
    rule4(
      "java-db-index-length",
      "mandatory",
      "\u7ED9 varchar \u5B57\u6BB5\u5EFA\u7D22\u5F15\u5FC5\u987B\u6307\u5B9A\u524D\u7F00\u957F\u5EA6\uFF0C\u4E0D\u8981\u5BF9\u5168\u5B57\u6BB5\u5EFA\u3002",
      ["db-index-3"],
      SQL_ONLY,
      "MySQL \u6570\u636E\u5E93\xB7\u7D22\u5F15\u89C4\u7EA6"
    ),
    rule4(
      "java-db-no-leading-wildcard",
      "mandatory",
      "\u7981\u6B62 LIKE \u4EE5 % \u5F00\u5934\uFF08\u5DE6\u6A21\u7CCA\u6216\u5168\u6A21\u7CCA\uFF09\uFF0C\u7D22\u5F15\u4F1A\u5931\u6548\uFF1B\u8FD9\u7C7B\u68C0\u7D22\u5E94\u4EA4\u7ED9\u641C\u7D22\u5F15\u64CE\u3002",
      ["db-index-4"],
      SQL_ANYWHERE,
      "MySQL \u6570\u636E\u5E93\xB7\u7D22\u5F15\u89C4\u7EA6"
    ),
    rule4(
      "java-db-orderby-index",
      "recommended",
      "order by \u7684\u5B57\u6BB5\u987A\u5E8F\u8981\u4E0E\u7EC4\u5408\u7D22\u5F15\u4E00\u81F4\uFF0C\u5426\u5219\u4F1A\u8D70 file_sort\u3002",
      ["db-index-5"],
      SQL_ANYWHERE,
      "MySQL \u6570\u636E\u5E93\xB7\u7D22\u5F15\u89C4\u7EA6"
    ),
    rule4(
      "java-db-implicit-cast",
      "recommended",
      "\u67E5\u8BE2\u6761\u4EF6\u91CC\u7684\u5B57\u9762\u91CF\u7C7B\u578B\u8981\u4E0E\u5B57\u6BB5\u7C7B\u578B\u4E00\u81F4\uFF0C\u907F\u514D\u9690\u5F0F\u8F6C\u6362\u5BFC\u81F4\u7D22\u5F15\u5931\u6548\uFF08\u5982\u5B57\u7B26\u4E32\u5B57\u6BB5\u4F20\u6570\u5B57\uFF09\u3002",
      ["db-index-10"],
      SQL_ANYWHERE,
      "MySQL \u6570\u636E\u5E93\xB7\u7D22\u5F15\u89C4\u7EA6"
    ),
    // ── SQL 语句 ──────────────────────────────────────────────────────────
    rule4(
      "java-sql-count-star",
      "mandatory",
      "\u7EDF\u8BA1\u884C\u6570\u7528 count(*)\uFF0C\u4E0D\u8981\u7528 count(\u5217\u540D) \u6216 count(\u5E38\u91CF)\u3002",
      ["db-sql-1"],
      SQL_ANYWHERE,
      "MySQL \u6570\u636E\u5E93\xB7SQL \u8BED\u53E5"
    ),
    rule4(
      "java-sql-sum-null",
      "mandatory",
      "sum() \u5728\u5168\u5217\u4E3A NULL \u65F6\u8FD4\u56DE NULL\uFF0C\u63A5\u6536\u8FD4\u56DE\u503C\u65F6\u8981\u9632\u81EA\u52A8\u62C6\u7BB1\u7684\u7A7A\u6307\u9488\u3002",
      ["db-sql-3"],
      SQL_ANYWHERE,
      "MySQL \u6570\u636E\u5E93\xB7SQL \u8BED\u53E5"
    ),
    rule4(
      "java-sql-null-check",
      "mandatory",
      "\u5224\u65AD\u5B57\u6BB5\u662F\u5426\u4E3A NULL \u7528 ISNULL() \u6216 IS NULL\uFF0C\u4E0D\u8981\u7528 = NULL\u3002",
      ["db-sql-4"],
      SQL_ANYWHERE,
      "MySQL \u6570\u636E\u5E93\xB7SQL \u8BED\u53E5"
    ),
    rule4(
      "java-sql-pagination-early-return",
      "mandatory",
      "\u5206\u9875\u67E5\u8BE2\u5148 count\uFF0C\u4E3A 0 \u65F6\u76F4\u63A5\u8FD4\u56DE\u7A7A\u7ED3\u679C\uFF0C\u4E0D\u8981\u518D\u6267\u884C\u540E\u7EED\u7684\u5217\u8868\u67E5\u8BE2\u3002",
      ["db-sql-5"],
      SQL_ANYWHERE,
      "MySQL \u6570\u636E\u5E93\xB7SQL \u8BED\u53E5"
    ),
    rule4(
      "java-db-no-foreign-key",
      "mandatory",
      "\u4E0D\u4F7F\u7528\u5916\u952E\u4E0E\u7EA7\u8054\u66F4\u65B0/\u5220\u9664\uFF0C\u5173\u8054\u5173\u7CFB\u5728\u5E94\u7528\u5C42\u7EF4\u62A4\u3002",
      ["db-sql-6"],
      SQL_ONLY,
      "MySQL \u6570\u636E\u5E93\xB7SQL \u8BED\u53E5"
    ),
    rule4(
      "java-db-no-procedure",
      "mandatory",
      "\u4E0D\u4F7F\u7528\u5B58\u50A8\u8FC7\u7A0B\u4E0E\u89E6\u53D1\u5668\uFF0C\u903B\u8F91\u5199\u5728\u5E94\u7528\u5C42\u3002",
      ["db-sql-7"],
      SQL_ONLY,
      "MySQL \u6570\u636E\u5E93\xB7SQL \u8BED\u53E5"
    ),
    rule4(
      "java-db-select-before-write",
      "mandatory",
      "\u6570\u636E\u8BA2\u6B63\uFF1A\u5148 select \u786E\u8BA4\u5F71\u54CD\u8303\u56F4\uFF0C\u518D\u6267\u884C update/delete\uFF1B\u6279\u91CF\u5220\u9664\u5FC5\u987B\u6709\u660E\u786E\u7684 where \u6761\u4EF6\u3002",
      ["db-sql-8"],
      SQL_ANYWHERE,
      "MySQL \u6570\u636E\u5E93\xB7SQL \u8BED\u53E5"
    ),
    rule4(
      "java-sql-in-limit",
      "recommended",
      "in \u540E\u9762\u7684\u96C6\u5408\u5143\u7D20\u63A7\u5236\u5728 1000 \u4E2A\u4EE5\u5185\uFF1B\u66F4\u591A\u65F6\u6539\u9020\u4E3A join \u6216\u5206\u6279\u3002",
      ["db-sql-9"],
      SQL_ANYWHERE,
      "MySQL \u6570\u636E\u5E93\xB7SQL \u8BED\u53E5"
    ),
    rule4(
      "java-db-no-truncate",
      "reference",
      "\u4E1A\u52A1\u4EE3\u7801\u91CC\u4E0D\u4F7F\u7528 TRUNCATE TABLE\uFF1A\u5B83\u4E0D\u8FDB\u4E8B\u52A1\u3001\u4E0D\u89E6\u53D1\u89E6\u53D1\u5668\uFF0C\u8BEF\u7528\u65E0\u6CD5\u56DE\u6EDA\u3002",
      ["db-sql-11"],
      SQL_ANYWHERE,
      "MySQL \u6570\u636E\u5E93\xB7SQL \u8BED\u53E5"
    ),
    // ── ORM ───────────────────────────────────────────────────────────────
    rule4(
      "java-sql-no-select-star",
      "mandatory",
      "\u67E5\u8BE2\u5FC5\u987B\u5199\u660E\u5B57\u6BB5\u5217\u8868\uFF0C\u4E0D\u5F97\u4F7F\u7528 select *\u3002",
      ["db-orm-1"],
      SQL_ANYWHERE,
      "MySQL \u6570\u636E\u5E93\xB7ORM \u6620\u5C04"
    ),
    rule4(
      "java-orm-boolean-mapping",
      "mandatory",
      "\u6570\u636E\u5E93\u662F\u662F\u4E0E\u5426\u8BED\u4E49\u7684\u5B57\u6BB5\u7528 is_xxx\uFF0CPOJO \u91CC\u5BF9\u5E94\u5C5E\u6027\u53BB\u6389 is \u524D\u7F00\uFF0C\u5728 resultMap \u4E2D\u663E\u5F0F\u6620\u5C04\u3002",
      ["db-orm-2"],
      SQL_ANYWHERE,
      "MySQL \u6570\u636E\u5E93\xB7ORM \u6620\u5C04"
    ),
    rule4(
      "java-orm-resultmap",
      "mandatory",
      "\u4E0D\u8981\u7528 resultClass/resultType \u8BA9\u5B83\u81EA\u52A8\u731C\u5B57\u6BB5\u6620\u5C04\uFF0C\u663E\u5F0F\u5199 resultMap\uFF1B\u6BCF\u5F20\u8868\u5BF9\u5E94\u4E00\u4E2A\u660E\u786E\u7684\u6620\u5C04\u3002",
      ["db-orm-3"],
      SQL_ANYWHERE,
      "MySQL \u6570\u636E\u5E93\xB7ORM \u6620\u5C04"
    ),
    rule4(
      "java-mybatis-no-dollar",
      "mandatory",
      "MyBatis \u53C2\u6570\u4E00\u5F8B\u7528 #{}\uFF0C\u7981\u6B62 ${}\u2014\u2014\u540E\u8005\u662F\u5B57\u7B26\u4E32\u62FC\u63A5\uFF0C\u76F4\u63A5\u6784\u6210 SQL \u6CE8\u5165\u3002",
      ["db-orm-4"],
      ["xml", "java"],
      "MySQL \u6570\u636E\u5E93\xB7ORM \u6620\u5C04"
    ),
    rule4(
      "java-orm-no-map-result",
      "mandatory",
      "\u67E5\u8BE2\u7ED3\u679C\u5FC5\u987B\u6620\u5C04\u5230\u660E\u786E\u7684\u9886\u57DF\u5BF9\u8C61\uFF0C\u4E0D\u5141\u8BB8\u7528 HashMap/Hashtable \u63A5\u6536\u3002",
      ["db-orm-6"],
      ["xml", "java"],
      "MySQL \u6570\u636E\u5E93\xB7ORM \u6620\u5C04"
    ),
    rule4(
      "java-db-gmt-modified",
      "mandatory",
      "update \u8BED\u53E5\u5FC5\u987B\u540C\u65F6\u66F4\u65B0 gmt_modified \u4E3A\u5F53\u524D\u65F6\u95F4\u3002",
      ["db-orm-7"],
      SQL_ANYWHERE,
      "MySQL \u6570\u636E\u5E93\xB7ORM \u6620\u5C04"
    ),
    rule4(
      "java-db-narrow-update",
      "recommended",
      "\u4E0D\u8981\u5199\u300C\u4F20\u5165\u6574\u4E2A POJO \u5C31\u5168\u5B57\u6BB5\u66F4\u65B0\u300D\u7684\u63A5\u53E3\uFF0C\u53EA\u66F4\u65B0\u8C03\u7528\u65B9\u660E\u786E\u8981\u6539\u7684\u5B57\u6BB5\u3002",
      ["db-orm-8"],
      SQL_ANYWHERE,
      "MySQL \u6570\u636E\u5E93\xB7ORM \u6620\u5C04"
    ),
    rule4(
      "java-transaction-scope",
      "reference",
      "@Transactional \u53EA\u52A0\u5728\u771F\u6B63\u9700\u8981\u539F\u5B50\u6027\u7684\u8FB9\u754C\u4E0A\uFF1B\u5B83\u4F1A\u5F71\u54CD\u5E76\u53D1\u80FD\u529B\uFF0C\u4E14\u52A0\u4E86\u4E8B\u52A1\u5C31\u8981\u60F3\u6E05\u7F13\u5B58\u3001\u6D88\u606F\u3001\u68C0\u7D22\u7684\u56DE\u6EDA\u3002",
      ["db-orm-9"],
      ["java"],
      "MySQL \u6570\u636E\u5E93\xB7ORM \u6620\u5C04"
    )
  ]
};

// src/core/reviewers/rules/java-format.ts
var BASIS_PREFIX4 = "\u300A\u963F\u91CC\u5DF4\u5DF4Java\u5F00\u53D1\u624B\u518C\u300Bv1.3.0";
var SOURCE6 = {
  name: "\u300A\u963F\u91CC\u5DF4\u5DF4Java\u5F00\u53D1\u624B\u518C\u300B\u8981\u70B9\u63D0\u70BC\uFF08\u8868\u8FF0\u81EA\u64B0\uFF09",
  url: "https://github.com/alibaba/p3c",
  license: "own",
  modified: "\u4EC5\u63D0\u70BC\u89C4\u5219\u8981\u6C42\uFF0C\u7528\u672C\u9879\u76EE\u81EA\u5DF1\u7684\u8BDD\u91CD\u5199\uFF0C\u672A\u590D\u5236\u6761\u6587\u539F\u6587"
};
function rule5(id, level, instruction, clause) {
  return {
    id,
    level,
    dimension: "format",
    title: instruction.slice(0, 30),
    instruction,
    languages: ["java"],
    clauses: clause,
    source: { ...SOURCE6, basis: `${BASIS_PREFIX4} \u7F16\u7A0B\u89C4\u7EA6\xB7\u4EE3\u7801\u683C\u5F0F` }
  };
}
var JAVA_FORMAT_RULES = {
  entries: [
    rule5(
      "java-format-brace",
      "mandatory",
      "\u7A7A\u4EE3\u7801\u5757\u5199\u6210 {}\uFF1B\u975E\u7A7A\u65F6\u5DE6\u5927\u62EC\u53F7\u4E0D\u6362\u884C\u3001\u5927\u62EC\u53F7\u540E\u6362\u884C\u3001\u53F3\u5927\u62EC\u53F7\u524D\u6362\u884C\uFF1Bcatch/finally/else \u524D\u4E0D\u6362\u884C\u3002",
      ["format-1"]
    ),
    rule5(
      "java-format-paren-space",
      "mandatory",
      "\u5C0F\u62EC\u53F7\u5185\u4FA7\u4E0D\u7559\u7A7A\u683C\uFF1A\u5199 foo(a, b)\uFF0C\u4E0D\u5199 foo( a, b )\u3002",
      ["format-2"]
    ),
    rule5(
      "java-format-keyword-space",
      "mandatory",
      "if/for/while/switch/do \u7B49\u5173\u952E\u5B57\u4E0E\u5DE6\u62EC\u53F7\u4E4B\u95F4\u5FC5\u987B\u6709\u4E00\u4E2A\u7A7A\u683C\u3002",
      ["format-3"]
    ),
    rule5("java-format-operator-space", "mandatory", "\u4E8C\u76EE\u4E0E\u4E09\u76EE\u8FD0\u7B97\u7B26\u4E24\u4FA7\u5404\u7559\u4E00\u4E2A\u7A7A\u683C\u3002", [
      "format-4"
    ]),
    rule5("java-format-indent", "mandatory", "\u7528 4 \u4E2A\u7A7A\u683C\u7F29\u8FDB\uFF0C\u4E0D\u7528 tab\u3002", ["format-5"]),
    rule5(
      "java-format-comment-space",
      "mandatory",
      "\u53CC\u659C\u7EBF\u4E0E\u6CE8\u91CA\u6B63\u6587\u4E4B\u95F4\u7559\u4E14\u53EA\u7559\u4E00\u4E2A\u7A7A\u683C\uFF1B\u65B9\u6CD5\u5185\u591A\u884C\u6CE8\u91CA\u4E0E\u4EE3\u7801\u5DE6\u5BF9\u9F50\u3002",
      ["format-6", "comment-4"]
    ),
    rule5(
      "java-format-line-length",
      "mandatory",
      "\u5355\u884C\u4E0D\u8D85\u8FC7 120 \u5B57\u7B26\uFF1B\u6362\u884C\u65F6\u7B2C\u4E8C\u884C\u8D77\u7F29\u8FDB 4 \u4E2A\u7A7A\u683C\uFF0C\u8FD0\u7B97\u7B26\u4E0E\u4E0B\u4E00\u884C\u540C\u884C\u9996\u3002",
      ["format-7"]
    ),
    rule5("java-format-comma-space", "mandatory", "\u65B9\u6CD5\u53C2\u6570\u5728\u5B9A\u4E49\u4E0E\u8C03\u7528\u65F6\uFF0C\u9017\u53F7\u540E\u52A0\u4E00\u4E2A\u7A7A\u683C\u3002", [
      "format-8"
    ]),
    rule5("java-format-encoding", "mandatory", "\u6E90\u6587\u4EF6\u7528 UTF-8 \u7F16\u7801\u3001LF \u6362\u884C\u7B26\uFF0C\u4E0D\u8981\u6DF7\u5165 CRLF\u3002", [
      "format-9"
    ]),
    rule5(
      "java-format-no-align",
      "recommended",
      "\u4E0D\u8981\u7528\u591A\u4F59\u7A7A\u683C\u628A\u67D0\u4E00\u884C\u4E0E\u4E0A\u4E00\u884C\u5BF9\u9F50\uFF0C\u90A3\u4F1A\u8BA9\u540E\u7EED\u6539\u52A8\u4EA7\u751F\u65E0\u610F\u4E49\u7684 diff\u3002",
      ["format-10"]
    ),
    rule5(
      "java-format-blank-line",
      "recommended",
      "\u4E0D\u540C\u8BED\u4E49\u7684\u8BED\u53E5\u7EC4\u4E4B\u95F4\u63D2\u5165\u4E00\u4E2A\u7A7A\u884C\uFF1B\u540C\u4E00\u903B\u8F91\u5185\u4E0D\u7559\u7A7A\u884C\u3002",
      ["format-11"]
    )
  ]
};

// src/core/reviewers/rules/java-quality.ts
var BASIS_PREFIX5 = "\u300A\u963F\u91CC\u5DF4\u5DF4Java\u5F00\u53D1\u624B\u518C\u300Bv1.3.0";
var SOURCE7 = {
  name: "\u300A\u963F\u91CC\u5DF4\u5DF4Java\u5F00\u53D1\u624B\u518C\u300B\u8981\u70B9\u63D0\u70BC\uFF08\u8868\u8FF0\u81EA\u64B0\uFF09",
  url: "https://github.com/alibaba/p3c",
  license: "own",
  modified: "\u4EC5\u63D0\u70BC\u89C4\u5219\u8981\u6C42\uFF0C\u7528\u672C\u9879\u76EE\u81EA\u5DF1\u7684\u8BDD\u91CD\u5199\uFF0C\u672A\u590D\u5236\u6761\u6587\u539F\u6587"
};
function rule6(id, level, dimension, instruction, clause, basis) {
  return {
    id,
    level,
    dimension,
    title: instruction.slice(0, 30),
    instruction,
    languages: ["java"],
    clauses: clause,
    source: { ...SOURCE7, basis: `${BASIS_PREFIX5} ${basis}` }
  };
}
var JAVA_QUALITY_RULES = {
  entries: [
    // ── 异常补充 ──────────────────────────────────────────────────────────
    rule6(
      "java-precheck-not-catch",
      "mandatory",
      "exception-log",
      "\u80FD\u7528\u524D\u7F6E\u68C0\u67E5\u89C4\u907F\u7684\u8FD0\u884C\u65F6\u5F02\u5E38\uFF08\u7A7A\u6307\u9488\u3001\u6570\u7EC4\u8D8A\u754C\u3001\u7C7B\u578B\u8F6C\u6362\uFF09\u5C31\u7528\u68C0\u67E5\u89C4\u907F\uFF0C\u4E0D\u8981\u9760 catch \u515C\u4F4F\u3002",
      ["exc-1"],
      "\u5F02\u5E38\u65E5\u5FD7\xB7\u5F02\u5E38\u5904\u7406"
    ),
    rule6(
      "java-transaction-rollback",
      "mandatory",
      "exception-log",
      "\u4E8B\u52A1\u65B9\u6CD5\u91CC catch \u4F4F\u5F02\u5E38\u540E\u5982\u679C\u4ECD\u9700\u56DE\u6EDA\uFF0C\u5FC5\u987B\u663E\u5F0F\u6807\u8BB0\u56DE\u6EDA\uFF08rollbackFor \u6216\u624B\u52A8\u56DE\u6EDA\uFF09\uFF0C\u5426\u5219\u4E8B\u52A1\u4F1A\u7167\u5E38\u63D0\u4EA4\u3002",
      ["exc-5"],
      "\u5F02\u5E38\u65E5\u5FD7\xB7\u5F02\u5E38\u5904\u7406"
    ),
    rule6(
      "java-finally-close-resource",
      "mandatory",
      "exception-log",
      "\u8D44\u6E90\u5FC5\u987B\u5728 finally \u4E2D\u5173\u95ED\uFF08\u6216\u7528 try-with-resources\uFF09\uFF0C\u4E14\u5173\u95ED\u52A8\u4F5C\u672C\u8EAB\u4E5F\u8981\u9632\u5F02\u5E38\u3002",
      ["exc-6"],
      "\u5F02\u5E38\u65E5\u5FD7\xB7\u5F02\u5E38\u5904\u7406"
    ),
    rule6(
      "java-catch-type-match",
      "mandatory",
      "exception-log",
      "\u6355\u83B7\u7684\u5F02\u5E38\u7C7B\u578B\u5FC5\u987B\u4E0E\u53EF\u80FD\u629B\u51FA\u7684\u7C7B\u578B\u5339\u914D\uFF0C\u6216\u8005\u662F\u5B83\u7684\u7236\u7C7B\uFF1B\u6355\u4E00\u4E2A\u4ECE\u4E0D\u629B\u51FA\u7684\u7C7B\u578B\u8BF4\u660E\u5224\u65AD\u9519\u4E86\u3002",
      ["exc-8"],
      "\u5F02\u5E38\u65E5\u5FD7\xB7\u5F02\u5E38\u5904\u7406"
    ),
    rule6(
      "java-null-return-doc",
      "recommended",
      "exception-log",
      "\u65B9\u6CD5\u53EF\u80FD\u8FD4\u56DE null \u65F6\u5FC5\u987B\u5728 Javadoc \u91CC\u5199\u660E\uFF0C\u8BA9\u8C03\u7528\u65B9\u77E5\u9053\u8981\u505A\u975E\u7A7A\u5224\u65AD\u3002",
      ["exc-9"],
      "\u5F02\u5E38\u65E5\u5FD7\xB7\u5F02\u5E38\u5904\u7406"
    ),
    rule6(
      "java-unboxing-npe",
      "recommended",
      "exception-log",
      "\u57FA\u672C\u7C7B\u578B\u63A5\u6536\u5305\u88C5\u7C7B\u578B\u7684\u8FD4\u56DE\u503C\u65F6\u4F1A\u81EA\u52A8\u62C6\u7BB1\uFF0C\u503C\u4E3A null \u5C31\u629B\u7A7A\u6307\u9488\uFF1B\u63A5\u53E3\u8FD4\u56DE\u503C\u3001\u6570\u636E\u5E93\u67E5\u8BE2\u7ED3\u679C\u5C24\u5176\u8981\u6CE8\u610F\u3002",
      ["exc-10"],
      "\u5F02\u5E38\u65E5\u5FD7\xB7\u5F02\u5E38\u5904\u7406"
    ),
    rule6(
      "java-specific-exception",
      "recommended",
      "exception-log",
      "\u629B\u5F02\u5E38\u8981\u7528\u6709\u4E1A\u52A1\u542B\u4E49\u7684\u81EA\u5B9A\u4E49\u5F02\u5E38\uFF1B\u4E0D\u8981\u76F4\u63A5 new RuntimeException()\uFF0C\u66F4\u4E0D\u8981\u629B Exception \u6216 Throwable\u3002",
      ["exc-11"],
      "\u5F02\u5E38\u65E5\u5FD7\xB7\u5F02\u5E38\u5904\u7406"
    ),
    // ── 日志补充 ──────────────────────────────────────────────────────────
    rule6(
      "java-log-slf4j-facade",
      "mandatory",
      "exception-log",
      "\u53EA\u7528 SLF4J \u7684 API\uFF08LoggerFactory.getLogger\uFF09\uFF0C\u4E0D\u76F4\u63A5\u4F9D\u8D56 Log4j/Logback \u7684\u5B9E\u73B0\u7C7B\u2014\u2014\u6362\u5B9E\u73B0\u65F6\u624D\u4E0D\u7528\u6539\u4EE3\u7801\u3002",
      ["log-1"],
      "\u5F02\u5E38\u65E5\u5FD7\xB7\u65E5\u5FD7\u89C4\u7EA6"
    ),
    // ── 单元测试补充 ──────────────────────────────────────────────────────
    rule6(
      "java-test-no-print",
      "mandatory",
      "unit-test",
      "\u6D4B\u8BD5\u7ED3\u679C\u5FC5\u987B\u9760\u65AD\u8A00\u8868\u8FBE\uFF0C\u4E0D\u5141\u8BB8\u7528 System.out \u6253\u5370\u540E\u4EBA\u5DE5\u6BD4\u5BF9\u2014\u2014\u90A3\u6837\u7684\u6D4B\u8BD5\u65E0\u6CD5\u81EA\u52A8\u5316\u6267\u884C\u3002",
      ["test-2"],
      "\u5355\u5143\u6D4B\u8BD5\xB7AIR \u539F\u5219"
    ),
    rule6(
      "java-test-independent",
      "mandatory",
      "unit-test",
      "\u7528\u4F8B\u4E4B\u95F4\u4E0D\u5F97\u76F8\u4E92\u8C03\u7528\uFF0C\u4E5F\u4E0D\u5F97\u4F9D\u8D56\u6267\u884C\u987A\u5E8F\uFF1B\u6BCF\u4E2A\u7528\u4F8B\u81EA\u5DF1\u51C6\u5907\u6570\u636E\u3001\u81EA\u5DF1\u6536\u5C3E\u3002",
      ["test-3"],
      "\u5355\u5143\u6D4B\u8BD5\xB7AIR \u539F\u5219"
    ),
    rule6(
      "java-test-no-external",
      "mandatory",
      "unit-test",
      "\u7528\u4F8B\u8981\u80FD\u91CD\u590D\u6267\u884C\uFF1A\u4E0D\u4F9D\u8D56\u56FA\u5B9A\u65F6\u949F\u3001\u4E0D\u4F9D\u8D56\u5916\u90E8\u670D\u52A1\u53EF\u7528\u3001\u4E0D\u4F9D\u8D56\u4E0A\u4E00\u6B21\u8FD0\u884C\u7559\u4E0B\u7684\u6570\u636E\u3002",
      ["test-4"],
      "\u5355\u5143\u6D4B\u8BD5\xB7AIR \u539F\u5219"
    ),
    rule6(
      "java-test-tx-rollback",
      "recommended",
      "unit-test",
      "\u6D89\u53CA\u6570\u636E\u5E93\u7684\u7528\u4F8B\u52A0\u4E8B\u52A1\u56DE\u6EDA\uFF08@Transactional + @Rollback\uFF09\uFF0C\u6216\u7ED9\u6D4B\u8BD5\u6570\u636E\u52A0\u7EDF\u4E00\u524D\u540E\u7F00\uFF0C\u907F\u514D\u810F\u6570\u636E\u3002",
      ["test-11"],
      "\u5355\u5143\u6D4B\u8BD5\xB7\u6570\u636E\u5E93\u76F8\u5173"
    ),
    // ── 安全补充 ──────────────────────────────────────────────────────────
    rule6(
      "java-xss-escape",
      "mandatory",
      "security",
      "\u8F93\u51FA\u5230\u9875\u9762\u7684\u7528\u6237\u6570\u636E\u5FC5\u987B\u8F6C\u4E49\uFF1B\u6A21\u677F\u5F15\u64CE\u7684\u9ED8\u8BA4\u8F6C\u4E49\u4E0D\u8981\u5173\uFF0C\u5BCC\u6587\u672C\u573A\u666F\u7528\u767D\u540D\u5355\u8FC7\u6EE4\u800C\u4E0D\u662F\u6574\u4F53\u653E\u884C\u3002",
      ["sec-5"],
      "\u5B89\u5168\u89C4\u7EA6"
    ),
    rule6(
      "java-replay-protection",
      "mandatory",
      "security",
      "\u6D89\u53CA\u77ED\u4FE1\u3001\u90AE\u4EF6\u3001\u652F\u4ED8\u3001\u4E0B\u5355\u7B49\u5E73\u53F0\u8D44\u6E90\u7684\u5199\u64CD\u4F5C\uFF0C\u5FC5\u987B\u505A\u9632\u91CD\u653E\uFF1A\u5E42\u7B49\u952E\u3001\u9891\u6B21\u9650\u5236\u6216\u9A8C\u8BC1\u7801\uFF0C\u7F3A\u4E00\u4E0D\u53EF\u3002",
      ["sec-7"],
      "\u5B89\u5168\u89C4\u7EA6"
    ),
    rule6(
      "java-ugc-risk-control",
      "recommended",
      "security",
      "\u7528\u6237\u751F\u6210\u5185\u5BB9\uFF08\u53D1\u5E16\u3001\u8BC4\u8BBA\u3001\u79C1\u4FE1\uFF09\u8981\u8D70\u9632\u5237\u4E0E\u5185\u5BB9\u98CE\u63A7\uFF08\u9891\u6B21\u9650\u5236\u3001\u8FDD\u7981\u8BCD\u8FC7\u6EE4\u3001\u4EBA\u5DE5\u5BA1\u6838\u515C\u5E95\uFF09\u3002",
      ["sec-8"],
      "\u5B89\u5168\u89C4\u7EA6"
    )
  ]
};

// src/core/reviewers/rules/java.ts
var BASIS_PREFIX6 = "\u300A\u963F\u91CC\u5DF4\u5DF4Java\u5F00\u53D1\u624B\u518C\u300Bv1.3.0";
var SOURCE8 = {
  name: "\u300A\u963F\u91CC\u5DF4\u5DF4Java\u5F00\u53D1\u624B\u518C\u300B\u8981\u70B9\u63D0\u70BC\uFF08\u8868\u8FF0\u81EA\u64B0\uFF09",
  url: "https://github.com/alibaba/p3c",
  license: "own",
  modified: "\u4EC5\u63D0\u70BC\u89C4\u5219\u8981\u6C42\uFF0C\u7528\u672C\u9879\u76EE\u81EA\u5DF1\u7684\u8BDD\u91CD\u5199\uFF0C\u672A\u590D\u5236\u6761\u6587\u539F\u6587"
};
var CLAUSES_OF = {
  "java-naming-case": ["naming-2", "naming-3", "naming-4"],
  "java-naming-no-pinyin": ["naming-1"],
  "java-boolean-no-is": ["naming-7"],
  "java-abstract-prefix": ["naming-5"],
  "java-service-dao-naming": ["naming-14"],
  "java-no-magic-value": ["const-1"],
  "java-long-uppercase-l": ["const-2"],
  "java-override-annotation": ["oop-2"],
  "java-equals-null-safe": ["oop-6"],
  "java-wrapper-equals": ["oop-7"],
  "java-pojo-tostring": ["oop-12"],
  "java-string-builder-in-loop": ["oop-17"],
  "java-no-remove-in-foreach": ["coll-7"],
  "java-arrays-aslist-immutable": ["coll-5"],
  "java-sublist-caution": ["coll-2", "coll-3"],
  "java-collection-capacity": ["coll-9", "misc-7"],
  "java-entryset-iteration": ["coll-10"],
  "java-interface-no-modifier": ["naming-12"],
  "java-catch-must-handle": ["exc-4"],
  "java-no-exception-for-flow": ["exc-2"],
  "java-narrow-try-scope": ["exc-3"],
  "java-finally-no-return": ["exc-7"],
  "java-log-slf4j-placeholder": ["log-4"],
  "java-log-with-context": ["log-6"],
  "java-test-air": ["test-1"],
  "java-test-location": ["test-7"],
  "java-test-coverage": ["test-8"],
  "java-test-db-independent": ["test-10"],
  "java-authz-check": ["sec-1"],
  "java-sql-param-binding": ["sec-3"],
  "java-input-validation": ["sec-4", "ctrl-6"],
  "java-sensitive-mask": ["sec-2"],
  "java-csrf-protection": ["sec-6"],
  "java-table-three-fields": ["db-table-9"],
  "java-decimal-not-float": ["db-table-6"],
  "java-is-xxx-tinyint": ["db-table-1"],
  "java-index-naming": ["db-table-5"],
  "java-varchar-length": ["db-table-8"],
  "java-no-snapshot-dependency": ["eng-lib-3"],
  "java-unified-version-variable": ["eng-lib-6"],
  "java-layer-dependency": ["eng-layer-1"]
};
var SQL_ONLY2 = /* @__PURE__ */ new Set([
  "java-table-three-fields",
  "java-decimal-not-float",
  "java-is-xxx-tinyint",
  "java-index-naming",
  "java-varchar-length"
]);
function rule7(id, level, dimension, instruction, basis) {
  return {
    id,
    level,
    dimension,
    title: instruction.slice(0, 30),
    instruction,
    languages: SQL_ONLY2.has(id) ? ["sql"] : ["java"],
    clauses: CLAUSES_OF[id] ?? [],
    source: { ...SOURCE8, basis: `${BASIS_PREFIX6} ${basis}` }
  };
}
var JAVA_RULES = {
  entries: [
    // ── 命名 ──────────────────────────────────────────────────────────────
    rule7(
      "java-naming-case",
      "mandatory",
      "naming",
      "\u7C7B\u540D\u7528\u5927\u9A7C\u5CF0\uFF0C\u65B9\u6CD5\u540D\u3001\u53C2\u6570\u540D\u3001\u6210\u5458\u53D8\u91CF\u3001\u5C40\u90E8\u53D8\u91CF\u7528\u5C0F\u9A7C\u5CF0\uFF0C\u5E38\u91CF\u5168\u5927\u5199\u4E0B\u5212\u7EBF\u5206\u9694\uFF0C\u5305\u540D\u5168\u5C0F\u5199\u3002",
      "\u7F16\u7A0B\u89C4\u7EA6\xB7\u547D\u540D\u98CE\u683C"
    ),
    rule7(
      "java-naming-no-pinyin",
      "mandatory",
      "naming",
      "\u547D\u540D\u4E0D\u5F97\u7528\u62FC\u97F3\u3001\u4E2D\u82F1\u6DF7\u5199\u6216\u7EAF\u4E2D\u6587\uFF0C\u4E5F\u4E0D\u8981\u7528\u671B\u6587\u4E0D\u77E5\u4E49\u7684\u7F29\u5199\u3002",
      "\u7F16\u7A0B\u89C4\u7EA6\xB7\u547D\u540D\u98CE\u683C"
    ),
    rule7(
      "java-boolean-no-is",
      "mandatory",
      "naming",
      "POJO \u7684\u5E03\u5C14\u5C5E\u6027\u4E0D\u8981\u52A0 is \u524D\u7F00\uFF0C\u90E8\u5206\u5E8F\u5217\u5316\u6846\u67B6\u4F1A\u628A\u5B83\u5F53\u6210 getter \u4ECE\u800C\u89E3\u6790\u9519\u5B57\u6BB5\u3002",
      "\u7F16\u7A0B\u89C4\u7EA6\xB7\u547D\u540D\u98CE\u683C"
    ),
    rule7(
      "java-abstract-prefix",
      "recommended",
      "naming",
      "\u62BD\u8C61\u7C7B\u540D\u4EE5 Abstract \u6216 Base \u5F00\u5934\uFF0C\u5F02\u5E38\u7C7B\u4EE5 Exception \u7ED3\u5C3E\uFF0C\u6D4B\u8BD5\u7C7B\u4EE5\u88AB\u6D4B\u7C7B\u540D\u5F00\u5934\u52A0 Test\u3002",
      "\u7F16\u7A0B\u89C4\u7EA6\xB7\u547D\u540D\u98CE\u683C"
    ),
    rule7(
      "java-service-dao-naming",
      "reference",
      "naming",
      "Service/DAO \u5C42\u65B9\u6CD5\u6309\u52A8\u8BCD\u524D\u7F00\u547D\u540D\uFF1A\u53D6\u5355\u4E2A\u7528 get\u3001\u53D6\u591A\u4E2A\u7528 list\u3001\u8BA1\u6570\u7528 count\u3001\u63D2\u5165\u7528 insert/save\u3001\u66F4\u65B0\u7528 update\u3001\u5220\u9664\u7528 remove/delete\u3002",
      "\u7F16\u7A0B\u89C4\u7EA6\xB7\u547D\u540D\u98CE\u683C"
    ),
    // ── 编程 ──────────────────────────────────────────────────────────────
    rule7(
      "java-no-magic-value",
      "mandatory",
      "coding",
      "\u4E0D\u5141\u8BB8\u672A\u5B9A\u4E49\u7684\u5E38\u91CF\u503C\uFF08\u9B54\u6CD5\u503C\uFF09\u76F4\u63A5\u51FA\u73B0\u5728\u4EE3\u7801\u91CC\uFF0C\u62BD\u6210\u6709\u540D\u5B57\u7684\u5E38\u91CF\u6216\u679A\u4E3E\u3002",
      "\u7F16\u7A0B\u89C4\u7EA6\xB7\u5E38\u91CF\u5B9A\u4E49"
    ),
    rule7(
      "java-long-uppercase-l",
      "mandatory",
      "coding",
      "long \u5B57\u9762\u91CF\u7528\u5927\u5199 L\uFF0C\u5C0F\u5199 l \u5BB9\u6613\u4E0E\u6570\u5B57 1 \u6DF7\u6DC6\u3002",
      "\u7F16\u7A0B\u89C4\u7EA6\xB7\u5E38\u91CF\u5B9A\u4E49"
    ),
    rule7(
      "java-override-annotation",
      "mandatory",
      "coding",
      "\u6240\u6709\u8986\u5199\u65B9\u6CD5\u5FC5\u987B\u52A0 @Override\uFF0C\u8BA9\u7F16\u8BD1\u671F\u5C31\u80FD\u53D1\u73B0\u7B7E\u540D\u5199\u9519\u3002",
      "\u7F16\u7A0B\u89C4\u7EA6\xB7OOP \u89C4\u7EA6"
    ),
    rule7(
      "java-equals-null-safe",
      "mandatory",
      "coding",
      "\u8C03\u7528 equals \u65F6\u628A\u5E38\u91CF\u6216\u786E\u5B9A\u975E\u7A7A\u7684\u5BF9\u8C61\u653E\u5728\u524D\u9762\uFF0C\u907F\u514D\u7A7A\u6307\u9488\u3002",
      "\u7F16\u7A0B\u89C4\u7EA6\xB7OOP \u89C4\u7EA6"
    ),
    rule7(
      "java-wrapper-equals",
      "mandatory",
      "coding",
      "\u5305\u88C5\u7C7B\u578B\u4E4B\u95F4\u6BD4\u8F83\u503C\u4E00\u5F8B\u7528 equals\uFF0C\u4E0D\u8981\u7528 ==\uFF08Integer \u7F13\u5B58\u8303\u56F4\u5916\u4F1A\u5F97\u5230\u53CD\u76F4\u89C9\u7ED3\u679C\uFF09\u3002",
      "\u7F16\u7A0B\u89C4\u7EA6\xB7OOP \u89C4\u7EA6"
    ),
    rule7(
      "java-no-remove-in-foreach",
      "mandatory",
      "coding",
      "\u4E0D\u8981\u5728 foreach \u5FAA\u73AF\u91CC\u5BF9\u96C6\u5408\u505A remove/add\uFF0C\u7528\u8FED\u4EE3\u5668\u6216 removeIf \u66FF\u4EE3\u3002",
      "\u7F16\u7A0B\u89C4\u7EA6\xB7\u96C6\u5408\u5904\u7406"
    ),
    rule7(
      "java-arrays-aslist-immutable",
      "mandatory",
      "coding",
      "Arrays.asList \u8FD4\u56DE\u7684\u662F\u56FA\u5B9A\u957F\u5EA6\u89C6\u56FE\uFF0C\u5BF9\u5B83 add/remove \u4F1A\u629B\u5F02\u5E38\uFF1B\u9700\u8981\u53EF\u53D8\u96C6\u5408\u8981\u518D\u5305\u4E00\u5C42\u3002",
      "\u7F16\u7A0B\u89C4\u7EA6\xB7\u96C6\u5408\u5904\u7406"
    ),
    rule7(
      "java-sublist-caution",
      "mandatory",
      "coding",
      "subList \u7684\u7ED3\u679C\u4E0D\u80FD\u5F3A\u8F6C\u6210 ArrayList\uFF0C\u4E14\u539F\u96C6\u5408\u5143\u7D20\u6570\u91CF\u53D8\u52A8\u4F1A\u8BA9\u5B50\u5217\u8868\u5931\u6548\u3002",
      "\u7F16\u7A0B\u89C4\u7EA6\xB7\u96C6\u5408\u5904\u7406"
    ),
    rule7(
      "java-string-builder-in-loop",
      "recommended",
      "coding",
      "\u5FAA\u73AF\u4F53\u5185\u62FC\u63A5\u5B57\u7B26\u4E32\u7528 StringBuilder\uFF0C\u4E0D\u8981\u7528 + \u53CD\u590D\u4EA7\u751F\u4E34\u65F6\u5BF9\u8C61\u3002",
      "\u7F16\u7A0B\u89C4\u7EA6\xB7OOP \u89C4\u7EA6"
    ),
    rule7(
      "java-collection-capacity",
      "recommended",
      "coding",
      "\u96C6\u5408\u521D\u59CB\u5316\u65F6\u6309\u9884\u4F30\u89C4\u6A21\u6307\u5B9A\u521D\u59CB\u5BB9\u91CF\uFF0C\u907F\u514D\u53CD\u590D\u6269\u5BB9\u3002",
      "\u7F16\u7A0B\u89C4\u7EA6\xB7\u96C6\u5408\u5904\u7406"
    ),
    rule7(
      "java-entryset-iteration",
      "recommended",
      "coding",
      "\u904D\u5386 Map \u7684\u952E\u503C\u5BF9\u7528 entrySet\uFF0C\u4E0D\u8981\u5148\u53D6 keySet \u518D\u9010\u4E2A get\u3002",
      "\u7F16\u7A0B\u89C4\u7EA6\xB7\u96C6\u5408\u5904\u7406"
    ),
    rule7(
      "java-interface-no-modifier",
      "reference",
      "coding",
      "\u63A5\u53E3\u91CC\u7684\u65B9\u6CD5\u4E0E\u5C5E\u6027\u4E0D\u9700\u8981\u5199 public \u7B49\u4FEE\u9970\u7B26\uFF0C\u4FDD\u6301\u7B80\u6D01\u5E76\u5199\u6E05\u8BED\u4E49\u3002",
      "\u7F16\u7A0B\u89C4\u7EA6\xB7\u547D\u540D\u98CE\u683C"
    ),
    // ── 异常与日志 ────────────────────────────────────────────────────────
    rule7(
      "java-catch-must-handle",
      "mandatory",
      "exception-log",
      "catch \u4F4F\u5C31\u5FC5\u987B\u5904\u7406\u6216\u5411\u4E0A\u629B\u51FA\uFF0C\u4E0D\u5141\u8BB8\u6355\u83B7\u540E\u4EC0\u4E48\u90FD\u4E0D\u505A\u3002",
      "\u5F02\u5E38\u65E5\u5FD7\xB7\u5F02\u5E38\u5904\u7406"
    ),
    rule7(
      "java-no-exception-for-flow",
      "mandatory",
      "exception-log",
      "\u5F02\u5E38\u4E0D\u8981\u7528\u6765\u505A\u6D41\u7A0B\u63A7\u5236\u6216\u6761\u4EF6\u63A7\u5236\uFF0C\u5B83\u7684\u5F00\u9500\u8FDC\u9AD8\u4E8E\u6761\u4EF6\u5206\u652F\u3002",
      "\u5F02\u5E38\u65E5\u5FD7\xB7\u5F02\u5E38\u5904\u7406"
    ),
    rule7(
      "java-narrow-try-scope",
      "mandatory",
      "exception-log",
      "try \u5757\u53EA\u5305\u53EF\u80FD\u629B\u5F02\u5E38\u7684\u6700\u5C0F\u8303\u56F4\uFF0C\u4E0D\u8981\u6574\u6BB5\u65B9\u6CD5\u4F53\u4E00\u8D77 try\u3002",
      "\u5F02\u5E38\u65E5\u5FD7\xB7\u5F02\u5E38\u5904\u7406"
    ),
    rule7(
      "java-finally-no-return",
      "mandatory",
      "exception-log",
      "finally \u5757\u91CC\u4E0D\u8981 return\uFF0C\u5B83\u4F1A\u8986\u76D6 try \u4E2D\u7684\u8FD4\u56DE\u503C\u5E76\u541E\u6389\u5F02\u5E38\u3002",
      "\u5F02\u5E38\u65E5\u5FD7\xB7\u5F02\u5E38\u5904\u7406"
    ),
    rule7(
      "java-log-slf4j-placeholder",
      "mandatory",
      "exception-log",
      "\u65E5\u5FD7\u4F9D\u8D56 SLF4J \u95E8\u9762\u5E76\u7528\u5360\u4F4D\u7B26\u4F20\u53C2\uFF0C\u4E0D\u8981\u76F4\u63A5\u8C03\u5177\u4F53\u65E5\u5FD7\u5B9E\u73B0\uFF0C\u4E5F\u4E0D\u8981\u7528\u5B57\u7B26\u4E32\u62FC\u63A5\u3002",
      "\u5F02\u5E38\u65E5\u5FD7\xB7\u65E5\u5FD7\u89C4\u7EA6"
    ),
    rule7(
      "java-log-with-context",
      "mandatory",
      "exception-log",
      "\u5F02\u5E38\u65E5\u5FD7\u8981\u540C\u65F6\u5305\u542B\u73B0\u573A\u4FE1\u606F\uFF08\u53C2\u6570\u3001\u5173\u952E\u6807\u8BC6\uFF09\u4E0E\u5F02\u5E38\u5806\u6808\uFF0C\u53EA\u6253\u4E00\u53E5\u300C\u5931\u8D25\u300D\u7B49\u4E8E\u6CA1\u6253\u3002",
      "\u5F02\u5E38\u65E5\u5FD7\xB7\u65E5\u5FD7\u89C4\u7EA6"
    ),
    // ── 单元测试 ──────────────────────────────────────────────────────────
    rule7(
      "java-test-air",
      "mandatory",
      "unit-test",
      "\u5355\u5143\u6D4B\u8BD5\u8981\u6EE1\u8DB3 AIR\uFF1A\u81EA\u52A8\u6267\u884C\u3001\u76F8\u4E92\u72EC\u7ACB\u3001\u53EF\u91CD\u590D\u8FD0\u884C\uFF0C\u4E0D\u53D7\u5916\u754C\u73AF\u5883\u4E0E\u6267\u884C\u987A\u5E8F\u5F71\u54CD\u3002",
      "\u5355\u5143\u6D4B\u8BD5\xB7AIR \u539F\u5219"
    ),
    rule7(
      "java-test-location",
      "mandatory",
      "unit-test",
      "\u6D4B\u8BD5\u4EE3\u7801\u653E\u5728 src/test/java \u4E0B\uFF0C\u4E0D\u8981\u6DF7\u8FDB\u4E1A\u52A1\u4EE3\u7801\u76EE\u5F55\u3002",
      "\u5355\u5143\u6D4B\u8BD5"
    ),
    rule7(
      "java-test-coverage",
      "recommended",
      "unit-test",
      "\u6838\u5FC3\u6A21\u5757\u7684\u8BED\u53E5\u8986\u76D6\u7387\u76EE\u6807 70% \u4EE5\u4E0A\uFF1B\u4E3A\u51D1\u8986\u76D6\u7387\u5199\u4E0D\u89C4\u8303\u6D4B\u8BD5\u4E0D\u5982\u4E0D\u5199\u3002",
      "\u5355\u5143\u6D4B\u8BD5"
    ),
    rule7(
      "java-test-db-independent",
      "recommended",
      "unit-test",
      "\u6D89\u53CA\u6570\u636E\u5E93\u7684\u6D4B\u8BD5\u4E0D\u8981\u5047\u8BBE\u5E93\u91CC\u5DF2\u6709\u6570\u636E\uFF0C\u5FC5\u8981\u65F6\u7528\u81EA\u52A8\u56DE\u6EDA\u907F\u514D\u7559\u4E0B\u810F\u6570\u636E\u3002",
      "\u5355\u5143\u6D4B\u8BD5"
    ),
    // ── 安全 ──────────────────────────────────────────────────────────────
    rule7(
      "java-authz-check",
      "mandatory",
      "security",
      "\u6D89\u53CA\u7528\u6237\u4E2A\u4EBA\u8D44\u6E90\u7684\u529F\u80FD\u5FC5\u987B\u505A\u6743\u9650\u4E0E\u5F52\u5C5E\u6821\u9A8C\uFF0C\u4E0D\u80FD\u53EA\u770B\u662F\u5426\u767B\u5F55\u3002",
      "\u5B89\u5168\u89C4\u7EA6"
    ),
    rule7(
      "java-sql-param-binding",
      "mandatory",
      "security",
      "SQL \u53C2\u6570\u4E00\u5F8B\u7528\u53C2\u6570\u7ED1\u5B9A\u6216\u5B57\u6BB5\u503C\u9650\u5B9A\uFF0C\u7981\u6B62\u628A\u7528\u6237\u8F93\u5165\u62FC\u8FDB\u8BED\u53E5\u3002",
      "\u5B89\u5168\u89C4\u7EA6"
    ),
    rule7(
      "java-input-validation",
      "mandatory",
      "security",
      "\u5916\u90E8\u8BF7\u6C42\u7684\u4EFB\u4F55\u53C2\u6570\u90FD\u5FC5\u987B\u505A\u6709\u6548\u6027\u6821\u9A8C\u540E\u518D\u4F7F\u7528\u3002",
      "\u5B89\u5168\u89C4\u7EA6"
    ),
    rule7(
      "java-sensitive-mask",
      "mandatory",
      "security",
      "\u7528\u6237\u654F\u611F\u6570\u636E\uFF08\u624B\u673A\u53F7\u3001\u8BC1\u4EF6\u53F7\u3001\u94F6\u884C\u5361\u7B49\uFF09\u5C55\u793A\u524D\u5FC5\u987B\u8131\u654F\u3002",
      "\u5B89\u5168\u89C4\u7EA6"
    ),
    rule7(
      "java-csrf-protection",
      "mandatory",
      "security",
      "\u8868\u5355\u4E0E AJAX \u63D0\u4EA4\u5FC5\u987B\u505A CSRF \u9632\u62A4\uFF1B\u5199\u64CD\u4F5C\u8981\u6821\u9A8C\u6765\u6E90\u4E0E\u9632\u4F2A\u4EE4\u724C\u3002",
      "\u5B89\u5168\u89C4\u7EA6"
    ),
    // ── 数据库 ────────────────────────────────────────────────────────────
    rule7(
      "java-table-three-fields",
      "mandatory",
      "database",
      "\u8868\u5FC5\u5907\u4E09\u5B57\u6BB5\uFF1A\u4E3B\u952E id\u3001\u521B\u5EFA\u65F6\u95F4 gmt_create\u3001\u66F4\u65B0\u65F6\u95F4 gmt_modified\u3002",
      "MySQL \u6570\u636E\u5E93\xB7\u5EFA\u8868\u89C4\u7EA6"
    ),
    rule7(
      "java-decimal-not-float",
      "mandatory",
      "database",
      "\u91D1\u989D\u7B49\u7CBE\u786E\u5C0F\u6570\u7528 decimal\uFF0C\u7981\u6B62\u7528 float/double\u3002",
      "MySQL \u6570\u636E\u5E93\xB7\u5EFA\u8868\u89C4\u7EA6"
    ),
    rule7(
      "java-is-xxx-tinyint",
      "mandatory",
      "database",
      "\u8868\u8FBE\u300C\u662F/\u5426\u300D\u7684\u5B57\u6BB5\u7528 is_xxx \u547D\u540D\uFF0C\u7C7B\u578B\u4E3A unsigned tinyint\u3002",
      "MySQL \u6570\u636E\u5E93\xB7\u5EFA\u8868\u89C4\u7EA6"
    ),
    rule7(
      "java-index-naming",
      "recommended",
      "database",
      "\u7D22\u5F15\u6309\u7528\u9014\u547D\u540D\uFF1A\u4E3B\u952E pk_\u3001\u552F\u4E00\u7D22\u5F15 uk_\u3001\u666E\u901A\u7D22\u5F15 idx_ \u52A0\u5B57\u6BB5\u540D\u3002",
      "MySQL \u6570\u636E\u5E93\xB7\u7D22\u5F15\u89C4\u7EA6"
    ),
    rule7(
      "java-varchar-length",
      "recommended",
      "database",
      "varchar \u957F\u5EA6\u4E0D\u8981\u8D85\u8FC7 5000\uFF0C\u66F4\u957F\u7684\u5185\u5BB9\u5355\u72EC\u5EFA\u8868\u6216\u6539\u7528\u6587\u672C\u7C7B\u578B\u3002",
      "MySQL \u6570\u636E\u5E93\xB7\u5EFA\u8868\u89C4\u7EA6"
    ),
    // ── 工程结构 ──────────────────────────────────────────────────────────
    rule7(
      "java-no-snapshot-dependency",
      "mandatory",
      "architecture",
      "\u7EBF\u4E0A\u5E94\u7528\u4E0D\u8981\u4F9D\u8D56 SNAPSHOT \u7248\u672C\uFF0C\u5426\u5219\u53D1\u5E03\u4E0D\u53EF\u91CD\u590D\u3002",
      "\u5DE5\u7A0B\u7ED3\u6784\xB7\u4E8C\u65B9\u5E93\u4F9D\u8D56"
    ),
    rule7(
      "java-unified-version-variable",
      "recommended",
      "architecture",
      "\u4E00\u7EC4\u4E8C\u65B9\u5E93\u4F9D\u8D56\u7528\u7EDF\u4E00\u7684\u7248\u672C\u53D8\u91CF\u7BA1\u7406\uFF0C\u907F\u514D\u7248\u672C\u53F7\u6563\u843D\u5404\u5904\u9020\u6210\u4E0D\u4E00\u81F4\u3002",
      "\u5DE5\u7A0B\u7ED3\u6784\xB7\u4E8C\u65B9\u5E93\u4F9D\u8D56"
    ),
    rule7(
      "java-layer-dependency",
      "recommended",
      "architecture",
      "\u4F9D\u8D56\u65B9\u5411\u4FDD\u6301\u5355\u5411\uFF08\u4E0A\u5C42\u4F9D\u8D56\u4E0B\u5C42\uFF09\uFF0C\u4E0D\u8981\u51FA\u73B0\u4E0B\u5C42\u53CD\u5411\u56DE\u8C03\u4E0A\u5C42\u7684\u8DE8\u5C42\u4F9D\u8D56\u3002",
      "\u5DE5\u7A0B\u7ED3\u6784\xB7\u5E94\u7528\u5206\u5C42"
    )
  ]
};

// src/core/reviewers/rules/index.ts
var JAVA_ALL_RULES = {
  entries: [
    ...JAVA_RULES.entries,
    ...JAVA_CORE_RULES.entries,
    ...JAVA_QUALITY_RULES.entries,
    ...JAVA_DB_RULES.entries,
    ...JAVA_BUILD_RULES.entries,
    ...JAVA_FORMAT_RULES.entries
  ]
};
var BUILTIN_RULES = {
  entries: [...GENERAL_RULES, ...JAVA_ALL_RULES.entries, ...FRONTEND_RULES.entries]
};

// src/core/reviewers/rules/library.ts
var DIMENSION_LABEL = {
  naming: "\u547D\u540D",
  coding: "\u7F16\u7A0B",
  "exception-log": "\u5F02\u5E38\u4E0E\u65E5\u5FD7",
  "unit-test": "\u5355\u5143\u6D4B\u8BD5",
  security: "\u5B89\u5168",
  database: "\u6570\u636E\u5E93",
  architecture: "\u5DE5\u7A0B\u7ED3\u6784",
  frontend: "\u524D\u7AEF\u5DE5\u7A0B",
  format: "\u683C\u5F0F"
};
var MAX_INJECTED_RULES = 18;
function languageOf(path) {
  const dot = path.lastIndexOf(".");
  const ext = dot < 0 ? "" : path.slice(dot + 1).toLowerCase();
  switch (ext) {
    case "ts":
    case "tsx":
      return "typescript";
    case "js":
    case "jsx":
    case "mjs":
    case "cjs":
    case "vue":
      return "javascript";
    case "java":
      return "java";
    case "py":
      return "python";
    case "go":
      return "go";
    case "rs":
      return "rust";
    case "sql":
      return "sql";
    // MyBatis 的 SQL 写在 mapper.xml 里，不认这个扩展名就永远查不到 ${} 这类问题
    case "xml":
      return "xml";
    default:
      return "*";
  }
}
function globToRegExp(pattern) {
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  let out = "";
  let index = 0;
  while (index < escaped.length) {
    if (escaped.startsWith("**/", index)) {
      out += "(?:.*/)?";
      index += 3;
      continue;
    }
    if (escaped.startsWith("**", index)) {
      out += ".*";
      index += 2;
      continue;
    }
    if (escaped[index] === "*") {
      out += "[^/]*";
      index += 1;
      continue;
    }
    out += escaped[index];
    index += 1;
  }
  return new RegExp(`^${out}$`);
}
function isTestPath(path) {
  const lower = path.toLowerCase();
  if (lower.includes("/src/test/") || lower.includes("/test/") || lower.includes("/tests/"))
    return true;
  if (lower.includes("/__tests__/") || lower.includes("/spec/")) return true;
  return /(test|tests|spec)\.(java|kt|ts|tsx|js|jsx|py|go)$/.test(lower);
}
function matchesAny(path, patterns) {
  return patterns.some((pattern) => globToRegExp(pattern).test(path));
}
var LEVEL_RANK = {
  mandatory: 0,
  recommended: 1,
  reference: 2
};
var DIMENSION_RANK = {
  security: 0,
  "exception-log": 1,
  database: 2,
  coding: 3,
  "unit-test": 4,
  architecture: 5,
  naming: 6,
  frontend: 7,
  // 格式排最后：它几乎总是被格式化工具接管，只在没有工具时才值得占名额
  format: 8
};
function selectRules(library, options) {
  const limit = options.limit ?? MAX_INJECTED_RULES;
  const path = options.path;
  const language = options.language ?? (path === null ? "*" : languageOf(path));
  const applicable = library.entries.filter((entry) => {
    if (options.levels !== void 0 && !options.levels.includes(entry.level)) return false;
    if (options.dimensions !== void 0 && !options.dimensions.includes(entry.dimension))
      return false;
    if (entry.dimension === "format" && options.includeFormat !== true) return false;
    if (entry.dimension === "unit-test" && path !== null && !isTestPath(path)) return false;
    const languageOk = entry.languages.includes("*") || entry.languages.includes(language);
    if (!languageOk) return false;
    const patterns = entry.pathPatterns ?? [];
    if (patterns.length === 0) return true;
    if (path === null) return false;
    return matchesAny(path, patterns);
  });
  const specificity = (entry) => (entry.pathPatterns ?? []).length > 0 ? 1 : 0;
  const byRules = [...applicable].sort((a, b) => {
    const byLevel = LEVEL_RANK[a.level] - LEVEL_RANK[b.level];
    if (byLevel !== 0) return byLevel;
    return specificity(b) - specificity(a);
  });
  return interleaveByDimension(byRules, limit);
}
function interleaveByDimension(rules, limit) {
  const groups2 = /* @__PURE__ */ new Map();
  for (const entry of rules) {
    const list = groups2.get(entry.dimension) ?? [];
    list.push(entry);
    groups2.set(entry.dimension, list);
  }
  const order = [...groups2.keys()].sort((a, b) => DIMENSION_RANK[a] - DIMENSION_RANK[b]);
  const picked = [];
  let round = 0;
  while (picked.length < limit) {
    let added = false;
    for (const dimension of order) {
      if (picked.length >= limit) break;
      const entry = groups2.get(dimension)?.[round];
      if (entry === void 0) continue;
      picked.push(entry);
      added = true;
    }
    if (!added) break;
    round += 1;
  }
  return picked;
}
var LEVEL_LABEL = {
  mandatory: "\u5F3A\u5236",
  recommended: "\u63A8\u8350",
  reference: "\u53C2\u8003"
};
function renderRuleBlock(rules) {
  if (rules.length === 0) return "";
  const groups2 = /* @__PURE__ */ new Map();
  for (const rule8 of rules) {
    const list = groups2.get(rule8.dimension) ?? [];
    list.push(rule8);
    groups2.set(rule8.dimension, list);
  }
  const sections = ["\u4EE5\u4E0B\u662F\u4ED3\u5E93\u7684\u65E2\u6709\u7EA6\u5B9A\uFF0C\u4F5C\u4E3A\u5BA1\u67E5\u4F9D\u636E\uFF1A"];
  for (const [dimension, entries] of groups2) {
    sections.push(`\u3010${DIMENSION_LABEL[dimension]}\u3011`);
    for (const entry of entries) {
      sections.push(`- \uFF08${LEVEL_LABEL[entry.level]}\uFF09${entry.instruction}`);
    }
  }
  sections.push(
    "\u82E5\u8FD9\u4E9B\u89C4\u5219\u4E0E\u9879\u76EE\u91CC\u5B9E\u9645\u7684\u5199\u6CD5\u51B2\u7A81\uFF0C\u4EE5\u9879\u76EE\u91CC\u7684\u5199\u6CD5\u4E3A\u51C6\u2014\u2014\u4E0D\u8981\u7528\u901A\u7528\u89C4\u8303\u53BB\u5426\u5B9A\u672C\u9879\u76EE\u7684\u4E60\u60EF\u3002"
  );
  return sections.join("\n");
}

// src/core/routing/model-route.ts
var RISK_PATH_PATTERNS = [
  {
    pattern: /(^|\/)(auth|authz|login|session|permission|role)(\/|\.|$)/i,
    score: 45,
    reason: "\u9274\u6743\u76F8\u5173"
  },
  {
    pattern: /(^|\/)(payment|billing|order|refund|settle)(\/|\.|$)/i,
    score: 40,
    reason: "\u8D44\u91D1\u76F8\u5173"
  },
  { pattern: /(^|\/)(crypto|security|secret|cert)(\/|\.|$)/i, score: 40, reason: "\u52A0\u89E3\u5BC6\u4E0E\u5BC6\u94A5" },
  {
    pattern: /(^|\/)(api|routes?|controllers?|handlers?|middleware)(\/|\.|$)/i,
    score: 25,
    reason: "\u8BF7\u6C42\u5165\u53E3"
  },
  {
    pattern: /(^|\/)(migrations?|schema|db|database|dao|repository)(\/|\.|$)/i,
    score: 25,
    reason: "\u6570\u636E\u5C42"
  },
  { pattern: /\.(sql|prisma)$/i, score: 20, reason: "\u6570\u636E\u5E93\u811A\u672C" }
];
function computeFileRisk(path, changedLines) {
  const reasons = [];
  let score = 0;
  for (const { pattern, score: weight, reason } of RISK_PATH_PATTERNS) {
    if (pattern.test(path)) {
      score += weight;
      reasons.push(reason);
    }
  }
  if (changedLines > 20) {
    const extra = Math.min(20, Math.floor((changedLines - 20) / 20) * 5);
    if (extra > 0) {
      score += extra;
      reasons.push(`\u6539\u52A8 ${String(changedLines)} \u884C`);
    }
  }
  return { score: Math.min(100, score), reasons };
}
function routeModel(input) {
  const { config } = input;
  if (!config.enabled) {
    return { tier: "default", model: null, reason: "\u8DEF\u7531\u672A\u542F\u7528" };
  }
  if (config.fileRiskThreshold > 0 && input.filePath !== null) {
    const risk = computeFileRisk(input.filePath, input.changedLines);
    if (risk.score >= config.fileRiskThreshold) {
      return pick(config, "strong", `\u6587\u4EF6\u98CE\u9669 ${String(risk.score)}\uFF08${risk.reasons.join("\u3001")}\uFF09`);
    }
  }
  if (config.smallChangeLines > 0 && input.changedLines > 0 && input.changedLines <= config.smallChangeLines) {
    return pick(config, "cheap", `\u6539\u52A8\u4EC5 ${String(input.changedLines)} \u884C`);
  }
  const byDimension = config.byDimension[input.reviewer];
  if (byDimension !== void 0) {
    return pick(config, byDimension, `\u7EF4\u5EA6 ${input.reviewer} \u6307\u5B9A ${byDimension}`);
  }
  return pick(config, config.defaultTier, "\u4F7F\u7528\u9ED8\u8BA4\u6863\u4F4D");
}
function pick(config, tier, reason) {
  const setting = config.tiers[tier];
  return { tier, model: setting?.model ?? null, reason };
}

// src/core/reconcile/markers.ts
var MARKER_VERSION = "v1";
var MARKER_PATTERN = /<!--\s*acr:(v\d+)\|([\s\S]*?)-->\s*$/;
var REVIEWER_IDS2 = ["correctness", "security", "convention"];
var SCOPES = ["changed", "function", "file"];
function isReviewerId(value) {
  return REVIEWER_IDS2.includes(value);
}
function isScope(value) {
  return SCOPES.includes(value);
}
function renderMarker(marker) {
  const parts = [
    `acr:${marker.version}`,
    `fp=${marker.fingerprint}`,
    `rv=${marker.reviewer}`,
    `sc=${marker.scope}`,
    `pv=${marker.promptVersion}`,
    `md=${marker.model}`
  ];
  return `<!-- ${parts.join("|")} -->`;
}
function parseMarker(body) {
  const match = MARKER_PATTERN.exec(body);
  if (match === null) return null;
  const version = match[1];
  const payload = match[2];
  if (version !== MARKER_VERSION || payload === void 0) return null;
  const fields = /* @__PURE__ */ new Map();
  for (const segment of payload.split("|")) {
    const index = segment.indexOf("=");
    if (index <= 0) continue;
    fields.set(segment.slice(0, index).trim(), segment.slice(index + 1).trim());
  }
  const fingerprint = fields.get("fp");
  const reviewer = fields.get("rv");
  const scope = fields.get("sc");
  const promptVersion = fields.get("pv");
  const model = fields.get("md");
  if (fingerprint === void 0 || reviewer === void 0 || scope === void 0 || promptVersion === void 0 || model === void 0) {
    return null;
  }
  if (!isReviewerId(reviewer) || !isScope(scope)) return null;
  return {
    version: MARKER_VERSION,
    fingerprint,
    reviewer,
    scope,
    promptVersion,
    model
  };
}
var SUMMARY_MARKER = "<!-- acr:v1|kind=summary -->";

// src/core/publish/render.ts
var SEVERITY_LABEL = {
  blocker: "\u4E25\u91CD",
  major: "\u4E3B\u8981",
  minor: "\u6B21\u8981",
  nit: "\u63D0\u793A"
};
var REVIEWER_LABEL = {
  correctness: "\u6B63\u786E\u6027",
  security: "\u5B89\u5168\u6027",
  convention: "\u89C4\u8303\u6027"
};
function severityLabel(severity) {
  return SEVERITY_LABEL[severity];
}
function markerFor(finding, meta) {
  return {
    version: "v1",
    fingerprint: finding.fingerprint,
    reviewer: finding.reviewer,
    scope: finding.scope,
    promptVersion: meta.promptVersion,
    model: meta.model
  };
}
function renderInlineBody(finding, options) {
  const blocks = [];
  blocks.push(
    `**${finding.title}** \`${severityLabel(finding.severity)}\` \xB7 ${REVIEWER_LABEL[finding.reviewer]}`
  );
  blocks.push(finding.body);
  if (finding.evidence.trim() !== "") {
    blocks.push(["```", finding.evidence, "```"].join("\n"));
  }
  if (finding.suggestion !== null && finding.suggestion.trim() !== "") {
    blocks.push(`**\u5EFA\u8BAE**\uFF1A${finding.suggestion}`);
  }
  blocks.push(renderMarker(markerFor(finding, options)));
  return blocks.join("\n\n");
}

// src/core/publish/summary.ts
var SEVERITY_ORDER = ["blocker", "major", "minor", "nit"];
function countBySeverity(findings) {
  const counts = /* @__PURE__ */ new Map();
  for (const finding of findings) {
    counts.set(finding.severity, (counts.get(finding.severity) ?? 0) + 1);
  }
  return counts;
}
function formatLocation(finding) {
  const { anchor } = finding;
  const line = anchor.kind === "removed" ? anchor.oldLine : anchor.newLine;
  return `\`${anchor.file}${line === null ? "" : `:${String(line)}`}\``;
}
function bulletList(findings) {
  return findings.map((finding) => `- ${formatLocation(finding)} ${finding.title}`);
}
function renderSummary(input) {
  const blocks = [];
  blocks.push("## \u672C\u6B21\u6539\u52A8\u5BA1\u67E5");
  const counts = countBySeverity(input.findings);
  if (input.findings.length === 0) {
    blocks.push("\u672C\u6B21\u6539\u52A8\u672A\u53D1\u73B0\u95EE\u9898\u3002");
  } else {
    const rows = SEVERITY_ORDER.filter((severity) => (counts.get(severity) ?? 0) > 0).map(
      (severity) => `| ${severityLabel(severity)} | ${String(counts.get(severity) ?? 0)} |`
    );
    blocks.push(["| \u4E25\u91CD\u5EA6 | \u6761\u6570 |", "| --- | --- |", ...rows].join("\n"));
    blocks.push(
      input.inlineCount > 0 ? `\u5DF2\u8D34\u5728\u6539\u52A8\u884C\u7684\u610F\u89C1\u89C1\u4E0A\u65B9\u884C\u5185\u8BC4\u8BBA\uFF08${String(input.inlineCount)} \u6761\uFF09\u3002` : "\u672C\u8F6E\u6CA1\u6709\u53EF\u8D34\u5728\u6539\u52A8\u884C\u7684\u610F\u89C1\u3002"
    );
  }
  const preexisting = input.summaryOnly.filter((finding) => finding.preexisting);
  const introduced = input.summaryOnly.filter((finding) => !finding.preexisting);
  if (introduced.length > 0) {
    blocks.push(
      ["## \u5176\u4ED6\u95EE\u9898\uFF08\u672C\u6B21\u6539\u52A8\u5F15\u5165\uFF0C\u4F46\u4E0D\u5B9C\u884C\u5185\u8BC4\u8BBA\uFF09", ...bulletList(introduced)].join("\n")
    );
  }
  if (preexisting.length > 0) {
    blocks.push(["## \u987A\u5E26\u53D1\u73B0\uFF08**\u4E0D\u662F\u672C\u6B21\u6539\u52A8\u5F15\u5165**\uFF09", ...bulletList(preexisting)].join("\n"));
  }
  const notes = [`- \u5BF9\u6BD4\u57FA\u51C6\uFF1A\`${input.baseSha}\` \u2192 \`${input.headSha}\``];
  if (input.trimmedSegments > 0) {
    notes.push(`- \u56E0\u9884\u7B97\u88C1\u526A\u4E86 ${String(input.trimmedSegments)} \u5904\u4E0A\u4E0B\u6587\uFF0C\u7ED3\u8BBA\u53EF\u80FD\u504F\u7A84`);
  }
  const versions = Object.entries(input.promptVersions).map(([reviewer, version]) => `${REVIEWER_LABEL[reviewer]} ${version ?? ""}`).join(" / ");
  if (versions !== "") notes.push(`- \u63D0\u793A\u8BCD\u7248\u672C\uFF1A${versions}`);
  if (input.rejectedCount > 0) {
    notes.push(`- \u6709 ${String(input.rejectedCount)} \u6761\u7ED3\u8BBA\u672A\u901A\u8FC7\u6821\u9A8C\uFF08\u884C\u53F7\u6216\u8BC1\u636E\u5BF9\u4E0D\u4E0A\uFF09\uFF0C\u5DF2\u4E22\u5F03`);
  }
  for (const warning of input.warnings) {
    notes.push(`- ${warning.message}`);
  }
  blocks.push(["## \u672C\u8F6E\u8BF4\u660E", ...notes].join("\n"));
  if (input.checkpoint !== void 0) blocks.push(renderCheckpoint(input.checkpoint));
  blocks.push(SUMMARY_MARKER);
  return blocks.join("\n\n");
}

// src/core/publish/publisher.ts
var DEFAULT_SLEEP = (ms) => new Promise((resolve) => {
  setTimeout(resolve, ms);
});
function describe(failure) {
  return `${failure.kind}: ${failure.message}`;
}
function createThrottle(intervalMs, batchSize, sleep) {
  let sincePause = 0;
  let started = false;
  return async () => {
    if (started && intervalMs > 0) await sleep(intervalMs);
    started = true;
    sincePause += 1;
    if (sincePause >= batchSize) {
      sincePause = 0;
      if (intervalMs > 0) await sleep(intervalMs);
    }
  };
}
async function withRetry(attempt, sleep) {
  let last = await attempt();
  for (let round = 1; round <= 3 && !last.ok && last.failure.kind === "rate-limit"; round += 1) {
    await sleep(Math.min(500 * 2 ** (round - 1), 4e3));
    last = await attempt();
  }
  return last;
}
async function verify(port, commentId, fingerprint) {
  const read = await port.read(commentId);
  return read !== null && read.body.includes(fingerprint);
}
async function publish(options) {
  const port = options.port;
  const sleep = options.sleep ?? DEFAULT_SLEEP;
  const batchSize = options.batchSize ?? 50;
  const intervalMs = options.intervalMs ?? 300;
  const throttle = createThrottle(intervalMs, batchSize, sleep);
  const checkReadback = options.verifyReadback ?? true;
  const now = options.now ?? (() => (/* @__PURE__ */ new Date()).toISOString());
  const failed = [];
  const warnings = [];
  let created = 0;
  let replaced = 0;
  let resolved = 0;
  let readbackFailures = 0;
  const record = (action, result) => {
    if (result.ok) return true;
    failed.push({ action, detail: describe(result.failure) });
    return false;
  };
  for (const action of options.actions) {
    if (action.kind === "keep") continue;
    if (action.kind === "create") {
      if (action.target !== "inline") continue;
      await throttle();
      const result = await withRetry(
        () => port.createInline(
          {
            path: action.finding.anchor.file,
            line: action.finding.anchor.newLine ?? action.finding.anchor.oldLine ?? 0,
            side: action.finding.anchor.kind === "removed" ? "old" : "new"
          },
          action.body
        ),
        sleep
      );
      if (!record("create", result)) continue;
      created += 1;
      if (checkReadback && result.ok) {
        const ok = await verify(port, result.commentId, action.finding.fingerprint);
        if (!ok) {
          readbackFailures += 1;
          warnings.push({
            kind: "readback",
            message: "\u8BC4\u8BBA\u5DF2\u521B\u5EFA\uFF0C\u4F46\u56DE\u8BFB\u6821\u9A8C\u672A\u901A\u8FC7\uFF08\u5185\u5BB9\u53EF\u80FD\u88AB\u5E73\u53F0\u6539\u5199\uFF09",
            target: `${action.finding.anchor.file}:${String(action.finding.anchor.newLine ?? 0)}`
          });
        }
      }
      continue;
    }
    if (action.kind === "replace") {
      await throttle();
      const createdResult = await withRetry(
        () => port.createInline(
          {
            path: action.finding.anchor.file,
            line: action.finding.anchor.newLine ?? action.finding.anchor.oldLine ?? 0,
            side: action.finding.anchor.kind === "removed" ? "old" : "new"
          },
          action.body
        ),
        sleep
      );
      if (!record("replace", createdResult)) continue;
      replaced += 1;
      await throttle();
      const removed = await withRetry(() => port.remove(action.commentId), sleep);
      if (!removed.ok) {
        const fallback = await withRetry(() => port.resolve(action.commentId), sleep);
        if (!fallback.ok) {
          warnings.push({
            kind: "permission",
            message: "\u65E7\u8BC4\u8BBA\u65E2\u65E0\u6CD5\u5220\u9664\u4E5F\u65E0\u6CD5\u6807\u8BB0\u4E3A\u5DF2\u89E3\u51B3\uFF08\u6743\u9650\u4E0D\u8DB3\uFF09\uFF0C\u53EF\u80FD\u4E0E\u65B0\u8BC4\u8BBA\u540C\u65F6\u5B58\u5728",
            target: action.commentId
          });
        }
      }
      continue;
    }
    await throttle();
    const primary = options.resolveMode === "delete" ? await port.remove(action.commentId) : await port.resolve(action.commentId);
    if (primary.ok) {
      resolved += 1;
      continue;
    }
    if (primary.failure.kind !== "permission") {
      failed.push({ action: "resolve", detail: describe(primary.failure) });
      continue;
    }
    const current = await port.read(action.commentId);
    if (current === null) {
      failed.push({ action: "resolve", detail: "\u6743\u9650\u4E0D\u8DB3\u4E14\u8BFB\u4E0D\u5230\u539F\u8BC4\u8BBA\uFF0C\u65E0\u6CD5\u964D\u7EA7" });
      continue;
    }
    await throttle();
    const edited = await port.update(
      action.commentId,
      `${resolvedNotice(now())}

${current.body}`
    );
    if (!record("resolve-fallback", edited)) continue;
    resolved += 1;
    warnings.push({
      kind: "permission",
      message: "\u6CA1\u6709\u300C\u6807\u8BB0\u5DF2\u89E3\u51B3\u300D\u7684\u6743\u9650\uFF0C\u5DF2\u964D\u7EA7\u4E3A\u5728\u8BC4\u8BBA\u6B63\u6587\u52A0\u4E00\u884C\u8BF4\u660E",
      target: action.commentId
    });
  }
  let summary = "skipped";
  if (options.summaryBody !== null) {
    const existing = await port.findThread(SUMMARY_MARKER);
    await throttle();
    if (existing === null) {
      const result = await withRetry(() => port.createThread(options.summaryBody ?? ""), sleep);
      summary = record("summary-create", result) ? "created" : "failed";
    } else {
      const result = await withRetry(
        () => port.update(existing.commentId, options.summaryBody ?? ""),
        sleep
      );
      summary = record("summary-update", result) ? "updated" : "failed";
    }
  }
  return { created, replaced, resolved, failed, warnings, readbackFailures, summary };
}

// src/core/reviewers/schema.ts
var SEVERITY_ORDER2 = ["blocker", "major", "minor", "nit"];
function severityWithin(severity, limit) {
  return SEVERITY_ORDER2.indexOf(severity) >= SEVERITY_ORDER2.indexOf(limit);
}
var SIDES = /* @__PURE__ */ new Set(["new", "old"]);
var SEVERITIES2 = new Set(SEVERITY_ORDER2);
function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function str(value) {
  return typeof value === "string" ? value : null;
}
function validateRawFindings(payload, spec) {
  const container = isRecord(payload) ? payload["findings"] : null;
  if (!Array.isArray(container)) {
    return {
      accepted: [],
      rejected: [
        {
          title: "(\u6574\u6279)",
          file: null,
          line: null,
          reason: "schema-invalid",
          detail: "\u8F93\u51FA\u7F3A\u5C11 findings \u6570\u7EC4"
        }
      ],
      clamped: 0
    };
  }
  const accepted = [];
  const rejects = [];
  let clamped = 0;
  for (const item of container) {
    if (!isRecord(item)) {
      rejects.push({
        title: "(\u975E\u5BF9\u8C61)",
        file: null,
        line: null,
        reason: "schema-invalid",
        detail: "\u6761\u76EE\u4E0D\u662F\u5BF9\u8C61"
      });
      continue;
    }
    const title = str(item["title"]) ?? "(\u65E0\u6807\u9898)";
    const file = str(item["file"]);
    const side = str(item["side"]);
    const line = item["line"];
    const severity = str(item["severity"]);
    const category = str(item["category"]);
    const body = str(item["body"]);
    const evidence = str(item["evidence"]);
    const confidence = item["confidence"];
    const suggestionRaw = item["suggestion"];
    const problem = firstProblem({
      file,
      side,
      line,
      severity,
      category,
      body,
      evidence,
      confidence
    });
    if (problem !== null) {
      rejects.push({
        title,
        file,
        line: typeof line === "number" ? line : null,
        reason: "schema-invalid",
        detail: problem
      });
      continue;
    }
    if (!spec.allowedCategories.includes(category)) {
      rejects.push({
        title,
        file,
        line: typeof line === "number" ? line : null,
        reason: "schema-invalid",
        detail: `\u7C7B\u522B ${String(category)} \u4E0D\u5C5E\u4E8E\u7EF4\u5EA6 ${spec.id}`
      });
      continue;
    }
    let finalSeverity = severity;
    if (!severityWithin(finalSeverity, spec.maxSeverity)) {
      finalSeverity = spec.maxSeverity;
      clamped += 1;
    }
    accepted.push({
      file,
      line,
      side,
      severity: finalSeverity,
      category,
      title: title.slice(0, 60),
      body,
      evidence,
      suggestion: typeof suggestionRaw === "string" && suggestionRaw !== "" ? suggestionRaw : null,
      confidence
    });
  }
  return { accepted, rejected: rejects, clamped };
}
function firstProblem(fields) {
  if (fields.file === null || fields.file === "") return "\u7F3A\u5C11 file";
  if (fields.side === null || !SIDES.has(fields.side))
    return `side \u5FC5\u987B\u662F new \u6216 old\uFF0C\u6536\u5230 ${String(fields.side)}`;
  if (typeof fields.line !== "number" || !Number.isInteger(fields.line) || fields.line < 1) {
    return `line \u5FC5\u987B\u662F\u6B63\u6574\u6570\uFF0C\u6536\u5230 ${String(fields.line)}`;
  }
  if (fields.severity === null || !SEVERITIES2.has(fields.severity)) {
    return `severity \u53D6\u503C\u975E\u6CD5\uFF1A${String(fields.severity)}`;
  }
  if (fields.category === null || fields.category === "") return "\u7F3A\u5C11 category";
  if (fields.body === null || fields.body.trim() === "") return "body \u4E0D\u80FD\u4E3A\u7A7A";
  if (fields.evidence === null || fields.evidence.trim() === "") return "evidence \u4E0D\u80FD\u4E3A\u7A7A";
  if (typeof fields.confidence !== "number" || fields.confidence < 0 || fields.confidence > 1) {
    return `confidence \u5FC5\u987B\u843D\u5728 0~1\uFF0C\u6536\u5230 ${String(fields.confidence)}`;
  }
  return null;
}
function buildSchema(categories, maxSeverity) {
  const severities = SEVERITY_ORDER2.slice(SEVERITY_ORDER2.indexOf(maxSeverity));
  return {
    type: "object",
    required: ["findings"],
    properties: {
      findings: {
        type: "array",
        items: {
          type: "object",
          required: [
            "file",
            "line",
            "side",
            "severity",
            "category",
            "title",
            "body",
            "evidence",
            "confidence"
          ],
          properties: {
            file: { type: "string" },
            line: { type: "integer", minimum: 1 },
            side: { enum: ["new", "old"] },
            severity: { enum: severities },
            category: { enum: [...categories] },
            title: { type: "string", maxLength: 60 },
            body: { type: "string" },
            evidence: { type: "string" },
            suggestion: { type: ["string", "null"] },
            confidence: { type: "number", minimum: 0, maximum: 1 }
          }
        }
      }
    }
  };
}

// src/core/reviewers/dimensions/message.ts
function renderSegments(segments) {
  return segments.map((segment) => [`#### ${segment.title}`, "```", segment.content, "```"].join("\n")).join("\n\n");
}
function buildUserMessage(input, options = {}) {
  const blocks = [];
  blocks.push(
    input.file === null ? "## \u5F85\u5BA1\u8303\u56F4\n\n\u672C\u6B21\u6539\u52A8\u6D89\u53CA\u7684\u5168\u90E8\u6587\u4EF6\uFF08\u5168\u5C40\u89C6\u89D2\uFF09" : `## \u5F85\u5BA1\u6587\u4EF6

\`${input.file}\``
  );
  if (input.segments.length > 0) {
    blocks.push(`## \u6750\u6599

${renderSegments(input.segments)}`);
  }
  if (input.note !== void 0 && input.note !== "") {
    blocks.push(`## \u8865\u5145\u8BF4\u660E

${input.note}`);
  }
  if (options.guidance !== void 0 && options.guidance !== "") {
    blocks.push(`## \u672C\u6B21\u989D\u5916\u5173\u6CE8

${options.guidance}`);
  }
  return blocks.join("\n\n");
}
var OUTPUT_CONTRACT = `## \u8F93\u51FA

\u53EA\u8F93\u51FA JSON\uFF0C\u4E0D\u8981\u4EFB\u4F55\u89E3\u91CA\u6587\u5B57\uFF1A

{"findings":[{"file":"\u6587\u4EF6\u8DEF\u5F84","line":123,"side":"new","severity":"major","category":"\u7C7B\u522B","title":"\u4E0D\u8D85\u8FC7 60 \u5B57","body":"\u89E6\u53D1\u6761\u4EF6\u4E0E\u540E\u679C","evidence":"\u9010\u5B57\u590D\u5236\u7684\u4EE3\u7801","suggestion":"\u6539\u6CD5\u6216 null","confidence":0.8}]}

- line\uFF1A\u6539\u52A8\u540E\u7684\u884C\u53F7\uFF1Bside \u4E3A old \u65F6\u7528\u6539\u52A8\u524D\u7684\u884C\u53F7
- side\uFF1A"new" \u8FD9\u884C\u5728\u6539\u52A8\u540E\u5B58\u5728\uFF1B"old" \u8FD9\u884C\u88AB\u5220\u9664\u4E86
- \u6CA1\u6709\u53D1\u73B0\u95EE\u9898\u65F6\u8F93\u51FA {"findings":[]}\u3002\u4E0D\u8981\u4E3A\u4E86\u51D1\u6570\u7F16\u9020\u95EE\u9898\u3002`;

// src/core/reviewers/dimensions/convention/prompt.ts
var PROMPT_VERSION = "v1.1";
var SYSTEM_PROMPT = `\u4F60\u662F\u4E00\u540D\u4EE3\u7801\u89C4\u8303\u5BA1\u67E5\u5458\u3002\u4F60\u53EA\u8D1F\u8D23\u4E00\u4EF6\u4E8B\uFF1A**\u8FD9\u6BB5\u6539\u52A8\u548C\u9879\u76EE\u65E2\u6709\u7684\u5199\u6CD5\u662F\u5426\u4E00\u81F4**\u3002

## \u5224\u65AD\u4F9D\u636E\u7684\u4F18\u5148\u7EA7\uFF08\u4E25\u683C\u6267\u884C\uFF09

1. **\u9879\u76EE\u5185\u7EA6\u5B9A**\uFF1A\u540C\u76EE\u5F55\u3001\u540C\u7C7B\u6587\u4EF6\u7684\u65E2\u6709\u5199\u6CD5\u3002\u8FD9\u662F\u6700\u9AD8\u4F9D\u636E\u3002
2. **\u672C\u6B21\u6539\u52A8\u5185\u7684\u4E00\u81F4\u6027**\uFF1A\u540C\u4E00\u6279\u6539\u52A8\u91CC\uFF0C\u540C\u6837\u7684\u4E8B\u6709\u6CA1\u6709\u4E24\u79CD\u5199\u6CD5\u3002
3. **\u4E1A\u754C\u89C4\u8303**\uFF1A\u8BED\u8A00\u5B98\u65B9\u98CE\u683C\u6307\u5357\u3001\u901A\u884C\u505A\u6CD5\u3002**\u53EA\u6709\u524D\u4E24\u6761\u90FD\u7ED9\u4E0D\u51FA\u7B54\u6848\u65F6\u624D\u7528**\u3002

\u4E3E\u4F8B\uFF1A\u9879\u76EE\u91CC\u5230\u5904\u90FD\u662F \`snake_case\` \u7684\u51FD\u6570\u540D\uFF0C\u90A3\u5C31\u4E0D\u8981\u5EFA\u8BAE\u6539\u6210 \`camelCase\`\uFF0C\u54EA\u6015\u4E1A\u754C\u90FD\u8FD9\u4E48\u5199\u3002
\u5224\u65AD\u4F9D\u636E\u4E0D\u662F\u300C\u54EA\u79CD\u66F4\u597D\u300D\uFF0C\u662F\u300C\u8FD9\u91CC\u7528\u7684\u662F\u54EA\u79CD\u300D\u3002

## \u5FC5\u987B\u62A5\u7684

- \u540C\u4E00\u6279\u6539\u52A8\u91CC\uFF0C\u540C\u4E00\u79CD\u4E8B\u6709\u4E24\u79CD\u5199\u6CD5\uFF08\u4E00\u534A await\u3001\u4E00\u534A then\uFF1B\u4E00\u534A\u7528\u65E9\u8FD4\u56DE\u3001\u4E00\u534A\u5957 if \u5D4C\u5957\uFF09
- \u4E0E\u540C\u76EE\u5F55\u65E2\u6709\u6587\u4EF6\u7684\u5199\u6CD5\u660E\u663E\u4E0D\u4E00\u81F4\uFF08\u5BFC\u51FA\u98CE\u683C\u3001\u9519\u8BEF\u5904\u7406\u98CE\u683C\u3001\u53C2\u6570\u987A\u5E8F\u4E60\u60EF\uFF09
- \u91CD\u590D\u903B\u8F91\uFF1A\u672C\u6B21\u65B0\u589E\u7684\u4EE3\u7801\u4E0E\u65E2\u6709\u4EE3\u7801\u5728\u505A\u540C\u4E00\u4EF6\u4E8B\uFF0C\u53EF\u4EE5\u5408\u5E76
- \u7ED3\u6784\u95EE\u9898\uFF1A\u628A\u4E09\u5C42\u5D4C\u5957\u786C\u5199\u6210\u4E00\u4E2A\u5927\u51FD\u6570\u3001\u628A\u4E00\u4E2A\u51FD\u6570\u585E\u8FDB\u4E24\u4EF6\u4E0D\u76F8\u5E72\u7684\u4E8B

## \u4E0D\u8981\u62A5\u7684

- **\u683C\u5F0F\u5316\u4E0E\u9759\u6001\u68C0\u67E5\u80FD\u67E5\u51FA\u6765\u7684**\uFF1A\u7F29\u8FDB\u3001\u5F15\u53F7\u3001\u5206\u53F7\u3001\u884C\u5BBD\u3001import \u987A\u5E8F\u3001\u672A\u4F7F\u7528\u53D8\u91CF
  \uFF08\u8FD9\u4E9B\u5DF2\u6709\u5DE5\u5177\u5728\u7BA1\uFF0C\u518D\u8BF4\u4E00\u904D\u53EA\u4F1A\u8BA9\u4EBA\u5173\u6389\u8FD9\u4E2A\u529F\u80FD\uFF09
- \u7EAF\u4E2A\u4EBA\u504F\u597D\uFF1A\u300C\u6211\u89C9\u5F97\u8FD9\u4E2A\u540D\u5B57\u66F4\u597D\u300D\u300C\u5EFA\u8BAE\u52A0\u6CE8\u91CA\u300D
- \u4E0E\u672C\u6B21\u6539\u52A8\u65E0\u5173\u7684\u5B58\u91CF\u98CE\u683C\u95EE\u9898

## category \u5B57\u6BB5\uFF08\u586B\u9519\u7B49\u4E8E\u6CA1\u62A5\uFF09

\u4E0A\u9762\u90A3\u4E9B\u4E2D\u6587\u540D\u53EA\u662F\u7ED9\u4F60\u7406\u89E3\u7528\u7684\u3002category \u5B57\u6BB5**\u5FC5\u987B\u586B\u4E0B\u8868\u7684\u82F1\u6587\u503C**\uFF1A

| \u4F60\u5224\u65AD\u7684\u662F | \u586B |
| --- | --- |
| \u547D\u540D\u4E0D\u4E00\u81F4 | naming |
| \u7ED3\u6784\u95EE\u9898 | structure |
| \u540C\u4E00\u6279\u6539\u52A8\u5185\u7684\u5199\u6CD5\u4E0D\u4E00\u81F4 | consistency |
| \u91CD\u590D\u903B\u8F91 | duplication |
| \u4E0E\u9879\u76EE\u7EA6\u5B9A\u7684\u5199\u6CD5\u51B2\u7A81 | convention |

\u5199\u6210\u4E2D\u6587\u4F1A\u88AB\u5B57\u6BB5\u6821\u9A8C\u76F4\u63A5\u62D2\u7EDD\uFF1A\u4E0D\u662F\u964D\u7EA7\u3001\u4E0D\u662F\u8B66\u544A\uFF0C\u662F**\u6574\u6761\u7ED3\u8BBA\u88AB\u4E22\u6389**\u3002
\u5B81\u53EF\u5C11\u62A5\u4E00\u6761\uFF0C\u4E5F\u4E0D\u8981\u7528\u4E2D\u6587\u53BB\u78B0\u8FD0\u6C14\u2014\u2014\u4E22\u6389\u7684\u6761\u76EE\u4F5C\u8005\u6C38\u8FDC\u770B\u4E0D\u5230\u3002

## \u8BC1\u636E\u89C4\u5219

evidence \u5FC5\u987B\u662F\u6539\u52A8\u91CC**\u4E00\u5B57\u4E0D\u5DEE**\u7684\u4E00\u884C\u4EE3\u7801\u3002\u4E0D\u8981\u6539\u5199\u3001\u4E0D\u8981\u7701\u7565\u3002

## \u4E25\u91CD\u5EA6\u9650\u5236

\u8FD9\u4E2A\u7EF4\u5EA6\u7684\u4E25\u91CD\u5EA6**\u6700\u9AD8\u53EA\u80FD\u5230 minor**\u3002\u89C4\u8303\u95EE\u9898\u4E0D\u4F1A\u8BA9\u7A0B\u5E8F\u5D29\u6E83\uFF0C\u628A\u5B83\u6807\u6210 blocker
\u4F1A\u6324\u6389\u771F\u6B63\u4F1A\u5BFC\u81F4\u6545\u969C\u7684\u95EE\u9898\u2014\u2014\u884C\u5185\u4F4D\u7F6E\u662F\u7A00\u7F3A\u8D44\u6E90\u3002

## \u7F6E\u4FE1\u5EA6

\u53C2\u7167\u7269\u4E0D\u8DB3\uFF08\u6BD4\u5982\u770B\u4E0D\u5230\u540C\u76EE\u5F55\u5176\u4ED6\u6587\u4EF6\uFF09\u65F6\uFF0C\u628A confidence \u8C03\u4F4E\u3002\u5B81\u53EF\u4E0D\u62A5\uFF0C\u4E5F\u4E0D\u8981\u62FF\u901A\u7528\u4E60\u60EF\u786C\u5957\u3002`;

// src/core/reviewers/dimensions/convention/lint-detect.ts
var LINT_CONFIGS = [
  ".eslintrc",
  ".eslintrc.js",
  ".eslintrc.cjs",
  ".eslintrc.json",
  ".eslintrc.yml",
  ".eslintrc.yaml",
  "eslint.config.js",
  "eslint.config.mjs",
  "eslint.config.cjs",
  ".prettierrc",
  ".prettierrc.json",
  ".prettierrc.js",
  "prettier.config.js",
  ".stylelintrc",
  ".stylelintrc.json",
  ".editorconfig",
  "biome.json",
  "ruff.toml",
  ".golangci.yml"
];
var CONFIG_SET = new Set(LINT_CONFIGS.map((name) => name.toLowerCase()));
function detectLintConfig(paths) {
  const found = /* @__PURE__ */ new Set();
  for (const path of paths) {
    const name = path.split("/").pop()?.toLowerCase() ?? "";
    if (CONFIG_SET.has(name)) found.add(name);
  }
  return [...found];
}
function shouldMuteConvention(paths, respectLintConfig) {
  if (!respectLintConfig) return false;
  return detectLintConfig(paths).length > 0;
}

// src/core/reviewers/dimensions/convention/index.ts
var CONVENTION_CATEGORIES = [
  "naming",
  "structure",
  "consistency",
  "duplication",
  "convention"
];
var conventionReviewer = {
  id: "convention",
  promptVersion: PROMPT_VERSION,
  allowedCategories: CONVENTION_CATEGORIES,
  maxSeverity: "minor",
  systemPrompt: `${SYSTEM_PROMPT}

${OUTPUT_CONTRACT}`,
  schema: buildSchema(CONVENTION_CATEGORIES, "minor"),
  buildUserMessage: (input) => buildUserMessage(input)
};

// src/core/reviewers/dimensions/security/route.ts
var PATH_KEYWORDS = [
  "auth",
  "login",
  "logout",
  "session",
  "token",
  "crypto",
  "password",
  "secret",
  "upload",
  "download",
  "sql",
  "query",
  "exec",
  "shell",
  "admin",
  "payment",
  "order",
  "user",
  "permission",
  "role"
];
var ENTRY_DIRS = [
  "api/",
  "routes/",
  "controllers/",
  "handlers/",
  "middleware/",
  "pages/api/"
];
var CONTENT_PATTERNS = [
  { label: "\u6570\u636E\u5E93\u67E5\u8BE2\u62FC\u63A5", pattern: /\b(select|insert|update|delete)\b[\s\S]{0,80}(\+|\$\{)/i },
  { label: "\u547D\u4EE4\u6267\u884C", pattern: /\b(exec|execSync|spawn|spawnSync|system)\s*\(/ },
  { label: "\u6A21\u677F\u6E32\u67D3", pattern: /\b(renderTemplate|compile|eval|new\s+Function)\s*\(/ },
  { label: "\u53CD\u5E8F\u5217\u5316", pattern: /\b(deserialize|unserialize|yaml\.load|pickle\.loads)\s*\(/ },
  {
    label: "\u8DEF\u5F84\u62FC\u63A5",
    pattern: /\b(path\.join|path\.resolve|readFile|writeFile|createReadStream)\s*\(/
  },
  { label: "\u52A0\u89E3\u5BC6", pattern: /\b(createCipheriv|createDecipheriv|createHash|sign|verify)\s*\(/ },
  { label: "\u5916\u90E8\u8BF7\u6C42", pattern: /\b(fetch|axios|request|http\.get|https\.get)\s*\(/ },
  { label: "\u76F4\u63A5\u63D2\u5165 HTML", pattern: /(innerHTML|dangerouslySetInnerHTML|v-html|document\.write)/ },
  { label: "\u6D4F\u89C8\u5668\u5B58\u50A8", pattern: /(localStorage|sessionStorage|document\.cookie)/ },
  { label: "\u6743\u9650\u5224\u65AD", pattern: /\b(isAdmin|hasRole|checkPermission|authorize|canAccess)\b/i }
];
function routeForSecurity(input) {
  const reasons = [];
  const lowerPath = input.path.toLowerCase();
  for (const keyword of PATH_KEYWORDS) {
    if (lowerPath.includes(keyword)) reasons.push(`\u8DEF\u5F84\u542B\u300C${keyword}\u300D`);
  }
  for (const dir of ENTRY_DIRS) {
    if (lowerPath.includes(dir)) reasons.push(`\u4F4D\u4E8E\u8BF7\u6C42\u5165\u53E3\u76EE\u5F55 ${dir}`);
  }
  if (input.content !== null) {
    for (const { label, pattern } of CONTENT_PATTERNS) {
      if (pattern.test(input.content)) reasons.push(`\u5185\u5BB9\u6D89\u53CA${label}`);
    }
  }
  return { send: reasons.length > 0, reasons };
}

// src/core/reviewers/dimensions/correctness/prompt.ts
var PROMPT_VERSION2 = "v1.1";
var SYSTEM_PROMPT2 = `\u4F60\u662F\u4E00\u540D\u4E25\u8C28\u7684\u4EE3\u7801\u5BA1\u67E5\u5458\uFF0C\u53EA\u8D1F\u8D23\u4E00\u4EF6\u4E8B\uFF1A**\u8FD9\u6BB5\u4EE3\u7801\u5728\u4EC0\u4E48\u60C5\u51B5\u4E0B\u4F1A\u51FA\u9519**\u3002

\u4F60\u5BA1\u7684\u662F\u672C\u6B21\u6539\u52A8\u3002\u6539\u52A8\u4E4B\u5916\u7684\u4EE3\u7801\u53EA\u662F\u80CC\u666F\u6750\u6599\uFF0C\u4E0D\u9700\u8981\u4F60\u5BF9\u5B83\u53D1\u8868\u610F\u89C1\u3002

## \u5FC5\u987B\u62A5\u7684

\u53EA\u6709\u5F53\u4F60\u80FD\u8BF4\u6E05\u300C\u5728\u4EC0\u4E48\u8F93\u5165\u6216\u65F6\u5E8F\u4E0B\u4F1A\u51FA\u95EE\u9898\u300D\u65F6\u624D\u62A5\uFF0C\u8303\u56F4\u662F\uFF1A

- **\u7A7A\u503C**\uFF1A\u53EF\u80FD\u4E3A null / undefined \u7684\u503C\u88AB\u76F4\u63A5\u8BFB\u53D6\u3001\u8C03\u7528\u3001\u89E3\u6784
- **\u8D8A\u754C**\uFF1A\u6570\u7EC4\u4E0B\u6807\u3001\u5B57\u7B26\u4E32\u622A\u53D6\u3001\u5206\u9875\u4E0E\u504F\u79FB\u91CF\u3001\u5207\u7247\u8FB9\u754C
- **\u5E76\u53D1**\uFF1A\u5148\u67E5\u540E\u6539\u3001\u5171\u4EAB\u72B6\u6001\u65E0\u4FDD\u62A4\u3001\u5F02\u6B65\u672A\u7B49\u5F85\u3001\u7ADE\u6001\u3001\u91CD\u590D\u63D0\u4EA4
- **\u5F02\u5E38**\uFF1A\u53EF\u80FD\u629B\u51FA\u7684\u8C03\u7528\u6CA1\u6709\u5904\u7406\uFF1Bcatch \u91CC\u628A\u9519\u8BEF\u541E\u6389\u6216\u53EA\u6253\u4E86\u65E5\u5FD7\u5374\u6CA1\u4E0A\u629B
- **\u8D44\u6E90**\uFF1A\u6253\u5F00\u672A\u5173\u95ED\u3001\u8BA2\u9605\u672A\u53D6\u6D88\u3001\u5B9A\u65F6\u5668\u672A\u6E05\u7406\u3001\u5FAA\u73AF\u91CC\u7684\u8FDE\u63A5\u6CC4\u6F0F
- **\u903B\u8F91**\uFF1A\u6761\u4EF6\u5199\u53CD\u3001\u5206\u652F\u9057\u6F0F\u3001\u5FAA\u73AF\u7EC8\u6B62\u6761\u4EF6\u9519\u3001\u8FD4\u56DE\u503C\u4E0E\u8C03\u7528\u65B9\u9884\u671F\u4E0D\u4E00\u81F4\u3001\u5355\u4F4D\u6216\u7CBE\u5EA6\u9519\u8BEF

## \u4E0D\u8981\u62A5\u7684

- \u547D\u540D\u3001\u683C\u5F0F\u3001\u6CE8\u91CA\u98CE\u683C\u3001\u76EE\u5F55\u7ED3\u6784 \u2014\u2014 \u4E0D\u5F52\u4F60\u7BA1
- \u300C\u8FD9\u4E2A\u6587\u4EF6\u592A\u957F\u300D\u300C\u8FD9\u4E2A\u51FD\u6570\u592A\u590D\u6742\u300D \u2014\u2014 \u53E6\u6709\u673A\u5236\u7EDF\u8BA1\uFF0C\u7528\u4E0D\u7740\u4F60\u5224\u65AD
- \u7EAF\u5047\u8BBE\u6027\u62C5\u5FE7\uFF1A\u300C\u53EF\u80FD\u4E0D\u591F\u5065\u58EE\u300D\u300C\u5EFA\u8BAE\u52A0\u65E5\u5FD7\u300D\u300C\u6700\u597D\u52A0\u4E2A\u6CE8\u91CA\u300D\u2014\u2014 \u4E00\u5F8B\u4E0D\u62A5
- \u4EFB\u4F55\u6CA1\u6709\u5177\u4F53\u89E6\u53D1\u6761\u4EF6\u7684\u300C\u5EFA\u8BAE\u2026\u300D

\u5224\u5B9A\u6807\u51C6\u5F88\u7B80\u5355\uFF1A**\u5982\u679C\u4F5C\u8005\u53CD\u95EE\u4F60\u300C\u4F60\u8BF4\u4EC0\u4E48\u60C5\u51B5\u4E0B\u4F1A\u51FA\u95EE\u9898\u300D\uFF0C\u4F60\u7B54\u4E0D\u4E0A\u6765\uFF0C\u5C31\u4E0D\u8981\u62A5\u3002**

## category \u5B57\u6BB5\uFF08\u586B\u9519\u7B49\u4E8E\u6CA1\u62A5\uFF09

\u4E0A\u9762\u90A3\u4E9B\u4E2D\u6587\u540D\u53EA\u662F\u7ED9\u4F60\u7406\u89E3\u7528\u7684\u3002category \u5B57\u6BB5**\u5FC5\u987B\u586B\u4E0B\u8868\u7684\u82F1\u6587\u503C**\uFF1A

| \u4F60\u5224\u65AD\u7684\u662F | \u586B |
| --- | --- |
| \u7A7A\u503C | null-safety |
| \u8D8A\u754C | boundary |
| \u5E76\u53D1 | concurrency |
| \u5F02\u5E38 | error-handling |
| \u8D44\u6E90 | resource |
| \u903B\u8F91 | logic |

\u5199\u6210\u4E2D\u6587\u4F1A\u88AB\u5B57\u6BB5\u6821\u9A8C\u76F4\u63A5\u62D2\u7EDD\uFF1A\u4E0D\u662F\u964D\u7EA7\u3001\u4E0D\u662F\u8B66\u544A\uFF0C\u662F**\u6574\u6761\u7ED3\u8BBA\u88AB\u4E22\u6389**\u3002
\u5B81\u53EF\u5C11\u62A5\u4E00\u6761\uFF0C\u4E5F\u4E0D\u8981\u7528\u4E2D\u6587\u53BB\u78B0\u8FD0\u6C14\u2014\u2014\u4E22\u6389\u7684\u6761\u76EE\u4F5C\u8005\u6C38\u8FDC\u770B\u4E0D\u5230\u3002

## \u8BC1\u636E\u89C4\u5219\uFF08\u6700\u91CD\u8981\uFF09

evidence \u5FC5\u987B\u662F\u6539\u52A8\u91CC**\u4E00\u5B57\u4E0D\u5DEE**\u7684\u4E00\u884C\u4EE3\u7801\u3002

- \u4E0D\u8981\u6539\u5199\uFF0C\u4E0D\u8981\u8865\u5168\uFF0C\u4E0D\u8981\u8C03\u6574\u7F29\u8FDB
- \u4E0D\u8981\u7528\u7701\u7565\u53F7\u4EE3\u66FF\u4E2D\u95F4\u90E8\u5206
- \u4E0D\u8981\u628A\u591A\u884C\u5408\u5E76\u6210\u4E00\u884C

\u590D\u5236\u4E0D\u4E0A\u5C31\u8BF4\u660E\u4F60\u6CA1\u770B\u6E05\u90A3\u6BB5\u4EE3\u7801\uFF0C\u90A3\u5C31\u4E0D\u8981\u62A5\u8FD9\u4E00\u6761\u3002

## \u62A5\u544A\u987A\u5E8F

1. **\u5148\u62A5\u6539\u52A8\u884C\u7684\u95EE\u9898**\u3002\u8FD9\u662F\u5FC5\u987B\u5B8C\u6210\u7684\u90E8\u5206\uFF0C\u4F1A\u8D34\u5728\u5BF9\u5E94\u884C\u4E0A\u3002
2. \u6539\u52A8\u884C\u62A5\u5B8C\u4E4B\u540E\uFF0C\u5982\u679C\u8FD8\u6709\u4F59\u91CF\uFF0C\u624D\u53EF\u4EE5\u62A5\u300C\u6539\u52A8\u6240\u5728\u51FD\u6570\u5185\u300D\u7684\u5176\u4ED6\u95EE\u9898\u3002\u8FD9\u90E8\u5206\u4F1A\u8FDB\u6458\u8981\uFF0C\u4E0D\u662F\u884C\u5185\u8BC4\u8BBA\u3002
3. \u6574\u4E2A\u6587\u4EF6\u5C42\u9762\u7684\u95EE\u9898\u4E0D\u8981\u62A5\u3002

## \u7F6E\u4FE1\u5EA6

\u4E0D\u786E\u5B9A\u5C31\u628A confidence \u8C03\u4F4E\uFF080.5 \u4EE5\u4E0B\uFF09\uFF0C\u4E0D\u8981\u4E3A\u4E86\u663E\u5F97\u786E\u5B9A\u800C\u5199 0.9\u3002
\u4F4E\u7F6E\u4FE1\u5EA6\u7684\u6761\u76EE\u4E0D\u4F1A\u88AB\u4E22\u5F03\uFF0C\u53EA\u4F1A\u6392\u5728\u540E\u9762\u2014\u2014\u5982\u5B9E\u586B\u5199\u5BF9\u4F60\u6709\u5229\u3002`;

// src/core/reviewers/dimensions/correctness/index.ts
var CORRECTNESS_CATEGORIES = [
  "null-safety",
  "logic",
  "concurrency",
  "error-handling",
  "resource",
  "boundary"
];
var correctnessReviewer = {
  id: "correctness",
  promptVersion: PROMPT_VERSION2,
  allowedCategories: CORRECTNESS_CATEGORIES,
  maxSeverity: "blocker",
  systemPrompt: `${SYSTEM_PROMPT2}

${OUTPUT_CONTRACT}`,
  schema: buildSchema(CORRECTNESS_CATEGORIES, "blocker"),
  buildUserMessage: (input) => buildUserMessage(input)
};

// src/core/reviewers/dimensions/security/prompt.ts
var PROMPT_VERSION3 = "v1.1";
var SYSTEM_PROMPT3 = `\u4F60\u662F\u4E00\u540D\u5E94\u7528\u5B89\u5168\u5BA1\u67E5\u5458\u3002\u4F60\u53EA\u8D1F\u8D23\u4E00\u4EF6\u4E8B\uFF1A**\u8FD9\u6BB5\u6539\u52A8\u80FD\u4E0D\u80FD\u88AB\u653B\u51FB\u8005\u5229\u7528**\u3002

\u5224\u5B9A\u6807\u51C6\u662F\u300C\u80FD\u4E0D\u80FD\u88AB\u5229\u7528\u300D\uFF0C\u4E0D\u662F\u300C\u4EE3\u7801\u5199\u5F97\u597D\u4E0D\u597D\u300D\u3002\u4E00\u6761\u95EE\u9898\u62A5\u51FA\u6765\u65F6\uFF0C\u4F60\u8981\u80FD\u8BF4\u6E05\u653B\u51FB\u8005\u662F\u8C01\u3001\u505A\u4EC0\u4E48\u64CD\u4F5C\u3001\u5F97\u5230\u4EC0\u4E48\u3002

## \u540E\u7AEF

- **\u8D8A\u6743\uFF08\u6700\u91CD\u8981\uFF09**\uFF1A\u6C34\u5E73\u8D8A\u6743\uFF08\u6539\u6389 id \u5C31\u80FD\u8BFB\u522B\u4EBA\u7684\u6570\u636E\uFF09\u3001\u5782\u76F4\u8D8A\u6743\uFF08\u666E\u901A\u7528\u6237\u80FD\u8C03\u7BA1\u7406\u63A5\u53E3\uFF09\u3001**\u9274\u6743\u4F4D\u7F6E\u9519\u8BEF**\uFF08\u5728\u63A7\u5236\u5668\u6821\u9A8C\u4E86\uFF0C\u4F46\u670D\u52A1\u5C42\u53EF\u88AB\u76F4\u63A5\u8C03\u7528\u7ED5\u8FC7\uFF09
- **\u6743\u9650\u6CC4\u9732**\uFF1A\u63A5\u53E3\u8FD4\u56DE\u4E86\u4E0D\u8BE5\u8FD4\u56DE\u7684\u5B57\u6BB5\u3001\u65E5\u5FD7\u91CC\u6253\u4E86\u654F\u611F\u4FE1\u606F\u3001\u9519\u8BEF\u4FE1\u606F\u66B4\u9732\u5185\u90E8\u7ED3\u6784\u6216\u6808
- **\u4FE1\u4EFB\u8FB9\u754C**\uFF1A\u5916\u90E8\u8F93\u5165\u4ECE\u54EA\u91CC\u8FDB\u5165\u7CFB\u7EDF\uFF1B\u8FDB\u5165\u540E\u6709\u6CA1\u6709\u88AB\u6821\u9A8C\uFF1B\u5185\u90E8\u8C03\u7528\u662F\u5426\u88AB\u8BEF\u5F53\u6210\u53EF\u4FE1\u6765\u6E90
- **\u6CE8\u5165**\uFF1A\u67E5\u8BE2\u62FC\u63A5\u3001\u547D\u4EE4\u62FC\u63A5\u3001\u6A21\u677F\u6CE8\u5165\u3001\u8868\u8FBE\u5F0F\u6CE8\u5165
- **\u51ED\u8BC1**\uFF1A\u5BC6\u94A5\u786C\u7F16\u7801\u3001\u5BC6\u94A5\u8FDB\u65E5\u5FD7\u3001\u5BC6\u94A5\u8FDB\u524D\u7AEF\u4EA7\u7269
- **\u8DEF\u5F84\u4E0E\u53CD\u5E8F\u5217\u5316**\uFF1A\u8DEF\u5F84\u7A7F\u8D8A\u3001\u4E0D\u5B89\u5168\u7684\u53CD\u5E8F\u5217\u5316\u3001SSRF

## \u524D\u7AEF

- **\u6CE8\u5165\u4E0E\u6E32\u67D3**\uFF1A\u76F4\u63A5\u628A\u5916\u90E8\u8F93\u5165\u585E\u8FDB innerHTML / dangerouslySetInnerHTML / v-html / document.write\uFF1B\u6E32\u67D3\u540E\u7AEF\u8FD4\u56DE\u7684\u5BCC\u6587\u672C\u672A\u51C0\u5316\uFF1Bhref \u63A5\u4E86 javascript: \u6216 data:\uFF1B\u628A URL \u53C2\u6570\u62FC\u8FDB\u9009\u62E9\u5668
- **\u51ED\u8BC1\u4E0E\u4FE1\u606F\u66B4\u9732**\uFF1A\u5BC6\u94A5\u5199\u5728\u4EE3\u7801\u91CC\uFF1B\u7528 NEXT_PUBLIC_ / VITE_ \u524D\u7F00\u7684\u73AF\u5883\u53D8\u91CF\u88C5\u5BC6\u94A5\uFF08\u8FD9\u4E9B\u4F1A\u88AB\u6253\u8FDB\u524D\u7AEF\u5305\uFF09\uFF1B\u957F\u671F\u4EE4\u724C\u653E localStorage\uFF1B\u751F\u4EA7\u6784\u5EFA\u4FDD\u7559\u6E90\u7801\u6620\u5C04
- **\u6743\u9650\u4E0E\u8DF3\u8F6C**\uFF1A**\u7528\u6761\u4EF6\u6E32\u67D3\u85CF\u6309\u94AE\u5F53\u4F5C\u6743\u9650\u63A7\u5236\u3001\u540E\u7AEF\u6CA1\u6821\u9A8C**\uFF08\u8FD9\u662F\u6700\u5E38\u89C1\u7684\u8D8A\u6743\uFF0C\u672C\u8D28\u662F\u540E\u7AEF\u7F3A\u9677\uFF09\uFF1B\u628A\u8DEF\u7531\u5B88\u536B\u5F53\u9274\u6743\uFF1B\u5F00\u653E\u91CD\u5B9A\u5411\uFF1B\u76D1\u542C\u8DE8\u7A97\u53E3\u6D88\u606F\u4E0D\u6821\u9A8C\u6765\u6E90
- **\u4F9D\u8D56\u4E0E\u6784\u5EFA**\uFF1A\u5F15 CDN \u811A\u672C\u6CA1\u6709\u5B8C\u6574\u6027\u6821\u9A8C\uFF1Beval / new Function \u6267\u884C\u5B57\u7B26\u4E32\uFF1B\u6DF1\u5408\u5E76\u7528\u6237\u5BF9\u8C61\u5BFC\u81F4\u539F\u578B\u6C61\u67D3
- **\u4F20\u8F93\u4E0E\u5B58\u50A8**\uFF1A\u6587\u4EF6\u7C7B\u578B\u53EA\u5728\u524D\u7AEF\u6821\u9A8C\uFF1B\u654F\u611F\u6570\u636E\u843D\u672C\u5730\u5B58\u50A8\uFF1B\u72B6\u6001\u53D8\u66F4\u8BF7\u6C42\u6CA1\u6709\u9632\u4F2A\u4EE4\u724C

## \u4E0D\u8981\u62A5\u7684

- \u53EA\u662F\u300C\u770B\u8D77\u6765\u4E0D\u5B89\u5168\u300D\u4F46\u7ED9\u4E0D\u51FA\u5229\u7528\u8DEF\u5F84\u7684
- \u547D\u540D\u3001\u683C\u5F0F\u3001\u590D\u6742\u5EA6
- \u4F9D\u8D56\u7248\u672C\u8FC7\u671F\uFF08\u9664\u975E\u4F60\u80FD\u6307\u51FA\u8FD9\u662F\u4E00\u4E2A\u5DF2\u77E5\u53EF\u88AB\u5229\u7528\u7684\u6F0F\u6D1E\uFF0C\u5E76\u4E14\u8BF4\u5F97\u51FA\u5F71\u54CD\u9762\uFF09

## category \u5B57\u6BB5\uFF08\u586B\u9519\u7B49\u4E8E\u6CA1\u62A5\uFF09

\u4E0A\u9762\u90A3\u4E9B\u4E2D\u6587\u540D\u53EA\u662F\u7ED9\u4F60\u7406\u89E3\u7528\u7684\u3002category \u5B57\u6BB5**\u5FC5\u987B\u586B\u4E0B\u8868\u7684\u82F1\u6587\u503C**\uFF1A

| \u4F60\u5224\u65AD\u7684\u662F | \u586B |
| --- | --- |
| \u8D8A\u6743\u3001\u6743\u9650\u6821\u9A8C\u7F3A\u5931 | authz |
| \u6CE8\u5165\uFF08SQL / \u547D\u4EE4 / \u6A21\u677F / \u8868\u8FBE\u5F0F\uFF09 | injection |
| \u51ED\u8BC1\u6216\u654F\u611F\u4FE1\u606F\u66B4\u9732 | secret-exposure |
| \u8DEF\u5F84\u7A7F\u8D8A | path-traversal |
| SSRF | ssrf |
| \u4E0D\u5B89\u5168\u7684\u53CD\u5E8F\u5217\u5316 | unsafe-deserialization |
| \u52A0\u5BC6\u65B9\u5F0F\u8BEF\u7528 | crypto-misuse |
| \u524D\u7AEF\u4FA7\u7684\u6570\u636E\u6216\u6743\u9650\u66B4\u9732 | frontend-exposure |

\u5199\u6210\u4E2D\u6587\u4F1A\u88AB\u5B57\u6BB5\u6821\u9A8C\u76F4\u63A5\u62D2\u7EDD\uFF1A\u4E0D\u662F\u964D\u7EA7\u3001\u4E0D\u662F\u8B66\u544A\uFF0C\u662F**\u6574\u6761\u7ED3\u8BBA\u88AB\u4E22\u6389**\u3002
\u5B81\u53EF\u5C11\u62A5\u4E00\u6761\uFF0C\u4E5F\u4E0D\u8981\u7528\u4E2D\u6587\u53BB\u78B0\u8FD0\u6C14\u2014\u2014\u4E22\u6389\u7684\u6761\u76EE\u4F5C\u8005\u6C38\u8FDC\u770B\u4E0D\u5230\u3002

## \u8BC1\u636E\u89C4\u5219

evidence \u5FC5\u987B\u662F\u6539\u52A8\u91CC**\u4E00\u5B57\u4E0D\u5DEE**\u7684\u4E00\u884C\u4EE3\u7801\u3002\u4E0D\u8981\u6539\u5199\u3001\u4E0D\u8981\u7701\u7565\u3001\u4E0D\u8981\u5408\u5E76\u591A\u884C\u3002
\u590D\u5236\u4E0D\u4E0A\u5C31\u4E0D\u8981\u62A5\u3002

## \u6BCF\u6761\u5FC5\u987B\u5199\u6E05

1. **\u8C01\u80FD\u5229\u7528**\uFF1A\u672A\u767B\u5F55\u7528\u6237 / \u666E\u901A\u7528\u6237 / \u540C\u79DF\u6237\u7684\u5176\u4ED6\u7528\u6237 / \u5185\u90E8\u670D\u52A1
2. **\u600E\u4E48\u5229\u7528**\uFF1A\u5177\u4F53\u8BF7\u6C42\u6216\u64CD\u4F5C\u6B65\u9AA4
3. **\u540E\u679C**\uFF1A\u8BFB\u5230\u4EC0\u4E48\u3001\u6539\u6389\u4EC0\u4E48\u3001\u62FF\u5230\u4EC0\u4E48

\u4E09\u6761\u5199\u4E0D\u5168\u5C31\u4E0D\u8981\u62A5\u2014\u2014\u300C\u5EFA\u8BAE\u52A0\u5F3A\u6821\u9A8C\u300D\u8FD9\u79CD\u8BDD\u6CA1\u6709\u4EF7\u503C\u3002

## \u7F6E\u4FE1\u5EA6

\u4E0D\u786E\u5B9A\u5C31\u628A confidence \u8C03\u4F4E\u3002\u8FD9\u4E2A\u7EF4\u5EA6\u5C24\u5176\u5BB9\u6613\u8BEF\u62A5\uFF08\u770B\u5230\u5B57\u7B26\u4E32\u62FC\u63A5\u5C31\u62A5\u6CE8\u5165\uFF0C\u5176\u5B9E\u53C2\u6570\u662F\u5E38\u91CF\uFF09\uFF0C
\u5B81\u53EF\u7ED9\u4F4E\u7F6E\u4FE1\u5EA6\u8BA9\u5B83\u6392\u5728\u540E\u9762\uFF0C\u4E5F\u4E0D\u8981\u5199\u4E00\u4E2A\u865A\u9AD8\u7684\u5206\u6570\u3002`;

// src/core/reviewers/dimensions/security/index.ts
var SECURITY_CATEGORIES = [
  "injection",
  "authz",
  "secret-exposure",
  "unsafe-deserialization",
  "path-traversal",
  "ssrf",
  "crypto-misuse",
  "frontend-exposure"
];
var securityReviewer = {
  id: "security",
  promptVersion: PROMPT_VERSION3,
  allowedCategories: SECURITY_CATEGORIES,
  maxSeverity: "blocker",
  systemPrompt: `${SYSTEM_PROMPT3}

${OUTPUT_CONTRACT}`,
  schema: buildSchema(SECURITY_CATEGORIES, "blocker"),
  buildUserMessage: (input) => buildUserMessage(input)
};

// src/providers/structured.ts
function buildResponseFormat(mode, schema, schemaName) {
  if (mode === "none" || schema === null) return null;
  if (mode === "json-object") {
    return { type: "json_object" };
  }
  return {
    type: "json_schema",
    json_schema: { name: schemaName, schema, strict: false }
  };
}
function parseJsonPayload(text2) {
  const trimmed = text2.trim();
  if (trimmed === "") return { ok: false, reason: "empty" };
  const direct = tryParse(trimmed);
  if (direct !== null) return { ok: true, value: direct };
  const start = firstJsonStart(trimmed);
  if (start < 0) return { ok: false, reason: "not-json" };
  const closing = trimmed[start] === "{" ? "}" : "]";
  const end = findMatching(trimmed, start, closing);
  if (end < 0) return { ok: false, reason: "not-json" };
  const sliced = tryParse(trimmed.slice(start, end + 1));
  return sliced === null ? { ok: false, reason: "not-json" } : { ok: true, value: sliced };
}
function tryParse(text2) {
  try {
    return JSON.parse(text2);
  } catch {
    return null;
  }
}
function firstJsonStart(text2) {
  for (let index = 0; index < text2.length; index += 1) {
    const char = text2[index];
    if (char === "{" || char === "[") return index;
  }
  return -1;
}
function findMatching(text2, start, closing) {
  const opening = text2[start] ?? "";
  let depth = 0;
  let quote = null;
  for (let index = start; index < text2.length; index += 1) {
    const char = text2[index] ?? "";
    if (quote !== null) {
      if (char === "\\") index += 1;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === '"') {
      quote = char;
      continue;
    }
    if (char === opening) depth += 1;
    else if (char === closing) {
      depth -= 1;
      if (depth === 0) return index;
    }
  }
  return -1;
}
function isSchemaRejection(status, body) {
  if (status !== 400 && status !== 422) return false;
  const text2 = JSON.stringify(body).toLowerCase();
  return text2.includes("response_format") || text2.includes("json_schema") || text2.includes("json schema");
}

// src/core/reviewers/run.ts
var ZERO = {
  uncachedInput: 0,
  cacheWriteShort: 0,
  cacheWriteLong: 0,
  cacheRead: 0,
  output: 0
};
function sumUsage(a, b) {
  return {
    uncachedInput: a.uncachedInput + b.uncachedInput,
    cacheWriteShort: a.cacheWriteShort + b.cacheWriteShort,
    cacheWriteLong: a.cacheWriteLong + b.cacheWriteLong,
    cacheRead: a.cacheRead + b.cacheRead,
    output: a.output + b.output
  };
}
async function runReviewer(options) {
  const { client, spec } = options;
  let input = options.input;
  let usage = ZERO;
  let calls = 0;
  const request2 = (current) => ({
    model: options.model,
    messages: [
      { role: "system", content: spec.systemPrompt },
      { role: "user", content: spec.buildUserMessage(current) }
    ],
    temperature: options.temperature ?? 0.2,
    maxOutputTokens: options.maxOutputTokens ?? 4096,
    schema: spec.schema,
    schemaName: spec.id
  });
  let response = await client.complete(request2(input));
  calls += 1;
  usage = sumUsage(usage, response.usage);
  if (response.finishReason === "length") {
    const shrunk = options.shrink?.(input) ?? null;
    if (shrunk === null) {
      return {
        findings: [],
        rejections: [
          {
            reviewer: spec.id,
            file: input.file ?? "(\u5168\u5C40)",
            line: 0,
            title: "(\u8F93\u51FA\u88AB\u622A\u65AD)",
            reason: "schema-invalid",
            detail: "\u8F93\u51FA\u8FBE\u5230\u957F\u5EA6\u4E0A\u9650\uFF0C\u4E14\u65E0\u6CD5\u8FDB\u4E00\u6B65\u6536\u7F29\u6750\u6599"
          }
        ],
        usage,
        truncated: true,
        clamped: 0,
        structuredMode: response.structuredMode,
        calls
      };
    }
    input = shrunk;
    response = await client.complete(request2(input));
    calls += 1;
    usage = sumUsage(usage, response.usage);
    if (response.finishReason === "length") {
      return {
        findings: [],
        rejections: [
          {
            reviewer: spec.id,
            file: input.file ?? "(\u5168\u5C40)",
            line: 0,
            title: "(\u8F93\u51FA\u88AB\u622A\u65AD)",
            reason: "schema-invalid",
            detail: "\u6536\u7F29\u6750\u6599\u540E\u4ECD\u8FBE\u5230\u957F\u5EA6\u4E0A\u9650"
          }
        ],
        usage,
        truncated: true,
        clamped: 0,
        structuredMode: response.structuredMode,
        calls
      };
    }
  }
  const parsed = parseJsonPayload(response.text);
  if (!parsed.ok) {
    return {
      findings: [],
      rejections: [
        {
          reviewer: spec.id,
          file: input.file ?? "(\u5168\u5C40)",
          line: 0,
          title: "(\u8F93\u51FA\u65E0\u6CD5\u89E3\u6790)",
          reason: "schema-invalid",
          detail: parsed.reason === "empty" ? "\u6A21\u578B\u8FD4\u56DE\u7A7A\u5185\u5BB9" : "\u8F93\u51FA\u4E2D\u627E\u4E0D\u5230\u5408\u6CD5 JSON"
        }
      ],
      usage,
      truncated: false,
      clamped: 0,
      structuredMode: response.structuredMode,
      calls
    };
  }
  const outcome = validateRawFindings(parsed.value, spec);
  const rejections = outcome.rejected.map((item) => ({
    reviewer: spec.id,
    file: item.file ?? input.file ?? "(\u5168\u5C40)",
    line: item.line ?? 0,
    title: item.title,
    reason: item.reason,
    detail: item.detail
  }));
  return {
    findings: outcome.accepted,
    rejections,
    usage,
    truncated: false,
    clamped: outcome.clamped,
    structuredMode: response.structuredMode,
    calls
  };
}

// src/core/reconcile/fingerprint.ts
import { createHash as createHash2 } from "node:crypto";
function normalize(evidence) {
  return evidence.replace(/\s+/g, " ").trim();
}
function computeFingerprint(input) {
  const payload = [input.file, input.reviewer, normalize(input.evidence)].join("\0");
  return createHash2("sha256").update(payload, "utf8").digest("hex").slice(0, 16);
}

// src/core/verify/evidence.ts
function normalizeLine(text2) {
  let value = text2;
  if (value.startsWith("+") || value.startsWith("-")) value = value.slice(1);
  return value.replace(/\s+/g, " ").trim();
}
function evidenceLines(evidence) {
  return evidence.split("\n").map((line) => normalizeLine(line)).filter((line) => line !== "");
}
function significantLines(lines) {
  const result = [];
  for (let index = 0; index < lines.length; index += 1) {
    const text2 = normalizeLine(lines[index] ?? "");
    if (text2 === "") continue;
    result.push({ line: index + 1, text: text2 });
  }
  return result;
}
function findEvidence(lines, evidence) {
  const wanted = evidenceLines(evidence);
  if (wanted.length === 0) return [];
  const pool = significantLines(lines);
  if (pool.length < wanted.length) return [];
  const hits = [];
  for (let start = 0; start + wanted.length <= pool.length; start += 1) {
    let matched = true;
    for (let offset = 0; offset < wanted.length; offset += 1) {
      if (pool[start + offset]?.text !== wanted[offset]) {
        matched = false;
        break;
      }
    }
    if (matched) hits.push(pool[start]?.line ?? 0);
  }
  return hits;
}
function matchesAt(lines, startLine, evidence) {
  const wanted = evidenceLines(evidence);
  if (wanted.length === 0) return false;
  const pool = significantLines(lines);
  const index = pool.findIndex((item) => item.line >= startLine);
  if (index < 0) return false;
  const actual = pool[index]?.line ?? 0;
  if (actual > startLine) {
    const between = lines.slice(startLine - 1, actual - 1);
    if (!between.every((line) => normalizeLine(line) === "")) return false;
  }
  for (let offset = 0; offset < wanted.length; offset += 1) {
    if (pool[index + offset]?.text !== wanted[offset]) return false;
  }
  return true;
}

// src/core/verify/locate.ts
function contentLines(input, path) {
  const content = input.fileContents.get(path) ?? null;
  return content === null ? null : content.split("\n");
}
function diffTexts(input, path, side) {
  const map = /* @__PURE__ */ new Map();
  const file = input.diff.files.find((item) => item.path === path);
  if (file === void 0) return map;
  for (const line of file.lines) {
    const number = side === "new" ? line.anchor.newLine : line.anchor.oldLine;
    if (number === null) continue;
    map.set(number, line.text);
  }
  return map;
}
function tryModelLine(input) {
  const { raw, index } = input;
  const anchor = lookupAnchor(index, raw.file, raw.line, raw.side);
  if (anchor === null) return null;
  if (anchor.kind === "removed") {
    const text2 = diffTexts(input, raw.file, "old").get(raw.line);
    return text2 !== void 0 && matchesAt([text2], 1, raw.evidence) ? anchor : null;
  }
  const lines = contentLines(input, raw.file);
  if (lines === null) {
    const text2 = diffTexts(input, raw.file, "new").get(raw.line);
    return text2 !== void 0 && matchesAt([text2], 1, raw.evidence) ? anchor : null;
  }
  return matchesAt(lines, raw.line, raw.evidence) ? anchor : null;
}
function tryHunk(input) {
  let sawAmbiguous = 0;
  for (const side of ["new", "old"]) {
    const texts = diffTexts(input, input.raw.file, side);
    if (texts.size === 0) continue;
    const numbers = [...texts.keys()].sort((a, b) => a - b);
    const haystack = numbers.map((number) => texts.get(number) ?? "");
    const hits = findEvidence(haystack, input.raw.evidence);
    if (hits.length > 1) {
      sawAmbiguous = Math.max(sawAmbiguous, hits.length);
      continue;
    }
    if (hits.length === 0) continue;
    const lineNumber = numbers[(hits[0] ?? 0) - 1];
    if (lineNumber === void 0) continue;
    const anchor = lookupAnchor(input.index, input.raw.file, lineNumber, side);
    if (anchor !== null) return { kind: "hit", anchor, origin: "evidence-hunk" };
  }
  return sawAmbiguous > 0 ? { kind: "ambiguous", count: sawAmbiguous } : { kind: "miss" };
}
function tryWholeFile(input) {
  const lines = contentLines(input, input.raw.file);
  if (lines === null) return { kind: "miss" };
  const hits = findEvidence(lines, input.raw.evidence);
  if (hits.length === 0) return { kind: "miss" };
  const anchorable = hits.map((line) => lookupAnchor(input.index, input.raw.file, line, "new")).filter((anchor) => anchor !== null);
  if (anchorable.length === 1 && anchorable[0] !== void 0) {
    return { kind: "hit", anchor: anchorable[0], origin: "evidence-file" };
  }
  if (anchorable.length > 1) return { kind: "ambiguous", count: anchorable.length };
  return hits.length >= 1 ? { kind: "outside" } : { kind: "miss" };
}
function tryOtherFiles(input) {
  const candidates = [];
  for (const file of input.diff.files) {
    if (file.path === input.raw.file) continue;
    if (file.skippedReason !== null) continue;
    const texts = diffTexts(input, file.path, "new");
    const numbers = [...texts.keys()].sort((a, b) => a - b);
    const haystack = numbers.map((number) => texts.get(number) ?? "");
    for (const hit of findEvidence(haystack, input.raw.evidence)) {
      const lineNumber = numbers[hit - 1];
      if (lineNumber === void 0) continue;
      const anchor = lookupAnchor(input.index, file.path, lineNumber, "new");
      if (anchor !== null) candidates.push(anchor);
    }
  }
  if (candidates.length === 1 && candidates[0] !== void 0) {
    return { kind: "hit", anchor: candidates[0], origin: "evidence-crossfile" };
  }
  if (candidates.length > 1) return { kind: "ambiguous", count: candidates.length };
  return { kind: "miss" };
}
function locate(input) {
  const { raw, index } = input;
  const fileKnown = index.files.has(raw.file);
  const trusted = tryModelLine(input);
  if (trusted !== null) return { ok: true, anchor: trusted, origin: "model-line" };
  let ambiguous = 0;
  let sawOutside = false;
  if (fileKnown) {
    const hunk = tryHunk(input);
    if (hunk.kind === "hit") return { ok: true, anchor: hunk.anchor, origin: hunk.origin };
    if (hunk.kind === "ambiguous") ambiguous = Math.max(ambiguous, hunk.count);
    const whole = tryWholeFile(input);
    if (whole.kind === "hit") return { ok: true, anchor: whole.anchor, origin: whole.origin };
    if (whole.kind === "ambiguous") ambiguous = Math.max(ambiguous, whole.count);
    if (whole.kind === "outside") sawOutside = true;
  }
  const crossfile = tryOtherFiles(input);
  if (crossfile.kind === "hit")
    return { ok: true, anchor: crossfile.anchor, origin: crossfile.origin };
  if (crossfile.kind === "ambiguous") ambiguous = Math.max(ambiguous, crossfile.count);
  if (ambiguous > 1) {
    return {
      ok: false,
      reason: "unlocatable",
      detail: `\u8BC1\u636E\u6587\u672C\u547D\u4E2D ${String(ambiguous)} \u5904\uFF0C\u65E0\u6CD5\u786E\u5B9A\u552F\u4E00\u4F4D\u7F6E\uFF08\u4E0D\u731C\uFF09`
    };
  }
  if (sawOutside) {
    return {
      ok: false,
      reason: "unlocatable",
      detail: "\u8BC1\u636E\u6587\u672C\u5B58\u5728\u4E8E\u8BE5\u6587\u4EF6\uFF0C\u4F46\u4E0D\u5728\u672C\u6B21\u6539\u52A8\u8303\u56F4\u5185\uFF0C\u65E0\u6CD5\u843D\u884C\u5185\u8BC4\u8BBA"
    };
  }
  if (!fileKnown) {
    return {
      ok: false,
      reason: "file-not-in-diff",
      detail: `\u6587\u4EF6 ${raw.file} \u4E0D\u5728\u672C\u6B21\u6539\u52A8\u4E2D\uFF0C\u4E14\u5176\u4ED6\u6539\u52A8\u6587\u4EF6\u91CC\u6CA1\u6709\u552F\u4E00\u5339\u914D`
    };
  }
  return {
    ok: false,
    reason: "evidence-mismatch",
    detail: "\u8BC1\u636E\u6587\u672C\u5728\u672C\u6587\u4EF6\u4E0E\u5176\u4ED6\u6539\u52A8\u6587\u4EF6\u4E2D\u90FD\u627E\u4E0D\u5230\uFF08\u53EF\u80FD\u88AB\u6539\u5199\u6216\u7F16\u9020\uFF09"
  };
}

// src/core/verify/chain.ts
function severityRank(severity) {
  return SEVERITY_ORDER2.indexOf(severity);
}
function verifyFindings(items, options) {
  const findings = [];
  const rejections = [];
  const seen = /* @__PURE__ */ new Set();
  for (const { raw, reviewer } of items) {
    const reject = (reason, detail) => {
      rejections.push({
        reviewer,
        file: raw.file,
        line: raw.line,
        title: raw.title,
        reason,
        detail
      });
    };
    const located = locate({
      raw,
      diff: options.diff,
      index: options.index,
      fileContents: options.fileContents
    });
    if (!located.ok) {
      reject(located.reason, located.detail);
      continue;
    }
    const floor = options.severityFloors[reviewer];
    if (floor !== void 0 && severityRank(raw.severity) > severityRank(floor)) {
      reject("below-severity-floor", `\u4E25\u91CD\u5EA6 ${raw.severity} \u4F4E\u4E8E\u8BE5\u7EF4\u5EA6\u4E0B\u9650 ${floor}`);
      continue;
    }
    const fingerprint = computeFingerprint({
      file: located.anchor.file,
      reviewer,
      title: raw.title,
      evidence: raw.evidence
    });
    if (seen.has(fingerprint)) {
      reject("duplicate", `\u4E0E\u672C\u8F6E\u5DF2\u6709\u6761\u76EE\u6307\u7EB9\u76F8\u540C\uFF08${fingerprint}\uFF09`);
      continue;
    }
    seen.add(fingerprint);
    findings.push({
      fingerprint,
      reviewer,
      anchor: located.anchor,
      positionOrigin: located.origin,
      severity: raw.severity,
      category: raw.category,
      title: raw.title,
      body: raw.body,
      evidence: raw.evidence,
      suggestion: raw.suggestion,
      confidence: raw.confidence,
      // 上下文行在改动前就存在，不是本次引入的
      preexisting: located.anchor.kind === "context",
      // 只有真正新增/删除的行才允许进行内评论
      scope: located.anchor.kind === "context" ? "function" : "changed"
    });
  }
  const inlineCandidates = findings.filter((finding) => finding.scope === "changed").sort((a, b) => {
    const bySeverity2 = severityRank(a.severity) - severityRank(b.severity);
    if (bySeverity2 !== 0) return bySeverity2;
    return b.confidence - a.confidence;
  });
  const inline = inlineCandidates.slice(0, Math.max(0, options.maxInline));
  const inlineSet = new Set(inline.map((finding) => finding.fingerprint));
  return {
    findings,
    inline,
    summaryOnly: findings.filter((finding) => !inlineSet.has(finding.fingerprint)),
    rejections
  };
}

// src/core/gate/gate.ts
function severityRank2(severity) {
  return ["blocker", "major", "minor", "nit"].indexOf(severity);
}
function decideGate(finding, config, isRuleFact, exemptions) {
  if (!config.enabled) return { block: false, reason: "\u95E8\u7981\u672A\u542F\u7528" };
  if (severityRank2(finding.severity) > severityRank2(config.blockingSeverity)) {
    return { block: false, reason: `\u4E25\u91CD\u5EA6 ${finding.severity} \u672A\u8FBE\u963B\u585E\u95E8\u69DB` };
  }
  if (!config.blockingCategories.includes(finding.category)) {
    return { block: false, reason: `\u7C7B\u522B\u4E0D\u5728\u5141\u8BB8\u963B\u585E\u7684\u8303\u56F4\uFF08${finding.category}\uFF09` };
  }
  if (!isRuleFact && finding.confidence < config.confidenceThreshold) {
    return {
      block: false,
      reason: `\u7F6E\u4FE1\u5EA6 ${finding.confidence.toFixed(2)} \u4F4E\u4E8E\u95E8\u69DB ${String(config.confidenceThreshold)}`
    };
  }
  if (exemptions.some((exemption) => exemption.fingerprint === finding.fingerprint)) {
    return { block: false, reason: "\u5DF2\u8C41\u514D" };
  }
  return { block: true, reason: `\u4E25\u91CD\u5EA6 ${finding.severity} + \u7C7B\u522B ${finding.category}` };
}
function evaluateGate(input) {
  if (!input.config.enabled) {
    return { conclusion: "neutral", blockers: [], exempted: [], demoted: [] };
  }
  const blockers = [];
  const exempted = [];
  const demoted = [];
  for (const finding of input.findings) {
    const ruleFact = input.ruleFingerprints?.has(finding.fingerprint) ?? false;
    const decision = decideGate(finding, input.config, ruleFact, input.exemptions);
    if (decision.block) {
      blockers.push(finding);
      continue;
    }
    if (decision.reason === "\u5DF2\u8C41\u514D") {
      exempted.push(finding);
      continue;
    }
    if (severityRank2(finding.severity) <= severityRank2(input.config.blockingSeverity)) {
      demoted.push({ finding, reason: decision.reason ?? "\u672A\u8FBE\u963B\u585E\u6761\u4EF6" });
    }
  }
  return {
    conclusion: blockers.length > 0 ? "failure" : "success",
    blockers,
    exempted,
    demoted
  };
}
function gateTitle(outcome) {
  if (outcome.blockers.length === 0) {
    return outcome.exempted.length > 0 ? `\u901A\u8FC7\uFF08${String(outcome.exempted.length)} \u6761\u5DF2\u8C41\u514D\uFF09` : "\u901A\u8FC7";
  }
  return `\u963B\u6B62\u5408\u5E76\uFF1A${String(outcome.blockers.length)} \u4E2A\u81F4\u547D\u95EE\u9898`;
}

// src/core/engine.ts
var SPECS = {
  correctness: correctnessReviewer,
  security: securityReviewer,
  convention: conventionReviewer
};
var ZERO2 = {
  uncachedInput: 0,
  cacheWriteShort: 0,
  cacheWriteLong: 0,
  cacheRead: 0,
  output: 0
};
function buildBundle(snapshot, config, filePaths) {
  const base = assembleContext(snapshot, {
    contextWindow: config.llm.contextWindow,
    maxOutputTokens: config.llm.maxOutputTokens
  });
  const contents = /* @__PURE__ */ new Map();
  for (const [path, content] of snapshot.fileContents) {
    if (content !== null) contents.set(path, content);
  }
  if (contents.size === 0) return base;
  const index = buildSymbolIndex(contents);
  const extra = buildImportSegments(index, filePaths, {
    depth: config.review.crossFileDepth,
    maxFiles: config.review.crossFileMaxFiles
  });
  if (extra.length === 0) return base;
  return assembleContext(snapshot, {
    contextWindow: config.llm.contextWindow,
    maxOutputTokens: config.llm.maxOutputTokens,
    extraSegments: extra
  });
}
function shrinkToChangedOnly(input) {
  const l0 = input.segments.filter((segment) => segment.tier === "L0");
  return l0.length === input.segments.length ? null : l0;
}
async function runReview(request2, deps) {
  const startedAt = (/* @__PURE__ */ new Date()).toISOString();
  const warnings = [];
  const progress = deps.onProgress ?? (() => {
  });
  const snapshot = await deps.fetchSnapshot(request2);
  let diff = snapshot.diff;
  const promptVersions = {
    correctness: correctnessReviewer.promptVersion,
    security: securityReviewer.promptVersion,
    convention: conventionReviewer.promptVersion
  };
  const configHash = computeConfigHash(deps.config);
  const promptHash = computePromptHash(promptVersions);
  if (deps.config.review.checkpoint && deps.checkpoint !== void 0) {
    const decision = await decideCheckpoint({
      enabled: true,
      summary: deps.checkpoint.summary,
      expectedAuthor: deps.checkpoint.expectedAuthor,
      current: { headSha: diff.headSha, baseSha: diff.baseSha, configHash, promptHash },
      isAncestor: deps.checkpoint.isAncestor
    });
    if (decision.use) {
      try {
        const incremental = await deps.checkpoint.fetchIncremental(decision.from, decision.to);
        if (incremental !== null) {
          diff = incremental;
          progress(
            `\u68C0\u67E5\u70B9\u547D\u4E2D\uFF0C\u53EA\u5BA1 ${decision.from.slice(0, 7)}..${decision.to.slice(0, 7)} \u7684\u589E\u91CF`
          );
        } else {
          warnings.push({
            kind: "other",
            message: "\u53D6\u589E\u91CF\u6539\u52A8\u5931\u8D25\uFF0C\u5DF2\u9000\u56DE\u5168\u91CF\u5BA1\u67E5",
            target: null
          });
        }
      } catch (error) {
        warnings.push({
          kind: "other",
          message: `\u53D6\u589E\u91CF\u6539\u52A8\u5931\u8D25\uFF0C\u5DF2\u9000\u56DE\u5168\u91CF\u5BA1\u67E5\uFF1A${asMessage(error)}`,
          target: null
        });
      }
    } else if (decision.reason === "foreign-author" || decision.reason === "unparsable" || decision.reason === "not-ancestor" || decision.reason === "basis-changed" || decision.reason === "base-moved") {
      warnings.push({ kind: "other", message: `\u672A\u4F7F\u7528\u68C0\u67E5\u70B9\uFF1A${decision.detail}`, target: null });
    }
  }
  const index = buildLineIndex(diff);
  progress(
    `\u53D6\u5230 ${String(diff.files.length)} \u4E2A\u6587\u4EF6\uFF0C\u57FA\u51C6 ${diff.baseSha.slice(0, 7)} \u2192 ${diff.headSha.slice(0, 7)}`
  );
  const reviewable = diff.files.filter(
    (file) => file.skippedReason === null && file.lines.length > 0
  );
  const paths = reviewable.map((file) => file.path);
  let bundle;
  try {
    bundle = buildBundle(snapshot, deps.config, paths);
  } catch (error) {
    bundle = assembleContext(snapshot, {
      contextWindow: deps.config.llm.contextWindow,
      maxOutputTokens: deps.config.llm.maxOutputTokens
    });
    warnings.push({
      kind: "other",
      message: `\u8DE8\u6587\u4EF6\u5C55\u5F00\u5931\u8D25\uFF0C\u5DF2\u9000\u56DE\u5355\u6587\u4EF6\u4E0A\u4E0B\u6587\uFF1A${asMessage(error)}`,
      target: null
    });
  }
  const collected = [];
  const rejections = [];
  const totals = { calls: 0, usage: ZERO2 };
  let completed = 0;
  let failed = 0;
  let truncatedCount = 0;
  let budgetExhausted = false;
  const dimensions = deps.config.review.dimensions;
  const changedByPath = new Map(diff.files.map((file) => [file.path, file.changedCount]));
  const modelFor = (reviewer, filePath) => {
    const decision = routeModel({
      config: deps.config.routing,
      reviewer,
      filePath,
      changedLines: filePath === null ? 0 : changedByPath.get(filePath) ?? 0
    });
    return decision.model ?? deps.config.llm.model;
  };
  for (const file of reviewable) {
    const segments = selectForFile(bundle, file.path);
    const correctnessRules = renderRuleBlock(
      selectRules(BUILTIN_RULES, {
        path: file.path,
        dimensions: ["coding", "exception-log", "database", "unit-test"]
      })
    );
    const securityRules = renderRuleBlock(
      selectRules(BUILTIN_RULES, { path: file.path, dimensions: ["security"] })
    );
    if (dimensions.correctness.enabled && !budgetExhausted) {
      try {
        const result = await runWithRetry(
          deps,
          SPECS.correctness,
          {
            file: file.path,
            segments,
            ...correctnessRules === "" ? {} : { note: correctnessRules }
          },
          modelFor("correctness", file.path),
          (input) => {
            const shrunk = shrinkToChangedOnly(input);
            return shrunk === null ? null : { ...input, segments: shrunk };
          }
        );
        totals.calls += result.calls;
        totals.usage = sumUsage(totals.usage, result.usage);
        rejections.push(...result.rejections);
        if (result.truncated) truncatedCount += 1;
        for (const raw of result.findings) collected.push({ raw, reviewer: "correctness" });
        budgetExhausted = isOverBudget(totals.usage, deps.config);
      } catch (error) {
        failed += 1;
        warnings.push({
          kind: "other",
          message: `\u6B63\u786E\u6027\u5BA1\u67E5\u5931\u8D25\uFF1A${asMessage(error)}`,
          target: file.path
        });
      }
    }
    if (dimensions.security.enabled) {
      const decision = routeForSecurity({
        path: file.path,
        content: snapshot.fileContents.get(file.path) ?? null
      });
      if (decision.send && !budgetExhausted) {
        try {
          const result = await runWithRetry(
            deps,
            SPECS.security,
            {
              file: file.path,
              segments,
              note: [`\u5B89\u5168\u5BA1\u67E5\u539F\u56E0\uFF1A${decision.reasons.join("\u3001")}`, securityRules].filter((part) => part !== "").join("\n\n")
            },
            modelFor("security", file.path)
          );
          totals.calls += result.calls;
          totals.usage = sumUsage(totals.usage, result.usage);
          rejections.push(...result.rejections);
          if (result.truncated) truncatedCount += 1;
          for (const raw of result.findings) collected.push({ raw, reviewer: "security" });
          budgetExhausted = isOverBudget(totals.usage, deps.config);
        } catch (error) {
          failed += 1;
          warnings.push({
            kind: "other",
            message: `\u5B89\u5168\u5BA1\u67E5\u5931\u8D25\uFF1A${asMessage(error)}`,
            target: file.path
          });
        }
      }
    }
    completed += 1;
  }
  if (dimensions.convention.enabled) {
    const muted = shouldMuteConvention(
      diff.files.map((file) => file.path),
      deps.config.review.respectLintConfig
    );
    if (muted) {
      progress("\u68C0\u6D4B\u5230\u9759\u6001\u68C0\u67E5\u914D\u7F6E\uFF0C\u89C4\u8303\u6027\u7EF4\u5EA6\u5DF2\u9759\u97F3");
    } else {
      try {
        const globalSegments = bundle.segments.filter(
          (segment) => segment.tier === "L0" || segment.tier === "L3"
        );
        const result = await runReviewer({
          client: deps.client,
          spec: SPECS.convention,
          input: {
            file: null,
            segments: globalSegments,
            note: [
              "\u8FD9\u662F\u5168\u5C40\u89C6\u89D2\uFF0C\u8BF7\u6BD4\u8F83\u4E0D\u540C\u6587\u4EF6\u4E4B\u95F4\u7684\u5199\u6CD5\u662F\u5426\u4E00\u81F4",
              globalRules(diff.files.map((file) => file.path))
            ].filter((part) => part !== "").join("\n\n")
          },
          model: modelFor("convention", null),
          temperature: deps.config.llm.temperature,
          maxOutputTokens: deps.config.llm.maxOutputTokens
        });
        totals.calls += result.calls;
        totals.usage = sumUsage(totals.usage, result.usage);
        rejections.push(...result.rejections);
        for (const raw of result.findings) collected.push({ raw, reviewer: "convention" });
      } catch (error) {
        warnings.push({
          kind: "other",
          message: `\u89C4\u8303\u6027\u5BA1\u67E5\u5931\u8D25\uFF1A${asMessage(error)}`,
          target: null
        });
      }
    }
  }
  const contents = /* @__PURE__ */ new Map();
  for (const [path, content] of snapshot.fileContents) {
    if (content !== null) contents.set(path, content);
  }
  try {
    const symbolIndex = buildSymbolIndex(contents);
    const ruleOutcome = checkSignatureChanges(findSignatureChanges(diff), symbolIndex);
    for (const raw of ruleOutcome.findings) collected.push({ raw, reviewer: "correctness" });
  } catch (error) {
    warnings.push({
      kind: "other",
      message: `\u7B7E\u540D\u53D8\u5316\u68C0\u67E5\u672A\u6267\u884C\uFF1A${asMessage(error)}`,
      target: null
    });
  }
  const verified = verifyFindings(collected, {
    diff,
    index,
    fileContents: snapshot.fileContents,
    severityFloors: {
      correctness: dimensions.correctness.severityFloor,
      security: dimensions.security.severityFloor,
      convention: dimensions.convention.severityFloor
    },
    maxInline: deps.config.review.maxInlineComments
  });
  const allRejections = [...rejections, ...verified.rejections];
  if (budgetExhausted) {
    warnings.push({
      kind: "budget",
      message: `\u672C\u8F6E\u56E0\u8D39\u7528\u4E0A\u9650\uFF08$${String(deps.config.review.maxBudgetUsd)}\uFF09\u63D0\u524D\u4E2D\u6B62\uFF0C\u7ED3\u679C\u4E0D\u5B8C\u6574`,
      target: null
    });
  }
  if (truncatedCount > 0) {
    warnings.push({
      kind: "truncated",
      message: `\u6709 ${String(truncatedCount)} \u6B21\u8C03\u7528\u56E0\u8F93\u51FA\u8D85\u957F\u88AB\u622A\u65AD\uFF0C\u76F8\u5173\u6587\u4EF6\u7684\u7ED3\u8BBA\u53EF\u80FD\u4E0D\u5B8C\u6574`,
      target: null
    });
  }
  const plan = planActions({
    findings: verified.findings,
    inline: verified.inline,
    existing: snapshot.existingComments,
    renderBody: (finding) => renderInlineBody(finding, {
      promptVersion: SPECS[finding.reviewer].promptVersion,
      // 标记里记的是**实际使用的模型**：被路由降档时它与默认模型不同，
      // 这正是事后解释「为什么这条结论变了」需要的证据
      model: modelFor(finding.reviewer, finding.anchor.file)
    })
  });
  const summaryMarkdown = renderSummary({
    findings: verified.findings,
    summaryOnly: verified.summaryOnly,
    inlineCount: verified.inline.length,
    baseSha: diff.baseSha,
    headSha: diff.headSha,
    trimmedSegments: bundle.trim.dropped.length,
    promptVersions,
    warnings: [...warnings, ...plan.warnings],
    rejectedCount: allRejections.length,
    ...deps.config.review.checkpoint ? { checkpoint: buildCheckpointState(diff, configHash, promptHash) } : {}
  });
  const gateOutcome = deps.config.gate.enabled ? evaluateGate({
    findings: verified.findings,
    config: deps.config.gate,
    exemptions: deps.exemptions ?? []
  }) : null;
  if (deps.port !== null && deps.port !== void 0 && !request2.dryRun) {
    const outcome = await publish({
      port: deps.port,
      actions: plan.actions,
      summaryBody: deps.config.output.summary ? summaryMarkdown : null,
      resolveMode: deps.config.output.resolveMode,
      now: deps.now
    });
    warnings.push(...outcome.warnings);
    if (outcome.summary === "failed") {
      warnings.push({ kind: "other", message: "\u6458\u8981\u8BC4\u8BBA\u5199\u5165\u5931\u8D25", target: null });
    }
    for (const failure of outcome.failed) {
      warnings.push({
        kind: "other",
        message: `${failure.action} \u5931\u8D25\uFF1A${failure.detail}`,
        target: null
      });
    }
  }
  if (gateOutcome !== null && deps.checkPort !== void 0 && deps.checkPort !== null && !request2.dryRun) {
    const annotations = gateOutcome.blockers.slice(0, 50).map((finding) => ({
      path: finding.anchor.file,
      // 注解要求起止行都存在；删除行用旧侧行号，平台接受
      startLine: finding.anchor.newLine ?? finding.anchor.oldLine ?? 1,
      endLine: finding.anchor.newLine ?? finding.anchor.oldLine ?? 1,
      level: "failure",
      title: finding.title,
      message: finding.body
    }));
    const result = await deps.checkPort.publish({
      name: "AI \u4EE3\u7801\u5BA1\u67E5",
      headSha: diff.headSha,
      conclusion: gateOutcome.conclusion,
      title: gateTitle(gateOutcome),
      summary: gateOutcome.blockers.map((finding) => `- ${finding.anchor.file}: ${finding.title}`).join("\n"),
      annotations
    });
    if (!result.ok) {
      warnings.push({
        kind: "permission",
        message: `\u5199\u68C0\u67E5\u8FD0\u884C\u5931\u8D25\uFF0C\u672C\u8F6E\u4E0D\u4F1A\u963B\u6B62\u5408\u5E76\uFF1A${result.failure.message}`,
        target: null
      });
    }
  }
  const coverage = {
    planned: reviewable.length,
    completed,
    skipped: diff.files.length - reviewable.length,
    failed,
    reused: 0
  };
  return {
    findings: verified.findings,
    summaryOnly: verified.summaryOnly,
    rejections: allRejections,
    actions: deps.config.output.inline ? plan.actions : plan.actions.filter((action) => action.kind !== "create"),
    summaryMarkdown,
    coverage,
    usage: {
      calls: totals.calls,
      tokens: totals.usage,
      estimatedCostUsd: estimateCost(totals.usage, deps.config),
      breakdown: computeCost(totals.usage, deps.config.llm.pricing),
      truncatedByBudget: budgetExhausted
    },
    warnings,
    gate: gateOutcome === null ? null : {
      conclusion: gateOutcome.conclusion,
      blockers: gateOutcome.blockers.length,
      exempted: gateOutcome.exempted.length,
      title: gateTitle(gateOutcome)
    },
    startedAt,
    finishedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}
function estimateCost(usage, config) {
  return computeCost(usage, config.llm.pricing)?.total ?? null;
}
async function runWithRetry(deps, spec, input, model, shrink) {
  const call = () => runReviewer({
    client: deps.client,
    spec,
    input,
    model,
    temperature: deps.config.llm.temperature,
    maxOutputTokens: deps.config.llm.maxOutputTokens,
    shrink
  });
  const first = await call();
  const structural = first.rejections.some(
    (rejection) => rejection.title === "(\u8F93\u51FA\u65E0\u6CD5\u89E3\u6790)" || rejection.title === "(\u6574\u6279)"
  );
  if (!structural || first.findings.length > 0) return first;
  const second = await call();
  return {
    ...second,
    calls: first.calls + second.calls,
    usage: sumUsage(first.usage, second.usage)
  };
}
function globalRules(paths) {
  const languages = new Set(paths.map((path) => languageOf(path)).filter((lang) => lang !== "*"));
  if (languages.size === 0) return "";
  const merged = /* @__PURE__ */ new Map();
  for (const language of languages) {
    const picked = selectRules(BUILTIN_RULES, {
      path: null,
      language,
      dimensions: ["naming", "architecture", "format"],
      includeFormat: true
    });
    for (const entry of picked) merged.set(entry.id, entry);
  }
  return renderRuleBlock(interleaveByDimension([...merged.values()], 18));
}
function buildCheckpointState(diff, configHash, promptHash) {
  return {
    version: CHECKPOINT_VERSION,
    headSha: diff.headSha,
    baseSha: diff.baseSha,
    configHash,
    promptHash,
    reviewedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}
function isOverBudget(usage, config) {
  const cost = estimateCost(usage, config);
  return cost !== null && cost > config.review.maxBudgetUsd;
}
function asMessage(error) {
  return error instanceof Error ? error.message : String(error);
}
function describeActions(actions) {
  return actions.filter((action) => action.kind !== "keep").map((action) => {
    if (action.kind === "create") {
      return `+ ${action.finding.anchor.file}:${String(action.finding.anchor.newLine ?? action.finding.anchor.oldLine ?? 0)} ${action.finding.title}`;
    }
    if (action.kind === "replace") return `~ ${action.finding.title}`;
    return `\u2713 \u6807\u8BB0\u5DF2\u4FEE\u590D ${action.commentId}`;
  });
}

// src/platforms/github/comments.ts
function createGitHubCommentPort(gateway, ref, commitId) {
  function toResult(id) {
    return { ok: true, commentId: id };
  }
  function failure(kind, error) {
    const status = typeof error === "object" && error !== null && "status" in error ? Number(error.status ?? 0) || null : null;
    if (status === 403 || status === 401)
      return { ok: false, failure: { kind: "permission", message: text(error), status } };
    if (status === 429)
      return { ok: false, failure: { kind: "rate-limit", message: text(error), status } };
    if (status === 404)
      return { ok: false, failure: { kind: "not-found", message: text(error), status } };
    return { ok: false, failure: { kind, message: text(error), status } };
  }
  return {
    kind: "github",
    async createInline(target, body) {
      try {
        const comment = await gateway.createReviewComment(ref, {
          body,
          commitId,
          path: target.path,
          line: target.line,
          // 平台用 LEFT / RIGHT 表示改动前 / 改动后，与我们内部的 old / new 一一对应
          side: target.side === "old" ? "LEFT" : "RIGHT"
        });
        return toResult(comment.id);
      } catch (error) {
        return failure("other", error);
      }
    },
    async createThread(body) {
      try {
        const comment = await gateway.createIssueComment(ref, body);
        return toResult(comment.id);
      } catch (error) {
        return failure("other", error);
      }
    },
    async update(commentId, body) {
      try {
        await gateway.updateReviewComment(ref, commentId, body);
        return toResult(commentId);
      } catch (reviewError) {
        try {
          await gateway.updateIssueComment(ref, commentId, body);
          return toResult(commentId);
        } catch {
          return failure("other", reviewError);
        }
      }
    },
    async resolve(commentId) {
      try {
        const comment = await gateway.getReviewComment(ref, commentId);
        if (comment === null) {
          return {
            ok: false,
            failure: { kind: "not-found", message: "\u8BC4\u8BBA\u4E0D\u5B58\u5728\u6216\u5DF2\u88AB\u5220\u9664", status: 404 }
          };
        }
        if (gateway.resolveThread === void 0) {
          return {
            ok: false,
            failure: { kind: "permission", message: "\u5F53\u524D\u7F51\u5173\u4E0D\u652F\u6301\u6807\u8BB0\u4F1A\u8BDD\u5DF2\u89E3\u51B3", status: null }
          };
        }
        await gateway.resolveThread(ref, commentId);
        return toResult(commentId);
      } catch (error) {
        return failure("permission", error);
      }
    },
    async remove(commentId) {
      try {
        await gateway.deleteReviewComment(ref, commentId);
        return toResult(commentId);
      } catch (error) {
        return failure("other", error);
      }
    },
    async read(commentId) {
      const comment = await gateway.getReviewComment(ref, commentId);
      if (comment !== null) return { body: comment.body };
      const issues = await gateway.listIssueComments(ref);
      const found = issues.find((item) => item.id === commentId);
      return found === void 0 ? null : { body: found.body };
    },
    async findThread(markerText) {
      const issues = await gateway.listIssueComments(ref);
      const found = issues.find((item) => item.body.includes(markerText));
      return found === void 0 ? null : { commentId: found.id, body: found.body };
    }
  };
}
function text(error) {
  return error instanceof Error ? error.message : String(error);
}

// node_modules/.pnpm/universal-user-agent@7.0.3/node_modules/universal-user-agent/index.js
function getUserAgent() {
  if (typeof navigator === "object" && "userAgent" in navigator) {
    return navigator.userAgent;
  }
  if (typeof process === "object" && process.version !== void 0) {
    return `Node.js/${process.version.substr(1)} (${process.platform}; ${process.arch})`;
  }
  return "<environment undetectable>";
}

// node_modules/.pnpm/before-after-hook@4.0.0/node_modules/before-after-hook/lib/register.js
function register(state, name, method, options) {
  if (typeof method !== "function") {
    throw new Error("method for before hook must be a function");
  }
  if (!options) {
    options = {};
  }
  if (Array.isArray(name)) {
    return name.reverse().reduce((callback, name2) => {
      return register.bind(null, state, name2, callback, options);
    }, method)();
  }
  return Promise.resolve().then(() => {
    if (!state.registry[name]) {
      return method(options);
    }
    return state.registry[name].reduce((method2, registered) => {
      return registered.hook.bind(null, method2, options);
    }, method)();
  });
}

// node_modules/.pnpm/before-after-hook@4.0.0/node_modules/before-after-hook/lib/add.js
function addHook(state, kind, name, hook7) {
  const orig = hook7;
  if (!state.registry[name]) {
    state.registry[name] = [];
  }
  if (kind === "before") {
    hook7 = (method, options) => {
      return Promise.resolve().then(orig.bind(null, options)).then(method.bind(null, options));
    };
  }
  if (kind === "after") {
    hook7 = (method, options) => {
      let result;
      return Promise.resolve().then(method.bind(null, options)).then((result_) => {
        result = result_;
        return orig(result, options);
      }).then(() => {
        return result;
      });
    };
  }
  if (kind === "error") {
    hook7 = (method, options) => {
      return Promise.resolve().then(method.bind(null, options)).catch((error) => {
        return orig(error, options);
      });
    };
  }
  state.registry[name].push({
    hook: hook7,
    orig
  });
}

// node_modules/.pnpm/before-after-hook@4.0.0/node_modules/before-after-hook/lib/remove.js
function removeHook(state, name, method) {
  if (!state.registry[name]) {
    return;
  }
  const index = state.registry[name].map((registered) => {
    return registered.orig;
  }).indexOf(method);
  if (index === -1) {
    return;
  }
  state.registry[name].splice(index, 1);
}

// node_modules/.pnpm/before-after-hook@4.0.0/node_modules/before-after-hook/index.js
var bind = Function.bind;
var bindable = bind.bind(bind);
function bindApi(hook7, state, name) {
  const removeHookRef = bindable(removeHook, null).apply(
    null,
    name ? [state, name] : [state]
  );
  hook7.api = { remove: removeHookRef };
  hook7.remove = removeHookRef;
  ["before", "error", "after", "wrap"].forEach((kind) => {
    const args = name ? [state, kind, name] : [state, kind];
    hook7[kind] = hook7.api[kind] = bindable(addHook, null).apply(null, args);
  });
}
function Singular() {
  const singularHookName = /* @__PURE__ */ Symbol("Singular");
  const singularHookState = {
    registry: {}
  };
  const singularHook = register.bind(null, singularHookState, singularHookName);
  bindApi(singularHook, singularHookState, singularHookName);
  return singularHook;
}
function Collection() {
  const state = {
    registry: {}
  };
  const hook7 = register.bind(null, state);
  bindApi(hook7, state);
  return hook7;
}
var before_after_hook_default = { Singular, Collection };

// node_modules/.pnpm/@octokit+endpoint@11.0.5/node_modules/@octokit/endpoint/dist-bundle/index.js
var VERSION = "0.0.0-development";
var userAgent = `octokit-endpoint.js/${VERSION} ${getUserAgent()}`;
var DEFAULTS = {
  method: "GET",
  baseUrl: "https://api.github.com",
  headers: {
    accept: "application/vnd.github.v3+json",
    "user-agent": userAgent
  },
  mediaType: {
    format: ""
  }
};
function lowercaseKeys(object) {
  if (!object) {
    return {};
  }
  return Object.keys(object).reduce((newObj, key) => {
    newObj[key.toLowerCase()] = object[key];
    return newObj;
  }, {});
}
function isPlainObject2(value) {
  if (typeof value !== "object" || value === null) return false;
  if (Object.prototype.toString.call(value) !== "[object Object]") return false;
  const proto = Object.getPrototypeOf(value);
  if (proto === null) return true;
  const Ctor = Object.prototype.hasOwnProperty.call(proto, "constructor") && proto.constructor;
  return typeof Ctor === "function" && Ctor instanceof Ctor && Function.prototype.call(Ctor) === Function.prototype.call(value);
}
function mergeDeep(defaults, options) {
  const result = Object.assign({}, defaults);
  Object.keys(options).forEach((key) => {
    if (isPlainObject2(options[key])) {
      if (!(key in defaults)) Object.assign(result, { [key]: options[key] });
      else result[key] = mergeDeep(defaults[key], options[key]);
    } else {
      Object.assign(result, { [key]: options[key] });
    }
  });
  return result;
}
function removeUndefinedProperties(obj2) {
  for (const key in obj2) {
    if (obj2[key] === void 0) {
      delete obj2[key];
    }
  }
  return obj2;
}
function merge(defaults, route, options) {
  if (typeof route === "string") {
    let [method, url] = route.split(" ");
    options = Object.assign(url ? { method, url } : { url: method }, options);
  } else {
    options = Object.assign({}, route);
  }
  options.headers = lowercaseKeys(options.headers);
  removeUndefinedProperties(options);
  removeUndefinedProperties(options.headers);
  const mergedOptions = mergeDeep(defaults || {}, options);
  if (options.url === "/graphql") {
    if (defaults && defaults.mediaType.previews?.length) {
      mergedOptions.mediaType.previews = defaults.mediaType.previews.filter(
        (preview) => !mergedOptions.mediaType.previews.includes(preview)
      ).concat(mergedOptions.mediaType.previews);
    }
    mergedOptions.mediaType.previews = (mergedOptions.mediaType.previews || []).map((preview) => preview.replace(/-preview/, ""));
  }
  return mergedOptions;
}
function addQueryParameters(url, parameters) {
  const separator = /\?/.test(url) ? "&" : "?";
  const names = Object.keys(parameters);
  if (names.length === 0) {
    return url;
  }
  return url + separator + names.map((name) => {
    if (name === "q") {
      return "q=" + parameters.q.split("+").map(encodeURIComponent).join("+");
    }
    return `${name}=${encodeURIComponent(parameters[name])}`;
  }).join("&");
}
var urlVariableRegex = /\{[^{}}]+\}/g;
function removeNonChars(variableName) {
  return variableName.replace(/(?:^\W+)|(?:(?<!\W)\W+$)/g, "").split(/,/);
}
function extractUrlVariableNames(url) {
  const matches = url.match(urlVariableRegex);
  if (!matches) {
    return [];
  }
  return matches.map(removeNonChars).reduce((a, b) => a.concat(b), []);
}
function omit(object, keysToOmit) {
  const result = { __proto__: null };
  for (const key of Object.keys(object)) {
    if (keysToOmit.indexOf(key) === -1) {
      result[key] = object[key];
    }
  }
  return result;
}
function encodeReserved(str2) {
  return str2.split(/(%[0-9A-Fa-f]{2})/g).map(function(part) {
    if (!/%[0-9A-Fa-f]/.test(part)) {
      part = encodeURI(part).replace(/%5B/g, "[").replace(/%5D/g, "]");
    }
    return part;
  }).join("");
}
function encodeUnreserved(str2) {
  return encodeURIComponent(str2).replace(/[!'()*]/g, function(c) {
    return "%" + c.charCodeAt(0).toString(16).toUpperCase();
  });
}
function encodeValue(operator, value, key) {
  value = operator === "+" || operator === "#" ? encodeReserved(value) : encodeUnreserved(value);
  if (key) {
    return encodeUnreserved(key) + "=" + value;
  } else {
    return value;
  }
}
function isDefined(value) {
  return value !== void 0 && value !== null;
}
function isKeyOperator(operator) {
  return operator === ";" || operator === "&" || operator === "?";
}
function getValues(context, operator, key, modifier) {
  var value = context[key], result = [];
  if (isDefined(value) && value !== "") {
    if (typeof value === "string" || typeof value === "number" || typeof value === "bigint" || typeof value === "boolean") {
      value = value.toString();
      if (modifier && modifier !== "*") {
        value = value.substring(0, parseInt(modifier, 10));
      }
      result.push(
        encodeValue(operator, value, isKeyOperator(operator) ? key : "")
      );
    } else {
      if (modifier === "*") {
        if (Array.isArray(value)) {
          value.filter(isDefined).forEach(function(value2) {
            result.push(
              encodeValue(operator, value2, isKeyOperator(operator) ? key : "")
            );
          });
        } else {
          Object.keys(value).forEach(function(k) {
            if (isDefined(value[k])) {
              result.push(encodeValue(operator, value[k], k));
            }
          });
        }
      } else {
        const tmp = [];
        if (Array.isArray(value)) {
          value.filter(isDefined).forEach(function(value2) {
            tmp.push(encodeValue(operator, value2));
          });
        } else {
          Object.keys(value).forEach(function(k) {
            if (isDefined(value[k])) {
              tmp.push(encodeUnreserved(k));
              tmp.push(encodeValue(operator, value[k].toString()));
            }
          });
        }
        if (isKeyOperator(operator)) {
          result.push(encodeUnreserved(key) + "=" + tmp.join(","));
        } else if (tmp.length !== 0) {
          result.push(tmp.join(","));
        }
      }
    }
  } else {
    if (operator === ";") {
      if (isDefined(value)) {
        result.push(encodeUnreserved(key));
      }
    } else if (value === "" && (operator === "&" || operator === "?")) {
      result.push(encodeUnreserved(key) + "=");
    } else if (value === "") {
      result.push("");
    }
  }
  return result;
}
function parseUrl(template) {
  return {
    expand: expand.bind(null, template)
  };
}
function expand(template, context) {
  var operators = ["+", "#", ".", "/", ";", "?", "&"];
  template = template.replace(
    /\{([^\{\}]+)\}|([^\{\}]+)/g,
    function(_, expression, literal) {
      if (expression) {
        let operator = "";
        const values = [];
        if (operators.indexOf(expression.charAt(0)) !== -1) {
          operator = expression.charAt(0);
          expression = expression.substr(1);
        }
        expression.split(/,/g).forEach(function(variable) {
          var tmp = /([^:\*]*)(?::(\d+)|(\*))?/.exec(variable);
          values.push(getValues(context, operator, tmp[1], tmp[2] || tmp[3]));
        });
        if (operator && operator !== "+") {
          var separator = ",";
          if (operator === "?") {
            separator = "&";
          } else if (operator !== "#") {
            separator = operator;
          }
          return (values.length !== 0 ? operator : "") + values.join(separator);
        } else {
          return values.join(",");
        }
      } else {
        return encodeReserved(literal);
      }
    }
  );
  if (template === "/") {
    return template;
  } else {
    return template.replace(/\/$/, "");
  }
}
function parse(options) {
  let method = options.method.toUpperCase();
  let url = (options.url || "/").replace(/:([a-z]\w+)/g, "{$1}");
  let headers = Object.assign({}, options.headers);
  let body;
  let parameters = omit(options, [
    "method",
    "baseUrl",
    "url",
    "headers",
    "request",
    "mediaType"
  ]);
  const urlVariableNames = extractUrlVariableNames(url);
  url = parseUrl(url).expand(parameters);
  if (!/^http/.test(url)) {
    url = options.baseUrl + url;
  }
  const omittedParameters = Object.keys(options).filter((option) => urlVariableNames.includes(option)).concat("baseUrl");
  const remainingParameters = omit(parameters, omittedParameters);
  const isBinaryRequest = /application\/octet-stream/i.test(headers.accept);
  if (!isBinaryRequest) {
    if (options.mediaType.format) {
      headers.accept = headers.accept.split(/,/).map(
        (format) => format.replace(
          /application\/vnd(\.\w+)(\.v3)?(\.\w+)?(\+json)?$/,
          `application/vnd$1$2.${options.mediaType.format}`
        )
      ).join(",");
    }
    if (url.endsWith("/graphql")) {
      if (options.mediaType.previews?.length) {
        const previewsFromAcceptHeader = headers.accept.match(/(?<![\w-])[\w-]+(?=-preview)/g) || [];
        headers.accept = previewsFromAcceptHeader.concat(options.mediaType.previews).map((preview) => {
          const format = options.mediaType.format ? `.${options.mediaType.format}` : "+json";
          return `application/vnd.github.${preview}-preview${format}`;
        }).join(",");
      }
    }
  }
  if (["GET", "HEAD"].includes(method)) {
    url = addQueryParameters(url, remainingParameters);
  } else {
    if ("data" in remainingParameters) {
      body = remainingParameters.data;
    } else {
      if (Object.keys(remainingParameters).length) {
        body = remainingParameters;
      }
    }
  }
  if (!headers["content-type"] && typeof body !== "undefined") {
    headers["content-type"] = "application/json; charset=utf-8";
  }
  if (["PATCH", "PUT"].includes(method) && typeof body === "undefined") {
    body = "";
  }
  return Object.assign(
    { method, url, headers },
    typeof body !== "undefined" ? { body } : null,
    options.request ? { request: options.request } : null
  );
}
function endpointWithDefaults(defaults, route, options) {
  return parse(merge(defaults, route, options));
}
function withDefaults(oldDefaults, newDefaults) {
  const DEFAULTS2 = merge(oldDefaults, newDefaults);
  const endpoint2 = endpointWithDefaults.bind(null, DEFAULTS2);
  return Object.assign(endpoint2, {
    DEFAULTS: DEFAULTS2,
    defaults: withDefaults.bind(null, DEFAULTS2),
    merge: merge.bind(null, DEFAULTS2),
    parse
  });
}
var endpoint = withDefaults(null, DEFAULTS);

// node_modules/.pnpm/content-type@3.1.1/node_modules/content-type/dist/index.js
var SP = 32;
var HTAB = 9;
var SEMI = 59;
var EQ = 61;
var DQUOTE = 34;
var BSLASH = 92;
var COMMA = 44;
var LOWER_CASE = 1;
var OWS = 2;
var SEMI_FLAG = 4;
var COMMA_FLAG = 8;
var TOKEN_FLAG = 16;
var NON_ASCII = 65280;
var CASE_FLAGS = LOWER_CASE | NON_ASCII;
var CHAR_MAP = new Uint8Array(256);
CHAR_MAP[HTAB] |= OWS;
CHAR_MAP[SP] |= OWS;
CHAR_MAP[SEMI] |= SEMI_FLAG;
CHAR_MAP[COMMA] |= COMMA_FLAG;
for (let code = 128; code <= 255; code++) {
  CHAR_MAP[code] |= LOWER_CASE;
}
for (const char of "!#$%&'*+-.^_`|~") {
  CHAR_MAP[char.charCodeAt(0)] |= TOKEN_FLAG;
}
for (let code = 48; code <= 57; code++) {
  CHAR_MAP[code] |= TOKEN_FLAG;
}
for (let code = 65; code <= 90; code++) {
  CHAR_MAP[code] |= LOWER_CASE | TOKEN_FLAG;
}
for (let code = 97; code <= 122; code++) {
  CHAR_MAP[code] |= TOKEN_FLAG;
}
var NullObject = /* @__PURE__ */ (() => {
  const C = function() {
  };
  C.prototype = /* @__PURE__ */ Object.create(null);
  return C;
})();
function parse2(header, options) {
  const stopFlags = SEMI_FLAG | (options?.comma === true ? COMMA_FLAG : 0);
  const len = header.length;
  let valueStart = options?.start ?? 0;
  while ((CHAR_MAP[header.charCodeAt(valueStart)] & OWS) !== 0) {
    valueStart++;
  }
  let index = valueStart;
  let typeFlags = 0;
  let whitespace = -1;
  let stop = options?.parameters === false ? COMMA_FLAG : 0;
  while (index < len) {
    const code = header.charCodeAt(index);
    const flags = CHAR_MAP[code];
    if ((flags & stopFlags) !== 0) {
      stop |= flags & COMMA_FLAG;
      break;
    }
    if ((flags & OWS) !== 0) {
      if (whitespace === -1)
        whitespace = index;
    } else {
      whitespace = -1;
    }
    typeFlags |= code & NON_ASCII | flags;
    index++;
  }
  const valueEnd = whitespace === -1 ? index : whitespace;
  const value = header.slice(valueStart, valueEnd);
  const type = (typeFlags & CASE_FLAGS) === 0 ? value : value.toLowerCase();
  if (index === len || stop !== 0) {
    return { type, index, parameters: new NullObject() };
  }
  return parseParameters(header, type, index, len, stopFlags);
}
function parseParameters(header, type, index, len, stopFlags) {
  const parameters = new NullObject();
  parameter: while (index < len) {
    index++;
    while ((CHAR_MAP[header.charCodeAt(index)] & OWS) !== 0) {
      index++;
    }
    const keyStart = index;
    let keyFlags = 0;
    let keyWhitespace = -1;
    while (index < len) {
      const code = header.charCodeAt(index);
      const flags = CHAR_MAP[code];
      if ((flags & stopFlags) !== 0) {
        if ((flags & COMMA_FLAG) !== 0)
          break parameter;
        continue parameter;
      }
      if (code === EQ) {
        const keyEnd = keyWhitespace === -1 ? index : keyWhitespace;
        const value = header.slice(keyStart, keyEnd);
        const key = (keyFlags & CASE_FLAGS) === 0 ? value : value.toLowerCase();
        index++;
        while ((CHAR_MAP[header.charCodeAt(index)] & OWS) !== 0) {
          index++;
        }
        if (index < len && header.charCodeAt(index) === DQUOTE) {
          const quotedStart = ++index;
          let escaped = false;
          while (index < len) {
            const code2 = header.charCodeAt(index);
            if (code2 === DQUOTE) {
              if (parameters[key] === void 0) {
                parameters[key] = escaped ? unescapeQuotedPairs(header, quotedStart, index) : header.slice(quotedStart, index);
              }
              index++;
              let stop2 = 0;
              while (index < len) {
                const code3 = header.charCodeAt(index);
                const flags2 = CHAR_MAP[code3];
                if ((flags2 & stopFlags) !== 0) {
                  stop2 = flags2 & COMMA_FLAG;
                  break;
                }
                index++;
              }
              if (stop2 !== 0)
                break parameter;
              continue parameter;
            }
            if (code2 === BSLASH && index + 1 < len) {
              escaped = true;
              index += 2;
              continue;
            }
            index++;
          }
          continue parameter;
        }
        const valueStart = index;
        let stop = 0;
        let valueWhitespace = -1;
        while (index < len) {
          const code2 = header.charCodeAt(index);
          const flags2 = CHAR_MAP[code2];
          if ((flags2 & stopFlags) !== 0) {
            stop = flags2 & COMMA_FLAG;
            break;
          }
          if ((flags2 & OWS) !== 0) {
            if (valueWhitespace === -1)
              valueWhitespace = index;
          } else {
            valueWhitespace = -1;
          }
          index++;
        }
        if (parameters[key] === void 0) {
          const valueEnd = valueWhitespace === -1 ? index : valueWhitespace;
          parameters[key] = header.slice(valueStart, valueEnd);
        }
        if (stop !== 0)
          break parameter;
        continue parameter;
      }
      if ((flags & OWS) !== 0) {
        if (keyWhitespace === -1)
          keyWhitespace = index;
      } else {
        keyWhitespace = -1;
      }
      keyFlags |= code & NON_ASCII | flags;
      index++;
    }
  }
  return { type, index, parameters };
}
function unescapeQuotedPairs(str2, start, end) {
  let result = "";
  for (let index = start; index < end; index++) {
    if (str2.charCodeAt(index) === BSLASH) {
      result += str2.slice(start, index);
      start = ++index;
    }
  }
  return result + str2.slice(start, end);
}

// node_modules/.pnpm/json-with-bigint@3.5.12/node_modules/json-with-bigint/json-with-bigint.js
var intRegex = /^-?\d+$/;
var noiseValue = /^-?\d+n+$/;
var originalStringify = JSON.stringify;
var originalParse = JSON.parse;
var customFormat = /^-?\d+n$/;
var bigIntsStringify = /([\[:])?"(-?\d+)n"($|\s*[,\}\]])/g;
var noiseStringify = /([\[:])?("-?\d+n+)n("$|"\s*[,\}\]])/g;
var isUnstringifiable = (val) => val === void 0 || typeof val === "function" || typeof val === "symbol";
var isRawJSON = (val) => val !== null && typeof val === "object" && val.constructor && val.constructor.name === "RawJSON";
var stringifyIteratively = (rootValue, replacer, spaceParam) => {
  let space = "";
  if (typeof spaceParam === "number") {
    space = " ".repeat(Math.min(10, Math.max(0, Math.floor(spaceParam))));
  } else if (typeof spaceParam === "string") {
    space = spaceParam.slice(0, 10);
  }
  const isFunctionReplacer = typeof replacer === "function";
  const propertyList = Array.isArray(replacer) ? new Set(replacer.map(String)) : null;
  const prepareVal = (parent, key, val) => {
    const isObject3 = val !== null && typeof val === "object";
    const hasToJSON = isObject3 && typeof val.toJSON === "function";
    if (hasToJSON) {
      val = val.toJSON(key);
    }
    const isNoise = typeof val === "string" && noiseValue.test(val);
    if (isNoise) return val + "n";
    const isBigInt = typeof val === "bigint";
    if (isBigInt) {
      const supportsRawJSON = "rawJSON" in JSON;
      if (supportsRawJSON) return JSON.rawJSON(val.toString());
      return val.toString() + "n";
    }
    if (isFunctionReplacer) {
      val = replacer.call(parent, key, val);
    }
    const isPostReplacerObject = val !== null && typeof val === "object";
    if (isPostReplacerObject) {
      const isPrimitiveWrapper = val instanceof Number || val instanceof String || val instanceof Boolean;
      if (isPrimitiveWrapper) {
        val = val.valueOf();
      }
    }
    return val;
  };
  const rootProcessed = prepareVal({ "": rootValue }, "", rootValue);
  if (isUnstringifiable(rootProcessed)) {
    return void 0;
  }
  const isRootPrimitive = rootProcessed === null || typeof rootProcessed !== "object";
  const isRootNativeRawJSON = isRawJSON(rootProcessed);
  if (isRootPrimitive || isRootNativeRawJSON) {
    return originalStringify(rootProcessed);
  }
  const chunks = [];
  let level = 0;
  const stack = [
    {
      parent: { "": rootProcessed },
      key: "",
      val: rootProcessed,
      isArray: Array.isArray(rootProcessed),
      keys: Array.isArray(rootProcessed) ? null : Object.keys(rootProcessed),
      index: 0,
      first: true
    }
  ];
  const visited = new WeakSet([rootProcessed]);
  while (stack.length > 0) {
    const node = stack[stack.length - 1];
    if (node.index === 0) {
      chunks.push(node.isArray ? "[" : "{");
      level++;
    }
    let isDone = false;
    if (node.isArray) {
      if (node.index < node.val.length) {
        if (!node.first) chunks.push(",");
        if (space) chunks.push("\n" + space.repeat(level));
        const childRaw = node.val[node.index];
        const childVal = prepareVal(node.val, String(node.index), childRaw);
        if (isUnstringifiable(childVal)) {
          chunks.push("null");
          node.first = false;
          node.index++;
        } else {
          const isComplexObject = childVal !== null && typeof childVal === "object";
          const isNativeRaw = isRawJSON(childVal);
          if (isComplexObject && !isNativeRaw) {
            if (visited.has(childVal)) {
              throw new TypeError("Converting circular structure to JSON");
            }
            visited.add(childVal);
            stack.push({
              parent: node.val,
              key: String(node.index),
              val: childVal,
              isArray: Array.isArray(childVal),
              keys: Array.isArray(childVal) ? null : Object.keys(childVal),
              index: 0,
              first: true
            });
            node.first = false;
            node.index++;
          } else {
            chunks.push(originalStringify(childVal));
            node.first = false;
            node.index++;
          }
        }
      } else {
        isDone = true;
      }
    } else {
      while (node.index < node.keys.length) {
        const k = node.keys[node.index++];
        const isFilteredOutByArray = propertyList && !propertyList.has(k);
        if (isFilteredOutByArray) continue;
        const childRaw = node.val[k];
        const childVal = prepareVal(node.val, k, childRaw);
        if (isUnstringifiable(childVal)) continue;
        if (!node.first) chunks.push(",");
        if (space) {
          chunks.push("\n" + space.repeat(level) + originalStringify(k) + ": ");
        } else {
          chunks.push(originalStringify(k) + ":");
        }
        const isComplexObject = childVal !== null && typeof childVal === "object";
        const isNativeRaw = isRawJSON(childVal);
        if (isComplexObject && !isNativeRaw) {
          if (visited.has(childVal)) {
            throw new TypeError("Converting circular structure to JSON");
          }
          visited.add(childVal);
          stack.push({
            parent: node.val,
            key: k,
            val: childVal,
            isArray: Array.isArray(childVal),
            keys: Array.isArray(childVal) ? null : Object.keys(childVal),
            index: 0,
            first: true
          });
          node.first = false;
          break;
        } else {
          chunks.push(originalStringify(childVal));
          node.first = false;
        }
      }
      const isNodeFullyProcessed = node.index >= node.keys.length && stack[stack.length - 1] === node;
      if (isNodeFullyProcessed) {
        isDone = true;
      }
    }
    if (isDone) {
      level--;
      if (!node.first && space) chunks.push("\n" + space.repeat(level));
      chunks.push(node.isArray ? "]" : "}");
      visited.delete(node.val);
      stack.pop();
    }
  }
  return chunks.join("");
};
var JSONStringify = (value, replacer, space) => {
  try {
    const supportsRawJSON = "rawJSON" in JSON;
    if (supportsRawJSON) {
      return originalStringify(
        value,
        (key, val) => {
          if (typeof val === "bigint") return JSON.rawJSON(val.toString());
          const hasFunctionReplacer = typeof replacer === "function";
          if (hasFunctionReplacer) return replacer(key, val);
          const isKeyInArrayReplacer = Array.isArray(replacer) && replacer.includes(key);
          if (isKeyInArrayReplacer) return val;
          return val;
        },
        space
      );
    }
    if (!value) return originalStringify(value, replacer, space);
    const convertedToCustomJSON = originalStringify(
      value,
      (key, val) => {
        const isNoise = typeof val === "string" && noiseValue.test(val);
        if (isNoise) return val.toString() + "n";
        if (typeof val === "bigint") return val.toString() + "n";
        const hasFunctionReplacer = typeof replacer === "function";
        if (hasFunctionReplacer) return replacer(key, val);
        const isKeyInArrayReplacer = Array.isArray(replacer) && replacer.includes(key);
        if (isKeyInArrayReplacer) return val;
        return val;
      },
      space
    );
    const processedJSON = convertedToCustomJSON.replace(
      bigIntsStringify,
      "$1$2$3"
    );
    const denoisedJSON = processedJSON.replace(noiseStringify, "$1$2$3");
    return denoisedJSON;
  } catch (error) {
    if (error instanceof RangeError) {
      const convertedJSON = stringifyIteratively(value, replacer, space);
      if (convertedJSON === void 0) return void 0;
      const supportsRawJSON = "rawJSON" in JSON;
      if (supportsRawJSON) return convertedJSON;
      const processedJSON = convertedJSON.replace(bigIntsStringify, "$1$2$3");
      return processedJSON.replace(noiseStringify, "$1$2$3");
    }
    throw error;
  }
};
var featureCache = /* @__PURE__ */ new Map();
var isContextSourceSupported = () => {
  const parseFingerprint = JSON.parse.toString();
  if (featureCache.has(parseFingerprint)) {
    return featureCache.get(parseFingerprint);
  }
  try {
    const result = JSON.parse(
      "1",
      (_, __, context) => !!context?.source && context.source === "1"
    );
    featureCache.set(parseFingerprint, result);
    return result;
  } catch {
    featureCache.set(parseFingerprint, false);
    return false;
  }
};
var convertMarkedBigIntsReviver = (key, value, context, userReviver) => {
  const isCustomFormatBigInt = typeof value === "string" && customFormat.test(value);
  if (isCustomFormatBigInt) return BigInt(value.slice(0, -1));
  const isNoiseValue = typeof value === "string" && noiseValue.test(value);
  if (isNoiseValue) return value.slice(0, -1);
  const hasUserReviver = typeof userReviver === "function";
  if (!hasUserReviver) return value;
  return userReviver(key, value, context);
};
var JSONParseV2 = (text2, reviver) => {
  return JSON.parse(text2, (key, value, context) => {
    const isNumber = typeof value === "number";
    const isOutOfBounds = value > Number.MAX_SAFE_INTEGER || value < Number.MIN_SAFE_INTEGER;
    const isBigNumber = isNumber && isOutOfBounds;
    const isInt = context && intRegex.test(context.source);
    const isBigInt = isBigNumber && isInt;
    if (isBigInt) return BigInt(context.source);
    const hasCustomReviver = typeof reviver === "function";
    if (!hasCustomReviver) return value;
    return reviver(key, value, context);
  });
};
var MAX_INT = Number.MAX_SAFE_INTEGER.toString();
var MAX_DIGITS = MAX_INT.length;
var stringsOrLargeNumbers = /"(?:[^"\\]|\\.)*"|-?(0|[1-9][0-9]*)(\.[0-9]+)?([eE][+-]?[0-9]+)?/g;
var noiseValueWithQuotes = /^"-?\d+n+"$/;
var applyReviverIteratively = (parsed, userReviver) => {
  const rootHolder = { "": parsed };
  const stack = [{ parent: rootHolder, key: "", visited: false }];
  while (stack.length > 0) {
    const node = stack[stack.length - 1];
    if (!node.visited) {
      node.visited = true;
      const value = node.parent[node.key];
      const isComplexObject = value !== null && typeof value === "object";
      if (isComplexObject) {
        const keys = Object.keys(value);
        for (let i = keys.length - 1; i >= 0; i--) {
          stack.push({ parent: value, key: keys[i], visited: false });
        }
      }
    } else {
      const { parent, key } = node;
      let value = parent[key];
      if (typeof value === "string") {
        const isCustomFormatBigInt = customFormat.test(value);
        if (isCustomFormatBigInt) {
          value = BigInt(value.slice(0, -1));
        } else {
          const isNoise = noiseValue.test(value);
          if (isNoise) value = value.slice(0, -1);
        }
      }
      const hasUserReviver = typeof userReviver === "function";
      if (hasUserReviver) {
        value = userReviver.call(parent, key, value);
      }
      const isDeleted = value === void 0;
      if (isDeleted) {
        delete parent[key];
      } else {
        parent[key] = value;
      }
      stack.pop();
    }
  }
  return rootHolder[""];
};
var serializeBigInts = (text2) => {
  return text2.replace(
    stringsOrLargeNumbers,
    (match, digits, fractional, exponential) => {
      const isString = match[0] === '"';
      const isNoise = isString && noiseValueWithQuotes.test(match);
      if (isNoise) return match.substring(0, match.length - 1) + 'n"';
      const hasFractionalOrExponential = fractional || exponential;
      const isLessThanMaxSafeInt = digits && (digits.length < MAX_DIGITS || digits.length === MAX_DIGITS && digits <= MAX_INT);
      const isStandardValue = isString || hasFractionalOrExponential || isLessThanMaxSafeInt;
      if (isStandardValue) return match;
      return '"' + match + 'n"';
    }
  );
};
var JSONParse = (text2, reviver) => {
  if (!text2) return originalParse(text2, reviver);
  try {
    if (isContextSourceSupported()) return JSONParseV2(text2, reviver);
    const serializedData = serializeBigInts(text2);
    return originalParse(
      serializedData,
      (key, value, context) => convertMarkedBigIntsReviver(key, value, context, reviver)
    );
  } catch (error) {
    if (error instanceof RangeError) {
      const serializedData = serializeBigInts(text2);
      const parsed = originalParse(serializedData);
      return applyReviverIteratively(parsed, reviver);
    }
    throw error;
  }
};

// node_modules/.pnpm/@octokit+request-error@7.1.2/node_modules/@octokit/request-error/dist-src/index.js
var RequestError = class extends Error {
  name;
  /**
   * http status code
   */
  status;
  /**
   * Request options that lead to the error.
   */
  request;
  /**
   * Response object if a response was received
   */
  response;
  constructor(message, statusCode, options) {
    super(message, { cause: options.cause });
    this.name = "HttpError";
    this.status = Number.parseInt(statusCode);
    if (Number.isNaN(this.status)) {
      this.status = 0;
    }
    if ("response" in options) {
      this.response = options.response;
    }
    const requestCopy = Object.assign({}, options.request);
    if (options.request.headers.authorization) {
      requestCopy.headers = Object.assign({}, options.request.headers, {
        authorization: options.request.headers.authorization.replace(
          /(?<! ) .*$/,
          " [REDACTED]"
        )
      });
    }
    requestCopy.url = requestCopy.url.replace(/\bclient_secret=\w+/g, "client_secret=[REDACTED]").replace(/\baccess_token=\w+/g, "access_token=[REDACTED]");
    this.request = requestCopy;
  }
};

// node_modules/.pnpm/@octokit+request@10.0.16/node_modules/@octokit/request/dist-bundle/index.js
var VERSION2 = "10.0.16";
var defaults_default = {
  headers: {
    "user-agent": `octokit-request.js/${VERSION2} ${getUserAgent()}`
  }
};
function isPlainObject3(value) {
  if (typeof value !== "object" || value === null) return false;
  if (Object.prototype.toString.call(value) !== "[object Object]") return false;
  const proto = Object.getPrototypeOf(value);
  if (proto === null) return true;
  const Ctor = Object.prototype.hasOwnProperty.call(proto, "constructor") && proto.constructor;
  return typeof Ctor === "function" && Ctor instanceof Ctor && Function.prototype.call(Ctor) === Function.prototype.call(value);
}
var noop = () => "";
async function fetchWrapper(requestOptions) {
  const fetch2 = requestOptions.request?.fetch || globalThis.fetch;
  if (!fetch2) {
    throw new Error(
      "fetch is not set. Please pass a fetch implementation as new Octokit({ request: { fetch }}). Learn more at https://github.com/octokit/octokit.js/#fetch-missing"
    );
  }
  const log = requestOptions.request?.log || console;
  const parseSuccessResponseBody = requestOptions.request?.parseSuccessResponseBody !== false;
  const body = isPlainObject3(requestOptions.body) || Array.isArray(requestOptions.body) ? JSONStringify(requestOptions.body) : requestOptions.body;
  const requestHeaders = Object.fromEntries(
    Object.entries(requestOptions.headers).map(([name, value]) => [
      name,
      String(value)
    ])
  );
  let fetchResponse;
  try {
    fetchResponse = await fetch2(requestOptions.url, {
      method: requestOptions.method,
      body,
      redirect: requestOptions.request?.redirect,
      headers: requestHeaders,
      signal: requestOptions.request?.signal,
      // duplex must be set if request.body is ReadableStream or Async Iterables.
      // See https://fetch.spec.whatwg.org/#dom-requestinit-duplex.
      ...requestOptions.body && { duplex: "half" }
    });
  } catch (error) {
    let message = "Unknown Error";
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        error.status = 500;
        throw error;
      }
      message = error.message;
      if (error.name === "TypeError" && "cause" in error) {
        if (error.cause instanceof Error) {
          message = error.cause.message;
        } else if (typeof error.cause === "string") {
          message = error.cause;
        }
      }
    }
    const requestError = new RequestError(message, 500, {
      request: requestOptions
    });
    requestError.cause = error;
    throw requestError;
  }
  const status = fetchResponse.status;
  const url = fetchResponse.url;
  const responseHeaders = {};
  for (const [key, value] of fetchResponse.headers) {
    responseHeaders[key] = value;
  }
  const octokitResponse = {
    url,
    status,
    headers: responseHeaders,
    data: ""
  };
  if ("deprecation" in responseHeaders) {
    const matches = responseHeaders.link && responseHeaders.link.match(/<([^<>]+)>; rel="deprecation"/);
    const deprecationLink = matches && matches.pop();
    log.warn(
      `[@octokit/request] "${requestOptions.method} ${requestOptions.url}" is deprecated. It is scheduled to be removed on ${responseHeaders.sunset}${deprecationLink ? `. See ${deprecationLink}` : ""}`
    );
  }
  if (status === 204 || status === 205) {
    return octokitResponse;
  }
  if (requestOptions.method === "HEAD") {
    if (status < 400) {
      return octokitResponse;
    }
    throw new RequestError(fetchResponse.statusText, status, {
      response: octokitResponse,
      request: requestOptions
    });
  }
  if (status === 304) {
    octokitResponse.data = await getResponseData(fetchResponse);
    throw new RequestError("Not modified", status, {
      response: octokitResponse,
      request: requestOptions
    });
  }
  if (status >= 400) {
    octokitResponse.data = await getResponseData(fetchResponse);
    throw new RequestError(toErrorMessage(octokitResponse.data), status, {
      response: octokitResponse,
      request: requestOptions
    });
  }
  octokitResponse.data = parseSuccessResponseBody ? await getResponseData(fetchResponse) : fetchResponse.body;
  return octokitResponse;
}
async function getResponseData(response) {
  const contentType = response.headers.get("content-type");
  if (!contentType) {
    return response.text().catch(noop);
  }
  const mimetype = parse2(contentType);
  if (isJSONResponse(mimetype)) {
    let text2 = "";
    try {
      text2 = await response.text();
      return JSONParse(text2);
    } catch (err) {
      return text2;
    }
  } else if (mimetype.type.startsWith("text/") || // `application/octet-stream` is the canonical "arbitrary binary" type
  // (RFC 2046) and must never be decoded as text, even when the response
  // carries a (misleading) `charset=utf-8` parameter — see #751.
  mimetype.parameters.charset?.toLowerCase() === "utf-8" && mimetype.type !== "application/octet-stream") {
    return response.text().catch(noop);
  } else {
    return response.arrayBuffer().catch(
      /* v8 ignore next -- @preserve */
      () => new ArrayBuffer(0)
    );
  }
}
function isJSONResponse(mimetype) {
  return mimetype.type === "application/json" || mimetype.type === "application/scim+json";
}
function toErrorMessage(data) {
  if (typeof data === "string") {
    return data;
  }
  if (data instanceof ArrayBuffer) {
    return "Unknown error";
  }
  if (typeof data === "object" && data !== null && "message" in data) {
    const objectData = data;
    const suffix = "documentation_url" in objectData ? ` - ${objectData.documentation_url}` : "";
    return Array.isArray(objectData.errors) ? `${objectData.message}: ${objectData.errors.map((v) => JSON.stringify(v)).join(", ")}${suffix}` : `${objectData.message}${suffix}`;
  }
  return `Unknown error: ${JSON.stringify(data)}`;
}
function withDefaults2(oldEndpoint, newDefaults) {
  const endpoint2 = oldEndpoint.defaults(newDefaults);
  const newApi = function(route, parameters) {
    const endpointOptions = endpoint2.merge(route, parameters);
    if (!endpointOptions.request || !endpointOptions.request.hook) {
      return fetchWrapper(endpoint2.parse(endpointOptions));
    }
    const request2 = (route2, parameters2) => {
      return fetchWrapper(
        endpoint2.parse(endpoint2.merge(route2, parameters2))
      );
    };
    Object.assign(request2, {
      endpoint: endpoint2,
      defaults: withDefaults2.bind(null, endpoint2)
    });
    return endpointOptions.request.hook(request2, endpointOptions);
  };
  return Object.assign(newApi, {
    endpoint: endpoint2,
    defaults: withDefaults2.bind(null, endpoint2)
  });
}
var request = withDefaults2(endpoint, defaults_default);

// node_modules/.pnpm/@octokit+graphql@9.0.5/node_modules/@octokit/graphql/dist-bundle/index.js
var VERSION3 = "0.0.0-development";
function _buildMessageForResponseErrors(data) {
  return `Request failed due to following response errors:
` + data.errors.map((e) => ` - ${e.message}`).join("\n");
}
var GraphqlResponseError = class extends Error {
  constructor(request2, headers, response) {
    super(_buildMessageForResponseErrors(response));
    this.request = request2;
    this.headers = headers;
    this.response = response;
    this.errors = response.errors;
    this.data = response.data;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
  request;
  headers;
  response;
  name = "GraphqlResponseError";
  errors;
  data;
};
var NON_VARIABLE_OPTIONS = [
  "method",
  "baseUrl",
  "url",
  "headers",
  "request",
  "query",
  "mediaType",
  "operationName"
];
var FORBIDDEN_VARIABLE_OPTIONS = ["query", "method", "url"];
var GHES_V3_SUFFIX_REGEX = /\/api\/v3\/?$/;
function graphql(request2, query, options) {
  if (options) {
    if (typeof query === "string" && "query" in options) {
      return Promise.reject(
        new Error(`[@octokit/graphql] "query" cannot be used as variable name`)
      );
    }
    for (const key in options) {
      if (!FORBIDDEN_VARIABLE_OPTIONS.includes(key)) continue;
      return Promise.reject(
        new Error(
          `[@octokit/graphql] "${key}" cannot be used as variable name`
        )
      );
    }
  }
  const parsedOptions = typeof query === "string" ? Object.assign({ query }, options) : query;
  const requestOptions = Object.keys(
    parsedOptions
  ).reduce((result, key) => {
    if (NON_VARIABLE_OPTIONS.includes(key)) {
      result[key] = parsedOptions[key];
      return result;
    }
    if (!result.variables) {
      result.variables = {};
    }
    result.variables[key] = parsedOptions[key];
    return result;
  }, {});
  const baseUrl = parsedOptions.baseUrl || request2.endpoint.DEFAULTS.baseUrl;
  if (GHES_V3_SUFFIX_REGEX.test(baseUrl)) {
    requestOptions.url = baseUrl.replace(GHES_V3_SUFFIX_REGEX, "/api/graphql");
  }
  return request2(requestOptions).then((response) => {
    if (response.data.errors) {
      const headers = {};
      for (const key of Object.keys(response.headers)) {
        headers[key] = response.headers[key];
      }
      throw new GraphqlResponseError(
        requestOptions,
        headers,
        response.data
      );
    }
    return response.data.data;
  });
}
function withDefaults3(request2, newDefaults) {
  const newRequest = request2.defaults(newDefaults);
  const newApi = (query, options) => {
    return graphql(newRequest, query, options);
  };
  return Object.assign(newApi, {
    defaults: withDefaults3.bind(null, newRequest),
    endpoint: newRequest.endpoint
  });
}
var graphql2 = withDefaults3(request, {
  headers: {
    "user-agent": `octokit-graphql.js/${VERSION3} ${getUserAgent()}`
  },
  method: "POST",
  url: "/graphql"
});
function withCustomRequest(customRequest) {
  return withDefaults3(customRequest, {
    method: "POST",
    url: "/graphql"
  });
}

// node_modules/.pnpm/@octokit+auth-token@6.0.0/node_modules/@octokit/auth-token/dist-bundle/index.js
var b64url = "(?:[a-zA-Z0-9_-]+)";
var sep = "\\.";
var jwtRE = new RegExp(`^${b64url}${sep}${b64url}${sep}${b64url}$`);
var isJWT = jwtRE.test.bind(jwtRE);
async function auth(token) {
  const isApp = isJWT(token);
  const isInstallation = token.startsWith("v1.") || token.startsWith("ghs_");
  const isUserToServer = token.startsWith("ghu_");
  const tokenType = isApp ? "app" : isInstallation ? "installation" : isUserToServer ? "user-to-server" : "oauth";
  return {
    type: "token",
    token,
    tokenType
  };
}
function withAuthorizationPrefix(token) {
  if (token.split(/\./).length === 3) {
    return `bearer ${token}`;
  }
  return `token ${token}`;
}
async function hook(token, request2, route, parameters) {
  const endpoint2 = request2.endpoint.merge(
    route,
    parameters
  );
  endpoint2.headers.authorization = withAuthorizationPrefix(token);
  return request2(endpoint2);
}
var createTokenAuth = function createTokenAuth2(token) {
  if (!token) {
    throw new Error("[@octokit/auth-token] No token passed to createTokenAuth");
  }
  if (typeof token !== "string") {
    throw new Error(
      "[@octokit/auth-token] Token passed to createTokenAuth is not a string"
    );
  }
  token = token.replace(/^(token|bearer) +/i, "");
  return Object.assign(auth.bind(null, token), {
    hook: hook.bind(null, token)
  });
};

// node_modules/.pnpm/@octokit+core@7.0.8/node_modules/@octokit/core/dist-src/version.js
var VERSION4 = "7.0.8";

// node_modules/.pnpm/@octokit+core@7.0.8/node_modules/@octokit/core/dist-src/index.js
var noop2 = () => {
};
var consoleWarn = console.warn.bind(console);
var consoleError = console.error.bind(console);
function createLogger(logger = {}) {
  if (typeof logger.debug !== "function") {
    logger.debug = noop2;
  }
  if (typeof logger.info !== "function") {
    logger.info = noop2;
  }
  if (typeof logger.warn !== "function") {
    logger.warn = consoleWarn;
  }
  if (typeof logger.error !== "function") {
    logger.error = consoleError;
  }
  return logger;
}
var userAgentTrail = `octokit-core.js/${VERSION4} ${getUserAgent()}`;
var Octokit = class {
  static VERSION = VERSION4;
  static defaults(defaults) {
    const OctokitWithDefaults = class extends this {
      constructor(...args) {
        const options = args[0] || {};
        if (typeof defaults === "function") {
          super(defaults(options));
          return;
        }
        super(
          Object.assign(
            {},
            defaults,
            options,
            options.userAgent && defaults.userAgent ? {
              userAgent: `${options.userAgent} ${defaults.userAgent}`
            } : null
          )
        );
      }
    };
    return OctokitWithDefaults;
  }
  static plugins = [];
  /**
   * Attach a plugin (or many) to your Octokit instance.
   *
   * @example
   * const API = Octokit.plugin(plugin1, plugin2, plugin3, ...)
   */
  static plugin(...newPlugins) {
    const currentPlugins = this.plugins;
    const NewOctokit = class extends this {
      static plugins = currentPlugins.concat(
        newPlugins.filter((plugin) => !currentPlugins.includes(plugin))
      );
    };
    return NewOctokit;
  }
  constructor(options = {}) {
    const hook7 = new before_after_hook_default.Collection();
    const requestDefaults = {
      baseUrl: request.endpoint.DEFAULTS.baseUrl,
      headers: {},
      request: Object.assign({}, options.request, {
        // @ts-ignore internal usage only, no need to type
        hook: hook7.bind(null, "request")
      }),
      mediaType: {
        previews: [],
        format: ""
      }
    };
    requestDefaults.headers["user-agent"] = options.userAgent ? `${options.userAgent} ${userAgentTrail}` : userAgentTrail;
    if (options.baseUrl) {
      requestDefaults.baseUrl = options.baseUrl;
    }
    if (options.previews) {
      requestDefaults.mediaType.previews = options.previews;
    }
    if (options.timeZone) {
      requestDefaults.headers["time-zone"] = options.timeZone;
    }
    this.request = request.defaults(requestDefaults);
    this.graphql = withCustomRequest(this.request).defaults(requestDefaults);
    this.log = createLogger(options.log);
    this.hook = hook7;
    if (!options.authStrategy) {
      if (!options.auth) {
        this.auth = async () => ({
          type: "unauthenticated"
        });
      } else {
        const auth7 = createTokenAuth(options.auth);
        hook7.wrap("request", auth7.hook);
        this.auth = auth7;
      }
    } else {
      const { authStrategy, ...otherOptions } = options;
      const auth7 = authStrategy(
        Object.assign(
          {
            request: this.request,
            log: this.log,
            // we pass the current octokit instance as well as its constructor options
            // to allow for authentication strategies that return a new octokit instance
            // that shares the same internal state as the current one. The original
            // requirement for this was the "event-octokit" authentication strategy
            // of https://github.com/probot/octokit-auth-probot.
            octokit: this,
            octokitOptions: otherOptions
          },
          options.auth
        )
      );
      hook7.wrap("request", auth7.hook);
      this.auth = auth7;
    }
    const classConstructor = this.constructor;
    for (let i = 0; i < classConstructor.plugins.length; ++i) {
      Object.assign(this, classConstructor.plugins[i](this, options));
    }
  }
  // assigned during constructor
  request;
  graphql;
  log;
  hook;
  // TODO: type `octokit.auth` based on passed options.authStrategy
  auth;
};

// node_modules/.pnpm/@octokit+plugin-paginate-rest@14.0.0_@octokit+core@7.0.8/node_modules/@octokit/plugin-paginate-rest/dist-bundle/index.js
var VERSION5 = "0.0.0-development";
function normalizePaginatedListResponse(response) {
  if (!response.data) {
    return {
      ...response,
      data: []
    };
  }
  const responseNeedsNormalization = ("total_count" in response.data || "total_commits" in response.data) && !("url" in response.data);
  if (!responseNeedsNormalization) return response;
  const incompleteResults = response.data.incomplete_results;
  const repositorySelection = response.data.repository_selection;
  const totalCount = response.data.total_count;
  const totalCommits = response.data.total_commits;
  delete response.data.incomplete_results;
  delete response.data.repository_selection;
  delete response.data.total_count;
  delete response.data.total_commits;
  const namespaceKey = Object.keys(response.data)[0];
  const data = response.data[namespaceKey];
  response.data = data;
  if (typeof incompleteResults !== "undefined") {
    response.data.incomplete_results = incompleteResults;
  }
  if (typeof repositorySelection !== "undefined") {
    response.data.repository_selection = repositorySelection;
  }
  response.data.total_count = totalCount;
  response.data.total_commits = totalCommits;
  return response;
}
function iterator(octokit, route, parameters) {
  const options = typeof route === "function" ? route.endpoint(parameters) : octokit.request.endpoint(route, parameters);
  const requestMethod = typeof route === "function" ? route : octokit.request;
  const method = options.method;
  const headers = options.headers;
  let url = options.url;
  return {
    [Symbol.asyncIterator]: () => ({
      async next() {
        if (!url) return { done: true };
        try {
          const response = await requestMethod({ method, url, headers });
          const normalizedResponse = normalizePaginatedListResponse(response);
          url = ((normalizedResponse.headers.link || "").match(
            /<([^<>]+)>;\s*rel="next"/
          ) || [])[1];
          if (!url && "total_commits" in normalizedResponse.data) {
            const parsedUrl = new URL(normalizedResponse.url);
            const params = parsedUrl.searchParams;
            const page = parseInt(params.get("page") || "1", 10);
            const per_page = parseInt(params.get("per_page") || "250", 10);
            if (page * per_page < normalizedResponse.data.total_commits) {
              params.set("page", String(page + 1));
              url = parsedUrl.toString();
            }
          }
          return { value: normalizedResponse };
        } catch (error) {
          if (error.status !== 409) throw error;
          url = "";
          return {
            value: {
              status: 200,
              headers: {},
              data: []
            }
          };
        }
      }
    })
  };
}
function paginate(octokit, route, parameters, mapFn) {
  if (typeof parameters === "function") {
    mapFn = parameters;
    parameters = void 0;
  }
  return gather(
    octokit,
    [],
    iterator(octokit, route, parameters)[Symbol.asyncIterator](),
    mapFn
  );
}
function gather(octokit, results, iterator22, mapFn) {
  return iterator22.next().then((result) => {
    if (result.done) {
      return results;
    }
    let earlyExit = false;
    function done() {
      earlyExit = true;
    }
    results = results.concat(
      mapFn ? mapFn(result.value, done) : result.value.data
    );
    if (earlyExit) {
      return results;
    }
    return gather(octokit, results, iterator22, mapFn);
  });
}
var composePaginateRest = Object.assign(paginate, {
  iterator
});
function paginateRest(octokit) {
  return {
    paginate: Object.assign(paginate.bind(null, octokit), {
      iterator: iterator.bind(null, octokit)
    })
  };
}
paginateRest.VERSION = VERSION5;

// node_modules/.pnpm/@octokit+plugin-paginate-graphql@6.0.0_@octokit+core@7.0.8/node_modules/@octokit/plugin-paginate-graphql/dist-bundle/index.js
var generateMessage = (path, cursorValue) => `The cursor at "${path.join(
  ","
)}" did not change its value "${cursorValue}" after a page transition. Please make sure your that your query is set up correctly.`;
var MissingCursorChange = class extends Error {
  constructor(pageInfo, cursorValue) {
    super(generateMessage(pageInfo.pathInQuery, cursorValue));
    this.pageInfo = pageInfo;
    this.cursorValue = cursorValue;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
  name = "MissingCursorChangeError";
};
var MissingPageInfo = class extends Error {
  constructor(response) {
    super(
      `No pageInfo property found in response. Please make sure to specify the pageInfo in your query. Response-Data: ${JSON.stringify(
        response,
        null,
        2
      )}`
    );
    this.response = response;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
  name = "MissingPageInfo";
};
var isObject2 = (value) => Object.prototype.toString.call(value) === "[object Object]";
function findPaginatedResourcePath(responseData) {
  const paginatedResourcePath = deepFindPathToProperty(
    responseData,
    "pageInfo"
  );
  if (paginatedResourcePath.length === 0) {
    throw new MissingPageInfo(responseData);
  }
  return paginatedResourcePath;
}
var deepFindPathToProperty = (object, searchProp, path = []) => {
  for (const key of Object.keys(object)) {
    const currentPath = [...path, key];
    const currentValue = object[key];
    if (isObject2(currentValue)) {
      if (currentValue.hasOwnProperty(searchProp)) {
        return currentPath;
      }
      const result = deepFindPathToProperty(
        currentValue,
        searchProp,
        currentPath
      );
      if (result.length > 0) {
        return result;
      }
    }
  }
  return [];
};
var get = (object, path) => {
  return path.reduce((current, nextProperty) => current[nextProperty], object);
};
var set = (object, path, mutator) => {
  const lastProperty = path[path.length - 1];
  const parentPath = [...path].slice(0, -1);
  const parent = get(object, parentPath);
  if (typeof mutator === "function") {
    parent[lastProperty] = mutator(parent[lastProperty]);
  } else {
    parent[lastProperty] = mutator;
  }
};
var extractPageInfos = (responseData) => {
  const pageInfoPath = findPaginatedResourcePath(responseData);
  return {
    pathInQuery: pageInfoPath,
    pageInfo: get(responseData, [...pageInfoPath, "pageInfo"])
  };
};
var isForwardSearch = (givenPageInfo) => {
  return givenPageInfo.hasOwnProperty("hasNextPage");
};
var getCursorFrom = (pageInfo) => isForwardSearch(pageInfo) ? pageInfo.endCursor : pageInfo.startCursor;
var hasAnotherPage = (pageInfo) => isForwardSearch(pageInfo) ? pageInfo.hasNextPage : pageInfo.hasPreviousPage;
var createIterator = (octokit) => {
  return (query, initialParameters = {}) => {
    let nextPageExists = true;
    let parameters = { ...initialParameters };
    return {
      [Symbol.asyncIterator]: () => ({
        async next() {
          if (!nextPageExists) return { done: true, value: {} };
          const response = await octokit.graphql(
            query,
            parameters
          );
          const pageInfoContext = extractPageInfos(response);
          const nextCursorValue = getCursorFrom(pageInfoContext.pageInfo);
          nextPageExists = hasAnotherPage(pageInfoContext.pageInfo);
          if (nextPageExists && nextCursorValue === parameters.cursor) {
            throw new MissingCursorChange(pageInfoContext, nextCursorValue);
          }
          parameters = {
            ...parameters,
            cursor: nextCursorValue
          };
          return { done: false, value: response };
        }
      })
    };
  };
};
var mergeResponses = (response1, response2) => {
  if (Object.keys(response1).length === 0) {
    return Object.assign(response1, response2);
  }
  const path = findPaginatedResourcePath(response1);
  const nodesPath = [...path, "nodes"];
  const newNodes = get(response2, nodesPath);
  if (newNodes) {
    set(response1, nodesPath, (values) => {
      return [...values, ...newNodes];
    });
  }
  const edgesPath = [...path, "edges"];
  const newEdges = get(response2, edgesPath);
  if (newEdges) {
    set(response1, edgesPath, (values) => {
      return [...values, ...newEdges];
    });
  }
  const pageInfoPath = [...path, "pageInfo"];
  set(response1, pageInfoPath, get(response2, pageInfoPath));
  return response1;
};
var createPaginate = (octokit) => {
  const iterator3 = createIterator(octokit);
  return async (query, initialParameters = {}) => {
    let mergedResponse = {};
    for await (const response of iterator3(
      query,
      initialParameters
    )) {
      mergedResponse = mergeResponses(mergedResponse, response);
    }
    return mergedResponse;
  };
};
function paginateGraphQL(octokit) {
  return {
    graphql: Object.assign(octokit.graphql, {
      paginate: Object.assign(createPaginate(octokit), {
        iterator: createIterator(octokit)
      })
    })
  };
}

// node_modules/.pnpm/@octokit+plugin-rest-endpoi_b05e717b89cdd67da7764161022795e3/node_modules/@octokit/plugin-rest-endpoint-methods/dist-src/version.js
var VERSION6 = "17.0.0";

// node_modules/.pnpm/@octokit+plugin-rest-endpoi_b05e717b89cdd67da7764161022795e3/node_modules/@octokit/plugin-rest-endpoint-methods/dist-src/generated/endpoints.js
var Endpoints = {
  actions: {
    addCustomLabelsToSelfHostedRunnerForOrg: [
      "POST /orgs/{org}/actions/runners/{runner_id}/labels"
    ],
    addCustomLabelsToSelfHostedRunnerForRepo: [
      "POST /repos/{owner}/{repo}/actions/runners/{runner_id}/labels"
    ],
    addRepoAccessToSelfHostedRunnerGroupInOrg: [
      "PUT /orgs/{org}/actions/runner-groups/{runner_group_id}/repositories/{repository_id}"
    ],
    addSelectedRepoToOrgSecret: [
      "PUT /orgs/{org}/actions/secrets/{secret_name}/repositories/{repository_id}"
    ],
    addSelectedRepoToOrgVariable: [
      "PUT /orgs/{org}/actions/variables/{name}/repositories/{repository_id}"
    ],
    approveWorkflowRun: [
      "POST /repos/{owner}/{repo}/actions/runs/{run_id}/approve"
    ],
    cancelWorkflowRun: [
      "POST /repos/{owner}/{repo}/actions/runs/{run_id}/cancel"
    ],
    createEnvironmentVariable: [
      "POST /repos/{owner}/{repo}/environments/{environment_name}/variables"
    ],
    createHostedRunnerForOrg: ["POST /orgs/{org}/actions/hosted-runners"],
    createOrUpdateEnvironmentSecret: [
      "PUT /repos/{owner}/{repo}/environments/{environment_name}/secrets/{secret_name}"
    ],
    createOrUpdateOrgSecret: ["PUT /orgs/{org}/actions/secrets/{secret_name}"],
    createOrUpdateRepoSecret: [
      "PUT /repos/{owner}/{repo}/actions/secrets/{secret_name}"
    ],
    createOrgVariable: ["POST /orgs/{org}/actions/variables"],
    createRegistrationTokenForOrg: [
      "POST /orgs/{org}/actions/runners/registration-token"
    ],
    createRegistrationTokenForRepo: [
      "POST /repos/{owner}/{repo}/actions/runners/registration-token"
    ],
    createRemoveTokenForOrg: ["POST /orgs/{org}/actions/runners/remove-token"],
    createRemoveTokenForRepo: [
      "POST /repos/{owner}/{repo}/actions/runners/remove-token"
    ],
    createRepoVariable: ["POST /repos/{owner}/{repo}/actions/variables"],
    createWorkflowDispatch: [
      "POST /repos/{owner}/{repo}/actions/workflows/{workflow_id}/dispatches"
    ],
    deleteActionsCacheById: [
      "DELETE /repos/{owner}/{repo}/actions/caches/{cache_id}"
    ],
    deleteActionsCacheByKey: [
      "DELETE /repos/{owner}/{repo}/actions/caches{?key,ref}"
    ],
    deleteArtifact: [
      "DELETE /repos/{owner}/{repo}/actions/artifacts/{artifact_id}"
    ],
    deleteCustomImageFromOrg: [
      "DELETE /orgs/{org}/actions/hosted-runners/images/custom/{image_definition_id}"
    ],
    deleteCustomImageVersionFromOrg: [
      "DELETE /orgs/{org}/actions/hosted-runners/images/custom/{image_definition_id}/versions/{version}"
    ],
    deleteEnvironmentSecret: [
      "DELETE /repos/{owner}/{repo}/environments/{environment_name}/secrets/{secret_name}"
    ],
    deleteEnvironmentVariable: [
      "DELETE /repos/{owner}/{repo}/environments/{environment_name}/variables/{name}"
    ],
    deleteHostedRunnerForOrg: [
      "DELETE /orgs/{org}/actions/hosted-runners/{hosted_runner_id}"
    ],
    deleteOrgSecret: ["DELETE /orgs/{org}/actions/secrets/{secret_name}"],
    deleteOrgVariable: ["DELETE /orgs/{org}/actions/variables/{name}"],
    deleteRepoSecret: [
      "DELETE /repos/{owner}/{repo}/actions/secrets/{secret_name}"
    ],
    deleteRepoVariable: [
      "DELETE /repos/{owner}/{repo}/actions/variables/{name}"
    ],
    deleteSelfHostedRunnerFromOrg: [
      "DELETE /orgs/{org}/actions/runners/{runner_id}"
    ],
    deleteSelfHostedRunnerFromRepo: [
      "DELETE /repos/{owner}/{repo}/actions/runners/{runner_id}"
    ],
    deleteWorkflowRun: ["DELETE /repos/{owner}/{repo}/actions/runs/{run_id}"],
    deleteWorkflowRunLogs: [
      "DELETE /repos/{owner}/{repo}/actions/runs/{run_id}/logs"
    ],
    disableSelectedRepositoryGithubActionsOrganization: [
      "DELETE /orgs/{org}/actions/permissions/repositories/{repository_id}"
    ],
    disableWorkflow: [
      "PUT /repos/{owner}/{repo}/actions/workflows/{workflow_id}/disable"
    ],
    downloadArtifact: [
      "GET /repos/{owner}/{repo}/actions/artifacts/{artifact_id}/{archive_format}"
    ],
    downloadJobLogsForWorkflowRun: [
      "GET /repos/{owner}/{repo}/actions/jobs/{job_id}/logs"
    ],
    downloadWorkflowRunAttemptLogs: [
      "GET /repos/{owner}/{repo}/actions/runs/{run_id}/attempts/{attempt_number}/logs"
    ],
    downloadWorkflowRunLogs: [
      "GET /repos/{owner}/{repo}/actions/runs/{run_id}/logs"
    ],
    enableSelectedRepositoryGithubActionsOrganization: [
      "PUT /orgs/{org}/actions/permissions/repositories/{repository_id}"
    ],
    enableWorkflow: [
      "PUT /repos/{owner}/{repo}/actions/workflows/{workflow_id}/enable"
    ],
    forceCancelWorkflowRun: [
      "POST /repos/{owner}/{repo}/actions/runs/{run_id}/force-cancel"
    ],
    generateRunnerJitconfigForOrg: [
      "POST /orgs/{org}/actions/runners/generate-jitconfig"
    ],
    generateRunnerJitconfigForRepo: [
      "POST /repos/{owner}/{repo}/actions/runners/generate-jitconfig"
    ],
    getActionsCacheList: ["GET /repos/{owner}/{repo}/actions/caches"],
    getActionsCacheUsage: ["GET /repos/{owner}/{repo}/actions/cache/usage"],
    getActionsCacheUsageByRepoForOrg: [
      "GET /orgs/{org}/actions/cache/usage-by-repository"
    ],
    getActionsCacheUsageForOrg: ["GET /orgs/{org}/actions/cache/usage"],
    getAllowedActionsOrganization: [
      "GET /orgs/{org}/actions/permissions/selected-actions"
    ],
    getAllowedActionsRepository: [
      "GET /repos/{owner}/{repo}/actions/permissions/selected-actions"
    ],
    getArtifact: ["GET /repos/{owner}/{repo}/actions/artifacts/{artifact_id}"],
    getCustomImageForOrg: [
      "GET /orgs/{org}/actions/hosted-runners/images/custom/{image_definition_id}"
    ],
    getCustomImageVersionForOrg: [
      "GET /orgs/{org}/actions/hosted-runners/images/custom/{image_definition_id}/versions/{version}"
    ],
    getCustomOidcSubClaimForRepo: [
      "GET /repos/{owner}/{repo}/actions/oidc/customization/sub"
    ],
    getEnvironmentPublicKey: [
      "GET /repos/{owner}/{repo}/environments/{environment_name}/secrets/public-key"
    ],
    getEnvironmentSecret: [
      "GET /repos/{owner}/{repo}/environments/{environment_name}/secrets/{secret_name}"
    ],
    getEnvironmentVariable: [
      "GET /repos/{owner}/{repo}/environments/{environment_name}/variables/{name}"
    ],
    getGithubActionsDefaultWorkflowPermissionsOrganization: [
      "GET /orgs/{org}/actions/permissions/workflow"
    ],
    getGithubActionsDefaultWorkflowPermissionsRepository: [
      "GET /repos/{owner}/{repo}/actions/permissions/workflow"
    ],
    getGithubActionsPermissionsOrganization: [
      "GET /orgs/{org}/actions/permissions"
    ],
    getGithubActionsPermissionsRepository: [
      "GET /repos/{owner}/{repo}/actions/permissions"
    ],
    getHostedRunnerForOrg: [
      "GET /orgs/{org}/actions/hosted-runners/{hosted_runner_id}"
    ],
    getHostedRunnersGithubOwnedImagesForOrg: [
      "GET /orgs/{org}/actions/hosted-runners/images/github-owned"
    ],
    getHostedRunnersLimitsForOrg: [
      "GET /orgs/{org}/actions/hosted-runners/limits"
    ],
    getHostedRunnersMachineSpecsForOrg: [
      "GET /orgs/{org}/actions/hosted-runners/machine-sizes"
    ],
    getHostedRunnersPartnerImagesForOrg: [
      "GET /orgs/{org}/actions/hosted-runners/images/partner"
    ],
    getHostedRunnersPlatformsForOrg: [
      "GET /orgs/{org}/actions/hosted-runners/platforms"
    ],
    getJobForWorkflowRun: ["GET /repos/{owner}/{repo}/actions/jobs/{job_id}"],
    getOrgPublicKey: ["GET /orgs/{org}/actions/secrets/public-key"],
    getOrgSecret: ["GET /orgs/{org}/actions/secrets/{secret_name}"],
    getOrgVariable: ["GET /orgs/{org}/actions/variables/{name}"],
    getPendingDeploymentsForRun: [
      "GET /repos/{owner}/{repo}/actions/runs/{run_id}/pending_deployments"
    ],
    getRepoPermissions: [
      "GET /repos/{owner}/{repo}/actions/permissions",
      {},
      { renamed: ["actions", "getGithubActionsPermissionsRepository"] }
    ],
    getRepoPublicKey: ["GET /repos/{owner}/{repo}/actions/secrets/public-key"],
    getRepoSecret: ["GET /repos/{owner}/{repo}/actions/secrets/{secret_name}"],
    getRepoVariable: ["GET /repos/{owner}/{repo}/actions/variables/{name}"],
    getReviewsForRun: [
      "GET /repos/{owner}/{repo}/actions/runs/{run_id}/approvals"
    ],
    getSelfHostedRunnerForOrg: ["GET /orgs/{org}/actions/runners/{runner_id}"],
    getSelfHostedRunnerForRepo: [
      "GET /repos/{owner}/{repo}/actions/runners/{runner_id}"
    ],
    getWorkflow: ["GET /repos/{owner}/{repo}/actions/workflows/{workflow_id}"],
    getWorkflowAccessToRepository: [
      "GET /repos/{owner}/{repo}/actions/permissions/access"
    ],
    getWorkflowRun: ["GET /repos/{owner}/{repo}/actions/runs/{run_id}"],
    getWorkflowRunAttempt: [
      "GET /repos/{owner}/{repo}/actions/runs/{run_id}/attempts/{attempt_number}"
    ],
    getWorkflowRunUsage: [
      "GET /repos/{owner}/{repo}/actions/runs/{run_id}/timing"
    ],
    getWorkflowUsage: [
      "GET /repos/{owner}/{repo}/actions/workflows/{workflow_id}/timing"
    ],
    listArtifactsForRepo: ["GET /repos/{owner}/{repo}/actions/artifacts"],
    listCustomImageVersionsForOrg: [
      "GET /orgs/{org}/actions/hosted-runners/images/custom/{image_definition_id}/versions"
    ],
    listCustomImagesForOrg: [
      "GET /orgs/{org}/actions/hosted-runners/images/custom"
    ],
    listEnvironmentSecrets: [
      "GET /repos/{owner}/{repo}/environments/{environment_name}/secrets"
    ],
    listEnvironmentVariables: [
      "GET /repos/{owner}/{repo}/environments/{environment_name}/variables"
    ],
    listGithubHostedRunnersInGroupForOrg: [
      "GET /orgs/{org}/actions/runner-groups/{runner_group_id}/hosted-runners"
    ],
    listHostedRunnersForOrg: ["GET /orgs/{org}/actions/hosted-runners"],
    listJobsForWorkflowRun: [
      "GET /repos/{owner}/{repo}/actions/runs/{run_id}/jobs"
    ],
    listJobsForWorkflowRunAttempt: [
      "GET /repos/{owner}/{repo}/actions/runs/{run_id}/attempts/{attempt_number}/jobs"
    ],
    listLabelsForSelfHostedRunnerForOrg: [
      "GET /orgs/{org}/actions/runners/{runner_id}/labels"
    ],
    listLabelsForSelfHostedRunnerForRepo: [
      "GET /repos/{owner}/{repo}/actions/runners/{runner_id}/labels"
    ],
    listOrgSecrets: ["GET /orgs/{org}/actions/secrets"],
    listOrgVariables: ["GET /orgs/{org}/actions/variables"],
    listRepoOrganizationSecrets: [
      "GET /repos/{owner}/{repo}/actions/organization-secrets"
    ],
    listRepoOrganizationVariables: [
      "GET /repos/{owner}/{repo}/actions/organization-variables"
    ],
    listRepoSecrets: ["GET /repos/{owner}/{repo}/actions/secrets"],
    listRepoVariables: ["GET /repos/{owner}/{repo}/actions/variables"],
    listRepoWorkflows: ["GET /repos/{owner}/{repo}/actions/workflows"],
    listRunnerApplicationsForOrg: ["GET /orgs/{org}/actions/runners/downloads"],
    listRunnerApplicationsForRepo: [
      "GET /repos/{owner}/{repo}/actions/runners/downloads"
    ],
    listSelectedReposForOrgSecret: [
      "GET /orgs/{org}/actions/secrets/{secret_name}/repositories"
    ],
    listSelectedReposForOrgVariable: [
      "GET /orgs/{org}/actions/variables/{name}/repositories"
    ],
    listSelectedRepositoriesEnabledGithubActionsOrganization: [
      "GET /orgs/{org}/actions/permissions/repositories"
    ],
    listSelfHostedRunnersForOrg: ["GET /orgs/{org}/actions/runners"],
    listSelfHostedRunnersForRepo: ["GET /repos/{owner}/{repo}/actions/runners"],
    listWorkflowRunArtifacts: [
      "GET /repos/{owner}/{repo}/actions/runs/{run_id}/artifacts"
    ],
    listWorkflowRuns: [
      "GET /repos/{owner}/{repo}/actions/workflows/{workflow_id}/runs"
    ],
    listWorkflowRunsForRepo: ["GET /repos/{owner}/{repo}/actions/runs"],
    reRunJobForWorkflowRun: [
      "POST /repos/{owner}/{repo}/actions/jobs/{job_id}/rerun"
    ],
    reRunWorkflow: ["POST /repos/{owner}/{repo}/actions/runs/{run_id}/rerun"],
    reRunWorkflowFailedJobs: [
      "POST /repos/{owner}/{repo}/actions/runs/{run_id}/rerun-failed-jobs"
    ],
    removeAllCustomLabelsFromSelfHostedRunnerForOrg: [
      "DELETE /orgs/{org}/actions/runners/{runner_id}/labels"
    ],
    removeAllCustomLabelsFromSelfHostedRunnerForRepo: [
      "DELETE /repos/{owner}/{repo}/actions/runners/{runner_id}/labels"
    ],
    removeCustomLabelFromSelfHostedRunnerForOrg: [
      "DELETE /orgs/{org}/actions/runners/{runner_id}/labels/{name}"
    ],
    removeCustomLabelFromSelfHostedRunnerForRepo: [
      "DELETE /repos/{owner}/{repo}/actions/runners/{runner_id}/labels/{name}"
    ],
    removeSelectedRepoFromOrgSecret: [
      "DELETE /orgs/{org}/actions/secrets/{secret_name}/repositories/{repository_id}"
    ],
    removeSelectedRepoFromOrgVariable: [
      "DELETE /orgs/{org}/actions/variables/{name}/repositories/{repository_id}"
    ],
    reviewCustomGatesForRun: [
      "POST /repos/{owner}/{repo}/actions/runs/{run_id}/deployment_protection_rule"
    ],
    reviewPendingDeploymentsForRun: [
      "POST /repos/{owner}/{repo}/actions/runs/{run_id}/pending_deployments"
    ],
    setAllowedActionsOrganization: [
      "PUT /orgs/{org}/actions/permissions/selected-actions"
    ],
    setAllowedActionsRepository: [
      "PUT /repos/{owner}/{repo}/actions/permissions/selected-actions"
    ],
    setCustomLabelsForSelfHostedRunnerForOrg: [
      "PUT /orgs/{org}/actions/runners/{runner_id}/labels"
    ],
    setCustomLabelsForSelfHostedRunnerForRepo: [
      "PUT /repos/{owner}/{repo}/actions/runners/{runner_id}/labels"
    ],
    setCustomOidcSubClaimForRepo: [
      "PUT /repos/{owner}/{repo}/actions/oidc/customization/sub"
    ],
    setGithubActionsDefaultWorkflowPermissionsOrganization: [
      "PUT /orgs/{org}/actions/permissions/workflow"
    ],
    setGithubActionsDefaultWorkflowPermissionsRepository: [
      "PUT /repos/{owner}/{repo}/actions/permissions/workflow"
    ],
    setGithubActionsPermissionsOrganization: [
      "PUT /orgs/{org}/actions/permissions"
    ],
    setGithubActionsPermissionsRepository: [
      "PUT /repos/{owner}/{repo}/actions/permissions"
    ],
    setSelectedReposForOrgSecret: [
      "PUT /orgs/{org}/actions/secrets/{secret_name}/repositories"
    ],
    setSelectedReposForOrgVariable: [
      "PUT /orgs/{org}/actions/variables/{name}/repositories"
    ],
    setSelectedRepositoriesEnabledGithubActionsOrganization: [
      "PUT /orgs/{org}/actions/permissions/repositories"
    ],
    setWorkflowAccessToRepository: [
      "PUT /repos/{owner}/{repo}/actions/permissions/access"
    ],
    updateEnvironmentVariable: [
      "PATCH /repos/{owner}/{repo}/environments/{environment_name}/variables/{name}"
    ],
    updateHostedRunnerForOrg: [
      "PATCH /orgs/{org}/actions/hosted-runners/{hosted_runner_id}"
    ],
    updateOrgVariable: ["PATCH /orgs/{org}/actions/variables/{name}"],
    updateRepoVariable: [
      "PATCH /repos/{owner}/{repo}/actions/variables/{name}"
    ]
  },
  activity: {
    checkRepoIsStarredByAuthenticatedUser: ["GET /user/starred/{owner}/{repo}"],
    deleteRepoSubscription: ["DELETE /repos/{owner}/{repo}/subscription"],
    deleteThreadSubscription: [
      "DELETE /notifications/threads/{thread_id}/subscription"
    ],
    getFeeds: ["GET /feeds"],
    getRepoSubscription: ["GET /repos/{owner}/{repo}/subscription"],
    getThread: ["GET /notifications/threads/{thread_id}"],
    getThreadSubscriptionForAuthenticatedUser: [
      "GET /notifications/threads/{thread_id}/subscription"
    ],
    listEventsForAuthenticatedUser: ["GET /users/{username}/events"],
    listNotificationsForAuthenticatedUser: ["GET /notifications"],
    listOrgEventsForAuthenticatedUser: [
      "GET /users/{username}/events/orgs/{org}"
    ],
    listPublicEvents: ["GET /events"],
    listPublicEventsForRepoNetwork: ["GET /networks/{owner}/{repo}/events"],
    listPublicEventsForUser: ["GET /users/{username}/events/public"],
    listPublicOrgEvents: ["GET /orgs/{org}/events"],
    listReceivedEventsForUser: ["GET /users/{username}/received_events"],
    listReceivedPublicEventsForUser: [
      "GET /users/{username}/received_events/public"
    ],
    listRepoEvents: ["GET /repos/{owner}/{repo}/events"],
    listRepoNotificationsForAuthenticatedUser: [
      "GET /repos/{owner}/{repo}/notifications"
    ],
    listReposStarredByAuthenticatedUser: ["GET /user/starred"],
    listReposStarredByUser: ["GET /users/{username}/starred"],
    listReposWatchedByUser: ["GET /users/{username}/subscriptions"],
    listStargazersForRepo: ["GET /repos/{owner}/{repo}/stargazers"],
    listWatchedReposForAuthenticatedUser: ["GET /user/subscriptions"],
    listWatchersForRepo: ["GET /repos/{owner}/{repo}/subscribers"],
    markNotificationsAsRead: ["PUT /notifications"],
    markRepoNotificationsAsRead: ["PUT /repos/{owner}/{repo}/notifications"],
    markThreadAsDone: ["DELETE /notifications/threads/{thread_id}"],
    markThreadAsRead: ["PATCH /notifications/threads/{thread_id}"],
    setRepoSubscription: ["PUT /repos/{owner}/{repo}/subscription"],
    setThreadSubscription: [
      "PUT /notifications/threads/{thread_id}/subscription"
    ],
    starRepoForAuthenticatedUser: ["PUT /user/starred/{owner}/{repo}"],
    unstarRepoForAuthenticatedUser: ["DELETE /user/starred/{owner}/{repo}"]
  },
  apps: {
    addRepoToInstallation: [
      "PUT /user/installations/{installation_id}/repositories/{repository_id}",
      {},
      { renamed: ["apps", "addRepoToInstallationForAuthenticatedUser"] }
    ],
    addRepoToInstallationForAuthenticatedUser: [
      "PUT /user/installations/{installation_id}/repositories/{repository_id}"
    ],
    checkToken: ["POST /applications/{client_id}/token"],
    createFromManifest: ["POST /app-manifests/{code}/conversions"],
    createInstallationAccessToken: [
      "POST /app/installations/{installation_id}/access_tokens"
    ],
    deleteAuthorization: ["DELETE /applications/{client_id}/grant"],
    deleteInstallation: ["DELETE /app/installations/{installation_id}"],
    deleteToken: ["DELETE /applications/{client_id}/token"],
    getAuthenticated: ["GET /app"],
    getBySlug: ["GET /apps/{app_slug}"],
    getInstallation: ["GET /app/installations/{installation_id}"],
    getOrgInstallation: ["GET /orgs/{org}/installation"],
    getRepoInstallation: ["GET /repos/{owner}/{repo}/installation"],
    getSubscriptionPlanForAccount: [
      "GET /marketplace_listing/accounts/{account_id}"
    ],
    getSubscriptionPlanForAccountStubbed: [
      "GET /marketplace_listing/stubbed/accounts/{account_id}"
    ],
    getUserInstallation: ["GET /users/{username}/installation"],
    getWebhookConfigForApp: ["GET /app/hook/config"],
    getWebhookDelivery: ["GET /app/hook/deliveries/{delivery_id}"],
    listAccountsForPlan: ["GET /marketplace_listing/plans/{plan_id}/accounts"],
    listAccountsForPlanStubbed: [
      "GET /marketplace_listing/stubbed/plans/{plan_id}/accounts"
    ],
    listInstallationReposForAuthenticatedUser: [
      "GET /user/installations/{installation_id}/repositories"
    ],
    listInstallationRequestsForAuthenticatedApp: [
      "GET /app/installation-requests"
    ],
    listInstallations: ["GET /app/installations"],
    listInstallationsForAuthenticatedUser: ["GET /user/installations"],
    listPlans: ["GET /marketplace_listing/plans"],
    listPlansStubbed: ["GET /marketplace_listing/stubbed/plans"],
    listReposAccessibleToInstallation: ["GET /installation/repositories"],
    listSubscriptionsForAuthenticatedUser: ["GET /user/marketplace_purchases"],
    listSubscriptionsForAuthenticatedUserStubbed: [
      "GET /user/marketplace_purchases/stubbed"
    ],
    listWebhookDeliveries: ["GET /app/hook/deliveries"],
    redeliverWebhookDelivery: [
      "POST /app/hook/deliveries/{delivery_id}/attempts"
    ],
    removeRepoFromInstallation: [
      "DELETE /user/installations/{installation_id}/repositories/{repository_id}",
      {},
      { renamed: ["apps", "removeRepoFromInstallationForAuthenticatedUser"] }
    ],
    removeRepoFromInstallationForAuthenticatedUser: [
      "DELETE /user/installations/{installation_id}/repositories/{repository_id}"
    ],
    resetToken: ["PATCH /applications/{client_id}/token"],
    revokeInstallationAccessToken: ["DELETE /installation/token"],
    scopeToken: ["POST /applications/{client_id}/token/scoped"],
    suspendInstallation: ["PUT /app/installations/{installation_id}/suspended"],
    unsuspendInstallation: [
      "DELETE /app/installations/{installation_id}/suspended"
    ],
    updateWebhookConfigForApp: ["PATCH /app/hook/config"]
  },
  billing: {
    getGithubActionsBillingOrg: ["GET /orgs/{org}/settings/billing/actions"],
    getGithubActionsBillingUser: [
      "GET /users/{username}/settings/billing/actions"
    ],
    getGithubBillingPremiumRequestUsageReportOrg: [
      "GET /organizations/{org}/settings/billing/premium_request/usage"
    ],
    getGithubBillingPremiumRequestUsageReportUser: [
      "GET /users/{username}/settings/billing/premium_request/usage"
    ],
    getGithubBillingUsageReportOrg: [
      "GET /organizations/{org}/settings/billing/usage"
    ],
    getGithubBillingUsageReportUser: [
      "GET /users/{username}/settings/billing/usage"
    ],
    getGithubPackagesBillingOrg: ["GET /orgs/{org}/settings/billing/packages"],
    getGithubPackagesBillingUser: [
      "GET /users/{username}/settings/billing/packages"
    ],
    getSharedStorageBillingOrg: [
      "GET /orgs/{org}/settings/billing/shared-storage"
    ],
    getSharedStorageBillingUser: [
      "GET /users/{username}/settings/billing/shared-storage"
    ]
  },
  campaigns: {
    createCampaign: ["POST /orgs/{org}/campaigns"],
    deleteCampaign: ["DELETE /orgs/{org}/campaigns/{campaign_number}"],
    getCampaignSummary: ["GET /orgs/{org}/campaigns/{campaign_number}"],
    listOrgCampaigns: ["GET /orgs/{org}/campaigns"],
    updateCampaign: ["PATCH /orgs/{org}/campaigns/{campaign_number}"]
  },
  checks: {
    create: ["POST /repos/{owner}/{repo}/check-runs"],
    createSuite: ["POST /repos/{owner}/{repo}/check-suites"],
    get: ["GET /repos/{owner}/{repo}/check-runs/{check_run_id}"],
    getSuite: ["GET /repos/{owner}/{repo}/check-suites/{check_suite_id}"],
    listAnnotations: [
      "GET /repos/{owner}/{repo}/check-runs/{check_run_id}/annotations"
    ],
    listForRef: ["GET /repos/{owner}/{repo}/commits/{ref}/check-runs"],
    listForSuite: [
      "GET /repos/{owner}/{repo}/check-suites/{check_suite_id}/check-runs"
    ],
    listSuitesForRef: ["GET /repos/{owner}/{repo}/commits/{ref}/check-suites"],
    rerequestRun: [
      "POST /repos/{owner}/{repo}/check-runs/{check_run_id}/rerequest"
    ],
    rerequestSuite: [
      "POST /repos/{owner}/{repo}/check-suites/{check_suite_id}/rerequest"
    ],
    setSuitesPreferences: [
      "PATCH /repos/{owner}/{repo}/check-suites/preferences"
    ],
    update: ["PATCH /repos/{owner}/{repo}/check-runs/{check_run_id}"]
  },
  codeScanning: {
    commitAutofix: [
      "POST /repos/{owner}/{repo}/code-scanning/alerts/{alert_number}/autofix/commits"
    ],
    createAutofix: [
      "POST /repos/{owner}/{repo}/code-scanning/alerts/{alert_number}/autofix"
    ],
    createVariantAnalysis: [
      "POST /repos/{owner}/{repo}/code-scanning/codeql/variant-analyses"
    ],
    deleteAnalysis: [
      "DELETE /repos/{owner}/{repo}/code-scanning/analyses/{analysis_id}{?confirm_delete}"
    ],
    deleteCodeqlDatabase: [
      "DELETE /repos/{owner}/{repo}/code-scanning/codeql/databases/{language}"
    ],
    getAlert: [
      "GET /repos/{owner}/{repo}/code-scanning/alerts/{alert_number}",
      {},
      { renamedParameters: { alert_id: "alert_number" } }
    ],
    getAnalysis: [
      "GET /repos/{owner}/{repo}/code-scanning/analyses/{analysis_id}"
    ],
    getAutofix: [
      "GET /repos/{owner}/{repo}/code-scanning/alerts/{alert_number}/autofix"
    ],
    getCodeqlDatabase: [
      "GET /repos/{owner}/{repo}/code-scanning/codeql/databases/{language}"
    ],
    getDefaultSetup: ["GET /repos/{owner}/{repo}/code-scanning/default-setup"],
    getSarif: ["GET /repos/{owner}/{repo}/code-scanning/sarifs/{sarif_id}"],
    getVariantAnalysis: [
      "GET /repos/{owner}/{repo}/code-scanning/codeql/variant-analyses/{codeql_variant_analysis_id}"
    ],
    getVariantAnalysisRepoTask: [
      "GET /repos/{owner}/{repo}/code-scanning/codeql/variant-analyses/{codeql_variant_analysis_id}/repos/{repo_owner}/{repo_name}"
    ],
    listAlertInstances: [
      "GET /repos/{owner}/{repo}/code-scanning/alerts/{alert_number}/instances"
    ],
    listAlertsForOrg: ["GET /orgs/{org}/code-scanning/alerts"],
    listAlertsForRepo: ["GET /repos/{owner}/{repo}/code-scanning/alerts"],
    listAlertsInstances: [
      "GET /repos/{owner}/{repo}/code-scanning/alerts/{alert_number}/instances",
      {},
      { renamed: ["codeScanning", "listAlertInstances"] }
    ],
    listCodeqlDatabases: [
      "GET /repos/{owner}/{repo}/code-scanning/codeql/databases"
    ],
    listRecentAnalyses: ["GET /repos/{owner}/{repo}/code-scanning/analyses"],
    updateAlert: [
      "PATCH /repos/{owner}/{repo}/code-scanning/alerts/{alert_number}"
    ],
    updateDefaultSetup: [
      "PATCH /repos/{owner}/{repo}/code-scanning/default-setup"
    ],
    uploadSarif: ["POST /repos/{owner}/{repo}/code-scanning/sarifs"]
  },
  codeSecurity: {
    attachConfiguration: [
      "POST /orgs/{org}/code-security/configurations/{configuration_id}/attach"
    ],
    attachEnterpriseConfiguration: [
      "POST /enterprises/{enterprise}/code-security/configurations/{configuration_id}/attach"
    ],
    createConfiguration: ["POST /orgs/{org}/code-security/configurations"],
    createConfigurationForEnterprise: [
      "POST /enterprises/{enterprise}/code-security/configurations"
    ],
    deleteConfiguration: [
      "DELETE /orgs/{org}/code-security/configurations/{configuration_id}"
    ],
    deleteConfigurationForEnterprise: [
      "DELETE /enterprises/{enterprise}/code-security/configurations/{configuration_id}"
    ],
    detachConfiguration: [
      "DELETE /orgs/{org}/code-security/configurations/detach"
    ],
    getConfiguration: [
      "GET /orgs/{org}/code-security/configurations/{configuration_id}"
    ],
    getConfigurationForRepository: [
      "GET /repos/{owner}/{repo}/code-security-configuration"
    ],
    getConfigurationsForEnterprise: [
      "GET /enterprises/{enterprise}/code-security/configurations"
    ],
    getConfigurationsForOrg: ["GET /orgs/{org}/code-security/configurations"],
    getDefaultConfigurations: [
      "GET /orgs/{org}/code-security/configurations/defaults"
    ],
    getDefaultConfigurationsForEnterprise: [
      "GET /enterprises/{enterprise}/code-security/configurations/defaults"
    ],
    getRepositoriesForConfiguration: [
      "GET /orgs/{org}/code-security/configurations/{configuration_id}/repositories"
    ],
    getRepositoriesForEnterpriseConfiguration: [
      "GET /enterprises/{enterprise}/code-security/configurations/{configuration_id}/repositories"
    ],
    getSingleConfigurationForEnterprise: [
      "GET /enterprises/{enterprise}/code-security/configurations/{configuration_id}"
    ],
    setConfigurationAsDefault: [
      "PUT /orgs/{org}/code-security/configurations/{configuration_id}/defaults"
    ],
    setConfigurationAsDefaultForEnterprise: [
      "PUT /enterprises/{enterprise}/code-security/configurations/{configuration_id}/defaults"
    ],
    updateConfiguration: [
      "PATCH /orgs/{org}/code-security/configurations/{configuration_id}"
    ],
    updateEnterpriseConfiguration: [
      "PATCH /enterprises/{enterprise}/code-security/configurations/{configuration_id}"
    ]
  },
  codesOfConduct: {
    getAllCodesOfConduct: ["GET /codes_of_conduct"],
    getConductCode: ["GET /codes_of_conduct/{key}"]
  },
  codespaces: {
    addRepositoryForSecretForAuthenticatedUser: [
      "PUT /user/codespaces/secrets/{secret_name}/repositories/{repository_id}"
    ],
    addSelectedRepoToOrgSecret: [
      "PUT /orgs/{org}/codespaces/secrets/{secret_name}/repositories/{repository_id}"
    ],
    checkPermissionsForDevcontainer: [
      "GET /repos/{owner}/{repo}/codespaces/permissions_check"
    ],
    codespaceMachinesForAuthenticatedUser: [
      "GET /user/codespaces/{codespace_name}/machines"
    ],
    createForAuthenticatedUser: ["POST /user/codespaces"],
    createOrUpdateOrgSecret: [
      "PUT /orgs/{org}/codespaces/secrets/{secret_name}"
    ],
    createOrUpdateRepoSecret: [
      "PUT /repos/{owner}/{repo}/codespaces/secrets/{secret_name}"
    ],
    createOrUpdateSecretForAuthenticatedUser: [
      "PUT /user/codespaces/secrets/{secret_name}"
    ],
    createWithPrForAuthenticatedUser: [
      "POST /repos/{owner}/{repo}/pulls/{pull_number}/codespaces"
    ],
    createWithRepoForAuthenticatedUser: [
      "POST /repos/{owner}/{repo}/codespaces"
    ],
    deleteForAuthenticatedUser: ["DELETE /user/codespaces/{codespace_name}"],
    deleteFromOrganization: [
      "DELETE /orgs/{org}/members/{username}/codespaces/{codespace_name}"
    ],
    deleteOrgSecret: ["DELETE /orgs/{org}/codespaces/secrets/{secret_name}"],
    deleteRepoSecret: [
      "DELETE /repos/{owner}/{repo}/codespaces/secrets/{secret_name}"
    ],
    deleteSecretForAuthenticatedUser: [
      "DELETE /user/codespaces/secrets/{secret_name}"
    ],
    exportForAuthenticatedUser: [
      "POST /user/codespaces/{codespace_name}/exports"
    ],
    getCodespacesForUserInOrg: [
      "GET /orgs/{org}/members/{username}/codespaces"
    ],
    getExportDetailsForAuthenticatedUser: [
      "GET /user/codespaces/{codespace_name}/exports/{export_id}"
    ],
    getForAuthenticatedUser: ["GET /user/codespaces/{codespace_name}"],
    getOrgPublicKey: ["GET /orgs/{org}/codespaces/secrets/public-key"],
    getOrgSecret: ["GET /orgs/{org}/codespaces/secrets/{secret_name}"],
    getPublicKeyForAuthenticatedUser: [
      "GET /user/codespaces/secrets/public-key"
    ],
    getRepoPublicKey: [
      "GET /repos/{owner}/{repo}/codespaces/secrets/public-key"
    ],
    getRepoSecret: [
      "GET /repos/{owner}/{repo}/codespaces/secrets/{secret_name}"
    ],
    getSecretForAuthenticatedUser: [
      "GET /user/codespaces/secrets/{secret_name}"
    ],
    listDevcontainersInRepositoryForAuthenticatedUser: [
      "GET /repos/{owner}/{repo}/codespaces/devcontainers"
    ],
    listForAuthenticatedUser: ["GET /user/codespaces"],
    listInOrganization: [
      "GET /orgs/{org}/codespaces",
      {},
      { renamedParameters: { org_id: "org" } }
    ],
    listInRepositoryForAuthenticatedUser: [
      "GET /repos/{owner}/{repo}/codespaces"
    ],
    listOrgSecrets: ["GET /orgs/{org}/codespaces/secrets"],
    listRepoSecrets: ["GET /repos/{owner}/{repo}/codespaces/secrets"],
    listRepositoriesForSecretForAuthenticatedUser: [
      "GET /user/codespaces/secrets/{secret_name}/repositories"
    ],
    listSecretsForAuthenticatedUser: ["GET /user/codespaces/secrets"],
    listSelectedReposForOrgSecret: [
      "GET /orgs/{org}/codespaces/secrets/{secret_name}/repositories"
    ],
    preFlightWithRepoForAuthenticatedUser: [
      "GET /repos/{owner}/{repo}/codespaces/new"
    ],
    publishForAuthenticatedUser: [
      "POST /user/codespaces/{codespace_name}/publish"
    ],
    removeRepositoryForSecretForAuthenticatedUser: [
      "DELETE /user/codespaces/secrets/{secret_name}/repositories/{repository_id}"
    ],
    removeSelectedRepoFromOrgSecret: [
      "DELETE /orgs/{org}/codespaces/secrets/{secret_name}/repositories/{repository_id}"
    ],
    repoMachinesForAuthenticatedUser: [
      "GET /repos/{owner}/{repo}/codespaces/machines"
    ],
    setRepositoriesForSecretForAuthenticatedUser: [
      "PUT /user/codespaces/secrets/{secret_name}/repositories"
    ],
    setSelectedReposForOrgSecret: [
      "PUT /orgs/{org}/codespaces/secrets/{secret_name}/repositories"
    ],
    startForAuthenticatedUser: ["POST /user/codespaces/{codespace_name}/start"],
    stopForAuthenticatedUser: ["POST /user/codespaces/{codespace_name}/stop"],
    stopInOrganization: [
      "POST /orgs/{org}/members/{username}/codespaces/{codespace_name}/stop"
    ],
    updateForAuthenticatedUser: ["PATCH /user/codespaces/{codespace_name}"]
  },
  copilot: {
    addCopilotSeatsForTeams: [
      "POST /orgs/{org}/copilot/billing/selected_teams"
    ],
    addCopilotSeatsForUsers: [
      "POST /orgs/{org}/copilot/billing/selected_users"
    ],
    cancelCopilotSeatAssignmentForTeams: [
      "DELETE /orgs/{org}/copilot/billing/selected_teams"
    ],
    cancelCopilotSeatAssignmentForUsers: [
      "DELETE /orgs/{org}/copilot/billing/selected_users"
    ],
    copilotMetricsForOrganization: ["GET /orgs/{org}/copilot/metrics"],
    copilotMetricsForTeam: ["GET /orgs/{org}/team/{team_slug}/copilot/metrics"],
    getCopilotOrganizationDetails: ["GET /orgs/{org}/copilot/billing"],
    getCopilotSeatDetailsForUser: [
      "GET /orgs/{org}/members/{username}/copilot"
    ],
    listCopilotSeats: ["GET /orgs/{org}/copilot/billing/seats"]
  },
  credentials: { revoke: ["POST /credentials/revoke"] },
  dependabot: {
    addSelectedRepoToOrgSecret: [
      "PUT /orgs/{org}/dependabot/secrets/{secret_name}/repositories/{repository_id}"
    ],
    createOrUpdateOrgSecret: [
      "PUT /orgs/{org}/dependabot/secrets/{secret_name}"
    ],
    createOrUpdateRepoSecret: [
      "PUT /repos/{owner}/{repo}/dependabot/secrets/{secret_name}"
    ],
    deleteOrgSecret: ["DELETE /orgs/{org}/dependabot/secrets/{secret_name}"],
    deleteRepoSecret: [
      "DELETE /repos/{owner}/{repo}/dependabot/secrets/{secret_name}"
    ],
    getAlert: ["GET /repos/{owner}/{repo}/dependabot/alerts/{alert_number}"],
    getOrgPublicKey: ["GET /orgs/{org}/dependabot/secrets/public-key"],
    getOrgSecret: ["GET /orgs/{org}/dependabot/secrets/{secret_name}"],
    getRepoPublicKey: [
      "GET /repos/{owner}/{repo}/dependabot/secrets/public-key"
    ],
    getRepoSecret: [
      "GET /repos/{owner}/{repo}/dependabot/secrets/{secret_name}"
    ],
    listAlertsForEnterprise: [
      "GET /enterprises/{enterprise}/dependabot/alerts"
    ],
    listAlertsForOrg: ["GET /orgs/{org}/dependabot/alerts"],
    listAlertsForRepo: ["GET /repos/{owner}/{repo}/dependabot/alerts"],
    listOrgSecrets: ["GET /orgs/{org}/dependabot/secrets"],
    listRepoSecrets: ["GET /repos/{owner}/{repo}/dependabot/secrets"],
    listSelectedReposForOrgSecret: [
      "GET /orgs/{org}/dependabot/secrets/{secret_name}/repositories"
    ],
    removeSelectedRepoFromOrgSecret: [
      "DELETE /orgs/{org}/dependabot/secrets/{secret_name}/repositories/{repository_id}"
    ],
    repositoryAccessForOrg: [
      "GET /organizations/{org}/dependabot/repository-access"
    ],
    setRepositoryAccessDefaultLevel: [
      "PUT /organizations/{org}/dependabot/repository-access/default-level"
    ],
    setSelectedReposForOrgSecret: [
      "PUT /orgs/{org}/dependabot/secrets/{secret_name}/repositories"
    ],
    updateAlert: [
      "PATCH /repos/{owner}/{repo}/dependabot/alerts/{alert_number}"
    ],
    updateRepositoryAccessForOrg: [
      "PATCH /organizations/{org}/dependabot/repository-access"
    ]
  },
  dependencyGraph: {
    createRepositorySnapshot: [
      "POST /repos/{owner}/{repo}/dependency-graph/snapshots"
    ],
    diffRange: [
      "GET /repos/{owner}/{repo}/dependency-graph/compare/{basehead}"
    ],
    exportSbom: ["GET /repos/{owner}/{repo}/dependency-graph/sbom"]
  },
  emojis: { get: ["GET /emojis"] },
  enterpriseTeamMemberships: {
    add: [
      "PUT /enterprises/{enterprise}/teams/{enterprise-team}/memberships/{username}"
    ],
    bulkAdd: [
      "POST /enterprises/{enterprise}/teams/{enterprise-team}/memberships/add"
    ],
    bulkRemove: [
      "POST /enterprises/{enterprise}/teams/{enterprise-team}/memberships/remove"
    ],
    get: [
      "GET /enterprises/{enterprise}/teams/{enterprise-team}/memberships/{username}"
    ],
    list: ["GET /enterprises/{enterprise}/teams/{enterprise-team}/memberships"],
    remove: [
      "DELETE /enterprises/{enterprise}/teams/{enterprise-team}/memberships/{username}"
    ]
  },
  enterpriseTeamOrganizations: {
    add: [
      "PUT /enterprises/{enterprise}/teams/{enterprise-team}/organizations/{org}"
    ],
    bulkAdd: [
      "POST /enterprises/{enterprise}/teams/{enterprise-team}/organizations/add"
    ],
    bulkRemove: [
      "POST /enterprises/{enterprise}/teams/{enterprise-team}/organizations/remove"
    ],
    delete: [
      "DELETE /enterprises/{enterprise}/teams/{enterprise-team}/organizations/{org}"
    ],
    getAssignment: [
      "GET /enterprises/{enterprise}/teams/{enterprise-team}/organizations/{org}"
    ],
    getAssignments: [
      "GET /enterprises/{enterprise}/teams/{enterprise-team}/organizations"
    ]
  },
  enterpriseTeams: {
    create: ["POST /enterprises/{enterprise}/teams"],
    delete: ["DELETE /enterprises/{enterprise}/teams/{team_slug}"],
    get: ["GET /enterprises/{enterprise}/teams/{team_slug}"],
    list: ["GET /enterprises/{enterprise}/teams"],
    update: ["PATCH /enterprises/{enterprise}/teams/{team_slug}"]
  },
  gists: {
    checkIsStarred: ["GET /gists/{gist_id}/star"],
    create: ["POST /gists"],
    createComment: ["POST /gists/{gist_id}/comments"],
    delete: ["DELETE /gists/{gist_id}"],
    deleteComment: ["DELETE /gists/{gist_id}/comments/{comment_id}"],
    fork: ["POST /gists/{gist_id}/forks"],
    get: ["GET /gists/{gist_id}"],
    getComment: ["GET /gists/{gist_id}/comments/{comment_id}"],
    getRevision: ["GET /gists/{gist_id}/{sha}"],
    list: ["GET /gists"],
    listComments: ["GET /gists/{gist_id}/comments"],
    listCommits: ["GET /gists/{gist_id}/commits"],
    listForUser: ["GET /users/{username}/gists"],
    listForks: ["GET /gists/{gist_id}/forks"],
    listPublic: ["GET /gists/public"],
    listStarred: ["GET /gists/starred"],
    star: ["PUT /gists/{gist_id}/star"],
    unstar: ["DELETE /gists/{gist_id}/star"],
    update: ["PATCH /gists/{gist_id}"],
    updateComment: ["PATCH /gists/{gist_id}/comments/{comment_id}"]
  },
  git: {
    createBlob: ["POST /repos/{owner}/{repo}/git/blobs"],
    createCommit: ["POST /repos/{owner}/{repo}/git/commits"],
    createRef: ["POST /repos/{owner}/{repo}/git/refs"],
    createTag: ["POST /repos/{owner}/{repo}/git/tags"],
    createTree: ["POST /repos/{owner}/{repo}/git/trees"],
    deleteRef: ["DELETE /repos/{owner}/{repo}/git/refs/{ref}"],
    getBlob: ["GET /repos/{owner}/{repo}/git/blobs/{file_sha}"],
    getCommit: ["GET /repos/{owner}/{repo}/git/commits/{commit_sha}"],
    getRef: ["GET /repos/{owner}/{repo}/git/ref/{ref}"],
    getTag: ["GET /repos/{owner}/{repo}/git/tags/{tag_sha}"],
    getTree: ["GET /repos/{owner}/{repo}/git/trees/{tree_sha}"],
    listMatchingRefs: ["GET /repos/{owner}/{repo}/git/matching-refs/{ref}"],
    updateRef: ["PATCH /repos/{owner}/{repo}/git/refs/{ref}"]
  },
  gitignore: {
    getAllTemplates: ["GET /gitignore/templates"],
    getTemplate: ["GET /gitignore/templates/{name}"]
  },
  hostedCompute: {
    createNetworkConfigurationForOrg: [
      "POST /orgs/{org}/settings/network-configurations"
    ],
    deleteNetworkConfigurationFromOrg: [
      "DELETE /orgs/{org}/settings/network-configurations/{network_configuration_id}"
    ],
    getNetworkConfigurationForOrg: [
      "GET /orgs/{org}/settings/network-configurations/{network_configuration_id}"
    ],
    getNetworkSettingsForOrg: [
      "GET /orgs/{org}/settings/network-settings/{network_settings_id}"
    ],
    listNetworkConfigurationsForOrg: [
      "GET /orgs/{org}/settings/network-configurations"
    ],
    updateNetworkConfigurationForOrg: [
      "PATCH /orgs/{org}/settings/network-configurations/{network_configuration_id}"
    ]
  },
  interactions: {
    getRestrictionsForAuthenticatedUser: ["GET /user/interaction-limits"],
    getRestrictionsForOrg: ["GET /orgs/{org}/interaction-limits"],
    getRestrictionsForRepo: ["GET /repos/{owner}/{repo}/interaction-limits"],
    getRestrictionsForYourPublicRepos: [
      "GET /user/interaction-limits",
      {},
      { renamed: ["interactions", "getRestrictionsForAuthenticatedUser"] }
    ],
    removeRestrictionsForAuthenticatedUser: ["DELETE /user/interaction-limits"],
    removeRestrictionsForOrg: ["DELETE /orgs/{org}/interaction-limits"],
    removeRestrictionsForRepo: [
      "DELETE /repos/{owner}/{repo}/interaction-limits"
    ],
    removeRestrictionsForYourPublicRepos: [
      "DELETE /user/interaction-limits",
      {},
      { renamed: ["interactions", "removeRestrictionsForAuthenticatedUser"] }
    ],
    setRestrictionsForAuthenticatedUser: ["PUT /user/interaction-limits"],
    setRestrictionsForOrg: ["PUT /orgs/{org}/interaction-limits"],
    setRestrictionsForRepo: ["PUT /repos/{owner}/{repo}/interaction-limits"],
    setRestrictionsForYourPublicRepos: [
      "PUT /user/interaction-limits",
      {},
      { renamed: ["interactions", "setRestrictionsForAuthenticatedUser"] }
    ]
  },
  issues: {
    addAssignees: [
      "POST /repos/{owner}/{repo}/issues/{issue_number}/assignees"
    ],
    addBlockedByDependency: [
      "POST /repos/{owner}/{repo}/issues/{issue_number}/dependencies/blocked_by"
    ],
    addLabels: ["POST /repos/{owner}/{repo}/issues/{issue_number}/labels"],
    addSubIssue: [
      "POST /repos/{owner}/{repo}/issues/{issue_number}/sub_issues"
    ],
    checkUserCanBeAssigned: ["GET /repos/{owner}/{repo}/assignees/{assignee}"],
    checkUserCanBeAssignedToIssue: [
      "GET /repos/{owner}/{repo}/issues/{issue_number}/assignees/{assignee}"
    ],
    create: ["POST /repos/{owner}/{repo}/issues"],
    createComment: [
      "POST /repos/{owner}/{repo}/issues/{issue_number}/comments"
    ],
    createLabel: ["POST /repos/{owner}/{repo}/labels"],
    createMilestone: ["POST /repos/{owner}/{repo}/milestones"],
    deleteComment: [
      "DELETE /repos/{owner}/{repo}/issues/comments/{comment_id}"
    ],
    deleteLabel: ["DELETE /repos/{owner}/{repo}/labels/{name}"],
    deleteMilestone: [
      "DELETE /repos/{owner}/{repo}/milestones/{milestone_number}"
    ],
    get: ["GET /repos/{owner}/{repo}/issues/{issue_number}"],
    getComment: ["GET /repos/{owner}/{repo}/issues/comments/{comment_id}"],
    getEvent: ["GET /repos/{owner}/{repo}/issues/events/{event_id}"],
    getLabel: ["GET /repos/{owner}/{repo}/labels/{name}"],
    getMilestone: ["GET /repos/{owner}/{repo}/milestones/{milestone_number}"],
    getParent: ["GET /repos/{owner}/{repo}/issues/{issue_number}/parent"],
    list: ["GET /issues"],
    listAssignees: ["GET /repos/{owner}/{repo}/assignees"],
    listComments: ["GET /repos/{owner}/{repo}/issues/{issue_number}/comments"],
    listCommentsForRepo: ["GET /repos/{owner}/{repo}/issues/comments"],
    listDependenciesBlockedBy: [
      "GET /repos/{owner}/{repo}/issues/{issue_number}/dependencies/blocked_by"
    ],
    listDependenciesBlocking: [
      "GET /repos/{owner}/{repo}/issues/{issue_number}/dependencies/blocking"
    ],
    listEvents: ["GET /repos/{owner}/{repo}/issues/{issue_number}/events"],
    listEventsForRepo: ["GET /repos/{owner}/{repo}/issues/events"],
    listEventsForTimeline: [
      "GET /repos/{owner}/{repo}/issues/{issue_number}/timeline"
    ],
    listForAuthenticatedUser: ["GET /user/issues"],
    listForOrg: ["GET /orgs/{org}/issues"],
    listForRepo: ["GET /repos/{owner}/{repo}/issues"],
    listLabelsForMilestone: [
      "GET /repos/{owner}/{repo}/milestones/{milestone_number}/labels"
    ],
    listLabelsForRepo: ["GET /repos/{owner}/{repo}/labels"],
    listLabelsOnIssue: [
      "GET /repos/{owner}/{repo}/issues/{issue_number}/labels"
    ],
    listMilestones: ["GET /repos/{owner}/{repo}/milestones"],
    listSubIssues: [
      "GET /repos/{owner}/{repo}/issues/{issue_number}/sub_issues"
    ],
    lock: ["PUT /repos/{owner}/{repo}/issues/{issue_number}/lock"],
    removeAllLabels: [
      "DELETE /repos/{owner}/{repo}/issues/{issue_number}/labels"
    ],
    removeAssignees: [
      "DELETE /repos/{owner}/{repo}/issues/{issue_number}/assignees"
    ],
    removeDependencyBlockedBy: [
      "DELETE /repos/{owner}/{repo}/issues/{issue_number}/dependencies/blocked_by/{issue_id}"
    ],
    removeLabel: [
      "DELETE /repos/{owner}/{repo}/issues/{issue_number}/labels/{name}"
    ],
    removeSubIssue: [
      "DELETE /repos/{owner}/{repo}/issues/{issue_number}/sub_issue"
    ],
    reprioritizeSubIssue: [
      "PATCH /repos/{owner}/{repo}/issues/{issue_number}/sub_issues/priority"
    ],
    setLabels: ["PUT /repos/{owner}/{repo}/issues/{issue_number}/labels"],
    unlock: ["DELETE /repos/{owner}/{repo}/issues/{issue_number}/lock"],
    update: ["PATCH /repos/{owner}/{repo}/issues/{issue_number}"],
    updateComment: ["PATCH /repos/{owner}/{repo}/issues/comments/{comment_id}"],
    updateLabel: ["PATCH /repos/{owner}/{repo}/labels/{name}"],
    updateMilestone: [
      "PATCH /repos/{owner}/{repo}/milestones/{milestone_number}"
    ]
  },
  licenses: {
    get: ["GET /licenses/{license}"],
    getAllCommonlyUsed: ["GET /licenses"],
    getForRepo: ["GET /repos/{owner}/{repo}/license"]
  },
  markdown: {
    render: ["POST /markdown"],
    renderRaw: [
      "POST /markdown/raw",
      { headers: { "content-type": "text/plain; charset=utf-8" } }
    ]
  },
  meta: {
    get: ["GET /meta"],
    getAllVersions: ["GET /versions"],
    getOctocat: ["GET /octocat"],
    getZen: ["GET /zen"],
    root: ["GET /"]
  },
  migrations: {
    deleteArchiveForAuthenticatedUser: [
      "DELETE /user/migrations/{migration_id}/archive"
    ],
    deleteArchiveForOrg: [
      "DELETE /orgs/{org}/migrations/{migration_id}/archive"
    ],
    downloadArchiveForOrg: [
      "GET /orgs/{org}/migrations/{migration_id}/archive"
    ],
    getArchiveForAuthenticatedUser: [
      "GET /user/migrations/{migration_id}/archive"
    ],
    getStatusForAuthenticatedUser: ["GET /user/migrations/{migration_id}"],
    getStatusForOrg: ["GET /orgs/{org}/migrations/{migration_id}"],
    listForAuthenticatedUser: ["GET /user/migrations"],
    listForOrg: ["GET /orgs/{org}/migrations"],
    listReposForAuthenticatedUser: [
      "GET /user/migrations/{migration_id}/repositories"
    ],
    listReposForOrg: ["GET /orgs/{org}/migrations/{migration_id}/repositories"],
    listReposForUser: [
      "GET /user/migrations/{migration_id}/repositories",
      {},
      { renamed: ["migrations", "listReposForAuthenticatedUser"] }
    ],
    startForAuthenticatedUser: ["POST /user/migrations"],
    startForOrg: ["POST /orgs/{org}/migrations"],
    unlockRepoForAuthenticatedUser: [
      "DELETE /user/migrations/{migration_id}/repos/{repo_name}/lock"
    ],
    unlockRepoForOrg: [
      "DELETE /orgs/{org}/migrations/{migration_id}/repos/{repo_name}/lock"
    ]
  },
  oidc: {
    getOidcCustomSubTemplateForOrg: [
      "GET /orgs/{org}/actions/oidc/customization/sub"
    ],
    updateOidcCustomSubTemplateForOrg: [
      "PUT /orgs/{org}/actions/oidc/customization/sub"
    ]
  },
  orgs: {
    addSecurityManagerTeam: [
      "PUT /orgs/{org}/security-managers/teams/{team_slug}",
      {},
      {
        deprecated: "octokit.rest.orgs.addSecurityManagerTeam() is deprecated, see https://docs.github.com/rest/orgs/security-managers#add-a-security-manager-team"
      }
    ],
    assignTeamToOrgRole: [
      "PUT /orgs/{org}/organization-roles/teams/{team_slug}/{role_id}"
    ],
    assignUserToOrgRole: [
      "PUT /orgs/{org}/organization-roles/users/{username}/{role_id}"
    ],
    blockUser: ["PUT /orgs/{org}/blocks/{username}"],
    cancelInvitation: ["DELETE /orgs/{org}/invitations/{invitation_id}"],
    checkBlockedUser: ["GET /orgs/{org}/blocks/{username}"],
    checkMembershipForUser: ["GET /orgs/{org}/members/{username}"],
    checkPublicMembershipForUser: ["GET /orgs/{org}/public_members/{username}"],
    convertMemberToOutsideCollaborator: [
      "PUT /orgs/{org}/outside_collaborators/{username}"
    ],
    createArtifactStorageRecord: [
      "POST /orgs/{org}/artifacts/metadata/storage-record"
    ],
    createInvitation: ["POST /orgs/{org}/invitations"],
    createIssueType: ["POST /orgs/{org}/issue-types"],
    createWebhook: ["POST /orgs/{org}/hooks"],
    customPropertiesForOrgsCreateOrUpdateOrganizationValues: [
      "PATCH /organizations/{org}/org-properties/values"
    ],
    customPropertiesForOrgsGetOrganizationValues: [
      "GET /organizations/{org}/org-properties/values"
    ],
    customPropertiesForReposCreateOrUpdateOrganizationDefinition: [
      "PUT /orgs/{org}/properties/schema/{custom_property_name}"
    ],
    customPropertiesForReposCreateOrUpdateOrganizationDefinitions: [
      "PATCH /orgs/{org}/properties/schema"
    ],
    customPropertiesForReposCreateOrUpdateOrganizationValues: [
      "PATCH /orgs/{org}/properties/values"
    ],
    customPropertiesForReposDeleteOrganizationDefinition: [
      "DELETE /orgs/{org}/properties/schema/{custom_property_name}"
    ],
    customPropertiesForReposGetOrganizationDefinition: [
      "GET /orgs/{org}/properties/schema/{custom_property_name}"
    ],
    customPropertiesForReposGetOrganizationDefinitions: [
      "GET /orgs/{org}/properties/schema"
    ],
    customPropertiesForReposGetOrganizationValues: [
      "GET /orgs/{org}/properties/values"
    ],
    delete: ["DELETE /orgs/{org}"],
    deleteAttestationsBulk: ["POST /orgs/{org}/attestations/delete-request"],
    deleteAttestationsById: [
      "DELETE /orgs/{org}/attestations/{attestation_id}"
    ],
    deleteAttestationsBySubjectDigest: [
      "DELETE /orgs/{org}/attestations/digest/{subject_digest}"
    ],
    deleteIssueType: ["DELETE /orgs/{org}/issue-types/{issue_type_id}"],
    deleteWebhook: ["DELETE /orgs/{org}/hooks/{hook_id}"],
    disableSelectedRepositoryImmutableReleasesOrganization: [
      "DELETE /orgs/{org}/settings/immutable-releases/repositories/{repository_id}"
    ],
    enableSelectedRepositoryImmutableReleasesOrganization: [
      "PUT /orgs/{org}/settings/immutable-releases/repositories/{repository_id}"
    ],
    get: ["GET /orgs/{org}"],
    getImmutableReleasesSettings: [
      "GET /orgs/{org}/settings/immutable-releases"
    ],
    getImmutableReleasesSettingsRepositories: [
      "GET /orgs/{org}/settings/immutable-releases/repositories"
    ],
    getMembershipForAuthenticatedUser: ["GET /user/memberships/orgs/{org}"],
    getMembershipForUser: ["GET /orgs/{org}/memberships/{username}"],
    getOrgRole: ["GET /orgs/{org}/organization-roles/{role_id}"],
    getOrgRulesetHistory: ["GET /orgs/{org}/rulesets/{ruleset_id}/history"],
    getOrgRulesetVersion: [
      "GET /orgs/{org}/rulesets/{ruleset_id}/history/{version_id}"
    ],
    getWebhook: ["GET /orgs/{org}/hooks/{hook_id}"],
    getWebhookConfigForOrg: ["GET /orgs/{org}/hooks/{hook_id}/config"],
    getWebhookDelivery: [
      "GET /orgs/{org}/hooks/{hook_id}/deliveries/{delivery_id}"
    ],
    list: ["GET /organizations"],
    listAppInstallations: ["GET /orgs/{org}/installations"],
    listArtifactStorageRecords: [
      "GET /orgs/{org}/artifacts/{subject_digest}/metadata/storage-records"
    ],
    listAttestationRepositories: ["GET /orgs/{org}/attestations/repositories"],
    listAttestations: ["GET /orgs/{org}/attestations/{subject_digest}"],
    listAttestationsBulk: [
      "POST /orgs/{org}/attestations/bulk-list{?per_page,before,after}"
    ],
    listBlockedUsers: ["GET /orgs/{org}/blocks"],
    listFailedInvitations: ["GET /orgs/{org}/failed_invitations"],
    listForAuthenticatedUser: ["GET /user/orgs"],
    listForUser: ["GET /users/{username}/orgs"],
    listInvitationTeams: ["GET /orgs/{org}/invitations/{invitation_id}/teams"],
    listIssueTypes: ["GET /orgs/{org}/issue-types"],
    listMembers: ["GET /orgs/{org}/members"],
    listMembershipsForAuthenticatedUser: ["GET /user/memberships/orgs"],
    listOrgRoleTeams: ["GET /orgs/{org}/organization-roles/{role_id}/teams"],
    listOrgRoleUsers: ["GET /orgs/{org}/organization-roles/{role_id}/users"],
    listOrgRoles: ["GET /orgs/{org}/organization-roles"],
    listOrganizationFineGrainedPermissions: [
      "GET /orgs/{org}/organization-fine-grained-permissions"
    ],
    listOutsideCollaborators: ["GET /orgs/{org}/outside_collaborators"],
    listPatGrantRepositories: [
      "GET /orgs/{org}/personal-access-tokens/{pat_id}/repositories"
    ],
    listPatGrantRequestRepositories: [
      "GET /orgs/{org}/personal-access-token-requests/{pat_request_id}/repositories"
    ],
    listPatGrantRequests: ["GET /orgs/{org}/personal-access-token-requests"],
    listPatGrants: ["GET /orgs/{org}/personal-access-tokens"],
    listPendingInvitations: ["GET /orgs/{org}/invitations"],
    listPublicMembers: ["GET /orgs/{org}/public_members"],
    listSecurityManagerTeams: [
      "GET /orgs/{org}/security-managers",
      {},
      {
        deprecated: "octokit.rest.orgs.listSecurityManagerTeams() is deprecated, see https://docs.github.com/rest/orgs/security-managers#list-security-manager-teams"
      }
    ],
    listWebhookDeliveries: ["GET /orgs/{org}/hooks/{hook_id}/deliveries"],
    listWebhooks: ["GET /orgs/{org}/hooks"],
    pingWebhook: ["POST /orgs/{org}/hooks/{hook_id}/pings"],
    redeliverWebhookDelivery: [
      "POST /orgs/{org}/hooks/{hook_id}/deliveries/{delivery_id}/attempts"
    ],
    removeMember: ["DELETE /orgs/{org}/members/{username}"],
    removeMembershipForUser: ["DELETE /orgs/{org}/memberships/{username}"],
    removeOutsideCollaborator: [
      "DELETE /orgs/{org}/outside_collaborators/{username}"
    ],
    removePublicMembershipForAuthenticatedUser: [
      "DELETE /orgs/{org}/public_members/{username}"
    ],
    removeSecurityManagerTeam: [
      "DELETE /orgs/{org}/security-managers/teams/{team_slug}",
      {},
      {
        deprecated: "octokit.rest.orgs.removeSecurityManagerTeam() is deprecated, see https://docs.github.com/rest/orgs/security-managers#remove-a-security-manager-team"
      }
    ],
    reviewPatGrantRequest: [
      "POST /orgs/{org}/personal-access-token-requests/{pat_request_id}"
    ],
    reviewPatGrantRequestsInBulk: [
      "POST /orgs/{org}/personal-access-token-requests"
    ],
    revokeAllOrgRolesTeam: [
      "DELETE /orgs/{org}/organization-roles/teams/{team_slug}"
    ],
    revokeAllOrgRolesUser: [
      "DELETE /orgs/{org}/organization-roles/users/{username}"
    ],
    revokeOrgRoleTeam: [
      "DELETE /orgs/{org}/organization-roles/teams/{team_slug}/{role_id}"
    ],
    revokeOrgRoleUser: [
      "DELETE /orgs/{org}/organization-roles/users/{username}/{role_id}"
    ],
    setImmutableReleasesSettings: [
      "PUT /orgs/{org}/settings/immutable-releases"
    ],
    setImmutableReleasesSettingsRepositories: [
      "PUT /orgs/{org}/settings/immutable-releases/repositories"
    ],
    setMembershipForUser: ["PUT /orgs/{org}/memberships/{username}"],
    setPublicMembershipForAuthenticatedUser: [
      "PUT /orgs/{org}/public_members/{username}"
    ],
    unblockUser: ["DELETE /orgs/{org}/blocks/{username}"],
    update: ["PATCH /orgs/{org}"],
    updateIssueType: ["PUT /orgs/{org}/issue-types/{issue_type_id}"],
    updateMembershipForAuthenticatedUser: [
      "PATCH /user/memberships/orgs/{org}"
    ],
    updatePatAccess: ["POST /orgs/{org}/personal-access-tokens/{pat_id}"],
    updatePatAccesses: ["POST /orgs/{org}/personal-access-tokens"],
    updateWebhook: ["PATCH /orgs/{org}/hooks/{hook_id}"],
    updateWebhookConfigForOrg: ["PATCH /orgs/{org}/hooks/{hook_id}/config"]
  },
  packages: {
    deletePackageForAuthenticatedUser: [
      "DELETE /user/packages/{package_type}/{package_name}"
    ],
    deletePackageForOrg: [
      "DELETE /orgs/{org}/packages/{package_type}/{package_name}"
    ],
    deletePackageForUser: [
      "DELETE /users/{username}/packages/{package_type}/{package_name}"
    ],
    deletePackageVersionForAuthenticatedUser: [
      "DELETE /user/packages/{package_type}/{package_name}/versions/{package_version_id}"
    ],
    deletePackageVersionForOrg: [
      "DELETE /orgs/{org}/packages/{package_type}/{package_name}/versions/{package_version_id}"
    ],
    deletePackageVersionForUser: [
      "DELETE /users/{username}/packages/{package_type}/{package_name}/versions/{package_version_id}"
    ],
    getAllPackageVersionsForAPackageOwnedByAnOrg: [
      "GET /orgs/{org}/packages/{package_type}/{package_name}/versions",
      {},
      { renamed: ["packages", "getAllPackageVersionsForPackageOwnedByOrg"] }
    ],
    getAllPackageVersionsForAPackageOwnedByTheAuthenticatedUser: [
      "GET /user/packages/{package_type}/{package_name}/versions",
      {},
      {
        renamed: [
          "packages",
          "getAllPackageVersionsForPackageOwnedByAuthenticatedUser"
        ]
      }
    ],
    getAllPackageVersionsForPackageOwnedByAuthenticatedUser: [
      "GET /user/packages/{package_type}/{package_name}/versions"
    ],
    getAllPackageVersionsForPackageOwnedByOrg: [
      "GET /orgs/{org}/packages/{package_type}/{package_name}/versions"
    ],
    getAllPackageVersionsForPackageOwnedByUser: [
      "GET /users/{username}/packages/{package_type}/{package_name}/versions"
    ],
    getPackageForAuthenticatedUser: [
      "GET /user/packages/{package_type}/{package_name}"
    ],
    getPackageForOrganization: [
      "GET /orgs/{org}/packages/{package_type}/{package_name}"
    ],
    getPackageForUser: [
      "GET /users/{username}/packages/{package_type}/{package_name}"
    ],
    getPackageVersionForAuthenticatedUser: [
      "GET /user/packages/{package_type}/{package_name}/versions/{package_version_id}"
    ],
    getPackageVersionForOrganization: [
      "GET /orgs/{org}/packages/{package_type}/{package_name}/versions/{package_version_id}"
    ],
    getPackageVersionForUser: [
      "GET /users/{username}/packages/{package_type}/{package_name}/versions/{package_version_id}"
    ],
    listDockerMigrationConflictingPackagesForAuthenticatedUser: [
      "GET /user/docker/conflicts"
    ],
    listDockerMigrationConflictingPackagesForOrganization: [
      "GET /orgs/{org}/docker/conflicts"
    ],
    listDockerMigrationConflictingPackagesForUser: [
      "GET /users/{username}/docker/conflicts"
    ],
    listPackagesForAuthenticatedUser: ["GET /user/packages"],
    listPackagesForOrganization: ["GET /orgs/{org}/packages"],
    listPackagesForUser: ["GET /users/{username}/packages"],
    restorePackageForAuthenticatedUser: [
      "POST /user/packages/{package_type}/{package_name}/restore{?token}"
    ],
    restorePackageForOrg: [
      "POST /orgs/{org}/packages/{package_type}/{package_name}/restore{?token}"
    ],
    restorePackageForUser: [
      "POST /users/{username}/packages/{package_type}/{package_name}/restore{?token}"
    ],
    restorePackageVersionForAuthenticatedUser: [
      "POST /user/packages/{package_type}/{package_name}/versions/{package_version_id}/restore"
    ],
    restorePackageVersionForOrg: [
      "POST /orgs/{org}/packages/{package_type}/{package_name}/versions/{package_version_id}/restore"
    ],
    restorePackageVersionForUser: [
      "POST /users/{username}/packages/{package_type}/{package_name}/versions/{package_version_id}/restore"
    ]
  },
  privateRegistries: {
    createOrgPrivateRegistry: ["POST /orgs/{org}/private-registries"],
    deleteOrgPrivateRegistry: [
      "DELETE /orgs/{org}/private-registries/{secret_name}"
    ],
    getOrgPrivateRegistry: ["GET /orgs/{org}/private-registries/{secret_name}"],
    getOrgPublicKey: ["GET /orgs/{org}/private-registries/public-key"],
    listOrgPrivateRegistries: ["GET /orgs/{org}/private-registries"],
    updateOrgPrivateRegistry: [
      "PATCH /orgs/{org}/private-registries/{secret_name}"
    ]
  },
  projects: {
    addItemForOrg: ["POST /orgs/{org}/projectsV2/{project_number}/items"],
    addItemForUser: [
      "POST /users/{username}/projectsV2/{project_number}/items"
    ],
    deleteItemForOrg: [
      "DELETE /orgs/{org}/projectsV2/{project_number}/items/{item_id}"
    ],
    deleteItemForUser: [
      "DELETE /users/{username}/projectsV2/{project_number}/items/{item_id}"
    ],
    getFieldForOrg: [
      "GET /orgs/{org}/projectsV2/{project_number}/fields/{field_id}"
    ],
    getFieldForUser: [
      "GET /users/{username}/projectsV2/{project_number}/fields/{field_id}"
    ],
    getForOrg: ["GET /orgs/{org}/projectsV2/{project_number}"],
    getForUser: ["GET /users/{username}/projectsV2/{project_number}"],
    getOrgItem: ["GET /orgs/{org}/projectsV2/{project_number}/items/{item_id}"],
    getUserItem: [
      "GET /users/{username}/projectsV2/{project_number}/items/{item_id}"
    ],
    listFieldsForOrg: ["GET /orgs/{org}/projectsV2/{project_number}/fields"],
    listFieldsForUser: [
      "GET /users/{username}/projectsV2/{project_number}/fields"
    ],
    listForOrg: ["GET /orgs/{org}/projectsV2"],
    listForUser: ["GET /users/{username}/projectsV2"],
    listItemsForOrg: ["GET /orgs/{org}/projectsV2/{project_number}/items"],
    listItemsForUser: [
      "GET /users/{username}/projectsV2/{project_number}/items"
    ],
    updateItemForOrg: [
      "PATCH /orgs/{org}/projectsV2/{project_number}/items/{item_id}"
    ],
    updateItemForUser: [
      "PATCH /users/{username}/projectsV2/{project_number}/items/{item_id}"
    ]
  },
  pulls: {
    checkIfMerged: ["GET /repos/{owner}/{repo}/pulls/{pull_number}/merge"],
    create: ["POST /repos/{owner}/{repo}/pulls"],
    createReplyForReviewComment: [
      "POST /repos/{owner}/{repo}/pulls/{pull_number}/comments/{comment_id}/replies"
    ],
    createReview: ["POST /repos/{owner}/{repo}/pulls/{pull_number}/reviews"],
    createReviewComment: [
      "POST /repos/{owner}/{repo}/pulls/{pull_number}/comments"
    ],
    deletePendingReview: [
      "DELETE /repos/{owner}/{repo}/pulls/{pull_number}/reviews/{review_id}"
    ],
    deleteReviewComment: [
      "DELETE /repos/{owner}/{repo}/pulls/comments/{comment_id}"
    ],
    dismissReview: [
      "PUT /repos/{owner}/{repo}/pulls/{pull_number}/reviews/{review_id}/dismissals"
    ],
    get: ["GET /repos/{owner}/{repo}/pulls/{pull_number}"],
    getReview: [
      "GET /repos/{owner}/{repo}/pulls/{pull_number}/reviews/{review_id}"
    ],
    getReviewComment: ["GET /repos/{owner}/{repo}/pulls/comments/{comment_id}"],
    list: ["GET /repos/{owner}/{repo}/pulls"],
    listCommentsForReview: [
      "GET /repos/{owner}/{repo}/pulls/{pull_number}/reviews/{review_id}/comments"
    ],
    listCommits: ["GET /repos/{owner}/{repo}/pulls/{pull_number}/commits"],
    listFiles: ["GET /repos/{owner}/{repo}/pulls/{pull_number}/files"],
    listRequestedReviewers: [
      "GET /repos/{owner}/{repo}/pulls/{pull_number}/requested_reviewers"
    ],
    listReviewComments: [
      "GET /repos/{owner}/{repo}/pulls/{pull_number}/comments"
    ],
    listReviewCommentsForRepo: ["GET /repos/{owner}/{repo}/pulls/comments"],
    listReviews: ["GET /repos/{owner}/{repo}/pulls/{pull_number}/reviews"],
    merge: ["PUT /repos/{owner}/{repo}/pulls/{pull_number}/merge"],
    removeRequestedReviewers: [
      "DELETE /repos/{owner}/{repo}/pulls/{pull_number}/requested_reviewers"
    ],
    requestReviewers: [
      "POST /repos/{owner}/{repo}/pulls/{pull_number}/requested_reviewers"
    ],
    submitReview: [
      "POST /repos/{owner}/{repo}/pulls/{pull_number}/reviews/{review_id}/events"
    ],
    update: ["PATCH /repos/{owner}/{repo}/pulls/{pull_number}"],
    updateBranch: [
      "PUT /repos/{owner}/{repo}/pulls/{pull_number}/update-branch"
    ],
    updateReview: [
      "PUT /repos/{owner}/{repo}/pulls/{pull_number}/reviews/{review_id}"
    ],
    updateReviewComment: [
      "PATCH /repos/{owner}/{repo}/pulls/comments/{comment_id}"
    ]
  },
  rateLimit: { get: ["GET /rate_limit"] },
  reactions: {
    createForCommitComment: [
      "POST /repos/{owner}/{repo}/comments/{comment_id}/reactions"
    ],
    createForIssue: [
      "POST /repos/{owner}/{repo}/issues/{issue_number}/reactions"
    ],
    createForIssueComment: [
      "POST /repos/{owner}/{repo}/issues/comments/{comment_id}/reactions"
    ],
    createForPullRequestReviewComment: [
      "POST /repos/{owner}/{repo}/pulls/comments/{comment_id}/reactions"
    ],
    createForRelease: [
      "POST /repos/{owner}/{repo}/releases/{release_id}/reactions"
    ],
    createForTeamDiscussionCommentInOrg: [
      "POST /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/comments/{comment_number}/reactions"
    ],
    createForTeamDiscussionInOrg: [
      "POST /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/reactions"
    ],
    deleteForCommitComment: [
      "DELETE /repos/{owner}/{repo}/comments/{comment_id}/reactions/{reaction_id}"
    ],
    deleteForIssue: [
      "DELETE /repos/{owner}/{repo}/issues/{issue_number}/reactions/{reaction_id}"
    ],
    deleteForIssueComment: [
      "DELETE /repos/{owner}/{repo}/issues/comments/{comment_id}/reactions/{reaction_id}"
    ],
    deleteForPullRequestComment: [
      "DELETE /repos/{owner}/{repo}/pulls/comments/{comment_id}/reactions/{reaction_id}"
    ],
    deleteForRelease: [
      "DELETE /repos/{owner}/{repo}/releases/{release_id}/reactions/{reaction_id}"
    ],
    deleteForTeamDiscussion: [
      "DELETE /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/reactions/{reaction_id}"
    ],
    deleteForTeamDiscussionComment: [
      "DELETE /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/comments/{comment_number}/reactions/{reaction_id}"
    ],
    listForCommitComment: [
      "GET /repos/{owner}/{repo}/comments/{comment_id}/reactions"
    ],
    listForIssue: ["GET /repos/{owner}/{repo}/issues/{issue_number}/reactions"],
    listForIssueComment: [
      "GET /repos/{owner}/{repo}/issues/comments/{comment_id}/reactions"
    ],
    listForPullRequestReviewComment: [
      "GET /repos/{owner}/{repo}/pulls/comments/{comment_id}/reactions"
    ],
    listForRelease: [
      "GET /repos/{owner}/{repo}/releases/{release_id}/reactions"
    ],
    listForTeamDiscussionCommentInOrg: [
      "GET /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/comments/{comment_number}/reactions"
    ],
    listForTeamDiscussionInOrg: [
      "GET /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/reactions"
    ]
  },
  repos: {
    acceptInvitation: [
      "PATCH /user/repository_invitations/{invitation_id}",
      {},
      { renamed: ["repos", "acceptInvitationForAuthenticatedUser"] }
    ],
    acceptInvitationForAuthenticatedUser: [
      "PATCH /user/repository_invitations/{invitation_id}"
    ],
    addAppAccessRestrictions: [
      "POST /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/apps",
      {},
      { mapToData: "apps" }
    ],
    addCollaborator: ["PUT /repos/{owner}/{repo}/collaborators/{username}"],
    addStatusCheckContexts: [
      "POST /repos/{owner}/{repo}/branches/{branch}/protection/required_status_checks/contexts",
      {},
      { mapToData: "contexts" }
    ],
    addTeamAccessRestrictions: [
      "POST /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/teams",
      {},
      { mapToData: "teams" }
    ],
    addUserAccessRestrictions: [
      "POST /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/users",
      {},
      { mapToData: "users" }
    ],
    cancelPagesDeployment: [
      "POST /repos/{owner}/{repo}/pages/deployments/{pages_deployment_id}/cancel"
    ],
    checkAutomatedSecurityFixes: [
      "GET /repos/{owner}/{repo}/automated-security-fixes"
    ],
    checkCollaborator: ["GET /repos/{owner}/{repo}/collaborators/{username}"],
    checkImmutableReleases: ["GET /repos/{owner}/{repo}/immutable-releases"],
    checkPrivateVulnerabilityReporting: [
      "GET /repos/{owner}/{repo}/private-vulnerability-reporting"
    ],
    checkVulnerabilityAlerts: [
      "GET /repos/{owner}/{repo}/vulnerability-alerts"
    ],
    codeownersErrors: ["GET /repos/{owner}/{repo}/codeowners/errors"],
    compareCommits: ["GET /repos/{owner}/{repo}/compare/{base}...{head}"],
    compareCommitsWithBasehead: [
      "GET /repos/{owner}/{repo}/compare/{basehead}"
    ],
    createAttestation: ["POST /repos/{owner}/{repo}/attestations"],
    createAutolink: ["POST /repos/{owner}/{repo}/autolinks"],
    createCommitComment: [
      "POST /repos/{owner}/{repo}/commits/{commit_sha}/comments"
    ],
    createCommitSignatureProtection: [
      "POST /repos/{owner}/{repo}/branches/{branch}/protection/required_signatures"
    ],
    createCommitStatus: ["POST /repos/{owner}/{repo}/statuses/{sha}"],
    createDeployKey: ["POST /repos/{owner}/{repo}/keys"],
    createDeployment: ["POST /repos/{owner}/{repo}/deployments"],
    createDeploymentBranchPolicy: [
      "POST /repos/{owner}/{repo}/environments/{environment_name}/deployment-branch-policies"
    ],
    createDeploymentProtectionRule: [
      "POST /repos/{owner}/{repo}/environments/{environment_name}/deployment_protection_rules"
    ],
    createDeploymentStatus: [
      "POST /repos/{owner}/{repo}/deployments/{deployment_id}/statuses"
    ],
    createDispatchEvent: ["POST /repos/{owner}/{repo}/dispatches"],
    createForAuthenticatedUser: ["POST /user/repos"],
    createFork: ["POST /repos/{owner}/{repo}/forks"],
    createInOrg: ["POST /orgs/{org}/repos"],
    createOrUpdateEnvironment: [
      "PUT /repos/{owner}/{repo}/environments/{environment_name}"
    ],
    createOrUpdateFileContents: ["PUT /repos/{owner}/{repo}/contents/{path}"],
    createOrgRuleset: ["POST /orgs/{org}/rulesets"],
    createPagesDeployment: ["POST /repos/{owner}/{repo}/pages/deployments"],
    createPagesSite: ["POST /repos/{owner}/{repo}/pages"],
    createRelease: ["POST /repos/{owner}/{repo}/releases"],
    createRepoRuleset: ["POST /repos/{owner}/{repo}/rulesets"],
    createUsingTemplate: [
      "POST /repos/{template_owner}/{template_repo}/generate"
    ],
    createWebhook: ["POST /repos/{owner}/{repo}/hooks"],
    customPropertiesForReposCreateOrUpdateRepositoryValues: [
      "PATCH /repos/{owner}/{repo}/properties/values"
    ],
    customPropertiesForReposGetRepositoryValues: [
      "GET /repos/{owner}/{repo}/properties/values"
    ],
    declineInvitation: [
      "DELETE /user/repository_invitations/{invitation_id}",
      {},
      { renamed: ["repos", "declineInvitationForAuthenticatedUser"] }
    ],
    declineInvitationForAuthenticatedUser: [
      "DELETE /user/repository_invitations/{invitation_id}"
    ],
    delete: ["DELETE /repos/{owner}/{repo}"],
    deleteAccessRestrictions: [
      "DELETE /repos/{owner}/{repo}/branches/{branch}/protection/restrictions"
    ],
    deleteAdminBranchProtection: [
      "DELETE /repos/{owner}/{repo}/branches/{branch}/protection/enforce_admins"
    ],
    deleteAnEnvironment: [
      "DELETE /repos/{owner}/{repo}/environments/{environment_name}"
    ],
    deleteAutolink: ["DELETE /repos/{owner}/{repo}/autolinks/{autolink_id}"],
    deleteBranchProtection: [
      "DELETE /repos/{owner}/{repo}/branches/{branch}/protection"
    ],
    deleteCommitComment: ["DELETE /repos/{owner}/{repo}/comments/{comment_id}"],
    deleteCommitSignatureProtection: [
      "DELETE /repos/{owner}/{repo}/branches/{branch}/protection/required_signatures"
    ],
    deleteDeployKey: ["DELETE /repos/{owner}/{repo}/keys/{key_id}"],
    deleteDeployment: [
      "DELETE /repos/{owner}/{repo}/deployments/{deployment_id}"
    ],
    deleteDeploymentBranchPolicy: [
      "DELETE /repos/{owner}/{repo}/environments/{environment_name}/deployment-branch-policies/{branch_policy_id}"
    ],
    deleteFile: ["DELETE /repos/{owner}/{repo}/contents/{path}"],
    deleteInvitation: [
      "DELETE /repos/{owner}/{repo}/invitations/{invitation_id}"
    ],
    deleteOrgRuleset: ["DELETE /orgs/{org}/rulesets/{ruleset_id}"],
    deletePagesSite: ["DELETE /repos/{owner}/{repo}/pages"],
    deletePullRequestReviewProtection: [
      "DELETE /repos/{owner}/{repo}/branches/{branch}/protection/required_pull_request_reviews"
    ],
    deleteRelease: ["DELETE /repos/{owner}/{repo}/releases/{release_id}"],
    deleteReleaseAsset: [
      "DELETE /repos/{owner}/{repo}/releases/assets/{asset_id}"
    ],
    deleteRepoRuleset: ["DELETE /repos/{owner}/{repo}/rulesets/{ruleset_id}"],
    deleteWebhook: ["DELETE /repos/{owner}/{repo}/hooks/{hook_id}"],
    disableAutomatedSecurityFixes: [
      "DELETE /repos/{owner}/{repo}/automated-security-fixes"
    ],
    disableDeploymentProtectionRule: [
      "DELETE /repos/{owner}/{repo}/environments/{environment_name}/deployment_protection_rules/{protection_rule_id}"
    ],
    disableImmutableReleases: [
      "DELETE /repos/{owner}/{repo}/immutable-releases"
    ],
    disablePrivateVulnerabilityReporting: [
      "DELETE /repos/{owner}/{repo}/private-vulnerability-reporting"
    ],
    disableVulnerabilityAlerts: [
      "DELETE /repos/{owner}/{repo}/vulnerability-alerts"
    ],
    downloadArchive: [
      "GET /repos/{owner}/{repo}/zipball/{ref}",
      {},
      { renamed: ["repos", "downloadZipballArchive"] }
    ],
    downloadTarballArchive: ["GET /repos/{owner}/{repo}/tarball/{ref}"],
    downloadZipballArchive: ["GET /repos/{owner}/{repo}/zipball/{ref}"],
    enableAutomatedSecurityFixes: [
      "PUT /repos/{owner}/{repo}/automated-security-fixes"
    ],
    enableImmutableReleases: ["PUT /repos/{owner}/{repo}/immutable-releases"],
    enablePrivateVulnerabilityReporting: [
      "PUT /repos/{owner}/{repo}/private-vulnerability-reporting"
    ],
    enableVulnerabilityAlerts: [
      "PUT /repos/{owner}/{repo}/vulnerability-alerts"
    ],
    generateReleaseNotes: [
      "POST /repos/{owner}/{repo}/releases/generate-notes"
    ],
    get: ["GET /repos/{owner}/{repo}"],
    getAccessRestrictions: [
      "GET /repos/{owner}/{repo}/branches/{branch}/protection/restrictions"
    ],
    getAdminBranchProtection: [
      "GET /repos/{owner}/{repo}/branches/{branch}/protection/enforce_admins"
    ],
    getAllDeploymentProtectionRules: [
      "GET /repos/{owner}/{repo}/environments/{environment_name}/deployment_protection_rules"
    ],
    getAllEnvironments: ["GET /repos/{owner}/{repo}/environments"],
    getAllStatusCheckContexts: [
      "GET /repos/{owner}/{repo}/branches/{branch}/protection/required_status_checks/contexts"
    ],
    getAllTopics: ["GET /repos/{owner}/{repo}/topics"],
    getAppsWithAccessToProtectedBranch: [
      "GET /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/apps"
    ],
    getAutolink: ["GET /repos/{owner}/{repo}/autolinks/{autolink_id}"],
    getBranch: ["GET /repos/{owner}/{repo}/branches/{branch}"],
    getBranchProtection: [
      "GET /repos/{owner}/{repo}/branches/{branch}/protection"
    ],
    getBranchRules: ["GET /repos/{owner}/{repo}/rules/branches/{branch}"],
    getClones: ["GET /repos/{owner}/{repo}/traffic/clones"],
    getCodeFrequencyStats: ["GET /repos/{owner}/{repo}/stats/code_frequency"],
    getCollaboratorPermissionLevel: [
      "GET /repos/{owner}/{repo}/collaborators/{username}/permission"
    ],
    getCombinedStatusForRef: ["GET /repos/{owner}/{repo}/commits/{ref}/status"],
    getCommit: ["GET /repos/{owner}/{repo}/commits/{ref}"],
    getCommitActivityStats: ["GET /repos/{owner}/{repo}/stats/commit_activity"],
    getCommitComment: ["GET /repos/{owner}/{repo}/comments/{comment_id}"],
    getCommitSignatureProtection: [
      "GET /repos/{owner}/{repo}/branches/{branch}/protection/required_signatures"
    ],
    getCommunityProfileMetrics: ["GET /repos/{owner}/{repo}/community/profile"],
    getContent: ["GET /repos/{owner}/{repo}/contents/{path}"],
    getContributorsStats: ["GET /repos/{owner}/{repo}/stats/contributors"],
    getCustomDeploymentProtectionRule: [
      "GET /repos/{owner}/{repo}/environments/{environment_name}/deployment_protection_rules/{protection_rule_id}"
    ],
    getDeployKey: ["GET /repos/{owner}/{repo}/keys/{key_id}"],
    getDeployment: ["GET /repos/{owner}/{repo}/deployments/{deployment_id}"],
    getDeploymentBranchPolicy: [
      "GET /repos/{owner}/{repo}/environments/{environment_name}/deployment-branch-policies/{branch_policy_id}"
    ],
    getDeploymentStatus: [
      "GET /repos/{owner}/{repo}/deployments/{deployment_id}/statuses/{status_id}"
    ],
    getEnvironment: [
      "GET /repos/{owner}/{repo}/environments/{environment_name}"
    ],
    getLatestPagesBuild: ["GET /repos/{owner}/{repo}/pages/builds/latest"],
    getLatestRelease: ["GET /repos/{owner}/{repo}/releases/latest"],
    getOrgRuleSuite: ["GET /orgs/{org}/rulesets/rule-suites/{rule_suite_id}"],
    getOrgRuleSuites: ["GET /orgs/{org}/rulesets/rule-suites"],
    getOrgRuleset: ["GET /orgs/{org}/rulesets/{ruleset_id}"],
    getOrgRulesets: ["GET /orgs/{org}/rulesets"],
    getPages: ["GET /repos/{owner}/{repo}/pages"],
    getPagesBuild: ["GET /repos/{owner}/{repo}/pages/builds/{build_id}"],
    getPagesDeployment: [
      "GET /repos/{owner}/{repo}/pages/deployments/{pages_deployment_id}"
    ],
    getPagesHealthCheck: ["GET /repos/{owner}/{repo}/pages/health"],
    getParticipationStats: ["GET /repos/{owner}/{repo}/stats/participation"],
    getPullRequestReviewProtection: [
      "GET /repos/{owner}/{repo}/branches/{branch}/protection/required_pull_request_reviews"
    ],
    getPunchCardStats: ["GET /repos/{owner}/{repo}/stats/punch_card"],
    getReadme: ["GET /repos/{owner}/{repo}/readme"],
    getReadmeInDirectory: ["GET /repos/{owner}/{repo}/readme/{dir}"],
    getRelease: ["GET /repos/{owner}/{repo}/releases/{release_id}"],
    getReleaseAsset: ["GET /repos/{owner}/{repo}/releases/assets/{asset_id}"],
    getReleaseByTag: ["GET /repos/{owner}/{repo}/releases/tags/{tag}"],
    getRepoRuleSuite: [
      "GET /repos/{owner}/{repo}/rulesets/rule-suites/{rule_suite_id}"
    ],
    getRepoRuleSuites: ["GET /repos/{owner}/{repo}/rulesets/rule-suites"],
    getRepoRuleset: ["GET /repos/{owner}/{repo}/rulesets/{ruleset_id}"],
    getRepoRulesetHistory: [
      "GET /repos/{owner}/{repo}/rulesets/{ruleset_id}/history"
    ],
    getRepoRulesetVersion: [
      "GET /repos/{owner}/{repo}/rulesets/{ruleset_id}/history/{version_id}"
    ],
    getRepoRulesets: ["GET /repos/{owner}/{repo}/rulesets"],
    getStatusChecksProtection: [
      "GET /repos/{owner}/{repo}/branches/{branch}/protection/required_status_checks"
    ],
    getTeamsWithAccessToProtectedBranch: [
      "GET /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/teams"
    ],
    getTopPaths: ["GET /repos/{owner}/{repo}/traffic/popular/paths"],
    getTopReferrers: ["GET /repos/{owner}/{repo}/traffic/popular/referrers"],
    getUsersWithAccessToProtectedBranch: [
      "GET /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/users"
    ],
    getViews: ["GET /repos/{owner}/{repo}/traffic/views"],
    getWebhook: ["GET /repos/{owner}/{repo}/hooks/{hook_id}"],
    getWebhookConfigForRepo: [
      "GET /repos/{owner}/{repo}/hooks/{hook_id}/config"
    ],
    getWebhookDelivery: [
      "GET /repos/{owner}/{repo}/hooks/{hook_id}/deliveries/{delivery_id}"
    ],
    listActivities: ["GET /repos/{owner}/{repo}/activity"],
    listAttestations: [
      "GET /repos/{owner}/{repo}/attestations/{subject_digest}"
    ],
    listAutolinks: ["GET /repos/{owner}/{repo}/autolinks"],
    listBranches: ["GET /repos/{owner}/{repo}/branches"],
    listBranchesForHeadCommit: [
      "GET /repos/{owner}/{repo}/commits/{commit_sha}/branches-where-head"
    ],
    listCollaborators: ["GET /repos/{owner}/{repo}/collaborators"],
    listCommentsForCommit: [
      "GET /repos/{owner}/{repo}/commits/{commit_sha}/comments"
    ],
    listCommitCommentsForRepo: ["GET /repos/{owner}/{repo}/comments"],
    listCommitStatusesForRef: [
      "GET /repos/{owner}/{repo}/commits/{ref}/statuses"
    ],
    listCommits: ["GET /repos/{owner}/{repo}/commits"],
    listContributors: ["GET /repos/{owner}/{repo}/contributors"],
    listCustomDeploymentRuleIntegrations: [
      "GET /repos/{owner}/{repo}/environments/{environment_name}/deployment_protection_rules/apps"
    ],
    listDeployKeys: ["GET /repos/{owner}/{repo}/keys"],
    listDeploymentBranchPolicies: [
      "GET /repos/{owner}/{repo}/environments/{environment_name}/deployment-branch-policies"
    ],
    listDeploymentStatuses: [
      "GET /repos/{owner}/{repo}/deployments/{deployment_id}/statuses"
    ],
    listDeployments: ["GET /repos/{owner}/{repo}/deployments"],
    listForAuthenticatedUser: ["GET /user/repos"],
    listForOrg: ["GET /orgs/{org}/repos"],
    listForUser: ["GET /users/{username}/repos"],
    listForks: ["GET /repos/{owner}/{repo}/forks"],
    listInvitations: ["GET /repos/{owner}/{repo}/invitations"],
    listInvitationsForAuthenticatedUser: ["GET /user/repository_invitations"],
    listLanguages: ["GET /repos/{owner}/{repo}/languages"],
    listPagesBuilds: ["GET /repos/{owner}/{repo}/pages/builds"],
    listPublic: ["GET /repositories"],
    listPullRequestsAssociatedWithCommit: [
      "GET /repos/{owner}/{repo}/commits/{commit_sha}/pulls"
    ],
    listReleaseAssets: [
      "GET /repos/{owner}/{repo}/releases/{release_id}/assets"
    ],
    listReleases: ["GET /repos/{owner}/{repo}/releases"],
    listTags: ["GET /repos/{owner}/{repo}/tags"],
    listTeams: ["GET /repos/{owner}/{repo}/teams"],
    listWebhookDeliveries: [
      "GET /repos/{owner}/{repo}/hooks/{hook_id}/deliveries"
    ],
    listWebhooks: ["GET /repos/{owner}/{repo}/hooks"],
    merge: ["POST /repos/{owner}/{repo}/merges"],
    mergeUpstream: ["POST /repos/{owner}/{repo}/merge-upstream"],
    pingWebhook: ["POST /repos/{owner}/{repo}/hooks/{hook_id}/pings"],
    redeliverWebhookDelivery: [
      "POST /repos/{owner}/{repo}/hooks/{hook_id}/deliveries/{delivery_id}/attempts"
    ],
    removeAppAccessRestrictions: [
      "DELETE /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/apps",
      {},
      { mapToData: "apps" }
    ],
    removeCollaborator: [
      "DELETE /repos/{owner}/{repo}/collaborators/{username}"
    ],
    removeStatusCheckContexts: [
      "DELETE /repos/{owner}/{repo}/branches/{branch}/protection/required_status_checks/contexts",
      {},
      { mapToData: "contexts" }
    ],
    removeStatusCheckProtection: [
      "DELETE /repos/{owner}/{repo}/branches/{branch}/protection/required_status_checks"
    ],
    removeTeamAccessRestrictions: [
      "DELETE /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/teams",
      {},
      { mapToData: "teams" }
    ],
    removeUserAccessRestrictions: [
      "DELETE /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/users",
      {},
      { mapToData: "users" }
    ],
    renameBranch: ["POST /repos/{owner}/{repo}/branches/{branch}/rename"],
    replaceAllTopics: ["PUT /repos/{owner}/{repo}/topics"],
    requestPagesBuild: ["POST /repos/{owner}/{repo}/pages/builds"],
    setAdminBranchProtection: [
      "POST /repos/{owner}/{repo}/branches/{branch}/protection/enforce_admins"
    ],
    setAppAccessRestrictions: [
      "PUT /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/apps",
      {},
      { mapToData: "apps" }
    ],
    setStatusCheckContexts: [
      "PUT /repos/{owner}/{repo}/branches/{branch}/protection/required_status_checks/contexts",
      {},
      { mapToData: "contexts" }
    ],
    setTeamAccessRestrictions: [
      "PUT /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/teams",
      {},
      { mapToData: "teams" }
    ],
    setUserAccessRestrictions: [
      "PUT /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/users",
      {},
      { mapToData: "users" }
    ],
    testPushWebhook: ["POST /repos/{owner}/{repo}/hooks/{hook_id}/tests"],
    transfer: ["POST /repos/{owner}/{repo}/transfer"],
    update: ["PATCH /repos/{owner}/{repo}"],
    updateBranchProtection: [
      "PUT /repos/{owner}/{repo}/branches/{branch}/protection"
    ],
    updateCommitComment: ["PATCH /repos/{owner}/{repo}/comments/{comment_id}"],
    updateDeploymentBranchPolicy: [
      "PUT /repos/{owner}/{repo}/environments/{environment_name}/deployment-branch-policies/{branch_policy_id}"
    ],
    updateInformationAboutPagesSite: ["PUT /repos/{owner}/{repo}/pages"],
    updateInvitation: [
      "PATCH /repos/{owner}/{repo}/invitations/{invitation_id}"
    ],
    updateOrgRuleset: ["PUT /orgs/{org}/rulesets/{ruleset_id}"],
    updatePullRequestReviewProtection: [
      "PATCH /repos/{owner}/{repo}/branches/{branch}/protection/required_pull_request_reviews"
    ],
    updateRelease: ["PATCH /repos/{owner}/{repo}/releases/{release_id}"],
    updateReleaseAsset: [
      "PATCH /repos/{owner}/{repo}/releases/assets/{asset_id}"
    ],
    updateRepoRuleset: ["PUT /repos/{owner}/{repo}/rulesets/{ruleset_id}"],
    updateStatusCheckPotection: [
      "PATCH /repos/{owner}/{repo}/branches/{branch}/protection/required_status_checks",
      {},
      { renamed: ["repos", "updateStatusCheckProtection"] }
    ],
    updateStatusCheckProtection: [
      "PATCH /repos/{owner}/{repo}/branches/{branch}/protection/required_status_checks"
    ],
    updateWebhook: ["PATCH /repos/{owner}/{repo}/hooks/{hook_id}"],
    updateWebhookConfigForRepo: [
      "PATCH /repos/{owner}/{repo}/hooks/{hook_id}/config"
    ],
    uploadReleaseAsset: [
      "POST /repos/{owner}/{repo}/releases/{release_id}/assets{?name,label}",
      { baseUrl: "https://uploads.github.com" }
    ]
  },
  search: {
    code: ["GET /search/code"],
    commits: ["GET /search/commits"],
    issuesAndPullRequests: ["GET /search/issues"],
    labels: ["GET /search/labels"],
    repos: ["GET /search/repositories"],
    topics: ["GET /search/topics"],
    users: ["GET /search/users"]
  },
  secretScanning: {
    createPushProtectionBypass: [
      "POST /repos/{owner}/{repo}/secret-scanning/push-protection-bypasses"
    ],
    getAlert: [
      "GET /repos/{owner}/{repo}/secret-scanning/alerts/{alert_number}"
    ],
    getScanHistory: ["GET /repos/{owner}/{repo}/secret-scanning/scan-history"],
    listAlertsForOrg: ["GET /orgs/{org}/secret-scanning/alerts"],
    listAlertsForRepo: ["GET /repos/{owner}/{repo}/secret-scanning/alerts"],
    listLocationsForAlert: [
      "GET /repos/{owner}/{repo}/secret-scanning/alerts/{alert_number}/locations"
    ],
    listOrgPatternConfigs: [
      "GET /orgs/{org}/secret-scanning/pattern-configurations"
    ],
    updateAlert: [
      "PATCH /repos/{owner}/{repo}/secret-scanning/alerts/{alert_number}"
    ],
    updateOrgPatternConfigs: [
      "PATCH /orgs/{org}/secret-scanning/pattern-configurations"
    ]
  },
  securityAdvisories: {
    createFork: [
      "POST /repos/{owner}/{repo}/security-advisories/{ghsa_id}/forks"
    ],
    createPrivateVulnerabilityReport: [
      "POST /repos/{owner}/{repo}/security-advisories/reports"
    ],
    createRepositoryAdvisory: [
      "POST /repos/{owner}/{repo}/security-advisories"
    ],
    createRepositoryAdvisoryCveRequest: [
      "POST /repos/{owner}/{repo}/security-advisories/{ghsa_id}/cve"
    ],
    getGlobalAdvisory: ["GET /advisories/{ghsa_id}"],
    getRepositoryAdvisory: [
      "GET /repos/{owner}/{repo}/security-advisories/{ghsa_id}"
    ],
    listGlobalAdvisories: ["GET /advisories"],
    listOrgRepositoryAdvisories: ["GET /orgs/{org}/security-advisories"],
    listRepositoryAdvisories: ["GET /repos/{owner}/{repo}/security-advisories"],
    updateRepositoryAdvisory: [
      "PATCH /repos/{owner}/{repo}/security-advisories/{ghsa_id}"
    ]
  },
  teams: {
    addOrUpdateMembershipForUserInOrg: [
      "PUT /orgs/{org}/teams/{team_slug}/memberships/{username}"
    ],
    addOrUpdateRepoPermissionsInOrg: [
      "PUT /orgs/{org}/teams/{team_slug}/repos/{owner}/{repo}"
    ],
    checkPermissionsForRepoInOrg: [
      "GET /orgs/{org}/teams/{team_slug}/repos/{owner}/{repo}"
    ],
    create: ["POST /orgs/{org}/teams"],
    createDiscussionCommentInOrg: [
      "POST /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/comments"
    ],
    createDiscussionInOrg: ["POST /orgs/{org}/teams/{team_slug}/discussions"],
    deleteDiscussionCommentInOrg: [
      "DELETE /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/comments/{comment_number}"
    ],
    deleteDiscussionInOrg: [
      "DELETE /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}"
    ],
    deleteInOrg: ["DELETE /orgs/{org}/teams/{team_slug}"],
    getByName: ["GET /orgs/{org}/teams/{team_slug}"],
    getDiscussionCommentInOrg: [
      "GET /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/comments/{comment_number}"
    ],
    getDiscussionInOrg: [
      "GET /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}"
    ],
    getMembershipForUserInOrg: [
      "GET /orgs/{org}/teams/{team_slug}/memberships/{username}"
    ],
    list: ["GET /orgs/{org}/teams"],
    listChildInOrg: ["GET /orgs/{org}/teams/{team_slug}/teams"],
    listDiscussionCommentsInOrg: [
      "GET /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/comments"
    ],
    listDiscussionsInOrg: ["GET /orgs/{org}/teams/{team_slug}/discussions"],
    listForAuthenticatedUser: ["GET /user/teams"],
    listMembersInOrg: ["GET /orgs/{org}/teams/{team_slug}/members"],
    listPendingInvitationsInOrg: [
      "GET /orgs/{org}/teams/{team_slug}/invitations"
    ],
    listReposInOrg: ["GET /orgs/{org}/teams/{team_slug}/repos"],
    removeMembershipForUserInOrg: [
      "DELETE /orgs/{org}/teams/{team_slug}/memberships/{username}"
    ],
    removeRepoInOrg: [
      "DELETE /orgs/{org}/teams/{team_slug}/repos/{owner}/{repo}"
    ],
    updateDiscussionCommentInOrg: [
      "PATCH /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/comments/{comment_number}"
    ],
    updateDiscussionInOrg: [
      "PATCH /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}"
    ],
    updateInOrg: ["PATCH /orgs/{org}/teams/{team_slug}"]
  },
  users: {
    addEmailForAuthenticated: [
      "POST /user/emails",
      {},
      { renamed: ["users", "addEmailForAuthenticatedUser"] }
    ],
    addEmailForAuthenticatedUser: ["POST /user/emails"],
    addSocialAccountForAuthenticatedUser: ["POST /user/social_accounts"],
    block: ["PUT /user/blocks/{username}"],
    checkBlocked: ["GET /user/blocks/{username}"],
    checkFollowingForUser: ["GET /users/{username}/following/{target_user}"],
    checkPersonIsFollowedByAuthenticated: ["GET /user/following/{username}"],
    createGpgKeyForAuthenticated: [
      "POST /user/gpg_keys",
      {},
      { renamed: ["users", "createGpgKeyForAuthenticatedUser"] }
    ],
    createGpgKeyForAuthenticatedUser: ["POST /user/gpg_keys"],
    createPublicSshKeyForAuthenticated: [
      "POST /user/keys",
      {},
      { renamed: ["users", "createPublicSshKeyForAuthenticatedUser"] }
    ],
    createPublicSshKeyForAuthenticatedUser: ["POST /user/keys"],
    createSshSigningKeyForAuthenticatedUser: ["POST /user/ssh_signing_keys"],
    deleteAttestationsBulk: [
      "POST /users/{username}/attestations/delete-request"
    ],
    deleteAttestationsById: [
      "DELETE /users/{username}/attestations/{attestation_id}"
    ],
    deleteAttestationsBySubjectDigest: [
      "DELETE /users/{username}/attestations/digest/{subject_digest}"
    ],
    deleteEmailForAuthenticated: [
      "DELETE /user/emails",
      {},
      { renamed: ["users", "deleteEmailForAuthenticatedUser"] }
    ],
    deleteEmailForAuthenticatedUser: ["DELETE /user/emails"],
    deleteGpgKeyForAuthenticated: [
      "DELETE /user/gpg_keys/{gpg_key_id}",
      {},
      { renamed: ["users", "deleteGpgKeyForAuthenticatedUser"] }
    ],
    deleteGpgKeyForAuthenticatedUser: ["DELETE /user/gpg_keys/{gpg_key_id}"],
    deletePublicSshKeyForAuthenticated: [
      "DELETE /user/keys/{key_id}",
      {},
      { renamed: ["users", "deletePublicSshKeyForAuthenticatedUser"] }
    ],
    deletePublicSshKeyForAuthenticatedUser: ["DELETE /user/keys/{key_id}"],
    deleteSocialAccountForAuthenticatedUser: ["DELETE /user/social_accounts"],
    deleteSshSigningKeyForAuthenticatedUser: [
      "DELETE /user/ssh_signing_keys/{ssh_signing_key_id}"
    ],
    follow: ["PUT /user/following/{username}"],
    getAuthenticated: ["GET /user"],
    getById: ["GET /user/{account_id}"],
    getByUsername: ["GET /users/{username}"],
    getContextForUser: ["GET /users/{username}/hovercard"],
    getGpgKeyForAuthenticated: [
      "GET /user/gpg_keys/{gpg_key_id}",
      {},
      { renamed: ["users", "getGpgKeyForAuthenticatedUser"] }
    ],
    getGpgKeyForAuthenticatedUser: ["GET /user/gpg_keys/{gpg_key_id}"],
    getPublicSshKeyForAuthenticated: [
      "GET /user/keys/{key_id}",
      {},
      { renamed: ["users", "getPublicSshKeyForAuthenticatedUser"] }
    ],
    getPublicSshKeyForAuthenticatedUser: ["GET /user/keys/{key_id}"],
    getSshSigningKeyForAuthenticatedUser: [
      "GET /user/ssh_signing_keys/{ssh_signing_key_id}"
    ],
    list: ["GET /users"],
    listAttestations: ["GET /users/{username}/attestations/{subject_digest}"],
    listAttestationsBulk: [
      "POST /users/{username}/attestations/bulk-list{?per_page,before,after}"
    ],
    listBlockedByAuthenticated: [
      "GET /user/blocks",
      {},
      { renamed: ["users", "listBlockedByAuthenticatedUser"] }
    ],
    listBlockedByAuthenticatedUser: ["GET /user/blocks"],
    listEmailsForAuthenticated: [
      "GET /user/emails",
      {},
      { renamed: ["users", "listEmailsForAuthenticatedUser"] }
    ],
    listEmailsForAuthenticatedUser: ["GET /user/emails"],
    listFollowedByAuthenticated: [
      "GET /user/following",
      {},
      { renamed: ["users", "listFollowedByAuthenticatedUser"] }
    ],
    listFollowedByAuthenticatedUser: ["GET /user/following"],
    listFollowersForAuthenticatedUser: ["GET /user/followers"],
    listFollowersForUser: ["GET /users/{username}/followers"],
    listFollowingForUser: ["GET /users/{username}/following"],
    listGpgKeysForAuthenticated: [
      "GET /user/gpg_keys",
      {},
      { renamed: ["users", "listGpgKeysForAuthenticatedUser"] }
    ],
    listGpgKeysForAuthenticatedUser: ["GET /user/gpg_keys"],
    listGpgKeysForUser: ["GET /users/{username}/gpg_keys"],
    listPublicEmailsForAuthenticated: [
      "GET /user/public_emails",
      {},
      { renamed: ["users", "listPublicEmailsForAuthenticatedUser"] }
    ],
    listPublicEmailsForAuthenticatedUser: ["GET /user/public_emails"],
    listPublicKeysForUser: ["GET /users/{username}/keys"],
    listPublicSshKeysForAuthenticated: [
      "GET /user/keys",
      {},
      { renamed: ["users", "listPublicSshKeysForAuthenticatedUser"] }
    ],
    listPublicSshKeysForAuthenticatedUser: ["GET /user/keys"],
    listSocialAccountsForAuthenticatedUser: ["GET /user/social_accounts"],
    listSocialAccountsForUser: ["GET /users/{username}/social_accounts"],
    listSshSigningKeysForAuthenticatedUser: ["GET /user/ssh_signing_keys"],
    listSshSigningKeysForUser: ["GET /users/{username}/ssh_signing_keys"],
    setPrimaryEmailVisibilityForAuthenticated: [
      "PATCH /user/email/visibility",
      {},
      { renamed: ["users", "setPrimaryEmailVisibilityForAuthenticatedUser"] }
    ],
    setPrimaryEmailVisibilityForAuthenticatedUser: [
      "PATCH /user/email/visibility"
    ],
    unblock: ["DELETE /user/blocks/{username}"],
    unfollow: ["DELETE /user/following/{username}"],
    updateAuthenticated: ["PATCH /user"]
  }
};
var endpoints_default = Endpoints;

// node_modules/.pnpm/@octokit+plugin-rest-endpoi_b05e717b89cdd67da7764161022795e3/node_modules/@octokit/plugin-rest-endpoint-methods/dist-src/endpoints-to-methods.js
var endpointMethodsMap = /* @__PURE__ */ new Map();
for (const [scope, endpoints] of Object.entries(endpoints_default)) {
  for (const [methodName, endpoint2] of Object.entries(endpoints)) {
    const [route, defaults, decorations] = endpoint2;
    const [method, url] = route.split(/ /);
    const endpointDefaults = Object.assign(
      {
        method,
        url
      },
      defaults
    );
    if (!endpointMethodsMap.has(scope)) {
      endpointMethodsMap.set(scope, /* @__PURE__ */ new Map());
    }
    endpointMethodsMap.get(scope).set(methodName, {
      scope,
      methodName,
      endpointDefaults,
      decorations
    });
  }
}
var handler = {
  has({ scope }, methodName) {
    return endpointMethodsMap.get(scope).has(methodName);
  },
  getOwnPropertyDescriptor(target, methodName) {
    return {
      value: this.get(target, methodName),
      // ensures method is in the cache
      configurable: true,
      writable: true,
      enumerable: true
    };
  },
  defineProperty(target, methodName, descriptor) {
    Object.defineProperty(target.cache, methodName, descriptor);
    return true;
  },
  deleteProperty(target, methodName) {
    delete target.cache[methodName];
    return true;
  },
  ownKeys({ scope }) {
    return [...endpointMethodsMap.get(scope).keys()];
  },
  set(target, methodName, value) {
    return target.cache[methodName] = value;
  },
  get({ octokit, scope, cache }, methodName) {
    if (cache[methodName]) {
      return cache[methodName];
    }
    const method = endpointMethodsMap.get(scope).get(methodName);
    if (!method) {
      return void 0;
    }
    const { endpointDefaults, decorations } = method;
    if (decorations) {
      cache[methodName] = decorate(
        octokit,
        scope,
        methodName,
        endpointDefaults,
        decorations
      );
    } else {
      cache[methodName] = octokit.request.defaults(endpointDefaults);
    }
    return cache[methodName];
  }
};
function endpointsToMethods(octokit) {
  const newMethods = {};
  for (const scope of endpointMethodsMap.keys()) {
    newMethods[scope] = new Proxy({ octokit, scope, cache: {} }, handler);
  }
  return newMethods;
}
function decorate(octokit, scope, methodName, defaults, decorations) {
  const requestWithDefaults = octokit.request.defaults(defaults);
  function withDecorations(...args) {
    let options = requestWithDefaults.endpoint.merge(...args);
    if (decorations.mapToData) {
      options = Object.assign({}, options, {
        data: options[decorations.mapToData],
        [decorations.mapToData]: void 0
      });
      return requestWithDefaults(options);
    }
    if (decorations.renamed) {
      const [newScope, newMethodName] = decorations.renamed;
      octokit.log.warn(
        `octokit.${scope}.${methodName}() has been renamed to octokit.${newScope}.${newMethodName}()`
      );
    }
    if (decorations.deprecated) {
      octokit.log.warn(decorations.deprecated);
    }
    if (decorations.renamedParameters) {
      const options2 = requestWithDefaults.endpoint.merge(...args);
      for (const [name, alias] of Object.entries(
        decorations.renamedParameters
      )) {
        if (name in options2) {
          octokit.log.warn(
            `"${name}" parameter is deprecated for "octokit.${scope}.${methodName}()". Use "${alias}" instead`
          );
          if (!(alias in options2)) {
            options2[alias] = options2[name];
          }
          delete options2[name];
        }
      }
      return requestWithDefaults(options2);
    }
    return requestWithDefaults(...args);
  }
  return Object.assign(withDecorations, requestWithDefaults);
}

// node_modules/.pnpm/@octokit+plugin-rest-endpoi_b05e717b89cdd67da7764161022795e3/node_modules/@octokit/plugin-rest-endpoint-methods/dist-src/index.js
function restEndpointMethods(octokit) {
  const api = endpointsToMethods(octokit);
  return {
    rest: api
  };
}
restEndpointMethods.VERSION = VERSION6;
function legacyRestEndpointMethods(octokit) {
  const api = endpointsToMethods(octokit);
  return {
    ...api,
    rest: api
  };
}
legacyRestEndpointMethods.VERSION = VERSION6;

// node_modules/.pnpm/@octokit+plugin-retry@8.1.1_@octokit+core@7.0.8/node_modules/@octokit/plugin-retry/dist-bundle/index.js
var import_light = __toESM(require_light(), 1);
var VERSION7 = "0.0.0-development";
function isRequestError(error) {
  return error.request !== void 0;
}
async function errorRequest(state, octokit, error, options) {
  if (!isRequestError(error) || !error?.request.request) {
    throw error;
  }
  if (error.status >= 400 && !state.doNotRetry.includes(error.status)) {
    const retries = options.request.retries != null ? options.request.retries : state.retries;
    const retryAfter = Math.pow((options.request.retryCount || 0) + 1, 2);
    throw octokit.retry.retryRequest(error, retries, retryAfter);
  }
  throw error;
}
async function wrapRequest(state, octokit, request2, options) {
  const limiter = new import_light.default();
  limiter.on("failed", function(error, info) {
    const maxRetries = ~~error.request.request?.retries;
    const after = ~~error.request.request?.retryAfter;
    options.request.retryCount = info.retryCount + 1;
    if (maxRetries > info.retryCount) {
      return after * state.retryAfterBaseValue;
    }
  });
  return limiter.schedule(
    requestWithGraphqlErrorHandling.bind(null, state, octokit, request2),
    options
  );
}
async function requestWithGraphqlErrorHandling(state, octokit, request2, options) {
  const response = await request2(options);
  if (response.data && response.data.errors && response.data.errors.length > 0 && /Something went wrong while executing your query/.test(
    response.data.errors[0].message
  )) {
    const error = new RequestError(response.data.errors[0].message, 500, {
      request: options,
      response
    });
    return errorRequest(state, octokit, error, options);
  }
  return response;
}
function retry(octokit, octokitOptions) {
  const state = Object.assign(
    {
      enabled: true,
      retryAfterBaseValue: 1e3,
      doNotRetry: [400, 401, 403, 404, 410, 422, 451],
      retries: 3
    },
    octokitOptions.retry
  );
  const retryPlugin = {
    retry: {
      retryRequest: (error, retries, retryAfter) => {
        error.request.request = Object.assign({}, error.request.request, {
          retries,
          retryAfter
        });
        return error;
      }
    }
  };
  if (state.enabled) {
    octokit.hook.error("request", errorRequest.bind(null, state, retryPlugin));
    octokit.hook.wrap("request", wrapRequest.bind(null, state, retryPlugin));
  }
  return retryPlugin;
}
retry.VERSION = VERSION7;

// node_modules/.pnpm/@octokit+plugin-throttling@11.0.5_@octokit+core@7.0.8/node_modules/@octokit/plugin-throttling/dist-bundle/index.js
var import_light2 = __toESM(require_light(), 1);
var VERSION8 = "0.0.0-development";
var noop3 = () => Promise.resolve();
function wrapRequest2(state, request2, options) {
  return state.retryLimiter.schedule(doRequest, state, request2, options);
}
async function doRequest(state, request2, options) {
  const { pathname } = new URL(options.url, "http://github.test");
  const isAuth = isAuthRequest(options.method, pathname);
  const isWrite = !isAuth && options.method !== "GET" && options.method !== "HEAD";
  const isSearch = options.method === "GET" && pathname.startsWith("/search/");
  const isGraphQL = pathname.startsWith("/graphql");
  const retryCount = ~~request2.retryCount;
  const jobOptions = retryCount > 0 ? { priority: 0, weight: 0 } : {};
  if (state.clustering) {
    jobOptions.expiration = 1e3 * 60;
  }
  if (isWrite || isGraphQL) {
    await state.write.key(state.id).schedule(jobOptions, noop3);
  }
  if (isWrite && state.triggersNotification(pathname)) {
    await state.notifications.key(state.id).schedule(jobOptions, noop3);
  }
  if (isSearch) {
    await state.search.key(state.id).schedule(jobOptions, noop3);
  }
  const req = (isAuth ? state.auth : state.global).key(state.id).schedule(jobOptions, request2, options);
  if (isGraphQL) {
    const res = await req;
    if (res.data.errors != null && res.data.errors.some((error) => error.type === "RATE_LIMITED")) {
      const error = Object.assign(new Error("GraphQL Rate Limit Exceeded"), {
        response: res,
        data: res.data
      });
      throw error;
    }
  }
  return req;
}
function isAuthRequest(method, pathname) {
  return method === "PATCH" && // https://docs.github.com/en/rest/apps/apps?apiVersion=2022-11-28#create-a-scoped-access-token
  /^\/applications\/[^/]+\/token\/scoped$/.test(pathname) || method === "POST" && // https://docs.github.com/en/rest/apps/oauth-applications?apiVersion=2022-11-28#reset-a-token
  (/^\/applications\/[^/]+\/token$/.test(pathname) || // https://docs.github.com/en/rest/apps/apps?apiVersion=2022-11-28#create-an-installation-access-token-for-an-app
  /^\/app\/installations\/[^/]+\/access_tokens$/.test(pathname) || // https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps
  pathname === "/login/oauth/access_token");
}
var triggers_notification_paths_default = [
  "/orgs/{org}/invitations",
  "/orgs/{org}/invitations/{invitation_id}",
  "/orgs/{org}/teams/{team_slug}/discussions",
  "/orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/comments",
  "/repos/{owner}/{repo}/collaborators/{username}",
  "/repos/{owner}/{repo}/commits/{commit_sha}/comments",
  "/repos/{owner}/{repo}/issues",
  "/repos/{owner}/{repo}/issues/{issue_number}/comments",
  "/repos/{owner}/{repo}/issues/{issue_number}/sub_issue",
  "/repos/{owner}/{repo}/issues/{issue_number}/sub_issues/priority",
  "/repos/{owner}/{repo}/pulls",
  "/repos/{owner}/{repo}/pulls/{pull_number}/comments",
  "/repos/{owner}/{repo}/pulls/{pull_number}/comments/{comment_id}/replies",
  "/repos/{owner}/{repo}/pulls/{pull_number}/merge",
  "/repos/{owner}/{repo}/pulls/{pull_number}/requested_reviewers",
  "/repos/{owner}/{repo}/pulls/{pull_number}/reviews",
  "/repos/{owner}/{repo}/releases",
  "/teams/{team_id}/discussions",
  "/teams/{team_id}/discussions/{discussion_number}/comments"
];
function routeMatcher(paths) {
  const regexes = paths.map(
    (path) => path.split("/").map((c) => c.startsWith("{") ? "(?:.+?)" : c).join("/")
  );
  const regex2 = `^(?:${regexes.map((r) => `(?:${r})`).join("|")})[^/]*$`;
  return new RegExp(regex2, "i");
}
var regex = routeMatcher(triggers_notification_paths_default);
var triggersNotification = regex.test.bind(regex);
var groups = {};
var createGroups = function(Bottleneck2, common) {
  groups.global = new Bottleneck2.Group({
    id: "octokit-global",
    maxConcurrent: 10,
    ...common
  });
  groups.auth = new Bottleneck2.Group({
    id: "octokit-auth",
    maxConcurrent: 1,
    ...common
  });
  groups.search = new Bottleneck2.Group({
    id: "octokit-search",
    maxConcurrent: 1,
    minTime: 2e3,
    ...common
  });
  groups.write = new Bottleneck2.Group({
    id: "octokit-write",
    maxConcurrent: 1,
    minTime: 1e3,
    ...common
  });
  groups.notifications = new Bottleneck2.Group({
    id: "octokit-notifications",
    maxConcurrent: 1,
    minTime: 3e3,
    ...common
  });
};
function throttling(octokit, octokitOptions) {
  const {
    enabled = true,
    Bottleneck: Bottleneck2 = import_light2.default,
    id = "no-id",
    timeout = 1e3 * 60 * 2,
    // Redis TTL: 2 minutes
    connection
  } = octokitOptions.throttle || {};
  if (!enabled) {
    return {};
  }
  const common = { timeout };
  if (typeof connection !== "undefined") {
    common.connection = connection;
  }
  const state = Object.assign(
    {
      clustering: connection != null,
      triggersNotification,
      fallbackSecondaryRateRetryAfter: 60,
      retryAfterBaseValue: 1e3,
      id
    },
    octokitOptions.throttle
  );
  if (typeof state.onSecondaryRateLimit !== "function" || typeof state.onRateLimit !== "function") {
    throw new Error(`octokit/plugin-throttling error:
        You must pass the onSecondaryRateLimit and onRateLimit error handlers.
        See https://octokit.github.io/rest.js/#throttling

        const octokit = new Octokit({
          throttle: {
            onSecondaryRateLimit: (retryAfter, options) => {/* ... */},
            onRateLimit: (retryAfter, options) => {/* ... */}
          }
        })
    `);
  }
  let initialized = false;
  const initializeBottleneck = () => {
    if (initialized) {
      return;
    }
    initialized = true;
    if (groups.global == null) {
      createGroups(Bottleneck2, common);
    }
    state.global = state.global ?? groups.global;
    state.auth = state.auth ?? groups.auth;
    state.search = state.search ?? groups.search;
    state.write = state.write ?? groups.write;
    state.notifications = state.notifications ?? groups.notifications;
    state.retryLimiter = state.retryLimiter ?? new Bottleneck2();
    const events = {};
    const emitter = new Bottleneck2.Events(events);
    events.on("secondary-limit", state.onSecondaryRateLimit);
    events.on("rate-limit", state.onRateLimit);
    events.on(
      "error",
      (e) => octokit.log.warn("Error in throttling-plugin limit handler", e)
    );
    state.retryLimiter.on("failed", async function(error, info) {
      const [state2, request2, options] = info.args;
      const { pathname } = new URL(options.url, "http://github.test");
      const shouldRetryGraphQL = pathname.startsWith("/graphql") && error.status !== 401;
      if (!(shouldRetryGraphQL || error.status === 403 || error.status === 429)) {
        return;
      }
      const retryCount = ~~request2.retryCount;
      request2.retryCount = retryCount;
      options.request.retryCount = retryCount;
      const { wantRetry, retryAfter = 0 } = await (async function() {
        if (/\bsecondary rate\b/i.test(error.message)) {
          const retryAfter2 = Number(error.response.headers["retry-after"]) || state2.fallbackSecondaryRateRetryAfter;
          const wantRetry2 = await emitter.trigger(
            "secondary-limit",
            retryAfter2,
            options,
            octokit,
            retryCount
          );
          return { wantRetry: wantRetry2, retryAfter: retryAfter2 };
        }
        if (error.response.headers != null && error.response.headers["x-ratelimit-remaining"] === "0" || (error.response.data?.errors ?? []).some(
          (error2) => error2.type === "RATE_LIMITED"
        )) {
          const rateLimitReset = new Date(
            ~~error.response.headers["x-ratelimit-reset"] * 1e3
          ).getTime();
          const retryAfter2 = Math.max(
            // Add one second so we retry _after_ the reset time
            // https://docs.github.com/en/rest/overview/resources-in-the-rest-api?apiVersion=2022-11-28#exceeding-the-rate-limit
            Math.ceil((rateLimitReset - Date.now()) / 1e3) + 1,
            0
          );
          const wantRetry2 = await emitter.trigger(
            "rate-limit",
            retryAfter2,
            options,
            octokit,
            retryCount
          );
          return { wantRetry: wantRetry2, retryAfter: retryAfter2 };
        }
        return {};
      })();
      if (wantRetry) {
        request2.retryCount++;
        return retryAfter * state2.retryAfterBaseValue;
      }
    });
  };
  octokit.hook.wrap("request", (request2, options) => {
    initializeBottleneck();
    return wrapRequest2(state, request2, options);
  });
  return {};
}
throttling.VERSION = VERSION8;
throttling.triggersNotification = triggersNotification;

// node_modules/.pnpm/@octokit+oauth-authorization-url@8.0.0/node_modules/@octokit/oauth-authorization-url/dist-src/index.js
function oauthAuthorizationUrl(options) {
  const clientType = options.clientType || "oauth-app";
  const baseUrl = options.baseUrl || "https://github.com";
  const result = {
    clientType,
    allowSignup: options.allowSignup === false ? false : true,
    clientId: options.clientId,
    login: options.login || null,
    redirectUrl: options.redirectUrl || null,
    state: options.state || Math.random().toString(36).substr(2),
    url: ""
  };
  if (clientType === "oauth-app") {
    const scopes = "scopes" in options ? options.scopes : [];
    result.scopes = typeof scopes === "string" ? scopes.split(/[,\s]+/).filter(Boolean) : scopes;
  }
  result.url = urlBuilderAuthorize(`${baseUrl}/login/oauth/authorize`, result);
  return result;
}
function urlBuilderAuthorize(base, options) {
  const map = {
    allowSignup: "allow_signup",
    clientId: "client_id",
    login: "login",
    redirectUrl: "redirect_uri",
    scopes: "scope",
    state: "state"
  };
  let url = base;
  Object.keys(map).filter((k) => options[k] !== null).filter((k) => {
    if (k !== "scopes") return true;
    if (options.clientType === "github-app") return false;
    return !Array.isArray(options[k]) || options[k].length > 0;
  }).map((key) => [map[key], `${options[key]}`]).forEach(([key, value], index) => {
    url += index === 0 ? `?` : "&";
    url += `${key}=${encodeURIComponent(value)}`;
  });
  return url;
}

// node_modules/.pnpm/@octokit+oauth-methods@6.0.5/node_modules/@octokit/oauth-methods/dist-bundle/index.js
function requestToOAuthBaseUrl(request2) {
  const endpointDefaults = request2.endpoint.DEFAULTS;
  if (/^https:\/\/(api\.)?github\.com$/.test(endpointDefaults.baseUrl)) {
    return "https://github.com";
  }
  if (/^https:\/\/api\..*\.ghe\.com$/.test(endpointDefaults.baseUrl)) {
    return endpointDefaults.baseUrl.replace("api.", "");
  }
  return endpointDefaults.baseUrl.replace("/api/v3", "");
}
async function oauthRequest(request2, route, parameters) {
  const withOAuthParameters = {
    baseUrl: requestToOAuthBaseUrl(request2),
    headers: {
      accept: "application/json"
    },
    ...parameters
  };
  const response = await request2(route, withOAuthParameters);
  if ("error" in response.data) {
    const error = new RequestError(
      `${response.data.error_description} (${response.data.error}, ${response.data.error_uri})`,
      400,
      {
        request: request2.endpoint.merge(
          route,
          withOAuthParameters
        )
      }
    );
    error.response = response;
    throw error;
  }
  return response;
}
function getWebFlowAuthorizationUrl({
  request: request2 = request,
  ...options
}) {
  const baseUrl = requestToOAuthBaseUrl(request2);
  return oauthAuthorizationUrl({
    ...options,
    baseUrl
  });
}
async function exchangeWebFlowCode(options) {
  const request2 = options.request || request;
  const response = await oauthRequest(
    request2,
    "POST /login/oauth/access_token",
    {
      client_id: options.clientId,
      client_secret: options.clientSecret,
      code: options.code,
      redirect_uri: options.redirectUrl
    }
  );
  const authentication = {
    clientType: options.clientType,
    clientId: options.clientId,
    clientSecret: options.clientSecret,
    token: response.data.access_token,
    scopes: response.data.scope.split(/\s+/).filter(Boolean)
  };
  if (options.clientType === "github-app") {
    if ("refresh_token" in response.data) {
      const apiTimeInMs = new Date(response.headers.date).getTime();
      authentication.refreshToken = response.data.refresh_token, authentication.expiresAt = toTimestamp(
        apiTimeInMs,
        response.data.expires_in
      ), authentication.refreshTokenExpiresAt = toTimestamp(
        apiTimeInMs,
        response.data.refresh_token_expires_in
      );
    }
    delete authentication.scopes;
  }
  return { ...response, authentication };
}
function toTimestamp(apiTimeInMs, expirationInSeconds) {
  return new Date(apiTimeInMs + expirationInSeconds * 1e3).toISOString();
}
async function createDeviceCode(options) {
  const request2 = options.request || request;
  const parameters = {
    client_id: options.clientId
  };
  if ("scopes" in options && Array.isArray(options.scopes)) {
    parameters.scope = options.scopes.join(" ");
  }
  return oauthRequest(request2, "POST /login/device/code", parameters);
}
async function exchangeDeviceCode(options) {
  const request2 = options.request || request;
  const response = await oauthRequest(
    request2,
    "POST /login/oauth/access_token",
    {
      client_id: options.clientId,
      device_code: options.code,
      grant_type: "urn:ietf:params:oauth:grant-type:device_code"
    }
  );
  const authentication = {
    clientType: options.clientType,
    clientId: options.clientId,
    token: response.data.access_token,
    scopes: response.data.scope.split(/\s+/).filter(Boolean)
  };
  if ("clientSecret" in options) {
    authentication.clientSecret = options.clientSecret;
  }
  if (options.clientType === "github-app") {
    if ("refresh_token" in response.data) {
      const apiTimeInMs = new Date(response.headers.date).getTime();
      authentication.refreshToken = response.data.refresh_token, authentication.expiresAt = toTimestamp2(
        apiTimeInMs,
        response.data.expires_in
      ), authentication.refreshTokenExpiresAt = toTimestamp2(
        apiTimeInMs,
        response.data.refresh_token_expires_in
      );
    }
    delete authentication.scopes;
  }
  return { ...response, authentication };
}
function toTimestamp2(apiTimeInMs, expirationInSeconds) {
  return new Date(apiTimeInMs + expirationInSeconds * 1e3).toISOString();
}
async function checkToken(options) {
  const request2 = options.request || request;
  const response = await request2("POST /applications/{client_id}/token", {
    headers: {
      authorization: `basic ${btoa(
        `${options.clientId}:${options.clientSecret}`
      )}`
    },
    client_id: options.clientId,
    access_token: options.token
  });
  const authentication = {
    clientType: options.clientType,
    clientId: options.clientId,
    clientSecret: options.clientSecret,
    token: options.token,
    scopes: response.data.scopes
  };
  if (response.data.expires_at)
    authentication.expiresAt = response.data.expires_at;
  if (options.clientType === "github-app") {
    delete authentication.scopes;
  }
  return { ...response, authentication };
}
async function refreshToken(options) {
  const request2 = options.request || request;
  const response = await oauthRequest(
    request2,
    "POST /login/oauth/access_token",
    {
      client_id: options.clientId,
      client_secret: options.clientSecret,
      grant_type: "refresh_token",
      refresh_token: options.refreshToken
    }
  );
  const apiTimeInMs = new Date(response.headers.date).getTime();
  const authentication = {
    clientType: "github-app",
    clientId: options.clientId,
    clientSecret: options.clientSecret,
    token: response.data.access_token,
    refreshToken: response.data.refresh_token,
    expiresAt: toTimestamp3(apiTimeInMs, response.data.expires_in),
    refreshTokenExpiresAt: toTimestamp3(
      apiTimeInMs,
      response.data.refresh_token_expires_in
    )
  };
  return { ...response, authentication };
}
function toTimestamp3(apiTimeInMs, expirationInSeconds) {
  return new Date(apiTimeInMs + expirationInSeconds * 1e3).toISOString();
}
async function scopeToken(options) {
  const {
    request: optionsRequest,
    clientType,
    clientId,
    clientSecret,
    token,
    ...requestOptions
  } = options;
  const request2 = options.request || request;
  const response = await request2(
    "POST /applications/{client_id}/token/scoped",
    {
      headers: {
        authorization: `basic ${btoa(`${clientId}:${clientSecret}`)}`
      },
      client_id: clientId,
      access_token: token,
      ...requestOptions
    }
  );
  const authentication = Object.assign(
    {
      clientType,
      clientId,
      clientSecret,
      token: response.data.token
    },
    response.data.expires_at ? { expiresAt: response.data.expires_at } : {}
  );
  return { ...response, authentication };
}
async function resetToken(options) {
  const request2 = options.request || request;
  const auth7 = btoa(`${options.clientId}:${options.clientSecret}`);
  const response = await request2(
    "PATCH /applications/{client_id}/token",
    {
      headers: {
        authorization: `basic ${auth7}`
      },
      client_id: options.clientId,
      access_token: options.token
    }
  );
  const authentication = {
    clientType: options.clientType,
    clientId: options.clientId,
    clientSecret: options.clientSecret,
    token: response.data.token,
    scopes: response.data.scopes
  };
  if (response.data.expires_at)
    authentication.expiresAt = response.data.expires_at;
  if (options.clientType === "github-app") {
    delete authentication.scopes;
  }
  return { ...response, authentication };
}
async function deleteToken(options) {
  const request2 = options.request || request;
  const auth7 = btoa(`${options.clientId}:${options.clientSecret}`);
  return request2(
    "DELETE /applications/{client_id}/token",
    {
      headers: {
        authorization: `basic ${auth7}`
      },
      client_id: options.clientId,
      access_token: options.token
    }
  );
}
async function deleteAuthorization(options) {
  const request2 = options.request || request;
  const auth7 = btoa(`${options.clientId}:${options.clientSecret}`);
  return request2(
    "DELETE /applications/{client_id}/grant",
    {
      headers: {
        authorization: `basic ${auth7}`
      },
      client_id: options.clientId,
      access_token: options.token
    }
  );
}

// node_modules/.pnpm/@octokit+auth-oauth-device@8.0.5/node_modules/@octokit/auth-oauth-device/dist-bundle/index.js
async function getOAuthAccessToken(state, options) {
  const cachedAuthentication = getCachedAuthentication(state, options.auth);
  if (cachedAuthentication) return cachedAuthentication;
  const { data: verification } = await createDeviceCode({
    clientType: state.clientType,
    clientId: state.clientId,
    request: options.request || state.request,
    // @ts-expect-error the extra code to make TS happy is not worth it
    scopes: options.auth.scopes || state.scopes
  });
  await state.onVerification(verification);
  const authentication = await waitForAccessToken(
    options.request || state.request,
    state.clientId,
    state.clientType,
    verification
  );
  state.authentication = authentication;
  return authentication;
}
function getCachedAuthentication(state, auth22) {
  if (auth22.refresh === true) return false;
  if (!state.authentication) return false;
  if (state.clientType === "github-app") {
    return state.authentication;
  }
  const authentication = state.authentication;
  const newScope = ("scopes" in auth22 && auth22.scopes || state.scopes).join(
    " "
  );
  const currentScope = authentication.scopes.join(" ");
  return newScope === currentScope ? authentication : false;
}
async function wait(seconds) {
  await new Promise((resolve) => setTimeout(resolve, seconds * 1e3));
}
async function waitForAccessToken(request2, clientId, clientType, verification) {
  try {
    const options = {
      clientId,
      request: request2,
      code: verification.device_code
    };
    const { authentication } = clientType === "oauth-app" ? await exchangeDeviceCode({
      ...options,
      clientType: "oauth-app"
    }) : await exchangeDeviceCode({
      ...options,
      clientType: "github-app"
    });
    return {
      type: "token",
      tokenType: "oauth",
      ...authentication
    };
  } catch (error) {
    if (!error.response) throw error;
    const errorType = error.response.data.error;
    if (errorType === "authorization_pending") {
      await wait(verification.interval);
      return waitForAccessToken(request2, clientId, clientType, verification);
    }
    if (errorType === "slow_down") {
      await wait(verification.interval + 7);
      return waitForAccessToken(request2, clientId, clientType, verification);
    }
    throw error;
  }
}
async function auth2(state, authOptions) {
  return getOAuthAccessToken(state, {
    auth: authOptions
  });
}
async function hook2(state, request2, route, parameters) {
  let endpoint2 = request2.endpoint.merge(
    route,
    parameters
  );
  if (/\/login\/(oauth\/access_token|device\/code)$/.test(endpoint2.url)) {
    return request2(endpoint2);
  }
  const { token } = await getOAuthAccessToken(state, {
    request: request2,
    auth: { type: "oauth" }
  });
  endpoint2.headers.authorization = `token ${token}`;
  return request2(endpoint2);
}
var VERSION9 = "0.0.0-development";
function createOAuthDeviceAuth(options) {
  const requestWithDefaults = options.request || request.defaults({
    headers: {
      "user-agent": `octokit-auth-oauth-device.js/${VERSION9} ${getUserAgent()}`
    }
  });
  const { request: request2 = requestWithDefaults, ...otherOptions } = options;
  const state = options.clientType === "github-app" ? {
    ...otherOptions,
    clientType: "github-app",
    request: request2
  } : {
    ...otherOptions,
    clientType: "oauth-app",
    request: request2,
    scopes: options.scopes || []
  };
  if (!options.clientId) {
    throw new Error(
      '[@octokit/auth-oauth-device] "clientId" option must be set (https://github.com/octokit/auth-oauth-device.js#usage)'
    );
  }
  if (!options.onVerification) {
    throw new Error(
      '[@octokit/auth-oauth-device] "onVerification" option must be a function (https://github.com/octokit/auth-oauth-device.js#usage)'
    );
  }
  return Object.assign(auth2.bind(null, state), {
    hook: hook2.bind(null, state)
  });
}

// node_modules/.pnpm/@octokit+auth-oauth-user@6.0.4/node_modules/@octokit/auth-oauth-user/dist-bundle/index.js
var VERSION10 = "0.0.0-development";
async function getAuthentication(state) {
  if ("code" in state.strategyOptions) {
    const { authentication } = await exchangeWebFlowCode({
      clientId: state.clientId,
      clientSecret: state.clientSecret,
      clientType: state.clientType,
      onTokenCreated: state.onTokenCreated,
      ...state.strategyOptions,
      request: state.request
    });
    return {
      type: "token",
      tokenType: "oauth",
      ...authentication
    };
  }
  if ("onVerification" in state.strategyOptions) {
    const deviceAuth = createOAuthDeviceAuth({
      clientType: state.clientType,
      clientId: state.clientId,
      onTokenCreated: state.onTokenCreated,
      ...state.strategyOptions,
      request: state.request
    });
    const authentication = await deviceAuth({
      type: "oauth"
    });
    return {
      clientSecret: state.clientSecret,
      ...authentication
    };
  }
  if ("token" in state.strategyOptions) {
    return {
      type: "token",
      tokenType: "oauth",
      clientId: state.clientId,
      clientSecret: state.clientSecret,
      clientType: state.clientType,
      onTokenCreated: state.onTokenCreated,
      ...state.strategyOptions
    };
  }
  throw new Error("[@octokit/auth-oauth-user] Invalid strategy options");
}
async function auth3(state, options = {}) {
  if (!state.authentication) {
    state.authentication = state.clientType === "oauth-app" ? await getAuthentication(state) : await getAuthentication(state);
  }
  if (state.authentication.invalid) {
    throw new Error("[@octokit/auth-oauth-user] Token is invalid");
  }
  const currentAuthentication = state.authentication;
  if ("expiresAt" in currentAuthentication) {
    if (options.type === "refresh" || new Date(currentAuthentication.expiresAt) < /* @__PURE__ */ new Date()) {
      const { authentication } = await refreshToken({
        clientType: "github-app",
        clientId: state.clientId,
        clientSecret: state.clientSecret,
        refreshToken: currentAuthentication.refreshToken,
        request: state.request
      });
      state.authentication = {
        tokenType: "oauth",
        type: "token",
        ...authentication
      };
    }
  }
  if (options.type === "refresh") {
    if (state.clientType === "oauth-app") {
      throw new Error(
        "[@octokit/auth-oauth-user] OAuth Apps do not support expiring tokens"
      );
    }
    if (!currentAuthentication.hasOwnProperty("expiresAt")) {
      throw new Error("[@octokit/auth-oauth-user] Refresh token missing");
    }
    await state.onTokenCreated?.(state.authentication, {
      type: options.type
    });
  }
  if (options.type === "check" || options.type === "reset") {
    const method = options.type === "check" ? checkToken : resetToken;
    try {
      const { authentication } = await method({
        // @ts-expect-error making TS happy would require unnecessary code so no
        clientType: state.clientType,
        clientId: state.clientId,
        clientSecret: state.clientSecret,
        token: state.authentication.token,
        request: state.request
      });
      state.authentication = {
        tokenType: "oauth",
        type: "token",
        // @ts-expect-error TBD
        ...authentication
      };
      if (options.type === "reset") {
        await state.onTokenCreated?.(state.authentication, {
          type: options.type
        });
      }
      return state.authentication;
    } catch (error) {
      if (error.status === 404) {
        error.message = "[@octokit/auth-oauth-user] Token is invalid";
        state.authentication.invalid = true;
      }
      throw error;
    }
  }
  if (options.type === "delete" || options.type === "deleteAuthorization") {
    const method = options.type === "delete" ? deleteToken : deleteAuthorization;
    try {
      await method({
        // @ts-expect-error making TS happy would require unnecessary code so no
        clientType: state.clientType,
        clientId: state.clientId,
        clientSecret: state.clientSecret,
        token: state.authentication.token,
        request: state.request
      });
    } catch (error) {
      if (error.status !== 404) throw error;
    }
    state.authentication.invalid = true;
    return state.authentication;
  }
  return state.authentication;
}
var ROUTES_REQUIRING_BASIC_AUTH = /\/applications\/[^/]+\/(token|grant)s?/;
function requiresBasicAuth(url) {
  return url && ROUTES_REQUIRING_BASIC_AUTH.test(url);
}
async function hook3(state, request2, route, parameters = {}) {
  const endpoint2 = request2.endpoint.merge(
    route,
    parameters
  );
  if (/\/login\/(oauth\/access_token|device\/code)$/.test(endpoint2.url)) {
    return request2(endpoint2);
  }
  if (requiresBasicAuth(endpoint2.url)) {
    const credentials = btoa(`${state.clientId}:${state.clientSecret}`);
    endpoint2.headers.authorization = `basic ${credentials}`;
    return request2(endpoint2);
  }
  const { token } = state.clientType === "oauth-app" ? await auth3({ ...state, request: request2 }) : await auth3({ ...state, request: request2 });
  endpoint2.headers.authorization = "token " + token;
  return request2(endpoint2);
}
function createOAuthUserAuth({
  clientId,
  clientSecret,
  clientType = "oauth-app",
  request: request2 = request.defaults({
    headers: {
      "user-agent": `octokit-auth-oauth-app.js/${VERSION10} ${getUserAgent()}`
    }
  }),
  onTokenCreated,
  ...strategyOptions
}) {
  const state = Object.assign({
    clientType,
    clientId,
    clientSecret,
    onTokenCreated,
    strategyOptions,
    request: request2
  });
  return Object.assign(auth3.bind(null, state), {
    // @ts-expect-error not worth the extra code needed to appease TS
    hook: hook3.bind(null, state)
  });
}
createOAuthUserAuth.VERSION = VERSION10;

// node_modules/.pnpm/@octokit+auth-oauth-app@9.0.5/node_modules/@octokit/auth-oauth-app/dist-bundle/index.js
async function auth4(state, authOptions) {
  if (authOptions.type === "oauth-app") {
    return {
      type: "oauth-app",
      clientId: state.clientId,
      clientSecret: state.clientSecret,
      clientType: state.clientType,
      headers: {
        authorization: `basic ${btoa(
          `${state.clientId}:${state.clientSecret}`
        )}`
      }
    };
  }
  if ("factory" in authOptions) {
    const { type, ...options } = {
      ...authOptions,
      ...state
    };
    return authOptions.factory(options);
  }
  const common = {
    clientId: state.clientId,
    clientSecret: state.clientSecret,
    request: state.request,
    ...authOptions
  };
  const userAuth = state.clientType === "oauth-app" ? await createOAuthUserAuth({
    ...common,
    clientType: state.clientType
  }) : await createOAuthUserAuth({
    ...common,
    clientType: state.clientType
  });
  return userAuth();
}
async function hook4(state, request2, route, parameters) {
  let endpoint2 = request2.endpoint.merge(
    route,
    parameters
  );
  if (/\/login\/(oauth\/access_token|device\/code)$/.test(endpoint2.url)) {
    return request2(endpoint2);
  }
  if (state.clientType === "github-app" && !requiresBasicAuth(endpoint2.url)) {
    throw new Error(
      `[@octokit/auth-oauth-app] GitHub Apps cannot use their client ID/secret for basic authentication for endpoints other than "/applications/{client_id}/**". "${endpoint2.method} ${endpoint2.url}" is not supported.`
    );
  }
  const credentials = btoa(`${state.clientId}:${state.clientSecret}`);
  endpoint2.headers.authorization = `basic ${credentials}`;
  try {
    return await request2(endpoint2);
  } catch (error) {
    if (error.status !== 401) throw error;
    error.message = `[@octokit/auth-oauth-app] "${endpoint2.method} ${endpoint2.url}" does not support clientId/clientSecret basic authentication.`;
    throw error;
  }
}
var VERSION11 = "0.0.0-development";
function createOAuthAppAuth(options) {
  const state = Object.assign(
    {
      request: request.defaults({
        headers: {
          "user-agent": `octokit-auth-oauth-app.js/${VERSION11} ${getUserAgent()}`
        }
      }),
      clientType: "oauth-app"
    },
    options
  );
  return Object.assign(auth4.bind(null, state), {
    hook: hook4.bind(null, state)
  });
}

// node_modules/.pnpm/universal-github-app-jwt@2.2.2/node_modules/universal-github-app-jwt/lib/utils.js
function isPkcs1(privateKey) {
  return privateKey.includes("-----BEGIN RSA PRIVATE KEY-----");
}
function isOpenSsh(privateKey) {
  return privateKey.includes("-----BEGIN OPENSSH PRIVATE KEY-----");
}
function string2ArrayBuffer(str2) {
  const buf = new ArrayBuffer(str2.length);
  const bufView = new Uint8Array(buf);
  for (let i = 0, strLen = str2.length; i < strLen; i++) {
    bufView[i] = str2.charCodeAt(i);
  }
  return buf;
}
function getDERfromPEM(pem) {
  const pemB64 = pem.trim().split("\n").slice(1, -1).join("");
  const decoded = atob(pemB64);
  return string2ArrayBuffer(decoded);
}
function getEncodedMessage(header, payload) {
  return `${base64encodeJSON(header)}.${base64encodeJSON(payload)}`;
}
function base64encode(buffer) {
  var binary = "";
  var bytes = new Uint8Array(buffer);
  var len = bytes.byteLength;
  for (var i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return fromBase64(btoa(binary));
}
function fromBase64(base64) {
  return base64.replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}
function base64encodeJSON(obj2) {
  return fromBase64(btoa(JSON.stringify(obj2)));
}

// node_modules/.pnpm/universal-github-app-jwt@2.2.2/node_modules/universal-github-app-jwt/lib/crypto-node.js
import { subtle } from "node:crypto";
import { createPrivateKey } from "node:crypto";
function convertPrivateKey(privateKey) {
  if (!isPkcs1(privateKey)) return privateKey;
  return createPrivateKey(privateKey).export({
    type: "pkcs8",
    format: "pem"
  });
}

// node_modules/.pnpm/universal-github-app-jwt@2.2.2/node_modules/universal-github-app-jwt/lib/get-token.js
async function getToken({ privateKey, payload }) {
  const convertedPrivateKey = convertPrivateKey(privateKey);
  if (isPkcs1(convertedPrivateKey)) {
    throw new Error(
      "[universal-github-app-jwt] Private Key is in PKCS#1 format, but only PKCS#8 is supported. See https://github.com/gr2m/universal-github-app-jwt#private-key-formats"
    );
  }
  if (isOpenSsh(convertedPrivateKey)) {
    throw new Error(
      "[universal-github-app-jwt] Private Key is in OpenSSH format, but only PKCS#8 is supported. See https://github.com/gr2m/universal-github-app-jwt#private-key-formats"
    );
  }
  const algorithm = {
    name: "RSASSA-PKCS1-v1_5",
    hash: { name: "SHA-256" }
  };
  const header = { alg: "RS256", typ: "JWT" };
  const privateKeyDER = getDERfromPEM(convertedPrivateKey);
  const importedKey = await subtle.importKey(
    "pkcs8",
    privateKeyDER,
    algorithm,
    false,
    ["sign"]
  );
  const encodedMessage = getEncodedMessage(header, payload);
  const encodedMessageArrBuf = string2ArrayBuffer(encodedMessage);
  const signatureArrBuf = await subtle.sign(
    algorithm.name,
    importedKey,
    encodedMessageArrBuf
  );
  const encodedSignature = base64encode(signatureArrBuf);
  return `${encodedMessage}.${encodedSignature}`;
}

// node_modules/.pnpm/universal-github-app-jwt@2.2.2/node_modules/universal-github-app-jwt/index.js
async function githubAppJwt({
  id,
  privateKey,
  now = Math.floor(Date.now() / 1e3)
}) {
  const privateKeyWithNewlines = privateKey.replace(/\\n/g, "\n");
  const nowWithSafetyMargin = now - 30;
  const expiration = nowWithSafetyMargin + 60 * 10;
  const payload = {
    iat: nowWithSafetyMargin,
    // Issued at time
    exp: expiration,
    iss: id
  };
  const token = await getToken({
    privateKey: privateKeyWithNewlines,
    payload
  });
  return {
    appId: id,
    expiration,
    token
  };
}

// node_modules/.pnpm/toad-cache@3.7.4/node_modules/toad-cache/dist/toad-cache.mjs
function validateCacheParams(max, ttlInMsecs) {
  if (typeof max !== "number" || !Number.isInteger(max) || max < 0) {
    throw new Error("Invalid max value");
  }
  if (typeof ttlInMsecs !== "number" || !Number.isInteger(ttlInMsecs) || ttlInMsecs < 0) {
    throw new Error("Invalid ttl value");
  }
}
var LruObject = class {
  constructor(max = 1e3, ttlInMsecs = 0) {
    validateCacheParams(max, ttlInMsecs);
    this.first = null;
    this.items = /* @__PURE__ */ Object.create(null);
    this.last = null;
    this.size = 0;
    this.max = max;
    this.ttl = ttlInMsecs;
  }
  bumpLru(item) {
    if (this.last === item) {
      return;
    }
    const last = this.last;
    const next = item.next;
    const prev = item.prev;
    if (this.first === item) {
      this.first = next;
    }
    item.next = null;
    item.prev = last;
    last.next = item;
    if (prev !== null) {
      prev.next = next;
    }
    if (next !== null) {
      next.prev = prev;
    }
    this.last = item;
  }
  clear() {
    this.items = /* @__PURE__ */ Object.create(null);
    this.first = null;
    this.last = null;
    this.size = 0;
  }
  delete(key) {
    const item = this.items[key];
    if (item !== void 0) {
      delete this.items[key];
      this.size--;
      if (item.prev !== null) {
        item.prev.next = item.next;
      }
      if (item.next !== null) {
        item.next.prev = item.prev;
      }
      if (this.first === item) {
        this.first = item.next;
      }
      if (this.last === item) {
        this.last = item.prev;
      }
    }
  }
  deleteMany(keys) {
    for (var i = 0; i < keys.length; i++) {
      this.delete(keys[i]);
    }
  }
  evict() {
    if (this.size > 0) {
      const item = this.first;
      delete this.items[item.key];
      if (--this.size === 0) {
        this.first = null;
        this.last = null;
      } else {
        this.first = item.next;
        this.first.prev = null;
      }
    }
  }
  expiresAt(key) {
    const item = this.items[key];
    if (item !== void 0) {
      return item.expiry;
    }
  }
  get(key) {
    const item = this.items[key];
    if (item !== void 0) {
      if (this.ttl > 0 && item.expiry <= Date.now()) {
        this.delete(key);
        return;
      }
      this.bumpLru(item);
      return item.value;
    }
  }
  getMany(keys) {
    const result = new Array(keys.length);
    for (var i = 0; i < keys.length; i++) {
      result[i] = this.get(keys[i]);
    }
    return result;
  }
  keys() {
    return Object.keys(this.items);
  }
  set(key, value) {
    const existing = this.items[key];
    if (existing !== void 0) {
      existing.value = value;
      existing.expiry = this.ttl > 0 ? Date.now() + this.ttl : this.ttl;
      this.bumpLru(existing);
      return;
    }
    if (this.max > 0 && this.size >= this.max) {
      this.evict();
    }
    const item = {
      expiry: this.ttl > 0 ? Date.now() + this.ttl : this.ttl,
      key,
      prev: this.last,
      next: null,
      value
    };
    this.items[key] = item;
    if (++this.size === 1) {
      this.first = item;
    } else {
      this.last.next = item;
    }
    this.last = item;
  }
};

// node_modules/.pnpm/@octokit+auth-app@8.3.1/node_modules/@octokit/auth-app/dist-node/index.js
async function getAppAuthentication({
  appId,
  privateKey,
  timeDifference,
  createJwt
}) {
  try {
    if (createJwt) {
      const { jwt, expiresAt } = await createJwt(appId, timeDifference);
      return {
        type: "app",
        token: jwt,
        appId,
        expiresAt
      };
    }
    const authOptions = {
      id: appId,
      privateKey
    };
    if (timeDifference) {
      Object.assign(authOptions, {
        now: Math.floor(Date.now() / 1e3) + timeDifference
      });
    }
    const appAuthentication = await githubAppJwt(authOptions);
    return {
      type: "app",
      token: appAuthentication.token,
      appId: appAuthentication.appId,
      expiresAt: new Date(appAuthentication.expiration * 1e3).toISOString()
    };
  } catch (error) {
    if (privateKey === "-----BEGIN RSA PRIVATE KEY-----") {
      throw new Error(
        "The 'privateKey` option contains only the first line '-----BEGIN RSA PRIVATE KEY-----'. If you are setting it using a `.env` file, make sure it is set on a single line with newlines replaced by '\n'"
      );
    } else {
      throw error;
    }
  }
}
function getCache() {
  return new LruObject(
    // cache max. 15000 tokens, that will use less than 10mb memory
    15e3,
    // Cache for 1 minute less than GitHub expiry
    1e3 * 60 * 59
  );
}
async function get2(cache, options) {
  const cacheKey = optionsToCacheKey(options);
  const result = await cache.get(cacheKey);
  if (!result) {
    return;
  }
  const [
    token,
    createdAt,
    expiresAt,
    repositorySelection,
    permissionsString,
    singleFileName
  ] = result.split("|");
  const permissions = options.permissions || permissionsString.split(/,/).reduce((permissions2, string) => {
    if (/!$/.test(string)) {
      permissions2[string.slice(0, -1)] = "write";
    } else {
      permissions2[string] = "read";
    }
    return permissions2;
  }, {});
  return {
    token,
    createdAt,
    expiresAt,
    permissions,
    repositoryIds: options.repositoryIds,
    repositoryNames: options.repositoryNames,
    singleFileName,
    repositorySelection
  };
}
async function set2(cache, options, data) {
  const key = optionsToCacheKey(options);
  const permissionsString = options.permissions ? "" : Object.keys(data.permissions).map(
    (name) => `${name}${data.permissions[name] === "write" ? "!" : ""}`
  ).join(",");
  const value = [
    data.token,
    data.createdAt,
    data.expiresAt,
    data.repositorySelection,
    permissionsString,
    data.singleFileName
  ].join("|");
  await cache.set(key, value);
}
function optionsToCacheKey({
  installationId,
  permissions = {},
  repositoryIds = [],
  repositoryNames = []
}) {
  const permissionsString = Object.keys(permissions).sort().map((name) => permissions[name] === "read" ? name : `${name}!`).join(",");
  const repositoryIdsString = repositoryIds.sort().join(",");
  const repositoryNamesString = repositoryNames.join(",");
  return [
    installationId,
    repositoryIdsString,
    repositoryNamesString,
    permissionsString
  ].filter(Boolean).join("|");
}
function toTokenAuthentication({
  installationId,
  token,
  createdAt,
  expiresAt,
  repositorySelection,
  permissions,
  repositoryIds,
  repositoryNames,
  singleFileName
}) {
  return Object.assign(
    {
      type: "token",
      tokenType: "installation",
      token,
      installationId,
      permissions,
      createdAt,
      expiresAt,
      repositorySelection
    },
    repositoryIds ? { repositoryIds } : null,
    repositoryNames ? { repositoryNames } : null,
    singleFileName ? { singleFileName } : null
  );
}
async function getInstallationAuthentication(state, options, customRequest) {
  const installationId = Number(options.installationId || state.installationId);
  if (!installationId) {
    throw new Error(
      "[@octokit/auth-app] installationId option is required for installation authentication."
    );
  }
  if (options.factory) {
    const { type, factory, oauthApp, ...factoryAuthOptions } = {
      ...state,
      ...options
    };
    return factory(factoryAuthOptions);
  }
  const request2 = customRequest || state.request;
  return getInstallationAuthenticationConcurrently(
    state,
    { ...options, installationId },
    request2
  );
}
var pendingPromises = /* @__PURE__ */ new Map();
function getInstallationAuthenticationConcurrently(state, options, request2) {
  const cacheKey = optionsToCacheKey(options);
  if (pendingPromises.has(cacheKey)) {
    return pendingPromises.get(cacheKey);
  }
  const promise = getInstallationAuthenticationImpl(
    state,
    options,
    request2
  ).finally(() => pendingPromises.delete(cacheKey));
  pendingPromises.set(cacheKey, promise);
  return promise;
}
async function getInstallationAuthenticationImpl(state, options, request2) {
  if (!options.refresh) {
    const result = await get2(state.cache, options);
    if (result) {
      const {
        token: token2,
        createdAt: createdAt2,
        expiresAt: expiresAt2,
        permissions: permissions2,
        repositoryIds: repositoryIds2,
        repositoryNames: repositoryNames2,
        singleFileName: singleFileName2,
        repositorySelection: repositorySelection2
      } = result;
      return toTokenAuthentication({
        installationId: options.installationId,
        token: token2,
        createdAt: createdAt2,
        expiresAt: expiresAt2,
        permissions: permissions2,
        repositorySelection: repositorySelection2,
        repositoryIds: repositoryIds2,
        repositoryNames: repositoryNames2,
        singleFileName: singleFileName2
      });
    }
  }
  const appAuthentication = await getAppAuthentication(state);
  const payload = {
    installation_id: options.installationId,
    mediaType: {
      previews: ["machine-man"]
    },
    headers: {
      authorization: `bearer ${appAuthentication.token}`
    }
  };
  if (options.repositoryIds) {
    Object.assign(payload, { repository_ids: options.repositoryIds });
  }
  if (options.repositoryNames) {
    Object.assign(payload, {
      repositories: options.repositoryNames
    });
  }
  if (options.permissions) {
    Object.assign(payload, { permissions: options.permissions });
  }
  const {
    data: {
      token,
      expires_at: expiresAt,
      repositories,
      permissions: permissionsOptional,
      repository_selection: repositorySelectionOptional,
      single_file: singleFileName
    }
  } = await request2(
    "POST /app/installations/{installation_id}/access_tokens",
    payload
  );
  const permissions = permissionsOptional || {};
  const repositorySelection = repositorySelectionOptional || "all";
  const repositoryIds = repositories ? repositories.map((r) => r.id) : void 0;
  const repositoryNames = repositories ? repositories.map((repo) => repo.name) : void 0;
  const createdAt = (/* @__PURE__ */ new Date()).toISOString();
  const cacheOptions = {
    token,
    createdAt,
    expiresAt,
    repositorySelection,
    permissions,
    repositoryIds,
    repositoryNames
  };
  if (singleFileName) {
    Object.assign(payload, { singleFileName });
  }
  await set2(state.cache, options, cacheOptions);
  const cacheData = {
    installationId: options.installationId,
    token,
    createdAt,
    expiresAt,
    repositorySelection,
    permissions,
    repositoryIds,
    repositoryNames
  };
  if (singleFileName) {
    Object.assign(cacheData, { singleFileName });
  }
  return toTokenAuthentication(cacheData);
}
async function auth5(state, authOptions) {
  switch (authOptions.type) {
    case "app":
      return getAppAuthentication(state);
    case "oauth-app":
      return state.oauthApp({ type: "oauth-app" });
    case "installation":
      authOptions;
      return getInstallationAuthentication(state, {
        ...authOptions,
        type: "installation"
      });
    case "oauth-user":
      return state.oauthApp(authOptions);
    default:
      throw new Error(`Invalid auth type: ${authOptions.type}`);
  }
}
var PATHS = [
  "/app",
  "/app/hook/config",
  "/app/hook/deliveries",
  "/app/hook/deliveries/{delivery_id}",
  "/app/hook/deliveries/{delivery_id}/attempts",
  "/app/installations",
  "/app/installations/{installation_id}",
  "/app/installations/{installation_id}/access_tokens",
  "/app/installations/{installation_id}/suspended",
  "/app/installation-requests",
  "/marketplace_listing/accounts/{account_id}",
  "/marketplace_listing/plan",
  "/marketplace_listing/plans",
  "/marketplace_listing/plans/{plan_id}/accounts",
  "/marketplace_listing/stubbed/accounts/{account_id}",
  "/marketplace_listing/stubbed/plan",
  "/marketplace_listing/stubbed/plans",
  "/marketplace_listing/stubbed/plans/{plan_id}/accounts",
  "/orgs/{org}/installation",
  "/repos/{owner}/{repo}/installation",
  "/users/{username}/installation",
  "/enterprises/{enterprise}/installation"
];
function routeMatcher2(paths) {
  const regexes = paths.map(
    (p) => p.split("/").map((c) => c.startsWith("{") ? "(?:.+?)" : c).join("/")
  );
  const regex2 = `^(?:${regexes.map((r) => `(?:${r})`).join("|")})$`;
  return new RegExp(regex2, "i");
}
var REGEX = routeMatcher2(PATHS);
function requiresAppAuth(url) {
  return !!url && REGEX.test(url.split("?")[0]);
}
var FIVE_SECONDS_IN_MS = 5 * 1e3;
function isNotTimeSkewError(error) {
  return !(error.message.match(
    /'Expiration time' claim \('exp'\) is too far in the future/
  ) || error.message.match(
    /'Expiration time' claim \('exp'\) must be a numeric value representing the future time at which the assertion expires/
  ) || error.message.match(
    /'Issued at' claim \('iat'\) must be an Integer representing the time that the assertion was issued/
  ));
}
async function hook5(state, request2, route, parameters) {
  const endpoint2 = request2.endpoint.merge(route, parameters);
  const url = endpoint2.url;
  if (/\/login\/oauth\/access_token$/.test(url)) {
    return request2(endpoint2);
  }
  if (requiresAppAuth(url.replace(request2.endpoint.DEFAULTS.baseUrl, ""))) {
    const { token: token2 } = await getAppAuthentication(state);
    endpoint2.headers.authorization = `bearer ${token2}`;
    let response;
    try {
      response = await request2(endpoint2);
    } catch (error) {
      if (isNotTimeSkewError(error)) {
        throw error;
      }
      if (typeof error.response.headers.date === "undefined") {
        throw error;
      }
      const diff = Math.floor(
        (Date.parse(error.response.headers.date) - Date.parse((/* @__PURE__ */ new Date()).toString())) / 1e3
      );
      state.log.warn(error.message);
      state.log.warn(
        `[@octokit/auth-app] GitHub API time and system time are different by ${diff} seconds. Retrying request with the difference accounted for.`
      );
      const { token: token3 } = await getAppAuthentication({
        ...state,
        timeDifference: diff
      });
      endpoint2.headers.authorization = `bearer ${token3}`;
      return request2(endpoint2);
    }
    return response;
  }
  if (requiresBasicAuth(url)) {
    const authentication = await state.oauthApp({ type: "oauth-app" });
    endpoint2.headers.authorization = authentication.headers.authorization;
    return request2(endpoint2);
  }
  const { token, createdAt } = await getInstallationAuthentication(
    state,
    // @ts-expect-error TBD
    {},
    request2.defaults({ baseUrl: endpoint2.baseUrl })
  );
  endpoint2.headers.authorization = `token ${token}`;
  return sendRequestWithRetries(
    state,
    request2,
    endpoint2,
    createdAt
  );
}
async function sendRequestWithRetries(state, request2, options, createdAt, retries = 0) {
  const timeSinceTokenCreationInMs = +/* @__PURE__ */ new Date() - +new Date(createdAt);
  try {
    return await request2(options);
  } catch (error) {
    if (error.status !== 401) {
      throw error;
    }
    if (timeSinceTokenCreationInMs >= FIVE_SECONDS_IN_MS) {
      if (retries > 0) {
        error.message = `After ${retries} retries within ${timeSinceTokenCreationInMs / 1e3}s of creating the installation access token, the response remains 401. At this point, the cause may be an authentication problem or a system outage. Please check https://www.githubstatus.com for status information`;
      }
      throw error;
    }
    ++retries;
    const awaitTime = retries * 1e3;
    state.log.warn(
      `[@octokit/auth-app] Retrying after 401 response to account for token replication delay (retry: ${retries}, wait: ${awaitTime / 1e3}s)`
    );
    await new Promise((resolve) => setTimeout(resolve, awaitTime));
    return sendRequestWithRetries(state, request2, options, createdAt, retries);
  }
}
var VERSION12 = "8.3.1";
function createAppAuth(options) {
  if (!options.appId) {
    throw new Error("[@octokit/auth-app] appId option is required");
  }
  if (!options.privateKey && !options.createJwt) {
    throw new Error("[@octokit/auth-app] privateKey option is required");
  } else if (options.privateKey && options.createJwt) {
    throw new Error(
      "[@octokit/auth-app] privateKey and createJwt options are mutually exclusive"
    );
  }
  if ("installationId" in options && !options.installationId) {
    throw new Error(
      "[@octokit/auth-app] installationId is set to a falsy value"
    );
  }
  const log = options.log || {};
  if (typeof log.warn !== "function") {
    log.warn = console.warn.bind(console);
  }
  const request2 = options.request || request.defaults({
    headers: {
      "user-agent": `octokit-auth-app.js/${VERSION12} ${getUserAgent()}`
    }
  });
  const state = Object.assign(
    {
      request: request2,
      cache: getCache()
    },
    options,
    options.installationId ? { installationId: Number(options.installationId) } : {},
    {
      log,
      oauthApp: createOAuthAppAuth({
        clientType: "github-app",
        clientId: options.clientId || "",
        clientSecret: options.clientSecret || "",
        request: request2
      })
    }
  );
  return Object.assign(auth5.bind(null, state), {
    hook: hook5.bind(null, state)
  });
}

// node_modules/.pnpm/@octokit+auth-unauthenticated@7.0.5/node_modules/@octokit/auth-unauthenticated/dist-node/index.js
async function auth6(reason) {
  return {
    type: "unauthenticated",
    reason
  };
}
function isRateLimitError(error) {
  if (error.status !== 403) {
    return false;
  }
  if (!error.response) {
    return false;
  }
  return error.response.headers["x-ratelimit-remaining"] === "0";
}
var REGEX_ABUSE_LIMIT_MESSAGE = /\babuse\b/i;
function isAbuseLimitError(error) {
  if (error.status !== 403) {
    return false;
  }
  return REGEX_ABUSE_LIMIT_MESSAGE.test(error.message);
}
async function hook6(reason, request2, route, parameters) {
  const endpoint2 = request2.endpoint.merge(
    route,
    parameters
  );
  return request2(endpoint2).catch((error) => {
    if (error.status === 404) {
      error.message = `Not found. May be due to lack of authentication. Reason: ${reason}`;
      throw error;
    }
    if (isRateLimitError(error)) {
      error.message = `API rate limit exceeded. This maybe caused by the lack of authentication. Reason: ${reason}`;
      throw error;
    }
    if (isAbuseLimitError(error)) {
      error.message = `You have triggered an abuse detection mechanism. This maybe caused by the lack of authentication. Reason: ${reason}`;
      throw error;
    }
    if (error.status === 401) {
      error.message = `Unauthorized. "${endpoint2.method} ${endpoint2.url}" failed most likely due to lack of authentication. Reason: ${reason}`;
      throw error;
    }
    if (error.status >= 400 && error.status < 500) {
      error.message = error.message.replace(
        /\.?$/,
        `. May be caused by lack of authentication (${reason}).`
      );
    }
    throw error;
  });
}
var createUnauthenticatedAuth = function createUnauthenticatedAuth2(options) {
  if (!options || !options.reason) {
    throw new Error(
      "[@octokit/auth-unauthenticated] No reason passed to createUnauthenticatedAuth"
    );
  }
  return Object.assign(auth6.bind(null, options.reason), {
    hook: hook6.bind(null, options.reason)
  });
};

// node_modules/.pnpm/@octokit+oauth-app@8.0.4/node_modules/@octokit/oauth-app/dist-node/index.js
var VERSION13 = "8.0.4";
function addEventHandler(state, eventName, eventHandler) {
  if (Array.isArray(eventName)) {
    for (const singleEventName of eventName) {
      addEventHandler(state, singleEventName, eventHandler);
    }
    return;
  }
  if (!state.eventHandlers[eventName]) {
    state.eventHandlers[eventName] = [];
  }
  state.eventHandlers[eventName].push(eventHandler);
}
var OAuthAppOctokit = Octokit.defaults({
  userAgent: `octokit-oauth-app.js/${VERSION13} ${getUserAgent()}`
});
async function emitEvent(state, context) {
  const { name, action } = context;
  if (state.eventHandlers[`${name}.${action}`]) {
    for (const eventHandler of state.eventHandlers[`${name}.${action}`]) {
      await eventHandler(context);
    }
  }
  if (state.eventHandlers[name]) {
    for (const eventHandler of state.eventHandlers[name]) {
      await eventHandler(context);
    }
  }
}
async function getUserOctokitWithState(state, options) {
  return state.octokit.auth({
    type: "oauth-user",
    ...options,
    async factory(options2) {
      const octokit = new state.Octokit({
        authStrategy: createOAuthUserAuth,
        auth: options2
      });
      const authentication = await octokit.auth({
        type: "get"
      });
      await emitEvent(state, {
        name: "token",
        action: "created",
        token: authentication.token,
        scopes: authentication.scopes,
        authentication,
        octokit
      });
      return octokit;
    }
  });
}
function getWebFlowAuthorizationUrlWithState(state, options) {
  const optionsWithDefaults = {
    clientId: state.clientId,
    request: state.octokit.request,
    ...options,
    allowSignup: state.allowSignup ?? options.allowSignup,
    redirectUrl: options.redirectUrl ?? state.redirectUrl,
    scopes: options.scopes ?? state.defaultScopes
  };
  return getWebFlowAuthorizationUrl({
    clientType: state.clientType,
    ...optionsWithDefaults
  });
}
async function createTokenWithState(state, options) {
  const authentication = await state.octokit.auth({
    type: "oauth-user",
    ...options
  });
  await emitEvent(state, {
    name: "token",
    action: "created",
    token: authentication.token,
    scopes: authentication.scopes,
    authentication,
    octokit: new state.Octokit({
      authStrategy: createOAuthUserAuth,
      auth: {
        clientType: state.clientType,
        clientId: state.clientId,
        clientSecret: state.clientSecret,
        token: authentication.token,
        scopes: authentication.scopes,
        refreshToken: authentication.refreshToken,
        expiresAt: authentication.expiresAt,
        refreshTokenExpiresAt: authentication.refreshTokenExpiresAt
      }
    })
  });
  return { authentication };
}
async function checkTokenWithState(state, options) {
  const result = await checkToken({
    // @ts-expect-error not worth the extra code to appease TS
    clientType: state.clientType,
    clientId: state.clientId,
    clientSecret: state.clientSecret,
    request: state.octokit.request,
    ...options
  });
  Object.assign(result.authentication, { type: "token", tokenType: "oauth" });
  return result;
}
async function resetTokenWithState(state, options) {
  const optionsWithDefaults = {
    clientId: state.clientId,
    clientSecret: state.clientSecret,
    request: state.octokit.request,
    ...options
  };
  if (state.clientType === "oauth-app") {
    const response2 = await resetToken({
      clientType: "oauth-app",
      ...optionsWithDefaults
    });
    const authentication2 = Object.assign(response2.authentication, {
      type: "token",
      tokenType: "oauth"
    });
    await emitEvent(state, {
      name: "token",
      action: "reset",
      token: response2.authentication.token,
      scopes: response2.authentication.scopes || void 0,
      authentication: authentication2,
      octokit: new state.Octokit({
        authStrategy: createOAuthUserAuth,
        auth: {
          clientType: state.clientType,
          clientId: state.clientId,
          clientSecret: state.clientSecret,
          token: response2.authentication.token,
          scopes: response2.authentication.scopes
        }
      })
    });
    return { ...response2, authentication: authentication2 };
  }
  const response = await resetToken({
    clientType: "github-app",
    ...optionsWithDefaults
  });
  const authentication = Object.assign(response.authentication, {
    type: "token",
    tokenType: "oauth"
  });
  await emitEvent(state, {
    name: "token",
    action: "reset",
    token: response.authentication.token,
    authentication,
    octokit: new state.Octokit({
      authStrategy: createOAuthUserAuth,
      auth: {
        clientType: state.clientType,
        clientId: state.clientId,
        clientSecret: state.clientSecret,
        token: response.authentication.token
      }
    })
  });
  return { ...response, authentication };
}
async function refreshTokenWithState(state, options) {
  if (state.clientType === "oauth-app") {
    throw new Error(
      "[@octokit/oauth-app] app.refreshToken() is not supported for OAuth Apps"
    );
  }
  const response = await refreshToken({
    clientType: "github-app",
    clientId: state.clientId,
    clientSecret: state.clientSecret,
    request: state.octokit.request,
    refreshToken: options.refreshToken
  });
  const authentication = Object.assign(response.authentication, {
    type: "token",
    tokenType: "oauth"
  });
  await emitEvent(state, {
    name: "token",
    action: "refreshed",
    token: response.authentication.token,
    authentication,
    octokit: new state.Octokit({
      authStrategy: createOAuthUserAuth,
      auth: {
        clientType: state.clientType,
        clientId: state.clientId,
        clientSecret: state.clientSecret,
        token: response.authentication.token
      }
    })
  });
  return { ...response, authentication };
}
async function scopeTokenWithState(state, options) {
  if (state.clientType === "oauth-app") {
    throw new Error(
      "[@octokit/oauth-app] app.scopeToken() is not supported for OAuth Apps"
    );
  }
  const response = await scopeToken({
    clientType: "github-app",
    clientId: state.clientId,
    clientSecret: state.clientSecret,
    request: state.octokit.request,
    ...options
  });
  const authentication = Object.assign(response.authentication, {
    type: "token",
    tokenType: "oauth"
  });
  await emitEvent(state, {
    name: "token",
    action: "scoped",
    token: response.authentication.token,
    authentication,
    octokit: new state.Octokit({
      authStrategy: createOAuthUserAuth,
      auth: {
        clientType: state.clientType,
        clientId: state.clientId,
        clientSecret: state.clientSecret,
        token: response.authentication.token
      }
    })
  });
  return { ...response, authentication };
}
async function deleteTokenWithState(state, options) {
  const optionsWithDefaults = {
    clientId: state.clientId,
    clientSecret: state.clientSecret,
    request: state.octokit.request,
    ...options
  };
  const response = state.clientType === "oauth-app" ? await deleteToken({
    clientType: "oauth-app",
    ...optionsWithDefaults
  }) : (
    /* v8 ignore next 4 */
    await deleteToken({
      clientType: "github-app",
      ...optionsWithDefaults
    })
  );
  await emitEvent(state, {
    name: "token",
    action: "deleted",
    token: options.token,
    octokit: new state.Octokit({
      authStrategy: createUnauthenticatedAuth,
      auth: {
        reason: `Handling "token.deleted" event. The access for the token has been revoked.`
      }
    })
  });
  return response;
}
async function deleteAuthorizationWithState(state, options) {
  const optionsWithDefaults = {
    clientId: state.clientId,
    clientSecret: state.clientSecret,
    request: state.octokit.request,
    ...options
  };
  const response = state.clientType === "oauth-app" ? await deleteAuthorization({
    clientType: "oauth-app",
    ...optionsWithDefaults
  }) : (
    /* v8 ignore next 4 */
    await deleteAuthorization({
      clientType: "github-app",
      ...optionsWithDefaults
    })
  );
  await emitEvent(state, {
    name: "token",
    action: "deleted",
    token: options.token,
    octokit: new state.Octokit({
      authStrategy: createUnauthenticatedAuth,
      auth: {
        reason: `Handling "token.deleted" event. The access for the token has been revoked.`
      }
    })
  });
  await emitEvent(state, {
    name: "authorization",
    action: "deleted",
    token: options.token,
    octokit: new state.Octokit({
      authStrategy: createUnauthenticatedAuth,
      auth: {
        reason: `Handling "authorization.deleted" event. The access for the app has been revoked.`
      }
    })
  });
  return response;
}
var OAuthApp = class {
  static VERSION = VERSION13;
  static defaults(defaults) {
    const OAuthAppWithDefaults = class extends this {
      constructor(...args) {
        super({
          ...defaults,
          ...args[0]
        });
      }
    };
    return OAuthAppWithDefaults;
  }
  constructor(options) {
    const Octokit22 = options.Octokit || OAuthAppOctokit;
    this.type = options.clientType || "oauth-app";
    const octokit = new Octokit22({
      authStrategy: createOAuthAppAuth,
      auth: {
        clientType: this.type,
        clientId: options.clientId,
        clientSecret: options.clientSecret
      }
    });
    const state = {
      clientType: this.type,
      clientId: options.clientId,
      clientSecret: options.clientSecret,
      // @ts-expect-error defaultScopes not permitted for GitHub Apps
      defaultScopes: options.defaultScopes || [],
      allowSignup: options.allowSignup,
      baseUrl: options.baseUrl,
      redirectUrl: options.redirectUrl,
      log: options.log,
      Octokit: Octokit22,
      octokit,
      eventHandlers: {}
    };
    this.on = addEventHandler.bind(null, state);
    this.octokit = octokit;
    this.getUserOctokit = getUserOctokitWithState.bind(
      null,
      state
    );
    this.getWebFlowAuthorizationUrl = getWebFlowAuthorizationUrlWithState.bind(
      null,
      state
    );
    this.createToken = createTokenWithState.bind(
      null,
      state
    );
    this.checkToken = checkTokenWithState.bind(
      null,
      state
    );
    this.resetToken = resetTokenWithState.bind(
      null,
      state
    );
    this.refreshToken = refreshTokenWithState.bind(
      null,
      state
    );
    this.scopeToken = scopeTokenWithState.bind(
      null,
      state
    );
    this.deleteToken = deleteTokenWithState.bind(null, state);
    this.deleteAuthorization = deleteAuthorizationWithState.bind(null, state);
  }
  // assigned during constructor
  type;
  on;
  octokit;
  getUserOctokit;
  getWebFlowAuthorizationUrl;
  createToken;
  checkToken;
  resetToken;
  refreshToken;
  scopeToken;
  deleteToken;
  deleteAuthorization;
};

// node_modules/.pnpm/@octokit+webhooks-methods@6.0.0/node_modules/@octokit/webhooks-methods/dist-node/index.js
import { createHmac } from "node:crypto";
import { timingSafeEqual } from "node:crypto";
import { Buffer as Buffer2 } from "node:buffer";
var VERSION14 = "6.0.0";
async function sign(secret, payload) {
  if (!secret || !payload) {
    throw new TypeError(
      "[@octokit/webhooks-methods] secret & payload required for sign()"
    );
  }
  if (typeof payload !== "string") {
    throw new TypeError("[@octokit/webhooks-methods] payload must be a string");
  }
  const algorithm = "sha256";
  return `${algorithm}=${createHmac(algorithm, secret).update(payload).digest("hex")}`;
}
sign.VERSION = VERSION14;
async function verify2(secret, eventPayload, signature) {
  if (!secret || !eventPayload || !signature) {
    throw new TypeError(
      "[@octokit/webhooks-methods] secret, eventPayload & signature required"
    );
  }
  if (typeof eventPayload !== "string") {
    throw new TypeError(
      "[@octokit/webhooks-methods] eventPayload must be a string"
    );
  }
  const signatureBuffer = Buffer2.from(signature);
  const verificationBuffer = Buffer2.from(await sign(secret, eventPayload));
  if (signatureBuffer.length !== verificationBuffer.length) {
    return false;
  }
  return timingSafeEqual(signatureBuffer, verificationBuffer);
}
verify2.VERSION = VERSION14;
async function verifyWithFallback(secret, payload, signature, additionalSecrets) {
  const firstPass = await verify2(secret, payload, signature);
  if (firstPass) {
    return true;
  }
  if (additionalSecrets !== void 0) {
    for (const s of additionalSecrets) {
      const v = await verify2(s, payload, signature);
      if (v) {
        return v;
      }
    }
  }
  return false;
}

// node_modules/.pnpm/@octokit+webhooks@14.2.0/node_modules/@octokit/webhooks/dist-bundle/index.js
var createLogger2 = (logger = {}) => {
  if (typeof logger.debug !== "function") {
    logger.debug = () => {
    };
  }
  if (typeof logger.info !== "function") {
    logger.info = () => {
    };
  }
  if (typeof logger.warn !== "function") {
    logger.warn = console.warn.bind(console);
  }
  if (typeof logger.error !== "function") {
    logger.error = console.error.bind(console);
  }
  return logger;
};
var emitterEventNames = [
  "branch_protection_configuration",
  "branch_protection_configuration.disabled",
  "branch_protection_configuration.enabled",
  "branch_protection_rule",
  "branch_protection_rule.created",
  "branch_protection_rule.deleted",
  "branch_protection_rule.edited",
  "check_run",
  "check_run.completed",
  "check_run.created",
  "check_run.requested_action",
  "check_run.rerequested",
  "check_suite",
  "check_suite.completed",
  "check_suite.requested",
  "check_suite.rerequested",
  "code_scanning_alert",
  "code_scanning_alert.appeared_in_branch",
  "code_scanning_alert.closed_by_user",
  "code_scanning_alert.created",
  "code_scanning_alert.fixed",
  "code_scanning_alert.reopened",
  "code_scanning_alert.reopened_by_user",
  "commit_comment",
  "commit_comment.created",
  "create",
  "custom_property",
  "custom_property.created",
  "custom_property.deleted",
  "custom_property.promote_to_enterprise",
  "custom_property.updated",
  "custom_property_values",
  "custom_property_values.updated",
  "delete",
  "dependabot_alert",
  "dependabot_alert.auto_dismissed",
  "dependabot_alert.auto_reopened",
  "dependabot_alert.created",
  "dependabot_alert.dismissed",
  "dependabot_alert.fixed",
  "dependabot_alert.reintroduced",
  "dependabot_alert.reopened",
  "deploy_key",
  "deploy_key.created",
  "deploy_key.deleted",
  "deployment",
  "deployment.created",
  "deployment_protection_rule",
  "deployment_protection_rule.requested",
  "deployment_review",
  "deployment_review.approved",
  "deployment_review.rejected",
  "deployment_review.requested",
  "deployment_status",
  "deployment_status.created",
  "discussion",
  "discussion.answered",
  "discussion.category_changed",
  "discussion.closed",
  "discussion.created",
  "discussion.deleted",
  "discussion.edited",
  "discussion.labeled",
  "discussion.locked",
  "discussion.pinned",
  "discussion.reopened",
  "discussion.transferred",
  "discussion.unanswered",
  "discussion.unlabeled",
  "discussion.unlocked",
  "discussion.unpinned",
  "discussion_comment",
  "discussion_comment.created",
  "discussion_comment.deleted",
  "discussion_comment.edited",
  "fork",
  "github_app_authorization",
  "github_app_authorization.revoked",
  "gollum",
  "installation",
  "installation.created",
  "installation.deleted",
  "installation.new_permissions_accepted",
  "installation.suspend",
  "installation.unsuspend",
  "installation_repositories",
  "installation_repositories.added",
  "installation_repositories.removed",
  "installation_target",
  "installation_target.renamed",
  "issue_comment",
  "issue_comment.created",
  "issue_comment.deleted",
  "issue_comment.edited",
  "issue_dependencies",
  "issue_dependencies.blocked_by_added",
  "issue_dependencies.blocked_by_removed",
  "issue_dependencies.blocking_added",
  "issue_dependencies.blocking_removed",
  "issues",
  "issues.assigned",
  "issues.closed",
  "issues.deleted",
  "issues.demilestoned",
  "issues.edited",
  "issues.labeled",
  "issues.locked",
  "issues.milestoned",
  "issues.opened",
  "issues.pinned",
  "issues.reopened",
  "issues.transferred",
  "issues.typed",
  "issues.unassigned",
  "issues.unlabeled",
  "issues.unlocked",
  "issues.unpinned",
  "issues.untyped",
  "label",
  "label.created",
  "label.deleted",
  "label.edited",
  "marketplace_purchase",
  "marketplace_purchase.cancelled",
  "marketplace_purchase.changed",
  "marketplace_purchase.pending_change",
  "marketplace_purchase.pending_change_cancelled",
  "marketplace_purchase.purchased",
  "member",
  "member.added",
  "member.edited",
  "member.removed",
  "membership",
  "membership.added",
  "membership.removed",
  "merge_group",
  "merge_group.checks_requested",
  "merge_group.destroyed",
  "meta",
  "meta.deleted",
  "milestone",
  "milestone.closed",
  "milestone.created",
  "milestone.deleted",
  "milestone.edited",
  "milestone.opened",
  "org_block",
  "org_block.blocked",
  "org_block.unblocked",
  "organization",
  "organization.deleted",
  "organization.member_added",
  "organization.member_invited",
  "organization.member_removed",
  "organization.renamed",
  "package",
  "package.published",
  "package.updated",
  "page_build",
  "personal_access_token_request",
  "personal_access_token_request.approved",
  "personal_access_token_request.cancelled",
  "personal_access_token_request.created",
  "personal_access_token_request.denied",
  "ping",
  "project",
  "project.closed",
  "project.created",
  "project.deleted",
  "project.edited",
  "project.reopened",
  "project_card",
  "project_card.converted",
  "project_card.created",
  "project_card.deleted",
  "project_card.edited",
  "project_card.moved",
  "project_column",
  "project_column.created",
  "project_column.deleted",
  "project_column.edited",
  "project_column.moved",
  "projects_v2",
  "projects_v2.closed",
  "projects_v2.created",
  "projects_v2.deleted",
  "projects_v2.edited",
  "projects_v2.reopened",
  "projects_v2_item",
  "projects_v2_item.archived",
  "projects_v2_item.converted",
  "projects_v2_item.created",
  "projects_v2_item.deleted",
  "projects_v2_item.edited",
  "projects_v2_item.reordered",
  "projects_v2_item.restored",
  "projects_v2_status_update",
  "projects_v2_status_update.created",
  "projects_v2_status_update.deleted",
  "projects_v2_status_update.edited",
  "public",
  "pull_request",
  "pull_request.assigned",
  "pull_request.auto_merge_disabled",
  "pull_request.auto_merge_enabled",
  "pull_request.closed",
  "pull_request.converted_to_draft",
  "pull_request.demilestoned",
  "pull_request.dequeued",
  "pull_request.edited",
  "pull_request.enqueued",
  "pull_request.labeled",
  "pull_request.locked",
  "pull_request.milestoned",
  "pull_request.opened",
  "pull_request.ready_for_review",
  "pull_request.reopened",
  "pull_request.review_request_removed",
  "pull_request.review_requested",
  "pull_request.synchronize",
  "pull_request.unassigned",
  "pull_request.unlabeled",
  "pull_request.unlocked",
  "pull_request_review",
  "pull_request_review.dismissed",
  "pull_request_review.edited",
  "pull_request_review.submitted",
  "pull_request_review_comment",
  "pull_request_review_comment.created",
  "pull_request_review_comment.deleted",
  "pull_request_review_comment.edited",
  "pull_request_review_thread",
  "pull_request_review_thread.resolved",
  "pull_request_review_thread.unresolved",
  "push",
  "registry_package",
  "registry_package.published",
  "registry_package.updated",
  "release",
  "release.created",
  "release.deleted",
  "release.edited",
  "release.prereleased",
  "release.published",
  "release.released",
  "release.unpublished",
  "repository",
  "repository.archived",
  "repository.created",
  "repository.deleted",
  "repository.edited",
  "repository.privatized",
  "repository.publicized",
  "repository.renamed",
  "repository.transferred",
  "repository.unarchived",
  "repository_advisory",
  "repository_advisory.published",
  "repository_advisory.reported",
  "repository_dispatch",
  "repository_dispatch.sample.collected",
  "repository_import",
  "repository_ruleset",
  "repository_ruleset.created",
  "repository_ruleset.deleted",
  "repository_ruleset.edited",
  "repository_vulnerability_alert",
  "repository_vulnerability_alert.create",
  "repository_vulnerability_alert.dismiss",
  "repository_vulnerability_alert.reopen",
  "repository_vulnerability_alert.resolve",
  "secret_scanning_alert",
  "secret_scanning_alert.assigned",
  "secret_scanning_alert.created",
  "secret_scanning_alert.publicly_leaked",
  "secret_scanning_alert.reopened",
  "secret_scanning_alert.resolved",
  "secret_scanning_alert.unassigned",
  "secret_scanning_alert.validated",
  "secret_scanning_alert_location",
  "secret_scanning_alert_location.created",
  "secret_scanning_scan",
  "secret_scanning_scan.completed",
  "security_advisory",
  "security_advisory.published",
  "security_advisory.updated",
  "security_advisory.withdrawn",
  "security_and_analysis",
  "sponsorship",
  "sponsorship.cancelled",
  "sponsorship.created",
  "sponsorship.edited",
  "sponsorship.pending_cancellation",
  "sponsorship.pending_tier_change",
  "sponsorship.tier_changed",
  "star",
  "star.created",
  "star.deleted",
  "status",
  "sub_issues",
  "sub_issues.parent_issue_added",
  "sub_issues.parent_issue_removed",
  "sub_issues.sub_issue_added",
  "sub_issues.sub_issue_removed",
  "team",
  "team.added_to_repository",
  "team.created",
  "team.deleted",
  "team.edited",
  "team.removed_from_repository",
  "team_add",
  "watch",
  "watch.started",
  "workflow_dispatch",
  "workflow_job",
  "workflow_job.completed",
  "workflow_job.in_progress",
  "workflow_job.queued",
  "workflow_job.waiting",
  "workflow_run",
  "workflow_run.completed",
  "workflow_run.in_progress",
  "workflow_run.requested"
];
function validateEventName(eventName, options = {}) {
  if (typeof eventName !== "string") {
    throw new TypeError("eventName must be of type string");
  }
  if (eventName === "*") {
    throw new TypeError(
      `Using the "*" event with the regular Webhooks.on() function is not supported. Please use the Webhooks.onAny() method instead`
    );
  }
  if (eventName === "error") {
    throw new TypeError(
      `Using the "error" event with the regular Webhooks.on() function is not supported. Please use the Webhooks.onError() method instead`
    );
  }
  if (options.onUnknownEventName === "ignore") {
    return;
  }
  if (!emitterEventNames.includes(eventName)) {
    if (options.onUnknownEventName !== "warn") {
      throw new TypeError(
        `"${eventName}" is not a known webhook name (https://developer.github.com/v3/activity/events/types/)`
      );
    } else {
      (options.log || console).warn(
        `"${eventName}" is not a known webhook name (https://developer.github.com/v3/activity/events/types/)`
      );
    }
  }
}
function handleEventHandlers(state, webhookName, handler2) {
  if (!state.hooks[webhookName]) {
    state.hooks[webhookName] = [];
  }
  state.hooks[webhookName].push(handler2);
}
function receiverOn(state, webhookNameOrNames, handler2) {
  if (Array.isArray(webhookNameOrNames)) {
    webhookNameOrNames.forEach(
      (webhookName) => receiverOn(state, webhookName, handler2)
    );
    return;
  }
  validateEventName(webhookNameOrNames, {
    onUnknownEventName: "warn",
    log: state.log
  });
  handleEventHandlers(state, webhookNameOrNames, handler2);
}
function receiverOnAny(state, handler2) {
  handleEventHandlers(state, "*", handler2);
}
function receiverOnError(state, handler2) {
  handleEventHandlers(state, "error", handler2);
}
function wrapErrorHandler(handler2, error) {
  let returnValue;
  try {
    returnValue = handler2(error);
  } catch (error2) {
    console.log('FATAL: Error occurred in "error" event handler');
    console.log(error2);
  }
  if (returnValue && returnValue.catch) {
    returnValue.catch((error2) => {
      console.log('FATAL: Error occurred in "error" event handler');
      console.log(error2);
    });
  }
}
function getHooks(state, eventPayloadAction, eventName) {
  const hooks = [state.hooks[eventName], state.hooks["*"]];
  if (eventPayloadAction) {
    hooks.unshift(state.hooks[`${eventName}.${eventPayloadAction}`]);
  }
  return [].concat(...hooks.filter(Boolean));
}
function receiverHandle(state, event) {
  const errorHandlers = state.hooks.error || [];
  if (event instanceof Error) {
    const error = Object.assign(new AggregateError([event], event.message), {
      event
    });
    errorHandlers.forEach((handler2) => wrapErrorHandler(handler2, error));
    return Promise.reject(error);
  }
  if (!event || !event.name) {
    const error = new Error("Event name not passed");
    throw new AggregateError([error], error.message);
  }
  if (!event.payload) {
    const error = new Error("Event name not passed");
    throw new AggregateError([error], error.message);
  }
  const hooks = getHooks(
    state,
    "action" in event.payload ? event.payload.action : null,
    event.name
  );
  if (hooks.length === 0) {
    return Promise.resolve();
  }
  const errors = [];
  const promises = hooks.map((handler2) => {
    let promise = Promise.resolve(event);
    if (state.transform) {
      promise = promise.then(state.transform);
    }
    return promise.then((event2) => {
      return handler2(event2);
    }).catch((error) => errors.push(Object.assign(error, { event })));
  });
  return Promise.all(promises).then(() => {
    if (errors.length === 0) {
      return;
    }
    const error = new AggregateError(
      errors,
      errors.map((error2) => error2.message).join("\n")
    );
    Object.assign(error, {
      event
    });
    errorHandlers.forEach((handler2) => wrapErrorHandler(handler2, error));
    throw error;
  });
}
function removeListener(state, webhookNameOrNames, handler2) {
  if (Array.isArray(webhookNameOrNames)) {
    webhookNameOrNames.forEach(
      (webhookName) => removeListener(state, webhookName, handler2)
    );
    return;
  }
  if (!state.hooks[webhookNameOrNames]) {
    return;
  }
  for (let i = state.hooks[webhookNameOrNames].length - 1; i >= 0; i--) {
    if (state.hooks[webhookNameOrNames][i] === handler2) {
      state.hooks[webhookNameOrNames].splice(i, 1);
      return;
    }
  }
}
function createEventHandler(options) {
  const state = {
    hooks: {},
    log: createLogger2(options && options.log)
  };
  if (options && options.transform) {
    state.transform = options.transform;
  }
  return {
    on: receiverOn.bind(null, state),
    onAny: receiverOnAny.bind(null, state),
    onError: receiverOnError.bind(null, state),
    removeListener: removeListener.bind(null, state),
    receive: receiverHandle.bind(null, state)
  };
}
async function verifyAndReceive(state, event) {
  const matchesSignature = await verifyWithFallback(
    state.secret,
    event.payload,
    event.signature,
    state.additionalSecrets
  ).catch(() => false);
  if (!matchesSignature) {
    const error = new Error(
      "[@octokit/webhooks] signature does not match event payload and secret"
    );
    error.event = event;
    error.status = 400;
    return state.eventHandler.receive(error);
  }
  let payload;
  try {
    payload = JSON.parse(event.payload);
  } catch (error) {
    error.message = "Invalid JSON";
    error.status = 400;
    throw new AggregateError([error], error.message);
  }
  return state.eventHandler.receive({
    id: event.id,
    name: event.name,
    payload
  });
}
var textDecoder = new TextDecoder("utf-8", { fatal: false });
var decode = textDecoder.decode.bind(textDecoder);
var Webhooks = class {
  sign;
  verify;
  on;
  onAny;
  onError;
  removeListener;
  receive;
  verifyAndReceive;
  constructor(options) {
    if (!options || !options.secret) {
      throw new Error("[@octokit/webhooks] options.secret required");
    }
    const state = {
      eventHandler: createEventHandler(options),
      secret: options.secret,
      additionalSecrets: options.additionalSecrets,
      hooks: {},
      log: createLogger2(options.log)
    };
    this.sign = sign.bind(null, options.secret);
    this.verify = verify2.bind(null, options.secret);
    this.on = state.eventHandler.on;
    this.onAny = state.eventHandler.onAny;
    this.onError = state.eventHandler.onError;
    this.removeListener = state.eventHandler.removeListener;
    this.receive = state.eventHandler.receive;
    this.verifyAndReceive = verifyAndReceive.bind(null, state);
  }
};

// node_modules/.pnpm/@octokit+plugin-paginate-rest@15.0.0_@octokit+core@7.0.8/node_modules/@octokit/plugin-paginate-rest/dist-bundle/index.js
var VERSION15 = "0.0.0-development";
function normalizePaginatedListResponse2(response) {
  if (!response.data) {
    return {
      ...response,
      data: []
    };
  }
  const responseNeedsNormalization = ("total_count" in response.data || "total_commits" in response.data) && !("url" in response.data);
  if (!responseNeedsNormalization) return response;
  const incompleteResults = response.data.incomplete_results;
  const repositorySelection = response.data.repository_selection;
  const totalCount = response.data.total_count;
  const totalCommits = response.data.total_commits;
  delete response.data.incomplete_results;
  delete response.data.repository_selection;
  delete response.data.total_count;
  delete response.data.total_commits;
  const namespaceKey = Object.keys(response.data)[0];
  const data = response.data[namespaceKey];
  response.data = data;
  if (typeof incompleteResults !== "undefined") {
    response.data.incomplete_results = incompleteResults;
  }
  if (typeof repositorySelection !== "undefined") {
    response.data.repository_selection = repositorySelection;
  }
  response.data.total_count = totalCount;
  response.data.total_commits = totalCommits;
  return response;
}
function iterator2(octokit, route, parameters) {
  const options = typeof route === "function" ? route.endpoint(parameters) : octokit.request.endpoint(route, parameters);
  const requestMethod = typeof route === "function" ? route : octokit.request;
  const method = options.method;
  const headers = options.headers;
  let url = options.url;
  return {
    [Symbol.asyncIterator]: () => ({
      async next() {
        if (!url) return { done: true };
        try {
          const response = await requestMethod({ method, url, headers });
          const normalizedResponse = normalizePaginatedListResponse2(response);
          url = ((normalizedResponse.headers.link || "").match(
            /<([^<>]+)>;\s*rel="next"/
          ) || [])[1];
          if (!url && "total_commits" in normalizedResponse.data) {
            const parsedUrl = new URL(normalizedResponse.url);
            const params = parsedUrl.searchParams;
            const page = parseInt(params.get("page") || "1", 10);
            const per_page = parseInt(params.get("per_page") || "250", 10);
            if (page * per_page < normalizedResponse.data.total_commits) {
              params.set("page", String(page + 1));
              url = parsedUrl.toString();
            }
          }
          return { value: normalizedResponse };
        } catch (error) {
          if (error.status !== 409) throw error;
          url = "";
          return {
            value: {
              status: 200,
              headers: {},
              data: []
            }
          };
        }
      }
    })
  };
}
function paginate2(octokit, route, parameters, mapFn) {
  if (typeof parameters === "function") {
    mapFn = parameters;
    parameters = void 0;
  }
  return gather2(
    octokit,
    [],
    iterator2(octokit, route, parameters)[Symbol.asyncIterator](),
    mapFn
  );
}
function gather2(octokit, results, iterator22, mapFn) {
  return iterator22.next().then((result) => {
    if (result.done) {
      return results;
    }
    let earlyExit = false;
    function done() {
      earlyExit = true;
    }
    results = results.concat(
      mapFn ? mapFn(result.value, done) : result.value.data
    );
    if (earlyExit) {
      return results;
    }
    return gather2(octokit, results, iterator22, mapFn);
  });
}
var composePaginateRest2 = Object.assign(paginate2, {
  iterator: iterator2
});
function paginateRest2(octokit) {
  return {
    paginate: Object.assign(paginate2.bind(null, octokit), {
      iterator: iterator2.bind(null, octokit)
    })
  };
}
paginateRest2.VERSION = VERSION15;

// node_modules/.pnpm/@octokit+app@16.1.4/node_modules/@octokit/app/dist-node/index.js
var VERSION16 = "16.1.4";
function webhooks(appOctokit, options) {
  return new Webhooks({
    secret: options.secret,
    transform: async (event) => {
      if (!("installation" in event.payload) || typeof event.payload.installation !== "object") {
        const octokit2 = new appOctokit.constructor({
          authStrategy: createUnauthenticatedAuth,
          auth: {
            reason: `"installation" key missing in webhook event payload`
          }
        });
        return {
          ...event,
          octokit: octokit2
        };
      }
      const installationId = event.payload.installation.id;
      const octokit = await appOctokit.auth({
        type: "installation",
        installationId,
        factory(auth7) {
          return new auth7.octokit.constructor({
            ...auth7.octokitOptions,
            authStrategy: createAppAuth,
            ...{
              auth: {
                ...auth7,
                installationId
              }
            }
          });
        }
      });
      octokit.hook.before("request", (options2) => {
        options2.headers["x-github-delivery"] = event.id;
      });
      return {
        ...event,
        octokit
      };
    }
  });
}
async function getInstallationOctokit(app, installationId) {
  return app.octokit.auth({
    type: "installation",
    installationId,
    factory(auth7) {
      const options = {
        ...auth7.octokitOptions,
        authStrategy: createAppAuth,
        ...{ auth: { ...auth7, installationId } }
      };
      return new auth7.octokit.constructor(options);
    }
  });
}
function eachInstallationFactory(app) {
  return Object.assign(eachInstallation.bind(null, app), {
    iterator: eachInstallationIterator.bind(null, app)
  });
}
async function eachInstallation(app, callback) {
  const i = eachInstallationIterator(app)[Symbol.asyncIterator]();
  let result = await i.next();
  while (!result.done) {
    await callback(result.value);
    result = await i.next();
  }
}
function eachInstallationIterator(app) {
  return {
    async *[Symbol.asyncIterator]() {
      const iterator3 = composePaginateRest2.iterator(
        app.octokit,
        "GET /app/installations"
      );
      for await (const { data: installations } of iterator3) {
        for (const installation of installations) {
          const installationOctokit = await getInstallationOctokit(
            app,
            installation.id
          );
          yield { octokit: installationOctokit, installation };
        }
      }
    }
  };
}
function eachRepositoryFactory(app) {
  return Object.assign(eachRepository.bind(null, app), {
    iterator: eachRepositoryIterator.bind(null, app)
  });
}
async function eachRepository(app, queryOrCallback, callback) {
  const i = eachRepositoryIterator(
    app,
    callback ? queryOrCallback : void 0
  )[Symbol.asyncIterator]();
  let result = await i.next();
  while (!result.done) {
    if (callback) {
      await callback(result.value);
    } else {
      await queryOrCallback(result.value);
    }
    result = await i.next();
  }
}
function singleInstallationIterator(app, installationId) {
  return {
    async *[Symbol.asyncIterator]() {
      yield {
        octokit: await app.getInstallationOctokit(installationId)
      };
    }
  };
}
function eachRepositoryIterator(app, query) {
  return {
    async *[Symbol.asyncIterator]() {
      const iterator3 = query ? singleInstallationIterator(app, query.installationId) : app.eachInstallation.iterator();
      for await (const { octokit } of iterator3) {
        const repositoriesIterator = composePaginateRest2.iterator(
          octokit,
          "GET /installation/repositories"
        );
        for await (const { data: repositories } of repositoriesIterator) {
          for (const repository of repositories) {
            yield { octokit, repository };
          }
        }
      }
    }
  };
}
function getInstallationUrlFactory(app) {
  let installationUrlBasePromise;
  return async function getInstallationUrl(options = {}) {
    if (!installationUrlBasePromise) {
      installationUrlBasePromise = getInstallationUrlBase(app);
    }
    const installationUrlBase = await installationUrlBasePromise;
    const installationUrl = new URL(installationUrlBase);
    if (options.target_id !== void 0) {
      installationUrl.pathname += "/permissions";
      installationUrl.searchParams.append(
        "target_id",
        options.target_id.toFixed()
      );
    }
    if (options.state !== void 0) {
      installationUrl.searchParams.append("state", options.state);
    }
    return installationUrl.href;
  };
}
async function getInstallationUrlBase(app) {
  const { data: appInfo } = await app.octokit.request("GET /app");
  if (!appInfo) {
    throw new Error("[@octokit/app] unable to fetch metadata for app");
  }
  return `${appInfo.html_url}/installations/new`;
}
var App = class {
  static VERSION = VERSION16;
  static defaults(defaults) {
    const AppWithDefaults = class extends this {
      constructor(...args) {
        super({
          ...defaults,
          ...args[0]
        });
      }
    };
    return AppWithDefaults;
  }
  octokit;
  // @ts-ignore calling app.webhooks will throw a helpful error when options.webhooks is not set
  webhooks;
  // @ts-ignore calling app.oauth will throw a helpful error when options.oauth is not set
  oauth;
  getInstallationOctokit;
  eachInstallation;
  eachRepository;
  getInstallationUrl;
  log;
  constructor(options) {
    const Octokit3 = options.Octokit || Octokit;
    const authOptions = Object.assign(
      {
        appId: options.appId,
        privateKey: options.privateKey
      },
      options.oauth ? {
        clientId: options.oauth.clientId,
        clientSecret: options.oauth.clientSecret
      } : {}
    );
    const octokitOptions = {
      authStrategy: createAppAuth,
      auth: authOptions
    };
    if ("log" in options && typeof options.log !== "undefined") {
      octokitOptions.log = options.log;
    }
    this.octokit = new Octokit3(octokitOptions);
    this.log = Object.assign(
      {
        debug: () => {
        },
        info: () => {
        },
        warn: console.warn.bind(console),
        error: console.error.bind(console)
      },
      options.log
    );
    if (options.webhooks) {
      this.webhooks = webhooks(this.octokit, options.webhooks);
    } else {
      Object.defineProperty(this, "webhooks", {
        get() {
          throw new Error("[@octokit/app] webhooks option not set");
        }
      });
    }
    if (options.oauth) {
      this.oauth = new OAuthApp({
        ...options.oauth,
        clientType: "github-app",
        Octokit: Octokit3
      });
    } else {
      Object.defineProperty(this, "oauth", {
        get() {
          throw new Error(
            "[@octokit/app] oauth.clientId / oauth.clientSecret options are not set"
          );
        }
      });
    }
    this.getInstallationOctokit = getInstallationOctokit.bind(
      null,
      this
    );
    this.eachInstallation = eachInstallationFactory(
      this
    );
    this.eachRepository = eachRepositoryFactory(
      this
    );
    this.getInstallationUrl = getInstallationUrlFactory(this);
  }
};

// node_modules/.pnpm/octokit@5.0.5/node_modules/octokit/dist-bundle/index.js
var VERSION17 = "0.0.0-development";
var Octokit2 = Octokit.plugin(
  restEndpointMethods,
  paginateRest,
  paginateGraphQL,
  retry,
  throttling
).defaults({
  userAgent: `octokit.js/${VERSION17}`,
  throttle: {
    onRateLimit,
    onSecondaryRateLimit
  }
});
function onRateLimit(retryAfter, options, octokit) {
  octokit.log.warn(
    `Request quota exhausted for request ${options.method} ${options.url}`
  );
  if (options.request.retryCount === 0) {
    octokit.log.info(`Retrying after ${retryAfter} seconds!`);
    return true;
  }
}
function onSecondaryRateLimit(retryAfter, options, octokit) {
  octokit.log.warn(
    `SecondaryRateLimit detected for request ${options.method} ${options.url}`
  );
  if (options.request.retryCount === 0) {
    octokit.log.info(`Retrying after ${retryAfter} seconds!`);
    return true;
  }
}
var App2 = App.defaults({ Octokit: Octokit2 });
var OAuthApp2 = OAuthApp.defaults({ Octokit: Octokit2 });

// src/platforms/github/client.ts
function createGitHubGateway(token) {
  const octokit = token === "" ? new Octokit2() : new Octokit2({ auth: token });
  return {
    async listPullRequestFiles(ref) {
      const files = await octokit.paginate(octokit.rest.pulls.listFiles, {
        owner: ref.owner,
        repo: ref.repo,
        pull_number: ref.number,
        per_page: 100
      });
      return files.map((file) => ({
        filename: file.filename,
        previousFilename: file.previous_filename ?? null,
        status: file.status,
        patch: file.patch ?? null,
        additions: file.additions,
        deletions: file.deletions
      }));
    },
    async getFileContent(ref, path, gitRef) {
      try {
        const response = await octokit.rest.repos.getContent({
          owner: ref.owner,
          repo: ref.repo,
          path,
          ref: gitRef
        });
        const data = response.data;
        if (Array.isArray(data)) return null;
        if (data.type !== "file") return null;
        if (data.encoding !== "base64") return null;
        return Buffer.from(data.content, "base64").toString("utf8");
      } catch {
        return null;
      }
    },
    async listReviewComments(ref) {
      const comments = await octokit.paginate(octokit.rest.pulls.listReviewComments, {
        owner: ref.owner,
        repo: ref.repo,
        pull_number: ref.number,
        per_page: 100
      });
      return comments.map((comment) => ({
        id: String(comment.id),
        body: comment.body ?? "",
        path: comment.path,
        line: comment.line ?? comment.original_line ?? null,
        side: comment.side === "LEFT" || comment.side === "RIGHT" ? comment.side : null
      }));
    },
    async getRepoInfo(ref) {
      const response = await octokit.rest.repos.get({ owner: ref.owner, repo: ref.repo });
      return {
        hasWiki: response.data.has_wiki === true,
        defaultBranch: response.data.default_branch
      };
    },
    async getCommit(ref, sha) {
      const response = await octokit.rest.repos.getCommit({
        owner: ref.owner,
        repo: ref.repo,
        ref: sha
      });
      return {
        sha: response.data.sha,
        parentSha: response.data.parents[0]?.sha ?? null,
        summary: (response.data.commit.message ?? "").split("\n")[0] ?? ""
      };
    },
    async compareCommits(ref, base, head) {
      const response = await octokit.rest.repos.compareCommitsWithBasehead({
        owner: ref.owner,
        repo: ref.repo,
        basehead: `${base}...${head}`,
        // compare 端点的 files 不分页，一次最多给 100 个；超出的由调用方告警，不静默丢
        per_page: 100
      });
      return (response.data.files ?? []).map((file) => ({
        filename: file.filename,
        previousFilename: file.previous_filename ?? null,
        status: file.status,
        patch: file.patch ?? null,
        additions: file.additions,
        deletions: file.deletions
      }));
    },
    async getPullRequestShas(ref) {
      const response = await octokit.rest.pulls.get({
        owner: ref.owner,
        repo: ref.repo,
        pull_number: ref.number
      });
      return { head: response.data.head.sha, base: response.data.base.sha };
    },
    async createReviewComment(ref, input) {
      const response = await octokit.rest.pulls.createReviewComment({
        owner: ref.owner,
        repo: ref.repo,
        pull_number: ref.number,
        body: input.body,
        commit_id: input.commitId,
        path: input.path,
        line: input.line,
        side: input.side
      });
      return {
        id: String(response.data.id),
        body: response.data.body,
        path: response.data.path,
        line: response.data.line ?? null,
        side: response.data.side === "LEFT" || response.data.side === "RIGHT" ? response.data.side : null
      };
    },
    async updateReviewComment(ref, commentId, body) {
      await octokit.rest.pulls.updateReviewComment({
        owner: ref.owner,
        repo: ref.repo,
        comment_id: Number(commentId),
        body
      });
    },
    async deleteReviewComment(ref, commentId) {
      await octokit.rest.pulls.deleteReviewComment({
        owner: ref.owner,
        repo: ref.repo,
        comment_id: Number(commentId)
      });
    },
    async getReviewComment(ref, commentId) {
      try {
        const response = await octokit.rest.pulls.getReviewComment({
          owner: ref.owner,
          repo: ref.repo,
          comment_id: Number(commentId)
        });
        return {
          id: String(response.data.id),
          body: response.data.body,
          path: response.data.path,
          line: response.data.line ?? null,
          side: response.data.side === "LEFT" || response.data.side === "RIGHT" ? response.data.side : null
        };
      } catch {
        return null;
      }
    },
    async listIssueComments(ref) {
      const comments = await octokit.paginate(octokit.rest.issues.listComments, {
        owner: ref.owner,
        repo: ref.repo,
        issue_number: ref.number,
        per_page: 100
      });
      return comments.map((comment) => ({ id: String(comment.id), body: comment.body ?? "" }));
    },
    async createIssueComment(ref, body) {
      const response = await octokit.rest.issues.createComment({
        owner: ref.owner,
        repo: ref.repo,
        issue_number: ref.number,
        body
      });
      return { id: String(response.data.id), body: response.data.body ?? body };
    },
    async updateIssueComment(ref, commentId, body) {
      await octokit.rest.issues.updateComment({
        owner: ref.owner,
        repo: ref.repo,
        comment_id: Number(commentId),
        body
      });
    },
    async listIssuesByLabel(ref, label) {
      const issues = await octokit.paginate(octokit.rest.issues.listForRepo, {
        owner: ref.owner,
        repo: ref.repo,
        labels: label,
        state: "all",
        per_page: 100
      });
      return issues.map((issue) => ({
        number: issue.number,
        title: issue.title,
        body: issue.body ?? "",
        url: issue.html_url,
        state: issue.state === "open" ? "open" : "closed"
      }));
    },
    async createIssue(ref, input) {
      const response = await octokit.rest.issues.create({
        owner: ref.owner,
        repo: ref.repo,
        title: input.title,
        body: input.body,
        labels: [...input.labels]
      });
      return {
        number: response.data.number,
        title: response.data.title,
        body: response.data.body ?? "",
        url: response.data.html_url,
        state: response.data.state === "open" ? "open" : "closed"
      };
    },
    async updateIssue(ref, number, input) {
      const response = await octokit.rest.issues.update({
        owner: ref.owner,
        repo: ref.repo,
        issue_number: number,
        ...input.title === void 0 ? {} : { title: input.title },
        ...input.body === void 0 ? {} : { body: input.body }
      });
      return {
        number: response.data.number,
        title: response.data.title,
        body: response.data.body ?? "",
        url: response.data.html_url,
        state: response.data.state === "open" ? "open" : "closed"
      };
    },
    async closeIssue(ref, number) {
      await octokit.rest.issues.update({
        owner: ref.owner,
        repo: ref.repo,
        issue_number: number,
        state: "closed"
      });
    },
    async createCheckRun(ref, input) {
      const response = await octokit.rest.checks.create({
        owner: ref.owner,
        repo: ref.repo,
        name: input.name,
        head_sha: input.headSha,
        status: "completed",
        conclusion: input.conclusion,
        output: {
          title: input.title,
          summary: input.summary,
          // 平台限制单次注解条数，超了整次请求会失败
          annotations: input.annotations.slice(0, 50).map((annotation) => ({
            path: annotation.path,
            start_line: annotation.startLine,
            end_line: annotation.endLine,
            annotation_level: annotation.level,
            title: annotation.title,
            message: annotation.message
          }))
        }
      });
      return String(response.data.id);
    },
    async resolveThread(ref, commentId) {
      const comment = await octokit.rest.pulls.getReviewComment({
        owner: ref.owner,
        repo: ref.repo,
        comment_id: Number(commentId)
      });
      const query = `query($id: ID!) {
        node(id: $id) {
          ... on PullRequestReviewComment {
            pullRequestReviewThread { id }
          }
        }
      }`;
      const found = await octokit.graphql(query, {
        id: comment.data.node_id
      });
      const threadId = found.node?.pullRequestReviewThread?.id;
      if (threadId === void 0) throw new Error("\u627E\u4E0D\u5230\u8BE5\u8BC4\u8BBA\u6240\u5C5E\u7684\u4F1A\u8BDD");
      const mutation = `mutation($threadId: ID!) {
        resolveReviewThread(input: { threadId: $threadId }) { thread { isResolved } }
      }`;
      await octokit.graphql(mutation, { threadId });
    }
  };
}

// src/platforms/github/reports.ts
var INSPECTION_LABEL = "acr-inspection";
function createGitHubIssueWriter(gateway, ref, options = {}) {
  const prefix = options.titlePrefix ?? "\u4EE3\u7801\u5DE1\u68C0\u62A5\u544A";
  return {
    kind: "issue",
    async write(pageName, markdown) {
      try {
        const title = `${prefix} ${pageName}`;
        const existing = await gateway.listIssuesByLabel(ref, INSPECTION_LABEL);
        const target = pickLatest(existing);
        if (target === void 0) {
          const created = await gateway.createIssue(ref, {
            title,
            body: markdown,
            labels: [INSPECTION_LABEL]
          });
          await gateway.closeIssue(ref, created.number);
          return { ok: true, reference: `#${String(created.number)}`, url: created.url };
        }
        const updated = await gateway.updateIssue(ref, target.number, { title, body: markdown });
        if (updated.state === "open") await gateway.closeIssue(ref, target.number);
        return { ok: true, reference: `#${String(updated.number)}`, url: updated.url };
      } catch (error) {
        return { ok: false, reason: error instanceof Error ? error.message : String(error) };
      }
    }
  };
}
function pickLatest(issues) {
  return [...issues].sort((a, b) => b.number - a.number)[0];
}
function createGitWikiWriter(options) {
  const authorName = options.authorName ?? "acr-bot";
  const authorEmail = options.authorEmail ?? "acr-bot@users.noreply.github.com";
  return {
    kind: "wiki",
    async write(pageName, markdown) {
      const { run, workDir, cloneUrl } = options;
      try {
        const { mkdir: mkdir2, writeFile: writeFile2 } = await import("node:fs/promises");
        const { join: join4 } = await import("node:path");
        await mkdir2(workDir, { recursive: true });
        const { existsSync } = await import("node:fs");
        if (existsSync(join4(workDir, ".git"))) {
          await run("git", ["pull", "--rebase", "--quiet"], workDir);
        } else {
          await run("git", ["clone", "--depth", "1", cloneUrl, workDir], workDir);
        }
        await writeFile2(join4(workDir, `${pageName}.md`), markdown, "utf8");
        await run("git", ["add", `${pageName}.md`], workDir);
        await run(
          "git",
          [
            "-c",
            `user.name=${authorName}`,
            "-c",
            `user.email=${authorEmail}`,
            "commit",
            "-m",
            `\u5DE1\u68C0\u62A5\u544A ${pageName}`
          ],
          workDir
        );
        await run("git", ["push", "--quiet", "origin", "HEAD"], workDir);
        return {
          ok: true,
          reference: pageName,
          url: `${cloneUrl.replace(/\.wiki\.git$/, "")}/wiki/${pageName}`
        };
      } catch (error) {
        return { ok: false, reason: error instanceof Error ? error.message : String(error) };
      }
    }
  };
}

// src/core/path-glob.ts
var REGEX_SPECIAL = /[.+^${}()|[\]\\]/g;
function escapeRegex(char) {
  return char.replace(REGEX_SPECIAL, "\\$&");
}
function compileGlob(pattern) {
  let source = "^";
  let i = 0;
  while (i < pattern.length) {
    const char = pattern.charAt(i);
    if (char === "*") {
      const isDoubleStar = pattern.charAt(i + 1) === "*";
      if (isDoubleStar) {
        if (pattern.charAt(i + 2) === "/") {
          source += "(?:.*/)?";
          i += 3;
          continue;
        }
        source += ".*";
        i += 2;
        continue;
      }
      source += "[^/]*";
      i += 1;
      continue;
    }
    if (char === "?") {
      source += "[^/]";
      i += 1;
      continue;
    }
    source += escapeRegex(char);
    i += 1;
  }
  return new RegExp(`${source}$`);
}
function matchesGlob(path, pattern) {
  return compileGlob(pattern).test(path.replace(/\\/g, "/"));
}
function matchesAny2(path, patterns) {
  return patterns.some((pattern) => matchesGlob(path, pattern));
}

// src/core/diff/parse.ts
var HUNK_HEADER = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/;
function normalizeNewlines(text2) {
  return text2.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}
function looksBinary(patch) {
  return /^Binary files .* differ$/m.test(patch) || patch.includes("GIT binary patch");
}
function splitPatchLines(patch) {
  const lines = normalizeNewlines(patch).split("\n");
  while (lines.length > 0 && lines[lines.length - 1] === "") {
    lines.pop();
  }
  return lines;
}
function parseHunks(lines) {
  const hunks = [];
  let current = null;
  for (const line of lines) {
    const header = HUNK_HEADER.exec(line);
    if (header !== null) {
      if (current !== null) hunks.push(current);
      current = {
        oldStart: Number(header[1]),
        newStart: Number(header[3]),
        lines: []
      };
      continue;
    }
    if (current === null) continue;
    if (line.startsWith("\\")) continue;
    const marker = line.charAt(0);
    const text2 = line.slice(1);
    if (marker === "+") {
      current.lines.push({ kind: "added", text: text2 });
    } else if (marker === "-") {
      current.lines.push({ kind: "removed", text: text2 });
    } else {
      current.lines.push({ kind: "context", text: marker === " " ? text2 : line });
    }
  }
  if (current !== null) hunks.push(current);
  return hunks;
}
function expandHunks(hunks, file, oldPath) {
  const result = [];
  for (const hunk of hunks) {
    let oldLine = hunk.oldStart;
    let newLine = hunk.newStart;
    for (const line of hunk.lines) {
      let anchor;
      if (line.kind === "context") {
        anchor = { file, oldPath, kind: "context", oldLine, newLine };
        oldLine += 1;
        newLine += 1;
      } else if (line.kind === "added") {
        anchor = { file, oldPath, kind: "added", oldLine: null, newLine };
        newLine += 1;
      } else {
        anchor = { file, oldPath, kind: "removed", oldLine, newLine: null };
        oldLine += 1;
      }
      result.push({ anchor, text: line.text, enclosingSymbol: null });
    }
  }
  return result;
}
function parsePatch(patch, meta) {
  const empty = (skippedReason) => ({
    path: meta.path,
    oldPath: meta.oldPath,
    status: meta.status,
    lines: [],
    changedCount: 0,
    skippedReason
  });
  if (patch === null) {
    return empty("\u5E73\u53F0\u672A\u63D0\u4F9B\u8865\u4E01\u5185\u5BB9");
  }
  if (patch.trim() === "") {
    return empty(null);
  }
  if (looksBinary(patch)) {
    return empty("\u4E8C\u8FDB\u5236\u6587\u4EF6");
  }
  const lines = splitPatchLines(patch);
  const hunks = parseHunks(lines);
  const diffLines = expandHunks(hunks, meta.path, meta.oldPath);
  const changedCount = diffLines.filter((line) => line.anchor.kind !== "context").length;
  return {
    path: meta.path,
    oldPath: meta.oldPath,
    status: meta.status,
    lines: diffLines,
    changedCount,
    skippedReason: null
  };
}

// src/platforms/github/fetch.ts
function mapStatus(raw) {
  switch (raw) {
    case "added":
    case "copied":
      return "added";
    case "removed":
      return "deleted";
    case "renamed":
      return "renamed";
    default:
      return "modified";
  }
}
function toExistingComment(raw) {
  return {
    commentId: raw.id,
    // 解析不出标记就是别人发的，后续任何生命周期操作都不能碰它
    marker: parseMarker(raw.body),
    line: raw.line,
    side: raw.side === "LEFT" ? "old" : "new",
    path: raw.path,
    // SPEC-GAP：平台不同接口才给这两个状态，T-05 先固定为 false，
    // 由 T-12（生命周期比对）补上真实读取。
    resolved: false,
    outdated: false
  };
}
function toDiffFile(raw, skipPaths) {
  const status = mapStatus(raw.status);
  const parsed = parsePatch(raw.patch, {
    path: raw.filename,
    // 只有重命名与修改才有旧路径意义；新增文件的旧路径应为 null
    oldPath: status === "renamed" ? raw.previousFilename : null,
    status
  });
  if (matchesAny2(raw.filename, skipPaths)) {
    return { ...parsed, skippedReason: "\u547D\u4E2D\u8DF3\u8FC7\u6E05\u5355" };
  }
  return parsed;
}
async function fetchSnapshot(gateway, ref, headSha, skipPaths = [], baseSha = "") {
  const warnings = [];
  const rawFiles = await gateway.listPullRequestFiles(ref);
  const files = rawFiles.map((raw) => toDiffFile(raw, skipPaths));
  const fileContents = /* @__PURE__ */ new Map();
  for (const file of files) {
    if (file.skippedReason !== null) continue;
    fileContents.set(file.path, await gateway.getFileContent(ref, file.path, headSha));
  }
  let existingComments = [];
  try {
    const rawComments = await gateway.listReviewComments(ref);
    existingComments = rawComments.map(toExistingComment);
  } catch (error) {
    warnings.push({
      kind: "history",
      message: `\u8BFB\u53D6\u5DF2\u6709\u8BC4\u8BBA\u5931\u8D25\uFF0C\u672C\u8F6E\u53EF\u80FD\u4EA7\u751F\u91CD\u590D\u8BC4\u8BBA\uFF1A${error instanceof Error ? error.message : String(error)}`,
      target: null
    });
  }
  return {
    snapshot: {
      diff: { files, baseSha, headSha },
      fileContents,
      existingComments,
      // SPEC-GAP：仓库约定文件与构建上下文在 T-06（上下文装配）补齐
      conventions: null,
      buildContext: null
    },
    warnings
  };
}
async function fetchCommitSnapshot(gateway, repoRef, sha, skipPaths = []) {
  const warnings = [];
  const commit = await gateway.getCommit(repoRef, sha);
  if (commit.parentSha === null) {
    throw new Error(`\u63D0\u4EA4 ${sha.slice(0, 7)} \u662F\u6839\u63D0\u4EA4\uFF0C\u6CA1\u6709\u53EF\u5BF9\u6BD4\u7684\u7236\u63D0\u4EA4`);
  }
  const rawFiles = await gateway.compareCommits(repoRef, commit.parentSha, commit.sha);
  if (rawFiles.length >= 100) {
    warnings.push({
      kind: "other",
      message: "\u6539\u52A8\u6587\u4EF6\u8FBE\u5230\u5E73\u53F0\u5355\u6B21\u4E0A\u9650 100 \u4E2A\uFF0C\u8D85\u51FA\u7684\u6587\u4EF6\u672A\u7EB3\u5165\u672C\u6B21\u5BA1\u67E5",
      target: null
    });
  }
  const files = rawFiles.map((raw) => toDiffFile(raw, skipPaths));
  const fileContents = /* @__PURE__ */ new Map();
  for (const file of files) {
    if (file.skippedReason !== null) continue;
    fileContents.set(file.path, await gateway.getFileContent(repoRef, file.path, commit.sha));
  }
  return {
    snapshot: {
      diff: { files, baseSha: commit.parentSha, headSha: commit.sha },
      fileContents,
      // 提交没有评论区，这里恒为空数组——不是「没读到」，是「不存在」
      existingComments: [],
      conventions: null,
      buildContext: null
    },
    warnings
  };
}

// src/providers/usage.ts
function num(source, key) {
  if (typeof source !== "object" || source === null) return 0;
  const value = source[key];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}
function obj(source, key) {
  if (typeof source !== "object" || source === null) return null;
  return source[key] ?? null;
}
function mapUsage(raw) {
  const completion = num(raw, "completion_tokens") || num(raw, "output_tokens");
  const prompt = num(raw, "prompt_tokens") || num(raw, "input_tokens");
  const details = obj(raw, "prompt_tokens_details");
  const cacheRead = num(details, "cached_tokens") || num(raw, "cache_read_input_tokens") || num(raw, "prompt_cache_hit_tokens");
  const cacheWriteShort = num(raw, "cache_creation_input_tokens");
  const cacheWriteLong = num(raw, "cache_creation_input_tokens_1h");
  const incremental = num(raw, "cache_read_input_tokens") > 0 || cacheWriteShort > 0;
  const uncachedInput = incremental ? prompt : Math.max(0, prompt - cacheRead - cacheWriteShort - cacheWriteLong);
  return {
    uncachedInput,
    cacheWriteShort,
    cacheWriteLong,
    cacheRead,
    output: completion
  };
}

// src/providers/openai-compat.ts
var RETRYABLE = /* @__PURE__ */ new Set([408, 409, 425, 429, 500, 502, 503, 504]);
var DEFAULT_SLEEP2 = (ms) => new Promise((resolve) => {
  setTimeout(resolve, ms);
});
function createFetchTransport(apiKey, extra) {
  return async (url, init) => {
    const response = await fetch(url, {
      method: init.method,
      headers: { ...init.headers, ...extra, authorization: `Bearer ${apiKey}` },
      body: init.body
    });
    const text2 = await response.text();
    let body = text2;
    try {
      body = JSON.parse(text2);
    } catch {
    }
    const headers = {};
    response.headers.forEach((value, key) => {
      headers[key.toLowerCase()] = value;
    });
    return { status: response.status, headers, body };
  };
}
function toFinishReason(raw) {
  if (raw === "stop" || raw === "end_turn") return "stop";
  if (raw === "length" || raw === "max_tokens") return "length";
  if (raw === "content_filter") return "content-filter";
  return "other";
}
function extractText(body) {
  if (typeof body !== "object" || body === null) return "";
  const choices = body["choices"];
  if (!Array.isArray(choices) || choices.length === 0) return "";
  const first = choices[0];
  if (typeof first !== "object" || first === null) return "";
  const message = first["message"];
  if (typeof message !== "object" || message === null) return "";
  const content = message["content"];
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content.map(
      (part) => typeof part === "object" && part !== null && typeof part["text"] === "string" ? part["text"] : ""
    ).join("");
  }
  return "";
}
function extractRawUsage(body) {
  if (typeof body !== "object" || body === null) return null;
  return body["usage"] ?? null;
}
function extractFinish(body) {
  if (typeof body !== "object" || body === null) return void 0;
  const choices = body["choices"];
  if (!Array.isArray(choices) || choices.length === 0) return void 0;
  const first = choices[0];
  if (typeof first !== "object" || first === null) return void 0;
  return first["finish_reason"];
}
function extractModel(body, fallback) {
  if (typeof body !== "object" || body === null) return fallback;
  const model = body["model"];
  return typeof model === "string" ? model : fallback;
}
function describeError(status, body) {
  const text2 = typeof body === "string" ? body : JSON.stringify(body);
  return `\u6A21\u578B\u63A5\u53E3\u8FD4\u56DE ${String(status)}\uFF1A${text2.slice(0, 300)}`;
}
function isRetryable(status) {
  return RETRYABLE.has(status);
}
function createOpenAiCompatClient(options) {
  const sleep = options.sleep ?? DEFAULT_SLEEP2;
  const maxAttempts = options.maxAttempts ?? 3;
  const baseDelay = options.baseDelayMs ?? 500;
  const transport = options.transport ?? createFetchTransport(options.apiKey, options.headers ?? {});
  const endpoint2 = `${options.baseUrl.replace(/\/+$/, "")}/chat/completions`;
  const initial = options.structuredOutput === void 0 || options.structuredOutput === "auto" ? "json-schema" : options.structuredOutput;
  let mode = initial === "none" ? "none" : initial;
  const send = async (request2, activeMode) => {
    const payload = {
      model: request2.model,
      messages: request2.messages.map((message) => ({
        role: message.role,
        content: message.content
      })),
      temperature: request2.temperature,
      max_tokens: request2.maxOutputTokens
    };
    const format = buildResponseFormat(
      activeMode,
      request2.schema,
      request2.schemaName ?? "finding_list"
    );
    if (format !== null) payload["response_format"] = format;
    const response = await transport(endpoint2, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (activeMode !== "none" && isSchemaRejection(response.status, response.body)) {
      return { rejected: true, status: response.status, body: response.body };
    }
    if (response.status < 200 || response.status >= 300) {
      const error = new Error(describeError(response.status, response.body));
      error.status = response.status;
      throw error;
    }
    return {
      text: extractText(response.body),
      finishReason: toFinishReason(extractFinish(response.body)),
      usage: mapUsage(extractRawUsage(response.body)),
      model: extractModel(response.body, request2.model),
      structuredMode: activeMode
    };
  };
  return {
    structuredMode() {
      return mode;
    },
    async complete(request2) {
      let failures = 0;
      for (; ; ) {
        try {
          const result = await send(request2, mode ?? "none");
          if ("rejected" in result) {
            mode = mode === "json-schema" ? "json-object" : "none";
            continue;
          }
          return result;
        } catch (error) {
          failures += 1;
          const status = error.status;
          const retryable = status === void 0 || isRetryable(status);
          if (!retryable || failures >= maxAttempts) throw error;
          await sleep(Math.min(baseDelay * 2 ** (failures - 1), 8e3));
        }
      }
    }
  };
}

// src/core/eval/baseline.ts
function compareBaselines(before, after) {
  if (before.datasetHash !== after.datasetHash) {
    return {
      comparable: false,
      reason: `\u6837\u672C\u96C6\u5DF2\u53D8\u66F4\uFF08${before.datasetHash} \u2192 ${after.datasetHash}\uFF09\uFF0C\u4E24\u4EFD\u7ED3\u679C\u4E0D\u662F\u540C\u4E00\u9053\u9898\uFF0C\u9700\u91CD\u8DD1\u57FA\u51C6`
    };
  }
  const metrics = [
    {
      name: "\u53EC\u56DE\u7387",
      before: before.metrics.recall,
      after: after.metrics.recall,
      delta: after.metrics.recall - before.metrics.recall,
      higherIsBetter: true
    },
    {
      name: "\u7CBE\u786E\u7387",
      before: before.metrics.precision,
      after: after.metrics.precision,
      delta: after.metrics.precision - before.metrics.precision,
      higherIsBetter: true
    },
    {
      name: "\u5E73\u5747\u5EF6\u8FDF",
      before: before.metrics.avgLatencyMs,
      after: after.metrics.avgLatencyMs,
      delta: after.metrics.avgLatencyMs - before.metrics.avgLatencyMs,
      higherIsBetter: false
    },
    {
      name: "\u590D\u73B0\u7387",
      before: before.metrics.reproducibility,
      after: after.metrics.reproducibility,
      delta: after.metrics.reproducibility - before.metrics.reproducibility,
      higherIsBetter: true
    }
  ];
  if (before.cost !== null && after.cost !== null) {
    metrics.push({
      name: "\u5E73\u5747\u6210\u672C",
      before: before.cost.total,
      after: after.cost.total,
      delta: after.cost.total - before.cost.total,
      higherIsBetter: false
    });
  }
  const changedPrompts = Object.keys({ ...before.promptVersions, ...after.promptVersions }).filter(
    (key) => before.promptVersions[key] !== after.promptVersions[key]
  );
  return {
    comparable: true,
    metrics,
    changedPrompts,
    crossModel: before.model !== after.model,
    verdict: verdictOf(metrics)
  };
}
function verdictOf(metrics) {
  const recall = metrics.find((metric) => metric.name === "\u53EC\u56DE\u7387");
  const cost = metrics.find((metric) => metric.name === "\u5E73\u5747\u6210\u672C");
  const recallDrop = recall !== void 0 && recall.delta < -0.02;
  const costDrop = cost !== void 0 && cost.before > 0 && cost.delta / cost.before < -0.15;
  if (recallDrop) return "\u53EC\u56DE\u660E\u663E\u4E0B\u964D\uFF0C\u4E0D\u5EFA\u8BAE\u91C7\u7528";
  if (costDrop) return "\u6210\u672C\u660E\u663E\u4E0B\u964D\u4E14\u53EC\u56DE\u672A\u9000\uFF0C\u51C0\u6536\u76CA\u4E3A\u6B63";
  return "\u53D8\u5316\u4E0D\u663E\u8457\uFF0C\u9700\u7ED3\u5408\u5177\u4F53\u6837\u672C\u5224\u65AD";
}
function isBaselineSnapshot(value) {
  if (typeof value !== "object" || value === null) return false;
  const record = value;
  return record["version"] === 1 && typeof record["label"] === "string" && typeof record["datasetHash"] === "string" && typeof record["model"] === "string" && typeof record["metrics"] === "object" && record["metrics"] !== null;
}

// src/core/inspection/carrier.ts
function chooseCarrier(config, hasWiki) {
  if (config.carrier !== "auto") return config.carrier;
  return hasWiki ? "wiki" : "issue";
}
async function writeReport(input) {
  const primary = chooseCarrier(input.config, input.hasWiki);
  const order = primary === "wiki" ? ["wiki", "issue"] : ["issue"];
  let warning = null;
  for (const carrier of order) {
    const writer = input.writers[carrier];
    if (writer === void 0) continue;
    const outcome = await writer.write(input.pageName, input.markdown);
    if (outcome.ok) {
      return {
        location: { carrier: writer.kind, reference: outcome.reference, url: outcome.url },
        warning: warning === null ? null : `${warning}\uFF0C\u5DF2\u6539\u4E3A\u5199\u5165${carrier === "wiki" ? " Wiki" : " Issue"}`
      };
    }
    warning = warning === null ? `\u5199\u5165${carrier === "wiki" ? " Wiki " : " Issue "}\u5931\u8D25\uFF1A${outcome.reason}` : warning;
  }
  return { location: null, warning: warning ?? "\u6CA1\u6709\u53EF\u7528\u7684\u62A5\u544A\u8F7D\u4F53" };
}

// src/core/inspection/history.ts
var EMPTY_HISTORY = { version: 1, entries: [] };
function appendHistory(history, entry, depth) {
  const entries = [...history.entries, entry];
  const kept = depth > 0 ? entries.slice(Math.max(0, entries.length - depth)) : entries;
  return { version: 1, entries: kept };
}
function previousOf(history) {
  return history.entries.length === 0 ? null : history.entries[history.entries.length - 1] ?? null;
}
function parseHistory(text2) {
  const parsed = JSON.parse(text2);
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error("\u5386\u53F2\u6587\u4EF6\u4E0D\u662F\u4E00\u4E2A\u5BF9\u8C61");
  }
  const record = parsed;
  if (record["version"] !== 1) throw new Error(`\u4E0D\u652F\u6301\u7684\u5386\u53F2\u7248\u672C\uFF1A${String(record["version"])}`);
  if (!Array.isArray(record["entries"])) throw new Error("\u5386\u53F2\u6587\u4EF6\u7F3A\u5C11 entries \u6570\u7EC4");
  return { version: 1, entries: record["entries"] };
}
function serializeHistory(history) {
  return `${JSON.stringify(history, null, 2)}
`;
}
var HISTORY_EMBED_PATTERN = /<!--\s*acr:history\s+([A-Za-z0-9+/=]+)\s*-->/;
var MAX_EMBEDDED_FINGERPRINTS = 200;
function embedHistory(entry) {
  const trimmed = {
    ...entry,
    fingerprints: entry.fingerprints.slice(0, MAX_EMBEDDED_FINGERPRINTS)
  };
  return `<!-- acr:history ${Buffer.from(JSON.stringify(trimmed), "utf8").toString("base64")} -->`;
}
function extractEmbeddedHistory(markdown) {
  const match = HISTORY_EMBED_PATTERN.exec(markdown);
  if (match === null) return null;
  try {
    const decoded = Buffer.from(match[1] ?? "", "base64").toString("utf8");
    const parsed = JSON.parse(decoded);
    if (typeof parsed !== "object" || parsed === null) return null;
    const record = parsed;
    if (typeof record["totalScore"] !== "number" || typeof record["inspectedAt"] !== "string")
      return null;
    if (typeof record["scores"] !== "object" || record["scores"] === null) return null;
    return {
      inspectedAt: record["inspectedAt"],
      totalScore: record["totalScore"],
      scores: record["scores"],
      fingerprints: Array.isArray(record["fingerprints"]) ? record["fingerprints"] : [],
      reference: typeof record["reference"] === "string" ? record["reference"] : null
    };
  } catch {
    return null;
  }
}

// src/core/inspection/report.ts
var DIMENSION_LABEL2 = {
  complexity: "\u590D\u6742\u5EA6",
  duplication: "\u91CD\u590D\u5EA6",
  dependency: "\u4F9D\u8D56\u5065\u5EB7",
  "type-safety": "\u7C7B\u578B\u5B89\u5168",
  test: "\u6D4B\u8BD5"
};
var SEVERITY_LABEL2 = {
  blocker: "\u4E25\u91CD",
  major: "\u4E3B\u8981",
  minor: "\u6B21\u8981",
  nit: "\u63D0\u793A"
};
function location(finding) {
  const line = finding.anchor.kind === "removed" ? finding.anchor.oldLine : finding.anchor.newLine;
  return `\`${finding.anchor.file}${line === null ? "" : `:${String(line)}`}\``;
}
function bySeverity(findings, severity) {
  return findings.filter((finding) => finding.severity === severity);
}
function scoreSection(report) {
  const blocks = ["## \u5206\u6570\u660E\u7EC6\uFF08\u53EF\u6838\u5BF9\uFF09"];
  const header = ["| \u7EF4\u5EA6 | \u5F97\u5206 | \u6263\u5206\u660E\u7EC6 |", "| --- | --- | --- |"];
  const rows = report.breakdown.map((item) => {
    const detail = item.items.filter((entry) => entry.deduction > 0).map(
      (entry) => `${entry.label} ${entry.actual}\uFF08\u9608\u503C ${entry.threshold}\uFF09\u2212${String(entry.deduction)}`
    ).join("<br>");
    return `| ${DIMENSION_LABEL2[item.dimension]} | ${String(item.score)} / ${String(item.maxScore)} | ${detail === "" ? "\u2014" : detail} |`;
  });
  blocks.push([...header, ...rows].join("\n"));
  blocks.push(
    `> \u603B\u5206 = \u03A3\uFF08\u5404\u7EF4\u5F97\u5206 \xF7 \u6EE1\u5206 \xD7 \u6743\u91CD\uFF09\u3002\u5F53\u524D\u6743\u91CD\uFF1A${report.breakdown.map((item) => `${DIMENSION_LABEL2[item.dimension]} ${String(item.weight)}%`).join("\u3001")}`
  );
  return blocks;
}
function trendSection(report, previous) {
  if (previous === null) return [];
  const delta = report.totalScore - previous.totalScore;
  const arrow = delta === 0 ? "\u6301\u5E73" : delta > 0 ? `\u2191${String(delta)}` : `\u2193${String(-delta)}`;
  const changed = report.breakdown.map((item) => ({
    dimension: item.dimension,
    diff: item.score - (previous.scores[item.dimension] ?? item.score)
  })).filter((entry) => entry.diff !== 0).sort((a, b) => a.diff - b.diff).map(
    (entry) => `${DIMENSION_LABEL2[entry.dimension]} ${entry.diff > 0 ? "+" : "\u2212"}${String(Math.abs(entry.diff))}`
  );
  const lines = [
    `## \u4E0E\u4E0A\u6B21\u5BF9\u6BD4`,
    "",
    `\u603B\u5206 ${String(previous.totalScore)} \u2192 ${String(report.totalScore)}\uFF08${arrow}\uFF09`
  ];
  if (changed.length > 0) lines.push("", `\u53D8\u5316\u6765\u81EA\uFF1A${changed.join("\u3001")}`);
  if (report.regressions.length > 0)
    lines.push("", `\u65B0\u589E\u6216\u6076\u5316 ${String(report.regressions.length)} \u9879`);
  if (report.resolved.length > 0) lines.push(`\u5DF2\u4FEE\u590D ${String(report.resolved.length)} \u9879`);
  return lines;
}
function actionsSection(report, explicit) {
  if (explicit !== void 0 && explicit.length > 0) {
    return [
      "## \u8FD9\u4E2A\u6708\u6700\u8BE5\u505A\u7684\u4E09\u4EF6\u4E8B",
      "",
      ...explicit.map((text2, index) => `${String(index + 1)}. ${text2}`)
    ];
  }
  const ranked = report.breakdown.map((item) => ({
    dimension: item.dimension,
    lost: item.maxScore - item.score,
    worst: [...item.items].sort((a, b) => b.deduction - a.deduction)[0]
  })).filter((entry) => entry.lost > 0).sort((a, b) => b.lost - a.lost).slice(0, 3);
  if (ranked.length === 0)
    return ["## \u8FD9\u4E2A\u6708\u6700\u8BE5\u505A\u7684\u4E09\u4EF6\u4E8B", "", "\u5404\u9879\u6307\u6807\u90FD\u5728\u9608\u503C\u5185\uFF0C\u4FDD\u6301\u73B0\u72B6\u5373\u53EF\u3002"];
  return [
    "## \u8FD9\u4E2A\u6708\u6700\u8BE5\u505A\u7684\u4E09\u4EF6\u4E8B",
    "",
    ...ranked.map(
      (entry, index) => `${String(index + 1)}. **${DIMENSION_LABEL2[entry.dimension]}**\uFF1A${entry.worst?.label ?? ""} ${entry.worst?.actual ?? ""}\uFF08\u9608\u503C ${entry.worst?.threshold ?? ""}\uFF09`
    )
  ];
}
function renderReport(report, options = {}) {
  const blocks = [];
  const maxListed = options.maxListed ?? 20;
  const blockers = [
    ...bySeverity(report.findings, "blocker"),
    ...bySeverity(report.findings, "major")
  ];
  const suggestions = bySeverity(report.findings, "minor");
  const rest = [...bySeverity(report.findings, "nit")];
  blocks.push(
    [
      `# \u4EE3\u7801\u5DE1\u68C0\u62A5\u544A \xB7 ${report.inspectedAt.slice(0, 10)}`,
      "",
      `**\u4ED3\u5E93** ${report.repository} **\u63D0\u4EA4** \`${report.commitSha.slice(0, 7)}\``,
      `**\u603B\u5206 ${String(report.totalScore)} / 100** **\u95EE\u9898 ${String(report.findings.length)} \u4E2A**\uFF08\u4E25\u91CD ${String(
        report.counts.blocker
      )} \xB7 \u4E3B\u8981 ${String(report.counts.major)} \xB7 \u6B21\u8981 ${String(report.counts.minor)}\uFF09`
    ].join("\n")
  );
  if (blockers.length === 0) {
    blocks.push("## \u5FC5\u987B\u5148\u5904\u7406\n\n\u672C\u8F6E\u6CA1\u6709\u53D1\u73B0\u9700\u8981\u7ACB\u5373\u5904\u7406\u7684\u95EE\u9898\u3002");
  } else {
    const entries = blockers.slice(0, maxListed).map(
      (finding, index) => [
        `### ${String(index + 1)}. ${finding.title}`,
        `${location(finding)} \xB7 ${SEVERITY_LABEL2[finding.severity]} \xB7 ${finding.category}`,
        "",
        finding.body
      ].join("\n")
    );
    blocks.push(["## \u5FC5\u987B\u5148\u5904\u7406", ...entries].join("\n\n"));
  }
  if (suggestions.length > 0) {
    const rows = suggestions.slice(0, maxListed).map((finding) => `| ${location(finding)} | ${finding.title} | ${finding.category} |`);
    blocks.push(
      [
        "## \u5EFA\u8BAE\u672C\u6B21\u8FED\u4EE3\u5904\u7406",
        "",
        ["| \u4F4D\u7F6E | \u95EE\u9898 | \u7C7B\u522B |", "| --- | --- | --- |", ...rows].join("\n")
      ].join("\n")
    );
  }
  if (rest.length > 0) {
    const listed = rest.slice(0, maxListed);
    blocks.push(
      [
        `## \u5176\u4F59\uFF08${String(rest.length)} \u9879\uFF09`,
        "",
        "<details>",
        "<summary>\u5C55\u5F00\u67E5\u770B</summary>",
        "",
        ...listed.map((finding) => `- ${location(finding)} ${finding.title}`),
        ...rest.length > listed.length ? ["", `\u53E6\u6709 ${String(rest.length - listed.length)} \u9879\u672A\u5217\u51FA`] : [],
        "",
        "</details>"
      ].join("\n")
    );
  }
  blocks.push(scoreSection(report).join("\n\n"));
  blocks.push(trendSection(report, options.previous ?? null).join("\n"));
  blocks.push(actionsSection(report, options.actions).join("\n"));
  const body = blocks.filter((block) => block.trim() !== "").join("\n\n") + "\n";
  return options.historyEntry === void 0 ? body : `${body}
${embedHistory(options.historyEntry)}
`;
}

// src/core/inspection/score.ts
var DEFAULT_THRESHOLDS = {
  avgFunctionLines: 40,
  avgCyclomatic: 10,
  maxFileLines: 500,
  complexFunctionCount: 3,
  duplicationRatio: 0.03,
  circularDependencies: 0,
  looseVersionRatio: 0.3,
  anyDensity: 5,
  ignoredChecks: 0,
  testToCodeRatio: 0.6,
  coveragePercent: 80
};
function tiered(value, threshold, unit, cap, per = 1) {
  if (value <= threshold) return 0;
  const steps = Math.ceil((value - threshold) / unit);
  return Math.min(cap, steps * per);
}
function toItems(specs) {
  return {
    items: specs.map((spec) => ({
      metricId: spec.metricId,
      label: spec.label,
      actual: spec.actual,
      threshold: spec.threshold,
      deduction: spec.deduction
    })),
    metrics: specs.map((spec) => ({
      metricId: spec.metricId,
      label: spec.label,
      value: spec.value,
      threshold: spec.thresholdValue,
      exceeded: spec.value > spec.thresholdValue
    }))
  };
}
function buildSpecs(input, t) {
  const { complexity, duplication, dependency, typeSafety, tests } = input;
  return {
    complexity: [
      {
        metricId: "avg-function-lines",
        label: "\u51FD\u6570\u5E73\u5747\u957F\u5EA6",
        actual: `${String(complexity.avgFunctionLines)} \u884C`,
        threshold: `${String(t.avgFunctionLines)} \u884C`,
        value: complexity.avgFunctionLines,
        thresholdValue: t.avgFunctionLines,
        deduction: tiered(complexity.avgFunctionLines, t.avgFunctionLines, 10, 6)
      },
      {
        metricId: "avg-cyclomatic",
        label: "\u5708\u590D\u6742\u5EA6\u5747\u503C",
        actual: String(complexity.avgCyclomatic),
        threshold: String(t.avgCyclomatic),
        value: complexity.avgCyclomatic,
        thresholdValue: t.avgCyclomatic,
        deduction: tiered(complexity.avgCyclomatic, t.avgCyclomatic, 1, 6)
      },
      {
        metricId: "max-file-lines",
        label: "\u6700\u957F\u6587\u4EF6",
        actual: `${String(complexity.maxFileLines)} \u884C`,
        threshold: `${String(t.maxFileLines)} \u884C`,
        value: complexity.maxFileLines,
        thresholdValue: t.maxFileLines,
        deduction: tiered(complexity.maxFileLines, t.maxFileLines, 100, 4)
      },
      {
        metricId: "complex-functions",
        label: "\u8D85\u9650\u51FD\u6570\u6570",
        actual: String(complexity.complexFunctions),
        threshold: String(t.complexFunctionCount),
        value: complexity.complexFunctions,
        thresholdValue: t.complexFunctionCount,
        deduction: tiered(complexity.complexFunctions, t.complexFunctionCount, 1, 4)
      }
    ],
    duplication: [
      {
        metricId: "duplication-ratio",
        label: "\u91CD\u590D\u4EE3\u7801\u5360\u6BD4",
        actual: `${(duplication.ratio * 100).toFixed(1)}%`,
        threshold: `${(t.duplicationRatio * 100).toFixed(1)}%`,
        value: duplication.ratio,
        thresholdValue: t.duplicationRatio,
        // 每超 1 个百分点扣 2 分，最多 20
        deduction: tiered(duplication.ratio, t.duplicationRatio, 0.01, 20, 2)
      }
    ],
    dependency: [
      {
        metricId: "circular-dependencies",
        label: "\u5FAA\u73AF\u4F9D\u8D56",
        actual: String(dependency.circular),
        threshold: String(t.circularDependencies),
        value: dependency.circular,
        thresholdValue: t.circularDependencies,
        deduction: tiered(dependency.circular, t.circularDependencies, 1, 10, 3)
      },
      {
        metricId: "loose-versions",
        label: "\u7248\u672C\u8303\u56F4\u8FC7\u5BBD\u7684\u4F9D\u8D56\u5360\u6BD4",
        actual: `${(dependency.looseRatio * 100).toFixed(0)}%`,
        threshold: `${(t.looseVersionRatio * 100).toFixed(0)}%`,
        value: dependency.looseRatio,
        thresholdValue: t.looseVersionRatio,
        deduction: tiered(dependency.looseRatio, t.looseVersionRatio, 0.1, 10, 3)
      }
    ],
    "type-safety": [
      {
        metricId: "any-density",
        label: "\u6BCF\u5343\u884C any \u6570\u91CF",
        actual: String(typeSafety.anyDensity),
        threshold: String(t.anyDensity),
        value: typeSafety.anyDensity,
        thresholdValue: t.anyDensity,
        deduction: tiered(typeSafety.anyDensity, t.anyDensity, 2, 12, 2)
      },
      {
        metricId: "ignored-checks",
        label: "\u5FFD\u7565\u68C0\u67E5\u7684\u6CE8\u91CA\u6570",
        actual: String(typeSafety.ignoredChecks),
        threshold: String(t.ignoredChecks),
        value: typeSafety.ignoredChecks,
        thresholdValue: t.ignoredChecks,
        deduction: tiered(typeSafety.ignoredChecks, t.ignoredChecks, 1, 8, 2)
      }
    ],
    test: [
      {
        metricId: "coverage",
        label: "\u884C\u8986\u76D6\u7387",
        actual: tests.coveragePercent === null ? "\u672A\u63D0\u4F9B" : `${String(tests.coveragePercent)}%`,
        threshold: `${String(t.coveragePercent)}%`,
        value: tests.coveragePercent ?? 0,
        thresholdValue: t.coveragePercent,
        // 没有覆盖率数据时不扣分：拿「不知道」当「零」会平白扣掉一整个维度
        deduction: tests.coveragePercent === null ? 0 : tiered(t.coveragePercent - tests.coveragePercent, 0, 10, 12)
      },
      {
        metricId: "test-ratio",
        label: "\u6D4B\u8BD5\u4E0E\u6E90\u7801\u6587\u4EF6\u6BD4",
        actual: String(tests.ratio),
        threshold: String(t.testToCodeRatio),
        value: tests.ratio,
        thresholdValue: t.testToCodeRatio,
        deduction: tiered(t.testToCodeRatio - tests.ratio, 0, 0.2, 8, 2)
      }
    ]
  };
}
function scoreInspection(input) {
  const thresholds = input.thresholds ?? DEFAULT_THRESHOLDS;
  const maxScore = input.config.maxScorePerDimension;
  const specs = buildSpecs(input, thresholds);
  const breakdown = [];
  const metrics = [];
  const scores = {};
  for (const dimension of Object.keys(specs)) {
    const converted = toItems(specs[dimension]);
    const deduction = converted.items.reduce((sum, item) => sum + item.deduction, 0);
    const score = Math.max(0, maxScore - deduction);
    scores[dimension] = score;
    metrics.push(...converted.metrics);
    breakdown.push({
      dimension,
      score,
      maxScore,
      weight: input.config.weights[dimension],
      items: converted.items
    });
  }
  const weightSum = breakdown.reduce((sum, item) => sum + item.weight, 0);
  const weighted = breakdown.reduce(
    (sum, item) => sum + item.score / item.maxScore * item.weight,
    0
  );
  const totalScore = weightSum === 0 ? 0 : Math.round(weighted / weightSum * 100);
  return { breakdown, totalScore, scores, metrics };
}

// src/core/inspection/file-rules.ts
var EMPTY_CATCH = /catch\s*(\([^)]*\))?\s*\{\s*(\/\/[^\n]*|\/\*[\s\S]*?\*\/)?\s*\}/;
var HARDCODED_SECRET = /\b(api[_-]?key|secret|password|passwd|token|access[_-]?key)\b\s*[:=]\s*['"`][^'"`]{8,}['"`]/i;
function cyclomaticOf(lines, startLine, endLine) {
  const patterns = [
    /\bif\s*\(/g,
    /\bfor\s*\(/g,
    /\bwhile\s*\(/g,
    /\bcase\s+/g,
    /\bcatch\s*\(/g,
    /&&/g,
    /\|\|/g,
    /\?\?/g
  ];
  let branches = 0;
  for (let index = startLine - 1; index < endLine && index < lines.length; index += 1) {
    const line = lines[index] ?? "";
    for (const pattern of patterns) {
      const local = new RegExp(pattern.source, "g");
      branches += Math.max(0, (line.match(local) ?? []).length);
    }
  }
  return branches + 1;
}
function checkFileRules(files, thresholds = DEFAULT_THRESHOLDS) {
  const issues = [];
  for (const file of files) {
    const lines = file.content.split("\n");
    if (lines.length > thresholds.maxFileLines) {
      issues.push({
        path: file.path,
        line: null,
        rule: "file-too-long",
        severity: "minor",
        title: `\u6587\u4EF6 ${String(lines.length)} \u884C\uFF0C\u8D85\u8FC7\u9608\u503C ${String(thresholds.maxFileLines)}`,
        detail: "\u6587\u4EF6\u8FC7\u957F\u4F1A\u8BA9\u5B9A\u4F4D\u4E0E\u8BC4\u5BA1\u90FD\u53D8\u6162\uFF0C\u5EFA\u8BAE\u6309\u804C\u8D23\u62C6\u5206\u3002"
      });
    }
    for (const region of listFunctions(lines)) {
      const complexity = cyclomaticOf(lines, region.startLine, region.endLine);
      if (complexity <= thresholds.avgCyclomatic) continue;
      issues.push({
        path: file.path,
        line: region.startLine,
        rule: "complex-function",
        severity: complexity > thresholds.avgCyclomatic * 2 ? "major" : "minor",
        title: `${region.name}() \u5708\u590D\u6742\u5EA6 ${String(complexity)}`,
        detail: `\u9608\u503C ${String(thresholds.avgCyclomatic)}\u3002\u5206\u652F\u8D8A\u591A\uFF0C\u6D4B\u8BD5\u8986\u76D6\u8D8A\u96BE\u505A\u5168\u3002`
      });
    }
    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index] ?? "";
      if (EMPTY_CATCH.test(line)) {
        issues.push({
          path: file.path,
          line: index + 1,
          rule: "empty-catch",
          severity: "major",
          title: "\u5F02\u5E38\u88AB\u9759\u9ED8\u541E\u6389",
          detail: "\u51FA\u9519\u65F6\u4E0D\u4F1A\u6709\u4EFB\u4F55\u8BB0\u5F55\uFF0C\u6392\u67E5\u7EBF\u4E0A\u95EE\u9898\u65F6\u8FD9\u6761\u7EBF\u7D22\u76F4\u63A5\u6D88\u5931\u3002"
        });
      }
      if (HARDCODED_SECRET.test(line)) {
        issues.push({
          path: file.path,
          line: index + 1,
          rule: "hardcoded-secret",
          severity: "major",
          title: "\u7591\u4F3C\u5199\u6B7B\u7684\u51ED\u8BC1",
          detail: "\u51ED\u8BC1\u8FDB\u4E86\u4EE3\u7801\u5C31\u8FDB\u4E86\u7248\u672C\u5386\u53F2\uFF0C\u8F6E\u6362\u524D\u4E00\u76F4\u6709\u6548\u3002\u5E94\u6539\u4E3A\u4ECE\u73AF\u5883\u53D8\u91CF\u6216\u5BC6\u94A5\u670D\u52A1\u8BFB\u53D6\u3002"
        });
      }
    }
  }
  return issues;
}

// src/core/inspection/metrics.ts
var DECISION_PATTERNS = [
  /\bif\s*\(/g,
  /\bfor\s*\(/g,
  /\bwhile\s*\(/g,
  /\bcase\s+/g,
  /\bcatch\s*\(/g,
  /&&/g,
  /\|\|/g,
  /\?\?/g,
  /\?\s*[^:]+:/g
];
function decisionPoints(line) {
  let count = 0;
  for (const pattern of DECISION_PATTERNS) {
    const local = new RegExp(pattern.source, "g");
    count += Math.max(0, (line.match(local) ?? []).length);
  }
  return count;
}
function cyclomaticOf2(lines, startLine, endLine) {
  let branches = 0;
  for (let index = startLine - 1; index < endLine && index < lines.length; index += 1) {
    branches += decisionPoints(lines[index] ?? "");
  }
  return branches + 1;
}
function computeComplexity(files, complexityThreshold) {
  let totalLines = 0;
  let functionCount = 0;
  let functionLines = 0;
  let maxFunctionLines = 0;
  let maxFileLines = 0;
  let complexFunctions = 0;
  let cyclomaticSum = 0;
  let maxCyclomatic = 0;
  for (const file of files) {
    const lines = file.content.split("\n");
    totalLines += lines.length;
    maxFileLines = Math.max(maxFileLines, lines.length);
    for (const region of listFunctions(lines)) {
      const length = region.endLine - region.startLine + 1;
      const cyclomatic = cyclomaticOf2(lines, region.startLine, region.endLine);
      functionCount += 1;
      functionLines += length;
      maxFunctionLines = Math.max(maxFunctionLines, length);
      cyclomaticSum += cyclomatic;
      maxCyclomatic = Math.max(maxCyclomatic, cyclomatic);
      if (cyclomatic > complexityThreshold) complexFunctions += 1;
    }
  }
  return {
    files: files.length,
    totalLines,
    functions: functionCount,
    avgFunctionLines: functionCount === 0 ? 0 : Math.round(functionLines / functionCount),
    maxFunctionLines,
    avgCyclomatic: functionCount === 0 ? 0 : Number((cyclomaticSum / functionCount).toFixed(1)),
    maxCyclomatic,
    complexFunctions,
    maxFileLines
  };
}
var DUPLICATION_WINDOW = 6;
function normalizeForHash(line) {
  return line.replace(/\s+/g, " ").trim();
}
function computeDuplication(files) {
  const windows = /* @__PURE__ */ new Map();
  const marked = /* @__PURE__ */ new Set();
  let totalLines = 0;
  for (const file of files) {
    const lines = file.content.split("\n").map(normalizeForHash);
    const significant = lines.filter((line) => line !== "");
    totalLines += significant.length;
    for (let start = 0; start + DUPLICATION_WINDOW <= significant.length; start += 1) {
      const key = significant.slice(start, start + DUPLICATION_WINDOW).join("\n");
      const seen = windows.get(key);
      if (seen === void 0) {
        windows.set(key, 1);
        continue;
      }
      windows.set(key, seen + 1);
      for (let offset = 0; offset < DUPLICATION_WINDOW; offset += 1) {
        marked.add(`${file.path}\0${String(start + offset)}`);
      }
    }
  }
  return {
    ratio: totalLines === 0 ? 0 : Number((marked.size / totalLines).toFixed(4)),
    duplicatedLines: marked.size,
    totalLines,
    blocks: [...windows.values()].filter((count) => count > 1).length
  };
}
function resolveRelative(fromPath, source) {
  if (!source.startsWith(".")) return null;
  const segments = fromPath.split("/").slice(0, -1);
  for (const part of source.split("/")) {
    if (part === "." || part === "") continue;
    if (part === "..") segments.pop();
    else segments.push(part);
  }
  return segments.join("/");
}
function countCircularDependencies(files) {
  const known = new Set(files.map((file) => file.path));
  const edges = /* @__PURE__ */ new Map();
  for (const file of files) {
    const targets = [];
    const pattern = /from\s+['"](\.[^'"]+)['"]/g;
    for (const match of file.content.matchAll(pattern)) {
      const base = resolveRelative(file.path, match[1] ?? "");
      if (base === null) continue;
      const candidate = [`${base}.ts`, `${base}.tsx`, `${base}.js`, `${base}/index.ts`, base].find(
        (path) => known.has(path)
      );
      if (candidate !== void 0) targets.push(candidate);
    }
    edges.set(file.path, targets);
  }
  let circular = 0;
  const state = /* @__PURE__ */ new Map();
  const visit = (path) => {
    const current = state.get(path);
    if (current === "done") return;
    if (current === "visiting") {
      circular += 1;
      return;
    }
    state.set(path, "visiting");
    for (const next of edges.get(path) ?? []) visit(next);
    state.set(path, "done");
  };
  for (const file of files) visit(file.path);
  return circular;
}
function computeDependencies(files) {
  const manifest = files.find(
    (file) => file.path === "package.json" || file.path.endsWith("/package.json")
  );
  let total = 0;
  let loose = 0;
  if (manifest !== void 0) {
    try {
      const parsed = JSON.parse(manifest.content);
      const sections = ["dependencies", "devDependencies"];
      for (const section of sections) {
        const block = parsed[section];
        if (typeof block !== "object" || block === null) continue;
        for (const range of Object.values(block)) {
          if (typeof range !== "string") continue;
          total += 1;
          if (/^[\^~*]|^>=|^latest$/.test(range)) loose += 1;
        }
      }
    } catch {
    }
  }
  return {
    total,
    loose,
    looseRatio: total === 0 ? 0 : Number((loose / total).toFixed(2)),
    circular: countCircularDependencies(files),
    // 过期与漏洞需要查外部数据库，没有数据就不假装有
    checkedOutdated: false
  };
}
function computeTypeSafety(files) {
  let anyCount = 0;
  let ignoredChecks = 0;
  let totalLines = 0;
  for (const file of files) {
    const lines = file.content.split("\n");
    totalLines += lines.length;
    for (const line of lines) {
      if (/@ts-ignore|@ts-expect-error|eslint-disable.*no-explicit-any/.test(line))
        ignoredChecks += 1;
      const trimmed = line.trim();
      if (trimmed.startsWith("//") || trimmed.startsWith("*")) continue;
      if (/:\s*any\b|<any>|as\s+any\b/.test(line)) anyCount += 1;
    }
  }
  return {
    anyCount,
    ignoredChecks,
    anyDensity: totalLines === 0 ? 0 : Number((anyCount / totalLines * 1e3).toFixed(1)),
    totalLines
  };
}
var TEST_PATTERN = /(\.|-)(test|spec)\.[a-z]+$|(^|\/)__tests__\//i;
function computeTests(files, coveragePercent = null) {
  const testFiles = files.filter((file) => TEST_PATTERN.test(file.path)).length;
  const sourceFiles = files.length - testFiles;
  return {
    sourceFiles,
    testFiles,
    ratio: sourceFiles === 0 ? 0 : Number((testFiles / sourceFiles).toFixed(2)),
    coveragePercent
  };
}

// src/core/inspection/run.ts
function toFindings(files, thresholds) {
  return checkFileRules(files, thresholds).map((issue) => {
    const line = issue.line ?? 1;
    const fingerprint = computeFingerprint({
      file: issue.path,
      reviewer: "correctness",
      title: issue.title,
      evidence: `${issue.rule}:${issue.path}:${issue.title}`
    });
    return {
      fingerprint,
      reviewer: "correctness",
      // 巡检没有改动，锚点用「上下文行」表达：这行在文件里存在，但不属于任何一次改动
      anchor: { file: issue.path, oldPath: null, kind: "context", newLine: line, oldLine: line },
      positionOrigin: "model-line",
      severity: issue.severity,
      category: issue.rule,
      title: issue.title,
      body: issue.detail,
      evidence: issue.title,
      suggestion: null,
      confidence: 1,
      preexisting: true,
      scope: "file"
    };
  });
}
function countBySeverity2(findings) {
  const counts = { blocker: 0, major: 0, minor: 0, nit: 0 };
  for (const finding of findings) counts[finding.severity] += 1;
  return counts;
}
function runInspection(input) {
  const complexity = computeComplexity(
    input.files,
    (input.thresholds ?? void 0)?.avgCyclomatic ?? 10
  );
  const duplication = computeDuplication(input.files);
  const dependency = computeDependencies(input.files);
  const typeSafety = computeTypeSafety(input.files);
  const tests = computeTests(input.files, input.coveragePercent ?? null);
  const scored = scoreInspection({
    complexity,
    duplication,
    dependency,
    typeSafety,
    tests,
    config: input.config,
    ...input.thresholds === void 0 ? {} : { thresholds: input.thresholds }
  });
  const findings = toFindings(input.files, input.thresholds);
  const counts = countBySeverity2(findings);
  const current = new Set(findings.map((finding) => finding.fingerprint));
  const previous = new Set(input.previousFingerprints ?? []);
  const hasPrevious = input.previousFingerprints !== void 0;
  const regressions = hasPrevious ? [...current].filter((fingerprint) => !previous.has(fingerprint)) : [];
  const resolved = hasPrevious ? [...previous].filter((fingerprint) => !current.has(fingerprint)) : [];
  const scores = {};
  for (const item of scored.breakdown) scores[item.dimension] = item.score;
  return {
    repository: input.repository,
    commitSha: input.commitSha,
    inspectedAt: (input.now ?? (() => (/* @__PURE__ */ new Date()).toISOString()))(),
    metrics: scored.metrics,
    breakdown: scored.breakdown,
    totalScore: scored.totalScore,
    scores,
    counts: {
      blocker: counts.blocker,
      major: counts.major,
      minor: counts.minor,
      nit: counts.nit
    },
    findings,
    regressions,
    resolved,
    previousRef: null,
    location: null
  };
}

// src/cli/walk.ts
import { readdir, readFile as readFile2 } from "node:fs/promises";
import { join as join2, relative } from "node:path";
var SOURCE_EXTENSIONS = /* @__PURE__ */ new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".vue",
  ".svelte",
  ".py",
  ".go",
  ".java",
  ".rs",
  ".rb",
  ".php",
  ".cs"
]);
var SKIP_DIRS = /* @__PURE__ */ new Set([
  "node_modules",
  "dist",
  "build",
  "out",
  "coverage",
  ".git",
  ".next",
  ".nuxt",
  ".workbuddy",
  "vendor",
  "__pycache__",
  ".venv"
]);
function isSourceFile(path) {
  const dot = path.lastIndexOf(".");
  if (dot < 0) return false;
  return SOURCE_EXTENSIONS.has(path.slice(dot).toLowerCase());
}
async function collectSourceFiles(root, maxFiles = 5e3) {
  const files = [];
  const walk = async (dir) => {
    if (files.length >= maxFiles) return;
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (files.length >= maxFiles) return;
      if (entry.isDirectory()) {
        if (SKIP_DIRS.has(entry.name)) continue;
        await walk(join2(dir, entry.name));
        continue;
      }
      if (!entry.isFile()) continue;
      if (!isSourceFile(entry.name)) continue;
      const absolute = join2(dir, entry.name);
      const path = relative(root, absolute).split("\\").join("/");
      files.push({ path, content: await readFile2(absolute, "utf8") });
    }
  };
  await walk(root);
  return files.sort((a, b) => a.path.localeCompare(b.path));
}
async function readOptional(root, name) {
  try {
    const content = await readFile2(join2(root, name), "utf8");
    return { path: name, content };
  } catch {
    return null;
  }
}

// src/cli/stats.ts
var ORIGIN_LABEL = {
  "model-line": "\u6A21\u578B\u884C\u53F7",
  "evidence-hunk": "\u8BC1\u636E\u5757\u5185",
  "evidence-file": "\u8BC1\u636E\u5168\u6587",
  "evidence-crossfile": "\u8DE8\u6587\u4EF6\u642C\u79FB"
};
var REASON_LABEL = {
  "file-not-in-diff": "\u6587\u4EF6\u4E0D\u5728\u6539\u52A8\u4E2D",
  "evidence-mismatch": "\u8BC1\u636E\u4E0D\u5B58\u5728",
  unlocatable: "\u8BC1\u636E\u547D\u4E2D\u591A\u5904",
  "schema-invalid": "\u8F93\u51FA\u4E0D\u5408\u89C4\u8303",
  duplicate: "\u91CD\u590D",
  "below-severity-floor": "\u4F4E\u4E8E\u4E25\u91CD\u5EA6\u4E0B\u9650"
};
function formatTokens(value) {
  if (value < 1e3) return String(value);
  return `${(value / 1e3).toFixed(1)}k`;
}
function costLine(result) {
  const cost = result.usage.estimatedCostUsd;
  if (cost === null) return "\u8D39\u7528\uFF1A\u672A\u914D\u7F6E\u5355\u4EF7\uFF0C\u65E0\u6CD5\u6298\u7B97";
  return `\u2248 $${cost.toFixed(4)}`;
}
function originSection(findings) {
  const counts = /* @__PURE__ */ new Map();
  for (const finding of findings) {
    counts.set(finding.positionOrigin, (counts.get(finding.positionOrigin) ?? 0) + 1);
  }
  const parts = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([origin, count]) => `${ORIGIN_LABEL[origin] ?? origin} ${String(count)}`);
  return `\u5B9A\u4F4D\u6765\u6E90\uFF1A${parts.length === 0 ? "\uFF08\u65E0\uFF09" : parts.join("\uFF0C")}`;
}
function rejectionSection(result, verbose) {
  if (result.rejections.length === 0) return [];
  const counts = /* @__PURE__ */ new Map();
  for (const rejection of result.rejections) {
    counts.set(rejection.reason, (counts.get(rejection.reason) ?? 0) + 1);
  }
  const detail = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([reason, count]) => `${REASON_LABEL[reason]} ${String(count)}`).join("\uFF0C");
  const lines = [`\u4E22\u5F03 ${String(result.rejections.length)} \u6761`, `  \u4E22\u5F03\u539F\u56E0\uFF1A${detail}`];
  if (verbose) {
    for (const rejection of result.rejections.slice(0, 10)) {
      const where = `${rejection.file}:${String(rejection.line)}`;
      lines.push(`  \xB7 [${rejection.reviewer}] ${where} ${rejection.title.slice(0, 50)}`);
      lines.push(`    \u539F\u56E0\uFF1A${rejection.detail}`);
    }
    if (result.rejections.length > 10) {
      lines.push(`  \xB7 \u53E6\u6709 ${String(result.rejections.length - 10)} \u6761\u672A\u5217\u51FA`);
    }
  }
  return lines;
}
function formatStats(input) {
  const { result } = input;
  const tokens = result.usage.tokens;
  const routed = result.summaryOnly.filter((finding) => finding.scope === "changed").length;
  const lines = [];
  lines.push(
    `\u6587\u4EF6 ${String(input.files)} \u4E2A / \u8C03\u7528 ${String(result.usage.calls)} \u6B21 / \u8F93\u5165 ${formatTokens(
      tokens.uncachedInput + tokens.cacheRead + tokens.cacheWriteShort + tokens.cacheWriteLong
    )} tok \u8F93\u51FA ${formatTokens(tokens.output)} tok ${costLine(result)}`
  );
  lines.push(
    // 「摘要 1 条」指那条汇总评论；routed 是被行内挤下来、只能写进摘要的问题数。
    // 早先这行把两个数字写成一个，读起来像「摘要评论有 N 条」，对不上实际。
    `\u884C\u5185 ${String(result.actions.filter((action) => action.kind === "create").length)} \u6761\uFF1B\u6458\u8981\u8BC4\u8BBA 1 \u6761${routed > 0 ? `\uFF08\u53E6 ${String(routed)} \u6761\u95EE\u9898\u56E0\u884C\u5185\u5DF2\u6EE1\u653E\u8FDB\u6458\u8981\uFF09` : ""}`
  );
  if (tokens.uncachedInput + tokens.cacheRead + tokens.cacheWriteShort + tokens.cacheWriteLong > 0) {
    lines.push(
      `token \u6784\u6210\uFF1A\u672A\u7F13\u5B58 ${formatTokens(tokens.uncachedInput)} / \u7F13\u5B58\u8BFB ${formatTokens(tokens.cacheRead)} / \u7F13\u5B58\u5199 ${formatTokens(
        tokens.cacheWriteShort + tokens.cacheWriteLong
      )} / \u8F93\u51FA ${formatTokens(tokens.output)}`
    );
  }
  if (result.usage.breakdown !== null) {
    const parts = [
      ["\u672A\u7F13\u5B58", result.usage.breakdown.uncachedInput],
      ["\u7F13\u5B58\u5199", result.usage.breakdown.cacheWriteShort + result.usage.breakdown.cacheWriteLong],
      ["\u7F13\u5B58\u8BFB", result.usage.breakdown.cacheRead],
      ["\u8F93\u51FA", result.usage.breakdown.output]
    ].filter(([, value]) => value > 0).map(([label, value]) => `${String(label)} ${formatUsd(value)}`);
    lines.push(`\u6210\u672C\u6784\u6210\uFF1A${parts.join(" \xB7 ")}`);
  }
  lines.push(originSection(result.findings));
  if (input.dryRun && result.findings.length > 0) {
    lines.push("\u7ED3\u8BBA\u6307\u7EB9\uFF1A");
    for (const finding of result.findings.slice(0, 12)) {
      const where = `${finding.anchor.file}:${String(finding.anchor.newLine ?? finding.anchor.oldLine ?? 0)}`;
      lines.push(`  \xB7 ${finding.fingerprint} ${where}`);
      lines.push(`    \u8BC1\u636E=${JSON.stringify(finding.evidence)}`);
    }
  }
  lines.push(...rejectionSection(result, input.dryRun));
  lines.push("\u884C\u5185 + \u6458\u8981\u5408\u8BA1\u672A\u4E22\u4EFB\u4F55\u901A\u8FC7\u6821\u9A8C\u7684\u6761\u76EE");
  lines.push(
    `\u8986\u76D6\u7387\uFF1A\u8BA1\u5212 ${String(result.coverage.planned)} / \u5B8C\u6210 ${String(result.coverage.completed)} / \u8DF3\u8FC7 ${String(result.coverage.skipped)}`
  );
  if (result.warnings.length > 0) {
    lines.push(`\u544A\u8B66 ${String(result.warnings.length)} \u6761\uFF1A`);
    for (const warning of result.warnings) {
      lines.push(`  \xB7 [${warning.kind}] ${warning.message}`);
    }
  }
  if (input.dryRun) {
    lines.push("");
    lines.push("\uFF08\u53EA\u6253\u5370\u6A21\u5F0F\uFF1A\u4EE5\u4E0A\u5185\u5BB9\u672A\u53D1\u9001\u5230\u5E73\u53F0\uFF09");
  }
  return lines.join("\n");
}
function formatComparison(comparison) {
  if (!comparison.comparable) return `\u65E0\u6CD5\u5BF9\u6BD4\uFF1A${comparison.reason}`;
  const lines = [];
  lines.push("\u6307\u6807          \u57FA\u51C6        \u672C\u6B21        \u53D8\u5316");
  for (const metric of comparison.metrics) {
    const format = (value) => metric.name.includes("\u5EF6\u8FDF") ? `${(value / 1e3).toFixed(1)}s` : metric.name.includes("\u6210\u672C") ? formatUsd(value) : value.toFixed(3);
    const arrow = metric.delta === 0 ? "\u2014" : metric.delta > 0 ? "\u2191" : "\u2193";
    lines.push(
      `${metric.name.padEnd(10, " ")}  ${format(metric.before).padStart(8, " ")}  ${format(metric.after).padStart(8, " ")}  ${arrow} ${format(
        Math.abs(metric.delta)
      )}`
    );
  }
  if (comparison.changedPrompts.length > 0) {
    lines.push(`
\u53D8\u66F4\u7684\u7EF4\u5EA6\uFF1A${comparison.changedPrompts.join("\u3001")}`);
  }
  if (comparison.crossModel) {
    lines.push("\u6CE8\u610F\uFF1A\u4E24\u6B21\u4F7F\u7528\u7684\u6A21\u578B\u4E0D\u540C\uFF0C\u7ED3\u8BBA\u4EC5\u4F9B\u53C2\u8003");
  }
  lines.push(`
\u7ED3\u8BBA\uFF1A${comparison.verdict}`);
  return lines.join("\n");
}

// src/cli/main.ts
var COMMANDS = ["review", "dry-run", "inspect", "cost", "eval"];
var USAGE = `acr \u2014 AI \u4EE3\u7801\u5BA1\u67E5

\u7528\u6CD5:
  acr <\u5B50\u547D\u4EE4> [\u9009\u9879]

\u5B50\u547D\u4EE4:
  review     \u5BA1\u67E5\u4E00\u6B21\u4EE3\u7801\u6539\u52A8\u5E76\u53D1\u9001\u8BC4\u8BBA
  dry-run    \u540C\u4E0A\uFF0C\u4F46\u53EA\u6253\u5370\u7ED3\u679C\uFF0C\u4E0D\u53D1\u9001\u4EFB\u4F55\u5199\u8BF7\u6C42
  inspect    \u5DE1\u68C0\u6574\u4E2A\u4ED3\u5E93\u5E76\u51FA\u62A5\u544A
  cost       \u9884\u4F30\u4E00\u6B21\u5BA1\u67E5\u7684\u82B1\u8D39
  eval       \u8DD1\u8BC4\u4F30\u96C6\u5E76\u4E0E\u57FA\u51C6\u5BF9\u6BD4

\u5E38\u7528\u9009\u9879:
  --repo <owner/name>   \u4ED3\u5E93\uFF1B\u4E5F\u53EF\u7528\u73AF\u5883\u53D8\u91CF ACR_REPOSITORY
  --pr <\u7F16\u53F7>           \u5408\u5E76\u8BF7\u6C42\u7F16\u53F7
  --commit <sha>        \u5BA1\u67E5\u5355\u7B14\u63D0\u4EA4\uFF08\u4E0E\u7236\u63D0\u4EA4\u5BF9\u6BD4\uFF09\uFF1B\u53EA\u652F\u6301 dry-run\uFF0C\u56E0\u4E3A\u6CA1\u6709\u8BC4\u8BBA\u533A\u53EF\u8D34
  --files <\u6570\u91CF>        cost \u7528\uFF1A\u9884\u8BA1\u6539\u52A8\u6587\u4EF6\u6570
  --lines <\u6570\u91CF>        cost \u7528\uFF1A\u9884\u8BA1\u6539\u52A8\u884C\u6570

  acr <\u5B50\u547D\u4EE4> --help   \u67E5\u770B\u5B50\u547D\u4EE4\u9009\u9879
`;
function parseFlags(args) {
  const flags = {};
  for (let index = 0; index < args.length; index += 1) {
    const token = args[index] ?? "";
    if (!token.startsWith("--")) continue;
    const name = token.slice(2);
    const next = args[index + 1];
    if (next === void 0 || next.startsWith("--")) {
      flags[name] = "";
      continue;
    }
    flags[name] = next;
    index += 1;
  }
  return flags;
}
function isCommand(value) {
  return COMMANDS.includes(value);
}
var execFileAsync = promisify(execFile);
async function runCommand(command, args, cwd) {
  await execFileAsync(command, [...args], { cwd });
}
async function readHistory(path) {
  try {
    return parseHistory(await readFile3(path, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return EMPTY_HISTORY;
    throw error;
  }
}
function parseRepo(value) {
  const parts = value.split("/");
  if (parts.length !== 2) return null;
  const [owner, repo] = parts;
  if (owner === void 0 || repo === void 0 || owner === "" || repo === "") return null;
  return { owner, repo };
}
function estimateCostText(config, files, lines) {
  const perFileInput = 6500;
  const fixedPerFile = 2500;
  const calls = Math.ceil(files * 1.3) + 2;
  const uncached = files * (perFileInput - fixedPerFile) + lines * 4;
  const cached = files * fixedPerFile;
  const output = calls * 300;
  const pricing = config.llm.pricing;
  const tokens = `\u9884\u8BA1 ${String(calls)} \u6B21\u8C03\u7528 / \u8F93\u5165\u7EA6 ${String(Math.round(uncached / 1e3))}k + \u7F13\u5B58 ${String(
    Math.round(cached / 1e3)
  )}k tok / \u8F93\u51FA\u7EA6 ${String(Math.round(output / 1e3))}k tok`;
  if (pricing === null) {
    return `${tokens}
\u8D39\u7528\uFF1A\u672A\u914D\u7F6E\u5355\u4EF7\uFF0C\u65E0\u6CD5\u6298\u7B97\uFF08\u5728\u914D\u7F6E\u91CC\u586B llm.pricing \u540E\u53EF\u4F30\u7B97\uFF09`;
  }
  const inputPrice = pricing.inputPerMTok / 1e6;
  const cost = uncached * inputPrice + cached * inputPrice * pricing.cacheReadMultiplier + output * (pricing.outputPerMTok / 1e6);
  const noCacheCost = uncached * inputPrice + cached * inputPrice + output * (pricing.outputPerMTok / 1e6);
  return `${tokens}
\u9884\u8BA1\u8D39\u7528 \u2248 $${cost.toFixed(4)}\uFF08\u547D\u4E2D\u63D0\u793A\u8BCD\u7F13\u5B58\uFF1B\u672A\u547D\u4E2D\u7EA6 $${noCacheCost.toFixed(
    4
  )}\uFF09
\u5F53\u524D\u9884\u7B97\u4E0A\u9650\uFF1A$${String(config.review.maxBudgetUsd)}`;
}
async function runReviewCommand(flags, deps, dryRun) {
  const loaded = await loadConfig(deps.cwd);
  if (!loaded.ok) {
    deps.stderr("\u914D\u7F6E\u6709\u8BEF\uFF1A\n");
    for (const error of loaded.errors) {
      deps.stderr(`  ${error.path === "" ? "(\u6839)" : error.path}\uFF1A${error.message}
`);
    }
    return 1;
  }
  const config = loaded.config;
  const repoText = flags["repo"] ?? config.platform.repository ?? deps.env["ACR_REPOSITORY"];
  const repo = repoText === void 0 || repoText === null ? null : parseRepo(repoText);
  if (repo === null) {
    deps.stderr("\u7F3A\u5C11\u4ED3\u5E93\uFF1A\u8BF7\u7528 --repo owner/name \u6307\u5B9A\uFF0C\u6216\u8BBE\u7F6E ACR_REPOSITORY\n");
    return 3;
  }
  const commitText = flags["commit"] ?? "";
  const isCommitMode = commitText !== "";
  if (isCommitMode && !dryRun) {
    deps.stderr("\u6309\u63D0\u4EA4\u5BA1\u67E5\u4E0D\u652F\u6301\u53D1\u8BC4\u8BBA\uFF08\u63D0\u4EA4\u6CA1\u6709\u8BC4\u8BBA\u533A\uFF09\uFF0C\u8BF7\u6539\u7528 dry-run\n");
    return 2;
  }
  const prText = flags["pr"] ?? deps.env["ACR_PULL_REQUEST"];
  const prNumber = prText === void 0 || prText === "" ? Number.NaN : Number(prText);
  if (!isCommitMode && (!Number.isInteger(prNumber) || prNumber <= 0)) {
    deps.stderr("\u7F3A\u5C11\u5BA1\u67E5\u5BF9\u8C61\uFF1A\u7528 --pr <\u7F16\u53F7> \u5BA1\u5408\u5E76\u8BF7\u6C42\uFF0C\u6216 --commit <sha> \u5BA1\u5355\u7B14\u63D0\u4EA4\n");
    return 3;
  }
  const token = deps.env[config.platform.tokenEnv] ?? deps.env["GITHUB_TOKEN"] ?? "";
  if (token === "" && !dryRun) {
    deps.stderr(`\u7F3A\u5C11\u5E73\u53F0\u4EE4\u724C\uFF1A\u8BF7\u8BBE\u7F6E\u73AF\u5883\u53D8\u91CF ${config.platform.tokenEnv}
`);
    return 3;
  }
  if (token === "") {
    deps.stderr("\u544A\u8B66\uFF1A\u672A\u63D0\u4F9B\u5E73\u53F0\u4EE4\u724C\uFF0C\u5C06\u4EE5\u533F\u540D\u8EAB\u4EFD\u8BFB\u53D6\uFF08\u9650\u901F 60 \u6B21/\u5C0F\u65F6\uFF0C\u53EF\u80FD\u4E2D\u9014\u88AB\u62E6\uFF09\n");
  }
  const apiKey = deps.env[config.llm.apiKeyEnv];
  if (apiKey === void 0 || apiKey === "") {
    deps.stderr(`\u7F3A\u5C11\u6A21\u578B\u5BC6\u94A5\uFF1A\u8BF7\u8BBE\u7F6E\u73AF\u5883\u53D8\u91CF ${config.llm.apiKeyEnv}
`);
    return 3;
  }
  const ref = { ...repo, number: prNumber };
  const gateway = createGitHubGateway(token);
  const request2 = isCommitMode ? {
    repository: `${repo.owner}/${repo.repo}`,
    mode: "commit",
    pullRequestNumber: null,
    baseRef: null,
    headRef: commitText,
    dryRun
  } : {
    repository: `${repo.owner}/${repo.repo}`,
    mode: "pull-request",
    pullRequestNumber: prNumber,
    baseRef: null,
    headRef: null,
    dryRun
  };
  const client = createOpenAiCompatClient({
    baseUrl: config.llm.baseUrl,
    apiKey,
    headers: config.llm.headers,
    structuredOutput: config.llm.structuredOutput
  });
  const shas = isCommitMode ? { head: "", base: "" } : await gateway.getPullRequestShas(ref);
  const headSha = shas.head;
  const result = await runReview(request2, {
    config,
    client,
    fetchSnapshot: async () => {
      const fetched = isCommitMode ? await fetchCommitSnapshot(gateway, repo, commitText, config.review.skipPaths) : await fetchSnapshot(gateway, ref, headSha, config.review.skipPaths, shas.base);
      for (const warning of fetched.warnings) deps.stderr(`\u544A\u8B66\uFF1A${warning.message}
`);
      return fetched.snapshot;
    },
    // 只打印模式不创建写入端口：没有端口就不可能发出写请求
    port: dryRun || isCommitMode ? null : createGitHubCommentPort(gateway, ref, headSha),
    onProgress: (message) => {
      deps.stdout(`${message}
`);
    }
  });
  deps.stdout("\n");
  if (dryRun) {
    const lines = describeActions(result.actions);
    deps.stdout(lines.length === 0 ? "\uFF08\u672C\u8F6E\u6CA1\u6709\u9700\u8981\u53D1\u9001\u7684\u8BC4\u8BBA\uFF09\n" : `${lines.join("\n")}
`);
    deps.stdout("\n--- \u6458\u8981 ---\n");
    deps.stdout(`${result.summaryMarkdown}

`);
  }
  deps.stdout(`${formatStats({ result, files: result.coverage.planned, dryRun })}
`);
  return 0;
}
async function main(argv, deps = {}) {
  const stdout = deps.stdout ?? ((text2) => void process.stdout.write(text2));
  const stderr = deps.stderr ?? ((text2) => void process.stderr.write(text2));
  const resolved = {
    cwd: deps.cwd ?? process.cwd(),
    env: deps.env ?? process.env,
    stdout,
    stderr
  };
  const first = argv[0];
  if (first === void 0 || first === "--help" || first === "-h") {
    stdout(USAGE);
    return 0;
  }
  if (first === "--version" || first === "-v") {
    stdout("0.1.0\n");
    return 0;
  }
  if (!isCommand(first)) {
    stderr(`\u672A\u77E5\u547D\u4EE4: ${first}

${USAGE}`);
    return 2;
  }
  const flags = parseFlags(argv.slice(1));
  if (flags["help"] !== void 0) {
    stdout(USAGE);
    return 0;
  }
  try {
    if (first === "review" || first === "dry-run") {
      return await runReviewCommand(
        flags,
        resolved,
        first === "dry-run" || flags["dry"] !== void 0
      );
    }
    if (first === "cost") {
      const loaded = await loadConfig(resolved.cwd);
      if (!loaded.ok) {
        for (const error of loaded.errors) stderr(`${error.path}\uFF1A${error.message}
`);
        return 1;
      }
      const files = Number(flags["files"] ?? "10");
      const lines = Number(flags["lines"] ?? "400");
      if (!Number.isFinite(files) || !Number.isFinite(lines)) {
        stderr("--files \u4E0E --lines \u5FC5\u987B\u662F\u6570\u5B57\n");
        return 2;
      }
      stdout(`${estimateCostText(loaded.config, files, lines)}
`);
      return 0;
    }
    if (first === "eval") {
      const beforePath = flags["baseline"];
      const afterPath = flags["current"];
      if (beforePath === void 0 || beforePath === "" || afterPath === void 0 || afterPath === "") {
        stderr("\u9700\u8981\u4E24\u4EFD\u5FEB\u7167\uFF1Aacr eval --baseline <\u57FA\u51C6.json> --current <\u672C\u6B21.json>\n");
        return 2;
      }
      const load = async (path) => JSON.parse(await readFile3(path, "utf8"));
      const before = await load(beforePath);
      const after = await load(afterPath);
      if (!isBaselineSnapshot(before) || !isBaselineSnapshot(after)) {
        stderr("\u6587\u4EF6\u4E0D\u662F\u6709\u6548\u7684\u57FA\u51C6\u5FEB\u7167\uFF08\u7248\u672C\u6216\u5B57\u6BB5\u4E0D\u7B26\uFF09\n");
        return 1;
      }
      const comparison = compareBaselines(before, after);
      stdout(`${formatComparison(comparison)}
`);
      return comparison.comparable ? 0 : 1;
    }
    if (first === "inspect") {
      const loaded = await loadConfig(resolved.cwd);
      if (!loaded.ok) {
        for (const error of loaded.errors) stderr(`${error.path}\uFF1A${error.message}
`);
        return 1;
      }
      const coverageText = flags["coverage"];
      const coverage = coverageText === void 0 || coverageText === "" ? null : Number(coverageText);
      if (coverage !== null && !Number.isFinite(coverage)) {
        stderr("--coverage \u5FC5\u987B\u662F\u6570\u5B57\uFF08\u767E\u5206\u6BD4\uFF09\n");
        return 2;
      }
      const willWrite = flags["write"] !== void 0;
      let gateway = null;
      let repo = null;
      if (willWrite) {
        const token = resolved.env[loaded.config.platform.tokenEnv] ?? resolved.env["GITHUB_TOKEN"];
        const repoText = loaded.config.platform.repository ?? resolved.env["GITHUB_REPOSITORY"];
        repo = repoText === void 0 || repoText === null ? null : parseRepo(repoText);
        if (token === void 0 || token === "" || repo === null) {
          stderr(
            "\u5199\u5165\u9700\u8981\u4EE4\u724C\u4E0E\u4ED3\u5E93\uFF1A\u8BBE\u7F6E GITHUB_TOKEN \u4E0E GITHUB_REPOSITORY\uFF08\u6216\u914D\u7F6E platform.repository\uFF09\n"
          );
          return 3;
        }
        gateway = createGitHubGateway(token);
      }
      const historyFile = join3(resolved.cwd, flags["history"] ?? ".acr/inspection-history.json");
      const history = await readHistory(historyFile);
      let previous = previousOf(history);
      if (gateway !== null && repo !== null) {
        const issues = await gateway.listIssuesByLabel(repo, INSPECTION_LABEL);
        const latest = [...issues].sort((a, b) => b.number - a.number)[0];
        const embedded = latest === void 0 ? null : extractEmbeddedHistory(latest.body);
        if (embedded !== null) previous = embedded;
      }
      const files = await collectSourceFiles(resolved.cwd);
      const manifest = await readOptional(resolved.cwd, "package.json");
      const allFiles = manifest === null ? files : [...files, manifest];
      const inspection = runInspection({
        repository: resolved.env["GITHUB_REPOSITORY"] ?? "local",
        commitSha: resolved.env["GITHUB_SHA"] ?? "unknown",
        files: allFiles,
        config: loaded.config.inspection,
        coveragePercent: coverage,
        ...previous === null ? {} : { previousFingerprints: previous.fingerprints }
      });
      const entry = {
        inspectedAt: inspection.inspectedAt,
        totalScore: inspection.totalScore,
        scores: inspection.scores,
        fingerprints: inspection.findings.map((finding) => finding.fingerprint),
        reference: null
      };
      const markdown = renderReport(inspection, {
        previous: previous === null ? null : {
          totalScore: previous.totalScore,
          scores: previous.scores,
          reference: previous.reference ?? ""
        },
        historyEntry: entry
      });
      let reference = null;
      if (gateway !== null && repo !== null) {
        const info = await gateway.getRepoInfo(repo);
        const pageName = inspection.inspectedAt.slice(0, 10);
        const token = resolved.env[loaded.config.platform.tokenEnv] ?? resolved.env["GITHUB_TOKEN"] ?? "";
        const writeResult = await writeReport({
          config: loaded.config.inspection,
          hasWiki: info.hasWiki,
          pageName,
          markdown,
          writers: {
            issue: createGitHubIssueWriter(gateway, repo),
            ...info.hasWiki ? {
              wiki: createGitWikiWriter({
                cloneUrl: `https://x-access-token:${token}@github.com/${repo.owner}/${repo.repo}.wiki.git`,
                workDir: join3(resolved.cwd, ".acr", "wiki"),
                run: runCommand
              })
            } : {}
          }
        });
        if (writeResult.warning !== null) stderr(`\u544A\u8B66\uFF1A${writeResult.warning}
`);
        reference = writeResult.location?.reference ?? null;
      }
      const outPath = flags["out"];
      if (outPath !== void 0 && outPath !== "") {
        await writeFile(outPath, markdown, "utf8");
        stdout(`\u62A5\u544A\u5DF2\u5199\u5165 ${outPath}
`);
      } else if (!willWrite) {
        stdout(markdown);
      }
      if (reference !== null) stdout(`\u62A5\u544A\u5DF2\u5199\u5165\u5E73\u53F0\uFF1A${reference}
`);
      if (flags["no-history"] === void 0) {
        const updated = appendHistory(
          history,
          { ...entry, reference },
          loaded.config.inspection.historyDepth
        );
        try {
          await mkdir(join3(resolved.cwd, ".acr"), { recursive: true });
          await writeFile(historyFile, serializeHistory(updated), "utf8");
        } catch (error) {
          stderr(
            `\u544A\u8B66\uFF1A\u5386\u53F2\u672A\u8BB0\u5F55\uFF0C\u4E0B\u671F\u65E0\u6CD5\u5BF9\u6BD4\uFF08${error instanceof Error ? error.message : String(error)}\uFF09
`
          );
        }
      }
      return 0;
    }
    stderr("\u8BE5\u5B50\u547D\u4EE4\u5C1A\u672A\u63A5\u5165\u5B9E\u73B0\n");
    return 3;
  } catch (error) {
    stderr(`\u8FD0\u884C\u5931\u8D25\uFF1A${error instanceof Error ? error.message : String(error)}
`);
    return 4;
  }
}

// src/cli/index.ts
void main(process.argv.slice(2)).then((code) => {
  process.exitCode = code;
});
/*! Bundled license information:

content-type/dist/index.js:
  (*!
   * content-type
   * Copyright(c) 2015 Douglas Christopher Wilson
   * MIT Licensed
   *)

@octokit/request-error/dist-src/index.js:
  (* v8 ignore else -- @preserve -- Bug with vitest coverage where it sees an else branch that doesn't exist *)

@octokit/request/dist-bundle/index.js:
  (* v8 ignore next -- @preserve *)
  (* v8 ignore else -- @preserve *)

@octokit/graphql/dist-bundle/index.js:
  (* v8 ignore if -- @preserve *)

@octokit/oauth-methods/dist-bundle/index.js:
  (* v8 ignore next: we always pass a custom request in tests -- @preserve *)

@octokit/auth-oauth-device/dist-bundle/index.js:
  (* v8 ignore next 2 -- @preserve *)

@octokit/auth-oauth-user/dist-bundle/index.js:
  (* v8 ignore if -- @preserve *)
  (* v8 ignore next -- @preserve *)

@octokit/auth-oauth-app/dist-bundle/index.js:
@octokit/plugin-paginate-rest/dist-bundle/index.js:
  (* v8 ignore next -- @preserve *)

toad-cache/dist/toad-cache.mjs:
  (**
   * toad-cache
   *
   * @copyright 2026 Igor Savin <kibertoad@gmail.com>
   * @license MIT
   * @version 3.7.3
   *)

@octokit/auth-app/dist-node/index.js:
  (* v8 ignore next - permissions are optional per OpenAPI spec, but we think that is incorrect -- @preserve *)
  (* v8 ignore next - repositorySelection are optional per OpenAPI spec, but we think that is incorrect -- @preserve *)
  (* v8 ignore start - due to skipped tests, see https://github.com/octokit/auth-app.js/pull/580 -- @preserve *)
  (* v8 ignore end -- @preserve *)

octokit/dist-bundle/index.js:
  (* v8 ignore next no need to test internals of the throttle plugin -- @preserve *)
*/
