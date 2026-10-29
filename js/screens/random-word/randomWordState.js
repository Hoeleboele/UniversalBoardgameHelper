let language = "en";

export function setLanguage(value) {
  language = value === "nl" ? "nl" : "en";
}

export function getLanguage() {
  return language;
}