function normalizeLayout(layout) {
  return layout === "4x7" ? "4x7" : "7x4";
}

module.exports = { normalizeLayout };
