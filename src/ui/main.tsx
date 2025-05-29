import React from "react";
import { createRoot } from "react-dom/client";
import { DevUI } from "./DevUI";

const container = document.getElementById("rumrunner-ui");
if (container) {
  const root = createRoot(container);
  root.render(<DevUI />);
}
