import { EventApi, ViewApi, VUIEvent } from '@fullcalendar/common'

export interface EventSegment {
  event: EventApi
  start: Date
  end: Date
  isStart: boolean
  isEnd: boolean
}

export type MoreLinkAction = MoreLinkSimpleAction | MoreLinkHandler
export type MoreLinkSimpleAction = 'popover' | 'week' | 'day' | 'timeGridWeek' | 'timeGridDay' | string

export interface MoreLinkArg {
  date: Date,
  allDay: boolean,
  allSegs: EventSegment[],
  hiddenSegs: EventSegment[],
  jsEvent: VUIEvent,
  view: ViewApi
}

export type MoreLinkHandler = (arg: MoreLinkArg) => MoreLinkSimpleAction | void
