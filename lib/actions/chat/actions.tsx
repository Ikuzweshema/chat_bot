"use server";
import { getMutableAIState, streamUI } from "ai/rsc";
import { google } from "@ai-sdk/google";
import { BotMessage } from "@/components/ai/bot-message";
import ErrorMessage from "@/components/ai/error-message";
import { Markdown } from "@/components/ai/markdown";
import { SpinnerMessage } from "@/components/ai/spinner-message";
import AIProvider from "@/components/providers/ai-provider";

import { ClientMessage } from "@/lib/types";

import { CoreMessage } from "ai";

export async function submitMessage(
  userMessage: string
): Promise<ClientMessage> {
  try {
    const message = `\You are a highly capable programming assistant.
       If auser ask anything not related to programming , respond saying that you are a Programming assistant you cannot do that.and suggest what you can assist them,
      if a user  impossible tasks such as Running codes and other programming tasks  you are not capable , respond Saying that the This feature is currently unavailable and may added in the future.
      your answers should be well explained.
    `;
    const state = getMutableAIState<typeof AIProvider>();

    state.update({
      ...state.get(),
      messages: [
        ...state.get()?.messages,
        {
          id: crypto.randomUUID(),
          role: "user",
          content: userMessage,
        },
      ],
    });
    const result = await streamUI({
      model: google("gemini-1.5-flash-latest"),
      initial: <SpinnerMessage />,
      system: message,
      messages: [
        ...state.get()?.messages.map((message) => ({
          role: message.role,
          content: message.content,
          id: message.id,
        })),
      ] as CoreMessage[],
      text: async ({ done, content }) => {
        if (done) {
          state.done({
            ...state.get(),
            messages: [
              ...state.get()?.messages,
              {
                role: "assistant",
                id: crypto.randomUUID(),
                content: content,
              },
            ],
          });

          return (
            <BotMessage>
              <Markdown>{content}</Markdown>
            </BotMessage>
          );
        }
      },
    });

    return {
      id: crypto.randomUUID(),
      role: "assistant",
      display: result.value,
    };
  } catch (e) {
    return {
      id: crypto.randomUUID(),
      role: "assistant",
      display: (
        <BotMessage>
          <ErrorMessage />
        </BotMessage>
      ),
    };
  }
}
