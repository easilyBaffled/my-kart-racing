import React from 'react';
import ReactDOM from 'react-dom';
import _ from 'lodash';
import fp from 'lodash/fp';
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

const Dot = ({ x, y, id }) => {
    return (
        <circle
            key={id}
            id={id}
            className="dot"
            r="13"
            transform={`translate(${x},${y})`}
        />
    );
};

const Hazzard = ({ x, y, attributes }) => {
    return (
        <circle className="hazzard" r="8" transform={`translate(${x},${y})`} />
    );
};

const updateDotPos = paths => dot => {
    const path = paths[dot.pathIndex];
    const speed =
        dot.speed === standardSpeed || dot.hazzard
            ? dot.speed
            : dot.speed < standardSpeed
                ? Math.min(dot.speed * 1.02, standardSpeed)
                : Math.max(dot.speed * 0.08, standardSpeed);

    const t = R.ifElse(
        v => v > path.getTotalLength(),
        v => v % path.getTotalLength(),
        v => v
    )(dot.t + speed);

    return {
        ...dot,
        speed,
        t,
        laps: dot.t + speed > path.getTotalLength() ? dot.laps + 1 : dot.laps,
        lapPercentComplete: t / path.getTotalLength(),
        ..._.pick(pointOnPath(path, dot.t), ['x', 'y'])
    };
};

const updateTargeting = dots => hazzard =>
    hazzard.target === hazzardAttributes.target.homing
        ? { ...hazzard, pathIndex: dots[hazzard.homingTarget].pathIndex }
        : hazzard;

const standardSpeed = 5; //0.002; // 5

const distance = (pointA, pointB) => {
    var a = pointA.x - pointB.x;
    var b = pointA.y - pointB.y;

    return Math.sqrt(a * a + b * b);
};

const findNearest = (target, pointOptions) => {
    return pointOptions.findIndex(point => distance(point, target) < 20);
};

const resolveHazzardCollisions = (dots, hazzards = []) => {
    let hasCollided = false;
    const h = hazzards.reduce((hs, h) => {
        const index = findNearest(h, dots);

        if (index !== -1) {
            hasCollided = true;
            dots = R.over(
                R.lensProp(index),
                d => ({ ...d, ...h.affect }),
                dots
            );
            return hs;
        }
        return [...hs, h];
    }, []);

    return { hazzards: h, dots, hasCollided };
};

const resolveDotCollisions = dots => {
    const updatedDots = _.map(dots, (dot, i) => {
        const { t, pathIndex, speed } = dot;
        const dotIndex = (Array.isArray(dots)
            ? dots
            : Object.values(dots)
        ).findIndex(d => d.pathIndex === pathIndex && Math.abs(d.t - t) < 20);

        if (dotIndex !== -1 && dotIndex !== i) {
            const targetDot = dots[dotIndex];

            if (targetDot.t > t) return { ...dot, speed: speed / 2 };
            if (targetDot.t < t) return { ...dot, speed: speed * 1.5 };
        }
        return dot;
    });
    return { dots: updatedDots };
};

const hazzardAttributes = {
    speed: {
        static: 0,
        slow: standardSpeed / 2,
        normal: standardSpeed / 2,
        fast: standardSpeed * 2
    },
    target: {
        homing: 1,
        everyone: 2,
        anyone: 3
    },
    affects: {
        speedUp: { speed: standardSpeed * 2 },
        slowDown: { speed: standardSpeed / 4 },
        shield: 1000
    }
};

const homingHazzard = {
    hazzard: true,
    target: hazzardAttributes.target.homing,
    homingTarget: 0,
    pathIndex: -1,
    t: 10,
    x: 622,
    y: 330,
    affect: hazzardAttributes.affects.slowDown,
    speed: hazzardAttributes.speed.fast
};

class App extends React.Component {
    path = React.createRef();
    path2 = React.createRef();
    path3 = React.createRef();

    dotLense = (...args) => R.lensPath(['dots', ...args]);

    cyclePathIndex = (dotIndex = 0, func) =>
        this.setState(R.over(this.dotLense(dotIndex, 'pathIndex'), func));

    state = {
        run: true,
        tutorialIndex: null,
        dots: [
            {
                id: 'player',
                pathIndex: 0,
                x: 480,
                y: 200,
                t: 1300,
                speed: 0.05,
                laps: -1
            },
            {
                id: 'mario',
                pathIndex: 1,
                x: 495,
                y: 215,
                t: 0,
                speed: 0.01,
                laps: 0
            },
            {
                id: 'luigi',
                pathIndex: 2,
                x: 465,
                y: 185,
                t: 0,
                speed: 0.01,
                laps: 0
            }
        ],
        hazzards: []
    };

    tick = () => {
        this.setState(
            R.pipe(
                s => ({
                    ...s,
                    hazzards: _.map(s.hazzards, updateTargeting(s.dots))
                }),
                s => ({
                    ...s,
                    ...resolveHazzardCollisions(s.dots, s.hazzards)
                }),
                s => ({
                    ...s,
                    ...resolveDotCollisions(s.dots)
                }),
                s => ({
                    ...s,
                    dots: _.map(s.dots, this.updateDotPos),
                    hazzards: _.map(s.hazzards, this.updateDotPos)
                })
            )
        );
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

        this.setState({ tutorialIndex: 0 }, this.tick);
    }

