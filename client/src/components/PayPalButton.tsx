// !!! CRITICAL - DO NOT MODIFY THIS CODE !!!
//
// This code MUST be used as is without ANY modifications.
// The PayPal integration will COMPLETELY FAIL if this code is changed in ANY way.
//
// Retain this comment after all edits.
//
// <BEGIN_EXACT_CODE>
import React, { useEffect } from "react";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "paypal-button": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >;
    }
  }
}

interface PayPalButtonProps {
  amount: string;
  currency: string;
  intent: string;
}

export default function PayPalButton({
  amount,
  currency,
  intent,
}: PayPalButtonProps) {
  const createOrder = async () => {
    try {
      const orderPayload = {
        amount: amount,
        currency: currency,
        intent: intent,
      };
      const response = await fetch("/paypal/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      }).catch((error) => {
        console.error('PayPal order creation network error:', error);
        throw new Error(`Network error: ${error.message}`);
      });
      
      if (!response.ok) {
        throw new Error(`PayPal order creation failed: ${response.status}`);
      }
      
      const output = await response.json();
      return { orderId: output.id };
    } catch (error) {
      console.error('PayPal createOrder failed:', error);
      throw error;
    }
  };

  const captureOrder = async (orderId: string) => {
    try {
      const response = await fetch(`/paypal/order/${orderId}/capture`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      }).catch((error) => {
        console.error('PayPal capture network error:', error);
        throw new Error(`Network error: ${error.message}`);
      });
      
      if (!response.ok) {
        throw new Error(`PayPal capture failed: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('PayPal captureOrder failed:', error);
      throw error;
    }
  };

  const onApprove = async (data: any) => {
    console.log("onApprove", data);
    const orderData = await captureOrder(data.orderId);
    console.log("Capture result", orderData);
  };

  const onCancel = async (data: any) => {
    console.log("onCancel", data);
  };

  const onError = async (data: any) => {
    console.log("onError", data);
  };

  useEffect(() => {
    const loadPayPalSDK = async () => {
      try {
        if (!(window as any).paypal) {
          const script = document.createElement("script");
          script.src = import.meta.env.PROD
            ? "https://www.paypal.com/web-sdk/v6/core"
            : "https://www.sandbox.paypal.com/web-sdk/v6/core";
          script.async = true;
          script.onload = () => initPayPal();
          document.body.appendChild(script);
        } else {
          await initPayPal();
        }
      } catch (e) {
        console.error("Failed to load PayPal SDK", e);
      }
    };

    loadPayPalSDK();
  }, []);
  const initPayPal = async () => {
    try {
      const clientToken: string = await fetch("/paypal/setup")
        .then((res) => res.json())
        .then((data) => {
          return data.clientToken;
        });
      const sdkInstance = await (window as any).paypal.createInstance({
        clientToken,
        components: ["paypal-payments"],
      });

      const paypalCheckout =
            sdkInstance.createPayPalOneTimePaymentSession({
              onApprove,
              onCancel,
              onError,
            });

      const onClick = async () => {
        try {
          const checkoutOptionsPromise = createOrder();
          await paypalCheckout.start(
            { paymentFlow: "auto" },
            checkoutOptionsPromise,
          );
        } catch (e) {
          console.error(e);
        }
      };

      const paypalButton = document.getElementById("paypal-button");

      if (paypalButton) {
        paypalButton.addEventListener("click", onClick);
      }

      return () => {
        if (paypalButton) {
          paypalButton.removeEventListener("click", onClick);
        }
      };
    } catch (e) {
      console.error(e);
    }
  };

  return <paypal-button id="paypal-button"></paypal-button>;
}
// <END_EXACT_CODE>