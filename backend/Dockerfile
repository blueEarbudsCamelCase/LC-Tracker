FROM node:20
WORKDIR /usr/src/app
COPY package*.json ./
# use npm install because package-lock.json is not present in the repo
RUN npm install
COPY . .
EXPOSE 4000
CMD ["npm", "run", "start:prod"]
