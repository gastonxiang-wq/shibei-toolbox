(function () {
  "use strict";

  var panels = document.querySelectorAll(".tool-panel");
  var tabs = document.querySelectorAll(".tool-tab");
  var activeTool = "json";

  function setStatus(el, text, type) {
    el.textContent = text;
    el.classList.remove("ok", "error");
    if (type) el.classList.add(type);
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).then(function () { return true; });
    }
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    var ok = false;
    try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
    document.body.removeChild(ta);
    return Promise.resolve(ok);
  }

  function flashCopy(el) {
    var old = el.textContent;
    el.textContent = "已复制";
    setTimeout(function () { el.textContent = old; }, 900);
  }

  function showTool(name) {
    activeTool = name;
    panels.forEach(function (p) {
      p.hidden = p.dataset.panel !== name;
      p.classList.toggle("active", p.dataset.panel === name);
    });
    tabs.forEach(function (t) {
      t.classList.toggle("active", t.dataset.tool === name);
    });
  }

  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      showTool(tab.dataset.tool);
      history.replaceState(null, "", "#" + tab.dataset.tool);
    });
  });

  function initFromHash() {
    var tool = location.hash.slice(1);
    if (tool && document.querySelector('[data-tool="' + tool + '"]')) showTool(tool);
  }

  window.addEventListener("hashchange", function () {
    var tool = location.hash.slice(1);
    if (tool && document.querySelector('[data-tool="' + tool + '"]')) showTool(tool);
  });

  /* ---------- JSON ---------- */
  var jsonInput = document.getElementById("jsonInput");
  var jsonOutput = document.getElementById("jsonOutput");
  var jsonStatus = document.getElementById("jsonStatus");

  function parseJson() {
    try {
      return { ok: true, value: JSON.parse(jsonInput.value) };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  }

  document.getElementById("jsonFormat").addEventListener("click", function () {
    var r = parseJson();
    if (!r.ok) { setStatus(jsonStatus, "JSON 无效：" + r.error, "error"); return; }
    jsonOutput.value = JSON.stringify(r.value, null, 2);
    setStatus(jsonStatus, "格式化完成", "ok");
  });

  document.getElementById("jsonMinify").addEventListener("click", function () {
    var r = parseJson();
    if (!r.ok) { setStatus(jsonStatus, "JSON 无效：" + r.error, "error"); return; }
    jsonOutput.value = JSON.stringify(r.value);
    setStatus(jsonStatus, "压缩完成", "ok");
  });

  document.getElementById("jsonValidate").addEventListener("click", function () {
    var r = parseJson();
    setStatus(jsonStatus, r.ok ? "JSON 有效" : "JSON 无效：" + r.error, r.ok ? "ok" : "error");
  });

  document.getElementById("jsonCopy").addEventListener("click", function () {
    if (!jsonOutput.value) { setStatus(jsonStatus, "没有可复制的内容", "error"); return; }
    copyText(jsonOutput.value).then(function () { setStatus(jsonStatus, "已复制到剪贴板", "ok"); });
  });

  document.getElementById("jsonClear").addEventListener("click", function () {
    jsonInput.value = "";
    jsonOutput.value = "";
    setStatus(jsonStatus, "", "");
  });

  /* ---------- 时间戳 ---------- */
  var tsInput = document.getElementById("tsInput");
  var tsDate = document.getElementById("tsDate");
  var tsMode = document.getElementById("tsMode");
  var tsTz = document.getElementById("tsTz");
  var tsStatus = document.getElementById("tsStatus");

  function formatWithTz(d, tz) {
    try {
      return new Intl.DateTimeFormat("zh-CN", {
        timeZone: tz === "local" ? undefined : tz,
        year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit", second: "2-digit",
        hour12: false
      }).format(d);
    } catch (e) {
      return d.toLocaleString();
    }
  }

  function normalizeTs(value, mode) {
    if (!value) return null;
    var n = Number(value);
    if (!isFinite(n)) return null;
    if (mode === "s" || (mode === "auto" && Math.abs(n) < 1e12)) return n * 1000;
    return n;
  }

  function renderTs(d, source) {
    var tz = tsTz.value;
    document.getElementById("tsIso").textContent = d.toISOString();
    document.getElementById("tsLocal").textContent = formatWithTz(d, tz) + (source ? "（" + source + "）" : "");
    document.getElementById("tsSeconds").textContent = String(Math.floor(d.getTime() / 1000));
    document.getElementById("tsMillis").textContent = String(d.getTime());
  }

  document.getElementById("tsNow").addEventListener("click", function () {
    var d = new Date();
    tsDate.value = toLocalInputValue(d);
    renderTs(d, "当前时间");
    setStatus(tsStatus, "", "");
  });

  document.getElementById("tsToDate").addEventListener("click", function () {
    var ms = normalizeTs(tsInput.value, tsMode.value);
    if (ms === null) { setStatus(tsStatus, "请输入有效时间戳", "error"); return; }
    var d = new Date(ms);
    tsDate.value = toLocalInputValue(d);
    renderTs(d);
    setStatus(tsStatus, "转换完成", "ok");
  });

  document.getElementById("tsToStamp").addEventListener("click", function () {
    var v = tsDate.value;
    if (!v) { setStatus(tsStatus, "请选择日期时间", "error"); return; }
    var d = new Date(v);
    if (isNaN(d.getTime())) { setStatus(tsStatus, "日期无效", "error"); return; }
    document.getElementById("tsSeconds").textContent = String(Math.floor(d.getTime() / 1000));
    document.getElementById("tsMillis").textContent = String(d.getTime());
    document.getElementById("tsIso").textContent = d.toISOString();
    document.getElementById("tsLocal").textContent = formatWithTz(d, tsTz.value);
    setStatus(tsStatus, "转换完成", "ok");
  });

  function toLocalInputValue(d) {
    var p = function (n) { return String(n).padStart(2, "0"); };
    return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()) + "T" + p(d.getHours()) + ":" + p(d.getMinutes()) + ":" + p(d.getSeconds());
  }

  document.getElementById("tsCopy").addEventListener("click", function () {
    var v = document.getElementById("tsSeconds").textContent;
    if (v === "-") { setStatus(tsStatus, "没有可复制的内容", "error"); return; }
    copyText(v).then(function () { setStatus(tsStatus, "已复制秒级时间戳", "ok"); });
  });

  /* ---------- 字数统计 ---------- */
  var ctInput = document.getElementById("ctInput");
  var ctStats = document.getElementById("ctStats");

  function countText() {
    var t = ctInput.value;
    var chars = t.length;
    var noSpace = t.replace(/\s/g, "").length;
    var han = (t.match(/[\u4e00-\u9fff]/g) || []).length;
    var words = (t.trim().length ? t.trim().split(/\s+/).length : 0);
    var lines = t.length ? t.split(/\r\n|\r|\n/).length : 0;
    var paras = t.trim() ? t.trim().split(/\n\s*\n/).filter(function (s) { return s.trim(); }).length : 0;
    ctStats.querySelector('[data-stat="chars"]').textContent = String(chars);
    ctStats.querySelector('[data-stat="charsNoSpace"]').textContent = String(noSpace);
    ctStats.querySelector('[data-stat="han"]').textContent = String(han);
    ctStats.querySelector('[data-stat="words"]').textContent = String(words);
    ctStats.querySelector('[data-stat="lines"]').textContent = String(lines);
    ctStats.querySelector('[data-stat="paras"]').textContent = String(paras);
  }

  ctInput.addEventListener("input", countText);
  document.getElementById("ctClear").addEventListener("click", function () {
    ctInput.value = "";
    countText();
  });

  /* ---------- Base64 ---------- */
  var b64Input = document.getElementById("b64Input");
  var b64Output = document.getElementById("b64Output");
  var b64Status = document.getElementById("b64Status");

  function utf8ToBase64(str) {
    var bytes = new TextEncoder().encode(str);
    var bin = "";
    for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  }

  function base64ToUtf8(b64) {
    var bin = atob(b64.trim());
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  }

  document.getElementById("b64Encode").addEventListener("click", function () {
    if (!b64Input.value) { setStatus(b64Status, "请输入内容", "error"); return; }
    try {
      b64Output.value = utf8ToBase64(b64Input.value);
      setStatus(b64Status, "编码完成", "ok");
    } catch (e) {
      setStatus(b64Status, "编码失败", "error");
    }
  });

  document.getElementById("b64Decode").addEventListener("click", function () {
    if (!b64Input.value) { setStatus(b64Status, "请输入内容", "error"); return; }
    try {
      b64Output.value = base64ToUtf8(b64Input.value);
      setStatus(b64Status, "解码完成", "ok");
    } catch (e) {
      setStatus(b64Status, "解码失败：不是有效的 UTF-8 Base64", "error");
    }
  });

  document.getElementById("b64Copy").addEventListener("click", function () {
    if (!b64Output.value) { setStatus(b64Status, "没有可复制的内容", "error"); return; }
    copyText(b64Output.value).then(function () { setStatus(b64Status, "已复制", "ok"); });
  });

  document.getElementById("b64Clear").addEventListener("click", function () {
    b64Input.value = "";
    b64Output.value = "";
    setStatus(b64Status, "", "");
  });

  /* ---------- 正则 ---------- */
  var rxPattern = document.getElementById("rxPattern");
  var rxText = document.getElementById("rxText");
  var rxSummary = document.getElementById("rxSummary");
  var rxMatches = document.getElementById("rxMatches");

  document.getElementById("rxTest").addEventListener("click", function () {
    var pattern = rxPattern.value;
    var text = rxText.value;
    if (!pattern) { rxSummary.textContent = "请输入正则表达式"; rxMatches.textContent = ""; return; }
    var flags = "";
    ["rxG", "rxI", "rxM", "rxS", "rxU"].forEach(function (id) {
      if (document.getElementById(id).checked) flags += id.replace("rx", "").toLowerCase();
    });
    var re;
    try {
      re = new RegExp(pattern, flags);
    } catch (e) {
      rxSummary.textContent = "正则无效：" + e.message;
      rxMatches.textContent = "";
      return;
    }
    var all = flags.indexOf("g") !== -1;
    var matches = [];
    var m;
    var guard = 0;
    while ((m = re.exec(text)) !== null && guard++ < 2000) {
      var item = { text: m[0], index: m.index };
      if (m.length > 1) {
        item.groups = [];
        for (var i = 1; i < m.length; i++) item.groups.push(m[i]);
      }
      matches.push(item);
      if (!all) break;
      if (m[0] === "") re.lastIndex++;
    }
    if (flags.indexOf("g") !== -1) re.lastIndex = 0;
    if (matches.length === 0) {
      rxSummary.textContent = "未找到匹配";
      rxMatches.textContent = "";
      return;
    }
    rxSummary.textContent = "共 " + matches.length + " 处匹配";
    var lines = matches.map(function (mt, idx) {
      var head = "[" + idx + "] 位置 " + mt.index + "：" + mt.text;
      if (mt.groups && mt.groups.length) head += "\n    分组: " + mt.groups.join(" | ");
      return head;
    });
    rxMatches.textContent = lines.join("\n");
    rxMatches.innerHTML = rxMatches.textContent.split("\n").map(function (line) {
      return "<div>" + escapeHtml(line) + "</div>";
    }).join("");
  });

  function escapeHtml(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  document.getElementById("rxClear").addEventListener("click", function () {
    rxPattern.value = "";
    rxText.value = "";
    rxSummary.textContent = "尚未测试";
    rxMatches.textContent = "";
  });

  /* ---------- 颜色 ---------- */
  var clPicker = document.getElementById("clPicker");
  var clInput = document.getElementById("clInput");
  var clSwatch = document.getElementById("clSwatch");
  var clStatus = document.getElementById("clStatus");

  function hexToRgb(hex) {
    var h = hex.replace("#", "");
    if (h.length === 3) h = h.split("").map(function (c) { return c + c; }).join("");
    if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16)
    };
  }

  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, l = (max + min) / 2;
    if (max === min) {
      h = s = 0;
    } else {
      var d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        default: h = (r - g) / d + 4;
      }
      h /= 6;
    }
    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
  }

  function rgbToHex(r, g, b) {
    var p = function (n) { return n.toString(16).padStart(2, "0"); };
    return "#" + p(r) + p(g) + p(b);
  }

  function parseColor(input) {
    var s = input.trim().toLowerCase();
    if (s.charAt(0) === "#") {
      var rgb = hexToRgb(s);
      if (!rgb) return null;
      return rgb;
    }
    var m = s.match(/^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*([\d.]+))?\s*\)$/);
    if (m) {
      var r = Number(m[1]), g = Number(m[2]), b = Number(m[3]);
      if (r > 255 || g > 255 || b > 255) return null;
      return { r: r, g: g, b: b };
    }
    return null;
  }

  function renderColor(rgb, source) {
    clSwatch.style.background = rgbToHex(rgb.r, rgb.g, rgb.b);
    document.getElementById("clHex").textContent = rgbToHex(rgb.r, rgb.g, rgb.b).toUpperCase();
    document.getElementById("clRgb").textContent = "rgb(" + rgb.r + ", " + rgb.g + ", " + rgb.b + ")";
    var hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    document.getElementById("clHsl").textContent = "hsl(" + hsl.h + ", " + hsl.s + "%, " + hsl.l + "%)";
    setStatus(clStatus, source ? "转换完成（" + source + "）" : "", source ? "ok" : "");
  }

  document.getElementById("clParse").addEventListener("click", function () {
    var rgb = parseColor(clInput.value);
    if (!rgb) { setStatus(clStatus, "无法识别该颜色格式", "error"); return; }
    clPicker.value = rgbToHex(rgb.r, rgb.g, rgb.b);
    renderColor(rgb, "输入");
  });

  clPicker.addEventListener("input", function () {
    var rgb = hexToRgb(clPicker.value);
    if (!rgb) return;
    clInput.value = clPicker.value;
    renderColor(rgb, "取色器");
  });

  document.getElementById("clRandom").addEventListener("click", function () {
    var r = Math.floor(Math.random() * 256);
    var g = Math.floor(Math.random() * 256);
    var b = Math.floor(Math.random() * 256);
    var hex = rgbToHex(r, g, b);
    clInput.value = hex;
    clPicker.value = hex;
    renderColor({ r: r, g: g, b: b }, "随机");
  });

  document.querySelectorAll(".copy-mini").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var el = document.getElementById(btn.dataset.copy);
      copyText(el.textContent).then(function () { flashCopy(btn); });
    });
  });

  /* ---------- 文本对比 ---------- */
  var dfA = document.getElementById("dfA");
  var dfB = document.getElementById("dfB");
  var dfSummary = document.getElementById("dfSummary");
  var dfOutput = document.getElementById("dfOutput");

  function splitLines(text) {
    if (text === "") return [];
    return text.split(/\r\n|\r|\n/);
  }

  function diffLines(aText, bText) {
    var a = splitLines(aText);
    var b = splitLines(bText);
    var n = a.length;
    var m = b.length;
    if (n > 2000 || m > 2000) {
      return { error: "文本行数超过 2000 行上限，请分段对比" };
    }
    var dp = [];
    for (var i = 0; i <= n; i++) dp.push(new Array(m + 1).fill(0));
    for (i = n - 1; i >= 0; i--) {
      for (var j = m - 1; j >= 0; j--) {
        dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
    var ops = [];
    i = 0;
    j = 0;
    while (i < n && j < m) {
      if (a[i] === b[j]) {
        ops.push({ type: "same", text: a[i] });
        i++; j++;
      } else if (dp[i + 1][j] >= dp[i][j + 1]) {
        ops.push({ type: "del", text: a[i] });
        i++;
      } else {
        ops.push({ type: "add", text: b[j] });
        j++;
      }
    }
    while (i < n) { ops.push({ type: "del", text: a[i] }); i++; }
    while (j < m) { ops.push({ type: "add", text: b[j] }); j++; }
    return { ops: ops };
  }

  function renderDiff() {
    var r = diffLines(dfA.value, dfB.value);
    if (r.error) {
      dfSummary.textContent = r.error;
      dfOutput.textContent = "";
      return;
    }
    var counts = { same: 0, add: 0, del: 0 };
    dfOutput.textContent = "";
    r.ops.forEach(function (op) {
      counts[op.type]++;
      var div = document.createElement("div");
      div.className = "diff-line diff-" + op.type;
      div.textContent = op.text;
      dfOutput.appendChild(div);
    });
    dfSummary.textContent = "未变 " + counts.same + " 行，新增 " + counts.add + " 行，删除 " + counts.del + " 行";
  }

  document.getElementById("dfRun").addEventListener("click", renderDiff);
  document.getElementById("dfCopy").addEventListener("click", function () {
    if (!dfOutput.textContent) { dfSummary.textContent = "没有可复制的内容"; return; }
    var lines = Array.prototype.map.call(dfOutput.children, function (el) {
      var prefix = el.classList.contains("diff-add") ? "+ " : (el.classList.contains("diff-del") ? "- " : "  ");
      return prefix + el.textContent;
    }).join("\n");
    copyText(lines).then(function () { dfSummary.textContent = "已复制对比结果"; });
  });
  document.getElementById("dfClear").addEventListener("click", function () {
    dfA.value = "";
    dfB.value = "";
    dfSummary.textContent = "尚未对比";
    dfOutput.textContent = "";
  });

  /* ---------- 进制转换 ---------- */
  var bnInput = document.getElementById("bnInput");
  var bnFrom = document.getElementById("bnFrom");
  var bnStatus = document.getElementById("bnStatus");

  function parseBigIntValue(s, base) {
    s = s.trim().toLowerCase();
    if (!s) return null;
    if (base === 16 && /^[0-9a-f]+$/.test(s)) return BigInt("0x" + s);
    if (base === 10 && /^\d+$/.test(s)) return BigInt(s);
    if (base === 8 && /^[0-7]+$/.test(s)) return BigInt("0o" + s);
    if (base === 2 && /^[01]+$/.test(s)) return BigInt("0b" + s);
    return null;
  }

  function renderBase() {
    var v = parseBigIntValue(bnInput.value, Number(bnFrom.value));
    if (v === null) {
      setStatus(bnStatus, "数值与所选进制不匹配", "error");
      document.getElementById("bnDec").textContent = "-";
      document.getElementById("bnHex").textContent = "-";
      document.getElementById("bnOct").textContent = "-";
      document.getElementById("bnBin").textContent = "-";
      return;
    }
    document.getElementById("bnDec").textContent = v.toString();
    document.getElementById("bnHex").textContent = v.toString(16).toUpperCase();
    document.getElementById("bnOct").textContent = v.toString(8);
    document.getElementById("bnBin").textContent = v.toString(2);
    setStatus(bnStatus, "转换完成", "ok");
  }

  document.getElementById("bnRun").addEventListener("click", renderBase);
  bnInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") renderBase();
  });
  document.getElementById("bnCopy").addEventListener("click", function () {
    var dec = document.getElementById("bnDec").textContent;
    if (dec === "-") { setStatus(bnStatus, "请先转换", "error"); return; }
    var text = "十进制: " + dec +
      "\n十六进制: " + document.getElementById("bnHex").textContent +
      "\n八进制: " + document.getElementById("bnOct").textContent +
      "\n二进制: " + document.getElementById("bnBin").textContent;
    copyText(text).then(function () { setStatus(bnStatus, "已复制全部结果", "ok"); });
  });
  document.getElementById("bnClear").addEventListener("click", function () {
    bnInput.value = "";
    document.getElementById("bnDec").textContent = "-";
    document.getElementById("bnHex").textContent = "-";
    document.getElementById("bnOct").textContent = "-";
    document.getElementById("bnBin").textContent = "-";
    setStatus(bnStatus, "", "");
  });

  /* ---------- URL 编解码 ---------- */
  var urInput = document.getElementById("urInput");
  var urOutput = document.getElementById("urOutput");
  var urStatus = document.getElementById("urStatus");

  document.getElementById("urEncode").addEventListener("click", function () {
    if (!urInput.value) { setStatus(urStatus, "请输入内容", "error"); return; }
    try {
      urOutput.value = encodeURIComponent(urInput.value);
      setStatus(urStatus, "编码完成", "ok");
    } catch (e) {
      setStatus(urStatus, "编码失败", "error");
    }
  });

  document.getElementById("urDecode").addEventListener("click", function () {
    if (!urInput.value) { setStatus(urStatus, "请输入内容", "error"); return; }
    try {
      urOutput.value = decodeURIComponent(urInput.value);
      setStatus(urStatus, "解码完成", "ok");
    } catch (e) {
      setStatus(urStatus, "解码失败：不是有效的 URL 编码", "error");
    }
  });

  document.getElementById("urCopy").addEventListener("click", function () {
    if (!urOutput.value) { setStatus(urStatus, "没有可复制的内容", "error"); return; }
    copyText(urOutput.value).then(function () { setStatus(urStatus, "已复制", "ok"); });
  });

  document.getElementById("urClear").addEventListener("click", function () {
    urInput.value = "";
    urOutput.value = "";
    setStatus(urStatus, "", "");
  });

  /* ---------- 主题 ---------- */
  var themeToggle = document.getElementById("themeToggle");
  themeToggle.addEventListener("click", function () {
    var html = document.documentElement;
    var next = html.dataset.theme === "dark" ? "light" : "dark";
    html.dataset.theme = next;
    try { localStorage.setItem("shibei-theme", next); } catch (e) {}
  });
  try {
    var saved = localStorage.getItem("shibei-theme");
    if (saved === "dark") document.documentElement.dataset.theme = "dark";
  } catch (e) {}

  /* ---------- 打赏弹窗 ---------- */
  var donateBtn = document.getElementById("donateBtn");
  var donateModal = document.getElementById("donateModal");
  var donateClose = document.getElementById("donateClose");
  function openDonate() { donateModal.hidden = false; }
  function closeDonate() { donateModal.hidden = true; }
  donateBtn.addEventListener("click", openDonate);
  donateClose.addEventListener("click", closeDonate);
  donateModal.addEventListener("click", function (e) {
    if (e.target === donateModal) closeDonate();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !donateModal.hidden) closeDonate();
  });

  countText();
  initFromHash();
})();
