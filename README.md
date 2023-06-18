# PlugIt

A plugin controller to make complex components easier.

## How it works
The idea behind PlugIt is to treat the parent class as the director between different "_components_". 

The parent class comes with just 1 method, `mount`. Pass an object with each component inside of it to get everything set.

_From the carousel example below_

```js
class GallerySlider extends PlugIt{
    constructor() {
        super();
        /** Event Bus based on mitt */
        this.events.on('next', console.log);
        this.events.on('previous', console.log);
    }
}

function Controls(gs, components, events) {
    /**
     * @type {HTMLElement[]} Gets all elements with the class `gs-button`
     */
    const buttons = gs.elements.button;

    const cmp = {
        setup() {
            buttons.forEach(btn => btn.addEventListener('click', btn.classList.contains('btn-next') ? this.next() : this.prev()));
        },
        next() {
            gs.activeIndex = gs.activeIndex + 1;
            events.emit('next', { dir: 1 });
        },
        prev() {
            gs.activeIndex = gs.activeIndex - 1;
            event.emit('previous', { dir: -1 });
        }
    }

    return cmp;
}

function Move() {
    /**
     * @type {HTMLElement} using the prefix $ only the first element, using querySelector
     */
    const track = gs.elements.$track;
    const slide = gs.elements.$slide;

    const cmp = {
        slideWidth: slide.clientWidth,
        setup() {
            this.activeIndex
        },
        _updateWidth() {
            this.slideWidth = slide.clientWidth;
        },
        move(dir) {
            track.style.transform = `translate3d(0, ${this.slideWidth * gs.activeIndex}px, 0)`;
        }
    }

    events.on('next', ({ dir }) => cmp.move(dir));
    events.on('previous', ({ dir }) => cmp.move(dir));

    return cmp;
}

const gs = new GallerySlider(document.getElementById('parentGallerySlider'));

/** At this point everything is complete and can be interacted with */
gs.mount({ Controls, Move });
```

## Examples:

[Carousel](./examples/caoursel.js);

