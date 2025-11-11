import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/kestrel/receive')({
    server: {
      handlers: {
        GET: async ({ request }) => {
            const body = await request.json()
            console.log(body)

            return new Response('Hello, world!', { status: 200 })
        },
        POST: async ({ request }) => {

            const body = await request.json()
            console.log(body)
          return new Response('Hello, world!', { status: 200 })
        },
      },
    },
  })