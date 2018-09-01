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

const pathDeltas = [15, 15, -30];

class App extends React.Component {
    path = React.createRef();
    path2 = React.createRef();
    path3 = React.createRef();

    dotLense = (...args) => R.lensPath(['dots', ...args]);

    cyclePathIndex = (dotIndex = 0) => {
        this.setState(s => {
            const paths = [
                this.path.current.getTotalLength(),
                this.path2.current.getTotalLength(),
                this.path3.current.getTotalLength()
            ];
            const { pathIndex, t, ...dot } = s.dots[dotIndex];

            const currentPathLength = paths[pathIndex];
            const percent = t / currentPathLength;
            const newPathIndex = cycleThree.inc(pathIndex);
            const newPathLength = paths[newPathIndex];

            const newDot = {
                // x: dot.x + pathDeltas[newPathIndex],
                // y: dot.y + pathDeltas[newPathIndex],
                ...dot,
                pathIndex: newPathIndex,
                t: percent * newPathLength
            };

            console.log(
                `${t}/${currentPathLength} = ${percent}. ${percent} * ${newPathLength} = ${percent *
                    newPathLength}`
            );

            const updatedPathIndex = R.set(this.dotLense(dotIndex), newDot, s);
            return updatedPathIndex;
        });
    };

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
        ]
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

        this.tick();
    }

    componentDidUpdate(_, { run }) {
        if (this.state.run && !run) this.tick();
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
                    [name]: console.ident(updater(s[name]))
                }));
        }
    });

    render() {
        return (
            <div className="App">
                <button onClick={() => this.update.run(v => !v)}>Run</button>
                <button onClick={() => this.tick()}>>></button>
                <svg
                    width="960"
                    height="500"
                    onClick={() => this.cyclePathIndex()}
                >
                    <path
                        stroke="blue"
                        ref={this.path}
                        d=" M480,200c100,0,0,250,100,200s0,-250,100,-300s350,100,100,200s-350,100,-600,0s0,-250,100,-200s0,250,100,300s0,-200,100,-200"
                    />
                    <path
                        stroke="red"
                        ref={this.path2}
                        d=" M495,215c100,0,0,250,100,200s0,-250,100,-300s350,100,100,200s-350,100,-600,0s0,-250,100,-200s0,250,100,300s0,-200,100,-200"
                    />
                    <path
                        stroke="green"
                        ref={this.path3}
                        d=" M465,185c100,0,0,250,100,200s0,-250,100,-300s350,100,100,200s-350,100,-600,0s0,-250,100,-200s0,250,100,300s0,-200,100,-200"
                    />

                    <circle r="4" transform="translate(480,200)" />
                    <circle r="4" transform="translate(580,400)" />
                    <circle r="4" transform="translate(680,100)" />
                    <circle r="4" transform="translate(780,300)" />
                    <circle r="4" transform="translate(180,300)" />
                    <circle r="4" transform="translate(280,100)" />
                    <circle r="4" transform="translate(380,400)" />
                    {_.map(this.state.dots, Dot)}
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

/*
Initial Path Setup 
<path
                        stroke="blue"
                        ref={this.path}
                        d="M480,200C580,200,480,450,580,400S580,150,680,100S1030,200,780,300S430,400,180,300S180,50,280,100S280,350,380,400S380,200,480,200"
                    />
                    <path
                        stroke="red"
                        ref={this.path2}
                        d="M495,215C595,215,495,465,595,415S595,165,695,115S1180,215,795,315S445,415,195,315S195,50,295,115S295,365,395,415S395,215,495,215"
                    />
                    <path
                        stroke="green"
                        ref={this.path3}
                        d="M465,185C565,185,465,435,565,385S565,135,665,85S880,185,765,285S415,385,165,285S165,50,265,85S265,335,365,385S365,185,465,185"
                    />
*/
