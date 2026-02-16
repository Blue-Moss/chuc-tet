/* ----------------------------------------------------------------
   CẤU HÌNH GIAO DIỆN TÌNH YÊU & TẾT
---------------------------------------------------------------- */
// Mặc định màu chữ là Hồng Phấn (Hot Pink) cho lãng mạn
let currentTextRGB = { r: 255, g: 105, b: 180 }; 

let fullscreenRequested = false;
let textSequenceFinished = false;

function requestFullScreen() {
    const el = document.documentElement;
    if (el.requestFullscreen) el.requestFullscreen();
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    else if (el.msRequestFullscreen) el.msRequestFullscreen();
}

function onUserInteract() {
    if (!fullscreenRequested) {
        requestFullScreen();
        fullscreenRequested = true;
    }
    playSound();
}

document.addEventListener('click', onUserInteract, { once: true });
document.addEventListener('touchstart', onUserInteract, { once: true });

document.addEventListener('fullscreenchange', () => {
    resizeCanvas();
    S.Drawing.adjustCanvas();
});

let fireworksStarted = false;

function startFireworks() {
    if (fireworksStarted) return;
    fireworksStarted = true;
    if (rainInterval) {
        clearInterval(rainInterval);
        rainInterval = null;
    }

    document.getElementById("rainCanvas").style.display = "none";
    document.querySelector(".canvas").style.display = "none";

    const fireCanvas = document.getElementById("fireCanvas");
    fireCanvas.style.display = "block";
    showNightView();

    if (window.initFireworks) {
        window.initFireworks();
    }
}

function showNightView() {
    let night = document.getElementById("nightView");
    if (!night) {
        night = document.createElement("img");
        night.id = "nightView";
        night.src = "./images/night_view.png";
        Object.assign(night.style, {
            position: "fixed", bottom: "0", left: "0", width: "100%", height: "auto",
            maxHeight: "300px", zIndex: "999", pointerEvents: "none",
            opacity: "0", transition: "opacity 2s ease"
        });
        document.body.appendChild(night);
        requestAnimationFrame(() => { night.style.opacity = "1"; });
    }
}

var S = {
    init: function () {
        S.Drawing.init('.canvas');
        document.body.classList.add('body--ready');
        // Chuỗi hiển thị (Có thể thêm tên người yêu vào đây)
        S.UI.simulate("#countdown 3|HAPPY|NEW YEAR|2026|I LOVE|YOU|❤️");
        S.Drawing.loop(function () {
            S.Shape.render();
        });
    }
};

S.Drawing = (function () {
    var canvas, context, renderFn,
        requestFrame = window.requestAnimationFrame || function (cb) { window.setTimeout(cb, 1000 / 60); };
    return {
        init: function (el) {
            canvas = document.querySelector(el);
            context = canvas.getContext('2d');
            this.adjustCanvas();
            window.addEventListener('resize', () => S.Drawing.adjustCanvas());
        },
        loop: function (fn) {
            renderFn = !renderFn ? fn : renderFn;
            this.clearFrame();
            renderFn();
            requestFrame.call(window, this.loop.bind(this));
        },
        adjustCanvas: function () {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        },
        clearFrame: function () {
            context.clearRect(0, 0, canvas.width, canvas.height);
        },
        getArea: function () { return { w: canvas.width, h: canvas.height }; },
        drawCircle: function (p, c) {
            context.fillStyle = c.render();
            context.beginPath();
            context.arc(p.x, p.y, p.z, 0, 2 * Math.PI, true);
            context.closePath();
            context.fill();
        }
    };
}());

