FROM node:7.2

COPY . /app
WORKDIR /app

RUN npm install
ENV PORT=6034
ENV NODE_ENV=production

EXPOSE 6034
CMD ["npm", "start"]
