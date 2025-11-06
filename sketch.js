/*
By Okazz
*/
let palette = ['#DE183C', '#F2B541', '#0C79BB', '#f0f0f0'];
let ctx;
let centerX, centerY;
let movers = [];
let cnv;
let sideMenuEl;
let menuWidth = 0;
let menuOpen = false;

function setup() {
	cnv = createCanvas(windowWidth, windowHeight);
	// position canvas at the top-left and ensure it fills the window
	cnv.position(0, 0);
	// keep the canvas under the menu
	cnv.style('z-index', '0');
	cnv.style('display', 'block');
	rectMode(CENTER);
	colorMode(HSB, 360, 100, 100, 100);
	ctx = drawingContext;
	centerX = width / 2;
	centerY = height / 2;

	// side menu element and interaction
	sideMenuEl = document.getElementById('sideMenu');
	if (sideMenuEl) {
		// compute width once (will update on resize)
		menuWidth = sideMenuEl.offsetWidth || 300;

		// open/close helpers
		const openMenu = () => {
			if (!menuOpen) {
				sideMenuEl.classList.add('open');
				sideMenuEl.setAttribute('aria-hidden', 'false');
				menuOpen = true;
			}
		};

		const closeMenu = () => {
			if (menuOpen) {
				sideMenuEl.classList.remove('open');
				sideMenuEl.setAttribute('aria-hidden', 'true');
				menuOpen = false;
			}
		};

		// mousemove: show when cursor is within left 100px; hide when cursor far to the right
		window.addEventListener('mousemove', (ev) => {
			const x = ev.clientX;
			if (x <= 100) {
				openMenu();
			} else if (x > menuWidth + 40) {
				closeMenu();
			}
		});

		// clicking outside the menu closes it
		window.addEventListener('click', (ev) => {
			if (!sideMenuEl.contains(ev.target) && ev.clientX > menuWidth + 40) {
				closeMenu();
			}
		});

		// update cached width on resize
		window.addEventListener('resize', () => {
			menuWidth = sideMenuEl.offsetWidth || 300;
		});
	}

	// iframe overlay elements and handlers
	const iframeOverlayEl = document.getElementById('iframeOverlay');
	const iframeEl = document.getElementById('contentIframe');
	const iframeCloseBtn = document.getElementById('iframeClose');

	const openIframe = (url) => {
		if (!iframeOverlayEl || !iframeEl) return;
		iframeEl.src = url;
		iframeOverlayEl.classList.add('open');
		iframeOverlayEl.setAttribute('aria-hidden', 'false');
	};

	const closeIframe = () => {
		if (!iframeOverlayEl || !iframeEl) return;
		iframeOverlayEl.classList.remove('open');
		iframeOverlayEl.setAttribute('aria-hidden', 'true');
		// clear src after transition to stop any media
		setTimeout(() => { iframeEl.src = ''; }, 350);
	}

	// Helper to set up iframe links
	const setupIframeLink = (elementId, url) => {
		const element = document.getElementById(elementId);
		if (element) {
			element.addEventListener('click', (ev) => {
			ev.preventDefault();
				openIframe(url);
			});
		}
	};

	setupIframeLink('menu-work', 'https://a801nita-collab.github.io/20251020/');
	setupIframeLink('menu-handout', 'https://hackmd.io/@8R3rNBC5Tz2EDJ4XvI1alQ/BJbxv7Ajel/');
	setupIframeLink('menu-quiz', 'https://a801nita-collab.github.io/20251103-anita/');
	setupIframeLink('menu-quiz-notes', 'https://hackmd.io/@8R3rNBC5Tz2EDJ4XvI1alQ/rJKNvcK1Wg');
	setupIframeLink('menu-work-notes', 'https://hackmd.io/@8R3rNBC5Tz2EDJ4XvI1alQ/rJKNvcK1Wg');

	if (iframeCloseBtn) {
		iframeCloseBtn.addEventListener('click', (ev) => {
			ev.stopPropagation();
			closeIframe();
		});
	}

	// click backdrop to close
	if (iframeOverlayEl) {
		iframeOverlayEl.addEventListener('click', (ev) => {
			if (ev.target === iframeOverlayEl || ev.target.classList.contains('iframe-backdrop')) {
				closeIframe();
			}
		});
	}
}

