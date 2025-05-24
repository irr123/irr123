document.addEventListener("DOMContentLoaded", function () {
  const targetHeading = document.getElementById("qr-code-generator");

  if (targetHeading) {
    const iframe = document.createElement("iframe");
    iframe.src = "/blog/html/qr-code-generator.html";
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
