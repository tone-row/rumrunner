import React from "react";
import { createRoot } from "react-dom/client";
import { DevUI } from "./DevUI";
import "./index.css";

const container = document.getElementById("rumrunner-ui");
if (container) {
  const root = createRoot(container);
  root.render(<DevUI />);
}