S.UI = (function () {
    var interval, currentAction, time, maxShapeSize = 30, sequence = [], cmd = '#';

    function formatTime(date) {
        var h = date.getHours(), m = date.getMinutes();
        return h + ':' + (m < 10 ? '0' + m : m);
    }
    function getValue(val) { return val && val.split(' ')[1]; }
    function getAction(val) { val = val && val.split(' ')[0]; return val && val[0] === cmd && val.substring(1); }
    
    function timedAction(fn, delay, max, reverse) {
        clearInterval(interval);
        currentAction = reverse ? max : 1;
        fn(currentAction);
        if (!max || (!reverse && currentAction < max) || (reverse && currentAction > 0)) {
            interval = setInterval(function () {
                currentAction = reverse ? currentAction - 1 : currentAction + 1;
                if (reverse && currentAction < 0) { clearInterval(interval); return; }
                fn(currentAction);
                if ((!reverse && max && currentAction === max) || (reverse && currentAction === 0)) {
                    clearInterval(interval);
                }
            }, delay);
        }
    }

    function performAction(value) {
        var action, val, current;
        sequence = typeof (value) === 'object' ? value : sequence.concat(value.split('|'));
        
        timedAction(function (index) {
            current = sequence.shift();
            action = getAction(current);
            val = getValue(current);

            switch (action) {
                case 'countdown':
                    val = parseInt(val) || 10;
                    val = val > 0 ? val : 10;
                    timedAction(function (index) {
                        if (index === 0) {
                            if (sequence.length === 0) {
                                clearInterval(interval);
                                textSequenceFinished = true;
                                setTimeout(startFireworks, 1500);
                            } else {
                                performAction(sequence);
                            }
                        } else {
                            // Số đếm ngược màu Trắng pha Hồng
                            currentTextRGB = { r: 255, g: 240, b: 245 }; 
                            S.Shape.switchShape(S.ShapeBuilder.letter(index), true);
                        }
                    }, 2000, val, true);
                    break;
                case 'rectangle':
                    val = val && val.split('x');
                    val = (val && val.length === 2) ? val : [maxShapeSize, maxShapeSize / 2];
                    S.Shape.switchShape(S.ShapeBuilder.rectangle(Math.min(maxShapeSize, parseInt(val[0])), Math.min(maxShapeSize, parseInt(val[1]))));
                    break;
                case 'circle':
                    val = parseInt(val) || maxShapeSize;
                    val = Math.min(val, maxShapeSize);
                    S.Shape.switchShape(S.ShapeBuilder.circle(val));
                    break;
                case 'time':
                    var t = formatTime(new Date());
                    if (sequence.length > 0) S.Shape.switchShape(S.ShapeBuilder.letter(t));
                    else timedAction(function () {
                        t = formatTime(new Date());
                        if (t !== time) { time = t; S.Shape.switchShape(S.ShapeBuilder.letter(time)); }
                    }, 1000);
                    break;
                default:
                    // LOGIC MÀU SẮC LÃNG MẠN
                    let text = current[0] === cmd ? 'Love' : current;
                    
                    if (text.includes('❤️')) {
                        currentTextRGB = { r: 255, g: 0, b: 50 }; // Đỏ tươi
                    } else if (text.includes('LOVE') || text.includes('HAPPY')) {
                        currentTextRGB = { r: 255, g: 105, b: 180 }; // Hồng đậm (Hot Pink)
                    } else {
                        currentTextRGB = { r: 255, g: 182, b: 193 }; // Hồng nhạt (Light Pink)
                    }
                    S.Shape.switchShape(S.ShapeBuilder.letter(text));
            }
        }, 6000, sequence.length);
    }
    return { simulate: function (action) { performAction(action); } };
}());

S.Point = function (args) { this.x = args.x; this.y = args.y; this.z = args.z; this.a = args.a; this.h = args.h; };
S.Color = function (r, g, b, a) { this.r = r; this.g = g; this.b = b; this.a = a; };
S.Color.prototype = { render: function () { return 'rgba(' + this.r + ',' + +this.g + ',' + this.b + ',' + this.a + ')'; } };

S.Dot = function (x, y) {
    this.p = new S.Point({ x: x, y: y, z: 6, a: 1, h: 0 }); // Z=6 cho hạt to rõ
    this.e = 0.07;
    this.s = true;
    this.c = new S.Color(255, 255, 255, this.p.a);
    this.t = this.clone();
    this.q = [];
};

