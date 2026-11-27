const WHATSAPP_NUMBER = "59892945696";

// Medición propia (02/11/2026): reemplaza GoatCounter porque el usuario
// quiere los datos en su propia base, sin cuentas externas. Sin cookies:
// visitorId es un id al azar que vive solo mientras la página está abierta.
// Se consulta con backend/scripts/inspect-logiclab-visits.js. Nunca debe
// romper ni frenar la página: cualquier error se ignora en silencio.
const API_BASE_URL =
  location.hostname === "localhost" || location.hostname === "127.0.0.1"
    ? "http://localhost:3000/api/v1"
    : "https://saasproback.onrender.com/api/v1";

function randomVisitorId() {
  try {
    return crypto.randomUUID();
  } catch {
    return `v${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
  }
}

const visitorId = randomVisitorId();

// Derivados desde Qq Digital (27/11/2026): su aviso entra con ?ref=qq. La
// marca dura 30 días, sale en cada mensaje de WhatsApp y en la medición.
const REFERRAL_KEY = "ll-referral";
const REFERRAL_MS = 30 * 24 * 60 * 60 * 1000;

function detectReferral() {
  let fromLink = false;
  try {
    const url = new URL(window.location.href);
    fromLink = (url.searchParams.get("ref") || "").toLowerCase() === "qq";
    if (fromLink) {
      // Se saca de la barra: si comparten el link, no arrastra la marca.
      url.searchParams.delete("ref");
      window.history.replaceState(window.history.state, "", url.toString());
    }
  } catch (e) {
    /* sin URL no hay marca */
  }
  try {
    if (fromLink) {
      localStorage.setItem(REFERRAL_KEY, String(Date.now() + REFERRAL_MS));
      return true;
    }
    return Number(localStorage.getItem(REFERRAL_KEY) || 0) > Date.now();
  } catch (e) {
    return fromLink;
  }
}

const fromQq = detectReferral();

function track(event, extra) {
  try {
    void fetch(`${API_BASE_URL}/logiclab/events/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitorId, event, ...extra, ...(fromQq ? { src: "ref-qq" } : {}) }),
      keepalive: true
    }).catch(() => {});
  } catch (e) {
    /* medición opcional, nunca debe romper la página */
  }
}

// Lee ?src=whatsapp|instagram|bio|google de la URL y la manda con la
// visita, para saber de dónde vino. El link con ?src=whatsapp va en el
// mensaje automático de WhatsApp Business (pendiente de cargar U).
function trackVisit() {
  const src = new URLSearchParams(window.location.search).get("src") || undefined;
  track("visit", { src });
}

const RUBRO_VIDEO = {
  almacen: { src: "media/reels/almacen.mp4", keyword: "COMERCIO", label: "Comercio" },
  gimnasio: { src: "media/reels/gimnasio.mp4", keyword: "GIMNASIO", label: "Gimnasio" },
  restaurante: { src: "media/reels/restaurante.mp4", keyword: "RESTAURANTE", label: "Restaurante" },
  reservas: { src: "media/reels/reservas.mp4", keyword: "TURNOS", label: "Turnos y reservas" },
  distribuidora: { src: "media/reels/distribuidora.mp4", keyword: "DISTRIBUIDORA", label: "Distribuidora" },
  campo: { src: "media/reels/campo.mp4", keyword: "CAMPO", label: "Campo" }
};

// PRECIOS DEFINIDOS por el usuario 02/11/2026, actualizados el mismo día —
// fuente: video-studio/PRECIOS.md. UNA SOLA ESCALERA para cualquier rubro
// (se sacaron los dos grupos agenda/caja: confundían). "Completo" = los 2
// primeros extras del rubro, "Pro" = los 4 — pero el precio de cada plan es
// fijo, no una suma. Personalizado ("se cotiza") no tiene precio: va directo
// a WhatsApp, para negocios grandes o complejos.
const PRICE_LADDER = { standard: 350, complete: 600, pro: 900, extraPrice: 150 };

// Oferta "Precio de bienvenida": -20% en cualquier plan, para siempre, para
// los próximos 5 negocios. Apagada por ahora (02/11/2026): sale recién con
// el reel de la oferta la semana que viene. LAUNCH_DEADLINE queda vacía
// hasta que el usuario defina la fecha límite; mientras esté vacía, no se
// muestra. Para apagar/prender toda la oferta, un solo flag:
// LAUNCH_OFFER_ACTIVE.
const LAUNCH_OFFER_ACTIVE = false;
const LAUNCH_DEADLINE = "";
const LAUNCH_DISCOUNT = 0.2;
const LAUNCH_SPOTS = 5;

