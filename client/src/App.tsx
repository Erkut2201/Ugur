// client/src/App.tsx
import AppPublic from "./AppPublic.js";
import AppPortal from "./AppPortal.js";

const isB2BPortal =
  typeof window !== "undefined" &&
  window.location.hostname.startsWith("rechnungen.");

export default function App() {
  return isB2BPortal ? <AppPortal /> : <AppPublic />;
}
