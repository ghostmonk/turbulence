FROM node:20

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .

RUN npm run build
RUN npm install -g serve

ENV PORT=8080
EXPOSE 8080

CMD ["serve", "-s", "build", "-l", "8080"]
