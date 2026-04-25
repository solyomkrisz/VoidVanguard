import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export async function sendResetEmail(email, token) {
  const resetLink = `http://127.0.0.1:3000/reset-password?token=${token}`;

  await transporter.sendMail({
    from: '"VoidVanguard" <voidvanguard@gmail.com>',
    to: email,
    subject: "Jelszóvisszaállítás",
    html: `
      <p>Jelszóvisszaállítást kértél</p>
      <a href="${resetLink}">Jelszó visszaállítása</a>
      <p>A link 30 percig érvényes.</p>
    `,
  });
}
