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

  it('keeps the Pineapple Expense carousel in numeric filename order', () => {
    expect(extrasData[0].media.map(item => item.imageUrl)).toEqual([
      'assets/images/extras/pineapple-expense-01.jpg',
      'assets/images/extras/pineapple-expense-02.jpg',
      'assets/images/extras/pineapple-expense-03.jpg',
      'assets/images/extras/pineapple-expense-04.jpg',
      'assets/images/extras/pineapple-expense-05.jpg',
    ]);
  });

  it('adds the supplied robotics video at its requested start time', () => {
    const roboticsMedia = extrasData[2].media;
    const roboticsVideo = roboticsMedia[2];

    expect(extrasData[0].media.length).toBeGreaterThan(1);
    expect(roboticsVideo?.youtubeId).toBe('XcQ8EndxcuM');
    expect(roboticsVideo?.youtubeStartSeconds).toBe(11016);
    expect(roboticsMedia.map(item => item.imageUrl ?? item.youtubeId)).toEqual([
      'assets/images/extras/mochi-competition-04.jpg',
      'assets/images/extras/mochi-competition-01.jpg',
      'XcQ8EndxcuM',
      'assets/images/extras/mochi-competition-02.jpg',
      'assets/images/extras/mochi-competition-03.jpg',
    ]);
  });
});
