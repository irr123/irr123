document.addEventListener("DOMContentLoaded", function () {
  const targetHeading = document.getElementById("live-tool");

  if (targetHeading) {
    const iframe = document.createElement("iframe");
    iframe.src = "/text/json-analyzer.html";
    iframe.style.width = "100%";
    iframe.style.border = "none";

    targetHeading.parentNode.insertBefore(iframe, targetHeading.nextSibling);
    window.addEventListener("message", function (event) {
      if (event.data && event.data.height) {
        iframe.style.height = event.data.height + 1 + "px";
      }
    });
  }
});
