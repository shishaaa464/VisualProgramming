import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import mockData from './mocks/weatherMock.json';
import type { IForecastResponse, IAirPollution } from './types';
import WeatherIcon from './components/WeatherIcon';
import SearchBar from './components/SearchBar';
import './App.css';

const API_KEY = '66002e8c2ac257bbeeb4aa01d063820c';

const App: React.FC = () => {
  const [city, setCity] = useState('Новокузнецк');
  const [weather, setWeather] = useState<IForecastResponse | null>(null);
  const [air, setAir] = useState<IAirPollution | null>(null);

  const fetchData = useCallback(async () => {
    // setWeather(mockData as any); return; 
    try {
      const geoRes = await axios.get(
        `https://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${API_KEY}`
      );

      if (!geoRes.data || geoRes.data.length === 0) return;

      const { lat, lon } = geoRes.data[0];

      const [weatherRes, airRes] = await Promise.all([
        axios.get(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&lang=ru&appid=${API_KEY}`),
        axios.get(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`)
      ]);

      setWeather(weatherRes.data);
      setAir(airRes.data);

    } catch (err) {
      console.error("Ошибка запроса, используем локальные моки:", err);
      setWeather(mockData as any);
    }
  }, [city]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchData]);

  useEffect(() => {
    (window as any).searchCity = (cityName: string) => {
      setCity(cityName);
    };
  }, []);

  const current = weather?.list[0];
  const theme = current?.weather[0].main.toLowerCase() || 'default';

  return (
    <div className={`app-container ${theme}`}>
      <SearchBar onSearch={setCity} />

      {current && (
        <div className="weather-card">
          <h2 className="city-name">{city.charAt(0).toUpperCase() + city.slice(1)}</h2>

          <p className="date">
            {new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric' })}
          </p>

          <div className="main-info">
            <WeatherIcon iconId={current.weather[0].icon} size="large" />
            <h1 className="temp">{Math.round(current.main.temp)}°</h1>
            <p className="description">{current.weather[0].description}</p>
          </div>

          <div className="details-grid">
            <div className="detail-item">
              <span>💧 {current.main.humidity}%</span>
            </div>
            <div className="detail-item">
              <span>💨 {current.wind.speed} м/с</span>
            </div>
            <div className="detail-item">
              <span>🏭 AQI: {air?.list[0].main.aqi}</span>
            </div>
          </div>
        </div >
      )}

      <div className="forecast-row">
        {weather?.list.slice(1, 6).map((item, index) => (
          <div key={index} className="forecast-item">
            <p>{item.dt_txt.split(' ')[1].substring(0, 5)}</p>

            <WeatherIcon iconId={item.weather[0].icon} />

            <p style={{ fontWeight: 'bold' }}>{Math.round(item.main.temp)}°</p>
          </div>
        ))}
      </div>
    </div >
  );
};

export default App;