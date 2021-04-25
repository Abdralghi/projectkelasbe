const { mysqldb } = require("./../connection");
const {
  createAccessToken,
  createEmailVerifiedToken,
  createTokenRefresh,
} = require("./../helpers/createToken");
const fs = require("fs");
const hashpass = require("./../helpers/hashingpass");
const { v4: uuid4 } = require("uuid");
const { promisify } = require("util");
const path = require("path");
const handlebars = require("handlebars");
const transporter = require("./../helpers/transporter");
const dba = promisify(mysqldb.query).bind(mysqldb);

module.exports = {
  Register: async (req, res) => {
    try {
      const { email, username, password } = req.body;
      if (!email || !username || !password) {
        return res.status(500).send({ message: "bad request" });
      }
      let sql = `select * from users where username = ?`;
      // get username yang sama
      const datausers = await dba(sql, [username]);
      if (datausers.length) {
        // jika username sama
        return res.status(500).send({ message: "user telah terdaftar" });
      } else {
        sql = `insert into users set ?`;
        const iduser = uuid4();
        let data = {
          idusers: iduser,
          username: username,
          password: hashpass(password),
          email: email,
        };
        //insert users
        await dba(sql, data);
        sql = `select idusers,username,email,isverified,role from users where idusers = ?`;
        //get data lagi
        const datauser = await dba(sql, [iduser]);
        let filepath = path.resolve(
          __dirname,
          "../template/emailVerification.html"
        );
        const htmlrender = fs.readFileSync(filepath, "utf-8");
        const template = handlebars.compile(htmlrender);
        let dataToken = {
          idusers: datauser[0].idusers,
          username: datauser[0].username,
        };
        //buat token email,access,refresh
        const tokenEmail = createEmailVerifiedToken(dataToken);
        const tokenAccess = createAccessToken(dataToken);
        const tokenRefresh = createTokenRefresh(dataToken);
        const link = `http://localhost:3000/verified/` + tokenEmail;
        const htmltoemail = template({
          username: username,
          link: link,
        });
        //kirim email
        await transporter.sendMail({
          from: "sukuna",
          to: email,
          subject: "Verifikasi Email",
          html: htmltoemail,
        });
        //buat response header
        res.set("x-token-access", tokenAccess);
        res.set("x-token-refresh", tokenRefresh);
        //kirim data
        res.status(200).send({ ...datauser[0], cart: [] });
      }
    } catch (error) {
      console.log(error);
      return res.status(500).send({ message: "server error" });
    }
  },
  keeplogin: async (req, res) => {
    const { idusers } = req.user;
    sql = `select idusers,username,email,isverified,role from users where idusers = ?`;
    const datauser = await dba(sql, [idusers]);
    return res.status(200).send(datauser[0]);
  },
  login: async (req, res) => {
    try {
      const { emailorusername, password } = req.body;
      if (!emailorusername || !password) {
        return res.status(400).send({ message: "bad request" });
      }
      let sql = `select idusers,username,email,isverified,role from users where (username = ? or email = ?) and password = ?`;
      const datauser = await dba(sql, [
        emailorusername,
        emailorusername,
        hashpass(password),
      ]);
      if (datauser.length) {
        let dataToken = {
          idusers: datauser[0].idusers,
          username: datauser[0].username,
        };
        const tokenAccess = createAccessToken(dataToken);
        const tokenRefresh = createTokenRefresh(dataToken);
        res.set("x-token-access", tokenAccess);
        res.set("x-token-refresh", tokenRefresh);
        return res.status(200).send(datauser[0]);
      } else {
        return res.status(500).send({ message: "user tidak terdaftar" });
      }
    } catch (error) {
      console.log(error);
      return res.status(500).send({ message: "server error" });
    }
  },
};
