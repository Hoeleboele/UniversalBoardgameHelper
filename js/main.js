import { Router } from "./router.js";
import { createMenuScreen } from "./screens/menu.js";
import { createLifeScreen } from "./screens/life/lifeScreen.js";
import { createRandomScreen } from "./screens/random/randomScreen.js";
import { createTimerSettingsScreen } from "./screens/timer/timerSettingsScreen.js";
import { createTimerPlayScreen } from "./screens/timer/timerPlayScreen.js";
import { createTeamsSettingsScreen } from "./screens/teams/teamsSettingsScreen.js";
import { createTeamsScreen } from "./screens/teams/teamsPlayScreen.js";
import { createSetupListScreen } from "./screens/setup/setupListScreen.js";
import { createSetupEditScreen } from "./screens/setup/setupEditScreen.js";
import { createSetupPlayScreen } from "./screens/setup/setupPlayScreen.js";
import { createRandomWordLangScreen } from "./screens/random-word/randomWordLangScreen.js";
import { createRandomWordPlayScreen } from "./screens/random-word/randomWordPlayScreen.js";
import { createFlowListScreen } from "./screens/flow/flowListScreen.js";
import { createFlowEditScreen } from "./screens/flow/flowEditScreen.js";
import { createFlowPlayScreen } from "./screens/flow/flowPlayScreen.js";
import { enableWakeLock } from "./services/wakeLock.js";

const outlet = document.getElementById("app");

const router = new Router(
  outlet,
  {
    menu: createMenuScreen,
    life: createLifeScreen,
    random: createRandomScreen,
    "timer-settings": createTimerSettingsScreen,
    "timer-play": createTimerPlayScreen,
    "teams-settings": createTeamsSettingsScreen,
    "teams-play": createTeamsScreen,
    setup: createSetupListScreen,
    "setup-edit": createSetupEditScreen,
    "setup-play": createSetupPlayScreen,
    "random-word": createRandomWordLangScreen,
    "random-word-play": createRandomWordPlayScreen,
    flow: createFlowListScreen,
    "flow-edit": createFlowEditScreen,
    "flow-play": createFlowPlayScreen,
  },
  "menu"
);

router.start();
enableWakeLock();
