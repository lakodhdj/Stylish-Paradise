FROM alpine:3.20

RUN apk add --no-cache sqlite

WORKDIR /data

CMD ["sh", "-c", "touch /data/database.sqlite && tail -f /dev/null"]
