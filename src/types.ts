export interface IWeatherItem {
    dt: number;
    main: {
        temp: number;
        humidity: number;
        pressure: number;
    };
    weather: [{
        main: string;
        description: string;
        icon: string;
    }];
    wind: { speed: number };
    dt_txt: string;
}

export interface IForecastResponse {
    list: IWeatherItem[];
    city: { name: string };
}

export interface IAirPollution {
    list: [{ main: { aqi: number } }];
}