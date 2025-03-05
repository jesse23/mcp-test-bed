import {CallToolResultSchema} from "@modelcontextprotocol/sdk/types.js";

export class MCPTools {
  constructor(client, options = {
    // Restriction enforced by OpenAI
    truncateDescriptionLength: 1024,
  }) {
    this.client = client;
    this.options = options;
  }
  async listTools() {
    const toolResult = await this.client.listTools();
    return toolResult.tools.map((tool) => ({
      type: "function",
      function: {
        name: tool.name,
        description: tool.description?.slice(0, this.options?.truncateDescriptionLength),
        parameters: tool.inputSchema,
        strict: this.options?.strict ?? false,
      },
    }));
  }
  async callTool({name, arguments: args = {}}) {
      return await this.client.callTool({
        name: name,
        arguments: args,
      }, CallToolResultSchema, {});
  }
}