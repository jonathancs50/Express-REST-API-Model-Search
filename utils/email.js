const nodemailer = require("nodemailer");
const ejs = require("ejs");
const path = require("path");
const htmlToText = require("html-to-text");
const mg = require("nodemailer-mailgun-transport");

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(" ")[0];
    this.url = url;
    this.from = `Jonathan <${process.env.EMAIL_FROM}>`;
  }

  newTransport() {
    if (process.env.NODE_ENV === "production") {
      // Mailgun configuration for production
      return nodemailer.createTransport(
        mg({
          auth: {
            api_key: process.env.MAILGUN_API_KEY,
            domain: process.env.MAILGUN_DOMAIN,
          },
        })
      );
    }

    // Mailtrap configuration for development
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async send(template, subject) {
    try {
      // 1) Render the HTML based on the ejs template
      const html = await ejs.renderFile(
        path.join(__dirname, "..", "views", "emails", `${template}.ejs`),
        {
          firstName: this.firstName,
          url: this.url,
          subject,
        }
      );

      // 2) Define the email options
      const mailOptions = {
        from: this.from,
        to: this.to,
        subject,
        html,
        text: htmlToText.htmlToText(html),
      };

      // 3) Create a transport and send the email
      const info = await this.newTransport().sendMail(mailOptions);
      return info;
    } catch (error) {
      console.error("Error sending email:", error);
      throw error; // Re-throw the error so it can be handled by the caller
    }
  }

  async sendWelcome() {
    await this.send("welcome", "Welcome to the Model Scout Pro Family!");
  }

  async sendPasswordReset() {
    await this.send("passwordReset", "Reset your password - Model Scout Pro");
  }
};
