package main

import (
	"encoding/json"
	"fmt"
	"github.com/jinykim0x80/42report_calender_server/internal/wiki"
	"log"
	"net/http"
	"os"
	//	"text/template"
)

type intraIdRequest struct {
	Id string `json:"id"`
}

type intraIdResponse struct {
	Report []wiki.ReportInfo `json:"report"`
}

func SearchIntraIdHandler(w http.ResponseWriter, r *http.Request) {
	//	http.ServeFile(w, r, "views/index.html")
	param, ok := r.URL.Query()["id"]
	if !ok || len(param[0]) < 1 {
		w.Write([]byte("not found user"))
		return
	}
	id := param[0]
	report, _ := wiki.GetReport(id)
	res := intraIdResponse{Report: report}
	encoder := json.NewEncoder(w)
	encoder.Encode(res)
	//	http.ServeFile(w, r, "views/index.html")
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
	//	go http.ListenAndServe(fmt.Sprintf(":%v", port), http.HandlerFunc(HTTPSecureRedirectHandler))
	http.ListenAndServe(fmt.Sprintf(":%v", port), nil)
}

func RootHandler(w http.ResponseWriter, r *http.Request) {

	http.ServeFile(w, r, "views/index.html")
}

func main() {
	//	http.HandleFunc("/", RootHandler)
	http.Handle("/", http.StripPrefix("/", http.FileServer(http.Dir("views"))))
	http.HandleFunc("/intra", SearchIntraIdHandler)
	StartHTTPServer(80)
	//	StartHTTPSecureServer(443)
}
