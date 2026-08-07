// State (parameters), scene router, and trigger wiring.

const SCENE_COPY = {
  overview: {
    title: "The Dot-Com Decade: Five Tech Giants, Five Different Fortunes",
    message:
      "Apple, Amazon, Google, IBM and Microsoft all lived through the same dot-com crash and the same 2008 financial crisis. What happened to each stock afterward had almost nothing to do with the macro backdrop and everything to do with company-specific bets. This is a drill-down story: pick any company below, in any order, to explore its own story.",
  },
  AAPL: {
    title: "Apple: Written Off, Then the Decade's Biggest Winner",
    message:
      "Left for dead after the 2000 crash; under $8 a share by late 2002; Apple rebuilt around the iPod and then the iPhone. $1 invested in Jan 2000 was worth roughly $8.60 by Mar 2010.",
  },
  AMZN: {
    title: "Amazon: Near-Death, Then a Slow Rebuild",
    message:
      "Amazon fell to near $6 a share in 2001, with analysts openly questioning its survival. A first profitable year in 2003 marked the turn; by 2010 the stock had roughly doubled investors' money.",
  },
  GOOG: {
    title: "Google: A Late Start, A Fast Climb",
    message:
      "Google doesn't even appear on this chart until its August 2004 IPO; but from there it climbed more than 5x in under six years, crisis included.",
  },
  IBM: {
    title: "IBM: The Decade That Went Nowhere",
    message:
      "IBM survived both crashes intact and never had a dramatic crisis of its own; but a full decade of holding the stock barely grew investors' money at all.",
  },
  MSFT: {
    title: "Microsoft: A Lost Decade",
    message:
      "Microsoft kept dominating desktop software throughout the 2000s. It didn't matter: the stock closed the decade below where it started, a net loss for a buy-and-hold investor.",
  },
};

const state = {
  currentScene: "overview",
  data: null,
};

function renderHeader() {
  const copy = SCENE_COPY[state.currentScene];
  d3.select("#scene-title").text(copy.title);
  d3.select("#scene-message").text(copy.message);
}

function renderControls() {
  const { SYMBOLS, COMPANY_NAMES } = window.StockData;
  const nav = d3.select("#controls");
  nav.selectAll("*").remove();

  if (state.currentScene === "overview") {
    SYMBOLS.forEach((symbol) => {
      nav
        .append("button")
        .text(COMPANY_NAMES[symbol])
        .on("click", () => goToScene(symbol));
    });
  } else {
    const symbol = state.currentScene;
    const i = SYMBOLS.indexOf(symbol);
    const prevSymbol = SYMBOLS[(i - 1 + SYMBOLS.length) % SYMBOLS.length];
    const nextSymbol = SYMBOLS[(i + 1) % SYMBOLS.length];

    nav
      .append("button")
      .text("← Overview")
      .on("click", () => goToScene("overview"));

    nav
      .append("button")
      .text(`← ${COMPANY_NAMES[prevSymbol]}`)
      .on("click", () => goToScene(prevSymbol));

    nav.append("button").attr("class", "active").text(COMPANY_NAMES[symbol]);

    nav
      .append("button")
      .text(`${COMPANY_NAMES[nextSymbol]} →`)
      .on("click", () => goToScene(nextSymbol));
  }
}

function render() {
  renderHeader();
  renderControls();
  if (state.currentScene === "overview") {
    Scenes.renderOverview(state);
  } else {
    Scenes.renderCompany(state, state.currentScene);
  }
}

function goToScene(scene) {
  state.currentScene = scene;
  render();
}

async function init() {
  try {
    state.data = await window.StockData.loadStockData();
    render();
  } catch (err) {
    d3.select("#scene-title").text("Couldn't load data");
    d3.select("#scene-message").text(String(err));
  }
}

window.addEventListener("resize", () => {
  if (state.data) render();
});

init();
