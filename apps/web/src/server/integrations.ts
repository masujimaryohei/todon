import { getOrCreateSettings } from './settings';

async function postWebhook(url: string, content: string) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });

  if (!res.ok) {
    throw new Error(`Webhook failed: ${res.status}`);
  }
}

export async function notifyTaskDone(userId: string, title: string) {
  const settings = await getOrCreateSettings(userId);
  if (!settings.notifyOnTaskDone) {
    return;
  }

  const message = `✅ TodoN: タスク完了「${title}」`;

  if (settings.slackWebhookUrl) {
    await postWebhook(settings.slackWebhookUrl, message).catch(() => undefined);
  }

  if (settings.discordWebhookUrl) {
    await postWebhook(settings.discordWebhookUrl, message).catch(() => undefined);
  }
}

export async function notifyTeamAssign(userId: string, title: string, teamName: string) {
  const settings = await getOrCreateSettings(userId);
  if (!settings.notifyOnTeamAssign) {
    return;
  }

  const message = `👋 TodoN: ${teamName} で「${title}」が割り当てられました`;

  if (settings.slackWebhookUrl) {
    await postWebhook(settings.slackWebhookUrl, message).catch(() => undefined);
  }

  if (settings.discordWebhookUrl) {
    await postWebhook(settings.discordWebhookUrl, message).catch(() => undefined);
  }
}
