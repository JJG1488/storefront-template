import { Resend } from "resend";
import { getStoreConfig } from "./store";

// Initialize Resend client
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

// Email "from" address - uses store name or defaults
function getFromAddress(): string {
  const store = getStoreConfig();
  const storeName = store.name || "Store";
  // Resend requires a verified domain or onboarding@resend.dev for testing
  const fromEmail = process.env.EMAIL_FROM || "onboarding@resend.dev";
  return `${storeName} <${fromEmail}>`;
}

// Get store owner email for notifications
function getOwnerEmail(): string | null {
  return process.env.STORE_OWNER_EMAIL || null;
}

interface OrderItem {
  product_name: string;
  quantity: number;
  price_at_time: number;
  is_digital?: boolean;
  download_url?: string; // Download token for digital products
}

interface OrderDetails {
  orderId: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shippingCost: number;
  discountAmount?: number;
  couponCode?: string | null;
  total: number;
  shippingAddress?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
  hasDigitalItems?: boolean;
}

/**
 * Send order confirmation email to customer
 */
export async function sendOrderConfirmation(order: OrderDetails): Promise<boolean> {
  if (!resend) {
    console.log("Resend not configured, skipping order confirmation email");
    return false;
  }

  const store = getStoreConfig();
  const brandColor = store.primaryColor || "#6366f1";

  const itemsHtml = order.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eee;">
          ${item.product_name}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">
          ${item.quantity}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">
          $${(item.price_at_time / 100).toFixed(2)}
        </td>
      </tr>
    `
    )
    .join("");

  const addressHtml = order.shippingAddress
    ? `
      <div style="margin-top: 20px; padding: 15px; background: #f9fafb; border-radius: 8px;">
        <strong>Shipping Address:</strong><br>
        ${order.customerName}<br>
        ${order.shippingAddress.line1 || ""}<br>
        ${order.shippingAddress.line2 ? order.shippingAddress.line2 + "<br>" : ""}
        ${order.shippingAddress.city || ""}, ${order.shippingAddress.state || ""} ${order.shippingAddress.postal_code || ""}<br>
        ${order.shippingAddress.country || ""}
      </div>
    `
    : "";

  // Build digital downloads section
  const digitalItems = order.items.filter(item => item.is_digital && item.download_url);
  const storeUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || "";

  const downloadsHtml = digitalItems.length > 0
    ? `
      <div style="margin-top: 30px; padding: 20px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px;">
        <h3 style="color: #1d4ed8; margin: 0 0 15px 0; display: flex; align-items: center;">
          &#128229; Your Digital Downloads
        </h3>
        <p style="color: #1e40af; margin: 0 0 15px 0; font-size: 14px;">
          Click below to download your digital products. Links are valid for multiple downloads.
        </p>
        ${digitalItems.map(item => `
          <div style="background: white; border-radius: 6px; padding: 12px; margin-bottom: 10px;">
            <a href="${storeUrl}/api/download/${item.download_url}"
               style="color: #2563eb; text-decoration: none; font-weight: 500;">
              &#10145; ${item.product_name}
            </a>
          </div>
        `).join("")}
        <p style="color: #6b7280; font-size: 12px; margin: 15px 0 0 0;">
          Save these links - you can download your files anytime.
        </p>
      </div>
    `
    : "";

  // Adjust message based on order type
  const orderMessage = digitalItems.length === order.items.length
    ? "Your digital products are ready for download below!"
    : digitalItems.length > 0
    ? "We've received your order. Your digital products are ready below, and physical items will ship soon."
    : "We've received your order and are getting it ready. We'll notify you when it ships.";

  try {
    await resend.emails.send({
      from: getFromAddress(),
      to: order.customerEmail,
      subject: `Order Confirmed - #${order.orderId.slice(0, 8)}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: ${brandColor}; margin-bottom: 10px;">${store.name}</h1>
            <p style="color: #666; font-size: 14px;">Order Confirmation</p>
          </div>

          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin-bottom: 30px; text-align: center;">
            <div style="font-size: 40px; margin-bottom: 10px;">&#10003;</div>
            <h2 style="color: #166534; margin: 0;">Thank you for your order!</h2>
            <p style="color: #166534; margin: 10px 0 0 0;">Order #${order.orderId.slice(0, 8)}</p>
          </div>

          <p>Hi ${order.customerName},</p>
          <p>${orderMessage}</p>

          <h3 style="border-bottom: 2px solid ${brandColor}; padding-bottom: 10px; margin-top: 30px;">Order Summary</h3>

          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #f9fafb;">
                <th style="padding: 12px; text-align: left;">Item</th>
                <th style="padding: 12px; text-align: center;">Qty</th>
                <th style="padding: 12px; text-align: right;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div style="margin-top: 20px; text-align: right;">
            <p style="margin: 5px 0;"><strong>Subtotal:</strong> $${(order.subtotal / 100).toFixed(2)}</p>
            ${order.tax > 0 ? `<p style="margin: 5px 0;"><strong>Tax:</strong> $${(order.tax / 100).toFixed(2)}</p>` : ""}
            ${order.shippingCost > 0 ? `<p style="margin: 5px 0;"><strong>Shipping:</strong> $${(order.shippingCost / 100).toFixed(2)}</p>` : ""}
            ${order.discountAmount && order.discountAmount > 0 ? `<p style="margin: 5px 0; color: #16a34a;"><strong>Discount${order.couponCode ? ` (${order.couponCode})` : ""}:</strong> -$${(order.discountAmount / 100).toFixed(2)}</p>` : ""}
            <p style="margin: 10px 0; font-size: 18px;"><strong>Total:</strong> $${(order.total / 100).toFixed(2)}</p>
          </div>

          ${addressHtml}

          ${downloadsHtml}

          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 12px;">
            <p>If you have any questions, reply to this email.</p>
            <p>&copy; ${new Date().getFullYear()} ${store.name}. All rights reserved.</p>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Order confirmation email sent to:", order.customerEmail);
    return true;
  } catch (error) {
    console.error("Failed to send order confirmation email:", error);
    return false;
  }
}

