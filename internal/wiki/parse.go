package wiki

import (
	"log"
	"net/url"
	"os"
	"path/filepath"
	"regexp"
	"strconv"
	"unicode/utf8"
)

/*
extract data

case 1:
	학습날짜 2020-10-02 : datetime
	학습시간 24시간제(위치) : string to int
	학습범위 및 주제 : string
	동료학습 방법 : string(x or nil)
case 2:
	학습날짜 2021년 1월 22일 : string
	학습시간 : 오전 10시 ~ 2시
	학습범위 및 주제 : string
	동료학습 방법 : 인터넷 검색

최종:
	학습날짜 : report 파일 이름에서 추출
	학습시간 : 24시간제
	학습범위 및 주제 : string 통으로
	동료학습 방법 : intraID
*/
// https://mholt.github.io/json-to-go/
// json to go struct

// 1day
type ReportInfo struct {
	Year       int      `json:"date"`  // yyyy
	Month      int      `json:"Month"` // mm
	Date       int      `json:"date"`  // dd
	Day        int      `json:"day"`   // Mon: 1, Tue: 2 ... Sun: 7
	StudyTime  int      `json:"studyTime"`
	StudyTheme string   `json:"studyTheme"`
	Cadet      []string `json:"cadets"`
}

func SplitDate(filename string, myRepo *ReportInfo) {
	m := regexp.MustCompile(`[.,\- \(\)]`)
	filteredValue := m.ReplaceAll([]byte(filename), []byte(""))

	myRepo.Year, _ = strconv.Atoi(string(filteredValue[:4]))
	myRepo.Month, _ = strconv.Atoi(string(filteredValue[4:6]))
	myRepo.Date, _ = strconv.Atoi(string(filteredValue[6:8]))
	day, _ := utf8.DecodeRune(filteredValue[8:11])
	switch {
	case filteredValue[8:11] == []byte("월"):

	}
}

func DecodeFileName(filename string) string {
	decodedFileName, _ := url.QueryUnescape(filename)
	return decodedFileName
}

func GetReportInfo(filename string) *ReportInfo {
	info, _ := os.Stat(filename)
	reportInfo := ReportInfo{}
	SplitDate(DecodeFileName(info.Name()), &reportInfo)

	return nil
}

func GetReport(intraID string) { //*ReportInfo {
	//	files, err := filepath.Glob(wikiRepoPath + intraID + "/20[0-9]{2}[.-, ]?[0-9]{2}[.-, ]?[0-9]{2}*.md")
	files, err := filepath.Glob(wikiRepoPath + intraID + "/*.md")

	log.Println("Get report")
	if err != nil {
		log.Fatalf("err: %v\n", err)
	}
	//	var reportInfo []ReportInfo
	for i := range files {
		//		log.Printf("file: %v\n", files[i])
		GetReportInfo(files[i])
	}

}

func ParseDate(intraID string) bool {
	if _, err := os.Stat(wikiRepoPath + intraID); os.IsNotExist(err) {
		log.Printf("Not exist [%v] repo", intraID)
		return false
	}

	return true
}
