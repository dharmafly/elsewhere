/***********************************************

        Main page controller
      
        Scrolling
        Subnav
        Floating navigation
        
        See demo.js for Code Examples Controller

***********************************************/

var satya = satya || {};
satya.jQuery = satya.noConflict ? jQuery.noConflict(satya.noConflict) : jQuery;

satya.page = (function ($, $qS) { // jQuery and document.querySelector

  "use strict";

  // --------------------
  
  // LIBRARIES
  
  // jQuery Tiny Pub/Sub - v0.7 - 10/27/2011 http://benalman.com/
  // Copyright 2011 'Cowboy' Ben Alman; Licensed MIT, GPL 
   
  var o = $({});

  $.subscribe = function() {
    o.on.apply(o, arguments);
  };

  $.unsubscribe = function() {
    o.off.apply(o, arguments);
  };

  $.publish = function() {
    o.trigger.apply(o, arguments);
  };

  // UTILITIES
  
  function throttle(fn, delay) {
    var timer = null;
    return function () {
      var context = this, args = arguments;
      clearTimeout(timer);
      timer = setTimeout(function () {
        fn.apply(context, args);
      }, delay);
    };
  }
    
  function setClass(el, className, state){
    var  toggleClass = state ? 'add' : 'remove';
    el.classList[toggleClass](className);
  }
  
  function getOffsetY(target){
    var top = 0;

    while (target && target !== document.body){
      if (target.offsetTop){
        top += target.offsetTop;
      }
      target = target.offsetParent;
    }
    return top;
  }
  
  // Find the width of the biggest link in the subnav
  // to see how wide it is visually
  function getLinkListWidth(el){
    var links = el.querySelectorAll('a'),
        visualWidth = 0, 
        currentWidth;
        
    for (var i = 0; i < links.length; ++i) {
      currentWidth = links[i].getBoundingClientRect().width;
      visualWidth = currentWidth > visualWidth ? currentWidth : visualWidth;
    }
    return visualWidth;
  }
  
  
  function getTargetId(hashId){
    return hashId ? hashId.substring(1, hashId.length) : null;
  }
  
  // Animate a scroll to the provided offset.
  function animateScrollTo(offset, callback) {
  
    var total = Math.abs(window.pageYOffset - offset),
        start = document.documentElement.scrollHeight < window.innerHeight * 8 ? 
                  window.Math.ceil(500 * total / 
                    document.documentElement.scrollHeight) 
                  : window.Math.ceil(1000 * total / 
                    (window.innerHeight * 8)) ,
        last, 
        timer;
        
    clearTimeout(timer);
    
    (function doScroll() {
      
      if (last && window.pageYOffset !== last) {
        // Manually moved by the user so stop scrolling.
        return clearTimeout(timer);
      }

      var difference = window.pageYOffset - offset,
          direction  = difference < 1 ? 1 : -1,
          modifier   = Math.abs(difference) / total,  
          increment  = Math.ceil(start * modifier);
      
      if (difference !== last &&  (direction < 0 || 
          window.innerHeight + window.pageYOffset !== document.documentElement.scrollHeight)) {
        if (difference < increment && difference > increment * -1) {
          increment = Math.abs(difference);
        }
        last = window.pageYOffset + (increment * direction);
        
        
        if(Math.abs(difference) < 2){
          if(callback){
            callback();
          }
          return clearTimeout(timer);
        }
        
        window.scrollTo(0, last);
        timer = setTimeout(doScroll, 500 / 60);
      }
    })();
  }
  
  function setLogoPosition(){
    var header = $qS('h1.title'),
        svg_width = parseInt(getComputedStyle(header, ':after').width, 10);
    if(($qS('h1.title a').clientWidth + svg_width) > header.clientWidth){
      header.classList.add('long-title');
    }
  }
  
  function setPermalinkTopOffset(){
    var permalinks = document.querySelectorAll('.permalink'),
        navHeight = navEl.getBoundingClientRect().height,
        margin = 20,
        topOffset;
    
      
    topOffset = narrowScreen ? 
                  navHeight + navOffsetTop
                : navHeight + margin;
    
    for (var i = 0; i < permalinks.length; ++i) {
      var permalink = permalinks[i];  
      permalink.style.paddingTop = topOffset + 'px';
      permalink.style.top = '-' + topOffset + 'px';
    }
      
  }
  
  // ---------------------
  
  // satya
  
     
  var narrowScreen = satya.narrowScreen, 
      // Why sniff for ipad? 
      // It's to prevent iOS5 position fixed bugs, 
      // rather than anything to do with width
      isIPad = satya.isIPad, 
      navEl = $qS('#navigation'),
      header = $qS('header'),
      navOffsetTop = navEl.offsetTop,
      subnavId = 'subnav',
      subnavEl = $qS('#subnav'),
      content = $qS('section.content'),
      contentWidth = content.clientWidth,
      navigation,
      subnav;
      
  // --------------------

  // SCROLLING
  
  function  moveToAnchor(anchor){
        
        // set the position to scroll to - include hidden padding 
        // in anchor to set the position below fixed navigation
    var scrollYPos = getOffsetY(anchor),
        maxScrollDist = window.innerHeight * 2,
        distance =  Math.abs(scrollYPos - window.pageYOffset);
    
    // the distance between link and anchor > x screen heights
    if((distance > maxScrollDist)){
      // jump to anchor
      window.scrollTo(0, scrollYPos); 
      setLocationHash();
    }else{ 
      animateScrollTo(scrollYPos, setLocationHash);
    }
    
    function setLocationHash(){
      window.location.hash = anchor.id;
    }
    
  }
  
  // --------------------

  // NAV STATE CONTROLLER
  // See wiki/Navigation-State
 
  // HELPERS
  
  // Scroll position > height of the header
  function isScrollGtHeader(){ 
    return window.pageYOffset > navOffsetTop;
  }
  
  // width of subnav plus negative shift offscreen < visible width of subnav
  // or (space on left of content area < visible width of subnav (+ margin))
  function isSubnavSqueezed(){
    var subnavSqueezed = $(subnav.el).width() + parseInt(subnav.getLeftOffset(), 10) < subnav.width;
    //var subnavSqueezed = $(content).offset().left < subnav.width + subnav.margin;
    return subnavSqueezed;
  } 
  
  // COMPONENTS
  
  // Navigation (navigation)
  
  function Navigation(el) {
    this.el = el;
    this.isScrollGtHeader = false;
    this.height = el.getBoundingClientRect().height;
    this.subscribeEvents();
  }

  Navigation.prototype.subscribeEvents = function() { 
    var nav = this;
    
    // page scrolls beyond header height, set navigation to fixed position
    $.subscribe('scrollGtHeader', function(e, state){
      if(state !== nav.isScrollGtHeader){
        nav.isScrollGtHeader = state;     
        setClass(nav.el, 'float', state);
        // add placeholder for height of nav to not alter document height
        header.style.marginBottom = nav.isScrollGtHeader ? 
          nav.height + "px" : null;
        
        nav.toggleTitle(state);
        
      }
    });
    
  };
  
  Navigation.prototype.setSubnavButtonState = function(state) { 
    setClass(this.el, 'show-subnav-button', state);
  };
  
  Navigation.prototype.toggleTitle = function(add) { 
    var navItems = this.el.querySelector("ul");
    if(add){
      navItems.insertBefore(
        $qS('h1.title').cloneNode(true), 
        this.el.querySelector('.show-subnav').nextSibling
      );
    }else{
      navItems.removeChild(this.el.querySelector('h1'));
    }
  };
  
  // Left hand nav area
  function Subnav(el) {
    this.el = el; 
    this.isScrollGtHeader = false;
    this.isSubnavSqueezed = false;
    this.isOpen = null;
    this.timeout = null; 
    this.width = null; 
    this.height = this.el.getBoundingClientRect().height;
    this.clone = this.el.cloneNode(true);
    // TO DO
    this.margin = 20;
    this.fixedLeftPos = 0;
    
    this.addClone();
    this.subscribeEvents();
  }
  
  // Subnav (subnav)
  
  Subnav.prototype.addClone = function addClone() {
    var subnav = this;
    subnav.clone.id = 'subnavClone';
    subnav.clone.style.visibility = 'hidden';
    subnav.clone.style.top = '0px';
    content.appendChild(subnav.clone);
  };
  
  Subnav.prototype.subscribeEvents = function() {  
    var subnav = this;

    subnav.fixedLeftPos = subnav.getLeftOffset();
    
    // page scrolls beyond header height, set subnav to fixed, 
    // set left subnav to former left position (and vice versa)
    $.subscribe('scrollGtHeader', function(e, state){
    
      if(state !== subnav.isScrollGtHeader){ // there's a boundary change
      
        subnav.isScrollGtHeader = state; // set model
        
        setClass(subnav.el, 'fixed', state);
        
        subnav.el.style.left = subnav.isScrollGtHeader ?
                                subnav.isOpen ?
                                    subnav.openPos : 
                                    subnav.fixedLeftPos
                                : null;
                                
        // Set a fixed height on the subnav at the point
        // the subnav is taller than the available space on-screen
        subnav.setSubnavHeight();
        
      }
      
    });   
    
    $.subscribe('windowResized', function() {
      
      // update model for vertical scrolling state changes
      subnav.fixedLeftPos = subnav.getLeftOffset();
      
      subnav.openPos = subnav.fixedLeftPos;
      
      // set the left pos if position fixed
      // otherwise it will sit in the same place when the browser resizes
      if(subnav.isScrollGtHeader){
        subnav.el.style.left = subnav.fixedLeftPos;
        subnav.setSubnavHeight();
      } 
      
    });
    
    // show and hide the subnav and its button depending on the
    // avaiable space to the left of the content area
    $.subscribe('subnavSqueezed', function(e, state){
      subnav.el.style.visibility = 'visible';
      if(state !== subnav.isSubnavSqueezed){
        subnav.isSubnavSqueezed = state;   
        
        subnav.updateSubnavView(state);
        
        // if there's enough room for the subnav and the subnav is open
        // ISSUE: if the subnav is opened, then there's enough room for the subnav
        // Required: if the subnav is open and there's a enough room for the subnav if the subnav was closed.
        if(subnav.isOpen && subnav.isSubnavSqueezed === false){
          subnav.close();
        }
        
      }
    });
    
  };
  
  Subnav.prototype.updateSubnavView  = function updateSubnavView(state) {
    navigation.setSubnavButtonState(state);
    setClass(this.el, 'off-left', state);
  };
  
  // Set a fixed height on the subnav at the point
  // the subnav is taller than the available space on-screen
  Subnav.prototype.setSubnavHeight  = function setSubnavHeight(setHeight) {
    var availHeight = window.innerHeight - this.el.offsetTop - 10;
    
    if((this.isScrollGtHeader || setHeight) && (this.height > availHeight)){
      this.el.style.height = (availHeight - 20) + 'px';
    }else{
      this.el.style.height = null;
    }
  };
  
  Subnav.prototype.getLeftOffset  = function getLeftOffset() {
    return $(this.clone).offset().left + 'px';
  };
  
  Subnav.prototype.toggle = function() {
    if(this.isOpen){ 
      this.close();
    } 
    else {
      this.open();
    }  
  };
  
  Subnav.prototype.open = function() {
    this.isOpen = true;
    this.el.classList.add("show-nav");
    var subnav = this,  
        gutter = (window.innerWidth - contentWidth)/2;
    
    if(narrowScreen){
      this.el.classList.add("show-nav-small");
    }
    else{  
      content.style.left = (this.width - gutter) + (this.margin * 2) + "px"; 
      this.el.style.opacity = 0;
          
      // set open left position in model after the
      // animation to open is complete
      this.timeout = window.setTimeout(function(){
        subnav.openPos = subnav.getLeftOffset();
        if(subnav.isScrollGtHeader){
          // set the left pos if position fixed
          subnav.el.style.left = subnav.openPos;
        }
        subnav.el.style.opacity = 1;
      }, 309); 
    }
  };
  
  Subnav.prototype.close = function() {
    this.isOpen = false;
    this.el.classList.remove("show-nav");
    if(narrowScreen){
      this.el.classList.remove("show-nav-small");
    } else {
      content.style.left = null;
      this.el.style.opacity = null;
      clearTimeout(this.timeout);
    }
  };
  
  Subnav.prototype.setSelectSubnav = function() {
  
    var options = $(this.el).find('a').map(function(){
      var link = this,
          $link = $(link),
          linktext = $.trim($link.text()),
          option = $('<option></option>')
            .attr('value',link.hash)
            .text(linktext);
      
      return option[0];
    });
    
    var $select = $('<select id="subnav-menu">').append(options);
    
    $select.on('change', function(){
      window.location.hash = $(this).val();
    });
    
    $(navEl).find('ul').append($select[0]);
  };
  
  Subnav.prototype.isAncestor = function(child){
    var parent = child.parentNode,
        isAncestor = false;
    while(parent){
      if (parent.id === this.el.id){
          isAncestor = true;
          break;
      }
      parent =  parent.parentNode;
    }
    return isAncestor;
  };
  
  
  // --------------------
  
  // PAGE CONTROLLER
  
  function init(){
    var loc = window.location;
  
    navigation = new Navigation(navEl);
    subnav = new Subnav(subnavEl);
    
    // don't do transition of navigation on narrow screens
    if(narrowScreen){
      content.classList.add('content-small');
      document.body.classList.add('narrowScreen');
      // replaced by a non-visible select box (setSelectSubnav)
      //subnav.setSubnavHeight(true); 
      subnav.setSelectSubnav();
    }
    else{
    
      
      if(isIPad){
        // always use a select as a dropdown on the ipad
        subnav.setSelectSubnav();  
        subnav.updateSubnavView(true);
      }else{
        
        // publish resize events for setting subnav visibility
        window.addEventListener('resize', throttle(function(){
          $.publish('subnavSqueezed', isSubnavSqueezed());
          $.publish('windowResized');
        } , 1), false);
      }
      
      
      window.addEventListener('scroll', throttle(function(){
        $.publish('scrollGtHeader', isScrollGtHeader());
      } , 1), false);
      
    }
    
    window.addEventListener('load', function(){
      subnav.width = getLinkListWidth(subnav.el); 
      $.publish('subnavSqueezed', isSubnavSqueezed());
      setLogoPosition();
      document.body.classList.remove('loading');
    });
    
    /* document.body.addEventListener('orientationchange', function(){
      subnav.setSubnavHeight(true);
    }, false);*/
    
    // Handle scroll between inter-document links.
    document.body.addEventListener('click', function (event) {
      var el = event.target,
          hashId, anchor, selectNav;

      if (el.nodeName !== 'A' ||
          el.hash.length <= 1 ||
          el.protocol !== loc.protocol ||
          el.host !== loc.host ||
          el.pathname !== loc.pathname
      ){
        // Not internal link
        return;
      }

      hashId = event.target.hash;
      anchor = hashId && $qS(hashId);
      
      // replaced by a non-visible select box (setSelectSubnav)
      selectNav = narrowScreen || isIPad;
       
      
      // open close subnav was clicked 
      if(getTargetId(hashId) === subnavId) {
        event.preventDefault();
        if(!selectNav){
          subnav.toggle();
        }
      } 
      // link within page was clicked
      else if (anchor && !selectNav) {
        
        event.preventDefault();
        
        if(subnav.isAncestor(event.target)){
          subnav.close();
        }
       
        moveToAnchor(anchor);
        
      }
    });
    
    // -------
    setPermalinkTopOffset();
  }
  
  // Initialise after feature detection
  if (document.querySelectorAll && document.body.classList) {
    init();
  }else{
    document.body.className = document.body.className.replace( /(?:^|\s)loading(?!\S)/g , '' );
  }
  
  
})(satya.jQuery, function () { "use strict"; return document.querySelector.apply(document, arguments); });
