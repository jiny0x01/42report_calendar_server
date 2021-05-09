import {
  EventSegUiInteractionState,
  VNode,
  DateComponent,
  createElement,
  PositionCache,
  RefMap,
  mapHash,
  CssDimValue,
  DateRange,
  getSegMeta,
  DateProfile,
  Fragment,
  BgEvent,
  renderFill,
  isPropsEqual,
  createRef,
  buildEventRangeKey,
} from '@fullcalendar/common'
import { TableSeg, splitSegsByFirstCol } from './TableSeg'
import { TableCell, TableCellModel, MoreLinkArg } from './TableCell'
import { TableListItemEvent } from './TableListItemEvent'
import { TableBlockEvent } from './TableBlockEvent'
import { computeFgSegPlacement } from './event-placement'
import { hasListItemDisplay } from './event-rendering'

// TODO: attach to window resize?

export interface TableRowProps {
  cells: TableCellModel[]
  renderIntro?: () => VNode
  businessHourSegs: TableSeg[]
  bgEventSegs: TableSeg[]
  fgEventSegs: TableSeg[]
  dateSelectionSegs: TableSeg[]
  eventSelection: string
  eventDrag: EventSegUiInteractionState | null
  eventResize: EventSegUiInteractionState | null
  dayMaxEvents: boolean | number
  dayMaxEventRows: boolean | number
  clientWidth: number | null
  clientHeight: number | null // simply for causing an updateSize, for when liquid height
  onMoreClick?: (arg: MoreLinkArg & {fromCol: number}) => void
  dateProfile: DateProfile
  todayRange: DateRange
  showDayNumbers: boolean
  showWeekNumbers: boolean
  buildMoreLinkText: (num: number) => string
}

interface TableRowState {
  framePositions: PositionCache
  maxContentHeight: number | null
  segHeights: { [instanceIdAndFirstCol: string]: number } | null
}

export class TableRow extends DateComponent<TableRowProps, TableRowState> {
  private cellElRefs = new RefMap<HTMLTableCellElement>() // the <td>
  private frameElRefs = new RefMap<HTMLElement>() // the fc-daygrid-day-frame
  private fgElRefs = new RefMap<HTMLDivElement>() // the fc-daygrid-day-events
  private segHarnessRefs = new RefMap<HTMLDivElement>() // indexed by "instanceId:firstCol"
  private rootElRef = createRef<HTMLTableRowElement>()

  state: TableRowState = {
    framePositions: null,
    maxContentHeight: null,
    segHeights: {},
  }

