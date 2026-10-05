/* Page réserver : onglets table / groupe, validation à la sortie du champ, récapitulatif en direct, envoi WhatsApp. */
(() => {
  "use strict";
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const { toast, track, waUrl } = window.MarroucheUI;

  const tabs = $$('[role="tab"]'), forms = { table: $('[data-form="table"]'), groupe: $('[data-form="groupe"]') };
  const summary = $("[data-summary]");
  let active = location.hash === "#groupe" || +new URLSearchParams(location.search).get("pax") > 10 ? "groupe" : "table";

  // Dates : pas de date passée ; la table est proposée pour aujourd'hui
  const todayISO = new Date(Date.now() - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
  $$('input[type="date"]').forEach((i) => (i.min = todayISO));
  $("#t-date").value = todayISO;
  // Arrivée depuis le configurateur de table ou la réservation express : on reprend le nombre de convives
  const params = new URLSearchParams(location.search), pax = +params.get("pax");
  if (pax > 0) {
    if (pax > 10) { location.hash = "#groupe"; $("#g-pax").value = pax; }
    else $("#t-pax").value = String(pax);
  }
  const fmtDate = (iso) => iso ? new Date(iso + "T12:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }) : "—";

  function select(name, focus) {
    active = name;
    tabs.forEach((t) => {
      const on = t.dataset.tab === name;
      t.setAttribute("aria-selected", on); t.tabIndex = on ? 0 : -1;
      if (on && focus) t.focus();
    });
    Object.entries(forms).forEach(([k, f]) => (f.closest('[role="tabpanel"]').hidden = k !== name));
    history.replaceState(null, "", name === "groupe" ? "#groupe" : location.pathname);
    updateSummary();
  }
  tabs.forEach((t) => t.addEventListener("click", () => select(t.dataset.tab)));
  $('[role="tablist"]').addEventListener("keydown", (e) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;
    e.preventDefault();
    select(active === "table" ? "groupe" : "table", true);
  });

  // Validation : à la sortie du champ, jamais pendant la frappe
  const rules = {
    date: (v) => (!v ? "Choisissez une date." : v < todayISO ? "Cette date est déjà passée." : ""),
    time: (v) => (!v ? "Choisissez une heure." : ""),
    name: (v) => (v.trim().length < 2 ? "Indiquez votre nom pour la réservation." : ""),
    tel: (v) => (v.replace(/\D/g, "").length < 8 ? "Indiquez un numéro joignable (8 chiffres minimum)." : ""),
    pax: (v, form) => (form === forms.groupe && (!v || +v < 8) ? "Pour un groupe, indiquez au moins 8 invités." : ""),
  };
  function check(input) {
    const rule = rules[input.name];
    if (!rule) return true;
    const msg = rule(input.value, input.form);
    const field = input.closest(".field"), err = $(".field__error", field);
    field.classList.toggle("is-invalid", !!msg);
    msg ? input.setAttribute("aria-invalid", "true") : input.removeAttribute("aria-invalid");
    if (err) err.innerHTML = msg ? `<svg class="icon"><use href="#i-alert"/></svg>${msg}` : "";
    return !msg;
  }
  Object.values(forms).forEach((form) => {
    $$("input, select, textarea", form).forEach((i) => {
      i.addEventListener("blur", () => { if (i.value || i.closest(".field").classList.contains("is-invalid")) check(i); });
      i.addEventListener("input", () => { if (i.closest(".field").classList.contains("is-invalid")) check(i); updateSummary(); });
      i.addEventListener("change", updateSummary);
    });
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const invalid = $$("input, select", form).filter((i) => !check(i));
      if (invalid.length) { invalid[0].focus(); return; }
      const f = Object.fromEntries(new FormData(form));
      const msg = form === forms.table
        ? ["Bonjour Marrouche, je souhaite réserver une table :", `• ${fmtDate(f.date)} à ${f.time}`, `• ${f.pax} personne${f.pax > 1 ? "s" : ""}`,
           f.occasion ? `• Occasion : ${f.occasion}` : null, `• Nom : ${f.name}`, `• Téléphone : ${f.tel}`, f.note ? `• Précision : ${f.note}` : null, "", "Merci de me confirmer."]
        : ["Bonjour Marrouche, je souhaite un devis pour un groupe :", `• ${f.type}`, `• ${fmtDate(f.date)}`, `• Environ ${f.pax} invités`,
           `• Nom / société : ${f.name}`, `• Téléphone : ${f.tel}`, f.note ? `• Notre idée : ${f.note}` : null];
      track(form === forms.table ? "reservation_envoyee" : "devis_groupe_envoye", { personnes: +f.pax });
      window.open(waUrl(msg.filter((l) => l !== null).join("\n")), "_blank", "noopener");
      toast("Votre demande est prête dans WhatsApp : il ne reste qu'à l'envoyer.");
    });
  });

  function updateSummary() {
    const f = Object.fromEntries(new FormData(forms[active]));
    const rows = active === "table"
      ? [["Type", "Une table"], ["Date", fmtDate(f.date)], ["Heure", f.time || "—"], ["Personnes", f.pax], ["Occasion", f.occasion || "—"], ["Nom", f.name || "—"]]
      : [["Type", f.type], ["Date", fmtDate(f.date)], ["Invités", f.pax ? `environ ${f.pax}` : "—"], ["Nom", f.name || "—"]];
    summary.innerHTML = rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${String(v).replace(/</g, "&lt;")}</dd></div>`).join("");
  }
  select(active);
})();
