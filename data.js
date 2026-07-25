// Data loading + shaping. Exposes window.StockData.

const SYMBOLS = ["AAPL", "AMZN", "GOOG", "IBM", "MSFT"];

const COMPANY_NAMES = {
  AAPL: "Apple",
  AMZN: "Amazon",
  GOOG: "Google",
  IBM: "IBM",
  MSFT: "Microsoft",
};

const COLOR = {
  AAPL: "var(--c-aapl)",
  AMZN: "var(--c-amzn)",
  GOOG: "var(--c-goog)",
  IBM: "var(--c-ibm)",
  MSFT: "var(--c-msft)",
};

// Resolved hex values (CSS custom properties can't be read by D3 color math),
// kept in sync with css/style.css.
const COLOR_HEX = {
  AAPL: "#1f77b4",
  AMZN: "#ff7f0e",
  GOOG: "#2ca02c",
  IBM: "#9467bd",
  MSFT: "#d62728",
};

const parseDate = d3.timeParse("%b %d %Y");

async function loadStockData() {
  const raw = await d3.csv("stocks.csv", (d) => ({
    symbol: d.symbol,
    date: parseDate(d.date),
    price: +d.price,
  }));

  const bySymbol = d3.group(raw, (d) => d.symbol);

  const series = {}; // symbol -> [{date, price, index}]
  for (const symbol of SYMBOLS) {
    const rows = (bySymbol.get(symbol) || []).slice().sort((a, b) => a.date - b.date);
    const base = rows.length ? rows[0].price : 1;
    series[symbol] = rows.map((d) => ({
      date: d.date,
      price: d.price,
      index: d.price / base,
    }));
  }

  return { series };
}

window.StockData = { SYMBOLS, COMPANY_NAMES, COLOR, COLOR_HEX, loadStockData };
