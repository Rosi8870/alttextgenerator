const BACKEND_URL = "https://alttextgenerator-qfqz.onrender.com";

const uploadArea = document.getElementById("uploadArea");
const imageInput = document.getElementById("imageInput");
const previewImage = document.getElementById("previewImage");
const previewText = document.getElementById("previewText");

const contextText = document.getElementById("contextText");
const output = document.getElementById("output");
const counter = document.getElementById("counter");
const warning = document.getElementById("warning");

const generateBtn = document.getElementById("generateBtn");
const copyBtn = document.getElementById("copyBtn");
const spinner = document.getElementById("spinner");

const modal = document.getElementById("imageModal");
const modalImage = document.getElementById("modalImage");
const closeModal = document.querySelector(".close");

const toast = document.getElementById("toast");

/* Upload */
uploadArea.onclick = () => imageInput.click();

imageInput.onchange = () => {
  const file = imageInput.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    previewImage.src = reader.result;
    previewImage.style.display = "block";
    previewText.innerText = "Click to zoom";
  };
  reader.readAsDataURL(file);
};

/* Zoom preview */
previewImage.onclick = () => {
  modal.style.display = "flex";
  modalImage.src = previewImage.src;
};

closeModal.onclick = () => modal.style.display = "none";
modal.onclick = e => {
  if (e.target === modal) modal.style.display = "none";
};

/* Generate */
generateBtn.onclick = async () => {
  warning.innerText = "";
  output.value = "";
  counter.innerText = "0 / 600";

  if (!imageInput.files[0]) {
    warning.innerText = "Please upload an image";
    return;
  }

  const fd = new FormData();
  fd.append("image", imageInput.files[0]);
  fd.append("contextText", contextText.value);

  spinner.style.display = "block";
  generateBtn.disabled = true;

  try {
    const res = await fetch(`${BACKEND_URL}/generate-alt-text`, {
      method: "POST",
      body: fd
    });

    const data = await res.json();
    output.value = data.altText || "";
    counter.innerText = `${data.length || 0} / 600`;

  } catch {
    warning.innerText = "Failed to generate alt text";
  }

  spinner.style.display = "none";
  generateBtn.disabled = false;
};

/* Copy with toast */
copyBtn.onclick = () => {
  if (!output.value) return;
  output.select();
  document.execCommand("copy");

  toast.style.opacity = "1";
  setTimeout(() => {
    toast.style.opacity = "0";
  }, 1800);
};
