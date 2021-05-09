import { LocaleInput } from '@fullcalendar/common'

export default {
  code: 'ka',
  week: {
    dow: 1,
    doy: 7,
  },
  buttonText: {
    prev: 'წინა',
    next: 'შემდეგი',
    today: 'დღეს',
    month: 'თვე',
    week: 'კვირა',
    day: 'დღე',
    list: 'დღის წესრიგი',
  },
  weekText: 'კვ',
  allDayText: 'მთელი დღე',
  moreLinkText(n) {
    return '+ კიდევ ' + n
  },
  noEventsText: 'ღონისძიებები არ არის',
} as LocaleInput