/**
 * Send new order notification to store owner
 */
export async function sendNewOrderAlert(order: OrderDetails): Promise<boolean> {
  if (!resend) {
    console.log("Resend not configured, skipping new order alert");
    return false;
  }

  const ownerEmail = getOwnerEmail();
  if (!ownerEmail) {
    console.log("Store owner email not configured, skipping alert");
    return false;
  }

  const store = getStoreConfig();

  const itemsList = order.items
    .map((item) => `- ${item.product_name} x${item.quantity} ($${(item.price_at_time / 100).toFixed(2)})`)
    .join("\n");

  try {
    await resend.emails.send({
      from: getFromAddress(),
      to: ownerEmail,
      subject: `New Order! #${order.orderId.slice(0, 8)} - $${(order.total / 100).toFixed(2)}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <h2 style="color: #92400e; margin: 0 0 10px 0;">New Order Received!</h2>
            <p style="margin: 0; color: #92400e;">Order #${order.orderId.slice(0, 8)}</p>
          </div>

          <h3>Customer</h3>
          <p>
            <strong>${order.customerName}</strong><br>
            ${order.customerEmail}
          </p>

          ${order.shippingAddress ? `
            <h3>Shipping Address</h3>
            <p>
              ${order.shippingAddress.line1 || ""}<br>
              ${order.shippingAddress.line2 ? order.shippingAddress.line2 + "<br>" : ""}
              ${order.shippingAddress.city || ""}, ${order.shippingAddress.state || ""} ${order.shippingAddress.postal_code || ""}<br>
              ${order.shippingAddress.country || ""}
            </p>
          ` : ""}

          <h3>Items</h3>
          <pre style="background: #f9fafb; padding: 15px; border-radius: 8px; white-space: pre-wrap;">${itemsList}</pre>

          ${order.discountAmount && order.discountAmount > 0 ? `
            <p style="color: #16a34a;"><strong>Discount${order.couponCode ? ` (${order.couponCode})` : ""}:</strong> -$${(order.discountAmount / 100).toFixed(2)}</p>
          ` : ""}

          <h3>Total: $${(order.total / 100).toFixed(2)}</h3>

          <p style="margin-top: 30px;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || ""}/admin/orders/${order.orderId}"
               style="display: inline-block; background: ${store.primaryColor || "#6366f1"}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">
              View Order in Admin
            </a>
          </p>
        </body>
        </html>
      `,
    });

    console.log("New order alert sent to store owner:", ownerEmail);
    return true;
  } catch (error) {
    console.error("Failed to send new order alert:", error);
    return false;
  }
}

