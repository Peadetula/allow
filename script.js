/* Allow — landing page interactions */
(function () {
  "use strict";

  /* ---- Scroll reveal ---- */
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---- Nav shadow on scroll ---- */
  var nav = document.getElementById("nav");
  var onScroll = function () {
    if (window.scrollY > 12) nav.classList.add("scrolled"); else nav.classList.remove("scrolled");
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---- Mobile menu close ---- */
  var navToggle = document.getElementById("nav-toggle");
  document.querySelectorAll(".nav-mobile a").forEach(function (a) {
    a.addEventListener("click", function () { navToggle.checked = false; });
  });

  /* ---- Form elements ---- */
  var form = document.getElementById("waitlist-form");
  var card = document.getElementById("waitlist-card");
  var roleEl = document.getElementById("role");
  var branchResident = document.getElementById("branch-resident");
  var branchBuilding = document.getElementById("branch-building");
  var titleEl = document.getElementById("success-title");
  var msgEl = document.getElementById("success-msg");
  var resetBtn = document.getElementById("success-reset");
  var shareBtn = document.getElementById("success-share");

  var answers = {}; // holds chip selections

  /* ---- Role branching ---- */
  roleEl.addEventListener("change", function () {
    var r = roleEl.value;
    branchResident.hidden = (r !== "resident");
    branchBuilding.hidden = !(r === "manager" || r === "developer" || r === "security");
    roleEl.classList.remove("invalid");
  });

  /* ---- Chip selection ---- */
  document.querySelectorAll(".chip-choice").forEach(function (group) {
    var key = group.getAttribute("data-name");
    group.querySelectorAll("button").forEach(function (btn) {
      btn.addEventListener("click", function () {
        group.querySelectorAll("button").forEach(function (b) { b.classList.remove("selected"); });
        btn.classList.add("selected");
        answers[key] = btn.getAttribute("data-value");
      });
    });
  });

  function firstName(full) {
    var n = (full || "").trim().split(/\s+/)[0];
    if (!n) return "there";
    return n.charAt(0).toUpperCase() + n.slice(1);
  }
  function markInvalid(el, bad) { if (bad) el.classList.add("invalid"); else el.classList.remove("invalid"); }

  /* ---- Personalized success copy ---- */
  function buildMessage(fn, role) {
    var lead = "You're on the list for the Nairobi pilot, " + fn + ". ";
    var body;
    if (role === "resident") {
      body = "Soon your deliveries will come straight to your door, verified at the gate, with no trip downstairs and nothing for you to do. ";
      if (answers.pay === "Yes") body += "Thanks for telling us you'd pay for that, it genuinely shapes what we build.";
      else if (answers.pay === "Depends on the order") body += "We hear you on it depending on the order, that's exactly the kind of detail we're designing around.";
      else body += "We'll work to make it worth it for you.";
    } else if (role === "manager" || role === "developer" || role === "security") {
      body = "You'll get an early look at the verified-entry log for your building, at no cost. ";
      if (answers.allow === "Yes") body += "Thank you for being open to a free tablet at your gate, we'll reach out as the pilot forms.";
      else if (answers.allow === "I'd want to know more") body += "We'll be in touch with everything you'd want to know before deciding.";
      else body += "We'd love the chance to show you how it protects the building.";
    } else if (role === "rider") {
      body = "Soon you'll move through gates in seconds and finish more deliveries every shift.";
    } else if (role === "platform") {
      body = "We'd love to talk about turning failed gate deliveries into completed ones for your riders.";
    } else {
      body = "We'll be in touch as the Nairobi pilot takes shape.";
    }
    return lead + body;
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var name = document.getElementById("name");
    var contact = document.getElementById("contact");
    var role = roleEl;

    var nameOk = name.value.trim().length > 1;
    var contactOk = isValidContact(contact.value);
    var roleOk = !!role.value;

    markInvalid(name, !nameOk);
    markInvalid(contact, !contactOk);
    markInvalid(role, !roleOk);

    if (!nameOk) return name.focus();
    if (!contactOk) { contact.focus(); return; }
    if (!roleOk) return role.focus();

    var fn = firstName(name.value);
    titleEl.textContent = "Thank you, " + fn + ".";
    msgEl.textContent = buildMessage(fn, role.value);

    card.classList.add("submitted");
    card.scrollIntoView({ behavior: "smooth", block: "center" });

    // Persist the captured record locally (stand-in until a backend is wired)
    try {
      var record = { name: name.value, contact: normalizedContact(contact.value), role: role.value, pay: answers.pay || "", freq: answers.freq || "", allow: answers.allow || "", at: new Date().toISOString() };
      var all = JSON.parse(localStorage.getItem("allow_signups") || "[]");
      all.push(record);
      localStorage.setItem("allow_signups", JSON.stringify(all));
    } catch (err) {}
  });

  ["name", "contact"].forEach(function (id) {
    var el = document.getElementById(id);
    el.addEventListener("input", function () { el.classList.remove("invalid"); });
  });

  /* ---- Email-or-phone detection: show +254 prefix when it looks like a phone ---- */
  var contactEl = document.getElementById("contact");
  var prefixEl = document.getElementById("contact-prefix");
  var hintEl = document.getElementById("contact-hint");
  function looksLikePhone(v) {
    var s = v.trim();
    if (s.indexOf("@") !== -1) return false;
    return /[0-9]/.test(s) && !/[a-zA-Z]/.test(s.replace(/\s/g, ""));
  }
  function isValidContact(v) {
    var s = v.trim();
    if (s.indexOf("@") !== -1) return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
    var digits = s.replace(/[^0-9]/g, "");
    return digits.length >= 9 && digits.length <= 12; // KE mobile w/ or w/o country code
  }
  function normalizedContact(v) {
    var s = v.trim();
    if (s.indexOf("@") !== -1) return s;
    var d = s.replace(/[^0-9]/g, "");
    if (d.charAt(0) === "0") d = d.slice(1);          // drop leading 0
    if (d.indexOf("254") === 0) d = d.slice(3);        // drop existing 254
    return "+254" + d;
  }
  contactEl.addEventListener("input", function () {
    var phone = looksLikePhone(contactEl.value);
    prefixEl.hidden = !phone;
    hintEl.textContent = phone
      ? "We'll message you on WhatsApp about the pilot."
      : "We'll reach you here about the pilot, by email or WhatsApp.";
  });

  /* ---- Share ---- */
  shareBtn.addEventListener("click", function () {
    var url = window.location.href.split("#")[0];
    var text = "You order in, then walk down to the gate anyway. Allow brings your delivery straight to your door. Join the Nairobi waitlist:";
    if (navigator.share) {
      navigator.share({ title: "Allow", text: text, url: url }).catch(function () {});
    } else {
      navigator.clipboard.writeText(text + " " + url).then(function () {
        shareBtn.textContent = "Link copied ✓";
        shareBtn.classList.add("copied");
        setTimeout(function () { shareBtn.textContent = "Share Allow with a neighbour"; shareBtn.classList.remove("copied"); }, 2200);
      }).catch(function () {});
    }
  });

  resetBtn.addEventListener("click", function () {
    form.reset(); answers = {};
    document.querySelectorAll(".chip-choice button").forEach(function (b) { b.classList.remove("selected"); });
    branchResident.hidden = true; branchBuilding.hidden = true;
    card.classList.remove("submitted");
    document.getElementById("name").focus();
  });
})();
