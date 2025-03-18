import { Context } from 'https://deno.land/x/oak@v17.1.4/mod.ts';

export async function handleNotificationSubscription(
  context: Context,
  onSubscription: (subscription: PushSubscription) => void
) {
  if (!context.request.hasBody) {
    context.throw(415);
  }
  const subscription = await context.request.body.json();

  if (!subscription || !subscription.endpoint) {
    context.response.body = {
      message: 'Invalid subscription.',
      data: {
        success: false,
      },
    };

    return;
  }

  onSubscription(subscription);

  context.response.body = {
    message: 'Subscription saved.',
    data: {
      success: true,
    },
  };
}
