import { JSONdata } from "../js/submit.js"
var myChartThree = '';
export function ChartCreate3() {

    var ctx = document.getElementById('myChartThree').getContext('2d');
    let month = Number(document.getElementsByClassName('reportMonth')[0].innerHTML);
    let day = Number(document.getElementsByClassName('reportDate')[0].innerHTML);
    let year = Number(document.getElementsByClassName('fc-toolbar-title')[0].innerHTML.split('년')[0])
    let startDate = new Date(year, month - 1 - 6, 1);
    let initDate = startDate;
    let lastDate = new Date(year, month + 6, 0)

    // console.log('startDate', startDate )
    // console.log('lastDate', lastDate - new Date(year, month + 6, 0) == 0)
    let studytime = [
        0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0];
    let labelList = [];
    // labelList 초기화
    for (let i = 0; i < 13; i++) {
        let beforeMonth = initDate.getMonth() + 1;
        labelList.push(beforeMonth + "월")
        // 월별 계산
        let month_data = JSONdata.filter(d => d.Month == initDate.getMonth() + 1 && d.year == initDate.getFullYear());
        if (month_data[0] != null) {
            const add = (a, b) => a + b;
            studytime[i] = month_data.map(d => d.studyTime).reduce(add)
        }
        initDate.setMonth(initDate.getMonth() + 1);
    }


    //     let data = JSONdata.filter(d => d.Month == startDate.getMonth() + 1 && d.year == startDate.getFullYear() && d.date == startDate.getDate());
    //     if (data[0] != null) {
    //         let studyTime = Number(data[0].studyTime)
    //         if (studyTime > 0) {
    //             studytime[startDate.getMonth()] += studyTime;
    //         }
    //     }
    //     startDate.setDate(startDate.getDate() + 1);


    myChartThree = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labelList,
            datasets: [{
                data: studytime,
                backgroundColor: [
                    'rgba(0, 185, 186, 0.5)',
                    'rgba(0, 200, 186, 0.4)',
                    'rgba(0, 185, 186, 0.3)',
                    'rgba(0, 185, 186, 0.2)',
                ],
                borderColor: 'rgba(0, 185, 186, 1)',
                borderWidth: 2,
                label: '연도별 학습시간입니다',
            }]
        },
        options: {
            legend: {
                display: false
            },
            responsive: true,
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: false
                    }
                }]
            },

        }
    });
}

export { myChartThree };