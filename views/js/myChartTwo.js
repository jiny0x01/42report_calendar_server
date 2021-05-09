import { JSONdata } from "../js/submit.js"
var myChartTwo = '';
export function ChartCreate2() {

    let month = Number(document.getElementsByClassName('reportMonth')[0].innerHTML);
    let day = Number(document.getElementsByClassName('reportDate')[0].innerHTML);
    let year = Number(document.getElementsByClassName('fc-toolbar-title')[0].innerHTML.split('년')[0])
    let today = new Date(year, month - 1, day);
    let lastDate = new Date(year, month, 0).getDate()
    // 중복 키가 불가능하게 코딩.
    // 키: 멤버, 밸류: 함께 공부한 시간.
    let studymember = new Map();
    for (let i = 0; i < lastDate; i++) {
        let data = JSONdata.filter(d => d.Month == today.getMonth() + 1 && d.year == today.getFullYear() && d.date == today.getDate());
        if (data[0] != null) {
            let studyMember = data[0].studyMember
            if (studyMember != null)
                studyMember.map((member) => {
                    if (studymember.get(member) == null)
                        studymember.set(member, 1);
                    else
                        studymember.set(member, studymember.get(member) + 1);
                })

        }
        today.setDate(today.getDate() + 1);
    }
    // 추적한 멤버 목록 토대로 sort
    let memberSort = [...studymember.entries()].sort((a, b) => a[1] < b[1])
    var ctx2 = document.getElementById('myChartTwo').getContext('2d');
    myChartTwo = new Chart(ctx2, {
        type: 'bar',
        data: {
            labels: [...memberSort.map(d => d[0]).slice(0, 9)],
            datasets: [{
                data: [...memberSort.map(d => d[1]).slice(0, 9)],
                backgroundColor: [
                    'rgba(227, 89, 132, 0.7)',
                    'rgba(60, 149, 254, 0.7)',
                    'rgba(56, 234, 100, 0.7)',
                    'rgba(231, 227, 32, 0.7)'
                ],
                label: '함께 한 동료 횟수(한달 기준)',
                color: 'black',
                display:false,
                borderColor: 'rgba(255, 255, 255, 1)',
                borderWidth: 0,
                hoverBorderColor: 'rgba(0, 185, 186, 1)',
                hoverBorderWidth: 3,
            }],

        },
        options: {
            lengend: false,
            layout: { padding: 10, margin: 10 },
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                animateScale: true,
                animateRotate: true
            },
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: true,
                        padding: 7,
                        stepSize: 1,
                    }
                }],
                xAxes: [{
                    ticks: {
                        beginAtZero: true,
                        padding: 7,
                        stepSize: 1,
                    }
                }]
            }
        },


        ///////-------------------------------------------
        // // animation: false,
        // pieceLabel: { 
        //     mode:"label", position:"outside", fontSize: 11, fontStyle: 'bold'

        //     // ,mode:"label", 
        //     // // position: "", 
        //     // fontSize: 11, 
        //     // fontStyle: 'bold',
        //     // fontColor: '#000'
        // }
        // }
    });
}

export { myChartTwo };