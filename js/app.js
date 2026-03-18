// ─────────────────────────────────────────────────────────────
//  app.js  —  All UI logic, send via PHP SMTP
// ─────────────────────────────────────────────────────────────

var companies = [];
var curFilt = "all";

// ── INIT ──────────────────────────────────────────────────────
(function init() {
  loadFromStorage();
  updStats();
  initTabs();
  loadServerState();
})();

// ── LOCAL STORAGE ─────────────────────────────────────────────
function loadFromStorage() {
  try {
    var saved = localStorage.getItem("jeb_companies");
    companies = saved
      ? JSON.parse(saved)
      : JSON.parse(JSON.stringify(DEFAULT_COMPANIES));
  } catch (e) {
    companies = JSON.parse(JSON.stringify(DEFAULT_COMPANIES));
  }
}

function saveToStorage() {
  try {
    localStorage.setItem("jeb_companies", JSON.stringify(companies));
  } catch (e) {}
  saveCompaniesToServer();
}

async function loadServerState() {
  try {
    var resp = await fetch("php/state.php");
    if (!resp.ok) return;
    var data = await resp.json();
    if (!data.success) return;

    if (Array.isArray(data.companies) && data.companies.length) {
      companies = data.companies;
      try {
        localStorage.setItem("jeb_companies", JSON.stringify(companies));
      } catch (e) {}
    }

    if (data.profile) {
      if (data.profile.gmail) {
        localStorage.setItem("jeb_gmail", data.profile.gmail);
        var gmailInput = document.getElementById("cfg-gmail");
        if (gmailInput && !gmailInput.value) gmailInput.value = data.profile.gmail;
      }
      if (data.profile.name) {
        localStorage.setItem("jeb_name", data.profile.name);
        var nameInput = document.getElementById("cfg-name");
        if (nameInput && !nameInput.value) nameInput.value = data.profile.name;
      }
    }

    updStats();
    if (document.getElementById("clist")) render();
  } catch (e) {}
}

async function saveProfileToServer(gmail, name) {
  try {
    await fetch("php/save-profile.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gmail: gmail, name: name }),
    });
  } catch (e) {}
}

async function saveCompaniesToServer() {
  try {
    await fetch("php/save-companies.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companies: companies }),
    });
  } catch (e) {}
}

async function logSendToServer(entry) {
  try {
    await fetch("php/log-send.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entry),
    });
  } catch (e) {}
}

// ── TABS ──────────────────────────────────────────────────────
function initTabs() {
  document.querySelectorAll(".tab").forEach(function (tab) {
    tab.addEventListener("click", function () {
      var name = this.dataset.tab;
      document.querySelectorAll(".tab").forEach(function (t) {
        t.classList.remove("active");
      });
      document.querySelectorAll(".tc").forEach(function (c) {
        c.classList.remove("active");
      });
      this.classList.add("active");
      document.getElementById("t-" + name).classList.add("active");
      if (name === "companies") render();
    });
  });
}

// ── RENDER COMPANY LIST ───────────────────────────────────────
function render() {
  var q = (
    document.getElementById("srch") ? document.getElementById("srch").value : ""
  ).toLowerCase();
  var el = document.getElementById("clist");
  el.innerHTML = "";

  var shown = companies
    .map(function (c, i) {
      return Object.assign({}, c, { _i: i });
    })
    .filter(function (c) {
      var ft = curFilt === "all" || c.type === curFilt;
      var fs =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q);
      return ft && fs;
    });

  shown.forEach(function (c) {
    var clsMap = {
      product: "tp",
      startup: "ts",
      services: "tv",
      custom: "tc2",
    };
    var cls = clsMap[c.type] || "tc2";
    var row = document.createElement("div");
    row.className = "crow";
    row.innerHTML =
      '<input type="checkbox" class="cchk" data-i="' +
      c._i +
      '" checked onchange="updStats()">' +
      '<span class="cn">' +
      escHtml(c.name) +
      "</span>" +
      '<span class="ce">' +
      escHtml(c.email) +
      "</span>" +
      '<span class="ctype ' +
      cls +
      '">' +
      (c.type || "custom") +
      "</span>" +
      '<button class="db" onclick="delOne(' +
      c._i +
      ')" title="Delete">✕</button>';
    el.appendChild(row);
  });

  document.getElementById("lftr").textContent =
    "Showing " + shown.length + " of " + companies.length + " companies";
  updStats();
}

function filt(f) {
  curFilt = f;
  render();
}
function selAll() {
  document.querySelectorAll(".cchk").forEach(function (c) {
    c.checked = true;
  });
  updStats();
}
function deselAll() {
  document.querySelectorAll(".cchk").forEach(function (c) {
    c.checked = false;
  });
  updStats();
}

function delOne(i) {
  if (!confirm('Delete "' + companies[i].name + '"?')) return;
  companies.splice(i, 1);
  saveToStorage();
  render();
}

