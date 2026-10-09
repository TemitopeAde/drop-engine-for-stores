import path from "node:path";
import type { WebpackOverrideFn } from "@remotion/bundler";

// Films import the app's real components and CSS from ../src. Pin React to this
// package's copy so the app files and the film share one React.
export const webpackOverride: WebpackOverrideFn = (config) => {
  const modules = path.resolve(process.cwd(), "node_modules");
  return {
    ...config,
    resolve: {
      ...config.resolve,
      alias: {
        ...(config.resolve?.alias as Record<string, string>),
        "@app": path.resolve(process.cwd(), "../src"),
        react: path.join(modules, "react"),
        "react-dom": path.join(modules, "react-dom"),
        "lucide-react": path.join(modules, "lucide-react"),
      },
    },
  };
};
