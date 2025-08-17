import nodemailer from 'nodemailer';
import { formatPrice } from './utils';

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  product: {
    id: string;
    name: string;
    version?: string;
  };
}

interface Order {
  id: string;
  amount: number;
  tax: number;
  total: number;
  createdAt: Date;
  items: OrderItem[];
}

interface License {
  id: string;
  key: string;
  product: {
    id: string;
    name: string;
    version?: string;
    downloadUrl?: string;
  };
}

// Create transporter
function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

// Email templates
function getEmailHeader() {
  return `
    <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="background: linear-gradient(90deg, #3b82f6, #8b5cf6); padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">SoftwareCo</h1>
        <p style="color: #e5e7eb; margin: 10px 0 0; font-size: 16px;">Your Software Marketplace</p>
      </div>
      <div style="padding: 30px; background: #ffffff;">
  `;
}

function getEmailFooter() {
  return `
      </div>
      <div style="background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 14px;">
        <p style="margin: 0;">© 2024 SoftwareCo. All rights reserved.</p>
        <p style="margin: 10px 0 0;">Need help? Contact us at support@softwareco.com</p>
      </div>
    </div>
  `;
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const transporter = createTransporter();
  const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${token}`;

  const htmlContent = `
    ${getEmailHeader()}
    <h2 style="color: #1f2937; margin-bottom: 20px;">Password Reset Request</h2>
    <p>You requested a password reset for your SoftwareCo account.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetUrl}" style="background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">Reset Password</a>
    </div>
    <p>This link will expire in 1 hour for security reasons.</p>
    <p>If you didn't request this password reset, please ignore this email or contact support if you have concerns.</p>
    ${getEmailFooter()}
  `;

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Password Reset Request - SoftwareCo',
    text: `You requested a password reset. Click here to reset: ${resetUrl}\n\nIf you didn't request this, ignore this email.`,
    html: htmlContent,
  };

  await transporter.sendMail(mailOptions);
}

export async function sendOrderConfirmationEmail(email: string, userName: string, order: Order, licenses: License[]) {
  const transporter = createTransporter();

  const itemsHtml = order.items.map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">
        <strong>${item.product.name}</strong>
        ${item.product.version ? `<br><small>Version ${item.product.version}</small>` : ''}
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatPrice(item.price)}</td>
    </tr>
  `).join('');

  const licensesHtml = licenses.map(license => `
    <div style="background: #f3f4f6; padding: 20px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #3b82f6;">
      <h4 style="margin: 0 0 10px; color: #1f2937;">${license.product.name}</h4>
      <p style="margin: 5px 0;"><strong>License Key:</strong></p>
      <code style="background: #e5e7eb; padding: 8px 12px; border-radius: 4px; font-family: monospace; display: block; word-break: break-all;">${license.key}</code>
      ${license.product.downloadUrl ? `
        <p style="margin: 15px 0 5px;"><strong>Download:</strong></p>
        <a href="${license.product.downloadUrl}" style="color: #3b82f6; text-decoration: none;">Download ${license.product.name}</a>
      ` : ''}
    </div>
  `).join('');

  const htmlContent = `
    ${getEmailHeader()}
    <h2 style="color: #059669; margin-bottom: 20px;">✅ Order Confirmed!</h2>
    <p>Hi ${userName},</p>
    <p>Thank you for your purchase! Your order has been processed successfully and your license keys are ready.</p>
    
    <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin: 0 0 15px; color: #065f46;">Order Details</h3>
      <p style="margin: 5px 0;"><strong>Order ID:</strong> ${order.id}</p>
      <p style="margin: 5px 0;"><strong>Date:</strong> ${order.createdAt.toLocaleDateString()}</p>
    </div>

    <h3 style="color: #1f2937; margin: 30px 0 15px;">Items Purchased</h3>
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <thead>
        <tr style="background: #f9fafb;">
          <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Product</th>
          <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">Qty</th>
          <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">Price</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="2" style="padding: 12px; text-align: right; border-top: 2px solid #e5e7eb;"><strong>Subtotal:</strong></td>
          <td style="padding: 12px; text-align: right; border-top: 2px solid #e5e7eb;"><strong>${formatPrice(order.amount)}</strong></td>
        </tr>
        ${order.tax > 0 ? `
        <tr>
          <td colspan="2" style="padding: 12px; text-align: right;"><strong>Tax:</strong></td>
          <td style="padding: 12px; text-align: right;"><strong>${formatPrice(order.tax)}</strong></td>
        </tr>
        ` : ''}
        <tr>
          <td colspan="2" style="padding: 12px; text-align: right; border-top: 1px solid #e5e7eb;"><strong>Total:</strong></td>
          <td style="padding: 12px; text-align: right; border-top: 1px solid #e5e7eb; color: #059669;"><strong>${formatPrice(order.total)}</strong></td>
        </tr>
      </tfoot>
    </table>

    <h3 style="color: #1f2937; margin: 30px 0 15px;">🔑 Your License Keys</h3>
    <p>Keep these license keys safe - you'll need them to activate your software:</p>
    ${licensesHtml}

    <div style="background: #eff6ff; border: 1px solid #bfdbfe; padding: 20px; border-radius: 8px; margin: 30px 0;">
      <h4 style="margin: 0 0 10px; color: #1e40af;">Next Steps:</h4>
      <ul style="margin: 0; padding-left: 20px;">
        <li>Download your software using the links above</li>
        <li>Use your license keys during installation</li>
        <li>Visit your <a href="${process.env.NEXTAUTH_URL}/account" style="color: #3b82f6;">account dashboard</a> to manage your licenses</li>
      </ul>
    </div>

    <p>If you have any questions or need help with installation, don't hesitate to contact our support team.</p>
    <p>Thank you for choosing SoftwareCo!</p>
    ${getEmailFooter()}
  `;

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: `Order Confirmation #${order.id.slice(-8)} - SoftwareCo`,
    html: htmlContent,
  };

  await transporter.sendMail(mailOptions);
}

export async function sendWelcomeEmail(email: string, name: string) {
  const transporter = createTransporter();

  const htmlContent = `
    ${getEmailHeader()}
    <h2 style="color: #3b82f6; margin-bottom: 20px;">🎉 Welcome to SoftwareCo!</h2>
    <p>Hi ${name},</p>
    <p>Welcome to SoftwareCo, your trusted software marketplace! We're excited to have you join our community.</p>
    
    <div style="background: #f0f9ff; border: 1px solid #bae6fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin: 0 0 15px; color: #0c4a6e;">What you can do with your account:</h3>
      <ul style="margin: 0; padding-left: 20px; color: #0f172a;">
        <li>Browse our extensive software catalog</li>
        <li>Purchase and instantly download software</li>
        <li>Manage your license keys</li>
        <li>Track your order history</li>
        <li>Get support when you need it</li>
      </ul>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXTAUTH_URL}/products" style="background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; margin-right: 15px;">Browse Products</a>
      <a href="${process.env.NEXTAUTH_URL}/account" style="background: transparent; color: #3b82f6; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; border: 2px solid #3b82f6;">My Account</a>
    </div>

    <p>If you have any questions, feel free to reach out to our support team. We're here to help!</p>
    <p>Happy shopping!</p>
    ${getEmailFooter()}
  `;

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Welcome to SoftwareCo! 🎉',
    html: htmlContent,
  };

  await transporter.sendMail(mailOptions);
}