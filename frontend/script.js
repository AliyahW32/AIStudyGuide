document.getElementById("uploadForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const fileInput = document.getElementById("fileInput");
  const formData = new FormData();
  formData.append("file", fileInput.files[0]);

  document.getElementById("summaryText").innerText = "Generating summary...";

  const response = await fetch("http://localhost:5000/summarize", {
    method: "POST",
    body: formData,
  });

  const data = await response.json();
  document.getElementById("summaryText").innerText = data.summary;
});
