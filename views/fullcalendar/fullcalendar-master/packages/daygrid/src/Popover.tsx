import { createElement, ComponentChildren, applyStyle, BaseComponent, DelayedRunner, Ref, setRef, Dictionary } from '@fullcalendar/common'

export interface PopoverProps {
  title: string
  extraClassNames?: string[]
  extraAttrs?: Dictionary
  alignmentEl: HTMLElement
  topAlignmentEl?: HTMLElement
  onClose?: () => void
  elRef?: Ref<HTMLDivElement>
  children?: ComponentChildren
}

const PADDING_FROM_VIEWPORT = 10
const SCROLL_DEBOUNCE = 10

export class Popover extends BaseComponent<PopoverProps> {
  private rootEl: HTMLElement
  private repositioner = new DelayedRunner(this.updateSize.bind(this))

  render() {
    let { theme } = this.context
    let { props } = this
    let classNames = [
      'fc-popover',
      theme.getClass('popover'),
    ].concat(
      props.extraClassNames || [],
    )

    return (
      <div className={classNames.join(' ')} {...props.extraAttrs} ref={this.handleRootEl}>
        <div className={'fc-popover-header ' + theme.getClass('popoverHeader')}>
          <span className="fc-popover-title">
            {props.title}
          </span>
          <span className={'fc-popover-close ' + theme.getIconClass('close')} onClick={this.handleCloseClick} />
        </div>
        <div className={'fc-popover-body ' + theme.getClass('popoverContent')}>
          {props.children}
        </div>
      </div>
    )
  }

  componentDidMount() {
    document.addEventListener('mousedown', this.handleDocumentMousedown)
    document.addEventListener('scroll', this.handleDocumentScroll)
    this.updateSize()
  }

  componentWillUnmount() {
    document.removeEventListener('mousedown', this.handleDocumentMousedown)
    document.removeEventListener('scroll', this.handleDocumentScroll)
  }

  handleRootEl = (el: HTMLElement | null) => {
    this.rootEl = el

    if (this.props.elRef) {
      setRef(this.props.elRef, el)
    }
  }

  // Triggered when the user clicks *anywhere* in the document, for the autoHide feature
  handleDocumentMousedown = (ev) => {
    let { onClose } = this.props

    // only hide the popover if the click happened outside the popover
    if (onClose && !this.rootEl.contains(ev.target)) {
      onClose()
    }
  }

  handleDocumentScroll = () => {
    this.repositioner.request(SCROLL_DEBOUNCE)
  }

  handleCloseClick = () => {
    let { onClose } = this.props

    if (onClose) {
      onClose()
    }
  }

  // TODO: adjust on window resize

  /*
  NOTE: the popover is position:fixed, so coordinates are relative to the viewport
  NOTE: the PARENT calls this as well, on window resize. we would have wanted to use the repositioner,
        but need to ensure that all other components have updated size first (for alignmentEl)
  */
  private updateSize() {
    let { alignmentEl, topAlignmentEl } = this.props
    let { rootEl } = this

    if (!rootEl) {
      return // not sure why this was null, but we shouldn't let external components call updateSize() anyway
    }

    let dims = rootEl.getBoundingClientRect() // only used for width,height
    let alignment = alignmentEl.getBoundingClientRect()

    let top = topAlignmentEl ? topAlignmentEl.getBoundingClientRect().top : alignment.top
    top = Math.min(top, window.innerHeight - dims.height - PADDING_FROM_VIEWPORT)
    top = Math.max(top, PADDING_FROM_VIEWPORT)

    let left: number

    if (this.context.isRtl) {
      left = alignment.right - dims.width
    } else {
      left = alignment.left
    }

    left = Math.min(left, window.innerWidth - dims.width - PADDING_FROM_VIEWPORT)
    left = Math.max(left, PADDING_FROM_VIEWPORT)

    applyStyle(rootEl, { top, left })
  }
}
