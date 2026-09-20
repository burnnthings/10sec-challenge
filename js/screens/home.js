import { navigate } from "../router.js";
import { getOrCreatePlayerId } from "../api/supabaseClient.js";
import { t } from "../i18n.js";

export function initHomeScreen() {
  document.getElementById("home-title").textContent = t("home_title");
  document.getElementById("home-subtitle").textContent = t("home_subtitle");

  const createBtn = document.getElementById("home-create-btn");
  createBtn.textContent = t("home_create_btn");
  createBtn.addEventListener("click", () => navigate("/create"));

  const demoBtn = document.getElementById("home-demo-btn");
  demoBtn.textContent = t("home_demo_btn");
  demoBtn.addEventListener("click", () => navigate("/c/demo"));

  const profileBtn = document.getElementById("home-profile-btn");
  profileBtn.textContent = t("home_profile_btn");
  profileBtn.addEventListener("click", async () => {
    const playerId = await getOrCreatePlayerId();
    navigate(`/p/${playerId}`);
  });

  const badgesBtn = document.getElementById("home-badges-btn");
  badgesBtn.textContent = t("home_badges_btn");
  badgesBtn.addEventListener("click", () => navigate("/badges"));
}
