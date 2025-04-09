import './env.ts';
import webPush from 'npm:web-push';
import { Application, Router } from 'https://deno.land/x/oak/mod.ts';
import { oakCors } from 'https://deno.land/x/cors/mod.ts';
import { handleNotificationSubscription } from './handlers/handleNotificationSubscription.ts';
import { handleSendNotification } from './handlers/handleSendNotification.ts';

const PORT = 4001;
const ALLOW_ORIGIN = 'http://localhost:5173';

const subscriptions: Record<string, PushSubscription> = {};

webPush.setVapidDetails(
  Deno.env.get('VAPID_SUBJECT'),
  Deno.env.get('VAPID_PUBLIC_KEY'),
  Deno.env.get('VAPID_PRIVATE_KEY')
);

const router = new Router();

router
  .get('/', (context) => {
    context.response.body = { message: 'Hello from the server!' };
  })
  .post('/api/save-subscription/', (ctx) =>
    handleNotificationSubscription(ctx, (subscription) => {
      if (subscription.endpoint in subscriptions) {
        console.log('Subscription already exists');
      } else {
        subscriptions[subscription.endpoint] = subscription;
        console.log(
          'Subscription saved',
          Object.values(subscriptions).length
        );
      }
    })
  )
  .post('/api/send-notification/', (ctx) =>
    handleSendNotification(ctx, async (payload) => {
      const failedSubscriptions: PushSubscription[] = [];
      await Promise.all(
        Object.values(subscriptions).map(async (subscription) => {
          try {
            console.log('PUSH');
            await webPush.sendNotification(subscription, payload);
          } catch (error) {
            if (
              error instanceof Error &&
              (error as any).statusCode === 410
            ) {
              console.log(
                `Subscription ${subscription.endpoint} is invalid (410 Gone). Removing it.`
              );
              failedSubscriptions.push(subscription);
            } else {
              console.error('Error sending notification:', error);
            }
          }
        })
      );

      failedSubscriptions.forEach((subscription) => {
        delete subscriptions[subscription.endpoint];
        console.log(`Subscription ${subscription.endpoint} removed.`);
      });
    })
  );

const app = new Application();
app.use(oakCors({ origin: ALLOW_ORIGIN }));
app.use(router.routes());
app.use(router.allowedMethods());

await app.listen({ port: PORT });
