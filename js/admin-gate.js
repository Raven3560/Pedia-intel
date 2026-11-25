/* Case admin sign-in.
   The admin panel (its page markup and its code) is not in this site as readable files. It is stored inside admin.html
   as an encrypted block, <script id="admin-vault">: AES-256-GCM, with the key made from the admin email and password
   together by PBKDF2-SHA256 (600,000 rounds, random salt). This script asks for both, decrypts the panel and starts it.
   Without the right email and password the panel cannot be read, not even from the page source. The email is not
   stored anywhere; it is only part of the key (trimmed and lower-cased, so capitals do not matter).
   The block is written by build-admin.mjs in the admin-source folder, which sits next to this site folder and is not
   uploaded. After a correct password the key is kept in sessionStorage, so reloading this tab does not ask again;
   closing the tab or "Sign out" forgets it. A new password (a new build) signs everyone out. */
(function () {
  "use strict";
  var SKEY = "nts-admin-session";
  var $ = function (id) { return document.getElementById(id); };
  var gate = $("gate"), form = $("gateForm"), id = $("gateId"), pw = $("gatePw"), btn = $("gateGo"), err = $("gateErr"), out = $("signOut");
  var V = null;
  try { V = JSON.parse($("admin-vault").textContent); } catch (e) { }

  function show(msg) { err.textContent = msg; err.hidden = false; }
  function block(msg) { gate.hidden = false; form.querySelector("fieldset").disabled = true; show(msg); }
  if (!V || !V.ct || V.v !== 2) return block("The admin sign-in has not been set up yet. Run build-admin.mjs in the admin-source folder to set it.");
  if (!window.crypto || !crypto.subtle) return block("Sign-in needs a secure connection. Open this page with https:// (or on localhost).");

  function bytes(b64) { var s = atob(b64), u = new Uint8Array(s.length); for (var i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u; }
  function text64(u) { var s = ""; for (var i = 0; i < u.length; i++) s += String.fromCharCode(u[i]); return btoa(s); }

  /* must match build-admin.mjs: lower-cased trimmed email, a NUL, then the password exactly as typed */
  function derive(email, pass) {
    var secret = email.trim().toLowerCase().normalize("NFC") + "\u0000" + pass.normalize("NFC");
    return crypto.subtle.importKey("raw", new TextEncoder().encode(secret), "PBKDF2", false, ["deriveBits"])
      .then(function (base) { return crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: bytes(V.salt), iterations: V.iter }, base, 256); })
      .then(function (bits) { return new Uint8Array(bits); });
  }
  /* rejects when the key is wrong: AES-GCM checks the tag */
  function unlock(raw) {
    return crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["decrypt"])
      .then(function (k) { return crypto.subtle.decrypt({ name: "AES-GCM", iv: bytes(V.iv) }, k, bytes(V.ct)); })
      .then(function (pt) { return JSON.parse(new TextDecoder().decode(pt)); });
  }
  function start(P, raw) {
    try { sessionStorage.setItem(SKEY, JSON.stringify({ salt: V.salt, k: text64(raw) })); } catch (e) { }
    gate.insertAdjacentHTML("afterend", P.html);
    gate.remove();
    out.hidden = false;
    var s = document.createElement("script");
    s.textContent = P.js + "\n//# sourceURL=admin-panel.js";
    document.body.appendChild(s);
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!id.value.trim() || !pw.value) return;
    err.hidden = true; btn.disabled = true; btn.textContent = "Checking…";
    var raw;
    derive(id.value, pw.value)
      .then(function (r) { raw = r; return unlock(r); })
      .then(function (P) { start(P, raw); })
      .catch(function () {
        btn.disabled = false; btn.textContent = "Sign in"; pw.value = ""; pw.focus();
        show("That email or password is not right. Try again.");
      });
  });

  out.addEventListener("click", function () {
    try { sessionStorage.removeItem(SKEY); } catch (e) { }
    location.reload();
  });

  /* still signed in on this tab? */
  var saved = null;
  try { saved = JSON.parse(sessionStorage.getItem(SKEY) || "null"); } catch (e) { }
  if (saved && saved.salt === V.salt && saved.k) {
    var raw = bytes(saved.k);
    unlock(raw).then(function (P) { start(P, raw); }, function () {
      try { sessionStorage.removeItem(SKEY); } catch (e) { }
      gate.hidden = false; id.focus();
    });
  } else {
    gate.hidden = false; id.focus();
  }
})();
