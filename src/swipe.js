/*
 * Swipe 2.0
 *
 * Brad Birdsall
 * Copyright 2013, MIT License
 *
 */
export default function Swipe(container, options) {
  'use strict'

  // utilities
  var noop = function() {} // simple no operation function
  var offloadFn = function(fn) {
    setTimeout(fn || noop, 0)
  } // offload a functions execution

  var isAndroid = /android/.test(window.navigator.userAgent.toLocaleLowerCase())
  var lastMoveAt = 0

  // quit if no root element
  if (!container) return
  var element = container.children[0]
  var slides, slidePos, width
  options = options || {}
  var index = parseInt(options.startSlide, 10) || 0
  var speed = options.speed || 300
  var disabled = options.disabled || false
  options.continuous =
    options.continuous !== undefined ? options.continuous : true

  function setup() {
    // cache slides
    slides = element.children

    // set continuous to false if only one slide
    if (slides.length < 2) options.continuous = false

    //special case if two slides
    if (options.continuous && slides.length < 3) {
      element.appendChild(slides[0].cloneNode(true))
      element.appendChild(element.children[1].cloneNode(true))
      slides = element.children
    }

    // create an array to store current positions of each slide
    slidePos = new Array(slides.length)

    // determine width of each slide
    width = slides[0].getBoundingClientRect().width || slides[0].offsetWidth

    element.style.width = slides.length * width + 'px'

    // stack elements
    var pos = slides.length
    while (pos--) {
      var slide = slides[pos]

      slide.style.width = width + 'px'
      slide.setAttribute('data-index', pos)

      slide.style.left = pos * -width + 'px'
      slide.style.zIndex = slides.length - pos
      move(pos, index > pos ? -width : index < pos ? width : 0, 0)
    }

    // reposition elements before and after index
    if (options.continuous) {
      move(circle(index - 1), -width, 0)
      move(circle(index + 1), width, 0)
    }

    container.style.visibility = 'visible'
  }

  function prev() {
    if (options.continuous) slide(index - 1)
    else if (index) slide(index - 1)
  }

  function next() {
    if (options.continuous) slide(index + 1)
    else if (index < slides.length - 1) slide(index + 1)
  }

  function circle(index) {
    // a simple positive modulo using slides.length
    return (slides.length + (index % slides.length)) % slides.length
  }

  function slide(to, slideSpeed) {
    // do nothing if already on requested slide
    if (index === to) return

    var direction = Math.abs(index - to) / (index - to) // 1: backward, -1: forward

    // get the actual position of the slide
    if (options.continuous) {
      var natural_direction = direction
      direction = -slidePos[circle(to)] / width

      // if going forward but to < index, use to = slides.length + to
      // if going backward but to > index, use to = -slides.length + to
      if (direction !== natural_direction) to = -direction * slides.length + to
    }

    var diff = Math.abs(index - to) - 1

    // move all the slides between index and to in the right direction
    while (diff--)
      move(circle((to > index ? to : index) - diff - 1), width * direction, 0)

    to = circle(to)

    move(index, width * direction, slideSpeed || speed)
    move(to, 0, slideSpeed || speed)

    if (options.continuous)
      move(circle(to - direction), -(width * direction), 0) // we need to get the next in place

    index = to
    offloadFn(options.callback && options.callback(index, slides[index]))
    lastMoveAt = Date.now()
  }

  function move(index, dist, speed) {
    translate(index, dist, speed)
    slidePos[index] = dist
  }

  function translate(index, dist, speed) {
    var slide = slides[index]
    var style = slide && slide.style

    if (!style) return

    style.webkitTransitionDuration = style.MozTransitionDuration = style.msTransitionDuration = style.OTransitionDuration = style.transitionDuration =
      speed + 'ms'

    style.webkitTransform = style.msTransform = style.MozTransform = style.OTransform =
      'translateX(' + dist + 'px)'
  }

  // setup auto slideshow
  var delay = options.auto || 0
  var interval

  function begin() {
    interval = setTimeout(next, delay)
  }

  function stop() {
    delay = 0
    interval && clearTimeout(interval)
  }

  // setup initial vars
  var start = {}
  var delta = {}
  var isScrolling

  // setup event capturing
  var events = {
    handleEvent: function(event) {
      switch (event.type) {
        case 'touchstart':
          this.start(event)
          break
        case 'touchmove':
          this.move(event)
          break
        case 'touchend':
          offloadFn(this.end(event))
          break
        case 'webkitTransitionEnd':
        case 'msTransitionEnd':
        case 'oTransitionEnd':
        case 'otransitionend':
        case 'transitionend':
          offloadFn(this.transitionEnd(event))
          break
        case 'resize':
          offloadFn(setup)
          break
      }

      if (options.stopPropagation) event.stopPropagation()
    },
    start: function(event) {
      if (disabled) {
        return
      }

      var touches = event.touches[0]

      // measure start values
      start = {
        // get initial touch coords
        x: touches.pageX,
        y: touches.pageY,

        // store time to determine touch duration
        time: +new Date()
      }

      // used for testing first move event
      isScrolling = undefined

      // reset delta and end measurements
      delta = {}

      // attach touchmove and touchend listeners
      element.addEventListener('touchmove', this, false)
      element.addEventListener('touchend', this, false)
    },
    move: function(event) {
      if (disabled) {
        return
      }

      // ensure swiping with one touch and not pinching
      if (event.touches.length > 1 || (event.scale && event.scale !== 1)) return

      if (options.disableScroll) event.preventDefault()

      var touches = event.touches[0]

      // measure change in x and y
      delta = {
        x: touches.pageX - start.x,
        y: touches.pageY - start.y
      }

      // determine if scrolling test has run - one time test
      if (typeof isScrolling === 'undefined') {
        isScrolling = !!(isScrolling || Math.abs(delta.x) < Math.abs(delta.y))
      }

      // if user is not trying to scroll vertically
      if (!isScrolling) {
        // prevent native scrolling
        event.preventDefault()
        if (isAndroid) {
          if (Math.abs(delta.x) < Math.abs(delta.y) * 3) {
            stop()
            return
          }
        } else {
          event.stopPropagation()
        }

        // stop slideshow
        stop()

        // increase resistance if first or last slide
        if (options.continuous) {
          // we don't add resistance at the end

          translate(circle(index - 1), delta.x + slidePos[circle(index - 1)], 0)
          translate(index, delta.x + slidePos[index], 0)
          translate(circle(index + 1), delta.x + slidePos[circle(index + 1)], 0)
        } else {
          delta.x =
            delta.x /
            ((!index && delta.x > 0) || // if first slide and sliding left
            (index === slides.length - 1 && // or if last slide and sliding right
              delta.x < 0) // and if sliding at all
              ? Math.abs(delta.x) / width + 1 // determine resistance level
              : 1) // no resistance if false

          if (index === 0 && delta.x > 0) {
            return
          }
          if (index === element.children.length - 1 && delta.x < 0) {
            return
          }
          // translate 1:1
          translate(index - 1, delta.x + slidePos[index - 1], 0)
          translate(index, delta.x + slidePos[index], 0)
          translate(index + 1, delta.x + slidePos[index + 1], 0)
        }
      }
    },
    end: function() {
      // measure duration
      var duration = +new Date() - start.time

      // determine if slide attempt triggers next/prev slide
      var isValidSlide =
        (Number(duration) < 250 && // if slide duration is less than 250ms
          Math.abs(delta.x) > 20) || // and if slide amt is greater than 20px
        Math.abs(delta.x) > width / 2 // or if slide amt is greater than half the width

      // determine if slide attempt is past start and end
      var isPastBounds =
        (!index && delta.x > 0) || // if first slide and slide amt is greater than 0
        (index === slides.length - 1 && delta.x < 0) // or if last slide and slide amt is less than 0

      if (options.continuous) isPastBounds = false

      // determine direction of swipe (true:right, false:left)
      var direction = delta.x < 0

      // if not scrolling vertically
      if (!isScrolling) {
        if (isValidSlide && !isPastBounds) {
          if (direction) {
            if (options.continuous) {
              // we need to get the next in this direction in place

              move(circle(index - 1), -width, 0)
              move(circle(index + 2), width, 0)
            } else {
              move(index - 1, -width, 0)
            }

            move(index, slidePos[index] - width, speed)
            move(circle(index + 1), slidePos[circle(index + 1)] - width, speed)
            index = circle(index + 1)
          } else {
            if (options.continuous) {
              // we need to get the next in this direction in place

              move(circle(index + 1), width, 0)
              move(circle(index - 2), -width, 0)
            } else {
              move(index + 1, width, 0)
            }

            move(index, slidePos[index] + width, speed)
            move(circle(index - 1), slidePos[circle(index - 1)] + width, speed)
            index = circle(index - 1)
          }
          lastMoveAt = Date.now()
          options.callback && options.callback(index, slides[index])
        } else {
          if (options.continuous) {
            move(circle(index - 1), -width, speed)
            move(index, 0, speed)
            move(circle(index + 1), width, speed)
          } else {
            move(index - 1, -width, speed)
            move(index, 0, speed)
            move(index + 1, width, speed)
          }
        }
      }

      // kill touchmove and touchend event listeners until touchstart called again
      element.removeEventListener('touchmove', events, false)
      element.removeEventListener('touchend', events, false)
    },
    transitionEnd: function(event) {
      if (parseInt(event.target.getAttribute('data-index'), 10) === index) {
        if (delay) begin()

        options.transitionEnd &&
          options.transitionEnd.call(event, index, slides[index])
      }
    }
  }

  // trigger setup
  setup()

  // start auto slideshow if applicable
  if (delay) begin()

  // add event listeners
  element.addEventListener('touchstart', events, false)
  element.addEventListener('webkitTransitionEnd', events, false)
  element.addEventListener('msTransitionEnd', events, false)
  element.addEventListener('oTransitionEnd', events, false)
  element.addEventListener('otransitionend', events, false)
  element.addEventListener('transitionend', events, false)
  window.addEventListener('resize', events, false)

  // expose the Swipe API
  return {
    slide: function(to, speed) {
      if (speed && Date.now() - lastMoveAt <= speed) {
        return
      }
      // cancel slideshow
      stop()

      slide(to, speed)
    },
    prev: function() {
      // cancel slideshow
      stop()

      prev()
    },
    next: function() {
      // cancel slideshow
      stop()

      next()
    }
  }
}
