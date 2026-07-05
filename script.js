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
    if (window.scrollY > 12) nav.classList.add("scrolled");
    else nav.classList.remove("scrolled");
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---- Close mobile menu after a link tap ---- */
  var navToggle = document.getElementById("nav-toggle");
  document.querySelectorAll(".nav-mobile a").forEach(function (a) {
    a.addEventListener("click", function () { navToggle.checked = false; });
  });

  /* ---- Waitlist form ---- */
  var form = document.getElementById("waitlist-form");
  var card = document.getElementById("waitlist-card");
  var titleEl = document.getElementById("success-title");
  var msgEl = document.getElementById("success-msg");
  var resetBtn = document.getElementById("success-reset");

  var roleLine = {
    "Resident": "As a resident, you will be among the first to let a verified delivery through your gate with a tap.",
    "Building or property manager": "As a building manager, you will get an early look at the verified access log for your property.",
    "Property developer": "As a developer, you will be first in line to bring verified delivery access to your buildings.",
    "Security company": "For your security team, this means accurate information at the gate instead of guesswork.",
    "Delivery rider": "As a rider, you will move through gates in seconds and complete more deliveries per shift.",
    "Delivery platform": "As a platform, this means higher completion rates and fewer refunds at residential gates."
  };

  function firstName(full) {
    var n = (full || "").trim().split(/\s+/)[0];
    if (!n) return "there";
    return n.charAt(0).toUpperCase() + n.slice(1);
  }

  function markInvalid(el, bad) {
    if (bad) el.classList.add("invalid"); else el.classList.remove("invalid");
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var name = document.getElementById("name");
    var email = document.getElementById("email");
    var role = document.getElementById("role");

    var emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim());
    var nameOk = name.value.trim().length > 1;
    var roleOk = !!role.value;

    markInvalid(name, !nameOk);
    markInvalid(email, !emailOk);
    markInvalid(role, !roleOk);

    if (!nameOk) { name.focus(); return; }
    if (!emailOk) { email.focus(); return; }
    if (!roleOk) { role.focus(); return; }

    // Personalized thank-you
    var fn = firstName(name.value);
    titleEl.textContent = "Thank you, " + fn + ".";
    var extra = roleLine[role.value] || "You will be among the first to experience Allow.";
    msgEl.textContent = "You are on the list for the Nairobi pilot. " + extra + " Keep an eye on your inbox.";

    card.classList.add("submitted");
    card.scrollIntoView({ behavior: "smooth", block: "center" });

    // Persist locally so a returning visitor isn't asked twice in this session
    try { sessionStorage.setItem("allow_waitlist", name.value + "|" + email.value); } catch (err) {}
  });

  // Clear invalid state as the user corrects fields
  ["name", "email", "role"].forEach(function (id) {
    var el = document.getElementById(id);
    var evt = el.tagName === "SELECT" ? "change" : "input";
    el.addEventListener(evt, function () { el.classList.remove("invalid"); });
  });

  resetBtn.addEventListener("click", function () {
    form.reset();
    card.classList.remove("submitted");
    document.getElementById("name").focus();
  });
})();
