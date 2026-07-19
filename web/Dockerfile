# syntax=docker/dockerfile:1.7
#
# Runtime-only image. Build the app locally first with `pnpm build` so the
# `.output/` directory exists. This Dockerfile just packages it for production.

FROM node:24-alpine AS runner
RUN apk add --no-cache libc6-compat
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nuxt \
 && adduser --system --uid 1001 nuxt

# Pre-built Nuxt output (already bundled — no production deps needed).
COPY .output ./.output
RUN chown -R nuxt:nuxt .output

USER nuxt
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", ".output/server/index.mjs"]
