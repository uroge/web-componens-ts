import './env.ts';
import webPush from 'npm:web-push';

const PORT = 4001;

webPush.setVapidDetails(
  Deno.env.get('VAPID_SUBJECT'),
  Deno.env.get('VAPID_PUBLIC_KEY'),
  Deno.env.get('VAPID_PRIVATE_KEY')
);

// Learn more at https://docs.deno.com/runtime/manual/examples/module_metadata#concepts
if (import.meta.main) {
  Deno.serve({ port: PORT }, () => {
    const body = JSON.stringify({ message: 'CONNECTED' });

    return new Response(body, {
      status: 200,
      headers: {
        'content-type': 'application/json; charset=utf-8',
      },
    });
  });
}
