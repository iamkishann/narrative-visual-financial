// Scene renderers. Each scene clears #chart and repopulates it from scratch,
// sharing one layout/margin/axis template so the chart geometry stays
// visually consistent from scene to scene.

const MARGIN = { top: 28, right: 46, bottom: 36, left: 56 };

function clearChart() {
  const svg = d3.select("#chart");
  svg.selectAll("*").remove();
  return svg;
}

function setupChart(svg) {
  const node = svg.node();
  const width = node.clientWidth;
  const height = node.clientHeight;
  const innerWidth = Math.max(10, width - MARGIN.left - MARGIN.right);
  const innerHeight = Math.max(10, height - MARGIN.top - MARGIN.bottom);
  const g = svg.append("g").attr("transform", `translate(${MARGIN.left},${MARGIN.top})`);
  return { g, innerWidth, innerHeight };
}

function drawAxes(g, xScale, yScale, innerWidth, innerHeight, yFormat, yLabel) {
  g.append("g")
    .attr("class", "axis axis-x")
    .attr("transform", `translate(0,${innerHeight})`)
    .call(d3.axisBottom(xScale).ticks(d3.timeYear.every(1)).tickFormat(d3.timeFormat("%Y")));

  g.append("g").attr("class", "axis axis-y").call(d3.axisLeft(yScale).ticks(6).tickFormat(yFormat));

  g.append("text")
    .attr("class", "axis-label")
    .attr("transform", "rotate(-90)")
    .attr("x", -innerHeight / 2)
    .attr("y", -MARGIN.left + 14)
    .attr("text-anchor", "middle")
    .text(yLabel);
}

function showTooltip(containerNode, event, html) {
  const [x, y] = d3.pointer(event, containerNode);
  d3.select("#tooltip").html(html).style("left", `${x}px`).style("top", `${y}px`).classed("hidden", false);
}

function hideTooltip() {
  d3.select("#tooltip").classed("hidden", true);
}

function priceAt(rows, date) {
  const hit = rows.find((d) => d.date.getTime() === date.getTime());
  return hit ? hit.price : null;
}

// ---------- Overview scene ----------

function renderOverview(state) {
  const { SYMBOLS, COLOR_HEX, COMPANY_NAMES } = window.StockData;
  const series = state.data.series;

  const svg = clearChart();
  const container = document.getElementById("chart-container");
  const { g, innerWidth, innerHeight } = setupChart(svg);

  const domainStart = parseDate("Jan 1 2000");
  const domainEnd = parseDate("Mar 1 2010");
  const xScale = d3.scaleTime().domain([domainStart, domainEnd]).range([0, innerWidth]);

  const maxIndex = d3.max(SYMBOLS, (s) => d3.max(series[s], (d) => d.index));
  const yScale = d3.scaleLinear().domain([0, maxIndex * 1.08]).range([innerHeight, 0]).nice();

  Annotations.renderEventBands(g, Annotations.OVERVIEW_EVENT_BANDS, xScale, innerHeight);
  drawAxes(g, xScale, yScale, innerWidth, innerHeight, (d) => `${d}x`, "Return multiple (1.0 = first price)");

  // baseline at 1.0x
  g.append("line")
    .attr("x1", 0).attr("x2", innerWidth)
    .attr("y1", yScale(1)).attr("y2", yScale(1))
    .attr("stroke", "var(--line)")
    .attr("stroke-dasharray", "3,3");

  const line = d3.line().x((d) => xScale(d.date)).y((d) => yScale(d.index));

  const lineLayer = g.append("g").attr("class", "line-layer");
  SYMBOLS.forEach((symbol) => {
    lineLayer
      .append("path")
      .datum(series[symbol])
      .attr("class", "series-line")
      .attr("data-symbol", symbol)
      .attr("stroke", COLOR_HEX[symbol])
      .attr("d", line);
  });

  // end-of-line labels
  SYMBOLS.forEach((symbol) => {
    const rows = series[symbol];
    const last = rows[rows.length - 1];
    g.append("text")
      .attr("x", xScale(last.date) + 6)
      .attr("y", yScale(last.index))
      .attr("dy", "0.32em")
      .attr("fill", COLOR_HEX[symbol])
      .attr("font-size", "0.72rem")
      .attr("font-weight", 700)
      .text(symbol);
  });

  const hoverLayer = g.append("g").attr("class", "hover-layer");
  const hoverRule = hoverLayer
    .append("line")
    .attr("y1", 0).attr("y2", innerHeight)
    .attr("stroke", "var(--muted)")
    .attr("opacity", 0);

  const hoverDots = SYMBOLS.map((symbol) =>
    hoverLayer
      .append("circle")
      .attr("class", "series-hover-dot")
      .attr("r", 4)
      .attr("stroke", COLOR_HEX[symbol])
      .attr("opacity", 0)
  );

  const bisectDate = d3.bisector((d) => d.date).left;

  g.append("rect")
    .attr("width", innerWidth)
    .attr("height", innerHeight)
    .attr("fill", "transparent")
    .on("mousemove", function (event) {
      const [mx] = d3.pointer(event, this);
      const targetDate = xScale.invert(mx);

      let anchorDate = null;
      const rowsHtml = [];
      SYMBOLS.forEach((symbol, i) => {
        const rows = series[symbol];
        if (!rows.length || targetDate < rows[0].date) {
          hoverDots[i].attr("opacity", 0);
          return;
        }
        const idx = Math.min(bisectDate(rows, targetDate), rows.length - 1);
        const d0 = rows[Math.max(0, idx - 1)];
        const d1 = rows[idx];
        const d = targetDate - d0.date > d1.date - targetDate ? d1 : d0;
        anchorDate = anchorDate || d.date;
        hoverDots[i]
          .attr("cx", xScale(d.date))
          .attr("cy", yScale(d.index))
          .attr("opacity", 1);
        rowsHtml.push(
          `<span style="color:${COLOR_HEX[symbol]}">&#9679;</span> ${COMPANY_NAMES[symbol]} — ${d.index.toFixed(2)}x ($${d.price.toFixed(2)})`
        );
      });

      if (anchorDate) {
        hoverRule.attr("x1", xScale(anchorDate)).attr("x2", xScale(anchorDate)).attr("opacity", 1);
        showTooltip(
          container,
          event,
          `<strong>${d3.timeFormat("%b %Y")(anchorDate)}</strong><br>${rowsHtml.join("<br>")}`
        );
      }
    })
    .on("mouseleave", () => {
      hoverRule.attr("opacity", 0);
      hoverDots.forEach((d) => d.attr("opacity", 0));
      hideTooltip();
    });
}

