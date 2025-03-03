export class ToolsAggregator {
  constructor(providers = []) {
    this.providers = providers;
    this.toolsMap = new Map();
  }

  async listTools() {
    const allTools = [];
    for (const provider of this.providers) {
      const tools = await provider.listTools();
      for (const tool of tools) {
        this.toolsMap.set(tool.function.name, provider);
      }
      allTools.push(...tools);
    }
    return allTools;
  }

  async callTool({ name, arguments: args = {} }) {
    const provider = this.toolsMap.get(name);
    if (!provider) {
      throw new Error(`No provider found for tool: ${name}`);
    }
    return provider.callTool({ name, arguments: args });
  }
} 