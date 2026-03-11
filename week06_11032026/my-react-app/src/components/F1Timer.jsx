import { useState, useEffect } from "react";

function F1Timer() {
  const [time, setTime] = useState(0);
  const [running, setRunning] = useState(false);
  const [laps, setLaps] = useState([]);
  const [popup, setPopup] = useState(null);

  useEffect(() => {
    let interval;

    if (running) {
      interval = setInterval(() => {
        setTime(prev => prev + 10); // updates every 10ms
      }, 10);
    }

    return () => clearInterval(interval);
  }, [running]);

  const formatTime = (t) => {
    const ms = Math.floor((t % 1000) / 10);
    const sec = Math.floor((t / 1000) % 60);
    const min = Math.floor(t / 60000);

    return `${min.toString().padStart(2,"0")}:${sec
      .toString()
      .padStart(2,"0")}:${ms.toString().padStart(2,"0")}`;
  };

  const start = () => setRunning(true);
  const stop = () => setRunning(false);

  const reset = () => {
    setRunning(false);
    setTime(0);
    setLaps([]);
  };

  const addLap = () => {
    const lapTime = formatTime(time);

    setPopup(lapTime);

    setTimeout(() => {
      setPopup(null);
    }, 2000);

    setLaps(prev => [
      { lap: prev.length + 1, time: lapTime },
      ...prev
    ]);
  };

  return (
    <div className="race-container">

      <div className="car-track">
        <div className="car">🏎️</div>
      </div>

      <div className="timer-box">
        <h1 className="timer">{formatTime(time)}</h1>

        <div className="controls">
          <button className="start" onClick={start}>START</button>
          <button className="lap" onClick={addLap}>LAP</button>
          <button className="stop" onClick={stop}>STOP</button>
          <button className="reset" onClick={reset}>RESET</button>
        </div>
      </div>

      {popup && (
        <div className="lap-popup">
          🏁 LAP TIME {popup}
        </div>
      )}

      <div className="lap-board">
        <h2>Lap Times</h2>
        {laps.map(l => (
          <div key={l.lap} className="lap-row">
            <span>Lap {l.lap}</span>
            <span>{l.time}</span>
          </div>
        ))}
      </div>

    </div>
  );
}

export default F1Timer;