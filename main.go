package main

import (
	"encoding/json"
	"fmt"
	"github.com/jinykim0x80/42report_calender_server/internal/wiki"
	"log"
	"net/http"
	"os"
)

const port = 80

type intraIdRequest struct {
	Id string `json:"id"`
}

type intraIdResponse struct {
	Report []wiki.ReportInfo `json:"report"`
}

func SearchIntraIdHandler(w http.ResponseWriter, r *http.Request) {
	param, ok := r.URL.Query()["id"]
	if !ok || len(param[0]) < 1 {
		log.Println("Url Param 'id' is missing")
		return
	}
	id := param[0]
	report, _ := wiki.GetReport(id)
	res := intraIdResponse{Report: report}
	encoder := json.NewEncoder(w)
	encoder.Encode(res)
}

func RootRedirectHandler(w http.ResponseWriter, r *http.Request) {
	http.Redirect(w, r, "/intra", http.StatusTemporaryRedirect)
}

func HTTPSecureRedirectHandler(w http.ResponseWriter, r *http.Request) {
	http.Redirect(w, r, "https://localhost:443"+r.RequestURI, http.StatusMovedPermanently)
}

func StartHTTPSecureServer(port int) {
	log.Printf("HTTPS Server starting on port:%v\n", port)
	err := http.ListenAndServeTLS(fmt.Sprintf(":%v", port), "./cert/server.pem", "./cert/server.private.key", nil)
	if err != nil {
		log.Printf("Fail HTTPS Server init. err:%v\n", err)
		os.Exit(0)
	}
}

func StartHTTPServer(port int) {
	log.Printf("HTTP Server starting on port:%v\n", port)
	go http.ListenAndServe(fmt.Sprintf(":%v", port), http.HandlerFunc(HTTPSecureRedirectHandler))
}

func main() {
	http.HandleFunc("/", RootRedirectHandler)
	http.HandleFunc("/intra", SearchIntraIdHandler)
	StartHTTPServer(80)
	StartHTTPSecureServer(443)
}
