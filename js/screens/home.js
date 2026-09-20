import { navigate } from "../router.js";
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
}