S.Dot.prototype = {
    clone: function () { return new S.Point({ x: this.x, y: this.y, z: this.z, a: this.a, h: this.h }); },
    _draw: function () {
        this.c.a = this.p.a;
        this.c.r = currentTextRGB.r;
        this.c.g = currentTextRGB.g;
        this.c.b = currentTextRGB.b;
        S.Drawing.drawCircle(this.p, this.c);
    },
    _moveTowards: function (n) {
        var details = this.distanceTo(n, true), dx = details[0], dy = details[1], d = details[2], e = this.e * d;
        if (this.p.h === -1) { this.p.x = n.x; this.p.y = n.y; return true; }
        if (d > 1) { this.p.x -= ((dx / d) * e); this.p.y -= ((dy / d) * e); } 
        else { if (this.p.h > 0) this.p.h--; else return true; }
        return false;
    },
    _update: function () {
        if (this._moveTowards(this.t)) {
            var p = this.q.shift();
            if (p) { this.t.x = p.x || this.p.x; this.t.y = p.y || this.p.y; this.t.z = p.z || this.p.z; this.t.a = p.a || this.p.a; this.p.h = p.h || 0; } 
            else {
                if (this.s) { this.p.x -= Math.sin(Math.random() * 3.142); this.p.y -= Math.sin(Math.random() * 3.142); } 
                else { this.move(new S.Point({ x: this.p.x + (Math.random() * 50) - 25, y: this.p.y + (Math.random() * 50) - 25 })); }
            }
        }
        d = this.p.a - this.t.a; this.p.a = Math.max(0.1, this.p.a - (d * 0.05));
        d = this.p.z - this.t.z; this.p.z = Math.max(1, this.p.z - (d * 0.05));
    },
    distanceTo: function (n, details) {
        var dx = this.p.x - n.x, dy = this.p.y - n.y, d = Math.sqrt(dx * dx + dy * dy);
        return details ? [dx, dy, d] : d;
    },
    move: function (p, avoidStatic) {
        if (!avoidStatic || (avoidStatic && this.distanceTo(p) > 1)) this.q.push(p);
    },
    render: function () { this._update(); this._draw(); }
};

S.ShapeBuilder = (function () {
    var gap = 11, shapeCanvas = document.createElement('canvas'), shapeContext = shapeCanvas.getContext('2d'), fontSize = 500, fontFamily = 'Avenir, Helvetica Neue, Helvetica, Arial, sans-serif';
    function fit() {
        shapeCanvas.width = Math.floor(window.innerWidth / gap) * gap;
        shapeCanvas.height = Math.floor(window.innerHeight / gap) * gap;
        shapeContext.fillStyle = 'red'; shapeContext.textBaseline = 'middle'; shapeContext.textAlign = 'center';
    }
    function processCanvas() {
        var pixels = shapeContext.getImageData(0, 0, shapeCanvas.width, shapeCanvas.height).data, dots = [], x = 0, y = 0, fx = shapeCanvas.width, fy = shapeCanvas.height, w = 0, h = 0;
        for (var p = 0; p < pixels.length; p += (4 * gap)) {
            if (pixels[p + 3] > 0) {
                dots.push(new S.Point({ x: x, y: y }));
                w = x > w ? x : w; h = y > h ? y : h; fx = x < fx ? x : fx; fy = y < fy ? y : fy;
            }
            x += gap;
            if (x >= shapeCanvas.width) { x = 0; y += gap; p += gap * 4 * shapeCanvas.width; }
        }
        return { dots: dots, w: w + fx, h: h + fy };
    }
    function setFontSize(s) { shapeContext.font = 'bold ' + s + 'px ' + fontFamily; }
    function isNumber(n) { return !isNaN(parseFloat(n)) && isFinite(n); }
    fit(); window.addEventListener('resize', fit);
    return {
        imageFile: function (url, callback) {
            var image = new Image(), a = S.Drawing.getArea();
            image.onload = function () {
                shapeContext.clearRect(0, 0, shapeCanvas.width, shapeCanvas.height);
                shapeContext.drawImage(this, 0, 0, a.h * 0.6, a.h * 0.6);
                callback(processCanvas());
            };
            image.onerror = function () { callback(S.ShapeBuilder.letter('What?')); };
            image.src = url;
        },
        circle: function (d) {
            var r = Math.max(0, d) / 2; shapeContext.clearRect(0, 0, shapeCanvas.width, shapeCanvas.height);
            shapeContext.beginPath(); shapeContext.arc(r * gap, r * gap, r * gap, 0, 2 * Math.PI, false); shapeContext.fill(); shapeContext.closePath();
            return processCanvas();
        },
        letter: function (l) {
            var s = 0; setFontSize(fontSize);
            s = Math.min(fontSize, (shapeCanvas.width / shapeContext.measureText(l).width) * 0.8 * fontSize, (shapeCanvas.height / fontSize) * (isNumber(l) ? 1 : 0.45) * fontSize);
            setFontSize(s); shapeContext.clearRect(0, 0, shapeCanvas.width, shapeCanvas.height);
            shapeContext.fillText(l, shapeCanvas.width / 2, shapeCanvas.height / 2);
            return processCanvas();
        },
        rectangle: function (w, h) {
            var dots = [], width = gap * w, height = gap * h;
            for (var y = 0; y < height; y += gap) { for (var x = 0; x < width; x += gap) { dots.push(new S.Point({ x: x, y: y })); } }
            return { dots: dots, w: width, h: height };
        }
    };
}());