/**
 * Send admin setup email after store deployment
 * This is sent when a new store is deployed so the owner can set their password
 */
export async function sendAdminSetupEmail(
  email: string,
  setupUrl: string
): Promise<boolean> {
  if (!resend) {
    console.log("Resend not configured, skipping admin setup email");
    return false;
  }

  const store = getStoreConfig();
  const brandColor = store.primaryColor || "#6366f1";

  try {
    await resend.emails.send({
      from: getFromAddress(),
      to: email,
      subject: `Welcome! Set Up Your Admin Password - ${store.name}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: ${brandColor}; margin-bottom: 10px;">${store.name}</h1>
            <p style="color: #666; font-size: 14px;">Your Store is Live!</p>
          </div>

          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin-bottom: 30px; text-align: center;">
            <div style="font-size: 40px; margin-bottom: 10px;">&#127881;</div>
            <h2 style="color: #166534; margin: 0 0 10px 0;">Congratulations!</h2>
            <p style="color: #166534; margin: 0;">Your store has been successfully deployed.</p>
          </div>

          <p>Your store is now live! To access your admin dashboard, you'll need to set up your password.</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${setupUrl}"
               style="display: inline-block; background: ${brandColor}; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600;">
              Set Your Admin Password
            </a>
          </div>

          <p style="color: #666; font-size: 14px;">
            This link will expire in 24 hours. If it expires, you can request a new one by clicking "Forgot Password" on the admin login page.
          </p>

          <div style="margin-top: 30px; padding: 15px; background: #f9fafb; border-radius: 8px;">
            <p style="margin: 0 0 10px 0; font-weight: 600;">What's next?</p>
            <ul style="margin: 0; padding-left: 20px; color: #555;">
              <li>Set your admin password using the link above</li>
              <li>Add products to your store</li>
              <li>Customize your store settings</li>
              <li>Start accepting orders!</li>
            </ul>
          </div>

          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 12px;">
            <p>This is an automated message from ${store.name}.</p>
            <p>&copy; ${new Date().getFullYear()} ${store.name}. All rights reserved.</p>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Admin setup email sent to:", email);
    return true;
  } catch (error) {
    console.error("Failed to send admin setup email:", error);
    return false;
  }
}

/**
 * Send password reset email to store admin
 */
export async function sendPasswordResetEmail(
  email: string,
  resetUrl: string
): Promise<boolean> {
  if (!resend) {
    console.log("Resend not configured, skipping password reset email");
    return false;
  }

  const store = getStoreConfig();
  const brandColor = store.primaryColor || "#6366f1";

  try {
    await resend.emails.send({
      from: getFromAddress(),
      to: email,
      subject: `Reset Your Admin Password - ${store.name}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: ${brandColor}; margin-bottom: 10px;">${store.name}</h1>
            <p style="color: #666; font-size: 14px;">Admin Password Reset</p>
          </div>

          <div style="background: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
            <h2 style="color: #92400e; margin: 0 0 10px 0;">Password Reset Requested</h2>
            <p style="color: #92400e; margin: 0;">Someone requested a password reset for your admin account.</p>
          </div>

          <p>Click the button below to set a new password. This link will expire in 1 hour.</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}"
               style="display: inline-block; background: ${brandColor}; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600;">
              Reset Password
            </a>
          </div>

          <p style="color: #666; font-size: 14px;">
            If you didn't request this reset, you can safely ignore this email. Your password will remain unchanged.
          </p>

          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 12px;">
            <p>This is an automated message from ${store.name}.</p>
            <p>&copy; ${new Date().getFullYear()} ${store.name}. All rights reserved.</p>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Password reset email sent to:", email);
    return true;
  } catch (error) {
    console.error("Failed to send password reset email:", error);
    return false;
  }
}

/**
 * Send shipping notification to customer
 */
export async function sendShippingNotification(
  customerEmail: string,
  customerName: string,
  orderId: string,
  trackingNumber?: string,
  trackingUrl?: string
): Promise<boolean> {
  if (!resend) {
    console.log("Resend not configured, skipping shipping notification");
    return false;
  }

  const store = getStoreConfig();
  const brandColor = store.primaryColor || "#6366f1";

  try {
    await resend.emails.send({
      from: getFromAddress(),
      to: customerEmail,
      subject: `Your order has shipped! #${orderId.slice(0, 8)}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: ${brandColor}; margin-bottom: 10px;">${store.name}</h1>
          </div>

          <div style="background: #dbeafe; border: 1px solid #93c5fd; border-radius: 8px; padding: 20px; margin-bottom: 30px; text-align: center;">
            <div style="font-size: 40px; margin-bottom: 10px;">&#128230;</div>
            <h2 style="color: #1e40af; margin: 0;">Your order is on its way!</h2>
            <p style="color: #1e40af; margin: 10px 0 0 0;">Order #${orderId.slice(0, 8)}</p>
          </div>

          <p>Hi ${customerName},</p>
          <p>Great news! Your order has shipped and is on its way to you.</p>

          ${trackingNumber ? `
            <div style="margin: 30px 0; padding: 20px; background: #f9fafb; border-radius: 8px;">
              <p style="margin: 0;"><strong>Tracking Number:</strong></p>
              <p style="margin: 5px 0; font-size: 18px; font-family: monospace;">${trackingNumber}</p>
              ${trackingUrl ? `
                <p style="margin-top: 15px;">
                  <a href="${trackingUrl}" style="color: ${brandColor}; text-decoration: underline;">
                    Track your package
                  </a>
                </p>
              ` : ""}
            </div>
          ` : ""}

          <p>Thank you for shopping with us!</p>

          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 12px;">
            <p>If you have any questions, reply to this email.</p>
            <p>&copy; ${new Date().getFullYear()} ${store.name}. All rights reserved.</p>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Shipping notification sent to:", customerEmail);
    return true;
  } catch (error) {
    console.error("Failed to send shipping notification:", error);
    return false;
  }
}

/**
 * Send contact form submission to store owner
 */
export async function sendContactFormEmail(
  fromName: string,
  fromEmail: string,
  subject: string,
  message: string
): Promise<boolean> {
  if (!resend) {
    console.log("Resend not configured, skipping contact form email");
    return false;
  }

  const ownerEmail = getOwnerEmail();
  if (!ownerEmail) {
    console.log("Store owner email not configured, skipping contact form");
    return false;
  }

  const store = getStoreConfig();
  const brandColor = store.primaryColor || "#6366f1";

  const subjectLabels: Record<string, string> = {
    general: "General Inquiry",
    order: "Order Question",
    shipping: "Shipping & Delivery",
    returns: "Returns & Exchanges",
    product: "Product Information",
    other: "Other",
  };

  try {
    await resend.emails.send({
      from: getFromAddress(),
      to: ownerEmail,
      reply_to: fromEmail,
      subject: `Contact Form: ${subjectLabels[subject] || subject} - ${store.name}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: ${brandColor}; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0;">New Contact Form Message</h2>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">${store.name}</p>
          </div>

          <div style="border: 1px solid #e5e7eb; border-top: none; padding: 20px; border-radius: 0 0 8px 8px;">
            <div style="margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #666; font-size: 14px;">From</p>
              <p style="margin: 5px 0 0 0; font-weight: 600;">${fromName}</p>
              <p style="margin: 2px 0 0 0;"><a href="mailto:${fromEmail}" style="color: ${brandColor};">${fromEmail}</a></p>
            </div>

            <div style="margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #666; font-size: 14px;">Subject</p>
              <p style="margin: 5px 0 0 0; font-weight: 600;">${subjectLabels[subject] || subject}</p>
            </div>

            <div>
              <p style="margin: 0; color: #666; font-size: 14px;">Message</p>
              <div style="margin-top: 10px; padding: 15px; background: #f9fafb; border-radius: 8px; white-space: pre-wrap;">${message}</div>
            </div>

            <div style="margin-top: 30px;">
              <a href="mailto:${fromEmail}?subject=Re: ${subjectLabels[subject] || subject}"
                 style="display: inline-block; background: ${brandColor}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">
                Reply to ${fromName}
              </a>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Contact form email sent to store owner:", ownerEmail);
    return true;
  } catch (error) {
    console.error("Failed to send contact form email:", error);
    return false;
  }
}

/**
 * Send newsletter welcome email to new subscriber
 */
export async function sendNewsletterWelcome(email: string): Promise<boolean> {
  if (!resend) {
    console.log("Resend not configured, skipping newsletter welcome");
    return false;
  }

  const store = getStoreConfig();
  const brandColor = store.primaryColor || "#6366f1";

  try {
    await resend.emails.send({
      from: getFromAddress(),
      to: email,
      subject: `Welcome to ${store.name}!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: ${brandColor}; margin-bottom: 10px;">${store.name}</h1>
          </div>

          <div style="background: linear-gradient(135deg, ${brandColor}20, ${brandColor}10); border: 1px solid ${brandColor}30; border-radius: 12px; padding: 30px; margin-bottom: 30px; text-align: center;">
            <div style="font-size: 48px; margin-bottom: 15px;">🎉</div>
            <h2 style="color: ${brandColor}; margin: 0 0 10px 0;">You're In!</h2>
            <p style="color: #666; margin: 0;">Welcome to the ${store.name} community</p>
          </div>

          <p>Thanks for subscribing to our newsletter!</p>

          <p>You'll be the first to know about:</p>
          <ul style="padding-left: 20px; color: #555;">
            <li>New product launches</li>
            <li>Exclusive discounts & promotions</li>
            <li>Behind-the-scenes updates</li>
            <li>Special member-only offers</li>
          </ul>

          <div style="margin: 30px 0; text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || ""}"
               style="display: inline-block; background: ${brandColor}; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600;">
              Shop Now
            </a>
          </div>

          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 12px;">
            <p>You're receiving this because you subscribed to ${store.name}.</p>
            <p>&copy; ${new Date().getFullYear()} ${store.name}. All rights reserved.</p>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Newsletter welcome email sent to:", email);
    return true;
  } catch (error) {
    console.error("Failed to send newsletter welcome email:", error);
    return false;
  }
}

/**
 * Send low stock alert to store owner
 */
export async function sendLowStockAlert(product: {
  id: string;
  name: string;
  currentStock: number;
  threshold: number;
}): Promise<boolean> {
  if (!resend) {
    console.log("Resend not configured, skipping low stock alert");
    return false;
  }

  const ownerEmail = getOwnerEmail();
  if (!ownerEmail) {
    console.log("Store owner email not configured, skipping low stock alert");
    return false;
  }

  const store = getStoreConfig();
  const brandColor = store.primaryColor || "#6366f1";
  const adminUrl = process.env.NEXT_PUBLIC_APP_URL || "";

  try {
    await resend.emails.send({
      from: getFromAddress(),
      to: ownerEmail,
      subject: `Low Stock Alert: ${product.name}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: ${brandColor}; margin-bottom: 10px;">${store.name}</h1>
          </div>

          <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin-bottom: 30px; text-align: center;">
            <div style="font-size: 40px; margin-bottom: 10px;">&#9888;&#65039;</div>
            <h2 style="color: #b45309; margin: 0;">Low Stock Alert</h2>
          </div>

          <p>Hi,</p>
          <p>Your product <strong>"${product.name}"</strong> is running low on stock.</p>

          <div style="margin: 30px 0; padding: 20px; background: #f9fafb; border-radius: 8px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666;">Current Stock:</td>
                <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #b45309;">${product.currentStock} units</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Alert Threshold:</td>
                <td style="padding: 8px 0; text-align: right;">${product.threshold} units</td>
              </tr>
            </table>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${adminUrl}/admin/products/${product.id}"
               style="display: inline-block; background: ${brandColor}; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600;">
              View Product in Admin
            </a>
          </div>

          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 12px;">
            <p>This is an automated inventory alert from ${store.name}.</p>
            <p>&copy; ${new Date().getFullYear()} ${store.name}. All rights reserved.</p>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Low stock alert sent for product:", product.name);
    return true;
  } catch (error) {
    console.error("Failed to send low stock alert:", error);
    return false;
  }
}

/**
 * Send password reset email to customer
 */
export async function sendCustomerPasswordResetEmail(
  email: string,
  customerName: string,
  resetUrl: string
): Promise<boolean> {
  if (!resend) {
    console.log("Resend not configured, skipping customer password reset email");
    return false;
  }

  const store = getStoreConfig();
  const brandColor = store.primaryColor || "#6366f1";

  try {
    await resend.emails.send({
      from: getFromAddress(),
      to: email,
      subject: `Reset Your Password - ${store.name}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: ${brandColor}; margin-bottom: 10px;">${store.name}</h1>
            <p style="color: #666; font-size: 14px;">Password Reset</p>
          </div>

          <div style="background: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
            <h2 style="color: #92400e; margin: 0 0 10px 0;">Password Reset Requested</h2>
            <p style="color: #92400e; margin: 0;">Someone requested a password reset for your account.</p>
          </div>

          <p>Hi ${customerName},</p>
          <p>Click the button below to set a new password. This link will expire in 1 hour.</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}"
               style="display: inline-block; background: ${brandColor}; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600;">
              Reset Password
            </a>
          </div>

          <p style="color: #666; font-size: 14px;">
            If you did not request this reset, you can safely ignore this email. Your password will remain unchanged.
          </p>

          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 12px;">
            <p>This is an automated message from ${store.name}.</p>
            <p>&copy; ${new Date().getFullYear()} ${store.name}. All rights reserved.</p>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Customer password reset email sent to:", email);
    return true;
  } catch (error) {
    console.error("Failed to send customer password reset email:", error);
    return false;
  }
}

/**
 * Send welcome email to new customer after registration
 */
export async function sendCustomerWelcomeEmail(
  email: string,
  customerName: string
): Promise<boolean> {
  if (!resend) {
    console.log("Resend not configured, skipping customer welcome email");
    return false;
  }

  const store = getStoreConfig();
  const brandColor = store.primaryColor || "#6366f1";
  const storeUrl = process.env.NEXT_PUBLIC_APP_URL || "";

  try {
    await resend.emails.send({
      from: getFromAddress(),
      to: email,
      subject: `Welcome to ${store.name}!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: ${brandColor}; margin-bottom: 10px;">${store.name}</h1>
          </div>

          <div style="background: linear-gradient(135deg, ${brandColor}20, ${brandColor}10); border: 1px solid ${brandColor}30; border-radius: 12px; padding: 30px; margin-bottom: 30px; text-align: center;">
            <div style="font-size: 48px; margin-bottom: 15px;">&#127881;</div>
            <h2 style="color: ${brandColor}; margin: 0 0 10px 0;">Welcome, ${customerName}!</h2>
            <p style="color: #666; margin: 0;">Your account has been created successfully.</p>
          </div>

          <p>Thanks for creating an account with us!</p>

          <p>With your account, you can:</p>
          <ul style="padding-left: 20px; color: #555;">
            <li>Track your orders in real-time</li>
            <li>View your order history</li>
            <li>Save addresses for faster checkout</li>
            <li>Get exclusive offers and updates</li>
          </ul>

          <div style="margin: 30px 0; text-align: center;">
            <a href="${storeUrl}/account"
               style="display: inline-block; background: ${brandColor}; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600;">
              Visit Your Account
            </a>
          </div>

          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 12px;">
            <p>If you have any questions, reply to this email.</p>
            <p>&copy; ${new Date().getFullYear()} ${store.name}. All rights reserved.</p>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Customer welcome email sent to:", email);
    return true;
  } catch (error) {
    console.error("Failed to send customer welcome email:", error);
    return false;
  }
}
