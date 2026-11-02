const WHATSAPP_NUMBER = "59892945696";

const RUBRO_VIDEO = {
  almacen: { src: "media/reels/almacen.mp4", keyword: "ALMACÉN" },
  gimnasio: { src: "media/reels/gimnasio.mp4", keyword: "GIMNASIO" },
  restaurante: { src: "media/reels/restaurante.mp4", keyword: "RESTAURANTE" },
  reservas: { src: "media/reels/reservas.mp4", keyword: "TURNOS" },
  distribuidora: { src: "media/reels/distribuidora.mp4", keyword: "DISTRIBUIDORA" },
  campo: { src: "media/reels/campo.mp4", keyword: "CAMPO" }
};

function buildWhatsappUrl(message) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

function setupWhatsappLinks() {
  document.querySelectorAll("[data-wa]").forEach((link) => {
    const message = link.getAttribute("data-wa-msg") || "Hola!";
    link.setAttribute("href", buildWhatsappUrl(message));
    link.setAttribute("target", "_blank");
    link.setAttribute("rel", "noopener");
  });
}

function setupHeroVideo() {
  const video = document.querySelector(".phone-video");
  const playButton = document.querySelector(".phone-play");
  if (!video || !playButton) return;

  playButton.addEventListener("click", () => {
    const src = video.getAttribute("data-lazy-src");
    if (src && !video.src) {
      video.src = src;
    }
    video.play();
    playButton.hidden = true;
  });

  video.addEventListener("pause", () => {
    playButton.hidden = false;
  });
}

function setupRubroVideos() {
  const modal = document.querySelector("[data-video-modal]");
  const player = document.querySelector("[data-video-player]");
  const cta = document.querySelector("[data-video-cta]");
  if (!modal || !player || !cta) return;

  function openModal(rubro) {
    const entry = RUBRO_VIDEO[rubro];
    if (!entry) return;
    player.src = entry.src;
    modal.hidden = false;
    player.play();
    cta.href = buildWhatsappUrl(`Hola! Vi el video de ${entry.keyword}`);
    cta.classList.remove("video-modal-cta-pulse");
  }

  function closeModal() {
    modal.hidden = true;
    player.pause();
    player.removeAttribute("src");
    player.load();
    cta.classList.remove("video-modal-cta-pulse");
  }

  player.addEventListener("ended", () => {
    cta.classList.add("video-modal-cta-pulse");
  });

  document.querySelectorAll("[data-rubro]").forEach((card) => {
    const rubro = card.getAttribute("data-rubro");
    card.querySelectorAll("[data-play-video]").forEach((trigger) => {
      trigger.addEventListener("click", () => openModal(rubro));
    });
  });

  document.querySelectorAll("[data-video-close]").forEach((element) => {
    element.addEventListener("click", closeModal);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !modal.hidden) {
      closeModal();
    }
  });
}

setupWhatsappLinks();
setupHeroVideo();
setupRubroVideos();
