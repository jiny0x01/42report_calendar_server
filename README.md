# 42report\_calendar\_server
View report to calendar [42report.today](http://42report.today)
![demo.png](./img/demo.png)

Related Repository [42api\_gateway](https://github.com/jinykim0x80/42api_gateway)
## Build & Run
> git clone https://github.com/jinykim0x80/42report\_calendar\_server && cd 42report\_calendar\_server

> sudo docker build -t 42report\_calendar .

> sudo docker network create report\_net 

> sudo docker run -it --rm --network report\_net -p 80:80 42report\_calendar

## Tech Stack
+ Language 
	+ go 1.15
		+ rpc
		+ net/http
		+ encoding/json
		+ git
		+ gitea API 
		+ 42 API
		+ etc..
+ Build
	+ docker
+ Deploy
	+ AWS ec2

## Blog
+ [Go 서버 애플리케이션을 Docker로 AWS EC2에 배포](https://cafemocamoca.tistory.com/309)
+ [AWS 도메인 연결과 Docker 컨테이너 통신](https://cafemocamoca.tistory.com/310?category=1161650)

## Front-end
[front-end-github](https://github.com/Mins97/42-Report-Calendar)

### Contributer
+ [Mins97](https://github.com/Mins97)
+ [najeong12](https://github.com/najeong12)
