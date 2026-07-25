document.addEventListener("DOMContentLoaded", () => {
  const mainView = document.getElementById("focusflow-main-view");
  const confirmView = document.getElementById("focusflow-confirm-view");
  const stopBtn = document.getElementById("focusflow-stop-btn");
  const continueBtn = document.getElementById("focusflow-continue-btn");
  const yesStopBtn = document.getElementById("focusflow-yes-stop-btn");

  if (stopBtn && mainView && confirmView) {
    stopBtn.addEventListener("click", () => {
      mainView.style.display = "none";
      confirmView.style.display = "flex";
    });
  }

  if (continueBtn && mainView && confirmView) {
    continueBtn.addEventListener("click", () => {
      confirmView.style.display = "none";
      mainView.style.display = "flex";
    });
  }

  if (yesStopBtn) {
    yesStopBtn.addEventListener("click", () => {
      chrome.runtime.sendMessage({ type: "STOP_TIMER" }, (response) => {
        if (chrome.runtime.lastError) {
          console.error("Error calling STOP_TIMER:", chrome.runtime.lastError);
          return;
        }
        if (response && response.success) {
          if (window.history.length > 1) {
            window.history.back();
            // Fallback if window.history.back() did not navigate away
            setTimeout(() => {
              if (window.location.protocol.startsWith("http")) {
                window.location.reload();
              } else {
                window.close();
              }
            }, 300);
          } else {
            window.close();
          }
        }
      });
    });
  }
});
