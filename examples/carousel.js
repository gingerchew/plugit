
import { PlugIt } from '../index.js';
import { animate } from 'https://esm.sh/motion'

const slider = document.getElementById('gallerySlider');

function Counter({ elements }, { Slides }, events) {
    const counter = elements.$counter;
    let max, active;
    const cmp = {
        setup() {
            max = Slides.length;
            active = Slides.realActiveIndex;
            
            counter.dataset.gsActive = active;
            counter.dataset.gsMax = max;
        },
        update() {
            active = counter.dataset.gsActive = Slides.realActiveIndex
            events.emit('count:update', { max, active });
        }
    }
    
    events.on('move:active', () => cmp.update());
    
    return cmp;
}

/** Based off of Glidejs' Sizes component https://github.com/glidejs/glide/blob/master/src/components/sizes.js */
function Sizes({ elements, config }, components, events) {
    const track = elements.$track;
    const wrapper = elements.$wrapper;
    const slide = elements.$slide;
    const self = elements.self;
    
    const sizes = new Map();
    
    sizes.set(self, { gap: config.gap ?? 0 })
    
    const updateSizes = () => {
        let elements = [ track, wrapper, slide ];
        
        elements.forEach(el => sizes.set(el, { height: el.offsetHeight, width: el.offsetWidth }));
        
        return elements;
    }
    const ro = new ResizeObserver(entries => {
        for (const entry of entries) {
            if (entry.target === track) {
                updateSizes();
                events.emit('resize');
            }
        }
    });
    
    ro.observe(track);
    
    const cmp = new Proxy({
        setup() {
            updateSizes()
        },
        update() {
            updateSizes();
        },
        _ro: ro,
    }, {
        /** 
         * Access the size of elements using the same key as in gs.elements
         * 
         * Sizes.slide = { width, height } of .gs-slide;
         * Sizes.track = { width, height } of .gs-track;
         */
        get(target, key) {
            if (key in target) return target[key];
            
            let possibleKey = key;
            if (key !== 'self') possibleKey = '$'+key;
            
            if (sizes.has(elements[possibleKey])) {
                return sizes.get(elements[possibleKey]);
            }
            
            return false;
        }
    });
    
    return cmp;
}

function Slides({ elements }, { Sizes }, events) {
    const slides = elements.slide;
    const wrapper = elements.$wrapper;
    const self = elements.self;
    
    const positions = new Map();
    
    const cmp = {
        setup() {
            /** If there is no slide with .gs-active, get the first slide and set it there */
            if (elements.slide.filter(el => el.classList.contains('gs-active')).length === 0) elements.$slide.classList.add('gs-active');
        },
        get slides() {
            return slides
        },
        get activeIndex() {
            const index = slides.indexOf(elements.$active);
            
            return index > -1 ? index : 0;
        },
        get realActiveIndex() {
            return this.activeIndex + 1;
        },
        get length() {
            return slides.length;
        },
        next() {
            const currIndex = this.activeIndex;
            let nextIndex = this.activeIndex + 1;
            
            
            if (nextIndex >= slides.length) nextIndex = currIndex; /** Don't go past the last slide */

            slides[currIndex].classList.remove('gs-active');
            slides[nextIndex].classList.add('gs-active');
            
            events.emit('slides:changed', { dir: 1, activeIndex: nextIndex, previousIndex: currIndex });
        },
        previous() {
            
            const currIndex = this.activeIndex;
            let nextIndex = this.activeIndex - 1;
            
            if (nextIndex < 0) nextIndex = 0; /** Don't go past the first slide */

            slides[currIndex].classList.remove('gs-active');
            slides[nextIndex].classList.add('gs-active');
            
            events.emit('slides:changed', { dir: -1, activeIndex: nextIndex, previousIndex: currIndex });
        },
        resize() {
            slides.forEach(slide => positions.set(slide, slide.getBoundingClientRect()));
        }
    }
    
    events.on('move:start', ({ dir }) => dir > 0 ? cmp.next() : cmp.previous());
    
    return cmp;
}

function Translate({ elements, config }, { Slides, Sizes }, events) {
    
    const wrapper = elements.$wrapper;
    // const track = elements.$track;
    
    const { duration, timingFunction: easing } = config;
    
    const animConfig = {
        duration,
        easing
    };
    
    let animation = null
    
    let previousPosition = 0;
    let currentPosition = 0;
    
    const cmp = {
        get translateAmount() {
            const { width } = Sizes.slide;
            const { gap } = Sizes.self;
            return width + gap;
        },
        calc(dir) {
            return this.translateAmount * Slides.activeIndex * -1;
        },
        /**
         * @param {1|-1} dir - 1 === moving to the next slide, -1 === moving to previous slide
         * 
         */
        async move(dir = 1) {
            /** If the animation is playing still, finish it so we can do the next one */
            if (animation?.playState === 'running') animation.finish();
            events.emit('move:start', { dir });
            
            previousPosition = currentPosition;
            currentPosition = this.calc();
            
            const from = previousPosition+'px';
            const to = currentPosition+'px';
            
            events.emit('move:active', { from, to });
            
            animation = animate(wrapper, {
                x: [ from, to ],
            }, animConfig);
            
            const { activeIndex, realActiveIndex } = Slides;
            
            animation.finished.then(() => events.emit('move:end', { dir, activeIndex, realActiveIndex }));
        }
    }
    
    return cmp
}

function Controls({ elements }, { Translate }, events) {
    
    const next = () => Translate.move(1);
    const prev = () => Translate.move(-1);
    
    const cmp = {
        setup() {
            elements.$next.addEventListener('click', next);
            
            elements.$prev.addEventListener('click', prev);
        },
        dispose() {
            elements.$next.removeEventListener('click', next);
            elements.$prev.removeEventListener('click', prev);
        }
    }
    
    return cmp;
}

class GallerySlider extends PlugIt {};

/** Look into a way to make these non-order dependant */
const instance = new GallerySlider(document.getElementById('gallerySlider'), {
    duration: 1, /* In s */
    timingFunction: [0.16, 1, 0.3, 1],
    gap: 27,
});


instance.mount({ Sizes, Slides, Counter, Translate, Controls });