  render() {
    let { props, state, context } = this
    let colCnt = props.cells.length

    let businessHoursByCol = splitSegsByFirstCol(props.businessHourSegs, colCnt)
    let bgEventSegsByCol = splitSegsByFirstCol(props.bgEventSegs, colCnt)
    let highlightSegsByCol = splitSegsByFirstCol(this.getHighlightSegs(), colCnt)
    let mirrorSegsByCol = splitSegsByFirstCol(this.getMirrorSegs(), colCnt)

    let { paddingBottoms, segsByFirstCol, segsByEachCol, segIsHidden, segTops, segMarginTops, moreCnts, moreTops } = computeFgSegPlacement(
      props.cells,
      props.fgEventSegs,
      props.dayMaxEvents,
      props.dayMaxEventRows,
      state.segHeights,
      state.maxContentHeight,
      colCnt,
      context.options.eventOrder,
    )

    let selectedInstanceHash = // TODO: messy way to compute this
      (props.eventDrag && props.eventDrag.affectedInstances) ||
      (props.eventResize && props.eventResize.affectedInstances) ||
      {}

    return (
      <tr ref={this.rootElRef}>
        {props.renderIntro && props.renderIntro()}
        {props.cells.map((cell, col) => {
          let normalFgNodes = this.renderFgSegs(
            segsByFirstCol[col],
            segIsHidden,
            segTops,
            segMarginTops,
            selectedInstanceHash,
            props.todayRange,
          )

          let mirrorFgNodes = this.renderFgSegs(
            mirrorSegsByCol[col],
            {},
            segTops, // use same tops as real rendering
            {},
            {},
            props.todayRange,
            Boolean(props.eventDrag),
            Boolean(props.eventResize),
            false, // date-selecting (because mirror is never drawn for date selection)
          )

          return (
            <TableCell
              key={cell.key}
              elRef={this.cellElRefs.createRef(cell.key)}
              innerElRef={this.frameElRefs.createRef(cell.key) /* FF <td> problem, but okay to use for left/right. TODO: rename prop */}
              dateProfile={props.dateProfile}
              date={cell.date}
              showDayNumber={props.showDayNumbers}
              showWeekNumber={props.showWeekNumbers && col === 0}
              forceDayTop={props.showWeekNumbers /* even displaying weeknum for row, not necessarily day */}
              todayRange={props.todayRange}
              extraHookProps={cell.extraHookProps}
              extraDataAttrs={cell.extraDataAttrs}
              extraClassNames={cell.extraClassNames}
              moreCnt={moreCnts[col]}
              buildMoreLinkText={props.buildMoreLinkText}
              onMoreClick={(arg) => {
                props.onMoreClick({ ...arg, fromCol: col })
              }}
              segIsHidden={segIsHidden}
              moreMarginTop={moreTops[col] /* rename */}
              segsByEachCol={segsByEachCol[col]}
              fgPaddingBottom={paddingBottoms[col]}
              fgContentElRef={this.fgElRefs.createRef(cell.key)}
              fgContent={( // Fragment scopes the keys
                <Fragment>
                  <Fragment>{normalFgNodes}</Fragment>
                  <Fragment>{mirrorFgNodes}</Fragment>
                </Fragment>
              )}
              bgContent={( // Fragment scopes the keys
                <Fragment>
                  {this.renderFillSegs(highlightSegsByCol[col], 'highlight')}
                  {this.renderFillSegs(businessHoursByCol[col], 'non-business')}
                  {this.renderFillSegs(bgEventSegsByCol[col], 'bg-event')}
                </Fragment>
              )}
            />
          )
        })}
      </tr>
    )
  }

  componentDidMount() {
    this.updateSizing(true)
  }

  componentDidUpdate(prevProps: TableRowProps, prevState: TableRowState) {
    let currentProps = this.props

    this.updateSizing(
      !isPropsEqual(prevProps, currentProps),
    )
  }

  getHighlightSegs(): TableSeg[] {
    let { props } = this

    if (props.eventDrag && props.eventDrag.segs.length) { // messy check
      return props.eventDrag.segs as TableSeg[]
    }

    if (props.eventResize && props.eventResize.segs.length) { // messy check
      return props.eventResize.segs as TableSeg[]
    }

    return props.dateSelectionSegs
  }

  getMirrorSegs(): TableSeg[] {
    let { props } = this

    if (props.eventResize && props.eventResize.segs.length) { // messy check
      return props.eventResize.segs as TableSeg[]
    }

    return []
  }

