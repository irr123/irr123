document.addEventListener("DOMContentLoaded", function () {
  const targetHeading = document.getElementById("playable-p5js-result");

  if (targetHeading) {
    const iframe = document.createElement("iframe");
    iframe.src = "/text/gemini25.html";
    iframe.style.width = "100%";
    iframe.style.border = "none";
    iframe.style.height = "480px";

    targetHeading.parentNode.insertBefore(iframe, targetHeading.nextSibling);
  }
});
