FROM node:23-alpine

RUN apk add --no-cache openssl nss-tools curl

RUN curl -sSL https://github.com/FiloSottile/mkcert/releases/download/v1.4.4/mkcert-v1.4.4-linux-amd64 -o /usr/local/bin/mkcert \
    && chmod +x /usr/local/bin/mkcert \
    && mkcert -install

WORKDIR /app

#возможно потребуется создать юзера с UID совпадающим с UID школьного компа, можно передать через .env
COPY package*.json ./

RUN npm ci

RUN npm install --save-dev @types/node

COPY . .

RUN mkdir -p /app/certs \
	&& mkcert -key-file /app/certs/key.pem -cert-file /app/certs/cert.pem localhost

RUN npx prisma generate

RUN npm run build

RUN npm prune --production

EXPOSE 3000

COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

CMD [ "./entrypoint.sh" ]