module.exports = {
  getHealth: async (req, res) => {
    try {
      const healthCheck = {
        uptime: process.uptime(),
        message: "OK",
        timestamp: Date.now(),
      };
      res.success(healthCheck);
    } catch (err) {
      res.error(err);
    }
  },
  getVersion: async (req, res) => {
    try {
      const versionCheck = {
        version: process.version,
      };
      res.success(versionCheck);
    } catch (err) {
      res.error(err);
    }
  },
  getEnvironment: async (req, res) => {
    try {
      const environmentCheck = {
        environment: process.env.NODE_ENV,
      };
      res.success(environmentCheck);
    } catch (err) {
      res.error(err);
    }
  },
};
