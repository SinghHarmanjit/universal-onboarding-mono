import { useCopilotAction } from "@copilotkit/react-core";
import { z } from "zod";

useCopilotAction({
  name: "test",
  parameters: [
    {
      name: "msg",
      type: "string",
      description: "msg"
    }
  ],
  handler: (args) => {
    console.log(args.msg);
  }
});
