const uploadArea = document.getElementById("uploadArea");
const imageInput = document.getElementById("imageInput");
const previewImage = document.getElementById("previewImage");
const previewText = document.getElementById("previewText");
const contextText = document.getElementById("contextText");
const output = document.getElementById("output");
const counter = document.getElementById("counter");
const warning = document.getElementById("warning");
const dos = document.getElementById("dos");
const donts = document.getElementById("donts");
const generateBtn = document.getElementById("generateBtn");
const copyBtn = document.getElementById("copyBtn");
const spinner = document.getElementById("spinner");

/* Modal */
const modal = document.getElementById("imageModal");
const modalImage = document.getElementById("modalImage");
const closeModal = document.querySelector(".close");

/* Click upload */
uploadArea.addEventListener("click", () => imageInput.click());

/* Drag events */
uploadArea.addEventListener("dragover", e => {
  e.preventDefault();
  uploadArea.classList.add("dragover");
});

uploadArea.addEventListener("dragleave", () => {
  uploadArea.classList.remove("dragover");
});

uploadArea.addEventListener("drop", e => {
  e.preventDefault();
  uploadArea.classList.remove("dragover");
  const file = e.dataTransfer.files[0];
  if (!file || !file.type.startsWith("image/")) return;
  imageInput.files = e.dataTransfer.files;
  showPreview(file);
});

/* File select */
imageInput.addEventListener("change", () => {
  const file = imageInput.files[0];
  if (file) showPreview(file);
});

/* Preview */
function showPreview(file) {
  const reader = new FileReader();
  reader.onload = () => {
    previewImage.src = reader.result;
    previewImage.style.display = "block";
    previewText.innerText = "";
  };
  reader.readAsDataURL(file);
}

/* Zoom modal */
previewImage.addEventListener("click", () => {
  modal.style.display = "block";
  modalImage.src = previewImage.src;
});

closeModal.addEventListener("click", () => {
  modal.style.display = "none";
});

modal.addEventListener("click", e => {
  if (e.target === modal) modal.style.display = "none";
});

/* Generate */
generateBtn.addEventListener("click", async () => {
  warning.innerText = "";
  output.value = "";
  counter.innerText = "0 / 600";

  const file = imageInput.files[0];
  if (!file) {
    alert("Upload a visual first");
    return;
  }

  const rules = `
DO
${dos.value}

DO NOT
${donts.value}
`;

  const formData = new FormData();
  formData.append("image", file);
  formData.append("contextText", contextText.value);
  formData.append("rules", rules);

  spinner.style.display = "block";
  generateBtn.disabled = true;

  try {
    const response = await fetch("http://localhost:3000/generate-alt-text", {
      method: "POST",
      body: formData
    });

    const data = await response.json();
    output.value = data.altText || "";
    counter.innerText = `${data.length || 0} / 600`;
    warning.innerText = data.warning || "";

  } catch {
    warning.innerText = "Failed to generate alt text";
  }

  spinner.style.display = "none";
  generateBtn.disabled = false;
});

/* Copy */
copyBtn.addEventListener("click", () => {
  if (!output.value) return;
  output.select();
  document.execCommand("copy");
  alert("Alt text copied");
});

/* Counter */
output.addEventListener("input", () => {
  counter.innerText = `${output.value.length} / 600`;
});
