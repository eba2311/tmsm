function paginate(query, { page = 1, limit = 20 } = {}) {
  const p = Math.max(1, Number(page) || 1);
  const l = Math.max(1, Number(limit) || 20);
  const skip = (p - 1) * l;
  return { skip, limit: l, page: p };
}

module.exports = { paginate };
