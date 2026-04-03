var APP_PROFILE = {
  name: "Suraj Gupta",
  title: "Software Developer",
  email: "",
  phone: "",
  location: "India",
  summary:
    "Software developer focused on full-stack web applications, backend APIs, clean UI, and practical product delivery.",
  availability: "Available for interviews and immediate discussions",
  defaultResumePath: "C:\\Users\\SurajGupta\\Documents\\Suraj_Gupta_Resume.pdf"
};

var companies = [];
var currentFilters = { query: "", type: "all", location: "all", selectedOnly: false, recentOnly: false };
var hiringBatchIndex = 0;

(function init() {
  loadFromStorage();
  initTabs();
  syncProfileDefaults();
  updStats();
  loadServerState();
})();

function cloneData(value) { return JSON.parse(JSON.stringify(value)); }
function normalizeCompany(company, index) {
  var item = company || {};
  return {
    id: item.id || "company-" + index,
    name: String(item.name || "").trim(),
    email: String(item.email || "").trim().toLowerCase(),
    type: String(item.type || "custom").trim() || "custom",
    location: String(item.location || "Remote").trim() || "Remote",
    focus: String(item.focus || "General hiring").trim() || "General hiring",
    role: String(item.role || "Software Engineer").trim() || "Software Engineer",
    sourceUrl: String(item.sourceUrl || "").trim(),
    sourceLabel: String(item.sourceLabel || "Public recruiting mailbox").trim(),
    recent: item.recent !== false,
    selected: item.selected !== false
  };
}
function normalizeCompanies(list) { return (Array.isArray(list) ? list : []).map(function (company, index) { return normalizeCompany(company, index); }).filter(function (company) { return company.name && company.email; }); }
function getProfileName() { return document.getElementById("cfg-name").value.trim() || localStorage.getItem("jeb_name") || APP_PROFILE.name; }
function getProfileEmail() { return document.getElementById("cfg-gmail").value.trim() || localStorage.getItem("jeb_gmail") || APP_PROFILE.email || ""; }
function buildDefaultBody() {
  var name = getProfileName();
  var email = getProfileEmail() || "your.email@example.com";
  return [
    "Dear Hiring Team,",
    "",
    "I am " + name + ", a software developer interested in roles where I can contribute across product development, backend logic, APIs, and user-facing workflows.",
    "",
    "A few strengths I bring:",
    "- Full-stack development with attention to maintainability and delivery speed",
    "- Experience building practical internal tools and business workflows",
    "- Comfortable collaborating with product, design, and engineering teams",
    "",
    "My resume is attached for review, and I would welcome the opportunity to discuss relevant openings.",
    "",
    "Regards,",
    name,
    email
  ].join("\n");
}
function syncProfileDefaults() {
  var nameInput = document.getElementById("cfg-name");
  var gmailInput = document.getElementById("cfg-gmail");
  var subjectInput = document.getElementById("emailSubject");
  var bodyInput = document.getElementById("emailBody");
  if (nameInput && !nameInput.value.trim()) { nameInput.value = localStorage.getItem("jeb_name") || APP_PROFILE.name; }
  if (gmailInput && !gmailInput.value.trim()) { gmailInput.value = localStorage.getItem("jeb_gmail") || APP_PROFILE.email; }
  if (subjectInput && (!subjectInput.value.trim() || /Paras Verma/i.test(subjectInput.value))) { subjectInput.value = "Application for Software Developer Role | " + getProfileName(); }
  if (bodyInput && (!bodyInput.value.trim() || /Paras Verma|vparas0002@gmail.com|8295848561/.test(bodyInput.value))) { bodyInput.value = buildDefaultBody(); }
  updateResumeHint();
}
function updateResumeHint() {
  var hint = document.getElementById("resumeHint");
  var fileInput = document.getElementById("cfg-resume");
  if (!hint) return;
  if (fileInput && fileInput.files && fileInput.files.length > 0) { hint.textContent = "Selected resume: " + fileInput.files[0].name; return; }
  hint.textContent = "Default fallback resume: " + APP_PROFILE.defaultResumePath;
}
function loadDefaultHiringBatch() { companies = normalizeCompanies(getHiringBatch(hiringBatchIndex, HIRING_BATCH_SIZE)); }
function loadFromStorage() {
  try {
    var saved = localStorage.getItem("jeb_companies");
    if (saved) { companies = normalizeCompanies(JSON.parse(saved)); } else { loadDefaultHiringBatch(); }
  } catch (e) { loadDefaultHiringBatch(); }
}
function saveToStorage() { try { localStorage.setItem("jeb_companies", JSON.stringify(companies)); } catch (e) {} saveCompaniesToServer(); }
async function loadServerState() {
  try {
    var resp = await fetch("php/state.php");
    if (!resp.ok) return;
    var data = await resp.json();
    if (!data.success) return;
    if (Array.isArray(data.companies) && data.companies.length >= Math.min(HIRING_BATCH_SIZE, HIRING_COMPANY_POOL.length) && data.companies[0] && data.companies[0].role) {
      companies = normalizeCompanies(data.companies);
      localStorage.setItem("jeb_companies", JSON.stringify(companies));
    } else {
      loadDefaultHiringBatch();
      saveToStorage();
    }
    if (data.profile) {
      if (data.profile.gmail) { localStorage.setItem("jeb_gmail", data.profile.gmail); document.getElementById("cfg-gmail").value = data.profile.gmail; }
      if (data.profile.name) { localStorage.setItem("jeb_name", data.profile.name); document.getElementById("cfg-name").value = data.profile.name; }
    }
    syncProfileDefaults();
    renderLocationOptions();
    render();
    updStats();
  } catch (e) {}
}
async function saveProfileToServer(gmail, name) { try { await fetch("php/save-profile.php", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ gmail: gmail, name: name }) }); } catch (e) {} }
async function saveCompaniesToServer() { try { await fetch("php/save-companies.php", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ companies: companies }) }); } catch (e) {} }
async function logSendToServer(entry) { try { await fetch("php/log-send.php", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(entry) }); } catch (e) {} }
function initTabs() {
  document.querySelectorAll(".tab").forEach(function (tab) {
    tab.addEventListener("click", function () {
      var name = this.dataset.tab;
      document.querySelectorAll(".tab").forEach(function (item) { item.classList.remove("active"); });
      document.querySelectorAll(".tc").forEach(function (panel) { panel.classList.remove("active"); });
      this.classList.add("active");
      document.getElementById("t-" + name).classList.add("active");
      if (name === "companies") { renderLocationOptions(); render(); }
    });
  });
}
function renderLocationOptions() {
  var select = document.getElementById("filter-location");
  if (!select) return;
  var current = select.value || "all";
  var seen = {};
  var options = ['<option value="all">All locations</option>'];
  companies.forEach(function (company) { if (!company.location || seen[company.location]) return; seen[company.location] = true; options.push('<option value="' + escHtml(company.location) + '">' + escHtml(company.location) + '</option>'); });
  select.innerHTML = options.join("");
  select.value = seen[current] ? current : "all";
}
function setLocationFilter(location) { document.getElementById("filter-location").value = location; updateFilters(); }
function toggleRecentOnly() { var checkbox = document.getElementById("filter-recent"); checkbox.checked = !checkbox.checked; updateFilters(); }
function updateFilters() {
  currentFilters.query = document.getElementById("srch").value.trim().toLowerCase();
  currentFilters.type = document.getElementById("filter-type").value;
  currentFilters.location = document.getElementById("filter-location").value;
  currentFilters.selectedOnly = document.getElementById("filter-selected").checked;
  currentFilters.recentOnly = document.getElementById("filter-recent").checked;
  render();
}
function refreshHiringBatch() {
  hiringBatchIndex = (hiringBatchIndex + HIRING_BATCH_SIZE) % HIRING_COMPANY_POOL.length;
  companies = normalizeCompanies(getHiringBatch(hiringBatchIndex, HIRING_BATCH_SIZE));
  saveToStorage(); renderLocationOptions(); render();
  document.getElementById("batchHint").textContent = "Loaded the next Gurgaon, Noida, and Bengaluru focused batch. Public recruiting emails are safer, but still spot-check before bulk send.";
}
function render() {
  var list = document.getElementById("clist");
  if (!list) return;
  list.innerHTML = "";
  var shown = [];
  companies.forEach(function (company, index) {
    var haystack = [company.name, company.email, company.type, company.location, company.focus, company.role].join(" ").toLowerCase();
    if (currentFilters.query && haystack.indexOf(currentFilters.query) === -1) return;
    if (currentFilters.type !== "all" && company.type !== currentFilters.type) return;
    if (currentFilters.location !== "all" && company.location !== currentFilters.location) return;
    if (currentFilters.selectedOnly && !company.selected) return;
    if (currentFilters.recentOnly && !company.recent) return;
    shown.push({ company: company, index: index });
  });
  shown.forEach(function (entry) {
    var company = entry.company;
    var row = document.createElement("div");
    row.className = "crow";
    row.innerHTML =
      '<label class="check-wrap"><input type="checkbox" class="cchk" data-i="' + entry.index + '"' + (company.selected ? ' checked' : '') + '><span class="check-ui"></span></label>' +
      '<div class="crow-main">' +
      '<div class="crow-head"><span class="cn">' + escHtml(company.name) + '</span><span class="ctype ' + typeClass(company.type) + '">' + escHtml(company.type) + '</span>' + (company.recent ? '<span class="meta-pill meta-recent">Recent</span>' : '') + '</div>' +
      '<div class="crow-meta"><span class="ce">' + escHtml(company.email) + '</span><span class="meta-pill">' + escHtml(company.location) + '</span><span class="meta-pill meta-focus">' + escHtml(company.focus) + '</span></div>' +
      '<div class="helper" style="margin-top:8px;">Role: ' + escHtml(company.role) + '</div>' +
      (company.sourceUrl ? '<div class="helper" style="margin-top:6px;"><a href="' + escHtml(company.sourceUrl) + '" target="_blank">Hiring source</a> · ' + escHtml(company.sourceLabel) + '</div>' : '') +
      '</div>' +
      '<button class="db" onclick="delOne(' + entry.index + ')">Remove</button>';
    list.appendChild(row);
  });
  list.querySelectorAll(".cchk").forEach(function (checkbox) { checkbox.addEventListener("change", function () { toggleCompanySelection(parseInt(this.dataset.i, 10), this.checked); }); });
  document.getElementById("lftr").textContent = "Showing " + shown.length + " of " + companies.length + " companies";
  updStats();
}
function typeClass(type) { return { product: "tp", startup: "ts", services: "tv", custom: "tc2" }[type] || "tc2"; }
function toggleCompanySelection(index, checked) { if (!companies[index]) return; companies[index].selected = checked; saveToStorage(); updStats(); }
function filt(type) { document.getElementById("filter-type").value = type; updateFilters(); }
function selAll() { companies.forEach(function (company) { company.selected = true; }); saveToStorage(); render(); }
function deselAll() { companies.forEach(function (company) { company.selected = false; }); saveToStorage(); render(); }
function delOne(index) { if (!companies[index]) return; if (!confirm('Delete "' + companies[index].name + '"?')) return; companies.splice(index, 1); saveToStorage(); renderLocationOptions(); render(); }
function delSel() { var count = companies.filter(function (company) { return company.selected; }).length; if (!count) { alert("No selected companies to remove."); return; } if (!confirm("Delete " + count + " selected companies?")) return; companies = companies.filter(function (company) { return !company.selected; }); saveToStorage(); renderLocationOptions(); render(); }
function updStats() { document.getElementById("sc-total").textContent = companies.length; document.getElementById("sc-sel").textContent = companies.filter(function (company) { return company.selected; }).length; document.getElementById("sc-custom").textContent = companies.filter(function (company) { return company.type === "custom"; }).length; }
function addOne() { var name = document.getElementById("s-name").value.trim(); var email = document.getElementById("s-email").value.trim().toLowerCase(); var type = document.getElementById("s-type").value; var location = document.getElementById("s-location").value.trim() || "Remote"; var focus = document.getElementById("s-focus").value.trim() || "General hiring"; var box = document.getElementById("s-msg"); if (!name || !email) { showMsg(box, "ebox", "Name and email are both required."); return; } if (!/\S+@\S+\.\S+/.test(email)) { showMsg(box, "ebox", "Enter a valid email address."); return; } if (companies.some(function (company) { return company.email === email; })) { showMsg(box, "ebox", "That email is already in the list."); return; } companies.push(normalizeCompany({ name: name, email: email, type: type, location: location, focus: focus, role: "Software Engineer", sourceLabel: "Manually added", recent: false, selected: true }, companies.length)); saveToStorage(); renderLocationOptions(); render(); document.getElementById("s-name").value = ""; document.getElementById("s-email").value = ""; document.getElementById("s-location").value = ""; document.getElementById("s-focus").value = ""; showMsg(box, "sbox", '"' + name + '" added. Total companies: ' + companies.length); }
function doImport() { var raw = document.getElementById("jinput").value.trim(); var errorBox = document.getElementById("jerr"); var successBox = document.getElementById("jsuc"); errorBox.style.display = "none"; successBox.style.display = "none"; if (!raw) { showMsg(errorBox, "ebox", "Paste JSON before importing."); return; } var parsed; try { parsed = JSON.parse(raw); } catch (e) { showMsg(errorBox, "ebox", "Invalid JSON: " + e.message); return; } if (!Array.isArray(parsed)) { showMsg(errorBox, "ebox", "JSON must be an array."); return; } var added = 0, skipped = 0, invalid = 0; parsed.forEach(function (item) { if (!item || !item.name || !item.email) { invalid++; return; } var email = String(item.email).trim().toLowerCase(); if (!/\S+@\S+\.\S+/.test(email)) { invalid++; return; } if (companies.some(function (company) { return company.email === email; })) { skipped++; return; } companies.push(normalizeCompany({ name: item.name, email: email, type: item.type || "custom", location: item.location || "Remote", focus: item.focus || "General hiring", role: item.role || "Software Engineer", sourceUrl: item.sourceUrl || "", sourceLabel: item.sourceLabel || "Imported", recent: item.recent !== false, selected: item.selected !== false }, companies.length)); added++; }); saveToStorage(); renderLocationOptions(); render(); document.getElementById("jinput").value = ""; showMsg(successBox, "sbox", added + " added, " + skipped + " skipped, " + invalid + " invalid. Total companies: " + companies.length); }
function doExport() { var payload = companies.map(function (company) { return { name: company.name, email: company.email, type: company.type, location: company.location, focus: company.focus, role: company.role, sourceUrl: company.sourceUrl, sourceLabel: company.sourceLabel, recent: company.recent, selected: company.selected }; }); var blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }); var link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = "companies.json"; link.click(); URL.revokeObjectURL(link.href); }
function saveConfig() { var gmail = document.getElementById("cfg-gmail").value.trim(); var pass = document.getElementById("cfg-pass").value.trim(); var name = document.getElementById("cfg-name").value.trim() || APP_PROFILE.name; var box = document.getElementById("cfg-msg"); if (!gmail || !pass) { showMsg(box, "ebox", "Gmail and App Password are required."); return; } localStorage.setItem("jeb_gmail", gmail); localStorage.setItem("jeb_name", name); localStorage.removeItem("jeb_pass"); saveProfileToServer(gmail, name); syncProfileDefaults(); showMsg(box, "sbox", "Configuration saved."); }
async function startSend() { var gmail = getProfileEmail(); var pass = document.getElementById("cfg-pass").value.trim(); var name = getProfileName(); var delay = parseInt(document.getElementById("cfg-delay").value, 10) || 3; var subject = document.getElementById("emailSubject").value.trim(); var body = document.getElementById("emailBody").value.trim(); if (!gmail) { alert("Enter your Gmail address in Setup first."); return; } if (!pass) { alert("Enter your Gmail App Password in Setup first."); return; } if (!subject) { alert("Add an email subject before sending."); return; } if (!body) { alert("Add an email body before sending."); return; } var selected = companies.filter(function (company) { return company.selected; }); if (!selected.length) { alert("Select at least one company before sending."); return; } var resumeB64 = ""; var resumeName = ""; var defaultResumePath = APP_PROFILE.defaultResumePath; var fileInput = document.getElementById("cfg-resume"); if (fileInput && fileInput.files.length > 0) { resumeB64 = await fileToBase64(fileInput.files[0]); resumeName = fileInput.files[0].name; defaultResumePath = ""; } document.getElementById("sendbtn").disabled = true; document.getElementById("psec").style.display = "block"; document.getElementById("rbox").style.display = "none"; document.getElementById("logbox").innerHTML = ""; var successCount = 0; var failCount = 0; lg("Preparing " + selected.length + " emails", "li"); lg("From: " + gmail, "li"); lg("Using resume: " + (resumeName || defaultResumePath), "li"); for (var i = 0; i < selected.length; i++) { var company = selected[i]; var pct = Math.round((i / selected.length) * 100); document.getElementById("pfill").style.width = pct + "%"; document.getElementById("ppct").textContent = pct + "%"; document.getElementById("plabel").textContent = "Sending to " + company.name; lg("[" + pad(i + 1) + "/" + selected.length + "] " + company.name + " <" + company.email + ">", "lw"); try { var result = await sendEmail({ gmail: gmail, pass: pass, senderName: name, toEmail: company.email, toName: "Hiring Team", subject: subject, body: personalizeBody(body, company, name), resumeB64: resumeB64, resumeName: resumeName, defaultResumePath: defaultResumePath }); if (!result.success) { throw new Error(result.message || "Unknown error"); } lg("Sent successfully", "ls"); successCount++; logSendToServer({ senderEmail: gmail, senderName: name, subject: subject, companyName: company.name, companyEmail: company.email, status: "sent", message: result.message || "" }); } catch (e) { lg("Failed: " + (e.message || e), "le"); failCount++; logSendToServer({ senderEmail: gmail, senderName: name, subject: subject, companyName: company.name, companyEmail: company.email, status: "failed", message: e.message || String(e) }); } document.getElementById("sc-sent").textContent = successCount; await sleep(delay * 1000); } document.getElementById("pfill").style.width = "100%"; document.getElementById("ppct").textContent = "100%"; document.getElementById("plabel").textContent = "Complete"; lg("Finished: " + successCount + " sent, " + failCount + " failed", "ls"); document.getElementById("rbox").style.display = "block"; document.getElementById("rtitle").textContent = successCount + " emails sent"; document.getElementById("rdesc").textContent = successCount + " successful, " + failCount + " failed, " + selected.length + " total"; document.getElementById("sendbtn").disabled = false; }
function personalizeBody(body, company, senderName) { return body.replace(/\{\{companyName\}\}/g, company.name).replace(/\{\{companyType\}\}/g, company.type).replace(/\{\{location\}\}/g, company.location).replace(/\{\{senderName\}\}/g, senderName); }
async function sendEmail(data) { var formData = new FormData(); formData.append("gmail", data.gmail); formData.append("pass", data.pass); formData.append("senderName", data.senderName); formData.append("toEmail", data.toEmail); formData.append("toName", data.toName); formData.append("subject", data.subject); formData.append("body", data.body); formData.append("resumeB64", data.resumeB64 || ""); formData.append("resumeName", data.resumeName || ""); formData.append("defaultResumePath", data.defaultResumePath || ""); var resp = await fetch("php/sendmail.php", { method: "POST", body: formData }); return resp.json(); }
function resetBody() { document.getElementById("emailBody").value = buildDefaultBody(); document.getElementById("emailSubject").value = "Application for Software Developer Role | " + getProfileName(); }
function sleep(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }
function pad(n) { return String(n).padStart(2, "0"); }
function escHtml(value) { return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#39;"); }
function lg(message, type) { var box = document.getElementById("logbox"); var line = document.createElement("div"); line.className = type || "li"; line.textContent = message; box.appendChild(line); box.scrollTop = box.scrollHeight; }
function showMsg(element, className, message) { element.className = className; element.textContent = message; element.style.display = "block"; }
function fileToBase64(file) { return new Promise(function (resolve, reject) { var reader = new FileReader(); reader.onload = function (event) { resolve(String(event.target.result || "").split(",")[1] || ""); }; reader.onerror = reject; reader.readAsDataURL(file); }); }
