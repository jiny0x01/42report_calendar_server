import * as ICAL from 'ical.js'
import { createPlugin, EventSourceDef, EventInput, addDays, DateRange } from '@fullcalendar/common'

type Success = (rawFeed: string, xhr: XMLHttpRequest) => void
type Failure = (error: string, xhr: XMLHttpRequest) => void

interface ICalFeedMeta {
  url: string
  format: 'ics', // for EventSourceApi
  internalState?: InternalState // HACK. TODO: use classes in future
}

interface InternalState {
  completed: boolean
  callbacks: ((errorMessage: string, iCalEvents: ICAL.Event, xhr: XMLHttpRequest) => void)[]
  errorMessage: string
  iCalEvents: ICAL.Event
  xhr: XMLHttpRequest | null
}

let eventSourceDef: EventSourceDef<ICalFeedMeta> = {

  parseMeta(refined) {
    if (refined.url && refined.format === 'ics') {
      return {
        url: refined.url,
        format: 'ics',
      }
    }
    return null
  },

  fetch(arg, onSuccess, onFailure) {
    let { meta } = arg.eventSource
    let { internalState } = meta

    function handleIcalEvents(errorMessage, iCalEvents, xhr) {
      if (errorMessage) {
        onFailure({ message: errorMessage, xhr })
      } else {
        onSuccess({ rawEvents: expandICalEvents(iCalEvents, arg.range), xhr })
      }
    }

    if (!internalState) {
      internalState = meta.internalState = { // our ghetto Promise
        completed: false,
        callbacks: [handleIcalEvents],
        errorMessage: '',
        iCalEvents: [],
        xhr: null,
      }

      requestICal(
        meta.url,
        (rawFeed, xhr) => {
          const iCalEvents = parseICalFeed(rawFeed)

          for (let callback of internalState.callbacks) {
            callback('', iCalEvents, xhr)
          }

          internalState.completed = true
          internalState.callbacks = []
          internalState.iCalEvents = iCalEvents
          internalState.xhr = xhr
        },
        (errorMessage, xhr) => {
          for (let callback of internalState.callbacks) {
            callback(errorMessage, [], xhr)
          }

          internalState.completed = true
          internalState.callbacks = []
          internalState.errorMessage = errorMessage
          internalState.xhr = xhr
        },
      )
    } else if (!internalState.completed) {
      internalState.callbacks.push(handleIcalEvents)
    } else {
      handleIcalEvents(internalState.errorMessage, internalState.iCalEvents, internalState.xhr)
    }
  },
}

function requestICal(url: string, successCallback: Success, failureCallback: Failure) {
  const xhr = new XMLHttpRequest()
  xhr.open('GET', url, true)
  xhr.onload = () => {
    if (xhr.status >= 200 && xhr.status < 400) {
      successCallback(xhr.responseText, xhr)
    } else {
      failureCallback('Request failed', xhr)
    }
  }
  xhr.onerror = () => failureCallback('Request failed', xhr)
  xhr.send(null)
}

function parseICalFeed(feedStr: string): ICAL.Event[] {
  let components = null

  try {
    let feed = ICAL.parse(feedStr)
    let rootComponent = new ICAL.Component(feed)
    components = rootComponent.getAllSubcomponents('vevent')
  } catch (error) {
    console.warn(`Error parsing feed: ${error}`)
    return []
  }

  let iCalEvents: ICAL.Event[] = []

  for (let component of components) {
    try {
      let iCalEvent = new ICAL.Event(component)

      if (iCalEvent.startDate) { // is an accessor method. if throws an error, is a bad event
        iCalEvents.push(iCalEvent)
      }
    } catch (error) {
      console.warn(`Unable to process item in calendar: ${error}`)
    }
  }

  return iCalEvents
}

function expandICalEvents(iCalEvents: ICAL.Event[], range: DateRange): EventInput[] {
  let eventInputs: EventInput[] = []
  let rangeStart = addDays(range.start, -1) // account for current TZ needing before UTC date
  let rangeEnd = addDays(range.end, 1) // same. TODO: consider duration?

  for (let iCalEvent of iCalEvents) {
    if (iCalEvent.isRecurring()) {
      let expansion = iCalEvent.iterator(ICAL.Time.fromJSDate(rangeStart))
      let startDateTime: ICAL.Time

      while ((startDateTime = expansion.next())) {
        let startDate = startDateTime.toJSDate()

        if (startDate.valueOf() >= rangeEnd.valueOf()) {
          break
        } else {
          eventInputs.push({
            title: iCalEvent.summary,
            start: startDateTime.toString(),
            end: null, // TODO
          })
        }
      }
    } else {
      eventInputs.push(
        buildSingleEvent(iCalEvent),
      )
    }
  }

  return eventInputs
}

function buildSingleEvent(iCalEvent: ICAL.Event): EventInput {
  return {
    title: iCalEvent.summary,
    start: iCalEvent.startDate.toString(),
    end: (iCalEvent.endDate ? iCalEvent.endDate.toString() : null),
  }
}

export default createPlugin({
  eventSourceDefs: [eventSourceDef],
})