function delSel() {
  var idxs = Array.from(document.querySelectorAll(".cchk:checked"))
    .map(function (c) {
      return parseInt(c.dataset.i);
    })
    .sort(function (a, b) {
      return b - a;
    });
  if (!idxs.length) {
    alert("Koi select nahi!");
    return;
  }
  if (!confirm("Delete " + idxs.length + " companies?")) return;
  idxs.forEach(function (i) {
    companies.splice(i, 1);
  });
  saveToStorage();
  render();
}

function updStats() {
  var sel = document.querySelectorAll(".cchk:checked").length;
  var custom = companies.filter(function (c) {
    return c.type === "custom";
  }).length;
  document.getElementById("sc-total").textContent = companies.length;
  document.getElementById("sc-sel").textContent = sel || companies.length;
  document.getElementById("sc-custom").textContent = custom;
}

// ── SINGLE ADD ────────────────────────────────────────────────
function addOne() {
  var n = document.getElementById("s-name").value.trim();
  var e = document.getElementById("s-email").value.trim();
  var t = document.getElementById("s-type").value;
  var m = document.getElementById("s-msg");

  if (!n || !e) {
    showMsg(m, "ebox", "❌ Name aur Email dono daalo!");
    return;
  }
  if (!/\S+@\S+\.\S+/.test(e)) {
    showMsg(m, "ebox", "❌ Valid email daalo!");
    return;
  }
  if (
    companies.find(function (c) {
      return c.email === e;
    })
  ) {
    showMsg(m, "ebox", "❌ Email already list mein hai!");
    return;
  }

  companies.push({ name: n, email: e, type: t });
  saveToStorage();
  document.getElementById("s-name").value = "";
  document.getElementById("s-email").value = "";
  showMsg(m, "sbox", '✅ "' + n + '" added! Total: ' + companies.length);
  updStats();
  setTimeout(function () {
    m.style.display = "none";
  }, 3000);
}

// ── JSON IMPORT ───────────────────────────────────────────────
function doImport() {
  var raw = document.getElementById("jinput").value.trim();
  var err = document.getElementById("jerr");
  var suc = document.getElementById("jsuc");
  err.style.display = suc.style.display = "none";

  if (!raw) {
    showMsg(err, "ebox", "❌ Pehle JSON paste karo!");
    return;
  }

  var parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    showMsg(err, "ebox", "❌ JSON format galat hai: " + e.message);
    return;
  }

  if (!Array.isArray(parsed)) {
    showMsg(err, "ebox", "❌ JSON ek array honi chahiye [ ... ]");
    return;
  }

  var added = 0,
    skipped = 0,
    invalid = 0;
  parsed.forEach(function (item) {
    if (!item.name || !item.email) {
      invalid++;
      return;
    }
    if (!/\S+@\S+\.\S+/.test(item.email)) {
      invalid++;
      return;
    }
    if (
      companies.find(function (c) {
        return c.email === item.email;
      })
    ) {
      skipped++;
      return;
    }
    companies.push({
      name: item.name.trim(),
      email: item.email.trim(),
      type: item.type || "custom",
    });
    added++;
  });

  saveToStorage();
  document.getElementById("jinput").value = "";
  showMsg(
    suc,
    "sbox",
    "✅ " +
      added +
      " add hue! (" +
      skipped +
      " duplicate skip, " +
      invalid +
      " invalid) | Total: " +
      companies.length
  );
  updStats();
}

// ── EXPORT JSON ───────────────────────────────────────────────
function doExport() {
  var blob = new Blob([JSON.stringify(companies, null, 2)], {
    type: "application/json",
  });
  var a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "companies.json";
  a.click();
  URL.revokeObjectURL(a.href);
}

// ── SAVE CONFIG ───────────────────────────────────────────────
function saveConfig() {
  var gmail = document.getElementById("cfg-gmail").value.trim();
  var pass = document.getElementById("cfg-pass").value.trim();
  var name = document.getElementById("cfg-name").value.trim();
  var m = document.getElementById("cfg-msg");

  if (!gmail || !pass) {
    showMsg(m, "ebox", "❌ Gmail aur App Password dono daalo!");
    return;
  }

  localStorage.setItem("jeb_gmail", gmail);
  localStorage.removeItem("jeb_pass");
  localStorage.setItem("jeb_name", name);
  saveProfileToServer(gmail, name);
  showMsg(m, "sbox", "✅ Config saved!");
  setTimeout(function () {
    m.style.display = "none";
  }, 2000);
}

// ── SEND VIA PHP ──────────────────────────────────────────────
var sentCount = 0;

