"use client";

import AuthGuard from "@/components/AuthGuard";
import { useState } from "react";

export default function SetupPage() {
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleInit = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/sheet", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to initialize sheet");
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">
            Setup
          </h1>

          <div className="bg-gray-50 rounded-xl p-4 mb-6 text-sm text-gray-600 space-y-3">
            <p className="font-medium text-gray-800">Before using this page:</p>
            <ol className="list-decimal list-inside space-y-2">
              <li>
                Create a new Google Sheet at{" "}
                <a
                  href="https://sheets.new"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline"
                >
                  sheets.new
                </a>
              </li>
              <li>
                Share it with the service account as <strong>Editor</strong>:
                <code className="block mt-1 p-2 bg-white border rounded text-xs break-all select-all">
                  sheets-writer@timetracker-491319.iam.gserviceaccount.com
                </code>
              </li>
              <li>
                Copy the Sheet ID from the URL (between{" "}
                <code className="bg-white px-1 rounded">/d/</code> and{" "}
                <code className="bg-white px-1 rounded">/edit</code>)
              </li>
              <li>
                Set it as <code className="bg-white px-1 rounded">GOOGLE_SHEET_ID</code>{" "}
                in your <code className="bg-white px-1 rounded">.env.local</code> and restart
              </li>
            </ol>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {success ? (
            <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-center">
              <p className="text-green-800 font-medium">
                Sheet initialized with headers!
              </p>
              <a
                href="/"
                className="inline-block mt-3 text-blue-600 font-medium text-sm hover:underline"
              >
                Go to Time Tracker
              </a>
            </div>
          ) : (
            <button
              onClick={handleInit}
              disabled={loading}
              className="w-full px-4 py-3 bg-blue-600 rounded-xl text-white font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "Initializing..." : "Initialize Sheet Headers"}
            </button>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
