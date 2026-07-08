import { Router } from "./router.js";
import { createMenuScreen } from "./screens/menu.js";
import { createLifeScreen } from "./screens/life/lifeScreen.js";
import { createRandomScreen } from "./screens/random/randomScreen.js";
import { enableWakeLock } from "./services/wakeLock.js";

const outlet = document.getElementById("app");

const router = new Router(
  outlet,
  {
    menu: createMenuScreen,
    life: createLifeScreen,
    random: createRandomScreen,
  },
  "menu"
);

router.start();
enableWakeLock();