function windowResized() {
	// resize canvas and update any cached dimensions
	resizeCanvas(windowWidth, windowHeight);
	centerX = width / 2;
	centerY = height / 2;
}

function draw() {
	background('#000000');
	for (let i of movers) {
		i.run();
	}
	for (let i = 0; i < movers.length; i++) {
		if (movers[i].isDead) {
			movers.splice(i, 1);
		}
	}

	if (frameCount % int(random(80)) == 0) {
		addMovers();
	}

}



function addMovers() {
	let x = random(width);
	let y = random(height);
	let num = int(random(1, 20));
	for (let i = 0; i < num; i++) {
		movers.push(new Mover01(x, y));
		movers.push(new Mover02(x, y));
		movers.push(new Mover03(x, y));
		movers.push(new Mover04(x, y));
		movers.push(new Mover05(x, y));
	}
}

function easeInOutCubic(x) {
	return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

/*------------------------------------------------------------------------------------------*/

class Mover01 {
	constructor(x, y) {
		this.x = x;
		this.y = y;
		this.lifeSpan = int(random(40, 130));
		this.life = this.lifeSpan;
		this.isDead = false;
		this.maxLength = random(0.05, 0.2) * width;
		this.direction = random(TAU);
		this.curX1 = 0;
		this.curX2 = 0;
		this.clr = random(palette);
		this.maxWingSize = width * 0.01;
		this.wing = 0;
	}

	show() {
		push();
		translate(this.x, this.y);
		rotate(this.direction);
		stroke(this.clr);
		strokeWeight(width * 0.002);
		line(this.curX1, 0, this.curX2, 0);
		line(this.curX1, 0, this.curX1 - this.wing, this.wing);
		line(this.curX1, 0, this.curX1 - this.wing, -this.wing);
		pop();
	}

	update() {

		let nrm = norm(this.life, this.lifeSpan, 0);
		this.curX1 = lerp(0, this.maxLength, nrm ** 0.6);
		this.curX2 = lerp(0, this.maxLength, nrm ** 5);
		this.wing = lerp(0, this.maxWingSize, sin(nrm * PI));
		this.life--;

		if (this.life < 0) {
			this.isDead = true;
		}
	}

	run() {
		this.show();
		this.update();
	}
}

/*------------------------------------------------------------------------------------------*/

class Mover02 {
	constructor(x, y) {
		this.x = x;
		this.y = y;
		this.lifeSpan = int(random(40, 120));
		this.life = this.lifeSpan;
		this.isDead = false;
		this.maxLength = random(0.05, 0.3) * width;
		this.direction = random(TAU);
		this.curX = this.x;
		this.curY = this.y;

		this.tgtX = this.x + this.maxLength * cos(this.direction);
		this.tgtY = this.y + this.maxLength * sin(this.direction);
		this.clr = random(palette);
		this.maxShapeSize = width * random(0.02, 0.005);
		this.shapeSize = 0;

		this.ang = random(TAU);
		this.angVel = random([-1, 1]) * random(0.09, 0.01);
	}

	show() {
		push();
		translate(this.curX, this.curY);
		rotate(this.ang);
		noStroke();
		fill(this.clr);
		beginShape();
		for (let i = 0; i < 10; i++) {
			let a = map(i, 0, 10, 0, TAU);
			let r = this.shapeSize;
			if (i % 2 == 0) {
				r *= 0.5;
			}
			vertex(r * cos(a), r * sin(a));
		}
		endShape();
		pop();
	}

	update() {

		let nrm = norm(this.life, this.lifeSpan, 0);
		this.curX = lerp(this.x, this.tgtX, nrm ** 0.5);
		this.curY = lerp(this.y, this.tgtY, nrm ** 0.5);
		this.shapeSize = lerp(0, this.maxShapeSize, sin(nrm * PI));
		this.ang += this.angVel;
		this.life--;

		if (this.life < 0) {
			this.isDead = true;
		}
	}

	run() {
		this.show();
		this.update();
	}
}

/*------------------------------------------------------------------------------------------*/

class Mover03 {
	constructor(x, y) {
		this.x = x;
		this.y = y;
		this.lifeSpan = int(random(60, 100));
		this.life = this.lifeSpan;
		this.isDead = false;
		this.maxLength = random(0.05, 0.3) * width;
		this.direction = random(TAU);
		this.curX = 0;
		this.tgtX = random(0.05, 0.3) * width;

		this.clr = color(random(palette));
		this.maxcircleD = width * random(0.03, 0.01);
		this.circleW = 0;
		this.circleH = 0;
		this.alp = 100;
	}

	show() {
		push();
		translate(this.x, this.y);
		rotate(this.direction);
		noStroke();
		this.clr.setAlpha(this.alp);
		fill(this.clr);
		ellipse(this.curX, 0, this.circleW, this.circleH);
		pop();
	}

	update() {
		let nrm = norm(this.life, this.lifeSpan, 0);
		this.circleW = lerp(0, this.maxcircleD, nrm ** 0.5);
		this.circleH = lerp(0, this.maxcircleD, nrm ** 2);
		this.curX = lerp(0, this.maxLength, easeInOutCubic(nrm));
		this.alp = lerp(100, 0, easeInOutCubic(nrm ** 8));
		this.life--;

		if (this.life < 0) {
			this.isDead = true;
		}
	}

	run() {
		this.show();
		this.update();
	}
}

/*------------------------------------------------------------------------------------------*/

class Mover04 {
	constructor(x, y) {
		this.x = x;
		this.y = y;
		this.lifeSpan = int(random(60, 100));
		this.life = this.lifeSpan;
		this.isDead = false;
		this.direction = random(4);
		this.pos = [];
		this.clr = random(palette);
		this.maxWeight = width * 0.002;
		this.weight = 0;

		this.posLimit = 30;

		this.initialValue = random(42937847294729);
		this.noiseScl = 1200;
		this.noiseStr = 300;
		this.step = random(1, 5);
	}

	show() {
		noFill();
		strokeWeight(this.weight);
		stroke(this.clr);
		beginShape();
		for (let i = 0; i < this.pos.length; i++) {
			vertex(this.pos[i].x, this.pos[i].y);
		}
		endShape();

		this.pos.push(createVector(this.x, this.y));

		if (this.pos.length >= this.posLimit) {
			this.pos.splice(0, 1);
		}
	}

	update() {
		let nrm = norm(this.life, this.lifeSpan, 0);
		let ang = noise(this.x / this.noiseScl, this.y / this.noiseScl, this.initialValue) * this.noiseStr;
		this.x += this.step * cos(ang);
		this.y += this.step * sin(ang);
		this.weight = lerp(0, this.maxWeight, sin(nrm * PI));
		this.life--;

		if (this.life < 0) {
			this.isDead = true;
		}
	}

	run() {
		this.show();
		this.update();
	}
}

/*------------------------------------------------------------------------------------------*/

class Mover05 {
	constructor(x, y) {
		this.x = x;
		this.y = y;
		this.lifeSpan = int(random(40, 80));
		this.life = this.lifeSpan;
		this.isDead = false;
		this.direction = random(4);
		this.clr = random(palette);

		this.ang = random(TAU);
		this.angVel = random([-1, 1]) * random(0.15, 0.005);

		this.cirX = 0;
		this.cirD = 0;
		this.maxCirX = width * random(0.05, 0.15);
		this.maxCirD = width * random(0.01, 0.03);
	}

	show() {
		push();
		translate(this.x, this.y);
		rotate(this.ang);
		noStroke();
		fill(this.clr);
		ellipse(this.cirX, 0, this.cirD / 2, this.cirD);
		pop();
	}

	update() {
		let nrm = norm(this.life, this.lifeSpan, 0);
		this.ang += this.angVel;
		this.cirX = lerp(0, this.maxCirX, nrm);
		this.cirD = lerp(0, this.maxCirD, sin(nrm * PI));

		this.life--;
		if (this.life < 0) {
			this.isDead = true;
		}
	}

	run() {
		this.show();
		this.update();
	}
}
