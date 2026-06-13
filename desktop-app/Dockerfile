FROM node:24-alpine AS build

WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM node:24-alpine

RUN apk add --no-cache tini

WORKDIR /app

COPY --from=build /app/node_modules ./node_modules
COPY electron/ ./electron/
COPY docker-entry.js .

ENV NODE_ENV=production
ENV PORT=3456
ENV FARAZ_DATA_DIR=/data

EXPOSE 3456

VOLUME /data

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "docker-entry.js"]
