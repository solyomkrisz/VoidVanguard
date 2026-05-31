/**
 * Kezdobarat magyarazat:
 * Fajl: backend/service/emails.js
 * Szerep: Service reteg: uzleti logika, adatmuveletek, tobb komponens osszefuzese.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASSWORD,
  },
});

export async function sendResetEmail(email, token) {
  const resetLink = `http://127.0.0.1:3000/reset-password?token=${token}`;

  await transporter.sendMail({
    from: '"VoidVanguard" <voidvanguard@gmail.com>',
    to: email,
    subject: "Jelszóvisszaállítás – VoidVanguard",
    html: `<!DOCTYPE html>
<html lang="hu">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Jelszóvisszaállítás</title>
</head>
<body style="margin:0;padding:0;background:#06060f;font-family:'Courier New',monospace;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#06060f;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;">

          <!-- Header / logo area -->
          <tr>
            <td align="center" style="padding-bottom:28px;">
              <div style="font-size:28px;font-weight:bold;color:#6ab8ff;letter-spacing:0.15em;text-transform:uppercase;text-shadow:none;">
                &#9670; VOID VANGUARD &#9670;
              </div>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="
              background:#1a1a28;
              border:4px solid #4a90e2;
              outline:2px solid #0d0d15;
              padding:32px 36px 28px;
              box-shadow:0 8px 0 #0d0d15,0 12px 24px rgba(0,0,0,0.9);
            ">

              <!-- Title bar -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:22px;">
                <tr>
                  <td style="
                    background:#4a90e2;
                    border:2px solid #6ab8ff;
                    padding:10px 16px;
                    text-align:center;
                    font-size:18px;
                    color:#fff;
                    text-transform:uppercase;
                    letter-spacing:0.08em;
                    text-shadow:1px 1px 0 #000;
                  ">
                    Jelszóvisszaállítás
                  </td>
                </tr>
              </table>

              <!-- Body text -->
              <p style="color:#b8d4f0;font-size:15px;line-height:1.65;margin:0 0 10px;">
                Jelszóvisszaállítást kértél a <strong style="color:#eaf6ff;">VoidVanguard</strong> fiókodhoz.
              </p>
              <p style="color:#b8d4f0;font-size:15px;line-height:1.65;margin:0 0 24px;">
                Kattints az alábbi gombra az új jelszó beállításához. A link <strong style="color:#eaf6ff;">30 percig</strong> érvényes.
              </p>

              <!-- CTA button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td align="center">
                    <a href="${resetLink}" style="
                      display:inline-block;
                      padding:13px 32px;
                      background:#4a90e2;
                      color:#fff;
                      text-decoration:none;
                      font-size:15px;
                      font-weight:bold;
                      text-transform:uppercase;
                      letter-spacing:0.12em;
                      border:3px solid #6ab8ff;
                      outline:2px solid #0d0d15;
                      box-shadow:0 5px 0 #2a5a9e,0 5px 14px rgba(0,0,0,0.7);
                      text-shadow:1px 1px 0 #000;
                    ">
                      &#128274; Jelszó visszaállítása
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <hr style="border:none;border-top:2px solid rgba(74,144,226,0.25);margin:0 0 18px;" />

              <!-- Fallback link -->
              <p style="color:#5c8ab8;font-size:12px;line-height:1.6;margin:0 0 6px;">
                Ha a gomb nem működik, másold be ezt a linket a böngésződbe:
              </p>
              <p style="margin:0;">
                <a href="${resetLink}" style="color:#6ab8ff;font-size:12px;word-break:break-all;">${resetLink}</a>
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:20px;">
              <p style="color:#2a4a6e;font-size:12px;margin:0;">
                Ha nem te kérted ezt az emailt, figyelmen kívül hagyhatod. Fiókod biztonságos.
              </p>
              <p style="color:#1e3652;font-size:11px;margin:6px 0 0;">
                &copy; VoidVanguard
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  });
}
