const WHATSAPP_NUMBER = "59892945696";

// Medición (GoatCounter). No-op si la cuenta todavía no está creada o el
// script no cargó (ej. bloqueado por un adblock) — nunca rompe la página.
function gcTrack(path) {
  try {
    if (window.goatcounter && typeof window.goatcounter.count === "function") {
      window.goatcounter.count({ path, event: true });
    }
  } catch (e) {
    /* medición opcional, nunca debe romper la página */
  }
}

// Lee ?src=whatsapp|instagram|bio|google de la URL y lo registra como
// evento para saber de dónde vino la visita. El link con ?src=whatsapp va
// en el mensaje automático de WhatsApp Business (pendiente de cargar U).
function trackVisitSource() {
  const src = new URLSearchParams(window.location.search).get("src");
  if (src) gcTrack(`visita-origen/${src}`);
}

const RUBRO_VIDEO = {
  almacen: { src: "media/reels/almacen.mp4", keyword: "ALMACÉN", label: "Almacén y kiosco" },
  gimnasio: { src: "media/reels/gimnasio.mp4", keyword: "GIMNASIO", label: "Gimnasio" },
  restaurante: { src: "media/reels/restaurante.mp4", keyword: "RESTAURANTE", label: "Restaurante" },
  reservas: { src: "media/reels/reservas.mp4", keyword: "TURNOS", label: "Turnos y reservas" },
  distribuidora: { src: "media/reels/distribuidora.mp4", keyword: "DISTRIBUIDORA", label: "Distribuidora" },
  campo: { src: "media/reels/campo.mp4", keyword: "CAMPO", label: "Campo" }
};

// PRECIOS DEFINIDOS por el usuario 02/11/2026 — fuente: video-studio/PRECIOS.md.
// Dos grupos (no seis grillas distintas): agenda (turnos, gimnasio) y caja
// (almacén, restaurante, distribuidora, campo). "Completo" = base + los 2
// primeros extras del rubro, "Pro" = base + los 4 extras — pero el precio de
// cada plan es el fijo del grupo, no una suma.
const PRICE_GROUPS = {
  agenda: { standard: 350, complete: 600, pro: 850, extraPrice: 150 },
  caja: { standard: 500, complete: 900, pro: 1300, extraPrice: 250 }
};

// Oferta de lanzamiento: -20% en cualquier plan, para siempre, para los
// primeros 5 negocios. LAUNCH_DEADLINE queda vacía hasta que el usuario
// defina la fecha límite; mientras esté vacía, no se muestra. Para cerrar
// la oferta del todo (se llenaron los 5 lugares o pasó la fecha), pasar
// LAUNCH_OFFER_ACTIVE a false.
const LAUNCH_OFFER_ACTIVE = true;
const LAUNCH_DEADLINE = "";
const LAUNCH_DISCOUNT = 0.2;
const LAUNCH_SPOTS = 5;

function launchPrice(price) {
  return Math.round(price * (1 - LAUNCH_DISCOUNT));
}

const QUOTE_CONFIG = {
  almacen: {
    group: "caja",
    base: { label: "Escaneás el producto y sale el ticket" },
    extras: [
      { key: "stock", label: "Stock al día con carga de mercadería" },
      { key: "resumen", label: "Resumen del mes con gráficas" },
      { key: "cuenta", label: "Cuenta corriente de tus clientes" },
      { key: "caja2", label: "Dos cajas a la vez" }
    ]
  },
  gimnasio: {
    group: "agenda",
    base: { label: "Tus alumnos y quién te debe, marcado en rojo" },
    extras: [
      { key: "panel", label: "Panel de ingresos con gráficas" },
      { key: "progreso", label: "Progreso de cada alumno" },
      { key: "avisos", label: "Avisos de pago por WhatsApp" },
      { key: "gastos", label: "Control de gastos" }
    ]
  },
  restaurante: {
    group: "caja",
    base: { label: "Tomás el pedido y sale impreso: comanda, archivo y cliente" },
    extras: [
      { key: "cierre", label: "Cierre de caja" },
      { key: "panel", label: "Panel de ventas" },
      { key: "delivery", label: "Delivery con seguimiento de repartidores" },
      { key: "cuenta", label: "Cuenta corriente" }
    ]
  },
  reservas: {
    group: "agenda",
    base: { label: "Reservas online las 24 h + tu agenda del día + respuesta automática con tu link" },
    extras: [
      { key: "recordatorio", label: "Recordatorio automático al cliente" },
      { key: "estadisticas", label: "Estadísticas de tu agenda" },
      { key: "profesionales", label: "Agenda para varios profesionales" },
      { key: "pro2", label: "Más funciones (a confirmar)" }
    ]
  },
  distribuidora: {
    group: "caja",
    base: { label: "Pedidos desde la calle, directo a la oficina" },
    extras: [
      { key: "boletas", label: "Boletas en la oficina" },
      { key: "stock", label: "Stock" },
      { key: "ruta", label: "Ruta de reparto más corta" },
      { key: "vendedores", label: "Varios vendedores" }
    ]
  },
  campo: {
    group: "caja",
    base: { label: "Tu ganado, potrero por potrero, con traslados" },
    extras: [
      { key: "lluvias", label: "Registro de lluvias" },
      { key: "sanidad", label: "Sanidad" },
      { key: "voz", label: "Cargás hablando, por voz" },
      { key: "excel", label: "Reportes en Excel/PDF" }
    ]
  }
};

