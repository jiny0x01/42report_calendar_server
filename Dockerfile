FROM golang:1.15

ENV GO111MODULE=on
RUN go get -u github.com/jinykim0x80/42report_calender_server
COPY ./ ./src
WORKDIR src
RUN go build -o 42report_calender_server

EXPOSE 443

CMD ["./42report_calender_server"]
