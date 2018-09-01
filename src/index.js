import React from 'react';
import ReactDOM from 'react-dom';

import './styles.css';

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

function translateAlong(path) {
    var l = path.getTotalLength();
    return t => path.getPointAtLength(t * l);
}

const pointOnPath = (path, t, l) => {
    var l = path.getTotalLength();
    return path.getPointAtLength(t * l);
};

class App extends React.Component {
    path = React.createRef();
    path2 = React.createRef();
    path3 = React.createRef();

    cyclePathIndex = () =>
        this.setState(({ pathIndex }) => ({
            pathIndex: cycleThree.inc(pathIndex)
        }));

    state = {
        dot: { x: 328.5136413574219, y: 193.03968811035156 },
        t: 0,
        pathIndex: 0
    };

    tick = () => {
        const selectedPath = [
            this.path.current,
            this.path2.current,
            this.path3.current
        ][this.state.pathIndex];

        this.setState(({ dot, t }) => ({
            dot: pointOnPath(selectedPath, this.state.t * 10),
            t: t + 0.0002
        }));
        setTimeout(this.tick, 16);
    };

    componentDidMount() {
        window.path = this.path.current;
        this.moveAlongPath = translateAlong(this.path.current);

        // console.log(this.path.current.pathSegList);
        // console.log(this.path.current.getAttribute('d'));
        this.tick();
    }

    render() {
        console.log(this.state);
        return (
            <div className="App" onClick={this.cyclePathIndex}>
                <pre>
                    <code>{JSON.stringify(this.state, null, 4)}</code>
                </pre>
                <svg width="960" height="500">
                    <path
                        ref={this.path}
                        d="M480,200C580,200,480,450,580,400S580,150,680,100S1030,200,780,300S430,400,180,300S180,50,280,100S280,350,380,400S380,200,480,200"
                    />
                    <path
                        ref={this.path2}
                        d="M495,215C595,215,495,465,595,415S595,165,695,115S1180,215,795,315S445,415,195,315S195,50,295,115S295,365,395,415S395,215,495,215"
                    />
                    <path
                        ref={this.path3}
                        d="M465,185C565,185,465,435,565,385S565,135,665,85S880,185,765,285S415,385,165,285S165,50,265,85S265,335,365,385S365,185,465,185"
                    />

                    <circle r="4" transform="translate(480,200)" />
                    <circle r="4" transform="translate(580,400)" />
                    <circle r="4" transform="translate(680,100)" />
                    <circle r="4" transform="translate(780,300)" />
                    <circle r="4" transform="translate(180,300)" />
                    <circle r="4" transform="translate(280,100)" />
                    <circle r="4" transform="translate(380,400)" />
                    <circle
                        r="13"
                        transform={`translate(${this.state.dot.x},${
                            this.state.dot.y
                        })`}
                    />
                </svg>
            </div>
        );
    }
}

const rootElement = document.getElementById('root');
ReactDOM.render(<App />, rootElement);
