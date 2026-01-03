import { createRoot } from "react-dom/client";
import { Capacitor } from "@capacitor/core";
import { SplashScreen } from "@capacitor/splash-screen";
import App from "./App.tsx";
import "./index.css";

// Initialize Capacitor native features
const initializeApp = async () => {
  if (Capacitor.isNativePlatform()) {
    // Add native-app class for specific styling
    document.documentElement.classList.add('native-app');
    
    // Hide splash screen after app is ready
    await SplashScreen.hide();
  }
};

// Create root and render
const root = createRoot(document.getElementById("root")!);
root.render(<App />);

// Initialize after render
initializeApp();
