import { extrasData } from './extras.data';

describe('extrasData', () => {
  it('defines the three launch topics in order', () => {
    expect(extrasData.map(topic => topic.id)).toEqual(['capstone', 'keyboard', 'robotics']);
  });

  it('links the keyboard topic to the supplied YouTube build video', () => {
    const keyboard = extrasData[1];
    expect(keyboard.externalUrl).toBe('https://www.youtube.com/watch?v=xph8DTsWbxM');
    expect(keyboard.media[0].youtubeId).toBe('xph8DTsWbxM');
  });

  it('keeps capstone and robotics media slots ready for supplied assets', () => {
    expect(extrasData[0].media.length).toBeGreaterThan(1);
    expect(extrasData[2].media.some(item => item.type === 'youtube')).toBe(true);
  });
});
