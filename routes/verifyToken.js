var jwt = require("jsonwebtoken");

module.exports = (allowUnauthenticatedUsers = false) => {
  return (req, res, next) => {
    // Get authorization header
    const bearerHeader = req.headers["authorization"];

    // If there is no token return 401
    if (typeof bearerHeader === "undefined")
      return res.status(401).send("Access Denied");

    // Get token from authorization header
    const token = bearerHeader.split(" ")[1];

    try {
      // Verify token
      const verified = jwt.verify(token, process.env.TOKEN_SECRET);
      req.user = verified;
      next();
    } catch (err) {
      if (allowUnauthenticatedUsers) next();
      else res.status(400).send("Invalid token");
    }
  };
};
