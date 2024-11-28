import { FirebaseDatePipe } from './firebase-date.pipe';

describe('FirebaseDatePipe', () => {
  it('create an instance', () => {
    const pipe = new FirebaseDatePipe();
    expect(pipe).toBeTruthy();
  });
});
