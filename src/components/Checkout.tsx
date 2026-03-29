"use client";

import { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

function CheckoutForm({ clientSecret, availableCount }: { clientSecret: string; availableCount: number }) {
  const stripe = useStripe();
  const elements = useElements();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [purchasedKey, setPurchasedKey] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/?payment_intent=${clientSecret}`,
      },
      redirect: 'if_required',
    });

    if (error) {
      setErrorMessage(error.message ?? "An unknown error occurred");
      setIsLoading(false);
    } else if (paymentIntent && paymentIntent.status === "succeeded") {
      setIsSuccess(true);
      // Wait a moment for webhook to process, then fetch the key
      setTimeout(() => fetchPurchasedKey(paymentIntent.id), 2000);
    } else {
      setIsLoading(false);
    }
  };

  const fetchPurchasedKey = async (piId: string) => {
    try {
      const response = await fetch(`/api/get-key?pi=${piId}`);
      if (response.ok) {
        const data = await response.json();
        setPurchasedKey(data.key);
      } else {
        // Retry once after another delay if it takes a bit longer
        setTimeout(async () => {
          const retryResponse = await fetch(`/api/get-key?pi=${piId}`);
          if (retryResponse.ok) {
            const data = await retryResponse.json();
            setPurchasedKey(data.key);
          } else {
             setErrorMessage("Payment succeeded, but failed to retrieve your key. Please contact support.");
          }
        }, 3000);
      }
    } catch (e) {
      console.error(e);
      setErrorMessage("Error fetching key.");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (purchasedKey) {
      navigator.clipboard.writeText(purchasedKey);
      alert("Copied to clipboard!");
    }
  };

  if (isSuccess) {
    return (
      <div className="mt-8 border border-black p-6 text-center">
        <h2 className="text-xl font-bold mb-4">Payment Successful</h2>
        <p className="mb-4">Here is your ashwish UI license key:</p>

        {purchasedKey ? (
          <div className="mb-6">
            <div className="font-mono bg-gray-100 p-4 border border-black break-all text-sm mb-4">
              {purchasedKey}
            </div>
            <button
              onClick={copyToClipboard}
              className="bg-black text-white px-6 py-2 border border-black hover:bg-white hover:text-black transition-colors"
            >
              Copy to Clipboard
            </button>
          </div>
        ) : (
          <div className="py-8 animate-pulse">
            Generating your unique key...
          </div>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
      <PaymentElement />
      <button
        disabled={isLoading || !stripe || !elements || availableCount === 0}
        type="submit"
        className={`w-full py-3 border font-medium transition-colors ${
          availableCount === 0
            ? "bg-[#AAAAAA] text-black border-[#AAAAAA] cursor-not-allowed"
            : "bg-black text-white border-black hover:bg-white hover:text-black"
        }`}
      >
        {isLoading ? "Processing..." : availableCount === 0 ? "OUT OF STOCK" : "Purchase - $1.00"}
      </button>
      {errorMessage && <div className="text-red-600 text-sm mt-2">{errorMessage}</div>}
    </form>
  );
}

export default function Checkout({ availableCount }: { availableCount: number }) {
  const [clientSecret, setClientSecret] = useState("");
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // Only attempt to create PI if there are keys available
    if (availableCount > 0) {
      fetch("/api/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
        .then((res) => {
          if (!res.ok) throw new Error("Failed to initialize checkout");
          return res.json();
        })
        .then((data) => {
          if (isMounted) setClientSecret(data.clientSecret);
        })
        .catch((err) => {
          console.error(err);
        })
        .finally(() => {
          if (isMounted) setIsInitializing(false);
        });
    } else {
      setTimeout(() => {
        if (isMounted) setIsInitializing(false);
      }, 0);
    }

    return () => { isMounted = false; };
  }, [availableCount]);

  if (availableCount === 0) {
    return (
      <div className="mt-8">
        <button
          disabled
          className="w-full py-3 bg-[#AAAAAA] text-black border border-[#AAAAAA] font-medium cursor-not-allowed"
        >
          OUT OF STOCK
        </button>
      </div>
    );
  }

  if (isInitializing) {
    return <div className="mt-8 py-8 text-center text-sm text-gray-500 animate-pulse">Loading secure checkout...</div>;
  }

  if (!clientSecret) {
    return <div className="mt-8 py-8 text-center text-sm text-red-500">Checkout is currently unavailable. Please try again later.</div>;
  }

  return (
    <div className="mt-8">
      <Elements options={{ clientSecret, appearance: { theme: 'stripe', variables: { colorBackground: '#ffffff', colorText: '#000000', borderRadius: '0px' } } }} stripe={stripePromise}>
        <CheckoutForm clientSecret={clientSecret} availableCount={availableCount} />
      </Elements>
    </div>
  );
}