FROM node:18.6.0-slim as builder

WORKDIR /usr/src/app

COPY package*.json .

RUN npm install

COPY . .

RUN npm run build


# 
FROM node:18.6.0-slim

# We don't need the standalone Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true

# Install Google Chrome Stable and fonts
# Note: this installs the necessary libs to make the browser work with Puppeteer.
RUN apt-get update && apt-get install curl gnupg -y \
  && curl --location --silent https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
  && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
  && apt-get update \
  && apt-get install google-chrome-stable -y \
  && rm -rf /var/lib/apt/lists/*    

ARG NODE_ENV=production
ARG CLIENT_EMAIL
ARG PRIVATE_KEY
ENV NODE_ENV=${NODE_ENV}
ENV CLIENT_EMAIL=${CLIENT_EMAIL}
ENV PRIVATE_KEY=${PRIVATE_KEY}

WORKDIR /usr/src/app

COPY package*.json .

COPY --from=builder /usr/src/app/dist ./dist

RUN npm install

CMD [ "node", "./dist/main.js" ]

EXPOSE 3000