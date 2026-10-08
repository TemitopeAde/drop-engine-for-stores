import { toolsProvider } from "@wix/app-tools/service-plugins";
import { runAriaTool } from "../../../../server/aria";
toolsProvider.provideHandlers({
  runTool: async ({ request, metadata }) => ({
    response: await runAriaTool(request.methodName, request.payload, metadata),
  }),
});
