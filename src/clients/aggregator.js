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

    async callTool(response, options) {
        if (response.choices.length !== 1) {
            throw new Error("Multiple choices not supported");
        }

        const choice = response.choices[0];
        if (!choice?.message?.tool_calls) {
            return [];
        }

        const toolCalls = choice.message.tool_calls;
        const results = [];

        for (const toolCall of toolCalls) {
            const provider = this.toolsMap.get(toolCall.function.name);
            if (!provider) {
                throw new Error(`No provider found for tool: ${toolCall.function.name}`);
            }

            // Create a response object that matches the expected format for the provider
            const singleToolResponse = {
                choices: [{
                    message: {
                        tool_calls: [toolCall]
                    }
                }]
            };

            const result = await provider.callTool(singleToolResponse, options);
            results.push(...result);
        }

        return results;
    }
} 