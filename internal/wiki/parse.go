package wiki

import (
	"io/ioutil"
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
	Year        int      `json:"year"`  // yyyy
	Month       int      `json:"Month"` // mm
	Date        int      `json:"date"`  // dd
	Day         int      `json:"day"`   // Mon: 1, Tue: 2 ... Sun: 7
	StudyTime   int      `json:"studyTime"`
	StudyTheme  string   `json:"studyTheme"`
	StudyMember []string `json:"studyMember"`
}

func CheckIfError(e error) bool {
	if e != nil {
		log.Println(e)
		return false
	}
	return true
}

func (repo *ReportInfo) ParseDate(filename string) {
	m := regexp.MustCompile(`[.,\- \(\)]`)
	filteredValue := m.ReplaceAll([]byte(filename), []byte(""))

	repo.Year, _ = strconv.Atoi(string(filteredValue[:4]))
	repo.Month, _ = strconv.Atoi(string(filteredValue[4:6]))
	repo.Date, _ = strconv.Atoi(string(filteredValue[6:8]))
	day, _ := utf8.DecodeRune(filteredValue[8:11])

	switch {
	case day == '월':
		repo.Day = 1
		break
	case day == '화':
		repo.Day = 2
		break
	case day == '수':
		repo.Day = 3
		break
	case day == '목':
		repo.Day = 4
		break
	case day == '금':
		repo.Day = 5
		break
	case day == '토':
		repo.Day = 6
		break
	case day == '일':
		repo.Day = 7
		break
	}
}

func DecodeFileName(filename string) string {
	decodedFileName, _ := url.QueryUnescape(filename)
	return decodedFileName
}

func StudyTimeStamp2Minute(studyTime []byte) int {
	timeStampMatcher := regexp.MustCompile(`\d\d?:\d\d?`)
	studyTimeStamp := timeStampMatcher.FindAll(studyTime, 2)

	timeMatcher := regexp.MustCompile(`\d\d?`)
	startTime := timeMatcher.FindAll(studyTimeStamp[0], 2)
	endTime := timeMatcher.FindAll(studyTimeStamp[1], 2)

	var startHour, startMinute, endHour, endMinute int
	startHour, _ = strconv.Atoi(string(startTime[0]))
	startMinute, _ = strconv.Atoi(string(startTime[1]))
	endHour, _ = strconv.Atoi(string(endTime[0]))
	endMinute, _ = strconv.Atoi(string(endTime[1]))
	/*
		if startTime[1][0] == '0' {
			startMinute, _ = strconv.Atoi(string(startTime[1][1]))
		} else {
			startMinute, _ = strconv.Atoi(string(startTime[1]))
		}
		if endTime[0][0] == '0' {
			endHour, _ = strconv.Atoi(string(endTime[0][1]))
		} else {
			endHour, _ = strconv.Atoi(string(endTime[0]))
		}
		if endTime[1][0] == '0' {
			endMinute, _ = strconv.Atoi(string(endTime[1][1]))
		} else {
			endMinute, _ = strconv.Atoi(string(endTime[1]))
		}
	*/
	if endHour < startHour {
		endHour += 12
	}
	totalStudyTime := ((endHour - startHour) * 60) + endMinute - startMinute
	//	log.Printf("\n\torigin: %q\n\tstartHour: %d\n\tstartMinute: %d\n\tendHour: %d\n\tendMinute: %d\n\t totalStudyTime: %d", studyTimeStamp, startHour, startMinute, endHour, endMinute, totalStudyTime)
	if totalStudyTime < 0 {
		totalStudyTime = 0
	}
	return totalStudyTime
}

func (repo *ReportInfo) ParseStudyTime(fileRawData []byte) {
	// 24시 hh:mm ~ hh:mm
	m := regexp.MustCompile(`\d\d?:\d\d? ?(-|~) ?\d\d?:?\d?\d?`)
	data := m.FindAll(fileRawData, -1)
	for _, d := range data {
		//		log.Printf("\n\t raw time: %q", d)
		repo.StudyTime += StudyTimeStamp2Minute(d)
	}
}

