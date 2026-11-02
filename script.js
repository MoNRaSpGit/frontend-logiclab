const WHATSAPP_NUMBER = "59892945696";

const RUBRO_VIDEO = {
  almacen: { src: "media/reels/almacen.mp4", keyword: "ALMACÉN", label: "Almacén y kiosco" },
  gimnasio: { src: "media/reels/gimnasio.mp4", keyword: "GIMNASIO", label: "Gimnasio" },
  restaurante: { src: "media/reels/restaurante.mp4", keyword: "RESTAURANTE", label: "Restaurante" },
  reservas: { src: "media/reels/reservas.mp4", keyword: "TURNOS", label: "Turnos y reservas" },
  distribuidora: { src: "media/reels/distribuidora.mp4", keyword: "DISTRIBUIDORA", label: "Distribuidora" },
  campo: { src: "media/reels/campo.mp4", keyword: "CAMPO", label: "Campo" }
};

// PRECIOS PROVISORIOS, los define el usuario mas adelante (brief del
// cotizador, 01/11/2026). "Completo" = base + los 2 primeros extras,
// "Pro" = base + todos los extras.
const QUOTE_CONFIG = {
  almacen: {
    base: { label: "Ventas con escáner y tickets", price: 600 },
    extras: [
      { key: "stock", label: "Stock", price: 150 },
      { key: "cuenta", label: "Cuenta corriente", price: 150 },
      { key: "caja2", label: "Segunda caja", price: 100 },
      { key: "resumen", label: "Resumen del mes en el celu", price: 100 }
    ]
  },
  gimnasio: {
    base: { label: "Alumnos y mensualidades", price: 350 },
    extras: [
      { key: "avisos", label: "Avisos por WhatsApp", price: 100 },
      { key: "progreso", label: "Progreso del alumno", price: 100 },
      { key: "tienda", label: "Tienda", price: 100 },
      { key: "gastos", label: "Control de gastos", price: 50 }
    ]
  },
  restaurante: {
    base: { label: "Pedidos y comanda a cocina", price: 600 },
    extras: [
      { key: "delivery", label: "Delivery con repartidores", price: 150 },
      { key: "comandas", label: "Impresión de comandas", price: 100 },
      { key: "cierre", label: "Cierre de caja", price: 100 },
      { key: "cuenta", label: "Cuenta corriente", price: 100 }
    ]
  },
  reservas: {
    base: { label: "Página de reservas", price: 150 },
    extras: [
      { key: "auto", label: "Respuesta automática por WhatsApp", price: 100 },
      { key: "recordatorio", label: "Recordatorio al cliente", price: 50 },
      { key: "profesionales", label: "Varios profesionales", price: 100 },
      { key: "estadisticas", label: "Estadísticas", price: 50 }
    ]
  },
  distribuidora: {
    base: { label: "Pedidos del vendedor en la calle", price: 600 },
    extras: [
      { key: "boletas", label: "Boletas en oficina", price: 150 },
      { key: "ruta", label: "Ruta óptima de reparto", price: 200 },
      { key: "stock", label: "Stock", price: 150 },
      { key: "vendedores", label: "Varios vendedores", price: 100 }
    ]
  },
  campo: {
    base: { label: "Ganado y potreros", price: 500 },
    extras: [
      { key: "voz", label: "Carga por voz", price: 100 },
      { key: "sanidad", label: "Sanidad", price: 100 },
      { key: "lluvias", label: "Lluvias", price: 50 },
      { key: "excel", label: "Exportar a Excel/PDF", price: 50 }
    ]
  }
};

function getPlans(rubro) {
  const cfg = QUOTE_CONFIG[rubro];
  const extraNames = cfg.extras.map((extra) => extra.label);
  const extraTotal = cfg.extras.reduce((sum, extra) => sum + extra.price, 0);
  const completeExtras = cfg.extras.slice(0, 2);
  const completeTotal = completeExtras.reduce((sum, extra) => sum + extra.price, 0);
  return [
    { name: "Estándar", price: cfg.base.price, items: [] },
    { name: "Completo", price: cfg.base.price + completeTotal, items: completeExtras.map((extra) => extra.label) },
    { name: "Pro", price: cfg.base.price + extraTotal, items: extraNames }
  ];
}

function buildWhatsappUrl(message) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

