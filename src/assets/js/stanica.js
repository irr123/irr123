document.addEventListener("DOMContentLoaded", function () {
  const target = document.getElementById(
    "the-thing-that-weighs-less-than-a-base-image"
  );
  if (!target) return;

  const placeholder = document.createElement("div");
  placeholder.style.cssText =
    "width:100%;height:540px;display:flex;align-items:center;justify-content:center;" +
    "cursor:pointer;background:#111;color:#999;font-size:0.9rem;user-select:none;";
  placeholder.textContent = "▶ play in browser · 35 MB";

  placeholder.addEventListener("click", function () {
    const iframe = document.createElement("iframe");
    iframe.src =
      "https://pub-cab470135ad64bbf9490e4c1ce5fa431.r2.dev/stanica/index.html";
    iframe.style.cssText = "width:100%;border:none;height:540px;display:block;";
    placeholder.replaceWith(iframe);
  });

  target.parentNode.insertBefore(placeholder, target.nextSibling);
});
