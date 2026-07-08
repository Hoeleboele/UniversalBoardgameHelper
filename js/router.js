import { clear } from "./utils/dom.js";

/**
 * Hash-based router. Each route maps to a factory returning a screen object
 * with mount(container) and optional unmount(). Works on GitHub Pages subpaths.
 */
export class Router {
  /**
   * @param {HTMLElement} outlet - container where screens render.
   * @param {Record<string, () => { mount: Function, unmount?: Function }>} routes
   * @param {string} fallback - route key used when hash is unknown.
   */
  constructor(outlet, routes, fallback) {
    this.outlet = outlet;
    this.routes = routes;
    this.fallback = fallback;
    this.current = null;
    this._onHashChange = this._onHashChange.bind(this);
  }

  start() {
    window.addEventListener("hashchange", this._onHashChange);
    this._onHashChange();
  }

  static go(name) {
    window.location.hash = `#/${name}`;
  }

  _onHashChange() {
    const name = (window.location.hash.replace(/^#\/?/, "") || this.fallback).trim();
    const factory = this.routes[name] || this.routes[this.fallback];

    if (this.current && typeof this.current.unmount === "function") {
      this.current.unmount();
    }
    clear(this.outlet);

    this.current = factory();
    this.current.mount(this.outlet);
  }
}
