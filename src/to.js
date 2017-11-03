const exists = require('exists')

const wait = require('./wait')
/** animate any numeric parameter of an object or array of objects */
module.exports = class to extends wait
{
    /**
     * @param {object} object to animate
     * @param {object} goto - parameters to animate, e.g.: {alpha: 5, scale: {3, 5}, scale: 5, rotation: Math.PI}
     * @param {number} duration - time to run
     * @param {object} [options]
     * @param {number} [options.wait=0] n milliseconds before starting animation (can also be used to pause animation for a length of time)
     * @param {boolean} [options.pause] start the animation paused
     * @param {boolean|number} [options.repeat] true: repeat animation forever n: repeat animation n times
     * @param {boolean|number} [options.reverse] true: reverse animation (if combined with repeat, then pulse) n: reverse animation n times
     * @param {boolean|number} [options.continue] true: continue animation with new starting values n: continue animation n times
     * @param {Function} [options.load] loads an animation using an .save() object note the * parameters below cannot be loaded and must be re-set
     * @param {string|Function} [options.ease] name or function from easing.js (see http://easings.net for examples)
     *
     * @event done(to) animation expires
     * @event cancel(to) animation is cancelled
     * @event wait(to) each update during a wait
     * @event first(to) first update when animation starts
     * @event each(to, wait) each update while animation is running
     * @event loop(to) when animation is repeated
     * @event reverse(to) when animation is reversed
     */
    constructor(object, goto, duration, options)
    {
        options = options || {}
        super(object, options)
        this.type = 'To'
        if (Array.isArray(object))
        {
            this.list = object
            this.object = this.list[0]
        }
        this.ease = options.ease || this.noEase
        if (options.load)
        {
            this.load(options.load)
        }
        else
        {
            this.goto = goto
            this.fixScale()
            this.duration = duration
            this.restart()
        }
    }

    /**
     * change or add a animation parameter
     * NOTE: the function extrapolates the starting value based on an average calculation without regard to easing function
     * @param {object} goto
     */
    modify(goto)
    {
        if (this.duration !== 0)
        {
            const percent = this.time / this.duration
            for (let key in goto)
            {
                if (exists(this.goto[key]))
                {
                    this.start[key] =
                }
            }
        }
    }

    /**
     * converts scale from { scale: n } to { scale: { x: n, y: n }}
     * @private
     */
    fixScale()
    {
        if (typeof this.goto['scale'] !== 'undefined' && !Number.isNaN(this.goto['scale']))
        {
            this.goto['scale'] = {x: this.goto['scale'], y: this.goto['scale']}
        }
    }

    save()
    {
        if (this.options.cancel)
        {
            return null
        }
        const save = super.save()
        save.goto = this.goto
        save.start = this.start
        save.delta = this.delta
        save.keys = this.keys
        return save
    }

    load(load)
    {
        super.load(load)
        this.goto = load.goto
        this.start = load.start
        this.delta = load.delta
        this.keys = load.keys
    }

    restart()
    {
        let i = 0
        const start = this.start = []
        const delta = this.delta = []
        const keys = this.keys = []
        const goto = this.goto
        const object = this.object

        // loops through all keys in goto object
        for (let key in goto)
        {

            // handles keys with one additional level e.g.: goto = {scale: {x: 5, y: 3}}
            if (isNaN(goto[key]))
            {
                keys[i] = {key: key, children: []}
                start[i] = []
                delta[i] = []
                let j = 0
                for (let key2 in goto[key])
                {
                    keys[i].children[j] = key2
                    start[i][j] = parseFloat(object[key][key2])
                    start[i][j] = this._correctDOM(key2, start[i][j])
                    start[i][j] = isNaN(this.start[i][j]) ? 0 : start[i][j]
                    delta[i][j] = goto[key][key2] - start[i][j]
                    j++
                }
            }
            else
            {
                start[i] = parseFloat(object[key])
                start[i] = this._correctDOM(key, start[i])
                start[i] = isNaN(this.start[i]) ? 0 : start[i]
                delta[i] = goto[key] - start[i]
                keys[i] = key
            }
            i++
        }
        this.time = 0
    }

    reverse()
    {
        const object = this.object
        const keys = this.keys
        const goto = this.goto
        const delta = this.delta
        const start = this.start

        for (let i = 0; i < keys.length; i++)
        {
            const key = keys[i]
            if (isNaN(goto[key]))
            {
                for (let j = 0; j < key.children.length; j++)
                {
                    delta[i][j] = -delta[i][j]
                    start[i][j] = parseFloat(object[key.key][key.children[j]])
                    start[i][j] = isNaN(start[i][j]) ? 0 : start[i][j]
                }
            }
            else
            {
                delta[i] = -delta[i]
                start[i] = parseFloat(object[key])
                start[i] = isNaN(start[i]) ? 0 : start[i]
            }
        }
    }

    continue()
    {
        const object = this.object
        const keys = this.keys
        const goto = this.goto
        const start = this.start

        for (let i = 0; i < keys.length; i++)
        {
            const key = keys[i]
            if (isNaN(goto[key]))
            {
                for (let j = 0; j < key.children.length; j++)
                {
                    this.start[i][j] = parseFloat(object[key.key][key.children[j]])
                    this.start[i][j] = isNaN(start[i][j]) ? 0 : start[i][j]
                }
            }
            else
            {
                start[i] = parseFloat(object[key])
                start[i] = isNaN(start[i]) ? 0 : start[i]
            }
        }
    }

    calculate(/*elapsed*/)
    {
        const object = this.object
        const list = this.list
        const keys = this.keys
        const goto = this.goto
        const time = this.time
        const start = this.start
        const delta = this.delta
        const duration = this.duration
        const ease = this.ease
        for (let i = 0; i < this.keys.length; i++)
        {
            const key = keys[i]
            if (isNaN(goto[key]))
            {
                const key1 = key.key
                for (let j = 0; j < key.children.length; j++)
                {
                    const key2 = key.children[j]
                    const others = object[key1][key2] = (time >= duration) ? start[i][j] + delta[i][j] : ease(time, start[i][j], delta[i][j], duration)
                    if (list)
                    {
                        for (let k = 1; k < list.length; k++)
                        {
                            list[k][key1][key2] = others
                        }
                    }
                }
            }
            else
            {
                const key = keys[i]
                const others = object[key] = (time >= duration) ? start[i] + delta[i] : ease(time, start[i], delta[i], duration)
                if (list)
                {
                    for (let j = 1; j < this.list.length; j++)
                    {
                        list[j][key] = others
                    }
                }
            }
        }
    }
}