function buildQuoteMessage(keyword, descriptor, total) {
  return `Hola! Armé mi presupuesto de ${keyword}: ${descriptor} ≈ $${total}/mes`;
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

// Cotizador dentro del modal de cada rubro: elegir planes armados o armar
// el propio con casillas, y terminar siempre mandando el presupuesto por
// WhatsApp. El total nunca se muestra como precio cerrado ("≈ $X/mes").
function createQuoteController(panelEl) {
  let rubro = null;
  let step = "choice";
  let selected = new Set();

  function reset() {
    step = "choice";
    selected = new Set();
  }

  function open(nextRubro) {
    rubro = nextRubro;
    reset();
    panelEl.hidden = false;
    render();
  }

  function close() {
    panelEl.hidden = true;
    panelEl.innerHTML = "";
  }

  function render() {
    const cfg = QUOTE_CONFIG[rubro];
    const entry = RUBRO_VIDEO[rubro];
    if (!cfg || !entry) return;
    const tag = `<span class="quote-tag">Precios de ejemplo</span>`;

    if (step === "choice") {
      panelEl.innerHTML = `
        ${tag}
        <h3 class="quote-title">Armá tu presupuesto</h3>
        <div class="quote-choice-grid">
          <button type="button" class="quote-choice-btn" data-step="plans">Ver planes armados</button>
          <button type="button" class="quote-choice-btn" data-step="custom">Armar el mío</button>
        </div>
      `;
    } else if (step === "plans") {
      const plans = getPlans(rubro);
      panelEl.innerHTML = `
        ${tag}
        <button type="button" class="quote-back" data-step="choice">‹ Volver</button>
        <h3 class="quote-title">Planes para ${entry.label}</h3>
        <div class="quote-plans-grid">
          ${plans
            .map(
              (plan, index) => `
            <button type="button" class="quote-plan-card" data-plan-index="${index}">
              <div class="quote-plan-card-name">${plan.name}</div>
              <div class="quote-plan-card-price">desde $${plan.price}/mes</div>
              <div class="quote-plan-card-items">${plan.items.length ? `Incluye: ${plan.items.join(", ")}` : "La base, sin extras"}</div>
            </button>
          `
            )
            .join("")}
        </div>
      `;
    } else if (step === "custom") {
      const selectedExtras = cfg.extras.filter((extra) => selected.has(extra.key));
      const total = cfg.base.price + selectedExtras.reduce((sum, extra) => sum + extra.price, 0);
      const descriptor = selectedExtras.length ? selectedExtras.map((extra) => extra.label).join(", ") : "Plan base";
      panelEl.innerHTML = `
        ${tag}
        <button type="button" class="quote-back" data-step="choice">‹ Volver</button>
        <h3 class="quote-title">Armá el tuyo</h3>
        <div class="quote-base-row">
          <span>${cfg.base.label}</span>
          <span class="quote-base-price">$${cfg.base.price}/mes</span>
        </div>
        <div class="quote-extras">
          ${cfg.extras
            .map(
              (extra) => `
            <label class="quote-extra-row">
              <input type="checkbox" data-extra-key="${extra.key}" ${selected.has(extra.key) ? "checked" : ""} />
              <span class="quote-extra-label">${extra.label}</span>
              <span class="quote-extra-price">+$${extra.price}</span>
            </label>
          `
            )
            .join("")}
        </div>
        <div class="quote-total-row">
          <span class="quote-total-label">Total aproximado</span>
          <span class="quote-total-value">≈ $${total}/mes</span>
        </div>
        <a
          class="btn btn-whatsapp btn-large quote-send-btn"
          href="${buildWhatsappUrl(buildQuoteMessage(entry.keyword, descriptor, total))}"
          target="_blank"
          rel="noopener"
        >
          Enviar mi presupuesto por WhatsApp
        </a>
        <p class="quote-footnote">1 mes gratis para probar · Cancelás cuando quieras</p>
      `;
    }

    wireStepEvents(cfg, entry);
  }

  function wireStepEvents(cfg, entry) {
    panelEl.querySelectorAll("[data-step]").forEach((button) => {
      button.addEventListener("click", () => {
        step = button.getAttribute("data-step");
        render();
      });
    });

    panelEl.querySelectorAll("[data-plan-index]").forEach((button) => {
      button.addEventListener("click", () => {
        const plan = getPlans(rubro)[Number(button.getAttribute("data-plan-index"))];
        const url = buildWhatsappUrl(buildQuoteMessage(entry.keyword, `Plan ${plan.name}`, plan.price));
        window.open(url, "_blank", "noopener");
      });
    });

    panelEl.querySelectorAll("[data-extra-key]").forEach((checkbox) => {
      checkbox.addEventListener("change", () => {
        const key = checkbox.getAttribute("data-extra-key");
        if (checkbox.checked) selected.add(key);
        else selected.delete(key);
        render();
      });
    });
  }

  return { open, close };
}

function setupRubroVideos() {
  const modal = document.querySelector("[data-video-modal]");
  const stage = document.querySelector("[data-video-stage]");
  const player = document.querySelector("[data-video-player]");
  const cta = document.querySelector("[data-video-cta]");
  const question = document.querySelector("[data-video-question]");
  const quotePanel = document.querySelector("[data-quote-panel]");
  const quoteOpenButtons = document.querySelectorAll("[data-quote-open]");
  if (!modal || !stage || !player || !cta || !question || !quotePanel) return;

  const quote = createQuoteController(quotePanel);
  let currentRubro = null;

  function showVideoStage() {
    stage.hidden = false;
    quotePanel.hidden = true;
  }

  function showQuotePanel() {
    if (!currentRubro) return;
    stage.hidden = true;
    player.pause();
    quote.open(currentRubro);
  }

  function openModal(rubro) {
    const entry = RUBRO_VIDEO[rubro];
    if (!entry) return;
    currentRubro = rubro;
    player.src = entry.src;
    modal.hidden = false;
    showVideoStage();
    player.play();
    cta.href = buildWhatsappUrl(`Hola! Vi el video de ${entry.keyword}`);
    cta.classList.remove("video-modal-cta-pulse");
    question.hidden = true;
  }

  function closeModal() {
    modal.hidden = true;
    player.pause();
    player.removeAttribute("src");
    player.load();
    cta.classList.remove("video-modal-cta-pulse");
    question.hidden = true;
    quote.close();
    showVideoStage();
    currentRubro = null;
  }

  player.addEventListener("ended", () => {
    cta.classList.add("video-modal-cta-pulse");
    question.hidden = false;
  });

  quoteOpenButtons.forEach((button) => {
    button.addEventListener("click", showQuotePanel);
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
