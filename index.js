
/**
 * Components Explanation
 * 
 * Components are functions that return an object with various methods.
 * These expose the necessary functions necessary to coordinate throughout
 * the different pieces of the slider
 *
 * Components are passed 3 arguments, the slider, an object of components, and the event bus
 * 
 * The general flow of a component should look something like this:
 * 
 * ```js
 * function myComponent(gs, components, events) {
 *     // declare variables
 *     const slides = gs.elements.slide
 *     
 *     // create component object
 *     const cmp = {
 *         setup() { console.log('setting up') }
 *     }
 *     
 *     // add any events
 *     events.on('mounted', (detail) => console.log(detail));
 * }
 * ```
 * Each component should have a "setup" function, but they are ultimately optional.
 * 
 * When inside the component object, all components are available to interact with.
 * 
 * events object has 2 methods, on and emit.
 * 
 * On works like addEventListener, and but takes an extra type '*'
 * 
 * '*' will run the handler on _every_ event that is emitted.
 * 
 * emit works like dispatchEvent, but instead of passing a Event or CustomEvent object
 * you can just pass the key to that event as a string
 * 
 * events.on('my-event', (detail) => console.log('my event is happening'));
 * 
 * events.on('*', (type, detail) => console.log('anything could be happening!', type, detail)
 * 
 * events.emit('my-event', { whatIsThis: 'this works like the detail property in a CustomEvent object' }) // both functions above will run
 * 
 * emit has a third parameter that can be added
 * 
 * 
 * GallerySlider.elements Explanation
 * 
 * To make getting elements easier (i.e. not writing document.querySelectorAll all the time)
 * there is a Proxy at GallerySlider.elements that will do that for you, even converting it from a NodeList to an Array
 * 
 * Since there will still be times where you need just a single element, you can 
 * get those by referencing the class name with a $ before the name
 * 
 * it also prefixes the .gs- class prefix for you
 * 
 * elements.slide => [...{parent element}.querySelectorAll('.gs-slide')];
 * elements.$slide => {parent element}.querySelector('.gs-slide');
 * 
 * To get access to the {parent element} use elements.self
 */

/** Based on mitt https://github.com/developit/mitt/blob/main/src/index.ts */
function events() {
    const all = new Map();

    return {
        on(name, handler) {
            let handlers = all.get(name);
            if (handlers) {
                handlers.push(handler);
            } else {
                all.set(name, [handler]);
            }
        },
        off(name, handler) {
            let handlers = all.get(name);

            if(handlers) {
                handler ? handlers.splice(handlers.indexOf(handler) >>> 0, 1) : all.set(name, []);
            }
        },
        emit(name, detail, native = false) {
            let handlers = all.get(name);

            if (handlers) {
                handlers.slice().map(cb => cb(detail));
            }
            if (native) document.dispatchEvent(new CustomEvent(name, { detail }));
        }
    }
}

const defaults = {
    prefix: 'pi-',
}

export class PlugIt {
    constructor(parent, config = {}) {
        this.config = {
            ...defaults,
            ...config
        };
        this.events = events()
        
        this.elements = new Proxy(parent, {
            get(target, key) {
                if (key === 'self') return target;
                
                if (key.indexOf('$') === 0) return target.querySelector(`.${config.prefix}-${key.slice(1)}`);
                
                return Array.from(target.querySelectorAll(`.${config.prefix}-${key}`));
            }
        });
    }

    on = (name, handler) => this.events.on(name, handler);
    off = (name, handler) => this.events.off(name, handler);
    emit = (name, detail) => this.events.emit(name, detail);
    
    mount = (exts) => this.#mount(this, exts, this.events);
    
    #mount(self, exts, events) {
        const components = {};
        
        for (const name in exts) {
            components[name] = exts[name](self, components, events);
        }
        
        for (const name in components) {
            if ('setup' in components[name]) components[name].setup();
        }
        this.components = components;
        /** All components are active and can be interacted with */
        this.events.emit('mounted');
        
        return this;
    }
}