// ---------- Company detail scene ----------

function renderCompany(state, symbol) {
  const { COLOR_HEX, COMPANY_NAMES } = window.StockData;
  const rows = state.data.series[symbol];

  const svg = clearChart();
  const container = document.getElementById("chart-container");
  const { g, innerWidth, innerHeight } = setupChart(svg);

  const xScale = d3.scaleTime().domain(d3.extent(rows, (d) => d.date)).range([0, innerWidth]);
  const yScale = d3
    .scaleLinear()
    .domain([0, d3.max(rows, (d) => d.price) * 1.12])
    .range([innerHeight, 0])
    .nice();

  drawAxes(g, xScale, yScale, innerWidth, innerHeight, (d) => `$${d}`, "Price (USD)");

  const line = d3.line().x((d) => xScale(d.date)).y((d) => yScale(d.price));

  g.append("path")
    .datum(rows)
    .attr("class", "series-line")
    .attr("stroke", COLOR_HEX[symbol])
    .attr("d", line);

  const annoItems = (Annotations.COMPANY_ANNOTATIONS[symbol] || [])
    .map((a) => ({ ...a, value: priceAt(rows, a.date) }))
    .filter((a) => a.value != null);
  Annotations.renderPointAnnotations(g, annoItems, (d) => xScale(d.date), (d) => yScale(d.value));

  const hoverLayer = g.append("g").attr("class", "hover-layer");
  const hoverRule = hoverLayer
    .append("line")
    .attr("y1", 0).attr("y2", innerHeight)
    .attr("stroke", "var(--muted)")
    .attr("opacity", 0);
  const hoverDot = hoverLayer
    .append("circle")
    .attr("class", "series-hover-dot")
    .attr("r", 4.5)
    .attr("stroke", COLOR_HEX[symbol])
    .attr("opacity", 0);

  const bisectDate = d3.bisector((d) => d.date).left;

  g.append("rect")
    .attr("width", innerWidth)
    .attr("height", innerHeight)
    .attr("fill", "transparent")
    .on("mousemove", function (event) {
      const [mx] = d3.pointer(event, this);
      const targetDate = xScale.invert(mx);
      const idx = Math.min(Math.max(bisectDate(rows, targetDate), 1), rows.length - 1);
      const d0 = rows[idx - 1];
      const d1 = rows[idx];
      const d = targetDate - d0.date > d1.date - targetDate ? d1 : d0;

      hoverRule.attr("x1", xScale(d.date)).attr("x2", xScale(d.date)).attr("opacity", 1);
      hoverDot.attr("cx", xScale(d.date)).attr("cy", yScale(d.price)).attr("opacity", 1);

      showTooltip(
        container,
        event,
        `<strong>${COMPANY_NAMES[symbol]} — ${d3.timeFormat("%b %Y")(d.date)}</strong><br>$${d.price.toFixed(2)}`
      );
    })
    .on("mouseleave", () => {
      hoverRule.attr("opacity", 0);
      hoverDot.attr("opacity", 0);
      hideTooltip();
    });
}

window.Scenes = { renderOverview, renderCompany };
