if (typeof process === "object" && process + "" === "[object process]") {
  exports.firebase = require("firebase-admin");
} else {
  exports.firebase = require("firebase");
}
