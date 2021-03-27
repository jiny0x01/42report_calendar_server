package main

import (
	"encoding/json"
	"fmt"
	"github.com/jinykim0x80/42report_calender_server/internal/wiki"
	"log"
	"net/http"
)

const port = 8080

type intraIdRequest struct {
	Id string `json:"id"`
}

type intraIdResponse struct {
	Report []wiki.ReportInfo `json:"report"`
}

func SearchIntraIdHandler(w http.ResponseWriter, r *http.Request) {
	var request intraIdRequest
	decoder := json.NewDecoder(r.Body)
	err := decoder.Decode(&request)
	if err != nil {
		http.Error(w, "bad Request", http.StatusBadRequest)
		return
	}
	log.Printf("request id: %s\n", request.Id)
	report, _ := wiki.GetReport(request.Id)
	res := intraIdResponse{Report: report}
	encoder := json.NewEncoder(w)
	encoder.Encode(res)
}

func RootRedirectHandler(w http.ResponseWriter, r *http.Request) {
	http.Redirect(w, r, "/intra", http.StatusTemporaryRedirect)
}

func main() {
	http.HandleFunc("/", RootRedirectHandler)
	http.HandleFunc("/intra", SearchIntraIdHandler)
	http.ListenAndServe(":"+string(port), nil)
	log.Printf("Server starting on port:%v\n", port)
	log.Println(http.ListenAndServe(fmt.Sprintf(":%v", port), nil))
}
