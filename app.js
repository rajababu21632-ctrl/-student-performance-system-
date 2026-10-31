/* Student Performance System - front-end behaviour (plain JavaScript) */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- theme toggle ---------- */
  var toggle = $("#themeToggle");
  function paintToggle() {
    var dark = document.documentElement.getAttribute("data-theme") === "dark";
    if (toggle) toggle.textContent = dark ? "☀️" : "🌙";
  }
  paintToggle();
  if (toggle) toggle.addEventListener("click", function () {
    var next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try { localStorage.setItem("theme", next); } catch (e) {}
    paintToggle();
  });

  /* ---------- avatars: initials + colour from name ---------- */
  var colours = ["#4f46e5", "#0891b2", "#db2777", "#ea580c", "#16a34a", "#7c3aed", "#0d9488", "#b45309"];
  $$(".avatar[data-name]").forEach(function (el) {
    var name = el.getAttribute("data-name") || "?";
    var parts = name.trim().split(/\s+/);
    el.textContent = (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
    var h = 0;
    for (var i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
    el.style.background = colours[h % colours.length];
  });

  /* ---------- animated bars and counters ---------- */
  requestAnimationFrame(function () {
    $$("[data-width]").forEach(function (el) { el.style.width = Math.max(0, Math.min(100, +el.getAttribute("data-width"))) + "%"; });
    $$("[data-height]").forEach(function (el) { el.style.height = Math.max(0, Math.min(100, +el.getAttribute("data-height"))) + "%"; });
  });
  $$("[data-count]").forEach(function (el) {
    var target = parseFloat(el.getAttribute("data-count")) || 0;
    var dec = +(el.getAttribute("data-decimals") || 0);
    var suffix = el.getAttribute("data-suffix") || "";
    var start = null, dur = 700;
    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min(1, (ts - start) / dur);
      el.textContent = (target * p).toFixed(dec) + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  });

  /* ---------- donut chart (pass / at risk / fail) ---------- */
  var donut = $(".donut");
  if (donut) {
    var vals = donut.getAttribute("data-values").split(",").map(Number);
    var cols = ["var(--ok)", "var(--warn)", "var(--bad)"];
    var total = vals.reduce(function (a, b) { return a + b; }, 0);
    var NS = "http://www.w3.org/2000/svg";
    var radius = 15.9155, circ = 100, offset = 0;
    var base = document.createElementNS(NS, "circle");
    base.setAttribute("cx", 21); base.setAttribute("cy", 21); base.setAttribute("r", radius);
    base.style.stroke = "var(--border)"; donut.appendChild(base);
    if (total > 0) vals.forEach(function (v, i) {
      if (!v) return;
      var pct = v / total * circ;
      var c = document.createElementNS(NS, "circle");
      c.setAttribute("cx", 21); c.setAttribute("cy", 21); c.setAttribute("r", radius);
      c.style.stroke = cols[i];
      c.setAttribute("stroke-dasharray", "0 " + circ);
      c.setAttribute("stroke-dashoffset", -offset);
      donut.appendChild(c);
      (function (el, p) { requestAnimationFrame(function () { el.setAttribute("stroke-dasharray", p + " " + (circ - p)); }); })(c, pct);
      offset += pct;
    });
  }

  /* ---------- students table: live search, department filter, sort, row click ---------- */
  var table = $("#studentTable");
  if (table) {
    var rows = $$("tbody tr", table);
    var search = $("#liveSearch"), dept = $("#liveDept");
    var shown = $("#shownCount"), noMatch = $("#noMatch"), wrap = $(".table-wrap");
    function applyFilter() {
      var q = (search.value || "").trim().toLowerCase(), d = dept.value, n = 0;
      rows.forEach(function (r) {
        var ok = (!q || r.dataset.name.indexOf(q) > -1 || r.dataset.roll.indexOf(q) > -1) && (!d || r.dataset.dept === d);
        r.hidden = !ok; if (ok) n++;
      });
      shown.textContent = n; noMatch.hidden = n > 0; wrap.hidden = n === 0;
    }
    search.addEventListener("input", applyFilter);
    dept.addEventListener("change", applyFilter);
    $("#filterForm").addEventListener("submit", function (e) { e.preventDefault(); applyFilter(); });
    applyFilter();

    $$("th[data-sort]", table).forEach(function (th, idx) {
      th.addEventListener("click", function () {
        var asc = !th.classList.contains("sorted-asc"), num = th.dataset.sort === "num";
        $$("th", table).forEach(function (t) { t.classList.remove("sorted-asc", "sorted-desc"); });
        th.classList.add(asc ? "sorted-asc" : "sorted-desc");
        var body = $("tbody", table);
        rows.sort(function (a, b) {
          var ca = a.children[idx], cb = b.children[idx], x, y;
          if (num) { x = parseFloat(ca.dataset.value); y = parseFloat(cb.dataset.value); }
          else { x = ca.textContent.trim().toLowerCase(); y = cb.textContent.trim().toLowerCase(); }
          return (x < y ? -1 : x > y ? 1 : 0) * (asc ? 1 : -1);
        }).forEach(function (r) { body.appendChild(r); });
      });
    });
    table.addEventListener("click", function (e) {
      if (e.target.closest("a, button, form")) return;
      var tr = e.target.closest("tr[data-href]");
      if (tr) window.location = tr.dataset.href;
    });
  }

  /* ---------- score / attendance slider <-> number box ---------- */
  var range = $("#scoreRange"), number = $("#scoreNumber");
  if (range && number) {
    range.addEventListener("input", function () { number.value = range.value; });
    number.addEventListener("input", function () { if (number.value !== "") range.value = number.value; });
  }

  /* ---------- subject chips ---------- */
  var subjectInput = $("#subjectInput");
  $$(".chip[data-subject]").forEach(function (chip) {
    chip.addEventListener("click", function () {
      subjectInput.value = chip.dataset.subject;
      $$(".chip").forEach(function (c) { c.classList.toggle("on", c === chip); });
      (number || subjectInput).focus();
    });
  });

  /* ---------- confirm dialog for delete forms ---------- */
  var dlg = $("#confirmDialog"), pending = null;
  $$("form[data-confirm]").forEach(function (f) {
    f.addEventListener("submit", function (e) {
      if (f.dataset.confirmed) return;
      e.preventDefault();
      pending = f;
      $("#confirmTitle").textContent = f.dataset.confirmTitle || "Are you sure?";
      $("#confirmText").textContent = f.dataset.confirm || "";
      if (dlg.showModal) dlg.showModal();
      else if (window.confirm(f.dataset.confirm)) { f.dataset.confirmed = "1"; f.submit(); }
    });
  });
  if (dlg) {
    $("#confirmNo").addEventListener("click", function () { pending = null; dlg.close(); });
    $("#confirmYes").addEventListener("click", function () {
      dlg.close();
      if (pending) { pending.dataset.confirmed = "1"; pending.submit(); }
    });
  }

  /* ---------- toasts fade out ---------- */
  $$(".toast").forEach(function (t) {
    setTimeout(function () { t.classList.add("hide"); setTimeout(function () { t.remove(); }, 450); }, 3500);
  });
})();
