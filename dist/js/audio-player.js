function CtPlayer(el) {
    this.container = el

    this.container.classList.add('audiopl-audio-player')

    this.container.insertAdjacentHTML('beforeend',`
    <div class="audiopl-loading">
        <div class="audiopl-spinner"></div>
    </div>
    <div class="audiopl-play-pause-btn">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="24" viewBox="0 0 18 24">
            <path fill="#566574" fill-rule="evenodd" d="M18 12L0 24V0" class="audiopl-play-pause-icon"/>
        </svg>
    </div>

    <div class="audiopl-controls">
        <span class="audiopl-current-time">0:00</span>

        <div class="audiopl-wave-container">
            <div class="audiopl-wave-form"></div>
        </div>

        <span class="audiopl-total-time">0:00</span>
    </div>

    <div class="audiopl-volume">
        <div class="audiopl-volume-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                <path fill="#566574" fill-rule="evenodd" d="M14.667 0v2.747c3.853 1.146 6.666 4.72 6.666 8.946 0 4.227-2.813 7.787-6.666 8.934v2.76C20 22.173 24 17.4 24 11.693 24 5.987 20 1.213 14.667 0zM18 11.693c0-2.36-1.333-4.386-3.333-5.373v10.707c2-.947 3.333-2.987 3.333-5.334zm-18-4v8h5.333L12 22.36V1.027L5.333 7.693H0z" class="audiopl-speaker"/>
            </svg>
        </div>
        <div class="audiopl-volume-controls hidden">
            <div class="audiopl-slider" data-direction="vertical">
                <div class="audiopl-progress">
                    <div class="audiopl-pin volume-pin" data-method="changeVolumeBind"></div>
                </div>
            </div>
        </div>
    </div>
    <div class="audiopl-download">
        <a href="" class="audiopl-download-btn" target="_blank" download>
            <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="24" height="24" viewBox="0 0 433.5 433.5">
            <path d="M395.25,153h-102V0h-153v153h-102l178.5,178.5L395.25,153z M38.25,382.5v51h357v-51H38.25z" fill="#566574" class="audiopl-download-icon" />
            </svg>
        </a>
    </div>
    `)

    this.playPause = el.querySelector('.audiopl-play-pause-icon')
    this.playpauseBtn = el.querySelector('.audiopl-play-pause-btn')
    this.loading = el.querySelector('.audiopl-loading')
    this.progress = el.querySelector('.audiopl-progress')
    this.sliders = el.querySelectorAll('.audiopl-slider')
    this.volumeBtn = el.querySelector('.audiopl-volume-btn')
    this.volumeControls = el.querySelector('.audiopl-volume-controls')
    this.volumeProgress = this.volumeControls.querySelector('.audiopl-slider .audiopl-progress')
    this.audioTag = el.querySelector('audio')
    this.currentTime = el.querySelector('.audiopl-current-time')
    this.totalTime = el.querySelector('.audiopl-total-time')
    this.speaker = el.querySelector('.audiopl-speaker')
    this.downloadBtn = el.querySelector('.audiopl-download-btn')

    this.draggableClasses = ['ct-pin']
    this.currentlyDragged = null

    this.initPlayer = function () {
        this.container.addEventListener('mousedown', this.mouseDown.bind(this))

        this.playpauseBtn.addEventListener('click', this.togglePlay.bind(this))

        this.downloadBtn.href = this.getAudioSrc()

        this.volumeBtn.addEventListener('click', () => {
            this.volumeBtn.classList.toggle('open')
            this.volumeControls.classList.toggle('hidden')
        })

        window.addEventListener('resize', this.directionAware.bind(this))

        this.sliders.forEach(slider => {
            let pin = slider.querySelector('.audiopl-pin')
            slider.addEventListener('click', this[pin.dataset.method])
        })

        this.directionAware()

        if (this.audioTag.preload != 'auto') {
            this.container.addEventListener('mouseenter', this.loadBind)
        }

        this.wavesurfer = WaveSurfer.create({
            container: this.container.querySelector('.audiopl-wave-form'),
            height: 50,
            normalize: true,
            barWidth: 3,
            progressColor: '#44BFA3',
            waveColor: '#8DD8C7',
            cursorColor: '#44BFA3',
            cursorWidth: 2,
            hideScrollbar: true
        })

        this.wavesurfer.on('volume', this.updateVolume.bind(this))
        this.wavesurfer.on('ready', () => {
            this.totalTime.textContent = this.formatTime(this.wavesurfer.getDuration())
        })
        this.wavesurfer.on('loading', () => {
            this.playpauseBtn.style.display = 'none'
            this.loading.style.visibility = 'visible'
            this.loading.style.display = 'block'
            this.downloadBtn.href = this.getAudioSrc()
        })
        this.wavesurfer.on('ready', () => {
            this.playpauseBtn.style.display = 'block'
            this.loading.style.display = 'none'
        })
        this.wavesurfer.on('audioprocess', this.updateProgress.bind(this))

        this.wavesurfer.on('finish', () => {
            this.playPause.attributes.d.value = "M18 12L0 24V0"
            this.wavesurfer.setCurrentTime(0)
            this.currentTime.textContent = this.formatTime(0)
        })
        this.wavesurfer.on('error', () => {
            this.playpauseBtn.style.display = 'none'
            this.loading.style.display = 'block'
            this.loading.style.visibility = 'hidden'
        })

        if (this.audioTag.preload == 'auto') {
            let src = this.getAudioSrc()
            if (src) {
                this.wavesurfer.load(src)
            }
        }

        this.audioTag.addEventListener('loadstart', () => {
            let src = this.getAudioSrc()
            if (src) {
                this.wavesurfer.load(src)
            } else {
                this.wavesurfer.empty()
                this.playPause.attributes.d.value = "M18 12L0 24V0"
                this.playpauseBtn.style.display = 'none'
                this.wavesurfer.setCurrentTime(0)
                this.currentTime.textContent = this.formatTime(0)
                this.totalTime.textContent = this.formatTime(0)
            }
        })

        if (this.audioTag.hasAttribute('autoplay')) {
            this.audioTag.pause()
            this.wavesurfer.on('ready', this.wavesurfer.play.bind(this.wavesurfer))
        }
    }

    this.getAudioSrc = function() {
        return this.audioTag.querySelector('source').getAttribute('src')
    }

    this.load = function(event) {
        event.target.removeEventListener(event.type, this.loadBind)
        let src = this.getAudioSrc()
        if (src) {
            this.wavesurfer.load(src)
        }
    }

    this.loadBind = this.load.bind(this)

    this.mouseDown = function(event) {
        if(!this.isDraggable(event.target)) return false;

        this.currentlyDragged = event.target
        let handleMethod = this.currentlyDragged.dataset.method

        this.container.addEventListener('mousemove', this[handleMethod], false)

        this.container.addEventListener('mouseup', () => {
            this.currentlyDragged = false
            this.container.removeEventListener('mousemove', this[handleMethod], false)
        }, false)
    }

    this.isDraggable = function (el) {
        let canDrag = false,
            classes = Array.from(el.classList)
        this.draggableClasses.forEach(draggable => {
            if(classes.indexOf(draggable) !== -1)
                canDrag = true
        })
        return canDrag
    }

    this.inRange = function (event) {
        let rangeBox = this.getRangeBox(event)
        let rect = rangeBox.getBoundingClientRect()
        let direction = rangeBox.dataset.direction
        if(direction == 'horizontal') {
            let min = rect.left
            let max = min + rangeBox.offsetWidth
            if (event.clientX < min || event.clientX > max)
                return false
        } else {
            let min = rect.top
            let max = min + rangeBox.offsetHeight
            if (event.clientY < min || event.clientY > max)
                return false
        }
        return true
    }

    this.updateProgress = function () {
        let current = this.wavesurfer.getCurrentTime()
        this.currentTime.textContent = this.formatTime(current)
    }

    this.updateVolume = function () {
        let volume = this.wavesurfer.getVolume()
        this.volumeProgress.style.height = volume * 100 + '%'
        if(volume >= 0.5) {
            this.speaker.attributes.d.value = 'M14.667 0v2.747c3.853 1.146 6.666 4.72 6.666 8.946 0 4.227-2.813 7.787-6.666 8.934v2.76C20 22.173 24 17.4 24 11.693 24 5.987 20 1.213 14.667 0zM18 11.693c0-2.36-1.333-4.386-3.333-5.373v10.707c2-.947 3.333-2.987 3.333-5.334zm-18-4v8h5.333L12 22.36V1.027L5.333 7.693H0z'
        } else if(volume < 0.5 && volume > 0.05) {
            this.speaker.attributes.d.value = 'M0 7.667v8h5.333L12 22.333V1L5.333 7.667M17.333 11.373C17.333 9.013 16 6.987 14 6v10.707c2-.947 3.333-2.987 3.333-5.334z'
        } else if(volume <= 0.05) {
            this.speaker.attributes.d.value = 'M0 7.667v8h5.333L12 22.333V1L5.333 7.667'
        }
    }

    this.getRangeBox = function (event) {
        let rangeBox = event.target,
            el = this.currentlyDragged
        if(event.type == 'click' && this.isDraggable(event.target)) {
            rangeBox = event.target.parentElement.parentElement;
        }
        if(event.type == 'mousemove') {
            rangeBox = el.parentElement.parentElement
        }
        return rangeBox
    }

    this.getCoefficient = function (event) {
        let slider = this.getRangeBox(event)
        let rect = slider.getBoundingClientRect(),
            K = 0
        if(slider.dataset.direction == 'horizontal') {

            let offsetX = event.clientX - rect.left
            let width = slider.clientWidth
            K = offsetX / width

        } else if(slider.dataset.direction == 'vertical') {

            let height = slider.clientHeight
            var offsetY = event.clientY - rect.top
            K = 1 - offsetY / height

        }
        return K;
    }

    this.changeVolume = function (event) {
        if(this.inRange(event)) {
            let volume = this.getCoefficient(event)
            this.wavesurfer.setVolume(volume)
        }
    }

    this.changeVolumeBind = this.changeVolume.bind(this)

    this.formatTime = function (time) {
        var min = Math.floor(time / 60)
        var sec = Math.floor(time % 60)
        return min + ':' + ((sec<10) ? ('0' + sec) : sec)
    }

    this.togglePlay = function () {
        if(this.wavesurfer.isPlaying()) {
            this.playPause.attributes.d.value = "M18 12L0 24V0"
            this.wavesurfer.pause()
        } else {
            this.playPause.attributes.d.value = "M0 0h6v24H0zM12 0h6v24h-6z"
            this.wavesurfer.play()
        }
    }

    this.directionAware = function () {
        if(window.innerHeight < 250) {
            this.volumeControls.style.bottom = '-54px'
            this.volumeControls.style.left = '54px'
        } else if(el.offsetTop < 154) {
            this.volumeControls.style.bottom = '-164px'
            this.volumeControls.style.left = '-3px'
        } else {
            this.volumeControls.style.bottom = '52px'
            this.volumeControls.style.left = '-3px'
        }
    }
}
