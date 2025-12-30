/* ===============================
   ELEMENT REFERENCES
================================ */

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

/* ===============================
   CONFIG – UPDATE THIS
================================ */

/* 👉 Replace with your Render backend URL */
const BACKEND_URL =
  "https://alttextgenerator-qfqz.onrender.com/generate-alt-text";


/* ===============================
   UPLOAD HANDLING
================================ */

/* Click to upload */
uploadArea.addEventListener("click", () => {
  imageInput.click();
});

/* Drag over */
uploadArea.addEventListener("dragover", (e) => {
  e.preventDefault();
  uploadArea.classList.add("dragover");
});

/* Drag leave */
uploadArea.addEventListener("dragleave", () => {
  uploadArea.classList.remove("dragover");
});

/* Drop */
uploadArea.addEventListener("drop", (e) => {
  e.preventDefault();
  uploadArea.classList.remove("dragover");

  const file = e.dataTransfer.files[0];
  if (!file || !file.type.startsWith("image/")) return;

  imageInput.files = e.dataTransfer.files;
  showPreview(file);
});

/* File picker */
imageInput.addEventListener("change", () => {
  const file = imageInput.files[0];
  if (file) showPreview(file);
});

/* ===============================
   IMAGE PREVIEW
================================ */

function showPreview(file) {
  const reader = new FileReader();
  reader.onload = () => {
    previewImage.src = reader.result;
    previewImage.style.display = "block";
    previewText.innerText = "";
  };
  reader.readAsDataURL(file);
}

/* ===============================
   PREVIEW ZOOM MODAL
================================ */

previewImage.addEventListener("click", () => {
  if (!previewImage.src) return;
  modal.style.display = "block";
  modalImage.src = previewImage.src;
});

closeModal.addEventListener("click", () => {
  modal.style.display = "none";
});

modal.addEventListener("click", (e) => {
  if (e.target === modal) {
    modal.style.display = "none";
  }
});

/* ===============================
   GENERATE ALT TEXT
================================ */

generateBtn.addEventListener("click", async () => {
  warning.innerText = "";
  output.value = "";
  counter.innerText = "0 / 600";

  const file = imageInput.files[0];
  if (!file) {
    alert("Please upload a visual first");
    return;
  }

  /* Combine rules */
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

  /* UI state */
  spinner.style.display = "block";
  generateBtn.disabled = true;
  generateBtn.innerText = "Generating...";

  try {
    const response = await fetch(BACKEND_URL, {
      method: "POST",
      body: formData
    });

    if (!response.ok) {
      throw new Error("Backend error");
    }

    const data = await response.json();

    output.value = data.altText || "";
    counter.innerText = `${data.length || 0} / 600`;
    warning.innerText = data.warning || "";

  } catch (error) {
    console.error(error);
    warning.innerText = "Failed to generate alt text";
  }

  /* Reset UI */
  spinner.style.display = "none";
  generateBtn.disabled = false;
  generateBtn.innerText = "Generate Alt Text";
});

/* ===============================
   COPY ALT TEXT
================================ */

copyBtn.addEventListener("click", () => {
  if (!output.value) return;

  output.select();
  output.setSelectionRange(0, 99999);
  document.execCommand("copy");

  alert("Alt text copied");
});

/* ===============================
   LIVE CHARACTER COUNTER
================================ */

output.addEventListener("input", () => {
  counter.innerText = `${output.value.length} / 600`;
});
