import {
  Ref, DateMarker, BaseComponent, createElement, EventSegUiInteractionState, Seg, getSegMeta,
  DateRange, Fragment, DayCellRoot, NowIndicatorRoot, BgEvent, renderFill,
  DateProfile, config, buildEventRangeKey, sortEventSegs,
} from '@fullcalendar/common'
import { TimeColsSeg } from './TimeColsSeg'
import { TimeColsSlatsCoords } from './TimeColsSlatsCoords'
import { computeSegCoords, computeSegVerticals } from './event-placement'
import { TimeColEvent } from './TimeColEvent'
import { TimeColMisc } from './TimeColMisc'

export interface TimeColProps {
  elRef?: Ref<HTMLTableCellElement>
  dateProfile: DateProfile
  date: DateMarker
  nowDate: DateMarker
  todayRange: DateRange
  extraDataAttrs?: any
  extraHookProps?: any
  extraClassNames?: string[]
  fgEventSegs: TimeColsSeg[]
  bgEventSegs: TimeColsSeg[]
  businessHourSegs: TimeColsSeg[]
  nowIndicatorSegs: TimeColsSeg[]
  dateSelectionSegs: TimeColsSeg[]
  eventSelection: string
  eventDrag: EventSegUiInteractionState | null
  eventResize: EventSegUiInteractionState | null
  slatCoords: TimeColsSlatsCoords
  forPrint: boolean
}

config.timeGridEventCondensedHeight = 30

export class TimeCol extends BaseComponent<TimeColProps> {
  render() {
    let { props, context } = this
    let isSelectMirror = context.options.selectMirror

    let mirrorSegs: Seg[] = // yuck
      (props.eventDrag && props.eventDrag.segs) ||
      (props.eventResize && props.eventResize.segs) ||
      (isSelectMirror && props.dateSelectionSegs) ||
      []

    let interactionAffectedInstances = // TODO: messy way to compute this
      (props.eventDrag && props.eventDrag.affectedInstances) ||
      (props.eventResize && props.eventResize.affectedInstances) ||
      {}

    return (
      <DayCellRoot
        elRef={props.elRef}
        date={props.date}
        dateProfile={props.dateProfile}
        todayRange={props.todayRange}
        extraHookProps={props.extraHookProps}
      >
        {(rootElRef, classNames, dataAttrs) => (
          <td
            ref={rootElRef}
            className={['fc-timegrid-col'].concat(classNames, props.extraClassNames || []).join(' ')}
            {...dataAttrs}
            {...props.extraDataAttrs}
          >
            <div className="fc-timegrid-col-frame">
              <div className="fc-timegrid-col-bg">
                {this.renderFillSegs(props.businessHourSegs, 'non-business')}
                {this.renderFillSegs(props.bgEventSegs, 'bg-event')}
                {this.renderFillSegs(props.dateSelectionSegs, 'highlight')}
              </div>
              <div className="fc-timegrid-col-events">
                {this.renderFgSegs(
                  props.fgEventSegs,
                  interactionAffectedInstances,
                )}
              </div>
              <div className="fc-timegrid-col-events">
                {this.renderFgSegs(
                  mirrorSegs as TimeColsSeg[],
                  {},
                  Boolean(props.eventDrag),
                  Boolean(props.eventResize),
                  Boolean(isSelectMirror),
                  // TODO: pass in left/right instead of using only computeSegTopBottomCss
                )}
              </div>
              <div className="fc-timegrid-now-indicator-container">
                {this.renderNowIndicator(props.nowIndicatorSegs)}
              </div>
              <TimeColMisc
                date={props.date}
                dateProfile={props.dateProfile}
                todayRange={props.todayRange}
                extraHookProps={props.extraHookProps}
              />
            </div>
          </td>
        )}
      </DayCellRoot>
    )
  }

  renderFgSegs(
    segs: TimeColsSeg[],
    segIsInvisible: { [instanceId: string]: any },
    isDragging?: boolean,
    isResizing?: boolean,
    isDateSelecting?: boolean,
  ) {
    let { props } = this

    if (props.forPrint) {
      return this.renderPrintFgSegs(segs)
    }

    if (props.slatCoords) {
      return this.renderPositionedFgSegs(segs, segIsInvisible, isDragging, isResizing, isDateSelecting)
    }

    return null
  }

  renderPrintFgSegs(segs: TimeColsSeg[]) {
    let { props, context } = this

    // not DRY
    segs = sortEventSegs(segs, context.options.eventOrder) as TimeColsSeg[]

    return segs.map((seg) => (
      <div
        className="fc-timegrid-event-harness"
        key={seg.eventRange.instance.instanceId}
      >
        <TimeColEvent
          seg={seg}
          isDragging={false}
          isResizing={false}
          isDateSelecting={false}
          isSelected={false}
          isCondensed={false}
          {...getSegMeta(seg, props.todayRange, props.nowDate)}
        />
      </div>
    ))
  }

