var jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
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
    // If token is not valid send 400
    res.status(400).send("Invalid token");
  }
};
