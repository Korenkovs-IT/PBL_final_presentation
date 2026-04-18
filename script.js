/* =========================================
   STARBUCKS TEAMWORK – PRESENTATION ENGINE
   Premium Animation & Navigation System
   ========================================= */

(function () {
    'use strict';

    // ---- State ----
    let currentSlide = 1;
    const totalSlides = 24;
    let isTransitioning = false;
    let timerInterval = null;
    let timerSeconds = 25;
    let timerActive = false;
    let idleTimer = null;
    let minimapOpen = false;

    // ---- DOM Refs ----
    const slides = document.querySelectorAll('.slide');
    const progressFill = document.getElementById('progress-fill');
    const currentSlideNum = document.getElementById('current-slide-num');
    const speakerName = document.getElementById('speaker-name');
    const btnPrev = document.getElementById('btn-prev');
    const btnNext = document.getElementById('btn-next');
    const navControls = document.getElementById('nav-controls');
    const keyboardHint = document.getElementById('keyboard-hint');
    const timerRing = document.getElementById('timer-ring');
    const timerFill = document.querySelector('.timer-fill');
    const timerText = document.getElementById('timer-text');
    const minimapToggle = document.getElementById('minimap-toggle');
    const minimapDots = document.getElementById('minimap-dots');
    const preloader = document.getElementById('preloader');

    // ---- Particle System ----
    function initParticles() {
        const canvas = document.getElementById('particles');
        const ctx = canvas.getContext('2d');
        let particles = [];
        const PARTICLE_COUNT = 60;

        function resize() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }

        resize();
        window.addEventListener('resize', resize);

        class Particle {
            constructor() {
                this.reset();
            }

            reset() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.size = Math.random() * 2 + 0.5;
                this.speedX = (Math.random() - 0.5) * 0.3;
                this.speedY = (Math.random() - 0.5) * 0.3;
                this.opacity = Math.random() * 0.3 + 0.1;
                this.opacitySpeed = (Math.random() - 0.5) * 0.005;
                // Green tinted particles
                const green = Math.floor(Math.random() * 60 + 140);
                this.color = `rgba(0, ${green}, ${Math.floor(green * 0.6)}, `;
            }

            update() {
                this.x += this.speedX;
                this.y += this.speedY;
                this.opacity += this.opacitySpeed;

                if (this.opacity <= 0.05 || this.opacity >= 0.4) {
                    this.opacitySpeed *= -1;
                }

                if (this.x < -10 || this.x > canvas.width + 10 ||
                    this.y < -10 || this.y > canvas.height + 10) {
                    this.reset();
                }
            }

            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = this.color + this.opacity + ')';
                ctx.fill();
            }
        }

        for (let i = 0; i < PARTICLE_COUNT; i++) {
            particles.push(new Particle());
        }

        // Draw connection lines between nearby particles
        function drawConnections() {
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < 150) {
                        const opacity = (1 - dist / 150) * 0.08;
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.strokeStyle = `rgba(0, 176, 116, ${opacity})`;
                        ctx.lineWidth = 0.5;
                        ctx.stroke();
                    }
                }
            }
        }

        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => {
                p.update();
                p.draw();
            });
            drawConnections();
            requestAnimationFrame(animate);
        }

        animate();
    }

    // ---- Preloader ----
    function hidePreloader() {
        setTimeout(() => {
            preloader.classList.add('hidden');
            // Trigger first slide animations
            triggerSlideAnimations(1);
        }, 2200);
    }

    // ---- Mini-map ----
    function initMinimap() {
        for (let i = 1; i <= totalSlides; i++) {
            const dot = document.createElement('div');
            dot.className = 'minimap-dot' + (i === 1 ? ' active' : '');
            dot.dataset.slide = i;
            dot.addEventListener('click', () => goToSlide(i));
            minimapDots.appendChild(dot);
        }

        minimapToggle.addEventListener('click', () => {
            minimapOpen = !minimapOpen;
            minimapDots.classList.toggle('visible', minimapOpen);
        });
    }

    function updateMinimap() {
        const dots = minimapDots.querySelectorAll('.minimap-dot');
        dots.forEach(dot => {
            dot.classList.toggle('active', parseInt(dot.dataset.slide) === currentSlide);
        });
    }

    // ---- Counter Animation ----
    function animateCounters(slideEl) {
        const counters = slideEl.querySelectorAll('.counter');
        counters.forEach(counter => {
            const target = parseInt(counter.dataset.target);
            const duration = 1500;
            const startTime = performance.now();

            function updateCounter(now) {
                const elapsed = now - startTime;
                const progress = Math.min(elapsed / duration, 1);
                // Ease out cubic
                const eased = 1 - Math.pow(1 - progress, 3);
                counter.textContent = Math.floor(eased * target);

                if (progress < 1) {
                    requestAnimationFrame(updateCounter);
                } else {
                    counter.textContent = target;
                }
            }

            requestAnimationFrame(updateCounter);
        });
    }

    // ---- Dashboard Bar Fills ----
    function animateDashBars(slideEl) {
        const fills = slideEl.querySelectorAll('.dash-fill');
        fills.forEach((fill, idx) => {
            const targetWidth = fill.style.width;
            fill.style.width = '0%';
            setTimeout(() => {
                fill.style.width = targetWidth;
            }, 300 + idx * 200);
        });
    }

    // ---- Slide Navigation ----
    function goToSlide(targetSlide) {
        if (isTransitioning || targetSlide === currentSlide) return;
        if (targetSlide < 1 || targetSlide > totalSlides) return;

        isTransitioning = true;

        const currentEl = slides[currentSlide - 1];
        const targetEl = slides[targetSlide - 1];

        // Reset fishbone animations
        resetFishbone(currentEl);

        // Exit current slide
        currentEl.classList.remove('active');
        currentEl.classList.add('exiting');

        // Reset animation elements of current slide
        resetAnimations(currentEl);

        // Enter new slide
        targetEl.classList.add('entering', 'active');

        // Update state
        currentSlide = targetSlide;
        updateUI();
        triggerSlideAnimations(targetSlide);

        // Cleanup after transition
        setTimeout(() => {
            currentEl.classList.remove('exiting');
            targetEl.classList.remove('entering');
            isTransitioning = false;
        }, 800);

        // Reset timer if active
        if (timerActive) {
            resetTimer();
        }
    }

    function nextSlide() {
        if (currentSlide < totalSlides) {
            goToSlide(currentSlide + 1);
        }
    }

    function prevSlide() {
        if (currentSlide > 1) {
            goToSlide(currentSlide - 1);
        }
    }

    function resetAnimations(slideEl) {
        const anims = slideEl.querySelectorAll('.anim-element');
        anims.forEach(el => {
            // Force re-trigger by resetting classes
            el.style.transition = 'none';
            el.offsetHeight; // Force reflow
            el.style.transition = '';
        });
    }

    function resetFishbone(slideEl) {
        const spine = slideEl.querySelector('.fishbone-spine');
        if (spine) {
            spine.style.strokeDashoffset = '700';
        }
        const bones = slideEl.querySelectorAll('.fishbone-bone');
        bones.forEach(b => b.style.strokeDashoffset = '200');
        const causes = slideEl.querySelectorAll('.fishbone-cause, .fishbone-solution');
        causes.forEach(c => c.style.opacity = '0');
        const heads = slideEl.querySelectorAll('.fishbone-head');
        heads.forEach(h => h.style.opacity = '0');
        const effects = slideEl.querySelectorAll('.fishbone-effect');
        effects.forEach(e => e.style.opacity = '0');
    }

    function triggerSlideAnimations(slideNum) {
        const slideEl = slides[slideNum - 1];

        // Animate counters
        animateCounters(slideEl);

        // Animate dashboard bars
        if (slideNum === 12) {
            animateDashBars(slideEl);
        }

        // Reset fishbone transitions for re-trigger
        if (slideNum === 16 || slideNum === 17) {
            const spine = slideEl.querySelector('.fishbone-spine');
            if (spine) {
                spine.style.transition = 'none';
                spine.style.strokeDashoffset = '700';
                spine.offsetHeight;
                spine.style.transition = '';
                // Let CSS transition handle it
                setTimeout(() => {
                    spine.style.strokeDashoffset = '0';
                }, 50);
            }
        }
    }

    // ---- UI Updates ----
    function updateUI() {
        // Progress bar
        const progress = (currentSlide / totalSlides) * 100;
        progressFill.style.width = progress + '%';

        // Slide counter
        currentSlideNum.textContent = String(currentSlide).padStart(2, '0');

        // Speaker name
        const slideEl = slides[currentSlide - 1];
        const speaker = slideEl.dataset.speaker;
        speakerName.textContent = 'Speaker ' + speaker;

        // Mini-map
        updateMinimap();
    }

    // ---- Timer ----
    function toggleTimer() {
        timerActive = !timerActive;
        timerRing.classList.toggle('visible', timerActive);

        if (timerActive) {
            resetTimer();
        } else {
            clearInterval(timerInterval);
        }
    }

    function resetTimer() {
        clearInterval(timerInterval);
        timerSeconds = 25;
        updateTimerDisplay();

        timerInterval = setInterval(() => {
            timerSeconds--;
            updateTimerDisplay();

            if (timerSeconds <= 0) {
                clearInterval(timerInterval);
                // Auto-advance
                nextSlide();
                if (timerActive && currentSlide < totalSlides) {
                    setTimeout(resetTimer, 900);
                }
            }
        }, 1000);
    }

    function updateTimerDisplay() {
        timerText.textContent = timerSeconds + 's';
        const dashValue = ((25 - timerSeconds) / 25) * 100;
        timerFill.setAttribute('stroke-dasharray', `${dashValue}, 100`);

        // Color change when low
        if (timerSeconds <= 5) {
            timerFill.style.stroke = '#e74c3c';
        } else {
            timerFill.style.stroke = '';
        }
    }

    // ---- Idle Detection for Nav Controls (disabled — always visible) ----
    function resetIdleTimer() {
        // Nav controls always stay visible
    }

    // ---- Keyboard Hint ----
    function hideKeyboardHint() {
        setTimeout(() => {
            keyboardHint.classList.remove('visible');
        }, 5000);
    }

    // ---- Event Listeners ----
    function initEvents() {
        // Keyboard
        document.addEventListener('keydown', (e) => {
            switch (e.key) {
                case 'ArrowRight':
                case ' ':
                case 'PageDown':
                    e.preventDefault();
                    nextSlide();
                    break;
                case 'ArrowLeft':
                case 'PageUp':
                    e.preventDefault();
                    prevSlide();
                    break;
                case 'Home':
                    e.preventDefault();
                    goToSlide(1);
                    break;
                case 'End':
                    e.preventDefault();
                    goToSlide(totalSlides);
                    break;
                case 'f':
                case 'F':
                    e.preventDefault();
                    toggleFullscreen();
                    break;
                case 't':
                case 'T':
                    e.preventDefault();
                    toggleTimer();
                    break;
            }
            resetIdleTimer();
            keyboardHint.classList.remove('visible');
        });

        // Nav buttons
        btnPrev.addEventListener('click', prevSlide);
        btnNext.addEventListener('click', nextSlide);

        // Mouse movement (idle detection disabled)
        // document.addEventListener('mousemove', resetIdleTimer);

        // Touch support
        let touchStartX = 0;
        let touchStartY = 0;

        document.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
            touchStartY = e.changedTouches[0].screenY;
        }, { passive: true });

        document.addEventListener('touchend', (e) => {
            const diffX = touchStartX - e.changedTouches[0].screenX;
            const diffY = touchStartY - e.changedTouches[0].screenY;

            if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
                if (diffX > 0) nextSlide();
                else prevSlide();
            }
        }, { passive: true });

        // Mouse wheel
        let wheelThrottle = false;
        document.addEventListener('wheel', (e) => {
            if (wheelThrottle) return;
            wheelThrottle = true;

            if (e.deltaY > 0) nextSlide();
            else prevSlide();

            setTimeout(() => { wheelThrottle = false; }, 800);
        }, { passive: true });

        // Nav controls always visible — no idle logic needed
    }

    // ---- Fullscreen ----
    function toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => { });
        } else {
            document.exitFullscreen().catch(() => { });
        }
    }

    // ---- Initialize ----
    function init() {
        initParticles();
        initMinimap();
        initEvents();
        updateUI();
        hidePreloader();
        hideKeyboardHint();
        resetIdleTimer();
    }

    // Wait for DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