async function startSend() {
  var gmail =
    document.getElementById("cfg-gmail").value.trim() ||
    localStorage.getItem("jeb_gmail");
  var pass = document.getElementById("cfg-pass").value.trim();
  var name =
    document.getElementById("cfg-name").value.trim() ||
    localStorage.getItem("jeb_name") ||
    "Paras Verma";
  var delay = parseInt(document.getElementById("cfg-delay").value) || 3;
  var subjectInput = document.getElementById("emailSubject");
  var bodyInput = document.getElementById("emailBody");
  var subject = subjectInput ? subjectInput.value.trim() : "";
  var body = bodyInput ? bodyInput.value.trim() : "";

  if (!gmail) {
    alert("Setup tab mein Gmail daalo!");
    return;
  }
  if (!pass) {
    alert("Setup tab mein App Password daalo!");
    return;
  }
  if (!subject) {
    alert("AI Writer tab mein subject daalo!");
    return;
  }
  if (!body) {
    alert("AI Writer tab mein email body daalo!");
    return;
  }

  // Get resume file as base64
  var resumeB64 = "";
  var resumeName = "";
  var fileInp = document.getElementById("cfg-resume");
  if (fileInp && fileInp.files.length > 0) {
    try {
      resumeB64 = await fileToBase64(fileInp.files[0]);
      resumeName = fileInp.files[0].name;
    } catch (e) {
      console.warn("Resume encode error:", e);
    }
  }

  // Which companies
  var chks = Array.from(document.querySelectorAll(".cchk:checked"));
  var sel =
    chks.length > 0
      ? chks
          .map(function (c) {
            return companies[parseInt(c.dataset.i)];
          })
          .filter(Boolean)
      : companies.slice();

  if (!sel.length) {
    alert("Companies list empty hai!");
    return;
  }

  // UI
  document.getElementById("sendbtn").disabled = true;
  document.getElementById("psec").style.display = "block";
  document.getElementById("rbox").style.display = "none";
  document.getElementById("logbox").innerHTML = "";
  sentCount = 0;

  lg("🚀 " + sel.length + " companies ko email bhej rahe hain...", "li");
  lg("📧 From: " + gmail, "li");
  lg("─".repeat(46), "li");

  var ok = 0,
    fail = 0;

  for (var i = 0; i < sel.length; i++) {
    var c = sel[i];
    var pct = Math.round((i / sel.length) * 100);
    document.getElementById("pfill").style.width = pct + "%";
    document.getElementById("ppct").textContent = pct + "%";
    document.getElementById("plabel").textContent = "Sending → " + c.name;
    lg(
      "[" +
        pad(i + 1) +
        "/" +
        sel.length +
        "] → " +
        c.name +
        " (" +
        c.email +
        ")",
      "lw"
    );

    try {
      var result = await sendEmail({
        gmail: gmail,
        pass: pass,
        senderName: name,
        toEmail: c.email,
        toName: "Hiring Team",
        subject: subject,
        body: body,
        resumeB64: resumeB64,
        resumeName: resumeName,
      });

      if (result.success) {
        lg("   ✅ Sent!", "ls");
        ok++;
        logSendToServer({
          senderEmail: gmail,
          senderName: name,
          subject: subject,
          companyName: c.name,
          companyEmail: c.email,
          status: "sent",
          message: result.message || "",
        });
      } else {
        throw new Error(result.message || "Unknown error");
      }
    } catch (e) {
      lg("   ❌ Failed: " + (e.message || e), "le");
      fail++;
      logSendToServer({
        senderEmail: gmail,
        senderName: name,
        subject: subject,
        companyName: c.name,
        companyEmail: c.email,
        status: "failed",
        message: e.message || String(e),
      });
    }

    document.getElementById("sc-sent").textContent = ok;
    await sleep(delay * 1000);
  }

  document.getElementById("pfill").style.width = "100%";
  document.getElementById("ppct").textContent = "100%";
  document.getElementById("plabel").textContent = "Complete!";
  lg("─".repeat(46), "li");
  lg("🎉 DONE: " + ok + " sent, " + fail + " failed", "ls");

  var rb = document.getElementById("rbox");
  rb.style.display = "block";
  document.getElementById("rtitle").textContent = "🎉 " + ok + " Emails Sent!";
  document.getElementById("rdesc").textContent =
    ok + " success · " + fail + " failed · " + sel.length + " total";
  document.getElementById("sendbtn").disabled = false;
}

// ── SEND TO PHP ───────────────────────────────────────────────
async function sendEmail(data) {
  var formData = new FormData();
  formData.append("gmail", data.gmail);
  formData.append("pass", data.pass);
  formData.append("senderName", data.senderName);
  formData.append("toEmail", data.toEmail);
  formData.append("toName", data.toName);
  formData.append("subject", data.subject);
  formData.append("body", data.body);
  formData.append("resumeB64", data.resumeB64 || "");
  formData.append("resumeName", data.resumeName || "");

  var resp = await fetch("php/sendmail.php", {
    method: "POST",
    body: formData,
  });

  var json = await resp.json();
  return json;
}

// ── HELPERS ───────────────────────────────────────────────────
function sleep(ms) {
  return new Promise(function (r) {
    setTimeout(r, ms);
  });
}
function pad(n) {
  return String(n).padStart(2, "0");
}
function escHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function lg(msg, type) {
  var box = document.getElementById("logbox");
  var line = document.createElement("div");
  line.className = type || "li";
  line.textContent = msg;
  box.appendChild(line);
  box.scrollTop = box.scrollHeight;
}

function showMsg(el, cls, msg) {
  el.className = cls;
  el.textContent = msg;
  el.style.display = "block";
}

function fileToBase64(file) {
  return new Promise(function (resolve, reject) {
    var reader = new FileReader();
    reader.onload = function (e) {
      // Strip data URI prefix, keep only base64 part
      var b64 = e.target.result.split(",")[1];
      resolve(b64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
