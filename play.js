const iframe = document.getElementById("portal-frame-iframe");
const loading = document.getElementById("portal-loading");

// Hide the loading overlay once the iframe actually loads.
iframe.addEventListener("load", () => {
  loading.hidden = true;
});


setTimeout(() => {
  if (!loading.hidden) {
    loading.querySelector("p").textContent =
      "Taking longer than expected -- the realm may not allow embedding here yet.";
  }
}, 8000);
