import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/kestrel/receive')({
    server: {
      handlers: {
        GET: ({ request }) => {
            return new Response('Hello, world!', { status: 200 })
        },
        POST: ({ request }) => {
          return new Response('Hello, world!', { status: 200 })
        },
      },
    },
  })