import { createChallenge } from "../challengeStore.js";
import { navigate } from "../router.js";
import { t } from "../i18n.js";

const LABELS = {
  "create-heading": "create_heading",
  "label-title": "label_title",
  "label-duration": "label_duration",
  "label-goal": "label_goal",
  "label-speed": "label_speed",
  "label-spawn-rate": "label_spawn_rate",
  "label-target-size": "label_target_size",
  "label-background": "label_background",
  "label-character": "label_character",
  "label-max-on-screen": "label_max_on_screen",
};

function readConfigFromForm(form) {
  const data = new FormData(form);
  return {
    version: 1,
    template: "collect",
    title: String(data.get("title") || "").trim(),
    durationSec: Number(data.get("durationSec")),
    goal: { type: "score_at_least", value: Number(data.get("goalValue")) },
    difficulty: {
      speed: Number(data.get("speed")),
      spawnRate: Number(data.get("spawnRate")),
      targetSize: Number(data.get("targetSize")),
    },
    theme: {
      background: data.get("background"),
      character: data.get("character"),
    },
    params: { maxOnScreen: Number(data.get("maxOnScreen")) },
  };
}

export function initCreateScreen() {
  for (const [id, key] of Object.entries(LABELS)) {
    document.getElementById(id).textContent = t(key);
  }
  document.getElementById("create-submit-btn").textContent = t("create_submit_btn");
  document.getElementById("create-cancel-btn").textContent = t("create_cancel_btn");

  const form = document.getElementById("create-form");
  const errorsEl = document.getElementById("create-errors");

  document.getElementById("create-cancel-btn").addEventListener("click", () => navigate("/"));

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submitBtn = document.getElementById("create-submit-btn");
    const originalLabel = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = t("create_submitting");

    try {
      const config = readConfigFromForm(form);
      const result = await createChallenge(config);

      if (!result.ok) {
        errorsEl.textContent = result.errors.join(" / ");
        return;
      }

      errorsEl.textContent = "";
      navigate(`/c/${result.record.shortCode}`);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalLabel;
    }
  });
}
