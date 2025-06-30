import React, { useEffect, useState } from "react";

export function DevUI() {
  const [cacheData, setCacheData] = useState<any>(null);

  useEffect(() => {
    fetch("/__rumrunner")
      .then((res) => res.json())
      .then(setCacheData)
      .catch(() => setCacheData(null));
  }, []);

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 font-sans p-6 min-h-[100dvh] grid gap-6 content-start">
      <h2 className="text-3xl font-bold text-gray-800 tracking-tight">
        Rumrunner Cache Viewer
      </h2>

      <div className="w-full bg-white rounded-xl shadow-lg p-6">
        {cacheData ? (
          <pre className="bg-gray-100 text-sm rounded-lg p-4 overflow-x-auto border border-gray-200">
            {JSON.stringify(cacheData, null, 2)}
          </pre>
        ) : (
          <div className="text-gray-500 text-center py-8">
            Loading or no cache data found.
          </div>
        )}
      </div>
      <footer className="mt-8 text-xs text-gray-400">
        Rumrunner UI &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
