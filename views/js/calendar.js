import { JSONdata } from "./submit.js"
import { ChartCreate1, myChartOne } from "./myChartOne.js"
import { ChartCreate2, myChartTwo } from "./myChartTwo.js"
import { ChartCreate3, myChartThree } from "./myChartThree.js"
export function calendarCreate(data) {
    // data 형식
    // {
    //     Month: 4
    //     date: 6
    //     day: 1
    //     studyMember: Array(4)["dochoi", "get", "next", … ]
    //     studyTheme: "\r\n컴퓨터 그래픽스 기초\r\n\r\n "
    //     studyTime: 540
    //     year:2020
    // }

    var calendarEl = document.getElementById('calendar');
    // url: 'http://git.innovationacademy.kr/'
    const datas = data.map((d) => {
        return {
            start: new Date(d.year, Number(d.Month) - 1, d.date).format('yyyy-MM-dd'),
            overlap: false,
            backgroundColor: "#00b9ba",
            title: d.studyTheme,
        }
    });
    // console.log(datas);
    // console.log(new Date().format('yyyy-MM-dd HH:mm:ss'));
    let nowDate = new Date().format('yyyy-MM-dd');
    var calendar = new FullCalendar.Calendar(calendarEl, {
        height: 'auto',
        locale: 'ko',
        firstDay: 1,
        headerToolbar: {
            left: 'prev,next',
            center: 'title',
            right: 'today'
        },
        initialDate: nowDate
        , editable: false
        , events: datas
        ,
        eventClick: function (data) {
            console.log('Event: ' + data.event.title);
            console.log('Coordinates: ' + data.jsEvent.pageX + ',' + data.jsEvent.pageY);
            console.log('View: ' + data.view.type);
            if (data.event.url) {
                window.open(data.event.url);
            }
        }
    });
    calendar.render()
    // 이전 달 보기 달력버튼
    document.getElementsByClassName("fc-prev-button")[0]
        .addEventListener('click', () => {
            resetCalendar()
            updateProgress()
            myChartOne.destroy()
            ChartCreate1()
            myChartTwo.destroy()
            ChartCreate2()
            myChartThree.destroy()
            ChartCreate3()
        }
        );
    // 다음 달 보기 달력버튼
    document.getElementsByClassName("fc-next-button")[0]
        .addEventListener('click', () => {
            resetCalendar()
            updateProgress()
            myChartOne.destroy()
            ChartCreate1()
            myChartTwo.destroy()
            ChartCreate2()
            myChartThree.destroy()
            ChartCreate3()
        }
        );
    // 오늘 보기 달력버튼
    document.getElementsByClassName("fc-today-button")[0]
        .addEventListener('click', () => {
            resetCalendar()
            updateProgress()
            myChartOne.destroy()
            ChartCreate1()
            myChartTwo.destroy()
            ChartCreate2()
            myChartThree.destroy()
            ChartCreate3()
        }
        );
};


//#region 주차별 레포트 제출현황 업데이트
export function updateProgress() {
    let progress = document.getElementsByClassName('progress-bar');
    let calendarMonth = document.getElementsByClassName('fc-toolbar-title')[0];
    let calendarYear = Number(calendarMonth.innerHTML.split("년")[0]);
    calendarMonth = Number(calendarMonth.innerHTML.split(" ")[1].split("월")[0]);
    let startDay = Object.values(document.getElementsByClassName('reportDate')).map((d) => Number(d.innerHTML))
    // [ 1, 7, 8, 14, 15, 21, 22, 28 ]
    // 이번달만 우선필터링
    let data = (JSONdata.filter((d) => (d.Month == calendarMonth && d.year == calendarYear)));
    // 1~3주차 계산
    for (let i = 0; i < 3; i++) {
        let percent = data.filter((d) => d.date >= startDay[i * 2] && d.date <= startDay[i * 2 + 1]).length * 20;
        if (percent >= 100) {
            progress[i].className = 'progress-bar bar-active'
            percent = 100;
        } else
            progress[i].className = 'progress-bar'
        progress[i].style = "width:" + percent + "%"
        progress[i].innerHTML = percent + "%"
    }
    // 4주차 계산(년도까지 마지막 넘어가는 주떄매 따로 계산)
    // 이번달 마지막주
    let percentLast = 0;
    let checkDay = new Date(calendarYear, calendarMonth - 1, startDay[6])
    for (let j = 0; j < 7; j++) {
        if (JSONdata.filter(d => d.year == checkDay.getFullYear() && d.Month == checkDay.getMonth() + 1 && d.date == checkDay.getDate()).length != 0)
            percentLast += 20;
        checkDay.setDate(checkDay.getDate() + 1);
    }
    if (percentLast >= 100) {
        progress[3].className = 'progress-bar bar-active'
        percentLast = 100;
    } else
        progress[3].className = 'progress-bar'
    progress[3].style = "width:" + percentLast + "%"
    progress[3].innerHTML = percentLast + "%"

}
//#endregion주차별 레포트 제출현황 업데이트
//#region 주차별 학습레포트 제출현황 월/일 초기화
function resetCalendar() {
    let calendarMonth = document.getElementsByClassName('fc-toolbar-title')[0];
    let calendarYear = Number(calendarMonth.innerHTML.split("년")[0]);
    calendarMonth = Number(calendarMonth.innerHTML.split(" ")[1].split("월")[0]);

    let monthList = document.getElementsByClassName('reportMonth');
    let reportDate = document.getElementsByClassName('reportDate');
    let percentList = document.getElementsByClassName('reportPercent');
    // 시스템 월 기준 바꾸기
    Object.entries(monthList).map((d, i) => monthList[i].innerHTML = calendarMonth)
    // 해당 달에서 월요일 찾기
    let initDay = new Date(calendarYear, calendarMonth - 1, 1)
    while (initDay.getDay() != 1)
        initDay = new Date(initDay.setDate(initDay.getDate() + 1))
    // 구한 월요일 기준으로 나머지 주차별 일 바꾸기
    Object.entries(reportDate).map((d, i) => (!(i % 2)) ? reportDate[i].innerHTML = initDay.getDate() + (i / 2) * 7 : reportDate[i].innerHTML = initDay.getDate() + (i + 1) * 3.5 - 1)
    // 마지막 주차 달 넘으면 바꾸기
    let today = Number(reportDate[7].innerHTML);
    let lastday = new Date(initDay.getFullYear(), initDay.getMonth() + 1, 0).getDate()
    if (today > lastday) {
        //해당 월 바꾸고(해당월이 13월이면 1월로바꿈)
        monthList[7].innerHTML = (Number(monthList[7].innerHTML) + 1 > 12) ? 1 : Number(monthList[7].innerHTML) + 1;
        //해당 일 뺴기
        reportDate[7].innerHTML = today - lastday;
    }
}
//#endregion


