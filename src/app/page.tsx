import { prisma } from "@/lib/prisma";
import Checkout from "@/components/Checkout";

export const revalidate = 0; // Disable caching for accurate inventory count

export default async function Home() {
  const availableCount = await prisma.licenseKey.count({
    where: { status: "AVAILABLE" },
  });

  return (
    <main className="min-h-screen bg-white text-black flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-white border border-black p-8 sm:p-12 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">

        <header className="mb-8 border-b border-black pb-6 text-center">
          <h1 className="text-4xl font-extrabold tracking-tighter mb-2">ashwish UI</h1>
          <p className="text-gray-600 text-sm uppercase tracking-widest font-medium">Premium Access. Limited to 16 copies.</p>
        </header>

        <div className="flex justify-between items-center mb-8 border border-black p-4">
          <span className="font-semibold text-sm uppercase">Inventory</span>
          <span className="font-mono text-lg font-bold">
            {availableCount} <span className="text-xs text-gray-500 font-sans">/ 16 REMAINING</span>
          </span>
        </div>

        <div className="space-y-4">
          <p className="text-sm leading-relaxed text-gray-800">
            A stark, ultra-minimalist single-page design template for purists.
            Instant digital delivery upon successful payment.
          </p>
          <ul className="text-xs space-y-2 font-mono text-gray-600 border-l-2 border-black pl-4 py-2">
            <li>+ React / Next.js Ready</li>
            <li>+ Tailwind Configured</li>
            <li>+ No recurring fees</li>
          </ul>
        </div>

        {/* The Checkout Component handles Stripe Elements and the Purchase Button */}
        <Checkout availableCount={availableCount} />

        <footer className="mt-12 text-center text-[10px] text-gray-400 uppercase tracking-widest border-t border-gray-200 pt-6">
          &copy; {new Date().getFullYear()} ashwish UI. All rights reserved.
        </footer>
      </div>
    </main>
  );
}