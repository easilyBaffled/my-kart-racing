import React from 'react';
import ReactDOM from 'react-dom';
import _ from 'lodash';
import R from 'ramda';

import './styles.css';

console.ident = v => (console.log(v), v);

const shiftPath = (path, shiftAmount) =>
    path
        .getAttribute('d')
        .split(',')
        .map(s =>
            s.replace(/(\d\d\d)([A-Z])?(\d\d\d)?/g, (_, d1, c1 = '', d2) => {
                return `${parseInt(d1) + shiftAmount}${c1}${
                    d2 ? parseInt(d2) + shiftAmount : ''
                }`;
            })
        )
        .join();

const cycleNumber = (min, max) => ({
    inc(val, amount = 1) {
        return val + amount > max ? min : val + amount;
    },
    dec(val, amount = -1) {
        return val + amount < min ? max : val + amount;
    }
});

const cycleThree = cycleNumber(0, 2);
const cycleOne = cycleNumber(0, 1);

const pointOnPath = (path, t) => {
    var l = path.getTotalLength();
    return path.getPointAtLength(t);
};

const Dot = ({ x, y }) => {
    return <circle className="dot" r="13" transform={`translate(${x},${y})`} />;
};

const Hazzard = ({ x, y, attributes }) => {
    return (
        <circle className="pulse" r="8" transform={`translate(${x},${y})`} />
    );
};

const updateDotPos = paths => dot => {
    const path = paths[dot.pathIndex];
    return {
        ...dot,
        t: R.ifElse(
            v => v > path.getTotalLength(),
            v => v % path.getTotalLength(),
            v => v
        )(dot.t + dot.speed),
        ..._.pick(pointOnPath(path, dot.t), ['x', 'y'])
    };
};

const standardSpeed = 5; //0.002; // 5

const distance = (pointA, pointB) => {
    var a = pointA.x - pointB.x;
    var b = pointA.y - pointB.y;

    return Math.sqrt(a * a + b * b);
};

const hazzardAttributes = {
    speed: {
        static: () => ({ speed: 0 }),
        slow: () => ({ speed: standardSpeed / 2 }),
        normal: () => ({ speed: standardSpeed / 2 }),
        fast: () => ({ speed: standardSpeed * 2 })
    },
    target: {
        everyone: () => ({ target: null }),
        me: () => ({ target: 0 }),
        anyone: () => ({ target: -1 })
    },
    affects: {
        speed: (amount = 1.5) => speed => speed * amount,
        shield: () => ({ shielded: true })
    },
    homing: target => () => ({ pathIndex: R.view(target).pathIndex })
};

class App extends React.Component {
    path = React.createRef();
    path2 = React.createRef();
    path3 = React.createRef();

    dotLense = (...args) => R.lensPath(['dots', ...args]);

    cyclePathIndex = (dotIndex = 0, func) =>
        this.setState(R.over(this.dotLense(dotIndex, 'pathIndex'), func));

    state = {
        run: false,
        dots: [
            {
                pathIndex: 0,
                x: 480,
                y: 200,
                t: 0,
                speed: standardSpeed
            },
            {
                pathIndex: 1,
                x: 495,
                y: 215,
                t: 0,
                speed: standardSpeed
            },
            {
                pathIndex: 2,
                x: 465,
                y: 185,
                t: 0,
                speed: standardSpeed
            }
        ],
        hazzards: []
    };

    tick = () => {
        this.setState(({ dots }) => ({
            dots: _.map(this.state.dots, this.updateDotPos)
        }));
        this.state.run && setTimeout(this.tick, 16);
    };

    componentDidMount() {
        window.path = this.path.current;

        this.updateDotPos = updateDotPos([
            this.path.current,
            this.path2.current,
            this.path3.current
        ]);

        this.paths = [
            this.path.current,
            this.path2.current,
            this.path3.current
        ];

        this.pathSegments = this.paths.map(path =>
            Array.from(
                { length: path.getTotalLength() / (standardSpeed / 2) },
                (_, i) => ({
                    point: path.getPointAtLength(i * standardSpeed),
                    length: i * standardSpeed
                })
            )
        );

        this.tick();
    }

    componentDidUpdate(_, { run, dots }) {
        if (this.state.run && !run) this.tick();

        if (dots[0].pathIndex !== this.state.dots[0].pathIndex) {
            const { pathIndex, x, y } = this.state.dots[0];
            const setgments = this.pathSegments[pathIndex];
            console.log(this.state.dots[0], this.pathSegments);
            const nearestSegment = setgments.sort(
                (a, b) =>
                    distance(a.point, { x, y }) - distance(b.point, { x, y })
            )[0];
            console.log(nearestSegment);
            this.setState(R.set(this.dotLense(0, 't'), nearestSegment.length));
        }
    }

    set = new Proxy(this, {
        get(target, name) {
            return v => target.setState(() => ({ [name]: v }));
        }
    });

    update = new Proxy(this, {
        get(target, name) {
            return updater =>
                target.setState(s => ({
                    [name]: updater(s[name])
                }));
        }
    });

    render() {
        return (
            <div
                className="App"
                tabIndex="0"
                onKeyDown={({ key, ...e }) =>
                    this.cyclePathIndex(
                        0,
                        key === 'ArrowRight' ? cycleThree.inc : cycleThree.dec
                    )
                }
            >
                <button onClick={() => this.update.run(v => !v)}>Run</button>
                <button onClick={() => this.tick()}>>></button>
                <svg width="960" height="600">
                    <path
                        stroke="blue"
                        ref={this.path}
                        d="M 630 400 Q 600 70 500 250 Q 350 580 200 250 Q 100 70 80 400 Q 80 510 350 525 Q 600 510 630 400 Z"
                    />
                    <path
                        stroke="red"
                        ref={this.path2}
                        d="M 650 400 Q 600 0 470 250 Q 350 450 230 250 Q 100 0 50 400 Q 50 550 350 550 Q 650 550 650 400 Z"
                    />
                    <path
                        stroke="green"
                        ref={this.path3}
                        d="M 600 400 Q 590 100 500 300 Q 350 630 200 300 Q 120 100 100 400 Q 120 480 350 500 Q 580 480 600 400"
                    />
                    {_.map(this.state.dots, Dot)}
                    <Hazzard x={622} y={330} />
                </svg>
                <details>
                    <summary>Game State</summary>
                    This text will be hidden if your browser supports it.
                    <pre>
                        <code>{JSON.stringify(this.state, null, 4)}</code>
                    </pre>
                </details>
            </div>
        );
    }
}

const rootElement = document.getElementById('root');
ReactDOM.render(<App />, rootElement);