function getPlans(rubro) {
  const cfg = QUOTE_CONFIG[rubro];
  const group = PRICE_GROUPS[cfg.group];
  const completeItems = cfg.extras.slice(0, 2).map((extra) => extra.label);
  const proItems = cfg.extras.map((extra) => extra.label);
  const allLooseTotal = group.standard + group.extraPrice * cfg.extras.length;
  return [
    { name: "Estándar", price: group.standard, items: [] },
    { name: "Completo", price: group.complete, items: completeItems, featured: true },
    { name: "Pro", price: group.pro, items: proItems, savings: allLooseTotal - group.pro }
  ];
}

function buildWhatsappUrl(message) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

function buildQuoteMessage(keyword, descriptor, total) {
  const price = LAUNCH_OFFER_ACTIVE ? launchPrice(total) : total;
  const suffix = LAUNCH_OFFER_ACTIVE ? " (precio de lanzamiento)" : "";
  return `Hola! Armé mi presupuesto de ${keyword}: ${descriptor} ≈ $${price}/mes${suffix}`;
}

function renderPriceTag(price) {
  if (!LAUNCH_OFFER_ACTIVE) return `<span class="quote-price-launch">$${price}/mes</span>`;
  return `
    <span class="quote-price-strike">$${price}</span>
    <span class="quote-price-launch">$${launchPrice(price)}/mes</span>
  `;
}

function renderLaunchBanner() {
  if (!LAUNCH_OFFER_ACTIVE) return "";
  const deadline = LAUNCH_DEADLINE ? ` antes del ${LAUNCH_DEADLINE}` : "";
  return `<div class="quote-launch-banner">Precio de lanzamiento: −20% para siempre, para los primeros ${LAUNCH_SPOTS} negocios${deadline}</div>`;
}

function setupWhatsappLinks() {
  document.querySelectorAll("[data-wa]").forEach((link) => {
    const message = link.getAttribute("data-wa-msg") || "Hola!";
    link.setAttribute("href", buildWhatsappUrl(message));
    link.setAttribute("target", "_blank");
    link.setAttribute("rel", "noopener");
    const section = link.getAttribute("data-wa-section") || "otro";
    link.addEventListener("click", () => gcTrack(`wa-click/${section}`));
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
// WhatsApp. Precio de lanzamiento (-20%) incluido mientras esté activo.
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
    const group = PRICE_GROUPS[cfg.group];
    const banner = renderLaunchBanner();

    if (step === "choice") {
      panelEl.innerHTML = `
        ${banner}
        <h3 class="quote-title">Armá tu presupuesto</h3>
        <div class="quote-choice-grid">
          <button type="button" class="quote-choice-btn" data-step="plans">Ver planes armados</button>
          <button type="button" class="quote-choice-btn" data-step="custom">Armar el mío</button>
        </div>
      `;
    } else if (step === "plans") {
      const plans = getPlans(rubro);
      panelEl.innerHTML = `
        ${banner}
        <button type="button" class="quote-back" data-step="choice">‹ Volver</button>
        <h3 class="quote-title">Planes para ${entry.label}</h3>
        <div class="quote-plans-grid">
          ${plans
            .map(
              (plan, index) => `
            <button type="button" class="quote-plan-card${plan.featured ? " quote-plan-card-featured" : ""}" data-plan-index="${index}">
              ${plan.featured ? '<span class="quote-plan-card-badge">⭐ El más elegido</span>' : ""}
              <div class="quote-plan-card-name">${plan.name}</div>
              <div class="quote-plan-card-price">${renderPriceTag(plan.price)}</div>
              <div class="quote-plan-card-items">${plan.items.length ? `Incluye: ${plan.items.join(", ")}` : "La base, sin extras"}</div>
              ${plan.savings ? `<div class="quote-plan-card-savings">Ahorrás $${plan.savings}/mes comparado a todo suelto</div>` : ""}
            </button>
          `
            )
            .join("")}
        </div>
      `;
    } else if (step === "custom") {
      const selectedExtras = cfg.extras.filter((extra) => selected.has(extra.key));
      const total = group.standard + selectedExtras.length * group.extraPrice;
      const descriptor = selectedExtras.length ? selectedExtras.map((extra) => extra.label).join(", ") : "Plan base";
      panelEl.innerHTML = `
        ${banner}
        <button type="button" class="quote-back" data-step="choice">‹ Volver</button>
        <h3 class="quote-title">Armá el tuyo</h3>
        <div class="quote-base-row">
          <span>${cfg.base.label}</span>
          <span class="quote-base-price">$${group.standard}/mes</span>
        </div>
        <div class="quote-extras">
          ${cfg.extras
            .map(
              (extra) => `
            <label class="quote-extra-row">
              <input type="checkbox" data-extra-key="${extra.key}" ${selected.has(extra.key) ? "checked" : ""} />
              <span class="quote-extra-label">${extra.label}</span>
              <span class="quote-extra-price">+$${group.extraPrice}</span>
            </label>
          `
            )
            .join("")}
        </div>
        <div class="quote-total-row">
          <span class="quote-total-label">Total aproximado</span>
          <span class="quote-total-value">${renderPriceTag(total)}</span>
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
        gcTrack(`cotizador-enviar/${rubro}-plan-${plan.name.toLowerCase()}`);
        window.open(url, "_blank", "noopener");
      });
    });

    const sendButton = panelEl.querySelector(".quote-send-btn");
    if (sendButton) {
      sendButton.addEventListener("click", () => gcTrack(`cotizador-enviar/${rubro}-custom`));
    }

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
    gcTrack(`cotizador-abrir/${currentRubro}`);
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
    gcTrack(`ver-video/${rubro}`);
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

  cta.addEventListener("click", () => {
    if (currentRubro) gcTrack(`wa-click/rubro-${currentRubro}`);
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
trackVisitSource();
