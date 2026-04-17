import { render, screen, waitFor } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import App from './App';
import axios from 'axios';

vi.mock('axios');

test('Отображает температуру из мок-данных', async () => {
    const mockWeather = {
        data: {
            city: { name: 'London' },
            list: [{
                main: { temp: 25 },
                weather: [{ icon: '01d', description: 'ясно', main: 'Clear' }],
                wind: { speed: 2 },
                dt_txt: '2026-04-17 12:00:00'
            }]
        }
    };

    const mockAir = {
        data: { list: [{ main: { aqi: 1 } }] }
    };

    (axios.get as any).mockImplementation((url: string) => {
        if (url.includes('direct')) return Promise.resolve({ data: [{ lat: 51, lon: 0 }] });
        if (url.includes('air_pollution')) return Promise.resolve(mockAir);
        return Promise.resolve(mockWeather);
    });

    render(<App />);

    await waitFor(() => {
        const tempElement = screen.queryByText(/25/);
        expect(tempElement).not.toBeNull();
    }, { timeout: 2000 });

    const cityElement = screen.getByText(/Новокузнецк/i);
    expect(cityElement).toBeDefined();
});