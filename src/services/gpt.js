
export async function queryGPT({
  input,
  tools,
  onUpdate = (value) => console.log(value)
}) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "user", content: input }
      ],
      temperature: 0.7,
      max_tokens: 100,
      tools,
      stream: true, // Enable streaming
    })
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullResponse = '';
  let functionCall = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n').filter(line => line.trim() !== '');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') {
          console.log('\nStream complete');
          break;
        }

        try {
          const parsed = JSON.parse(data);
          if (parsed.choices[0].delta.content) {
            const content = parsed.choices[0].delta.content;
            fullResponse += content;
            onUpdate({
              step: 'ai',
              message: content,
              type: 'markdown',
              mode: 'append'
            });
          }
          if (parsed.choices[0].delta.tool_calls?.[0]?.function) {
            functionCall = parsed.choices[0].delta.tool_calls[0].function;
          }
        } catch (e) {
          console.error('Error parsing chunk:', e);
        }
      }
    }
  }

  console.log('\nGPT Mini Response:', { message: fullResponse, tools: [functionCall] });
  return { message: fullResponse, tools: [functionCall] };
}