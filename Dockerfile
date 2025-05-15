FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
COPY yarn.lock ./

RUN yarn install --frozen-lockfile

COPY . .

RUN yarn build

FROM node:20-alpine

WORKDIR /app

RUN yarn global add serve

COPY --from=build /app/dist ./dist

ENV NODE_ENV=production
ENV PORT=8081

EXPOSE 8081

CMD ["serve", "-s", "dist", "-l", "8081"]
