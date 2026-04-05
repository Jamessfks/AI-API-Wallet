import type { FastifyRequest, FastifyReply } from 'fastify'

const ALLOWED_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]'])

export async function localhostOnly(request: FastifyRequest, reply: FastifyReply) {
  // Check source IP
  const ip = request.ip
  if (ip !== '127.0.0.1' && ip !== '::1' && ip !== '::ffff:127.0.0.1') {
    reply.code(403).send({ error: 'forbidden', message: 'Only localhost connections allowed' })
    return
  }

  // DNS rebinding protection: check Host header
  const host = request.hostname?.split(':')[0]
  if (host && !ALLOWED_HOSTS.has(host)) {
    reply.code(403).send({ error: 'forbidden', message: 'Invalid host header' })
    return
  }
}
