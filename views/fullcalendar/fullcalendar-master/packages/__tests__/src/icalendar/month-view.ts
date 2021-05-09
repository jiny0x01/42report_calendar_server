import XHRMock from 'xhr-mock'
import dayGridMonth from '@fullcalendar/daygrid'
import { EventSourceInput } from '@fullcalendar/core'
import iCalendarPlugin from '@fullcalendar/icalendar'
import { CalendarWrapper } from '../lib/wrappers/CalendarWrapper'
import alldayEvent from './data/alldayEvent'
import multidayEvent from './data/multidayEvent'
import multipleMultidayEvents from './data/multipleMultidayEvents'
import multipleEventsOneMunged from './data/multipleEventsOneMunged'
import oneHourMeeting from './data/oneHourMeeting'
import recurringWeeklyMeeting from './data/recurringWeeklyMeeting'
import mungedOneHourMeeting from './data/mungedOneHourMeeting'

describe('addICalEventSource with month view', () => {
  const ICAL_MIME_TYPE = 'text/calendar'

  pushOptions({
    plugins: [iCalendarPlugin, dayGridMonth],
    initialDate: '2019-04-10', // the start of the three-day event in the feed
    initialView: 'dayGridMonth',
  })

  beforeEach(() => { XHRMock.setup() })
  afterEach(() => { XHRMock.teardown() })

  it('adds an all day event', (done) => {
    loadICalendarWith(alldayEvent, () => {
      setTimeout(() => {
        assertEventCount(1)
        currentCalendar.getEvents().forEach((event) => expect(event.allDay).toBeTruthy())
        done()
      }, 100)
    })
  })

  it('adds a single multi-day event', (done) => {
    loadICalendarWith(multidayEvent, () => {
      setTimeout(() => {
        assertEventCount(1)
        currentCalendar.getEvents().forEach((event) => expect(event.allDay).toBeTruthy())
        done()
      }, 100)
    })
  })

  it('adds multiple multi-day events', (done) => {
    loadICalendarWith(multipleMultidayEvents, () => {
      setTimeout(() => {
        assertEventCount(2)
        currentCalendar.getEvents().forEach((event) => expect(event.allDay).toBeTruthy())
        done()
      }, 100)
    })
  })

  it('adds a one-hour long meeting', (done) => {
    loadICalendarWith(oneHourMeeting, () => {
      setTimeout(() => {
        assertEventCount(1)
        currentCalendar.getEvents().forEach((event) => expect(event.allDay).not.toBeTruthy())
        done()
      }, 100)
    })
  })

  it('adds a repeating weekly meeting', (done) => {
    loadICalendarWith(recurringWeeklyMeeting, () => {
      setTimeout(() => {
        assertEventCount(6)
        done()
      }, 100)
    })
  })

  it('ignores a munged event', (done) => {
    loadICalendarWith(mungedOneHourMeeting, () => {
      setTimeout(() => {
        assertEventCount(0)
        done()
      }, 100)
    })
  })

  it('adds a valid event and ignores a munged event', (done) => {
    loadICalendarWith(multipleEventsOneMunged, () => {
      setTimeout(() => {
        assertEventCount(1)
        done()
      }, 100)
    })
  })

  it('defaultAllDayEventDuration does not override ical default all day length of one day', (done) => {
    loadICalendarWith(
      alldayEvent,
      () => {
        setTimeout(() => {
          assertEventCount(1)
          const event = currentCalendar.getEvents()[0]
          expect(event.end.getDate()).toEqual(event.start.getDate() + 1)
          done()
        }, 100)
      },
      (source) => {
        initCalendar({
          forceEventDuration: true,
          defaultAllDayEventDuration: { days: 2 },
        }).addEventSource(source)
      },
    )
  })

  function loadICalendarWith(rawICal: string, assertions: () => void, calendarSetup?: (source: EventSourceInput) => void) {
    const feedUrl = '/mock.ics'

    XHRMock.get(feedUrl, (req, res) => {
      expect(req.url().query).toEqual({})

      return res.status(200)
        .header('content-type', ICAL_MIME_TYPE)
        .body(rawICal)
    })

    const source = { url: feedUrl, format: 'ics' } as EventSourceInput

    if (calendarSetup) {
      calendarSetup(source)
    } else {
      initCalendar().addEventSource(source)
    }

    assertions()
  }

  // Checks to make sure all events have been rendered and that the calendar
  // has internal info on all the events.
  function assertEventCount(expectedCount: number) {
    expect(currentCalendar.getEvents().length).toEqual(expectedCount)

    let calendarWrapper = new CalendarWrapper(currentCalendar)
    expect(calendarWrapper.getEventEls().length).toEqual(expectedCount)
  }
})
