FROM zenika/node:18-chrome

WORKDIR /app

COPY . .

RUN npm install

CMD ["npm", "start"]
