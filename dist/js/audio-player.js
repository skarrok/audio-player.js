function CtPlayer(el) {
    this.container = el;

    this.container.insertAdjacentHTML('beforeend',`
    <div class="ct-loading">
        <div class="ct-spinner"></div>
    </div>
    <div class="ct-play-pause-btn">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="24" viewBox="0 0 18 24">
            <path fill="#566574" fill-rule="evenodd" d="M18 12L0 24V0" class="ct-play-pause-icon"/>
        </svg>
    </div>

    <div class="ct-controls">
        <span class="ct-current-time">0:00</span>
        <div class="ct-slider" data-direction="horizontal">
            <div class="ct-progress">
                <div class="ct-pin progress-pin" data-method="rewindBind"></div>
            </div>
        </div>
        <span class="ct-total-time">0:00</span>
    </div>

    <div class="ct-volume">
        <div class="ct-volume-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                <path fill="#566574" fill-rule="evenodd" d="M14.667 0v2.747c3.853 1.146 6.666 4.72 6.666 8.946 0 4.227-2.813 7.787-6.666 8.934v2.76C20 22.173 24 17.4 24 11.693 24 5.987 20 1.213 14.667 0zM18 11.693c0-2.36-1.333-4.386-3.333-5.373v10.707c2-.947 3.333-2.987 3.333-5.334zm-18-4v8h5.333L12 22.36V1.027L5.333 7.693H0z" class="ct-speaker"/>
            </svg>
        </div>
        <div class="ct-volume-controls hidden">
            <div class="ct-slider" data-direction="vertical">
                <div class="ct-progress">
                    <div class="ct-pin volume-pin" data-method="changeVolumeBind"></div>
                </div>
            </div>
        </div>
    </div>
    <div class="ct-download">
        <a href="" class="ct-download-btn" target="_blank" download>
            <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="24" height="24" viewBox="0 0 433.5 433.5">
            <path d="M395.25,153h-102V0h-153v153h-102l178.5,178.5L395.25,153z M38.25,382.5v51h357v-51H38.25z" fill="#566574" class="ct-download-icon" />
            </svg>
        </a>
    </div>
    `);

    this.playPause = el.querySelector('.ct-play-pause-icon');
    this.playpauseBtn = el.querySelector('.ct-play-pause-btn');
    this.loading = el.querySelector('.ct-loading');
    this.progress = el.querySelector('.ct-progress');
    this.sliders = el.querySelectorAll('.ct-slider');
    this.volumeBtn = el.querySelector('.ct-volume-btn');
    this.volumeControls = el.querySelector('.ct-volume-controls');
    this.volumeProgress = this.volumeControls.querySelector('.ct-slider .ct-progress');
    this.player = el.querySelector('audio');
    this.currentTime = el.querySelector('.ct-current-time');
    this.totalTime = el.querySelector('.ct-total-time');
    this.speaker = el.querySelector('.ct-speaker');
    this.downloadBtn = el.querySelector('.ct-download-btn');

    this.draggableClasses = ['ct-pin'];
    this.currentlyDragged = null;

    this.initPlayer = function () {
        this.container.addEventListener('mousedown', this.mouseDown.bind(this));

        this.playpauseBtn.addEventListener('click', this.togglePlay.bind(this));

        var url = this.player.querySelector('source').getAttribute('src');
        this.downloadBtn.href = url;

        this.player.addEventListener('timeupdate', this.updateProgress.bind(this));
        this.player.addEventListener('volumechange', this.updateVolume.bind(this));
        this.player.addEventListener('loadedmetadata', () => {
            this.totalTime.textContent = this.formatTime(this.player.duration);
        });
        this.player.addEventListener('loadstart', () => {
            this.playpauseBtn.style.display = 'none';
            this.loading.style.visibility = 'visible';
            this.loading.style.display = 'block';
        });
        this.player.addEventListener('canplay', () => {
            this.playpauseBtn.style.display = 'block';
            this.loading.style.display = 'none';
        });
        this.player.addEventListener('ended', () => {
            this.playPause.attributes.d.value = "M18 12L0 24V0";
            this.player.currentTime = 0;
        });
        this.player.querySelectorAll('source').forEach(source => {
            source.addEventListener('error', () => {
                this.playpauseBtn.style.display = 'none';
                this.loading.style.display = 'block';
                this.loading.style.visibility = 'hidden';
            })
        });

        this.volumeBtn.addEventListener('click', () => {
            this.volumeBtn.classList.toggle('open');
            this.volumeControls.classList.toggle('hidden');
        })

        window.addEventListener('resize', this.directionAware.bind(this));

        this.sliders.forEach(slider => {
            let pin = slider.querySelector('.ct-pin');
            slider.addEventListener('click', this[pin.dataset.method]);
        });

        this.directionAware();

        if (this.player.preload != 'auto') {
            this.container.addEventListener('mouseenter', this.loadBind);
        }
    };

    this.load = function(event) {
        this.player.load();
        event.target.removeEventListener(event.type, this.loadBind);
    }

    this.loadBind = this.load.bind(this);

    this.mouseDown = function(event) {
        if(!this.isDraggable(event.target)) return false;

        this.currentlyDragged = event.target;
        let handleMethod = this.currentlyDragged.dataset.method;

        this.container.addEventListener('mousemove', this[handleMethod], false);

        this.container.addEventListener('mouseup', () => {
            this.currentlyDragged = false;
            this.container.removeEventListener('mousemove', this[handleMethod], false);
        }, false);
    };

    this.isDraggable = function (el) {
        let canDrag = false;
        let classes = Array.from(el.classList);
        this.draggableClasses.forEach(draggable => {
            if(classes.indexOf(draggable) !== -1)
                canDrag = true;
        })
        return canDrag;
    };

    this.inRange = function (event) {
        let rangeBox = this.getRangeBox(event);
        let rect = rangeBox.getBoundingClientRect();
        let direction = rangeBox.dataset.direction;
        if(direction == 'horizontal') {
            var min = rect.left;
            var max = min + rangeBox.offsetWidth;
            if(event.clientX < min || event.clientX > max) return false;
        } else {
            var min = rect.top;
            var max = min + rangeBox.offsetHeight;
            if(event.clientY < min || event.clientY > max) return false;
        }
        return true;
    };

    this.updateProgress = function () {
        var current = this.player.currentTime;
        var percent = (current / this.player.duration) * 100;
        this.progress.style.width = percent + '%';

        this.currentTime.textContent = this.formatTime(current);
    };

    this.updateVolume = function () {
        this.volumeProgress.style.height = this.player.volume * 100 + '%';
        if(this.player.volume >= 0.5) {
            this.speaker.attributes.d.value = 'M14.667 0v2.747c3.853 1.146 6.666 4.72 6.666 8.946 0 4.227-2.813 7.787-6.666 8.934v2.76C20 22.173 24 17.4 24 11.693 24 5.987 20 1.213 14.667 0zM18 11.693c0-2.36-1.333-4.386-3.333-5.373v10.707c2-.947 3.333-2.987 3.333-5.334zm-18-4v8h5.333L12 22.36V1.027L5.333 7.693H0z';
        } else if(this.player.volume < 0.5 && this.player.volume > 0.05) {
            this.speaker.attributes.d.value = 'M0 7.667v8h5.333L12 22.333V1L5.333 7.667M17.333 11.373C17.333 9.013 16 6.987 14 6v10.707c2-.947 3.333-2.987 3.333-5.334z';
        } else if(this.player.volume <= 0.05) {
            this.speaker.attributes.d.value = 'M0 7.667v8h5.333L12 22.333V1L5.333 7.667';
        }
    };

    this.getRangeBox = function (event) {
        let rangeBox = event.target;
        let el = this.currentlyDragged;
        if(event.type == 'click' && this.isDraggable(event.target)) {
            rangeBox = event.target.parentElement.parentElement;
        }
        if(event.type == 'mousemove') {
            rangeBox = el.parentElement.parentElement;
        }
        return rangeBox;
    };

    this.getCoefficient = function (event) {
        let slider = this.getRangeBox(event);
        let rect = slider.getBoundingClientRect();
        let K = 0;
        if(slider.dataset.direction == 'horizontal') {

            let offsetX = event.clientX - rect.left;
            let width = slider.clientWidth;
            K = offsetX / width;

        } else if(slider.dataset.direction == 'vertical') {

            let height = slider.clientHeight;
            var offsetY = event.clientY - rect.top;
            K = 1 - offsetY / height;

        }
        return K;
    };

    this.rewind = function (event) {
        if(this.inRange(event)) {
            let time = this.player.duration * this.getCoefficient(event);
            if (typeof time !== 'number' || !isFinite(time) || time < 0) {
                return;
            }
            this.player.currentTime = time;
        }
    };

    this.rewindBind = this.rewind.bind(this);

    this.changeVolume = function (event) {
        if(this.inRange(event)) {
            this.player.volume = this.getCoefficient(event);
        }
    };

    this.changeVolumeBind = this.changeVolume.bind(this)

    this.formatTime = function (time) {
        var min = Math.floor(time / 60);
        var sec = Math.floor(time % 60);
        return min + ':' + ((sec<10) ? ('0' + sec) : sec);
    };

    this.togglePlay = function () {
        if(this.player.paused) {
            this.playPause.attributes.d.value = "M0 0h6v24H0zM12 0h6v24h-6z";
            this.player.play();
        } else {
            this.playPause.attributes.d.value = "M18 12L0 24V0";
            this.player.pause();
        }
    };

    this.directionAware = function () {
        if(window.innerHeight < 250) {
            this.volumeControls.style.bottom = '-54px';
            this.volumeControls.style.left = '54px';
        } else if(el.offsetTop < 154) {
            this.volumeControls.style.bottom = '-164px';
            this.volumeControls.style.left = '-3px';
        } else {
            this.volumeControls.style.bottom = '52px';
            this.volumeControls.style.left = '-3px';
        }
    };
}
