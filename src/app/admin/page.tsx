"use client";

import { useState } from "react";

interface KeyRecord {
  id: string;
  key: string;
  status: "AVAILABLE" | "PENDING" | "SOLD";
  buyerEmail: string | null;
  soldAt: string | null;
}

export default function AdminDashboard() {
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [keys, setKeys] = useState<KeyRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchKeys = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/keys", {
        headers: { Authorization: `Bearer ${password}` },
      });
      if (res.ok) {
        const data = await res.json();
        setKeys(data);
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    fetchKeys();
  };

  const handleRefund = async (id: string) => {
    if (!confirm("Are you sure you want to instantly refund and restore this key?")) return;

    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/refund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyId: id, password }),
      });
      if (res.ok) {
        alert("Refund successful. Key restored to AVAILABLE.");
        fetchKeys();
      } else {
        const data = await res.json();
        alert(data.error || "Refund failed");
      }
    } catch (e) {
      console.error(e);
      alert("Error processing refund");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-white text-black flex flex-col items-center justify-center p-4">
        <form onSubmit={handleLogin} className="w-full max-w-sm border border-black p-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <h1 className="text-2xl font-bold mb-6">Admin Access</h1>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password..."
            className="w-full border border-black p-2 mb-4 bg-gray-50 focus:outline-none"
            required
          />
          <button type="submit" className="w-full bg-black text-white p-2 border border-black hover:bg-white hover:text-black transition-colors" disabled={isLoading}>
            {isLoading ? "Authenticating..." : "Login"}
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 text-black p-8 font-sans">
      <div className="max-w-6xl mx-auto bg-white border border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-8">
        <header className="flex justify-between items-center mb-8 border-b border-black pb-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">ashwish Admin</h1>
            <p className="text-sm text-gray-500 uppercase tracking-widest mt-1">Inventory Management</p>
          </div>
          <button
            onClick={() => { setIsAuthenticated(false); setPassword(""); }}
            className="text-sm uppercase tracking-widest underline hover:text-gray-500"
          >
            Logout
          </button>
        </header>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-black bg-gray-100 uppercase text-xs tracking-wider font-mono">
                <th className="p-4 border-r border-black">Key (Preview)</th>
                <th className="p-4 border-r border-black">Status</th>
                <th className="p-4 border-r border-black">Buyer Email</th>
                <th className="p-4 border-r border-black">Sale Date</th>
                <th className="p-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="font-mono text-xs">
              {keys.map((k) => (
                <tr key={k.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                  <td className="p-4 border-r border-gray-200">
                    {k.key.substring(0, 16)}...
                  </td>
                  <td className="p-4 border-r border-gray-200">
                    <span className={`px-2 py-1 uppercase text-[10px] tracking-widest font-bold ${
                      k.status === "AVAILABLE" ? "bg-green-100 text-green-800" :
                      k.status === "SOLD" ? "bg-black text-white" : "bg-yellow-100 text-yellow-800"
                    }`}>
                      {k.status}
                    </span>
                  </td>
                  <td className="p-4 border-r border-gray-200 truncate max-w-[150px]" title={k.buyerEmail || ""}>
                    {k.buyerEmail || "-"}
                  </td>
                  <td className="p-4 border-r border-gray-200">
                    {k.soldAt ? new Date(k.soldAt).toLocaleString() : "-"}
                  </td>
                  <td className="p-4 text-center">
                    {k.status === "SOLD" ? (
                      <button
                        onClick={() => handleRefund(k.id)}
                        disabled={isLoading}
                        className="text-[10px] bg-white text-black border border-black px-3 py-1 hover:bg-black hover:text-white uppercase tracking-widest transition-colors disabled:opacity-50"
                      >
                        Instant Refund
                      </button>
                    ) : (
                      <span className="text-[10px] text-gray-400 uppercase tracking-widest">N/A</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}