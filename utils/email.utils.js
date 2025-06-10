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
    // Check if OTP and email are provided
    const user = await userServices.getUserByEmail(email);
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
    const user = await userServices.getByEmail(email);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "Not Found",
        message: "User not found."
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        error: "Already Verified",
        message: "The email address is already verified."
      });
    }

    // Generate a new OTP
    const otpObject = EmailUtlis.generateOtp();

    // Update the user
    user.otp = otpObject.otp;
    user.otpExpires = otpObject.otpExpires;

    // Save the user
    await user.save();

    const emailResponse = await mailerUtils.otpMailForUser({
      body: {
        receiverEmail: email,
        subject: 'Email Verification',
        userName: `${user.firstName} ${user.lastName}`,
        otpType: 'resend',
        otp: otpObject.otp
      }
    }, res);

    if (emailResponse && emailResponse.status !== 'success') {
      return res.status(500).json({ error: 'Failed to send email.' });
    }

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
                  background: url('https://images.unsplash.com/photo-1526256262350-7da7584cf5eb?ixlib=rb-4.0.3&auto=format&fit=crop&w=1050&q=80') no-repeat center center;
                  background-size: cover;
                  background-color: #e6f0fa;
                }
                table {
                  width: 100%;
                  max-width: 600px;
                  margin: 50px auto;
                  background-color: rgba(255, 255, 255, 0.96);
                  border-radius: 8px;
                  overflow: hidden;
                  box-shadow: 0 6px 20px rgba(0,0,0,0.1);
                }
                .header {
                  background-color: #0066cc;
                  color: #ffffff;
                  padding: 30px 20px;
                  text-align: center;
                }
                .header img {
                  width: 60px;
                  margin-bottom: 10px;
                }
                .header h1 {
                  margin: 0;
                  font-size: 28px;
                }
                .content {
                  padding: 25px 30px;
                  color: #333333;
                }
                .content h2 {
                  color: #0066cc;
                  font-size: 22px;
                  margin-top: 0;
                }
                .content p {
                  font-size: 16px;
                  line-height: 1.6;
                }
                .button {
                  display: inline-block;
                  background-color: #0066cc;
                  color: #ffffff;
                  padding: 12px 24px;
                  text-decoration: none;
                  border-radius: 6px;
                  margin: 20px 0;
                }
                .button:hover {
                  background-color: #004c99;
                }
                .footer {
                  background-color: #f1f1f1;
                  text-align: center;
                  padding: 20px;
                  color: #555555;
                  font-size: 13px;
                }
                .footer a {
                  color: #0066cc;
                  text-decoration: none;
                }
              </style>
            </head>
            <body>
              <table>
                <tr>
                  <td class="header">
                    <img src="https://i.imgur.com/YYC1Tff.png" alt="Kindify Logo" />
                    <h1>Welcome to Kindify!</h1>
                  </td>
                </tr>
                <tr>
                  <td class="content">
                    <h2>Hi ${name || 'there'},</h2>
                    <p>
                      We're excited to welcome you to <strong>Kindify</strong> — a platform built to connect <strong>compassionate donors</strong> and <strong>dedicated NGOs</strong> in a secure and impactful environment.
                    </p>
                    <p>
                      Whether you're here to <strong>support causes that matter</strong> or to <strong>create positive change in your community</strong>, Kindify is here to empower your journey.
                    </p>
                    <p>
                      From now on, you'll be able to stay updated on events, initiatives, donations, and inspiring stories — all in one trusted place.
                    </p>
                    <p style="text-align: center;">
                      <a href="${link || '#'}" class="button">Go to Your Kindify Dashboard</a>
                    </p>
                    <p>
                      If you need any help or have questions, our team is always ready to support you.
                    </p>
                    <p>Warm regards,<br><strong>The Kindify Team</strong></p>
                  </td>
                </tr>
                <tr>
                  <td class="footer">
                    <p>&copy; ${new Date().getFullYear()} Kindify. All rights reserved.</p>
                    <p><a href="https://kindify.org">www.kindify.org</a> | <a href="mailto:support@kindify.org">support@kindify.org</a></p>
                  </td>
                </tr>
              </table>
            </body>
            </html>


        `;

    // Define the email options
    const mailOptions = {
      from: `"Kindify" <${process.env.DISPLAY_EMAIL}>`, // sender address
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

  forgetPasswordMailForUser: async (req, res) => {
    const transporter = nodemailer.createTransport({
      service: process.env.SERVICE,
      auth: {
        user: process.env.MAIL_ID, // your Gmail address
        pass: process.env.MAIL_PASSWORD, // your Gmail password or app-specific password
      },
    });

    const { receiverEmail, subject, userName, otp } = req.body;

    // HTML template with dynamic values for password reset email
    const html = `<!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your OTP Code</title>
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
          background-color: #007BFF;
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
        .content p {
          font-size: 16px;
          line-height: 1.5;
        }
        .otp-code {
          font-size: 24px;
          font-weight: bold;
          text-align: center;
          margin: 20px 0;
          padding: 10px;
          background-color: #f4f4f4;
          border: 1px dashed #007BFF;
          color: #007BFF;
        }
        .footer {
          padding: 20px;
          text-align: center;
          background-color: #eeeeee;
          color: #777777;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <table>
        <tr>
          <td class="header">
            <h1>Your OTP Code</h1>
          </td>
        </tr>
        <tr>
          <td class="content">
            <p>Dear ${userName},</p>
            <p>To reset your password, please use the following One-Time Password (OTP). This code is valid for the next 10 minutes:</p>
            <div class="otp-code">
              ${otp}
            </div>
            <p>If you did not request this, please ignore this email or contact support immediately.</p>
            <p>Best regards,<br>The Lawzz Advocate Services Team</p>
          </td>
        </tr>
        <tr>
          <td class="footer">
            <p>&copy; 2024 Lawzz Advocate Services. All rights reserved.</p>
            <p>1234 Advocate Street, Legal City | (123) 456-7890 | support@lawzz.com</p>
          </td>
        </tr>
      </table>
    </body>
    </html>`;

    // Define the email options
    const mailOptions = {
      from: `"Lawzz Advocate Services" <${process.env.DISPLAY_EMAIL}>`, // sender address
      to: receiverEmail, // recipient address
      subject: subject, // email subject
      html: html, // email body with the HTML template
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

  forgetPasswordMailForUserWithSMTP: async (req, res) => {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST, // Your SMTP server address
      port: process.env.SMTP_PORT || 587, // SMTP port (587 for TLS or 465 for SSL)
      secure: process.env.SMTP_SECURE === 'true', // Use TLS (false) or SSL (true)
      auth: {
        user: process.env.SMTP_USER, // Your SMTP username (e.g., email address)
        pass: process.env.SMTP_PASSWORD, // Your SMTP password
      }
    });

    const { receiverEmail, subject, userName, otp } = req.body;

    // HTML template with dynamic values for password reset email
    const html = `<!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your OTP Code</title>
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
          background-color: #007BFF;
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
        .content p {
          font-size: 16px;
          line-height: 1.5;
        }
        .otp-code {
          font-size: 24px;
          font-weight: bold;
          text-align: center;
          margin: 20px 0;
          padding: 10px;
          background-color: #f4f4f4;
          border: 1px dashed #007BFF;
          color: #007BFF;
        }
        .footer {
          padding: 20px;
          text-align: center;
          background-color: #eeeeee;
          color: #777777;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <table>
        <tr>
          <td class="header">
            <h1>Your OTP Code</h1>
          </td>
        </tr>
        <tr>
          <td class="content">
            <p>Dear ${userName},</p>
            <p>To reset your password, please use the following One-Time Password (OTP). This code is valid for the next 10 minutes:</p>
            <div class="otp-code">
              ${otp}
            </div>
            <p>If you did not request this, please ignore this email or contact support immediately.</p>
            <p>Best regards,<br>The Lawzz Advocate Services Team</p>
          </td>
        </tr>
        <tr>
          <td class="footer">
            <p>&copy; 2024 Lawzz Advocate Services. All rights reserved.</p>
            <p>1234 Advocate Street, Legal City | (123) 456-7890 | support@lawzz.com</p>
          </td>
        </tr>
      </table>
    </body>
    </html>`;

    // Define the email options
    const mailOptions = {
      from: `"Lawzz Advocate Services" <${process.env.DISPLAY_EMAIL}>`, // sender address
      to: receiverEmail, // recipient address
      subject: subject, // email subject
      html: html, // email body with the HTML template
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

  otpMailForUser: async (req, res) => {
    const transporter = nodemailer.createTransport({
      service: process.env.SERVICE,
      auth: {
        user: process.env.MAIL_ID, // your Gmail address
        pass: process.env.MAIL_PASSWORD, // your Gmail password or app-specific password
      },
    });

    const { receiverEmail, subject, otp, name, otpType } = req.body;

    const mailOptions = {
      from: `"From Kindify Organization" <${process.env.DISPLAY_EMAIL}>`, // sender address
      to: receiverEmail, // recipient address
      subject: subject, // email subject
      text: `Hi ${name ? name : "there, "}\nYour ${otpType} OTP is : ${otp} \nThis OTP is valid for 5 minutes\nplease keep the otp confidential and not share with others.`
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending email:', error);
        return res.status(500).json({ message: 'Error sending email', error });
      }
      console.log('Message sent: %s', info.messageId);

      res.status(200).json({
        message: 'OTP sent successfully',
      });
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

    const { receiverEmail, subject, otp, userName, otpType } = req.body;

    const html = `
      <!DOCTYPE html>
  <html lang="en">
    <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="X-UA-Compatible" content="ie=edge" />
    <title>Static Template</title>

    <link
      href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&display=swap"
      rel="stylesheet"
    />
    </head>
    <body
    style="
      margin: 0;
      font-family: 'Poppins', sans-serif;
      background: #ffffff;
      font-size: 14px;
    "
    >
    <div
      style="
      max-width: 680px;
      margin: 0 auto;
      padding: 45px 30px 60px;
      background: #f4f7ff;
      background-image: url(https://archisketch-resources.s3.ap-northeast-2.amazonaws.com/vrstyler/1661497957196_595865/email-template-background-banner);
      background-repeat: no-repeat;
      background-size: 800px 452px;
      background-position: top center;
      font-size: 14px;
      color: #434343;
      "
    >
      <header>
      <table style="width: 100%;">
        <tbody>
        <tr style="height: 0;">
          <td>
          <img
            alt=""
            src="https://archisketch-resources.s3.ap-northeast-2.amazonaws.com/vrstyler/1663574980688_114990/archisketch-logo"
            height="30px"
          />
          </td>
          <td style="text-align: right;">
          <span
            style="font-size: 16px; line-height: 30px; color: #ffffff;"
            >${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span
          >
          </td>
        </tr>
        </tbody>
      </table>
      </header>

      <main>
      <div
        style="
        margin: 0;
        margin-top: 70px;
        padding: 92px 30px 115px;
        background: #ffffff;
        border-radius: 30px;
        text-align: center;
        "
      >
        <div style="width: 100%; max-width: 489px; margin: 0 auto;">
        <h1
          style="
          margin: 0;
          font-size: 24px;
          font-weight: 500;
          color: #1f1f1f;
          "
        >
          Your OTP
        </h1>
        <p
          style="
          margin: 0;
          margin-top: 17px;
          font-size: 16px;
          font-weight: 500;
          "
        >
          Hey ${userName},
        </p>
        <p
          style="
          margin: 0;
          margin-top: 17px;
          font-weight: 500;
          letter-spacing: 0.56px;
          "
        >
          Thank you for choosing Career Crush. Use the following OTP
          to complete the procedure to verify your email address. OTP is
          valid for
          <span style="font-weight: 600; color: #1f1f1f;">5 minutes</span>.
          Do not share this code with others, including Career Crush.
        </p>
        <p
          style="
          margin: 0;
          margin-top: 60px;
          font-size: 40px;
          font-weight: 600;
          letter-spacing: 25px;
          color: #ba3d4f;
          "
        >
          ${otp}
        </p>
        </div>
      </div>

      <p
        style="
        max-width: 400px;
        margin: 0 auto;
        margin-top: 90px;
        text-align: center;
        font-weight: 500;
        color: #8c8c8c;
        "
      >
        Need help? Ask at
        <a
        href="mailto:archisketch@gmail.com"
        style="color: #499fb6; text-decoration: none;"
        >Careercrush.helpdesk@support.com</a
        >
        or visit our
        <a
        href=""
        target="_blank"
        style="color: #499fb6; text-decoration: none;"
        >Help Center</a
        >
      </p>
      </main>

      <footer
      style="
        width: 100%;
        max-width: 490px;
        margin: 20px auto 0;
        text-align: center;
        border-top: 1px solid #e6ebf1;
      "
      >
      <p
        style="
        margin: 0;
        margin-top: 40px;
        font-size: 16px;
        font-weight: 600;
        color: #434343;
        "
      >
        Career Crush Foundation
      </p>
      <p style="margin: 0; margin-top: 8px; color: #434343;">
        Address 540, City, State.
      </p>
      <div style="margin: 0; margin-top: 16px;">
        <a href="" target="_blank" style="display: inline-block;">
        <img
          width="36px"
          alt="Facebook"
          src="https://archisketch-resources.s3.ap-northeast-2.amazonaws.com/vrstyler/1661502815169_682499/email-template-icon-facebook"
        />
        </a>
        <a
        href=""
        target="_blank"
        style="display: inline-block; margin-left: 8px;"
        >
        <img
          width="36px"
          alt="Instagram"
          src="https://archisketch-resources.s3.ap-northeast-2.amazonaws.com/vrstyler/1661504218208_684135/email-template-icon-instagram"
        /></a>
        <a
        href=""
        target="_blank"
        style="display: inline-block; margin-left: 8px;"
        >
        <img
          width="36px"
          alt="Twitter"
          src="https://archisketch-resources.s3.ap-northeast-2.amazonaws.com/vrstyler/1661503043040_372004/email-template-icon-twitter"
        />
        </a>
        <a
        href=""
        target="_blank"
        style="display: inline-block; margin-left: 8px;"
        >
        <img
          width="36px"
          alt="Youtube"
          src="https://archisketch-resources.s3.ap-northeast-2.amazonaws.com/vrstyler/1661503195931_210869/email-template-icon-youtube"
        /></a>
      </div>
      <p style="margin: 0; margin-top: 16px; color: #434343;">
        Copyright © 2022 Career Crush Foundation. All rights reserved.
      </p>
      </footer>
    </div>
    </body>
  </html>

    
    `

    const mailOptions = {
      from: `"Lawzz Advocate Services" <${process.env.DISPLAY_EMAIL}>`, // sender address
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