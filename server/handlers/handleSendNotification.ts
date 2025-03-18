import { Context } from 'https://deno.land/x/oak@v17.1.4/mod.ts';

export async function handleSendNotification(
  context: Context,
  onNotification: (message: string) => Promise<void>
) {
  if (!context.request.hasBody) {
    context.throw(415);
  }

  const message = await context.request.body.json();

  if (!message) {
    context.response.body = {
      message: 'Invalid message.',
      data: {
        success: false,
      },
    };

    return;
  }

  const payload = JSON.stringify({
    title: 'New Alert',
    body: message,
  });

  try {
    await onNotification(payload);

    context.response.body = {
      message: 'Notification sent.',
      data: {
        success: true,
      },
    };
  } catch (err) {
    console.error('Error while sending notification:', err);

    context.response.body = {
      message: 'Failed to send notification.',
      data: {
        success: false,
      },
    };
  }
}
