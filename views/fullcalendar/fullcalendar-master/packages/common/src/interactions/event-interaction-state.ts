import { EventStore } from '../structs/event-store'

export interface EventInteractionState { // is this ever used alone?
  affectedEvents: EventStore
  mutatedEvents: EventStore
  isEvent: boolean
}
