import nodemailer from 'nodemailer';

// Email service configuration
const createTransporter = () => {
  // For development, use Gmail SMTP or a service like Ethereal Email
  // For production, use a proper email service (SendGrid, AWS SES, etc.)
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER || process.env.EMAIL_USER,
      pass: process.env.SMTP_PASS || process.env.EMAIL_PASSWORD,
    },
  });

  return transporter;
};

export const sendOTPEmail = async (email: string, otp: string): Promise<void> => {
  // In development mode without SMTP config, just log the OTP
  const isDevelopment = process.env.NODE_ENV !== 'production';
  const hasSmtpConfig = !!(process.env.SMTP_USER || process.env.EMAIL_USER) && 
                         !!(process.env.SMTP_PASS || process.env.EMAIL_PASSWORD);

  if (isDevelopment && !hasSmtpConfig) {
    console.log(`[DEV MODE] Password reset OTP for ${email}: ${otp}`);
    return;
  }

  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.SMTP_USER || 'noreply@tfireviews.com',
      to: email,
      subject: 'TFI Reviews - Password Reset Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #007AFF;">Password Reset Request</h2>
          <p>You requested to reset your password for TFI Reviews.</p>
          <p>Your verification code is:</p>
          <div style="background-color: #2a2a2a; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <h1 style="color: #007AFF; font-size: 32px; letter-spacing: 4px; margin: 0;">${otp}</h1>
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #333; margin: 20px 0;" />
          <p style="color: #999; font-size: 12px;">TFI Reviews Team</p>
        </div>
      `,
      text: `Password Reset Request\n\nYour verification code is: ${otp}\n\nThis code will expire in 10 minutes.\n\nIf you didn't request this, please ignore this email.`,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Password reset email sent to ${email}`);
  } catch (error: any) {
    console.error('Error sending email:', error.message);
    // In development, log the OTP instead of failing
    if (isDevelopment) {
      console.log(`[DEV MODE] Password reset OTP for ${email}: ${otp}`);
    } else {
      throw new Error('Failed to send email');
    }
  }
};
