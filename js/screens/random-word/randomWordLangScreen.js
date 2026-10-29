import { el } from "../../utils/dom.js";
import { Router } from "../../router.js";
import { setLanguage } from "./randomWordState.js";

export function createRandomWordLangScreen() {
  function chooseLanguage(language) {
    setLanguage(language);
    Router.go("random-word-play");
  }

  return {
    mount(container) {
      container.append(
        el("section", { class: "screen random-word-lang" }, [
          el("div", { class: "topbar" }, [
            el("button", {
              class: "btn btn-ghost",
              text: "‹ Menu",
              on: { click: () => Router.go("menu") },
            }),
          ]),
          el("div", { class: "random-word-lang-content" }, [
            el("h1", { text: "Choose a language" }),
            el("div", { class: "random-word-languages" }, [
              el("button", {
                class: "btn random-word-language-btn",
                text: "English",
                on: { click: () => chooseLanguage("en") },
              }),
              el("button", {
                class: "btn random-word-language-btn",
                text: "Nederlands",
                on: { click: () => chooseLanguage("nl") },
              }),
            ]),
          ]),
        ])
      );
    },
  };
}