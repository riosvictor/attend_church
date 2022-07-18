FROM node:18.6.0-slim as builder

WORKDIR /usr/src/app

COPY package*.json .

RUN npm install

COPY . .

RUN npm run build


# 
FROM node:18.6.0-slim

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

COPY package*.json .

COPY --from=builder /usr/src/app/dist ./dist

CMD [ "node", "./dist/main.js" ]
