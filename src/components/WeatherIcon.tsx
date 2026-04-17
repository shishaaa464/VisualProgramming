import React from 'react';

interface Props {
    iconId: string;
    size?: 'small' | 'large';
}

const WeatherIcon: React.FC<Props> = ({ iconId, size = 'small' }) => {
    const url = `https://openweathermap.org/img/wn/${iconId}${size === 'large' ? '@4x' : '@2x'}.png`;
    return <img src={url} alt="weather" style={{ width: size === 'large' ? 120 : 50 }} />;
};

export default WeatherIcon;