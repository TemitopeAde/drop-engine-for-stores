import React from "react";
import { createRoot } from "react-dom/client";
import Dashboard from "../../src/extensions/dashboard/pages/my-page/my-page";
import Countdown from "../../src/extensions/site/components/drop-launch-countdown/drop-launch-countdown";
const editor = location.search.includes("editor");
const root = document.getElementById("root");
if (root)
  createRoot(root).render(
    editor ? (
      <div id="container" style={{ width: 480, padding: 0, margin: 24 }}>
        <style>{".drop-launch-countdown{display:var(--display)}"}</style>
        <Countdown
          id="countdown"
          headline="The Friday collection is almost here"
          productId="4c8379c5-7609-4ae9-91ad-a22a052f1aa9"
        />
      </div>
    ) : (
      <Dashboard />
    ),
  );
