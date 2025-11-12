document.getElementById("uploadForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const fileInput = document.getElementById("fileInput");
  const focusInput = document.getElementById("focusInput");
  const formData = new FormData();

  formData.append("file", fileInput.files[0]);
  formData.append("focus", focusInput.value.trim()); // 👈 add focus topic

  document.getElementById("summaryText").innerText = "Generating summary...";

  try {
    const response = await fetch("http://localhost:5000/summarize", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (data.summary) {
      document.getElementById("summaryText").innerText = data.summary;
    } else {
      document.getElementById("summaryText").innerText =
        "⚠️ No summary generated. Check backend logs.";
    }
  } catch (err) {
    document.getElementById("summaryText").innerText =
      "❌ Error connecting to server: " + err.message;
  }
});
