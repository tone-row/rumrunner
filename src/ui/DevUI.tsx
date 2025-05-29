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
    <div style={{ padding: 24, fontFamily: "sans-serif" }}>
      <h2>Rumrunner Cache Viewer</h2>
      {cacheData ? (
        <pre style={{ background: "#f5f5f5", padding: 16, borderRadius: 8 }}>
          {JSON.stringify(cacheData, null, 2)}
        </pre>
      ) : (
        <div>Loading or no cache data found.</div>
      )}
    </div>
  );
}
