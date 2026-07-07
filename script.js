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
  var branches = {
    resident: document.getElementById("branch-resident"),
    manager:  document.getElementById("branch-manager"),
    security: document.getElementById("branch-security"),
    rider:    document.getElementById("branch-rider"),
    platform: document.getElementById("branch-platform")
  };
  var titleEl = document.getElementById("success-title");
  var msgEl = document.getElementById("success-msg");
  var resetBtn = document.getElementById("success-reset");
  var shareBtn = document.getElementById("success-share");

  var answers = {}; // holds chip selections

  /* ---- Role branching ---- */
  function resetAnswers() {
    answers = {};
    document.querySelectorAll(".chip-choice button").forEach(function (b) { b.classList.remove("selected"); });
  }
  roleEl.addEventListener("change", function () {
    var r = roleEl.value;
    resetAnswers();
    Object.keys(branches).forEach(function (key) { branches[key].hidden = (key !== r); });
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
      body = "Soon your deliveries will come straight to your door, verified at the gate, with nothing for you to do. ";
      if (answers.q1 === "Yes, that's fair") body += "Thanks for telling us the fee feels fair, that genuinely shapes what we build.";
      else if (answers.q1 === "Only if lower") body += "Good to know the price matters to you, that's exactly the kind of thing we're figuring out.";
      else body += "We'll work to make it clearly worth it for you.";
    } else if (role === "manager") {
      body = "You'll get an early look at the verified-entry log for your building, at no cost. ";
      if (answers.q1 === "Yes") body += "Thank you for being open to a free tablet at your gate, we'll be in touch as the pilot forms.";
      else if (answers.q1 === "Tell me more") body += "We'll share everything you'd want to know before you decide.";
      else body += "We'd welcome the chance to show you how it protects the building.";
    } else if (role === "security") {
      body = "We'd love to work with you to verify and log every delivery at the gates you guard. ";
      if (answers.q1 === "Yes") body += "Thanks for being open to partnering, we'll reach out soon.";
      else body += "We'll show you how a verified rider log makes the job cleaner.";
    } else if (role === "rider") {
      body = "Soon you'll move through gates in seconds and finish more deliveries every shift. ";
      body += "Thanks for helping us build something that actually works for riders.";
    } else if (role === "platform") {
      body = "We'd love to talk about turning failed gate deliveries into completed ones for your riders. ";
      if (answers.q1 === "Let's talk") body += "We'll be in touch to start that conversation.";
      else body += "We'll share how Allow lifts completion rates at residential gates.";
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
      var record = { name: name.value, contact: normalizedContact(contact.value), role: role.value, q1: answers.q1 || "", q2: answers.q2 || "", q3: answers.q3 || "", at: new Date().toISOString() };
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
    Object.keys(branches).forEach(function (key) { branches[key].hidden = true; });
    card.classList.remove("submitted");
    document.getElementById("name").focus();
  });
})();
