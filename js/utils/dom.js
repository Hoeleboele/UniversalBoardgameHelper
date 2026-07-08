/**
 * Small DOM helpers to keep screen modules declarative.
 */

/**
 * Create an element.
 * @param {string} tag
 * @param {object} [props] - attributes/props. `class`, `text`, `html`, `on` (event map) are special.
 * @param {(Node|string)[]} [children]
 */
export function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, val] of Object.entries(props)) {
    if (key === "class") node.className = val;
    else if (key === "text") node.textContent = val;
    else if (key === "html") node.innerHTML = val;
    else if (key === "on") {
      for (const [evt, handler] of Object.entries(val)) {
        node.addEventListener(evt, handler);
      }
    } else if (key === "dataset") {
      Object.assign(node.dataset, val);
    } else if (val !== null && val !== undefined && val !== false) {
      node.setAttribute(key, val);
    }
  }
  for (const child of [].concat(children)) {
    if (child == null) continue;
    node.append(child.nodeType ? child : document.createTextNode(String(child)));
  }
  return node;
}

/** Remove all children of a node. */
export function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
}
