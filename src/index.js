import React from 'react';
import ReactDOM from 'react-dom';
import _ from 'lodash';
import fp from 'lodash/fp';
import R from 'ramda';

import './styles.css';

import car from '../src/assets/blue_car.svg';

var demo = true;

console.ident = v => (console.log(v), v);

class FadeText extends React.PureComponent {
    render() {
        console.log('rerenderes', this.props.val);
        return <div className="fade-out"> {this.props.val} </div>;
    }
}

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

const Dot = ({ x, y, id, previousPos, itemCharge }) => {
    return (
        <g>
            {previousPos.map(({ x, y }, i) => (
                <circle
                    key={id + i}
                    id={id}
                    className={'dot trail ' + id}
                    r={12 - i}
                    opacity={Math.max(0.2, 0.6 - i / 10)}
                    transform={`translate(${x},${y})`}
                />
            ))}
            <circle
                key={id}
                id={id}
                className={'dot ' + id}
                r="13"
                strokeDashoffset={90 - itemCharge}
                transform={`translate(${x + Math.random() * 2},${y})`}
            />
        </g>
    );
};

const Hazzard = ({ x, y, previousPos, attributes, target }) => {
    return (
        <g>
            {previousPos.map(({ x, y }, i) => (
                <circle
                    className={`hazzard trail ${
                        target === hazzardAttributes.target.homing
                            ? 'homing'
                            : ''
                    }`}
                    r={8 - i}
                    opacity={Math.max(0.2, 0.6 - i / 10)}
                    transform={`translate(${x},${y})`}
                />
            ))}
            <circle
                className={`hazzard ${
                    target === hazzardAttributes.target.homing ? 'homing' : ''
                }`}
                r="8"
                transform={`translate(${x},${y})`}
            />
        </g>
    );
};

const updateTargeting = dots => hazzard =>
    hazzard.target === hazzardAttributes.target.homing
        ? {
              ...hazzard,
              pathIndex:
                  hazzard.homingTarget !== null
                      ? dots[hazzard.homingTarget].pathIndex
                      : hazzard.pathIndex
          }
        : hazzard;

const standardSpeed = 5; //0.002; // 5

const distance = (pointA, pointB) => {
    var a = pointA.x - pointB.x;
    var b = pointA.y - pointB.y;

    return Math.sqrt(a * a + b * b);
};

const findNearest = (target, pointOptions) => {
    return _.findIndex(pointOptions, point => distance(point, target) < 20);
};

