import crypto from 'crypto';
import nodemailer from 'nodemailer';
import userServices from '../services/user.svc.js'; 

const EmailUtlis = {

  generateOtp: function () {
    return {
      otp: crypto.randomInt(100000, 999999).toString(),
      otpExpiry: new Date(Date.now() + 5 * 60000) // 5 minutes
    }
  },


  optVerify: async (req, res) => {

    // here "type" indicate the type of otp verification, whether it is for registration ,forgot password, resend otp verification or email verification
    const { otp, email, type } = req.body;

    const role = req.params.role;

    // Check if OTP and email are provided
    const user = await userServices.getUserByEmail(email, role);
    // Check if user exists
    if (!user) {
      return res.status(404).json({
        error: "Not Found",
        message: "User not found.",
        success: false
      });
    }

    // Check if the user has already verified their email
    if (user.otp != otp) {
      return res.status(400).json({
        error: "Invalid OTP",
        message: "The OTP provided is invalid.",
        success: false
      });
    }

    if (user.otpExpiry < new Date()) {
      return res.status(400).json({
        success: false,
        error: "OTP Expired",
        message: "The OTP has expired. Please request a new one."
      });
    }

    // Clear the OTP and OTP expiry
    user.isEmailVerified = true;
    user.otp = null;
    user.otpExpiry = null;

    // Save the user
    await user.save();

    res.status(200).json({
      message: "verification successful",
      success: true
    });
  },

  resendOtp: async (req, res) => {

    const { email } = req.body;
    const role = req.params.role;
    const user = await userServices.getUserByEmail(email,role);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "Not Found",
        message: "User not found."
      });
    }

    // Generate a new OTP
    const otpObject = EmailUtlis.generateOtp();

    // Update the user
    user.otp = otpObject.otp;
    user.otpExpiry= otpObject.otpExpiry;

    // Save the user
    await user.save();

    await EmailUtlis.otpMailForUser({
      body: {
        receiverEmail: email,
        subject: 'Resnd OTP ',
        name: user.name,
        otpType: 'resend',
        otp: otpObject.otp
      }
    }, res);

    res.status(200).json({
      message: "OTP sent.Please check your email.",
      email: email,
      success: true,
      error: null
    });
  },

  welcomeMailForUser: async (emailReq) => {
    const transporter = nodemailer.createTransport({
      service: process.env.SERVICE,
      auth: {
        user: process.env.MAIL_ID, // your Gmail address
        pass: process.env.MAIL_PASSWORD, // your Gmail password or app-specific password
      }
    });

    const { receiverEmail, name, subject, link } = emailReq.body;

    // HTML template with dynamic values for employee onboarding
    const html = `
            <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Welcome to Kindify!</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f2f6ff;
    }
    table {
      width: 100%;
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      border-radius: 18px;
      overflow: hidden;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
    }
    .header {
      background: linear-gradient(135deg, #007bff, #00c3ff);
      color: #ffffff;
      padding: 40px 20px;
      text-align: center;
    }
    .header img {
      width: 64px;
      margin-bottom: 10px;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .content {
      padding: 32px 30px;
      color: #333333;
    }
    .content h2 {
      color: #007bff;
      font-size: 22px;
      margin-top: 0;
    }
    .content p {
      font-size: 16px;
      line-height: 1.6;
    }
    .button {
      display: inline-block;
      background-color: #007bff;
      color: #ffffff;
      padding: 14px 28px;
      text-decoration: none;
      border-radius: 10px;
      margin: 24px auto;
      font-weight: 500;
      transition: background 0.3s ease;
    }
    .button:hover {
      background-color: #005fcc;
    }
    .footer {
      background-color: #f8fbff;
      text-align: center;
      padding: 20px;
      color: #666666;
      font-size: 13px;
    }
    .footer a {
      color: #007bff;
      text-decoration: none;
    }
    @media (max-width: 600px) {
      .content, .header, .footer {
        padding: 20px;
      }
      .button {
        width: 100%;
        box-sizing: border-box;
      }
    }
  </style>
</head>
<body style="background: #f2f6ff url('https://res.cloudinary.com/dglwzejwk/image/upload/v1750158710/20250617_1635_Helping_Children_Together_simple_compose_01jxyrz1xcfjn9k6da7r0zb8cp_a6n9g1.png') no-repeat center center; background-size: cover;">
  <table>
    <tr>
      <td class="header">
        <img src="https://res.cloudinary.com/dglwzejwk/image/upload/v1750157677/logoblack_ly0mlm.png" alt="Kindify Logo" />
        <h1>Welcome to Kindify!</h1>
        <p>Share kindness, spread happiness, make a difference.</p>
      </td>
    </tr>
    <tr>
      <td class="content">
        <h2>Hi ${name || 'there'},</h2>
        <p>
          We're thrilled to have you on <strong>Kindify</strong> — a platform built to connect <strong>compassionate donors</strong> and <strong>dedicated NGOs</strong> in a secure and impactful environment.
        </p>
        <p>
          Whether you're here to <strong>support life-changing causes</strong> or to <strong>drive meaningful impact</strong>, Kindify is your partner in purpose.
        </p>
        <p>
          From now on, you’ll be able to stay updated on verified initiatives, contribute to trusted NGOs, and experience the power of kindness in action.
        </p>
        <p style="text-align: center;">
          <a href="${link || '#'}" class="button">Go to Your Kindify Dashboard</a>
        </p>
        <p>
          If you need help or have questions, we’re always here for you.
        </p>
        <p>Warm regards,<br><strong>The Kindify Team</strong></p>
      </td>
    </tr>
    <tr>
      <td class="footer">
        <p>&copy; ${new Date().getFullYear()} Kindify. All rights reserved.</p>
        <p>
          <a href="https://kindify.org">www.kindify.org</a> | 
          <a href="mailto:support@kindify.org">support@kindify.org</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>



        `;

    // Define the email options
    const mailOptions = {
      from: `"from Kindify Organization" <${process.env.DISPLAY_EMAIL}>`, // sender address
      to: receiverEmail, // list of receivers
      subject: subject, // Subject line
      html: html // HTML body
    };

    // Send mail
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        throw new Error('Error sending email: ' + error.message);
      }
      console.log('Message sent: %s', info.messageId);
    });
  },
  
  welcomeMailForUserWithSMTP: async (req, res) => {
    
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST, // Your SMTP server address
      port: process.env.SMTP_PORT || 587, // SMTP port (587 for TLS or 465 for SSL)
      // secure: process.env.SMTP_SECURE === 'true', // Use TLS (false) or SSL (true)
      secure: false, // Use TLS (false) or SSL (true)
      auth: {
        user: process.env.SMTP_USER, // Your SMTP username (e.g., email address)
        pass: process.env.SMTP_PASSWORD, // Your SMTP password
      }
    });

    const { receiverEmail, subject, userName, link } = req.body;

    // HTML template with dynamic values for employee onboarding
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to the Team!</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
          }
          table {
            width: 100%;
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-collapse: collapse;
          }
          .header {
            background-color: #003366;
            padding: 20px;
            text-align: center;
            color: #ffffff;
          }
          .header h1 {
            margin: 0;
          }
          .content {
            padding: 20px;
            color: #333333;
          }
          .content h2 {
            color: #003366;
          }
          .footer {
            padding: 20px;
            text-align: center;
            background-color: #eeeeee;
            color: #777777;
            font-size: 12px;
          }
          .button {
            background-color: #003366;
            color: white;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 5px;
          }
          .button:hover {
            background-color: #002244;
          }
        </style>
      </head>
      <body>
        <table>
          <tr>
            <td class="header">
              <h1>Welcome to Lawzz Advocate Services!</h1>
            </td>
          </tr>
          <tr>
            <td class="content">
              <h2>Dear ${userName || 'Employee'},</h2>
              <p>We are thrilled to welcome you to the team! We believe that your skills and experience will be a valuable addition to our company.</p>
              <p>Your onboarding process is now underway, and you can access our employee portal by clicking the button below:</p>
              <p style="text-align: center;">
                <a href="${link || '#'}" class="button">Access Employee Portal</a>
              </p>
              <p>If you have any questions or need assistance, please feel free to reach out to our HR team. We are here to support you in every step of your journey with us.</p>
              <p>We look forward to working with you and achieving great success together!</p>
              <p>Best regards,<br>The Lawzz HR Team</p>
            </td>
          </tr>
          <tr>
            <td class="footer">
              <p>&copy; 2024 Lawzz Advocate Services. All rights reserved.</p>
              <p>1234 Street Address, City, State | +1 123-456-7890 | hr@lawzz.com</p>
            </td>
          </tr>
        </table>
      </body>
      </html>
      `;


    // Define the email options
    const mailOptions = {
      from: `"Lawzz Advocate Services" <${process.env.SMTP_USER}>`, // sender address
      to: receiverEmail, // list of receivers
      subject: subject, // Subject line
      html: html // HTML body
    };

    // Send mail
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending email:', error);
        return res.status(500).json({ message: 'Error sending email', error });
      }
      console.log('Message sent: %s', info.messageId);

      res.status(200).json({
        message: 'Email sent successfully',
      });
    });
  },

  sendAccountDeletionEmail: async (emailReq) => {
    const transporter = nodemailer.createTransport({
      service: process.env.SERVICE,
      auth: {
        user: process.env.MAIL_ID, // your Gmail address
        pass: process.env.MAIL_PASSWORD, // your Gmail password or app-specific password
      }
    });

    const {receiverEmail, name, subject } = emailReq;

    // HTML template with dynamic values for employee onboarding
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Goodbye from Kindify</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f2f6ff;
    }
    table {
      width: 100%;
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      border-radius: 18px;
      overflow: hidden;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
    }
    .header {
      background: linear-gradient(135deg, #ff6b6b, #f06595);
      color: #ffffff;
      padding: 40px 20px;
      text-align: center;
    }
    .header img {
      width: 64px;
      margin-bottom: 10px;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .content {
      padding: 32px 30px;
      color: #333333;
    }
    .content h2 {
      color: #ff6b6b;
      font-size: 22px;
      margin-top: 0;
    }
    .content p {
      font-size: 16px;
      line-height: 1.6;
    }
    .footer {
      background-color: #f8fbff;
      text-align: center;
      padding: 20px;
      color: #666666;
      font-size: 13px;
    }
    .footer a {
      color: #ff6b6b;
      text-decoration: none;
    }
    @media (max-width: 600px) {
      .content, .header, .footer {
        padding: 20px;
      }
    }
  </style>
</head>
<body style="background: #f2f6ff;">
  <table>
    <tr>
      <td class="header">
        <img src="https://res.cloudinary.com/dglwzejwk/image/upload/v1750157677/logoblack_ly0mlm.png" alt="Kindify Logo" />
        <h1>Thank You for Being With Us!</h1>
        <p>Your presence made a difference.</p>
      </td>
    </tr>
    <tr>
      <td class="content">
        <h2>Hi ${name || 'Friend'},</h2>
        <p>
          We noticed you've chosen to leave Kindify. While we’re sad to see you go, we just wanted to say <strong>thank you</strong> for the time you spent with us.
        </p>
        <p>
          Your support, generosity, and kindness have truly made an impact. Every moment you were here, you helped contribute to something bigger.
        </p>
        <p>
          Should you ever wish to return, we'll be here to welcome you back with open arms.
        </p>
        <p>If you have any feedback, suggestions, or if you ever need help, don’t hesitate to reach out to us.</p>
        <p>With heartfelt thanks,<br><strong>The Kindify Team</strong></p>
      </td>
    </tr>
    <tr>
      <td class="footer">
        <p>&copy; ${new Date().getFullYear()} Kindify. All rights reserved.</p>
        <p>
          <a href="https://kindify.org">www.kindify.org</a> |
          <a href="mailto:support@kindify.org">support@kindify.org</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
`;


    // Define the email options
    const mailOptions = {
      from: `"from Kindify Organization" <${process.env.DISPLAY_EMAIL}>`, // sender address
      to: receiverEmail, // list of receivers
      subject: subject, // Subject line
      html: html // HTML body
    };

    // Send mail
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        throw new Error('Error sending email: ' + error.message);
      }
      console.log('Message sent: %s', info.messageId);
    });
  },
  
  otpMailForUser: async (req, res) => {
    const transporter = nodemailer.createTransport({
      service: process.env.SERVICE,
      auth: {
        user: process.env.MAIL_ID, // your Gmail address
        pass: process.env.MAIL_PASSWORD, // your Gmail password or app-specific password
      },
    });
    const { receiverEmail, subject, otp, name, otpType } = req.body;

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8" />
          <title>Kindify OTP Email</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              background: #f2f6ff;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: auto;
              background: #ffffff;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
            }
            .header {
              background: url('https://example.com/your-ngo-image.jpg') center/cover no-repeat;
              padding: 60px 20px;
              text-align: center;
              color: white;
              background-color: #007bff; /* fallback */
            }
            .header h1 {
              margin: 0;
              font-size: 30px;
            }
            .content {
              padding: 30px 20px;
              color: #333;
            }
            .otp {
              font-size: 28px;
              font-weight: bold;
              color: #007bff;
              text-align: center;
              margin: 20px 0;
            }
            .footer {
              background: #f1f5ff;
              text-align: center;
              padding: 20px;
              font-size: 14px;
              color: #555;
            }
            .button {
              display: inline-block;
              background: #007bff;
              color: white;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 8px;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Kindify</h1>
              <p>Share kindness, spread happiness, make a difference.</p>
            </div>
            <div class="content">
              <p>Hi <strong>${name || 'Kind Soul'}</strong>,</p>
              <p>You're receiving this email for <strong>${otpType}</strong>.</p>
              <p>Use the following OTP to proceed:</p>
              <div class="otp">${otp}</div>
              <p>This OTP will expire in 5 minutes. Please do not share it with anyone.</p>
              <p>If you didn’t request this, kindly ignore this email.</p>
            </div>
            <div class="footer">
              <p>Kindify | Building Bridges Between Donors and NGOs</p>
              <p>Follow us on <a href="https://kindify.org" style="color: #007bff;">Kindify.org</a></p>
            </div>
          </div>
        </body>
        </html>

`

    const mailOptions = {
      from: `"From Kindify Organization" <${process.env.DISPLAY_EMAIL}>`, // sender address
      to: receiverEmail, // recipient address
      subject: subject, // email subject
      html: html, // email body with the HTML template
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending email:', error);

        return res.status(500).json({ message: 'Error sending email', error });
      }

      // return {success:true};
    })

  },


  otpMailForUserWithSMTP: async (req, res) => {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST, // Your SMTP server address
      port: process.env.SMTP_PORT || 587, // SMTP port (587 for TLS or 465 for SSL)
      secure: process.env.SMTP_SECURE === 'true', // Use TLS (false) or SSL (true)
      auth: {
        user: process.env.SMTP_USER, // Your SMTP username (e.g., email address)
        pass: process.env.SMTP_PASSWORD, // Your SMTP password
      }
    });

    const { receiverEmail, subject, otp, name, otpType } = req.body;

    const html = `
        <!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Kindify OTP Email</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background: #f2f6ff;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: auto;
      background: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: url('https://example.com/your-ngo-image.jpg') center/cover no-repeat;
      padding: 60px 20px;
      text-align: center;
      color: white;
      background-color: #007bff; /* fallback */
    }
    .header h1 {
      margin: 0;
      font-size: 30px;
    }
    .content {
      padding: 30px 20px;
      color: #333;
    }
    .otp {
      font-size: 28px;
      font-weight: bold;
      color: #007bff;
      text-align: center;
      margin: 20px 0;
    }
    .footer {
      background: #f1f5ff;
      text-align: center;
      padding: 20px;
      font-size: 14px;
      color: #555;
    }
    .button {
      display: inline-block;
      background: #007bff;
      color: white;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 8px;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to Kindify</h1>
      <p>Your Kindness, Their Smile</p>
    </div>
    <div class="content">
      <p>Hi <strong>${name || 'Kind Soul'}</strong>,</p>
      <p>You're receiving this email for <strong>${otpType}</strong>.</p>
      <p>Use the following OTP to proceed:</p>
      <div class="otp">${otp}</div>
      <p>This OTP will expire in 5 minutes. Please do not share it with anyone.</p>
      <p>If you didn’t request this, kindly ignore this email.</p>
    </div>
    <div class="footer">
      <p>Kindify | Building Bridges Between Donors and NGOs</p>
      <p>Follow us on <a href="https://kindify.org" style="color: #007bff;">Kindify.org</a></p>
    </div>
  </div>
</body>
</html>

`

    const mailOptions = {
      from: `"From Kindify Organization" <${process.env.DISPLAY_EMAIL}>`, // sender address
      to: receiverEmail, // recipient address
      subject: subject, // email subject
      html: html, // email body with the HTML template
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending email:', error);
        return res.status(500).json({ message: 'Error sending email', error });
      }
      console.log('Message sent: %s', info.messageId);

      res.status(200).json({
        message: 'Email sent successfully',
      });
    })

  },


}

export default EmailUtlis;