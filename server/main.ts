import './env.ts';

export function add(a: number, b: number): number {
  return a + b;
}

// Learn more at https://docs.deno.com/runtime/manual/examples/module_metadata#concepts
if (import.meta.main) {
  console.log({ env: Deno.env.get('VAPID_PUBLIC_KEY') });
}
