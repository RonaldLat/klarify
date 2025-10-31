/**
 * @fileoverview Payment service - handles Paystack integration
 */
import { PAYSTACK_SECRET_KEY } from "$env/static/private";
import { PUBLIC_APP_URL } from "$env/static/public";

/**
 * Initialize a Paystack payment
 * @param {Object} params
 * @param {string} params.email - User email
 * @param {number} params.amount - Amount in KES
 * @param {Object} params.metadata - Additional data
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export async function initializePayment({ email, amount, metadata }) {
  try {
    const response = await fetch(
      "https://api.paystack.co/transaction/initialize",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          amount: Math.round(amount * 100), // Convert to kobo/cents
          currency: "KES",
          callback_url: `${PUBLIC_APP_URL}/checkout/verify`,
          metadata,
        }),
      },
    );

    const data = await response.json();

    if (!data.status) {
      console.error("Paystack initialization failed:", data);
      return {
        success: false,
        error: data.message || "Payment initialization failed",
      };
    }

    return {
      success: true,
      data: {
        authorization_url: data.data.authorization_url,
        access_code: data.data.access_code,
        reference: data.data.reference,
      },
    };
  } catch (error) {
    console.error("Payment initialization error:", error);
    return {
      success: false,
      error: error.message || "Failed to initialize payment",
    };
  }
}

/**
 * Verify a Paystack payment
 * @param {string} reference - Payment reference
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export async function verifyPayment(reference) {
  try {
    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
      },
    );

    const data = await response.json();

    if (!data.status) {
      console.error("Paystack verification failed:", data);
      return {
        success: false,
        error: data.message || "Payment verification failed",
      };
    }

    if (data.data.status !== "success") {
      return {
        success: false,
        error: "Payment was not successful",
      };
    }

    return {
      success: true,
      data: {
        reference: data.data.reference,
        amount: data.data.amount / 100, // Convert from kobo
        currency: data.data.currency,
        status: data.data.status,
        metadata: data.data.metadata,
        paid_at: data.data.paid_at,
      },
    };
  } catch (error) {
    console.error("Payment verification error:", error);
    return {
      success: false,
      error: error.message || "Failed to verify payment",
    };
  }
}

/**
 * Get transaction details
 * @param {string} reference - Payment reference
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export async function getTransaction(reference) {
  try {
    const response = await fetch(
      `https://api.paystack.co/transaction/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
      },
    );

    const data = await response.json();

    if (!data.status) {
      return {
        success: false,
        error: data.message || "Failed to get transaction",
      };
    }

    return {
      success: true,
      data: data.data,
    };
  } catch (error) {
    console.error("Get transaction error:", error);
    return {
      success: false,
      error: error.message || "Failed to get transaction",
    };
  }
}

/**
 * Calculate Paystack fee (they charge 1.5% + KES 100 cap)
 * @param {number} amount - Amount in KES
 * @returns {number} Fee amount
 */
export function calculatePaystackFee(amount) {
  const fee = Math.round(amount * 0.015);
  return Math.min(fee, 100); // Capped at KES 100
}
