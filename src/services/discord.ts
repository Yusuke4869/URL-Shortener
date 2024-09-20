type Embed = {
  title?: string;
  description?: string;
  url?: string;
  timestamp?: string;
  color?: number;
  footer?: {
    text: string;
  };
  fields?: {
    name: string;
    value: string;
    inline?: boolean;
  }[];
};

type DiscordWebhookContent = {
  content?: string;
  username?: string;
  avatar_url?: string;
  embeds?: Embed[];
};

export const sendDiscordWebhook = async (
  webhookURL: string,
  content: DiscordWebhookContent,
) => {
  const res = await fetch(webhookURL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(content),
  });

  return res.status;
};
