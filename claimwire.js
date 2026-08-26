(function () {

  const PLAYBOOK_KEY = "claimwire-playbooks-v1";

  function loadPlaybooks() {
    try { return JSON.parse(localStorage.getItem(PLAYBOOK_KEY) || "{}"); }
    catch (e) { return {}; }
  }
  function savePlaybooks(map) { try { localStorage.setItem(PLAYBOOK_KEY, JSON.stringify(map)); } catch (e) {} }

  function getPlaybook(companyId) {
    const stored = loadPlaybooks();
    return stored[companyId] || SEED_PLAYBOOKS[companyId] || null;
  }
  function setPlaybook(companyId, data) {
    const stored = loadPlaybooks();
    stored[companyId] = data;
    savePlaybooks(stored);
  }

  function code(name) {
    const clean = name.replace(/\(.*?\)/g, "").trim();
    const words = clean.split(/\s+/).filter(Boolean);
    return ((words[0]?.[0] || "") + (words[1]?.[0] || "")).toUpperCase();
  }

  let state = { company: null, type: null };

  const steps = { 1: document.getElementById("step1"), 2: document.getElementById("step2"),
    3: document.getElementById("step3"), 4: document.getElementById("step4") };
  const crumbs = Array.from(document.querySelectorAll(".trail .crumb"));

  function goTo(n) {
    if (n >= 2 && !state.company) n = 1;
    if (n >= 4 && !state.type) n = state.company ? 2 : 1;
    Object.entries(steps).forEach(([k, el]) => el.classList.toggle("active", Number(k) === n));
    crumbs.forEach(c => {
      const target = Number(c.dataset.goto);
      c.classList.toggle("active", target === n);
      c.classList.toggle("done", target < n);
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  crumbs.forEach(c => c.addEventListener("click", () => {
    const target = Number(c.dataset.goto);
    if (target === 1 || (target === 2 && state.company) || (target === 3 && state.company) || (target === 4 && state.type)) goTo(target);
  }));

  // ---------- step 1: custom insurer dropdown ----------
  const insurerSelect = document.getElementById("insurerSelect");
  const insurerOptions = document.getElementById("insurerOptions");
  const companySelectValue = document.getElementById("companySelectValue");
  const continueBtn1 = document.getElementById("continueTo2");
  let companySelectVal = "";
  let insurerActiveIndex = -1;

  const insurerOptionEls = COMPANIES.map(c => {
    const li = document.createElement("li");
    li.className = "insurer-option";
    li.setAttribute("role", "option");
    li.setAttribute("aria-selected", "false");
    li.dataset.id = c.id;
    li.innerHTML = `<span>${c.name}</span><span class="insurer-option-check">&#10003;</span>`;
    li.addEventListener("click", () => { pickCompany(c.id); closeInsurerOptions(); });
    insurerOptions.appendChild(li);
    return li;
  });

  function pickCompany(id) {
    companySelectVal = id;
    const c = COMPANIES.find(x => x.id === id);
    companySelectValue.textContent = c ? c.name : "Select an insurer…";
    companySelectValue.classList.toggle("is-set", !!c);
    insurerOptionEls.forEach(el => {
      const sel = el.dataset.id === id;
      el.classList.toggle("is-selected", sel);
      el.setAttribute("aria-selected", sel ? "true" : "false");
    });
    continueBtn1.disabled = !companySelectVal;
  }

  function openInsurerOptions() {
    insurerOptions.hidden = false;
    insurerSelect.classList.add("is-open");
    insurerSelect.setAttribute("aria-expanded", "true");
    insurerActiveIndex = Math.max(0, insurerOptionEls.findIndex(el => el.dataset.id === companySelectVal));
    setInsurerActive(insurerActiveIndex);
  }
  function closeInsurerOptions() {
    insurerOptions.hidden = true;
    insurerSelect.classList.remove("is-open");
    insurerSelect.setAttribute("aria-expanded", "false");
  }
  function setInsurerActive(i) {
    insurerOptionEls.forEach(el => el.classList.remove("is-active"));
    if (insurerOptionEls[i]) {
      insurerOptionEls[i].classList.add("is-active");
      insurerOptionEls[i].scrollIntoView({ block: "nearest" });
    }
    insurerActiveIndex = i;
  }

  insurerSelect.addEventListener("click", () => {
    insurerOptions.hidden ? openInsurerOptions() : closeInsurerOptions();
  });
  insurerSelect.addEventListener("keydown", (e) => {
    if (["Enter", " ", "ArrowDown", "ArrowUp"].includes(e.key)) e.preventDefault();
    if (e.key === "Enter" || e.key === " ") {
      if (insurerOptions.hidden) { openInsurerOptions(); }
      else { const el = insurerOptionEls[insurerActiveIndex]; if (el) { pickCompany(el.dataset.id); } closeInsurerOptions(); }
    } else if (e.key === "ArrowDown") {
      if (insurerOptions.hidden) openInsurerOptions();
      else setInsurerActive(Math.min(insurerOptionEls.length - 1, insurerActiveIndex + 1));
    } else if (e.key === "ArrowUp") {
      if (insurerOptions.hidden) openInsurerOptions();
      else setInsurerActive(Math.max(0, insurerActiveIndex - 1));
    } else if (e.key === "Escape") {
      closeInsurerOptions();
    }
  });
  document.addEventListener("click", (e) => {
    if (!insurerSelect.contains(e.target) && !insurerOptions.contains(e.target)) closeInsurerOptions();
  });

  continueBtn1.addEventListener("click", () => {
    const chosen = COMPANIES.find(c => c.id === companySelectVal);
    if (!chosen) return;
    selectCompany(chosen);
  });

  function plateHtml(company) {
    return `<span class="code">${code(company.name)}</span><span class="name">${company.name}</span>`;
  }

  function selectCompany(company) {
    state.company = company;
    state.type = null;
    document.getElementById("selectedPlate2").innerHTML = plateHtml(company);
    document.getElementById("selectedPlate3").innerHTML = plateHtml(company);
    renderPortalReminder(company);
    enterStep2();
    goTo(2);
  }

  function renderPortalReminder(company) {
    const el = document.getElementById("portalReminder");
    const pb = getPlaybook(company.id);
    if (!pb || !pb.portalUrl) { el.innerHTML = ""; return; }
    const msg = pb.portalOwnOnly
      ? `Own-policy claims can also go through the <a href="${escapeHtml(pb.portalUrl)}" target="_blank" rel="noopener noreferrer" style="color:var(--accent-ink);">online portal</a> &mdash; faster than email. Third-party claims must be registered by email (continue below).`
      : `This insurer also has an <a href="${escapeHtml(pb.portalUrl)}" target="_blank" rel="noopener noreferrer" style="color:var(--accent-ink);">online portal</a> for either claim type &mdash; use whichever you prefer, or continue below for email.`;
    el.innerHTML = `<div class="note-block">${msg}</div>`;
  }

  document.getElementById("backTo1").addEventListener("click", () => goTo(1));

  // ---------- step 2: process ----------
  const STAGES = [
    { title: "Registration confirmed", desc: "Insurer confirms the registration. Once confirmed, share the details with the client and ask them to bring the vehicle to the workshop.", slaKey: "regSla" },
    { title: "Assessment, survey & approval", desc: "", slaKey: "repairTimeline" },
    { title: "Rental / CCB", desc: "", slaKey: "ccb" }
  ];

  function renderProcess() {
    const company = state.company;
    const pb = getPlaybook(company.id);

    const intro = document.getElementById("processIntro");
    const contactBar = document.getElementById("contactBar");
    const body = document.getElementById("processBody");

    if (!pb) {
      intro.textContent = `No claims process documented yet for ${company.name}.`;
      contactBar.innerHTML = "";
      body.innerHTML = `<div class="empty-state">
        <strong>Nothing on file for this insurer</strong>
        <p>Add the claims email, Cc, and turnaround times below and they'll be remembered here next time.</p>
      </div>`;
      document.getElementById("surveyorSection").innerHTML = "";
      document.getElementById("directorySection").innerHTML = "";
      document.getElementById("registerWaysSection").innerHTML = "";
      document.getElementById("louSection").innerHTML = "";
      return;
    }

    intro.textContent = `How to register and follow through a claim with ${company.name}.`;

    contactBar.innerHTML = `
      <div class="contact-cell">
        <span class="field-label">Claims email</span>
        <div class="row">
          <span class="val ${pb.to ? "" : "empty"}">${pb.to ? copyableSpan(pb.to) : "Not set"}</span>
        </div>
      </div>
      <div class="contact-cell">
        <span class="field-label">Cc</span>
        <div class="row">
          <span class="val ${pb.cc ? "" : "empty"}">${pb.cc ? copyableSpan(pb.cc) : "Not set"}</span>
        </div>
      </div>
      <div class="contact-cell">
        <span class="field-label">Roadside assistance</span>
        <span class="val ${pb.roadsideNumber ? "" : "empty"}">${pb.roadsideNumber ? copyableSpan(pb.roadsideNumber) : "Not set"}</span>
      </div>`;

    renderLouNote();
    renderRegisterWays(pb);

    const visibleStages = STAGES.filter(s => s.slaKey !== "ccb" || pb.ccb);
    body.innerHTML = `<p class="strip-label">After you register</p><div class="stage-list">` + visibleStages.map((s, i) => {
      let sla = "";
      if (s.slaKey === "regSla" && pb.regSla) sla = `<span class="stage-sla">Usually within ${escapeHtml(pb.regSla)}</span>`;
      let regNote = "";
      if (s.slaKey === "regSla" && pb.regNote) regNote = `<p class="stage-desc stage-extra-note">${escapeHtml(pb.regNote)}</p>`;

      if (s.slaKey === "repairTimeline") {
        const items = (pb.repairTimelineRaw || DEFAULT_REPAIR_TIMELINE).split("\n").map(l => l.trim()).filter(Boolean).map(parseTimelineLine);
        const list = `<ul class="stage-sublist">` + items.map(it =>
          `<li><span class="sub-label">${escapeHtml(it.label)}</span><span class="sub-time">${escapeHtml(it.time)}</span></li>`
        ).join("") + `</ul>`;
        return `<div class="stage-row">
          <span class="stage-flag"></span>
          <span class="stage-num" data-n="${i + 1}"></span>
          <span class="stage-main">
            <p class="stage-title">${escapeHtml(s.title)}</p>
            <p class="stage-desc">Once the car is at the workshop, here's what to expect next.</p>
            ${list}
          </span>
        </div>`;
      }

      const desc = s.slaKey === "ccb" ? pb.ccb : s.desc;
      return `<div class="stage-row">
        <span class="stage-flag"></span>
        <span class="stage-num" data-n="${i + 1}"></span>
        <span class="stage-main">
          <p class="stage-title">${escapeHtml(s.title)}</p>
          ${paraHtml(desc, "stage-desc")}
          ${sla}
          ${regNote}
        </span>
      </div>`;
    }).join("") + `</div>`;

    if (pb.notes) {
      body.innerHTML += `<div class="empty-state is-note">
        <strong>Notes</strong><p>${escapeHtml(pb.notes)}</p></div>`;
    }

    renderSurveyors(pb);
    renderDirectory(pb);
  }

  function renderLouNote() {
    const el = document.getElementById("louSection");
    el.innerHTML = `<p class="strip-label">LOU (Loss of Use)</p>
      <div class="note-block">
        On a recovery or third-party claim, the client can opt to take a LOU amount instead of repair.
        After repair approval, the insurance company will confirm the daily limit — based on that limit and the job card's IN and OUT dates, the client gets reimbursed.
      </div>`;
  }

  function renderRegisterWays(pb) {
    const el = document.getElementById("registerWaysSection");
    let html = `<p class="strip-label">Ways to register</p><div class="way-list">`;
    if (pb.portalUrl) {
      html += `<div class="way-row">
        <span class="way-flag"></span>
        <span class="way-main">
          <p class="way-title">Online portal${pb.portalOwnOnly ? " &mdash; own policy only" : ""}</p>
          <p class="way-desc">${escapeHtml(pb.portalNote || (pb.portalOwnOnly ? "Faster than email, but only works for comprehensive (own) claims." : "Online claim registration."))}</p>
        </span>
        <span class="way-cta"><a class="act" href="${escapeHtml(pb.portalUrl)}" target="_blank" rel="noopener noreferrer">Open portal</a></span>
      </div>`;
    }
    let emailTitle = "Email";
    let emailDesc = "Fill in the claim details and send from the form below — used for both own-policy and third-party claims.";
    if (pb.portalUrl && pb.portalOwnOnly) {
      emailTitle = "Email &mdash; required for third-party claim";
      emailDesc = "Works for own-policy claims too, if you'd rather not use the portal.";
    } else if (pb.portalUrl && !pb.portalOwnOnly) {
      emailTitle = "Email";
      emailDesc = "Alternative to the portal above &mdash; use whichever you prefer, for either own-policy or third-party claims.";
    }
    html += `<div class="way-row is-email">
        <span class="way-flag"></span>
        <span class="way-main">
          <p class="way-title">${emailTitle}</p>
          <p class="way-desc">${emailDesc}</p>
        </span>
        <span class="way-cta"><button class="act is-send" id="registerViaEmailBtn" type="button">Register a claim &rarr;</button></span>
      </div></div>`;
    if (pb.registerNote) {
      html += `<div class="note-block" style="margin-top:var(--sp-3);">${escapeHtml(pb.registerNote)}</div>`;
    }
    el.innerHTML = html;

    document.getElementById("registerViaEmailBtn").addEventListener("click", () => {
      renderPortalReminder(state.company);
      goTo(3);
    });
  }

  function parseTimelineLine(line) {
    const m = line.match(/^(.*?):(.*)$/);
    if (!m) return { label: line.trim(), time: "" };
    return { label: m[1].trim(), time: m[2].trim() };
  }

  function parseSurveyorLine(line) {
    const m = line.match(/^(.*?)[-=](.*)$/);
    if (!m) return { phone: line.trim(), label: "" };
    return { phone: m[1].trim(), label: m[2].trim() };
  }

  function renderSurveyors(pb) {
    const el = document.getElementById("surveyorSection");
    const raw = (pb.surveyorsRaw || "").split("\n").map(l => l.trim()).filter(Boolean);
    if (!raw.length) { el.innerHTML = ""; return; }
    el.innerHTML = `<p class="strip-label">Surveyor contacts</p><div class="contact-list">` +
      raw.map(line => {
        const { phone, label } = parseSurveyorLine(line);
        return `<div class="contact-row">
          <span class="who">${escapeHtml(label || "Surveyor")}</span>
          <span class="num">${copyableSpan(phone)}</span>
        </div>`;
      }).join("") + `</div>`;
  }

  function parseDirectoryLine(line) {
    let parts = line.split(/\t+/).map(p => p.trim());
    if (parts.length < 2) parts = line.split(/\s{2,}/).map(p => p.trim());
    parts = parts.filter((p, i) => i === 0 || p !== "");
    return { label: parts[0] || "", contact: parts[1] || "", phone: parts[2] || "" };
  }

  // A contact or phone cell with more than one entry — "1st level: a@x.com;
  // 2nd level: b@x.com" — is split on ";" and put one per line, instead of
  // running together until the browser wraps it wherever it happens to fit.
  function multiLine(s) {
    return s.split(/;\s*/).map(part => part.trim()).filter(Boolean).map(wrapContacts).join("<br>");
  }

  function renderDirectory(pb) {
    const el = document.getElementById("directorySection");
    const raw = (pb.directoryRaw || "").split("\n").map(l => l.trim()).filter(Boolean);
    if (!raw.length && !pb.ivrNote) { el.innerHTML = ""; return; }
    let html = `<p class="strip-label">Department directory</p>`;
    if (pb.ivrNote) html += `<div class="ivr-note">${escapeHtml(pb.ivrNote)}</div>`;
    if (raw.length) {
      html += `<div class="contact-list">` + raw.map(line => {
        const { label, contact, phone } = parseDirectoryLine(line);
        return `<div class="dir-row">
          <div class="dir-top">
            <span class="label">${escapeHtml(label)}</span>
            ${phone ? `<span class="phone">${multiLine(phone)}</span>` : ""}
          </div>
          ${contact ? `<span class="contact">${multiLine(contact)}</span>` : ""}
        </div>`;
      }).join("") + `</div>`;
    }
    el.innerHTML = html;
  }

  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  // A description with a blank line in it ("\n\n") renders as separate
  // <p> blocks instead of one run-on paragraph — used for text like the
  // Rental/CCB note when it lists more than one option.
  function paraHtml(text, cls) {
    return (text || "").split(/\n\s*\n/).map(p => p.trim()).filter(Boolean)
      .map(p => `<p class="${cls}">${escapeHtml(p)}</p>`).join("");
  }

  // ---------- click-to-copy: wraps any email/phone value so clicking or
  // tapping it copies the value directly, instead of a separate button. ----------
  function copyableSpan(text) {
    const esc = escapeHtml(text);
    return `<span class="copyable" data-copy="${esc}" tabindex="0" role="button" title="Click to copy">${esc}<span class="copy-flag">Copied</span></span>`;
  }

  // Directory cells often carry more than one address/number in a single
  // string — "PartnerClaims.ae@livainsurance.com (cc George.Varghese@…)",
  // "1st level: bimal.nair@gig-gulf.com" — only the email/phone token
  // itself should be copyable, not the surrounding label or parenthetical.
  const CONTACT_TOKEN_RE = /([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})|(\+?\d[\d\s-]{4,}\d)/g;
  function wrapContacts(text) {
    let out = "";
    let last = 0;
    let m;
    CONTACT_TOKEN_RE.lastIndex = 0;
    while ((m = CONTACT_TOKEN_RE.exec(text)) !== null) {
      const raw = m[0];
      if (m[2] && (raw.match(/\d/g) || []).length < 6) continue; // skip short digit runs like "2-1-1"
      out += escapeHtml(text.slice(last, m.index));
      out += copyableSpan(raw.trim());
      last = m.index + raw.length;
    }
    out += escapeHtml(text.slice(last));
    return out;
  }

  const copyTimers = new WeakMap();
  async function activateCopyable(el) {
    const text = el.dataset.copy;
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      el.classList.add("copied");
      clearTimeout(copyTimers.get(el));
      copyTimers.set(el, setTimeout(() => el.classList.remove("copied"), 1300));
    } catch (e) { /* clipboard unavailable — silently ignore */ }
  }
  document.addEventListener("click", (e) => {
    const el = e.target.closest(".copyable");
    if (el) activateCopyable(el);
  });
  document.addEventListener("keydown", (e) => {
    if ((e.key === "Enter" || e.key === " ") && e.target.classList && e.target.classList.contains("copyable")) {
      e.preventDefault();
      activateCopyable(e.target);
    }
  });

  function enterStep2() {
    renderProcess();
    const editPanel = document.getElementById("editPanel");
    editPanel.hidden = true;
    document.getElementById("editToggle").textContent = "Edit process details for this insurer";
    const pb = getPlaybook(state.company.id) || {};
    document.getElementById("edit-to").value = pb.to || "";
    document.getElementById("edit-cc").value = pb.cc || "";
    document.getElementById("edit-regsla").value = pb.regSla || "";
    document.getElementById("edit-regnote").value = pb.regNote || "";
    document.getElementById("edit-registernote").value = pb.registerNote || "";
    document.getElementById("edit-ccb").value = pb.ccb || "";
    document.getElementById("edit-notes").value = pb.notes || "";
    document.getElementById("edit-ivr").value = pb.ivrNote || "";
    document.getElementById("edit-roadside").value = pb.roadsideNumber || "";
    document.getElementById("edit-portalurl").value = pb.portalUrl || "";
    document.getElementById("edit-portalnote").value = pb.portalNote || "";
    document.getElementById("edit-portalownonly").checked = !!pb.portalOwnOnly;
    document.getElementById("edit-repairtimeline").value = pb.repairTimelineRaw || DEFAULT_REPAIR_TIMELINE;
    document.getElementById("edit-surveyors").value = pb.surveyorsRaw || "";
    document.getElementById("edit-directory").value = pb.directoryRaw || "";
  }

  document.getElementById("editToggle").addEventListener("click", () => {
    const panel = document.getElementById("editPanel");
    panel.hidden = !panel.hidden;
    document.getElementById("editToggle").textContent = panel.hidden
      ? "Edit process details for this insurer" : "Hide editor";
  });

  document.getElementById("saveProcess").addEventListener("click", () => {
    setPlaybook(state.company.id, {
      to: document.getElementById("edit-to").value.trim(),
      cc: document.getElementById("edit-cc").value.trim(),
      regSla: document.getElementById("edit-regsla").value.trim(),
      regNote: document.getElementById("edit-regnote").value.trim(),
      registerNote: document.getElementById("edit-registernote").value.trim(),
      ccb: document.getElementById("edit-ccb").value.trim(),
      notes: document.getElementById("edit-notes").value.trim(),
      ivrNote: document.getElementById("edit-ivr").value.trim(),
      roadsideNumber: document.getElementById("edit-roadside").value.trim(),
      portalUrl: document.getElementById("edit-portalurl").value.trim(),
      portalNote: document.getElementById("edit-portalnote").value.trim(),
      portalOwnOnly: document.getElementById("edit-portalownonly").checked,
      repairTimelineRaw: document.getElementById("edit-repairtimeline").value,
      surveyorsRaw: document.getElementById("edit-surveyors").value,
      directoryRaw: document.getElementById("edit-directory").value
    });
    document.getElementById("editPanel").hidden = true;
    document.getElementById("editToggle").textContent = "Edit process details for this insurer";
    renderProcess();
  });

  // ---------- step 3: claim type ----------
  document.getElementById("pickOwn").addEventListener("click", () => selectType("own"));
  document.getElementById("pickTp").addEventListener("click", () => selectType("tp"));
  document.getElementById("backTo2").addEventListener("click", () => goTo(2));

  function selectType(type) {
    state.type = type;
    enterStep4();
    goTo(4);
  }

  // ---------- step 4: form ----------
  const ids = ["policy", "plate", "workshop", "clientcontact", "subject", "body"];
  const els = {};
  ids.forEach(id => els[id] = document.getElementById(id));

  // Claims-email chips: the first (insurer-on-file) address is locked and
  // can't be removed here — it only changes from the Process step's saved
  // playbook. Anything added after that is a per-email suggestion the
  // user can remove again.
  const toAddInput = document.getElementById("toAdd");
  const toChipsWrap = document.getElementById("toChips");
  let toEmails = [];

  function toEmailsString() { return toEmails.map(e => e.addr).join(", "); }

  function renderToChips() {
    toChipsWrap.innerHTML = toEmails.map((e, i) => `
      <span class="email-chip${e.locked ? " locked" : ""}">${e.locked ? '<svg class="lock-ic" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="11" width="16" height="9" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>' : ""}<span class="addr">${escapeHtml(e.addr)}</span>${e.locked ? "" : `<button type="button" class="rm" data-i="${i}" aria-label="Remove ${escapeHtml(e.addr)}">&times;</button>`}</span>`).join("");
    toChipsWrap.querySelectorAll(".rm").forEach(btn => btn.addEventListener("click", () => {
      toEmails.splice(Number(btn.dataset.i), 1);
      renderToChips();
      render();
    }));
  }

  function addToEmailFromInput() {
    const val = toAddInput.value.trim();
    if (!val) return;
    const hasLocked = toEmails.some(e => e.locked);
    toEmails.push({ addr: val, locked: !hasLocked });
    toAddInput.value = "";
    renderToChips();
    render();
  }
  toAddInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addToEmailFromInput(); }
  });
  toAddInput.addEventListener("blur", () => addToEmailFromInput());

  // Cc chips: same rule — the saved Cc address on file can't be removed
  // here, but extra addresses can be added as one-off suggestions.
  const ccAddInput = document.getElementById("ccAdd");
  const ccChipsWrap = document.getElementById("ccChips");
  let ccEmails = [];

  function ccEmailsString() { return ccEmails.map(e => e.addr).join(", "); }

  function renderCcChips() {
    ccChipsWrap.innerHTML = ccEmails.map((e, i) => `
      <span class="email-chip${e.locked ? " locked" : ""}">${e.locked ? '<svg class="lock-ic" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="11" width="16" height="9" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>' : ""}<span class="addr">${escapeHtml(e.addr)}</span>${e.locked ? "" : `<button type="button" class="rm" data-i="${i}" aria-label="Remove ${escapeHtml(e.addr)}">&times;</button>`}</span>`).join("");
    ccChipsWrap.querySelectorAll(".rm").forEach(btn => btn.addEventListener("click", () => {
      ccEmails.splice(Number(btn.dataset.i), 1);
      renderCcChips();
      render();
    }));
  }

  function addCcEmailFromInput() {
    const val = ccAddInput.value.trim();
    if (!val) return;
    const hasLocked = ccEmails.some(e => e.locked);
    ccEmails.push({ addr: val, locked: !hasLocked });
    ccAddInput.value = "";
    renderCcChips();
    render();
  }
  ccAddInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addCcEmailFromInput(); }
  });
  ccAddInput.addEventListener("blur", () => addCcEmailFromInput());

  function fillTokens(str) {
    const policy = els.policy.value.trim();
    const plate = els.plate.value.trim();
    const workshop = els.workshop.value.trim();
    const client = els.clientcontact.value.trim();
    const company = state.company ? state.company.name : "";
    const tpPrefix = state.type === "tp" ? "TP " : "";
    return str
      .replaceAll("{{policy}}", policy || "—")
      .replaceAll("{{plate}}", plate || "—")
      .replaceAll("{{workshop}}", workshop || "—")
      .replaceAll("{{clientcontact}}", client || "—")
      .replaceAll("{{company}}", company)
      .replaceAll("{{tp}}", tpPrefix);
  }

  document.getElementById("backTo3").addEventListener("click", () => goTo(3));

  function enterStep4() {
    const company = state.company;
    document.getElementById("step4CompanyName").textContent = company.name;
    const badge = document.getElementById("step4TypeBadge");
    badge.textContent = state.type === "tp" ? "TP claim" : "Own claim";
    badge.className = "claim-tag" + (state.type === "tp" ? " tp" : "");

    els.subject.value = "{{tp}}{{company}} Motor Claim || {{policy}} || {{plate}}";
    els.body.value = "Dear Team,\n\nKindly register the claim and assign to {{workshop}}.\n\nPolicy Number: {{policy}}\nPlate Number: {{plate}}\nClient Contact Number: {{clientcontact}}\n\nRegards,";

    const pb = getPlaybook(company.id);
    toEmails = [];
    if (pb && pb.to) {
      pb.to.split(",").map(s => s.trim()).filter(Boolean).forEach((addr, i) => toEmails.push({ addr, locked: i === 0 }));
    }
    renderToChips();
    ccEmails = [];
    if (pb && pb.cc) {
      pb.cc.split(",").map(s => s.trim()).filter(Boolean).forEach((addr, i) => ccEmails.push({ addr, locked: i === 0 }));
    }
    renderCcChips();

    els.policy.value = "";
    els.plate.value = "";
    els.workshop.value = "";
    els.clientcontact.value = "";

    updateToNote();
    renderRecap();
    render();
  }

  function updateToNote() {
    const note = document.getElementById("toNote");
    const pb = getPlaybook(state.company.id);
    if (pb && pb.to) {
      note.textContent = "From this insurer's saved process — edit if it's changed.";
      note.classList.add("remembered");
    } else {
      note.textContent = "Not on file yet — enter it once and save it from the Process step to remember it.";
      note.classList.remove("remembered");
    }
  }

  function renderRecap() {
    const pb = getPlaybook(state.company.id);
    const list = document.getElementById("recapList");
    if (!pb) {
      document.getElementById("recapBox").style.display = "none";
      return;
    }
    document.getElementById("recapBox").style.display = "";
    const items = [];
    items.push(`Registration is usually confirmed within <strong>${escapeHtml(pb.regSla || "the insurer's usual turnaround")}</strong> — once confirmed, pass the details to the client and ask them to bring the car to the workshop.`);
    const stages = (pb.repairTimelineRaw || DEFAULT_REPAIR_TIMELINE).split("\n").map(l => l.trim()).filter(Boolean).map(parseTimelineLine);
    stages.forEach(st => items.push(`<strong>${escapeHtml(st.label)}</strong>${st.time ? ": " + escapeHtml(st.time) : ""}.`));
    if (pb.ccb) items.push(escapeHtml(pb.ccb));
    list.innerHTML = items.map(t => `<li>${t}</li>`).join("");
  }

  function render() {
    const subjectFilled = fillTokens(els.subject.value);
    const bodyFilled = fillTokens(els.body.value);

    const toStr = toEmailsString();
    const ccStr = ccEmailsString();
    document.getElementById("pv-to").textContent = toStr || "(no claims email set)";
    document.getElementById("pv-cc").textContent = ccStr || "(none)";
    document.getElementById("pv-subject").textContent = subjectFilled;
    document.getElementById("pv-body").textContent = bodyFilled;

    const missingBits = [];
    if (!toStr) missingBits.push("claims email");
    if (!els.policy.value.trim()) missingBits.push("policy number");
    if (!els.plate.value.trim()) missingBits.push("plate number");
    if (!els.clientcontact.value.trim()) missingBits.push("client contact number");
    const note = document.getElementById("missingNote");
    if (missingBits.length) {
      note.textContent = "Still missing: " + missingBits.join(", ") + ".";
      note.classList.add("show");
    } else {
      note.classList.remove("show");
    }

    const gmailLink = document.getElementById("openGmail");
    const hasTo = !!toStr;
    gmailLink.setAttribute("aria-disabled", hasTo ? "false" : "true");
    if (hasTo) {
      const to = encodeURIComponent(toStr);
      const cc = encodeURIComponent(ccStr);
      const su = encodeURIComponent(subjectFilled);
      const bodyParam = encodeURIComponent(bodyFilled);
      let url = `https://mail.google.com/mail/?view=cm&tf=cm&fs=1&to=${to}&su=${su}&body=${bodyParam}`;
      if (ccStr) url += `&cc=${cc}`;
      gmailLink.href = url;
      document.getElementById("fallbackLink").href = url;
    } else {
      gmailLink.href = "#";
    }

    // Keep the insurer's saved claims email/cc in sync — only the locked
    // (on-file) address persists to the playbook; addresses added here as
    // suggestions stay local to this claim and are never saved.
    const lockedAddr = (toEmails.find(e => e.locked) || {}).addr || "";
    const lockedCc = (ccEmails.find(e => e.locked) || {}).addr || "";
    if (state.company && lockedAddr) {
      const pb = getPlaybook(state.company.id) || {};
      if (pb.to !== lockedAddr || (pb.cc || "") !== lockedCc) {
        setPlaybook(state.company.id, Object.assign({}, pb, { to: lockedAddr, cc: lockedCc }));
        updateToNote();
      }
    }
  }

  ids.forEach(id => els[id].addEventListener("input", () => {
    document.getElementById("fallbackLink").style.display = "none";
    render();
  }));

  document.getElementById("openGmail").addEventListener("click", function (e) {
    if (this.getAttribute("aria-disabled") === "true" || this.href.endsWith("#")) {
      e.preventDefault();
      return;
    }
    setTimeout(() => { document.getElementById("fallbackLink").style.display = "inline-flex"; }, 400);
  });

  document.getElementById("copyBody").addEventListener("click", async function () {
    const text = fillTokens(els.body.value);
    const status = document.getElementById("statusMsg");
    try {
      await navigator.clipboard.writeText(text);
      status.textContent = "Copied";
    } catch (e) {
      status.textContent = "Couldn't copy — select manually";
    }
    status.classList.add("show");
    setTimeout(() => status.classList.remove("show"), 1600);
  });

  document.getElementById("startOver").addEventListener("click", function () {
    state = { company: null, type: null };
    companySelectVal = "";
    companySelectValue.textContent = "Select an insurer…";
    companySelectValue.classList.remove("is-set");
    insurerOptionEls.forEach(el => { el.classList.remove("is-selected"); el.setAttribute("aria-selected", "false"); });
    closeInsurerOptions();
    continueBtn1.disabled = true;
    goTo(1);
  });

  goTo(1);
})();
