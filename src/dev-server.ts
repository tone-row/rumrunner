import { createServer } from "vite";
import { resolve } from "path";
import { rumrunnerPlugin } from "./ui/vite-plugin-rumrunner";

export async function startDevServer() {
  // Serve the UI from the package's src/ui directory
  const uiRoot = resolve(__dirname, "./ui");

  const server = await createServer({
    root: uiRoot,
    plugins: [rumrunnerPlugin()],
    server: {
      hmr: true,
      open: true,
    },
    optimizeDeps: {
      include: ["react", "react-dom"],
    },
  });

  await server.listen();
  const info = server.config.server;
  console.log(
    `🚀 Rumrunner dev server running at: http://localhost:${info.port}`
  );
}
