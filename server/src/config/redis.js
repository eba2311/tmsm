// Redis is temporarily disabled to guarantee server stability
module.exports = {
  isReady: false,
  get: async () => null,
  setEx: async () => {},
  keys: async () => [],
  del: async () => {},
  ping: async () => {}
};