  renderPositionedFgSegs(
    segs: TimeColsSeg[],
    segIsInvisible: { [instanceId: string]: any },
    isDragging?: boolean,
    isResizing?: boolean,
    isDateSelecting?: boolean,
  ) {
    let { context, props } = this

    // assigns TO THE SEGS THEMSELVES
    // also, receives resorted array
    segs = computeSegCoords(segs, props.date, props.slatCoords, context.options.eventMinHeight, context.options.eventOrder) as TimeColsSeg[]

    return segs.map((seg) => {
      let instanceId = seg.eventRange.instance.instanceId
      let isMirror = isDragging || isResizing || isDateSelecting
      let positionCss = isMirror
        // will span entire column width
        // also, won't assign z-index, which is good, fc-event-mirror will overpower other harnesses
        ? { left: 0, right: 0, ...this.computeSegTopBottomCss(seg) }
        : this.computeFgSegPositionCss(seg)

      return (
        <div
          className={'fc-timegrid-event-harness' + (seg.level > 0 ? ' fc-timegrid-event-harness-inset' : '')}
          key={instanceId}
          style={{
            visibility: segIsInvisible[instanceId] ? 'hidden' : ('' as any),
            ...positionCss,
          }}
        >
          <TimeColEvent
            seg={seg}
            isDragging={isDragging}
            isResizing={isResizing}
            isDateSelecting={isDateSelecting}
            isSelected={instanceId === props.eventSelection}
            isCondensed={(seg.bottom - seg.top) < config.timeGridEventCondensedHeight}
            {...getSegMeta(seg, props.todayRange, props.nowDate)}
          />
        </div>
      )
    })
  }

  renderFillSegs(segs: TimeColsSeg[], fillType: string) {
    let { context, props } = this

    if (!props.slatCoords) { return null }

    // BAD: assigns TO THE SEGS THEMSELVES
    computeSegVerticals(segs, props.date, props.slatCoords, context.options.eventMinHeight)

    let children = segs.map((seg) => (
      <div key={buildEventRangeKey(seg.eventRange)} className="fc-timegrid-bg-harness" style={this.computeSegTopBottomCss(seg)}>
        {fillType === 'bg-event' ?
          <BgEvent seg={seg} {...getSegMeta(seg, props.todayRange, props.nowDate)} /> :
          renderFill(fillType)}
      </div>
    ))

    return <Fragment>{children}</Fragment>
  }

  renderNowIndicator(segs: TimeColsSeg[]) {
    let { slatCoords, date } = this.props

    if (!slatCoords) { return null }

    return segs.map((seg, i) => (
      <NowIndicatorRoot
        isAxis={false}
        date={date}
        // key doesn't matter. will only ever be one
        key={i} // eslint-disable-line react/no-array-index-key
      >
        {(rootElRef, classNames, innerElRef, innerContent) => (
          <div
            ref={rootElRef}
            className={['fc-timegrid-now-indicator-line'].concat(classNames).join(' ')}
            style={{ top: slatCoords.computeDateTop(seg.start, date) }}
          >
            {innerContent}
          </div>
        )}
      </NowIndicatorRoot>
    ))
  }

  computeFgSegPositionCss(seg) {
    let { isRtl, options } = this.context
    let shouldOverlap = options.slotEventOverlap
    let backwardCoord = seg.backwardCoord // the left side if LTR. the right side if RTL. floating-point
    let forwardCoord = seg.forwardCoord // the right side if LTR. the left side if RTL. floating-point
    let left // amount of space from left edge, a fraction of the total width
    let right // amount of space from right edge, a fraction of the total width

    if (shouldOverlap) {
      // double the width, but don't go beyond the maximum forward coordinate (1.0)
      forwardCoord = Math.min(1, backwardCoord + (forwardCoord - backwardCoord) * 2)
    }

    if (isRtl) {
      left = 1 - forwardCoord
      right = backwardCoord
    } else {
      left = backwardCoord
      right = 1 - forwardCoord
    }

    let props = {
      zIndex: seg.level + 1, // convert from 0-base to 1-based
      left: left * 100 + '%',
      right: right * 100 + '%',
    }

    if (shouldOverlap && seg.forwardPressure) {
      // add padding to the edge so that forward stacked events don't cover the resizer's icon
      props[isRtl ? 'marginLeft' : 'marginRight'] = 10 * 2 // 10 is a guesstimate of the icon's width
    }

    return { ...props, ...this.computeSegTopBottomCss(seg) }
  }

  computeSegTopBottomCss(seg) {
    return {
      top: seg.top,
      bottom: -seg.bottom,
    }
  }
}