  renderFgSegs(
    segs: TableSeg[],
    segIsHidden: { [instanceId: string]: boolean }, // does NOT mean display:hidden
    segTops: { [instanceId: string]: number },
    segMarginTops: { [instanceId: string]: number },
    selectedInstanceHash: { [instanceId: string]: any },
    todayRange: DateRange,
    isDragging?: boolean,
    isResizing?: boolean,
    isDateSelecting?: boolean,
  ): VNode[] {
    let { context } = this
    let { eventSelection } = this.props
    let { framePositions } = this.state
    let defaultDisplayEventEnd = this.props.cells.length === 1 // colCnt === 1
    let nodes: VNode[] = []

    if (framePositions) {
      for (let seg of segs) {
        let instanceId = seg.eventRange.instance.instanceId
        let isMirror = isDragging || isResizing || isDateSelecting
        let isSelected = selectedInstanceHash[instanceId]
        let isInvisible = segIsHidden[instanceId] || isSelected

        // TODO: simpler way? NOT DRY
        let isAbsolute = segIsHidden[instanceId] || isMirror || seg.firstCol !== seg.lastCol || !seg.isStart || !seg.isEnd

        let marginTop: CssDimValue
        let top: CssDimValue
        let left: CssDimValue
        let right: CssDimValue

        if (isAbsolute) {
          top = segTops[instanceId]

          if (context.isRtl) {
            right = 0
            left = framePositions.lefts[seg.lastCol] - framePositions.lefts[seg.firstCol]
          } else {
            left = 0
            right = framePositions.rights[seg.firstCol] - framePositions.rights[seg.lastCol]
          }
        } else {
          marginTop = segMarginTops[instanceId]
        }

        /*
        known bug: events that are force to be list-item but span multiple days still take up space in later columns
        */
        nodes.push(
          <div
            className={'fc-daygrid-event-harness' + (isAbsolute ? ' fc-daygrid-event-harness-abs' : '')}
            key={instanceId}
            // in print mode when in mult cols, could collide
            ref={isMirror ? null : this.segHarnessRefs.createRef(instanceId + ':' + seg.firstCol)}
            style={{
              visibility: isInvisible ? 'hidden' : ('' as any),
              marginTop: marginTop || '',
              top: top || '',
              left: left || '',
              right: right || '',
            }}
          >
            {hasListItemDisplay(seg) ? (
              <TableListItemEvent
                seg={seg}
                isDragging={isDragging}
                isSelected={instanceId === eventSelection}
                defaultDisplayEventEnd={defaultDisplayEventEnd}
                {...getSegMeta(seg, todayRange)}
              />
            ) : (
              <TableBlockEvent
                seg={seg}
                isDragging={isDragging}
                isResizing={isResizing}
                isDateSelecting={isDateSelecting}
                isSelected={instanceId === eventSelection}
                defaultDisplayEventEnd={defaultDisplayEventEnd}
                {...getSegMeta(seg, todayRange)}
              />
            )}
          </div>,
        )
      }
    }

    return nodes
  }

  renderFillSegs(segs: TableSeg[], fillType: string): VNode {
    let { isRtl } = this.context
    let { todayRange } = this.props
    let { framePositions } = this.state
    let nodes: VNode[] = []

    if (framePositions) {
      for (let seg of segs) {
        let leftRightCss = isRtl ? {
          right: 0,
          left: framePositions.lefts[seg.lastCol] - framePositions.lefts[seg.firstCol],
        } : {
          left: 0,
          right: framePositions.rights[seg.firstCol] - framePositions.rights[seg.lastCol],
        }

        nodes.push(
          <div
            key={buildEventRangeKey(seg.eventRange)}
            className="fc-daygrid-bg-harness"
            style={leftRightCss}
          >
            {fillType === 'bg-event' ?
              <BgEvent seg={seg} {...getSegMeta(seg, todayRange)} /> :
              renderFill(fillType)}
          </div>,
        )
      }
    }

    return createElement(Fragment, {}, ...nodes)
  }

  updateSizing(isExternalSizingChange) {
    let { props, frameElRefs } = this

    if (props.clientWidth !== null) { // positioning ready?
      if (isExternalSizingChange) {
        let frameEls = props.cells.map((cell) => frameElRefs.currentMap[cell.key])

        if (frameEls.length) {
          let originEl = this.rootElRef.current

          this.setState({ // will trigger isCellPositionsChanged...
            framePositions: new PositionCache(
              originEl,
              frameEls,
              true, // isHorizontal
              false,
            ),
          })
        }
      }

      let limitByContentHeight = props.dayMaxEvents === true || props.dayMaxEventRows === true

      this.setState({
        segHeights: this.computeSegHeights(),
        maxContentHeight: limitByContentHeight ? this.computeMaxContentHeight() : null,
      })
    }
  }

  computeSegHeights() { // query
    return mapHash(this.segHarnessRefs.currentMap, (eventHarnessEl) => (
      eventHarnessEl.getBoundingClientRect().height
    ))
  }

  computeMaxContentHeight() {
    let firstKey = this.props.cells[0].key
    let cellEl = this.cellElRefs.currentMap[firstKey]
    let fcContainerEl = this.fgElRefs.currentMap[firstKey]

    return cellEl.getBoundingClientRect().bottom - fcContainerEl.getBoundingClientRect().top
  }

  public getCellEls() {
    let elMap = this.cellElRefs.currentMap

    return this.props.cells.map((cell) => elMap[cell.key])
  }
}

TableRow.addPropsEquality({
  onMoreClick: true, // never forces rerender
})

TableRow.addStateEquality({
  segHeights: isPropsEqual,
})
