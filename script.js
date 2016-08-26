var c = document.getElementById("c");
var ctx = c.getContext("2d");
var cH;
var cW;
var bgColor = "#FFBE53";
var animations = [];
var circles = [];
var ratio;
var pointer = ("ontouchstart" in window || navigator.msMaxTouchPoints) ? "touchstart" : "mousedown";

var colorPicker = (function() {
  var colors = [ "#2980B9", "#282741", "#FF6138", "#FFBE53"];
  var index = 0;
  function next() {
    index = index++ < colors.length-1 ? index : 0;
    return colors[index];
  }
  function current() {
    return colors[index]
  }
  return {
    next: next,
    current: current
  }
})();

var removeAnimation = function(animation) {
  var index = animations.indexOf(animation);
  if (index > -1) animations.splice(index, 1);
}

function calcPageFillRadius(x, y) {
  var l = Math.max(x - 0, cW - x);
  var h = Math.max(y - 0, cH - y);
  return Math.sqrt(Math.pow(l, 2) + Math.pow(h, 2));
}

var addClickListeners = function(){
  
  // In this case, "add click listeners" actually means
  // "do literally everything in the Pen."
  // ... Sick advanced tactic.
  document.addEventListener(pointer, function(e){
    var currentColor = colorPicker.current();
    var nextColor = colorPicker.next();
    var targetR = calcPageFillRadius(e.pageX, e.pageY);
    var rippleSize = Math.min(200, (cW * .4 / ratio));
    var minCoverDuration = 900;
    
    var pageFill = new Circle({
      x: e.pageX,
      y: e.pageY,
      r: 0,
      fill: nextColor
    });
    var fillAnimation = anime({
      targets: pageFill,
      r: targetR,
      duration:  Math.max(targetR/1.5, minCoverDuration),
      easing: "easeOutCubic",
      complete: function(){
        bgColor = pageFill.fill;
        removeAnimation(fillAnimation);
      }
    });
    
    var ripple = new Circle({
      x: e.pageX,
      y: e.pageY,
      r: 0,
      fill: currentColor,
      stroke: {
        width: 3,
        color: currentColor
      },
      opacity: 1
    });
    var rippleAnimation = anime({
      targets: ripple,
      r: rippleSize,
      opacity: 0,
      easing: "easeOutExpo",
      duration: 900,
      complete: removeAnimation
    });
    
    var particles = [];
    for (var i=0; i<32; i++) {
      var particle = new Circle({
        x: e.pageX,
        y: e.pageY,
        fill: currentColor,
        r: anime.random(24, 48)
      })
      particles.push(particle);
    }
    var particlesAnimation = anime({
      targets: particles,
      x: function(particle){
        return particle.x + anime.random(rippleSize, -rippleSize);
      },
      y: function(particle){
        return particle.y + anime.random(rippleSize * 1.15, -rippleSize * 1.15);
      },
      r: 0,
      easing: "easeOutExpo",
      duration: anime.random(1000,1300),
      complete: removeAnimation
    });
    animations.push(fillAnimation, rippleAnimation, particlesAnimation);
  });
};

function extend(a, b){
  for(var key in b) {
    if(b.hasOwnProperty(key)) {
      a[key] = b[key];
    }
  }
  return a;
}

var Circle = function(opts) {
  extend(this, opts);
}

Circle.prototype.draw = function() {
  ctx.globalAlpha = this.opacity || 1;
  ctx.beginPath();
  ctx.arc(this.x, this.y, this.r, 0, 2 * Math.PI, false);
  if (this.stroke) {
    ctx.strokeStyle = this.stroke.color;
    ctx.lineWidth = this.stroke.width;
    ctx.stroke();
  }
  if (this.fill) {
    ctx.fillStyle = this.fill;
    ctx.fill();
  }
  ctx.closePath();
  ctx.globalAlpha = 1;
}

var animate = anime({
  duration: Infinity,
  update: function() {
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, cW, cH);
    animations.forEach(function(anim) {
      anim.animatables.forEach(function(animatable) {
        animatable.target.draw();
      });
    });
  }
});

var resizeCanvas = function() {
  var devicePixelRatio = window.devicePixelRatio || 1;
  var backingStoreRatio =
      ctx.webkitBackingStorePixelRatio ||
      ctx.mozBackingStorePixelRatio ||
      ctx.msBackingStorePixelRatio ||
      ctx.oBackingStorePixelRatio ||
      ctx.backingStorePixelRatio || 1;

  ratio = devicePixelRatio / backingStoreRatio;
  cH = c.height = window.innerHeight * ratio;
  cW = c.width = window.innerWidth * ratio;
  ctx.scale(ratio, ratio);
};

var init = (function(){
  window.addEventListener("resize", resizeCanvas);
  addClickListeners();
  resizeCanvas();
  if (!!window.location.pathname.match(/fullcpgrid/)) {
    startFauxClicking();
  }
  var inactive = setTimeout(function(){
    fauxClick(cW/2/ratio, cH/2/ratio);
  }, 2000);
  document.addEventListener(pointer, function(){
    clearTimeout(inactive);
  })
})();

function startFauxClicking() {
  setInterval(function(){
    fauxClick(anime.random( cW * .2, cW * .8) / ratio, anime.random(cH * .2, cH * .8) / ratio);
  }, 700);
}

function fauxClick(x, y) {
  var fclick = new Event("mousedown");
    fclick.pageX = x;
    fclick.pageY = y;
    document.dispatchEvent(fclick);
}