func (repo *ReportInfo) ParseStudyTheme(fileRawData []byte) {
	startMatcher := regexp.MustCompile(`학습 ? 범위 ?및 ?주제(\*|_)*( :)?`)
	startIndex := startMatcher.FindIndex(fileRawData)
	endMatcher := regexp.MustCompile(`(\*|_|#)*동?료? ?학습 ?방법`)
	endIndex := endMatcher.FindIndex(fileRawData)
	if startIndex == nil || endIndex == nil {
		repo.StudyTheme = "undefined"
		return
	}
	//	log.Printf("\t extracted data %s\n", fileRawData[startIndex[1]:endIndex[0]])
	m := regexp.MustCompile(`(\* ?|- ?|# ?|\+ ?|\d\.|/)`)
	studyTheme := (m.ReplaceAll(fileRawData[startIndex[1]:endIndex[0]], []byte("")))
	if string(studyTheme[len(studyTheme)-2:]) == "\r\n" {
		studyTheme = studyTheme[:len(studyTheme)-2]
	}
	repo.StudyTheme = string(studyTheme)
	//	log.Printf("\t extracted data %s", repo.StudyTheme)
}

func (repo *ReportInfo) ParseStudyMember(fileRawData []byte) {
	startMatcher := regexp.MustCompile(`(\*|_|#)*동?료? ?학습 ?방법`)
	startIndex := startMatcher.FindIndex(fileRawData)
	endMatcher := regexp.MustCompile(`(\*|_|#)*학습 ?목표`)
	endIndex := endMatcher.FindIndex(fileRawData)
	if startIndex == nil || endIndex == nil {
		//log.Println("index is nil")
		repo.StudyMember = nil
		return
	}
	memberMatcher := regexp.MustCompile(`[a-z]{2,8}`)
	bytes := memberMatcher.FindAll(fileRawData[startIndex[1]:endIndex[0]], -1)
	if bytes == nil {
		//log.Println("member is nil")
		repo.StudyMember = nil
		return
	}
	var member []string
	for _, m := range bytes {
		member = append(member, string(m))
	}
	//	log.Printf("before filtered member: %v\n", member)
	var err error
	repo.StudyMember, err = CheckValid(member)
	if err != nil {
		log.Println(err)
	}
	//	log.Printf("after filtered member: %v\n", repo.StudyMember)
	/*
		for _, m := range member {
			// 나중에 goroutine으로 처리
			isValidMember := func(_m []byte) bool {
				// 42 API에서 유효한 Cadet인지 판별해야함.
				isCadet := true
				return isCadet
			}
			if isValidMember(m) == true {
				repo.StudyMember = append(repo.StudyMember, string(m))
			}
		}
	*/
}

func ParseReportInfo(filename string) ReportInfo {
	info, _ := os.Stat(filename)
	reportInfo := ReportInfo{}
	reportInfo.ParseDate(DecodeFileName(info.Name()))

	fileRawData, _ := ioutil.ReadFile(filename)
	reportInfo.ParseStudyTime(fileRawData)
	reportInfo.ParseStudyTheme(fileRawData)
	reportInfo.ParseStudyMember(fileRawData)
	return reportInfo
}

func ShowReportInfo(repo []ReportInfo) {
	log.Println("======Result")
	for i, r := range repo {
		log.Printf("%dth report info\n", i)
		log.Printf("\tyear: %d\n", r.Year)
		log.Printf("\tMonth: %d\n", r.Month)
		log.Printf("\tDate: %d\n", r.Date)
		log.Printf("\tDay: %d\n", r.Day)
		log.Printf("\tStudyTime: %d\n", r.StudyTime)
		log.Printf("\tStudyTheme: %s\n", r.StudyTheme)
		log.Printf("\tStudyMember: %s\n\n", r.StudyMember)
	}
}

func GetReport(intraID string) ([]ReportInfo, error) {
	if ok, err := SearchPublicRepoRepository(intraID); ok == false || err != nil {
		return nil, err
	}

	files, err := filepath.Glob(wikiRepoPath + intraID + "/*.md")
	if ok := CheckIfError(err); ok == false {
		return nil, err
	} else if files == nil {
		log.Println("file empty")
		return nil, nil
	}

	var repo []ReportInfo
	for i := range files {
		repo = append(repo, ParseReportInfo(files[i]))
	}
	//	ShowReportInfo(repo)
	log.Println("Repo found")
	return repo, nil
}
