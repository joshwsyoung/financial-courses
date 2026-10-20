# Self-host: builds the static site and serves it with nginx.
#   docker build -t financial-courses . && docker run -p 8080:80 financial-courses
FROM node:22-alpine AS build
RUN corepack enable
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile && pnpm build

FROM nginx:1.27-alpine
COPY --from=build /app/apps/web/out /usr/share/nginx/html