S.Shape = (function () {
    var dots = [], width = 0, height = 0, cx = 0, cy = 0;
    function compensate() { var a = S.Drawing.getArea(); cx = a.w / 2 - width / 2; cy = a.h / 2 - height / 2; }
    return {
        shuffleIdle: function () {
            var a = S.Drawing.getArea();
            for (var d = 0; d < dots.length; d++) {
                if (!dots[d].s) { dots[d].move({ x: Math.random() * a.w, y: Math.random() * a.h }); }
            }
        },
        switchShape: function (n, fast) {
            var size, a = S.Drawing.getArea(); width = n.w; height = n.h; compensate();
            if (n.dots.length > dots.length) {
                size = n.dots.length - dots.length;
                for (var d = 1; d <= size; d++) dots.push(new S.Dot(a.w / 2, a.h / 2));
            }
            var d = 0, i = 0;
            while (n.dots.length > 0) {
                i = Math.floor(Math.random() * n.dots.length);
                dots[d].e = fast ? 0.25 : (dots[d].s ? 0.14 : 0.11);
                if (dots[d].s) { dots[d].move(new S.Point({ z: Math.random() * 20 + 10, a: Math.random(), h: 18 })); } 
                else { dots[d].move(new S.Point({ z: Math.random() * 5 + 5, h: fast ? 18 : 30 })); }
                dots[d].s = true;
                dots[d].move(new S.Point({ x: n.dots[i].x + cx, y: n.dots[i].y + cy, a: 1, z: 6, h: 0 }));
                n.dots = n.dots.slice(0, i).concat(n.dots.slice(i + 1));
                d++;
            }
            for (var i = d; i < dots.length; i++) {
                if (dots[i].s) {
                    dots[i].move(new S.Point({ z: Math.random() * 20 + 10, a: Math.random(), h: 20 }));
                    dots[i].s = false; dots[i].e = 0.04;
                    dots[i].move(new S.Point({ x: Math.random() * a.w, y: Math.random() * a.h, a: 0.3, z: Math.random() * 4, h: 0 }));
                }
            }
        },
        render: function () { for (var d = 0; d < dots.length; d++) dots[d].render(); }
    };
}());

let effectsStarted = false;
const rainCanvas = document.getElementById("rainCanvas");
const textCanvas = document.querySelector(".canvas");

function tryStartEffects() {
    rainCanvas.style.display = "block";
    textCanvas.style.display = "block";
    if (!effectsStarted) { effectsStarted = true; S.init(); resizeCanvas(); playSound(); }
}

window.addEventListener("load", tryStartEffects);
window.addEventListener("resize", tryStartEffects);
window.addEventListener("orientationchange", tryStartEffects);

const sound = document.getElementById('sound');
function playSound() {
    if (sound && sound.paused) {
        sound.play().catch((e) => console.log('Phát nhạc bị chặn:', e));
    }
}
window.addEventListener('load', playSound);
document.addEventListener('click', playSound);
document.addEventListener('touchstart', playSound);

const canvas = document.getElementById('rainCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() { if (rainCanvas) { rainCanvas.width = window.innerWidth; rainCanvas.height = window.innerHeight; } }
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ❤'.split(''); // Thêm tim vào mưa
const fontSize = 18;
let columns = Math.floor(window.innerWidth / fontSize);
const drops = Array(columns).fill(1);

function drawRainBackground() {
    // Nền Tím Than Đậm (Deep Purple) - Tạo không khí lãng mạn huyền ảo
    ctx.fillStyle = 'rgba(15, 5, 20, 0.15)'; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.font = fontSize + 'px arial';
    
    for (let i = 0; i < drops.length; i++) {
        const text = letters[Math.floor(Math.random() * letters.length)];
        
        // MÀU MƯA: Random gradient từ Tím -> Hồng -> Xanh Dương nhạt (Pastel)
        // Tạo cảm giác lung linh, không bị gắt như xanh lá
        const hue = Math.floor(Math.random() * 60) + 280; // Dải màu Tím-Hồng
        ctx.fillStyle = `hsl(${hue}, 100%, 75%)`;
        
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);
        if (drops[i] * fontSize > canvas.height || Math.random() > 0.96) { drops[i] = 0; }
        drops[i]++;
    }
}
let rainInterval = setInterval(drawRainBackground, 40);