// MergeManager.ts
import { OpenAI } from 'Remote Service Gateway.lspkg/HostedExternal/OpenAI';

export async function mergeTitles(titleA: string, titleB: string): Promise<string> {
  let response = await OpenAI.chatCompletions({
    model: 'gpt-4.1-nano',
    messages: [
      {
        role: 'system',
        content: "You are a creative AI that merges two object titles into one fun, short combined name."
      },
      {
        role: 'user',
        content: `Merge these two titles into one: "${titleA}" and "${titleB}".`
      }
    ],
    temperature: 0.7,
  });

  return response.choices[0].message.content.trim();
}
