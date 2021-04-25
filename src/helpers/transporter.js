const { createTransport } = require("nodemailer");

let transporter = createTransport({
  service: "gmail",
  auth: {
    user: "algifari843@gmail.com",
    pass: "cczynulfglvfflfz",
  },
  tls: {
    rejectUnauthorized: false,
  },
});

module.exports = transporter;
