// Annotation content + shared rendering helpers.
// One visual template (d3-annotation "annotationLabel") for every point

const OVERVIEW_EVENT_BANDS = [
  {
    start: parseDate("Mar 1 2000"),
    end: parseDate("Nov 1 2002"),
    label: "Dot-com crash",
  },
  {
    start: parseDate("Sep 1 2008"),
    end: parseDate("Apr 1 2009"),
    label: "2008 financial crisis",
  },
];

// Company-specific milestones. Dates are chosen to land exactly on a row
// present in data/stocks.csv so the annotation anchors to a real plotted point.
const COMPANY_ANNOTATIONS = {
  AAPL: [
    {
      date: parseDate("Sep 1 2000"),
      title: "Profit warning",
      label: "A surprise earnings warning triggers a ~50% one-day crash.",
      dx: 20, dy: -45,
    },
    {
      date: parseDate("Nov 1 2001"),
      title: "iPod ships",
      label: "The iPod launches (Oct 2001); the stock is still under $11, washed out from the dot-com bust.",
      dx: 150, dy: -170,
    },
    {
      date: parseDate("Jun 1 2007"),
      title: "iPhone ships",
      label: "The iPhone launches (Jun 2007) and the decade's turnaround accelerates.",
      dx: -70, dy: -60,
    },
  ],
  AMZN: [
    {
      date: parseDate("Sep 1 2001"),
      title: "All-time low",
      label: "Stock bottoms near $6; some analysts openly questioned whether Amazon would survive.",
      dx: 15, dy: -220,
    },
    {
      date: parseDate("Jan 1 2004"),
      title: "First annual profit",
      label: "Amazon reports its first full-year profit (for FY2003).",
      dx: 45, dy: -60,
    },
    {
      date: parseDate("Nov 1 2009"),
      title: "Decade high",
      label: "Stock closes in on $136 as the retail + early-cloud growth story takes hold.",
      dx: -150, dy: 60,
    },
  ],
  GOOG: [
    {
      date: parseDate("Aug 1 2004"),
      title: "IPO",
      label: "Google IPOs in Aug 2004; a decade late to this chart, but not to growth.",
      dx: 80, dy: -45,
    },
    {
      date: parseDate("Oct 1 2007"),
      title: "Tops $700",
      label: "Stock tops $700 for the first time, more than 6x its IPO price in three years.",
      dx: -100, dy: 110,
    },
    {
      date: parseDate("Nov 1 2008"),
      title: "Crisis trough",
      label: "The 2008 crisis erases well over half of Google's peak value.",
      dx: 40, dy: 55,
    },
  ],
  IBM: [
    {
      date: parseDate("Jan 1 2000"),
      title: "Decade starts",
      label: "IBM opens the decade near $100; already a mature blue chip, not a growth story.",
      dx: 40, dy: -60,
    },
    {
      date: parseDate("Sep 1 2002"),
      title: "Post-crash low",
      label: "Shares fall to ~$53 in the dot-com bust's aftermath.",
      dx: 40, dy: 55,
    },
    {
      date: parseDate("Dec 1 2009"),
      title: "Decade's end",
      label: "A decade and two crashes; later, IBM closes only modestly above its Jan 2000 price.",
      dx: -170, dy: 60,
    },
  ],
  MSFT: [
    {
      date: parseDate("Apr 1 2000"),
      title: "Antitrust ruling",
      label: "A federal judge rules Microsoft violated antitrust law; a breakup order follows in June.",
      dx: 45, dy: -55,
    },
    {
      date: parseDate("Oct 1 2007"),
      title: "Decade high",
      label: "Shares briefly reach $35; still below where many investors bought in the late '90s.",
      dx: -190, dy: -10,
    },
    {
      date: parseDate("Mar 1 2010"),
      title: "Decade's end",
      label: "Stock closes the decade below its Jan 2000 starting price of $39.81; a net loss for a buy-and-hold decade.",
      dx: -110, dy: 55,
    },
  ],
};

function renderEventBands(g, bands, xScale, innerHeight) {
  const bandG = g.append("g").attr("class", "event-bands");
  bands.forEach((b) => {
    const x0 = xScale(b.start);
    const x1 = xScale(b.end);
    const grp = bandG.append("g").attr("class", "event-band");
    grp
      .append("rect")
      .attr("x", x0)
      .attr("y", 0)
      .attr("width", Math.max(0, x1 - x0))
      .attr("height", innerHeight);
    grp
      .append("text")
      .attr("x", x0 + 6)
      .attr("y", 14)
      .text(b.label);
  });
}

const ANNOTATION_BG = "#22262f";
const ANNOTATION_FG = "#f5f4f0";

function renderPointAnnotations(g, items, xAccessor, yAccessor) {
  const annotations = items.map((d) => ({
    note: {
      title: d.title,
      label: d.label,
      wrap: 190,
      padding: 8,
      bg: { fill: ANNOTATION_BG, padding: 8 },
    },
    x: xAccessor(d),
    y: yAccessor(d),
    dx: d.dx,
    dy: d.dy,
    color: [ANNOTATION_BG],
    subject: { radius: 4 },
  }));

  const makeAnnotations = d3
    .annotation()
    .type(d3.annotationLabel)
    .annotations(annotations);

  g.append("g").attr("class", "annotation-group").call(makeAnnotations);
}

window.Annotations = {
  OVERVIEW_EVENT_BANDS,
  COMPANY_ANNOTATIONS,
  renderEventBands,
  renderPointAnnotations,
};
