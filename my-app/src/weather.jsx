import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';


const KANTO_AREAS = [
  { name: '東京', code: '130000' },
  { name: '神奈川', code: '140000' },
  { name: '千葉', code: '120000' },
  { name: '埼玉', code: '110000' },
  { name: '茨城', code: '080000' },
  { name: '栃木', code: '090000' },
  { name: '群馬', code: '100000' },
];

function Weather() {
  const [currentAreaIndex, setCurrentAreaIndex] = useState(0);
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  const currentArea = KANTO_AREAS[currentAreaIndex];

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      try {
        setLoading(true);
        setShowDetail(false);
        const res = await fetch(`https://www.jma.go.jp/bosai/forecast/data/forecast/${currentArea.code}.json`);
        if (!res.ok) throw new Error('通信エラー');
        const data = await res.json();
        if (mounted) setWeatherData(data);
      } catch (err) {
        if (mounted) setError(err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchData();
    return () => { mounted = false; };
  }, [currentArea.code]);

  const getTempData = () => {
    try {
      if (!weatherData || !weatherData[0].timeSeries[2]) return [];
      const timeSeries2 = weatherData[0].timeSeries[2];
      const areaData = timeSeries2.areas[0]; 
      const temps = areaData.temps;
      const times = timeSeries2.timeDefines;
      if (!temps || !times) return [];
      return times.map((time, i) => ({
        time: new Date(time).getHours() + "時",
        temp: parseInt(temps[i])
      })).filter(item => !isNaN(item.temp)).slice(0, 8);
    } catch { return []; }
  };

  const nextArea = () => setCurrentAreaIndex((prev) => (prev + 1) % KANTO_AREAS.length);
  const prevArea = () => setCurrentAreaIndex((prev) => (prev - 1 + KANTO_AREAS.length) % KANTO_AREAS.length);

  
  const getWeatherIcon = (text) => {
    if (text.includes('雪')) return '❄️';

   
    if (text.includes('雨')) {
      
      if (text.includes('晴')) return '🌦️'; 
      if (text.includes('曇') || text.includes('くもり')) return '🌧️'; 
      return '☔';
    }

    if (text.includes('晴') && (text.includes('曇') || text.includes('くもり'))) {
      return '🌤️';
    }

    if (text.includes('晴')) return '☀️';
    if (text.includes('曇') || text.includes('くもり')) return '☁️';
    
    return '✨';
  };

  const getWeatherClass = (text) => {
    if (text.includes('雪')) return 'status-snow';
    if (text.includes('雨')) return 'status-rain';
    if (text.includes('晴')) return 'status-sun';
    return 'status-cloud';
  };

  if (error) return <div className="error">エラー: {error.message}</div>;

  const chartData = getTempData();

  return (
    <div className="weather-container">
      <header className="weather-header">
        <button className="nav-button" onClick={prevArea}>◀</button>
        <h2 className="weather-title">{currentArea.name}の天気</h2>
        <button className="nav-button" onClick={nextArea}>▶</button>
      </header>

      {loading ? (
        <div className="loading">読み込み中...</div>
      ) : (
        <div className="card-container">
          {weatherData[0].timeSeries[0].areas[0].weathers.slice(0, 3).map((weather, index) => (
            <React.Fragment key={index}>
              <div 
                className={`weather-card ${getWeatherClass(weather)} ${index === 0 ? 'clickable' : ''}`}
                onClick={() => index === 0 && setShowDetail(!showDetail)}
              >
                <div className="day-badge">{['今日', '明日', '明後日'][index]}</div>
                <div className="weather-icon">{getWeatherIcon(weather)}</div>
                <p className="weather-text">{weather}</p>
                {index === 0 && (
                  <span className="tap-hint">{showDetail ? '閉じる' : '気温'}</span>
                )}
              </div>

              {index === 0 && showDetail && (
                <div className="detail-chart-container">
                  <h3 style={{fontSize: '1rem', marginBottom: '15px'}}>今日の気温推移</h3>
                  {chartData.length > 0 ? (
                    <div className="chart-area" style={{width: '100%', height: 250}}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                          <XAxis dataKey="time" tick={{fontSize: 12, fill: '#666'}} />
                          <YAxis unit="℃" tick={{fontSize: 12, fill: '#666'}} domain={['dataMin - 2', 'dataMax + 2']} />
                          <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
                          <Line 
                            type="monotone" 
                            dataKey="temp" 
                            stroke="#f59e0b" 
                            strokeWidth={4} 
                            dot={{ r: 5, fill: '#f59e0b', strokeWidth: 2, stroke: '#fff' }} 
                            activeDot={{ r: 8 }} 
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className="no-data">現在、時間ごとの気温データがありません</p>
                  )}
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      )}

      <div className="dot-indicator">
        {KANTO_AREAS.map((_, i) => (
          <span key={i} className={`dot ${i === currentAreaIndex ? 'active' : ''}`} />
        ))}
      </div>
    </div>
  );
}

export default Weather;