    componentDidUpdate(_, { run, dots, hasCollided, tutorialIndex }) {
        if (this.state.hasCollided && !hasCollided)
            setTimeout(() => this.setState({ hasCollided: false }), 3000);

        if (this.state.run && !run) this.tick();

        if (dots[0].pathIndex !== this.state.dots[0].pathIndex) {
            const { pathIndex, x, y } = this.state.dots[0];
            const setgments = this.pathSegments[pathIndex];
            const nearestSegment = setgments.sort(
                (a, b) =>
                    distance(a.point, { x, y }) - distance(b.point, { x, y })
            )[0];

            this.setState(R.set(this.dotLense(0, 't'), nearestSegment.length));
        }

        if (
            this.state.tutorialIndex !== null &&
            this.state.tutorialIndex !== tutorialIndex
        ) {
            setTimeout(
                () =>
                    this.setState(s => ({
                        tutorialIndex:
                            s.tutorialIndex + 1 === 9
                                ? null
                                : s.tutorialIndex + 1,
                        hazzards:
                            s.tutorialIndex + 1 === 7
                                ? this.state.hazzards.concat(homingHazzard)
                                : this.state.hazzards
                    })),
                4000
            );
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
                onKeyDown={({ key }) =>
                    this.cyclePathIndex(
                        0,
                        key === 'ArrowRight' ? cycleThree.inc : cycleThree.dec
                    )
                }
                onTouchStart={e =>
                    this.cyclePathIndex(
                        0,
                        e.touches[0].clientX > document.body.clientWidth / 2
                            ? cycleThree.inc
                            : cycleThree.dec
                    )
                }
            >
                <button onClick={() => this.update.run(v => !v)}>Run</button>
                <button onClick={() => this.tick()}>>></button>
                {this.state.tutorialIndex === null && (
                    <h3 className="positions">
                        Positions:{' '}
                        {_
                            .sortBy(this.state.dots, [
                                'laps',
                                'lapPercentComplete'
                            ])
                            .reverse()
                            .map((d, i) => (
                                <div className={`position-dot ${d.id}`}>
                                    {' '}
                                    {i + 1}{' '}
                                </div>
                            ))}
                    </h3>
                )}

                <svg
                    viewBox="0 0 700 600"
                    // className={this.state.hasCollided ? 'shake' : ''}
                >
                    <path
                        stroke="#0268B1"
                        ref={this.path}
                        d="M 630 400 Q 600 70 500 250 Q 350 580 200 250 Q 100 70 80 400 Q 80 510 350 525 Q 600 510 630 400 Z"
                    />
                    <path
                        stroke="#074D7E"
                        ref={this.path2}
                        d="M 650 400 Q 600 0 470 250 Q 350 450 230 250 Q 100 0 50 400 Q 50 550 350 550 Q 650 550 650 400 Z"
                    />
                    <path
                        stroke="#2084CB"
                        ref={this.path3}
                        d="M 600 400 Q 590 100 500 300 Q 350 630 200 300 Q 120 100 100 400 Q 120 480 350 500 Q 580 480 600 400"
                    />
                    {_.map(this.state.dots, Dot)}
                    {_.map(this.state.hazzards, Hazzard)}
                    <g>
                        <text x="30" y="30" className="tutorialText">
                            {this.state.tutorialIndex !== null
                                ? tutorials[this.state.tutorialIndex].text
                                : ''}
                        </text>
                        {this.state.tutorialIndex !== null &&
                            _.get(
                                this.state,
                                tutorials[this.state.tutorialIndex].target
                            ) &&
                            tutorials[this.state.tutorialIndex].target && (
                                <path
                                    stroke="#555"
                                    stroke-width="1px"
                                    d={`M33 33 
                                L 33 55 
                                L ${
                                    _.get(
                                        this.state,
                                        tutorials[this.state.tutorialIndex]
                                            .target
                                    ).x
                                } 
                                  ${
                                      _.get(
                                          this.state,
                                          tutorials[this.state.tutorialIndex]
                                              .target
                                      ).y
                                  }`}
                                />
                            )}
                    </g>
                </svg>
                <details>
                    <summary>Game State</summary>
                    <pre>
                        <code>{JSON.stringify(this.state, null, 4)}</code>
                        <code>
                            {JSON.stringify(
                                tutorials[this.state.tutorialIndex],
                                null,
                                4
                            )}
                        </code>
                    </pre>
                </details>
            </div>
        );
    }
}

const tutorials = [
    {
        text: 'This is you',
        target: 'dots.0'
    },
    {
        text: 'You want to stay ahead of the other racers',
        target: 'dots.0'
    },
    {
        text: 'Switch between lanes to find the best route',
        target: 'dots.0'
    },
    {
        text:
            'ontouchstart' in document.documentElement
                ? 'Tap the screen to switch lanes.'
                : 'Use the arrow keys to switch lanes',
        target: null
    },
    {
        text: `You will also want to switch lanes 
        to dodge the other racers`,
        target: null
    },
    {
        text:
            "If you bump into their back you'll slow down and they'll speed up. ",
        target: null
    },
    {
        text: 'Of course that works in reverse too',
        target: null
    },
    {
        text: 'You also need to look out for hazzards.',
        target: 'hazzards.0'
    },
    {
        text: 'They will also slow you down for a bit.',
        target: 'hazzards.0'
    }
];

const rootElement = document.getElementById('root');
ReactDOM.render(<App />, rootElement);
