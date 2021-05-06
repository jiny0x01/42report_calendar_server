FROM golang:1.15

ENV GO111MODULE=on
RUN go get -u github.com/jinykim0x80/42report_calender_server
COPY ./ ./src
RUN mv ./src
RUN go build -o 42report_calender_server
#ENV APP_HOME /go/src/jinykim0x80/42report_calender_server
#RUN mv $APP_HOME
#RUN go build
#RUN chmod +x ./42report_calender_server
#RUN ./42report_calender_server

EXPOSE 443
CMD ["./42report_calender_server"]
