import { JSONdata } from "../js/submit.js"
var myChartOne = '';
export function ChartCreate1() {

    var ctx = document.getElementById('myChartOne').getContext('2d');
    let month = Number(document.getElementsByClassName('reportMonth')[0].innerHTML);
    let day = 1;
    let year = Number(document.getElementsByClassName('fc-toolbar-title')[0].innerHTML.split('년')[0])
    let today = new Date(year, month - 1, day);
    let lastDate = new Date(year, month, 0).getDate()

    let studytime = [0.0, 0, 0, 0, 0, 0];
    let i = 0;
    let labelList = [
        month + '월 1주차',
        month + '월 2주차',
        month + '월 3주차',
        month + '월 4주차'
    ]
    for (let j = 0; j < lastDate; j++) {
        let data = JSONdata.filter(d => d.Month == today.getMonth() + 1 && d.year == today.getFullYear() && d.date == today.getDate());
        if (data[0] != null) {
            let studyTime = Number(data[0].studyTime)
            if (studyTime > 0) {
                studytime[i] += studyTime;
            }
        }
        if (i == 4)
            labelList[4] = month + '월 5주차';
        if (i == 5)
            labelList[5] = month + '월 6주차';
        if (today.getDay() == 0)
            i++;
        today.setDate(today.getDate() + 1);
    }

    if (studytime)
        myChartOne = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labelList,
                datasets: [{
                    // label: '주별 공부시간',
                    data: studytime,
                    backgroundColor: [
                        'rgba(0, 185, 186, 0.5)',
                        'rgba(0, 200, 186, 0.4)',
                        'rgba(0, 185, 186, 0.3)',
                        'rgba(0, 185, 186, 0.2)',
                    ],
                    borderColor: 'rgba(0, 185, 186, 1)',
                    borderWidth: 2,
                    label: '매주 주차별 학습시간입니다(단위: 분)',
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
                scales: {
                    xAxes: [{
                        ticks: {
                            beginAtZero: true,
                            fontSize: 14,
                        }
                    }]
                }
            }
        });
}

export { myChartOne };