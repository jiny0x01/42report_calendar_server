describe('gotoDate', () => {
  it('will update calendar\'s date even if no navigation', () => {
    initCalendar({
      initialDate: '2018-12-25',
      initialView: 'dayGridMonth',
    })

    expect(currentCalendar.getDate()).toEqualDate('2018-12-25')
    currentCalendar.gotoDate('2018-12-30')
    expect(currentCalendar.getDate()).toEqualDate('2018-12-30')
  })

  describe('when asynchronicity', () => {
    pushOptions({
      events(arg, callback) {
        setTimeout(() => {
          callback([])
        }, 0)
      },
    })

    it('works when called right after initialization', () => {
      initCalendar({
        initialView: 'dayGridMonth',
        initialDate: '2017-03-30',
      })
      currentCalendar.gotoDate('2017-06-01')
    })

    it('works when called right after initialization when date already in range', () => {
      initCalendar({
        initialView: 'dayGridMonth',
        initialDate: '2017-03-30',
      })
      currentCalendar.gotoDate('2017-03-01')
    })
  })
})