const resolveHazzardCollisions = (dots, hazzards = []) => {
    var hasCollided = false;
    const h = hazzards.reduce((hs, h) => {
        const index = findNearest(h, dots);

        if (index !== -1) {
            hasCollided = h.hazzard && 500;
            dots = R.over(
                R.lensProp(index),
                d => ({ ...d, ...h.affect }),
                dots
            );
            return h.hazzard ? hs : [...hs, h];
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

const updateDotPos = paths => dot => {
    const path = paths[dot.pathIndex];

    const speed =
        dot.speed === standardSpeed || dot.hazzard
            ? dot.speed
            : dot.speed < standardSpeed
                ? Math.min(dot.speed * 1.01, standardSpeed)
                : Math.max(dot.speed * 0.99, standardSpeed);
    const t = R.ifElse(
        v => v > path.getTotalLength(),
        v => v % path.getTotalLength(),
        v => v
    )(dot.t + speed);
    const newLap = t < dot.t;

    return {
        ...dot,
        itemCharge: Math.min(dot.itemCharge + 0.13, 90),
        previousPos: [
            { x: dot.x, y: dot.y },
            ...dot.previousPos.slice(+(!dot.hazzard && Math.random() < 0.19), 7)
        ],
        speed,
        t,
        laps: dot.t + speed > path.getTotalLength() ? dot.laps + 1 : dot.laps,
        lapPercentComplete: t / path.getTotalLength(),
        ..._.pick(pointOnPath(path, dot.t), ['x', 'y']),
        lapTimes: dot.lapTimes !== null && (newLap ? 0 : dot.lapTimes + 1)
    };
};

const hazzardAttributes = {
    speed: {
        static: 0,
        slow: standardSpeed / 2,
        normal: standardSpeed,
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

const boostPad = {
    hazzard: false,
    target: hazzardAttributes.target.anyone,
    homingTarget: null,
    pathIndex: 1,
    t: 1500,
    x: 370,
    y: 550,
    affect: hazzardAttributes.affects.speedUp,
    speed: hazzardAttributes.speed.static,
    previousPos: []
};

const homingHazzard = {
    hazzard: true,
    target: hazzardAttributes.target.homing,
    homingTarget: 0,
    pathIndex: 1,
    t: 10,
    x: 622,
    y: 330,
    affect: hazzardAttributes.affects.slowDown,
    speed: hazzardAttributes.speed.fast,
    previousPos: []
};

const randomHazzard = (props, target = hazzardAttributes.target.everyone) => {
    const hazzard = {
        ...homingHazzard,
        x: -10,
        y: -10,
        ...props,
        homingTarget: null,
        previousPos: [],
        speed: _.sample(hazzardAttributes.speed)
    };

    const isHoming =
        hazzard.speed !== hazzardAttributes.speed.static &&
        props.id !== 'player' &&
        Math.random() > 0.8;

    if (isHoming) {
        hazzard.target = hazzardAttributes.target.homing;
        hazzard.homingTarget = _.sample([0, 1, 2]);
    }

    hazzard.t =
        props.t +
        (hazzardAttributes.speed.static || hazzardAttributes.speed.slow
            ? -100
            : 100);
    return hazzard;
};

const mario = {
    id: 'mario',
    pathIndex: 1,
    x: 495,
    y: 215,
    t: 900,
    speed: standardSpeed,
    laps: 0,
    previousPos: [],
    itemCharge: 0
};
const luigi = {
    id: 'luigi',
    pathIndex: 2,
    x: 465,
    y: 185,
    t: 750,
    speed: standardSpeed,
    laps: 0,
    previousPos: [],
    itemCharge: 0
};

class App extends React.Component {
    path = React.createRef();
    path2 = React.createRef();
    path3 = React.createRef();
    honkEl = React.createRef();
    engineSoundEl = React.createRef();

    dotLense = (...args) => R.lensPath(['dots', ...args]);

    cyclePathIndex = (dotIndex = 0, func) =>
        this.setState(R.over(this.dotLense(dotIndex, 'pathIndex'), func));

    state = {
        run: true,
        tutorialIndex: null,
        deployHazzard: [],
        deployBoost: [],
        dots: [
            {
                id: 'player',
                pathIndex: 0,
                x: 480,
                y: 200,
                t: 1750,
                speed: 0.05,
                laps: -1,
                previousPos: [],
                itemCharge: 0,
                lapTimes: 0
            }
        ],
        hazzards: [boostPad]
    };

    tick = () => {
        this.setState(
            R.pipe(
                s =>
                    s.deployBoost.length > 0
                        ? {
                              ...s,
                              deployBoost: [],
                              dots: s.deployBoost.reduce(
                                  (acc, i) =>
                                      R.over(
                                          R.lensProp(i),
                                          d => ({
                                              ...d,
                                              itemCharge: 0,
                                              ...hazzardAttributes.affects
                                                  .speedUp
                                          }),
                                          acc
                                      ),
                                  s.dots
                              )
                          }
                        : s,
                s =>
                    s.deployHazzard.length > 0
                        ? {
                              ...s,
                              deployHazzard: [],
                              dots: s.deployHazzard.reduce(
                                  (acc, i) =>
                                      R.over(
                                          R.lensProp(i),
                                          d => ({
                                              ...d,
                                              itemCharge: 0
                                          }),
                                          acc
                                      ),
                                  s.dots
                              ),
                              hazzards: [
                                  ...s.hazzards,
                                  ...s.deployHazzard.map(i =>
                                      randomHazzard(s.dots[i])
                                  )
                              ]
                          }
                        : s,
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
                    hasCollided: s.hasCollided > 0 ? s.hasCollided - 1 : 0,
                    dots: _.map(s.dots, this.updateDotPos),
                    hazzards: _.map(s.hazzards, this.updateDotPos)
                }),
                s => {
                    if (s.tutorialIndex === null || s.tutorialIndex > 6)
                        return s;
                    return {
                        ...s,
                        dots: _.map(s.dots, d => ({ ...d, itemCharge: 0 }))
                    };
                },
                s => {
                    if (s.tutorialIndex !== null) return s;
                    const deployMario =
                        Math.random() > 0.9 &&
                        this.state.dots[1].itemCharge === 90;
                    const [marioBoost, marioHazzard] = !deployMario
                        ? [null, null]
                        : Math.random() > 0.3
                            ? [1, null]
                            : [null, 1];

                    const deployLuigi =
                        Math.random() > 0.9 &&
                        this.state.dots[2].itemCharge === 90;
                    const [luigiBoost, luigiHazzard] = !deployLuigi
                        ? [null, null]
                        : Math.random() > 0.3
                            ? [2, null]
                            : [null, 2];
                    return {
                        ...s,
                        deployBoost: [
                            ...s.deployBoost,
                            marioBoost,
                            luigiBoost
                        ].filter(v => v !== null),
                        deployHazzard: [
                            ...s.deployBoost,
                            marioHazzard,
                            luigiHazzard
                        ].filter(v => v !== null)
                    };
                }
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
        this.engineSoundEl.current.playbackRate = Math.min(
            1.2,
            Math.max(0.7, dots[0].speed / standardSpeed)
        );

        if (dots[0].lapTimes > 0 && this.state.dots[0].lapTimes === 0) {
            this.set.fadeTime(dots[0].lapTimes);
        }

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

        if (this.state.tutorialIndex > 2 && tutorialIndex === 2) {
            this.update.dots(v => [...v, mario, luigi]);
        }

        if (
            this.state.tutorialIndex !== null &&
            this.state.tutorialIndex !== tutorialIndex
        ) {
            setTimeout(
                () =>
                    this.setState(s => ({
                        tutorialIndex:
                            s.tutorialIndex + 1 === 15
                                ? null
                                : s.tutorialIndex + 1,
                        hazzards:
                            s.tutorialIndex + 1 === 11
                                ? this.state.hazzards.concat(homingHazzard)
                                : this.state.hazzards
                    })),
                3500
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

    honk() {
        this.honkEl.current.play();
    }

    handleTouch({ clientX, clientY }) {
        if (clientY === this.state.touch.clientY) {
            clientX > document.body.clientWidth / 2
                ? this.cyclePathIndex(0, cycleThree.inc)
                : this.cyclePathIndex(0, cycleThree.dec);
        } else {
            clientY < this.state.touch.clientY
                ? this.state.dots[0].itemCharge === 90 &&
                  this.update.deployBoost(v => [...v, 0])
                : this.state.dots[0].itemCharge === 90 &&
                  this.update.deployHazzard(v => [...v, 0]);
        }
    }

    render() {
        const winningRacer = _.find(
            _.sortBy(this.state.dots, ['laps', 'lapPercentComplete']).reverse(),
            d => d.laps === 30
        );

        const evtListeners =
            'ontouchstart' in document.documentElement
                ? {
                      onTouchEnd: e => this.handleTouch(e.changedTouches[0]),
                      onTouchStart: e => {
                          e.preventDefault();
                          this.set.touch(e.touches[0]);
                      }
                  }
                : {
                      onKeyDown: e => {
                          e.preventDefault();
                          e.key === 'ArrowRight'
                              ? this.cyclePathIndex(0, cycleThree.inc)
                              : e.key === 'ArrowLeft'
                                  ? this.cyclePathIndex(0, cycleThree.dec)
                                  : e.key === 'ArrowUp'
                                      ? this.state.dots[0].itemCharge === 90 &&
                                        this.update.deployBoost(v => [...v, 0])
                                      : e.key === 'ArrowDown'
                                          ? this.state.dots[0].itemCharge ===
                                                90 &&
                                            this.update.deployHazzard(v => [
                                                ...v,
                                                0
                                            ])
                                          : this.honk();
                      }
                  };

        return (
            <div className="App" tabIndex="0" {...evtListeners}>
                <h3 className="positions">
                    {this.state.tutorialIndex === null && (
                        <React.Fragment>
                            Positions by Lap:{' '}
                            {_
                                .sortBy(this.state.dots, [
                                    'laps',
                                    'lapPercentComplete'
                                ])
                                .reverse()
                                .map((d, i) => (
                                    <div className={`position-dot ${d.id}`}>
                                        {d.laps}
                                    </div>
                                ))}
                            <FadeText val={this.state.fadeTime} />
                        </React.Fragment>
                    )}
                    <h5 className="attribution">
                        <a href="https://github.com/easilyBaffled">
                            Development By Danny Michaelis
                        </a>
                        <a href="https://opengameart.org/content/steppin-up">
                            Music By Dan Knoflicek
                        </a>
                    </h5>
                </h3>
                {winningRacer && <h1>{_.startCase(winningRacer.id)} Won!</h1>}
                <svg
                    style={{ display: winningRacer ? 'none' : 'visable' }}
                    viewBox="0 0 700 600"
                    className={this.state.hasCollided ? 'shake' : ''}
                >
                    <pattern
                        id="pattern-checkers"
                        x="0"
                        y="0"
                        width="10"
                        height="10"
                        patternUnits="userSpaceOnUse"
                    >
                        <rect
                            class="checker"
                            x="0"
                            width="5"
                            height="5"
                            y="0"
                        />
                        <rect
                            class="checker"
                            x="5"
                            width="5"
                            height="5"
                            y="5"
                        />
                    </pattern>
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
                    <rect
                        x="580"
                        y="400"
                        width="90"
                        height="20"
                        fill="url(#pattern-checkers)"
                    />
                    <path
                        className="boostpad"
                        d="M 370 550 l -40 20 l 10 -20 l -10 -20 Z"
                    />
                    {_.map(this.state.dots, Dot)}
                    {_.map(this.state.hazzards.filter(h => h.hazzard), Hazzard)}
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
                                    strokeWidth="1px"
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
                {!demo && (
                    <React.Fragment>
                        <button onClick={() => this.update.run(v => !v)}>
                            Run
                        </button>
                        <button onClick={() => this.tick()}>>></button>
                        <details>
                            <summary>Game State</summary>
                            <pre>
                                <code>
                                    {JSON.stringify(this.state, null, 4)}
                                </code>
                                <code>
                                    {JSON.stringify(
                                        tutorials[this.state.tutorialIndex],
                                        null,
                                        4
                                    )}
                                </code>
                            </pre>
                        </details>
                    </React.Fragment>
                )}
                <audio
                    ref={this.honkEl}
                    type="audio/mp3"
                    src="https://uploads.codesandbox.io/uploads/user/d9629477-fb79-47a2-aaf1-7a691f473c65/-Xyc-Ahooga%20Car%20Horn-SoundBible.com-1499602683%20(1).mp3"
                />
                <audio
                    loop
                    autoPlay={true}
                    ref={this.engineSoundEl}
                    type="audio/wav"
                    src="https://uploads.codesandbox.io/uploads/user/d9629477-fb79-47a2-aaf1-7a691f473c65/Oy1e-384.%20Steppin%20Up_1.mp3"
                />
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
        text: 'You want to stay ahead of the other racers',
        target: 'dots.0'
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
        text: 'Of course that works in reverse too.',
        target: null
    },
    {
        text: 'Hit the boost pad for a burst of speed!',
        target: 'hazzards.0'
    },
    {
        text: 'Watch your charge meter. The white ring around your racer.',
        target: 'dots.0'
    },
    {
        text: 'When it fills up you can use a boost or deploy a hazzard',
        target: 'dots.0'
    },
    {
        text:
            'ontouchstart' in document.documentElement
                ? 'Swipe up for a boost and swipe down for a hazzard'
                : 'Use the Up Arrow for a boost and the Down Arrow for a hazzard',
        target: null
    },
    {
        text: 'You also need to look out for hazzards.',
        target: 'hazzards.1'
    },
    {
        text: 'They will also slow you down for a bit.',
        target: 'hazzards.1'
    },
    {
        text: 'The first to 30 laps wins!',
        target: null
    },
    {
        text: 'Thanks for playing!',
        target: null
    }
];

const rootElement = document.getElementById('root');
ReactDOM.render(<App />, rootElement);
