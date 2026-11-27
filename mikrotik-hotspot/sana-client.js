/* SANA NET bridge: page identity, one-time trial gate and real login hand-off.
   Configure window.SANA_API_URL before this file is loaded. */
(() => {
  "use strict";
  const API = String(window.SANA_API_URL || "").replace(/\/+$/, "");
  const SPEEDS = ["خفيفة", "متوسطة", "عالية", "عالية جداً"];
  let selectedSpeed = "عالية جداً";
  const $ = id => document.getElementById(id);
  function getClientId() {
    let id = localStorage.getItem("sanaClientId");
    if (!id || !/^[a-f0-9-]{32,80}$/i.test(id)) {
      id = (crypto.randomUUID ? crypto.randomUUID() : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0; return (c === "x" ? r : (r & 3 | 8)).toString(16);
      }));
      localStorage.setItem("sanaClientId", id);
    }
    return id;
  }
  async function api(path, body) {
    if (!API) throw new Error("لم يتم إعداد عنوان الخادم المركزي");
    const res = await fetch(API + path, {
      method: body ? "POST" : "GET",
      headers: body ? { "Content-Type": "application/json" } : {},
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store"
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "تعذر الاتصال بالخادم");
    return data;
  }
  async function refreshTrial() {
    const btn = $("trialButton");
    if (!btn) return;
    btn.style.display = "none";
    if (!API) return;
    try {
      const r = await api("/api/trial/status?clientId=" + encodeURIComponent(getClientId()));
      if (r.eligible) btn.style.display = "flex";
    } catch (_) { btn.style.display = "none"; }
  }
  window.pickSpeed = function(button, label) {
    if (!SPEEDS.includes(label)) return;
    selectedSpeed = label;
    document.querySelectorAll(".speed").forEach(x => x.classList.remove("active"));
    if (button) button.classList.add("active");
  };
  window.demoLogin = async function() {
    const card = ($("cardInput")?.value || "").trim();
    if (!card) return alert("أدخل رقم الكرت أولاً");
    if (!API) return alert("الخادم المركزي غير مربوط بعد؛ لم يتم تسجيل الدخول.");
    try {
      const result = await api("/api/hotspot/login", { card, speed: selectedSpeed, clientId: getClientId() });
      if (typeof window.saveSanaCard === "function") window.saveSanaCard(card);
      const form = document.createElement("form");
      form.method = "post";
      form.action = "$(link-login-only)";
      const add = (name, value) => {
        const input = document.createElement("input");
        input.type = "hidden"; input.name = name; input.value = value; form.appendChild(input);
      };
      add("username", result.username);
      add("password", result.passwordMode === "same-as-card" ? card : "");
      add("dst", "$(link-orig-esc)");
      add("popup", "true");
      document.body.appendChild(form);
      form.submit();
    } catch (e) { alert("تعذر تسجيل الدخول: " + e.message); }
  };
  const trial = $("trialButton");
  if (trial) {
    trial.addEventListener("click", async event => {
      event.preventDefault();
      try {
        await api("/api/trial/claim", { clientId: getClientId() });
        const trialUrl = trial.getAttribute("href");
        if (!trialUrl || trialUrl.includes("$(trial)")) throw new Error("رابط التجربة التجريبي غير مضبوط في ملف MikroTik");
        trial.style.display = "none";
        window.location.href = trialUrl;
      } catch (e) {
        trial.style.display = "none";
        alert(e.message);
      }
    });
  }
  window.SANA_NET = {
    clientId: getClientId(),
    async restoreAccount(card) {
      return api("/api/account?clientId=" + encodeURIComponent(getClientId()) + "&card=" + encodeURIComponent(card));
    },
    refreshTrial
  };
  refreshTrial();
})();