// Black Friday 2026: -30% del viernes 27 al lunes 30/11 (hora de Uruguay),
// se prende y se apaga sola. Quien entra esos días tiene el descuento para
// siempre (se cobra al terminar el mes gratis), solo clientes nuevos.
// Mientras dura, pisa la oferta de bienvenida.
const BLACK_FRIDAY = {
  start: Date.parse("2026-11-27T00:00:00-03:00"),
  end: Date.parse("2026-12-01T00:00:00-03:00"),
  discount: 0.3
};

function isBlackFriday() {
  const now = Date.now();
  return now >= BLACK_FRIDAY.start && now < BLACK_FRIDAY.end;
}

function hasOffer() {
  return isBlackFriday() || LAUNCH_OFFER_ACTIVE;
}

function offerPrice(price) {
  const discount = isBlackFriday() ? BLACK_FRIDAY.discount : LAUNCH_DISCOUNT;
  return Math.round(price * (1 - discount));
}

const QUOTE_CONFIG = {
  almacen: {
    base: { label: "Escaneás el producto y sale el ticket" },
    extras: [
      { key: "stock", label: "Stock al día con carga de mercadería" },
      { key: "resumen", label: "Resumen del mes con gráficas" },
      { key: "cuenta", label: "Cuenta corriente de tus clientes" },
      { key: "caja2", label: "Dos cajas a la vez" }
    ]
  },
  gimnasio: {
    base: { label: "Tus alumnos y sus mensualidades al día, con los vencimientos marcados" },
    extras: [
      { key: "panel", label: "Panel de ingresos con gráficas" },
      { key: "progreso", label: "Progreso de cada alumno" },
      { key: "avisos", label: "Avisos de pago por WhatsApp" },
      { key: "gastos", label: "Control de gastos" }
    ]
  },
  restaurante: {
    base: { label: "Tomás el pedido y sale impreso: comanda, archivo y cliente" },
    extras: [
      { key: "cierre", label: "Cierre de caja" },
      { key: "panel", label: "Panel de ventas" },
      { key: "delivery", label: "Delivery con seguimiento de repartidores" },
      { key: "cuenta", label: "Cuenta corriente" }
    ]
  },
  reservas: {
    base: { label: "Reservas online las 24 h + tu agenda del día + respuesta automática con tu link" },
    extras: [
      { key: "recordatorio", label: "Recordatorio automático al cliente" },
      { key: "estadisticas", label: "Estadísticas de tu agenda" },
      { key: "profesionales", label: "Agenda para varios profesionales" },
      { key: "pro2", label: "Historial de cada cliente" }
    ]
  },
  distribuidora: {
    base: { label: "Pedidos desde la calle, directo a la oficina" },
    extras: [
      { key: "boletas", label: "Boletas en la oficina" },
      { key: "stock", label: "Stock" },
      { key: "ruta", label: "Ruta de reparto más corta" },
      { key: "vendedores", label: "Varios vendedores" }
    ]
  },
  campo: {
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
  const completeItems = cfg.extras.slice(0, 2).map((extra) => extra.label);
  const proItems = cfg.extras.map((extra) => extra.label);
  const allLooseTotal = PRICE_LADDER.standard + PRICE_LADDER.extraPrice * cfg.extras.length;
  return [
    { name: "Estándar", price: PRICE_LADDER.standard, items: [] },
    { name: "Completo", price: PRICE_LADDER.complete, items: completeItems, featured: true },
    { name: "Pro", price: PRICE_LADDER.pro, items: proItems, savings: allLooseTotal - PRICE_LADDER.pro }
  ];
}

function buildWhatsappUrl(message) {
  const offer = isBlackFriday() ? `${message} (Black Friday: 30% menos)` : message;
  const text = fromQq ? `${offer}\n\n✳️ Ref: QQ` : offer;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

function buildQuoteMessage(keyword, descriptor, total) {
  const price = hasOffer() ? offerPrice(total) : total;
  // La etiqueta de Black Friday la agrega buildWhatsappUrl.
  const suffix = LAUNCH_OFFER_ACTIVE && !isBlackFriday() ? " (precio de bienvenida)" : "";
  return `Hola! Armé mi presupuesto de ${keyword}: ${descriptor} ≈ $${price}/mes${suffix}`;
}

function renderPriceTag(price) {
  if (!hasOffer()) return `<span class="quote-price-launch">$${price}/mes</span>`;
  return `
    <span class="quote-price-strike">$${price}</span>
    <span class="quote-price-launch">$${offerPrice(price)}/mes</span>
  `;
}

function renderLaunchBanner() {
  if (isBlackFriday()) {
    return `<div class="quote-launch-banner">Black Friday: 30% menos para siempre, solo hasta el lunes 30</div>`;
  }
  if (!LAUNCH_OFFER_ACTIVE) return "";
  const deadline = LAUNCH_DEADLINE ? ` antes del ${LAUNCH_DEADLINE}` : "";
  return `<div class="quote-launch-banner">Precio de bienvenida: −20% para siempre, para los próximos ${LAUNCH_SPOTS} negocios${deadline}</div>`;
}

function setupWhatsappLinks() {
  document.querySelectorAll("[data-wa]").forEach((link) => {
    const message = link.getAttribute("data-wa-msg") || "Hola!";
    link.setAttribute("href", buildWhatsappUrl(message));
    link.setAttribute("target", "_blank");
    link.setAttribute("rel", "noopener");
    const section = link.getAttribute("data-wa-section") || "otro";
    link.addEventListener("click", () => track("wa_click", { section }));
  });
}

function setupBlackFriday() {
  if (!isBlackFriday()) return;
  document.querySelectorAll("[data-bf-banner], [data-bf-terms]").forEach((element) => {
    element.hidden = false;
  });
  const title = document.querySelector("[data-precios-titulo]");
  if (title) title.textContent = "Black Friday: planes desde $245 por mes";
  document.querySelectorAll("[data-precio]").forEach((element) => {
    element.innerHTML = renderPriceTag(Number(element.getAttribute("data-precio")));
  });
}

// Pop-up de streaming: entra desde la derecha a los 4 s, se cierra solo a los
// 10 s (o con la cruz). Sale cada vez que se abre o se recarga la página. No
// aparece encima del video: espera a que se cierre.
const PROMO_DELAY_MS = 4000;
const PROMO_VISIBLE_MS = 10000;

function setupPromoPopup() {
  const popup = document.querySelector("[data-promo]");
  const modal = document.querySelector("[data-video-modal]");
  if (!popup) return;
  // Quien vino de Qq vuelve sin la marca "ref=ll": sigue siendo derivado de ellos.
  if (fromQq) popup.querySelector("[data-promo-link]").href = "https://qqdigital.net/";
  let closeTimer = 0;
  let showTimer = 0;

  function close() {
    clearTimeout(closeTimer);
    popup.classList.remove("promo-popup-visible");
    setTimeout(() => {
      popup.hidden = true;
    }, 450);
  }

  function show() {
    if (modal && !modal.hidden) {
      showTimer = setTimeout(show, 3000);
      return;
    }
    popup.hidden = false;
    // Fuerza el calculo de estilos para que la entrada se anime.
    void popup.offsetWidth;
    popup.classList.add("promo-popup-visible");
    closeTimer = setTimeout(close, PROMO_VISIBLE_MS);
  }

  popup.querySelector("[data-promo-close]").addEventListener("click", close);
  popup.querySelector("[data-promo-link]").addEventListener("click", close);
  document.querySelectorAll("[data-play-video]").forEach((trigger) => trigger.addEventListener("click", close));
  showTimer = setTimeout(show, PROMO_DELAY_MS);

  // Volver con la flecha "atrás" restaura la página sin recargarla.
  window.addEventListener("pageshow", (event) => {
    if (!event.persisted) return;
    clearTimeout(showTimer);
    clearTimeout(closeTimer);
    popup.classList.remove("promo-popup-visible");
    popup.hidden = true;
    showTimer = setTimeout(show, PROMO_DELAY_MS);
  });
}

function setupHeroVideo() {
  const video = document.querySelector(".phone-video");
  const playButton = document.querySelector(".phone-play");
  if (!video || !playButton) return;

  // Cada video se cuenta una vez por visita.
  let counted = false;
  video.addEventListener("ended", () => track("video_completo", { rubro: "generico" }));

  playButton.addEventListener("click", () => {
    if (!counted) {
      counted = true;
      track("ver_video", { rubro: "generico" });
    }
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
// WhatsApp. Precio de bienvenida (-20%) incluido mientras esté activo.
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
              ${plan.featured ? '<span class="quote-plan-card-badge">⭐ Recomendado</span>' : ""}
              <div class="quote-plan-card-name">${plan.name}</div>
              <div class="quote-plan-card-price">${renderPriceTag(plan.price)}</div>
              <div class="quote-plan-card-items">${plan.items.length ? `Incluye: ${plan.items.join(", ")}` : "La base, sin extras"}</div>
              ${plan.savings && !hasOffer() ? `<div class="quote-plan-card-savings">Ahorrás $${plan.savings}/mes comparado a todo suelto</div>` : ""}
            </button>
          `
            )
            .join("")}
          <a
            class="quote-plan-card quote-plan-card-custom"
            data-plan-custom
            href="${buildWhatsappUrl("Hola! Quiero un plan personalizado para mi negocio")}"
            target="_blank"
            rel="noopener"
          >
            <div class="quote-plan-card-name">Personalizado</div>
            <div class="quote-plan-card-price"><span class="quote-price-launch">Se cotiza</span></div>
            <div class="quote-plan-card-items">Para negocios grandes o complejos: varias cajas, delivery con repartidores, sucursales…</div>
          </a>
        </div>
      `;
    } else if (step === "custom") {
      const selectedExtras = cfg.extras.filter((extra) => selected.has(extra.key));
      const total = PRICE_LADDER.standard + selectedExtras.length * PRICE_LADDER.extraPrice;
      const descriptor = selectedExtras.length ? selectedExtras.map((extra) => extra.label).join(", ") : "Plan base";
      panelEl.innerHTML = `
        ${banner}
        <button type="button" class="quote-back" data-step="choice">‹ Volver</button>
        <h3 class="quote-title">Armá el tuyo</h3>
        <div class="quote-base-row">
          <span>${cfg.base.label}</span>
          <span class="quote-base-price">$${PRICE_LADDER.standard}/mes</span>
        </div>
        <div class="quote-extras">
          ${cfg.extras
            .map(
              (extra) => `
            <label class="quote-extra-row">
              <input type="checkbox" data-extra-key="${extra.key}" ${selected.has(extra.key) ? "checked" : ""} />
              <span class="quote-extra-label">${extra.label}</span>
              <span class="quote-extra-price">+$${PRICE_LADDER.extraPrice}</span>
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
        track("cotizador_enviar", { rubro, plan: plan.name.toLowerCase() });
        window.open(url, "_blank", "noopener");
      });
    });

    const sendButton = panelEl.querySelector(".quote-send-btn");
    if (sendButton) {
      sendButton.addEventListener("click", () => track("cotizador_enviar", { rubro, plan: "custom" }));
    }

    const customPlanButton = panelEl.querySelector("[data-plan-custom]");
    if (customPlanButton) {
      customPlanButton.addEventListener("click", () => track("cotizador_enviar", { rubro, plan: "personalizado" }));
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
    track("cotizador_abrir", { rubro: currentRubro });
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
    track("ver_video", { rubro });
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
    if (currentRubro) track("video_completo", { rubro: currentRubro });
    cta.classList.add("video-modal-cta-pulse");
    question.hidden = false;
  });

  cta.addEventListener("click", () => {
    if (currentRubro) track("wa_click", { section: "rubro", rubro: currentRubro });
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

// Por dónde anduvo (27/11/2026): qué partes llegó a ver y qué botones tocó
// además de WhatsApp. Cada cosa se cuenta una sola vez por visita.
function setupJourneyTracking() {
  [
    ["[data-promo-link]", "popup-qq"],
    ['a.btn[href="#rubros"]', "como-funciona"],
    ["[data-bf-banner]", "banner-black-friday"]
  ].forEach(([selector, section]) => {
    document.querySelectorAll(selector).forEach((element) => {
      element.addEventListener("click", () => track("clic", { section }));
    });
  });

  if (!("IntersectionObserver" in window)) return;
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        track("ver_seccion", { section: entry.target.id });
      });
    },
    // Cuenta cuando la sección llega a la mitad de la pantalla (sirve aunque
    // sea más alta que el celular).
    { rootMargin: "0px 0px -50% 0px" }
  );
  ["rubros", "precios"].forEach((id) => {
    const section = document.getElementById(id);
    if (section) observer.observe(section);
  });
}

setupBlackFriday();
setupJourneyTracking();
setupWhatsappLinks();
setupHeroVideo();
setupRubroVideos();
setupPromoPopup();
trackVisit();
