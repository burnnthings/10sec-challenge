import { DEFAULT_CONFIG } from "./config.js";
import { ensureDemoChallenge, getChallenge } from "./challengeStore.js";
import { parseRoute, navigate, onRouteChange } from "./router.js";
import { initHomeScreen } from "./screens/home.js";
import { initCreateScreen } from "./screens/create.js";
import { initPlayScreen } from "./screens/play.js";

const PAGE_IDS = ["page-home", "page-create", "page-play"];

function showPage(id) {
  for (const pageId of PAGE_IDS) {
    document.getElementById(pageId).classList.toggle("hidden", pageId !== id);
  }
}

async function main() {
  await ensureDemoChallenge(DEFAULT_CONFIG);

  initHomeScreen();
  initCreateScreen();
  const playScreen = initPlayScreen();

  async function render() {
    const route = parseRoute();

    if (route.name === "create") {
      showPage("page-create");
      return;
    }

    if (route.name === "play") {
      const record = await getChallenge(route.code);
      if (!record) {
        navigate("/");
        return;
      }
      showPage("page-play");
      await playScreen.renderPlay(record.config, record.shortCode, record.id);
      return;
    }

    showPage("page-home");
  }

  onRouteChange(render);
  await render();
}

main();
