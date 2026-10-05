const seedNotes = [];

const state = { notes: loadNotes(), filter: "全部", query: "" };
const notesGrid = document.querySelector("#notesGrid");
const emptyState = document.querySelector("#emptyState");
const composer = document.querySelector("#composer");
const noteForm = document.querySelector("#noteForm");
const imageInput = document.querySelector("#noteImage");
const imagePreview = document.querySelector("#imagePreview");
const toast = document.querySelector("#toast");

function loadNotes() {
  try {
    const saved = localStorage.getItem("linggan-notes-v1");
    return saved ? JSON.parse(saved) : seedNotes;
  } catch { return seedNotes; }
}
function saveNotes() { localStorage.setItem("linggan-notes-v1", JSON.stringify(state.notes)); }
function escapeHtml(value = "") { return value.replace(/[&<>'"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[c])); }
function render() {
  const query = state.query.trim().toLowerCase();
  const filtered = state.notes.filter(note => {
    const inFilter = state.filter === "全部" || (state.filter === "收藏" ? note.favorite : note.room === state.filter);
    const haystack = `${note.title} ${note.body} ${note.room} ${note.tag || ""}`.toLowerCase();
    return inFilter && (!query || haystack.includes(query));
  });
  notesGrid.innerHTML = filtered.map(noteCard).join("");
  emptyState.hidden = filtered.length > 0;
  document.querySelector("#resultsLabel").textContent = `${String(filtered.length).padStart(2, "0")} 条记录`;
  document.querySelector("#totalCount").textContent = String(state.notes.filter(n => n.favorite).length).padStart(2, "0");
  document.querySelector("#allCount").textContent = String(state.notes.length).padStart(2, "0");
  document.querySelectorAll(".filter-chip").forEach(button => {
    const active = button.dataset.filter === state.filter;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", String(active));
  });
}
function noteCard(note) {
  const image = note.image ? `<img class="note-image" src="${note.image}" alt="${escapeHtml(note.title)}" />` : "";
  return `<article class="note-card ${note.image ? "" : "no-image"}">
    ${image}
    <div class="note-body">
      <div>
        <div class="note-meta"><span class="room-tag">${escapeHtml(note.room)} / NOTE</span><span class="note-date">${escapeHtml(note.date || "刚刚")}</span></div>
        <h3>${escapeHtml(note.title || "未命名灵感")}</h3>
        <p>${escapeHtml(note.body)}</p>
      </div>
      <div class="note-footer"><span class="note-tag"># ${escapeHtml(note.tag || "待整理")}</span><div><button class="note-delete" data-delete="${note.id}" aria-label="删除这条灵感">删除</button><button class="favorite-button ${note.favorite ? "active" : ""}" data-favorite="${note.id}" aria-label="${note.favorite ? "取消收藏" : "收藏"}">${note.favorite ? "♥" : "♡"}</button></div></div>
    </div>
  </article>`;
}
function openComposer() { composer.hidden = false; document.body.style.overflow = "hidden"; setTimeout(() => document.querySelector("#noteBody").focus(), 50); }
function closeComposer() { composer.hidden = true; document.body.style.overflow = ""; noteForm.reset(); imagePreview.hidden = true; imagePreview.removeAttribute("src"); }
function showToast(message) { toast.textContent = message; toast.classList.add("show"); clearTimeout(showToast.timer); showToast.timer = setTimeout(() => toast.classList.remove("show"), 2300); }

document.querySelector("#openComposer").addEventListener("click", openComposer);
document.querySelector("#emptyAddBtn").addEventListener("click", openComposer);
document.querySelector("#closeComposer").addEventListener("click", closeComposer);
document.querySelector("#cancelComposer").addEventListener("click", closeComposer);
composer.addEventListener("click", event => { if (event.target === composer) closeComposer(); });
document.addEventListener("keydown", event => { if (event.key === "Escape" && !composer.hidden) closeComposer(); });
document.querySelector("#searchInput").addEventListener("input", event => { state.query = event.target.value; render(); });
document.querySelector("#filterRow").addEventListener("click", event => { const chip = event.target.closest(".filter-chip"); if (!chip) return; state.filter = chip.dataset.filter; render(); });
notesGrid.addEventListener("click", event => {
  const fav = event.target.closest("[data-favorite]");
  const del = event.target.closest("[data-delete]");
  if (fav) { const note = state.notes.find(n => n.id === fav.dataset.favorite); note.favorite = !note.favorite; saveNotes(); render(); showToast(note.favorite ? "已加入收藏" : "已取消收藏"); }
  if (del) { state.notes = state.notes.filter(n => n.id !== del.dataset.delete); saveNotes(); render(); showToast("已删除这条灵感"); }
});
imageInput.addEventListener("change", () => { const file = imageInput.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = event => { imagePreview.src = event.target.result; imagePreview.hidden = false; }; reader.readAsDataURL(file); });
noteForm.addEventListener("submit", event => {
  event.preventDefault();
  const form = new FormData(noteForm); const file = imageInput.files[0];
  const addNote = image => { state.notes.unshift({ id: `note-${Date.now()}`, title: form.get("title") || "未命名灵感", room: form.get("room"), body: form.get("body"), tag: form.get("tag") || "待整理", date: "刚刚", image, favorite: false }); saveNotes(); closeComposer(); render(); showToast("已保存在此浏览器"); };
  if (file) { const reader = new FileReader(); reader.onload = event => addNote(event.target.result); reader.readAsDataURL(file); } else addNote(null);
});
document.querySelector("#exportBtn").addEventListener("click", () => {
  const payload = JSON.stringify(state.notes.map(({ image, ...note }) => note), null, 2);
  const blob = new Blob([payload], { type: "application/json" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "我的装修灵感.json"; a.click(); URL.revokeObjectURL(url); showToast("已导出文字笔记");
});
render();
if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
